import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  shuffle,
  prepareQuiz,
  answerQuestion,
  computeScore,
  gradeLabel,
} from '../js/quiz-engine.js';

/** Deterministic RNG from a seed (mulberry32). */
function seededRandom(seed) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

const sampleQuestions = [
  {
    text: '2+2?',
    options: ['3', '4', '5', '6'],
    correct: 1,
    explanation: '2+2=4',
  },
  {
    text: 'Столица Казахстана?',
    options: ['Алматы', 'Астана', 'Шымкент'],
    correct: 1,
  },
  {
    text: 'LIFO — это?',
    options: ['Очередь', 'Стек', 'Массив'],
    correct: 1,
  },
];

describe('shuffle', () => {
  it('returns a new array of the same length', () => {
    const input = [1, 2, 3, 4, 5];
    const out = shuffle(input, seededRandom(42));
    assert.equal(out.length, input.length);
    assert.notEqual(out, input);
    assert.deepEqual([...out].sort(), [...input].sort());
  });

  it('is deterministic with a seeded RNG', () => {
    const a = shuffle([1, 2, 3, 4, 5], seededRandom(7));
    const b = shuffle([1, 2, 3, 4, 5], seededRandom(7));
    assert.deepEqual(a, b);
  });
});

describe('prepareQuiz', () => {
  it('shuffles questions and options while preserving correct answer', () => {
    const prepared = prepareQuiz(sampleQuestions, seededRandom(99));
    assert.equal(prepared.length, sampleQuestions.length);

    for (const q of prepared) {
      const correctOpts = q.options.filter((o) => o.isCorrect);
      assert.equal(correctOpts.length, 1);
      assert.equal(q.answered, false);
      assert.equal(q.selectedIndex, null);
    }
  });

  it('throws on empty questions', () => {
    assert.throws(() => prepareQuiz([]), /non-empty/);
  });

  it('throws on invalid correct index', () => {
    assert.throws(
      () =>
        prepareQuiz([{ text: 'x', options: ['a', 'b'], correct: 5 }], seededRandom(1)),
      /invalid correct/
    );
  });
  it('preserves diagramId through prepareQuiz', () => {
    const prepared = prepareQuiz(
      [
        {
          text: 'With figure',
          options: ['a', 'b'],
          correct: 0,
          diagramId: 'hash-probing-linear-quadratic',
        },
      ],
      seededRandom(1)
    );
    assert.equal(prepared[0].diagramId, 'hash-probing-linear-quadratic');
  });
});

describe('answerQuestion', () => {
  it('locks answer and reports correctness', () => {
    const prepared = prepareQuiz(sampleQuestions, seededRandom(1));
    const q = prepared[0];
    const correctIndex = q.options.findIndex((o) => o.isCorrect);
    const wrongIndex = q.options.findIndex((o) => !o.isCorrect);

    const wrong = answerQuestion(q, wrongIndex);
    assert.equal(wrong.isCorrect, false);
    assert.equal(wrong.correctIndex, correctIndex);
    assert.equal(q.answered, true);

    const again = answerQuestion(q, correctIndex);
    assert.equal(again.locked, true);
    assert.equal(q.selectedIndex, wrongIndex);
  });

  it('accepts a correct answer', () => {
    const prepared = prepareQuiz(sampleQuestions, seededRandom(2));
    const q = prepared[0];
    const correctIndex = q.options.findIndex((o) => o.isCorrect);
    const result = answerQuestion(q, correctIndex);
    assert.equal(result.isCorrect, true);
    assert.equal(q.isCorrect, true);
  });
});

describe('computeScore / gradeLabel', () => {
  it('computes score after answering all', () => {
    const prepared = prepareQuiz(sampleQuestions, seededRandom(3));
    for (const q of prepared) {
      const correctIndex = q.options.findIndex((o) => o.isCorrect);
      answerQuestion(q, correctIndex);
    }
    const score = computeScore(prepared);
    assert.equal(score.total, 3);
    assert.equal(score.correct, 3);
    assert.equal(score.percent, 100);
    assert.equal(gradeLabel(100), 'Отлично');
    assert.equal(gradeLabel(80), 'Хорошо');
    assert.equal(gradeLabel(65), 'Удовлетворительно');
    assert.equal(gradeLabel(40), 'Нужно повторить');
  });
});

describe('question banks integrity', async () => {
  const { readFileSync } = await import('fs');
  const { join, dirname } = await import('path');
  const { fileURLToPath } = await import('url');
  const root = join(dirname(fileURLToPath(import.meta.url)), '..');

  for (const file of ['algorithms.json', 'databases.json']) {
    it(`${file} has valid structure`, () => {
      const bank = JSON.parse(readFileSync(join(root, 'data', file), 'utf8'));
      assert.ok(bank.id);
      assert.ok(bank.title);
      assert.ok(Array.isArray(bank.questions));
      assert.ok(bank.questions.length > 0);

      for (const [i, q] of bank.questions.entries()) {
        assert.equal(typeof q.text, 'string', `q${i} text`);
        assert.ok(Array.isArray(q.options) && q.options.length >= 2, `q${i} options`);
        assert.ok(
          typeof q.correct === 'number' &&
            q.correct >= 0 &&
            q.correct < q.options.length,
          `q${i} correct`
        );
      }

      // Engine accepts the bank
      const prepared = prepareQuiz(bank.questions, seededRandom(11));
      assert.equal(prepared.length, bank.questions.length);
    });
  }

  it('catalog references existing files', () => {
    const catalog = JSON.parse(readFileSync(join(root, 'data', 'catalog.json'), 'utf8'));
    assert.equal(catalog.subjects[0].id, 'm094');
    assert.equal(catalog.subjects[0].title, 'Информационные технологии M094');
    for (const t of catalog.subjects[0].tests) {
      const bank = JSON.parse(readFileSync(join(root, 'data', t.file), 'utf8'));
      assert.equal(bank.id, t.id);
      assert.equal(bank.questions.length, t.count);
    }
  });
});
