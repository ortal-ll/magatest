/**
 * Pure helpers for one-time access PIN + session tokens.
 */

import { randomBytes, randomInt, timingSafeEqual } from 'node:crypto';

export const CODE_TTL_MS = 60_000;
export const CODE_REDIS_TTL_SEC = 70;
export const SESSION_TTL_SEC = 60 * 60 * 24 * 30; // 30 days
export const SESSION_STORAGE_KEY = 'magatest-access-token';

export function getAdminPassword() {
  return process.env.ADMIN_PASSWORD || '';
}

export function isAdminPasswordConfigured() {
  return Boolean(getAdminPassword());
}

/** Constant-time password compare. */
export function verifyAdminPassword(provided) {
  const expected = getAdminPassword();
  if (!expected || typeof provided !== 'string') return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/** Six-digit numeric PIN as string (100000–999999). */
export function generateAccessCode() {
  return String(randomInt(100000, 1000000));
}

export function normalizeCode(raw) {
  if (typeof raw !== 'string' && typeof raw !== 'number') return '';
  return String(raw).replace(/\D/g, '').slice(0, 6);
}

export function isValidCodeFormat(code) {
  return /^\d{6}$/.test(code);
}

export function createCodePayload(now = Date.now()) {
  return {
    createdAt: now,
    expiresAt: now + CODE_TTL_MS,
  };
}

export function isCodeExpired(createdAt, now = Date.now()) {
  const t = Number(createdAt);
  if (!Number.isFinite(t)) return true;
  return now > t + CODE_TTL_MS;
}

export function generateSessionToken() {
  return randomBytes(32).toString('hex');
}

export function parseCodeRecord(raw) {
  if (raw == null) return null;
  if (typeof raw === 'number' || (/^\d+$/.test(String(raw)) && !String(raw).startsWith('{'))) {
    return { createdAt: Number(raw), used: false };
  }
  try {
    const obj = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!obj || typeof obj !== 'object') return null;
    return {
      createdAt: Number(obj.createdAt),
      used: Boolean(obj.used),
    };
  } catch {
    return null;
  }
}
