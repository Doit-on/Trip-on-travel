/* Tabi Note — สกุลเงิน + อัตราแลกเปลี่ยนจริง
 * หลัก: เยน (JPY) ↔ บาท (THB) · สกุลอื่นเลือกได้
 * แหล่งข้อมูล: open.er-api.com (อัปเดตรายวัน, ไม่ต้องใช้ key) → สำรอง frankfurter.app (ECB)
 * ค่าที่ได้เก็บแคชใน localStorage ใช้ต่อได้ตอนไม่มีเน็ต
 * อัตราทั้งหมดเก็บแบบ "ต่อ 1 USD" แล้วแปลงข้ามกัน
 */
'use strict';

const CURRENCIES = {
  JPY:{ sym:'¥',   dec:0, flag:'🇯🇵' },
  THB:{ sym:'฿',   dec:0, flag:'🇹🇭' },
  USD:{ sym:'$',   dec:2, flag:'🇺🇸' },
  EUR:{ sym:'€',   dec:2, flag:'🇪🇺' },
  KRW:{ sym:'₩',   dec:0, flag:'🇰🇷' },
  CNY:{ sym:'CN¥', dec:2, flag:'🇨🇳' },
  TWD:{ sym:'NT$', dec:0, flag:'🇹🇼' },
  HKD:{ sym:'HK$', dec:2, flag:'🇭🇰' },
  SGD:{ sym:'S$',  dec:2, flag:'🇸🇬' },
  GBP:{ sym:'£',   dec:2, flag:'🇬🇧' },
};
const PRIMARY_CURS = ['JPY', 'THB'];

/* ใช้เฉพาะตอนยังไม่เคยโหลดเรทได้เลย (ค่าประมาณ) */
const FALLBACK_RATES = { USD:1, JPY:150, THB:33, EUR:0.92, KRW:1380, CNY:7.2, TWD:32, HKD:7.8, SGD:1.35, GBP:0.78 };
const RATE_KEY = 'tabinote.rates.v1';
const RATE_TTL = 3 * 60 * 60 * 1000; // รีเฟรชทุก 3 ชม.

let RATES = { rates:{ ...FALLBACK_RATES }, ts:0, src:'fallback' };

function loadCachedRates() {
  try {
    const c = JSON.parse(localStorage.getItem(RATE_KEY));
    if (c && c.rates && c.rates.JPY && c.rates.THB) RATES = c;
  } catch (e) { /* แคชเสีย ใช้ค่า fallback */ }
  return RATES;
}

function pickRates(src) {
  const out = {};
  for (const k of Object.keys(CURRENCIES)) {
    const v = k === 'USD' ? 1 : Number(src[k]);
    if (!(v > 0)) throw new Error('missing rate ' + k);
    out[k] = v;
  }
  return out;
}

async function fetchJson(url, ms = 8000) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), ms);
  try {
    const r = await fetch(url, { signal: ctl.signal, cache: 'no-store' });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return await r.json();
  } finally { clearTimeout(timer); }
}

/** โหลดเรทล่าสุด คืนค่า true ถ้าได้เรทใหม่ */
async function refreshRates(force = false) {
  if (!force && RATES.src !== 'fallback' && Date.now() - RATES.ts < RATE_TTL) return false;
  const sources = [
    async () => {
      const j = await fetchJson('https://open.er-api.com/v6/latest/USD');
      if (j.result !== 'success') throw new Error('er-api failed');
      return { rates: pickRates(j.rates), src: 'open.er-api.com', asOf: j.time_last_update_utc };
    },
    async () => {
      const j = await fetchJson('https://api.frankfurter.app/latest?from=USD');
      return { rates: pickRates({ ...j.rates, USD: 1 }), src: 'frankfurter.app (ECB)', asOf: j.date };
    },
  ];
  for (const get of sources) {
    try {
      const r = await get();
      RATES = { ...r, ts: Date.now() };
      localStorage.setItem(RATE_KEY, JSON.stringify(RATES));
      return true;
    } catch (e) { console.warn('[rates]', e.message); }
  }
  return false;
}

/** แปลงเงิน — ใช้ชุดเรทที่ส่งมา (เช่นเรท ณ วันที่บันทึก) หรือเรทปัจจุบัน */
function convert(amount, from, to, rates = RATES.rates) {
  if (from === to) return amount;
  const a = rates[from] || RATES.rates[from], b = rates[to] || RATES.rates[to];
  if (!a || !b) return amount;
  return amount / a * b;
}

function fmtMoney(amount, cur) {
  const c = CURRENCIES[cur] || { sym: cur + ' ', dec: 2 };
  return c.sym + Number(amount || 0).toLocaleString('en-US', { minimumFractionDigits: c.dec, maximumFractionDigits: c.dec });
}

function fmtMoneyShort(amount, cur) {
  const c = CURRENCIES[cur] || { sym: cur + ' ' };
  const a = Math.abs(amount);
  if (a >= 1e6) return c.sym + (amount / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
  if (a >= 1e4) return c.sym + (amount / 1e3).toFixed(a >= 1e5 ? 0 : 1).replace(/\.0$/, '') + 'k';
  return fmtMoney(amount, cur);
}

/** ข้อความเรท เช่น "1 JPY = 0.2213 THB" */
function rateText(from, to, rates) {
  const v = convert(1, from, to, rates);
  const dp = v >= 100 ? 0 : v >= 1 ? 2 : 4;
  return `1 ${from} = ${v.toFixed(dp)} ${to}`;
}
