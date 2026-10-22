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
const dateOfDay = i => { const d = new Date(state.trip.start + 'T00:00:00'); d.setDate(d.getDate() + i); return d; };
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
const latestCheckin = list => list.sort((a, b) => b.checkin.localeCompare(a.checkin))[0];
/** โรงแรมที่ "นอนคืนนี้" */
const hotelTonight = iso => latestCheckin(state.hotels.filter(h => h.checkin <= iso && iso < h.checkout));
/** โรงแรมที่ "ตื่นเช้ามา" (นอนเมื่อคืน) — ถ้าไม่มีใช้โรงแรมคืนนี้ */
const hotelMorning = iso => latestCheckin(state.hotels.filter(h => h.checkin < iso && iso <= h.checkout)) || hotelTonight(iso);

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
    <div class="card list-card">${state.days.map((d, i) => { const ld = loadOf(i); return `
      <button class="ov" onclick="openDay(${i})">
        <div class="num" style="background:${DAY_COLORS[i % DAY_COLORS.length]}40">${i + 1}</div>
        <div class="grow"><div class="t">${esc(tx(d.title))}</div><div class="s">${dShort(i)} · ${ld.n ? t('n_places', { n: ld.n }) : t('free_day')} · ${t('mode_' + d.mode)}</div></div>
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
      tl += `<div class="stop"><div class="time">${hm(it.time)}</div>
        <div class="place-wrap"><button class="place" onclick="openPlace('${it.id}')"><div class="thumb">${ART[p.art]}${nPh ? `<span class="ph-badge">${nPh}</span>` : ''}</div>
        <div class="grow"><div class="t">${esc(pName(p))}</div><div class="s">${esc(tx(p.area))} · ${t('stay_for', { d: durTxt(p.dur) })}</div></div></button>
        <button class="rm" onclick="removeStop(${it.idx})" aria-label="remove">${ic('x')}</button></div></div>`;
    }
  });
  if (!day.stops.length) tl = `<div class="card empty-card"><div class="doodle">🗾</div><b>${t('empty_day')}</b><div class="small muted">${day.note ? esc(tx(day.note)) : t('empty_day_sub')}</div></div>`;

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
  <label class="start-time">${t('start_at')} <input type="time" value="${day.start}" onchange="setStart(this.value)"></label>
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
function setMode(m) { state.days[ui.day].mode = m; saveState(); renderDay(); }
function setStart(v) { if (v) { state.days[ui.day].start = v; saveState(); renderDay(); } }
function renameDay(v) {
  v = v.trim(); if (!v) return renderDay();
  const d = state.days[ui.day];
  d.title = { ...(typeof d.title === 'object' ? d.title : {}), [L()]: v };
  saveState();
}
function removeStop(idx) {
  const d = state.days[ui.day], [rm] = d.stops.splice(idx, 1);
  saveState(); renderDay();
  toast(t('removed', { p: pName(placeOf(rm.id)) }));
}
function openAddPlace() {
  const used = new Set(state.days[ui.day].stops.map(s => s.id));
  const list = Object.entries(PLACES).filter(([id]) => !used.has(id));
  openSheet(`<h2 class="sheet-title">${t('add_place')}</h2><p class="muted small">${t('add_place_sub')}</p>
    <button class="place create-place" onclick="openCustomPlace()"><div class="thumb hotel-thumb">${ic('plus')}</div><div class="grow"><div class="t">${t('new_place')}</div><div class="s">${t('new_place_hint')}</div></div></button>
    <div class="pick-list">${list.map(([id, p]) => `<button class="place" onclick="addStop('${id}')"><div class="thumb">${ART[p.art]}</div>
      <div class="grow"><div class="t">${esc(pName(p))}</div><div class="s">${esc(tx(p.area))} · ${durTxt(p.dur)}</div></div>${ic('plus', 'add-ic')}</button>`).join('') || `<p class="muted">${t('all_added')}</p>`}</div>`);
}
function addStop(id) {
  state.days[ui.day].stops.push({ id, leg: state.days[ui.day].mode === 'car' ? 30 : 35 });
  saveState(); closeSheet(); renderDay();
  const ld = loadOf(ui.day);
  toast(ld.lv === 'packed' ? t('too_packed') : t('added', { p: pName(placeOf(id)) }));
}

/* ============ PLACE SHEET ============ */
function photosBox(id) {
  const ph = photos[id] || [];
  return `<h3 class="sec">${t('my_photos')} <span class="muted">${ph.length ? '(' + ph.length + ')' : ''}</span>${cloudOn() ? `<span class="chip c-sora mini-chip">☁ Drive</span>` : ''}</h3>
    <div class="photos">${ph.map((src, k) => `<div class="photo"><img src="${esc(src)}" alt="" loading="lazy" referrerpolicy="no-referrer"><button type="button" onclick="delPhoto('${id}',${k})" aria-label="delete">${ic('x')}</button>${src.startsWith('data:') && cloudOn() ? '<span class="ph-local">⏳</span>' : ''}</div>`).join('')}
      <label class="photo add">${ic('camera')}<span>${t('take_photo')}</span><input type="file" accept="image/*" capture="environment" hidden onchange="addPhotos('${id}',this.files)"></label>
      <label class="photo add">${ic('plus')}<span>${t('from_gallery')}</span><input type="file" accept="image/*" multiple hidden onchange="addPhotos('${id}',this.files)"></label></div>`;
}

function openPlace(id) {
  const p = placeOf(id);
  const hi = (p.hi?.[L()]?.length ? p.hi[L()] : p.hi?.th) || [], miss = (p.miss?.[L()]?.length ? p.miss[L()] : p.miss?.th) || [];
  const custom = !!state.customPlaces?.[id];
  openSheet(`<div class="cover">${ART[p.art] || ART.city}</div>
    <h2 class="sheet-title">${esc(pName(p))}</h2><div class="jpname">${esc(p.name.ja || p.name.th)}${p.ro ? ' · ' + esc(p.ro) : ''}${custom ? ` · <span class="chip c-yuzu mini-chip">${t('my_place')}</span>` : p.src === 'sheet' ? ` · <span class="chip c-matcha mini-chip">Sheet</span>` : ''}</div>
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
      ${custom ? `<button class="btn btn-soft" onclick="openCustomPlace('${id}')">${ic('edit')}${t('edit')}</button>` : ''}
    </div>`);
}

function compressImage(file, max = 1000, q = .72) {
  return new Promise((res, rej) => {
    const img = new Image(), url = URL.createObjectURL(file);
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url); res(c.toDataURL('image/jpeg', q));
    };
    img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('bad image')); };
    img.src = url;
  });
}
function refreshPhotoView(id) {
  if ($('#sheet').classList.contains('on')) {
    if (PLACES[id]) openPlace(id);
    else if (state.hotels.some(h => h.id === id)) openHotel(id);
    else if ((state.restaurants || []).some(r => r.id === id)) openRestaurant(id);
  }
  if (['day', 'hotels', 'restaurants'].includes(ui.screen)) rerender();
}
async function addPhotos(id, files) {
  if (!files || !files.length) return;
  const list = photos[id] = photos[id] || [];
  const added = [];
  for (const f of files) { try { const d = await compressImage(f); list.push(d); added.push(d); } catch (e) { toast(t('photo_bad')); } }
  if (!savePhotos(photos) && !cloudOn()) list.splice(list.length - added.length);
  refreshPhotoView(id);
  if (!cloudOn()) { toast(t('photo_saved')); return; }
  toast(t('photo_uploading'));
  let ok = 0;
  for (const d of added) {
    const url = await uploadPhoto(id, d);
    if (url) { const k = list.indexOf(d); if (k >= 0) list[k] = url; ok++; }
  }
  savePhotos(photos); refreshPhotoView(id);
  toast(ok === added.length ? t('photo_uploaded') : t('photo_upload_fail'));
}
function delPhoto(id, k) {
  if (!confirm(t('confirm_del'))) return;
  const [url] = photos[id].splice(k, 1);
  if (url && !url.startsWith('data:')) deleteCloudPhoto(url);
  savePhotos(photos); refreshPhotoView(id);
}

/* ---------- สถานที่ที่สร้างเอง ---------- */
const ARTS = ['temple', 'shrine', 'street', 'fuji', 'lake', 'water', 'park', 'city'];
function openCustomPlace(id) {
  const p = id ? state.customPlaces[id] : { name:{ th:'', ja:'' }, area:{ th:'' }, dur:60, gps:'', art:'city', hi:{ th:[] }, miss:{ th:[] }, transit:{ th:'' } };
  openSheet(`<h2 class="sheet-title">${id ? t('edit_place') : t('new_place')}</h2>
    <p class="muted small">${t('new_place_sub')}</p>
    <label class="lbl">${t('place_name')}</label><input id="pName" class="input" value="${esc(p.name.th)}" placeholder="${t('place_name_ph')}">
    <div class="two"><div><label class="lbl">${t('place_name_ja')}</label><input id="pJa" class="input" value="${esc(p.name.ja === p.name.th ? '' : p.name.ja)}" placeholder="例：浅草寺"></div>
      <div><label class="lbl">${t('area')}</label><input id="pArea" class="input" value="${esc(p.area?.th || '')}" placeholder="${t('area_ph')}"></div></div>
    <label class="lbl">GPS</label><input id="pGps" class="input mono" value="${esc(p.gps)}" placeholder="35.71480, 139.79665" oninput="pGpsCheck()">
    <div id="pGpsMsg" class="small muted">${t('gps_help')}</div>
    <div class="gps-tools"><button class="chip" onclick="window.open('https://www.google.com/maps/search/?api=1&query='+encodeURIComponent($('#pName').value+' '+$('#pArea').value),'_blank','noopener');toast(t('gmaps_tip'))">${ic('search')}${t('find_gmaps')}</button>
      <button class="chip" onclick="navigator.geolocation&&navigator.geolocation.getCurrentPosition(p=>{$('#pGps').value=p.coords.latitude.toFixed(5)+', '+p.coords.longitude.toFixed(5);pGpsCheck()},()=>toast(t('geo_fail')))">${ic('locate')}${t('use_here')}</button></div>
    <label class="lbl">${t('stay_time')}</label>
    <div class="cat-pick" id="pDur">${[30, 45, 60, 90, 120, 180, 240].map(m => `<button type="button" class="chip ${p.dur === m ? 'on' : ''}" data-v="${m}" onclick="pickCat(this)">${durTxt(m)}</button>`).join('')}</div>
    <label class="lbl">${t('look')}</label>
    <div class="art-pick" id="pArt">${ARTS.map(a => `<button type="button" class="${p.art === a ? 'on' : ''}" data-v="${a}" onclick="pickCat(this)">${ART[a]}</button>`).join('')}</div>
    <label class="lbl">${t('highlights')} <span class="muted">(${t('one_per_line')})</span></label><textarea id="pHi" class="input area">${esc((p.hi?.th || []).join('\n'))}</textarea>
    <label class="lbl">${t('dont_miss')} <span class="muted">(${t('one_per_line')})</span></label><textarea id="pMiss" class="input area">${esc((p.miss?.th || []).join('\n'))}</textarea>
    <label class="lbl">${t('public_transit')}</label><input id="pTransit" class="input" value="${esc(p.transit?.th || '')}" placeholder="${t('transit_ph')}">
    <div class="actions">${id ? `<button class="btn btn-danger" onclick="delCustomPlace('${id}')">${t('delete')}</button>` : `<button class="btn btn-soft" onclick="closeSheet()">${t('cancel')}</button>`}
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
  const raw = $('#pGps').value.trim(), gps = raw ? parseGps(raw) : '';
  if (raw && !gps) { toast(t('gps_bad')); return; }
  const lines = s => s.split('\n').map(x => x.trim()).filter(Boolean);
  const ja = $('#pJa').value.trim(), area = $('#pArea').value.trim(), transit = $('#pTransit').value.trim();
  const rec = {
    name:{ th:name, ja: ja || name }, ro: ja ? name : name, area:{ th:area, ja:area },
    art: document.querySelector('#pArt .on')?.dataset.v || 'city', dur: +(document.querySelector('#pDur .on')?.dataset.v || 60), gps,
    hi:{ th: lines($('#pHi').value), ja: lines($('#pHi').value) }, miss:{ th: lines($('#pMiss').value), ja: lines($('#pMiss').value) },
    transit:{ th: transit, ja: transit }, custom: true,
  };
  state.customPlaces = state.customPlaces || {};
  const isNew = !id;
  id = id || uid('c_');
  state.customPlaces[id] = rec;
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
function pickCat(b) { b.parentElement.querySelectorAll('.chip').forEach(x => x.classList.toggle('on', x === b)); }
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
  const list = [...state.hotels].sort((a, b) => a.checkin.localeCompare(b.checkin));
  $('#s-hotels').innerHTML = topbar(t('hotels_eyebrow'), t('hotels_title'), `${cloudOn() ? `<button class="pill" onclick="pullSheetData(this)" title="${t('pull_sheet')}">${ic('refresh')}${t('pull_sheet')}</button>` : ''}<button class="pill ink" onclick="openHotel()">${ic('plus')}${t('add')}</button>`) + `
  <p class="muted small" style="margin:-6px 0 14px">${t('hotels_sub')}</p>
  ${list.length ? list.map(h => {
    const nights = Math.max(0, Math.round((new Date(h.checkout) - new Date(h.checkin)) / 864e5));
    const nPh = (photos[h.id] || []).length;
    return `<div class="card hotel">
      <div class="hotel-top"><div class="thumb hotel-thumb">${ic('hotel')}${nPh ? `<span class="ph-badge">${nPh}</span>` : ''}</div>
        <div class="grow"><div class="t">${esc(h.name)}</div><div class="s">${esc(h.address || '')}</div></div>
        <button class="icon-btn" onclick="openHotel('${h.id}')" aria-label="edit">${ic('edit')}</button></div>
      <div class="hotel-dates"><span class="chip c-sakura">${t('checkin')} ${fmtD(new Date(h.checkin + 'T00:00:00'), { day:'numeric', month:'short' })}</span><span class="chip c-sora">${t('checkout')} ${fmtD(new Date(h.checkout + 'T00:00:00'), { day:'numeric', month:'short' })}</span><span class="chip c-yuzu">${t('nights', { n: nights })}</span></div>
      ${h.gps ? `<div class="gps"><div><div class="small muted">GPS</div><code>${h.gps}</code></div><button class="mini" onclick="copyTxt('${h.gps}')">${t('copy')}</button></div>
      <div class="actions"><a class="btn btn-ink" href="${dirUrl(null, h.gps)}" target="_blank" rel="noopener">${ic('pin')}${t('navigate')}</a><a class="btn btn-soft" href="${mapUrl(h.gps)}" target="_blank" rel="noopener">${ic('search')}${t('view_map')}</a></div>`
      : `<p class="note warn">${t('hotel_no_gps')}</p>`}
    </div>`; }).join('') : `<div class="card empty-card"><div class="doodle">🏨</div><b>${t('no_hotel')}</b><div class="small muted">${t('add_hotel_why')}</div></div>`}`;
}
function openHotel(id) {
  const h = id ? state.hotels.find(x => x.id === id) : { name:'', address:'', gps:'', checkin: state.trip.start, checkout: isoOf(dateOfDay(state.days.length - 1)) };
  openSheet(`<h2 class="sheet-title">${id ? t('edit_hotel') : t('new_hotel')}</h2>
    <label class="lbl">${t('hotel_name')}</label><input id="hName" class="input" value="${esc(h.name)}" placeholder="Hotel Gracery Shinjuku">
    <label class="lbl">${t('address')}</label><input id="hAddr" class="input" value="${esc(h.address)}" placeholder="1-19-1 Kabukicho, Shinjuku">
    <div class="two"><div><label class="lbl">${t('checkin')}</label><input id="hIn" type="date" class="input" value="${h.checkin}"></div>
      <div><label class="lbl">${t('checkout')}</label><input id="hOut" type="date" class="input" value="${h.checkout}"></div></div>
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
  if (h.gps) gpsCheck();
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
  const checkin = $('#hIn').value, checkout = $('#hOut').value;
  if (!checkin || !checkout || checkout <= checkin) { toast(t('date_bad')); return; }
  const rec = { name, address: $('#hAddr').value.trim(), gps, checkin, checkout };
  const clash = state.hotels.find(h => h.id !== id && h.checkin < checkout && checkin < h.checkout);
  if (id) Object.assign(state.hotels.find(x => x.id === id), rec);
  else state.hotels.push({ id: uid('h'), ...rec });
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
  $('#s-restaurants').innerHTML = topbar(t('rest_eyebrow'), t('rest_title'), `${cloudOn() ? `<button class="pill" onclick="pullSheetData(this)" title="${t('pull_sheet')}">${ic('refresh')}${t('pull_sheet')}</button>` : ''}<button class="pill ink" onclick="openRestaurant()">${ic('plus')}${t('add')}</button>`) + `
  <p class="muted small" style="margin:-6px 0 12px">${t('rest_sub')}</p>
  <div class="searchbox">${ic('search')}<input id="restQ" placeholder="${t('rest_search')}" value="${esc(ui.restQ)}" oninput="ui.restQ=this.value;renderRestList()"></div>
  <div class="cats">${[{ k:'all' }, ...MEALS].map(m => `<button class="chip ${ui.restMeal === m.k ? 'on' : ''}" onclick="ui.restMeal='${m.k}';renderRestaurants()">${t('meal_' + m.k)}</button>`).join('')}</div>
  <div id="restList"></div>`;
  renderRestList();
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
  const n = $('#tName').value.trim(), s = $('#tStart').value, p = parseInt($('#tPeople').value, 10);
  if (n) state.trip.name = { ...(typeof state.trip.name === 'object' ? state.trip.name : {}), [L()]: n };
  if (s) state.trip.start = s;
  if (p > 0) state.trip.people = p;
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
const aiReady = () => cloudOn() && CLOUD.ai;
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
    label: { th:'โซนชินจูกุ · ฮาราจูกุ · ชิบูย่า (ตะวันตก)', ja:'新宿・原宿・渋谷エリア' },
    places: [
      { id:'tocho', name:{ th:'จุดชมวิวศาลาว่าการกรุงโตเกียว (ฟรี)', ja:'東京都庁展望室' }, area:{ th:'ชินจูกุ', ja:'新宿' }, dur:50, gps:'35.68960, 139.69170', art:'city', hi:{ th:'ชมวิวโตเกียวมุมสูงฟรี ชั้น 45 วันฟ้าใสเห็นฟูจิ', ja:'地上202mの無料展望室' } },
      { id:'omotesando', name:{ th:'ถนนทาเคชิตะ & โอโมเตะซันโด', ja:'竹下通り・表参道' }, area:{ th:'ฮาราจูกุ', ja:'原宿' }, dur:75, gps:'35.67020, 139.70270', art:'shop', hi:{ th:'เดินต่อจากศาลเจ้าเมจิได้เลย เครปฮาราจูกุ & คาเฟ่สวย', ja:'明治神宮から徒歩すぐの散策通り' } },
      { id:'gyoen', name:{ th:'สวนชินจูกุเกียวเอ็น', ja:'新宿御苑' }, area:{ th:'ชินจูกุ', ja:'新宿' }, dur:75, gps:'35.68520, 139.71010', art:'park', hi:{ th:'สวนญี่ปุ่นและเรือนกระจกขนาดใหญ่ใจกลางชินจูกุ', ja:'都会のオアシス・日本庭園' } },
    ],
    restaurants: [
      { name:'ฟูอุนจิ ซึเคเมน (Fuunji)', nameJa:'風雲児', area:'ชินจูกุ', meal:'lunch', gps:'35.68720, 139.69750', note:'ซึเคเมนซุปไก่ผสมปลาแห้งเข้มข้น คิวหมุนไว ใกล้สถานีชินจูกุ' },
      { name:'กิวคัตสึ โมโตมุระ ชินจูกุ', nameJa:'牛かつ もと村 新宿南口店', area:'ชินจูกุ', meal:'dinner', gps:'35.68860, 139.70180', note:'เนื้อวัวชุบเกล็ดขนมปังทอด ย่างบนเตาหินร้อนเองทีละชิ้น' },
      { name:'อุด้ง ชิน (Udon Shin)', nameJa:'うどん慎', area:'ชินจูกุ', meal:'lunch', gps:'35.68680, 139.69680', note:'อุด้งเส้นสดทำมือหนึบหนับ เทมปุระกุ้งและคาโบนาร่าอุด้ง' },
      { name:'Luke\'s Lobster ฮาราจูกุ', nameJa:'LUKE\'S LOBSTER 表参道キャットストリート店', area:'ฮาราจูกุ', meal:'cafe', gps:'35.66750, 139.70680', note:'ขนมปังล็อบสเตอร์โรลเนื้อแน่น อยู่ในแนวเดินฮาราจูกุ–ชิบูย่า' },
    ],
  },
  kawagoe: {
    label: { th:'โซนคาวาโกเอะ · ลิตเติ้ลเอโดะ (ไซตามะ)', ja:'川越・小江戸エリア' },
    places: [
      { id:'kashiya_yokocho', name:{ th:'ตรอกลูกกวาดโบราณ คาชิยะโยโกโจ', ja:'菓子屋横丁' }, area:{ th:'คาวาโกเอะ', ja:'川越' }, dur:45, gps:'35.92480, 139.48120', art:'shop', hi:{ th:'เดินจากหอระฆังโทคิโนะคาเนะเพียง 3 นาที ขนมโบราณและมันหวาน', ja:'時の鐘から徒歩3分の駄菓子通り' } },
      { id:'kitain', name:{ th:'วัดคิตะอิน (พระอรหันต์ 500 องค์)', ja:'喜多院' }, area:{ th:'คาวาโกเอะ', ja:'川越' }, dur:60, gps:'35.91820, 139.49060', art:'shrine', hi:{ th:'วัดเก่าแก่สมัยเอโดะ อยู่บนเส้นทางก่อนเข้าย่านโกดังเก่า', ja:'徳川家ゆかりの名刹・五百羅漢' } },
    ],
    restaurants: [
      { name:'ข้าวหน้าปลาไหล โอกะคิคุ (Ogakiku)', nameJa:'小川菊', area:'คาวาโกเอะ', meal:'lunch', gps:'35.92120, 139.48310', note:'ร้านปลาไหลย่างถ่านเก่าแก่กว่า 200 ปี อยู่บนถนนสายหลักคาวาโกเอะ (กดรับคิวก่อนเดินเที่ยว)' },
      { name:'โซบะชาเขียว โคโตบุกิอัน (Kotobukian)', nameJa:'寿庵 蔵の街店', area:'คาวาโกเอะ', meal:'lunch', gps:'35.92340, 139.48280', note:'โซบะชาเขียวเสิร์ฟเรียง 7 ชั้น พร้อมเทมปุระ อยู่ใกล้หอระฆัง' },
      { name:'มันหวานทอดแผ่นยักษ์ โอซัตสึอัน', nameJa:'小江戸おさつ庵', area:'คาวาโกเอะ', meal:'cafe', gps:'35.92390, 139.48270', note:'ชิปส์มันหวานแผ่นใหญ่จิ้มเนยเค็ม ถือเดินกินถ่ายรูปหน้าร้านโกดังเก่า' },
    ],
  },
  asakusa: {
    label: { th:'โซนอาซากุสะ · อุเอโนะ · สกายทรี (ตะวันออก)', ja:'浅草・上野・スカイツリーエリア' },
    places: [
      { id:'skytree', name:{ th:'โตเกียวสกายทรี & โซลามาจิ', ja:'東京スカイツリー・ソラマチ' }, area:{ th:'อาซากุสะ / โอชิอาเกะ', ja:'押上・スカイツリー' }, dur:90, gps:'35.71000, 139.81070', art:'city', hi:{ th:'หอคอยชมวิวและห้างใหญ่รวมของฝากโปเกมอน/คิрби้ ห่างวัดอาซากุสะ 1.5 กม.', ja:'浅草から隅田川を渡ってすぐの展望塔＆商業施設' } },
      { id:'sumida_walk', name:{ th:'ทางเดินริมแม่น้ำสุมิดะ (Sumida River Walk)', ja:'すみだリバーウォーク' }, area:{ th:'อาซากุสะ', ja:'浅草' }, dur:40, gps:'35.71250, 139.80180', art:'park', hi:{ th:'ทางเดินข้ามแม่น้ำเชื่อมวัดอาซากุสะไปสกายทรี ถ่ายรูปสวยมาก', ja:'浅草とスカイツリーを結ぶ歩道橋' } },
    ],
    restaurants: [
      { name:'เทมปุระ ไดโคคุยะ (Daikokuya)', nameJa:'大黒家天麩羅', area:'อาซากุสะ', meal:'lunch', gps:'35.71360, 139.79550', note:'เทมปุระกุ้งยักษ์ทอดน้ำมันงาหอมๆ ราดซอสสูตรโบราณ อยู่ในซอยข้างวัดเซนโซจิ' },
      { name:'สุกี้ยากี้เนื้อวากิว อาซากุสะ อิมาฮัน', nameJa:'浅草今半 国際通り本店', area:'อาซากุสะ', meal:'lunch', gps:'35.71240, 139.79230', note:'สุกี้ยากี้เนื้อวากิวละลายในปาก มีเซ็ตมื้อเที่ยงสุดคุ้ม' },
      { name:'ไอศกรีมมัทฉะ 7 ระดับ ซูซูกิเอ็น', nameJa:'壽々喜園 浅草本店', area:'อาซากุสะ', meal:'cafe', gps:'35.71590, 139.79680', note:'เจลาโต้มัทฉะเข้มข้นที่สุดในโลก 7 ระดับ อยู่ด้านหลังวัดอาซากุสะ' },
      { name:'ซูชิสายพาน มิอุระมิซากิโกะ อุเอโนะ', nameJa:'グルメ廻転寿司 三浦三崎港 上野店', area:'อุเอโนะ', meal:'dinner', gps:'35.71090, 139.77460', note:'ซูชิสายพานหน้าล้น ปลาทูน่าส่งตรงจากท่าเรือมิซากิ อยู่ในตลาดอาเมโยโกะ' },
    ],
  },
  fuji: {
    label: { th:'โซนภูเขาไฟฟูจิ · คาวากุจิโกะ · โอชิโนะ', ja:'富士山・河口湖・忍野エリア' },
    places: [
      { id:'fuji_ropeway', name:{ th:'กระเช้าคาจิคาจิ ชมวิวฟูจิ & ทะเลสาบ', ja:'富士山パノラマロープウェイ' }, area:{ th:'คาวากุจิโกะ', ja:'河口湖' }, dur:60, gps:'35.50420, 138.77240', art:'fuji', hi:{ th:'อยู่บนเส้นทางระหว่างเจดีย์ชูเรโตะไปสวนโออิชิ ขึ้นชมวิวทะเลสาบมุมสูง', ja:'河口湖と富士山を一望できるロープウェイ' } },
      { id:'yamanakako', name:{ th:'ทะเลสาบยามานากะ & จุดชมวิวพาโนรามาได', ja:'山中湖パノラマ台' }, area:{ th:'ยามานากะโกะ', ja:'山中湖' }, dur:60, gps:'35.41280, 138.90610', art:'fuji', hi:{ th:'ขับรถต่อจากหมู่บ้านน้ำใสโอชิโนะฮัคไคเพียง 15 นาที วิวฟูจิใหญ่เต็มตา', ja:'忍野八海から車で15分の絶景展望台' } },
    ],
    restaurants: [
      { name:'โฮโตฟูโด อุด้งหม้อไฟฟักทอง (ตึกก้อนเมฆ)', nameJa:'ほうとう不動 東恋路店', area:'คาวากุจิโกะ', meal:'lunch', gps:'35.49010, 138.76110', note:'อุด้งเส้นแบนต้มในซุปมิโซะฟักทองร้อนๆ อาคารดีไซน์ก้อนเมฆ มีที่จอดรถกว้าง' },
      { name:'โฮโต โคซากุ (Kosaku Hoto)', nameJa:'甲州ほうとう小作 河口湖店', area:'คาวากุจิโกะ', meal:'dinner', gps:'35.49560, 138.76290', note:'โฮโตต้นตำรับยามานาชิ มีทั้งหมู ไก่ เป็ด และเทมปุระ เหมาะกับครอบครัว' },
      { name:'Lake Bake คาเฟ่ขนมปังริมทะเลสาบวิวฟูจิ', nameJa:'レイクベイク (Lake Bake)', area:'โออิชิ / คาวากุจิโกะ', meal:'cafe', gps:'35.52360, 138.74780', note:'ติดกับสวนโออิชิ ขนมปังอบสดใหม่ นั่งจิบกาแฟมองฟูจิริมทะเลสาบ' },
      { name:'เทมปุระ & โซบะ นินจา โอชิโนะฮัคไค', nameJa:'天ぷら忍者', area:'โอชิโนะฮัคไค', meal:'lunch', gps:'35.46080, 138.83150', note:'โซบะน้ำแร่ฟูจิและเทมปุระกรอบๆ อยู่หน้าทางเข้าหมู่บ้านน้ำใส' },
    ],
  },
  central: {
    label: { th:'โซนกินซ่า · ซึกิจิ · สถานีโตเกียว · โอไดบะ', ja:'銀座・築地・東京駅・お台場エリア' },
    places: [
      { id:'teamlab_planets', name:{ th:'teamLab Planets TOKYO (โทโยสุ)', ja:'チームラボプラネッツ TOKYO' }, area:{ th:'โทโยสุ / กินซ่า', ja:'豊洲' }, dur:120, gps:'35.64910, 139.78980', art:'museum', hi:{ th:'พิพิธภัณฑ์ศิลปะดิจิทัลเดินลุยน้ำ อยู่ถัดจากซึกิจิและกินซ่าแค่ 10 นาที (เหมาะมากวันฝนตก)', ja:'築地・銀座からすぐの没入型ミュージアム（雨の日にも最適）' } },
      { id:'odaiba', name:{ th:'โอไดบะ กั้นดั้มยักษ์ & วิวสะพานเรนโบว์', ja:'お台場・ダイバーシティ東京' }, area:{ th:'โอไดบะ', ja:'お台場' }, dur:90, gps:'35.62510, 139.77560', art:'city', hi:{ th:'ต่อเนื่องจากสายซึกิจิ–โทโยสุ เดินห้างและชมวิวอ่าวโตเกียว', ja:'湾岸エリアの大型ショッピング＆観光スポット' } },
    ],
    restaurants: [
      { name:'ซูชิซันไม สาขาหลักซึกิจิ (Sushizanmai)', nameJa:'すしざんまい 本店', area:'ซึกิจิ', meal:'breakfast', gps:'35.66550, 139.77060', note:'ซูชิสดใหม่ใจกลางตลาดปลาซึกิจิ มีเมนูภาษาอังกฤษและภาพชัดเจน' },
      { name:'ราเมนซุปไก่ปั่น กินซ่า คางาริ (Ginza Kagari)', nameJa:'銀座 篝 本店', area:'กินซ่า', meal:'lunch', gps:'35.67120, 139.76190', note:'ราเมนซุปไก่ครีมมี่หอมทรัฟเฟิล ระดับมิชลิน บิบ กูร์มองด์ ย่านกินซ่า' },
      { name:'ซูชิสายพาน เนมุโระ ฮานามารุ (KITTE)', nameJa:'根室花まる KITTE丸の内店', area:'สถานีโตเกียว', meal:'dinner', gps:'35.67970, 139.76490', note:'ซูชิสายพานเกรดพรีเมียมจากฮอกไกโด บนตึก KITTE หน้าสถานีโตเกียว' },
    ],
  },
};

function detectDayZone(dayIdx) {
  const d = state.days[dayIdx];
  if (!d) return 'shinjuku';
  const ids = d.stops.map(s => s.id);
  const txt = [tx(d.title), ...ids, ...d.stops.map(s => PLACES[s.id] ? tx(PLACES[s.id].area) + ' ' + pName(PLACES[s.id]) : '')].join(' ').toLowerCase();
  if (ids.some(x => ['chureito', 'oishi', 'oshino', 'fuji_ropeway', 'yamanakako'].includes(x)) || /ฟูจิ|คาวากุจิ|โอชิโนะ|fuji|kawaguchiko|富士山|河口湖/.test(txt)) return 'fuji';
  if (ids.some(x => ['kawagoe', 'hikawa', 'kashiya_yokocho', 'kitain'].includes(x)) || /คาวาโกเอะ|kawagoe|川越/.test(txt)) return 'kawagoe';
  if (ids.some(x => ['sensoji', 'ueno', 'ameyoko', 'skytree', 'sumida_walk'].includes(x)) || /อาซากุสะ|อุเอโนะ|สกายทรี|asakusa|ueno|浅草|上野/.test(txt)) return 'asakusa';
  if (ids.some(x => ['tsukiji', 'ginza', 'imperial', 'teamlab_planets', 'odaiba'].includes(x)) || /กินซ่า|ซึกิจิ|โตเกียว|โอไดบะ|ginza|tsukiji|銀座|築地/.test(txt)) return 'central';
  return 'shinjuku';
}

function analyzeRouteIssues() {
  const warnings = [];
  state.days.forEach((d, i) => {
    const stops = d.stops.map(s => ({ id: s.id, p: PLACES[s.id] })).filter(x => x.p && x.p.gps);
    for (let k = 1; k < stops.length; k++) {
      const dist = gpsDistKm(stops[k - 1].p.gps, stops[k].p.gps);
      if (dist && dist > 22 && d.mode !== 'car') {
        warnings.push(`${t('day_n', { n: i + 1 })}: <b>${esc(pName(stops[k - 1].p))} → ${esc(pName(stops[k].p))}</b> ห่างกันถึง ${dist.toFixed(1)} กม. (คนละโซน ควรแยกวันหรือจัดลำดับใหม่)`);
      }
    }
    if (stops.length >= 3) {
      const d01 = gpsDistKm(stops[0].p.gps, stops[1].p.gps) || 0;
      const d12 = gpsDistKm(stops[1].p.gps, stops[2].p.gps) || 0;
      const d02 = gpsDistKm(stops[0].p.gps, stops[2].p.gps) || 0;
      if (d01 + d12 > d02 * 1.8 && d01 + d12 - d02 > 6) {
        warnings.push(`${t('day_n', { n: i + 1 })}: ลำดับ <b>${esc(pName(stops[0].p))} → ${esc(pName(stops[1].p))} → ${esc(pName(stops[2].p))}</b> มีย้อนเส้นทาง ลองสลับจุดที่อยู่ใกล้กันติดกันจะประหยัดเวลาขึ้น`);
      }
    }
  });
  return warnings;
}

function buildSmartRecs(q = '') {
  const ql = String(q || '').toLowerCase();
  const dayMatch = ql.match(/(?:วันที่|day|日目|\b)(\d+)\b/);
  let targetDays = state.days.map((_, i) => i);
  if (dayMatch) {
    const idx = Math.max(0, Math.min(state.days.length - 1, parseInt(dayMatch[1], 10) - 1));
    targetDays = [idx];
  }
  const usedPlaceIds = new Set(state.days.flatMap(d => d.stops.map(s => s.id)));
  const usedRestNames = new Set((state.restaurants || []).map(r => String(r.name || '').trim().toLowerCase()));
  const places = [];
  const restaurants = [];

  const isRain = /ฝน|rain|雨|ในร่ม/.test(ql);
  if (isRain) {
    ['teamlab_planets', 'skytree'].forEach(pid => {
      const z = pid === 'skytree' ? ZONE_DISCOVERY.asakusa : ZONE_DISCOVERY.central;
      const found = z.places.find(x => x.id === pid);
      if (found && !usedPlaceIds.has(found.id)) places.push({ ...found, day: (targetDays[0] || 0) + 1 });
    });
  }

  targetDays.forEach(dIdx => {
    const zKey = detectDayZone(dIdx);
    const z = ZONE_DISCOVERY[zKey] || ZONE_DISCOVERY.shinjuku;
    // แนะนำสถานที่ในโซนเดียวกัน (ทั้งที่มีใน PLACES แต่ยังไม่ได้ใส่ในทริป และสถานที่ใหม่ในโซนนั้น)
    Object.entries(PLACES).forEach(([id, p]) => {
      if (usedPlaceIds.has(id) || places.some(x => x.id === id)) return;
      const firstStop = state.days[dIdx].stops[0] && PLACES[state.days[dIdx].stops[0].id];
      const dist = firstStop && firstStop.gps && p.gps ? gpsDistKm(firstStop.gps, p.gps) : null;
      if (dist !== null && dist <= 6) {
        places.push({ id, name: p.name, area: p.area, dur: p.dur, gps: p.gps, art: p.art, hi: { th: (p.hi?.th || [])[0] || '', ja: (p.hi?.ja || [])[0] || '' }, day: dIdx + 1 });
      }
    });
    z.places.forEach(np => {
      if (!usedPlaceIds.has(np.id) && !places.some(x => x.id === np.id)) {
        places.push({ ...np, day: dIdx + 1 });
      }
    });
    z.restaurants.forEach(nr => {
      if (!usedRestNames.has(String(nr.name).trim().toLowerCase()) && !restaurants.some(x => x.name === nr.name)) {
        restaurants.push({ ...nr, day: dIdx + 1 });
      }
    });
  });

  const onlyFood = /ร้าน|อาหาร|กิน|หิว|ราเมน|เนื้อ|ซูชิ|คาเฟ่|グルメ|レストラン|食/.test(ql) && !/ที่เที่ยว|แพลน|โซน/.test(ql);
  const onlyPlaces = /ที่เที่ยว|จุดแวะ|ว่าง|ฝน|スポット|観光/.test(ql) && !/ร้าน|อาหาร|กิน/.test(ql);

  return {
    places: onlyFood ? [] : places.slice(0, dayMatch ? 4 : 5),
    restaurants: onlyPlaces ? [] : restaurants.slice(0, dayMatch ? 4 : 6),
  };
}

function recsCard(recs, msgIdx) {
  if (!recs || ((!recs.places || !recs.places.length) && (!recs.restaurants || !recs.restaurants.length))) return '';
  let out = '';
  if (recs.places && recs.places.length) {
    out += `<div class="plan-card" style="margin-top:8px"><b>${t('ai_nearby_places')}</b><div class="ai-recs-list">${recs.places.map((p, pi) => {
      const name = tx(p.name) || p.name;
      const area = tx(p.area) || p.area || '';
      const hi = typeof p.hi === 'object' ? tx(p.hi) : (p.hi || '');
      const dayN = p.day || (ui.day + 1);
      return `<div class="rep-row" style="align-items:center;gap:8px;padding:7px 0"><div class="grow"><b>${esc(name)}</b> <span class="muted small">· ${esc(area)} (${t('day_n', { n: dayN })})</span>${hi ? `<div class="small muted">${esc(hi)}</div>` : ''}</div>
        ${p.added ? `<span class="ok small">✓</span>` : `<button class="mini" onclick="addAiPlace(${msgIdx},${pi})">${t('ai_add_place', { d: dayN })}</button>`}</div>`;
    }).join('')}</div></div>`;
  }
  if (recs.restaurants && recs.restaurants.length) {
    out += `<div class="plan-card" style="margin-top:8px"><b>${t('ai_nearby_rests')}</b><div class="ai-recs-list">${recs.restaurants.map((r, ri) => {
      const dayN = r.day || 0;
      return `<div class="rep-row" style="align-items:center;gap:8px;padding:7px 0"><div class="grow"><b>🍜 ${esc(r.name)}</b>${r.nameJa ? ` <span class="muted small">(${esc(r.nameJa)})</span>` : ''} <span class="muted small">· ${esc(r.area || '')}${dayN ? ' · ' + t('day_n', { n: dayN }) : ''}</span>${r.note ? `<div class="small muted">${esc(r.note)}</div>` : ''}</div>
        ${r.added ? `<span class="ok small">✓</span>` : `<button class="mini" onclick="addAiRest(${msgIdx},${ri})">${t('ai_add_rest')}</button>`}</div>`;
    }).join('')}</div></div>`;
  }
  return out;
}

function addAiPlace(msgIdx, pIdx) {
  const m = aiLog[msgIdx], p = m?.recs?.places?.[pIdx];
  if (!p) return;
  const id = p.id || uid('cp');
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
  }
  p.added = true;
  saveState(); renderAI();
  toast(t('ai_added_place', { name: pName(PLACES[id]), d: dayIdx + 1 }));
}

function addAiRest(msgIdx, rIdx) {
  const m = aiLog[msgIdx], r = m?.recs?.restaurants?.[rIdx];
  if (!r) return;
  state.restaurants = state.restaurants || [];
  const exists = state.restaurants.find(x => String(x.name).trim().toLowerCase() === String(r.name).trim().toLowerCase());
  if (!exists) {
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

function renderAI() {
  const target = state.days.findIndex(d => !d.stops.length);
  $('#s-ai').innerHTML = topbar(t('ai_eyebrow'), t('ai_title')) + `
  <div class="ai-badge ${aiReady() ? 'on' : ''}">${aiReady() ? '✨ ' + t('ai_gemini_on') : `${t('ai_local_mode')} · <a href="#" onclick="openCloud();return false">${t('ai_connect')}</a>`}</div>
  <div class="bubble b-ai">${t('ai_hello')}</div>
  <div id="aiLog">${aiLog.map((m, i) => `<div class="bubble ${m.me ? 'b-me' : 'b-ai'}">${m.html}${m.recs ? recsCard(m.recs, i) : ''}${m.plan ? planCard(m.plan, i) : ''}</div>`).join('')}
    ${aiBusy ? `<div class="bubble b-ai typing"><span></span><span></span><span></span></div>` : ''}</div>
  <div class="suggest">${['ai_q1', 'ai_q2', 'ai_q3', 'ai_q4'].map(k => `<button class="chip" onclick="askAI(t('${k}'))" ${aiBusy ? 'disabled' : ''}>${t(k)}</button>`).join('')}
    <button class="chip c-fuji" onclick="planDay(${target >= 0 ? target : ui.day})" ${aiBusy ? 'disabled' : ''}>${ic('ai')}${t('ai_plan_day', { n: (target >= 0 ? target : ui.day) + 1 })}</button></div>
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
    return `<li><b>${t('day_n', { n: i + 1 })}</b> ${esc(tx(d.title))} <span class="muted small">(${esc(zName)})</span> — ${t('lv_' + ld.lv)}${ld.n ? ` (${t('n_places', { n: ld.n })}, ${durTxt(ld.s.total)})` : ''}${dRests.length ? ` · 🍜 ${dRests.map(r => esc(r.name)).join(', ')}` : ' · <span class="muted small">ยังไม่ได้ระบุร้านอาหารประจำวัน</span>'}</li>`;
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
  if (!aiReady()) {
    aiLog.push({ me: false, html: localCheck(q), recs: buildSmartRecs(q) });
    renderAI();
    return;
  }
  aiBusy = true; renderAI();
  try {
    const rawText = await geminiAsk(q);
    const { cleanText, recs } = parseAiRecs(rawText);
    const finalRecs = (recs && ((recs.places && recs.places.length) || (recs.restaurants && recs.restaurants.length))) ? recs : buildSmartRecs(q);
    aiLog.push({ me: false, text: cleanText, html: mdLite(cleanText), recs: finalRecs });
  } catch (e) {
    aiLog.push({ me: false, html: `⚠️ ${esc(t('ai_fail', { e: e.message }))}<hr class="soft">${localCheck(q)}`, recs: buildSmartRecs(q) });
  } finally { aiBusy = false; renderAI(); }
}

async function planDay(i) {
  if (aiBusy) return;
  const q = t('ai_plan_q', { n: i + 1, date: isoOf(dateOfDay(i)) });
  aiLog.push({ me: true, text: q, html: esc(q) });
  if (!aiReady()) {
    const zKey = detectDayZone(i === 3 ? 4 : i);
    const z = ZONE_DISCOVERY[zKey] || ZONE_DISCOVERY.central;
    const newPlaces = {};
    z.places.forEach(np => {
      newPlaces[np.id] = { name: np.name, ro: np.name.ja, area: np.area, art: np.art || 'city', dur: np.dur || 60, gps: np.gps || '', mapcode: '', hi: { th: [np.hi.th], ja: [np.hi.ja] }, miss: { th: [], ja: [] }, transit: { th: '', ja: '' }, custom: true };
    });
    const baseStops = Object.keys(PLACES).filter(id => !state.days.some(d => d.stops.some(s => s.id === id))).slice(0, 2);
    const stops = [...baseStops.map(id => ({ id, leg: 25 })), ...z.places.slice(0, 2).map(np => ({ id: np.id, leg: 25 }))].slice(0, 3);
    const plan = { day: i, title: z.label, mode: zKey === 'fuji' ? 'car' : 'transit', start: '09:30', stops, newPlaces, restaurants: z.restaurants.slice(0, 2), tip: t('ai_plan_ready') };
    aiLog.push({ me: false, text: `(plan for day ${i + 1})`, html: esc(plan.tip), plan });
    renderAI();
    return;
  }
  aiBusy = true; renderAI();
  try {
    const text = await geminiAsk(q, 'plan');
    const plan = parsePlan(text);
    if (!plan) throw new Error(t('ai_plan_bad'));
    plan.day = i;
    aiLog.push({ me: false, text: `(plan for day ${i + 1}) ` + plan.stops.map(s => s.id).join(', '), html: esc(plan.tip || t('ai_plan_ready')), plan });
  } catch (e) {
    aiLog.push({ me: false, html: `⚠️ ${esc(t('ai_fail', { e: e.message }))}` });
  } finally { aiBusy = false; renderAI(); }
}

function planCard(plan, i) {
  const resolvePlace = id => PLACES[id] || (plan.newPlaces && plan.newPlaces[id]) || { name: { th: id, ja: id }, dur: 60 };
  const restsHtml = (plan.restaurants && plan.restaurants.length)
    ? `<div class="small" style="margin:6px 0 8px"><b>🍜 ${t('day_rest_sec')}:</b> ${plan.restaurants.map(r => esc(r.name + (r.area ? ' (' + r.area + ')' : ''))).join(' · ')}</div>`
    : '';
  return `<div class="plan-card"><div class="small muted">${t('day_n', { n: plan.day + 1 })} · ${t('mode_' + plan.mode)} · ${plan.start}</div>
    ${plan.title ? `<b>${esc(tx(plan.title))}</b>` : ''}
    <ol>${plan.stops.map(s => { const p = resolvePlace(s.id); return `<li>${esc(pName(p))} <span class="muted small">(${durTxt(p.dur || 60)})</span></li>`; }).join('')}</ol>
    ${restsHtml}
    ${plan.applied ? `<div class="ok small">✓ ${t('ai_applied')}</div>` : `<button class="btn btn-ink" onclick="applyPlan(${i})">${t('ai_apply')}</button>`}</div>`;
}

function applyPlan(i) {
  const m = aiLog[i], plan = m && m.plan; if (!plan) return;
  const d = state.days[plan.day];
  if (d.stops.length && !confirm(t('ai_apply_confirm'))) return;
  if (plan.newPlaces && Object.keys(plan.newPlaces).length) {
    state.customPlaces = state.customPlaces || {};
    Object.assign(state.customPlaces, plan.newPlaces);
    mergePlaces();
  }
  if (plan.restaurants && plan.restaurants.length) {
    state.restaurants = state.restaurants || [];
    plan.restaurants.forEach(r => {
      if (!r || !r.name) return;
      const exists = state.restaurants.find(x => String(x.name).trim().toLowerCase() === String(r.name).trim().toLowerCase());
      if (!exists) {
        state.restaurants.push({ id: uid('r'), name: r.name, nameJa: r.nameJa || '', area: r.area || '', meal: r.meal || 'lunch', day: plan.day + 1, address: r.address || '', gps: parseGps(r.gps) || r.gps || '', note: r.note || '' });
      }
    });
  }
  d.stops = plan.stops.map(s => ({ ...s }));
  d.mode = plan.mode; d.start = plan.start;
  if (plan.title && (plan.title.th || plan.title.ja)) d.title = { th: plan.title.th || plan.title.ja, ja: plan.title.ja || plan.title.th };
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
function closeSheet() { $('#sheet')?.classList.remove('on'); $('#scrim')?.classList.remove('on'); }
function copyTxt(s) {
  (navigator.clipboard ? navigator.clipboard.writeText(s) : Promise.reject()).then(() => toast(t('copied')), () => { prompt(t('copy'), s); });
}
let toastTimer;
function toast(msg) {
  let el = $('#toast');
  if (!el) { el = document.createElement('div'); el.id = 'toast'; document.body.appendChild(el); }
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
