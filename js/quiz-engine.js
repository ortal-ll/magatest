/**
 * Quiz engine: shuffle, answer checking, scoring.
 * Pure functions — used by the UI and by unit tests.
 */

/** Fisher–Yates shuffle (returns a new array). */
export function shuffle(array, random = Math.random) {
  const result = array.slice();
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** Normalize correct to a sorted unique list of indices. */
export function normalizeCorrect(correct, optionsLength, originalIndex = 0) {
  const list = Array.isArray(correct) ? correct : [correct];
  if (list.length === 0) {
    throw new Error(`Question ${originalIndex} has empty correct set`);
  }
  const uniq = [...new Set(list)];
  for (const idx of uniq) {
    if (typeof idx !== 'number' || idx < 0 || idx >= optionsLength) {
      throw new Error(`Question ${originalIndex} has invalid correct index`);
    }
  }
  return uniq.sort((a, b) => a - b);
}

function sameIndexSet(a, b) {
  if (a.length !== b.length) return false;
  const sa = [...a].sort((x, y) => x - y);
  const sb = [...b].sort((x, y) => x - y);
  return sa.every((v, i) => v === sb[i]);
}

/**
 * Prepare a question bank for a quiz session:
 * - shuffle question order
 * - shuffle options within each question
 * - keep track of which option(s) are correct after shuffle
 * - supports single (`correct: 2`) and multi (`correct: [0, 2, 7]`)
 */
export function prepareQuiz(questions, random = Math.random) {
  if (!Array.isArray(questions) || questions.length === 0) {
    throw new Error('questions must be a non-empty array');
  }

  const prepared = questions.map((q, originalIndex) => {
    if (!q || typeof q.text !== 'string') {
      throw new Error(`Invalid question at index ${originalIndex}`);
    }
    if (!Array.isArray(q.options) || q.options.length < 2) {
      throw new Error(`Question ${originalIndex} needs at least 2 options`);
    }

    const correctSet = normalizeCorrect(q.correct, q.options.length, originalIndex);
    const multi = correctSet.length > 1;

    if (q.optionsKz != null) {
      if (!Array.isArray(q.optionsKz) || q.optionsKz.length !== q.options.length) {
        throw new Error(
          `Question ${originalIndex}: optionsKz must match options length`
        );
      }
    }

    const indexed = q.options.map((text, i) => ({
      text,
      textKz: q.optionsKz?.[i] ?? null,
      isCorrect: correctSet.includes(i),
    }));
    const shuffledOptions = shuffle(indexed, random);

    return {
      id: q.id ?? `q${originalIndex + 1}`,
      text: q.text,
      textKz: q.textKz ?? null,
      diagramId: q.diagramId ?? null,
      explanation: q.explanation ?? null,
      explanationKz: q.explanationKz ?? null,
      multi,
      options: shuffledOptions,
      answered: false,
      selectedIndex: null,
      selectedIndices: [],
      isCorrect: null,
    };
  });

  return shuffle(prepared, random);
}

/**
 * Record an answer for a prepared question.
 * Single: pass optionIndex (number).
 * Multi: pass optionIndices (number[]) — must match the full correct set.
 */
export function answerQuestion(question, optionIndexOrIndices) {
  if (question.answered) {
    return {
      locked: true,
      isCorrect: question.isCorrect,
      selectedIndex: question.selectedIndex,
      selectedIndices: question.selectedIndices,
      correctIndices: question.options
        .map((o, i) => (o.isCorrect ? i : -1))
        .filter((i) => i >= 0),
      correctIndex: question.options.findIndex((o) => o.isCorrect),
    };
  }

  const correctIndices = question.options
    .map((o, i) => (o.isCorrect ? i : -1))
    .filter((i) => i >= 0);

  if (question.multi) {
    const selected = Array.isArray(optionIndexOrIndices)
      ? optionIndexOrIndices
      : [optionIndexOrIndices];
    for (const idx of selected) {
      if (typeof idx !== 'number' || idx < 0 || idx >= question.options.length) {
        throw new Error('Invalid option index');
      }
    }
    const uniq = [...new Set(selected)];
    const isCorrect = sameIndexSet(uniq, correctIndices);
    question.answered = true;
    question.selectedIndices = uniq.sort((a, b) => a - b);
    question.selectedIndex = uniq[0] ?? null;
    question.isCorrect = isCorrect;
    return {
      locked: false,
      isCorrect,
      selectedIndex: question.selectedIndex,
      selectedIndices: question.selectedIndices,
      correctIndices,
      correctIndex: correctIndices[0] ?? -1,
    };
  }

  const optionIndex = Array.isArray(optionIndexOrIndices)
    ? optionIndexOrIndices[0]
    : optionIndexOrIndices;

  if (
    typeof optionIndex !== 'number' ||
    optionIndex < 0 ||
    optionIndex >= question.options.length
  ) {
    throw new Error('Invalid option index');
  }

  const isCorrect = question.options[optionIndex].isCorrect;
  question.answered = true;
  question.selectedIndex = optionIndex;
  question.selectedIndices = [optionIndex];
  question.isCorrect = isCorrect;

  return {
    locked: false,
    isCorrect,
    selectedIndex: optionIndex,
    selectedIndices: [optionIndex],
    correctIndices,
    correctIndex: question.options.findIndex((o) => o.isCorrect),
  };
}

/** Toggle a pending selection for a multi-answer question (before lock). */
export function togglePendingSelection(question, optionIndex) {
  if (question.answered || !question.multi) {
    throw new Error('togglePendingSelection only for unanswered multi questions');
  }
  if (
    typeof optionIndex !== 'number' ||
    optionIndex < 0 ||
    optionIndex >= question.options.length
  ) {
    throw new Error('Invalid option index');
  }
  const set = new Set(question.selectedIndices || []);
  if (set.has(optionIndex)) set.delete(optionIndex);
  else set.add(optionIndex);
  question.selectedIndices = [...set].sort((a, b) => a - b);
  return question.selectedIndices;
}

/** Compute final score from a list of prepared (answered) questions. */
export function computeScore(questions) {
  const total = questions.length;
  const answered = questions.filter((q) => q.answered).length;
  const correct = questions.filter((q) => q.isCorrect === true).length;
  const percent = total === 0 ? 0 : Math.round((correct / total) * 100);

  return { total, answered, correct, wrong: answered - correct, percent };
}

/** Grade label for a percentage score. */
export function gradeLabel(percent) {
  if (percent >= 90) return 'Отлично';
  if (percent >= 75) return 'Хорошо';
  if (percent >= 60) return 'Удовлетворительно';
  return 'Нужно повторить';
}
