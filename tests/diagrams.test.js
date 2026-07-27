import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getDiagramHtml, buildHashProbingDiagram } from '../js/diagrams.js';

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

  it('resolves known diagramId', () => {
    const html = getDiagramHtml('hash-probing-linear-quadratic');
    assert.ok(html.includes('svg'));
    assert.equal(getDiagramHtml('unknown'), '');
    assert.equal(getDiagramHtml(null), '');
  });
});
