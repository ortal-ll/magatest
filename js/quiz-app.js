import {
  prepareQuiz,
  answerQuestion,
  computeScore,
  gradeLabel,
  togglePendingSelection,
} from './quiz-engine.js';
import { getQueryParam } from './catalog-ui.js';
import { saveResult, fetchResults } from './api.js';
import { getDiagramHtml } from './diagrams.js';

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
/** Bump when question banks change so browsers/CDN refetch JSON. */
const DATA_VERSION = 'em-q9-13-14';

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
  qDiagram: document.getElementById('qDiagram'),
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
  saveScoreBox: document.getElementById('saveScoreBox'),
  saveScoreForm: document.getElementById('saveScoreForm'),
  playerName: document.getElementById('playerName'),
  btnSaveScore: document.getElementById('btnSaveScore'),
  saveStatus: document.getElementById('saveStatus'),
  leaderboardList: document.getElementById('leaderboardList'),
};

let bank = null;
let questions = [];
let currentIndex = 0;
let lastScore = null;
let scoreSaved = false;
/** @type {'ru' | 'kz'} */
let quizLang = 'ru';

const UI = {
  ru: {
    questionOf: (n, total) => `Вопрос ${n} из ${total}`,
    questionN: (n) => `Вопрос ${n}`,
    correctLive: (c, a) => `Верно: ${c} / ${a}`,
    next: 'Далее',
    result: 'Результат',
    check: 'Проверить',
    multiHint: 'Несколько ответов — отметьте все верные',
    back: 'Назад',
    ok: 'Верно',
    bad: 'Ошибка',
    yourAnswer: 'Ваш ответ',
    rightAnswer: 'Правильно',
    summary: (c, t) => `Вы ответили верно на ${c} из ${t} вопросов.`,
  },
  kz: {
    questionOf: (n, total) => `Сұрақ ${n} / ${total}`,
    questionN: (n) => `Сұрақ ${n}`,
    correctLive: (c, a) => `Дұрыс: ${c} / ${a}`,
    next: 'Келесі',
    result: 'Нәтиже',
    check: 'Тексеру',
    multiHint: 'Бірнеше жауап — барлық дұрысын белгілеңіз',
    back: 'Артқа',
    ok: 'Дұрыс',
    bad: 'Қате',
    yourAnswer: 'Сіздің жауабыңыз',
    rightAnswer: 'Дұрысы',
    summary: (c, t) => `${t} сұрақтың ${c}-іне дұрыс жауап бердіңіз.`,
  },
};

function ui() {
  return UI[quizLang] || UI.ru;
}

function qText(q) {
  if (quizLang === 'kz') {
    return q.textKz || q.text;
  }
  return q.text;
}

function optText(opt) {
  if (quizLang === 'kz') {
    return opt.textKz || opt.text;
  }
  return opt.text;
}

function qExplanation(q) {
  if (quizLang === 'kz') {
    return q.explanationKz || q.explanation || '';
  }
  return q.explanation ?? '';
}

function bankTitle() {
  if (!bank) return '';
  if (quizLang === 'kz') return bank.titleKz || bank.title;
  return bank.title;
}

function syncLangButtons() {
  document.querySelectorAll('.lang-btn').forEach((btn) => {
    const active = btn.dataset.lang === quizLang;
    btn.classList.toggle('is-active', active);
    btn.setAttribute('aria-pressed', active ? 'true' : 'false');
  });
  document.documentElement.lang = quizLang === 'kz' ? 'kk' : 'ru';
}

function subjectHref() {
  const sid = bank?.subject || 'm094';
  return `subject.html?id=${encodeURIComponent(sid)}`;
}

function subjectLabel() {
  if (quizLang === 'kz') {
    return bank?.subjectTitleKz || bank?.subjectTitle || bank?.subject || 'M094';
  }
  return bank?.subjectTitle || bank?.subject || 'M094';
}

function applyChromeLang() {
  syncLangButtons();
  if (els.title && bank) els.title.textContent = bankTitle();
  if (bank) document.title = `${bankTitle()} — МагаТест`;
  const backLink = document.querySelector('#quizBack a');
  if (backLink) {
    backLink.href = subjectHref();
    backLink.textContent =
      quizLang === 'kz'
        ? `← ${subjectLabel()} тесттеріне`
        : `← К тестам ${bank?.subject?.toUpperCase?.() === 'M099' || bank?.subject === 'm099' ? 'M099' : bank?.subject === 'm094' ? 'M094' : ''}`;
    if (bank?.subject === 'm099') {
      backLink.textContent =
        quizLang === 'kz' ? '← M099 тесттеріне' : '← К тестам M099';
    } else if (bank?.subject === 'm094') {
      backLink.textContent =
        quizLang === 'kz' ? '← M094 тесттеріне' : '← К тестам M094';
    }
  }
  const resultsBack = document.getElementById('resultsBackLink');
  if (resultsBack) {
    resultsBack.href = subjectHref();
  }
  updateProgress();
  if (els.btnPrev) els.btnPrev.textContent = ui().back;
  if (els.btnNext) {
    els.btnNext.textContent =
      currentIndex >= questions.length - 1 ? ui().result : ui().next;
  }
}

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
    els.progressText.textContent = ui().questionOf(currentIndex + 1, total);
  }
  if (els.scoreLive) {
    els.scoreLive.textContent = ui().correctLive(score.correct, answered);
  }
  if (els.progressFill) {
    els.progressFill.style.width = `${pct}%`;
  }
  if (els.progressBar) {
    els.progressBar.setAttribute('aria-valuenow', String(pct));
  }
}

function replayCardAnimation() {
  const card = document.getElementById('questionCard');
  if (!card) return;
  card.classList.remove('swap');
  void card.offsetWidth;
  card.classList.add('swap');
}

function renderQuestion({ animate = true } = {}) {
  const q = questions[currentIndex];
  if (!q) return;

  if (animate) replayCardAnimation();
  applyChromeLang();
  els.qNum.textContent = ui().questionN(currentIndex + 1);
  els.qText.textContent = qText(q);
  let hintEl = document.getElementById('multiHint');
  if (!hintEl) {
    hintEl = document.createElement('p');
    hintEl.id = 'multiHint';
    hintEl.className = 'multi-hint';
    els.qText.after(hintEl);
  }
  if (q.multi && !q.answered) {
    hintEl.textContent = ui().multiHint;
    hintEl.hidden = false;
  } else {
    hintEl.textContent = '';
    hintEl.hidden = true;
  }
  els.qExplanation.classList.remove('show');
  els.qExplanation.textContent = '';

  if (els.qDiagram) {
    const html = getDiagramHtml(q.diagramId);
    if (html) {
      els.qDiagram.innerHTML = html;
      els.qDiagram.hidden = false;
    } else {
      els.qDiagram.innerHTML = '';
      els.qDiagram.hidden = true;
    }
  }

  const pending = new Set(q.selectedIndices || []);

  els.qOptions.innerHTML = '';
  q.options.forEach((opt, i) => {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'option';
    btn.dataset.index = String(i);
    if (q.multi) btn.classList.add('option-multi');

    const letter = document.createElement('span');
    letter.className = 'option-letter';
    letter.textContent = LETTERS[i] || String(i + 1);

    const text = document.createElement('span');
    text.textContent = optText(opt);

    btn.append(letter, text);
    if (animate) {
      btn.classList.add('option-enter');
      btn.style.animationDelay = `${80 + i * 55}ms`;
    }

    if (q.answered) {
      btn.disabled = true;
      const selected = (q.selectedIndices || []).includes(i);
      if (opt.isCorrect) btn.classList.add('correct');
      if (selected && !opt.isCorrect) btn.classList.add('wrong');
      if (!selected && !opt.isCorrect) btn.classList.add('dimmed');
    } else if (q.multi) {
      if (pending.has(i)) btn.classList.add('is-selected');
      btn.addEventListener('click', () => onToggleMulti(i));
    } else {
      btn.addEventListener('click', () => onSelect(i));
    }

    li.appendChild(btn);
    els.qOptions.appendChild(li);
  });

  const explanation = qExplanation(q);
  if (q.answered && explanation) {
    els.qExplanation.textContent = explanation;
    els.qExplanation.classList.add('show');
  }

  els.btnPrev.disabled = currentIndex === 0;
  syncNextButton(q);
}

function syncNextButton(q) {
  if (!els.btnNext) return;
  if (q.answered) {
    els.btnNext.disabled = false;
    els.btnNext.textContent =
      currentIndex === questions.length - 1 ? ui().result : ui().next;
    return;
  }
  if (q.multi) {
    const n = (q.selectedIndices || []).length;
    els.btnNext.disabled = n === 0;
    els.btnNext.textContent = ui().check;
    return;
  }
  els.btnNext.disabled = true;
  els.btnNext.textContent =
    currentIndex === questions.length - 1 ? ui().result : ui().next;
}

function onToggleMulti(optionIndex) {
  const q = questions[currentIndex];
  if (!q || q.answered || !q.multi) return;
  togglePendingSelection(q, optionIndex);
  const buttons = els.qOptions.querySelectorAll('.option');
  buttons.forEach((btn, i) => {
    btn.classList.toggle('is-selected', (q.selectedIndices || []).includes(i));
  });
  syncNextButton(q);
}

function lockAnswerFeedback(q, result) {
  const buttons = els.qOptions.querySelectorAll('.option');
  const selected = new Set(result.selectedIndices || [result.selectedIndex]);
  buttons.forEach((btn, i) => {
    btn.disabled = true;
    btn.classList.remove('is-selected');
    const isCorrectOpt = q.options[i].isCorrect;
    if (selected.has(i) && !isCorrectOpt) btn.classList.add('wrong');
    if (!selected.has(i) && !isCorrectOpt) btn.classList.add('dimmed');
    if (isCorrectOpt) {
      setTimeout(() => btn.classList.add('correct'), result.isCorrect ? 0 : 180);
    }
  });

  const explanation = qExplanation(q);
  if (explanation) {
    els.qExplanation.textContent = explanation;
    els.qExplanation.classList.add('show');
  }

  const hintEl = document.getElementById('multiHint');
  if (hintEl) hintEl.hidden = true;

  syncNextButton(q);
  updateProgress();
}

function onSelect(optionIndex) {
  const q = questions[currentIndex];
  if (!q || q.answered) return;
  if (q.multi) {
    onToggleMulti(optionIndex);
    return;
  }
  const result = answerQuestion(q, optionIndex);
  lockAnswerFeedback(q, result);
}

function confirmMultiAnswer() {
  const q = questions[currentIndex];
  if (!q || q.answered || !q.multi) return;
  if (!(q.selectedIndices || []).length) return;
  const result = answerQuestion(q, q.selectedIndices);
  lockAnswerFeedback(q, result);
}

function setQuizLang(lang) {
  if (lang !== 'ru' && lang !== 'kz') return;
  if (quizLang === lang) {
    applyChromeLang();
    return;
  }
  quizLang = lang;
  try {
    localStorage.setItem('magatest-quiz-lang', lang);
  } catch {
    /* ignore */
  }
  applyChromeLang();
  if (questions.length && els.results && !els.results.classList.contains('hidden')) {
    showResults();
    return;
  }
  if (questions.length) renderQuestion({ animate: false });
}

function goNext() {
  const q = questions[currentIndex];
  if (!q) return;

  if (!q.answered) {
    if (q.multi) {
      confirmMultiAnswer();
      return;
    }
    return;
  }

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

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleString('ru-RU', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function renderLeaderboard(results) {
  if (!els.leaderboardList) return;
  if (!results?.length) {
    els.leaderboardList.innerHTML =
      '<li class="leaderboard-empty">Пока нет сохранённых результатов</li>';
    return;
  }
  els.leaderboardList.innerHTML = results
    .map(
      (r, i) => `
    <li class="leaderboard-item">
      <span class="lb-rank">${i + 1}</span>
      <span class="lb-name">${escapeText(r.name || 'Аноним')}</span>
      <span class="lb-score">${r.percent}%</span>
      <span class="lb-meta">${r.correct}/${r.total} · ${formatDate(r.createdAt)}</span>
    </li>`
    )
    .join('');
}

async function loadLeaderboard() {
  if (!bank?.id) return;
  try {
    const data = await fetchResults({
      testId: bank.id,
      mode: 'top',
      limit: 10,
    });
    renderLeaderboard(data.results || []);
  } catch {
    if (els.leaderboardList) {
      els.leaderboardList.innerHTML =
        '<li class="leaderboard-empty">Пока нет результатов</li>';
    }
  }
}

function resetSaveForm() {
  scoreSaved = false;
  if (els.saveStatus) {
    els.saveStatus.textContent = '';
    els.saveStatus.classList.remove('is-ok', 'is-error');
  }
  if (els.btnSaveScore) {
    els.btnSaveScore.disabled = false;
    els.btnSaveScore.textContent = 'Сохранить';
  }
  if (els.saveScoreBox) els.saveScoreBox.classList.remove('hidden');
}

function animatePercent(el, target, duration = 900) {
  const start = performance.now();
  function tick(now) {
    const p = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = `${Math.round(target * eased)}%`;
    if (p < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

function showResults() {
  const score = computeScore(questions);
  lastScore = score;
  els.app.classList.add('hidden');
  els.results.classList.remove('hidden');
  els.results.classList.remove('reveal');
  void els.results.offsetWidth;
  els.results.classList.add('reveal');
  resetSaveForm();

  animatePercent(els.resultsPercent, score.percent);
  els.resultsGrade.textContent = gradeLabel(score.percent);
  els.resultsSummary.textContent = ui().summary(score.correct, score.total);
  els.statCorrect.textContent = String(score.correct);
  els.statWrong.textContent = String(score.wrong);
  els.statTotal.textContent = String(score.total);

  const t = ui();
  els.reviewList.innerHTML = questions
    .map((q, i) => {
      const ok = q.isCorrect;
      const selectedIdxs = q.selectedIndices || (q.selectedIndex != null ? [q.selectedIndex] : []);
      const correctIdxs = q.options
        .map((o, idx) => (o.isCorrect ? idx : -1))
        .filter((idx) => idx >= 0);
      const selected = selectedIdxs.map((idx) => optText(q.options[idx])).join('; ') || '—';
      const correct = correctIdxs.map((idx) => optText(q.options[idx])).join('; ') || '—';
      return `
        <li class="review-item ${ok ? 'ok' : 'bad'}" style="--i:${i}">
          <div class="mark">${ok ? t.ok : t.bad} · ${i + 1}${q.multi ? ' · multi' : ''}</div>
          <div><strong>${escapeText(qText(q))}</strong></div>
          <div style="margin-top:0.35rem;color:var(--ink-muted)">
            ${t.yourAnswer}: ${escapeText(selected)}
            ${ok ? '' : `<br>${t.rightAnswer}: ${escapeText(correct)}`}
          </div>
        </li>`;
    })
    .join('');

  loadLeaderboard();
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
  lastScore = null;
  els.results.classList.remove('reveal');
  els.results.classList.add('hidden');
  els.app.classList.remove('hidden');
  document.title = `${bankTitle()} — МагаТест`;
  els.title.textContent = bankTitle();
  renderQuestion();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function onSaveScore(event) {
  event.preventDefault();
  if (!bank || !lastScore || scoreSaved) return;

  const name = els.playerName?.value?.trim() || 'Аноним';
  if (els.btnSaveScore) els.btnSaveScore.disabled = true;
  if (els.saveStatus) els.saveStatus.textContent = 'Сохраняем…';

  try {
    await saveResult({
      testId: bank.id,
      title: bank.title,
      name,
      correct: lastScore.correct,
      total: lastScore.total,
      percent: lastScore.percent,
    });
    scoreSaved = true;
    if (els.saveStatus) {
      els.saveStatus.textContent = 'Сохранено ✓';
      els.saveStatus.classList.remove('is-error');
      els.saveStatus.classList.add('is-ok');
    }
    if (els.btnSaveScore) els.btnSaveScore.textContent = 'Сохранено';
    await loadLeaderboard();
  } catch (err) {
    if (els.saveStatus) {
      els.saveStatus.textContent =
        err.status === 503 ? 'Не удалось сохранить — попробуйте позже' : err.message;
      els.saveStatus.classList.add('is-error');
      els.saveStatus.classList.remove('is-ok');
    }
    if (els.btnSaveScore) els.btnSaveScore.disabled = false;
  }
}

async function init() {
  const id = getQueryParam('id');
  if (!id) {
    showError('Не указан идентификатор теста. Вернитесь к списку тестов.');
    return;
  }

  try {
    const saved = localStorage.getItem('magatest-quiz-lang');
    if (saved === 'ru' || saved === 'kz') quizLang = saved;
  } catch {
    /* ignore */
  }

  try {
    // Cache-bust so language packs in JSON are not stuck on an old CDN copy
    const res = await fetch(
      `data/${encodeURIComponent(id)}.json?v=${encodeURIComponent(DATA_VERSION)}`,
      { cache: 'no-cache' }
    );
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
els.saveScoreForm?.addEventListener('submit', onSaveScore);

document.querySelectorAll('.lang-toggle').forEach((toggle) => {
  toggle.addEventListener('click', (event) => {
    const btn = event.target.closest('.lang-btn');
    if (!btn || !toggle.contains(btn)) return;
    event.preventDefault();
    setQuizLang(btn.dataset.lang);
  });
});

init();
