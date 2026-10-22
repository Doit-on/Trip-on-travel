#!/usr/bin/env node
/* Tabi Note — ทดสอบ end-to-end ในเบราว์เซอร์จริง
 * รัน:  node tests/e2e.js
 *
 * 1. เปิดเซิร์ฟเวอร์จำลอง Apps Script (รัน Code.gs จริงบน gas-mock) + เสิร์ฟไฟล์แอป
 * 2. เปิด Chrome แบบ headless แล้วควบคุมผ่าน DevTools Protocol
 * 3. ทดสอบ: เชื่อม → ซิงก์ขึ้น → อีกเครื่องแก้พร้อมกัน → merge → อัปรูป → Gemini ตอบ/จัดแผน → ไม่มี error ในหน้าเว็บ
 * ต้องมี Chrome/Edge ในเครื่อง (หรือกำหนด env CHROME=path)
 */
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const os = require('os');
const { spawn } = require('child_process');
const { makeGas } = require('./gas-mock');

const ROOT = path.join(__dirname, '..');
const PORT = 8787, DBG = 9333;
let errors = 0, passes = 0;
const ok = m => { passes++; console.log('  \x1b[32m✓\x1b[0m ' + m); };
const fail = m => { errors++; console.log('  \x1b[31m✗\x1b[0m ' + m); };
const check = (c, m) => (c ? ok(m) : fail(m));
const sleep = ms => new Promise(r => setTimeout(r, ms));

/* ---------- mock Apps Script ---------- */
const gas = makeGas({ geminiReply: b => b.generationConfig.responseMimeType
  ? '{"title":{"th":"ช้อปชินจูกุ","ja":"新宿ショッピング"},"mode":"transit","start":"10:00","stops":[{"id":"gyoen","leg":20},{"id":"omoide","leg":15}],"tip":"เดินสบายๆ"}'
  : '**ไหวครับ!**\n- วันที่ 3 ออกเช้า\n- เผื่อเวลากินข้าว' });
const ctx = vm.createContext({ ...gas.env, JSON, Math, Date, String, Number, Object, Array, Error, console: { log() {} } });
vm.runInContext(fs.readFileSync(path.join(ROOT, 'apps-script', 'Code.gs'), 'utf8'), ctx);
ctx.setup();
const KEY = gas.props.APP_KEY;
const callGas = body => JSON.parse(ctx.doPost({ postData: { contents: JSON.stringify(body) } }).getContent());

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8' };
const server = http.createServer((req, res) => {
  if (req.url.startsWith('/api')) {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
      res.end(ctx.doPost({ postData: { contents: body } }).getContent());
    });
    return;
  }
  const f = path.join(ROOT, decodeURIComponent(req.url.split('?')[0].split('#')[0]));
  if (!f.startsWith(path.join(ROOT, 'app')) || !fs.existsSync(f)) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
});

/* ---------- Chrome + CDP ---------- */
function findChrome() {
  const c = [process.env.CHROME,
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium-browser', '/usr/bin/chromium',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'];
  return c.find(p => p && fs.existsSync(p));
}
async function cdpConnect() {
  for (let i = 0; i < 50; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${DBG}/json/list`)).json();
      const page = list.find(p => p.type === 'page');
      if (page) return page.webSocketDebuggerUrl;
    } catch (e) { /* not ready */ }
    await sleep(200);
  }
  throw new Error('Chrome DevTools ไม่ตอบ');
}

(async () => {
  const chromePath = findChrome();
  if (!chromePath) { console.log('ข้าม e2e: ไม่พบ Chrome'); process.exit(0); }
  await new Promise(r => server.listen(PORT, r));
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'tabinote-e2e-'));
  const chrome = spawn(chromePath, ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--disable-extensions',
    `--remote-debugging-port=${DBG}`, `--user-data-dir=${profile}`, '--window-size=390,844', 'about:blank'], { stdio: 'ignore' });

  let ws, seq = 0;
  const pending = new Map(), pageErrors = [];
  const send = (method, params = {}) => new Promise((res, rej) => { const id = ++seq; pending.set(id, { res, rej }); ws.send(JSON.stringify({ id, method, params })); });
  const run = async (expr) => {
    const r = await send('Runtime.evaluate', { expression: `(async()=>{ ${expr} })()`, awaitPromise: true, returnByValue: true });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
    return r.result.value;
  };

  try {
    ws = new WebSocket(await cdpConnect());
    await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
    ws.onmessage = ev => {
      const m = JSON.parse(ev.data);
      if (m.id && pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.rej(new Error(m.error.message)) : p.res(m.result); }
      if (m.method === 'Runtime.exceptionThrown') pageErrors.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
      if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') pageErrors.push(m.params.args.map(a => a.value || a.description).join(' '));
    };
    await send('Runtime.enable'); await send('Page.enable');
    await send('Page.navigate', { url: `http://localhost:${PORT}/app/index.html#overview` });
    await sleep(1500);

    console.log('\n\x1b[1mE2E: แอปจริง ↔ Apps Script (จำลอง)\x1b[0m');
    check(await run(`return document.querySelector('#s-overview.on') !== null`), 'แอปเปิดได้ หน้า overview แสดง');

    const conn = await run(`
      const r = await testCloud(null, { url:'http://localhost:${PORT}/api', key:'${KEY}', tripId:'e2e-trip', by:'พ่อ' });
      saveCloud(); return { ok: !!r, ai: CLOUD.ai, on: cloudOn() };`);
    check(conn.ok && conn.on, 'เชื่อม Apps Script สำเร็จ');
    check(conn.ai === false, 'ยังไม่มีคีย์ Gemini → AI ปิด');
    const bad = await run(`const k=CLOUD.key; const r = await testCloud(null,{url:CLOUD.url,key:'wrong',tripId:'e2e-trip',by:'x'}); return { r, keep: CLOUD.key===k };`);
    check(bad.r === null && bad.keep, 'key ผิด → ไม่เชื่อม และไม่ทับค่าที่ใช้ได้');

    await run(`await pullNow(true); await pushNow(); return true;`);
    let remote = callGas({ action: 'pull', key: KEY, tripId: 'e2e-trip' });
    check(remote.state && remote.state.days.length === 5, 'ทริปถูกส่งขึ้น Sheet');
    check(await run(`return syncState`) === 'ok', 'สถานะซิงก์ = ok');

    await run(`state.expenses.push({id:'local1',day:1,cat:'food',title:'ราเมน',amount:1200,cur:'JPY',fx:{...RATES.rates}}); saveState(); await pushNow(); return true;`);
    remote = callGas({ action: 'pull', key: KEY, tripId: 'e2e-trip' });
    check(remote.state.expenses.some(e => e.id === 'local1'), 'เพิ่มค่าใช้จ่าย → ขึ้น Sheet อัตโนมัติ');
    const exRows = Object.values(gas.spreadsheets)[0].getSheetByName('Expenses').rows.filter(r => r[1] === 'local1');
    check(exRows.length === 1 && exRows[0][7] > 0, 'ชีต Expenses มีรายการพร้อมยอดเป็นบาท');

    // อีกเครื่อง (แม่) แก้พร้อมกัน
    const momState = JSON.parse(JSON.stringify(remote.state));
    momState.expenses.push({ id: 'mom1', day: 2, cat: 'shop', title: 'ของฝาก', amount: 3000, cur: 'JPY' });
    const pm = callGas({ action: 'push', key: KEY, tripId: 'e2e-trip', state: momState, by: 'แม่', base: remote.updatedAt });
    check(pm.ok && !pm.conflict, 'อีกเครื่องส่งข้อมูลขึ้น');
    await run(`state.expenses.push({id:'dad2',day:3,cat:'transport',title:'น้ำมัน',amount:4000,cur:'JPY'}); saveState(); await pushNow(); return true;`);
    remote = callGas({ action: 'pull', key: KEY, tripId: 'e2e-trip' });
    const ids = remote.state.expenses.map(e => e.id);
    check(ids.includes('mom1') && ids.includes('dad2') && ids.includes('local1'), 'แก้พร้อมกัน 2 เครื่อง → รวมข้อมูลไม่หาย');
    check(await run(`return state.expenses.some(e=>e.id==='mom1')`), 'เครื่องนี้ได้ข้อมูลของอีกเครื่องด้วย');

    // อีกเครื่องเพิ่มโรงแรมและร้านอาหาร แล้วเครื่องนี้ pull
    const st2 = JSON.parse(JSON.stringify(remote.state));
    st2.hotels.push({ id: 'h2', name: 'Fuji Lake Hotel', gps: '35.50000, 138.76000', checkin: '2026-11-11', checkout: '2026-11-12' });
    st2.restaurants = st2.restaurants || [];
    st2.restaurants.push({ id: 'r3', name: 'Houtou Fudou คาวากุจิโกะ', nameJa: 'ほうとう不動', area: 'คาวากุจิโกะ', meal: 'lunch', day: 3, gps: '35.50300, 138.75800', note: 'อุด้งเส้นแบนหม้อไฟ' });
    callGas({ action: 'push', key: KEY, tripId: 'e2e-trip', state: st2, by: 'แม่', base: remote.updatedAt });
    const after = await run(`await pullNow(true); go('restaurants'); ui.restQ='Houtou'; renderRestList(); const found = document.querySelector('#restList').textContent.includes('Houtou Fudou'); ui.restQ=''; renderRestList(); return { n: state.hotels.length, nr: state.restaurants.length, found, start: schedule(2).hs?.name, end: schedule(2).he?.name };`);
    check(after.n === 2, 'pull ได้โรงแรมใหม่จากอีกเครื่อง');
    check(after.nr === 3 && after.found, 'pull ได้ร้านอาหารใหม่ + ค้นหาชื่อร้านเจอ');
    check(after.end === 'Fuji Lake Hotel', 'วันที่ 3 จบที่โรงแรมใหม่ตามวันเช็คอิน (คำนวณเส้นทางใหม่ให้)');

    // พิมพ์เพิ่มร้านอาหารในชีต Restaurants โดยตรง (โดยที่ Trips.updatedAt ไม่ได้เปลี่ยน) แล้วกด pull ในแอป
    const restSheet = Object.values(gas.spreadsheets)[0].getSheetByName('Restaurants');
    restSheet.appendRow(['e2e-trip', '', 'Ogakiku ปลาไหลคาวาโกเอะ', '小川菊', 'คาวาโกเอะ', 'มื้อเที่ยง', 2, 'Kawagoe', '35.92120, 139.48310', 'ร้านปลาไหล 200 ปี']);
    const fromSheet = await run(`await pullNow(true); return state.restaurants.some(r => r.name.includes('Ogakiku') && r.day === 2);`);
    check(fromSheet === true, 'เพิ่มร้านอาหารใน Google Sheet แท็บ Restaurants โดยตรง → แอปดึงเข้าลิสต์ได้ทันทีแม้ updatedAt ไม่เปลี่ยน');

    // รูป
    const tiny = 'data:image/jpeg;base64,' + Buffer.from('fake-jpeg').toString('base64');
    const url = await run(`return await uploadPhoto('sensoji', '${tiny}')`);
    check(/thumbnail\?id=/.test(url || ''), 'อัปรูปขึ้น Drive ผ่านแอป');
    const ph = await run(`photos = {}; await pullNow(true); return (photos.sensoji||[]).length`);
    check(ph === 1, 'อีกเครื่อง pull แล้วเห็นรูป');

    // ฐานข้อมูลสถานที่ผ่านชีต
    await run(`await seedPlaces(); return true;`);
    const sheet = Object.values(gas.spreadsheets)[0].getSheetByName('Places');
    sheet.appendRow(['teamlab', 'ทีมแล็บ แพลนเน็ตส์', 'チームラボプラネッツ', 'teamLab Planets', 'โทโยสุ', '豊洲', 'city', 120, '35.64910, 139.78980', '', 'เดินลุยน้ำ|ห้องดอกไม้ลอย', '', 'จองล่วงหน้า', '', 'Yurikamome ลงสถานี Shin-toyosu', '']);
    const tl = await run(`await pullPlaces(); return PLACES.teamlab ? { n: PLACES.teamlab.name.th, hi: PLACES.teamlab.hi.th.length, dur: PLACES.teamlab.dur } : null;`);
    check(tl && tl.n === 'ทีมแล็บ แพลนเน็ตส์' && tl.hi === 2 && tl.dur === 120, 'เพิ่มสถานที่ในชีต → แอปดึงมาใช้ได้');

    // Gemini
    gas.props.GEMINI_API_KEY = 'fake-key';
    await run(`await testCloud(null,{url:CLOUD.url,key:CLOUD.key,tripId:CLOUD.tripId,by:CLOUD.by}); saveCloud(); return true;`);
    check(await run(`return aiReady()`), 'ใส่คีย์ Gemini → AI เปิดในแอป');
    const ans = await run(`go('ai'); await askAI('วันที่ 3 ไหวไหม'); return { last: aiLog[aiLog.length-1].html, hasRecs: !!(aiLog[aiLog.length-1].recs && aiLog[aiLog.length-1].recs.restaurants.length), n: aiLog.length };`);
    check(/<b>ไหวครับ!<\/b>/.test(ans.last) && /<li>/.test(ans.last), 'Gemini ตอบ และแสดงตัวหนาและรายการถูกต้อง');
    check(ans.hasRecs, 'AI แนะนำร้านอาหารและสถานที่ใกล้เคียงตามโซนเส้นทางพร้อมปุ่มกดเพิ่ม');
    const addedFromAi = await run(`
      const idx = aiLog.length - 1;
      const beforeR = state.restaurants.length;
      addAiRest(idx, 0);
      addAiPlace(idx, 0);
      return { afterR: state.restaurants.length, beforeR };
    `);
    check(addedFromAi.afterR > addedFromAi.beforeR, 'กดปุ่ม + เพิ่มร้านอาหารจากคำแนะนำของ AI เข้าทริปได้ทันที');
    const ctxSent = gas.fetchLog[gas.fetchLog.length - 1].body.contents.slice(-1)[0].parts[0].text;
    check(/Fuji Lake Hotel/.test(ctxSent) && /chureito/.test(ctxSent), 'ส่งข้อมูลทริป (โรงแรม/สถานที่) ให้ Gemini คิด');
    const plan = await run(`await planDay(3); const m = aiLog[aiLog.length-1]; return m.plan ? m.plan.stops.map(s=>s.id) : null;`);
    check(JSON.stringify(plan) === '["gyoen","omoide"]', 'Gemini จัดแผนวันที่ 4 ได้');
    const applied = await run(`applyPlan(aiLog.length-1); await pushNow(); return state.days[3].stops.map(s=>s.id).join(',') + '|' + tx(state.days[3].title);`);
    check(applied === 'gyoen,omoide|ช้อปชินจูกุ', 'กดใช้แผน → ลงตารางวันที่ 4');
    remote = callGas({ action: 'pull', key: KEY, tripId: 'e2e-trip' });
    check(remote.state.days[3].stops.length === 2, 'แผนจาก AI ซิงก์ขึ้น Sheet');

    // หน้าจอทั้งหมดยัง render ได้หลังเชื่อม
    const screens = await run(`const out=[]; for (const k of Object.keys(RENDER)) { go(k); out.push(k + ':' + !!document.querySelector('#s-'+k+'.on')); } openCloud(); out.push('cloud:' + document.querySelector('#sheet').classList.contains('on')); closeSheet(); return out;`);
    check(screens.every(s => s.endsWith('true')), 'ทุกหน้า render ได้หลังเชื่อม (' + screens.length + ' หน้า)');
    check(await run(`go('overview'); return !!document.querySelector('.sync-dot.s-ok')`), 'จุดสถานะซิงก์สีเขียวแสดงบนหน้า');
    const inv = await run(`return inviteLink()`);
    check(/\?join=/.test(inv), 'สร้างลิงก์ชวนครอบครัวได้');

    await sleep(300);
    check(pageErrors.length === 0, 'ไม่มี JavaScript error ในหน้าเว็บ' + (pageErrors.length ? ': ' + pageErrors.slice(0, 3).join(' | ') : ''));
  } catch (e) {
    fail('E2E crash: ' + e.message);
  } finally {
    try { ws && ws.close(); } catch (e) { /* ignore */ }
    chrome.kill();
    server.close();
    setTimeout(() => { try { fs.rmSync(profile, { recursive: true, force: true }); } catch (e) { /* locked */ } }, 500);
  }
  console.log(`\n${errors ? '\x1b[31m✗ ไม่ผ่าน' : '\x1b[32m✓ ผ่านทั้งหมด'}\x1b[0m — E2E ${passes + errors} รายการ, ผิด ${errors}`);
  setTimeout(() => process.exit(errors ? 1 : 0), 700);
})();
