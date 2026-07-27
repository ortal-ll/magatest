import { json, handleOptions } from '../lib/http.js';
import { redis, keys, isRedisConfigured } from '../lib/redis.js';

const TESTS = ['algorithms', 'databases'];

/**
 * GET /api/stats — агрегированная статистика по тестам из Redis
 */
export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return handleOptions();
  if (event.httpMethod !== 'GET') {
    return json(405, { ok: false, error: 'Method not allowed' });
  }

  if (!isRedisConfigured()) {
    return json(503, {
      ok: false,
      error: 'Redis не настроен',
    });
  }

  try {
    const total = Number((await redis('GET', keys.attemptsTotal())) || 0);
    const byTest = {};
    for (const id of TESTS) {
      byTest[id] = Number((await redis('GET', keys.attempts(id))) || 0);
    }
    return json(200, { ok: true, totalAttempts: total, byTest });
  } catch (err) {
    return json(502, { ok: false, error: err.message });
  }
}
