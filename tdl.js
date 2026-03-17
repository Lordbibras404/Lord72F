/* ============================================================
   GRIT Learn v9.1 — TDL (To-Do List) — Fixed v2
   إصلاح: IDs صحيحة + حفظ سليم + toggle يعمل + modal حقيقي
   ============================================================ */
'use strict';

let tdlFilter = 'all';

/* ══ إضافة مهمة ══ */
function addTask(title, subject, priority) {
  priority = priority || 'medium';
  if (!title || !title.trim()) return;
  const st = loadState();
  if (!st.tasks) st.tasks = [];
  st.tasks.unshift({
    id: Date.now(),
    title: title.trim(),
    subject: subject || 'general',
    priority,
    done: false,
    createdAt: new Date().toISOString(),
  });
  saveState(st);
  renderTasks();
  showToast('تمت إضافة المهمة ✅', 'success');
}

/* ══ تبديل حالة المهمة (toggle) ══ */
function toggleTask(id) {
  const st   = loadState();
  if (!st.tasks) st.tasks = [];
  const task = st.tasks.find(t => t.id === id);
  if (!task) return;

  task.done = !task.done;

  if (task.done) {
    st.tasksCompleted = (st.tasksCompleted || 0) + 1;
    if (typeof addXpToState === 'function') {
      addXpToState(st, (typeof XP_REWARDS !== 'undefined' && XP_REWARDS.tdl_task) || 15);
    }
    showToast('أحسنت! مهمة مكتملة 🎉', 'success');
    if (typeof checkAndAwardBadges === 'function') checkAndAwardBadges(st);
  }

  saveState(st);
  renderTasks();
}

/* ══ حذف مهمة ══ */
function deleteTask(id) {
  const st  = loadState();
  st.tasks  = (st.tasks || []).filter(t => t.id !== id);
  saveState(st);
  renderTasks();
  showToast('تم حذف المهمة 🗑', 'info');
}

/* ══ عرض المهام — FIX: id="tdlList" ══ */
function renderTasks() {
  /* FIX: الـ HTML يستخدم id="tdlList" وليس id="tasksList" */
  const container = document.getElementById('tdlList');
  const emptyEl   = document.getElementById('tdlEmpty');
  if (!container) return;

  const st    = loadState();
  const tasks = st.tasks || [];

  /* --- فلترة --- */
  let filtered = [...tasks];
  if (tdlFilter === 'pending')      filtered = filtered.filter(t => !t.done);
  else if (tdlFilter === 'done')    filtered = filtered.filter(t => t.done);
  else if (tdlFilter !== 'all')     filtered = filtered.filter(t => t.subject === tdlFilter);

  /* --- إحصائيات --- */
  const total = tasks.length;
  const done  = tasks.filter(t => t.done).length;
  const pct   = total ? Math.round((done / total) * 100) : 0;

  const doneCountEl = document.getElementById('tdlDoneCount');
  if (doneCountEl) doneCountEl.textContent = done + '/' + total + ' مكتمل';

  const progFill  = document.getElementById('tdlProgFill');
  const progLabel = document.getElementById('tdlProgLabel');
  if (progFill)  progFill.style.width  = pct + '%';
  if (progLabel) progLabel.textContent = pct + '%';

  /* --- عرض فارغ --- */
  if (!filtered.length) {
    if (emptyEl) emptyEl.style.display = 'flex';
    container.querySelectorAll('.tdl-item').forEach(el => el.remove());
    return;
  }
  if (emptyEl) emptyEl.style.display = 'none';

  /* --- fallback subjects --- */
  const fallbackSubjects = {
    math:       { c:'#6c63ff', i:'📐', n:'رياضيات' },
    physics:    { c:'#3b82f6', i:'⚡', n:'فيزياء'  },
    arabic:     { c:'#10b981', i:'📖', n:'عربية'   },
    history:    { c:'#f59e0b', i:'🏛',  n:'تاريخ'   },
    english:    { c:'#8b5cf6', i:'🇬🇧', n:'إنجليزية'},
    french:     { c:'#ec4899', i:'🇫🇷', n:'فرنسية'  },
    islamic:    { c:'#059669', i:'☪️',  n:'إسلامية' },
    philosophy: { c:'#7c3aed', i:'🧠',  n:'فلسفة'   },
    science:    { c:'#0891b2', i:'🧬',  n:'علوم'    },
    chemistry:  { c:'#dc2626', i:'🧪',  n:'كيمياء'  },
    economics:  { c:'#d97706', i:'📊',  n:'اقتصاد'  },
    general:    { c:'#6b7280', i:'📌',  n:'عامة'    },
  };

  const getSubj = (key) => {
    if (typeof SUBJECTS !== 'undefined' && SUBJECTS[key]) return SUBJECTS[key];
    return fallbackSubjects[key] || fallbackSubjects['general'];
  };

  /* احذف العناصر القديمة */
  container.querySelectorAll('.tdl-item').forEach(el => el.remove());

  filtered.forEach(task => {
    const subj = getSubj(task.subject);
    const div  = document.createElement('div');
    div.className = 'tdl-item' + (task.done ? ' done' : '');
    div.dataset.id = task.id;
    div.innerHTML =
      '<div class="tdl-item-check ' + (task.done ? 'checked' : '') + '"' +
      ' onclick="toggleTask(' + task.id + ')">' +
      (task.done ? '✓' : '') +
      '</div>' +
      '<div class="tdl-item-body">' +
        '<div class="tdl-item-title">' + _escHtml(task.title) + '</div>' +
        '<div class="tdl-item-meta">' +
          '<span class="tdl-item-subj"' +
          ' style="background:' + subj.c + '22;color:' + subj.c + ';border:1px solid ' + subj.c + '44">' +
          subj.i + ' ' + subj.n +
          '</span>' +
          '<span class="tdl-item-date">' + _tdlFormatDate(task.createdAt) + '</span>' +
        '</div>' +
      '</div>' +
      '<button class="tdl-item-delete" onclick="deleteTask(' + task.id + ')" title="حذف">🗑</button>';
    container.appendChild(div);
  });
}

/* ══ فلترة المهام — FIX: class صحيح من HTML ══ */
function setTdlFilter(f, btn) {
  tdlFilter = f;
  /* FIX: HTML يستخدم .tdl-cat-tab وليس .filter-btn */
  document.querySelectorAll('.tdl-cat-tab').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderTasks();
}

/* ══ نموذج إضافة مهمة — Modal حقيقي بدل prompt() ══ */
function showAddTaskModal() {
  const inputEl = document.getElementById('tdlInput');
  const title   = inputEl ? inputEl.value.trim() : '';
  _openTdlModal(title);
}

function _openTdlModal(prefillTitle) {
  const old = document.getElementById('tdlAddModal');
  if (old) old.remove();

  const subjects = [
    { k:'math',       i:'📐', n:'رياضيات' },
    { k:'physics',    i:'⚡', n:'فيزياء'  },
    { k:'arabic',     i:'📖', n:'عربية'   },
    { k:'history',    i:'🏛',  n:'تاريخ'   },
    { k:'english',    i:'🇬🇧', n:'إنجليزية'},
    { k:'french',     i:'🇫🇷', n:'فرنسية'  },
    { k:'islamic',    i:'☪️',  n:'إسلامية' },
    { k:'philosophy', i:'🧠',  n:'فلسفة'   },
    { k:'science',    i:'🧬',  n:'علوم'    },
    { k:'chemistry',  i:'🧪',  n:'كيمياء'  },
    { k:'economics',  i:'📊',  n:'اقتصاد'  },
    { k:'general',    i:'📌',  n:'عامة'    },
  ];

  const modal = document.createElement('div');
  modal.id = 'tdlAddModal';
  modal.style.cssText =
    'position:fixed;inset:0;z-index:9999;display:flex;align-items:flex-end;' +
    'justify-content:center;background:rgba(0,0,0,0.55);backdrop-filter:blur(4px);';

  const subjGridHtml = subjects.map(s =>
    '<div class="tdl-subj-opt" data-key="' + s.k + '" onclick="_tdlSelectSubj(this)"' +
    ' style="padding:10px 6px;border-radius:12px;border:2px solid var(--border);' +
    'background:var(--surface2);text-align:center;cursor:pointer;' +
    'transition:all .18s;font-size:11px;font-weight:800;color:var(--text2);">' +
    '<div style="font-size:18px;margin-bottom:4px">' + s.i + '</div>' +
    s.n + '</div>'
  ).join('');

  modal.innerHTML =
    '<div id="tdlAddSheet" style="background:var(--surface);border-radius:24px 24px 0 0;' +
    'padding:0 16px calc(24px + env(safe-area-inset-bottom));width:100%;max-width:520px;' +
    'max-height:88vh;overflow-y:auto;animation:slideInFromBottom 0.35s cubic-bezier(0.34,1.56,0.64,1) both;">' +
    '<div style="width:40px;height:4px;background:var(--border2);border-radius:99px;margin:14px auto 20px;"></div>' +
    '<div style="font-size:17px;font-weight:900;color:var(--text);margin-bottom:16px;text-align:center">➕ مهمة جديدة</div>' +
    '<input id="tdlModalTitle" type="text" maxlength="100" placeholder="اسم المهمة..."' +
    ' value="' + _escHtml(prefillTitle || '') + '"' +
    ' style="width:100%;box-sizing:border-box;padding:13px 15px;border-radius:13px;' +
    'border:2px solid var(--border);background:var(--surface2);color:var(--text);' +
    'font-family:Cairo,sans-serif;font-size:14px;font-weight:700;outline:none;margin-bottom:16px;' +
    'transition:border-color .2s;" onfocus="this.style.borderColor=\'var(--accent)\'"' +
    ' onblur="this.style.borderColor=\'var(--border)\'" onkeydown="if(event.key===\'Enter\')_confirmAddTask()">' +
    '<div style="font-size:12px;font-weight:900;color:var(--text3);margin-bottom:10px">اختر المادة</div>' +
    '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:20px">' +
    subjGridHtml + '</div>' +
    '<div style="display:flex;gap:10px;">' +
    '<button onclick="_tdlCloseModal()" style="flex:1;padding:13px;border-radius:13px;' +
    'border:2px solid var(--border);background:var(--surface2);color:var(--text2);' +
    'font-family:Cairo,sans-serif;font-size:14px;font-weight:900;cursor:pointer;">إلغاء</button>' +
    '<button onclick="_confirmAddTask()" style="flex:2;padding:13px;border-radius:13px;' +
    'border:none;background:linear-gradient(135deg,#6c63ff,#a855f7);color:#fff;' +
    'font-family:Cairo,sans-serif;font-size:14px;font-weight:900;cursor:pointer;' +
    'box-shadow:0 4px 16px rgba(108,99,255,.35);">✅ إضافة المهمة</button>' +
    '</div></div>';

  window._tdlSelectedSubj = 'general';

  modal.addEventListener('click', function(e) {
    if (e.target === modal) _tdlCloseModal();
  });

  document.body.appendChild(modal);

  setTimeout(function() {
    const inp = document.getElementById('tdlModalTitle');
    if (inp) inp.focus();
  }, 300);
}

function _tdlSelectSubj(el) {
  document.querySelectorAll('.tdl-subj-opt').forEach(function(b) {
    b.style.borderColor = 'var(--border)';
    b.style.background  = 'var(--surface2)';
    b.style.color       = 'var(--text2)';
    b.style.transform   = '';
  });
  el.style.borderColor = 'var(--accent)';
  el.style.background  = 'rgba(108,99,255,0.10)';
  el.style.color       = 'var(--accent)';
  el.style.transform   = 'scale(1.04)';
  window._tdlSelectedSubj = el.dataset.key;
}

function _confirmAddTask() {
  const titleEl = document.getElementById('tdlModalTitle');
  const title   = titleEl ? titleEl.value.trim() : '';
  if (!title) {
    if (titleEl) { titleEl.style.borderColor = '#dc2626'; titleEl.focus(); }
    return;
  }
  const subj = window._tdlSelectedSubj || 'general';
  _tdlCloseModal();
  addTask(title, subj, 'medium');
  const mainInput = document.getElementById('tdlInput');
  if (mainInput) mainInput.value = '';
}

function _tdlCloseModal() {
  const modal = document.getElementById('tdlAddModal');
  if (modal) modal.remove();
}

/* ══ تنسيق التاريخ ══ */
function _tdlFormatDate(isoStr) {
  try {
    return new Date(isoStr).toLocaleDateString('ar-DZ', { month:'short', day:'numeric' });
  } catch(e) { return ''; }
}

/* ══ escape HTML ══ */
function _escHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/* ══ تهيئة ══ */
function initTdl() {
  renderTasks();
}
