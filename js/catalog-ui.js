function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function renderTestList(container, tests) {
  if (!container) return;
  container.innerHTML = tests
    .map(
      (t) => `
    <li class="test-item">
      <div>
        <h4>${escapeHtml(t.title)}</h4>
        <p class="test-meta">${escapeHtml(t.topic)} · ${t.count} вопросов</p>
      </div>
      <a class="btn btn-primary" href="quiz.html?id=${encodeURIComponent(t.id)}">Начать</a>
    </li>`
    )
    .join('');
}

export async function loadCatalog() {
  const res = await fetch('data/catalog.json');
  if (!res.ok) throw new Error('Не удалось загрузить каталог тестов');
  return res.json();
}

export function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}
