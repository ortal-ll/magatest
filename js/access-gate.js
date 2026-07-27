/**
 * Hard gate: without a valid access session, bounce to access.html.
 * Runs on index / subject / quiz. Skips access.html and admin.html.
 */

import {
  getStoredAccessToken,
  clearStoredAccessToken,
  checkAccessSession,
} from './api.js';

const PUBLIC_PAGES = new Set(['access.html', 'admin.html']);

function currentPage() {
  const path = window.location.pathname || '';
  const name = path.split('/').pop() || 'index.html';
  return name === '' || name === '/' ? 'index.html' : name;
}

function isPublicPage() {
  return PUBLIC_PAGES.has(currentPage());
}

function redirectToAccess() {
  const next = `${currentPage()}${window.location.search || ''}`;
  const url = `access.html?next=${encodeURIComponent(next)}`;
  window.location.replace(url);
}

export async function enforceAccessGate() {
  if (isPublicPage()) return true;

  document.documentElement.classList.add('access-pending');

  const token = getStoredAccessToken();
  if (!token) {
    redirectToAccess();
    return false;
  }

  try {
    const { ok } = await checkAccessSession(token);
    if (!ok) {
      clearStoredAccessToken();
      redirectToAccess();
      return false;
    }
    document.documentElement.classList.remove('access-pending');
    document.documentElement.classList.add('access-ok');
    return true;
  } catch {
    // Network / Redis blip: keep token but still block UI until confirmed
    clearStoredAccessToken();
    redirectToAccess();
    return false;
  }
}

const ok = await enforceAccessGate();
if (!ok) {
  // Stop further module side effects on this page by throwing
  throw new Error('ACCESS_REQUIRED');
}
