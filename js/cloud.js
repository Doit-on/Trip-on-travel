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
const DEFAULT_CLOUD_URL = 'https://script.google.com/macros/s/AKfycbzbGd-ZcQqfYo5UxEXshky9z_XQjgvyv6WaQ4xs8Qhese8UYTrnJI9S8cWbYFdN5NEsDA/exec';
const BASE_PLACES = { ...PLACES };
const SHARED_FIELDS = ['trip', 'days', 'hotels', 'restaurants', 'expenses', 'budget', 'customPlaces', 'deletedIds'];

let CLOUD = (() => {
  try {
    const saved = JSON.parse(localStorage.getItem(CLOUD_KEY) || '{}');
    return { url: DEFAULT_CLOUD_URL, key:'', tripId:'', by:'', aiKey:'', lastSync:0, dirty:false, ai:false, ...saved, ...(saved.url ? {} : { url: DEFAULT_CLOUD_URL }) };
  }
  catch (e) { return { url: DEFAULT_CLOUD_URL, key:'', tripId:'', by:'', aiKey:'', lastSync:0, dirty:false, ai:false }; }
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
    const payload = { action, key: CLOUD.key, tripId: CLOUD.tripId, by: CLOUD.by, ...(CLOUD.aiKey ? { geminiKey: CLOUD.aiKey } : {}), ...data };
    const r = await fetch(CLOUD.url, { method:'POST', body: JSON.stringify(payload), signal: ctl.signal, redirect:'follow' });
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
    if (r.ai !== undefined && r.ai !== CLOUD.ai) { CLOUD.ai = !!r.ai; saveCloud(); }
    let sheetRests = r.restaurants || (r.state && r.state.restaurants) || [];
    if (!r.restaurants) {
      const directRests = await fetchDirectSheetRestaurants();
      if (directRests.length) sheetRests = [...sheetRests, ...directRests];
    }
    const sheetHotels = r.hotels || (r.state && r.state.hotels) || [];
    if (r.state && r.updatedAt > CLOUD.lastSync) {
      if (CLOUD.dirty) { mergeRemote(r.state); CLOUD.lastSync = r.updatedAt; saveCloud(); schedulePush(); }
      else { applyRemote(r.state); CLOUD.lastSync = r.updatedAt; saveCloud(); }
      mergeSheetItems(sheetRests, sheetHotels, !CLOUD.dirty);
      if (!silent) toast(t('sync_pulled', { who: r.updatedBy || '?' }));
    } else {
      const added = mergeSheetItems(sheetRests, sheetHotels, !CLOUD.dirty);
      if (added > 0) {
        if (!silent) toast(t('sheet_synced', { n: added }));
        schedulePush();
      } else if (!r.state || CLOUD.dirty) {
        schedulePush();                          // ทริปใหม่บน cloud หรือมีของค้างส่ง
      } else if (!silent) {
        toast(t('sync_pulled', { who: r.updatedBy || 'Sheet' }));
      }
    }
    mergeRemotePhotos(r.photos || {});
    if (syncState === 'busy') setSync('ok');
    mergePlaces(); rerender();
  } catch (e) { setSync('err', e.message); }
}

function applyRemote(remote) {
  const prevRests = [...(state.restaurants || [])];
  const prevHotels = [...(state.hotels || [])];
  SHARED_FIELDS.forEach(k => { if (remote[k] !== undefined) state[k] = remote[k]; });
  mergeSheetItems(prevRests, prevHotels, false);
  saveState({ localOnly: true });
}

/** รวมข้อมูลจากชีต Restaurants / Hotels เข้ากับ state โดยไม่ทำให้ข้อมูลที่บันทึกไว้หาย */
function mergeSheetItems(sheetRests = [], sheetHotels = [], sheetWins = true) {
  const del = new Set((state.deletedIds || []).map(String));
  const norm = s => String(s || '').trim().toLowerCase();
  let changed = 0;

  if (Array.isArray(sheetRests) && sheetRests.length) {
    state.restaurants = state.restaurants || [];
    sheetRests.forEach(sr => {
      if (!sr || !sr.name || del.has(String(sr.id))) return;
      const found = state.restaurants.find(x => x.id === sr.id || (norm(x.name) && norm(x.name) === norm(sr.name)));
      if (!found) {
        state.restaurants.push({ ...sr, id: sr.id || ('r_sh_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5)) });
        changed++;
      } else if (sheetWins) {
        const fields = ['name', 'nameJa', 'area', 'meal', 'day', 'address', 'gps', 'note'];
        fields.forEach(f => {
          if (sr[f] !== undefined && sr[f] !== '' && sr[f] !== found[f]) { found[f] = sr[f]; changed++; }
        });
      }
    });
  }

  if (Array.isArray(sheetHotels) && sheetHotels.length) {
    state.hotels = state.hotels || [];
    sheetHotels.forEach(sh => {
      if (!sh || !sh.name || !sh.checkin || !sh.checkout || del.has(String(sh.id))) return;
      const found = state.hotels.find(x => x.id === sh.id || (norm(x.name) && norm(x.name) === norm(sh.name)));
      if (!found) {
        state.hotels.push({ ...sh, id: sh.id || ('h_sh_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5)) });
        changed++;
      } else if (sheetWins) {
        ['name', 'address', 'gps', 'checkin', 'checkout'].forEach(f => {
          if (sh[f] !== undefined && sh[f] !== '' && sh[f] !== found[f]) { found[f] = sh[f]; changed++; }
        });
      }
    });
  }

  if (changed > 0) saveState({ localOnly: true });
  return changed;
}

/** รวมข้อมูล: รายการที่มี id รวมกัน (ของเครื่องนี้ชนะถ้า id ซ้ำ) · ส่วนอื่นใช้ของเครื่องนี้ */
function mergeRemote(remote) {
  const del = new Set([...(remote.deletedIds || []), ...(state.deletedIds || [])].map(String));
  state.deletedIds = [...del];
  const byId = (a = [], b = []) => {
    const m = new Map();
    a.forEach(x => { if (x && !del.has(String(x.id))) m.set(x.id, x); });
    b.forEach(x => { if (x && !del.has(String(x.id))) m.set(x.id, x); });
    return [...m.values()];
  };
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

/* ---------- sheet places & direct sheet reader ---------- */
function normMealClient(m) {
  const s = String(m || '').trim().toLowerCase();
  if (/breakfast|morning|เช้า|朝/.test(s)) return 'breakfast';
  if (/dinner|evening|เย็น|ค่ำ|夜|夕/.test(s)) return 'dinner';
  if (/cafe|coffee|dessert|sweet|คาเฟ่|ขนม|ของหวาน|กาแฟ|カフェ|甘/.test(s)) return 'cafe';
  if (/late|night|snack|ดึก|กินเล่น|ของว่าง|夜食/.test(s)) return 'late';
  return 'lunch';
}

function parseSheetRestRow(cells, idx = 0) {
  const r = cells.map(v => String(v ?? '').trim());
  if (!r.some(Boolean)) return null;
  // ข้ามแถวหัวตาราง
  if (/^(tripid|id|ชื่อร้าน|name)$/i.test(r[0]) || /^(id|day|name|ชื่อร้าน)$/i.test(r[1]) || /^(name|ชื่อร้าน)$/i.test(r[4])) return null;
  const parseDay = v => {
    const m = String(v || '').match(/(?:วันที่|วัน|day|d|^)\s*(\d{1,2})\b/i);
    return m ? Math.max(0, Math.min(30, parseInt(m[1], 10))) : null;
  };
  let day = 0, meal = 'lunch', name = '', nameJa = '', area = '', address = '', gps = '', note = '';
  if (r.length >= 5 && (r[2] === '' || parseDay(r[2]) !== null || /^[-–—]$/.test(r[2])) && r[4]) {
    day = parseDay(r[2]) || 0;
    meal = normMealClient(r[3]);
    name = r[4]; nameJa = r[5] || ''; area = r[6] || ''; address = r[7] || '';
    gps = (typeof parseGps === 'function' && (parseGps(r[8]) || parseGps(r[7]))) || '';
    note = r[9] || '';
  } else if (r.length >= 3 && r[2] && parseDay(r[2]) === null && !/^(breakfast|lunch|dinner|cafe|late|เช้า|เที่ยง|เย็น|มื้อ)/i.test(r[2]) && (/-\d{4}$|^e2e|^trip/i.test(r[0]) || /^r[_0-9]/i.test(r[1]))) {
    name = r[2]; nameJa = r[3] || ''; area = r[4] || '';
    meal = normMealClient(r[5] || r[3]);
    day = parseDay(r[6]) ?? parseDay(r[5]) ?? 0;
    address = r[7] || '';
    gps = (typeof parseGps === 'function' && (parseGps(r[8]) || parseGps(r[7]))) || '';
    note = r[9] || '';
  } else {
    // กรณีวางตารางแบบย่อ เช่น [ชื่อร้าน, ชื่อญี่ปุ่น/ย่าน, มื้อ, วันที่, GPS, โน้ต] หรือ [วันที่, มื้อ, ชื่อร้าน, ย่าน, GPS, โน้ต]
    if (parseDay(r[0]) !== null && r[2]) {
      day = parseDay(r[0]) || 0; meal = normMealClient(r[1]); name = r[2]; area = r[3] || ''; note = r[4] || '';
    } else {
      name = r[0] || r[1] || r[2] || '';
      nameJa = r[1] && /[\u3040-\u30ff\u4e00-\u9faf]/.test(r[1]) ? r[1] : '';
      area = nameJa ? (r[2] || '') : (r[1] || '');
      meal = normMealClient(r[3] || r[2]);
      day = parseDay(r[4]) ?? parseDay(r[3]) ?? 0;
      note = r[5] || r[4] || '';
    }
  }
  if (!name) return null;
  if (!gps && typeof parseGps === 'function') {
    for (const cell of r) { const g = parseGps(cell); if (g) { gps = g; break; } }
  }
  const clean = s => String(s || '').trim().replace(/[^\w\-ก-๙]/g, '').slice(0, 24);
  const id = (r[1] && /^r[_0-9a-z]/i.test(r[1]) ? clean(r[1]) : '') || ('rs_' + (idx + 1) + '_' + clean(name));
  return { id, day, meal, name, nameJa, area, address, gps, note };
}

function fetchDirectSheetRestaurants() {
  return new Promise(resolve => {
    const m = String(CLOUD.sheetUrl || '').match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
    if (!m || typeof document === 'undefined') return resolve([]);
    const sheetId = m[1];
    const cbName = '__tabiGviz_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
    const script = document.createElement('script');
    const timer = setTimeout(() => { cleanup(); resolve([]); }, 4500);
    function cleanup() {
      clearTimeout(timer);
      try { delete window[cbName]; } catch (e) { window[cbName] = undefined; }
      if (script.parentNode) script.parentNode.removeChild(script);
    }
    window[cbName] = function (resp) {
      cleanup();
      try {
        const rows = (resp && resp.table && resp.table.rows) || [];
        const list = [];
        rows.forEach((row, idx) => {
          const cells = (row.c || []).map(c => (c && (c.f ?? c.v)) ?? '');
          const item = parseSheetRestRow(cells, idx);
          if (item) list.push(item);
        });
        resolve(list);
      } catch (e) { resolve([]); }
    };
    script.onerror = () => { cleanup(); resolve([]); };
    script.src = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=responseHandler:${cbName}&sheet=Restaurants`;
    document.head.appendChild(script);
  });
}

async function pullPlaces() {
  if (!cloudOn()) return 0;
  try {
    const r = await api('places');
    const pl = r.places || {};
    localStorage.setItem(SHEET_PLACES_KEY, JSON.stringify(pl));
    mergePlaces();
    // ถ้าระบบส่ง restaurants / hotels มาพร้อม places หรือมีหมวด food ในชีต Places ให้ซิงก์เข้าลิสต์ร้านอาหารทันที
    const fromPlacesFood = [];
    Object.entries(pl).forEach(([id, p]) => {
      if (p && /^(food|restaurant|cafe|ร้านอาหาร|คาเฟ่|ของกิน)$/i.test(String(p.art || '').trim())) {
        fromPlacesFood.push({
          id: 'rp_' + id, day: 0, meal: /cafe|คาเฟ่/i.test(p.art) ? 'cafe' : 'lunch',
          name: p.name?.th || id, nameJa: p.name?.ja || '', area: p.area?.th || '', address: '',
          gps: p.gps || '', note: (p.hi?.th || []).join(' · '),
        });
      }
    });
    mergeSheetItems([...(r.restaurants || []), ...fromPlacesFood], r.hotels || [], true);
    return Object.keys(pl).length;
  } catch (e) { console.warn('[places]', e.message); return -1; }
}
async function pullSheetData(btn) {
  if (!cloudOn()) { openCloud(); return; }
  btn && btn.classList.add('loading');
  try {
    const beforeCount = (state.restaurants || []).length;
    await pullPlaces();
    const directRests = await fetchDirectSheetRestaurants();
    if (directRests.length) mergeSheetItems(directRests, [], true);
    await pullNow(true);
    const afterCount = (state.restaurants || []).length;
    const diff = Math.max(0, afterCount - beforeCount);
    toast(diff > 0 ? t('sheet_synced', { n: diff }) : t('sync_pulled', { who: 'Google Sheet' }));
    rerender();
  } finally { btn && btn.classList.remove('loading'); }
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
function parseAiRecs(text) {
  const s = String(text || '');
  const idx = s.indexOf('RECS_JSON:');
  if (idx < 0) return { cleanText: s, recs: null };
  const cleanText = s.slice(0, idx).trim();
  const rawJson = s.slice(idx + 10).replace(/^```(json)?|```$/g, '').trim();
  try {
    const j = JSON.parse(rawJson);
    return { cleanText, recs: { places: Array.isArray(j.places) ? j.places : [], restaurants: Array.isArray(j.restaurants) ? j.restaurants : [] } };
  } catch (e) { return { cleanText, recs: null }; }
}
function parsePlan(text) {
  try {
    const j = JSON.parse(String(text).replace(/^```(json)?|```$/g, '').trim());
    const newPlaces = {};
    (j.newPlaces || []).forEach(np => {
      if (np && np.id && np.name) {
        const th = typeof np.name === 'object' ? (np.name.th || np.name.ja) : String(np.name);
        const ja = typeof np.name === 'object' ? (np.name.ja || np.name.th) : String(np.nameJa || np.name);
        const aTh = typeof np.area === 'object' ? (np.area.th || np.area.ja || '') : String(np.area || '');
        const aJa = typeof np.area === 'object' ? (np.area.ja || np.area.th || '') : String(np.area || '');
        newPlaces[np.id] = { name: { th, ja }, ro: ja || th, area: { th: aTh, ja: aJa }, art: np.art || 'city', dur: Number(np.dur) || 60, gps: np.gps || '', mapcode: '', hi: { th: [], ja: [] }, miss: { th: [], ja: [] }, transit: { th: '', ja: '' }, custom: true };
      }
    });
    const stops = (j.stops || []).filter(s => s && (PLACES[s.id] || newPlaces[s.id])).map(s => ({ id: s.id, leg: Math.max(0, Math.min(300, parseInt(s.leg, 10) || 30)) }));
    if (!stops.length) return null;
    const restaurants = Array.isArray(j.restaurants) ? j.restaurants.filter(r => r && r.name) : [];
    return { title: j.title, mode: MODES[j.mode] ? j.mode : 'transit', start: /^\d{2}:\d{2}$/.test(j.start) ? j.start : '09:00', stops, newPlaces, restaurants, tip: j.tip || '' };
  } catch (e) { return null; }
}

/* ---------- settings sheet ---------- */
function openCloud() {
  const on = cloudOn();
  const hasAi = CLOUD.ai || !!CLOUD.aiKey;
  openSheet(`<h2 class="sheet-title">${t('cloud_title')}</h2>
    <p class="muted small">${t('cloud_sub')}</p>
    ${on ? `<div class="cloud-status s-${syncState}"><span class="sync-dot s-${syncState}"></span><div class="grow"><b>${t('sync_' + syncState)}</b><div class="small muted">${t('trip_code')}: ${esc(CLOUD.tripId)}${CLOUD.lastSync ? ' · ' + new Date(CLOUD.lastSync).toLocaleString(locale(), { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' }) : ''}${syncMsg ? ' · ' + esc(syncMsg) : ''}</div></div>
      <button class="icon-btn" onclick="pullNow().then(()=>openCloud())" aria-label="sync">${ic('refresh')}</button></div>` : ''}
    <label class="lbl">${t('cloud_url')}</label>
    <input id="cUrl" class="input mono" placeholder="https://script.google.com/macros/s/…/exec" value="${esc(CLOUD.url)}">
    <div class="two"><div><label class="lbl">APP_KEY</label><input id="cKey" class="input mono" value="${esc(CLOUD.key)}" autocomplete="off"></div>
      <div><label class="lbl">${t('trip_code')}</label><input id="cTrip" class="input mono" placeholder="tokyo-fuji-2026" value="${esc(CLOUD.tripId || slugTrip())}"></div></div>
    <label class="lbl">${t('your_name')}</label><input id="cBy" class="input" placeholder="${t('your_name_ph')}" value="${esc(CLOUD.by)}">
    <label class="lbl">GEMINI_API_KEY (วางคีย์ที่นี่เพื่อเปิด AI ได้ทันที)</label><input id="cAiKey" class="input mono" placeholder="AIzaSy... หรือวางคีย์ Gemini ที่นี่" value="${esc(CLOUD.aiKey || '')}" autocomplete="off">
    <div class="actions"><button class="btn btn-soft" onclick="testCloud(this)">${t('cloud_test')}</button><button class="btn btn-ink" onclick="connectCloud(this)">${on ? t('save') : t('cloud_connect')}</button></div>
    ${on ? `
    <h3 class="sec">${t('cloud_tools')}</h3>
    <div class="cloud-tools">
      <button class="chip" onclick="copyTxt(inviteLink())">${ic('talk')}${t('invite_family')}</button>
      ${CLOUD.sheetUrl ? `<a class="chip" href="${esc(CLOUD.sheetUrl)}" target="_blank" rel="noopener">${ic('chart')}Google Sheet</a>` : ''}
      ${CLOUD.folderUrl ? `<a class="chip" href="${esc(CLOUD.folderUrl)}" target="_blank" rel="noopener">${ic('camera')}Google Drive</a>` : ''}
      <button class="chip" onclick="seedPlaces(this)">${ic('pin')}${t('seed_places')}</button>
      <button class="chip" onclick="pullSheetData(this)">${ic('refresh')}${t('pull_sheet')}</button>
    </div>
    <p class="note">${hasAi ? '✨ ' + t('ai_on') : t('ai_off')}</p>
    <button class="btn btn-danger wide" style="margin-top:14px" onclick="disconnectCloud()">${t('cloud_disconnect')}</button>` : `<p class="note">${t('cloud_help')}</p>`}`);
}
const slugTrip = () => (tx(state.trip.name).toLowerCase().replace(/[^a-z0-9ก-๙]+/g, '-').replace(/^-|-$/g, '') || 'trip') + '-' + state.trip.start.slice(0, 4);
function readCloudForm() {
  const f = { url: $('#cUrl').value.trim(), key: $('#cKey').value.trim(), tripId: $('#cTrip').value.trim().replace(/[^\w\-ก-๙]/g, '').slice(0, 60), by: $('#cBy').value.trim() };
  if ($('#cAiKey')) f.aiKey = $('#cAiKey').value.trim();
  return f;
}
async function testCloud(btn, form = readCloudForm()) {
  if (!/^(https:\/\/script\.google(usercontent)?\.com\/|http:\/\/(localhost|127\.0\.0\.1)[:/])/.test(form.url)) { toast(t('cloud_bad_url')); return null; }
  btn && btn.classList.add('loading');
  const keep = { ...CLOUD };
  Object.assign(CLOUD, form);
  try {
    const r = await api('ping', {}, 20000);
    const hasAi = !!(r.ai || CLOUD.aiKey);
    Object.assign(CLOUD, { ai: hasAi, sheetUrl: r.sheetUrl, folderUrl: r.folderUrl });
    saveCloud();
    if (btn && $('#cUrl')) { openCloud(); rerender(); }
    toast(t('cloud_ok', { ai: hasAi ? '✨ AI' : '' }));
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
  CLOUD = { url: DEFAULT_CLOUD_URL, key:'', tripId:'', by: CLOUD.by, lastSync:0, dirty:false, ai:false };
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
