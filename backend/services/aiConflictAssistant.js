const { checkConflicts } = require('../utils/conflictChecker');
const { callGeminiJson } = require('./geminiService');

const VALID_RISK_LEVELS = new Set(['low', 'medium', 'high', 'critical']);
const VALID_RECOMMENDED_ACTIONS = new Set(['safe_to_submit', 'reschedule', 'manual_review']);

const toFiniteNumber = (value, fallback = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const normalizeConfidence = (value, fallback = 0.45) => {
  const numeric = toFiniteNumber(value, fallback);
  const scaled = numeric > 1 ? numeric / 100 : numeric;
  return clamp(Number(scaled.toFixed(2)), 0, 1);
};

const normalizeReasonList = (value, fallbackReasons = []) => {
  const reasons = Array.isArray(value) ? value : [];
  const clean = reasons
    .map((item) => String(item || '').trim())
    .filter(Boolean)
    .slice(0, 6);

  if (clean.length > 0) {
    return clean;
  }

  return fallbackReasons;
};

const normalizeSlots = (value, fallbackSuggestions = []) => {
  const slots = Array.isArray(value) ? value : [];
  if (slots.length === 0) {
    return fallbackSuggestions.map((slot, index) => ({
      ...slot,
      score: clamp(1 - (index * 0.1), 0.55, 0.99),
    }));
  }

  return slots
    .map((slot, index) => {
      if (!slot || typeof slot !== 'object') return null;
      const score = normalizeConfidence(slot.score, 0.8 - (index * 0.1));
      return {
        date: String(slot.date || fallbackSuggestions[index]?.date || '').trim(),
        startTime: String(slot.startTime || fallbackSuggestions[index]?.startTime || '').trim(),
        endTime: String(slot.endTime || fallbackSuggestions[index]?.endTime || '').trim(),
        label: String(slot.label || fallbackSuggestions[index]?.label || 'Suggested slot').trim(),
        score,
      };
    })
    .filter((slot) => slot && slot.startTime && slot.endTime)
    .slice(0, 5);
};

const buildFallbackConflictAssistance = ({ event, deterministic, fallbackReason }) => {
  const conflicts = Array.isArray(deterministic.conflicts) ? deterministic.conflicts : [];
  const blockingConflicts = Array.isArray(deterministic.blockingConflicts)
    ? deterministic.blockingConflicts
    : [];
  const suggestions = Array.isArray(deterministic.suggestions) ? deterministic.suggestions : [];

  let riskLevel = 'low';
  let recommendedAction = 'safe_to_submit';

  if (deterministic.blocked) {
    riskLevel = 'critical';
    recommendedAction = 'reschedule';
  } else if (conflicts.length >= 3) {
    riskLevel = 'high';
    recommendedAction = 'manual_review';
  } else if (conflicts.length > 0) {
    riskLevel = 'medium';
    recommendedAction = 'manual_review';
  }

  const summary = deterministic.blocked
    ? 'This slot is blocked by higher-priority schedules and should be moved.'
    : conflicts.length > 0
      ? 'Conflicts exist for this slot. Admin review is recommended before submission.'
      : 'No deterministic conflicts detected for this proposed schedule.';

  const fallbackReasons = deterministic.blocked
    ? [`${blockingConflicts.length || conflicts.length} blocking conflict(s) detected by policy rules.`]
    : conflicts.length > 0
      ? conflicts.slice(0, 3).map((item) => item.message || 'Schedule overlap detected by policy rules.')
      : ['No overlap found with approved events or academic schedules.'];

  return {
    blocked: Boolean(deterministic.blocked),
    riskLevel,
    summary,
    why: fallbackReasons,
    recommendedAction,
    recommendedSlots: normalizeSlots([], suggestions),
    confidence: 0.45,
    source: 'rules',
    fallbackReason: fallbackReason || null,
    event: {
      title: event.title || 'Untitled event',
      date: event.date,
      startTime: event.startTime,
      endTime: event.endTime,
      type: event.type || 'event',
    },
  };
};

const buildConflictPrompt = ({ event, deterministic }) => {
  const context = {
    event: {
      title: event.title || '',
      type: event.type || 'event',
      department: event.department || '',
      date: event.date,
      startTime: event.startTime,
      endTime: event.endTime,
      venue: event.venue || '',
    },
    blocked: Boolean(deterministic.blocked),
    conflictCount: Array.isArray(deterministic.conflicts) ? deterministic.conflicts.length : 0,
    conflicts: (deterministic.conflicts || []).map((item) => ({
      source: item.source,
      type: item.type,
      title: item.title,
      priority: item.priority,
      isBlocking: Boolean(item.isBlocking),
      message: item.message,
    })),
    suggestions: (deterministic.suggestions || []).map((slot) => ({
      date: slot.date,
      startTime: slot.startTime,
      endTime: slot.endTime,
      label: slot.label,
    })),
  };

  return [
    'You are an academic schedule conflict assistant.',
    'Rule engine is authoritative. Never override blocked conflicts.',
    'Return valid JSON only with this exact schema:',
    '{',
    '  "riskLevel": "low|medium|high|critical",',
    '  "summary": "one line summary",',
    '  "why": ["reason 1", "reason 2"],',
    '  "recommendedAction": "safe_to_submit|reschedule|manual_review",',
    '  "recommendedSlots": [',
    '    { "date": "Mon DD, YYYY", "startTime": "HH:MM", "endTime": "HH:MM", "label": "string", "score": 0.0 }',
    '  ],',
    '  "confidence": 0.0',
    '}',
    'If blocked=true, recommendedAction must be "reschedule" or "manual_review".',
    'Confidence must be a number between 0 and 1.',
    `Context: ${JSON.stringify(context)}`,
  ].join('\n');
};

const resolveDeterministicState = async ({ event, providedState = {} }) => {
  const canReuse =
    Array.isArray(providedState.conflicts) &&
    Array.isArray(providedState.suggestions) &&
    typeof providedState.blocked === 'boolean';

  if (canReuse) {
    return {
      conflicts: providedState.conflicts,
      blockingConflicts: Array.isArray(providedState.blockingConflicts)
        ? providedState.blockingConflicts
        : providedState.conflicts.filter((item) => Boolean(item?.isBlocking)),
      suggestions: providedState.suggestions,
      hasConflict: typeof providedState.hasConflict === 'boolean'
        ? providedState.hasConflict
        : providedState.conflicts.length > 0,
      blocked: providedState.blocked,
    };
  }

  return checkConflicts({
    date: event.date,
    startTime: event.startTime,
    endTime: event.endTime,
    type: event.type || 'event',
  });
};

const normalizeConflictAssistance = ({ event, deterministic, aiData, aiFailedReason }) => {
  const fallback = buildFallbackConflictAssistance({
    event,
    deterministic,
    fallbackReason: aiFailedReason,
  });

  if (!aiData || typeof aiData !== 'object') {
    return fallback;
  }

  const aiRiskLevel = VALID_RISK_LEVELS.has(String(aiData.riskLevel || '').toLowerCase())
    ? String(aiData.riskLevel).toLowerCase()
    : fallback.riskLevel;

  let recommendedAction = VALID_RECOMMENDED_ACTIONS.has(String(aiData.recommendedAction || '').toLowerCase())
    ? String(aiData.recommendedAction).toLowerCase()
    : fallback.recommendedAction;

  const confidence = normalizeConfidence(aiData.confidence, fallback.confidence);

  if (confidence < 0.6 && recommendedAction === 'safe_to_submit') {
    recommendedAction = 'manual_review';
  }

  if (deterministic.blocked && recommendedAction === 'safe_to_submit') {
    recommendedAction = 'manual_review';
  }

  return {
    blocked: Boolean(deterministic.blocked),
    riskLevel: deterministic.blocked ? 'critical' : aiRiskLevel,
    summary: String(aiData.summary || fallback.summary).trim() || fallback.summary,
    why: normalizeReasonList(aiData.why, fallback.why),
    recommendedAction,
    recommendedSlots: normalizeSlots(aiData.recommendedSlots, deterministic.suggestions || []),
    confidence,
    source: 'ai',
    fallbackReason: null,
    event: fallback.event,
  };
};

const generateConflictAssistance = async ({
  event,
  providedState,
  aiConfig,
  timeoutMs = 5000,
}) => {
  const deterministic = await resolveDeterministicState({ event, providedState });

  if (!aiConfig?.available) {
    return buildFallbackConflictAssistance({
      event,
      deterministic,
      fallbackReason: aiConfig?.reason || 'disabled_by_config',
    });
  }

  const prompt = buildConflictPrompt({ event, deterministic });
  const aiResult = await callGeminiJson(prompt, { timeoutMs, temperature: 0.15 });

  if (!aiResult.ok) {
    return buildFallbackConflictAssistance({
      event,
      deterministic,
      fallbackReason: aiResult.reason || 'ai_call_failed',
    });
  }

  return normalizeConflictAssistance({
    event,
    deterministic,
    aiData: aiResult.data,
  });
};

module.exports = {
  generateConflictAssistance,
};
