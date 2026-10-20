/* Tabi Note — เก็บข้อมูลในเครื่อง (localStorage)
 * ขั้นถัดไป: sync ขึ้น Google Sheet / Drive ผ่าน Apps Script
 */
'use strict';

const STORE_KEY = 'tabinote.state.v1';
const PHOTO_KEY = 'tabinote.photos.v1';

const clone = o => JSON.parse(JSON.stringify(o));

function loadState() {
  try {
    const s = JSON.parse(localStorage.getItem(STORE_KEY));
    if (s && s.v === SEED.v && Array.isArray(s.days)) return { ...clone(SEED), ...s };
  } catch (e) { console.warn('[store] reset', e); }
  return clone(SEED);
}

function saveState(opts = {}) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
    if (typeof mergePlaces === 'function') mergePlaces();
    if (!opts.localOnly && typeof schedulePush === 'function') schedulePush();
    return true;
  }
  catch (e) { console.error('[store]', e); toast(t('save_fail')); return false; }
}

function resetState() {
  localStorage.removeItem(STORE_KEY);
  state = clone(SEED);
  saveState();
}

function loadPhotos() {
  try { return JSON.parse(localStorage.getItem(PHOTO_KEY)) || {}; } catch (e) { return {}; }
}
function savePhotos(p) {
  try { localStorage.setItem(PHOTO_KEY, JSON.stringify(p)); return true; }
  catch (e) { toast(t('photo_full')); return false; }
}

const uid = p => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
