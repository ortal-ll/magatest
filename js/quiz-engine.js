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

/**
 * Prepare a question bank for a quiz session:
 * - shuffle question order
 * - shuffle options within each question
 * - keep track of which option is correct after shuffle
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
    if (
      typeof q.correct !== 'number' ||
      q.correct < 0 ||
      q.correct >= q.options.length
    ) {
      throw new Error(`Question ${originalIndex} has invalid correct index`);
    }

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
      isCorrect: i === q.correct,
    }));
    const shuffledOptions = shuffle(indexed, random);

    return {
      id: q.id ?? `q${originalIndex + 1}`,
      text: q.text,
      textKz: q.textKz ?? null,
      diagramId: q.diagramId ?? null,
      explanation: q.explanation ?? null,
      explanationKz: q.explanationKz ?? null,
      options: shuffledOptions,
      answered: false,
      selectedIndex: null,
      isCorrect: null,
    };
  });

  return shuffle(prepared, random);
}

/**
 * Record an answer for a prepared question.
 * Locks the choice and returns feedback.
 */
export function answerQuestion(question, optionIndex) {
  if (question.answered) {
    return {
      locked: true,
      isCorrect: question.isCorrect,
      selectedIndex: question.selectedIndex,
      correctIndex: question.options.findIndex((o) => o.isCorrect),
    };
  }

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
  question.isCorrect = isCorrect;

  return {
    locked: false,
    isCorrect,
    selectedIndex: optionIndex,
    correctIndex: question.options.findIndex((o) => o.isCorrect),
  };
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
