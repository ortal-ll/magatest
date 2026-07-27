import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  sanitizeName,
  clampInt,
  parseBody,
  json,
} from '../netlify/lib/http.js';
import { keys, isRedisConfigured } from '../netlify/lib/redis.js';

describe('http helpers', () => {
  it('sanitizeName strips tags and limits length', () => {
    assert.equal(sanitizeName('  Ortal  '), 'Ortal');
    assert.equal(sanitizeName('<script>x</script>'), 'scriptx/script');
    assert.equal(sanitizeName(''), 'Аноним');
    assert.equal(sanitizeName(null), 'Аноним');
    assert.equal(sanitizeName('a'.repeat(100)).length, 40);
  });

  it('clampInt bounds values', () => {
    assert.equal(clampInt(50, 0, 100, 0), 50);
    assert.equal(clampInt(-5, 0, 100, 0), 0);
    assert.equal(clampInt(200, 0, 100, 0), 100);
    assert.equal(clampInt('nope', 0, 100, 7), 7);
  });

  it('parseBody parses JSON event body', () => {
    assert.deepEqual(parseBody({ body: '{"a":1}' }), { a: 1 });
    assert.deepEqual(parseBody({}), {});
    assert.throws(() => parseBody({ body: '{bad' }), /JSON/);
  });

  it('json builds response shape', () => {
    const res = json(200, { ok: true });
    assert.equal(res.statusCode, 200);
    assert.equal(res.headers['Content-Type'], 'application/json; charset=utf-8');
    assert.deepEqual(JSON.parse(res.body), { ok: true });
  });
});

describe('redis helpers', () => {
  it('builds namespaced keys', () => {
    assert.equal(keys.result('abc'), 'magatest:result:abc');
    assert.equal(keys.leaderboard('algorithms'), 'magatest:lb:algorithms');
    assert.equal(keys.recentAll(), 'magatest:recent:all');
  });

  it('detects missing config', () => {
    const prevUrl = process.env.UPSTASH_REDIS_REST_URL;
    const prevToken = process.env.UPSTASH_REDIS_REST_TOKEN;
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    assert.equal(isRedisConfigured(), false);
    if (prevUrl) process.env.UPSTASH_REDIS_REST_URL = prevUrl;
    if (prevToken) process.env.UPSTASH_REDIS_REST_TOKEN = prevToken;
  });
});
