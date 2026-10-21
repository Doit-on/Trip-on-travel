/* Tabi Note — เชื่อม Google (Apps Script → Sheet / Drive / Gemini)
 * - ซิงก์ทริปอัตโนมัติ (ส่งขึ้นหลังแก้ไข 1.5 วิ, ดึงลงตอนเปิดแอป)
 * - ถ้าคนอื่นแก้ทริปเดียวกันพร้อมกัน → รวมข้อมูล (ค่าใช้จ่าย/โรงแรม/สถานที่ที่สร้างเอง รวมตาม id)
 * - รูป: อัปขึ้น Drive แล้วเก็บเป็นลิงก์แทนไฟล์ในเครื่อง
 * - ฐานข้อมูลสถานที่: data.js < ชีต Places < สถานที่ที่ผู้ใช้สร้างเอง
 * ใช้ได้แม้ยังไม่เชื่อม (ทุกอย่างทำงานในเครื่องตามปกติ)
 */
'use strict';

const CLOUD_KEY = 'tabinote.cloud.v1';
const SHEET_PLACES_KEY = 'tabinote.sheetplaces.v1';
const BASE_PLACES = { ...PLACES };
const SHARED_FIELDS = ['trip', 'days', 'hotels', 'restaurants', 'expenses', 'budget', 'customPlaces'];

let CLOUD = (() => {
  try { return { url:'', key:'', tripId:'', by:'', lastSync:0, dirty:false, ai:false, ...JSON.parse(localStorage.getItem(CLOUD_KEY) || '{}') }; }
  catch (e) { return { url:'', key:'', tripId:'', by:'', lastSync:0, dirty:false, ai:false }; }
})();
const saveCloud = () => localStorage.setItem(CLOUD_KEY, JSON.stringify(CLOUD));
const cloudOn = () => !!(CLOUD.url && CLOUD.key && CLOUD.tripId);

/* ---------- places merge ---------- */
function mergePlaces() {
  let sheet = {};
  try { sheet = JSON.parse(localStorage.getItem(SHEET_PLACES_KEY) || '{}'); } catch (e) { sheet = {}; }
  for (const k of Object.keys(PLACES)) delete PLACES[k];
  Object.assign(PLACES, BASE_PLACES, sheet, (typeof state !== 'undefined' && state.customPlaces) || {});
}

/* ---------- API ---------- */
async function api(action, data = {}, ms = 25000) {
  if (!CLOUD.url) throw new Error('not_connected');
  const ctl = new AbortController(), timer = setTimeout(() => ctl.abort(), ms);
  try {
    // ส่งเป็น text/plain เพื่อไม่ให้เบราว์เซอร์ทำ CORS preflight (Apps Script ไม่รองรับ OPTIONS)
    const r = await fetch(CLOUD.url, { method:'POST', body: JSON.stringify({ action, key: CLOUD.key, tripId: CLOUD.tripId, by: CLOUD.by, ...data }), signal: ctl.signal, redirect:'follow' });
    const j = await r.json();
    if (!j.ok) throw new Error(j.error || 'error');
    return j;
  } catch (e) {
    throw new Error(e.name === 'AbortError' ? 'timeout' : e.message);
  } finally { clearTimeout(timer); }
}

/* ---------- sync status badge ---------- */
let syncState = 'off', syncMsg = '';
function setSync(s, msg = '') {
  syncState = s; syncMsg = msg;
  document.querySelectorAll('.sync-dot').forEach(el => { el.className = 'sync-dot s-' + s; el.title = t('sync_' + s) + (msg ? ' · ' + msg : ''); });
}
const syncDotHtml = () => cloudOn() ? `<button class="sync-dot s-${syncState}" title="${t('sync_' + syncState)}" onclick="openCloud()" aria-label="sync"></button>` : '';

/* ---------- push / pull ---------- */
const sharedState = () => { const o = {}; SHARED_FIELDS.forEach(k => { if (state[k] !== undefined) o[k] = state[k]; }); return o; };
let pushTimer = null, pushing = false;

function schedulePush() {
  if (!cloudOn()) return;
  CLOUD.dirty = true; saveCloud(); setSync('pending');
  clearTimeout(pushTimer); pushTimer = setTimeout(pushNow, 1500);
}

async function pushNow() {
  if (!cloudOn()) return;
  if (pushing) { clearTimeout(pushTimer); pushTimer = setTimeout(pushNow, 1500); return; }
  pushing = true; setSync('busy');
  try {
    for (let attempt = 0; attempt < 3; attempt++) {
      const r = await api('push', { state: sharedState(), base: CLOUD.lastSync });
      if (!r.conflict) { CLOUD.lastSync = r.updatedAt; CLOUD.dirty = false; saveCloud(); setSync('ok'); return; }
      mergeRemote(r.state);                    // คนอื่นแก้มาก่อน → รวมแล้วลองส่งใหม่
      CLOUD.lastSync = r.updatedAt; saveCloud();
      toast(t('sync_merged', { who: r.updatedBy || '?' }));
    }
    throw new Error('conflict_loop');
  } catch (e) { setSync('err', e.message); }
  finally { pushing = false; }
}

async function pullNow(silent = false) {
  if (!cloudOn()) return;
  setSync('busy');
  try {
    const r = await api('pull');
    if (r.state && r.updatedAt > CLOUD.lastSync) {
      if (CLOUD.dirty) { mergeRemote(r.state); CLOUD.lastSync = r.updatedAt; saveCloud(); schedulePush(); }
      else { applyRemote(r.state); CLOUD.lastSync = r.updatedAt; saveCloud(); }
      if (!silent) toast(t('sync_pulled', { who: r.updatedBy || '?' }));
    } else if (!r.state || CLOUD.dirty) {
      schedulePush();                          // ทริปใหม่บน cloud หรือมีของค้างส่ง
    }
    mergeRemotePhotos(r.photos || {});
    if (syncState === 'busy') setSync('ok');
    mergePlaces(); rerender();
  } catch (e) { setSync('err', e.message); }
}

function applyRemote(remote) {
  SHARED_FIELDS.forEach(k => { if (remote[k] !== undefined) state[k] = remote[k]; });
  saveState({ localOnly: true });
}

/** รวมข้อมูล: รายการที่มี id รวมกัน (ของเครื่องนี้ชนะถ้า id ซ้ำ) · ส่วนอื่นใช้ของเครื่องนี้ */
function mergeRemote(remote) {
  const byId = (a = [], b = []) => { const m = new Map(); a.forEach(x => m.set(x.id, x)); b.forEach(x => m.set(x.id, x)); return [...m.values()]; };
  state.expenses = byId(remote.expenses, state.expenses);
  state.hotels = byId(remote.hotels, state.hotels);
  state.restaurants = byId(remote.restaurants, state.restaurants);
  state.customPlaces = { ...(remote.customPlaces || {}), ...(state.customPlaces || {}) };
  saveState({ localOnly: true });
}

function mergeRemotePhotos(remote) {
  let changed = false;
  for (const [pid, urls] of Object.entries(remote)) {
    const list = photos[pid] = photos[pid] || [];
    urls.forEach(u => { if (!list.includes(u)) { list.push(u); changed = true; } });
  }
  if (changed) savePhotos(photos);
}

/* ---------- photos ---------- */
async function uploadPhoto(placeId, dataUrl) {
  if (!cloudOn()) return null;
  try { const r = await api('photo', { placeId, dataUrl }, 60000); return r.url; }
  catch (e) { console.warn('[photo]', e.message); return null; }
}
const driveIdOf = u => (String(u).match(/[?&]id=([\w-]+)/) || [])[1];
function deleteCloudPhoto(url) {
  const id = driveIdOf(url);
  if (id && cloudOn()) api('delPhoto', { fileId: id }).catch(e => console.warn('[photo]', e.message));
}

/* ---------- sheet places ---------- */
async function pullPlaces() {
  if (!cloudOn()) return 0;
  try {
    const r = await api('places');
    localStorage.setItem(SHEET_PLACES_KEY, JSON.stringify(r.places || {}));
    mergePlaces();
    return Object.keys(r.places || {}).length;
  } catch (e) { console.warn('[places]', e.message); return -1; }
}
async function seedPlaces(btn) {
  btn && btn.classList.add('loading');
  try {
    const all = { ...BASE_PLACES, ...(state.customPlaces || {}) };
    const r = await api('seedPlaces', { places: all }, 60000);
    toast(t('seed_done', { n: r.added }));
    await pullPlaces();
  } catch (e) { toast(t('cloud_err', { e: e.message })); }
  finally { btn && btn.classList.remove('loading'); }
}

/* ---------- Gemini ---------- */
function aiContext() {
  return {
    trip: { name: tx(state.trip.name), start: state.trip.start, people: state.trip.people, budget: state.budget },
    spentTHB: Math.round(spentIn('THB')),
    hotels: state.hotels.map(h => ({ name: h.name, gps: h.gps, checkin: h.checkin, checkout: h.checkout })),
    restaurants: (state.restaurants || []).map(r => ({ name: r.name, ja: r.nameJa, area: r.area, meal: r.meal, day: r.day, gps: r.gps, note: r.note })),
    days: state.days.map((d, i) => {
      const ld = loadOf(i);
      return { day: i + 1, date: isoOf(dateOfDay(i)), title: tx(d.title), mode: d.mode, start: d.start, load: ld.lv, totalMin: ld.s.total,
        stops: d.stops.map(s => ({ id: s.id, name: PLACES[s.id] ? pName(PLACES[s.id]) : s.id, durMin: PLACES[s.id]?.dur, legMin: s.leg })) };
    }),
    PLACES: Object.entries(PLACES).map(([id, p]) => ({ id, name: p.name.th, ja: p.name.ja, area: tx(p.area), durMin: p.dur, gps: p.gps })),
  };
}
async function geminiAsk(q, mode = 'chat') {
  const history = aiLog.filter(m => m.text).slice(-8).map(m => ({ me: m.me, text: m.text }));
  const r = await api('ai', { q, mode, lang: L(), context: aiContext(), history }, 90000);
  return r.text;
}
function parsePlan(text) {
  try {
    const j = JSON.parse(String(text).replace(/^```(json)?|```$/g, '').trim());
    const stops = (j.stops || []).filter(s => PLACES[s.id]).map(s => ({ id: s.id, leg: Math.max(0, Math.min(300, parseInt(s.leg, 10) || 30)) }));
    if (!stops.length) return null;
    return { title: j.title, mode: MODES[j.mode] ? j.mode : 'transit', start: /^\d{2}:\d{2}$/.test(j.start) ? j.start : '09:00', stops, tip: j.tip || '' };
  } catch (e) { return null; }
}

/* ---------- settings sheet ---------- */
function openCloud() {
  const on = cloudOn();
  openSheet(`<h2 class="sheet-title">${t('cloud_title')}</h2>
    <p class="muted small">${t('cloud_sub')}</p>
    ${on ? `<div class="cloud-status s-${syncState}"><span class="sync-dot s-${syncState}"></span><div class="grow"><b>${t('sync_' + syncState)}</b><div class="small muted">${t('trip_code')}: ${esc(CLOUD.tripId)}${CLOUD.lastSync ? ' · ' + new Date(CLOUD.lastSync).toLocaleString(locale(), { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' }) : ''}${syncMsg ? ' · ' + esc(syncMsg) : ''}</div></div>
      <button class="icon-btn" onclick="pullNow().then(()=>openCloud())" aria-label="sync">${ic('refresh')}</button></div>` : ''}
    <label class="lbl">${t('cloud_url')}</label>
    <input id="cUrl" class="input mono" placeholder="https://script.google.com/macros/s/…/exec" value="${esc(CLOUD.url)}">
    <div class="two"><div><label class="lbl">APP_KEY</label><input id="cKey" class="input mono" value="${esc(CLOUD.key)}" autocomplete="off"></div>
      <div><label class="lbl">${t('trip_code')}</label><input id="cTrip" class="input mono" placeholder="tokyo-fuji-2026" value="${esc(CLOUD.tripId || slugTrip())}"></div></div>
    <label class="lbl">${t('your_name')}</label><input id="cBy" class="input" placeholder="${t('your_name_ph')}" value="${esc(CLOUD.by)}">
    <div class="actions"><button class="btn btn-soft" onclick="testCloud(this)">${t('cloud_test')}</button><button class="btn btn-ink" onclick="connectCloud(this)">${on ? t('save') : t('cloud_connect')}</button></div>
    ${on ? `
    <h3 class="sec">${t('cloud_tools')}</h3>
    <div class="cloud-tools">
      <button class="chip" onclick="copyTxt(inviteLink())">${ic('talk')}${t('invite_family')}</button>
      ${CLOUD.sheetUrl ? `<a class="chip" href="${esc(CLOUD.sheetUrl)}" target="_blank" rel="noopener">${ic('chart')}Google Sheet</a>` : ''}
      ${CLOUD.folderUrl ? `<a class="chip" href="${esc(CLOUD.folderUrl)}" target="_blank" rel="noopener">${ic('camera')}Google Drive</a>` : ''}
      <button class="chip" onclick="seedPlaces(this)">${ic('pin')}${t('seed_places')}</button>
      <button class="chip" onclick="pullPlaces().then(n=>{toast(n>=0?t('places_pulled',{n}):t('cloud_err',{e:''}));rerender()})">${ic('refresh')}${t('pull_places')}</button>
    </div>
    <p class="note">${CLOUD.ai ? '✨ ' + t('ai_on') : t('ai_off')}</p>
    <button class="btn btn-danger wide" style="margin-top:14px" onclick="disconnectCloud()">${t('cloud_disconnect')}</button>` : `<p class="note">${t('cloud_help')}</p>`}`);
}
const slugTrip = () => (tx(state.trip.name).toLowerCase().replace(/[^a-z0-9ก-๙]+/g, '-').replace(/^-|-$/g, '') || 'trip') + '-' + state.trip.start.slice(0, 4);
function readCloudForm() {
  return { url: $('#cUrl').value.trim(), key: $('#cKey').value.trim(), tripId: $('#cTrip').value.trim().replace(/[^\w\-ก-๙]/g, '').slice(0, 60), by: $('#cBy').value.trim() };
}
async function testCloud(btn, form = readCloudForm()) {
  if (!/^(https:\/\/script\.google(usercontent)?\.com\/|http:\/\/(localhost|127\.0\.0\.1)[:/])/.test(form.url)) { toast(t('cloud_bad_url')); return null; }
  btn && btn.classList.add('loading');
  const keep = { ...CLOUD };
  Object.assign(CLOUD, form);
  try {
    const r = await api('ping', {}, 20000);
    Object.assign(CLOUD, { ai: r.ai, sheetUrl: r.sheetUrl, folderUrl: r.folderUrl });
    toast(t('cloud_ok', { ai: r.ai ? '✨ AI' : '' }));
    return r;
  } catch (e) {
    Object.assign(CLOUD, keep);
    toast(t('cloud_err', { e: t('err_' + e.message) !== 'err_' + e.message ? t('err_' + e.message) : e.message }));
    return null;
  } finally { btn && btn.classList.remove('loading'); }
}
async function connectCloud(btn) {
  const form = readCloudForm();
  if (!form.tripId) { toast(t('trip_code_need')); return; }
  const changedTrip = form.tripId !== CLOUD.tripId;
  const r = await testCloud(btn, form);
  if (!r) return;
  if (changedTrip) { CLOUD.lastSync = 0; CLOUD.dirty = false; }
  saveCloud(); closeSheet();
  await pullPlaces();
  await pullNow();
  rerender();
}
function disconnectCloud() {
  if (!confirm(t('cloud_disc_confirm'))) return;
  CLOUD = { url:'', key:'', tripId:'', by: CLOUD.by, lastSync:0, dirty:false, ai:false };
  saveCloud(); setSync('off'); closeSheet(); rerender();
}
function inviteLink() {
  const payload = btoa(unescape(encodeURIComponent(JSON.stringify({ u: CLOUD.url, k: CLOUD.key, t: CLOUD.tripId }))));
  return location.origin + location.pathname + '?join=' + encodeURIComponent(payload);
}
function handleJoin() {
  const raw = new URLSearchParams(location.search).get('join');
  if (!raw) return false;
  try {
    const j = JSON.parse(decodeURIComponent(escape(atob(raw))));
    history.replaceState(null, '', location.pathname + location.hash);
    if (!j.u || !j.k || !j.t) return false;
    if (!confirm(t('join_confirm', { trip: j.t }))) return false;
    Object.assign(CLOUD, { url: j.u, key: j.k, tripId: j.t, lastSync: 0, dirty: false });
    saveCloud();
    testCloud(null, { url: j.u, key: j.k, tripId: j.t, by: CLOUD.by }).then(r => { if (r) { saveCloud(); pullPlaces().then(() => pullNow()); } });
    return true;
  } catch (e) { return false; }
}
