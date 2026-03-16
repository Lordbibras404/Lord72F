/* ============================================================
   GRIT Learn v9.1 — Quiz Engine (Fixed & Compatible)
   متوافق مع HTML v9.1 IDs — إصلاح كامل
   ============================================================ */
'use strict';

let _st = {};

const quiz = {
  subject:  'all',
  diff:     'easy',
  mode:     'normal',
  count:    10,
  questions:[],
  current:  0,
  score:    0,
  xpGained: 0,
  answered: false,
  wrongs:   [],
  startTime:0,
  timerInterval: null,
  timerLeft: 30,
};

/* ══════════ تهيئة ══════════ */
function initQuiz() {
  _st = loadState();
  _wireSetupButtons();
  _showView('setup');
}

function _wireSetupButtons() {
  document.querySelectorAll('#quizSubjectTabs .tab-btn').forEach(btn => {
    btn.onclick = function() {
      document.querySelectorAll('#quizSubjectTabs .tab-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      quiz.subject = this.dataset.subj || 'all';
    };
  });

  // FIX: scope strictly to quizScreen diff-grid only
  document.querySelectorAll('#quizScreen .diff-grid .diff-btn').forEach(btn => {
    btn.onclick = function() {
      document.querySelectorAll('#quizScreen .diff-grid .diff-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      quiz.diff = this.dataset.diff || 'easy';
    };
  });

  document.querySelectorAll('#quizScreen .mode-grid .mode-btn').forEach(btn => {
    btn.onclick = function() {
      document.querySelectorAll('#quizScreen .mode-grid .mode-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      quiz.mode = this.dataset.mode || 'normal';
    };
  });

  // FIX: scope count buttons strictly to quizScreen
  document.querySelectorAll('#quizScreen [data-count]').forEach(btn => {
    btn.onclick = function() {
      document.querySelectorAll('#quizScreen [data-count]').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      quiz.count = parseInt(this.dataset.count) || 10;
    };
  });
}

function _showView(view) {
  const setup  = document.getElementById('quizSetupView');
  const active = document.getElementById('quizActiveView');
  const result = document.getElementById('quizResultView');
  if (setup)  setup.style.display  = view === 'setup'  ? 'block' : 'none';
  if (active) active.style.display = view === 'active' ? 'flex'  : 'none';
  if (result) result.style.display = view === 'result' ? 'block' : 'none';
}

/* ══════════ تحميل الأسئلة ══════════ */
function loadQuizQuestions() {
  _st = loadState();
  _stopTimer();

  let pool = [];
  if (quiz.diff === 'weak') {
    pool = getWeakQuestions(_st, 999);
  } else if (quiz.subject === 'all') {
    Object.values(QUESTIONS).forEach(arr => pool.push(...arr));
  } else {
    pool = QUESTIONS[quiz.subject] || [];
  }

  if (quiz.diff !== 'auto' && quiz.diff !== 'mixed' && quiz.diff !== 'weak') {
    const filtered = pool.filter(q => q.diff === quiz.diff);
    if (filtered.length > 0) pool = filtered;
  }

  if (pool.length === 0) {
    if (typeof showToast === 'function') showToast('لا توجد أسئلة لهذا الاختيار 📚', 'warning');
    return;
  }

  const wrongQs = (_st.wrongHistory || []).map(w => w.q);
  const priority = pool.filter(q => wrongQs.includes(q.q));
  const rest     = pool.filter(q => !wrongQs.includes(q.q));
  const shuffled = [
    ...priority.sort(() => Math.random() - 0.5),
    ...rest.sort(() => Math.random() - 0.5),
  ].slice(0, quiz.count);

  quiz.questions  = shuffled;
  quiz.current    = 0;
  quiz.score      = 0;
  quiz.xpGained   = 0;
  quiz.answered   = false;
  quiz.wrongs     = [];
  quiz.startTime  = Date.now();

  if (quiz.mode === 'review') {
    _showView('active');
    _renderReviewMode();
    return;
  }

  _showView('active');
  _renderQuestion();
}

/* ══════════ رسم السؤال ══════════ */
function _renderQuestion() {
  if (quiz.current >= quiz.questions.length) { _showResult(); return; }

  const q = quiz.questions[quiz.current];
  const subj = (quiz.subject !== 'all' ? SUBJECTS[quiz.subject] : null) || SUBJECTS['math'];
  const diffNames = { easy:'سهل', medium:'متوسط', hard:'صعب', mixed:'مختلط', auto:'تلقائي', weak:'ضعفي' };
  const modeNames = { normal:'عادي', timed:'مؤقت', sudden:'موت مفاجئ', review:'مراجعة', streak:'سلسلة', challenge:'تحدي' };

  quiz.answered = false;

  _setEl('quizQPill',      'س ' + (quiz.current + 1) + ' / ' + quiz.questions.length);
  _setEl('quizSubjectTag', quiz.subject === 'all' ? '📚 كل المواد' : subj.i + ' ' + subj.n);
  _setEl('quizModeTag',    modeNames[quiz.mode] || quiz.mode);
  _setEl('quizScoreOk',    '✓ ' + quiz.score);
  _setEl('quizScoreWrong', '✗ ' + (quiz.current - quiz.score));

  const pf = document.getElementById('quizProgFill');
  if (pf) pf.style.width = (quiz.current / quiz.questions.length * 100) + '%';

  const letters = ['أ','ب','ج','د'];
  const opts    = q.opts || q.o || [];
  const diffColors = { easy:'#059669', medium:'#d97706', hard:'#dc2626' };
  const dColor = diffColors[q.diff] || '#6c63ff';

  const body = document.getElementById('quizBodyScroll');
  if (!body) return;

  body.innerHTML =
    '<div class="quiz-question-card" style="animation:fadeInUp 0.3s ease both;padding:16px;display:flex;flex-direction:column;gap:12px">' +
      '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">' +
        '<span style="font-size:11px;font-weight:800;padding:3px 10px;border-radius:999px;background:' + dColor + '18;border:1px solid ' + dColor + '33;color:' + dColor + '">' + (diffNames[q.diff] || '') + '</span>' +
        '<span style="font-size:11px;color:var(--text4);font-weight:700">' + (quiz.current+1) + '/' + quiz.questions.length + '</span>' +
      '</div>' +
      '<div style="font-size:15px;font-weight:800;color:var(--text);line-height:1.6;direction:rtl">' + q.q + '</div>' +
      '<div id="quizOptionsList" style="display:flex;flex-direction:column;gap:8px">' +
        opts.map(function(opt, i) {
          return '<button class="quiz-option-btn" data-idx="' + i + '" onclick="pickAnswer(' + i + ')" style="animation-delay:' + (i*60) + 'ms;display:flex;align-items:center;gap:10px;padding:12px 14px;background:var(--surface);border:1.5px solid var(--border);border-radius:13px;cursor:pointer;font-family:Cairo,sans-serif;font-size:13px;font-weight:700;color:var(--text);text-align:right;width:100%;transition:all .2s ease">' +
            '<div style="width:26px;height:26px;border-radius:50%;background:var(--surface2);border:1.5px solid var(--border2);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:900;flex-shrink:0;color:var(--accent)">' + letters[i] + '</div>' +
            '<span>' + opt + '</span>' +
          '</button>';
        }).join('') +
      '</div>' +
      '<div id="quizFeedback" style="display:none;align-items:flex-start;gap:10px;padding:12px 14px;border-radius:13px;font-size:13px"></div>' +
      '<button id="quizNextBtn" style="display:none;padding:14px;background:linear-gradient(135deg,#6c63ff,#a855f7);border:none;border-radius:14px;color:white;font-size:14px;font-weight:900;cursor:pointer;font-family:Cairo,sans-serif;margin-top:4px" onclick="nextQuestion()">' +
        (quiz.current + 1 < quiz.questions.length ? 'السؤال التالي ←' : '📊 عرض النتيجة') +
      '</button>' +
    '</div>';

  if (quiz.mode === 'timed') {
    _startTimer(30);
    const tb = document.getElementById('quizTimerBadge');
    if (tb) tb.style.display = '';
  } else {
    const tb = document.getElementById('quizTimerBadge');
    if (tb) { tb.style.display = 'none'; }
  }
}

/* ══ اختيار إجابة ══ */
function pickAnswer(idx) {
  if (quiz.answered) return;
  quiz.answered = true;
  _stopTimer();

  const q       = quiz.questions[quiz.current];
  const ansKey  = q.ans !== undefined ? q.ans : q.a;
  const correct = idx === ansKey;
  const opts    = q.opts || q.o || [];

  // تحديد المادة الصحيحة حتى لو كان الاختيار "الكل"
  let subj = quiz.subject;
  if (subj === 'all') {
    subj = Object.keys(QUESTIONS).find(k => (QUESTIONS[k] || []).some(x => x.q === q.q)) || 'math';
  }

  document.querySelectorAll('.quiz-option-btn').forEach(function(btn, i) {
    btn.disabled = true;
    btn.style.pointerEvents = 'none';
    if (i === ansKey) { btn.style.background = 'rgba(16,185,129,0.15)'; btn.style.borderColor = '#10b981'; btn.style.color = '#059669'; }
    if (i === idx && !correct) { btn.style.background = 'rgba(239,68,68,0.12)'; btn.style.borderColor = '#ef4444'; btn.style.color = '#dc2626'; }
  });

  const xpMap = { easy:10, medium:20, hard:35 };
  const xp    = xpMap[q.diff] || 15;

  if (!_st.subjectStats) _st.subjectStats = {};
  if (!_st.subjectStats[subj]) _st.subjectStats[subj] = { ok:0, wrong:0, sessions:0 };

  if (correct) {
    quiz.score++;
    quiz.xpGained += xp;
    _st.ok = (_st.ok || 0) + 1;
    _st.subjectStats[subj].ok++;
    addXpToState(_st, xp);
    if (typeof updateAdaptiveWeight === 'function') updateAdaptiveWeight(_st, subj, q.diff, true);
    _showFeedback(true, q.exp || q.e || '');
    if (typeof showXpFloat === 'function') setTimeout(function(){ showXpFloat(xp); }, 200);
  } else {
    quiz.wrongs.push({ q: q.q, a: opts[ansKey], subj: SUBJECTS[subj] && SUBJECTS[subj].n });
    _st.wrongCount = (_st.wrongCount || 0) + 1;
    if (!_st.wrongHistory) _st.wrongHistory = [];
    _st.wrongHistory.unshift({ q: q.q, a: opts[ansKey], subj: SUBJECTS[subj] && SUBJECTS[subj].n, subjectKey: subj });
    _st.wrongHistory = _st.wrongHistory.slice(0, 40);
    _st.subjectStats[subj].wrong++;
    if (typeof updateAdaptiveWeight === 'function') updateAdaptiveWeight(_st, subj, q.diff, false);
    _showFeedback(false, q.exp || q.e || '');
  }

  if (quiz.mode === 'sudden' && !correct) {
    saveState(_st);
    setTimeout(_showResult, 1200);
    return;
  }

  _setEl('quizScoreOk',    '✓ ' + quiz.score);
  _setEl('quizScoreWrong', '✗ ' + (quiz.current + 1 - quiz.score));

  const nb = document.getElementById('quizNextBtn');
  if (nb) nb.style.display = 'block';

  saveState(_st);
}

function _showFeedback(correct, expl) {
  const fb = document.getElementById('quizFeedback');
  if (!fb) return;
  fb.style.display = 'flex';
  fb.style.background  = correct ? 'rgba(16,185,129,0.10)' : 'rgba(239,68,68,0.10)';
  fb.style.border      = '1px solid ' + (correct ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)');
  fb.style.borderRadius= '13px';
  fb.innerHTML =
    '<span style="font-size:20px">' + (correct ? '🎉' : '💡') + '</span>' +
    '<div>' +
      '<div style="font-size:13px;font-weight:900;color:' + (correct ? '#059669':'#dc2626') + '">' + (correct ? 'إجابة صحيحة!' : 'إجابة خاطئة') + '</div>' +
      (expl ? '<div style="font-size:12px;color:var(--text3);margin-top:3px;line-height:1.5">' + expl + '</div>' : '') +
    '</div>';
}

function nextQuestion() {
  quiz.current++;
  _renderQuestion();
}

function _renderReviewMode() {
  const body = document.getElementById('quizBodyScroll');
  if (!body) return;
  _setEl('quizQPill', 'مراجعة — ' + quiz.questions.length + ' سؤال');
  _setEl('quizModeTag', '🔄 مراجعة');
  const tb = document.getElementById('quizTimerBadge');
  if (tb) tb.style.display = 'none';

  body.innerHTML = '<div style="padding:16px;display:flex;flex-direction:column;gap:10px">' +
    quiz.questions.map(function(q, i) {
      const opts = q.opts || q.o || [];
      const ans  = q.ans !== undefined ? q.ans : q.a;
      return '<div style="background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:14px;cursor:pointer" onclick="var a=this.querySelector(\'.rev-ans\');a.style.display=a.style.display===\'none\'?\'block\':\'none\'">' +
        '<div style="font-size:13px;font-weight:800;color:var(--text)">' + (i+1) + '. ' + q.q + '</div>' +
        '<div class="rev-ans" style="display:none;margin-top:8px;padding:10px;background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.2);border-radius:10px">' +
          '<div style="font-size:12px;font-weight:800;color:#059669">✅ ' + opts[ans] + '</div>' +
          ((q.exp||q.e) ? '<div style="font-size:11px;color:var(--text3);margin-top:4px">' + (q.exp||q.e) + '</div>' : '') +
        '</div>' +
        '<div style="font-size:11px;color:var(--text4);margin-top:5px">👆 اضغط لإظهار الإجابة</div>' +
      '</div>';
    }).join('') +
    '<button onclick="quiz.mode=\'normal\';loadQuizQuestions()" style="margin-top:8px;padding:14px;background:linear-gradient(135deg,#6c63ff,#a855f7);border:none;border-radius:14px;color:white;font-size:14px;font-weight:900;cursor:pointer;font-family:Cairo,sans-serif">🚀 ابدأ الاختبار</button>' +
  '</div>';
}

/* ══════════ النتيجة ══════════ */
function _showResult() {
  _stopTimer();
  _showView('result');

  _st = loadState();
  const total   = quiz.questions.length;
  const pct     = total > 0 ? Math.round(quiz.score / total * 100) : 0;
  const elapsed = Math.round((Date.now() - quiz.startTime) / 1000);
  const mm      = String(Math.floor(elapsed / 60)).padStart(2,'0');
  const ss      = String(elapsed % 60).padStart(2,'0');

  _st.ses = (_st.ses || 0) + 1;
  if (pct === 100) _st.perfectCount = (_st.perfectCount || 0) + 1;
  const today = typeof getTodayStr === 'function' ? getTodayStr() : new Date().toLocaleDateString('en-CA');
  if (!_st.dailyLog) _st.dailyLog = {};
  if (!_st.dailyLog[today]) _st.dailyLog[today] = { xp:0, sessions:0, ok:0 };
  _st.dailyLog[today].sessions++;
  _st.dailyLog[today].ok += quiz.score;
  saveState(_st);
  if (typeof checkAndAwardBadges === 'function') checkAndAwardBadges(_st);

  var emoji, title, sub;
  if (pct === 100)    { emoji='🏆'; title='مثالي! أنت بطل!';          sub='100% — أداء استثنائي 🔥'; }
  else if (pct >= 80) { emoji='🌟'; title='ممتاز! أداء رائع!';        sub='واصل على هذا المستوى 💪'; }
  else if (pct >= 60) { emoji='✅'; title='جيد! واصل التحسن';          sub='أنت في الطريق الصحيح 📈'; }
  else if (pct >= 40) { emoji='📚'; title='راجع الأخطاء وحاول مجدداً'; sub='كل خطأ درس جديد'; }
  else                { emoji='💪'; title='لا تستسلم! راجع الدروس';   sub='كل محاولة تقربك من النجاح'; }

  _setEl('qrEmoji',   emoji);
  _setEl('qrTitle',   title);
  _setEl('qrSub',     sub);
  _setEl('qrCorrect', quiz.score);
  _setEl('qrWrong',   total - quiz.score);
  _setEl('qrTime',    mm + ':' + ss);
  _setEl('qrPct',     pct + '%');
  _setEl('qrXp',      '+' + quiz.xpGained + ' XP 🌟');

  const ring = document.getElementById('qrRingFill');
  if (ring) {
    const offset = 364 - (pct / 100 * 364);
    setTimeout(function() {
      ring.style.transition = 'stroke-dashoffset 1.2s ease';
      ring.style.strokeDashoffset = offset;
    }, 200);
  }

  if (quiz.xpGained > 0 && typeof showXpFloat === 'function') setTimeout(function(){ showXpFloat(quiz.xpGained); }, 800);
  if (pct === 100 && typeof launchConfetti === 'function') setTimeout(function(){ launchConfetti(60); }, 400);
}

/* ══════════ المؤقت ══════════ */
function _startTimer(seconds) {
  _stopTimer();
  quiz.timerLeft = seconds;
  _updateTimerUI();
  quiz.timerInterval = setInterval(function() {
    quiz.timerLeft--;
    _updateTimerUI();
    if (quiz.timerLeft <= 0) _timeOut();
  }, 1000);
}
function _stopTimer() {
  if (quiz.timerInterval) { clearInterval(quiz.timerInterval); quiz.timerInterval = null; }
}
function _updateTimerUI() {
  const badge = document.getElementById('quizTimerBadge');
  if (!badge) return;
  const s = quiz.timerLeft;
  badge.textContent = '⏱ ' + String(Math.floor(s/60)).padStart(2,'0') + ':' + String(s%60).padStart(2,'0');
  badge.style.color = s <= 10 ? 'var(--error)' : s <= 20 ? 'var(--warning)' : '';
}
function _timeOut() {
  if (quiz.answered) return;
  quiz.answered = true;
  _stopTimer();
  const q   = quiz.questions[quiz.current];
  const ans = q.ans !== undefined ? q.ans : q.a;
  document.querySelectorAll('.quiz-option-btn').forEach(function(btn, i) {
    btn.disabled = true;
    if (i === ans) { btn.style.background='rgba(16,185,129,0.15)'; btn.style.borderColor='#10b981'; }
  });
  quiz.wrongs.push({ q: q.q, a: (q.opts||q.o||[])[ans] });
  var nb = document.getElementById('quizNextBtn');
  if (nb) nb.style.display = 'block';
  var fb = document.getElementById('quizFeedback');
  if (fb) { fb.style.display='flex'; fb.style.background='rgba(239,68,68,0.10)'; fb.style.border='1px solid rgba(239,68,68,0.3)'; fb.style.borderRadius='13px'; fb.innerHTML='<span style="font-size:20px">⏰</span><div style="font-size:13px;font-weight:900;color:#dc2626">انتهى الوقت!</div>'; }
}

function _setEl(id, val) {
  var el = document.getElementById(id);
  if (el) el.textContent = val;
}

/* ══ دوال خارجية ══ */
function restartQuiz()    { loadQuizQuestions(); }
function startTodayQuiz() { showScreen('quizScreen'); setTimeout(loadQuizQuestions, 150); }
function goToReviewMode() { quiz.mode = 'review'; showScreen('quizScreen'); setTimeout(loadQuizQuestions, 150); }

document.addEventListener('DOMContentLoaded', function() {
  var qs = document.getElementById('quizScreen');
  if (!qs) return;
  var obs = new MutationObserver(function() {
    if (qs.classList.contains('active')) initQuiz();
  });
  obs.observe(qs, { attributes: true, attributeFilter: ['class'] });
});
