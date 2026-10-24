#!/usr/bin/env node
/* Tabi Note — ระบบตรวจตัวเองก่อน deploy
 * รัน:  node tests/check.js
 * ถ้ามีข้อผิดพลาดจะ exit code 1 → GitHub Actions จะไม่ deploy
 *
 * สิ่งที่ตรวจ:
 *  1. ไฟล์ JS ทุกไฟล์ต้อง compile ผ่าน (ไม่มี syntax error)
 *  2. ทุก key ที่เรียก t('...') ต้องมีใน STR และมีครบทั้ง th / ja
 *  3. ตัวแปร {x} ในข้อความ th กับ ja ต้องตรงกัน
 *  4. สถานที่ทุกแห่ง: มีชื่อ 2 ภาษา, GPS อยู่ในญี่ปุ่น, มีจุดเด่น/ห้ามพลาดครบ 2 ภาษา
 *  5. ข้อมูลตั้งต้น: วันอ้างถึงสถานที่ที่มีจริง, โรงแรมวันที่ถูก, ค่าใช้จ่ายสกุลเงินที่รองรับ
 *  6. ประโยคญี่ปุ่น: มี th/ja/ro, หมวดถูกต้อง, ช่องเติม {place}/{n} ตรงกันทั้ง 3 ภาษา, ไม่ซ้ำ
 *  7. ทดสอบ logic: แปลง GPS, แปลงสกุลเงิน, ตารางเวลา, โรงแรมเริ่ม/จบวัน
 *  8. index.html โหลดสคริปต์ครบและตามลำดับ
 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..', 'app');
const JS = ['data.js', 'phrases.js', 'currency.js', 'i18n.js', 'store.js', 'cloud.js', 'app.js'];
let errors = 0, passes = 0;
const fail = (m) => { errors++; console.log('  \x1b[31m✗\x1b[0m ' + m); };
const ok = (m) => { passes++; if (process.env.VERBOSE) console.log('  \x1b[32m✓\x1b[0m ' + m); };
const section = (m) => console.log('\n\x1b[1m' + m + '\x1b[0m');
const check = (cond, msg) => cond ? ok(msg) : fail(msg);

/* ---------- sandbox ---------- */
const mem = {};
const storage = { getItem: k => mem[k] ?? null, setItem: (k, v) => { mem[k] = String(v); }, removeItem: k => { delete mem[k]; } };
const noop = () => {};
const sandbox = {
  console: { log: noop, warn: noop, error: console.error },
  localStorage: storage, sessionStorage: storage,
  document: { addEventListener: noop, querySelector: () => null, querySelectorAll: () => [], documentElement: {}, body: { style: {} } },
  window: { addEventListener: noop, scrollTo: noop },
  location: { hash: '' }, navigator: {}, setTimeout, clearTimeout, AbortController, fetch: () => Promise.reject(new Error('offline')),
  URL, Intl, Date, Math, JSON, Promise,
};
vm.createContext(sandbox);

/* 1. compile + load */
section('1. Syntax / โหลดไฟล์');
const src = {};
for (const f of JS) {
  const p = path.join(ROOT, 'js', f);
  if (!fs.existsSync(p)) { fail(`ไม่พบไฟล์ ${f}`); continue; }
  src[f] = fs.readFileSync(p, 'utf8');
  try { vm.runInContext(src[f], sandbox, { filename: f }); ok(f); }
  catch (e) { fail(`${f}: ${e.message}`); }
}
if (errors) { console.log('\n\x1b[31mหยุด: ไฟล์โหลดไม่ผ่าน\x1b[0m'); process.exit(1); }
const G = (expr) => vm.runInContext(expr, sandbox);
const STR = G('STR'), PLACES = G('PLACES'), SEED = G('SEED'), PHRASES = G('PHRASES'), PHRASE_CATS = G('PHRASE_CATS'), CURRENCIES = G('CURRENCIES');

/* 2-3. i18n */
section('2. ข้อความ 2 ภาษา (i18n)');
const used = new Set();
for (const f of ['app.js', 'store.js', 'cloud.js']) {
  for (const m of src[f].matchAll(/\bt\(\s*'([a-z0-9_]+)'\s*[,)]/g)) used.add(m[1]);
  // key ที่ส่งผ่านตัวแปร/ternary เช่น t(x ? 'leave_hotel' : 'back_hotel')
  for (const m of src[f].matchAll(/'([a-z][a-z0-9_]*[a-z0-9])'/g)) if (STR[m[1]]) used.add(m[1]);
}
// key แบบประกอบ (prefix + ค่า) — ต้องระบุชุดค่าที่เป็นไปได้ให้ครบ
const dyn = {
  mode_: ['car', 'transit', 'walk'], lv_: ['empty', 'chill', 'good', 'packed'], leg_: ['car', 'transit', 'walk'],
  pc_: ['all', ...PHRASE_CATS.map(c => c.k)], cat_: G('EXP_CATS').map(c => c.k),
  meal_: ['all', ...G('MEALS').map(m => m.k)],
  m_: ['ai', 'hotels', 'restaurants', 'sos', 'report', 'ai_sub', 'hotels_sub', 'restaurants_sub', 'sos_sub', 'report_sub'],
  sos_: ['police', 'ambulance', 'police_sub', 'ambulance_sub'],
  sync_: ['off', 'ok', 'pending', 'busy', 'err'],
  err_: ['unauthorized', 'not_setup', 'timeout', 'no_ai_key', 'not_connected', 'no_trip_id'],
};
for (const [pre, vals] of Object.entries(dyn)) vals.forEach(v => used.add(pre + v));
G('SOS').thai.forEach(e => used.add(e.k)); G('SOS').other.forEach(e => used.add(e.k));
G('NAV').forEach(n => used.add(n[1]));
['ai_q1', 'ai_q2', 'ai_q3'].forEach(k => used.add(k));
for (const k of used) {
  if (!STR[k]) { fail(`ไม่มี key "${k}" ใน i18n.js`); continue; }
  check(STR[k].th && STR[k].ja, `key "${k}" มีครบ th/ja`);
}
const vars = s => [...String(s).matchAll(/\{(\w+)\}/g)].map(m => m[1]).sort().join(',');
for (const [k, v] of Object.entries(STR)) {
  if (!v.th || !v.ja) fail(`key "${k}" ขาด ${!v.th ? 'th' : 'ja'}`);
  else check(vars(v.th) === vars(v.ja), `key "${k}" ตัวแปรตรงกัน`) || 0;
  if (v.th && v.ja && vars(v.th) !== vars(v.ja)) console.log(`     th={${vars(v.th)}} ja={${vars(v.ja)}}`);
}
const unused = Object.keys(STR).filter(k => !used.has(k) && !['app', 'tagline', 'start_cta'].includes(k));
if (unused.length) console.log(`  ℹ key ที่ยังไม่ถูกใช้: ${unused.join(', ')}`);

/* 4. places */
section('3. ฐานข้อมูลสถานที่');
const ART = G('ART');
for (const [id, p] of Object.entries(PLACES)) {
  check(p.name?.th && p.name?.ja && p.ro, `${id}: ชื่อ th/ja/romaji`);
  check(ART[p.art], `${id}: ภาพ "${p.art}" มีอยู่จริง`);
  check(Number.isInteger(p.dur) && p.dur >= 15 && p.dur <= 480, `${id}: เวลาเที่ยว ${p.dur} นาที สมเหตุสมผล`);
  const g = G(`parseGps(${JSON.stringify(p.gps)})`);
  if (!g) fail(`${id}: GPS อ่านไม่ได้ "${p.gps}"`);
  else { const [lat, lng] = g.split(',').map(Number); check(lat > 24 && lat < 46 && lng > 122 && lng < 146, `${id}: GPS อยู่ในญี่ปุ่น (${g})`); }
  for (const f of ['hi', 'miss']) check(p[f]?.th?.length && p[f]?.ja?.length === p[f]?.th?.length, `${id}: ${f} มีครบ 2 ภาษาจำนวนเท่ากัน`);
  check(p.transit?.th && p.transit?.ja, `${id}: วิธีเดินทาง 2 ภาษา`);
  check(p.area?.th && p.area?.ja, `${id}: พื้นที่ 2 ภาษา`);
}

/* 5. seed */
section('4. ข้อมูลตั้งต้น');
check(/^\d{4}-\d{2}-\d{2}$/.test(SEED.trip.start), 'วันเริ่มทริปรูปแบบ YYYY-MM-DD');
SEED.days.forEach((d, i) => {
  check(d.title?.th && d.title?.ja, `วัน ${i + 1}: ชื่อ 2 ภาษา`);
  check(['car', 'transit', 'walk'].includes(d.mode), `วัน ${i + 1}: mode "${d.mode}"`);
  check(/^\d{2}:\d{2}$/.test(d.start), `วัน ${i + 1}: เวลาเริ่ม "${d.start}"`);
  d.stops.forEach(s => check(PLACES[s.id], `วัน ${i + 1}: สถานที่ "${s.id}" มีในฐานข้อมูล`));
});
SEED.hotels.forEach(h => {
  check(h.name && h.checkin < h.checkout, `โรงแรม ${h.name}: วันเช็คอิน < เช็คเอาท์`);
  check(!h.gps || G(`parseGps(${JSON.stringify(h.gps)})`), `โรงแรม ${h.name}: GPS ถูกต้อง`);
});
SEED.restaurants.forEach(r => {
  check(r.name && G('MEALS').some(m => m.k === r.meal), `ร้านอาหาร ${r.name}: ชื่อและมื้อถูกต้อง`);
  check(r.day >= 0 && r.day <= SEED.days.length, `ร้านอาหาร ${r.name}: วันถูกต้อง`);
  check(!r.gps || G(`parseGps(${JSON.stringify(r.gps)})`), `ร้านอาหาร ${r.name}: GPS ถูกต้อง`);
});
SEED.expenses.forEach(e => {
  check(CURRENCIES[e.cur], `ค่าใช้จ่าย ${e.id}: สกุล ${e.cur} รองรับ`);
  check(G('EXP_CATS').some(c => c.k === e.cat), `ค่าใช้จ่าย ${e.id}: หมวด ${e.cat}`);
  check(e.amount > 0 && e.day >= 0 && e.day <= SEED.days.length, `ค่าใช้จ่าย ${e.id}: จำนวน/วัน ถูกต้อง`);
});

/* 6. phrases */
section('5. ประโยคญี่ปุ่น');
const cats = new Set(PHRASE_CATS.map(c => c.k)), seen = new Set();
const slots = s => [...String(s).matchAll(/\{(place|n)\}/g)].map(m => m[1]).sort().join(',');
PHRASES.forEach((p, i) => {
  const tag = `#${i} "${p.th}"`;
  check(p.th && p.ja && p.ro, `${tag}: มี th/ja/ro`);
  check(cats.has(p.cat), `${tag}: หมวด "${p.cat}"`);
  check(slots(p.th) === slots(p.ja) && slots(p.ja) === slots(p.ro), `${tag}: ช่องเติมตรงกันทั้ง 3 ภาษา`);
  const want = p.fill === 'place' ? 'place' : p.fill === 'people' ? 'n' : '';
  check(slots(p.ja) === want, `${tag}: fill="${p.fill || ''}" ตรงกับช่องเติม`);
  check(!/[a-zA-Z]{3,}/.test(p.ja.replace(/Wi-Fi|\{\w+\}/g, '')), `${tag}: ja ไม่ใช่ภาษาอังกฤษปน`);
  check(!seen.has(p.ja), `${tag}: ไม่ซ้ำ`); seen.add(p.ja);
});
['how_go', 'want_go', 'embassy'].forEach(id => check(PHRASES.some(p => p.id === id), `มีประโยค id "${id}" ที่แอปเรียกใช้`));
const need = ['トイレはどこですか？', 'お会計はいくらですか？', 'バス停はどこですか？'];
need.forEach(j => check(PHRASES.some(p => p.ja === j), `มีประโยคจำเป็น ${j}`));
PHRASE_CATS.forEach(c => check(PHRASES.filter(p => p.cat === c.k).length >= 4, `หมวด ${c.k} มีอย่างน้อย 4 ประโยค`));

/* 7. logic */
section('6. ทดสอบ logic');
const eq = (a, b, m) => check(JSON.stringify(a) === JSON.stringify(b), `${m} → ${JSON.stringify(a)}`);
eq(G(`parseGps('35.6948, 139.7016')`), '35.69480, 139.70160', 'parseGps ตัวเลขธรรมดา');
eq(G(`parseGps('https://www.google.com/maps/place/X/@35.6948123,139.7016456,17z')`), '35.69481, 139.70165', 'parseGps ลิงก์ @lat,lng');
eq(G(`parseGps('https://www.google.com/maps/place/X/data=!3d35.11111!4d139.22222')`), '35.11111, 139.22222', 'parseGps ลิงก์ !3d!4d');
eq(G(`parseGps('hello')`), null, 'parseGps ข้อความมั่ว = null');
eq(G(`parseGps('95.1, 200.2')`), null, 'parseGps พิกัดเกินขอบเขต = null');
eq(G(`Math.round(convert(1000,'JPY','THB',{USD:1,JPY:150,THB:33}))`), 220, 'convert 1000 JPY → THB (เรท 150/33)');
eq(G(`Math.round(convert(220,'THB','JPY',{USD:1,JPY:150,THB:33}))`), 1000, 'convert 220 THB → JPY');
eq(G(`convert(5,'JPY','JPY')`), 5, 'convert สกุลเดียวกัน');
eq(G(`fmtMoney(1234.5,'JPY')`), '¥1,235', 'fmtMoney JPY ไม่มีทศนิยม');
eq(G(`fmtMoney(12.5,'USD')`), '$12.50', 'fmtMoney USD 2 ตำแหน่ง');
eq(G(`fmtMoneyShort(32800,'JPY')`), '¥32.8k', 'fmtMoneyShort');
eq(G(`hm(toMin('07:00')+110)`), '08:50', 'คำนวณเวลา 07:00 + 110 นาที');
const s3 = G('schedule(2)');
check(s3.items[0].type === 'hotel' && s3.items[s3.items.length - 1].type === 'hotel', 'ตารางวันที่ 3 เริ่มและจบที่โรงแรม');
eq(s3.items.filter(x => x.type === 'stop').map(x => x.id), ['chureito', 'oishi', 'oshino'], 'ลำดับสถานที่วันที่ 3');
eq(s3.total, 110 + 90 + 20 + 60 + 25 + 60 + 110, 'เวลารวมวันที่ 3 (นาที)');
eq(G(`loadOf(3).lv`), 'empty', 'วันที่ 4 ว่าง');
eq(G(`hotelTonight('2026-11-13')`), undefined, 'คืนวันเช็คเอาท์ไม่มีโรงแรม');
eq(G(`hotelMorning('2026-11-13').id`), 'h1', 'เช้าวันเช็คเอาท์ยังออกจากโรงแรมเดิม');
G(`state.hotels.push({id:'h2',name:'Fuji',gps:'35.5, 138.76',checkin:'2026-11-11',checkout:'2026-11-12'})`);
eq(G(`hotelTonight('2026-11-11').id`), 'h2', 'โรงแรมทับวัน: คืนที่ไปนอนฟูจิ เลือกโรงแรมฟูจิ');
eq(G(`hotelMorning('2026-11-12').id`), 'h2', 'โรงแรมทับวัน: เช้าวันถัดไปออกจากโรงแรมฟูจิ');
eq(G(`hotelTonight('2026-11-12').id`), 'h1', 'โรงแรมทับวัน: คืนถัดไปกลับโรงแรมโตเกียว');
G(`state.hotels = state.hotels.filter(h=>h.id!=='h2')`);
check(G(`dirUrl('35.1,139.1','35.2,139.2','car',['35.3,139.3']).includes('waypoints=35.3%2C139.3')`), 'ลิงก์ Google Maps มี waypoints');
check(G(`calUrl(2).startsWith('https://calendar.google.com/calendar/render?action=TEMPLATE')`), 'ลิงก์ Google Calendar');
check(/dates=20261111T070000\/20261111T/.test(G('calUrl(2)')), 'ลิงก์ Calendar วันที่/เวลาถูกต้อง');

/* 8. html */
section('7. index.html');
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const order = [...html.matchAll(/<script src="js\/([\w.]+)"/g)].map(m => m[1]);
eq(order, JS, 'ลำดับการโหลดสคริปต์');
check(html.includes('css/app.css'), 'โหลด css/app.css');
check(html.includes('viewport-fit=cover'), 'รองรับจอมือถือ (safe-area)');
for (const id of G('Object.keys(RENDER)')) check(html.includes(`id="s-${id}"`), `มี section #s-${id}`);
for (const m of src['app.js'].matchAll(/\$\('#([a-zA-Z]+)'\)/g)) {
  const id = m[1], dynamicIds = ['talkList', 'restList', 'qcJ', 'qcT', 'exAmt', 'exCur', 'exPrev', 'exTitle', 'exDay', 'bAmt', 'bCur', 'hName', 'hAddr', 'hIn', 'hOut', 'hGps', 'gpsMsg', 'rName', 'rJa', 'rArea', 'rMeal', 'rDay', 'rAddr', 'rNote', 'rGps', 'rGpsMsg', 'impRestTxt', 'tName', 'tStart', 'tPeople', 'aiLog', 'toast'];
  check(html.includes(`id="${id}"`) || dynamicIds.includes(id) || new RegExp(`id="${id}"`).test(src['app.js']), `element #${id} มีอยู่จริง`);
}

/* 9. client cloud logic */
section('8. Cloud ฝั่งแอป (merge / plan / reorder / AI zone)');
G(`ui.day = 0; state.days[0].stops = [{id:'meiji',leg:20},{id:'shibuya_sky',leg:20},{id:'omoide',leg:20}]; reorderStop(0, 2);`);
eq(G(`state.days[0].stops.map(s=>s.id)`), ['shibuya_sky', 'omoide', 'meiji'], 'reorderStop ย้ายลำดับสถานที่ท่องเที่ยวขึ้น-ลงได้ถูกต้อง');
eq(G(`detectDayZone(2)`), 'fuji', 'detectDayZone ตรวจจับโซนฟูจิของวันที่ 3 ได้ถูกต้อง');
check(G(`buildSmartRecs('', 'fuji', 2).restaurants.length >= 5`), 'buildSmartRecs เสนอร้านอาหารในโซนฟูจิให้เลือกครบและตรงพื้นที่');
check(G(`parseSheetRestRow(['tokyo-2026','','วันที่ 2','มื้อเที่ยง','Ogakiku','小川菊','คาวาโกเอะ','Kawagoe','35.9212, 139.4831','ปลาไหล']).day === 2`), 'parseSheetRestRow แยกข้อมูลแถวจากตาราง Sheet ได้ถูกต้องแม้พิมพ์ "วันที่ 2"');
eq(G(`normDateIso('15/11/2569')`), '2026-11-15', 'normDateIso แปลงวันที่ พ.ศ. DD/MM/YYYY เป็น YYYY-MM-DD');
eq(G(`hotelCoveredDays({checkin:'2026-11-09',checkout:'2026-11-13'}).length`), 5, 'hotelCoveredDays คืนค่าวันครอบคลุมครบทุกวันตั้งแต่เช็คอินถึงเช็คเอาท์ (5 วัน)');
G(`state.hotels = [{id:'h1',name:'Shinjuku Hotel',gps:'35.69395, 139.70147',checkin:'2026-11-09',checkout:'2026-11-15'}]; syncTripDaysWithHotels(state.hotels[0]);`);
eq(G(`state.days.length`), 7, 'syncTripDaysWithHotels ขยายจำนวนวันในทริปให้ครบตามวันเช็คเอาท์ของโรงแรมโดยอัตโนมัติ (9–15 พ.ย. = 7 วัน)');
G(`state.days = state.days.slice(0, 5); state.hotels[0].checkout = '2026-11-13';`);
check(G(`(() => { const p = buildPlanFromPrompt('วันที่ 4 อยากไปชิบูย่าสกาย สวนชินจูกุเกียวเอ็น ศาลเจ้าเมจิ และห้าแยกชิบูย่า จัดเส้นทางไม่ให้ย้อนให้หน่อย'); const idxG = p.stops.findIndex(s => s.id === 'gyoen'); const idxM = p.stops.findIndex(s => s.id === 'meiji'); const idxS = p.stops.findIndex(s => s.id === 'shibuyasky'); return p.day === 3 && idxG >= 0 && idxM >= 0 && idxS >= 0 && idxG < idxM && idxM < idxS; })()`), 'buildPlanFromPrompt สกัดสถานที่จากประโยคและเรียงลำดับเส้นทางจากโรงแรมชินจูกุ (ชินจูกุเกียวเอ็น -> เมจิ -> ชิบูย่าสกาย) โดยไม่ย้อนกลับ');
G(`state.expenses = [{id:'a',amount:1,cur:'JPY',cat:'food',day:1},{id:'b',amount:2,cur:'JPY',cat:'food',day:1}]`);
G(`state.restaurants = [{id:'r1',name:'Local Rest',meal:'lunch',day:1}]`);
G(`mergeRemote({expenses:[{id:'b',amount:99,cur:'JPY',cat:'food',day:1},{id:'c',amount:3,cur:'JPY',cat:'food',day:1}], hotels:[], restaurants:[{id:'r1',name:'Old',meal:'lunch',day:1},{id:'r2',name:'Remote Rest',meal:'dinner',day:2}], customPlaces:{x:{name:{th:'X'}}}})`);
eq(G(`state.expenses.map(e=>e.id+':'+e.amount).sort()`), ['a:1', 'b:2', 'c:3'], 'merge ค่าใช้จ่าย: รวมตาม id และของเครื่องนี้ชนะ');
eq(G(`state.restaurants.map(r=>r.id+':'+r.name).sort()`), ['r1:Local Rest', 'r2:Remote Rest'], 'merge ร้านอาหาร: รวมตาม id และของเครื่องนี้ชนะ');
check(G(`!!state.customPlaces.x`), 'merge สถานที่ที่สร้างเองจากเครื่องอื่น');
G(`delete state.customPlaces.x; mergePlaces()`);
eq(G(`parsePlan('{"mode":"car","start":"08:00","stops":[{"id":"chureito","leg":100},{"id":"nope","leg":5}],"tip":"ok"}').stops`), [{ id: 'chureito', leg: 100 }], 'parsePlan ตัด id ที่ไม่มีจริงทิ้ง');
eq(G(`parsePlan('not json')`), null, 'parsePlan ข้อความมั่ว = null');
eq(G(`parsePlan('{"stops":[{"id":"oishi"}],"mode":"rocket","start":"9am"}').mode`), 'transit', 'parsePlan mode แปลก → transit');
G(`state.customPlaces = {c_1:{name:{th:'ร้านลับ',ja:'秘密の店'},ro:'x',area:{th:'',ja:''},art:'city',dur:45,gps:'',hi:{th:[]},miss:{th:[]},transit:{th:''}}}; mergePlaces()`);
check(G(`!!PLACES.c_1 && !!PLACES.sensoji`), 'mergePlaces รวมฐานหลัก + สถานที่ที่สร้างเอง');
G(`state.customPlaces = {}; mergePlaces()`);
check(G(`!PLACES.c_1`), 'ลบสถานที่ที่สร้างเองแล้วหายจากฐานข้อมูล');

/* 10. Apps Script backend (mock) */
section('9. Apps Script backend (จำลอง Google)');
const gsPath = path.join(__dirname, '..', 'apps-script', 'Code.gs');
const gsSrc = fs.readFileSync(gsPath, 'utf8');
const { makeGas } = require('./gas-mock');
const runGas = (opts) => {
  const g = makeGas(opts);
  const ctx = vm.createContext({ ...g.env, JSON, Math, Date, String, Number, Object, Array, Error, console: { log: noop } });
  vm.runInContext(gsSrc, ctx, { filename: 'Code.gs' });
  const call = (body) => JSON.parse(ctx.doPost({ postData: { contents: JSON.stringify(body) } }).getContent());
  return { g, ctx, call };
};
try {
  const { g, ctx, call } = runGas({ geminiReply: (body) => body.generationConfig.responseMimeType ? '{"mode":"car","start":"08:00","stops":[{"id":"oishi","leg":30}],"tip":"ok"}' : 'สวัสดี! (mock)' });
  eq(call({ action: 'ping', key: 'x' }).error, 'not_setup', 'ยังไม่ setup → not_setup');
  ctx.setup();
  const KEY = g.props.APP_KEY;
  check(KEY && KEY.length >= 8, 'setup() สร้าง APP_KEY');
  const ss = Object.values(g.spreadsheets)[0];
  eq(ss.getSheets().map(s => s.name), ['Trips', 'Expenses', 'Hotels', 'Restaurants', 'Places', 'Photos', 'Log'], 'setup() สร้างชีตครบ (ลบ Sheet1)');
  eq(ss.getSheetByName('Places').rows[0].slice(0, 3), ['id', 'name_th', 'name_ja'], 'หัวตาราง Places');
  ctx.setup();
  eq(Object.keys(g.spreadsheets).length, 1, 'รัน setup() ซ้ำไม่สร้างไฟล์ใหม่');
  eq(call({ action: 'ping', key: 'wrong' }).error, 'unauthorized', 'key ผิด → unauthorized');
  const ping = call({ action: 'ping', key: KEY });
  check(ping.ok && ping.ai === false && /spreadsheets/.test(ping.sheetUrl), 'ping ได้ข้อมูลครบ (AI ปิด)');
  eq(call({ action: 'pull', key: KEY }).error, 'no_trip_id', 'ไม่มี tripId → error');
  eq(call({ action: 'pull', key: KEY, tripId: 'tokyo-2026' }).state, null, 'ทริปใหม่ pull ได้ null');

  const seedState = JSON.parse(JSON.stringify(SEED));
  seedState.expenses[1].fx = { USD: 1, JPY: 150, THB: 33 };
  const p1 = call({ action: 'push', key: KEY, tripId: 'tokyo-2026', state: seedState, by: 'พ่อ', base: 0 });
  check(p1.ok && p1.updatedAt > 0, 'push ครั้งแรกสำเร็จ');
  const pl = call({ action: 'pull', key: KEY, tripId: 'tokyo-2026' });
  eq(pl.state.expenses.length, SEED.expenses.length, 'pull ได้ข้อมูลที่ push กลับมาครบ');
  eq(pl.updatedBy, 'พ่อ', 'จำชื่อคนแก้ล่าสุด');
  const exRows = ss.getSheetByName('Expenses').rows.slice(1).filter(r => r[0] === 'tokyo-2026');
  eq(exRows.length, SEED.expenses.length, 'สำเนาค่าใช้จ่ายลงชีต Expenses');
  eq(exRows.find(r => r[1] === 'e2')[7], 462, 'คำนวณเป็นบาทในชีตด้วยเรท ณ วันที่บันทึก (2100¥ → ฿462)');
  eq(ss.getSheetByName('Hotels').rows.slice(1).length, 1, 'สำเนาโรงแรมลงชีต Hotels');
  eq(ss.getSheetByName('Restaurants').rows.slice(1).length, SEED.restaurants.length, 'สำเนาร้านอาหารลงชีต Restaurants');
  // ทดสอบเพิ่มร้านอาหารในชีต Restaurants โดยตรง (ทั้งแบบตามหัวตาราง และแบบพิมพ์ชื่อร้านเลย) แล้วดึงเข้าแอป + push ไม่ทับหาย
  ss.getSheetByName('Restaurants').appendRow(['tokyo-2026', '', 5, 'มื้อเช้า', 'Sushi Dai ซึกิจิ', '寿司大', 'ซึกิจิ', 'Tsukiji', '35.66540, 139.77070', 'โอมากาเสะคิวดัง']);
  const plSheetRest = call({ action: 'pull', key: KEY, tripId: 'tokyo-2026' });
  check(plSheetRest.state.restaurants.some(r => r.name === 'Sushi Dai ซึกิจิ' && r.meal === 'breakfast' && r.day === 5), 'เพิ่มร้านอาหารในชีต Restaurants โดยตรง → pull ดึงเข้าแอปได้ครบ');
  call({ action: 'push', key: KEY, tripId: 'tokyo-2026', state: seedState, by: 'พ่อ', base: p1.updatedAt });
  check(ss.getSheetByName('Restaurants').rows.slice(1).some(r => r[4] === 'Sushi Dai ซึกิจิ'), 'แอป push ข้อมูลเดิมขึ้นไป → ร้านที่พิมพ์เพิ่มไว้ในชีต Restaurants ไม่หาย');
  eq(ss.getSheetByName('Expenses').rows.slice(1).length, SEED.expenses.length, 'push ซ้ำไม่ทำให้แถวซ้ำ');

  const stale = call({ action: 'push', key: KEY, tripId: 'tokyo-2026', state: seedState, by: 'แม่', base: 1 });
  check(stale.conflict === true && stale.state && stale.updatedBy === 'พ่อ', 'push จากข้อมูลเก่า → conflict + ส่งของล่าสุดกลับ');

  const big = JSON.parse(JSON.stringify(seedState));
  big.expenses = Array.from({ length: 600 }, (_, i) => ({ id: 'x' + i, day: 1, cat: 'food', title: 'ราเมนอร่อยมากกกก #' + i, amount: 1000 + i, cur: 'JPY', fx: { USD: 1, JPY: 150, THB: 33, EUR: .9 } }));
  const cur = call({ action: 'pull', key: KEY, tripId: 'tokyo-2026' });
  const pb = call({ action: 'push', key: KEY, tripId: 'tokyo-2026', state: big, by: 'พ่อ', base: cur.updatedAt });
  check(pb.ok && !pb.conflict, 'push ข้อมูลใหญ่ (>45k ตัวอักษร)');
  check(JSON.stringify(big).length > 45000, `ข้อมูลทดสอบใหญ่จริง (${JSON.stringify(big).length} ตัวอักษร)`);
  eq(call({ action: 'pull', key: KEY, tripId: 'tokyo-2026' }).state.expenses.length, 600, 'ข้อมูลใหญ่แบ่งเซลล์แล้วต่อกลับได้ครบ');
  const small = call({ action: 'push', key: KEY, tripId: 'tokyo-2026', state: seedState, by: 'พ่อ', base: pb.updatedAt + 0 });
  eq(call({ action: 'pull', key: KEY, tripId: 'tokyo-2026' }).state.expenses.length, SEED.expenses.length, 'ข้อมูลเล็กลงไม่มีเศษข้อมูลเก่าค้าง');
  check(small.ok, 'push หลังข้อมูลใหญ่');

  const nPlaces = Object.keys(PLACES).length;
  eq(call({ action: 'seedPlaces', key: KEY, places: PLACES }).added, nPlaces, 'ส่งฐานสถานที่ขึ้นชีต');
  eq(call({ action: 'seedPlaces', key: KEY, places: PLACES }).added, 0, 'ส่งซ้ำไม่เพิ่มซ้ำ');
  const back = call({ action: 'places', key: KEY }).places;
  eq(Object.keys(back).sort(), Object.keys(PLACES).sort(), 'ดึงสถานที่จากชีตได้ครบ');
  eq(back.chureito.hi.ja, PLACES.chureito.hi.ja, 'จุดเด่นภาษาญี่ปุ่นกลับมาตรงกัน');
  eq(back.oishi.gps, PLACES.oishi.gps, 'GPS กลับมาตรงกัน');

  const tiny = 'data:image/jpeg;base64,' + Buffer.from('fakejpeg').toString('base64');
  const ph = call({ action: 'photo', key: KEY, tripId: 'tokyo-2026', placeId: 'sensoji', dataUrl: tiny });
  check(ph.ok && /thumbnail\?id=/.test(ph.url), 'อัปรูปขึ้น Drive ได้ลิงก์ภาพ');
  check(g.files[ph.fileId].sharing[0] === 'ANYONE_WITH_LINK', 'รูปแชร์แบบมีลิงก์เท่านั้นที่ดูได้');
  eq(call({ action: 'pull', key: KEY, tripId: 'tokyo-2026' }).photos.sensoji, [ph.url], 'pull ได้รายการรูปของสถานที่');
  eq(call({ action: 'photo', key: KEY, tripId: 'tokyo-2026', placeId: 'x', dataUrl: 'hello' }).error, 'bad_image', 'ไฟล์ไม่ใช่รูป → bad_image');
  check(call({ action: 'delPhoto', key: KEY, tripId: 'tokyo-2026', fileId: ph.fileId }).deleted && g.files[ph.fileId].trashed, 'ลบรูป → ย้ายลงถังขยะ Drive');

  eq(call({ action: 'ai', key: KEY, q: 'hi' }).error, 'no_ai_key', 'ยังไม่ใส่คีย์ Gemini → no_ai_key');
  g.props.GEMINI_API_KEY = 'test-key';
  const ai = call({ action: 'ai', key: KEY, q: 'สวัสดี', lang: 'th', context: { days: [] }, history: [{ me: true, text: 'ก่อนหน้า' }] });
  eq(ai.text, 'สวัสดี! (mock)', 'Gemini ตอบกลับ');
  const req = g.fetchLog[g.fetchLog.length - 1];
  check(req.opt.headers['x-goog-api-key'] === 'test-key' && !req.url.includes('test-key'), 'คีย์ส่งทาง header ไม่โผล่ใน URL');
  check(/gemini-2\.5-flash/.test(req.url), 'ใช้โมเดลค่าเริ่มต้น');
  eq(req.body.contents.length, 2, 'ส่งประวัติแชทไปด้วย');
  check(/Thai/.test(req.body.systemInstruction.parts[0].text), 'สั่งให้ตอบภาษาไทย');
  const plan = call({ action: 'ai', key: KEY, q: 'plan', mode: 'plan', lang: 'ja' });
  check(g.fetchLog[g.fetchLog.length - 1].body.generationConfig.responseMimeType === 'application/json', 'โหมดจัดแผนขอผลเป็น JSON');
  eq(G(`parsePlan(${JSON.stringify(plan.text)}).stops[0].id`), 'oishi', 'แอปอ่านแผนจาก Gemini ได้');
  eq(call({ action: 'nope', key: KEY }).error, 'unknown_action', 'action ไม่รู้จัก → error');
  check(ss.getSheetByName('Log').rows.length > 1, 'มีบันทึก Log');

  const bad = runGas({ geminiStatus: 429 });
  bad.ctx.setup(); bad.g.props.GEMINI_API_KEY = 'k';
  check(/^gemini_429/.test(bad.call({ action: 'ai', key: bad.g.props.APP_KEY, q: 'x' }).error), 'Gemini error ส่งข้อความกลับให้แอป');
} catch (e) { fail('Apps Script test crash: ' + e.stack); }

const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'apps-script', 'appsscript.json'), 'utf8'));
check(manifest.webapp && manifest.webapp.access === 'ANYONE_ANONYMOUS', 'manifest: web app เปิดให้แอปเรียกได้');
check(manifest.oauthScopes.includes('https://www.googleapis.com/auth/script.external_request'), 'manifest: มีสิทธิ์เรียก Gemini');

/* summary */
console.log(`\n${errors ? '\x1b[31m✗ ไม่ผ่าน' : '\x1b[32m✓ ผ่านทั้งหมด'}\x1b[0m — ตรวจ ${passes + errors} รายการ, ผิด ${errors}`);
process.exit(errors ? 1 : 0);
