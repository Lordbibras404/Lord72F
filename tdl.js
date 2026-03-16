/* ============================================================
   GRIT Learn v9.1 — TDL (To-Do List) — Fixed
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

/* ══ تبديل حالة المهمة ══ */
function toggleTask(id) {
  const st   = loadState();
  const task = (st.tasks || []).find(t => t.id === id);
  if (!task) return;
  task.done = !task.done;
  if (task.done) {
    st.tasksCompleted = (st.tasksCompleted || 0) + 1;
    addXpToState(st, XP_REWARDS.tdl_task || 15);
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
}

/* ══ عرض المهام ══ */
function renderTasks() {
  const container = document.getElementById('tasksList');
  if (!container) return;
  const st = loadState();
  const tasks = st.tasks || [];

  let filtered = tasks;
  if (tdlFilter === 'pending') filtered = filtered.filter(t => !t.done);
  if (tdlFilter === 'done')    filtered = filtered.filter(t => t.done);
  if (tdlFilter !== 'all' && tdlFilter !== 'pending' && tdlFilter !== 'done')
    filtered = filtered.filter(t => t.subject === tdlFilter);

  const total   = tasks.length;
  const done    = tasks.filter(t => t.done).length;

  const el  = document.getElementById('tdlCountDone');
  const el2 = document.getElementById('tdlCountTotal');
  if (el)  el.textContent  = done;
  if (el2) el2.textContent = total;

  if (!filtered.length) {
    container.innerHTML = `
      <div style="text-align:center;padding:32px 16px;color:var(--text3)">
        <div style="font-size:2.5rem;margin-bottom:8px">📋</div>
        <div style="font-size:.9rem;font-weight:700">لا توجد مهام</div>
        <div style="font-size:.8rem;margin-top:4px">أضف مهمة جديدة للبدء</div>
      </div>`;
    return;
  }

  container.innerHTML = filtered.map(task => {
    const subj = SUBJECTS[task.subject];
    return `
      <div class="task-item prio-${task.priority} ${task.done ? 'done' : ''}">
        <div class="task-check ${task.done ? 'checked' : ''}"
          onclick="toggleTask(${task.id})">${task.done ? '✓' : ''}</div>
        <div class="task-body">
          <div class="task-title">${task.title}</div>
          <div class="task-meta">
            ${subj ? `<span class="task-subj" style="background:${subj.c}22;color:${subj.c}">${subj.i} ${subj.n}</span>` : ''}
            <span class="task-due">${_tdlFormatDate(task.createdAt)}</span>
          </div>
        </div>
        <button class="task-delete" onclick="deleteTask(${task.id})">🗑</button>
      </div>`;
  }).join('');
}

/* ══ فلترة المهام ══ */
function setTdlFilter(f, btn) {
  tdlFilter = f;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderTasks();
}

/* ══ نموذج إضافة مهمة ══ */
function showAddTaskModal() {
  const title = prompt('اسم المهمة:');
  if (!title) return;
  const subjects = Object.entries(SUBJECTS).map(([k, v]) => `${k}: ${v.i} ${v.n}`).join('\n');
  const subjInput = prompt(`المادة (اكتب الرمز):\n${subjects}\nأو اتركه فارغاً`);
  const subjKey = Object.keys(SUBJECTS).includes(subjInput) ? subjInput : 'general';
  addTask(title, subjKey);
}

/* ══ تنسيق التاريخ ══ */
function _tdlFormatDate(isoStr) {
  try {
    return new Date(isoStr).toLocaleDateString('ar-DZ', { month:'short', day:'numeric' });
  } catch { return ''; }
}

/* ══ تهيئة ══ */
function initTdl() {
  renderTasks();
}
