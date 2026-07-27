/**
 * Access control API: one-time 6-digit PIN + browser/Redis sessions.
 *
 * POST { action: 'admin-login', password }
 * POST { action: 'create-code' } + header X-Admin-Password
 * POST { action: 'redeem', code }
 * GET  ?action=check  + header X-Access-Token
 * POST { action: 'check', token }
 */

import { json, handleOptions, parseBody } from '../lib/http.js';
import { redis, keys, isRedisConfigured } from '../lib/redis.js';
import {
  verifyAdminPassword,
  isAdminPasswordConfigured,
  generateAccessCode,
  normalizeCode,
  isValidCodeFormat,
  createCodePayload,
  isCodeExpired,
  generateSessionToken,
  parseCodeRecord,
  CODE_REDIS_TTL_SEC,
  SESSION_TTL_SEC,
  CODE_TTL_MS,
} from '../lib/access.js';

function header(event, name) {
  const h = event.headers || {};
  const lower = name.toLowerCase();
  for (const [k, v] of Object.entries(h)) {
    if (k.toLowerCase() === lower) return v;
  }
  return '';
}

function redisError(err) {
  if (err?.code === 'REDIS_CONFIG') {
    return json(503, { error: 'Redis не настроен' });
  }
  console.error('access redis', err);
  return json(502, { error: 'Ошибка хранилища' });
}

async function adminLogin(body) {
  if (!isAdminPasswordConfigured()) {
    return json(503, { error: 'ADMIN_PASSWORD не задан в environment' });
  }
  if (!verifyAdminPassword(body.password)) {
    return json(401, { error: 'Неверный пароль' });
  }
  return json(200, { ok: true });
}

async function createCode(event, body = {}) {
  if (!isAdminPasswordConfigured()) {
    return json(503, { error: 'ADMIN_PASSWORD не задан в environment' });
  }
  const password = header(event, 'x-admin-password') || body.password;
  if (!verifyAdminPassword(password)) {
    return json(401, { error: 'Неверный пароль администратора' });
  }
  if (!isRedisConfigured()) {
    return json(503, { error: 'Redis не настроен' });
  }

  const payload = createCodePayload();
  let code = '';
  for (let i = 0; i < 8; i++) {
    code = generateAccessCode();
    const existing = await redis('GET', keys.accessCode(code));
    if (existing == null) break;
    code = '';
  }
  if (!code) {
    return json(500, { error: 'Не удалось сгенерировать код' });
  }

  await redis(
    'SET',
    keys.accessCode(code),
    JSON.stringify({ createdAt: payload.createdAt, used: false }),
    'EX',
    String(CODE_REDIS_TTL_SEC)
  );

  return json(200, {
    code,
    expiresAt: payload.expiresAt,
    ttlMs: CODE_TTL_MS,
  });
}

async function redeemCode(body) {
  if (!isRedisConfigured()) {
    return json(503, { error: 'Redis не настроен' });
  }

  const code = normalizeCode(body.code);
  if (!isValidCodeFormat(code)) {
    return json(400, { error: 'Код должен состоять из 6 цифр' });
  }

  // Atomic take: first redeem wins
  let raw;
  try {
    raw = await redis('GETDEL', keys.accessCode(code));
  } catch {
    raw = await redis('GET', keys.accessCode(code));
    if (raw != null) await redis('DEL', keys.accessCode(code));
  }

  const record = parseCodeRecord(raw);
  if (!record) {
    return json(403, { error: 'Код недействителен или уже использован' });
  }
  if (record.used) {
    return json(403, { error: 'Код уже использован' });
  }
  if (isCodeExpired(record.createdAt)) {
    return json(403, { error: 'Срок действия кода истёк (1 минута)' });
  }

  const token = generateSessionToken();
  await redis(
    'SET',
    keys.accessSession(token),
    JSON.stringify({ createdAt: Date.now(), code }),
    'EX',
    String(SESSION_TTL_SEC)
  );

  try {
    await redis(
      'LPUSH',
      keys.accessUsedLog(),
      JSON.stringify({ code, usedAt: Date.now() })
    );
    await redis('LTRIM', keys.accessUsedLog(), '0', '99');
  } catch {
    /* optional log */
  }

  return json(200, {
    ok: true,
    token,
    expiresInSec: SESSION_TTL_SEC,
  });
}

async function checkSession(event, body = {}) {
  if (!isRedisConfigured()) {
    return json(503, { error: 'Redis не настроен' });
  }
  const token =
    body.token ||
    header(event, 'x-access-token') ||
    event.queryStringParameters?.token ||
    '';
  if (!token || typeof token !== 'string' || token.length < 16) {
    return json(200, { ok: false });
  }
  const raw = await redis('GET', keys.accessSession(token));
  return json(200, { ok: Boolean(raw) });
}

export async function handler(event) {
  try {
    if (event.httpMethod === 'OPTIONS') return handleOptions();

    if (event.httpMethod === 'GET') {
      const action = event.queryStringParameters?.action || 'check';
      if (action === 'check') return await checkSession(event);
      return json(400, { error: 'Неизвестное действие' });
    }

    if (event.httpMethod !== 'POST') {
      return json(405, { error: 'Метод не поддерживается' });
    }

    const body = parseBody(event);
    const action = body.action || event.queryStringParameters?.action;

    if (action === 'admin-login') return await adminLogin(body);
    if (action === 'create-code') return await createCode(event, body);
    if (action === 'redeem') return await redeemCode(body);
    if (action === 'check') return await checkSession(event, body);

    return json(400, { error: 'Неизвестное действие' });
  } catch (err) {
    if (err?.code === 'BAD_JSON') return json(400, { error: err.message });
    if (err?.code === 'REDIS_CONFIG' || err?.code === 'REDIS_HTTP' || err?.code === 'REDIS_CMD') {
      return redisError(err);
    }
    console.error('access handler', err);
    return json(500, { error: 'Внутренняя ошибка' });
  }
}
