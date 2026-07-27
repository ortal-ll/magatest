/**
 * Admin panel: login with ADMIN_PASSWORD, mint one-time PINs (60s).
 */

import {
  adminLogin,
  createAccessCode,
  ADMIN_PASSWORD_KEY,
} from './api.js';

const loginSection = document.getElementById('adminLogin');
const panelSection = document.getElementById('adminPanel');
const loginForm = document.getElementById('adminLoginForm');
const passwordInput = document.getElementById('adminPassword');
const loginError = document.getElementById('adminLoginError');
const createBtn = document.getElementById('createCodeBtn');
const codeDisplay = document.getElementById('codeDisplay');
const codeValue = document.getElementById('codeValue');
const codeTimer = document.getElementById('codeTimer');
const createError = document.getElementById('createError');
const logoutBtn = document.getElementById('adminLogout');

let timerId = null;
let adminPassword = '';

function showLoginError(msg) {
  loginError.textContent = msg;
  loginError.hidden = false;
}

function showCreateError(msg) {
  createError.textContent = msg;
  createError.hidden = !msg;
}

function getSavedPassword() {
  try {
    return sessionStorage.getItem(ADMIN_PASSWORD_KEY) || '';
  } catch {
    return '';
  }
}

function savePassword(pw) {
  try {
    sessionStorage.setItem(ADMIN_PASSWORD_KEY, pw);
  } catch {
    /* ignore */
  }
}

function clearPassword() {
  try {
    sessionStorage.removeItem(ADMIN_PASSWORD_KEY);
  } catch {
    /* ignore */
  }
}

function enterPanel(password) {
  adminPassword = password;
  savePassword(password);
  loginSection.hidden = true;
  panelSection.hidden = false;
}

function leavePanel() {
  adminPassword = '';
  clearPassword();
  clearInterval(timerId);
  timerId = null;
  panelSection.hidden = true;
  loginSection.hidden = false;
  passwordInput.value = '';
}

function startCountdown(expiresAt) {
  clearInterval(timerId);
  const tick = () => {
    const left = Math.max(0, expiresAt - Date.now());
    const sec = Math.ceil(left / 1000);
    codeTimer.textContent =
      left > 0 ? `Действует ещё ${sec} с` : 'Код истёк — создайте новый';
    if (left <= 0) {
      clearInterval(timerId);
      codeDisplay.classList.add('is-expired');
    }
  };
  tick();
  timerId = setInterval(tick, 200);
}

// Auto-resume admin session in this tab
(async () => {
  const saved = getSavedPassword();
  if (!saved) return;
  try {
    await adminLogin(saved);
    enterPanel(saved);
  } catch {
    clearPassword();
  }
})();

loginForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginError.hidden = true;
  const password = passwordInput.value;
  loginForm.querySelector('button[type="submit"]').disabled = true;
  try {
    await adminLogin(password);
    enterPanel(password);
  } catch (err) {
    showLoginError(err.message || 'Ошибка входа');
  } finally {
    loginForm.querySelector('button[type="submit"]').disabled = false;
  }
});

createBtn?.addEventListener('click', async () => {
  showCreateError('');
  createBtn.disabled = true;
  createBtn.textContent = 'Создание…';
  try {
    const data = await createAccessCode(adminPassword);
    codeDisplay.hidden = false;
    codeDisplay.classList.remove('is-expired');
    codeValue.textContent = data.code;
    startCountdown(data.expiresAt);
  } catch (err) {
    showCreateError(err.message || 'Не удалось создать код');
  } finally {
    createBtn.disabled = false;
    createBtn.textContent = 'Создать код';
  }
});

logoutBtn?.addEventListener('click', () => {
  leavePanel();
});
