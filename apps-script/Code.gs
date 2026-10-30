/**
 * Tabi Note — Google Apps Script backend
 * ------------------------------------------------------------
 * หน้าที่:  ① เก็บข้อมูลทริปลง Google Sheet (แชร์กันทั้งครอบครัวได้)
 *           ② เก็บรูปถ่ายลง Google Drive
 *           ③ ฐานข้อมูลสถานที่ในชีต "Places" (เพิ่ม/แก้เองได้ แอปดึงไปใช้)
 *           ④ เป็นตัวกลางเรียก Gemini AI (คีย์ไม่หลุดไปอยู่ในเว็บ)
 *
 * ติดตั้ง: ดู apps-script/SETUP.md
 *
 * Script Properties (ตั้งค่าที่ Project Settings → Script properties):
 *   APP_KEY         รหัสลับที่แอปต้องส่งมา (setup() สร้างให้อัตโนมัติ)
 *   GEMINI_API_KEY  คีย์จาก https://aistudio.google.com/apikey  (ไม่ใส่ = ปิด AI)
 *   GEMINI_MODEL    (ไม่บังคับ) ค่าเริ่มต้น gemini-2.5-flash
 *   SHEET_ID, FOLDER_ID  setup() สร้างให้อัตโนมัติ
 */

var VERSION = '1.1.0';
var CHUNK = 45000; // ขนาดสูงสุดต่อเซลล์ (Sheets จำกัด 50,000 ตัวอักษร)
// โฟลเดอร์ Google Drive "Tabi Note-Photos" ที่เชื่อมไว้เป็นค่าเริ่มต้น
var DEFAULT_FOLDER_ID = '1zfoQPNFiUPGp7HYi3p1EuHLMceWXME2z';

var TABS = {
  Trips:       ['tripId', 'updatedAt', 'updatedBy', 'state'],
  Expenses:    ['tripId', 'id', 'day', 'category', 'title', 'amount', 'currency', 'amountTHB', 'amountJPY', 'recordedAt'],
  Hotels:      ['tripId', 'id', 'name', 'address', 'gps', 'checkin', 'checkout'],
  Restaurants: ['tripId', 'id', 'day', 'meal', 'name', 'name_ja', 'area', 'address', 'gps', 'note'],
  Places:      ['id', 'name_th', 'name_ja', 'romaji', 'area_th', 'area_ja', 'art', 'dur', 'gps', 'mapcode',
                'hi_th', 'hi_ja', 'miss_th', 'miss_ja', 'transit_th', 'transit_ja'],
  Photos:      ['tripId', 'placeId', 'fileId', 'url', 'uploadedAt', 'by', 'viewUrl'],
  Log:         ['time', 'action', 'tripId', 'info'],
};

/* ============ ติดตั้งครั้งแรก / อัปเดตโครงสร้างชีตและโฟลเดอร์: กด Run ฟังก์ชันนี้ในหน้า editor ============ */
function setup() {
  var p = PropertiesService.getScriptProperties();
  if (!p.getProperty('APP_KEY')) p.setProperty('APP_KEY', Utilities.getUuid().replace(/-/g, '').slice(0, 10));

  var ss = null, id = p.getProperty('SHEET_ID');
  if (id) { try { ss = SpreadsheetApp.openById(id); } catch (e) { ss = null; } }
  if (!ss) {
    try { ss = SpreadsheetApp.getActiveSpreadsheet(); } catch (e) { ss = null; }
  }
  if (!ss) { ss = SpreadsheetApp.create('Tabi Note — Database'); }
  p.setProperty('SHEET_ID', ss.getId());

  Object.keys(TABS).forEach(function (name) { ensureTab_(ss, name); });
  var def = ss.getSheetByName('Sheet1') || ss.getSheetByName('ชีต1');
  if (def && ss.getSheets().length > 1) ss.deleteSheet(def);

  var folder = null;
  // ใช้โฟลเดอร์ Tabi Note-Photos (DEFAULT_FOLDER_ID) เป็นหลัก ถ้าเปิดได้จะผูกไว้ทันที
  var tryIds = [DEFAULT_FOLDER_ID, p.getProperty('FOLDER_ID')].filter(Boolean);
  for (var i = 0; i < tryIds.length && !folder; i++) {
    try { folder = DriveApp.getFolderById(tryIds[i]); } catch (e) { folder = null; }
  }
  if (!folder) { folder = DriveApp.createFolder('Tabi Note-Photos'); }
  p.setProperty('FOLDER_ID', folder.getId());

  var msg = [
    '✅ ติดตั้งเสร็จ',
    'APP_KEY  : ' + p.getProperty('APP_KEY') + '   ← เอาไปใส่ในแอป',
    'Sheet    : ' + ss.getUrl(),
    'Photos   : ' + folder.getUrl(),
    'Gemini AI: ' + (p.getProperty('GEMINI_API_KEY') ? 'เปิดแล้ว' : 'ยังไม่ได้ใส่ GEMINI_API_KEY (ใส่ทีหลังได้)'),
    'ขั้นต่อไป: Deploy → New deployment → Web app (Execute as: Me, Who has access: Anyone)'
  ].join('\n');
  Logger.log(msg);
  return msg;
}

/* ============ HTTP entry ============ */
function doGet(e)  { return handle_(e && e.parameter ? e.parameter : {}); }
function doPost(e) {
  var body = {};
  try { body = JSON.parse(e.postData.contents); } catch (err) { return out_({ ok: false, error: 'bad_json' }); }
  return handle_(body);
}

function handle_(req) {
  var props = PropertiesService.getScriptProperties();
  try {
    if (!props.getProperty('APP_KEY')) return out_({ ok: false, error: 'not_setup' });
    if (String(req.key || '') !== props.getProperty('APP_KEY')) return out_({ ok: false, error: 'unauthorized' });
    if (req.geminiKey && String(req.geminiKey).trim()) {
      props.setProperty('GEMINI_API_KEY', String(req.geminiKey).trim());
    }
    var tripId = cleanId_(req.tripId);
    switch (req.action) {
      case 'ping':       return out_(ok_(ping_()));
      case 'pull':       return out_(ok_(pull_(need_(tripId))));
      case 'push':       return out_(ok_(push_(need_(tripId), req.state, req.by, Number(req.base) || 0)));
      case 'places':     return out_(ok_({ places: readPlaces_(), restaurants: readRestaurants_(tripId), hotels: readHotels_(tripId) }));
      case 'seedPlaces': return out_(ok_({ added: seedPlaces_(req.places || {}) }));
      case 'photo':      return out_(ok_(savePhoto_(need_(tripId), req)));
      case 'delPhoto':   return out_(ok_(delPhoto_(need_(tripId), req.fileId)));
      case 'ai':         return out_(ok_(askAI_(req)));
      default:           return out_({ ok: false, error: 'unknown_action' });
    }
  } catch (err) {
    log_('error', tripId || '', String(err && err.message || err));
    return out_({ ok: false, error: String(err && err.message || err) });
  }
}

/* ============ actions ============ */
function getGeminiKey_() {
  var p = PropertiesService.getScriptProperties();
  var k = p.getProperty('GEMINI_API_KEY');
  if (k && String(k).trim()) return String(k).trim();
  try {
    var all = p.getProperties ? (p.getProperties() || {}) : {};
    var names = Object.keys(all);
    for (var i = 0; i < names.length; i++) {
      if (/gemini|api_key|^AIza|^AQ\./i.test(names[i].trim()) && String(all[names[i]] || '').trim()) {
        return String(all[names[i]]).trim();
      }
      if (/^AIza|^AQ\./.test(String(all[names[i]] || '').trim()) && !/^(SHEET_ID|FOLDER_ID|APP_KEY)$/.test(names[i].trim())) {
        return String(all[names[i]]).trim();
      }
    }
  } catch (e) { /* ignore */ }
  return '';
}

function ping_() {
  return {
    version: VERSION,
    ai: !!getGeminiKey_(),
    sheetUrl: ss_().getUrl(),
    folderUrl: folder_().getUrl()
  };
}

function pull_(tripId) {
  var row = findTrip_(tripId);
  var photos = {};
  rows_('Photos').forEach(function (r) {
    if (r[0] !== tripId) return;
    (photos[r[1]] = photos[r[1]] || []).push(String(r[3]));
  });
  var sheetRests = readRestaurants_(tripId);
  var sheetHotels = readHotels_(tripId);
  var hasAi = !!getGeminiKey_();
  if (!row) {
    return { state: null, updatedAt: 0, photos: photos, restaurants: sheetRests, hotels: sheetHotels, ai: hasAi };
  }
  var st = JSON.parse(row.json);
  mergeSheetRows_(st, sheetRests, sheetHotels, true);
  return { state: st, updatedAt: row.updatedAt, updatedBy: row.updatedBy, photos: photos, restaurants: st.restaurants || [], hotels: st.hotels || [], ai: hasAi };
}

function push_(tripId, state, by, base) {
  if (!state || typeof state !== 'object') throw new Error('no_state');
  var lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    var cur = findTrip_(tripId);
    // มีคนอื่นอัปเดตหลังจากที่เครื่องนี้ sync ล่าสุด → ส่งของล่าสุดกลับไปให้ merge ก่อน
    if (cur && cur.updatedAt > base) {
      var curState = JSON.parse(cur.json);
      mergeSheetRows_(curState, readRestaurants_(tripId), readHotels_(tripId), true);
      return { conflict: true, state: curState, updatedAt: cur.updatedAt, updatedBy: cur.updatedBy };
    }
    // รักษาแถวที่ผู้ใช้พิมพ์เพิ่มในชีต Restaurants / Hotels โดยตรง ไม่ให้ถูกเขียนทับหาย
    mergeSheetRows_(state, readRestaurants_(tripId), readHotels_(tripId), false);
    var now = Date.now(), json = JSON.stringify(state);
    var sh = ss_().getSheetByName('Trips');
    var parts = [];
    for (var i = 0; i < json.length; i += CHUNK) parts.push(json.slice(i, i + CHUNK));
    var values = [tripId, now, String(by || '')].concat(parts);
    var r = cur ? cur.row : sh.getLastRow() + 1;
    if (cur) sh.getRange(r, 4, 1, Math.max(1, sh.getLastColumn() - 3)).clearContent();
    sh.getRange(r, 1, 1, values.length).setValues([values]);
    mirror_(tripId, state);
    log_('push', tripId, (by || '') + ' ' + json.length + 'B');
    return { updatedAt: now, restaurants: state.restaurants || [], hotels: state.hotels || [] };
  } finally {
    lock.releaseLock();
  }
}

/** สำเนาค่าใช้จ่าย + โรงแรม + ร้านอาหารเป็นแถวอ่านง่าย (ไว้ดู/ทำรายงานใน Sheet) */
function mirror_(tripId, state) {
  var fx = function (e, to) {
    var r = e.fx || {};
    if (e.cur === to) return e.amount;
    if (!r[e.cur] || !r[to]) return '';
    return Math.round(e.amount / r[e.cur] * r[to] * 100) / 100;
  };
  replaceRows_('Expenses', tripId, (state.expenses || []).map(function (e) {
    return [tripId, e.id, e.day, e.cat, e.title, e.amount, e.cur, fx(e, 'THB'), fx(e, 'JPY'), e.at ? new Date(e.at) : ''];
  }));
  replaceRows_('Hotels', tripId, (state.hotels || []).map(function (h) {
    return [tripId, h.id, h.name, h.address || '', h.gps || '', h.checkin, h.checkout];
  }));
  replaceRows_('Restaurants', tripId, (state.restaurants || []).map(function (r) {
    return [tripId, r.id, r.day || 0, r.meal || '', r.name, r.nameJa || '', r.area || '', r.address || '', r.gps || '', r.note || ''];
  }));
}

function normMeal_(m) {
  var s = String(m || '').trim().toLowerCase();
  if (/breakfast|morning|เช้า|朝/.test(s)) return 'breakfast';
  if (/dinner|evening|เย็น|ค่ำ|夜|夕/.test(s)) return 'dinner';
  if (/cafe|coffee|dessert|sweet|คาเฟ่|ขนม|ของหวาน|กาแฟ|カフェ|甘/.test(s)) return 'cafe';
  if (/late|night|snack|ดึก|กินเล่น|ของว่าง|夜食/.test(s)) return 'late';
  return 'lunch';
}

function normGps_(text) {
  if (!text) return '';
  var s = String(text).trim();
  try { s = decodeURIComponent(s); } catch (e) { /* keep raw */ }
  var m = s.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/) || s.match(/@(-?\d+\.\d+),\s*(-?\d+\.\d+)/) || s.match(/(-?\d{1,3}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)/);
  if (!m) return '';
  var lat = Number(m[1]), lng = Number(m[2]);
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return '';
  return lat.toFixed(5) + ', ' + lng.toFixed(5);
}

function parseDayNum_(v) {
  if (v === '' || v == null) return null;
  if (typeof v === 'number' && v >= 0 && v <= 30) return Math.round(v);
  var s = String(v).trim();
  if (/^\d{1,2}$/.test(s)) return parseInt(s, 10);
  var m = s.match(/(?:วันที่|วัน|day|d)\s*(\d{1,2})/i);
  if (m) return parseInt(m[1], 10);
  return null;
}

/** อ่านร้านอาหารจากชีต Restaurants (รองรับทั้งแถวมาตรฐานของแอป แถวที่ผู้ใช้พิมพ์เพิ่มเองทุกคอลัมน์ และร้านอาหารในชีต Places) */
function readRestaurants_(tripId) {
  var allRows = rows_('Restaurants');
  var parseRow = function (r, idx, ignoreTrip) {
    var c0 = String(r[0] || '').trim();
    var rTrip = cleanId_(c0);
    if (!ignoreTrip && rTrip && tripId && rTrip !== tripId && /-\d{4}$|^e2e|^trip/i.test(rTrip)) return null;

    var day = 0, meal = 'lunch', name = '', nameJa = '', area = '', address = '', gps = '', note = '';
    var c2 = String(r[2] || '').trim(), c3 = String(r[3] || '').trim(), c4 = String(r[4] || '').trim();
    var d2 = parseDayNum_(r[2]), d6 = parseDayNum_(r[6]), d5 = parseDayNum_(r[5]);
    var c2IsDayOrEmpty = (c2 === '' || d2 !== null || /^[-–—]$/.test(c2));

    if (c2IsDayOrEmpty && c4) {
      // รูปแบบคอลัมน์มาตรฐานของชีต Restaurants: [tripId, id, day, meal, name, nameJa, area, address, gps, note]
      day = d2 || 0;
      meal = normMeal_(c3);
      name = c4;
      nameJa = String(r[5] || '').trim();
      area = String(r[6] || '').trim();
      address = String(r[7] || '').trim();
      gps = normGps_(r[8]) || normGps_(r[7]);
      note = String(r[9] || '').trim();
    } else if (c2 && !c2IsDayOrEmpty && !/^(breakfast|lunch|dinner|cafe|late|เช้า|เที่ยง|เย็น|มื้อ)/i.test(c2)) {
      // กรณีผู้ใช้กรอกชื่อร้านที่คอลัมน์ C เหมือนชีต Hotels: [tripId, id, name, nameJa, area, meal, day, address, gps, note]
      name = c2;
      nameJa = c3;
      area = c4;
      meal = normMeal_(r[5] || c3);
      day = d6 != null ? d6 : (d5 != null ? d5 : 0);
      address = String(r[7] || '').trim();
      gps = normGps_(r[8]) || normGps_(r[7]);
      note = String(r[9] || '').trim();
    } else if (c4) {
      name = c4;
      day = d2 || 0;
      meal = normMeal_(c3);
      nameJa = String(r[5] || '').trim();
      area = String(r[6] || '').trim();
      address = String(r[7] || '').trim();
      gps = normGps_(r[8]) || normGps_(r[7]);
      note = String(r[9] || '').trim();
    } else if (!rTrip && String(r[1] || '').trim()) {
      name = String(r[1] || '').trim();
      area = c2;
      gps = normGps_(r[3]) || normGps_(r[4]);
    } else if (c0 && !c4 && !c2 && !/-\d{4}$|^e2e|^trip/i.test(rTrip)) {
      name = c0;
    }

    if (!name) return null;
    // ค้นหา GPS ถ้าผู้ใช้เผลอวางพิกัดไว้ในคอลัมน์อื่น
    if (!gps) {
      for (var k = 0; k < r.length; k++) {
        var g = normGps_(r[k]);
        if (g) { gps = g; break; }
      }
    }
    var id = cleanId_(r[1]);
    if (!id || id === cleanId_(name)) id = 'rs_' + (idx + 1) + '_' + cleanId_(name).slice(0, 24);
    return {
      id: id,
      day: day,
      meal: meal,
      name: name,
      nameJa: nameJa,
      area: area,
      address: address,
      gps: gps,
      note: note
    };
  };

  var out = [];
  allRows.forEach(function (r, idx) {
    var item = parseRow(r, idx, false);
    if (item) out.push(item);
  });
  // ถ้ากรองด้วย tripId แล้วไม่เจอเลย แต่ในชีต Restaurants มีข้อมูลอยู่ (เช่น รหัสทริปในชีตต่างจากในแอป) ให้ดึงมาทั้งหมด
  if (!out.length && allRows.length) {
    allRows.forEach(function (r, idx) {
      var item = parseRow(r, idx, true);
      if (item) out.push(item);
    });
  }
  // ถ้าระบุหมวด food / ร้านอาหาร ไว้ในชีต Places ให้ดึงมารวมในลิสต์ร้านอาหารด้วย
  rows_('Places').forEach(function (r, idx) {
    var art = String(r[6] || '').trim().toLowerCase();
    if (/^(food|restaurant|cafe|ร้านอาหาร|คาเฟ่|ของกิน)$/.test(art) && String(r[1] || '').trim()) {
      var pname = String(r[1]).trim();
      if (!out.some(function (x) { return x.name.toLowerCase() === pname.toLowerCase(); })) {
        out.push({
          id: 'rp_' + (cleanId_(r[0]) || (idx + 1)),
          day: 0,
          meal: art === 'cafe' || art === 'คาเฟ่' ? 'cafe' : 'lunch',
          name: pname,
          nameJa: String(r[2] || '').trim(),
          area: String(r[4] || '').trim(),
          address: '',
          gps: normGps_(r[8]),
          note: String(r[10] || '').trim()
        });
      }
    }
  });
  return out;
}

/** อ่านโรงแรมจากชีต Hotels (รองรับการพิมพ์เพิ่ม/แก้ไขใน Sheet) */
function readHotels_(tripId) {
  var out = [];
  rows_('Hotels').forEach(function (r, idx) {
    var rTrip = cleanId_(r[0]);
    if (rTrip && tripId && rTrip !== tripId) return;
    var name = String(r[2] || '').trim();
    if (!name) return;
    var id = cleanId_(r[1]) || ('hs_' + (idx + 1) + '_' + cleanId_(name).slice(0, 24));
    var fmtDate = function (v) {
      if (!v) return '';
      if (Object.prototype.toString.call(v) === '[object Date]' && !isNaN(v.getTime())) {
        var yr = v.getFullYear();
        if (yr >= 2400) yr -= 543;
        return yr + '-' + ('0' + (v.getMonth() + 1)).slice(-2) + '-' + ('0' + v.getDate()).slice(-2);
      }
      var s = String(v).trim();
      var mIso = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
      if (mIso) {
        var y1 = parseInt(mIso[1], 10);
        if (y1 >= 2400) y1 -= 543;
        return y1 + '-' + ('0' + parseInt(mIso[2], 10)).slice(-2) + '-' + ('0' + parseInt(mIso[3], 10)).slice(-2);
      }
      var mDmy = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
      if (mDmy) {
        var y2 = parseInt(mDmy[3], 10);
        if (y2 >= 2400) y2 -= 543;
        return y2 + '-' + ('0' + parseInt(mDmy[2], 10)).slice(-2) + '-' + ('0' + parseInt(mDmy[1], 10)).slice(-2);
      }
      return s.slice(0, 10);
    };
    var ci = fmtDate(r[5]), co = fmtDate(r[6]);
    out.push({
      id: id,
      name: name,
      address: String(r[3] || '').trim(),
      gps: normGps_(r[4]),
      checkin: ci,
      checkout: co
    });
  });
  return out;
}

/** รวมข้อมูลจากชีต Restaurants และ Hotels เข้ากับ state โดยไม่ให้ข้อมูลฝั่งใดหาย */
function mergeSheetRows_(state, sheetRests, sheetHotels, sheetWinsOnEdit) {
  if (!state || typeof state !== 'object') return;
  var del = {};
  (state.deletedIds || []).forEach(function (id) { del[String(id)] = true; });
  var normKey = function (s) { return String(s || '').trim().toLowerCase(); };

  if (sheetRests && sheetRests.length) {
    var list = state.restaurants = state.restaurants || [];
    sheetRests.forEach(function (sr) {
      if (del[sr.id]) return;
      var found = null;
      for (var i = 0; i < list.length; i++) {
        if (list[i].id === sr.id || (normKey(list[i].name) && normKey(list[i].name) === normKey(sr.name))) {
          found = list[i]; break;
        }
      }
      if (!found) {
        list.push(sr);
      } else if (sheetWinsOnEdit) {
        found.name = sr.name || found.name;
        found.nameJa = sr.nameJa || found.nameJa || '';
        found.area = sr.area || found.area || '';
        found.meal = sr.meal || found.meal || 'lunch';
        found.day = sr.day != null ? sr.day : (found.day || 0);
        found.address = sr.address || found.address || '';
        found.gps = sr.gps || found.gps || '';
        found.note = sr.note || found.note || '';
      }
    });
  }

  if (sheetHotels && sheetHotels.length) {
    var hlist = state.hotels = state.hotels || [];
    sheetHotels.forEach(function (sh) {
      if (del[sh.id] || !sh.checkin || !sh.checkout) return;
      var found = null;
      for (var i = 0; i < hlist.length; i++) {
        if (hlist[i].id === sh.id || (normKey(hlist[i].name) && normKey(hlist[i].name) === normKey(sh.name))) {
          found = hlist[i]; break;
        }
      }
      if (!found) {
        hlist.push(sh);
      } else if (sheetWinsOnEdit) {
        found.name = sh.name || found.name;
        found.address = sh.address || found.address || '';
        found.gps = sh.gps || found.gps || '';
        found.checkin = sh.checkin || found.checkin;
        found.checkout = sh.checkout || found.checkout;
      }
    });
  }
}

function readPlaces_() {
  var out = {};
  rows_('Places').forEach(function (r) {
    var id = cleanId_(r[0]);
    if (!id || !r[1]) return;
    var split = function (v) { return String(v || '').split('|').map(function (s) { return s.trim(); }).filter(String); };
    out[id] = {
      name: { th: String(r[1]), ja: String(r[2] || r[1]) }, ro: String(r[3] || r[1]),
      area: { th: String(r[4] || ''), ja: String(r[5] || r[4] || '') },
      art: String(r[6] || 'city'), dur: Number(r[7]) || 60, gps: String(r[8] || ''), mapcode: String(r[9] || ''),
      hi: { th: split(r[10]), ja: split(r[11]).length ? split(r[11]) : split(r[10]) },
      miss: { th: split(r[12]), ja: split(r[13]).length ? split(r[13]) : split(r[12]) },
      transit: { th: String(r[14] || ''), ja: String(r[15] || r[14] || '') },
      src: 'sheet'
    };
  });
  return out;
}

/** ส่งฐานข้อมูลจากแอปขึ้นชีต — เพิ่มเฉพาะ id ที่ยังไม่มี (ไม่ทับที่แก้ไว้ในชีต) */
function seedPlaces_(places) {
  var sh = ss_().getSheetByName('Places');
  var have = {};
  rows_('Places').forEach(function (r) { have[String(r[0])] = true; });
  var add = [];
  Object.keys(places).forEach(function (id) {
    var p = places[id];
    if (have[id] || !p || !p.name) return;
    var j = function (a) { return (a || []).join(' | '); };
    add.push([id, p.name.th, p.name.ja || '', p.ro || '', (p.area || {}).th || '', (p.area || {}).ja || '', p.art || '', p.dur || 60,
      p.gps || '', p.mapcode || '', j((p.hi || {}).th), j((p.hi || {}).ja), j((p.miss || {}).th), j((p.miss || {}).ja),
      (p.transit || {}).th || '', (p.transit || {}).ja || '']);
  });
  if (add.length) sh.getRange(sh.getLastRow() + 1, 1, add.length, add[0].length).setValues(add);
  return add.length;
}

function savePhoto_(tripId, req) {
  var m = String(req.dataUrl || '').match(/^data:(image\/[\w+.-]+);base64,(.+)$/);
  if (!m) throw new Error('bad_image');
  var place = cleanId_(req.placeId) || 'misc';
  var gps = normGps_(req.gps || '');
  var blob = Utilities.newBlob(Utilities.base64Decode(m[2]), m[1], place + '_' + Date.now() + '.jpg');
  var file = subFolder_(tripId).createFile(blob);
  if (gps && typeof file.setDescription === 'function') {
    try { file.setDescription('GPS: ' + gps + ' | Place: ' + place); } catch (e) { /* ignore */ }
  }
  // เปิดให้ "ทุกคนที่มีลิงก์ดูได้" เพื่อให้แอปแสดงภาพได้ (ไม่มีใครค้นเจอถ้าไม่มีลิงก์)
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  var url = 'https://drive.google.com/thumbnail?id=' + file.getId() + '&sz=w1600';
  var view = file.getUrl();
  var ss = ss_();
  var sh = ss.getSheetByName('Photos') || ensureTab_(ss, 'Photos');
  sh.appendRow([tripId, place, file.getId(), url, new Date(), String(req.by || ''), view, gps]);
  return { fileId: file.getId(), url: url, view: view, gps: gps };
}

function delPhoto_(tripId, fileId) {
  fileId = String(fileId || '');
  if (!fileId) throw new Error('no_file');
  var sh = ss_().getSheetByName('Photos');
  var data = sh.getDataRange().getValues();
  for (var i = data.length - 1; i >= 1; i--) {
    if (data[i][0] === tripId && String(data[i][2]) === fileId) {
      sh.deleteRow(i + 1);
      try { DriveApp.getFileById(fileId).setTrashed(true); } catch (e) { /* ลบไปแล้ว */ }
      return { deleted: true };
    }
  }
  return { deleted: false };
}

/* ============ Gemini ============ */
function askAI_(req) {
  var p = PropertiesService.getScriptProperties();
  var key = getGeminiKey_();
  if (!key) throw new Error('no_ai_key');
  var model = p.getProperty('GEMINI_MODEL') || 'gemini-2.5-flash';
  var lang = req.lang === 'ja' ? 'ja' : 'th';
  var plan = req.mode === 'plan';

  var sys = [
    'You are the smart route, zone, and food assistant inside "Tabi Note", a Japan travel planner app for Thai families.',
    'Reply in ' + (lang === 'ja' ? 'Japanese' : 'Thai') + ', friendly and helpful, concise with clear bullet points.',
    'Core duties:',
    '1. ROUTE & ZONE CHECK: Analyze each day\'s geographic zone and route corridor (morning hotel GPS -> stops GPS -> evening hotel GPS). Flag any stop that is out-of-zone or causes unnecessary backtracking, and suggest a better day or order.',
    '2. PROACTIVE NEARBY DISCOVERY (BEYOND THE APP DATABASE): Do NOT limit yourself to the PLACES list! Actively recommend worthwhile attractions, viewpoints, and famous/local restaurants or cafes that are in the SAME zone or ALONG the travel route (on the way between stops/hotels), even if they are not in PLACES or restaurants yet.',
    '3. Whenever you recommend specific restaurants or new attractions in chat, include their Japanese name, area, signature dish/highlight, and GPS (lat, lng). At the very end of your reply (after your text), if you recommended any specific places or restaurants, append a single line starting with RECS_JSON: followed by valid JSON {"places":[{"id":"slug","name":{"th":"...","ja":"..."},"area":{"th":"...","ja":"..."},"dur":60,"gps":"35.00000, 139.00000","art":"city","hi":"...","day":1}],"restaurants":[{"name":"...","nameJa":"...","area":"...","meal":"lunch|dinner|cafe|breakfast|late","day":1,"gps":"35.00000, 139.00000","note":"..."}]} so the user can add them in 1 tap.',
    '4. Be REALISTIC: 3–5 stops/day, under ~9–10 hours total, include meal breaks and car vs. train advice.',
    plan ? 'Return ONLY JSON (no markdown) with this exact shape: {"title":{"th":"...","ja":"..."},"mode":"car|transit|walk","start":"HH:MM","stops":[{"id":"<id from PLACES or newPlaces>","leg":<minutes>}],"newPlaces":[{"id":"slug","name":{"th":"...","ja":"..."},"area":{"th":"...","ja":"..."},"dur":60,"gps":"lat, lng","art":"city|shrine|fuji|park|food|shop|museum"}],"restaurants":[{"name":"...","nameJa":"...","area":"...","meal":"lunch|dinner|cafe","gps":"lat, lng","note":"..."}],"tip":"<short tip including route zone & meal advice>"}. 2–5 stops along the same zone/route.' : ''
  ].join('\n');

  var contents = [];
  (req.history || []).slice(-8).forEach(function (m) {
    if (m && m.text) contents.push({ role: m.me ? 'user' : 'model', parts: [{ text: String(m.text).slice(0, 4000) }] });
  });
  contents.push({ role: 'user', parts: [{ text: 'TRIP CONTEXT (JSON):\n' + JSON.stringify(req.context || {}).slice(0, 30000) + '\n\nREQUEST:\n' + String(req.q || '').slice(0, 2000) }] });

  var body = {
    systemInstruction: { parts: [{ text: sys }] },
    contents: contents,
    generationConfig: { temperature: plan ? 0.4 : 0.7, maxOutputTokens: 4096 }
  };
  if (plan) body.generationConfig.responseMimeType = 'application/json';

  var res = UrlFetchApp.fetch('https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(model) + ':generateContent', {
    method: 'post', contentType: 'application/json', payload: JSON.stringify(body),
    headers: { 'x-goog-api-key': key }, muteHttpExceptions: true
  });
  var code = res.getResponseCode(), j = {};
  try { j = JSON.parse(res.getContentText()); } catch (e) { /* ignore */ }
  if (code !== 200) throw new Error('gemini_' + code + ': ' + ((j.error && j.error.message) || '').slice(0, 200));
  var cand = (j.candidates || [])[0] || {};
  var text = ((cand.content || {}).parts || []).map(function (x) { return x.text || ''; }).join('').trim();
  if (!text) throw new Error('gemini_empty' + (cand.finishReason ? '_' + cand.finishReason : ''));
  log_('ai', cleanId_(req.tripId) || '', (plan ? 'plan ' : '') + String(req.q || '').slice(0, 80));
  return { text: text, model: model };
}

/* ============ helpers ============ */
function ok_(o) { o = o || {}; o.ok = true; return o; }
function out_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function need_(id) { if (!id) throw new Error('no_trip_id'); return id; }
function cleanId_(s) { return String(s || '').trim().replace(/[^\w\-ก-๙]/g, '').slice(0, 60); }

function ss_() {
  var id = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
  if (!id) throw new Error('not_setup');
  return SpreadsheetApp.openById(id);
}
function folder_() {
  var p = PropertiesService.getScriptProperties();
  var id = p.getProperty('FOLDER_ID');
  if (DEFAULT_FOLDER_ID && id !== DEFAULT_FOLDER_ID) {
    try {
      var df = DriveApp.getFolderById(DEFAULT_FOLDER_ID);
      p.setProperty('FOLDER_ID', df.getId());
      return df;
    } catch (e) { /* ถ้าอยู่ในสภาพแวดล้อมจำลองหรือไม่มีสิทธิ์ ให้ใช้ FOLDER_ID เดิม */ }
  }
  if (!id) throw new Error('not_setup');
  return DriveApp.getFolderById(id);
}
function subFolder_(tripId) {
  var root = folder_(), it = root.getFoldersByName(tripId);
  return it.hasNext() ? it.next() : root.createFolder(tripId);
}
function ensureTab_(ss, name) {
  var sh = ss.getSheetByName(name) || ss.insertSheet(name);
  var head = TABS[name];
  sh.getRange(1, 1, 1, head.length).setValues([head]).setFontWeight('bold').setBackground('#F6D5DB');
  sh.setFrozenRows(1);
  return sh;
}
function rows_(name) {
  var sh = ss_().getSheetByName(name);
  if (!sh || sh.getLastRow() < 2) return [];
  return sh.getRange(2, 1, sh.getLastRow() - 1, sh.getLastColumn()).getValues();
}
function findTrip_(tripId) {
  var data = rows_('Trips');
  for (var i = 0; i < data.length; i++) {
    if (String(data[i][0]) === tripId) {
      return { row: i + 2, updatedAt: Number(data[i][1]) || 0, updatedBy: String(data[i][2] || ''), json: data[i].slice(3).join('') };
    }
  }
  return null;
}
function replaceRows_(name, tripId, newRows) {
  var ss = ss_();
  var sh = ss.getSheetByName(name) || ensureTab_(ss, name);
  var data = sh.getDataRange().getValues();
  for (var i = data.length - 1; i >= 1; i--) if (data[i][0] === tripId) sh.deleteRow(i + 1);
  if (newRows.length) sh.getRange(sh.getLastRow() + 1, 1, newRows.length, newRows[0].length).setValues(newRows);
}
function log_(action, tripId, info) {
  try {
    var sh = ss_().getSheetByName('Log');
    sh.appendRow([new Date(), action, tripId, String(info || '').slice(0, 300)]);
    if (sh.getLastRow() > 2000) sh.deleteRows(2, 500);
  } catch (e) { /* log ไม่ได้ก็ไม่เป็นไร */ }
}

/* ทดสอบ AI จาก editor: กด Run ฟังก์ชันนี้ */
function testAI() {
  var r = askAI_({ lang: 'th', q: 'สวัสดี ทดสอบระบบ ตอบสั้นๆ', context: {} });
  Logger.log(r.model + ': ' + r.text);
}
