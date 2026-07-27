/**
 * SVG diagrams for quiz questions (trusted static markup).
 * Keys match question.diagramId in data/*.json
 */

/** Build hash probing diagram matching testcenter figure (cells 48..58). */
export function buildHashProbingDiagram() {
  const indices = [48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58];
  const vals = {
    48: 948,
    49: 408,
    52: 172,
    53: 833,
    54: 413,
    55: 532,
    56: 472,
    58: 358,
  };

  function tableSvg(idSuffix, arcs) {
    const rows = indices
      .map((idx, i) => {
        const y = 20 + i * 34;
        const val = vals[idx];
        return `
        <line x1="70" y1="${y + 34}" x2="140" y2="${y + 34}" stroke="#1a455c" stroke-width="1"/>
        <text x="58" y="${y + 22}" text-anchor="end" font-size="12" fill="#4a6678" font-family="Manrope,sans-serif">${idx}</text>
        ${
          val != null
            ? `<text x="105" y="${y + 22}" text-anchor="middle" font-size="13" fill="#0e2433" font-family="Manrope,sans-serif" font-weight="700">${val}</text>`
            : ''
        }`;
      })
      .join('');

    const arcPaths = arcs
      .map(
        ([y1, y2, bulge]) =>
          `<path d="M140,${y1} Q${140 + bulge},${(y1 + y2) / 2} 140,${y2}" fill="none" stroke="#1a455c" stroke-width="1.6" marker-end="url(#ah${idSuffix})"/>`
      )
      .join('');

    return `
    <svg viewBox="0 0 210 420" role="img">
      <defs>
        <marker id="ah${idSuffix}" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="#1a455c"/>
        </marker>
      </defs>
      <rect x="70" y="20" width="70" height="374" fill="#fff" stroke="#1a455c" stroke-width="2"/>
      ${rows}
      <text x="152" y="196" font-size="11" fill="#e07a3d" font-family="Manrope,sans-serif" font-weight="700">Начальная</text>
      <text x="152" y="210" font-size="11" fill="#e07a3d" font-family="Manrope,sans-serif" font-weight="700">проба</text>
      <line x1="150" y1="200" x2="142" y2="200" stroke="#e07a3d" stroke-width="1.5" marker-end="url(#ah${idSuffix})"/>
      ${arcPaths}
    </svg>`;
  }

  const mid = (i) => 20 + i * 34 + 17;
  const linearArcs = [
    [mid(4), mid(5), 28],
    [mid(5), mid(6), 28],
    [mid(6), mid(7), 28],
    [mid(7), mid(8), 28],
    [mid(8), mid(9), 28],
  ];
  const quadArcs = [
    [mid(4), mid(5), 28],
    [mid(5), mid(7), 40],
    [mid(7), mid(10), 48],
  ];

  return `
<figure class="q-diagram" aria-label="Разрешение коллизий в хеш-таблице">
  <div class="hash-probe-wrap">
    <div class="hash-probe-col">
      <div class="hash-probe-label">а</div>
      ${tableSvg('a', linearArcs)}
    </div>
    <div class="hash-probe-col">
      <div class="hash-probe-label">б</div>
      ${tableSvg('b', quadArcs)}
    </div>
  </div>
  <figcaption class="q-diagram-cap">а — шаг +1 (линейное); б — шаги +1, +2, +3 (квадратичное)</figcaption>
</figure>`;
}

export function getDiagramHtml(diagramId) {
  if (!diagramId) return '';
  if (diagramId === 'hash-probing-linear-quadratic') {
    return buildHashProbingDiagram();
  }
  return '';
}
