/**
 * Access PIN entry page.
 */

import {
  redeemAccessCode,
  setStoredAccessToken,
  getStoredAccessToken,
  checkAccessSession,
} from './api.js';

const form = document.getElementById('accessForm');
const input = document.getElementById('accessCode');
const errorEl = document.getElementById('accessError');
const submitBtn = document.getElementById('accessSubmit');

function nextUrl() {
  const params = new URLSearchParams(window.location.search);
  const next = params.get('next') || 'index.html';
  // Prevent open redirect
  if (!/^[a-z0-9_.-]+\.html(\?.*)?$/i.test(next) && next !== 'index.html') {
    return 'index.html';
  }
  if (next.startsWith('access.html') || next.startsWith('admin.html')) {
    return 'index.html';
  }
  return next;
}

function showError(msg) {
  errorEl.textContent = msg;
  errorEl.hidden = false;
}

function clearError() {
  errorEl.hidden = true;
  errorEl.textContent = '';
}

// Already have session → skip gate
(async () => {
  const token = getStoredAccessToken();
  if (!token) return;
  try {
    const { ok } = await checkAccessSession(token);
    if (ok) window.location.replace(nextUrl());
  } catch {
    /* stay on page */
  }
})();

input?.addEventListener('input', () => {
  input.value = input.value.replace(/\D/g, '').slice(0, 6);
  clearError();
});

form?.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearError();
  const code = (input?.value || '').trim();
  if (!/^\d{6}$/.test(code)) {
    showError('Введите 6-значный код');
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = 'Проверка…';
  try {
    const data = await redeemAccessCode(code);
    if (!data?.token) throw new Error('Нет токена сессии');
    setStoredAccessToken(data.token);
    window.location.replace(nextUrl());
  } catch (err) {
    showError(err.message || 'Код не принят');
    submitBtn.disabled = false;
    submitBtn.textContent = 'Войти';
    input?.select();
  }
});

input?.focus();
