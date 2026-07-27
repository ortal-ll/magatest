/** Access / admin API helpers */

const API_BASE = '/api';
export const ACCESS_TOKEN_KEY = 'magatest-access-token';
export const ACCESS_COOKIE_NAME = 'magatest-access';
export const ADMIN_PASSWORD_KEY = 'magatest-admin-password';
const SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 30;

function readCookie(name) {
  try {
    const match = document.cookie.match(
      new RegExp(`(?:^|; )${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}=([^;]*)`)
    );
    return match ? decodeURIComponent(match[1]) : '';
  } catch {
    return '';
  }
}

function writeCookie(name, value, maxAgeSec) {
  try {
    const secure = window.location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAgeSec}; SameSite=Lax${secure}`;
  } catch {
    /* ignore */
  }
}

function clearCookie(name) {
  writeCookie(name, '', 0);
}

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    credentials: 'same-origin',
    ...options,
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    const message = data?.error || `Ошибка API (${res.status})`;
    const err = new Error(message);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export function getStoredAccessToken() {
  try {
    const ls = localStorage.getItem(ACCESS_TOKEN_KEY) || '';
    if (ls) return ls;
  } catch {
    /* ignore */
  }
  return readCookie(ACCESS_COOKIE_NAME);
}

export function setStoredAccessToken(token) {
  try {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
  } catch {
    /* ignore */
  }
  writeCookie(ACCESS_COOKIE_NAME, token, SESSION_MAX_AGE_SEC);
}

export function clearStoredAccessToken() {
  try {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
  } catch {
    /* ignore */
  }
  clearCookie(ACCESS_COOKIE_NAME);
}

export function adminLogin(password) {
  return request('/access', {
    method: 'POST',
    body: JSON.stringify({ action: 'admin-login', password }),
  });
}

export function createAccessCode(password) {
  return request('/access', {
    method: 'POST',
    headers: { 'X-Admin-Password': password },
    body: JSON.stringify({ action: 'create-code' }),
  });
}

export function redeemAccessCode(code) {
  return request('/access', {
    method: 'POST',
    body: JSON.stringify({ action: 'redeem', code }),
  });
}

export function checkAccessSession(token = getStoredAccessToken()) {
  if (!token) return Promise.resolve({ ok: false });
  return request(`/access?action=check`, {
    method: 'GET',
    headers: { 'X-Access-Token': token },
  });
}

export function saveResult(payload) {
  return request('/results', {
    method: 'POST',
    headers: { 'X-Access-Token': getStoredAccessToken() },
    body: JSON.stringify(payload),
  });
}

export function fetchResults({ testId, mode = 'recent', limit = 10 } = {}) {
  const params = new URLSearchParams();
  if (testId) params.set('testId', testId);
  params.set('mode', mode);
  params.set('limit', String(limit));
  return request(`/results?${params.toString()}`, {
    headers: { 'X-Access-Token': getStoredAccessToken() },
  });
}

export function fetchStats() {
  return request('/stats', {
    headers: { 'X-Access-Token': getStoredAccessToken() },
  });
}

export function fetchHealth() {
  return request('/health');
}
