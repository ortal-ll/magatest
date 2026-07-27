import { json, handleOptions } from '../lib/http.js';
import { redis, isRedisConfigured } from '../lib/redis.js';

/**
 * GET /api/health — проверка Netlify Function + Upstash Redis
 */
export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return handleOptions();
  if (event.httpMethod !== 'GET') {
    return json(405, { ok: false, error: 'Method not allowed' });
  }

  const configured = isRedisConfigured();
  if (!configured) {
    return json(503, {
      ok: false,
      service: 'magatest',
      redis: 'not_configured',
      error: 'Задайте UPSTASH_REDIS_REST_URL и UPSTASH_REDIS_REST_TOKEN в Netlify',
    });
  }

  try {
    const pong = await redis('PING');
    return json(200, {
      ok: true,
      service: 'magatest',
      redis: pong === 'PONG' ? 'up' : pong,
      time: new Date().toISOString(),
    });
  } catch (err) {
    return json(502, {
      ok: false,
      service: 'magatest',
      redis: 'error',
      error: err.message,
    });
  }
}
