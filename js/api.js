/** API client for Netlify Functions + Upstash Redis backend */

const API_BASE = '/api';

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

export function saveResult(payload) {
  return request('/results', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function fetchResults({ testId, mode = 'recent', limit = 10 } = {}) {
  const params = new URLSearchParams();
  if (testId) params.set('testId', testId);
  params.set('mode', mode);
  params.set('limit', String(limit));
  return request(`/results?${params.toString()}`);
}

export function fetchStats() {
  return request('/stats');
}

export function fetchHealth() {
  return request('/health');
}
