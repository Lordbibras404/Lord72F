/* ============================================================
   GRIT Learn v9.1 — Summaries Module (إصلاح كامل)
   متوافق مع HTML v9.1 IDs: summGrid, summReaderView, etc.
   ============================================================ */
'use strict';

/* ══ ميتادات المواد ══ */
const SUBJ_META = {
  math:       { name:'الرياضيات',        icon:'📐', color:'#6c63ff' },
  physics:    { name:'الفيزياء',          icon:'⚡', color:'#3b82f6' },
  arabic:     { name:'اللغة العربية',    icon:'📖', color:'#10b981' },
  history:    { name:'التاريخ والجغرافيا',icon:'🏛', color:'#f59e0b' },
  philosophy: { name:'الفلسفة',           icon:'🧠', color:'#8b5cf6' },
  science:    { name:'علوم طبيعية',       icon:'🧬', color:'#06b6d4' },
  chemistry:  { name:'الكيمياء',          icon:'🧪', color:'#f97316' },
  economics:  { name:'الاقتصاد',          icon:'📊', color:'#84cc16' },
  english:    { name:'الإنجليزية',        icon:'🇬🇧', color:'#ef4444' },
  french:     { name:'الفرنسية',          icon:'🇫🇷', color:'#a855f7' },
  islamic:    { name:'التربية الإسلامية', icon:'☪️',  color:'#059669' },
};

let _summFilter  = 'all';
let _summSearch  = '';
let _currentLesson = null;

/* ══ الحصول على كل الدروس ══ */
function _getAllLessons() {
  if (typeof LESSON_CONTENT === 'undefined') return [];
  const all = [];
  Object.entries(LESSON_CONTENT).forEach(([subj, arr]) => {
    (arr || []).forEach(lesson => {
      all.push({ ...lesson, subj: subj });
    });
  });
  return all;
}

/* ══ الدالة الرئيسية — تُستدعى من _onShow ══ */
function renderSummaries() {
  const all = _getAllLessons();

  // تحديث العداد
  const chip = document.getElementById('summCountChip');
  if (chip) chip.textContent = all.length + ' درس';

  // إظهار قسم القائمة وإخفاء القارئ
  const listView   = document.getElementById('summListView');
  const readerView = document.getElementById('summReaderView');
  if (listView)   listView.style.display   = 'block';
  if (readerView) readerView.style.display = 'none';

  _renderGrid();
}

/* ══ رسم الشبكة ══ */
function _renderGrid() {
  const grid = document.getElementById('summGrid');
  if (!grid) return;

  const all = _getAllLessons();
  const filtered = all.filter(lesson => {
    const matchSubj   = _summFilter === 'all' || lesson.subj === _summFilter;
    const matchSearch = !_summSearch ||
      lesson.title.includes(_summSearch) ||
      (lesson.content || '').includes(_summSearch);
    return matchSubj && matchSearch;
  });

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:40px 16px;color:var(--text4)">
        <div style="font-size:40px;margin-bottom:8px">🔍</div>
        <div style="font-weight:800;font-size:14px">لا توجد دروس مطابقة</div>
        <div style="font-size:12px;margin-top:4px">جرب كلمة بحث مختلفة</div>
      </div>`;
    return;
  }

  grid.innerHTML = filtered.map((lesson, i) => {
    const meta   = SUBJ_META[lesson.subj] || { name: lesson.subj, icon:'📄', color:'#6c63ff' };
    const diffBg = lesson.diff === 'easy' ? '#10b98118' : lesson.diff === 'medium' ? '#f59e0b18' : '#ef444418';
    const diffTx = lesson.diff === 'easy' ? '#059669'   : lesson.diff === 'medium' ? '#d97706'   : '#dc2626';
    const diffNm = lesson.diff === 'easy' ? 'سهل'       : lesson.diff === 'medium' ? 'متوسط'      : 'صعب';
    const preview = (lesson.content || '').replace(/##|###|\*\*|`|\||-{3,}/g,'').substring(0,80) + '...';

    return `
      <div class="summ-card" onclick="openSummLesson(${i})"
        style="animation-delay:${i * 40}ms">
        <div class="summ-card-top" style="background:linear-gradient(135deg,${meta.color}18,${meta.color}08)">
          <div class="summ-card-icon" style="color:${meta.color}">${meta.icon}</div>
          <div class="summ-card-badges">
            <span style="font-size:10px;font-weight:800;padding:2px 8px;border-radius:999px;background:${diffBg};color:${diffTx}">${diffNm}</span>
          </div>
        </div>
        <div class="summ-card-body">
          <div class="summ-card-subj" style="color:${meta.color}">${meta.icon} ${meta.name}</div>
          <div class="summ-card-title">${lesson.title}</div>
          <div class="summ-card-preview">${preview}</div>
        </div>
        <div class="summ-card-footer">
          <span style="font-size:11px;color:var(--text4)">اقرأ الدرس</span>
          <span style="color:var(--accent);font-size:14px">‹</span>
        </div>
      </div>`;
  }).join('');

  // نحفظ الدروس المفلترة للرجوع إليها عند الفتح
  window._filteredLessons = filtered;
}

/* ══ فتح درس ══ */
function openSummLesson(idx) {
  const lessons = window._filteredLessons || _getAllLessons();
  const lesson  = lessons[idx];
  if (!lesson) return;
  _currentLesson = lesson;

  const listView   = document.getElementById('summListView');
  const readerView = document.getElementById('summReaderView');
  if (listView)   listView.style.display   = 'none';
  if (readerView) {
    readerView.style.display = 'flex';
    readerView.style.animation = 'slideInRight 0.25s ease both';
  }

  const meta = SUBJ_META[lesson.subj] || { name: lesson.subj, icon:'📄', color:'#6c63ff' };

  // تحديث الهيدر
  const titleEl = document.getElementById('summReaderTitle');
  if (titleEl) titleEl.textContent = lesson.title;

  // تحديث المحتوى
  const bigTitle = document.getElementById('summReaderBigTitle');
  const metaEl   = document.getElementById('summReaderMeta');
  const bodyEl   = document.getElementById('summReaderBody');

  if (bigTitle) bigTitle.textContent = lesson.title;
  if (metaEl)   metaEl.innerHTML = `
    <span style="color:${meta.color}">${meta.icon} ${meta.name}</span>
    <span style="color:var(--text4)">·</span>
    <span style="color:${lesson.diff==='easy'?'#059669':lesson.diff==='medium'?'#d97706':'#dc2626'}">
      ${lesson.diff==='easy'?'سهل':lesson.diff==='medium'?'متوسط':'صعب'}
    </span>`;
  if (bodyEl)   bodyEl.innerHTML = _renderMarkdown(lesson.content || '');
}

/* ══ إغلاق القارئ ══ */
function closeSummReader() {
  const listView   = document.getElementById('summListView');
  const readerView = document.getElementById('summReaderView');
  if (readerView) readerView.style.display = 'none';
  if (listView)   listView.style.display   = 'block';
  _currentLesson = null;
}

/* ══ شرح الدرس بالذكاء الاصطناعي ══ */
function aiExplainSumm() {
  if (!_currentLesson) return;
  const prompt = 'اشرح لي درس: ' + _currentLesson.title;
  showScreen('aiScreen');
  setTimeout(() => {
    const inp = document.getElementById('aiTextInput');
    if (inp) { inp.value = prompt; }
    if (typeof sendAiMsg === 'function') sendAiMsg();
    else if (typeof aiQuickPrompt === 'function') aiQuickPrompt(prompt);
  }, 300);
}

/* ══ مشاركة الدرس ══ */
function shareSumm() {
  if (!_currentLesson) return;
  const text = 'درس: ' + _currentLesson.title + '\n' + window.location.href;
  if (navigator.share) {
    navigator.share({ title: _currentLesson.title, text: text }).catch(() => {});
  } else if (window.Telegram?.WebApp) {
    window.Telegram.WebApp.showPopup({ message: 'تمت المشاركة!' });
  }
}

/* ══ فلتر المواد ══ */
function filterSummSubj(btn, subj) {
  _summFilter = subj;
  document.querySelectorAll('.summ-filter-tab').forEach(t => t.classList.remove('active'));
  if (btn) btn.classList.add('active');
  _renderGrid();
}

/* ══ البحث ══ */
function filterSummaries(query) {
  _summSearch = (query || '').trim();
  _renderGrid();
}

/* ══ تحويل Markdown بسيط إلى HTML ══ */
function _renderMarkdown(md) {
  if (!md) return '';
  return md
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    // Headers
    .replace(/^### (.+)$/gm, '<h3 style="font-size:14px;font-weight:900;color:var(--text);margin:16px 0 6px">$1</h3>')
    .replace(/^## (.+)$/gm,  '<h2 style="font-size:16px;font-weight:900;color:var(--accent);margin:20px 0 8px;padding-bottom:6px;border-bottom:1px solid var(--border)">$1</h2>')
    .replace(/^# (.+)$/gm,   '<h1 style="font-size:18px;font-weight:900;color:var(--text);margin:0 0 12px">$1</h1>')
    // Bold & Italic
    .replace(/\*\*(.+?)\*\*/g, '<strong style="font-weight:900;color:var(--text)">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Code
    .replace(/`([^`]+)`/g, '<code style="font-family:monospace;background:var(--surface2);padding:1px 5px;border-radius:4px;font-size:12px">$1</code>')
    // Table (simple)
    .replace(/^\|(.+)\|$/gm, (m) => {
      const cells = m.split('|').filter(c => c.trim() && !c.match(/^[-: ]+$/));
      if (!cells.length) return m;
      const isHeader = m.includes('---');
      if (isHeader) return '';
      const tag = 'td';
      return '<tr>' + cells.map(c => `<${tag} style="padding:6px 10px;border:1px solid var(--border);font-size:12px">${c.trim()}</${tag}>`).join('') + '</tr>';
    })
    .replace(/((<tr>.+<\/tr>\n?)+)/g, '<table style="width:100%;border-collapse:collapse;margin:10px 0;font-size:12px">$1</table>')
    // Lists
    .replace(/^- (.+)$/gm, '<li style="margin:3px 0;padding-right:4px">$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li style="margin:3px 0;padding-right:4px;list-style-type:decimal">$2</li>')
    .replace(/(<li[^>]*>.+<\/li>\n?)+/g, m => `<ul style="padding-right:20px;margin:8px 0">${m}</ul>`)
    // Horizontal rule
    .replace(/^---$/gm, '<hr style="border:none;border-top:1px solid var(--border);margin:14px 0">')
    // Formulas ($$...$$)
    .replace(/\$\$(.+?)\$\$/g, '<div style="text-align:center;padding:8px;background:var(--surface2);border-radius:8px;font-family:monospace;font-size:13px;margin:8px 0">$1</div>')
    // Line breaks
    .replace(/\n\n/g, '</p><p style="margin:8px 0">')
    .replace(/\n/g, '<br>');
}

/* ══ CSS للكروت ══ */
(function injectSummCSS() {
  if (document.getElementById('summ-styles')) return;
  const style = document.createElement('style');
  style.id = 'summ-styles';
  style.textContent = `
    .summaries-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(155px, 1fr));
      gap: 10px;
      padding: 12px 12px 80px;
    }
    .summ-card {
      background: var(--surface);
      border: 1.5px solid var(--border);
      border-radius: 16px;
      overflow: hidden;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.34,1.56,0.64,1);
      animation: cardEnter 0.4s ease both;
      display: flex;
      flex-direction: column;
    }
    .summ-card:active { transform: scale(0.96); }
    .summ-card-top {
      padding: 14px 12px 10px;
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
    }
    .summ-card-icon { font-size: 24px; }
    .summ-card-body { padding: 0 12px 8px; flex: 1; }
    .summ-card-subj { font-size: 10px; font-weight: 800; margin-bottom: 4px; }
    .summ-card-title { font-size: 12px; font-weight: 900; color: var(--text); line-height: 1.4; }
    .summ-card-preview { font-size: 10px; color: var(--text4); margin-top: 4px; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .summ-card-footer { padding: 6px 12px 10px; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border); }
    .summary-reader { display: none; flex-direction: column; position: absolute; inset: 0; background: var(--bg); z-index: 10; overflow: hidden; }
    .summary-reader-content { flex: 1; overflow-y: auto; -webkit-overflow-scrolling: touch; padding: 16px; padding-bottom: calc(var(--nav-h) + 24px + env(safe-area-inset-bottom)); min-height: 0; }
    .summary-content-title { font-size: 20px; font-weight: 900; color: var(--text); margin-bottom: 8px; }
    .summary-content-meta { font-size: 12px; font-weight: 700; display: flex; gap: 8px; margin-bottom: 16px; }
    .summary-content-body { font-size: 13px; line-height: 1.7; color: var(--text2); direction: rtl; }
    @keyframes slideInRight {
      from { opacity:0; transform: translateX(30px); }
      to   { opacity:1; transform: translateX(0); }
    }
  `;
  document.head.appendChild(style);
})();
