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

/** DC motor mechanical characteristics n(M): 1 shunt, 2 series, 3–4 compound. */
export function buildDcMotorMechanicalChars() {
  return `
<figure class="q-diagram" aria-label="Механические характеристики двигателя постоянного тока">
  <svg viewBox="0 0 420 300" role="img" class="q-diagram-svg">
    <defs>
      <marker id="arrN" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
        <path d="M0,0 L6,3.5 L0,7 Z" fill="#1a455c"/>
      </marker>
      <marker id="arrM" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
        <path d="M0,0 L6,3.5 L0,7 Z" fill="#1a455c"/>
      </marker>
    </defs>
    <!-- axes -->
    <line x1="55" y1="250" x2="55" y2="28" stroke="#1a455c" stroke-width="1.8" marker-end="url(#arrN)"/>
    <line x1="55" y1="250" x2="390" y2="250" stroke="#1a455c" stroke-width="1.8" marker-end="url(#arrM)"/>
    <text x="42" y="24" font-size="15" fill="#1a455c" font-family="Manrope,sans-serif" font-weight="700">n</text>
    <text x="395" y="268" font-size="15" fill="#1a455c" font-family="Manrope,sans-serif" font-weight="700">M</text>

    <!-- n0 tick -->
    <line x1="50" y1="55" x2="60" y2="55" stroke="#1a455c" stroke-width="1.5"/>
    <text x="30" y="60" font-size="13" fill="#1a455c" font-family="Manrope,sans-serif">n₀</text>

    <!-- nominal dashed lines -->
    <line x1="55" y1="145" x2="230" y2="145" stroke="#1a455c" stroke-width="1.2" stroke-dasharray="5 4"/>
    <line x1="230" y1="250" x2="230" y2="145" stroke="#1a455c" stroke-width="1.2" stroke-dasharray="5 4"/>
    <text x="8" y="150" font-size="12" fill="#1a455c" font-family="Manrope,sans-serif">nₙₒₘ</text>
    <text x="210" y="272" font-size="12" fill="#1a455c" font-family="Manrope,sans-serif">Mₙₒₘ</text>

    <!-- curve 1: nearly flat (shunt/parallel) -->
    <path d="M55,55 L360,78" fill="none" stroke="#1a455c" stroke-width="2"/>
    <text x="365" y="72" font-size="14" fill="#1a455c" font-family="Manrope,sans-serif" font-weight="700">1</text>

    <!-- curve 4: mild drop (compound) -->
    <path d="M55,55 Q200,95 340,155" fill="none" stroke="#1a455c" stroke-width="2"/>
    <text x="345" y="162" font-size="14" fill="#1a455c" font-family="Manrope,sans-serif" font-weight="700">4</text>

    <!-- curve 3: steeper compound -->
    <path d="M55,55 Q175,120 300,210" fill="none" stroke="#1a455c" stroke-width="2"/>
    <text x="305" y="220" font-size="14" fill="#1a455c" font-family="Manrope,sans-serif" font-weight="700">3</text>

    <!-- curve 2: hyperbolic series -->
    <path d="M55,55 Q95,170 120,250" fill="none" stroke="#1a455c" stroke-width="2"/>
    <text x="128" y="245" font-size="14" fill="#1a455c" font-family="Manrope,sans-serif" font-weight="700">2</text>
  </svg>
</figure>`;
}

/** Parallel RLC with DC current source and switch opening at t=0. */
export function buildParallelRlcSwitch() {
  return `
<figure class="q-diagram" aria-label="Параллельный контур RLC с источником тока">
  <svg viewBox="0 0 520 280" role="img" class="q-diagram-svg">
    <defs>
      <marker id="arrDown" markerWidth="7" markerHeight="7" refX="3.5" refY="6" orient="auto">
        <path d="M0,0 L3.5,7 L7,0 Z" fill="#1a455c"/>
      </marker>
    </defs>

    <!-- top / bottom rails -->
    <line x1="70" y1="55" x2="455" y2="55" stroke="#1a455c" stroke-width="2"/>
    <line x1="70" y1="220" x2="455" y2="220" stroke="#1a455c" stroke-width="2"/>

    <!-- current source 0.1 A -->
    <line x1="95" y1="55" x2="95" y2="109" stroke="#1a455c" stroke-width="2"/>
    <circle cx="95" cy="137.5" r="28" fill="#fff" stroke="#1a455c" stroke-width="2"/>
    <line x1="95" y1="155" x2="95" y2="125" stroke="#1a455c" stroke-width="2"/>
    <polygon points="95,118 89,132 101,132" fill="#1a455c"/>
    <line x1="95" y1="166" x2="95" y2="220" stroke="#1a455c" stroke-width="2"/>
    <text x="38" y="142" font-size="13" fill="#1a455c" font-family="Manrope,sans-serif" font-weight="700">0.1 A</text>

    <!-- switch t=0 (opening) -->
    <line x1="160" y1="55" x2="160" y2="100" stroke="#1a455c" stroke-width="2"/>
    <line x1="160" y1="100" x2="185" y2="125" stroke="#1a455c" stroke-width="2"/>
    <circle cx="160" cy="145" r="3.5" fill="#1a455c"/>
    <line x1="160" y1="145" x2="160" y2="220" stroke="#1a455c" stroke-width="2"/>
    <text x="168" y="98" font-size="13" fill="#1a455c" font-family="Manrope,sans-serif">t=0</text>

    <!-- resistor R -->
    <line x1="240" y1="55" x2="240" y2="85" stroke="#1a455c" stroke-width="2"/>
    <path d="M240,85 L252,95 L228,105 L252,115 L228,125 L252,135 L228,145 L240,155" fill="none" stroke="#1a455c" stroke-width="2"/>
    <line x1="240" y1="155" x2="240" y2="220" stroke="#1a455c" stroke-width="2"/>
    <text x="258" y="125" font-size="15" fill="#1a455c" font-family="Manrope,sans-serif" font-weight="700">R</text>

    <!-- inductor L + i_L(t) -->
    <line x1="320" y1="55" x2="320" y2="90" stroke="#1a455c" stroke-width="2"/>
    <path d="M320,90
      a10,10 0 0 1 0,20
      a10,10 0 0 1 0,20
      a10,10 0 0 1 0,20
      a10,10 0 0 1 0,20" fill="none" stroke="#1a455c" stroke-width="2"/>
    <line x1="320" y1="170" x2="320" y2="220" stroke="#1a455c" stroke-width="2"/>
    <text x="338" y="120" font-size="15" fill="#1a455c" font-family="Manrope,sans-serif" font-weight="700">L</text>
    <line x1="305" y1="95" x2="305" y2="165" stroke="#1a455c" stroke-width="1.5" marker-end="url(#arrDown)"/>
    <text x="268" y="185" font-size="13" fill="#1a455c" font-family="Manrope,sans-serif">i_L(t)</text>

    <!-- capacitor C -->
    <line x1="400" y1="55" x2="400" y2="120" stroke="#1a455c" stroke-width="2"/>
    <line x1="382" y1="120" x2="418" y2="120" stroke="#1a455c" stroke-width="2.5"/>
    <line x1="382" y1="132" x2="418" y2="132" stroke="#1a455c" stroke-width="2.5"/>
    <line x1="400" y1="132" x2="400" y2="220" stroke="#1a455c" stroke-width="2"/>
    <text x="425" y="130" font-size="15" fill="#1a455c" font-family="Manrope,sans-serif" font-weight="700">C</text>

    <!-- output terminals u(t) -->
    <circle cx="455" cy="55" r="4" fill="#fff" stroke="#1a455c" stroke-width="2"/>
    <circle cx="455" cy="220" r="4" fill="#fff" stroke="#1a455c" stroke-width="2"/>
    <text x="468" y="60" font-size="16" fill="#1a455c" font-family="Manrope,sans-serif" font-weight="700">+</text>
    <text x="470" y="226" font-size="18" fill="#1a455c" font-family="Manrope,sans-serif" font-weight="700">−</text>
    <text x="475" y="145" font-size="14" fill="#1a455c" font-family="Manrope,sans-serif">u(t)</text>

    <!-- values -->
    <text x="150" y="262" font-size="14" fill="#1a455c" font-family="Manrope,sans-serif">L = 1 мГн, C = 0.1 мкФ</text>
  </svg>
</figure>`;
}

/** T-equivalent circuit of an induction motor (referred to stator). */
export function buildInductionMotorTCircuit() {
  return `
<figure class="q-diagram" aria-label="Схема замещения асинхронного двигателя">
  <svg viewBox="0 0 680 260" role="img" class="q-diagram-svg">
    <defs>
      <marker id="arrIm" markerWidth="7" markerHeight="7" refX="3.5" refY="6" orient="auto">
        <path d="M0,0 L3.5,7 L7,0 Z" fill="#1a455c"/>
      </marker>
      <marker id="arrI1" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
        <path d="M0,0 L6,3.5 L0,7 Z" fill="#1a455c"/>
      </marker>
      <marker id="arrI2" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
        <path d="M0,0 L6,3.5 L0,7 Z" fill="#1a455c"/>
      </marker>
    </defs>

    <!-- left terminals -->
    <circle cx="24" cy="70" r="4.5" fill="#fff" stroke="#1a455c" stroke-width="2"/>
    <circle cx="24" cy="220" r="4.5" fill="#fff" stroke="#1a455c" stroke-width="2"/>
    <line x1="28.5" y1="70" x2="62" y2="70" stroke="#1a455c" stroke-width="2"/>
    <line x1="28.5" y1="220" x2="290" y2="220" stroke="#1a455c" stroke-width="2"/>

    <!-- I1 -->
    <line x1="50" y1="40" x2="130" y2="40" stroke="#1a455c" stroke-width="1.6" marker-end="url(#arrI1)"/>
    <text x="78" y="32" font-size="14" fill="#1a455c" font-family="Manrope,sans-serif" font-weight="700">I₁</text>

    <!-- r1 -->
    <path d="M62,70 L74,56 L86,84 L98,56 L110,84 L122,56 L134,70" fill="none" stroke="#1a455c" stroke-width="2"/>
    <text x="88" y="102" font-size="14" fill="#1a455c" font-family="Manrope,sans-serif" font-weight="700">r₁</text>
    <line x1="134" y1="70" x2="158" y2="70" stroke="#1a455c" stroke-width="2"/>

    <!-- X1 -->
    <path d="M158,70 a11,11 0 0 1 22,0 a11,11 0 0 1 22,0 a11,11 0 0 1 22,0 a11,11 0 0 1 22,0" fill="none" stroke="#1a455c" stroke-width="2"/>
    <text x="190" y="102" font-size="14" fill="#1a455c" font-family="Manrope,sans-serif" font-weight="700">X₁</text>
    <line x1="246" y1="70" x2="290" y2="70" stroke="#1a455c" stroke-width="2"/>

    <!-- magnetizing node + branch -->
    <circle cx="290" cy="70" r="3" fill="#1a455c"/>
    <line x1="290" y1="70" x2="290" y2="100" stroke="#1a455c" stroke-width="2"/>
    <line x1="268" y1="105" x2="268" y2="155" stroke="#1a455c" stroke-width="1.5" marker-end="url(#arrIm)"/>
    <text x="244" y="135" font-size="13" fill="#1a455c" font-family="Manrope,sans-serif" font-weight="700">Iₘ</text>

    <!-- rm -->
    <path d="M290,100 L278,112 L302,124 L278,136 L302,148 L290,160" fill="none" stroke="#1a455c" stroke-width="2"/>
    <text x="308" y="136" font-size="14" fill="#1a455c" font-family="Manrope,sans-serif" font-weight="700">rₘ</text>
    <line x1="290" y1="160" x2="290" y2="172" stroke="#1a455c" stroke-width="2"/>

    <!-- Xm -->
    <path d="M290,172 a10,10 0 0 1 0,20 a10,10 0 0 1 0,20 a10,10 0 0 1 0,20" fill="none" stroke="#1a455c" stroke-width="2"/>
    <text x="308" y="202" font-size="14" fill="#1a455c" font-family="Manrope,sans-serif" font-weight="700">Xₘ</text>
    <line x1="290" y1="232" x2="290" y2="220" stroke="#1a455c" stroke-width="2"/>
    <circle cx="290" cy="220" r="3" fill="#1a455c"/>

    <!-- continue top rail to rotor -->
    <line x1="290" y1="70" x2="340" y2="70" stroke="#1a455c" stroke-width="2"/>

    <!-- I'2 -->
    <line x1="350" y1="40" x2="480" y2="40" stroke="#1a455c" stroke-width="1.6" marker-end="url(#arrI2)"/>
    <text x="400" y="32" font-size="14" fill="#1a455c" font-family="Manrope,sans-serif" font-weight="700">I′₂</text>

    <!-- X'2 -->
    <path d="M340,70 a11,11 0 0 1 22,0 a11,11 0 0 1 22,0 a11,11 0 0 1 22,0 a11,11 0 0 1 22,0" fill="none" stroke="#1a455c" stroke-width="2"/>
    <text x="372" y="102" font-size="14" fill="#1a455c" font-family="Manrope,sans-serif" font-weight="700">X′₂</text>
    <line x1="428" y1="70" x2="450" y2="70" stroke="#1a455c" stroke-width="2"/>

    <!-- r'2 -->
    <path d="M450,70 L462,56 L474,84 L486,56 L498,84 L510,56 L522,70" fill="none" stroke="#1a455c" stroke-width="2"/>
    <text x="475" y="102" font-size="14" fill="#1a455c" font-family="Manrope,sans-serif" font-weight="700">r′₂</text>
    <line x1="522" y1="70" x2="545" y2="70" stroke="#1a455c" stroke-width="2"/>

    <!-- r'2 (1-s)/s -->
    <path d="M545,70 L557,56 L569,84 L581,56 L593,84 L605,56 L617,70" fill="none" stroke="#1a455c" stroke-width="2"/>
    <text x="545" y="102" font-size="13" fill="#1a455c" font-family="Manrope,sans-serif" font-weight="700">r′₂ (1−s)/s</text>

    <!-- right vertical to bottom -->
    <line x1="617" y1="70" x2="640" y2="70" stroke="#1a455c" stroke-width="2"/>
    <line x1="640" y1="70" x2="640" y2="220" stroke="#1a455c" stroke-width="2"/>
    <line x1="290" y1="220" x2="640" y2="220" stroke="#1a455c" stroke-width="2"/>
  </svg>
</figure>`;
}

/** High-pass T-section filter: two series 500 pF caps, shunt 50 mH. */
export function buildHighpassTFilter() {
  return `
<figure class="q-diagram" aria-label="Секция фильтра высоких частот">
  <svg viewBox="0 0 460 240" role="img" class="q-diagram-svg">
    <!-- top rail with two capacitors -->
    <circle cx="40" cy="70" r="5" fill="#fff" stroke="#1a455c" stroke-width="2"/>
    <line x1="45" y1="70" x2="100" y2="70" stroke="#1a455c" stroke-width="2"/>
    <!-- C1 plates -->
    <line x1="100" y1="52" x2="100" y2="88" stroke="#1a455c" stroke-width="2.5"/>
    <line x1="112" y1="52" x2="112" y2="88" stroke="#1a455c" stroke-width="2.5"/>
    <text x="85" y="45" font-size="13" fill="#1a455c" font-family="Manrope,sans-serif">500 пФ</text>
    <line x1="112" y1="70" x2="220" y2="70" stroke="#1a455c" stroke-width="2"/>
    <!-- C2 plates -->
    <line x1="220" y1="52" x2="220" y2="88" stroke="#1a455c" stroke-width="2.5"/>
    <line x1="232" y1="52" x2="232" y2="88" stroke="#1a455c" stroke-width="2.5"/>
    <text x="210" y="45" font-size="13" fill="#1a455c" font-family="Manrope,sans-serif">500 пФ</text>
    <line x1="232" y1="70" x2="400" y2="70" stroke="#1a455c" stroke-width="2"/>
    <circle cx="405" cy="70" r="5" fill="#fff" stroke="#1a455c" stroke-width="2"/>

    <!-- midpoint down to inductor -->
    <line x1="172" y1="70" x2="172" y2="105" stroke="#1a455c" stroke-width="2"/>
    <!-- inductor coils -->
    <path d="M172,105
      a11,11 0 0 1 0,22
      a11,11 0 0 1 0,22
      a11,11 0 0 1 0,22
      a11,11 0 0 1 0,22" fill="none" stroke="#1a455c" stroke-width="2"/>
    <line x1="172" y1="193" x2="172" y2="200" stroke="#1a455c" stroke-width="2"/>
    <text x="198" y="155" font-size="14" fill="#1a455c" font-family="Manrope,sans-serif" font-weight="700">50 мГн</text>

    <!-- bottom rail -->
    <circle cx="40" cy="200" r="5" fill="#fff" stroke="#1a455c" stroke-width="2"/>
    <line x1="45" y1="200" x2="400" y2="200" stroke="#1a455c" stroke-width="2"/>
    <circle cx="405" cy="200" r="5" fill="#fff" stroke="#1a455c" stroke-width="2"/>
  </svg>
</figure>`;
}

/** Three sync-machine cross-sections: armature reaction Fa vs load type. */
export function buildSyncArmatureReactionFa() {
  function machine(ox, label, faAngleDeg) {
    const cx = ox + 95;
    const cy = 110;
    const R = 72;
    const rRotor = 34;
    // Fa tip
    const rad = (faAngleDeg * Math.PI) / 180;
    const faLen = 48;
    const fax = cx + faLen * Math.cos(rad);
    const fay = cy - faLen * Math.sin(rad);
    // slot ticks at 0,60,120,180,240,300 deg (from +x, CCW) — visual stator slots
    const slots = [0, 60, 120, 180, 240, 300]
      .map((deg) => {
        const a = (deg * Math.PI) / 180;
        const x1 = cx + (R - 8) * Math.cos(a);
        const y1 = cy - (R - 8) * Math.sin(a);
        const x2 = cx + (R + 2) * Math.cos(a);
        const y2 = cy - (R + 2) * Math.sin(a);
        return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#1a455c" stroke-width="2.2"/>`;
      })
      .join('');

    return `
    <g>
      <text x="${cx}" y="22" text-anchor="middle" font-size="16" fill="#1a455c" font-family="Manrope,sans-serif" font-weight="700">${label}</text>
      <!-- stator -->
      <circle cx="${cx}" cy="${cy}" r="${R}" fill="#fff" stroke="#1a455c" stroke-width="2"/>
      ${slots}
      <!-- rotor -->
      <circle cx="${cx}" cy="${cy}" r="${rRotor}" fill="#fff" stroke="#1a455c" stroke-width="1.8"/>
      <line x1="${cx}" y1="${cy - rRotor}" x2="${cx}" y2="${cy + rRotor}" stroke="#1a455c" stroke-width="1.2"/>
      <text x="${cx}" y="${cy - 12}" text-anchor="middle" font-size="13" fill="#1a455c" font-family="Manrope,sans-serif" font-weight="700">N</text>
      <text x="${cx}" y="${cy + 22}" text-anchor="middle" font-size="13" fill="#1a455c" font-family="Manrope,sans-serif" font-weight="700">S</text>
      <!-- d axis (vertical) -->
      <line x1="${cx}" y1="${cy + R + 8}" x2="${cx}" y2="${cy - R - 18}" stroke="#1a455c" stroke-width="1.3" stroke-dasharray="4 3"/>
      <text x="${cx + 8}" y="${cy - R - 20}" font-size="13" fill="#1a455c" font-family="Manrope,sans-serif">d</text>
      <!-- q axis (horizontal) -->
      <line x1="${cx - R - 8}" y1="${cy}" x2="${cx + R + 18}" y2="${cy}" stroke="#1a455c" stroke-width="1.3" stroke-dasharray="4 3"/>
      <text x="${cx + R + 20}" y="${cy - 6}" font-size="13" fill="#1a455c" font-family="Manrope,sans-serif">q</text>
      <!-- Φ_fmax up along d -->
      <line x1="${cx}" y1="${cy - 6}" x2="${cx}" y2="${cy - 58}" stroke="#1a455c" stroke-width="2" marker-end="url(#arrFa)"/>
      <text x="${cx - 52}" y="${cy - 38}" font-size="11" fill="#1a455c" font-family="Manrope,sans-serif">Φ_fmax</text>
      <!-- Fa -->
      <line x1="${cx}" y1="${cy}" x2="${fax}" y2="${fay}" stroke="#c45c26" stroke-width="2.4" marker-end="url(#arrFaOrange)"/>
      <text x="${fax + 6}" y="${fay + 4}" font-size="13" fill="#c45c26" font-family="Manrope,sans-serif" font-weight="700">Fₐ</text>
    </g>`;
  }

  // angles: 0° = +q (right), 90° = +d (up), -90°/270° = -d (down)
  // 1 active: Fa along +q → 0°
  // 2 active-inductive: between +q and -d → about -45° (down-right)
  // 3 inductive: Fa along -d → -90°
  return `
<figure class="q-diagram" aria-label="Реакция якоря синхронной машины">
  <svg viewBox="0 0 580 230" role="img" class="q-diagram-svg">
    <defs>
      <marker id="arrFa" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
        <path d="M0,0 L6,3.5 L0,7 Z" fill="#1a455c"/>
      </marker>
      <marker id="arrFaOrange" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
        <path d="M0,0 L6,3.5 L0,7 Z" fill="#c45c26"/>
      </marker>
    </defs>
    ${machine(0, '1', 0)}
    ${machine(195, '2', -50)}
    ${machine(390, '3', -90)}
  </svg>
</figure>`;
}

const DIAGRAMS = {
  'hash-probing-linear-quadratic': buildHashProbingDiagram,
  'dc-motor-mechanical-chars': buildDcMotorMechanicalChars,
  'parallel-rlc-switch': buildParallelRlcSwitch,
  'highpass-t-filter': buildHighpassTFilter,
  'induction-motor-t-circuit': buildInductionMotorTCircuit,
  'sync-armature-reaction-fa': buildSyncArmatureReactionFa,
};

export function getDiagramHtml(diagramId) {
  if (!diagramId) return '';
  const build = DIAGRAMS[diagramId];
  return build ? build() : '';
}
