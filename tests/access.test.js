import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  generateAccessCode,
  normalizeCode,
  isValidCodeFormat,
  createCodePayload,
  isCodeExpired,
  parseCodeRecord,
  verifyAdminPassword,
  isValidSessionToken,
  parseCookieHeader,
  buildAccessCookie,
  isPublicAccessPath,
  isProtectedAccessPath,
  ACCESS_COOKIE_NAME,
  CODE_TTL_MS,
  SESSION_TTL_SEC,
} from '../netlify/lib/access.js';

describe('access helpers', () => {
  it('generates 6-digit codes', () => {
    for (let i = 0; i < 20; i++) {
      const code = generateAccessCode();
      assert.match(code, /^\d{6}$/);
      assert.ok(Number(code) >= 100000);
      assert.ok(Number(code) <= 999999);
    }
  });

  it('normalizes and validates codes', () => {
    assert.equal(normalizeCode('12 34-56'), '123456');
    assert.equal(normalizeCode('abc'), '');
    assert.equal(isValidCodeFormat('123456'), true);
    assert.equal(isValidCodeFormat('12345'), false);
    assert.equal(isValidCodeFormat('1234567'), false);
  });

  it('creates payload with 60s TTL', () => {
    const now = 1_700_000_000_000;
    const p = createCodePayload(now);
    assert.equal(p.createdAt, now);
    assert.equal(p.expiresAt, now + CODE_TTL_MS);
    assert.equal(CODE_TTL_MS, 60_000);
  });

  it('detects expiry after 60 seconds', () => {
    const createdAt = 1_000_000;
    assert.equal(isCodeExpired(createdAt, createdAt + 59_999), false);
    assert.equal(isCodeExpired(createdAt, createdAt + 60_001), true);
  });

  it('parses code records', () => {
    assert.deepEqual(parseCodeRecord('1700000000000'), {
      createdAt: 1700000000000,
      used: false,
    });
    assert.deepEqual(parseCodeRecord(JSON.stringify({ createdAt: 42, used: true })), {
      createdAt: 42,
      used: true,
    });
    assert.equal(parseCodeRecord(null), null);
  });

  it('verifies admin password when configured', () => {
    const prev = process.env.ADMIN_PASSWORD;
    process.env.ADMIN_PASSWORD = 'secret-pass';
    assert.equal(verifyAdminPassword('secret-pass'), true);
    assert.equal(verifyAdminPassword('wrong'), false);
    assert.equal(verifyAdminPassword(''), false);
    if (prev == null) delete process.env.ADMIN_PASSWORD;
    else process.env.ADMIN_PASSWORD = prev;
  });

  it('session TTL is three months', () => {
    assert.equal(SESSION_TTL_SEC, 60 * 60 * 24 * 90);
  });

  it('validates session tokens and cookies', () => {
    assert.equal(isValidSessionToken('a'.repeat(64)), true);
    assert.equal(isValidSessionToken('short'), false);
    assert.equal(isValidSessionToken(''), false);
    const cookies = parseCookieHeader(`${ACCESS_COOKIE_NAME}=abc123; other=1`);
    assert.equal(cookies[ACCESS_COOKIE_NAME], 'abc123');
    assert.equal(cookies.other, '1');
    const set = buildAccessCookie('deadbeef'.repeat(8));
    assert.match(set, new RegExp(`^${ACCESS_COOKIE_NAME}=`));
    assert.match(set, /Max-Age=/);
    const cleared = buildAccessCookie('', { clear: true });
    assert.match(cleared, /Max-Age=0/);
  });

  it('classifies public vs protected paths', () => {
    assert.equal(isPublicAccessPath('/access.html'), true);
    assert.equal(isPublicAccessPath('/admin.html'), true);
    assert.equal(isPublicAccessPath('/api/access'), true);
    assert.equal(isPublicAccessPath('/css/styles.css'), true);
    assert.equal(isProtectedAccessPath('/'), true);
    assert.equal(isProtectedAccessPath('/index.html'), true);
    assert.equal(isProtectedAccessPath('/quiz.html'), true);
    assert.equal(isProtectedAccessPath('/data/catalog.json'), true);
    assert.equal(isProtectedAccessPath('/access.html'), false);
    assert.equal(isProtectedAccessPath('/js/home.js'), false);
  });
});
