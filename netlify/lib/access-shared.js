/**
 * Edge-safe access helpers (no Node built-ins).
 * Used by Netlify Edge Functions and Node Functions.
 */

export const ACCESS_COOKIE_NAME = 'magatest-access';
export const SESSION_STORAGE_KEY = 'magatest-access-token';
export const SESSION_TTL_SEC = 60 * 60 * 24 * 90; // 3 months

export function parseCookieHeader(cookieHeader) {
  const out = {};
  if (!cookieHeader || typeof cookieHeader !== 'string') return out;
  for (const part of cookieHeader.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const val = part.slice(idx + 1).trim();
    if (!key) continue;
    try {
      out[key] = decodeURIComponent(val);
    } catch {
      out[key] = val;
    }
  }
  return out;
}

export function isValidSessionToken(token) {
  return typeof token === 'string' && /^[a-f0-9]{32,}$/i.test(token);
}

export function buildAccessCookie(token, { clear = false, secure = false } = {}) {
  const base = `${ACCESS_COOKIE_NAME}=`;
  const flags = ['Path=/', 'SameSite=Lax'];
  if (secure) flags.push('Secure');
  if (clear || !token) {
    return `${base}; Max-Age=0; ${flags.join('; ')}`;
  }
  return `${base}${encodeURIComponent(token)}; Max-Age=${SESSION_TTL_SEC}; ${flags.join('; ')}`;
}

export function isPublicAccessPath(pathname) {
  const path = pathname || '/';
  if (path.startsWith('/api/access')) return true;
  if (path.startsWith('/api/health')) return true;
  if (path.startsWith('/.netlify/')) return true;
  if (path.startsWith('/css/')) return true;
  if (path.startsWith('/js/')) return true;
  if (path === '/access.html' || path.endsWith('/access.html')) return true;
  if (path === '/admin.html' || path.endsWith('/admin.html')) return true;
  if (path === '/favicon.ico') return true;
  return false;
}

export function isProtectedAccessPath(pathname) {
  const path = pathname || '/';
  if (isPublicAccessPath(path)) return false;
  if (path === '/' || path === '') return true;
  if (path.endsWith('.html')) return true;
  if (path.startsWith('/data/')) return true;
  if (path.startsWith('/api/')) return true;
  return false;
}

export function accessSessionKey(token) {
  return `magatest:access:session:${token}`;
}
