const { GoogleGenerativeAI } = require('@google/generative-ai');
const { getAiConflictConfig } = require('../config/env');

const DEFAULT_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

const toErrorMessage = (err) => {
  if (!err) return 'Unknown AI error';
  if (typeof err.message === 'string' && err.message.trim().length > 0) {
    return err.message;
  }
  return String(err);
};

const withTimeout = async (promise, timeoutMs) => {
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    return promise;
  }

  let timeoutHandle;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutHandle = setTimeout(() => {
      reject(new Error(`AI request timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timeoutHandle);
  }
};

const extractJsonCandidate = (rawText = '') => {
  const text = String(rawText || '').trim();
  if (!text) return '';

  const fencedMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fencedMatch?.[1]) {
    return fencedMatch[1].trim();
  }

  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start >= 0 && end > start) {
    return text.slice(start, end + 1).trim();
  }

  return text;
};

const parseJsonResponse = (rawText = '') => {
  const candidate = extractJsonCandidate(rawText);
  if (!candidate) {
    throw new Error('AI response did not contain JSON content');
  }
  return JSON.parse(candidate);
};

const callGeminiJson = async (prompt, { timeoutMs = 5000, temperature = 0.2 } = {}) => {
  const aiConfig = getAiConflictConfig();
  if (!aiConfig.available) {
    return {
      ok: false,
      reason: aiConfig.reason || 'ai_not_available',
      source: 'rules',
    };
  }

  try {
    const genAi = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAi.getGenerativeModel({
      model: DEFAULT_MODEL,
      generationConfig: {
        temperature,
        responseMimeType: 'application/json',
      },
    });

    const result = await withTimeout(model.generateContent(prompt), timeoutMs);
    const rawText = result?.response?.text ? result.response.text() : '';
    const parsed = parseJsonResponse(rawText);

    return {
      ok: true,
      data: parsed,
      source: 'gemini',
      rawText,
    };
  } catch (err) {
    return {
      ok: false,
      reason: toErrorMessage(err),
      source: 'rules',
    };
  }
};

module.exports = {
  callGeminiJson,
  parseJsonResponse,
};
