/* ============================================================
   GRIT Learn v6 — Pomodoro Timer (Enhanced UI)
   ============================================================ */
'use strict';

const Pomodoro = (() => {

  const MODES = {
    work:        { label:'تركيز',        duration: 25*60, color:'var(--accent)',  emoji:'🎯' },
    short_break: { label:'استراحة قصيرة', duration:  5*60, color:'#10b981',       emoji:'☕' },
    long_break:  { label:'استراحة طويلة', duration: 15*60, color:'#3b82f6',       emoji:'🌙' },
  };

  const R = 88, C = 2 * Math.PI * R;

  let state = {
    mode: 'work', timeLeft: 25*60,
    running: false, interval: null,
    sessions: 0, totalFocus: 0,
  };

  function fmt(sec) {
    return `${String(Math.floor(sec/60)).padStart(2,'0')}:${String(sec%60).padStart(2,'0')}`;
  }

  function updateDisplay() {
    const m  = MODES[state.mode];
    const el = id => document.getElementById(id);

    // IDs من HTML الـ dynamic (inject mode)
    if (el('pomo-time'))  el('pomo-time').textContent  = fmt(state.timeLeft);
    if (el('pomo-label')) el('pomo-label').textContent = m.label;
    if (el('pomo-emoji')) el('pomo-emoji').textContent = m.emoji;
    if (el('pomo-play'))  el('pomo-play').textContent  = state.running ? '⏸' : '▶';
    if (el('pomo-ring')) {
      const pct = state.timeLeft / m.duration;
      el('pomo-ring').style.strokeDashoffset = C * (1 - pct);
      el('pomo-ring').style.stroke = m.color;
    }
    const wrap = document.getElementById('pomo-ring-wrap');
    if (wrap) wrap.style.filter = state.running ? `drop-shadow(0 0 18px ${m.color}55)` : 'none';

    // IDs من HTML v9.1 الثابت
    if (el('pomoTime'))      el('pomoTime').textContent      = fmt(state.timeLeft);
    if (el('pomoModeLabel')) el('pomoModeLabel').textContent = m.label;
    if (el('pomoPlayBtn')) {
      el('pomoPlayBtn').textContent = state.running ? '⏸' : '▶️';
      el('pomoPlayBtn').style.background = state.running
        ? 'linear-gradient(135deg,#ef4444,#f97316)'
        : 'linear-gradient(135deg,#6c63ff,#a855f7)';
    }
    if (el('pomoRingFill')) {
      const pct = state.timeLeft / m.duration;
      el('pomoRingFill').style.strokeDashoffset = (628 * (1 - pct)).toFixed(2);
      el('pomoRingFill').style.stroke = m.color;
    }
    if (el('pomoSessionCount')) el('pomoSessionCount').textContent = state.sessions;

    // Mode tabs v9.1
    document.querySelectorAll('.pomo-mode-tab').forEach(tab => {
      const modeMap = { focus:'work', short:'short_break', long:'long_break' };
      tab.classList.toggle('active', modeMap[tab.dataset.mode] === state.mode);
    });

    // Session dots v9.1
    const dotsEl = document.getElementById('pomoSessionDots');
    if (dotsEl) {
      const dotsArr = dotsEl.querySelectorAll('.pomo-session-dot');
      dotsArr.forEach((dot, i) => {
        dot.classList.remove('current','done');
        const posInCycle = state.sessions % 4;
        if (i < posInCycle) dot.classList.add('done');
        else if (i === posInCycle) dot.classList.add('current');
      });
    }

    updateDots();
  }

  function updateDots() {
    const el = document.getElementById('pomo-dots');
    if (!el) return;
    el.innerHTML = Array.from({length:4}, (_,i) => `
      <div style="
        width:10px;height:10px;border-radius:50%;transition:all .3s ease;
        background:${i < (state.sessions % 4)
          ? '#10b981'
          : 'rgba(255,255,255,.1)'};
        box-shadow:${i < (state.sessions % 4)
          ? '0 0 6px rgba(16,185,129,.5)'
          : 'none'};
      "></div>`).join('');
  }

  function tick() {
    state.timeLeft--;
    if (state.mode === 'work') state.totalFocus++;
    updateDisplay();
    if (state.timeLeft <= 0) {
      clearInterval(state.interval);
      state.running = false;
      onEnd();
    }
  }

  function onEnd() {
    if (navigator.vibrate) navigator.vibrate([200,100,200]);
    if (state.mode === 'work') {
      state.sessions++;
      // v9.1 state management
      try {
        const appSt = loadState();
        addXpToState(appSt, 50);
        appSt.pomSessions = (appSt.pomSessions || 0) + 1;
        saveState(appSt);
        if (typeof checkAndAwardBadges === 'function') checkAndAwardBadges(appSt);
      } catch(e) {}
      if (typeof showXpFloat === 'function') showXpFloat(50);
      if (typeof showToast === 'function') showToast('جلسة مكتملة! +50 XP 🎉', 'success');
      const next = state.sessions % 4 === 0 ? 'long_break' : 'short_break';
      setTimeout(() => setMode(next), 1200);
    } else {
      if (typeof showToast === 'function') showToast('انتهت الاستراحة! ⏰', 'info');
      setTimeout(() => setMode('work'), 1200);
    }
  }

  // ─── Public ────────────────────────────────────────────────
  function toggle() {
    if (state.running) { clearInterval(state.interval); state.running = false; }
    else { state.running = true; state.interval = setInterval(tick, 1000); }
    /* Add/remove running class for CSS glow animation */
    const ringWrap = document.getElementById('pomo-ring-wrap') || document.querySelector('.pomo-ring-wrap');
    if (ringWrap) ringWrap.classList.toggle('running', state.running);
    const timeEl = document.querySelector('.pomo-time') || document.getElementById('pomoTime');
    if (timeEl) timeEl.classList.toggle('running', state.running);
    updateDisplay();
  }

  function reset() {
    clearInterval(state.interval); state.running = false;
    state.timeLeft = MODES[state.mode].duration;
    updateDisplay();
  }

  function skip() {
    clearInterval(state.interval); state.running = false;
    state.timeLeft = 0; onEnd();
  }

  function setMode(mode) {
    clearInterval(state.interval); state.running = false;
    state.mode = mode; state.timeLeft = MODES[mode].duration;
    document.querySelectorAll('.pomo-tab').forEach(b => {
      b.classList.toggle('active', b.dataset.mode === mode);
    });
    updateDisplay();
  }

  function init(containerId) {
    // v9.1: الـ HTML موجود مسبقاً، نكتفي بتحديث العرض
    // نحاول أولاً استخدام الـ IDs الموجودة في HTML v9.1
    const hasV91 = !!document.getElementById('pomoTime');
    if (hasV91) {
      _syncV91();
      return;
    }
    // fallback: inject HTML
    const el = document.getElementById(containerId || 'pomo-container');
    if (!el) return;
    el.innerHTML = renderHTML();
    updateDisplay();
  }

  // مزامنة مع IDs الـ HTML v9.1
  function _syncV91() {
    const m = MODES[state.mode];
    const timeEl = document.getElementById('pomoTime');
    if (timeEl) timeEl.textContent = fmt(state.timeLeft);

    const labelEl = document.getElementById('pomoModeLabel');
    if (labelEl) labelEl.textContent = m.label;

    const playBtn = document.getElementById('pomoPlayBtn');
    if (playBtn) {
      playBtn.textContent = state.running ? '⏸️' : '▶️';
      playBtn.style.transform = '';
    }

    // Running class for CSS animations
    const ringWrap = document.querySelector('.pomo-ring-wrap');
    if (ringWrap) ringWrap.classList.toggle('running', state.running);
    if (timeEl) timeEl.classList.toggle('running', state.running);

    // Ring — FIX: stroke goes from full (0) to empty (628) as time counts down
    const ring = document.getElementById('pomoRingFill');
    if (ring) {
      const pct = m.duration > 0 ? state.timeLeft / m.duration : 0;
      const offset = 628 * (1 - pct);
      ring.style.strokeDashoffset = offset.toString();
      // Color changes: green when break, red when low time
      const isBreak = state.mode !== 'work';
      const isLow   = !isBreak && pct <= 0.2;
      ring.style.stroke = isLow
        ? 'url(#redGrad)'
        : isBreak
          ? '#10b981'
          : 'url(#pomoGrad)';
    }

    // Session count
    const sc = document.getElementById('pomoSessionCount');
    if (sc) sc.textContent = state.sessions;

    // Mode tabs highlight
    document.querySelectorAll('.pomo-mode-tab').forEach(tab => {
      const modeMap = { focus:'work', short:'short_break', long:'long_break' };
      tab.classList.toggle('active', modeMap[tab.dataset.mode] === state.mode);
    });

    // Stats
    const sf = document.getElementById('pomoStatFocus');
    const sm = document.getElementById('pomoStatMins');
    const sx = document.getElementById('pomoStatXp');
    if (sf) sf.textContent = state.sessions;
    if (sm) sm.textContent = Math.floor(state.totalFocus / 60);
    if (sx) sx.textContent = (state.sessions || 0) * 50;

    // Session dots
    const dotsEl = document.getElementById('pomoSessionDots');
    if (dotsEl) {
      const dots = dotsEl.querySelectorAll('.pomo-session-dot');
      dots.forEach((dot, i) => {
        const isDone = i < (state.sessions % 4);
        const isCurrent = i === (state.sessions % 4);
        dot.classList.toggle('done', isDone);
        dot.classList.toggle('current', isCurrent);
      });
    }
  }

  function renderHTML() {
    const totalMin = Math.floor(state.totalFocus / 60);
    return `
    <div style="display:flex;flex-direction:column;align-items:center;gap:20px;padding:20px 16px 120px">

      <!-- Mode Tabs -->
      <div style="display:flex;background:rgba(255,255,255,.05);border-radius:14px;padding:3px;gap:3px;width:100%;max-width:340px">
        ${Object.entries(MODES).map(([key,m])=>`
          <button class="pomo-tab ${key==='work'?'active':''}" data-mode="${key}"
            onclick="Pomodoro.setMode('${key}')"
            style="flex:1;padding:8px 4px;border-radius:11px;border:none;cursor:pointer;font-size:.72rem;font-weight:700;transition:all .25s ease;
              background:${key==='work'?'var(--accent)':'transparent'};
              color:${key==='work'?'white':'var(--text3)'}"
          >${m.emoji} ${m.label}</button>`).join('')}
      </div>

      <!-- Ring Timer -->
      <div id="pomo-ring-wrap" style="position:relative;width:220px;height:220px;display:flex;align-items:center;justify-content:center;transition:filter .5s ease">
        <svg width="220" height="220" viewBox="0 0 220 220" style="position:absolute;top:0;left:0">
          <circle cx="110" cy="110" r="${R}" fill="none" stroke="rgba(255,255,255,.06)" stroke-width="10"/>
          <circle id="pomo-ring" cx="110" cy="110" r="${R}"
            fill="none" stroke="var(--accent)" stroke-width="10"
            stroke-linecap="round"
            stroke-dasharray="${C.toFixed(2)}"
            stroke-dashoffset="0"
            style="transform:rotate(-90deg);transform-origin:50% 50%;transition:stroke-dashoffset 1s linear,stroke .5s ease"/>
        </svg>
        <div style="position:relative;z-index:1;text-align:center">
          <div id="pomo-emoji" style="font-size:2rem;margin-bottom:4px">🎯</div>
          <div id="pomo-time" style="font-size:2.6rem;font-weight:900;color:var(--text1);font-variant-numeric:tabular-nums;letter-spacing:-.02em">25:00</div>
          <div id="pomo-label" style="font-size:.72rem;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.1em">تركيز</div>
        </div>
      </div>

      <!-- Controls -->
      <div style="display:flex;gap:14px;align-items:center">
        <button onclick="Pomodoro.reset()" title="إعادة"
          style="width:48px;height:48px;border-radius:50%;border:1.5px solid rgba(255,255,255,.1);background:rgba(255,255,255,.06);font-size:1.2rem;cursor:pointer;transition:all .2s ease"
          onmouseover="this.style.background='rgba(255,255,255,.12)'"
          onmouseout="this.style.background='rgba(255,255,255,.06)'">🔄</button>

        <button id="pomo-play" onclick="Pomodoro.toggle()"
          style="width:68px;height:68px;border-radius:50%;border:none;
            background:linear-gradient(135deg,var(--accent),#818cf8);
            font-size:1.6rem;cursor:pointer;
            box-shadow:0 8px 24px rgba(139,92,246,.4);
            transition:all .2s cubic-bezier(.22,1,.36,1)"
          onmouseover="this.style.transform='scale(1.08)'"
          onmouseout="this.style.transform='scale(1)'">▶</button>

        <button onclick="Pomodoro.skip()" title="تخطي"
          style="width:48px;height:48px;border-radius:50%;border:1.5px solid rgba(255,255,255,.1);background:rgba(255,255,255,.06);font-size:1.2rem;cursor:pointer;transition:all .2s ease"
          onmouseover="this.style.background='rgba(255,255,255,.12)'"
          onmouseout="this.style.background='rgba(255,255,255,.06)'">⏭</button>
      </div>

      <!-- Session Dots -->
      <div style="text-align:center">
        <div style="font-size:.68rem;color:var(--text3);font-weight:600;margin-bottom:8px">جلسات الدورة الحالية (4)</div>
        <div id="pomo-dots" style="display:flex;gap:8px;justify-content:center"></div>
      </div>

      <!-- Stats Row -->
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;width:100%;max-width:340px">
        <div style="padding:14px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:16px;text-align:center">
          <div id="pomo-sessions-count" style="font-size:1.3rem;font-weight:900;color:var(--accent)">${state.sessions}</div>
          <div style="font-size:.65rem;color:var(--text3);font-weight:600;margin-top:2px">جلسات مكتملة</div>
        </div>
        <div style="padding:14px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:16px;text-align:center">
          <div id="pomo-focus-min" style="font-size:1.3rem;font-weight:900;color:#10b981">${totalMin}</div>
          <div style="font-size:.65rem;color:var(--text3);font-weight:600;margin-top:2px">دقيقة تركيز</div>
        </div>
      </div>

      <!-- Tips -->
      <div style="padding:14px 16px;background:rgba(59,130,246,.07);border:1px solid rgba(59,130,246,.15);border-radius:16px;width:100%;max-width:340px">
        <div style="font-size:.72rem;font-weight:700;color:#60a5fa;margin-bottom:6px">💡 تقنية بومودورو</div>
        <div style="font-size:.75rem;color:var(--text3);line-height:1.6">
          25 دقيقة تركيز كامل ← استراحة 5 دقائق.<br>
          كل 4 جلسات استراحة طويلة 15 دقيقة.
        </div>
      </div>

    </div>`;
  }

  return { toggle, reset, skip, setMode, init };
})();
