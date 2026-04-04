const { checkConflicts } = require('../utils/conflictChecker');
const { callGeminiJson } = require('./geminiService');

const VALID_DECISIONS = new Set(['approve', 'reject', 'reschedule', 'manual_review']);
const VALID_SEVERITIES = new Set(['low', 'medium', 'high', 'critical']);

const normalizeTextArray = (value, fallback = []) => {
  const list = Array.isArray(value) ? value : [];
  const cleaned = list.map((item) => String(item || '').trim()).filter(Boolean).slice(0, 8);
  return cleaned.length > 0 ? cleaned : fallback;
};

const normalizeSeverity = (value, fallback = 'medium') => {
  const normalized = String(value || '').toLowerCase();
  return VALID_SEVERITIES.has(normalized) ? normalized : fallback;
};

const normalizeDecision = (value, fallback = 'manual_review') => {
  const normalized = String(value || '').toLowerCase();
  return VALID_DECISIONS.has(normalized) ? normalized : fallback;
};

const normalizeSlot = (value, suggestions = []) => {
  if (value && typeof value === 'object' && value.startTime && value.endTime) {
    return {
      date: String(value.date || '').trim(),
      startTime: String(value.startTime || '').trim(),
      endTime: String(value.endTime || '').trim(),
      label: String(value.label || 'Recommended').trim(),
    };
  }

  const first = Array.isArray(suggestions) && suggestions.length > 0 ? suggestions[0] : null;
  if (!first) return null;

  return {
    date: first.date,
    startTime: first.startTime,
    endTime: first.endTime,
    label: first.label || 'Recommended',
  };
};

const buildFallbackAdminAssistance = ({ eventMeta, deterministic, policyFlags, fallbackReason }) => {
  const conflicts = Array.isArray(deterministic.conflicts) ? deterministic.conflicts : [];
  const blocked = Boolean(deterministic.blocked);
  const highPriorityOverlap = conflicts.some((item) => Number(item.priority || 1) >= 2);

  const decision = blocked ? 'reschedule' : conflicts.length > 0 ? 'manual_review' : 'approve';
  const severity = blocked ? 'critical' : highPriorityOverlap ? 'high' : conflicts.length > 0 ? 'medium' : 'low';

  const rationale = blocked
    ? ['Deterministic conflict rules report a blocking overlap.', 'Approval requires an explicit override note.']
    : conflicts.length > 0
      ? ['Non-blocking overlaps detected by deterministic checks.', 'Admin review is required before final decision.']
      : ['No deterministic overlap found for the current proposal.'];

  const requiresOverrideNote = blocked || Boolean(policyFlags?.requireOverrideForBlocking);
  const notePrefix = blocked ? 'Override requested: blocked conflict reviewed.' : 'Manual review completed.';

  const flags = [];
  if (blocked) flags.push('blocking_conflict');
  if (highPriorityOverlap) flags.push('high_priority_overlap');
  if (requiresOverrideNote) flags.push('requires_override_note');

  return {
    decision,
    severity,
    rationale,
    requiresOverrideNote,
    adminReviewNoteDraft: `${notePrefix} Event: ${eventMeta.title || 'Untitled'}.`,
    rejectionReasonDraft: blocked
      ? 'Rejected due to unresolved blocking schedule conflicts with higher-priority items.'
      : 'Rejected due to unresolved overlapping schedules and insufficient mitigation plan.',
    recommendedSlot: normalizeSlot(null, deterministic.suggestions || []),
    flags,
    source: 'rules',
    fallbackReason: fallbackReason || null,
  };
};

const buildAdminPrompt = ({ eventMeta, deterministic, policyFlags }) => {
  const context = {
    event: {
      title: eventMeta.title || '',
      type: eventMeta.type || 'event',
      department: eventMeta.department || '',
      date: eventMeta.date,
      startTime: eventMeta.startTime,
      endTime: eventMeta.endTime,
    },
    policyFlags: {
      allowBlockedOverride: Boolean(policyFlags?.allowBlockedOverride),
      requireOverrideForBlocking: Boolean(policyFlags?.requireOverrideForBlocking),
    },
    conflictDetail: {
      blocked: Boolean(deterministic.blocked),
      conflicts: (deterministic.conflicts || []).map((item) => ({
        priority: item.priority,
        type: item.type,
        source: item.source,
        isBlocking: Boolean(item.isBlocking),
        message: item.message,
      })),
      suggestions: (deterministic.suggestions || []).map((slot) => ({
        date: slot.date,
        startTime: slot.startTime,
        endTime: slot.endTime,
        label: slot.label,
      })),
    },
  };

  return [
    'You are an admin event decision assistant for an academic calendar.',
    'Return valid JSON only with this exact schema:',
    '{',
    '  "decision": "approve|reject|reschedule|manual_review",',
    '  "severity": "low|medium|high|critical",',
    '  "rationale": ["point 1", "point 2"],',
    '  "requiresOverrideNote": true,',
    '  "adminReviewNoteDraft": "string",',
    '  "rejectionReasonDraft": "string",',
    '  "recommendedSlot": { "date": "Mon DD, YYYY", "startTime": "HH:MM", "endTime": "HH:MM", "label": "string" },',
    '  "flags": ["blocking_conflict", "high_priority_overlap"]',
    '}',
    'If deterministic blocked=true, never return decision="approve" unless allowBlockedOverride=true and requiresOverrideNote=true.',
    `Context: ${JSON.stringify(context)}`,
  ].join('\n');
};

const resolveDeterministicForAdmin = async ({ eventMeta, conflictDetail = {} }) => {
  const canReuse =
    typeof conflictDetail.blocked === 'boolean' &&
    Array.isArray(conflictDetail.conflicts) &&
    Array.isArray(conflictDetail.suggestions);

  if (canReuse) {
    return {
      blocked: conflictDetail.blocked,
      conflicts: conflictDetail.conflicts,
      suggestions: conflictDetail.suggestions,
      blockingConflicts: Array.isArray(conflictDetail.blockingConflicts)
        ? conflictDetail.blockingConflicts
        : conflictDetail.conflicts.filter((item) => Boolean(item?.isBlocking)),
    };
  }

  return checkConflicts({
    date: eventMeta.date,
    startTime: eventMeta.startTime,
    endTime: eventMeta.endTime,
    type: eventMeta.type || 'event',
  });
};

const enforceGuardrails = ({ result, deterministic, policyFlags }) => {
  const safeResult = { ...result };
  const blocked = Boolean(deterministic.blocked);
  const allowBlockedOverride = Boolean(policyFlags?.allowBlockedOverride);

  if (blocked && safeResult.decision === 'approve') {
    safeResult.decision = allowBlockedOverride ? 'manual_review' : 'reschedule';
  }

  if (blocked) {
    safeResult.severity = 'critical';
    safeResult.requiresOverrideNote = true;
    if (!safeResult.flags.includes('blocking_conflict')) {
      safeResult.flags.push('blocking_conflict');
    }
  }

  return safeResult;
};

const normalizeAdminAssistance = ({ aiData, fallback, deterministic, policyFlags }) => {
  if (!aiData || typeof aiData !== 'object') {
    return fallback;
  }

  const result = {
    decision: normalizeDecision(aiData.decision, fallback.decision),
    severity: normalizeSeverity(aiData.severity, fallback.severity),
    rationale: normalizeTextArray(aiData.rationale, fallback.rationale),
    requiresOverrideNote: typeof aiData.requiresOverrideNote === 'boolean'
      ? aiData.requiresOverrideNote
      : fallback.requiresOverrideNote,
    adminReviewNoteDraft: String(aiData.adminReviewNoteDraft || fallback.adminReviewNoteDraft).trim() || fallback.adminReviewNoteDraft,
    rejectionReasonDraft: String(aiData.rejectionReasonDraft || fallback.rejectionReasonDraft).trim() || fallback.rejectionReasonDraft,
    recommendedSlot: normalizeSlot(aiData.recommendedSlot, deterministic.suggestions || []),
    flags: normalizeTextArray(aiData.flags, fallback.flags),
    source: 'ai',
    fallbackReason: null,
  };

  return enforceGuardrails({ result, deterministic, policyFlags });
};

const generateAdminAssistance = async ({
  eventMeta,
  conflictDetail,
  policyFlags,
  aiConfig,
  timeoutMs = 5000,
}) => {
  const deterministic = await resolveDeterministicForAdmin({ eventMeta, conflictDetail });

  if (!aiConfig?.available) {
    return buildFallbackAdminAssistance({
      eventMeta,
      deterministic,
      policyFlags,
      fallbackReason: aiConfig?.reason || 'disabled_by_config',
    });
  }

  const prompt = buildAdminPrompt({ eventMeta, deterministic, policyFlags });
  const aiResult = await callGeminiJson(prompt, { timeoutMs, temperature: 0.1 });

  const fallback = buildFallbackAdminAssistance({
    eventMeta,
    deterministic,
    policyFlags,
    fallbackReason: aiResult.ok ? null : aiResult.reason || 'ai_call_failed',
  });

  if (!aiResult.ok) {
    return fallback;
  }

  return normalizeAdminAssistance({
    aiData: aiResult.data,
    fallback,
    deterministic,
    policyFlags,
  });
};

module.exports = {
  generateAdminAssistance,
};
