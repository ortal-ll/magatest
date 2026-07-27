import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  getDiagramHtml,
  buildHashProbingDiagram,
  buildDcMotorMechanicalChars,
  buildParallelRlcSwitch,
  buildHighpassTFilter,
} from '../js/diagrams.js';

describe('diagrams', () => {
  it('builds hash probing SVG with both panels', () => {
    const html = buildHashProbingDiagram();
    assert.match(html, /hash-probe-wrap/);
    assert.match(html, />а</);
    assert.match(html, />б</);
    assert.match(html, /Начальная/);
    assert.match(html, /172/);
    assert.match(html, /<svg/);
  });

  it('builds DC motor mechanical characteristics', () => {
    const html = buildDcMotorMechanicalChars();
    assert.match(html, /n₀/);
    assert.match(html, /Mₙₒₘ/);
    assert.match(html, />1</);
    assert.match(html, />2</);
    assert.match(html, />3</);
    assert.match(html, />4</);
  });

  it('builds parallel RLC switch circuit', () => {
    const html = buildParallelRlcSwitch();
    assert.match(html, /0\.1 A/);
    assert.match(html, /t=0/);
    assert.match(html, />R</);
    assert.match(html, />L</);
    assert.match(html, />C</);
    assert.match(html, /i_L\(t\)/);
    assert.match(html, /1 мГн/);
  });

  it('builds high-pass T filter', () => {
    const html = buildHighpassTFilter();
    assert.match(html, /500 пФ/);
    assert.match(html, /50 мГн/);
  });

  it('resolves known diagramId', () => {
    assert.ok(getDiagramHtml('hash-probing-linear-quadratic').includes('svg'));
    assert.ok(getDiagramHtml('dc-motor-mechanical-chars').includes('svg'));
    assert.ok(getDiagramHtml('parallel-rlc-switch').includes('svg'));
    assert.ok(getDiagramHtml('highpass-t-filter').includes('svg'));
    assert.equal(getDiagramHtml('unknown'), '');
    assert.equal(getDiagramHtml(null), '');
  });
});
