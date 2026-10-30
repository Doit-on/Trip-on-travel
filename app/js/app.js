/* Tabi Note — แอปหลัก (render + interaction)
 * ไฟล์ที่ต้องโหลดก่อน: data.js, phrases.js, currency.js, i18n.js, store.js
 */
'use strict';

/* ============ helpers ============ */
const $ = (s, el = document) => el.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
const L = () => state.lang;
const tx = o => o == null ? '' : typeof o === 'string' ? o : (o[L()] ?? o.th ?? '');

let state = loadState();
let photos = loadPhotos();
mergePlaces();
const ui = { screen: 'overview', day: 0, talkCat: 'all', talkQ: '', restMeal: 'all', restQ: '', big: null };

const ICONS = {
  home:'<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  cal:'<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  talk:'<path d="M4 5h16v11H9l-5 4z"/><path d="M8 9h8M8 12h5"/>',
  money:'<rect x="3" y="6" width="18" height="13" rx="3"/><path d="M3 10h18M7 15h3"/>',
  grid:'<rect x="4" y="4" width="7" height="7" rx="2"/><rect x="13" y="4" width="7" height="7" rx="2"/><rect x="4" y="13" width="7" height="7" rx="2"/><rect x="13" y="13" width="7" height="7" rx="2"/>',
  ai:'<path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>',
  sos:'<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M12 9v4M12 16h.01"/>',
  walk:'<circle cx="13" cy="4" r="2"/><path d="M9 21l2-6 3 3v3M7 12l3-4 4 1 2 4M11 15l-1-4"/>',
  car:'<path d="M5 16V11l2-5h10l2 5v5M3 16h18v3H3zM7 19v2M17 19v2"/>',
  train:'<rect x="5" y="3" width="14" height="14" rx="3"/><path d="M5 11h14M8 21l2-4M16 21l-2-4"/>',
  pin:'<path d="M12 21s-7-6-7-12a7 7 0 0 1 14 0c0 6-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/>',
  camera:'<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
  hotel:'<path d="M3 20V6M3 14h18v6M21 14v-3a3 3 0 0 0-3-3h-7v6"/><circle cx="7" cy="11" r="2"/>',
  food:'<path d="M4 11h16a8 8 0 0 1-16 0zM8 7c0-2 2-2 2-4M13 7c0-2 2-2 2-4"/>',
  bag:'<path d="M5 8h14l-1 13H6zM9 8V6a3 3 0 0 1 6 0v2"/>',
  ticket:'<path d="M3 8a2 2 0 0 0 0 4v4h18v-4a2 2 0 0 1 0-4V4H3zM14 4v12"/>',
  dots:'<circle cx="6" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="18" cy="12" r="1.5"/>',
  smile:'<circle cx="12" cy="12" r="9"/><path d="M8.5 14.5a4.5 4.5 0 0 0 7 0M9 9.5h.01M15 9.5h.01"/>',
  speaker:'<path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  x:'<path d="M6 6l12 12M18 6L6 18"/>',
  back:'<path d="M15 18l-6-6 6-6"/>',
  refresh:'<path d="M20 11a8 8 0 1 0-2.3 5.7M20 5v6h-6"/>',
  globe:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
  chart:'<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  locate:'<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>',
  search:'<circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5"/>',
  route:'<circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="6" r="2.5"/><path d="M8.5 18H16a3 3 0 0 0 0-6H8a3 3 0 0 1 0-6h7.5"/>',
  phone:'<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>',
  edit:'<path d="M4 20h4L19 9l-4-4L4 16zM14 6l4 4"/>',
  swap:'<path d="M7 7h12l-3-3M17 17H5l3 3"/>',
  settings:'<circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1.2l2-1.6-2-3.4-2.4 1a7 7 0 0 0-2-1.2L14 3h-4l-.5 2.6a7 7 0 0 0-2 1.2l-2.4-1-2 3.4 2 1.6a7 7 0 0 0 0 2.4l-2 1.6 2 3.4 2.4-1a7 7 0 0 0 2 1.2L10 21h4l.5-2.6a7 7 0 0 0 2-1.2l2.4 1 2-3.4-2-1.6c.1-.4.1-.8.1-1.2z"/>',
};
const ic = (k, cls = '') => `<svg class="i ${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[k] || ''}</svg>`;

const EXP_CATS = [
  { k:'stay',      color:'#E8A6B2', ic:'hotel'  },
  { k:'transport', color:'#9FB9D3', ic:'train'  },
  { k:'food',      color:'#B5CDA3', ic:'food'   },
  { k:'shop',      color:'#E9CF8C', ic:'bag'    },
  { k:'ticket',    color:'#BFB1DD', ic:'ticket' },
  { k:'other',     color:'#D5CBC0', ic:'dots'   },
];
const DAY_COLORS = ['#9FB9D3', '#B5CDA3', '#E9CF8C', '#BFB1DD', '#E8A6B2', '#9FCFC4', '#F0B48A'];
const MODES = { car:{ ic:'car', gm:'driving' }, transit:{ ic:'train', gm:'transit' }, walk:{ ic:'walk', gm:'walking' } };
const MEALS = [
  { k:'breakfast', c:'c-yuzu'   },
  { k:'lunch',     c:'c-matcha' },
  { k:'dinner',    c:'c-sakura' },
  { k:'cafe',      c:'c-fuji'   },
  { k:'late',      c:'c-sora'   },
];

/* ============ dates ============ */
const isoOf = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
function normDateIso(v) {
  if (!v) return '';
  if (v instanceof Date && !isNaN(v.getTime())) {
    const y = v.getFullYear() >= 2400 ? v.getFullYear() - 543 : v.getFullYear();
    return `${y}-${String(v.getMonth() + 1).padStart(2, '0')}-${String(v.getDate()).padStart(2, '0')}`;
  }
  const s = String(v).trim();
  let m = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (m) {
    let y = parseInt(m[1], 10); if (y >= 2400) y -= 543;
    return `${y}-${String(parseInt(m[2], 10)).padStart(2, '0')}-${String(parseInt(m[3], 10)).padStart(2, '0')}`;
  }
  m = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
  if (m) {
    let y = parseInt(m[3], 10); if (y >= 2400) y -= 543;
    let a = parseInt(m[1], 10), b = parseInt(m[2], 10);
    const mo = b > 12 ? a : b, da = b > 12 ? b : a;
    return `${y}-${String(mo).padStart(2, '0')}-${String(da).padStart(2, '0')}`;
  }
  return s.slice(0, 10);
}
function addDaysIso(iso, n) {
  const base = normDateIso(iso);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(base)) return base;
  const d = new Date(base + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return isoOf(d);
}
function diffDaysIso(isoA, isoB) {
  const a = normDateIso(isoA), b = normDateIso(isoB);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(a) || !/^\d{4}-\d{2}-\d{2}$/.test(b)) return 0;
  return Math.round((new Date(b + 'T00:00:00') - new Date(a + 'T00:00:00')) / 864e5);
}
const dateOfDay = i => { const d = new Date(normDateIso(state.trip.start) + 'T00:00:00'); d.setDate(d.getDate() + i); return d; };
const locale = () => L() === 'ja' ? 'ja-JP' : 'th-TH';
const fmtD = (d, o) => d.toLocaleDateString(locale(), o);
const dShort = i => fmtD(dateOfDay(i), { day:'numeric', month:'short' });
const wkShort = i => fmtD(dateOfDay(i), { weekday:'short' });
const toMin = s => { const [h, m] = String(s || '09:00').split(':').map(Number); return h * 60 + (m || 0); };
const hm = m => `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(Math.round(m) % 60).padStart(2, '0')}`;
function durTxt(min) {
  const h = Math.floor(min / 60), m = Math.round(min % 60);
  if (h && m) return t('dur_hm', { h, m });
  if (h) return t('dur_h', { h });
  return t('dur_m', { m });
}

/* ============ places / hotels ============ */
const placeOf = id => PLACES[id];
const pName = p => tx(p.name);

function parseGps(text) {
  if (!text) return null;
  let s = String(text);
  try { s = decodeURIComponent(s); } catch (e) { /* keep raw */ }
  const m = s.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/) || s.match(/@(-?\d+\.\d+),\s*(-?\d+\.\d+)/) || s.match(/(-?\d{1,3}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)/);
  if (!m) return null;
  const lat = +m[1], lng = +m[2];
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}
/* ถ้ามีหลายโรงแรมทับวันกัน เลือกอันที่เช็คอินล่าสุด (= ที่ที่นอนจริงคืนนั้น) */
const latestCheckin = list => list.sort((a, b) => normDateIso(b.checkin).localeCompare(normDateIso(a.checkin)))[0];
/** โรงแรมที่ "นอนคืนนี้" */
const hotelTonight = iso => {
  const d = normDateIso(iso);
  return latestCheckin(state.hotels.filter(h => {
    const ci = normDateIso(h.checkin), co = normDateIso(h.checkout);
    return ci && co && ci <= d && d < co;
  }));
};
/** โรงแรมที่ "ตื่นเช้ามา" (นอนเมื่อคืน) — ถ้าไม่มีใช้โรงแรมคืนนี้ */
const hotelMorning = iso => {
  const d = normDateIso(iso);
  return latestCheckin(state.hotels.filter(h => {
    const ci = normDateIso(h.checkin), co = normDateIso(h.checkout);
    return ci && co && ci < d && d <= co;
  })) || hotelTonight(d);
};

/** คำนวณรายการวันทั้งหมดที่โรงแรมครอบคลุม (ตั้งแต่วันเช็คอินถึงวันเช็คเอาท์) */
function hotelCoveredDays(h) {
  const ci = normDateIso(h?.checkin), co = normDateIso(h?.checkout);
  if (!ci || !co || co < ci) return [];
  const span = Math.min(60, Math.max(1, diffDaysIso(ci, co)));
  const tripStart = normDateIso(state.trip.start);
  const out = [];
  for (let k = 0; k <= span; k++) {
    const dIso = addDaysIso(ci, k);
    const dObj = new Date(dIso + 'T00:00:00');
    const dayIdx = diffDaysIso(tripStart, dIso);
    const inTrip = dayIdx >= 0 && dayIdx < state.days.length;
    out.push({
      dateIso: dIso,
      dateLabel: fmtD(dObj, { day:'numeric', month:'short' }),
      dayIdx: inTrip ? dayIdx : null,
      dayNum: inTrip ? dayIdx + 1 : (dayIdx >= 0 ? dayIdx + 1 : null),
      role: k === span ? 'checkout' : 'stay',
    });
  }
  return out;
}

/** ปรับจำนวนวันในทริป (state.days) และวันเริ่มทริปให้ครอบคลุมวันเข้าพักของโรงแรมครบทุกวันโดยไม่ทำให้ข้อมูลเดิมหาย */
function syncTripDaysWithHotels(focusHotel = null) {
  if (!state.hotels || !state.hotels.length) return 0;
  state.hotels.forEach(h => {
    h.checkin = normDateIso(h.checkin);
    h.checkout = normDateIso(h.checkout);
    if (h.checkin && (!h.checkout || h.checkout <= h.checkin)) {
      h.checkout = addDaysIso(h.checkin, 1);
    }
  });
  const valid = state.hotels.filter(h => /^\d{4}-\d{2}-\d{2}$/.test(h.checkin) && /^\d{4}-\d{2}-\d{2}$/.test(h.checkout));
  if (!valid.length) return 0;
  const minIn = valid.map(h => h.checkin).sort()[0];
  const maxOut = valid.map(h => h.checkout).sort().slice(-1)[0];
  let tripStart = normDateIso(state.trip.start);
  const tripEnd = isoOf(dateOfDay(state.days.length - 1));
  let addedDays = 0;

  // กรณีวันที่โรงแรมอยู่นอกช่วงวันทริปเดิมทั้งหมด หรือมีโรงแรมหลักแห่งเดียวแล้วผู้ใช้เปลี่ยนวันเช็คอินใหม่
  if (maxOut < tripStart || minIn > tripEnd || (valid.length === 1 && focusHotel && minIn !== tripStart && minIn < tripStart && diffDaysIso(minIn, tripStart) > 7)) {
    state.trip.start = minIn;
    tripStart = minIn;
  } else if (minIn < tripStart) {
    // กรณีผู้ใช้ระบุวันเช็คอินก่อนวันเริ่มทริปเดิมไม่เกิน 7 วัน ให้เพิ่มวันข้างหน้าโดยไม่ลบแผนเดิม
    const pre = Math.min(14, diffDaysIso(minIn, tripStart));
    if (pre > 0) {
      for (let k = 0; k < pre; k++) {
        state.days.unshift({ title:{ th:'วันว่าง ๆ', ja:'フリーデー' }, mode:'transit', start:'09:00', back:30, stops:[] });
        addedDays++;
      }
      (state.restaurants || []).forEach(r => { if (r.day && r.day > 0) r.day += pre; });
      (state.expenses || []).forEach(e => { if (e.day && e.day > 0) e.day += pre; });
      state.trip.start = minIn;
      tripStart = minIn;
    }
  }

  // ขยายจำนวนวันในทริปให้ครอบคลุมถึงวันเช็คเอาท์ (maxOut) ครบทุกวัน
  const neededDays = Math.min(60, diffDaysIso(tripStart, maxOut) + 1);
  while (state.days.length < neededDays) {
    state.days.push({ title:{ th:'วันว่าง ๆ', ja:'フリーデー' }, mode:'transit', start:'09:00', back:30, stops:[] });
    addedDays++;
  }
  return addedDays;
}

/* ============ schedule engine ============ */
function schedule(dayIdx) {
  const day = state.days[dayIdx];
  const iso = isoOf(dateOfDay(dayIdx));
  const hs = hotelMorning(iso), he = hotelTonight(iso);
  const items = [];
  let tm = toMin(day.start), travel = 0, visit = 0, prev = null;
  if (hs) { items.push({ type:'hotel', role:'start', hotel:hs, time:tm }); prev = hs.gps; }
  day.stops.forEach((s, i) => {
    const p = placeOf(s.id);
    if (!p) return;
    if (prev) {
      const lm = s.leg ?? 30;
      items.push({ type:'leg', min:lm, from:prev, to:p.gps, note:s.note });
      tm += lm; travel += lm;
    }
    items.push({ type:'stop', id:s.id, place:p, time:tm, idx:i });
    tm += p.dur; visit += p.dur; prev = p.gps;
  });
  if (he && day.stops.length) {
    const lm = day.back ?? 40;
    items.push({ type:'leg', min:lm, from:prev, to:he.gps });
    tm += lm; travel += lm;
    items.push({ type:'hotel', role:'end', hotel:he, time:tm });
  }
  return { items, travel, visit, total: travel + visit, end: tm, hs, he };
}

function loadOf(dayIdx) {
  const s = schedule(dayIdx), n = state.days[dayIdx].stops.length, hrs = s.total / 60;
  const lv = n === 0 ? 'empty' : (hrs <= 6.5 && n <= 4) ? 'chill' : (hrs <= 9.5 && n <= 5) ? 'good' : 'packed';
  const color = { empty:'#E6DED4', chill:'#B5CDA3', good:'#E9CF8C', packed:'#E8A6B2' }[lv];
  return { lv, n, hrs, s, color, pct: Math.max(6, Math.min(100, Math.round(hrs / 11 * 100))) };
}

/* ============ Google links ============ */
const gq = g => encodeURIComponent(String(g).replace(/\s/g, ''));
function dirUrl(from, to, mode = 'car', way = []) {
  let u = `https://www.google.com/maps/dir/?api=1&destination=${gq(to)}&travelmode=${MODES[mode]?.gm || 'driving'}`;
  if (from) u += `&origin=${gq(from)}`;
  if (way.length) u += `&waypoints=${way.map(gq).join('%7C')}`;
  return u;
}
const mapUrl = g => `https://www.google.com/maps/search/?api=1&query=${gq(g)}`;
function calUrl(dayIdx) {
  const day = state.days[dayIdx], s = schedule(dayIdx);
  const ymd = isoOf(dateOfDay(dayIdx)).replaceAll('-', '');
  const f = m => `${ymd}T${hm(Math.min(m, 23 * 60 + 59)).replace(':', '')}00`;
  const lines = s.items.filter(x => x.type !== 'leg').map(x => `${hm(x.time)} ${x.type === 'hotel' ? x.hotel.name : pName(x.place)}`);
  const end = day.stops.length ? s.end : toMin(day.start) + 120;
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`${t('app')} · ${t('day_n', { n: dayIdx + 1 })} ${tx(day.title)}`)}&dates=${f(toMin(day.start))}/${f(end)}&ctz=Asia/Tokyo&details=${encodeURIComponent(lines.join('\n'))}`;
}

/* ============ money ============ */
const expIn = (e, to) => convert(e.amount, e.cur, to, e.fx || RATES.rates);
const spentIn = to => state.expenses.reduce((a, e) => a + expIn(e, to), 0);
const dCur = () => state.displayCur;
const altCur = () => dCur() === 'THB' ? 'JPY' : 'THB';

/* ============ navigation ============ */
const NAV = [['overview', 'nav_trip', 'home'], ['day', 'nav_day', 'cal'], ['talk', 'nav_talk', 'talk'], ['money', 'nav_money', 'money'], ['more', 'nav_more', 'grid']];
const RENDER = {
  overview: renderOverview, day: renderDay, talk: renderTalk, money: renderMoney, more: renderMore,
  hotels: renderHotels, restaurants: renderRestaurants, sos: renderSOS, ai: renderAI, report: renderReport,
};

function renderNav() {
  const active = ['hotels', 'restaurants', 'sos', 'ai', 'report'].includes(ui.screen) ? 'more' : ui.screen;
  $('#tabbar').innerHTML = NAV.map(([k, l, i]) => `<button class="tab ${k === active ? 'on' : ''}" onclick="go('${k}')">${ic(i)}<span>${t(l)}</span></button>`).join('');
  $('#rail').innerHTML = `<div class="brand">Tabi Note<span>旅</span></div>` +
    NAV.map(([k, l, i]) => `<button class="${k === active ? 'on' : ''}" onclick="go('${k}')">${ic(i)}${t(l)}</button>`).join('') +
    `<div class="rail-sub">${['hotels', 'restaurants', 'ai', 'sos', 'report'].map(k => `<button class="${k === ui.screen ? 'on' : ''}" onclick="go('${k}')">${ic({ hotels:'hotel', restaurants:'food', ai:'ai', sos:'sos', report:'chart' }[k])}${t('m_' + k)}</button>`).join('')}</div>`;
}

function go(k) {
  closeSheet(); closeBig();
  ui.screen = k;
  document.querySelectorAll('.screen').forEach(s => s.classList.toggle('on', s.id === 's-' + k));
  (RENDER[k] || renderOverview)();
  renderNav();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
const rerender = () => { (RENDER[ui.screen] || renderOverview)(); renderNav(); };

function applyLang() {
  document.documentElement.lang = L();
  document.title = `Tabi Note — ${t('tagline_short')}`;
}
function setLang(l) { state.lang = l; saveState(); applyLang(); rerender(); toast(t('lang_changed')); }
const toggleLang = () => setLang(L() === 'th' ? 'ja' : 'th');

const topbar = (eyebrow, title, right = '') =>
  `<header class="topbar"><div><div class="eyebrow">${eyebrow}</div><h1 class="title"><span class="hl">${title}</span></h1></div><div class="tb-right">${right}${syncDotHtml()}<button class="lang-pill" onclick="toggleLang()" aria-label="language">${L() === 'th' ? 'あ' : 'ก'}</button></div></header>`;

/* ============ OVERVIEW ============ */
function renderOverview() {
  const start = new Date(state.trip.start + 'T00:00:00');
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const left = Math.round((start - today) / 864e5);
  const nDays = state.days.length;
  const nPlaces = state.days.reduce((a, d) => a + d.stops.length, 0);
  const cd = left > 0 ? `<div class="small">${t('count_pre')}</div><div class="count">${left}</div><div class="small">${t('count_post')}</div>`
    : left > -nDays ? `<div class="count">${t('day_n', { n: 1 - left })}</div><div class="small">${t('enjoy')}</div>`
    : `<div class="count wobble">${t('trip_done')}</div>`;
  const tonight = hotelTonight(isoOf(today)) || state.hotels[0];

  $('#s-overview').innerHTML = topbar(t('my_trip'), esc(tx(state.trip.name)), `<button class="icon-btn" onclick="openTripSettings()" aria-label="settings">${ic('settings')}</button>`) + `
  <div class="ov-grid"><div>
    <div class="trip-hero">
      <svg class="hero-fuji" viewBox="0 0 200 110"><path d="M0 110 L80 30 Q100 16 120 30 L200 110Z" fill="#fff"/><path d="M80 30 Q100 16 120 30 L132 44 L118 40 L108 50 L98 40 L88 50 L78 40 L68 44Z" fill="#B9C6DE"/></svg>
      <div class="row"><div>${cd}</div>
        <div class="hero-r"><div class="sticker">${dShort(0)} – ${dShort(nDays - 1)}</div><div class="small">${t('days_people', { d: nDays, p: state.trip.people })}</div></div></div>
    </div>
    <div class="stats">
      <button class="stat" onclick="go('day')"><b>${nPlaces}</b><span>${t('st_places')}</span></button>
      <button class="stat" onclick="go('restaurants')"><b>${(state.restaurants || []).length}</b><span>${t('st_restaurants')}</span></button>
      <button class="stat" onclick="go('hotels')"><b>${state.hotels.length}</b><span>${t('st_hotels')}</span></button>
      <button class="stat" onclick="go('money')"><b>${fmtMoneyShort(spentIn(dCur()), dCur())}</b><span>${t('st_spent')}</span></button>
    </div>
    <h3 class="sec">${t('pick_day')}</h3>
    <div class="days">${state.days.map((d, i) => `<button class="day ${i === ui.day ? 'on' : ''}" onclick="openDay(${i})"><span class="d">${wkShort(i)}</span><span class="n">${dateOfDay(i).getDate()}</span><span class="dot" style="background:${DAY_COLORS[i % DAY_COLORS.length]}"></span></button>`).join('')}
      <button class="day add" onclick="addDay()" aria-label="add day">${ic('plus')}</button></div>
    ${tonight ? `<button class="hotel-mini" onclick="go('hotels')">${ic('hotel')}<div><div class="small muted">${t('base_hotel')}</div><b>${esc(tonight.name)}</b></div><span class="chev">›</span></button>`
      : `<button class="hotel-mini empty" onclick="openHotel()">${ic('hotel')}<div><b>${t('add_hotel_cta')}</b><div class="small muted">${t('add_hotel_why')}</div></div></button>`}
  </div><div>
    <h3 class="sec">${t('daily_overview')}</h3>
    <div class="card list-card">${state.days.map((d, i) => { const ld = loadOf(i); const dh = ld.s.he || ld.s.hs; return `
      <button class="ov" onclick="openDay(${i})">
        <div class="num" style="background:${DAY_COLORS[i % DAY_COLORS.length]}40">${i + 1}</div>
        <div class="grow"><div class="t">${esc(tx(d.title))}</div><div class="s">${dShort(i)} · ${ld.n ? t('n_places', { n: ld.n }) : t('free_day')} · ${t('mode_' + d.mode)}${dh ? ` · 🏨 ${esc(dh.name)}` : ''}</div></div>
        <div class="load" title="${t('lv_' + ld.lv)}"><i style="width:${ld.pct}%;background:${ld.color}"></i></div>
      </button>`; }).join('')}</div>
    <p class="note">${t('load_note')}</p>
    <button class="btn btn-soft wide" onclick="go('ai')">${ic('ai')}${t('ask_ai_cta')}</button>
  </div></div>`;
}

function openDay(i) { ui.day = i; go('day'); }
function addDay() {
  state.days.push({ title:{ th:'วันว่าง ๆ', ja:'フリーデー' }, mode:'transit', start:'09:00', back:30, stops:[] });
  saveState(); ui.day = state.days.length - 1; go('day'); toast(t('day_added'));
}

/* ============ DAY ============ */
function renderDay() {
  ui.day = Math.min(ui.day, state.days.length - 1);
  const i = ui.day, day = state.days[i], ld = loadOf(i), s = ld.s;
  const legIc = m => (day.mode === 'transit' && m <= 10) ? 'walk' : MODES[day.mode].ic;
  const nStops = day.stops.length;

  let tl = '';
  s.items.forEach(it => {
    if (it.type === 'hotel') {
      tl += `<div class="stop"><div class="time">${hm(it.time)}</div>
        <div class="place hotel-card"><div class="thumb hotel-thumb">${ic('hotel')}</div>
        <div class="grow"><div class="t">${esc(it.hotel.name)}</div><div class="s">${t(it.role === 'start' ? 'leave_hotel' : 'back_hotel')}</div></div></div></div>`;
    } else if (it.type === 'leg') {
      tl += `<div class="stop"><div></div><div class="leg">${ic(legIc(it.min))}<span>${t('leg_' + (legIc(it.min) === 'walk' ? 'walk' : day.mode), { d: durTxt(it.min) })}${it.note ? ' · ' + esc(tx(it.note)) : ''}</span>
        ${it.from && it.to ? `<a class="leg-go" href="${dirUrl(it.from, it.to, legIc(it.min) === 'walk' ? 'walk' : day.mode)}" target="_blank" rel="noopener">${t('open_route')}</a>` : ''}</div></div>`;
    } else {
      const p = it.place, nPh = (photos[it.id] || []).length;
      tl += `<div class="stop stop-item" data-stop-idx="${it.idx}" onpointerdown="holdStopDrag(event,${it.idx})"><div class="time">${hm(it.time)}</div>
        <div class="place-wrap"><div class="place">
          ${nStops > 1 ? `<button type="button" class="drag-handle" onpointerdown="startStopDrag(event,${it.idx})" title="${t('drag_hint')}" aria-label="drag">⠿</button>
          <div class="stop-tools">
            <button type="button" class="stop-mv" onclick="moveStop(${it.idx},-1)" ${it.idx === 0 ? 'disabled' : ''} aria-label="up">↑</button>
            <button type="button" class="stop-mv" onclick="moveStop(${it.idx},1)" ${it.idx === nStops - 1 ? 'disabled' : ''} aria-label="down">↓</button>
          </div>` : ''}
          <button type="button" class="grow" style="display:flex;gap:12px;align-items:center;text-align:left;min-width:0" onclick="openPlace('${it.id}')">
            <div class="thumb">${ART[p.art]}${nPh ? `<span class="ph-badge">${nPh}</span>` : ''}</div>
            <div class="grow"><div class="t">${esc(pName(p))}</div><div class="s">${esc(tx(p.area))} · ${t('stay_for', { d: durTxt(p.dur) })}</div></div>
          </button>
        </div>
        <button class="rm" onclick="removeStop(${it.idx})" aria-label="remove">${ic('x')}</button></div></div>`;
    }
  });
  if (!day.stops.length) {
    tl += `<div class="card empty-card"><div class="doodle">🗾</div><b>${t('empty_day')}</b><div class="small muted">${day.note ? esc(tx(day.note)) : t('empty_day_sub')}</div></div>`;
    if (s.he) {
      tl += `<div class="stop"><div class="time">20:00</div>
        <div class="place hotel-card"><div class="thumb hotel-thumb">${ic('hotel')}</div>
        <div class="grow"><div class="t">${esc(s.he.name)}</div><div class="s">${t('back_hotel')}</div></div></div></div>`;
    }
  }

  const allStops = s.items.filter(x => x.type === 'stop').map(x => x.place.gps).filter(Boolean);
  const routeAll = day.mode === 'car' && allStops.length
    ? dirUrl(s.hs?.gps, s.he?.gps || allStops[allStops.length - 1], 'car', s.he ? allStops : allStops.slice(0, -1)) : null;
  const dayRests = (state.restaurants || []).filter(r => r.day === i + 1);

  $('#s-day').innerHTML = `
  <header class="topbar"><button class="pill" onclick="go('overview')">${ic('back')}${t('overview')}</button>
    <div class="tb-right"><button class="pill" onclick="dayNav(-1)" ${i === 0 ? 'disabled' : ''}>‹</button><button class="pill" onclick="dayNav(1)" ${i === state.days.length - 1 ? 'disabled' : ''}>›</button></div></header>
  <div class="eyebrow">${t('day_n', { n: i + 1 })} · ${fmtD(dateOfDay(i), { weekday:'long', day:'numeric', month:'long' })}</div>
  <h1 class="title"><span class="hl" contenteditable="true" spellcheck="false" onblur="renameDay(this.textContent)">${esc(tx(day.title))}</span></h1>
  <div class="seg">${Object.keys(MODES).map(m => `<button class="${day.mode === m ? 'on' : ''}" onclick="setMode('${m}')">${ic(MODES[m].ic)}${t('mode_' + m)}</button>`).join('')}</div>
  <div class="meter lv-${ld.lv}"><div class="meter-bar"><i style="width:${ld.pct}%"></i></div>
    <div><b>${t('lv_' + ld.lv)}</b> · ${ld.n ? t('meter_txt', { n: ld.n, total: durTxt(s.total), travel: durTxt(s.travel) }) : t('meter_empty')}</div></div>
  <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">
    <label class="start-time">${t('start_at')} <input type="time" value="${day.start}" onchange="setStart(this.value)"></label>
    ${nStops > 1 ? `<button class="chip c-matcha" onclick="sortDayByGps(${i})">✨ ${t('sort_route')}</button>` : ''}
  </div>
  ${nStops > 1 ? `<div class="small muted" style="margin-top:4px">💡 ${t('drag_hint')}</div>` : ''}
  <div class="tl">${tl}</div>
  <div class="day-actions">
    <button class="btn btn-ink" onclick="openAddPlace()">${ic('plus')}${t('add_place')}</button>
    ${routeAll ? `<a class="btn btn-soft" href="${routeAll}" target="_blank" rel="noopener">${ic('route')}${t('route_all')}</a>` : ''}
    <a class="btn btn-soft" href="${calUrl(i)}" target="_blank" rel="noopener">${ic('cal')}${t('to_calendar')}</a>
  </div>
  <h3 class="sec">${t('day_rest_sec')}</h3>
  <div class="pick-list">${dayRests.map(r => `<div class="place"><div class="thumb rest-thumb">${ic('food')}</div>
    <button class="grow" style="text-align:left" onclick="openRestaurant('${r.id}')"><div class="t">${esc(r.name)}${r.nameJa ? ` <span class="muted small">· ${esc(r.nameJa)}</span>` : ''}</div><div class="s">${r.meal ? t('meal_' + r.meal) : ''}${r.area ? ' · ' + esc(r.area) : ''}${r.note ? ' · ' + esc(r.note) : ''}</div></button>
    <a class="leg-go" href="${r.gps ? dirUrl(null, r.gps, day.mode) : mapUrl([r.nameJa || r.name, r.area, r.address].filter(Boolean).join(' '))}" target="_blank" rel="noopener">${t('navigate')}</a></div>`).join('')}
    <button class="hotel-mini empty" onclick="openRestaurant(null,${i + 1})">${ic('food')}<div><b>${t('add_rest_cta')}</b><div class="small muted">${t('add_rest_why')}</div></div></button></div>
  ${!s.hs && !s.he ? `<p class="note warn">${t('no_hotel_warn')} <a href="#" onclick="openHotel();return false">${t('add_hotel_cta')}</a></p>` : ''}
  ${day.mode === 'transit' && day.stops.length ? `<p class="note">${t('transit_hint')}</p>` : ''}`;
}
function dayNav(d) { ui.day = Math.max(0, Math.min(state.days.length - 1, ui.day + d)); renderDay(); }
function setMode(m) { state.days[ui.day].mode = m; recalcDayLegs(ui.day); saveState(); renderDay(); }
function setStart(v) { if (v) { state.days[ui.day].start = v; saveState(); renderDay(); } }
function renameDay(v) {
  v = v.trim(); if (!v) return renderDay();
  const d = state.days[ui.day];
  d.title = { ...(typeof d.title === 'object' ? d.title : {}), [L()]: v };
  saveState();
}
function removeStop(idx) {
  const d = state.days[ui.day], [rm] = d.stops.splice(idx, 1);
  recalcDayLegs(ui.day);
  saveState(); renderDay();
  toast(t('removed', { p: pName(placeOf(rm.id)) }));
}
function estLegMin(g1, g2, mode = 'transit') {
  const km = typeof gpsDistKm === 'function' ? gpsDistKm(g1, g2) : null;
  if (km == null) return mode === 'car' ? 25 : 30;
  if (mode === 'walk') return Math.max(5, Math.min(180, Math.round(km * 14)));
  if (mode === 'car') return Math.max(10, Math.min(240, Math.round(10 + km * 1.6)));
  return Math.max(10, Math.min(240, Math.round(12 + km * 2.1)));
}
function recalcDayLegs(dayIdx) {
  const d = state.days[dayIdx];
  if (!d || !d.stops.length) return;
  const iso = isoOf(dateOfDay(dayIdx));
  const hs = hotelMorning(iso);
  let prevGps = hs?.gps || null;
  d.stops.forEach(s => {
    const p = placeOf(s.id);
    if (prevGps && p?.gps) s.leg = estLegMin(prevGps, p.gps, d.mode);
    if (p?.gps) prevGps = p.gps;
  });
}
function reorderStop(fromIdx, toIdx) {
  const stops = state.days[ui.day]?.stops;
  if (!stops || fromIdx === toIdx || fromIdx < 0 || toIdx < 0 || fromIdx >= stops.length || toIdx >= stops.length) return;
  const [moved] = stops.splice(fromIdx, 1);
  stops.splice(toIdx, 0, moved);
  recalcDayLegs(ui.day);
  saveState();
  if ($('#s-day')) renderDay();
}
function moveStop(idx, dir) {
  reorderStop(idx, idx + dir);
}
function placeDaysOf(placeId) {
  if (!placeId || !state.days) return [];
  const out = [];
  state.days.forEach((d, idx) => {
    if (d.stops && d.stops.some(s => s.id === placeId)) out.push(idx);
  });
  return out;
}
function ensurePlaceInDb(placeId) {
  if (PLACES[placeId]) return PLACES[placeId];
  const catalog = typeof getAllCatalogPlaces === 'function' ? getAllCatalogPlaces() : {};
  const cp = catalog[placeId];
  if (cp) {
    state.customPlaces = state.customPlaces || {};
    const rec = { ...cp, custom: true };
    delete rec.zoneKey; delete rec.fromUserDb;
    state.customPlaces[placeId] = rec;
    if (typeof mergePlaces === 'function') mergePlaces();
    else PLACES[placeId] = rec;
    return PLACES[placeId];
  }
  return null;
}
function changePlaceDay(placeId, targetDayIdx, keepSheet = '') {
  ensurePlaceInDb(placeId);
  const p = placeOf(placeId);
  state.days.forEach((d, idx) => {
    const before = d.stops.length;
    d.stops = d.stops.filter(s => s.id !== placeId);
    if (d.stops.length !== before) recalcDayLegs(idx);
  });
  if (targetDayIdx >= 0 && targetDayIdx < state.days.length) {
    const target = state.days[targetDayIdx];
    if (!target.stops.some(s => s.id === placeId)) {
      target.stops.push({ id: placeId, leg: target.mode === 'car' ? 25 : 30 });
      recalcDayLegs(targetDayIdx);
    }
    saveState();
    if ($('#s-day')) renderDay();
    if (keepSheet === 'addPlace') openAddPlace();
    else if (keepSheet === 'place') openPlace(placeId);
    else if (keepSheet === 'ai') { if ($('#s-ai')) renderAI(); }
    else { closeSheet(); rerender(); }
    toast(t('moved_to_day', { p: pName(p), d: targetDayIdx + 1 }));
  } else {
    saveState();
    if ($('#s-day')) renderDay();
    if (keepSheet === 'addPlace') openAddPlace();
    else if (keepSheet === 'place') openPlace(placeId);
    else if (keepSheet === 'ai') { if ($('#s-ai')) renderAI(); }
    else { closeSheet(); rerender(); }
    toast(t('removed', { p: pName(p) }));
  }
}
function moveStopToDay(placeId, targetDayIdx) {
  changePlaceDay(placeId, targetDayIdx, '');
}
function sortDayByGps(dayIdx = ui.day) {
  const d = state.days[dayIdx];
  if (!d || d.stops.length < 2) return;
  const catalog = typeof getAllCatalogPlaces === 'function' ? getAllCatalogPlaces() : PLACES;
  const ordered = typeof optimizeStopsOrder === 'function'
    ? optimizeStopsOrder(d.stops.map(s => s.id), catalog, dayIdx, d.mode)
    : d.stops.map(s => ({ id: s.id, leg: s.leg }));
  const byId = new Map(d.stops.map(s => [s.id, s]));
  d.stops = ordered.map(item => {
    const id = typeof item === 'object' ? item.id : item;
    return { ...(byId.get(id) || { id }), id, leg: item.leg || 25 };
  });
  recalcDayLegs(dayIdx);
  saveState();
  if ($('#s-day')) renderDay();
  toast(t('route_sorted'));
}

let dragState = null, holdTimer = null;
function holdStopDrag(ev, idx) {
  if (ev.target.closest('button.rm, .stop-mv, .drag-handle, a')) return;
  clearTimeout(holdTimer);
  const startX = ev.clientX, startY = ev.clientY;
  const cancelHold = () => { clearTimeout(holdTimer); window.removeEventListener('pointermove', checkMove); window.removeEventListener('pointerup', cancelHold); };
  const checkMove = e => { if (Math.hypot(e.clientX - startX, e.clientY - startY) > 10) cancelHold(); };
  window.addEventListener('pointermove', checkMove);
  window.addEventListener('pointerup', cancelHold);
  holdTimer = setTimeout(() => { cancelHold(); startStopDrag(ev, idx); }, 320);
}
function startStopDrag(ev, idx) {
  if (state.days[ui.day].stops.length < 2) return;
  ev.preventDefault();
  ev.stopPropagation();
  const rows = [...document.querySelectorAll('#s-day .stop-item')];
  const rowEl = rows.find(r => +r.dataset.stopIdx === idx);
  if (!rowEl) return;
  rowEl.classList.add('dragging');
  dragState = { fromIdx: idx, toIdx: idx };
  const onMove = e => {
    if (!dragState) return;
    const y = e.clientY;
    rows.forEach(r => r.classList.remove('drop-above', 'drop-below'));
    for (const r of rows) {
      const rect = r.getBoundingClientRect();
      if (y >= rect.top && y <= rect.bottom) {
        const overIdx = +r.dataset.stopIdx;
        dragState.toIdx = overIdx;
        if (overIdx < dragState.fromIdx) r.classList.add('drop-above');
        else if (overIdx > dragState.fromIdx) r.classList.add('drop-below');
        break;
      }
    }
  };
  const onEnd = () => {
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onEnd);
    window.removeEventListener('pointercancel', onEnd);
    rows.forEach(r => r.classList.remove('dragging', 'drop-above', 'drop-below'));
    if (dragState && dragState.fromIdx !== dragState.toIdx) {
      reorderStop(dragState.fromIdx, dragState.toIdx);
    }
    dragState = null;
  };
  window.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', onEnd);
  window.addEventListener('pointercancel', onEnd);
}

function openAddPlace() {
  const catalog = typeof getAllCatalogPlaces === 'function' ? getAllCatalogPlaces() : PLACES;
  const allEntries = Object.entries(catalog);
  // เรียงสถานที่ที่ยังไม่ได้เลือกไว้ด้านบน และสถานที่ที่เลือกไปแล้วไว้ด้านล่าง (ตัวบาง/สีจางแต่เปลี่ยนวันได้)
  allEntries.sort(([idA], [idB]) => {
    const pickedA = placeDaysOf(idA).length > 0 ? 1 : 0;
    const pickedB = placeDaysOf(idB).length > 0 ? 1 : 0;
    const inBaseA = PLACES[idA] ? 0 : 1;
    const inBaseB = PLACES[idB] ? 0 : 1;
    return pickedA - pickedB || inBaseA - inBaseB;
  });
  openSheet(`<h2 class="sheet-title">${t('add_place')}</h2><p class="muted small">${t('add_place_sub')}</p>
    <button class="place create-place" onclick="openCustomPlace()"><div class="thumb hotel-thumb">${ic('plus')}</div><div class="grow"><div class="t">${t('new_place')}</div><div class="s">${t('new_place_hint')}</div></div></button>
    <div class="pick-list">${allEntries.map(([id, p]) => {
      const days = placeDaysOf(id);
      const isPicked = days.length > 0;
      const artSvg = ART[p.art] || ART.city;
      if (!isPicked) {
        return `<button class="place" onclick="addStop('${id}')"><div class="thumb">${artSvg}</div>
          <div class="grow"><div class="t">${esc(pName(p))}</div><div class="s">${esc(tx(p.area))} · ${durTxt(p.dur || 60)}</div></div>${ic('plus', 'add-ic')}</button>`;
      }
      const curDayIdx = days[0];
      const dayBadge = t('picked_in_day', { d: days.map(d => d + 1).join(', ') });
      return `<div class="place is-picked">
        <div class="thumb" onclick="openPlace('${id}')" style="cursor:pointer">${artSvg}</div>
        <div class="grow" onclick="openPlace('${id}')" style="cursor:pointer">
          <div class="t">${esc(pName(p))} <span class="chip c-matcha mini-chip">${esc(dayBadge)}</span></div>
          <div class="s">${esc(tx(p.area))} · ${durTxt(p.dur || 60)}</div>
        </div>
        <select class="day-move-sel" aria-label="${t('change_day')}" onchange="changePlaceDay('${id}', +this.value, 'addPlace')">
          ${state.days.map((d, k) => `<option value="${k}" ${curDayIdx === k ? 'selected' : ''}>📅 ${t('day_n', { n: k + 1 })} (${dShort(k)})</option>`).join('')}
          <option value="-1">${t('remove_from_trip')}</option>
        </select>
      </div>`;
    }).join('') || `<p class="muted">${t('all_added')}</p>`}</div>`);
}
function addStop(id) {
  ensurePlaceInDb(id);
  const d = state.days[ui.day];
  if (!d.stops.some(s => s.id === id)) {
    d.stops.push({ id, leg: d.mode === 'car' ? 30 : 35 });
    recalcDayLegs(ui.day);
  }
  saveState(); closeSheet(); renderDay();
  const ld = loadOf(ui.day);
  toast(ld.lv === 'packed' ? t('too_packed') : t('added', { p: pName(placeOf(id)) }));
}

/* ============ PLACE SHEET & SMART PHOTO / DRIVE / EXIF GPS / LIVE CAMERA ============ */
let camStream = null, camFacing = 'environment', camTargetId = null;

function stopAppCamera() {
  if (camStream) {
    try { camStream.getTracks().forEach(tr => tr.stop()); } catch (e) { /* ignore */ }
    camStream = null;
  }
  const box = $('#camBox');
  if (box) box.classList.remove('on');
}

function getEntityGps(id) {
  if (!id) return '';
  if (PLACES[id]?.gps) return PLACES[id].gps;
  if (state.customPlaces?.[id]?.gps) return state.customPlaces[id].gps;
  const h = (state.hotels || []).find(x => x.id === id);
  if (h?.gps) return h.gps;
  const r = (state.restaurants || []).find(x => x.id === id);
  if (r?.gps) return r.gps;
  const mList = state.photoMeta?.[id] || [];
  const withGps = mList.find(m => m && m.gps);
  return withGps ? withGps.gps : '';
}

function applyGpsToEntity(id, rawGps, showToast = false) {
  const g = parseGps(rawGps);
  if (!g || !id) return '';
  state.photoMeta = state.photoMeta || {};
  const mList = state.photoMeta[id] = state.photoMeta[id] || [];
  mList.forEach(m => { if (m && !m.gps) m.gps = g; });

  // อัปเดตช่อง input GPS ที่เปิดอยู่ในหน้าต่างปัจจุบันทันที
  if ($('#phGpsInput')) $('#phGpsInput').value = g;
  if ($('#pGps')) { $('#pGps').value = g; if (typeof pGpsCheck === 'function') pGpsCheck(); }
  if ($('#hGps')) { $('#hGps').value = g; if (typeof gpsCheck === 'function') gpsCheck(); }
  if ($('#rGps')) { $('#rGps').value = g; if (typeof rGpsCheck === 'function') rGpsCheck(); }

  const h = (state.hotels || []).find(x => x.id === id);
  const r = (state.restaurants || []).find(x => x.id === id);
  if (h) {
    h.gps = g;
  } else if (r) {
    r.gps = g;
  } else if (PLACES[id] || state.customPlaces?.[id]) {
    ensurePlaceInDb(id);
    const p = placeOf(id);
    state.customPlaces = state.customPlaces || {};
    state.customPlaces[id] = { ...(state.customPlaces[id] || p), gps: g, custom: true };
    if (PLACES[id]) PLACES[id].gps = g;
    if (typeof mergePlaces === 'function') mergePlaces();
  }
  if ($('#pGps') && !$('#pGps').value.trim()) {
    $('#pGps').value = g;
    if (typeof pGpsCheck === 'function') pGpsCheck();
  }
  if ($('#phGpsInput')) $('#phGpsInput').value = g;
  state.days.forEach((_, idx) => recalcDayLegs(idx));
  saveState();
  if (showToast) toast(t('photo_gps_saved'));
  return g;
}

function getPhotoMeta(id, src, idx) {
  const list = state.photoMeta?.[id] || [];
  return list.find(m => m && m.url === src) || list[idx] || {};
}

function setPhotoMeta(id, src, meta) {
  state.photoMeta = state.photoMeta || {};
  const list = state.photoMeta[id] = state.photoMeta[id] || [];
  const ex = list.find(m => m && m.url === src);
  if (ex) Object.assign(ex, meta, { url: src });
  else list.push({ url: src, ...meta });
}

/** อ่านพิกัด GPS จาก EXIF binary ของไฟล์ JPEG (รองรับทั้งกล้องมือถือและไฟล์ภาพจากคลัง) */
function parseExifGpsFromBuffer(buf) {
  try {
    const view = new DataView(buf);
    if (view.byteLength < 12 || view.getUint16(0, false) !== 0xFFD8) return null;
    let offset = 2;
    while (offset + 4 <= view.byteLength) {
      const marker = view.getUint16(offset, false);
      offset += 2;
      if (marker === 0xFFE1) {
        const len = view.getUint16(offset, false);
        if (offset + 8 <= view.byteLength && view.getUint32(offset + 2, false) === 0x45786966) {
          const tiff = offset + 8;
          const little = view.getUint16(tiff, false) === 0x4949;
          const u16 = p => view.getUint16(p, little);
          const u32 = p => view.getUint32(p, little);
          const rat = p => {
            const num = u32(p), den = u32(p + 4);
            return den ? num / den : 0;
          };
          const ifd0 = tiff + u32(tiff + 4);
          if (ifd0 + 2 > view.byteLength) return null;
          const entries = u16(ifd0);
          let gpsIfd = 0;
          for (let i = 0; i < entries; i++) {
            const ep = ifd0 + 2 + i * 12;
            if (ep + 12 > view.byteLength) break;
            if (u16(ep) === 0x8825) { gpsIfd = tiff + u32(ep + 8); break; }
          }
          if (!gpsIfd || gpsIfd + 2 > view.byteLength) return null;
          const gEntries = u16(gpsIfd);
          let latRef = 'N', lonRef = 'E', lat = null, lon = null;
          for (let i = 0; i < gEntries; i++) {
            const ep = gpsIfd + 2 + i * 12;
            if (ep + 12 > view.byteLength) break;
            const tag = u16(ep);
            if (tag === 1) {
              const ch = String.fromCharCode(view.getUint8(ep + 8));
              if (ch === 'S' || ch === 'N') latRef = ch;
            } else if (tag === 3) {
              const ch = String.fromCharCode(view.getUint8(ep + 8));
              if (ch === 'W' || ch === 'E') lonRef = ch;
            } else if (tag === 2 || tag === 4) {
              const valOff = tiff + u32(ep + 8);
              if (valOff + 24 <= view.byteLength) {
                const deg = rat(valOff) + rat(valOff + 8) / 60 + rat(valOff + 16) / 3600;
                if (tag === 2) lat = deg; else lon = deg;
              }
            }
          }
          if (lat !== null && lon !== null && isFinite(lat) && isFinite(lon) && (lat !== 0 || lon !== 0)) {
            const fLat = (latRef === 'S' ? -lat : lat).toFixed(5);
            const fLon = (lonRef === 'W' ? -lon : lon).toFixed(5);
            return parseGps(`${fLat}, ${fLon}`);
          }
        }
        offset += len;
      } else if ((marker & 0xFF00) !== 0xFF00) {
        break;
      } else {
        offset += view.getUint16(offset, false);
      }
    }
  } catch (e) { /* ignore malformed exif */ }
  return null;
}

async function extractExifGps(file) {
  if (!file || typeof file.slice !== 'function') return null;
  try {
    const slice = file.slice(0, 131072);
    const buf = typeof slice.arrayBuffer === 'function'
      ? await slice.arrayBuffer()
      : await new Promise((res, rej) => {
        const fr = new FileReader();
        fr.onload = () => res(fr.result);
        fr.onerror = rej;
        fr.readAsArrayBuffer(slice);
      });
    return parseExifGpsFromBuffer(buf);
  } catch (e) { return null; }
}

function getLiveGps(timeoutMs = 5500) {
  return new Promise(resolve => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      pos => resolve(`${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 60000 }
    );
  });
}

function photosBox(id) {
  const ph = photos[id] || [];
  const curGps = getEntityGps(id);
  return `<div id="photosBoxWrap"><h3 class="sec">${t('my_photos')} <span class="muted">${ph.length ? '(' + ph.length + ')' : ''}</span>${cloudOn() ? `<span class="chip c-sora mini-chip">☁ Drive</span>` : ''}</h3>
    <div class="small muted" style="margin:-4px 0 6px">✨ ${t('photo_comp_info')}</div>
    <div class="ph-gps-box">
      <div class="small" style="font-weight:600">${t('photo_gps_bar')}</div>
      <div class="ph-gps-row">
        <input id="phGpsInput" class="input mono" value="${esc(curGps)}" placeholder="${t('photo_gps_ph')}">
        <button type="button" class="chip" onclick="fillPhotoGpsHere('${id}')">${ic('locate')}${t('use_here')}</button>
        <button type="button" class="chip c-matcha" onclick="savePhotoPlaceGps('${id}')">✓ ${t('photo_gps_save')}</button>
      </div>
    </div>
    <div id="camBox" class="cam-box">
      <div class="cam-video-wrap"><video id="camVideo" autoplay playsinline muted></video></div>
      <div class="cam-bar">
        <button type="button" class="chip" onclick="switchAppCamera('${id}')">🔄 ${t('photo_cam_switch')}</button>
        <button type="button" class="btn btn-sakura" style="height:38px;padding:0 16px" onclick="snapAppCamera('${id}')">${t('photo_cam_snap')}</button>
        <button type="button" class="chip" onclick="stopAppCamera()">✕</button>
      </div>
    </div>
    <div class="photos">${ph.map((src, k) => {
      const m = getPhotoMeta(id, src, k);
      const gTag = m.gps || curGps;
      const kbTag = m.sizeKB ? `${m.sizeKB}KB` : '';
      return `<div class="photo" onclick="openPhotoViewer('${id}',${k})">
        <img src="${esc(src)}" alt="" loading="lazy" referrerpolicy="no-referrer">
        ${gTag ? `<span class="ph-gps-tag">📍 ${esc(gTag)}</span>` : ''}
        ${kbTag ? `<span class="ph-kb-tag">${esc(kbTag)}</span>` : ''}
        <button type="button" class="ph-del" onclick="event.stopPropagation();delPhoto('${id}',${k})" aria-label="delete">${ic('x')}</button>
        ${src.startsWith('data:') && cloudOn() ? '<span class="ph-local">⏳</span>' : ''}
      </div>`;
    }).join('')}
      <button type="button" class="photo add" onclick="toggleAppCamera('${id}')">${ic('camera')}<span>${t('photo_cam_live')}</span></button>
      <label class="photo add">${ic('camera')}<span>${t('take_photo')}</span><input type="file" accept="image/*" capture="environment" hidden onchange="addPhotos('${id}',this.files,'camera')"></label>
      <label class="photo add">${ic('plus')}<span>${t('from_gallery')}</span><input type="file" accept="image/*" multiple hidden onchange="addPhotos('${id}',this.files,'gallery')"></label></div></div>`;
}

function savePhotoPlaceGps(id) {
  const raw = ($('#phGpsInput')?.value || '').trim();
  if (!raw) return toast(t('gps_bad'));
  const g = applyGpsToEntity(id, raw, true);
  if (!g) return toast(t('gps_bad'));
  refreshPhotoView(id);
}

async function fillPhotoGpsHere(id) {
  toast(t('geo_wait'));
  const g = await getLiveGps(8000);
  if (!g) return toast(t('geo_fail'));
  applyGpsToEntity(id, g, true);
  refreshPhotoView(id);
}

async function toggleAppCamera(id) {
  const box = $('#camBox');
  if (camStream && box && box.classList.contains('on')) {
    stopAppCamera();
    return;
  }
  stopAppCamera();
  camTargetId = id;
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    // ถ้าเบราว์เซอร์ไม่รองรับ getUserMedia ให้เปิดกล้องมือถือผ่าน input capture ทันที
    const inp = document.querySelector('.photo.add input[capture]');
    if (inp) inp.click();
    return;
  }
  try {
    camStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: camFacing }, width: { ideal: 1920 }, height: { ideal: 1440 } },
      audio: false,
    });
    if (box) box.classList.add('on');
    const video = $('#camVideo');
    if (video) {
      video.srcObject = camStream;
      await video.play().catch(() => {});
    }
    // ดึงพิกัด GPS ปัจจุบันเตรียมไว้ขณะเปิดกล้อง
    getLiveGps(6000).then(g => {
      if (g && $('#phGpsInput') && !$('#phGpsInput').value.trim()) {
        $('#phGpsInput').value = g;
      }
    });
  } catch (e) {
    stopAppCamera();
    const inp = document.querySelector('.photo.add input[capture]');
    if (inp) inp.click();
  }
}

function switchAppCamera(id) {
  camFacing = camFacing === 'environment' ? 'user' : 'environment';
  stopAppCamera();
  toggleAppCamera(id || camTargetId);
}

async function snapAppCamera(id) {
  const video = $('#camVideo');
  if (!video || !video.videoWidth) return;
  const c = document.createElement('canvas');
  c.width = video.videoWidth;
  c.height = video.videoHeight;
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(video, 0, 0, c.width, c.height);
  stopAppCamera();
  const blob = await new Promise(res => c.toBlob(res, 'image/jpeg', 0.92));
  if (blob) await addPhotos(id, [blob], 'camera');
}

function openPhotoViewer(id, k) {
  const list = photos[id] || [];
  const src = list[k];
  if (!src) return;
  const m = getPhotoMeta(id, src, k);
  const gps = m.gps || getEntityGps(id);
  const fid = typeof driveIdOf === 'function' ? driveIdOf(src) : null;
  const hiResSrc = fid ? `https://drive.google.com/thumbnail?id=${fid}&sz=w1600` : src;
  const driveViewUrl = fid ? `https://drive.google.com/file/d/${fid}/view` : src;
  const placeTitle = PLACES[id] ? pName(PLACES[id]) : ((state.hotels || []).find(h => h.id === id)?.name || (state.restaurants || []).find(r => r.id === id)?.name || id);
  const b = $('#big');
  if (!b) return;
  b.innerHTML = `<button class="big-x" onclick="closeBig()" aria-label="close">${ic('x')}</button>
    <div class="big-body" style="padding-top:54px">
      <div class="big-hint">📸 ${esc(placeTitle)} (${k + 1}/${list.length})${m.sizeKB ? ` · คมชัด HD (${m.origKB ? `${m.origKB}KB → ` : ''}${m.sizeKB}KB)` : ''}</div>
      <img class="ph-viewer-img" src="${esc(hiResSrc)}" alt="${esc(placeTitle)}" referrerpolicy="no-referrer">
      ${gps ? `<div class="gps" style="max-width:440px;width:100%">
        <div style="text-align:left"><div class="small muted">📍 GPS ของภาพ / สถานที่</div><code>${esc(gps)}</code></div>
        <div style="display:flex;gap:6px">
          <button class="mini" onclick="copyTxt('${esc(gps)}')">${t('copy')}</button>
          <a class="mini" style="text-decoration:none;background:var(--sora);color:var(--sora-ink);padding:4px 10px;border-radius:8px" href="${mapUrl(gps)}" target="_blank" rel="noopener">${t('view_map')}</a>
        </div>
      </div>` : ''}
      <div class="cat-pick" style="justify-content:center;margin-top:8px">
        <a class="btn btn-ink" style="padding:0 18px;height:42px;text-decoration:none" href="${esc(hiResSrc)}" download="${esc(id + '_' + (k + 1) + '.jpg')}" target="_blank" rel="noopener">⬇ ${t('photo_download')}</a>
        ${fid ? `<a class="btn btn-soft" style="padding:0 18px;height:42px;text-decoration:none" href="${esc(driveViewUrl)}" target="_blank" rel="noopener">☁ ${t('photo_view_drive')}</a>` : ''}
      </div>
    </div>`;
  b.classList.add('on');
}

function setPlaceArt(id, artKey) {
  if (!ART[artKey]) return;
  ensurePlaceInDb(id);
  const p = placeOf(id);
  state.customPlaces = state.customPlaces || {};
  state.customPlaces[id] = { ...(state.customPlaces[id] || p), art: artKey, custom: true };
  if (PLACES[id]) PLACES[id].art = artKey;
  if (typeof mergePlaces === 'function') mergePlaces();
  saveState();
  if ($('#s-day')) renderDay();
  if ($('#sheet')) openPlace(id);
  toast(t('art_changed'));
}

function openPlace(id) {
  ensurePlaceInDb(id);
  const p = placeOf(id);
  const hi = (p.hi?.[L()]?.length ? p.hi[L()] : p.hi?.th) || [], miss = (p.miss?.[L()]?.length ? p.miss[L()] : p.miss?.th) || [];
  const custom = !!state.customPlaces?.[id];
  const assignedDays = placeDaysOf(id);
  const curArt = ART[p.art] ? p.art : 'city';
  openSheet(`<div class="cover" id="placeCoverArt">${ART[curArt]}</div>
    <h2 class="sheet-title">${esc(pName(p))}</h2><div class="jpname">${esc(p.name.ja || p.name.th)}${p.ro ? ' · ' + esc(p.ro) : ''}${custom ? ` · <span class="chip c-yuzu mini-chip">${t('my_place')}</span>` : p.src === 'sheet' ? ` · <span class="chip c-matcha mini-chip">Sheet</span>` : ''}</div>
    <h3 class="sec">${t('move_day')}</h3>
    <div class="cat-pick">
      ${state.days.map((d, k) => {
        const isOn = assignedDays.includes(k);
        return `<button type="button" class="chip ${isOn ? 'c-matcha on' : ''}" onclick="changePlaceDay('${id}',${k},'place')">${isOn ? '✓ ' : ''}${t('day_n', { n: k + 1 })} · ${dShort(k)}</button>`;
      }).join('')}
      ${assignedDays.length ? `<button type="button" class="chip c-sakura" onclick="changePlaceDay('${id}',-1,'place')">${t('remove_from_trip')}</button>` : ''}
    </div>
    <h3 class="sec">${t('look')} <span class="muted small">(${t('pick_art_hint')})</span></h3>
    <div class="art-pick">${ARTS.map(a => `<button type="button" class="${curArt === a ? 'on' : ''}" data-v="${a}" onclick="setPlaceArt('${id}','${a}')"><span class="art-box">${ART[a]}</span><span class="art-lbl">${t(ART_KEYS[a])}</span></button>`).join('')}</div>
    ${hi.length ? `<h3 class="sec">${t('highlights')}</h3><div class="list">${hi.map(x => `<div class="li"><span class="b c-sora">✓</span>${esc(x)}</div>`).join('')}</div>` : ''}
    ${miss.length ? `<h3 class="sec">${t('dont_miss')}</h3><div class="list">${miss.map(x => `<div class="li"><span class="b c-sakura">!</span>${esc(x)}</div>`).join('')}</div>` : ''}
    <h3 class="sec">${t('for_car')}</h3>
    ${p.gps ? `<div class="gps"><div><div class="small muted">GPS</div><code>${esc(p.gps)}</code></div><button class="mini" onclick="copyTxt('${esc(p.gps)}')">${t('copy')}</button></div>` : ''}
    <div class="gps"><div><div class="small muted">Mapcode</div>${p.mapcode ? `<code>${esc(p.mapcode)}</code>` : `<span class="muted small">${t('mapcode_soon')}</span>`}</div>${p.mapcode ? `<button class="mini" onclick="copyTxt('${esc(p.mapcode)}')">${t('copy')}</button>` : ''}</div>
    ${tx(p.transit) ? `<h3 class="sec">${t('public_transit')}</h3><div class="gps start">${ic('train')}<div class="small">${esc(tx(p.transit))}</div></div>` : ''}
    ${photosBox(id)}
    <div class="actions">
      ${p.gps ? `<a class="btn btn-ink" href="${dirUrl(null, p.gps, state.days[ui.day]?.mode || 'car')}" target="_blank" rel="noopener">${ic('pin')}${t('navigate')}</a>` : ''}
      <button class="btn btn-sakura" onclick="showToLocal('${id}')">${ic('talk')}${t('show_local')}</button>
      <button class="btn btn-soft" onclick="openCustomPlace('${id}')">${ic('edit')}${t('edit')}</button>
    </div>`);
}

/** บีบอัดภาพแบบ Multi-step Step-down Scaling รักษาความคมชัดสูง (HD 1600px) แต่ลดขนาดไฟล์ลง ~90% */
function compressImage(file, max = 1600, q = .85) {
  return new Promise((res, rej) => {
    const isStr = typeof file === 'string';
    const img = new Image();
    const url = isStr ? file : URL.createObjectURL(file);
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.width || 1, img.height || 1));
      const targetW = Math.max(1, Math.round(img.width * k));
      const targetH = Math.max(1, Math.round(img.height * k));

      // ย่อทีละขั้น (Step-down halving) เมื่อภาพต้นฉบับใหญ่กว่า 2 เท่า เพื่อป้องกันภาพแตกหรือเบลอ
      let curSource = img, curW = img.width, curH = img.height;
      while (curW * 0.5 > targetW && curH * 0.5 > targetH) {
        curW = Math.max(targetW, Math.round(curW * 0.5));
        curH = Math.max(targetH, Math.round(curH * 0.5));
        const stepCanvas = document.createElement('canvas');
        stepCanvas.width = curW; stepCanvas.height = curH;
        const sCtx = stepCanvas.getContext('2d');
        sCtx.imageSmoothingEnabled = true;
        sCtx.imageSmoothingQuality = 'high';
        sCtx.drawImage(curSource, 0, 0, curW, curH);
        curSource = stepCanvas;
      }

      const c = document.createElement('canvas');
      c.width = targetW; c.height = targetH;
      const ctx = c.getContext('2d');
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(curSource, 0, 0, targetW, targetH);
      if (!isStr) URL.revokeObjectURL(url);

      let dataUrl = c.toDataURL('image/jpeg', q);
      // ถ้าไฟล์ยังใหญ่เกิน ~450KB ให้ปรับบีบอัดเพิ่มเล็กน้อยโดยคงความละเอียด 1600px เท่าเดิม
      if (dataUrl.length > 620000 && q > 0.76) {
        dataUrl = c.toDataURL('image/jpeg', 0.78);
      }
      res(dataUrl);
    };
    img.onerror = () => { if (!isStr) URL.revokeObjectURL(url); rej(new Error('bad image')); };
    img.src = url;
  });
}
function refreshPhotoView(id) {
  if ($('#sheet')?.classList.contains('on')) {
    if ($('#pName')) {
      const wrap = $('#photosBoxWrap');
      if (wrap) wrap.outerHTML = photosBox(id);
      return;
    }
    if (PLACES[id]) openPlace(id);
    else if (state.hotels.some(h => h.id === id)) openHotel(id);
    else if ((state.restaurants || []).some(r => r.id === id)) openRestaurant(id);
  }
  if (['day', 'hotels', 'restaurants'].includes(ui.screen)) rerender();
}
async function addPhotos(id, files, source = 'gallery') {
  if (!files || !files.length) return;
  const list = photos[id] = photos[id] || [];
  const added = [];
  const inputGps = parseGps(($('#phGpsInput')?.value || $('#pGps')?.value || '').trim());
  let detectedGps = inputGps || '';
  let lastOrigKB = 0, lastCompKB = 0;

  if (source === 'camera' && !detectedGps) {
    const liveGps = await getLiveGps(4500);
    if (liveGps) detectedGps = liveGps;
  }

  for (const f of files) {
    try {
      const exifGps = await extractExifGps(f);
      if (exifGps) {
        detectedGps = exifGps;
        toast(t('photo_exif_found', { gps: exifGps }));
      }
      const origKB = f.size ? Math.max(1, Math.round(f.size / 1024)) : 0;
      const d = await compressImage(f, cloudOn() ? 1600 : 1280, cloudOn() ? 0.85 : 0.80);
      const compKB = Math.max(1, Math.round((d.length * 3) / 4 / 1024));
      lastOrigKB = origKB; lastCompKB = compKB;
      const photoGps = exifGps || detectedGps || getEntityGps(id) || '';
      list.push(d);
      setPhotoMeta(id, d, { gps: photoGps, origKB, sizeKB: compKB, at: Date.now() });
      added.push({ dataUrl: d, gps: photoGps, origKB, sizeKB: compKB });
    } catch (e) {
      toast(t('photo_bad'));
    }
  }

  if (detectedGps) {
    applyGpsToEntity(id, detectedGps, false);
  }

  if (!savePhotos(photos) && !cloudOn()) list.splice(list.length - added.length);
  refreshPhotoView(id);
  if (!cloudOn()) {
    toast(lastOrigKB ? t('photo_comp_done', { orig: lastOrigKB, comp: lastCompKB }) : t('photo_saved'));
    return;
  }
  toast(t('photo_uploading'));
  let ok = 0;
  for (const item of added) {
    const url = await uploadPhoto(id, item.dataUrl, item.gps);
    if (url) {
      const k = list.indexOf(item.dataUrl);
      if (k >= 0) list[k] = url;
      setPhotoMeta(id, url, { gps: item.gps, origKB: item.origKB, sizeKB: item.sizeKB, at: Date.now() });
      ok++;
    }
  }
  savePhotos(photos); saveState(); refreshPhotoView(id);
  toast(ok === added.length ? t('photo_uploaded') : t('photo_upload_fail'));
}
function delPhoto(id, k) {
  if (!confirm(t('confirm_del'))) return;
  const [url] = photos[id].splice(k, 1);
  if (state.photoMeta?.[id]) {
    state.photoMeta[id] = state.photoMeta[id].filter((m, idx) => m?.url !== url && idx !== k);
  }
  if (url && !url.startsWith('data:')) deleteCloudPhoto(url);
  savePhotos(photos); saveState(); refreshPhotoView(id);
}

/* ---------- สถานที่ที่สร้างเอง ---------- */
const ARTS = ['temple', 'shrine', 'street', 'fuji', 'lake', 'water', 'park', 'city'];
const ART_KEYS = { temple: 'art_temple', shrine: 'art_shrine', street: 'art_street', fuji: 'art_fuji', lake: 'art_lake', water: 'art_water', park: 'art_park', city: 'art_city' };
let draftCustomPlaceId = null;
function openCustomPlace(id) {
  const existing = id ? (state.customPlaces?.[id] || PLACES[id]) : null;
  const p = existing || { name:{ th:'', ja:'' }, area:{ th:'' }, dur:60, gps:'', art:'city', hi:{ th:[] }, miss:{ th:[] }, transit:{ th:'' } };
  const curArt = ART[p.art] ? p.art : 'city';
  draftCustomPlaceId = id || uid('c_');
  openSheet(`<h2 class="sheet-title">${id ? t('edit_place') : t('new_place')}</h2>
    <p class="muted small">${t('new_place_sub')}</p>
    <label class="lbl">${t('place_name')}</label><input id="pName" class="input" value="${esc(p.name?.th || '')}" placeholder="${t('place_name_ph')}">
    <div class="two"><div><label class="lbl">${t('place_name_ja')}</label><input id="pJa" class="input" value="${esc(p.name?.ja === p.name?.th ? '' : (p.name?.ja || ''))}" placeholder="例：浅草寺"></div>
      <div><label class="lbl">${t('area')}</label><input id="pArea" class="input" value="${esc(p.area?.th || '')}" placeholder="${t('area_ph')}"></div></div>
    <label class="lbl">GPS</label><input id="pGps" class="input mono" value="${esc(p.gps || '')}" placeholder="35.71480, 139.79665" oninput="pGpsCheck()">
    <div id="pGpsMsg" class="small muted">${t('gps_help')}</div>
    <div class="gps-tools"><button class="chip" onclick="window.open('https://www.google.com/maps/search/?api=1&query='+encodeURIComponent($('#pName').value+' '+$('#pArea').value),'_blank','noopener');toast(t('gmaps_tip'))">${ic('search')}${t('find_gmaps')}</button>
      <button class="chip" onclick="navigator.geolocation&&navigator.geolocation.getCurrentPosition(p=>{$('#pGps').value=p.coords.latitude.toFixed(5)+', '+p.coords.longitude.toFixed(5);pGpsCheck()},()=>toast(t('geo_fail')))">${ic('locate')}${t('use_here')}</button></div>
    <label class="lbl">${t('stay_time')}</label>
    <div class="cat-pick" id="pDur">${[30, 45, 60, 90, 120, 180, 240].map(m => `<button type="button" class="chip ${p.dur === m ? 'on' : ''}" data-v="${m}" onclick="pickCat(this)">${durTxt(m)}</button>`).join('')}</div>
    <label class="lbl">${t('look')} <span class="muted small">(${t('pick_art_hint')})</span></label>
    <div class="cover" id="pArtPreview" style="height:110px;margin:4px 0 8px">${ART[curArt]}</div>
    <div class="art-pick" id="pArt">${ARTS.map(a => `<button type="button" class="${curArt === a ? 'on' : ''}" data-v="${a}" onclick="pickCat(this)"><span class="art-box">${ART[a]}</span><span class="art-lbl">${t(ART_KEYS[a])}</span></button>`).join('')}</div>
    ${photosBox(draftCustomPlaceId)}
    <label class="lbl">${t('highlights')} <span class="muted">(${t('one_per_line')})</span></label><textarea id="pHi" class="input area">${esc((p.hi?.th || []).join('\n'))}</textarea>
    <label class="lbl">${t('dont_miss')} <span class="muted">(${t('one_per_line')})</span></label><textarea id="pMiss" class="input area">${esc((p.miss?.th || []).join('\n'))}</textarea>
    <label class="lbl">${t('public_transit')}</label><input id="pTransit" class="input" value="${esc(p.transit?.th || '')}" placeholder="${t('transit_ph')}">
    <div class="actions">${id && state.customPlaces?.[id] ? `<button class="btn btn-danger" onclick="delCustomPlace('${id}')">${t('delete')}</button>` : `<button class="btn btn-soft" onclick="closeSheet()">${t('cancel')}</button>`}
      <button class="btn btn-ink" onclick="saveCustomPlace(${id ? `'${id}'` : 'null'})">${id ? t('save') : t('save_add')}</button></div>`);
  if (p.gps) pGpsCheck();
}
function pGpsCheck() {
  const v = $('#pGps').value.trim(), g = parseGps(v), m = $('#pGpsMsg');
  if (!v) { m.className = 'small muted'; m.textContent = t('gps_help'); }
  else if (g) { m.className = 'small ok'; m.innerHTML = `✓ ${g} · <a href="${mapUrl(g)}" target="_blank" rel="noopener">${t('check_map')}</a>`; }
  else { m.className = 'small bad'; m.textContent = t('gps_bad'); }
  return g;
}
function saveCustomPlace(id) {
  const name = $('#pName').value.trim();
  if (!name) { toast(t('need_place_name')); return; }
  const raw = ($('#pGps')?.value || $('#phGpsInput')?.value || '').trim(), gps = raw ? parseGps(raw) : '';
  if (raw && !gps) { toast(t('gps_bad')); return; }
  const lines = s => s.split('\n').map(x => x.trim()).filter(Boolean);
  const ja = $('#pJa').value.trim(), area = $('#pArea').value.trim(), transit = $('#pTransit').value.trim();
  const prev = id ? (state.customPlaces?.[id] || PLACES[id] || {}) : {};
  const rec = {
    ...prev,
    name:{ th:name, ja: ja || prev.name?.ja || name }, ro: prev.ro || ja || name, area:{ th:area, ja: prev.area?.ja || area },
    art: document.querySelector('#pArt button.on')?.dataset.v || prev.art || 'city',
    dur: +(document.querySelector('#pDur .on')?.dataset.v || prev.dur || 60), gps,
    hi:{ th: lines($('#pHi').value), ja: prev.hi?.ja?.length ? prev.hi.ja : lines($('#pHi').value) },
    miss:{ th: lines($('#pMiss').value), ja: prev.miss?.ja?.length ? prev.miss.ja : lines($('#pMiss').value) },
    transit:{ th: transit, ja: prev.transit?.ja || transit }, custom: true,
  };
  state.customPlaces = state.customPlaces || {};
  const isNew = !id;
  id = id || draftCustomPlaceId || uid('c_');
  state.customPlaces[id] = rec;
  if (typeof mergePlaces === 'function') mergePlaces();
  saveState();
  if (isNew && ui.screen === 'day') { addStop(id); return; }
  closeSheet(); rerender(); toast(t('saved'));
}
function delCustomPlace(id) {
  if (!confirm(t('confirm_del'))) return;
  delete state.customPlaces[id];
  state.days.forEach(d => { d.stops = d.stops.filter(s => s.id !== id); });
  saveState(); closeSheet(); rerender();
}

/* ============ TALK (phrasebook) ============ */
const fillVal = (p, val) => {
  if (p.fill === 'people') { const n = state.trip.people; return { th:n, ja:n, ro:n }; }
  return val;
};
function phraseOut(p, lang, val) {
  const v = fillVal(p, val);
  let s = p[lang];
  if (v) s = s.replaceAll('{place}', v[lang]).replaceAll('{n}', v[lang]);
  return s;
}
const blankify = (s, lang) => esc(s).replace(/\{(place|n)\}/g, (_, k) => k === 'n' ? String(state.trip.people) : `<span class="blank">${lang === 'ja' ? '〇〇' : '___'}</span>`);

function renderTalk() {
  $('#s-talk').innerHTML = topbar(t('talk_eyebrow'), t('talk_title')) + `
  <div class="searchbox">${ic('search')}<input id="talkQ" placeholder="${t('talk_search')}" value="${esc(ui.talkQ)}" oninput="ui.talkQ=this.value;renderTalkList()"></div>
  <div class="cats">${[{ k:'all', ic:'grid' }, ...PHRASE_CATS].map(c => `<button class="chip ${ui.talkCat === c.k ? 'on' : ''}" onclick="ui.talkCat='${c.k}';renderTalk()">${ic(c.ic)}${t('pc_' + c.k)}</button>`).join('')}</div>
  <div id="talkList"></div>
  <p class="note">${t('talk_note')}</p>`;
  renderTalkList();
}
function renderTalkList() {
  const q = ui.talkQ.trim().toLowerCase();
  const rows = PHRASES.map((p, i) => ({ p, i })).filter(({ p }) =>
    (ui.talkCat === 'all' || p.cat === ui.talkCat) && (!q || (p.th + p.ja + p.ro).toLowerCase().includes(q)));
  $('#talkList').innerHTML = rows.length ? rows.map(({ p, i }) => `
    <div class="phrase">
      <button class="ph-main" onclick="openPhrase(${i})">
        <div class="ph-ja">${blankify(p.ja, 'ja')}</div>
        <div class="ph-ro">${blankify(p.ro, 'ro')}</div>
        <div class="ph-th">${blankify(p.th, 'th')}</div>
      </button>
      <button class="spk" onclick="speakJa(phraseOut(PHRASES[${i}],'ja'))" aria-label="speak">${ic('speaker')}</button>
    </div>`).join('') : `<div class="card empty-card"><div class="doodle">🤔</div>${t('talk_none')}</div>`;
}

function fillOptions() {
  const opts = [];
  state.hotels.forEach(h => opts.push({ th:h.name, ja:h.name, ro:h.name }));
  (state.restaurants || []).forEach(r => opts.push({ th:r.name, ja:r.nameJa || r.name, ro:r.name }));
  const seen = new Set();
  state.days.forEach(d => d.stops.forEach(s => { if (!seen.has(s.id) && PLACES[s.id]) { seen.add(s.id); const p = PLACES[s.id]; opts.push({ th:p.name.th, ja:p.name.ja, ro:p.ro }); } }));
  Object.entries(PLACES).forEach(([id, p]) => { if (!seen.has(id)) opts.push({ th:p.name.th, ja:p.name.ja, ro:p.ro }); });
  [{ th:'สถานีรถไฟ', ja:'駅', ro:'eki' }, { th:'สนามบินนาริตะ', ja:'成田空港', ro:'Narita kūkō' }, { th:'สนามบินฮาเนดะ', ja:'羽田空港', ro:'Haneda kūkō' }].forEach(x => opts.push(x));
  return opts;
}
function openPhrase(i, val) {
  const p = PHRASES[i];
  ui.big = { i, val: val || (p.fill === 'place' ? fillOptions()[0] : null) };
  renderBig();
  $('#big').classList.add('on');
  document.body.style.overflow = 'hidden';
}
function renderBig() {
  const { i, val } = ui.big, p = PHRASES[i];
  const opts = p.fill === 'place' ? fillOptions() : [];
  $('#big').innerHTML = `
    <button class="big-x" onclick="closeBig()" aria-label="close">${ic('x')}</button>
    <div class="big-body">
      <div class="big-hint">${t('show_this')}</div>
      <div class="big-ja">${esc(phraseOut(p, 'ja', val))}</div>
      <div class="big-ro">${esc(phraseOut(p, 'ro', val))}</div>
      <div class="big-th">${esc(phraseOut(p, 'th', val))}</div>
      <button class="btn btn-ink speak-btn" onclick="speakJa(phraseOut(PHRASES[${i}],'ja',ui.big.val))">${ic('speaker')}${t('speak')}</button>
    </div>
    ${p.fill === 'place' ? `<div class="big-fill"><div class="small muted">${t('pick_place')}</div>
      <div class="fill-opts">${opts.map((o, k) => `<button class="chip ${val && val.ja === o.ja ? 'on' : ''}" onclick="pickFill(${k})">${esc(L() === 'ja' ? o.ja : o.th)}</button>`).join('')}</div>
      <input class="input" placeholder="${t('type_place')}" onchange="pickFree(this.value)"></div>` : ''}`;
}
function pickFill(k) { ui.big.val = fillOptions()[k]; renderBig(); }
function pickFree(v) { v = v.trim(); if (v) { ui.big.val = { th:v, ja:v, ro:v }; renderBig(); } }
function closeBig() { $('#big')?.classList.remove('on'); document.body.style.overflow = ''; if (window.speechSynthesis) speechSynthesis.cancel(); }
function showToLocal(id) {
  const p = placeOf(id), k = PHRASES.findIndex(x => x.id === 'how_go');
  closeSheet(); openPhrase(k, { th:p.name.th, ja:p.name.ja, ro:p.ro });
}
function showRestToLocal(id) {
  const r = (state.restaurants || []).find(x => x.id === id);
  if (!r) return;
  const k = PHRASES.findIndex(x => x.id === 'how_go');
  closeSheet(); openPhrase(k, { th:r.name, ja:r.nameJa || r.name, ro:r.name });
}
function speakJa(text) {
  if (!('speechSynthesis' in window)) return toast(t('no_tts'));
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(String(text).replace(/\{.*?\}/g, ''));
  u.lang = 'ja-JP'; u.rate = .88;
  const v = speechSynthesis.getVoices().find(v => v.lang && v.lang.replace('_', '-').startsWith('ja'));
  if (v) u.voice = v; else toast(t('no_ja_voice'));
  speechSynthesis.speak(u);
}

/* ============ MONEY ============ */
function renderMoney() {
  const D = dCur(), A = altCur();
  const spent = spentIn(D);
  const budget = convert(state.budget.amount, state.budget.cur, D);
  const byCat = EXP_CATS.map(c => ({ ...c, v: state.expenses.filter(e => e.cat === c.k).reduce((a, e) => a + expIn(e, D), 0) }));
  const base = Math.max(spent, budget) || 1;
  const updated = RATES.ts ? new Date(RATES.ts).toLocaleString(locale(), { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' }) : t('rate_never');
  const sorted = [...state.expenses].sort((a, b) => (b.day - a.day) || String(b.id).localeCompare(String(a.id)));
  const pct = budget ? Math.round(spent / budget * 100) : 0;

  $('#s-money').innerHTML = topbar(t('money_eyebrow'), t('money_title'), `<button class="pill ink" onclick="openExpense()">${ic('plus')}${t('add')}</button>`) + `
  <div class="cur-switch">
    ${PRIMARY_CURS.map(c => `<button class="${D === c ? 'on' : ''}" onclick="setDisplayCur('${c}')">${CURRENCIES[c].flag} ${c}</button>`).join('')}
    <select onchange="setDisplayCur(this.value)" aria-label="currency">
      <option value="" ${PRIMARY_CURS.includes(D) ? 'selected' : ''} disabled>${t('other_cur')}</option>
      ${Object.keys(CURRENCIES).filter(c => !PRIMARY_CURS.includes(c)).map(c => `<option value="${c}" ${D === c ? 'selected' : ''}>${CURRENCIES[c].flag} ${c}</option>`).join('')}
    </select>
  </div>
  <div class="card money-card">
    <div class="muted small">${t('spent_of', { b: fmtMoney(budget, D) })} <button class="link" onclick="openBudget()">${t('edit')}</button></div>
    <div class="big-num">${fmtMoney(spent, D)}</div>
    <div class="alt-num">≈ ${fmtMoney(convert(spent, D, A), A)} · ${t('pct_budget', { p: pct })}</div>
    <div class="bar">${byCat.filter(c => c.v > 0).map(c => `<i style="flex:${c.v / base * 100};background:${c.color}"></i>`).join('')}<i style="flex:${Math.max(0, (budget - spent) / base * 100)};background:var(--paper-2)"></i></div>
    <div class="legend">${byCat.map(c => `<div><i style="background:${c.color}"></i>${t('cat_' + c.k)}<b>${fmtMoneyShort(c.v, D)}</b></div>`).join('')}</div>
  </div>
  <div class="rate-card">
    <div class="rate-main"><div class="rate-big">${rateText('JPY', 'THB')}</div><div class="small muted">${rateText('THB', 'JPY')}</div></div>
    <button class="icon-btn" onclick="manualRefresh(this)" aria-label="refresh">${ic('refresh')}</button>
    <div class="rate-meta small muted">${RATES.src === 'fallback' ? '⚠️ ' + t('rate_fallback') : t('rate_src', { s: RATES.src, u: updated })}</div>
  </div>
  <div class="quick-conv card">
    <div class="small muted">${t('quick_conv')}</div>
    <div class="qc-row"><span>¥</span><input class="input" inputmode="decimal" placeholder="1000" oninput="qc(this.value,'JPY')" id="qcJ"><button class="icon-btn" aria-hidden="true" tabindex="-1">${ic('swap')}</button><span>฿</span><input class="input" inputmode="decimal" placeholder="${Math.round(convert(1000, 'JPY', 'THB'))}" oninput="qc(this.value,'THB')" id="qcT"></div>
  </div>
  <h3 class="sec">${t('recent')}</h3>
  <div class="card list-card">${sorted.length ? sorted.map(e => { const c = EXP_CATS.find(x => x.k === e.cat) || EXP_CATS[5]; return `
    <button class="tx" onclick="openExpense('${e.id}')"><div class="ic" style="background:${c.color}55">${ic(c.ic)}</div>
      <div class="grow"><div class="t">${esc(e.title)}</div><div class="s">${e.day ? t('day_n', { n: e.day }) : t('pre_trip')} · ${t('cat_' + e.cat)}</div></div>
      <div class="amt"><b>${fmtMoney(expIn(e, D), D)}</b>${e.cur !== D ? `<span>${fmtMoney(e.amount, e.cur)}</span>` : ''}</div></button>`; }).join('')
    : `<div class="empty-card"><div class="doodle">💸</div>${t('no_exp')}</div>`}</div>`;
}
function setDisplayCur(c) { if (!c) return; state.displayCur = c; saveState(); renderMoney(); }
async function manualRefresh(btn) {
  btn.classList.add('spin');
  const ok = await refreshRates(true);
  btn.classList.remove('spin');
  toast(ok ? t('rate_ok') : t('rate_fail'));
  if (ui.screen === 'money') renderMoney();
}
function qc(v, from) {
  const n = parseFloat(String(v).replace(/,/g, ''));
  const other = from === 'JPY' ? $('#qcT') : $('#qcJ');
  other.value = isFinite(n) ? (Math.round(convert(n, from, from === 'JPY' ? 'THB' : 'JPY') * 100) / 100).toString() : '';
}

function openExpense(id) {
  const e = id ? state.expenses.find(x => x.id === id) : { title:'', amount:'', cur: state.lastCur || 'JPY', cat:'food', day: ui.screen === 'day' ? ui.day + 1 : (ui.day + 1) };
  if (!e) return;
  openSheet(`<h2 class="sheet-title">${id ? t('edit_exp') : t('new_exp')}</h2>
    <label class="lbl">${t('amount')}</label>
    <div class="amt-row"><input id="exAmt" class="input big-input" inputmode="decimal" placeholder="0" value="${e.amount}" oninput="exPreview()" autofocus>
      <select id="exCur" class="input" onchange="exPreview()">${Object.keys(CURRENCIES).map(c => `<option value="${c}" ${e.cur === c ? 'selected' : ''}>${CURRENCIES[c].flag} ${c}</option>`).join('')}</select></div>
    <div id="exPrev" class="fx-prev"></div>
    <label class="lbl">${t('what')}</label>
    <input id="exTitle" class="input" placeholder="${t('what_ph')}" value="${esc(e.title)}">
    <label class="lbl">${t('category')}</label>
    <div class="cat-pick">${EXP_CATS.map(c => `<button type="button" class="chip ${e.cat === c.k ? 'on' : ''}" data-cat="${c.k}" onclick="pickCat(this)">${ic(c.ic)}${t('cat_' + c.k)}</button>`).join('')}</div>
    <label class="lbl">${t('which_day')}</label>
    <select id="exDay" class="input"><option value="0">${t('pre_trip')}</option>${state.days.map((d, k) => `<option value="${k + 1}" ${e.day === k + 1 ? 'selected' : ''}>${t('day_n', { n: k + 1 })} · ${dShort(k)}</option>`).join('')}</select>
    <div class="actions">${id ? `<button class="btn btn-danger" onclick="delExpense('${id}')">${t('delete')}</button>` : `<button class="btn btn-soft" onclick="closeSheet()">${t('cancel')}</button>`}
      <button class="btn btn-ink" onclick="saveExpense(${id ? `'${id}'` : 'null'})">${t('save')}</button></div>`);
  exPreview();
}
function pickCat(b) {
  if (!b || !b.parentElement) return;
  b.parentElement.querySelectorAll('button, .chip').forEach(x => x.classList.toggle('on', x === b));
  if (b.parentElement.id === 'pArt' && b.dataset.v && ART[b.dataset.v]) {
    const prev = $('#pArtPreview');
    if (prev) prev.innerHTML = ART[b.dataset.v];
  }
}
function exPreview() {
  const a = parseFloat(String($('#exAmt').value).replace(/,/g, '')), c = $('#exCur').value;
  const targets = ['THB', 'JPY'].filter(x => x !== c).concat(dCur() !== c && !['THB', 'JPY'].includes(dCur()) ? [dCur()] : []);
  $('#exPrev').innerHTML = isFinite(a) && a > 0
    ? `${targets.map(x => `<b>≈ ${fmtMoney(convert(a, c, x), x)}</b>`).join(' · ')}<div class="small muted">${rateText(c, targets[0])}</div>`
    : `<span class="muted small">${rateText(c, c === 'THB' ? 'JPY' : 'THB')}</span>`;
}
function saveExpense(id) {
  const amount = parseFloat(String($('#exAmt').value).replace(/,/g, ''));
  if (!(amount > 0)) { toast(t('amt_invalid')); $('#exAmt').focus(); return; }
  const cur = $('#exCur').value;
  const cat = document.querySelector('.cat-pick .chip.on')?.dataset.cat || 'other';
  const rec = { title: $('#exTitle').value.trim() || t('cat_' + cat), amount, cur, cat, day: +$('#exDay').value };
  if (id) {
    const e = state.expenses.find(x => x.id === id);
    if (e.cur !== cur || e.amount !== amount) rec.fx = { ...RATES.rates };
    Object.assign(e, rec);
  } else {
    state.expenses.push({ id: uid('e'), ...rec, fx: { ...RATES.rates }, at: Date.now() });
  }
  state.lastCur = cur;
  saveState(); closeSheet(); renderMoney();
  toast(t('exp_saved', { a: fmtMoney(amount, cur), b: fmtMoney(convert(amount, cur, cur === 'THB' ? 'JPY' : 'THB'), cur === 'THB' ? 'JPY' : 'THB') }));
}
function delExpense(id) {
  if (!confirm(t('confirm_del'))) return;
  state.expenses = state.expenses.filter(x => x.id !== id);
  saveState(); closeSheet(); renderMoney();
}
function openBudget() {
  openSheet(`<h2 class="sheet-title">${t('budget')}</h2>
    <div class="amt-row"><input id="bAmt" class="input big-input" inputmode="decimal" value="${state.budget.amount}">
    <select id="bCur" class="input">${Object.keys(CURRENCIES).map(c => `<option ${state.budget.cur === c ? 'selected' : ''}>${c}</option>`).join('')}</select></div>
    <div class="actions"><button class="btn btn-soft" onclick="closeSheet()">${t('cancel')}</button><button class="btn btn-ink" onclick="saveBudget()">${t('save')}</button></div>`);
}
function saveBudget() {
  const a = parseFloat($('#bAmt').value);
  if (!(a > 0)) return toast(t('amt_invalid'));
  state.budget = { amount: a, cur: $('#bCur').value }; saveState(); closeSheet(); renderMoney();
}

/* ============ HOTELS ============ */
function renderHotels() {
  syncTripDaysWithHotels();
  const list = [...state.hotels].sort((a, b) => normDateIso(a.checkin).localeCompare(normDateIso(b.checkin)));
  $('#s-hotels').innerHTML = topbar(t('hotels_eyebrow'), t('hotels_title'), `${cloudOn() ? `<button class="pill" onclick="pullSheetData(this)" title="${t('pull_sheet')}">${ic('refresh')}${t('pull_sheet')}</button>` : ''}<button class="pill ink" onclick="openHotel()">${ic('plus')}${t('add')}</button>`) + `
  <p class="muted small" style="margin:-6px 0 14px">${t('hotels_sub')}</p>
  ${list.length ? list.map(h => {
    const ci = normDateIso(h.checkin), co = normDateIso(h.checkout);
    const nights = Math.max(1, diffDaysIso(ci, co));
    const covered = hotelCoveredDays(h);
    const nPh = (photos[h.id] || []).length;
    return `<div class="card hotel">
      <div class="hotel-top"><div class="thumb hotel-thumb">${ic('hotel')}${nPh ? `<span class="ph-badge">${nPh}</span>` : ''}</div>
        <div class="grow"><div class="t">${esc(h.name)}</div><div class="s">${esc(h.address || '')}</div></div>
        <button class="icon-btn" onclick="openHotel('${h.id}')" aria-label="edit">${ic('edit')}</button></div>
      <div class="hotel-dates"><span class="chip c-sakura">${t('checkin')} ${fmtD(new Date(ci + 'T00:00:00'), { day:'numeric', month:'short' })}</span><span class="chip c-sora">${t('checkout')} ${fmtD(new Date(co + 'T00:00:00'), { day:'numeric', month:'short' })}</span><span class="chip c-yuzu">${t('nights', { n: nights })}</span></div>
      ${covered.length ? `<div class="hotel-days-cover"><div class="small"><b>📅 ${t('hotel_days_cover', { d: covered.length })}</b></div>
        <div class="hotel-days-list">${covered.map(c => `<button type="button" class="chip ${c.role === 'checkout' ? 'c-sora' : 'c-matcha'} mini-chip" ${c.dayIdx != null ? `onclick="openDay(${c.dayIdx})"` : ''}>${c.dayNum ? t('day_n', { n: c.dayNum }) + ' · ' : ''}${c.dateLabel}${c.role === 'checkout' ? ' (' + t('checkout') + ')' : ''}</button>`).join('')}</div></div>` : ''}
      ${h.gps ? `<div class="gps"><div><div class="small muted">GPS</div><code>${h.gps}</code></div><button class="mini" onclick="copyTxt('${h.gps}')">${t('copy')}</button></div>
      <div class="actions"><a class="btn btn-ink" href="${dirUrl(null, h.gps)}" target="_blank" rel="noopener">${ic('pin')}${t('navigate')}</a><a class="btn btn-soft" href="${mapUrl(h.gps)}" target="_blank" rel="noopener">${ic('search')}${t('view_map')}</a></div>`
      : `<p class="note warn">${t('hotel_no_gps')}</p>`}
    </div>`; }).join('') : `<div class="card empty-card"><div class="doodle">🏨</div><b>${t('no_hotel')}</b><div class="small muted">${t('add_hotel_why')}</div></div>`}`;
}
function openHotel(id) {
  const lastOut = state.hotels.length ? [...state.hotels].map(x => normDateIso(x.checkout)).filter(Boolean).sort().slice(-1)[0] : '';
  const tripEnd = isoOf(dateOfDay(state.days.length - 1));
  const defIn = (lastOut && lastOut < tripEnd) ? lastOut : normDateIso(state.trip.start);
  let defOut = tripEnd > defIn ? tripEnd : addDaysIso(defIn, Math.max(1, state.days.length - 1));
  const h = id ? state.hotels.find(x => x.id === id) : { name:'', address:'', gps:'', checkin: defIn, checkout: defOut };
  openSheet(`<h2 class="sheet-title">${id ? t('edit_hotel') : t('new_hotel')}</h2>
    <label class="lbl">${t('hotel_name')}</label><input id="hName" class="input" value="${esc(h.name)}" placeholder="Hotel Gracery Shinjuku">
    <label class="lbl">${t('address')}</label><input id="hAddr" class="input" value="${esc(h.address)}" placeholder="1-19-1 Kabukicho, Shinjuku">
    <div class="two"><div><label class="lbl">${t('checkin')}</label><input id="hIn" type="date" class="input" value="${normDateIso(h.checkin)}" oninput="onHotelDateChange('in')" onchange="onHotelDateChange('in')"></div>
      <div><label class="lbl">${t('checkout')}</label><input id="hOut" type="date" class="input" value="${normDateIso(h.checkout)}" oninput="onHotelDateChange('out')" onchange="onHotelDateChange('out')"></div></div>
    <div id="hotelDaysPrev" class="hotel-days-cover" style="margin-top:8px"></div>
    <label class="lbl">${t('hotel_gps')}</label>
    <input id="hGps" class="input mono" value="${esc(h.gps)}" placeholder="35.69480, 139.70160" oninput="gpsCheck()">
    <div id="gpsMsg" class="small muted">${t('gps_help')}</div>
    <div class="gps-tools">
      <button class="chip" onclick="useMyLocation()">${ic('locate')}${t('use_here')}</button>
      <button class="chip" onclick="findOnMap()">${ic('search')}${t('find_gmaps')}</button>
    </div>
    ${id ? photosBox(id) : ''}
    <div class="actions">${id ? `<button class="btn btn-danger" onclick="delHotel('${id}')">${t('delete')}</button>` : `<button class="btn btn-soft" onclick="closeSheet()">${t('cancel')}</button>`}
      <button class="btn btn-ink" onclick="saveHotel(${id ? `'${id}'` : 'null'})">${t('save')}</button></div>`);
  onHotelDateChange();
  if (h.gps) gpsCheck();
}
function onHotelDateChange(which = '') {
  const inEl = $('#hIn'), outEl = $('#hOut'), prevEl = $('#hotelDaysPrev');
  if (!inEl || !outEl || !prevEl) return;
  const ci = normDateIso(inEl.value);
  let co = normDateIso(outEl.value);
  if (ci && which === 'in' && (!co || co <= ci)) {
    co = addDaysIso(ci, 1);
    outEl.value = co;
  }
  if (!ci || !co || co < ci) {
    prevEl.innerHTML = `<span class="small bad">${t('date_bad')}</span>`;
    return;
  }
  const effectiveOut = co === ci ? addDaysIso(ci, 1) : co;
  const nights = Math.max(1, diffDaysIso(ci, effectiveOut));
  const cov = hotelCoveredDays({ checkin: ci, checkout: effectiveOut });
  const tripStart = normDateIso(state.trip.start);
  const tripEnd = isoOf(dateOfDay(state.days.length - 1));
  const willExpand = effectiveOut > tripEnd || ci < tripStart;
  prevEl.innerHTML = `<div class="small"><b>📅 ${t('nights', { n: nights })} · ${t('hotel_days_cover', { d: cov.length })}</b>${willExpand ? ` <span class="ok">(✨ ระบบจะขยายวันในทริปให้ครบทุกวันอัตโนมัติ)</span>` : ''}</div>
    <div class="hotel-days-list">${cov.map(c => `<span class="chip ${c.role === 'checkout' ? 'c-sora' : 'c-matcha'} mini-chip">${c.dayNum ? t('day_n', { n: c.dayNum }) + ' · ' : ''}${c.dateLabel}${c.role === 'checkout' ? ' (' + t('checkout') + ')' : ''}</span>`).join('')}</div>`;
}
function gpsCheck() {
  const v = $('#hGps').value.trim(), g = parseGps(v), m = $('#gpsMsg');
  if (!v) { m.className = 'small muted'; m.textContent = t('gps_help'); return null; }
  if (g) { m.className = 'small ok'; m.innerHTML = `✓ ${g} · <a href="${mapUrl(g)}" target="_blank" rel="noopener">${t('check_map')}</a>`; }
  else { m.className = 'small bad'; m.textContent = t('gps_bad'); }
  return g;
}
function useMyLocation() {
  if (!navigator.geolocation) return toast(t('geo_fail'));
  toast(t('geo_wait'));
  navigator.geolocation.getCurrentPosition(
    pos => { $('#hGps').value = `${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`; gpsCheck(); },
    () => toast(t('geo_fail')), { enableHighAccuracy: true, timeout: 10000 });
}
function findOnMap() {
  const q = [$('#hName').value, $('#hAddr').value].filter(Boolean).join(' ');
  if (!q) return toast(t('need_name'));
  window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`, '_blank', 'noopener');
  toast(t('gmaps_tip'));
}
function saveHotel(id) {
  const name = $('#hName').value.trim();
  if (!name) { toast(t('need_name')); return; }
  const raw = $('#hGps').value.trim(), gps = raw ? parseGps(raw) : '';
  if (raw && !gps) { toast(t('gps_bad')); return; }
  const checkin = normDateIso($('#hIn').value);
  let checkout = normDateIso($('#hOut').value);
  if (!checkin || !checkout || checkout < checkin) { toast(t('date_bad')); return; }
  if (checkout === checkin) checkout = addDaysIso(checkin, 1);
  const rec = { name, address: $('#hAddr').value.trim(), gps, checkin, checkout };
  const clash = state.hotels.find(h => h.id !== id && normDateIso(h.checkin) < checkout && checkin < normDateIso(h.checkout));
  if (id) Object.assign(state.hotels.find(x => x.id === id), rec);
  else state.hotels.push({ id: uid('h'), ...rec });
  syncTripDaysWithHotels(rec);
  state.days.forEach((_, idx) => recalcDayLegs(idx));
  saveState(); closeSheet(); if (ui.screen === 'hotels') renderHotels(); else rerender();
  toast(clash ? t('hotel_clash', { h: clash.name }) : t('hotel_saved'));
}
function delHotel(id) {
  if (!confirm(t('confirm_del'))) return;
  state.deletedIds = [...new Set([...(state.deletedIds || []), id])];
  state.hotels = state.hotels.filter(h => h.id !== id); saveState(); closeSheet(); renderHotels();
}

/* ============ RESTAURANTS ============ */
function renderRestaurants() {
  $('#s-restaurants').innerHTML = topbar(t('rest_eyebrow'), t('rest_title'), `${cloudOn() ? `<button class="pill" onclick="pullSheetData(this)" title="${t('pull_sheet')}">${ic('refresh')}${t('pull_sheet')}</button>` : ''}<button class="pill" onclick="openImportRestSheet()" title="${t('import_sheet')}">📥 ${t('import_sheet')}</button><button class="pill ink" onclick="openRestaurant()">${ic('plus')}${t('add')}</button>`) + `
  <p class="muted small" style="margin:-6px 0 12px">${t('rest_sub')}</p>
  <div class="searchbox">${ic('search')}<input id="restQ" placeholder="${t('rest_search')}" value="${esc(ui.restQ)}" oninput="ui.restQ=this.value;renderRestList()"></div>
  <div class="cats">${[{ k:'all' }, ...MEALS].map(m => `<button class="chip ${ui.restMeal === m.k ? 'on' : ''}" onclick="ui.restMeal='${m.k}';renderRestaurants()">${t('meal_' + m.k)}</button>`).join('')}</div>
  <div id="restList"></div>`;
  renderRestList();
}
function openImportRestSheet() {
  openSheet(`<h2 class="sheet-title">${t('import_rest_title')}</h2>
    <p class="muted small">${t('import_rest_sub')}</p>
    <textarea id="impRestTxt" class="input area" style="min-height:150px;margin-top:10px" placeholder="${t('import_rest_ph')}"></textarea>
    <div class="actions"><button class="btn btn-soft" onclick="closeSheet()">${t('cancel')}</button>
      <button class="btn btn-ink" onclick="doImportRestSheet()">${t('import_btn')}</button></div>`);
}
function doImportRestSheet() {
  const raw = ($('#impRestTxt')?.value || '').trim();
  if (!raw) return toast(t('need_rest_name'));
  const lines = raw.split(/\r?\n/).filter(l => l.trim());
  const parsed = [];
  lines.forEach((line, idx) => {
    const cells = line.includes('\t') ? line.split('\t') : line.split(/\s*\|\s*|\s*,\s*(?![0-9])/);
    const item = typeof parseSheetRestRow === 'function' ? parseSheetRestRow(cells, idx) : null;
    if (item && item.name) parsed.push(item);
  });
  if (!parsed.length) return toast(t('need_rest_name'));
  const added = typeof mergeSheetItems === 'function' ? mergeSheetItems(parsed, [], true) : 0;
  saveState(); closeSheet(); renderRestaurants();
  toast(t('imported_rest', { n: added || parsed.length }));
}
function renderRestList() {
  const all = [...(state.restaurants || [])].sort((a, b) => ((a.day || 99) - (b.day || 99)) || String(a.name).localeCompare(String(b.name)));
  if (!all.length) {
    $('#restList').innerHTML = `<div class="card empty-card"><div class="doodle">🍜</div><b>${t('no_rest')}</b><div class="small muted">${t('add_rest_why')}</div></div>`;
    return;
  }
  const q = ui.restQ.trim().toLowerCase();
  const list = all.filter(r => (ui.restMeal === 'all' || r.meal === ui.restMeal) &&
    (!q || [r.name, r.nameJa, r.area, r.address, r.note].filter(Boolean).join(' ').toLowerCase().includes(q)));
  $('#restList').innerHTML = list.length ? list.map(r => {
    const mc = MEALS.find(m => m.k === r.meal) || MEALS[1];
    const searchTarget = [r.nameJa || r.name, r.area, r.address].filter(Boolean).join(' ');
    const nPh = (photos[r.id] || []).length;
    return `<div class="card hotel">
      <div class="hotel-top"><div class="thumb rest-thumb">${ic('food')}${nPh ? `<span class="ph-badge">${nPh}</span>` : ''}</div>
        <div class="grow"><div class="t">${esc(r.name)}${r.nameJa ? ` <span class="muted small">· ${esc(r.nameJa)}</span>` : ''}</div>
          <div class="s">${esc([r.area, r.address].filter(Boolean).join(' · '))}</div></div>
        <button class="icon-btn" onclick="openRestaurant('${r.id}')" aria-label="edit">${ic('edit')}</button></div>
      <div class="hotel-dates">
        ${r.day ? `<span class="chip c-sora">${t('day_n', { n: r.day })} · ${dShort(r.day - 1)}</span>` : `<span class="chip">${t('any_day')}</span>`}
        ${r.meal ? `<span class="chip ${mc.c}">${t('meal_' + r.meal)}</span>` : ''}
        ${r.area ? `<span class="chip c-matcha">${esc(r.area)}</span>` : ''}
      </div>
      ${r.note ? `<div class="rest-note">🍴 ${esc(r.note)}</div>` : ''}
      ${r.gps ? `<div class="gps"><div><div class="small muted">GPS</div><code>${esc(r.gps)}</code></div><button class="mini" onclick="copyTxt('${esc(r.gps)}')">${t('copy')}</button></div>` : ''}
      <div class="actions">
        <a class="btn btn-ink" href="${r.gps ? dirUrl(null, r.gps) : mapUrl(searchTarget)}" target="_blank" rel="noopener">${ic('pin')}${t('navigate')}</a>
        <button class="btn btn-sakura" onclick="showRestToLocal('${r.id}')">${ic('talk')}${t('show_local')}</button>
      </div>
    </div>`;
  }).join('') : `<div class="card empty-card"><div class="doodle">🔍</div>${t('rest_none')}</div>`;
}
function openRestaurant(id, defaultDay = 0) {
  const r = id ? (state.restaurants || []).find(x => x.id === id) : { name:'', nameJa:'', area:'', meal:'lunch', day: defaultDay || (ui.screen === 'day' ? ui.day + 1 : 0), address:'', gps:'', note:'' };
  if (!r) return;
  openSheet(`<h2 class="sheet-title">${id ? t('edit_rest') : t('new_rest')}</h2>
    <label class="lbl">${t('rest_name')}</label><input id="rName" class="input" value="${esc(r.name)}" placeholder="${t('rest_name_ph')}">
    <div class="two">
      <div><label class="lbl">${t('rest_name_ja')}</label><input id="rJa" class="input" value="${esc(r.nameJa || '')}" placeholder="例：一蘭 / 風雲児"></div>
      <div><label class="lbl">${t('area')}</label><input id="rArea" class="input" value="${esc(r.area || '')}" placeholder="${t('area_ph')}"></div>
    </div>
    <label class="lbl">${t('meal')}</label>
    <div class="cat-pick" id="rMeal">${MEALS.map(m => `<button type="button" class="chip ${r.meal === m.k ? 'on' : ''}" data-meal="${m.k}" onclick="pickCat(this)">${t('meal_' + m.k)}</button>`).join('')}</div>
    <label class="lbl">${t('which_day')}</label>
    <select id="rDay" class="input"><option value="0">${t('any_day')}</option>${state.days.map((d, k) => `<option value="${k + 1}" ${r.day === k + 1 ? 'selected' : ''}>${t('day_n', { n: k + 1 })} · ${dShort(k)} (${esc(tx(d.title))})</option>`).join('')}</select>
    <label class="lbl">${t('address')}</label><input id="rAddr" class="input" value="${esc(r.address || '')}" placeholder="1-18-10 Matsuecho, Kawagoe">
    <label class="lbl">${t('rest_note')}</label><input id="rNote" class="input" value="${esc(r.note || '')}" placeholder="${t('rest_note_ph')}">
    <label class="lbl">${t('rest_gps')}</label>
    <input id="rGps" class="input mono" value="${esc(r.gps || '')}" placeholder="35.68720, 139.69750" oninput="rGpsCheck()">
    <div id="rGpsMsg" class="small muted">${t('gps_help')}</div>
    <div class="gps-tools">
      <button class="chip" onclick="useRestLocation()">${ic('locate')}${t('use_here')}</button>
      <button class="chip" onclick="findRestOnMap()">${ic('search')}${t('find_gmaps')}</button>
    </div>
    ${id ? photosBox(id) : ''}
    <div class="actions">${id ? `<button class="btn btn-danger" onclick="delRestaurant('${id}')">${t('delete')}</button>` : `<button class="btn btn-soft" onclick="closeSheet()">${t('cancel')}</button>`}
      <button class="btn btn-ink" onclick="saveRestaurant(${id ? `'${id}'` : 'null'})">${t('save')}</button></div>`);
  if (r.gps) rGpsCheck();
}
function rGpsCheck() {
  const v = $('#rGps').value.trim(), g = parseGps(v), m = $('#rGpsMsg');
  if (!v) { m.className = 'small muted'; m.textContent = t('gps_help'); return null; }
  if (g) { m.className = 'small ok'; m.innerHTML = `✓ ${g} · <a href="${mapUrl(g)}" target="_blank" rel="noopener">${t('check_map')}</a>`; }
  else { m.className = 'small bad'; m.textContent = t('gps_bad'); }
  return g;
}
function useRestLocation() {
  if (!navigator.geolocation) return toast(t('geo_fail'));
  toast(t('geo_wait'));
  navigator.geolocation.getCurrentPosition(
    pos => { $('#rGps').value = `${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`; rGpsCheck(); },
    () => toast(t('geo_fail')), { enableHighAccuracy: true, timeout: 10000 });
}
function findRestOnMap() {
  const q = [$('#rName').value, $('#rJa').value, $('#rArea').value, $('#rAddr').value].filter(Boolean).join(' ');
  if (!q) return toast(t('need_rest_name'));
  window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`, '_blank', 'noopener');
  toast(t('gmaps_tip'));
}
function saveRestaurant(id) {
  const name = $('#rName').value.trim();
  if (!name) { toast(t('need_rest_name')); return; }
  const raw = $('#rGps').value.trim(), gps = raw ? parseGps(raw) : '';
  if (raw && !gps) { toast(t('gps_bad')); return; }
  const meal = document.querySelector('#rMeal .chip.on')?.dataset.meal || 'lunch';
  const rec = {
    name, nameJa: $('#rJa').value.trim(), area: $('#rArea').value.trim(),
    meal, day: +$('#rDay').value, address: $('#rAddr').value.trim(), gps, note: $('#rNote').value.trim(),
  };
  state.restaurants = state.restaurants || [];
  if (id) Object.assign(state.restaurants.find(x => x.id === id), rec);
  else state.restaurants.push({ id: uid('r'), ...rec });
  saveState(); closeSheet(); if (ui.screen === 'restaurants') renderRestaurants(); else rerender();
  toast(t('rest_saved'));
}
function delRestaurant(id) {
  if (!confirm(t('confirm_del'))) return;
  state.deletedIds = [...new Set([...(state.deletedIds || []), id])];
  state.restaurants = (state.restaurants || []).filter(r => r.id !== id); saveState(); closeSheet(); rerender();
}

/* ============ MORE ============ */
function renderMore() {
  const tiles = [
    ['ai', 'ai', 'c-fuji'], ['hotels', 'hotel', 'c-sakura'], ['restaurants', 'food', 'c-yuzu'], ['sos', 'sos', 'c-sora'], ['report', 'chart', 'c-matcha'],
  ];
  $('#s-more').innerHTML = topbar(t('more_eyebrow'), t('more_title')) + `
  <div class="tiles">${tiles.map(([k, i, c]) => `<button class="tile ${c}" onclick="go('${k}')">${ic(i)}<b>${t('m_' + k)}</b><span>${t('m_' + k + '_sub')}</span></button>`).join('')}</div>
  <h3 class="sec">${t('settings')}</h3>
  <div class="card list-card">
    <div class="set-row">${ic('globe')}<div class="grow"><b>${t('language')}</b><div class="s">${t('language_sub')}</div></div>
      <div class="seg mini-seg"><button class="${L() === 'th' ? 'on' : ''}" onclick="setLang('th')">ไทย</button><button class="${L() === 'ja' ? 'on' : ''}" onclick="setLang('ja')">日本語</button></div></div>
    <div class="set-row">${ic('money')}<div class="grow"><b>${t('display_cur')}</b><div class="s">${rateText('JPY', 'THB')}</div></div>
      <div class="seg mini-seg">${PRIMARY_CURS.map(c => `<button class="${dCur() === c ? 'on' : ''}" onclick="state.displayCur='${c}';saveState();renderMore()">${c}</button>`).join('')}</div></div>
    <button class="set-row" onclick="openCloud()">${ic('globe')}<div class="grow"><b>${t('cloud_title')}</b><div class="s">${cloudOn() ? `${t('sync_' + syncState)} · ${esc(CLOUD.tripId)}${CLOUD.ai ? ' · ✨ AI' : ''}` : t('cloud_row_off')}</div></div>${cloudOn() ? `<span class="sync-dot s-${syncState}"></span>` : ''}<span class="chev">›</span></button>
    <button class="set-row" onclick="openTripSettings()">${ic('settings')}<div class="grow"><b>${t('trip_settings')}</b><div class="s">${esc(tx(state.trip.name))} · ${dShort(0)}</div></div><span class="chev">›</span></button>
  </div>
  <button class="btn btn-soft wide" style="margin-top:18px" onclick="if(confirm(t('confirm_reset'))){resetState();photos={};savePhotos(photos);go('overview')}">${t('reset')}</button>
  <p class="note center">Tabi Note v0.3 · ${t('made_with')}</p>`;
}
function openTripSettings() {
  openSheet(`<h2 class="sheet-title">${t('trip_settings')}</h2>
    <label class="lbl">${t('trip_name')}</label><input id="tName" class="input" value="${esc(tx(state.trip.name))}">
    <div class="two"><div><label class="lbl">${t('start_date')}</label><input id="tStart" type="date" class="input" value="${state.trip.start}"></div>
    <div><label class="lbl">${t('people')}</label><input id="tPeople" type="number" min="1" max="30" class="input" value="${state.trip.people}"></div></div>
    <div class="actions">${state.days.length > 1 ? `<button class="btn btn-danger" onclick="removeLastDay()">${t('remove_last_day')}</button>` : '<span></span>'}<button class="btn btn-ink" onclick="saveTrip()">${t('save')}</button></div>`);
}
function saveTrip() {
  const n = $('#tName').value.trim(), s = normDateIso($('#tStart').value), p = parseInt($('#tPeople').value, 10);
  if (n) state.trip.name = { ...(typeof state.trip.name === 'object' ? state.trip.name : {}), [L()]: n };
  if (s) state.trip.start = s;
  if (p > 0) state.trip.people = p;
  syncTripDaysWithHotels();
  saveState(); closeSheet(); rerender(); toast(t('saved'));
}
function removeLastDay() {
  if (!confirm(t('confirm_del'))) return;
  state.days.pop(); ui.day = Math.min(ui.day, state.days.length - 1); saveState(); closeSheet(); rerender();
}

/* ============ SOS ============ */
const SOS = {
  main: [{ n:'110', k:'police', c:'c-sakura' }, { n:'119', k:'ambulance', c:'c-yuzu' }],
  thai: [
    { k:'emb_tokyo', gen:'03-5789-2433', emg:'090-4435-7812' },
    { k:'emb_osaka', gen:'06-6262-9226', emg:'090-1895-0987' },
    { k:'emb_fukuoka', gen:'092-739-9088', emg:'090-2585-3027' },
  ],
  other: [{ k:'jnto', n:'050-3816-2787' }, { k:'coast', n:'118' }],
};
const telJP = n => 'tel:+81' + n.replace(/-/g, '').replace(/^0/, '');
function renderSOS() {
  $('#s-sos').innerHTML = topbar(t('sos_eyebrow'), t('sos_title')) + `
  <div class="sos-big">${SOS.main.map(s => `<a class="sos ${s.c}" href="tel:${s.n}"><span class="small">${t('sos_' + s.k)}</span><b>${s.n}</b><span class="small">${t('sos_' + s.k + '_sub')}</span></a>`).join('')}</div>
  <h3 class="sec">${t('thai_embassy')}</h3>
  <div class="card list-card">${SOS.thai.map(e => `<div class="contact"><div class="grow"><div class="t">${t(e.k)}</div>
    <div class="s">${t('general')} <a href="${telJP(e.gen)}">${e.gen}</a> · ${t('emergency')} <a href="${telJP(e.emg)}">${e.emg}</a></div></div>
    <a class="call" href="${telJP(e.emg)}" aria-label="call">${ic('phone')}</a></div>`).join('')}</div>
  <h3 class="sec">${t('others')}</h3>
  <div class="card list-card">${SOS.other.map(o => `<div class="contact"><div class="grow"><div class="t">${t(o.k)}</div><div class="s">${o.n}</div></div><a class="call" href="${o.n.length > 3 ? telJP(o.n) : 'tel:' + o.n}">${ic('phone')}</a></div>`).join('')}</div>
  <button class="btn btn-sakura wide" style="margin-top:16px" onclick="openPhrase(PHRASES.findIndex(p=>p.id==='embassy'))">${ic('talk')}${t('show_embassy_phrase')}</button>
  <p class="note">${t('sos_note')}</p>`;
}

/* ============ AI — Gemini ผ่าน Apps Script + ระบบวิเคราะห์โซน เส้นทาง & ร้านอาหารอัจฉริยะ ============ */
const aiLog = [];
let aiBusy = false;
const aiReady = () => cloudOn() && (CLOUD.ai || !!CLOUD.aiKey);
function mdLite(s) {
  return esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
    .replace(/^#{1,4}\s*(.+)$/gm, '<b>$1</b>')
    .replace(/^\s*[-*•]\s+(.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)(\n(?!<li>)|$)/gs, m => `<ul class="ai-list">${m.replace(/\n/g, '')}</ul>`)
    .replace(/\n/g, '<br>');
}

function gpsDistKm(g1, g2) {
  const p1 = parseGps(g1), p2 = parseGps(g2);
  if (!p1 || !p2) return null;
  const [lat1, lon1] = p1.split(',').map(Number), [lat2, lon2] = p2.split(',').map(Number);
  const R = 6371, toRad = d => d * Math.PI / 180;
  const dLat = toRad(lat2 - lat1), dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const ZONE_DISCOVERY = {
  shinjuku: {
    short: { th:'ชินจูกุ', ja:'新宿' },
    label: { th:'โซนชินจูกุ · คาบูกิโจ · โอคุโบะ', ja:'新宿・歌舞伎町・新大久保エリア' },
    center: '35.69092, 139.70025',
    places: [
      { id:'tocho', name:{ th:'จุดชมวิวศาลาว่าการกรุงโตเกียว (ฟรี)', ja:'東京都庁展望室' }, area:{ th:'ชินจูกุ', ja:'新宿' }, dur:50, gps:'35.68960, 139.69170', art:'city', hi:{ th:'ชมวิวโตเกียวมุมสูงฟรี ชั้น 45 วันฟ้าใสเห็นฟูจิ', ja:'地上202mの無料展望室' } },
      { id:'gyoen', name:{ th:'สวนชินจูกุเกียวเอ็น', ja:'新宿御苑' }, area:{ th:'ชินจูกุ', ja:'新宿' }, dur:75, gps:'35.68520, 139.71010', art:'park', hi:{ th:'สวนญี่ปุ่นและเรือนกระจกขนาดใหญ่ใจกลางชินจูกุ', ja:'都会のオアシス・日本庭園' } },
      { id:'kabukicho_tower', name:{ th:'ตึกโทคิว คาบูกิโจ ทาวเวอร์ & หัวก๊อตซิลล่า', ja:'東急歌舞伎町タワー・ゴジラヘッド' }, area:{ th:'ชินจูกุ', ja:'新宿' }, dur:60, gps:'35.69570, 139.70060', art:'city', hi:{ th:'แลนด์มาร์กใหม่ชินจูกุ ฟู้ดฮอลล์ตกแต่งสไตล์นีออนญี่ปุ่น', ja:'歌舞伎町の新ランドマーク' } },
      { id:'hanazono', name:{ th:'ศาลเจ้าฮานาโซโนะ ชินจูกุ', ja:'花園神社' }, area:{ th:'ชินจูกุ', ja:'新宿' }, dur:40, gps:'35.69350, 139.70520', art:'shrine', hi:{ th:'ศาลเจ้าเก่าแก่คู่ย่านชินจูกุ อยู่ใกล้ห้างอิเซตัน', ja:'新宿の総鎮守' } },
      { id:'shinjuku_cat', name:{ th:'แมวยักษ์ 3 มิติ & ถนนช้อปปิ้งชินจูกุตะวันออก', ja:'クロス新宿ビジョン（3D巨大猫）・新宿東口' }, area:{ th:'ชินจูกุ', ja:'新宿' }, dur:60, gps:'35.69240, 139.70110', art:'city', hi:{ th:'ป้ายบิลบอร์ดแมวยักษ์ 3 มิติหน้าสถานีชินจูกุ และแหล่งช้อปปิ้งอิเซตัน/บิ๊กคาเมร่า', ja:'新宿東口駅前の3D巨大猫ビジョンとショッピング街' } },
      { id:'shin_okubo', name:{ th:'ย่านโคเรียทาวน์ ชินโอคุโบะ', ja:'新大久保コリアンタウン' }, area:{ th:'ชินจูกุ / ชินโอคุโบะ', ja:'新大久保' }, dur:60, gps:'35.70130, 139.70030', art:'street', hi:{ th:'แหล่งสตรีทฟู้ดเกาหลีและเครื่องสำอาง ห่างชินจูกุเพียง 1 สถานี', ja:'韓国グルメとコスメの食べ歩き街' } },
    ],
    restaurants: [
      { name:'ฟูอุนจิ ซึเคเมน (Fuunji)', nameJa:'風雲児', area:'ชินจูกุ', meal:'lunch', gps:'35.68720, 139.69750', note:'ซึเคเมนซุปไก่ผสมปลาแห้งเข้มข้น คิวหมุนไว ใกล้สถานีชินจูกุ' },
      { name:'กิวคัตสึ โมโตมุระ ชินจูกุ', nameJa:'牛かつ もと村 新宿南口店', area:'ชินจูกุ', meal:'dinner', gps:'35.68860, 139.70180', note:'เนื้อวัวชุบเกล็ดขนมปังทอด ย่างบนเตาหินร้อนเองทีละชิ้น' },
      { name:'อุด้ง ชิน (Udon Shin)', nameJa:'うどん慎', area:'ชินจูกุ', meal:'lunch', gps:'35.68680, 139.69680', note:'อุด้งเส้นสดทำมือหนึบหนับ เทมปุระกุ้งและคาโบนาร่าอุด้ง' },
      { name:'เนื้อย่าง รคคาเซน (Rokkasen)', nameJa:'焼肉 六歌仙', area:'ชินจูกุ', meal:'dinner', gps:'35.69330, 139.69950', note:'บุฟเฟต์และอาลาคาร์ทเนื้อวากิว + ปูทาราบะชื่อดังย่านชินจูกุ' },
      { name:'ราเมน อิจิรัน ชินจูกุ (Ichiran)', nameJa:'一蘭 新宿中央東口店', area:'ชินจูกุ', meal:'late', gps:'35.69080, 139.70270', note:'ราเมนข้อสอบซุปกระดูกหมูเข้มข้น กินมื้อดึกหลังช้อปปิ้งได้สบาย' },
      { name:'เทมปุระ สึนาฮาจิ ชินจูกุ (Tsunahachi)', nameJa:'新宿つな八 総本店', area:'ชินจูกุ', meal:'lunch', gps:'35.69120, 139.70420', note:'เทมปุระต้นตำรับเปิดตั้งแต่ปี 1924 ทอดสดใหม่ทุกชิ้น' },
    ],
  },
  harajuku_shibuya: {
    short: { th:'ฮาราจูกุ · ชิบูย่า', ja:'原宿・渋谷' },
    label: { th:'โซนฮาราจูกุ · ชิบูย่า · โอโมเตะซันโด', ja:'原宿・渋谷・表参道エリア' },
    center: '35.66500, 139.70250',
    places: [
      { id:'meiji', name:{ th:'ศาลเจ้าเมจิ (Meiji Jingu)', ja:'明治神宮' }, area:{ th:'ฮาราจูกุ', ja:'原宿' }, dur:60, gps:'35.67640, 139.69930', art:'shrine', hi:{ th:'ศาลเจ้าใหญ่ร่มรื่นกลางป่าในเมือง ติดสถานีฮาราจูกุ แวะช่วงเช้าก่อนเดินทาเคชิตะ', ja:'原宿駅すぐの杜に囲まれた神社' } },
      { id:'omotesando', name:{ th:'ถนนทาเคชิตะ & โอโมเตะซันโด', ja:'竹下通り・表参道' }, area:{ th:'ฮาราจูกุ', ja:'原宿' }, dur:75, gps:'35.67020, 139.70270', art:'street', hi:{ th:'เดินต่อจากศาลเจ้าเมจิได้เลย เครปฮาราจูกุ & คาเฟ่สวย', ja:'明治神宮から徒歩すぐの散策通り' } },
      { id:'miyashita_park', name:{ th:'สวนลอยฟ้า มิยาชิตะพาร์ค (Miyashita Park)', ja:'MIYASHITA PARK' }, area:{ th:'ชิบูย่า', ja:'渋谷' }, dur:60, gps:'35.66210, 139.70180', art:'park', hi:{ th:'สวนดาดฟ้าพร้อมคาเฟ่และ Shibuya Yokocho ศูนย์รวมอาหารทั่วญี่ปุ่น', ja:'屋上公園と渋谷横丁のグルメ街' } },
      { id:'shibuya_parco', name:{ th:'ห้างชิบูย่า พาร์โก้ (Nintendo & Pokemon Center)', ja:'渋谷PARCO（Nintendo TOKYO・ポケモンセンター）' }, area:{ th:'ชิบูย่า', ja:'渋谷' }, dur:75, gps:'35.66200, 139.69880', art:'city', hi:{ th:'ชั้น 6 รวมศูนย์ Nintendo, Pokemon, Jump Shop และของสะสมอนิเมะ', ja:'6階に任天堂・ポケモン・ジャンプショップが集結' } },
      { id:'hachiko_crossing', name:{ th:'ห้าแยกชิบูย่า & รูปปั้นฮาจิโกะ', ja:'渋谷スクランブル交差点・ハチ公像' }, area:{ th:'ชิบูย่า', ja:'渋谷' }, dur:45, gps:'35.65950, 139.70050', art:'city', hi:{ th:'จุดเช็กอินห้าแยกที่คึกคักที่สุดในโลก อยู่หน้าตึก Shibuya Sky', ja:'世界一有名な交差点' } },
    ],
    restaurants: [
      { name:'Luke\'s Lobster ฮาราจูกุ', nameJa:'LUKE\'S LOBSTER 表参道キャットストリート店', area:'ฮาราจูกุ', meal:'cafe', gps:'35.66750, 139.70680', note:'ขนมปังล็อบสเตอร์โรลเนื้อแน่น อยู่ในแนวเดินฮาราจูกุ–ชิบูย่า' },
      { name:'ราเมนยูซุ อาฟูริ ฮาราจูกุ (AFURI)', nameJa:'AFURI 原宿', area:'ฮาราจูกุ', meal:'lunch', gps:'35.67180, 139.70310', note:'ราเมนซุปใสกลิ่นส้มยูซุหอมสดชื่น หมูชาชูย่างถ่าน อยู่ใกล้ทางเข้าศาลเจ้าเมจิ' },
      { name:'แฮมเบิร์กย่างถ่าน ฮิคินิคุ โตะ โคเมะ ชิบูย่า', nameJa:'挽肉と米 渋谷', area:'ชิบูย่า', meal:'lunch', gps:'35.65920, 139.69680', note:'แฮมเบิร์กเนื้อบดสดย่างถ่านเสิร์ฟร้อนๆ 3 ชิ้น พร้อมข้าวหุงหม้อดิน' },
      { name:'ซูชิสายพาน คัตสึมิโดริ ชิบูย่า (Seibu)', nameJa:'回し寿司 活 活美登利 西武渋谷店', area:'ชิบูย่า', meal:'dinner', gps:'35.66060, 139.70060', note:'ซูชิสายพานคุณภาพสูงชิ้นใหญ่ คุ้มราคามาก ชั้น 8 ห้าง Seibu ชิบูย่า' },
      { name:'เกี๊ยวซ่า ฮาราจูกุ โรคุเม็งโร (Harajuku Gyozaro)', nameJa:'原宿餃子楼', area:'ฮาราจูกุ', meal:'lunch', gps:'35.66690, 139.70610', note:'เกี๊ยวซ่าทอดกรอบและแบบนึ่ง ราคาประหยัด อร่อยถูกปากครอบครัว' },
      { name:'เครปมาริออน ทาเคชิตะ (Marion Crepes)', nameJa:'マリオンクレープ 原宿竹下通り店', area:'ฮาราจูกุ', meal:'cafe', gps:'35.67120, 139.70370', note:'เครปสตรอว์เบอร์รีครีมสดในตำนานกลางถนนทาเคชิตะ' },
    ],
  },
  asakusa_skytree: {
    short: { th:'อาซากุสะ · สกายทรี', ja:'浅草・スカイツリー' },
    label: { th:'โซนอาซากุสะ · สกายทรี · แม่น้ำสุมิดะ', ja:'浅草・スカイツリー・隅田川エリア' },
    center: '35.71350, 139.79850',
    places: [
      { id:'nakamise', name:{ th:'โคมแดงคามินาริมง & ถนนคนเดินนากามิเสะ', ja:'雷門・仲見世通り' }, area:{ th:'อาซากุสะ', ja:'浅草' }, dur:45, gps:'35.71190, 139.79640', art:'street', hi:{ th:'ประตูโคมแดงยักษ์และถนนสายขนมโบราณหน้าวัดเซนโซจิ', ja:'雷門から浅草寺本堂へ続く食べ歩き参道' } },
      { id:'sumida_walk', name:{ th:'ทางเดินริมแม่น้ำสุมิดะ (Sumida River Walk)', ja:'すみだリバーウォーク' }, area:{ th:'อาซากุสะ', ja:'浅草' }, dur:40, gps:'35.71250, 139.80180', art:'park', hi:{ th:'ทางเดินข้ามแม่น้ำเชื่อมวัดอาซากุสะไปสกายทรี ถ่ายรูปสวยมาก', ja:'浅草とスカイツリーを結ぶ歩道橋' } },
      { id:'skytree', name:{ th:'โตเกียวสกายทรี & ห้างโซลามาจิ', ja:'東京スカイツリー・ソラマチ' }, area:{ th:'อาซากุสะ / โอชิอาเกะ', ja:'押上・スカイツリー' }, dur:90, gps:'35.71000, 139.81070', art:'city', hi:{ th:'หอคอยชมวิวและห้างใหญ่รวมของฝากโปเกมอน/คิрби้ ห่างวัดอาซากุสะ 1.5 กม.', ja:'浅草から隅田川を渡ってすぐの展望塔＆商業施設' } },
      { id:'kappabashi', name:{ th:'ถนนเครื่องครัว คัปปะบาชิ (Kappabashi)', ja:'かっぱ橋道具街' }, area:{ th:'อาซากุสะ', ja:'浅草' }, dur:50, gps:'35.71430, 139.78890', art:'street', hi:{ th:'แหล่งรวมมีดญี่ปุ่น ถ้วยชามเซรามิก และโมเดลอาหารจำลอง ใกล้วัดอาซากุสะ', ja:'料理道具と食品サンプルの街' } },
    ],
    restaurants: [
      { name:'เทมปุระ ไดโคคุยะ (Daikokuya)', nameJa:'大黒家天麩羅', area:'อาซากุสะ', meal:'lunch', gps:'35.71360, 139.79550', note:'เทมปุระกุ้งยักษ์ทอดน้ำมันงาหอมๆ ราดซอสสูตรโบราณ อยู่ในซอยข้างวัดเซนโซจิ' },
      { name:'สุกี้ยากี้เนื้อวากิว อาซากุสะ อิมาฮัน', nameJa:'浅草今半 国際通り本店', area:'อาซากุสะ', meal:'lunch', gps:'35.71240, 139.79230', note:'สุกี้ยากี้เนื้อวากิวละลายในปาก มีเซ็ตมื้อเที่ยงสุดคุ้ม' },
      { name:'ไอศกรีมมัทฉะ 7 ระดับ ซูซูกิเอ็น', nameJa:'壽々喜園 浅草本店', area:'อาซากุสะ', meal:'cafe', gps:'35.71590, 139.79680', note:'เจลาโต้มัทฉะเข้มข้นที่สุดในโลก 7 ระดับ อยู่ด้านหลังวัดอาซากุสะ' },
      { name:'เมล่อนปัง คาเก็ตสึโด อาซากุสะ', nameJa:'浅草花月堂 本店', area:'อาซากุสะ', meal:'cafe', gps:'35.71510, 139.79520', note:'เมล่อนปังอบร้อนกรอบนอกนุ่มในชิ้นใหญ่ ข้างวัดเซนโซจิ' },
      { name:'ข้าวหน้าปลาไหล อิโรฮาวะ อาซากุสะ (Unatoto)', nameJa:'名代 宇奈とと 浅草店', area:'อาซากุสะ', meal:'dinner', gps:'35.71160, 139.79810', note:'ข้าวหน้าปลาไหลย่างถ่านหอมๆ ราคาย่อมเยา ใกล้สถานีอาซากุสะ' },
      { name:'หมูทอดทงคัตสึ ยูทากะ อาซากุสะ', nameJa:'とんかつ ゆたか', area:'อาซากุสะ', meal:'dinner', gps:'35.71280, 139.79460', note:'ทงคัตสึเก่าแก่กว่า 70 ปี แป้งบางกรอบไม่อมน้ำมัน' },
    ],
  },
  ueno_akihabara: {
    short: { th:'อุเอโนะ · อากิฮาบาระ', ja:'上野・秋葉原' },
    label: { th:'โซนอุเอโนะ · อาเมโยโกะ · อากิฮาบาระ', ja:'上野・アメ横・秋葉原エリア' },
    center: '35.70850, 139.77420',
    places: [
      { id:'ueno_park', name:{ th:'สวนสาธารณะอุเอโนะ & พิพิธภัณฑ์แห่งชาติ', ja:'上野恩賜公園・東京国立博物館' }, area:{ th:'อุเอโนะ', ja:'上野' }, dur:60, gps:'35.71560, 139.77400', art:'park', hi:{ th:'สวนใหญ่ใจกลางอุเอโนะ มีศาลเจ้าโทโชกู บึงชิโนบาซุ และพิพิธภัณฑ์', ja:'美術館・博物館・不忍池が集まる文化の森' } },
      { id:'ueno_zoo', name:{ th:'สวนสัตว์อุเอโนะ (Ueno Zoo)', ja:'恩賜上野動物園' }, area:{ th:'อุเอโนะ', ja:'上野' }, dur:120, gps:'35.71645, 139.77130', art:'park', hi:{ th:'อยู่ในสวนอุเอโนะ มีแพนด้า หมีขั้วโลก และสัตว์นานาชนิด เหมาะกับครอบครัว', ja:'上野公園内の人気動物園' } },
      { id:'ameyoko', name:{ th:'ตลาดอาเมโยโกะ อุเอโนะ (Ameyoko Market)', ja:'上野アメ横商店街' }, area:{ th:'อุเอโนะ', ja:'上野' }, dur:75, gps:'35.71010, 139.77450', art:'street', hi:{ th:'ตลาดของกินเล่น อาหารทะเลสด ผลไม้ รองเท้า และของฝากราคาถูกคึกคักทั้งวัน', ja:'食べ歩き・お土産・買い物が楽しい活気ある商店街' } },
      { id:'takeya', name:{ th:'ตึกม่วง ทาเคยะ อุเอโนะ (Takeya)', ja:'多慶屋（たけや）御徒町本店' }, area:{ th:'อุเอโนะ', ja:'上野・御徒町' }, dur:60, gps:'35.70690, 139.77680', art:'city', hi:{ th:'ห้างตึกม่วงขวัญใจคนไทย ขนม ของฝาก ยา และเครื่องสำอางปลอดภาษี', ja:'お土産・お菓子・医薬品が揃うディスカウントストア' } },
      { id:'akihabara', name:{ th:'ย่านเครื่องใช้ไฟฟ้า & อนิเมะ อากิฮาบาระ', ja:'秋葉原電気街' }, area:{ th:'อากิฮาบาระ', ja:'秋葉原' }, dur:90, gps:'35.69835, 139.77310', art:'city', hi:{ th:'ห่างตลาดอาเมโยโกะเพียง 1 สถานี แหล่งรวมฟิกเกอร์ กาชาปอง และห้าง Yodobashi 9 ชั้น', ja:'家電・アニメ・ガチャの聖地' } },
      { id:'yanaka_ginza', name:{ th:'ย่านเมืองเก่า ยานากะกินซ่า (หมู่บ้านแมว)', ja:'谷中銀座商店街' }, area:{ th:'อุเอโนะ / นิปโปริ', ja:'谷中・日暮里' }, dur:60, gps:'35.72770, 139.76570', art:'street', hi:{ th:'ถนนคนเดินบรรยากาศโตเกียวยุคโชวะ ขนมรูปแมวและของกินเล่นเพียบ', ja:'下町情緒あふれる猫の街' } },
    ],
    restaurants: [
      { name:'ซูชิสายพาน มิอุระมิซากิโกะ อุเอโนะ', nameJa:'グルメ廻転寿司 三浦三崎港 上野店', area:'อุเอโนะ', meal:'lunch', gps:'35.71090, 139.77460', note:'ซูชิสายพานหน้าล้น ปลาทูน่าส่งตรงจากท่าเรือมิซากิ อยู่ในตลาดอาเมโยโกะ' },
      { name:'ทงคัตสึ ยามาเบะ อุเอโนะ (Yamabe)', nameJa:'とんかつ山家 御徒町店', area:'อุเอโนะ', meal:'lunch', gps:'35.70820, 139.77480', note:'หมูทอดทงคัตสึชิ้นหนาฉ่ำ คุ้มค่าที่สุดในย่านอาเมโยโกะ' },
      { name:'เนื้อย่าง โตเกียว เอ็น อุเอโนะ (Yakiniku)', nameJa:'焼肉 陽山道 上野本店', area:'อุเอโนะ', meal:'dinner', gps:'35.70980, 139.77550', note:'เนื้อวากิวคัดเกรดย่านอุเอโนะ มีเซ็ตอาหารกลางวันและมื้อเย็นสำหรับครอบครัว' },
      { name:'ราเมนเป็ด คาโมะ โตะ เนกิ อุเอโนะ', nameJa:'らーめん 鴨to葱 上野御徒町本店', area:'อุเอโนะ', meal:'dinner', gps:'35.70960, 139.77530', note:'ราเมนซุปเป็ดเคี่ยวกับต้นหอมญี่ปุ่น หวานหอมกลมกล่อมใต้รางรถไฟอาเมโยโกะ' },
      { name:'กิวคัตสึ อิจินิซัง อากิฮาบาระ', nameJa:'牛かつ 壱弐参', area:'อากิฮาบาระ', meal:'lunch', gps:'35.70050, 139.77120', note:'เนื้อชุบแป้งทอดกิวคัตสึเจ้าดังที่สุดในอากิฮาบาระ' },
    ],
  },
  ginza_tsukiji: {
    short: { th:'กินซ่า · ซึกิจิ · โตเกียว', ja:'銀座・築地・東京駅' },
    label: { th:'โซนกินซ่า · ซึกิจิ · สถานีโตเกียว', ja:'銀座・築地・東京駅エリア' },
    center: '35.67200, 139.76650',
    places: [
      { id:'tsukiji_outer', name:{ th:'ตลาดปลาซึกิจิ ด้านนอก (Tsukiji Outer Market)', ja:'築地場外市場' }, area:{ th:'ซึกิจิ', ja:'築地' }, dur:90, gps:'35.66540, 139.77070', art:'street', hi:{ th:'สวรรค์ของกินตอนเช้า–สาย ซูชิ ไข่หวานย่าง เนื้อวากิวเสียบไม้ สตรอว์เบอร์รีโมจิ', ja:'新鮮な海鮮丼・玉子焼き・食べ歩きグルメの宝庫' } },
      { id:'ginza_six', name:{ th:'ย่านช้อปปิ้งกินซ่า & ห้าง GINZA SIX / Uniqlo 12 ชั้น', ja:'銀座中央通り・GINZA SIX・ユニクロ銀座' }, area:{ th:'กินซ่า', ja:'銀座' }, dur:90, gps:'35.66960, 139.76400', art:'city', hi:{ th:'ถนนช้อปปิ้งสุดหรู สวนดาดฟ้า GINZA SIX ฟรี และ Uniqlo สาขาแฟลกชิป 12 ชั้น', ja:'銀座のメインストリート＆屋上庭園' } },
      { id:'art_aquarium', name:{ th:'พิพิธภัณฑ์ปลาทอง อาร์ต อควาเรียม กินซ่า', ja:'アートアクアリウム美術館 GINZA' }, area:{ th:'กินซ่า', ja:'銀座' }, dur:60, gps:'35.67130, 139.76550', art:'city', hi:{ th:'อยู่บนชั้น 8 ห้าง Mitsukoshi กินซ่า จัดไฟแสงสีกับตู้ปลาทองสุดอลังการ', ja:'銀座三越内の幻想的な金魚アート美術館' } },
      { id:'imperial_palace', name:{ th:'พระราชวังอิมพีเรียล & สะพานแว่นตานิจูบาชิ', ja:'皇居外苑・二重橋' }, area:{ th:'สถานีโตเกียว / มารุโนะอุจิ', ja:'皇居・丸の内' }, dur:50, gps:'35.68020, 139.75360', art:'park', hi:{ th:'จุดถ่ายรูปสะพานคู่หน้าพระราชวังและสวนสนญี่ปุ่น ใกล้สถานีโตเกียว', ja:'東京駅近くの歴史ある皇居前広場と二重橋' } },
      { id:'tokyo_char_st', name:{ th:'ถนนตัวการ์ตูน สถานีโตเกียว (Character Street)', ja:'東京キャラクターストリート' }, area:{ th:'สถานีโตเกียว', ja:'東京駅' }, dur:60, gps:'35.68120, 139.76790', art:'city', hi:{ th:'รวมร้านของฝาก Sanrio, Pokemon, Ghibli, Doraemon และ Tokyo Ramen Street ในที่เดียว', ja:'人気キャラクターショップ＆東京ラーメンストリート' } },
    ],
    restaurants: [
      { name:'ซูชิซันไม สาขาหลักซึกิจิ (Sushizanmai)', nameJa:'すしざんまい 本店', area:'ซึกิจิ', meal:'breakfast', gps:'35.66550, 139.77060', note:'ซูชิสดใหม่ใจกลางตลาดปลาซึกิจิ มีเมนูภาษาอังกฤษและภาพชัดเจน' },
      { name:'ไข่ม้วนญี่ปุ่น มารุทาเกะ ซึกิจิ', nameJa:'つきじ丸武', area:'ซึกิจิ', meal:'breakfast', gps:'35.66580, 139.77090', note:'ไข่ม้วนหวานนุ่มทำสดใหม่ร้อนๆ เสียบไม้เดินกินในตลาดซึกิจิ' },
      { name:'ราเมนซุปไก่ปั่น กินซ่า คางาริ (Ginza Kagari)', nameJa:'銀座 篝 本店', area:'กินซ่า', meal:'lunch', gps:'35.67120, 139.76190', note:'ราเมนซุปไก่ครีมมี่หอมทรัฟเฟิล ระดับมิชลิน บิบ กูร์มองด์ ย่านกินซ่า' },
      { name:'ซูชิสายพาน เนมุโระ ฮานามารุ (KITTE)', nameJa:'根室花まる KITTE丸の内店', area:'สถานีโตเกียว', meal:'dinner', gps:'35.67970, 139.76490', note:'ซูชิสายพานเกรดพรีเมียมจากฮอกไกโด บนตึก KITTE หน้าสถานีโตเกียว' },
      { name:'ราเมน โรคุรินฉะ (Tokyo Ramen Street)', nameJa:'六厘舎 東京駅', area:'สถานีโตเกียว', meal:'lunch', gps:'35.68080, 139.76780', note:'ซึเคเมนเจ้าดังที่สุดในสถานีโตเกียว มีมื้อเช้าตั้งแต่ 07:30 น.' },
      { name:'แพนเค้กคาเฟ่ บิลส์ กินซ่า (bills Ginza)', nameJa:'bills 銀座', area:'กินซ่า', meal:'cafe', gps:'35.67310, 139.76710', note:'แพนเค้กริคอตต้านุ่มฟูและวิวถนนกินซ่าจากชั้น 12' },
    ],
  },
  odaiba_toyosu: {
    short: { th:'โอไดบะ · โทโยสุ', ja:'お台場・豊洲' },
    label: { th:'โซนโอไดบะ · โทโยสุ · ทีมแล็บ', ja:'お台場・豊洲・湾岸エリア' },
    center: '35.63800, 139.78200',
    places: [
      { id:'teamlab_planets', name:{ th:'teamLab Planets TOKYO (โทโยสุ)', ja:'チームラボプラネッツ TOKYO' }, area:{ th:'โทโยสุ', ja:'豊洲' }, dur:120, gps:'35.64910, 139.78980', art:'city', hi:{ th:'พิพิธภัณฑ์ศิลปะดิจิทัลเดินลุยน้ำและสวนกล้วยไม้ลอยฟ้า (เหมาะมากวันฝนตก)', ja:'豊洲の没入型ミュージアム（雨の日にも最適）' } },
      { id:'senkyaku_banrai', name:{ th:'ตลาดโบราณ เซ็นคยากุ บันไร โทโยสุ', ja:'豊洲 千客万来' }, area:{ th:'โทโยสุ', ja:'豊洲' }, dur:75, gps:'35.64580, 139.78440', art:'street', hi:{ th:'แลนด์มาร์กใหม่ข้างตลาดปลาโทโยสุ จำลองเมืองเอโดะ มีบ่อแช่เท้าออนเซ็นชมวิวอ่าวฟรี', ja:'江戸の街並み再現＆無料足湯スポット' } },
      { id:'odaiba', name:{ th:'โอไดบะ กั้นดั้มยักษ์ & วิวสะพานเรนโบว์', ja:'お台場・ダイバーシティ東京' }, area:{ th:'โอไดบะ', ja:'お台場' }, dur:90, gps:'35.62510, 139.77560', art:'city', hi:{ th:'หุ่นยนต์ Unicorn Gundam ขนาดเท่าของจริง เทพีเสรีภาพจำลอง และห้างริมอ่าว', ja:'実物大ユニコーンガンダム＆レインボーブリッジの絶景' } },
    ],
    restaurants: [
      { name:'ไดวะ ซูชิ ตลาดปลาโทโยสุ (Daiwa Sushi)', nameJa:'大和寿司 豊洲市場', area:'โทโยสุ', meal:'breakfast', gps:'35.64450, 139.78320', note:'โอมากาเสะซูชิสดจากตลาดประมูลปลาโทโยสุ' },
      { name:'คุชิคัตสึ และซีฟู้ดย่าง เซ็นคยากุ บันไร', nameJa:'豊洲目抜き大通り グルメ', area:'โทโยสุ', meal:'lunch', gps:'35.64580, 139.78440', note:'หอยเชลล์ย่าง ไข่หอยเม่น และเนื้อวากิวเสียบไม้ในตลาดเซ็นคยากุบันไร' },
      { name:'Bills Odaiba คาเฟ่วิวสะพานเรนโบว์', nameJa:'bills お台場', area:'โอไดบะ', meal:'cafe', gps:'35.62880, 139.77580', note:'นั่งทานแพนเค้กและอาหารเช้าริมหน้าต่างมองเห็นอ่าวโตเกียว' },
      { name:'Tanaka Soba ในห้าง DiverCity โอไดบะ', nameJa:'田中そば店 ダイバーシティ東京プラザ店', area:'โอไดบะ', meal:'dinner', gps:'35.62510, 139.77560', note:'ราเมนซุปหมูใสหอมกลมกล่อมในโซนฟู้ดคอร์ทชั้น 2 ใกล้กั้นดั้มยักษ์' },
    ],
  },
  roppongi_tower: {
    short: { th:'โตเกียวทาวเวอร์ · รปปงหงิ', ja:'東京タワー・六本木' },
    label: { th:'โซนโตเกียวทาวเวอร์ · รปปงหงิ · อาซาบุได', ja:'東京タワー・六本木・麻布台エリア' },
    center: '35.65950, 139.74200',
    places: [
      { id:'zojoji', name:{ th:'วัดโซโจจิ & สวนชิบะ (จุดถ่ายรูปโตเกียวทาวเวอร์)', ja:'増上寺・芝公園' }, area:{ th:'มินาโตะ / โตเกียวทาวเวอร์', ja:'芝公園' }, dur:45, gps:'35.65740, 139.74820', art:'temple', hi:{ th:'วัดเก่าแก่หน้าโตเกียวทาวเวอร์ มุมถ่ายรูปวัดคู่กับโตเกียวทาวเวอร์สวยคลาสสิก', ja:'東京タワーを背景に写真が撮れる名刹' } },
      { id:'tokyo_tower', name:{ th:'โตเกียวทาวเวอร์ & สวนชิบะ', ja:'東京タワー・芝公園' }, area:{ th:'มินาโตะ / รปปงหงิ', ja:'芝公園・東京タワー' }, dur:75, gps:'35.65858, 139.74543', art:'city', hi:{ th:'หอคอยสีส้มขาวสัญลักษณ์โตเกียว มุมถ่ายรูปสวยจากสวนชิบะและวัดโซโจจิ', ja:'東京のシンボルタワー＆芝公園の絶景フォトスポット' } },
      { id:'azabudai_hills', name:{ th:'อาซาบุได ฮิลส์ & teamLab Borderless', ja:'麻布台ヒルズ・チームラボボーダレス' }, area:{ th:'รปปงหงิ / อาซาบุได', ja:'麻布台・六本木' }, dur:120, gps:'35.66060, 139.74040', art:'city', hi:{ th:'โครงการใหม่ล่าสุดใกล้โตเกียวทาวเวอร์ มีพิพิธภัณฑ์ teamLab Borderless โฉมใหม่', ja:'東京タワー近くの最新複合施設＆チームラボボーダレス' } },
      { id:'roppongi_hills', name:{ th:'รปปงหงิ ฮิลส์ & จุดชมวิว Tokyo City View', ja:'六本木ヒルズ・東京シティビュー' }, area:{ th:'รปปงหงิ', ja:'六本木' }, dur:75, gps:'35.66040, 139.72920', art:'city', hi:{ th:'จุดชมวิวโตเกียวทาวเวอร์มุมสูงและประติมากรรมแมงมุมยักษ์ Maman', ja:'東京タワーを正面に望む展望台とアートの街' } },
    ],
    restaurants: [
      { name:'เต้าหู้โบราณ โตเกียว ชิบะ โทฟุยะ อุกัย', nameJa:'東京 芝 とうふ屋うかい', area:'โตเกียวทาวเวอร์', meal:'lunch', gps:'35.65660, 139.74450', note:'ร้านอาหารญี่ปุ่นในสวนสวยตีนโตเกียวทาวเวอร์ บรรยากาศหรูหรา' },
      { name:'อูด้งสึรุทอนทัน รปปงหงิ (Tsurutontan)', nameJa:'つるとんたん 六本木店', area:'รปปงหงิ', meal:'dinner', gps:'35.66340, 139.73450', note:'อุด้งชามยักษ์มีให้เลือกกว่า 30 หน้า ทั้งครีมเมนไทโกะและแกงกะหรี่' },
      { name:'เนื้อย่าง คินตัน รปปงหงิ (KINTAN)', nameJa:'六本木焼肉 KINTAN', area:'รปปงหงิ', meal:'dinner', gps:'35.66370, 139.73240', note:'ลิ้นวัวย่างและเนื้อวากิวพรีเมียม มีเซ็ตมื้อกลางวันคุ้มราคา' },
    ],
  },
  kawagoe: {
    short: { th:'คาวาโกเอะ', ja:'川越' },
    label: { th:'โซนคาวาโกเอะ · ลิตเติ้ลเอโดะ (ไซตามะ)', ja:'川越・小江戸エリア' },
    center: '35.92340, 139.48300',
    places: [
      { id:'kitain', name:{ th:'วัดคิตะอิน (พระอรหันต์ 500 องค์)', ja:'喜多院' }, area:{ th:'คาวาโกเอะ', ja:'川越' }, dur:60, gps:'35.91820, 139.49060', art:'temple', hi:{ th:'วัดเก่าแก่สมัยเอโดะ อยู่บนเส้นทางก่อนเข้าย่านโกดังเก่า', ja:'徳川家ゆかりの名刹・五百羅漢' } },
      { id:'starbucks_kawagoe', name:{ th:'สตาร์บัคส์เรือนไม้โบราณ & หอระฆังโทคิโนะคาเนะ', ja:'スターバックス 川越鐘つき通り店・時の鐘' }, area:{ th:'คาวาโกเอะ', ja:'川越' }, dur:40, gps:'35.92350, 139.48340', art:'street', hi:{ th:'สตาร์บัคส์สไตล์บ้านไม้ญี่ปุ่นพร้อมสวนด้านใน ติดกับหอระฆังไม้โบราณ', ja:'蔵造りの街並みに溶け込む和風スタバと時の鐘' } },
      { id:'kashiya_yokocho', name:{ th:'ตรอกลูกกวาดโบราณ คาชิยะโยโกโจ', ja:'菓子屋横丁' }, area:{ th:'คาวาโกเอะ', ja:'川越' }, dur:45, gps:'35.92480, 139.48120', art:'street', hi:{ th:'เดินจากหอระฆังโทคิโนะคาเนะเพียง 3 นาที ขนมโบราณและมันหวาน', ja:'時の鐘から徒歩3分の駄菓子通り' } },
    ],
    restaurants: [
      { name:'ข้าวหน้าปลาไหล โอกะคิคุ (Ogakiku)', nameJa:'小川菊', area:'คาวาโกเอะ', meal:'lunch', gps:'35.92120, 139.48310', note:'ร้านปลาไหลย่างถ่านเก่าแก่กว่า 200 ปี อยู่บนถนนสายหลักคาวาโกเอะ (กดรับคิวก่อนเดินเที่ยว)' },
      { name:'ข้าวหน้าปลาไหล อิจิโนะยะ (Ichinoya)', nameJa:'いちのや 川越本店', area:'คาวาโกเอะ', meal:'lunch', gps:'35.91780, 139.48410', note:'ร้านปลาไหลชื่อดังเก่าแก่ตั้งแต่ปี 1832 มีที่นั่งกว้างขวางเหมาะกับครอบครัว' },
      { name:'โซบะชาเขียว โคโตบุกิอัน (Kotobukian)', nameJa:'寿庵 蔵の街店', area:'คาวาโกเอะ', meal:'lunch', gps:'35.92340, 139.48280', note:'โซบะชาเขียวเสิร์ฟเรียง 7 ชั้น พร้อมเทมปุระ อยู่ใกล้หอระฆัง' },
      { name:'มันหวานทอดแผ่นยักษ์ โอซัตสึอัน', nameJa:'小江戸おさつ庵', area:'คาวาโกเอะ', meal:'cafe', gps:'35.92390, 139.48270', note:'ชิปส์มันหวานแผ่นใหญ่จิ้มเนยเค็ม ถือเดินกินถ่ายรูปหน้าร้านโกดังเก่า' },
      { name:'ข้าวหน้าเนื้อวากิว ข้าวหุงหม้อดิน โคเอโดะ โอฮานะ', nameJa:'小江戸オハナ', area:'คาวาโกเอะ', meal:'lunch', gps:'35.92090, 139.48340', note:'ทามาโกะยากิไข่ม้วนเนื้อนุ่มและข้าวหน้าปลาไหล/เนื้อวากิว' },
    ],
  },
  fuji: {
    short: { th:'ฟูจิ · คาวากุจิโกะ', ja:'富士山・河口湖' },
    label: { th:'โซนภูเขาไฟฟูจิ · คาวากุจิโกะ · โอชิโนะ · โกเทมบะ', ja:'富士山・河口湖・忍野・御殿場エリア' },
    center: '35.50000, 138.76500',
    places: [
      { id:'fuji_ropeway', name:{ th:'กระเช้าคาจิคาจิ ชมวิวฟูจิ & ทะเลสาบ', ja:'富士山パノラマロープウェイ' }, area:{ th:'คาวากุจิโกะ', ja:'河口湖' }, dur:60, gps:'35.50420, 138.77240', art:'fuji', hi:{ th:'อยู่บนเส้นทางระหว่างเจดีย์ชูเรโตะไปสวนโออิชิ ขึ้นชมวิวทะเลสาบมุมสูง', ja:'河口湖と富士山を一望できるロープウェイ' } },
      { id:'yamanakako', name:{ th:'ทะเลสาบยามานากะ & จุดชมวิวพาโนรามาได', ja:'山中湖パノラマ台' }, area:{ th:'ยามานากะโกะ', ja:'山中湖' }, dur:60, gps:'35.41280, 138.90610', art:'lake', hi:{ th:'ขับรถต่อจากหมู่บ้านน้ำใสโอชิโนะฮัคไคเพียง 15 นาที วิวฟูจิใหญ่เต็มตาและให้อาหารหงส์', ja:'忍野八海から車で15分の絶景展望台＆白鳥の湖' } },
      { id:'saiko_iyashi', name:{ th:'หมู่บ้านโบราณไซโกะ อิยาชิโนะซาโตะ', ja:'西湖いやしの里根場' }, area:{ th:'ทะเลสาบไซโกะ / ฟูจิ', ja:'西湖・河口湖' }, dur:75, gps:'35.50150, 138.65940', art:'fuji', hi:{ th:'หมู่บ้านหลังคามุงแฝกโบราณที่มีฉากหลังเป็นภูเขาไฟฟูจิ เช่าชุดกิโมโน/ซามูไรถ่ายรูปได้', ja:'茅葺き屋根の集落と富士山の絶景' } },
      { id:'gotemba', name:{ th:'โกเทมบะ พรีเมียม เอาท์เล็ท', ja:'御殿場プレミアム・アウトレット' }, area:{ th:'โกเทมบะ / ฟูจิ', ja:'御殿場' }, dur:150, gps:'35.30710, 138.96610', art:'fuji', hi:{ th:'เอาท์เล็ทที่ใหญ่ที่สุดในญี่ปุ่นพร้อมวิวฟูจิ แวะระหว่างขับรถกลับโตเกียวได้พอดี', ja:'富士山を望む日本最大級のアウトレット' } },
    ],
    restaurants: [
      { name:'โฮโตฟูโด อุด้งหม้อไฟฟักทอง (ตึกก้อนเมฆ)', nameJa:'ほうとう不動 東恋路店', area:'คาวากุจิโกะ', meal:'lunch', gps:'35.49010, 138.76110', note:'อุด้งเส้นแบนต้มในซุปมิโซะฟักทองร้อนๆ อาคารดีไซน์ก้อนเมฆ มีที่จอดรถกว้าง' },
      { name:'โฮโต โคซากุ (Kosaku Hoto)', nameJa:'甲州ほうとう小作 河口湖店', area:'คาวากุจิโกะ', meal:'dinner', gps:'35.49560, 138.76290', note:'โฮโตต้นตำรับยามานาชิ มีทั้งหมู ไก่ เป็ด และเทมปุระ เหมาะกับครอบครัว' },
      { name:'Lake Bake คาเฟ่ขนมปังริมทะเลสาบวิวฟูจิ', nameJa:'レイクベイク (Lake Bake)', area:'โออิชิ / คาวากุจิโกะ', meal:'cafe', gps:'35.52360, 138.74780', note:'ติดกับสวนโออิชิ ขนมปังอบสดใหม่ นั่งจิบกาแฟมองฟูจิริมทะเลสาบ' },
      { name:'เทมปุระ & โซบะ นินจา โอชิโนะฮัคไค', nameJa:'天ぷら忍者', area:'โอชิโนะฮัคไค', meal:'lunch', gps:'35.46080, 138.83150', note:'โซบะน้ำแร่ฟูจิและเทมปุระกรอบๆ อยู่หน้าทางเข้าหมู่บ้านน้ำใส' },
      { name:'เนื้อย่าง อามิยากิเท คาวากุจิโกะ', nameJa:'あみやき亭 河口湖店', area:'คาวากุจิโกะ', meal:'dinner', gps:'35.49080, 138.75540', note:'ร้านเนื้อย่างสำหรับครอบครัว มีที่จอดรถใหญ่ สั่งผ่านแท็บเล็ตง่าย' },
      { name:'Fuji Tempura Idaten (เทมปุระฟูจิ)', nameJa:'冨士天ぷら いだ天', area:'คาวากุจิโกะ', meal:'lunch', gps:'35.49810, 138.76680', note:'ข้าวหน้าเทมปุระกุ้งและเทมปุระรูปภูเขาไฟฟูจิ ใกล้สถานีคาวากุจิโกะ' },
      { name:'แฮมเบิร์กซาวายากะ โกเทมบะ (Sawayaka)', nameJa:'炭焼きレストランさわやか 御殿場インター店', area:'โกเทมบะ / ฟูจิ', meal:'dinner', gps:'35.29740, 138.94450', note:'แฮมเบิร์กเนื้อบดย่างถ่านอันดับ 1 ของชิซึโอกะ แวะตอนไปโกเทมบะ' },
    ],
  },
  kamakura_yokohama: {
    short: { th:'คามาคุระ · โยโกฮาม่า', ja:'鎌倉・横浜' },
    label: { th:'โซนคามาคุระ · เอโนะชิมะ · โยโกฮาม่า', ja:'鎌倉・江ノ島・横浜エリア' },
    center: '35.31920, 139.54670',
    places: [
      { id:'daibutsu', name:{ th:'พระใหญ่คามาคุระ (วัดโคโตคุอิน)', ja:'鎌倉大仏（高徳院）' }, area:{ th:'คามาคุระ', ja:'鎌倉' }, dur:50, gps:'35.31670, 139.53570', art:'temple', hi:{ th:'องค์พระพุทธรูปสำริดกลางแจ้งขนาดใหญ่คู่เมืองคามาคุระ', ja:'鎌倉の象徴・国宝銅造阿弥陀如来坐像' } },
      { id:'komachi_dori', name:{ th:'ถนนคนเดิน โคมาจิโดริ คามาคุระ', ja:'小町通り' }, area:{ th:'คามาคุระ', ja:'鎌倉' }, dur:75, gps:'35.32120, 139.55220', art:'street', hi:{ th:'ถนนสายของกินเล่น ไอศกรีมมัทฉะ ข้าวหน้าปลาชิราสึ และของฝากหน้าสถานีคามาคุระ', ja:'鎌倉駅前の食べ歩き＆お土産ストリート' } },
      { id:'yokohama_chinatown', name:{ th:'ไชน่าทาวน์โยโกฮาม่า & อ่าวและโกดังอิฐแดง', ja:'横浜中華街・赤レンガ倉庫' }, area:{ th:'โยโกฮาม่า', ja:'横浜' }, dur:120, gps:'35.44370, 139.64550', art:'city', hi:{ th:'ไชน่าทาวน์ที่ใหญ่ที่สุดในญี่ปุ่นและเดินเล่นริมอ่าวโยโกฮาม่า', ja:'日本最大の中華街とみなとみらいの海辺散策' } },
    ],
    restaurants: [
      { name:'ข้าวหน้าปลาชิราสึ อากิโมโตะ คามาคุระ', nameJa:'秋本 鎌倉', area:'คามาคุระ', meal:'lunch', gps:'35.31930, 139.55080', note:'ข้าวหน้าปลาเงินชิราสึสดและเทมปุระผักคามาคุระ หน้าสถานีคามาคุระ' },
      { name:'เนื้อวากิวสับทอด โคโรเกะ คามาคุระ', nameJa:'鎌倉メンチカツ', area:'คามาคุระ', meal:'cafe', gps:'35.32080, 139.55200', note:'เมนจิคัตสึเนื้อฉ่ำทอดร้อนๆ บนถนนโคมาจิโดริ' },
      { name:'เสี่ยวหลงเปาผัดทอด เป็งเจินโหลว โยโกฮาม่า', nameJa:'鵬天閣 新館 横浜中華街', area:'โยโกฮาม่า', meal:'dinner', gps:'35.44320, 139.64620', note:'เสี่ยวหลงเปาทอดกรอบด้านล่าง น้ำซุปทะลัก ใจกลางไชน่าทาวน์โยโกฮาม่า' },
    ],
  },
};

/* คำค้นหาและช่วงเวลาที่เหมาะสมของแต่ละสถานที่ (0=เช้าตรู่, 1=เช้า-สาย, 2=กลางวัน-บ่าย, 3=เย็น-ค่ำ) */
const PLACE_ALIASES = {
  sensoji: { kw:['วัดเซนโซจิ', 'วัดอาซากุสะ', 'เซนโซจิ', 'sensoji', 'asakusa temple', '浅草寺'], bias:1 },
  nakamise: { kw:['นากามิเสะ', 'โคมแดง', 'คามินาริมง', 'nakamise', 'kaminarimon', '雷門', '仲見世'], bias:1 },
  sumida_walk: { kw:['แม่น้ำสุมิดะ', 'สุมิดะ', 'sumida', 'すみだリバー'], bias:2 },
  skytree: { kw:['สกายทรี', 'โซลามาจิ', 'skytree', 'solamachi', 'スカイツリー'], bias:2.5 },
  kappabashi: { kw:['คัปปะบาชิ', 'ถนนเครื่องครัว', 'kappabashi', 'かっぱ橋'], bias:2 },
  ueno_park: { kw:['สวนอุเอโนะ', 'สวนสาธารณะอุเอโนะ', 'พิพิธภัณฑ์อุเอโนะ', 'ueno park', '上野公園'], bias:1 },
  ueno_zoo: { kw:['สวนสัตว์อุเอโนะ', 'สวนสัตว์', 'แพนด้า', 'ueno zoo', '上野動物園'], bias:1 },
  ameyoko: { kw:['อาเมโยโกะ', 'ตลาดอาเมโยโกะ', 'ตลาดอุเอโนะ', 'ameyoko', 'アメ横'], bias:2 },
  takeya: { kw:['ตึกม่วง', 'ทาเคยะ', 'takeya', '多慶屋'], bias:2.5 },
  akihabara: { kw:['อากิฮาบาระ', 'อากิบะ', 'akihabara', 'akiba', '秋葉原'], bias:2.5 },
  yanaka_ginza: { kw:['ยานากะ', 'หมู่บ้านแมว', 'yanaka', '谷中銀座'], bias:2 },
  meiji: { kw:['ศาลเจ้าเมจิ', 'เมจิจิงกู', 'meiji', '明治神宮'], bias:1 },
  omotesando: { kw:['ทาเคชิตะ', 'โอโมเตะซันโด', 'ฮาราจูกุ', 'takeshita', 'omotesando', 'harajuku', '竹下通り', '表参道'], bias:2 },
  miyashita_park: { kw:['มิยาชิตะ', 'miyashita', 'MIYASHITA PARK'], bias:2 },
  shibuya_parco: { kw:['พาร์โก้', 'นินเทนโด', 'โปเกมอนเซ็นเตอร์', 'parco', 'nintendo', '渋谷PARCO'], bias:2 },
  hachiko_crossing: { kw:['ห้าแยกชิบูย่า', 'ฮาจิโกะ', 'ห้าแยก', 'hachiko', 'scramble crossing', 'スクランブル交差点', 'ハチ公'], bias:2.5 },
  shibuyasky: { kw:['ชิบูย่าสกาย', 'ดาดฟ้าชิบูย่า', 'shibuya sky', 'shibuyasky', '渋谷スカイ'], bias:3 },
  gyoen: { kw:['ชินจูกุเกียวเอ็น', 'ชินจูกุเกียวเอน', 'สวนชินจูกุ', 'เกียวเอ็น', 'เกียวเอน', 'gyoen', '新宿御苑'], bias:1 },
  tocho: { kw:['ศาลาว่าการ', 'ตึกบัญชาการ', 'โทโจ', 'tocho', 'metropolitan', '東京都庁'], bias:2 },
  hanazono: { kw:['ฮานาโซโนะ', 'ศาลเจ้าฮานาโซโนะ', 'hanazono', '花園神社'], bias:1.5 },
  shinjuku_cat: { kw:['แมวยักษ์', 'แมว 3 มิติ', 'อิเซตัน', 'ชินจูกุตะวันออก', '3d cat', 'isetan', '3D巨大猫'], bias:2 },
  shin_okubo: { kw:['ชินโอคุโบะ', 'โอคุโบะ', 'โคเรียทาวน์', 'shin-okubo', 'shinokubo', '新大久保'], bias:2 },
  kabukicho_tower: { kw:['คาบูกิโจ', 'ก๊อตซิลล่า', 'หัวก๊อตซิลล่า', 'kabukicho', 'godzilla', '歌舞伎町'], bias:3 },
  omoide: { kw:['โอโมอิเดะ', 'ซอยโอโมอิเดะ', 'ยากิโทริ', 'omoide', '思い出横丁'], bias:3 },
  tsukiji_outer: { kw:['ตลาดปลาซึกิจิ', 'ซึกิจิ', 'tsukiji', '築地'], bias:0.5 },
  imperial_palace: { kw:['พระราชวัง', 'อิมพีเรียล', 'สะพานแว่นตา', 'นิจูบาชิ', 'imperial palace', '皇居'], bias:1 },
  ginza_six: { kw:['กินซ่า', 'ginza six', 'uniqlo กินซ่า', 'ginza', '銀座'], bias:2 },
  art_aquarium: { kw:['อควาเรียมปลาทอง', 'ปลาทอง', 'อาร์ตอควาเรียม', 'art aquarium', 'アートアクアリウム'], bias:2 },
  tokyo_char_st: { kw:['สถานีโตเกียว', 'ถนนตัวการ์ตูน', 'character street', 'tokyo station', '東京駅', 'キャラクターストリート'], bias:2.5 },
  teamlab_planets: { kw:['ทีมแล็บ', 'teamlab', 'พลานเน็ต', 'チームラボ'], bias:1.5 },
  senkyaku_banrai: { kw:['ตลาดปลาโทโยสุ', 'โทโยสุ', 'เซ็นคยากุ', 'toyosu', 'senkyaku', '豊洲', '千客万来'], bias:1 },
  odaiba: { kw:['โอไดบะ', 'กั้นดั้ม', 'กันดั้ม', 'สะพานเรนโบว์', 'odaiba', 'gundam', 'お台場'], bias:2.5 },
  zojoji: { kw:['วัดโซโจจิ', 'โซโจจิ', 'สวนชิบะ', 'zojoji', 'shiba park', '増上寺'], bias:1.5 },
  tokyo_tower: { kw:['โตเกียวทาวเวอร์', 'หอคอยโตเกียว', 'tokyo tower', '東京タワー'], bias:2.5 },
  azabudai_hills: { kw:['อาซาบุได', 'borderless', 'azabudai', '麻布台'], bias:2 },
  roppongi_hills: { kw:['รปปงหงิ', 'รปปงหงิฮิลส์', 'roppongi', '六本木ヒルズ'], bias:3 },
  kitain: { kw:['วัดคิตะอิน', 'คิตะอิน', 'kitain', '喜多院'], bias:1 },
  tokinokane: { kw:['หอระฆัง', 'โทคิโนะคาเนะ', 'เมืองเก่าคาวาโกเอะ', 'tokinokane', 'toki no kane', '時の鐘'], bias:2 },
  starbucks_kawagoe: { kw:['สตาร์บัคส์คาวาโกเอะ', 'สตาร์บัคส์โบราณ', 'starbucks kawagoe', '川越鐘つき通り'], bias:2 },
  kashiya: { kw:['คาชิยะ', 'ซอยขนม', 'ตรอกลูกกวาด', 'kashiya', '菓子屋横丁'], bias:2 },
  hikawa: { kw:['ฮิคาวะ', 'ศาลเจ้าฮิคาวะ', 'ศาลเจ้าคาวาโกเอะ', 'hikawa', '氷川神社'], bias:2.5 },
  chureito: { kw:['เจดีย์ชูเรโตะ', 'ชูเรโตะ', 'เจดีย์แดง', 'chureito', '忠霊塔'], bias:0.5 },
  fuji_ropeway: { kw:['กระเช้าฟูจิ', 'กระเช้าคาจิคาจิ', 'คาจิคาจิ', 'ropeway', 'ロープウェイ'], bias:1.5 },
  oishi: { kw:['สวนโออิชิ', 'โออิชิ', 'คาวากุจิโกะ', 'oishi', '大石公園'], bias:1.5 },
  saiko_iyashi: { kw:['หมู่บ้านไซโกะ', 'ไซโกะ', 'อิยาชิโนะซาโตะ', 'saiko', '西湖'], bias:2 },
  oshino: { kw:['โอชิโนะฮักไก', 'โอชิโนะ', 'หมู่บ้านน้ำใส', 'บ่อน้ำศักดิ์สิทธิ์', 'oshino', '忍野八海'], bias:2 },
  yamanakako: { kw:['ยามานากะ', 'ทะเลสาบยามานากะ', 'พาโนรามาได', 'yamanakako', '山中湖'], bias:2.5 },
  gotemba: { kw:['โกเทมบะ', 'เอาท์เล็ท', 'gotemba', 'outlet', '御殿場'], bias:3 },
  daibutsu: { kw:['พระใหญ่', 'พระใหญ่คามาคุระ', 'โคโตคุอิน', 'daibutsu', '鎌倉大仏'], bias:1 },
  komachi_dori: { kw:['โคมาจิ', 'ถนนโคมาจิ', 'komachi', '小町通り'], bias:2 },
  yokohama_chinatown: { kw:['ไชน่าทาวน์', 'โยโกฮาม่า', 'โกดังอิฐแดง', 'yokohama', 'chinatown', '横浜中華街'], bias:3 },
};

function getAllCatalogPlaces() {
  const map = {};
  Object.entries(ZONE_DISCOVERY).forEach(([zk, z]) => {
    (z.places || []).forEach(np => {
      if (np.id === 'kashiya_yokocho' && PLACES.kashiya) return;
      map[np.id] = {
        id: np.id,
        name: np.name, ro: np.name?.ja || np.id, area: np.area, art: np.art || 'city',
        dur: np.dur || 60, gps: np.gps || '', mapcode: '',
        hi: { th: [np.hi?.th || ''], ja: [np.hi?.ja || ''] }, miss: { th: [], ja: [] }, transit: { th: '', ja: '' }, custom: true,
        zoneKey: zk,
      };
    });
  });
  Object.entries(PLACES).forEach(([id, p]) => {
    map[id] = {
      ...p,
      id,
      zoneKey: matchZoneKey(`${tx(p.area)} ${p.name?.th || ''} ${p.name?.ja || ''}`, p.gps),
      fromUserDb: !!p.src || !!p.custom,
    };
  });
  return map;
}

function matchZoneKey(text = '', gps = '') {
  const s = String(text || '').toLowerCase();
  if (/ฟูจิ|คาวากุจิ|โอชิโนะ|ยามานากะ|ไซโกะ|โกเทมบะ|ชูเรโตะ|โออิชิ|fuji|kawaguchi|oshino|yamanaka|gotemba|chureito|oishi|富士山|河口湖|忍野|山中湖|御殿場/.test(s)) return 'fuji';
  if (/คาวาโกเอะ|ไซตามะ|ฮิคาวะ|เอโดะ|kawagoe|saitama|hikawa|川越|氷川/.test(s)) return 'kawagoe';
  if (/คามาคุระ|เอโนะชิมะ|โยโกฮาม่า|kamakura|enoshima|yokohama|鎌倉|江ノ島|横浜/.test(s)) return 'kamakura_yokohama';
  if (/โอไดบะ|โทโยสุ|ทีมแล็บ|odaiba|toyosu|teamlab|お台場|豊洲|チームラボ/.test(s)) return 'odaiba_toyosu';
  if (/โตเกียวทาวเวอร์|รปปงหงิ|อาซาบุ|ชิบะ|roppongi|azabu|tokyo tower|東京タワー|六本木|麻布/.test(s)) return 'roppongi_tower';
  if (/อุเอโนะ|อาเมโยโกะ|อากิฮาบาระ|ยานากะ|ueno|ameyoko|akihabara|yanaka|上野|アメ横|秋葉原|谷中/.test(s)) return 'ueno_akihabara';
  if (/อาซากุสะ|เซนโซจิ|สกายทรี|สุมิดะ|โอชิอาเกะ|asakusa|sensoji|skytree|sumida|浅草|スカイツリー|隅田/.test(s)) return 'asakusa_skytree';
  if (/กินซ่า|ซึกิจิ|พระราชวัง|สถานีโตเกียว|มารุโนะอุจิ|ginza|tsukiji|imperial|marunouchi|銀座|築地|皇居|東京駅/.test(s)) return 'ginza_tsukiji';
  if (/ฮาราจูกุ|ชิบูย่า|เมจิ|โอโมเตะซันโด|ทาเคชิตะ|harajuku|shibuya|meiji|omotesando|原宿|渋谷|明治神宮|表参道/.test(s)) return 'harajuku_shibuya';
  if (/ชินจูกุ|คาบูกิโจ|โอคุโบะ|shinjuku|kabukicho|omoide|新宿|歌舞伎町/.test(s)) return 'shinjuku';
  if (gps) {
    let bestKey = 'shinjuku', bestDist = Infinity;
    for (const [k, z] of Object.entries(ZONE_DISCOVERY)) {
      const d = gpsDistKm(gps, z.center);
      if (d !== null && d < bestDist) { bestDist = d; bestKey = k; }
    }
    return bestKey;
  }
  return null;
}

function detectDayZone(dayIdx) {
  const d = state.days[dayIdx];
  if (!d) return 'shinjuku';
  const stopPlaces = d.stops.map(s => PLACES[s.id]).filter(Boolean);
  const dayRests = (state.restaurants || []).filter(r => r.day === dayIdx + 1);
  // ตรวจจากจุดแวะในวันนั้นก่อน (แม่นยำที่สุด)
  for (const p of stopPlaces) {
    const zk = matchZoneKey(`${tx(p.area)} ${p.name?.th || ''} ${p.name?.ja || ''}`, p.gps);
    if (zk) return zk;
  }
  // ตรวจจากร้านอาหารที่ผูกกับวันนั้น
  for (const r of dayRests) {
    const zk = matchZoneKey(`${r.area || ''} ${r.name || ''} ${r.nameJa || ''}`, r.gps);
    if (zk) return zk;
  }
  // ตรวจจากชื่อวัน
  const titleZk = matchZoneKey(`${tx(d.title)} ${tx(d.note || '')}`);
  if (titleZk) return titleZk;
  // ถ้าเป็นวันว่าง ให้ดูโซนที่ยังไม่ได้ไปในวันอื่น
  const usedZones = new Set(state.days.map((_, idx) => idx === dayIdx ? null : (state.days[idx].stops.length ? detectDayZoneFromStopsOnly(idx) : null)).filter(Boolean));
  const unused = Object.keys(ZONE_DISCOVERY).find(k => !usedZones.has(k));
  return unused || 'ginza_tsukiji';
}

function detectDayZoneFromStopsOnly(dayIdx) {
  const d = state.days[dayIdx];
  if (!d) return null;
  for (const s of d.stops) {
    const p = PLACES[s.id];
    if (p) {
      const zk = matchZoneKey(`${tx(p.area)} ${p.name?.th || ''} ${p.name?.ja || ''}`, p.gps);
      if (zk) return zk;
    }
  }
  return matchZoneKey(tx(d.title));
}

function analyzeRouteIssues() {
  const warnings = [];
  state.days.forEach((d, i) => {
    const stops = d.stops.map(s => ({ id: s.id, p: PLACES[s.id] })).filter(x => x.p && x.p.gps);
    for (let k = 1; k < stops.length; k++) {
      const dist = gpsDistKm(stops[k - 1].p.gps, stops[k].p.gps);
      if (dist && dist > 18 && d.mode !== 'car') {
        warnings.push(`${t('day_n', { n: i + 1 })}: <b>${esc(pName(stops[k - 1].p))} → ${esc(pName(stops[k].p))}</b> ห่างกันถึง ${dist.toFixed(1)} กม. (คนละโซน ควรแยกวันหรือกดปุ่มเรียงตามเส้นทาง)`);
      }
    }
    if (stops.length >= 3) {
      const d01 = gpsDistKm(stops[0].p.gps, stops[1].p.gps) || 0;
      const d12 = gpsDistKm(stops[1].p.gps, stops[2].p.gps) || 0;
      const d02 = gpsDistKm(stops[0].p.gps, stops[2].p.gps) || 0;
      if (d01 + d12 > d02 * 1.7 && d01 + d12 - d02 > 4) {
        warnings.push(`${t('day_n', { n: i + 1 })}: ลำดับ <b>${esc(pName(stops[0].p))} → ${esc(pName(stops[1].p))} → ${esc(pName(stops[2].p))}</b> มีย้อนเส้นทาง <button class="mini" onclick="sortDayByGps(${i});renderAI()">✨ เรียงใหม่ทันที</button>`);
      }
    }
  });
  return warnings;
}

function buildSmartRecs(q = '', forceZone = null, forceDayIdx = null) {
  const ql = String(q || '').toLowerCase();
  const dayMatch = ql.match(/(?:วันที่|day|日目|\b)(\d+)\b/);
  let targetDays = state.days.map((_, i) => i);
  if (forceDayIdx !== null && forceDayIdx >= 0 && forceDayIdx < state.days.length) {
    targetDays = [forceDayIdx];
  } else if (dayMatch) {
    const idx = Math.max(0, Math.min(state.days.length - 1, parseInt(dayMatch[1], 10) - 1));
    targetDays = [idx];
  }
  const qZone = forceZone || matchZoneKey(ql);
  const usedPlaceIds = new Set(state.days.flatMap(d => d.stops.map(s => s.id)));
  const places = [];
  const restaurants = [];

  const isRain = /ฝน|rain|雨|ในร่ม/.test(ql);
  if (isRain) {
    ['teamlab_planets', 'skytree', 'tokyo_char_st', 'azabudai_hills'].forEach(pid => {
      for (const z of Object.values(ZONE_DISCOVERY)) {
        const found = z.places.find(x => x.id === pid);
        if (found && !usedPlaceIds.has(found.id) && !places.some(x => x.id === found.id)) {
          places.push({ ...found, day: (targetDays[0] || 0) + 1 });
        }
      }
    });
  }

  targetDays.forEach(dIdx => {
    const zKey = qZone || detectDayZone(dIdx);
    const z = ZONE_DISCOVERY[zKey] || ZONE_DISCOVERY.shinjuku;
    const dayStops = state.days[dIdx]?.stops.map(s => PLACES[s.id]).filter(Boolean) || [];
    const refGps = dayStops[0]?.gps || z.center;

    // 1. ค้นหาที่เที่ยวใน PLACES (รวมถึงจาก Sheet และที่สร้างเอง) ที่อยู่ในโซนเดียวกัน
    Object.entries(PLACES).forEach(([id, p]) => {
      if (places.some(x => x.id === id)) return;
      const pZk = matchZoneKey(`${tx(p.area)} ${p.name?.th || ''} ${p.name?.ja || ''}`, p.gps);
      const dist = refGps && p.gps ? gpsDistKm(refGps, p.gps) : null;
      if (pZk === zKey || (dist !== null && dist <= 7)) {
        places.push({
          id, name: p.name, area: p.area, dur: p.dur, gps: p.gps, art: p.art,
          hi: { th: (p.hi?.th || [])[0] || '', ja: (p.hi?.ja || [])[0] || '' },
          day: dIdx + 1, distKm: dist, fromUserDb: !!p.src || !!p.custom,
          alreadyPicked: usedPlaceIds.has(id),
        });
      }
    });

    // 2. ค้นหาที่เที่ยวแนะนำประจำโซนนั้น
    z.places.forEach(np => {
      if (!places.some(x => x.id === np.id)) {
        const dist = refGps && np.gps ? gpsDistKm(refGps, np.gps) : null;
        places.push({ ...np, day: dIdx + 1, distKm: dist, alreadyPicked: usedPlaceIds.has(np.id) });
      }
    });

    // 3. ค้นหาร้านอาหารที่ผู้ใช้มีใน state.restaurants (หรือดึงจาก Sheet) ที่อยู่ในโซนเดียวกับวันนี้ แต่ยังไม่ได้ระบุเป็นวันนี้
    (state.restaurants || []).forEach(ur => {
      if (ur.day === dIdx + 1) return; // ผูกกับวันนี้อยู่แล้ว
      const rZk = matchZoneKey(`${ur.area || ''} ${ur.name || ''} ${ur.nameJa || ''}`, ur.gps);
      const dist = refGps && ur.gps ? gpsDistKm(refGps, ur.gps) : null;
      if (rZk === zKey || (dist !== null && dist <= 7)) {
        if (!restaurants.some(x => x.name === ur.name)) {
          restaurants.push({ ...ur, day: dIdx + 1, distKm: dist, existingId: ur.id, fromUserSheet: true });
        }
      }
    });

    // 4. ค้นหาร้านอาหารแนะนำประจำโซนนั้นทั้งหมด (เรียงตามระยะห่างจากจุดแวะในวันนั้น)
    const dayRestNames = new Set((state.restaurants || []).filter(r => r.day === dIdx + 1).map(r => String(r.name || '').trim().toLowerCase()));
    z.restaurants.forEach(nr => {
      const key = String(nr.name).trim().toLowerCase();
      if (!dayRestNames.has(key) && !restaurants.some(x => String(x.name).trim().toLowerCase() === key)) {
        const dist = refGps && nr.gps ? gpsDistKm(refGps, nr.gps) : null;
        restaurants.push({ ...nr, day: dIdx + 1, distKm: dist });
      }
    });
  });

  places.sort((a, b) => (a.alreadyPicked ? 1 : 0) - (b.alreadyPicked ? 1 : 0) || (b.fromUserDb ? 1 : 0) - (a.fromUserDb ? 1 : 0) || ((a.distKm ?? 99) - (b.distKm ?? 99)));
  restaurants.sort((a, b) => (b.fromUserSheet ? 1 : 0) - (a.fromUserSheet ? 1 : 0) || ((a.distKm ?? 99) - (b.distKm ?? 99)));

  const onlyFood = /ร้าน|อาหาร|กิน|หิว|ราเมน|เนื้อ|ซูชิ|คาเฟ่|グルメ|レストラン|食/.test(ql) && !/ที่เที่ยว|แพลน|โซน/.test(ql);
  const onlyPlaces = /ที่เที่ยว|จุดแวะ|ว่าง|ฝน|スポット|観光/.test(ql) && !/ร้าน|อาหาร|กิน/.test(ql);
  const singleDay = targetDays.length === 1;

  return {
    places: onlyFood ? [] : places.slice(0, singleDay ? 10 : 12),
    restaurants: onlyPlaces ? [] : restaurants.slice(0, singleDay ? 8 : 12),
  };
}

function recsCard(recs, msgIdx) {
  if (!recs || ((!recs.places || !recs.places.length) && (!recs.restaurants || !recs.restaurants.length))) return '';
  let out = '';
  if (recs.places && recs.places.length) {
    out += `<div class="plan-card" style="margin-top:8px"><b>${t('ai_nearby_places')} (${recs.places.length})</b><div class="ai-recs-list">${recs.places.map((p, pi) => {
      const name = tx(p.name) || p.name;
      const area = tx(p.area) || p.area || '';
      const hi = typeof p.hi === 'object' ? tx(p.hi) : (p.hi || '');
      const days = p.id ? placeDaysOf(p.id) : [];
      const isPicked = days.length > 0 || !!p.added;
      const curDayIdx = days.length ? days[0] : Math.max(0, (p.day || (ui.day + 1)) - 1);
      const dayN = curDayIdx + 1;
      const distTxt = p.distKm != null ? ` · ~${p.distKm.toFixed(1)} กม.` : '';
      return `<div class="ai-rec-item ${isPicked ? 'is-picked' : ''}"><div class="grow"><b>${esc(name)}</b>${isPicked ? ` <span class="chip c-matcha mini-chip">${esc(t('picked_in_day', { d: days.length ? days.map(d => d + 1).join(', ') : dayN }))}</span>` : ''}${p.fromUserDb ? ` <span class="chip c-sora mini-chip">ใน Sheet/แอป</span>` : ''} <span class="muted small">· ${esc(area)}${distTxt} (${t('day_n', { n: dayN })})</span>${hi ? `<div class="small muted">${esc(hi)}</div>` : ''}</div>
        ${isPicked
          ? `<select class="day-move-sel" aria-label="${t('change_day')}" onchange="changeAiPlaceDay(${msgIdx},${pi},+this.value)">
              ${state.days.map((d, k) => `<option value="${k}" ${curDayIdx === k ? 'selected' : ''}>📅 ${t('day_n', { n: k + 1 })} (${dShort(k)})</option>`).join('')}
              <option value="-1">${t('remove_from_trip')}</option>
            </select>`
          : `<button class="mini" onclick="addAiPlace(${msgIdx},${pi})">${t('ai_add_place', { d: dayN })}</button>`}</div>`;
    }).join('')}</div></div>`;
  }
  if (recs.restaurants && recs.restaurants.length) {
    out += `<div class="plan-card" style="margin-top:8px"><b>${t('ai_nearby_rests')} (${recs.restaurants.length})</b><div class="ai-recs-list">${recs.restaurants.map((r, ri) => {
      const dayN = r.day || 0;
      const mealTxt = r.meal ? t('meal_' + r.meal) : '';
      const distTxt = r.distKm != null ? ` · ~${r.distKm.toFixed(1)} กม.` : '';
      return `<div class="ai-rec-item"><div class="grow"><b>🍜 ${esc(r.name)}</b>${r.nameJa ? ` <span class="muted small">(${esc(r.nameJa)})</span>` : ''}${r.fromUserSheet ? ` <span class="chip c-yuzu mini-chip">ร้านของเรา</span>` : ''}
        <div class="small muted">${[mealTxt, r.area, dayN ? t('day_n', { n: dayN }) : '', distTxt.replace(/^ · /, '')].filter(Boolean).join(' · ')}</div>
        ${r.note ? `<div class="small muted">🍴 ${esc(r.note)}</div>` : ''}</div>
        ${r.added ? `<span class="ok small">✓</span>` : `<button class="mini" onclick="addAiRest(${msgIdx},${ri})">${dayN ? `+ ใส่วันที่ ${dayN}` : t('ai_add_rest')}</button>`}</div>`;
    }).join('')}</div></div>`;
  }
  return out;
}

function addAiPlace(msgIdx, pIdx) {
  const m = aiLog[msgIdx], p = m?.recs?.places?.[pIdx];
  if (!p) return;
  const id = p.id || uid('cp');
  p.id = id;
  if (!PLACES[id]) {
    const th = tx(p.name) || String(p.name);
    const ja = (typeof p.name === 'object' ? p.name.ja : p.nameJa) || th;
    const aTh = tx(p.area) || String(p.area || '');
    const aJa = (typeof p.area === 'object' ? p.area.ja : aTh) || aTh;
    const hiTxt = typeof p.hi === 'object' ? tx(p.hi) : String(p.hi || '');
    const rec = {
      name: { th, ja }, ro: ja, area: { th: aTh, ja: aJa }, art: p.art || 'city',
      dur: Number(p.dur) || 60, gps: parseGps(p.gps) || p.gps || '', mapcode: '',
      hi: { th: hiTxt ? [hiTxt] : [], ja: hiTxt ? [hiTxt] : [] }, miss: { th: [], ja: [] }, transit: { th: '', ja: '' }, custom: true,
    };
    state.customPlaces = state.customPlaces || {};
    state.customPlaces[id] = rec;
    mergePlaces();
  }
  const dayIdx = Math.max(0, Math.min(state.days.length - 1, (p.day || 1) - 1));
  if (!state.days[dayIdx].stops.some(s => s.id === id)) {
    state.days[dayIdx].stops.push({ id, leg: 25 });
    recalcDayLegs(dayIdx);
  }
  p.added = true;
  saveState(); renderAI();
  toast(t('ai_added_place', { name: pName(PLACES[id]), d: dayIdx + 1 }));
}

function changeAiPlaceDay(msgIdx, pIdx, targetDayIdx) {
  const m = aiLog[msgIdx], p = m?.recs?.places?.[pIdx];
  if (!p) return;
  if (!p.id) p.id = uid('cp');
  if (targetDayIdx >= 0) {
    p.day = targetDayIdx + 1;
    p.added = true;
  } else {
    p.added = false;
  }
  changePlaceDay(p.id, targetDayIdx, 'ai');
  renderAI();
}

function addAiRest(msgIdx, rIdx) {
  const m = aiLog[msgIdx], r = m?.recs?.restaurants?.[rIdx];
  if (!r) return;
  state.restaurants = state.restaurants || [];
  const exists = state.restaurants.find(x => (r.existingId && x.id === r.existingId) || String(x.name).trim().toLowerCase() === String(r.name).trim().toLowerCase());
  if (exists) {
    if (r.day) exists.day = Number(r.day);
    if (r.gps && !exists.gps) exists.gps = parseGps(r.gps) || r.gps;
  } else {
    state.restaurants.push({
      id: uid('r'),
      name: r.name,
      nameJa: r.nameJa || '',
      area: r.area || '',
      meal: r.meal || 'lunch',
      day: Number(r.day) || 0,
      address: r.address || '',
      gps: parseGps(r.gps) || r.gps || '',
      note: r.note || '',
    });
  }
  r.added = true;
  saveState(); renderAI();
  toast(t('ai_added_rest', { name: r.name }));
}

function showZoneRecs(dayIdx, zoneKey = null) {
  const dIdx = dayIdx != null ? dayIdx : ui.day;
  const zKey = zoneKey || detectDayZone(dIdx);
  const z = ZONE_DISCOVERY[zKey] || ZONE_DISCOVERY.shinjuku;
  const recs = buildSmartRecs('', zKey, dIdx);
  const dayTitle = state.days[dIdx] ? tx(state.days[dIdx].title) : '';
  const html = `<b>📍 ${t('day_n', { n: dIdx + 1 })} (${esc(dayTitle)}) — ${esc(tx(z.label))}</b><div class="small muted" style="margin-top:4px">คัดเลือกสถานที่ท่องเที่ยวและร้านอาหารที่อยู่ในโซนพื้นที่เดียวกันและเรียงตามระยะห่างจากจุดแวะของวันนี้ กด <b>+</b> เพื่อเพิ่มเข้าแผนได้ทันที:</div>`;
  aiLog.push({ me: false, html, recs });
  renderAI();
}

// ดึงชื่อสถานที่ท่องเที่ยวที่ผู้ใช้ระบุไว้ในประโยคคำสั่ง (รองรับทั้งชื่อไทย/ญี่ปุ่น/อังกฤษ/คำพ้อง และสถานที่ที่เพิ่มเอง)
function extractPlacesFromPrompt(q) {
  const ql = String(q || '').toLowerCase();
  if (!ql) return [];
  const catalog = getAllCatalogPlaces();
  const matched = [];
  const addMatch = (id, pos) => {
    if (!catalog[id]) return;
    const ex = matched.find(m => m.id === id);
    if (ex) { if (pos < ex.pos) ex.pos = pos; }
    else matched.push({ id, pos });
  };

  // 1. ตรวจจากตารางคำพ้องเสียง/ชื่อย่อยอดฮิต (PLACE_ALIASES)
  Object.entries(PLACE_ALIASES).forEach(([id, entry]) => {
    const kws = Array.isArray(entry) ? entry : (entry?.kw || []);
    for (const kw of kws) {
      const k = kw.toLowerCase();
      const idx = ql.indexOf(k);
      if (idx >= 0) { addMatch(id, idx); break; }
    }
  });

  // 2. ตรวจจากชื่อสถานที่จริงใน PLACES + customPlaces + ZONE_DISCOVERY
  Object.values(catalog).forEach(p => {
    const candidates = [
      p.id,
      p.name?.th,
      p.name?.ja,
      p.ro,
      ...(p.name?.th ? String(p.name.th).split(/[()（）/·,]/) : []),
      ...(p.name?.ja ? String(p.name.ja).split(/[()（）/·,]/) : []),
    ].map(s => String(s || '').trim().toLowerCase()).filter(s => s.length >= 3);
    for (const c of candidates) {
      const idx = ql.indexOf(c);
      if (idx >= 0) { addMatch(p.id, idx); break; }
    }
  });

  matched.sort((a, b) => a.pos - b.pos);
  return matched.map(m => catalog[m.id]);
}

// ดึงโซนพื้นที่ทั้งหมดที่ผู้ใช้พูดถึงในประโยค (เรียงตามลำดับที่พูดถึง)
function extractZonesFromPrompt(q) {
  const ql = String(q || '').toLowerCase();
  if (!ql) return [];
  const ZONE_KW = {
    shinjuku: ['ชินจูกุ', 'คาบูกิโจ', 'โอคุโบะ', 'shinjuku', 'kabukicho', '新宿'],
    harajuku_shibuya: ['ฮาราจูกุ', 'ชิบูย่า', 'โอโมเตะซันโด', 'ทาเคชิตะ', 'เมจิ', 'harajuku', 'shibuya', 'omotesando', '原宿', '渋谷'],
    asakusa_skytree: ['อาซากุสะ', 'เซนโซจิ', 'สกายทรี', 'สุมิดะ', 'asakusa', 'sensoji', 'skytree', '浅草', 'スカイツリー'],
    ueno_akihabara: ['อุเอโนะ', 'อาเมโยโกะ', 'อากิฮาบาระ', 'อากิบะ', 'ยานากะ', 'ueno', 'ameyoko', 'akihabara', '上野', '秋葉原'],
    ginza_tsukiji: ['กินซ่า', 'ซึกิจิ', 'สถานีโตเกียว', 'พระราชวัง', 'ginza', 'tsukiji', 'tokyo station', '銀座', '築地'],
    odaiba_toyosu: ['โอไดบะ', 'โทโยสุ', 'ทีมแล็บ', 'odaiba', 'toyosu', 'teamlab', 'お台場', '豊洲'],
    roppongi_tower: ['โตเกียวทาวเวอร์', 'รปปงหงิ', 'อาซาบุได', 'โซโจจิ', 'tokyo tower', 'roppongi', 'azabudai', '東京タワー', '六本木'],
    kawagoe: ['คาวาโกเอะ', 'เอโดะน้อย', 'ไซตามะ', 'kawagoe', '川越'],
    fuji: ['ฟูจิ', 'คาวากุจิโกะ', 'โอชิโนะ', 'ชูเรโตะ', 'โกเทมบะ', 'ยามานากะ', 'fuji', 'kawaguchiko', '富士山', '河口湖'],
    kamakura_yokohama: ['คามาคุระ', 'เอโนะชิมะ', 'โยโกฮาม่า', 'พระใหญ่', 'kamakura', 'enoshima', 'yokohama', '鎌倉', '横浜'],
  };
  const found = [];
  Object.entries(ZONE_DISCOVERY).forEach(([zk, z]) => {
    const kws = z.keywords || ZONE_KW[zk] || [z.short?.th, z.short?.ja].filter(Boolean);
    let bestPos = Infinity;
    for (const kw of kws) {
      const idx = ql.indexOf(String(kw).toLowerCase());
      if (idx >= 0 && idx < bestPos) bestPos = idx;
    }
    if (bestPos < Infinity) found.push({ zk, pos: bestPos });
  });
  found.sort((a, b) => a.pos - b.pos);
  return found.map(x => x.zk);
}

// จัดลำดับจุดแวะให้เป็นเส้นทางต่อเนื่อง ไม่ย้อนไปมา (Optimal Route: โรงแรมเช้า -> จุดที่ 1 -> จุดที่ 2 -> ... -> โรงแรมเย็น)
function optimizeStopsOrder(stopIds, catalogMap = null, dayIdx = ui.day, mode = null, explicitTimeMap = {}) {
  const cat = catalogMap || getAllCatalogPlaces();
  const uniqueIds = [...new Set(stopIds)].filter(id => cat[id] || PLACES[id]);
  if (!uniqueIds.length) return [];
  const d = state.days[dayIdx];
  const trMode = mode || d?.mode || 'transit';
  const iso = d ? isoOf(dateOfDay(dayIdx)) : state.trip.start;
  const hs = hotelMorning(iso);
  const he = hotelTonight(iso);
  const startGps = hs?.gps || '';
  const endGps = he?.gps || startGps || '';
  const gpsOf = id => (cat[id]?.gps || PLACES[id]?.gps || '');

  let orderedIds = [...uniqueIds];
  if (uniqueIds.length >= 2 && uniqueIds.length <= 7) {
    // คำนวณเส้นทางที่สั้นที่สุดแบบ Exact Permutation (TSP Path) จากโรงแรมเช้า -> ครบทุกจุด -> โรงแรมเย็น
    const perms = [];
    const permute = (arr, m = []) => {
      if (!arr.length) { perms.push(m); return; }
      for (let i = 0; i < arr.length; i++) {
        const curr = arr.slice();
        const next = curr.splice(i, 1);
        permute(curr, m.concat(next));
      }
    };
    permute(uniqueIds);
    let bestPerm = uniqueIds, bestCost = Infinity;
    perms.forEach(perm => {
      let cost = 0;
      const firstG = gpsOf(perm[0]);
      if (startGps && firstG) {
        cost += (gpsDistKm(startGps, firstG) ?? 15) * 1.15;
      }
      for (let i = 0; i < perm.length - 1; i++) {
        const g1 = gpsOf(perm[i]), g2 = gpsOf(perm[i + 1]);
        const dKm = (g1 && g2) ? gpsDistKm(g1, g2) : null;
        cost += dKm !== null ? dKm : 8;
        // ถ้าระบุลำดับเช้า/เย็นไว้ชัดเจน ให้เคารพลำดับเวลาที่ผู้ใช้ต้องการ
        const t1 = explicitTimeMap[perm[i]] || 0, t2 = explicitTimeMap[perm[i + 1]] || 0;
        if (t1 && t2 && t1 > t2) cost += 50;
        // น้ำหนักเวลาที่เหมาะสมของสถานที่ (เช่น วัด/สวนตอนเช้า จุดชมวิว/ตรอกกลางคืนตอนเย็น)
        const b1 = PLACE_ALIASES[perm[i]]?.bias ?? 2, b2 = PLACE_ALIASES[perm[i + 1]]?.bias ?? 2;
        if (b1 > b2) cost += (b1 - b2) * 0.35;
      }
      const lastG = gpsOf(perm[perm.length - 1]);
      if (endGps && lastG && startGps !== endGps) {
        cost += (gpsDistKm(lastG, endGps) ?? 15) * 0.7;
      }
      if (cost < bestCost) { bestCost = cost; bestPerm = perm; }
    });
    orderedIds = bestPerm;
  } else if (uniqueIds.length > 7) {
    // Nearest-neighbor สำหรับกรณีจุดแวะเยอะกว่า 7 จุด
    let curGps = startGps || gpsOf(uniqueIds[0]);
    const pool = [...uniqueIds];
    orderedIds = [];
    while (pool.length) {
      let bestIdx = 0, bestDist = Infinity;
      pool.forEach((id, k) => {
        const g = gpsOf(id);
        const dist = (curGps && g) ? (gpsDistKm(curGps, g) ?? 999) : (k * 10);
        if (dist < bestDist) { bestDist = dist; bestIdx = k; }
      });
      const [picked] = pool.splice(bestIdx, 1);
      orderedIds.push(picked);
      if (gpsOf(picked)) curGps = gpsOf(picked);
    }
  }

  // คำนวณเวลาเดินทาง (leg) ระหว่างแต่ละจุดตามระยะทางจริง
  return orderedIds.map((id, idx) => {
    const prevGps = idx === 0 ? startGps : gpsOf(orderedIds[idx - 1]);
    const curGps = gpsOf(id);
    const leg = (prevGps && curGps) ? estLegMin(prevGps, curGps, trMode) : (trMode === 'car' ? 25 : 20);
    return { id, leg };
  });
}

// วิเคราะห์ประโยคภาษาธรรมชาติของผู้ใช้ เพื่อคัดเลือกสถานที่เที่ยว + ร้านอาหาร และจัดเส้นทางที่เหมาะสมให้อัตโนมัติ
function buildPlanFromPrompt(q, forcedDayIdx = null) {
  const ql = String(q || '').toLowerCase();
  const catalog = getAllCatalogPlaces();

  // 1. หาวันที่เป้าหมายจากประโยค (เช่น "วันที่ 2", "day 3", "วันแรก", "วันสุดท้าย") หรือใช้วันที่เปิดอยู่/วันที่ว่าง
  let dayIdx = forcedDayIdx;
  if (dayIdx == null) {
    const dayMatch = ql.match(/(?:วันที่|วัน|day)\s*(\d+)/i);
    if (dayMatch) {
      dayIdx = Math.max(0, Math.min(state.days.length - 1, parseInt(dayMatch[1], 10) - 1));
    } else if (/วันแรก|first day/.test(ql)) {
      dayIdx = 0;
    } else if (/วันสุดท้าย|last day/.test(ql)) {
      dayIdx = Math.max(0, state.days.length - 1);
    } else {
      const emptyIdx = state.days.findIndex(d => !d.stops.length);
      dayIdx = emptyIdx >= 0 ? emptyIdx : ui.day;
    }
  }
  dayIdx = Math.max(0, Math.min(state.days.length - 1, dayIdx));

  // 2. ดึงสถานที่และโซนที่ผู้ใช้พูดถึงในประโยค
  const mentionedPlaces = extractPlacesFromPrompt(q);
  const mentionedZones = extractZonesFromPrompt(q);

  // ตรวจจับคำระบุช่วงเวลา เช่น "เช้าไป... บ่ายไป... เย็นไป..."
  const explicitTimeMap = {};
  mentionedPlaces.forEach(p => {
    const nameTh = String(p.name?.th || '').toLowerCase();
    const pos = nameTh ? ql.indexOf(nameTh) : -1;
    if (pos >= 0) {
      const before = ql.slice(Math.max(0, pos - 28), pos);
      if (/เช้า|เริ่มที่|จุดแรก|ก่อน/.test(before)) explicitTimeMap[p.id] = 1;
      else if (/เที่ยง|บ่าย|ต่อด้วย|แล้วไป/.test(before)) explicitTimeMap[p.id] = 2;
      else if (/เย็น|ค่ำ|ดึก|ปิดท้าย|สุดท้าย/.test(before)) explicitTimeMap[p.id] = 3;
    }
  });

  // 3. กำหนดโซนหลักของแผน
  const primaryZone = mentionedZones[0]
    || (mentionedPlaces[0]?.zoneKey)
    || (mentionedPlaces[0] ? matchZoneKey(`${tx(mentionedPlaces[0].area)} ${mentionedPlaces[0].name?.th || ''}`, mentionedPlaces[0].gps) : null)
    || detectDayZone(dayIdx);
  const z = ZONE_DISCOVERY[primaryZone] || ZONE_DISCOVERY.shinjuku;

  // 4. รวบรวมรายการสถานที่ที่จะจัดเข้าแผน
  const chosenIds = [];
  // 4.1 ใส่สถานที่ทุกแห่งที่ผู้ใช้ระบุชื่อในประโยคก่อนเสมอ!
  mentionedPlaces.forEach(p => {
    if (!chosenIds.includes(p.id)) chosenIds.push(p.id);
  });

  // 4.2 ถ้าผู้ใช้สั่งจัดเส้นทางของวันที่มีที่เที่ยวอยู่แล้ว (โดยไม่ได้ระบุชื่อที่ใหม่ครบ) ให้นำที่เที่ยวเดิมของวันนั้นมาจัดเรียงด้วย
  const isReorderingCurrentDay = /จัดเส้นทาง|เรียงลำดับ|ไม่ให้ย้อน|สลับ|ปรับแผน/.test(ql) && state.days[dayIdx]?.stops?.length > 0;
  if (isReorderingCurrentDay || (!mentionedPlaces.length && !mentionedZones.length && state.days[dayIdx]?.stops?.length >= 2)) {
    state.days[dayIdx].stops.forEach(s => {
      if (!chosenIds.includes(s.id) && (catalog[s.id] || PLACES[s.id])) chosenIds.push(s.id);
    });
  }

  // 4.3 เติมสถานที่ท่องเที่ยวในโซนที่ผู้ใช้ระบุ (หรือโซนหลัก) ให้ครบ 3-4 จุดที่อยู่ใกล้กันและไม่ซ้ำกับวันอื่น
  const targetCount = Math.max(chosenIds.length, /ครึ่งวัน|ชิล|เบาๆ|ไม่ต้องเยอะ/.test(ql) ? 3 : 4);
  const usedOtherDays = new Set(state.days.flatMap((d, idx) => idx === dayIdx ? [] : d.stops.map(s => s.id)));
  const zonesToFill = mentionedZones.length ? mentionedZones : [primaryZone];

  // กรองตามสไตล์ที่ผู้ใช้พิมพ์ในประโยค (เช่น วัด, ช้อปปิ้ง, ธรรมชาติ/สวน, วิว/ถ่ายรูป, ในร่ม/ฝนตก)
  const wantShrine = /วัด|ศาลเจ้า|ไหว้พระ|ขอพร|shrine|temple/.test(ql);
  const wantShop = /ช้อป|ซื้อของ|ห้าง|ตลาด|ของฝาก|shopping|market/.test(ql);
  const wantNature = /สวน|ธรรมชาติ|เดินเล่น|ใบไม้เปลี่ยนสี|วิว|park|view/.test(ql);

  const candidatePool = [];
  zonesToFill.forEach(zk => {
    Object.values(catalog).forEach(p => {
      if (chosenIds.includes(p.id) || usedOtherDays.has(p.id)) return;
      const pZk = p.zoneKey || matchZoneKey(`${tx(p.area)} ${p.name?.th || ''} ${p.name?.ja || ''}`, p.gps);
      if (pZk !== zk) return;
      let score = p.fromUserDb ? 20 : 10;
      const txt = `${p.name?.th || ''} ${p.hi?.th?.[0] || ''} ${p.art || ''}`.toLowerCase();
      if (wantShrine && /วัด|ศาลเจ้า|shrine|torii|temple/.test(txt)) score += 15;
      if (wantShop && /ช้อป|ตลาด|ห้าง|ถนนคนเดิน|ของฝาก|city/.test(txt)) score += 15;
      if (wantNature && /สวน|ธรรมชาติ|ภูเขา|ทะเลสาบ|วิว|fuji|leaf|tower/.test(txt)) score += 15;
      // ให้คะแนนความใกล้กับสถานที่ที่ผู้ใช้เลือกไว้แล้ว
      if (chosenIds.length && p.gps) {
        const refG = catalog[chosenIds[0]]?.gps;
        const dKm = refG ? gpsDistKm(refG, p.gps) : null;
        if (dKm !== null) score += Math.max(0, 10 - dKm * 2);
      }
      candidatePool.push({ id: p.id, score });
    });
  });
  candidatePool.sort((a, b) => b.score - a.score);
  for (const cand of candidatePool) {
    if (chosenIds.length >= targetCount) break;
    if (!chosenIds.includes(cand.id)) chosenIds.push(cand.id);
  }

  // 5. กำหนดโหมดการเดินทางและเวลาเริ่มจากประโยค
  let mode = state.days[dayIdx]?.mode || (primaryZone === 'fuji' ? 'car' : 'transit');
  if (/ขับรถ|เช่ารถ|รถยนต์|car/.test(ql)) mode = 'car';
  else if (/รถไฟ|เดิน|สาธารณะ|transit|train/.test(ql)) mode = 'transit';

  let start = state.days[dayIdx]?.start || '09:00';
  const timeMatch = ql.match(/(?:เริ่ม|ออกเดินทาง|เวลา)\s*(\d{1,2})[:.](\d{2})/);
  if (timeMatch) start = `${String(timeMatch[1]).padStart(2, '0')}:${timeMatch[2]}`;
  else if (/ออกสาย|ตื่นสาย|ชิล/.test(ql)) start = '10:00';
  else if (/ออกเช้า|แต่เช้า/.test(ql)) start = '08:30';

  // 6. จัดเรียงลำดับสถานที่ด้วย optimizeStopsOrder เพื่อไม่ให้ย้อนเส้นทาง
  const orderedStops = optimizeStopsOrder(chosenIds, catalog, dayIdx, mode, explicitTimeMap);

  // 7. เตรียมข้อมูล newPlaces สำหรับสถานที่ที่ยังไม่มีใน PLACES
  const newPlaces = {};
  orderedStops.forEach(s => {
    if (!PLACES[s.id] && catalog[s.id]) {
      newPlaces[s.id] = { ...catalog[s.id], custom: true };
    }
  });

  // 8. คัดเลือกร้านอาหารที่อยู่ใกล้จุดแวะในเส้นทางนี้มากที่สุด (ทั้งร้านของผู้ใช้ใน Sheet และร้านแนะนำในโซน)
  const stopGpsList = orderedStops.map(s => catalog[s.id]?.gps || PLACES[s.id]?.gps).filter(Boolean);
  const allZoneRests = [];
  (state.restaurants || []).forEach(r => {
    const rZk = matchZoneKey(`${r.area || ''} ${r.name || ''} ${r.nameJa || ''}`, r.gps);
    const minDist = (r.gps && stopGpsList.length)
      ? Math.min(...stopGpsList.map(g => gpsDistKm(r.gps, g) ?? 99))
      : null;
    if (zonesToFill.includes(rZk) || (minDist !== null && minDist <= 5)) {
      allZoneRests.push({ ...r, distKm: minDist, fromUserSheet: true });
    }
  });
  zonesToFill.forEach(zk => {
    const zd = ZONE_DISCOVERY[zk];
    if (!zd) return;
    zd.restaurants.forEach(nr => {
      if (allZoneRests.some(x => String(x.name).toLowerCase() === String(nr.name).toLowerCase())) return;
      const minDist = (nr.gps && stopGpsList.length)
        ? Math.min(...stopGpsList.map(g => gpsDistKm(nr.gps, g) ?? 99))
        : null;
      allZoneRests.push({ ...nr, distKm: minDist });
    });
  });
  allZoneRests.sort((a, b) => (b.fromUserSheet ? 1 : 0) - (a.fromUserSheet ? 1 : 0) || ((a.distKm ?? 50) - (b.distKm ?? 50)));
  const planRests = allZoneRests.slice(0, 3);

  // 9. ตั้งชื่อหัวข้อวันตามโซนหรือสถานที่ที่ผู้ใช้เลือก
  let title = z.label;
  if (mentionedZones.length >= 2) {
    const z1 = ZONE_DISCOVERY[mentionedZones[0]]?.short || z.short;
    const z2 = ZONE_DISCOVERY[mentionedZones[1]]?.short || z.short;
    title = { th: `${ z1.th } · ${ z2.th }`, ja: `${ z1.ja }・${ z2.ja }` };
  } else if (mentionedPlaces.length >= 2) {
    const n1 = mentionedPlaces[0].name;
    const n2 = mentionedPlaces[mentionedPlaces.length - 1].name;
    title = { th: `${n1.th} → ${n2.th}`, ja: `${n1.ja} → ${n2.ja}` };
  }

  // คำนวณระยะทางรวมของเส้นทางที่จัดเรียงแล้ว
  let totalRouteKm = 0;
  for (let i = 0; i < orderedStops.length - 1; i++) {
    const g1 = catalog[orderedStops[i].id]?.gps || PLACES[orderedStops[i].id]?.gps;
    const g2 = catalog[orderedStops[i + 1].id]?.gps || PLACES[orderedStops[i + 1].id]?.gps;
    const dKm = (g1 && g2) ? gpsDistKm(g1, g2) : null;
    if (dKm !== null) totalRouteKm += dKm;
  }

  const routeNames = orderedStops.map(s => pName(catalog[s.id] || PLACES[s.id])).join(' → ');
  const tip = `✨ จัดเส้นทางให้ตามประโยคที่แจ้งเรียบร้อย (${t('day_n', { n: dayIdx + 1 })}): เรียงลำดับจากโรงแรมที่พัก → ${routeNames} โดยไม่ย้อนเส้นทาง (ระยะห่างระหว่างจุดรวม ~${totalRouteKm.toFixed(1)} กม.) กดปุ่ม **"นำแผนนี้ไปใช้"** ด้านล่างได้เลย!`;

  return {
    day: dayIdx,
    title,
    mode,
    start,
    stops: orderedStops,
    newPlaces,
    restaurants: planRests,
    totalRouteKm,
    tip,
    recs: buildSmartRecs(q, primaryZone, dayIdx),
  };
}

// ตรวจสอบว่าประโยคของผู้ใช้เป็นการขอให้ช่วยเลือกที่เที่ยว / วางแผน / จัดเส้นทางหรือไม่
function isPlanPrompt(q) {
  const ql = String(q || '').toLowerCase();
  if (!ql) return false;
  // คำถามตรวจสอบความพร้อมสั้นๆ เช่น "วันที่ 3 ไหวไหม" ไม่ใช่คำสั่งสร้างแผนใหม่
  if (/ไหวไหม|หนักไปไหม|พอดีไหม|ムリない/.test(ql) && !/จัด|วางแผน|อยากไป|ไปเที่ยว/.test(ql)) return false;
  const mentionedPlaces = extractPlacesFromPrompt(q);
  const mentionedZones = extractZonesFromPrompt(q);
  const hasPlanVerb = /วางแผน|จัดทริป|จัดแผน|จัดเส้นทาง|เรียงลำดับ|เรียงเส้นทาง|อยากไป|พาไป|ไปเที่ยว|เที่ยวไหน|แพลน|ช่วยจัด|แนะนำเส้นทาง|plan|route|itinerary/.test(ql);
  // ถ้าระบุชื่อสถานที่ >= 2 แห่ง หรือมีคำกริยาวางแผน/จัดเส้นทาง หรือระบุโซนพร้อมระบุวัน
  if (mentionedPlaces.length >= 2) return true;
  if (hasPlanVerb && (mentionedPlaces.length >= 1 || mentionedZones.length >= 1 || /(?:วันที่|วัน|day)\s*\d+|วันว่าง|พรุ่งนี้/.test(ql))) return true;
  if (mentionedZones.length >= 1 && /(?:วันที่|วัน|day)\s*\d+/.test(ql) && !/ร้าน|อาหาร|กิน/.test(ql)) return true;
  return false;
}

function autoOrganizeTripByZone() {
  let matchedRests = 0;
  const catalog = getAllCatalogPlaces();
  // 1. เรียงลำดับจุดแวะในแต่ละวันด้วย optimizeStopsOrder (TSP จากโรงแรมเช้า -> จุดแวะ -> โรงแรมเย็น ไม่ให้ย้อนทาง)
  state.days.forEach((d, idx) => {
    if (d.stops.length >= 2) {
      d.stops = optimizeStopsOrder(d.stops.map(s => s.id), catalog, idx, d.mode);
    }
    recalcDayLegs(idx);
  });

  // 2. จับคู่ร้านอาหารในลิสต์ที่ยังไม่ได้ระบุวัน (day === 0) เข้ากับวันที่ไปเที่ยวโซนนั้นโดยอัตโนมัติ
  const dayZones = state.days.map((_, i) => detectDayZone(i));
  (state.restaurants || []).forEach(r => {
    if (r.day && r.day > 0) return;
    const rZk = matchZoneKey(`${r.area || ''} ${r.name || ''} ${r.nameJa || ''}`, r.gps);
    if (rZk) {
      const matchDayIdx = dayZones.findIndex(zk => zk === rZk);
      if (matchDayIdx >= 0) {
        r.day = matchDayIdx + 1;
        matchedRests++;
        return;
      }
    }
    // ถ้าเทียบจากพิกัด GPS กับจุดแวะในแต่ละวัน
    if (r.gps) {
      let bestDay = -1, bestDist = 8;
      state.days.forEach((d, idx) => {
        d.stops.forEach(s => {
          const pg = placeOf(s.id)?.gps;
          const dist = pg ? gpsDistKm(r.gps, pg) : null;
          if (dist !== null && dist < bestDist) { bestDist = dist; bestDay = idx; }
        });
      });
      if (bestDay >= 0) { r.day = bestDay + 1; matchedRests++; }
    }
  });

  saveState();
  aiLog.push({
    me: false,
    html: `✅ <b>${t('ai_organized_ok')}</b>${matchedRests ? ` (จับคู่ร้านอาหารเข้าตามโซนวันเที่ยวให้แล้ว ${matchedRests} ร้าน)` : ''}<hr class="soft">${localCheck()}`,
    recs: buildSmartRecs(),
  });
  renderAI();
  toast(t('ai_organized_ok'));
}

function renderAI() {
  const target = state.days.findIndex(d => !d.stops.length);
  const planIdx = target >= 0 ? target : ui.day;
  $('#s-ai').innerHTML = topbar(t('ai_eyebrow'), t('ai_title')) + `
  <div class="ai-badge ${aiReady() ? 'on' : ''}">${aiReady() ? '✨ ' + t('ai_gemini_on') : `${t('ai_local_mode')} · <a href="#" onclick="openCloud();return false">${t('ai_connect')}</a>`}</div>
  <div class="ai-zone-bar">
    <div class="small" style="font-weight:600;margin-bottom:6px">${t('ai_zone_picker')}</div>
    <div class="cat-pick" style="margin-bottom:8px">
      ${state.days.map((d, idx) => { const zk = detectDayZone(idx); const zn = tx(ZONE_DISCOVERY[zk]?.short) || ''; return `<button class="chip c-sora" onclick="showZoneRecs(${idx})">${t('day_n', { n: idx + 1 })} · ${esc(zn)}</button>`; }).join('')}
    </div>
    <div class="cat-pick" style="margin-bottom:10px">
      ${Object.entries(ZONE_DISCOVERY).map(([zk, z]) => `<button class="chip" onclick="showZoneRecs(${ui.day},'${zk}')">📍 ${esc(tx(z.short))}</button>`).join('')}
    </div>
    <button class="btn btn-ink wide" style="height:42px;font-size:14px" onclick="autoOrganizeTripByZone()">${t('ai_organize_trip')}</button>
  </div>
  <div class="bubble b-ai">${t('ai_hello')}</div>
  <div id="aiLog">${aiLog.map((m, i) => `<div class="bubble ${m.me ? 'b-me' : 'b-ai'}">${m.html}${m.plan ? planCard(m.plan, i) : ''}${m.recs ? recsCard(m.recs, i) : ''}</div>`).join('')}
    ${aiBusy ? `<div class="bubble b-ai typing"><span></span><span></span><span></span></div>` : ''}</div>
  <div class="suggest">${['ai_q1', 'ai_q2', 'ai_q3', 'ai_q4'].map(k => `<button class="chip" onclick="askAI(t('${k}'))" ${aiBusy ? 'disabled' : ''}>${t(k)}</button>`).join('')}
    <button class="chip c-fuji" onclick="planDay(${planIdx})" ${aiBusy ? 'disabled' : ''}>${ic('ai')}${t('ai_plan_day', { n: planIdx + 1 })}</button></div>
  <form class="composer" onsubmit="event.preventDefault();askAI(this.q.value);this.q.value=''"><input name="q" placeholder="${t('ai_ph')}" autocomplete="off" ${aiBusy ? 'disabled' : ''}><button class="send" aria-label="send" ${aiBusy ? 'disabled' : ''}>${ic('back', 'flip')}</button></form>
  <p class="note">${t('ai_note')}</p>`;
  setTimeout(() => $('#aiLog')?.lastElementChild?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
}

function localCheck(q = '') {
  const lines = state.days.map((d, i) => {
    const ld = loadOf(i);
    const zKey = detectDayZone(i);
    const zName = tx(ZONE_DISCOVERY[zKey]?.label) || '';
    const dRests = (state.restaurants || []).filter(r => r.day === i + 1);
    return `<li><b>${t('day_n', { n: i + 1 })}</b> ${esc(tx(d.title))} <span class="muted small">(${esc(zName)})</span> — ${t('lv_' + ld.lv)}${ld.n ? ` (${t('n_places', { n: ld.n })}, ${durTxt(ld.s.total)})` : ''}${dRests.length ? ` · 🍜 ${dRests.map(r => esc(r.name)).join(', ')}` : ` · <a href="#" onclick="showZoneRecs(${i});return false">เลือกร้านอาหารในโซนนี้</a>`}</li>`;
  }).join('');
  const warnings = analyzeRouteIssues();
  const routeHtml = warnings.length
    ? `<div style="margin:6px 0"><b>${t('ai_route_warn')}</b><ul class="ai-list">${warnings.map(w => `<li>${w}</li>`).join('')}</ul></div>`
    : `<div class="small ok" style="margin:6px 0">${t('ai_route_ok')}</div>`;
  const packed = state.days.map((d, i) => ({ i, ld: loadOf(i) })).filter(x => x.ld.lv === 'packed');
  const free = state.days.map((d, i) => ({ i, ld: loadOf(i) })).filter(x => x.ld.lv === 'empty');
  let tip = packed.length ? t('ai_tip_packed', { d: packed.map(x => x.i + 1).join(', ') }) : t('ai_tip_ok');
  if (free.length) tip += ' ' + t('ai_tip_free', { d: free.map(x => x.i + 1).join(', ') });
  return `${t('ai_check')}<ul class="ai-list">${lines}</ul>${routeHtml}${tip}<div class="small muted" style="margin-top:6px">${t('ai_demo')}</div>`;
}

async function askAI(q) {
  q = String(q || '').trim(); if (!q || aiBusy) return;
  aiLog.push({ me: true, text: q, html: esc(q) });
  const wantsPlan = isPlanPrompt(q);
  const autoPlan = wantsPlan ? buildPlanFromPrompt(q) : null;

  if (!aiReady()) {
    if (autoPlan && autoPlan.stops.length) {
      aiLog.push({
        me: false,
        text: autoPlan.tip,
        html: mdLite(autoPlan.tip),
        plan: autoPlan,
        recs: autoPlan.recs,
      });
    } else {
      aiLog.push({ me: false, html: localCheck(q), recs: buildSmartRecs(q) });
    }
    renderAI();
    return;
  }
  aiBusy = true; renderAI();
  try {
    const rawText = await geminiAsk(q);
    const { cleanText, recs } = parseAiRecs(rawText);
    const parsedPlan = parsePlan(cleanText);
    let finalPlan = parsedPlan || autoPlan;
    if (finalPlan && finalPlan.stops && finalPlan.stops.length) {
      const catalog = { ...getAllCatalogPlaces(), ...(finalPlan.newPlaces || {}) };
      if (finalPlan.day == null) finalPlan.day = autoPlan ? autoPlan.day : ui.day;
      // จัดเรียงลำดับจุดแวะให้เป็นเส้นทางที่ไม่ย้อนกลับเสมอ (ถ้ามี 3 จุดขึ้นไป)
      if (finalPlan.stops.length >= 3) {
        finalPlan.stops = optimizeStopsOrder(finalPlan.stops.map(s => s.id), catalog, finalPlan.day, finalPlan.mode);
      }
    }
    const finalRecs = (recs && ((recs.places && recs.places.length) || (recs.restaurants && recs.restaurants.length)))
      ? recs
      : (finalPlan?.recs || buildSmartRecs(q));
    aiLog.push({ me: false, text: cleanText, html: mdLite(cleanText), plan: finalPlan || undefined, recs: finalRecs });
  } catch (e) {
    if (autoPlan && autoPlan.stops.length) {
      aiLog.push({ me: false, html: `⚠️ ${esc(t('ai_fail', { e: e.message }))}<hr class="soft">${mdLite(autoPlan.tip)}`, plan: autoPlan, recs: autoPlan.recs });
    } else {
      aiLog.push({ me: false, html: `⚠️ ${esc(t('ai_fail', { e: e.message }))}<hr class="soft">${localCheck(q)}`, recs: buildSmartRecs(q) });
    }
  } finally { aiBusy = false; renderAI(); }
}

async function planDay(i) {
  if (aiBusy) return;
  const q = t('ai_plan_q', { n: i + 1, date: isoOf(dateOfDay(i)) });
  aiLog.push({ me: true, text: q, html: esc(q) });
  if (!aiReady()) {
    const plan = buildPlanFromPrompt(q, i);
    aiLog.push({ me: false, text: `(plan for day ${i + 1})`, html: mdLite(plan.tip), plan, recs: plan.recs });
    renderAI();
    return;
  }
  aiBusy = true; renderAI();
  try {
    const text = await geminiAsk(q, 'plan');
    const plan = parsePlan(text);
    if (!plan) throw new Error(t('ai_plan_bad'));
    plan.day = i;
    const zKey = detectDayZone(i);
    // จัดเรียงลำดับจุดแวะด้วย optimizeStopsOrder เมื่อมี 3 จุดขึ้นไปเพื่อป้องกันการย้อนเส้นทาง
    if (plan.stops.length >= 3) {
      const catalog = { ...getAllCatalogPlaces(), ...(plan.newPlaces || {}) };
      plan.stops = optimizeStopsOrder(plan.stops.map(s => s.id), catalog, i, plan.mode);
    }
    aiLog.push({ me: false, text: `(plan for day ${i + 1}) ` + plan.stops.map(s => s.id).join(', '), html: esc(plan.tip || t('ai_plan_ready')), plan, recs: buildSmartRecs('', zKey, i) });
  } catch (e) {
    const fallbackPlan = buildPlanFromPrompt(q, i);
    aiLog.push({ me: false, html: `⚠️ ${esc(t('ai_fail', { e: e.message }))}<hr class="soft">${mdLite(fallbackPlan.tip)}`, plan: fallbackPlan, recs: fallbackPlan.recs });
  } finally { aiBusy = false; renderAI(); }
}

function planCard(plan, i) {
  const catalog = { ...getAllCatalogPlaces(), ...(plan.newPlaces || {}) };
  const resolvePlace = id => PLACES[id] || catalog[id] || { name: { th: id, ja: id }, dur: 60 };
  const iso = state.days[plan.day] ? isoOf(dateOfDay(plan.day)) : state.trip.start;
  const hs = hotelMorning(iso);
  const restsHtml = (plan.restaurants && plan.restaurants.length)
    ? `<div class="small" style="margin:6px 0 8px"><b>🍜 ${t('day_rest_sec')}:</b> ${plan.restaurants.map(r => esc(r.name + (r.area ? ' (' + r.area + ')' : ''))).join(' · ')}</div>`
    : '';
  const dayOptions = state.days.map((d, idx) => `<option value="${idx}" ${idx === plan.day ? 'selected' : ''}>${t('day_n', { n: idx + 1 })} (${dShort(idx)})</option>`).join('');
  return `<div class="plan-card" style="margin-top:8px"><div class="row-Between" style="margin-bottom:4px"><span class="small muted">${t('day_n', { n: plan.day + 1 })} · ${t('mode_' + plan.mode)} · ${plan.start}</span>
    ${!plan.applied ? `<select class="mini-sel" onchange="changePlanDay(${i}, +this.value)" style="font-size:12px;padding:2px 6px;border-radius:6px">${dayOptions}</select>` : ''}</div>
    ${plan.title ? `<b>${esc(tx(plan.title))}</b>` : ''}
    ${hs ? `<div class="small muted" style="margin-top:4px">🏨 เริ่มออกเดินทางจาก: <b>${esc(hs.name)}</b></div>` : ''}
    <ol style="margin:6px 0 8px 18px">${plan.stops.map((s, idx) => {
      const p = resolvePlace(s.id);
      const prevG = idx === 0 ? hs?.gps : resolvePlace(plan.stops[idx - 1].id)?.gps;
      const curG = p?.gps;
      const dKm = (prevG && curG) ? gpsDistKm(prevG, curG) : null;
      const legInfo = s.leg ? ` · เดินทาง ~${s.leg} นาที${dKm != null ? ` (${dKm.toFixed(1)} กม.)` : ''}` : '';
      return `<li><b>${esc(pName(p))}</b> <span class="muted small">(${durTxt(p.dur || 60)}${legInfo})</span></li>`;
    }).join('')}</ol>
    ${restsHtml}
    ${plan.applied ? `<div class="ok small">✓ ${t('ai_applied')}</div>` : `<button class="btn btn-ink wide" onclick="applyPlan(${i})">${t('ai_apply')} (${t('day_n', { n: plan.day + 1 })})</button>`}</div>`;
}

function changePlanDay(msgIdx, newDayIdx) {
  const m = aiLog[msgIdx], plan = m && m.plan;
  if (!plan || isNaN(newDayIdx)) return;
  plan.day = Math.max(0, Math.min(state.days.length - 1, newDayIdx));
  const catalog = { ...getAllCatalogPlaces(), ...(plan.newPlaces || {}) };
  plan.stops = optimizeStopsOrder(plan.stops.map(s => s.id), catalog, plan.day, plan.mode);
  renderAI();
}

function applyPlan(i) {
  const m = aiLog[i], plan = m && m.plan; if (!plan) return;
  const d = state.days[plan.day];
  if (d.stops.length && !confirm(t('ai_apply_confirm'))) return;
  const catalog = { ...getAllCatalogPlaces(), ...(plan.newPlaces || {}) };
  state.customPlaces = state.customPlaces || {};
  plan.stops.forEach(s => {
    if (!PLACES[s.id] && catalog[s.id]) {
      const cp = { ...catalog[s.id], custom: true };
      delete cp.zoneKey; delete cp.fromUserDb;
      state.customPlaces[s.id] = cp;
    }
  });
  if (plan.newPlaces && Object.keys(plan.newPlaces).length) {
    Object.assign(state.customPlaces, plan.newPlaces);
  }
  mergePlaces();
  if (plan.restaurants && plan.restaurants.length) {
    state.restaurants = state.restaurants || [];
    plan.restaurants.forEach(r => {
      if (!r || !r.name) return;
      const exists = state.restaurants.find(x => String(x.name).trim().toLowerCase() === String(r.name).trim().toLowerCase());
      if (exists) {
        if (!exists.day) exists.day = plan.day + 1;
      } else {
        state.restaurants.push({ id: uid('r'), name: r.name, nameJa: r.nameJa || '', area: r.area || '', meal: r.meal || 'lunch', day: plan.day + 1, address: r.address || '', gps: parseGps(r.gps) || r.gps || '', note: r.note || '' });
      }
    });
  }
  d.stops = plan.stops.map(s => ({ id: s.id, leg: s.leg || 20 }));
  d.mode = plan.mode; d.start = plan.start;
  if (plan.title && (plan.title.th || plan.title.ja)) d.title = { th: plan.title.th || plan.title.ja, ja: plan.title.ja || plan.title.th };
  recalcDayLegs(plan.day);
  plan.applied = true;
  saveState(); renderAI();
  toast(t('ai_applied'));
}

/* ============ REPORT ============ */
function renderReport() {
  const D = dCur(), A = altCur(), total = spentIn(D);
  $('#s-report').innerHTML = topbar(t('report_eyebrow'), t('report_title'), `<button class="pill" onclick="window.print()">${t('print')}</button>`) + `
  <div class="card">
    <div class="rep-head"><div><b>${esc(tx(state.trip.name))}</b><div class="small muted">${dShort(0)} – ${dShort(state.days.length - 1)} · ${t('days_people', { d: state.days.length, p: state.trip.people })}</div></div>
    <div class="right"><b>${fmtMoney(total, D)}</b><div class="small muted">≈ ${fmtMoney(convert(total, D, A), A)} · ${t('per_person', { a: fmtMoney(total / state.trip.people, D) })}</div></div></div>
  </div>
  <h3 class="sec">${t('rep_plan')}</h3>
  ${state.days.map((d, i) => { const s = schedule(i), ld = loadOf(i), dayCost = state.expenses.filter(e => e.day === i + 1).reduce((a, e) => a + expIn(e, D), 0), dRests = (state.restaurants || []).filter(r => r.day === i + 1); return `
    <div class="card rep-day"><div class="rep-dh"><span class="num" style="background:${DAY_COLORS[i % DAY_COLORS.length]}40">${i + 1}</span><div class="grow"><b>${esc(tx(d.title))}</b><div class="small muted">${fmtD(dateOfDay(i), { weekday:'short', day:'numeric', month:'short' })} · ${t('mode_' + d.mode)} · ${t('lv_' + ld.lv)}</div></div><b>${fmtMoneyShort(dayCost, D)}</b></div>
    ${s.items.filter(x => x.type !== 'leg').map(x => `<div class="rep-row"><span>${hm(x.time)}</span>${esc(x.type === 'hotel' ? '🏨 ' + x.hotel.name : pName(x.place))}</div>`).join('') || `<div class="rep-row muted">${t('free_day')}</div>`}
    ${dRests.map(r => `<div class="rep-row"><span>${r.meal ? t('meal_' + r.meal) : '🍜'}</span>${esc('🍜 ' + r.name + (r.area ? ' (' + r.area + ')' : ''))}</div>`).join('')}</div>`; }).join('')}
  <h3 class="sec">${t('rep_money')}</h3>
  <div class="card">${EXP_CATS.map(c => { const v = state.expenses.filter(e => e.cat === c.k).reduce((a, e) => a + expIn(e, D), 0); return `<div class="rep-row"><span><i class="sw" style="background:${c.color}"></i>${t('cat_' + c.k)}</span><b>${fmtMoney(v, D)}</b><span class="muted small">${total ? Math.round(v / total * 100) : 0}%</span></div>`; }).join('')}
    <div class="rep-row total"><span>${t('total')}</span><b>${fmtMoney(total, D)}</b><span></span></div></div>`;
}

/* ============ sheet / toast ============ */
function openSheet(html) {
  const sh = $('#sheet');
  sh.innerHTML = `<div class="grab"></div><button class="sheet-x" onclick="closeSheet()" aria-label="close">${ic('x')}</button>${html}`;
  sh.scrollTop = 0; sh.classList.add('on'); $('#scrim').classList.add('on');
}
function closeSheet() { if (typeof stopAppCamera === 'function') stopAppCamera(); $('#sheet')?.classList.remove('on'); $('#scrim')?.classList.remove('on'); }
function copyTxt(s) {
  (navigator.clipboard ? navigator.clipboard.writeText(s) : Promise.reject()).then(() => toast(t('copied')), () => { prompt(t('copy'), s); });
}
let toastTimer;
function toast(msg) {
  let el = $('#toast');
  if (!el) {
    if (typeof document.createElement !== 'function') return;
    el = document.createElement('div'); el.id = 'toast'; document.body.appendChild(el);
  }
  el.textContent = msg; el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('pop'), 2600);
}
document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeSheet(); closeBig(); } });

/* ============ landing ============ */
function initLanding() {
  const land = $('#landing');
  if (!land) return;
  if (location.hash || sessionStorage.getItem('tabinote.seen')) { land.remove(); return; }
  $('#landTag').innerHTML = t('tagline');
  $('#landCta').textContent = t('start_cta');
  const stage = $('#stage');
  const tilt = (x, y) => { stage.style.transform = `rotateY(${x * 7}deg) rotateX(${-y * 5}deg)`; };
  window.addEventListener('pointermove', e => tilt(e.clientX / innerWidth - .5, e.clientY / innerHeight - .5));
  window.addEventListener('deviceorientation', e => { if (e.gamma != null) tilt(Math.max(-.5, Math.min(.5, e.gamma / 60)), Math.max(-.5, Math.min(.5, (e.beta - 45) / 60))); });
  const box = $('#petals');
  for (let i = 0; i < 22; i++) {
    const p = document.createElement('i'); p.className = 'petal';
    p.style.left = Math.random() * 110 + '%';
    p.style.animationDuration = (7 + Math.random() * 8) + 's';
    p.style.animationDelay = (-Math.random() * 15) + 's';
    p.style.setProperty('--s', .6 + Math.random() * .8);
    box.appendChild(p);
  }
}
function enterApp() {
  sessionStorage.setItem('tabinote.seen', '1');
  const land = $('#landing'); land.classList.add('leave'); setTimeout(() => land.remove(), 650);
}
function landLang(l) {
  state.lang = l; saveState(); applyLang();
  $('#landTag').innerHTML = t('tagline'); $('#landCta').textContent = t('start_cta');
  rerender();
}

/* ============ boot ============ */
function boot() {
  const qLang = new URLSearchParams(location.search).get('lang');
  if (qLang === 'th' || qLang === 'ja') state.lang = qLang;
  applyLang();
  loadCachedRates();
  initLanding();
  const h = location.hash.slice(1), [k, v] = h.split('=');
  if (k === 'day') { ui.day = Math.max(0, (+v || 1) - 1); go('day'); }
  else if (k === 'place' && PLACES[v]) { ui.day = 2; go('day'); setTimeout(() => openPlace(v), 60); }
  else if (k === 'phrase') { go('talk'); setTimeout(() => openPhrase(+v || 0), 60); }
  else if (k === 'expense') { go('money'); setTimeout(() => openExpense(), 60); }
  else if (k === 'hotel') { go('hotels'); setTimeout(() => openHotel(), 60); }
  else if (k === 'restaurant') { go('restaurants'); setTimeout(() => openRestaurant(), 60); }
  else if (k === 'cloud') { go('more'); setTimeout(() => openCloud(), 60); }
  else if (k === 'newplace') { ui.day = 3; go('day'); setTimeout(() => openCustomPlace(), 60); }
  else go(RENDER[k] ? k : 'overview');
  refreshRates().then(ok => {
    if (!ok) return;
    if (['money', 'overview', 'report', 'more'].includes(ui.screen)) rerender();
    if ($('#exPrev')) exPreview();
  });
  // Google sync
  const joined = handleJoin();
  if (!joined && cloudOn()) {
    setSync(CLOUD.dirty ? 'pending' : 'ok');
    pullPlaces().then(() => pullNow(true));
  }
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && cloudOn() && !pushing) pullNow(true);
    if (document.visibilityState === 'hidden' && cloudOn() && CLOUD.dirty) pushNow();
  });
}
document.addEventListener('DOMContentLoaded', boot);
