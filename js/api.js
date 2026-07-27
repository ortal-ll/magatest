/** Access / admin API helpers */

const API_BASE = '/api';
export const ACCESS_TOKEN_KEY = 'magatest-access-token';
export const ADMIN_PASSWORD_KEY = 'magatest-admin-password';

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
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
    return localStorage.getItem(ACCESS_TOKEN_KEY) || '';
  } catch {
    return '';
  }
}

export function setStoredAccessToken(token) {
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export function clearStoredAccessToken() {
  try {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
  } catch {
    /* ignore */
  }
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
