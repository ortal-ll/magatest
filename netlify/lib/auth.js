/**
 * Access-session checks shared by Netlify Functions.
 */

import { redis, keys } from './redis.js';
import {
  isValidSessionToken,
  parseCookieHeader,
  ACCESS_COOKIE_NAME,
} from './access-shared.js';

export function getHeader(event, name) {
  const h = event.headers || {};
  const lower = name.toLowerCase();
  for (const [k, v] of Object.entries(h)) {
    if (k.toLowerCase() === lower) return v;
  }
  return '';
}

/** Token from X-Access-Token, body/query, or cookie. */
export function extractAccessToken(event, body = {}) {
  const headerToken = getHeader(event, 'x-access-token');
  if (isValidSessionToken(headerToken)) return headerToken;

  if (isValidSessionToken(body.token)) return body.token;

  const q = event.queryStringParameters?.token;
  if (isValidSessionToken(q)) return q;

  const cookies = parseCookieHeader(getHeader(event, 'cookie'));
  const cookieToken = cookies[ACCESS_COOKIE_NAME] || '';
  if (isValidSessionToken(cookieToken)) return cookieToken;

  return '';
}

export async function sessionExists(token) {
  if (!isValidSessionToken(token)) return false;
  const raw = await redis('GET', keys.accessSession(token));
  return Boolean(raw);
}

/**
 * Require a live Redis session. Throws err.code = 'FORBIDDEN'.
 * @returns {Promise<string>} token
 */
export async function requireAccess(event, body = {}) {
  const token = extractAccessToken(event, body);
  if (!token) {
    const err = new Error('Нужен код доступа');
    err.code = 'FORBIDDEN';
    throw err;
  }
  const ok = await sessionExists(token);
  if (!ok) {
    const err = new Error('Сессия доступа недействительна');
    err.code = 'FORBIDDEN';
    throw err;
  }
  return token;
}
