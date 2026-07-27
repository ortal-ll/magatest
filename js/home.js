import './access-gate.js';
import { loadCatalog, renderTestList } from './catalog-ui.js';

async function init() {
  const list = document.getElementById('homeTestList');
  if (!list) return;

  try {
    const catalog = await loadCatalog();
    list.innerHTML = '';
    for (const subject of catalog.subjects) {
      const block = document.createElement('li');
      block.className = 'test-item test-item--subject';
      block.innerHTML = `
        <div style="width:100%">
          <h3 style="margin:0 0 0.75rem;font-size:1.05rem">
            <a href="subject.html?id=${encodeURIComponent(subject.id)}">${subject.title}</a>
          </h3>
          <ul class="test-list" id="home-${subject.id}"></ul>
        </div>`;
      list.appendChild(block);
      renderTestList(block.querySelector(`#home-${subject.id}`), subject.tests);
    }
  } catch (err) {
    list.innerHTML = `<li class="test-item"><p class="test-meta">${err.message}</p></li>`;
  }
}

init();
