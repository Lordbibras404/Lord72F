/* ============================================================
   GRIT Learn v9.1 — رفع صورة الحساب من الهاتف (Fixed)
   ============================================================ */
'use strict';

function openAvatarPicker() {
  const input = document.getElementById('avatarFileInput');
  if (input) input.click();
}

function handleAvatarFile(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  if (!file.type.startsWith('image/')) { showToast('يرجى اختيار صورة صالحة ⚠️', 'warning'); return; }
  if (file.size > 3 * 1024 * 1024)    { showToast('الصورة كبيرة جداً (الحد 3MB) ⚠️', 'warning'); return; }
  const reader = new FileReader();
  reader.onload  = (e) => compressImage(e.target.result, 200, 200, 0.8, applyAvatar);
  reader.onerror = ()  => showToast('فشل قراءة الصورة ❌', 'error');
  reader.readAsDataURL(file);
  event.target.value = '';
}

function compressImage(dataURL, maxW, maxH, quality, callback) {
  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement('canvas');
    let { width, height } = img;
    const ratio = Math.min(maxW / width, maxH / height);
    width  = Math.round(width  * ratio);
    height = Math.round(height * ratio);
    canvas.width = width; canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.arc(width/2, height/2, Math.min(width,height)/2, 0, Math.PI*2);
    ctx.closePath(); ctx.clip();
    ctx.drawImage(img, 0, 0, width, height);
    callback(canvas.toDataURL('image/jpeg', quality));
  };
  img.onerror = () => callback(dataURL);
  img.src = dataURL;
}

function applyAvatar(dataURL) {
  const st = loadState();
  st.avatar = dataURL;
  st.hasCustomAvatar = true;
  saveState(st);
  refreshAllAvatars(dataURL);
  if (typeof checkAndAwardBadges === 'function') checkAndAwardBadges(st);
  showToast('تم تحديث صورة حسابك! 📸', 'success');
}

function refreshAllAvatars(src) {
  const st  = loadState();
  const ids = ['profileAvatar','homeAvatar','lbMyAvatar','profileAvatarMain','homeAvatarBtn','navProfileIcon'];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    if (src) el.innerHTML = `<img src="${src}" alt="avatar" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
    else     el.textContent = (st.name?.[0] || 'ط').toUpperCase();
  });
}

function removeAvatar() {
  const st = loadState();
  st.avatar = null;
  st.hasCustomAvatar = false;
  saveState(st);
  refreshAllAvatars(null);
  showToast('تم حذف الصورة 🗑', 'info');
}

function initAvatars() {
  const st = loadState();
  if (st.avatar) refreshAllAvatars(st.avatar);
}
