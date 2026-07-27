import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  shuffle,
  prepareQuiz,
  answerQuestion,
  computeScore,
  gradeLabel,
  togglePendingSelection,
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

  it('keeps Kazakh fields and syncs optionsKz with shuffle', () => {
    const prepared = prepareQuiz(
      [
        {
          text: 'RU question',
          textKz: 'KZ question',
          options: ['один', 'два', 'три'],
          optionsKz: ['бір', 'екі', 'үш'],
          correct: 1,
          explanation: 'RU explain',
          explanationKz: 'KZ explain',
        },
      ],
      seededRandom(5)
    );
    const q = prepared[0];
    assert.equal(q.text, 'RU question');
    assert.equal(q.textKz, 'KZ question');
    assert.equal(q.explanationKz, 'KZ explain');
    assert.equal(q.options.length, 3);
    for (const opt of q.options) {
      if (opt.text === 'один') assert.equal(opt.textKz, 'бір');
      if (opt.text === 'два') {
        assert.equal(opt.textKz, 'екі');
        assert.equal(opt.isCorrect, true);
      }
      if (opt.text === 'три') assert.equal(opt.textKz, 'үш');
    }
  });

  it('supports multi-correct options', () => {
    const prepared = prepareQuiz(
      [
        {
          text: 'Pick two',
          options: ['a', 'b', 'c', 'd'],
          correct: [0, 2],
        },
      ],
      seededRandom(3)
    );
    const q = prepared[0];
    assert.equal(q.multi, true);
    assert.equal(q.options.filter((o) => o.isCorrect).length, 2);

    const correctIdx = q.options
      .map((o, i) => (o.isCorrect ? i : -1))
      .filter((i) => i >= 0);
    const wrong = answerQuestion(q, [correctIdx[0]]);
    assert.equal(wrong.isCorrect, false);

    const q2 = prepareQuiz(
      [{ text: 'Pick two', options: ['a', 'b', 'c', 'd'], correct: [0, 2] }],
      seededRandom(3)
    )[0];
    const idx = q2.options
      .map((o, i) => (o.isCorrect ? i : -1))
      .filter((i) => i >= 0);
    const ok = answerQuestion(q2, idx);
    assert.equal(ok.isCorrect, true);
  });

  it('toggles pending multi selection', () => {
    const q = prepareQuiz(
      [{ text: 'm', options: ['a', 'b', 'c'], correct: [0, 1] }],
      seededRandom(1)
    )[0];
    assert.deepEqual(togglePendingSelection(q, 0), [0]);
    assert.deepEqual(togglePendingSelection(q, 2), [0, 2]);
    assert.deepEqual(togglePendingSelection(q, 0), [2]);
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

  for (const file of [
    'algorithms.json',
    'databases.json',
    'electrical-machines.json',
    'toe.json',
  ]) {
    it(`${file} has valid structure`, () => {
      const bank = JSON.parse(readFileSync(join(root, 'data', file), 'utf8'));
      assert.ok(bank.id);
      assert.ok(bank.title);
      assert.ok(Array.isArray(bank.questions));
      assert.ok(bank.questions.length > 0);

      for (const [i, q] of bank.questions.entries()) {
        assert.equal(typeof q.text, 'string', `q${i} text`);
        assert.ok(Array.isArray(q.options) && q.options.length >= 2, `q${i} options`);
        const correctList = Array.isArray(q.correct) ? q.correct : [q.correct];
        assert.ok(correctList.length >= 1, `q${i} correct non-empty`);
        for (const c of correctList) {
          assert.ok(
            typeof c === 'number' && c >= 0 && c < q.options.length,
            `q${i} correct index ${c}`
          );
        }
        if (q.textKz != null) assert.equal(typeof q.textKz, 'string', `q${i} textKz`);
        if (q.optionsKz != null) {
          assert.ok(Array.isArray(q.optionsKz), `q${i} optionsKz array`);
          assert.equal(q.optionsKz.length, q.options.length, `q${i} optionsKz length`);
        }
        if (q.explanationKz != null) {
          assert.equal(typeof q.explanationKz, 'string', `q${i} explanationKz`);
        }
        // Full bilingual coverage required for all banks
        assert.equal(typeof q.textKz, 'string', `q${i} requires textKz`);
        assert.ok(
          Array.isArray(q.optionsKz) && q.optionsKz.length === q.options.length,
          `q${i} requires optionsKz`
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
    assert.equal(catalog.subjects[1].id, 'm099');
    assert.equal(catalog.subjects[0].title, 'Информационные технологии M094');
    assert.equal(catalog.subjects[1].title, 'Энергетика и электротехника M099');
    for (const subject of catalog.subjects) {
      for (const t of subject.tests) {
        const bank = JSON.parse(readFileSync(join(root, 'data', t.file), 'utf8'));
        assert.equal(bank.id, t.id);
        assert.equal(bank.questions.length, t.count);
        assert.equal(bank.subject, subject.id);
      }
    }
  });
});
