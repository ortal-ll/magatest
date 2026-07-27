import { loadCatalog, renderTestList } from './catalog-ui.js';

async function init() {
  const list = document.getElementById('homeTestList');
  if (!list) return;

  try {
    const catalog = await loadCatalog();
    const tests = catalog.subjects.flatMap((s) => s.tests);
    renderTestList(list, tests);
  } catch (err) {
    list.innerHTML = `<li class="test-item"><p class="test-meta">${err.message}</p></li>`;
  }
}

init();
