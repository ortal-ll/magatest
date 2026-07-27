/**
 * Minimal Upstash Redis REST client (no heavy deps).
 * Requires env: UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN
 */

function getConfig() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    const err = new Error(
      'Upstash Redis не настроен: задайте UPSTASH_REDIS_REST_URL и UPSTASH_REDIS_REST_TOKEN'
    );
    err.code = 'REDIS_CONFIG';
    throw err;
  }
  return { url: url.replace(/\/$/, ''), token };
}

/**
 * Execute a Redis command via Upstash REST.
 * @param  {...string|number} args Redis command parts, e.g. ('SET', 'key', 'value')
 */
export async function redis(...args) {
  const { url, token } = getConfig();
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(args.map(String)),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || `Upstash HTTP ${res.status}`);
    err.code = 'REDIS_HTTP';
    err.status = res.status;
    throw err;
  }
  if (data.error) {
    const err = new Error(data.error);
    err.code = 'REDIS_CMD';
    throw err;
  }
  return data.result;
}

export async function redisPipeline(commands) {
  const { url, token } = getConfig();
  const res = await fetch(`${url}/pipeline`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(commands.map((c) => c.map(String))),
  });

  const data = await res.json().catch(() => ([]));
  if (!res.ok) {
    const err = new Error(
      (Array.isArray(data) && data[0]?.error) || `Upstash pipeline HTTP ${res.status}`
    );
    err.code = 'REDIS_HTTP';
    throw err;
  }
  return data.map((row) => row.result);
}

export function isRedisConfigured() {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  );
}

/** Key helpers */
export const keys = {
  result: (id) => `magatest:result:${id}`,
  recent: (testId) => `magatest:recent:${testId}`,
  recentAll: () => 'magatest:recent:all',
  leaderboard: (testId) => `magatest:lb:${testId}`,
  attempts: (testId) => `magatest:attempts:${testId}`,
  attemptsTotal: () => 'magatest:attempts:total',
  accessCode: (code) => `magatest:access:code:${code}`,
  accessSession: (token) => `magatest:access:session:${token}`,
  accessUsedLog: () => 'magatest:access:used',
};
