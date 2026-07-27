import {
  prepareQuiz,
  answerQuestion,
  computeScore,
  gradeLabel,
} from './quiz-engine.js';
import { getQueryParam } from './catalog-ui.js';

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

const els = {
  loading: document.getElementById('quizLoading'),
  error: document.getElementById('quizError'),
  app: document.getElementById('quizApp'),
  results: document.getElementById('resultsPanel'),
  title: document.getElementById('quizTitle'),
  progressText: document.getElementById('progressText'),
  scoreLive: document.getElementById('scoreLive'),
  progressBar: document.getElementById('progressBar'),
  progressFill: document.getElementById('progressFill'),
  qNum: document.getElementById('qNum'),
  qText: document.getElementById('qText'),
  qOptions: document.getElementById('qOptions'),
  qExplanation: document.getElementById('qExplanation'),
  btnPrev: document.getElementById('btnPrev'),
  btnNext: document.getElementById('btnNext'),
  btnRetry: document.getElementById('btnRetry'),
  resultsPercent: document.getElementById('resultsPercent'),
  resultsGrade: document.getElementById('resultsGrade'),
  resultsSummary: document.getElementById('resultsSummary'),
  statCorrect: document.getElementById('statCorrect'),
  statWrong: document.getElementById('statWrong'),
  statTotal: document.getElementById('statTotal'),
  reviewList: document.getElementById('reviewList'),
};

let bank = null;
let questions = [];
let currentIndex = 0;

function showError(message) {
  els.loading?.classList.add('hidden');
  els.app?.classList.add('hidden');
  els.results?.classList.add('hidden');
  if (els.error) {
    els.error.textContent = message;
    els.error.classList.remove('hidden');
  }
}

function updateProgress() {
  const total = questions.length;
  const answered = questions.filter((q) => q.answered).length;
  const score = computeScore(questions);
  const pct = total === 0 ? 0 : Math.round(((currentIndex + 1) / total) * 100);

  if (els.progressText) {
    els.progressText.textContent = `Вопрос ${currentIndex + 1} из ${total}`;
  }
  if (els.scoreLive) {
    els.scoreLive.textContent = `Верно: ${score.correct} / ${answered}`;
  }
  if (els.progressFill) {
    els.progressFill.style.width = `${pct}%`;
  }
  if (els.progressBar) {
    els.progressBar.setAttribute('aria-valuenow', String(pct));
  }
}

function renderQuestion() {
  const q = questions[currentIndex];
  if (!q) return;

  els.qNum.textContent = `Вопрос ${currentIndex + 1}`;
  els.qText.textContent = q.text;
  els.qExplanation.classList.remove('show');
  els.qExplanation.textContent = '';

  els.qOptions.innerHTML = '';
  q.options.forEach((opt, i) => {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'option';
    btn.dataset.index = String(i);

    const letter = document.createElement('span');
    letter.className = 'option-letter';
    letter.textContent = LETTERS[i] || String(i + 1);

    const text = document.createElement('span');
    text.textContent = opt.text;

    btn.append(letter, text);

    if (q.answered) {
      btn.disabled = true;
      if (opt.isCorrect) btn.classList.add('correct');
      if (i === q.selectedIndex && !opt.isCorrect) btn.classList.add('wrong');
      if (i !== q.selectedIndex && !opt.isCorrect) btn.classList.add('dimmed');
    } else {
      btn.addEventListener('click', () => onSelect(i));
    }

    li.appendChild(btn);
    els.qOptions.appendChild(li);
  });

  if (q.answered && q.explanation) {
    els.qExplanation.textContent = q.explanation;
    els.qExplanation.classList.add('show');
  }

  els.btnPrev.disabled = currentIndex === 0;
  els.btnNext.disabled = !q.answered;
  els.btnNext.textContent =
    currentIndex === questions.length - 1 ? 'Результат' : 'Далее';

  updateProgress();
}

function onSelect(optionIndex) {
  const q = questions[currentIndex];
  const result = answerQuestion(q, optionIndex);

  const buttons = els.qOptions.querySelectorAll('.option');
  buttons.forEach((btn, i) => {
    btn.disabled = true;
    const isCorrectOpt = q.options[i].isCorrect;
    if (isCorrectOpt) btn.classList.add('correct');
    if (i === result.selectedIndex && !result.isCorrect) btn.classList.add('wrong');
    if (i !== result.selectedIndex && !isCorrectOpt) btn.classList.add('dimmed');
  });

  if (q.explanation) {
    els.qExplanation.textContent = q.explanation;
    els.qExplanation.classList.add('show');
  }

  els.btnNext.disabled = false;
  updateProgress();
}

function goNext() {
  const q = questions[currentIndex];
  if (!q?.answered) return;

  if (currentIndex >= questions.length - 1) {
    showResults();
    return;
  }
  currentIndex += 1;
  renderQuestion();
}

function goPrev() {
  if (currentIndex <= 0) return;
  currentIndex -= 1;
  renderQuestion();
}

function showResults() {
  const score = computeScore(questions);
  els.app.classList.add('hidden');
  els.results.classList.remove('hidden');

  els.resultsPercent.textContent = `${score.percent}%`;
  els.resultsGrade.textContent = gradeLabel(score.percent);
  els.resultsSummary.textContent = `Вы ответили верно на ${score.correct} из ${score.total} вопросов.`;
  els.statCorrect.textContent = String(score.correct);
  els.statWrong.textContent = String(score.wrong);
  els.statTotal.textContent = String(score.total);

  els.reviewList.innerHTML = questions
    .map((q, i) => {
      const ok = q.isCorrect;
      const selected = q.selectedIndex != null ? q.options[q.selectedIndex]?.text : '—';
      const correct = q.options.find((o) => o.isCorrect)?.text ?? '—';
      return `
        <li class="review-item ${ok ? 'ok' : 'bad'}">
          <div class="mark">${ok ? 'Верно' : 'Ошибка'} · ${i + 1}</div>
          <div><strong>${escapeText(q.text)}</strong></div>
          <div style="margin-top:0.35rem;color:var(--ink-muted)">
            Ваш ответ: ${escapeText(selected)}
            ${ok ? '' : `<br>Правильно: ${escapeText(correct)}`}
          </div>
        </li>`;
    })
    .join('');

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function escapeText(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function startQuiz() {
  questions = prepareQuiz(bank.questions);
  currentIndex = 0;
  els.results.classList.add('hidden');
  els.app.classList.remove('hidden');
  document.title = `${bank.title} — МагаТест`;
  els.title.textContent = bank.title;
  renderQuestion();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function init() {
  const id = getQueryParam('id');
  if (!id) {
    showError('Не указан идентификатор теста. Вернитесь к списку тестов.');
    return;
  }

  try {
    const res = await fetch(`data/${encodeURIComponent(id)}.json`);
    if (!res.ok) throw new Error('Тест не найден');
    bank = await res.json();
    if (!bank.questions?.length) throw new Error('В тесте нет вопросов');

    els.loading.classList.add('hidden');
    startQuiz();
  } catch (err) {
    showError(err.message || 'Ошибка загрузки теста');
  }
}

els.btnNext?.addEventListener('click', goNext);
els.btnPrev?.addEventListener('click', goPrev);
els.btnRetry?.addEventListener('click', startQuiz);

init();
