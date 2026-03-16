/* ============================================================
   GRIT Learn v9.1 — State Management
   Single source of truth · localStorage · deep merge
   Developer: @ZarVenox · Channel: @bacDz_09
   ============================================================ */
'use strict';

/* NOTE: LEVELS, BADGES, SUBJECTS, BRANCHES, getLevelInfo, XP_REWARDS
   are all defined in data.js which loads before this file.
   Do NOT redeclare them here. */

const STORAGE_KEY = 'grit_v7';

/* ══ Default state ══ */
const DEFAULT_STATE = {
  /* Identity */
  name:     '',
  avatar:   null,
  branch:   'science',
  onboarded: false,
  notif:    true,
  theme:    'light',

  /* Progress */
  xp:           0,
  streak:       0,
  ok:           0,
  wrongCount:   0,   /* عداد الإجابات الخاطئة الكلي */
  ses:          0,
  perfectCount: 0,
  lastStudyDate: null,
  studyDays:    {},   /* { 'YYYY-MM-DD': true } */
  dailyCount:   {},   /* { 'YYYY-MM-DD': N } */
  dailyXp:      {},   /* { 'YYYY-MM-DD': N } */

  /* Per-subject mastery 0-100 */
  mastery: { math:0,physics:0,arabic:0,history:0,english:0,french:0,islamic:0,philosophy:0,science:0,chemistry:0,economics:0,tamazight:0 },

  /* Per-subject detailed stats */
  subjectStats: {
    math:       {ok:0,wrong:0,sessions:0},
    physics:    {ok:0,wrong:0,sessions:0},
    arabic:     {ok:0,wrong:0,sessions:0},
    history:    {ok:0,wrong:0,sessions:0},
    english:    {ok:0,wrong:0,sessions:0},
    french:     {ok:0,wrong:0,sessions:0},
    islamic:    {ok:0,wrong:0,sessions:0},
    philosophy: {ok:0,wrong:0,sessions:0},
    science:    {ok:0,wrong:0,sessions:0},
    chemistry:  {ok:0,wrong:0,sessions:0},
    economics:  {ok:0,wrong:0,sessions:0},
    tamazight:  {ok:0,wrong:0,sessions:0},
  },

  /* Adaptive weights per subject/diff */
  adaptiveWeights: {
    math:       {easy:1,medium:1,hard:1},
    physics:    {easy:1,medium:1,hard:1},
    arabic:     {easy:1,medium:1,hard:1},
    history:    {easy:1,medium:1,hard:1},
    english:    {easy:1,medium:1,hard:1},
    french:     {easy:1,medium:1,hard:1},
    islamic:    {easy:1,medium:1,hard:1},
    philosophy: {easy:1,medium:1,hard:1},
    science:    {easy:1,medium:1,hard:1},
    chemistry:  {easy:1,medium:1,hard:1},
    economics:  {easy:1,medium:1,hard:1},
    tamazight:  {easy:1,medium:1,hard:1},
  },

  /* Feature counters */
  pomSessions:     0,
  aiChats:         0,
  nightSessions:   0,
  earlySessions:   0,
  ramadanSessions: 0,
  shares:          0,

  /* Badges */
  earnedBadges: [],

  /* Tasks */
  tasks: [],

  /* Wrong answers history (separate from wrong counter above) */
  wrongHistory: [],

  /* Daily log */
  dailyLog: {},   /* { 'YYYY-MM-DD': { xp:0, sessions:0, ok:0 } } */

  /* Pomodoro */
  timerSec:      25 * 60,
  shortBreakSec: 5  * 60,
  longBreakSec:  15 * 60,
};

/* ════════════════════════════════════════════════════════
   LOAD / SAVE / RESET
════════════════════════════════════════════════════════ */

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_STATE };
    return _deepMerge(DEFAULT_STATE, JSON.parse(raw));
  } catch (e) {
    console.warn('[GRIT] loadState error:', e);
    return { ...DEFAULT_STATE };
  }
}

function saveState(st) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(st));
  } catch (e) {
    console.warn('[GRIT] saveState error:', e);
  }
}

function resetState() {
  try { localStorage.removeItem(STORAGE_KEY); } catch (_) {}
}

function _deepMerge(defaults, saved) {
  const result = { ...defaults };
  for (const key in saved) {
    if (
      saved[key] !== null &&
      typeof saved[key] === 'object' &&
      !Array.isArray(saved[key]) &&
      typeof defaults[key] === 'object' &&
      defaults[key] !== null &&
      !Array.isArray(defaults[key])
    ) {
      result[key] = _deepMerge(defaults[key], saved[key]);
    } else {
      result[key] = saved[key];
    }
  }
  return result;
}

/* ════════════════════════════════════════════════════════
   LEVEL HELPERS
   getLevelInfo is defined in data.js (loads first) — do not redefine
════════════════════════════════════════════════════════ */

function getLevelClass(xp) {
  return getLevelInfo(xp).cls || 'bronze';
}

/* ════════════════════════════════════════════════════════
   XP
════════════════════════════════════════════════════════ */

function addXpToState(st, amount) {
  const before = getLevelInfo(st.xp);
  st.xp = (st.xp || 0) + amount;
  const after  = getLevelInfo(st.xp);

  /* Record daily XP */
  const today = getAlgiersDate().toLocaleDateString('en-CA');
  if (!st.dailyXp) st.dailyXp = {};
  st.dailyXp[today] = (st.dailyXp[today] || 0) + amount;

  /* Prune old daily records */
  const keys = Object.keys(st.dailyXp).sort();
  while (keys.length > 60) delete st.dailyXp[keys.shift()];

  saveState(st);

  if (after.name !== before.name) {
    setTimeout(() => showLevelUp(after), 600);
  }

  return amount;
}

/* ════════════════════════════════════════════════════════
   ADAPTIVE WEIGHTS
════════════════════════════════════════════════════════ */

function updateAdaptiveWeight(st, subject, diff, correct) {
  if (!st.adaptiveWeights[subject]) return;
  const w = st.adaptiveWeights[subject];
  const diffs = ['easy','medium','hard'];
  const idx = diffs.indexOf(diff);
  if (correct) {
    w[diff] = Math.max(0.3, w[diff] - 0.2);
    if (idx < 2) w[diffs[idx+1]] = Math.min(3, w[diffs[idx+1]] + 0.1);
  } else {
    w[diff] = Math.min(3, w[diff] + 0.3);
  }
  saveState(st);
}

function suggestDiff(st, subject) {
  const w = (st.adaptiveWeights || {})[subject] || {easy:1,medium:1,hard:1};
  const total = w.easy + w.medium + w.hard;
  const r = Math.random() * total;
  if (r < w.easy)            return 'easy';
  if (r < w.easy + w.medium) return 'medium';
  return 'hard';
}

/* ════════════════════════════════════════════════════════
   RECORD ANSWER
════════════════════════════════════════════════════════ */

function recordAnswer(st, subjectKey, diff, correct) {
  /* Global counts */
  if (correct) st.ok = (st.ok||0) + 1;
  else         st.wrongCount = (st.wrongCount||0) + 1;

  /* Subject stats */
  if (!st.subjectStats[subjectKey]) st.subjectStats[subjectKey] = {ok:0,wrong:0,sessions:0};
  if (correct) st.subjectStats[subjectKey].ok++;
  else         st.subjectStats[subjectKey].wrong++;

  /* Mastery update */
  const ss    = st.subjectStats[subjectKey];
  const total = ss.ok + ss.wrong;
  if (total > 0) st.mastery[subjectKey] = Math.round((ss.ok / total) * 100);

  /* Daily count */
  const today = getAlgiersDate().toLocaleDateString('en-CA');
  if (!st.dailyCount) st.dailyCount = {};
  st.dailyCount[today] = (st.dailyCount[today] || 0) + 1;

  /* Prune */
  const keys = Object.keys(st.dailyCount).sort();
  while (keys.length > 60) delete st.dailyCount[keys.shift()];

  /* Adaptive */
  updateAdaptiveWeight(st, subjectKey, diff, correct);

  /* Study day */
  if (!st.studyDays) st.studyDays = {};
  st.studyDays[today] = true;

  /* Streak update */
  if (st.lastStudyDate !== today) {
    const yest = new Date(getAlgiersDate()); yest.setDate(yest.getDate()-1);
    const yKey = yest.toLocaleDateString('en-CA');
    if (st.lastStudyDate === yKey) st.streak = (st.streak||0)+1;
    else if (!st.lastStudyDate)    st.streak = 1;
    // else streak already broken (handled in checkStreak on boot)
    st.lastStudyDate = today;
  }

  saveState(st);
}

/* ════════════════════════════════════════════════════════
   STRENGTHS & WEAKNESSES
════════════════════════════════════════════════════════ */

function getStrengthsWeaknesses(st) {
  const entries = Object.entries(st.subjectStats || {}).map(([k,v]) => {
    const total = (v.ok||0) + (v.wrong||0);
    const rate  = total > 0 ? Math.round((v.ok/total)*100) : -1;
    return { key:k, subj:SUBJECTS[k], rate, total };
  }).filter(e => e.total > 0);

  if (!entries.length) return { strengths:[], weaknesses:[] };

  const sorted     = [...entries].sort((a,b) => b.rate - a.rate);
  const strengths  = sorted.slice(0,3);
  const weaknesses = sorted.slice(-3).reverse();
  return { strengths, weaknesses };
}

/* ════════════════════════════════════════════════════════
   BADGE CHECK
════════════════════════════════════════════════════════ */

function checkAndAwardBadges(st) {
  let awarded = false;
  BADGES.forEach(badge => {
    if (!(st.earnedBadges||[]).includes(badge.id) && badge.check(st)) {
      if (!st.earnedBadges) st.earnedBadges = [];
      st.earnedBadges.push(badge.id);
      awarded = true;
      saveState(st);
      setTimeout(() => showBadgePopup(badge), 800);
    }
  });
  return awarded;
}

/* ════════════════════════════════════════════════════════
   DATE HELPERS (exported globally)
════════════════════════════════════════════════════════ */

function getAlgiersDate() {
  return new Date(new Date().toLocaleString('en-US', { timeZone:'Africa/Algiers' }));
}

function getTodayStr() {
  return getAlgiersDate().toLocaleDateString('en-CA');
}
