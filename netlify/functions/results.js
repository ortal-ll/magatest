import { randomUUID } from 'crypto';
import {
  json,
  handleOptions,
  parseBody,
  sanitizeName,
  clampInt,
} from '../lib/http.js';
import { redis, redisPipeline, keys, isRedisConfigured } from '../lib/redis.js';

const ALLOWED_TESTS = new Set([
  'algorithms',
  'databases',
  // legacy ids (старые записи в Redis)
  'algorithms-screenshots',
  'algorithms-test1',
  'databases-test1',
]);

/**
 * POST /api/results — сохранить результат теста в Upstash Redis
 * GET  /api/results?testId=...&limit=10 — топ / недавние результаты
 */
export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return handleOptions();

  if (!isRedisConfigured()) {
    return json(503, {
      ok: false,
      error: 'Redis не настроен. Добавьте переменные Upstash в Netlify.',
    });
  }

  try {
    if (event.httpMethod === 'POST') return await saveResult(event);
    if (event.httpMethod === 'GET') return await listResults(event);
    return json(405, { ok: false, error: 'Method not allowed' });
  } catch (err) {
    const status =
      err.code === 'BAD_JSON' || err.code === 'VALIDATION' ? 400 : 502;
    return json(status, { ok: false, error: err.message });
  }
}

async function saveResult(event) {
  const body = parseBody(event);
  const testId = String(body.testId || '').trim();
  const title = String(body.title || testId).trim().slice(0, 120);
  const name = sanitizeName(body.name);
  const correct = clampInt(body.correct, 0, 500, -1);
  const total = clampInt(body.total, 1, 500, -1);
  const percent = clampInt(body.percent, 0, 100, -1);

  if (!ALLOWED_TESTS.has(testId)) {
    const err = new Error('Неизвестный testId');
    err.code = 'VALIDATION';
    throw err;
  }
  if (correct < 0 || total < 1 || percent < 0) {
    const err = new Error('Нужны поля correct, total, percent');
    err.code = 'VALIDATION';
    throw err;
  }
  if (correct > total) {
    const err = new Error('correct не может быть больше total');
    err.code = 'VALIDATION';
    throw err;
  }

  const id = randomUUID();
  const createdAt = new Date().toISOString();
  const record = {
    id,
    testId,
    title,
    name,
    correct,
    total,
    percent,
    createdAt,
  };

  // Score for sorted set: percent * 1e10 + timestamp — higher % ranks first,
  // newer results win ties.
  const score = percent * 1e10 + Date.now();

  await redisPipeline([
    ['SET', keys.result(id), JSON.stringify(record)],
    ['ZADD', keys.leaderboard(testId), String(score), id],
    ['LPUSH', keys.recent(testId), JSON.stringify(record)],
    ['LTRIM', keys.recent(testId), '0', '49'],
    ['LPUSH', keys.recentAll(), JSON.stringify(record)],
    ['LTRIM', keys.recentAll(), '0', '99'],
    ['INCR', keys.attempts(testId)],
    ['INCR', keys.attemptsTotal()],
  ]);

  return json(201, { ok: true, result: record });
}

async function listResults(event) {
  const params = event.queryStringParameters || {};
  const testId = (params.testId || '').trim();
  const mode = (params.mode || 'recent').trim(); // recent | top
  const limit = clampInt(params.limit, 1, 50, 10);

  if (testId && !ALLOWED_TESTS.has(testId)) {
    const err = new Error('Неизвестный testId');
    err.code = 'VALIDATION';
    throw err;
  }

  let results = [];

  if (mode === 'top' && testId) {
    const ids = await redis('ZREVRANGE', keys.leaderboard(testId), '0', String(limit - 1));
    if (Array.isArray(ids) && ids.length) {
      const rows = await redisPipeline(ids.map((id) => ['GET', keys.result(id)]));
      results = rows
        .map((raw) => {
          try {
            return raw ? JSON.parse(raw) : null;
          } catch {
            return null;
          }
        })
        .filter(Boolean);
    }
  } else {
    const listKey = testId ? keys.recent(testId) : keys.recentAll();
    const rawList = await redis('LRANGE', listKey, '0', String(limit - 1));
    results = (rawList || [])
      .map((raw) => {
        try {
          return JSON.parse(raw);
        } catch {
          return null;
        }
      })
      .filter(Boolean);
  }

  const attempts = testId
    ? Number((await redis('GET', keys.attempts(testId))) || 0)
    : Number((await redis('GET', keys.attemptsTotal())) || 0);

  return json(200, {
    ok: true,
    mode,
    testId: testId || null,
    attempts,
    results,
  });
}
