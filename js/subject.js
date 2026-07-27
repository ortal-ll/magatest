import { getQueryParam, loadCatalog, renderTestList } from './catalog-ui.js';
import { fetchResults } from './api.js';

function escapeText(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleString('ru-RU', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

async function loadRecentResults() {
  const list = document.getElementById('subjectLeaderboard');
  const meta = document.getElementById('subjectLbMeta');
  if (!list) return;

  try {
    const data = await fetchResults({ mode: 'recent', limit: 12 });
    const results = data.results || [];
    if (meta) {
      meta.textContent =
        data.attempts > 0
          ? `Всего попыток: ${data.attempts}`
          : 'Пока нет попыток — пройдите тест и сохраните результат';
    }
    if (!results.length) {
      list.innerHTML =
        '<li class="leaderboard-empty">Результаты появятся после сохранения на Netlify + Upstash</li>';
      return;
    }
    list.innerHTML = results
      .map(
        (r) => `
      <li class="leaderboard-item">
        <span class="lb-rank">${escapeText(r.percent)}%</span>
        <span class="lb-name">${escapeText(r.name || 'Аноним')}</span>
        <span class="lb-score">${escapeText(r.title || r.testId || '')}</span>
        <span class="lb-meta">${r.correct}/${r.total} · ${formatDate(r.createdAt)}</span>
      </li>`
      )
      .join('');
  } catch {
    if (meta) {
      meta.textContent =
        'Рейтинг доступен после деплоя на Netlify с переменными Upstash';
    }
    list.innerHTML =
      '<li class="leaderboard-empty">API / Redis пока недоступны локально без netlify dev</li>';
  }
}

async function init() {
  const list = document.getElementById('subjectTestList');
  const loading = document.getElementById('subjectLoading');
  const errorBox = document.getElementById('subjectError');
  const titleEl = document.getElementById('subjectTitle');
  const descEl = document.getElementById('subjectDesc');

  const id = getQueryParam('id') || 'm094';

  try {
    const catalog = await loadCatalog();
    const subject = catalog.subjects.find((s) => s.id === id) || catalog.subjects[0];

    if (!subject) {
      throw new Error('Направление не найдено');
    }

    document.title = `${subject.title} — МагаТест`;
    if (titleEl) titleEl.textContent = subject.title;
    if (descEl) descEl.textContent = subject.description;

    renderTestList(list, subject.tests);
    loading?.classList.add('hidden');
  } catch (err) {
    loading?.classList.add('hidden');
    if (errorBox) {
      errorBox.textContent = err.message;
      errorBox.classList.remove('hidden');
    }
  }

  loadRecentResults();
}

init();
