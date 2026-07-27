import { getQueryParam, loadCatalog, renderTestList } from './catalog-ui.js';

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
}

init();
