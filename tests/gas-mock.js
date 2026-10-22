/* Tabi Note — จำลองสภาพแวดล้อม Google Apps Script สำหรับทดสอบ Code.gs ในเครื่อง
 * จำลอง: SpreadsheetApp, DriveApp, PropertiesService, LockService, ContentService, Utilities, UrlFetchApp, Logger
 * (จำลองเฉพาะ method ที่ Code.gs ใช้จริง)
 */
'use strict';

function makeSheet(name) {
  const rows = []; // array of arrays (1-based row index → rows[i-1])
  const width = () => rows.reduce((m, r) => Math.max(m, r.length), 0);
  const sh = {
    name, rows,
    getName: () => name,
    getLastRow: () => { let n = rows.length; while (n > 0 && rows[n - 1].every(v => v === '' || v == null)) n--; return n; },
    getLastColumn: () => width(),
    getRange(r, c, nr = 1, nc = 1) {
      const rng = {
        setValues(vals) {
          vals.forEach((row, i) => { const R = r - 1 + i; while (rows.length <= R) rows.push([]); row.forEach((v, j) => { const C = c - 1 + j; while (rows[R].length < C) rows[R].push(''); rows[R][C] = v; }); });
          return rng;
        },
        getValues() {
          const out = [];
          for (let i = 0; i < nr; i++) { const row = rows[r - 1 + i] || []; const o = []; for (let j = 0; j < nc; j++) o.push(row[c - 1 + j] ?? ''); out.push(o); }
          return out;
        },
        clearContent() { for (let i = 0; i < nr; i++) { const row = rows[r - 1 + i]; if (row) for (let j = 0; j < nc; j++) if (c - 1 + j < row.length) row[c - 1 + j] = ''; } return rng; },
        setFontWeight: () => rng, setBackground: () => rng,
      };
      return rng;
    },
    getDataRange() { return sh.getRange(1, 1, Math.max(1, sh.getLastRow()), Math.max(1, width())); },
    appendRow(vals) { rows.splice(sh.getLastRow(), 0, vals.slice()); },
    deleteRow(i) { rows.splice(i - 1, 1); },
    deleteRows(i, n) { rows.splice(i - 1, n); },
    setFrozenRows: () => sh,
  };
  return sh;
}

function makeGas({ geminiReply = 'สวัสดีจาก Gemini (mock)', geminiStatus = 200 } = {}) {
  const props = {};
  const spreadsheets = {}, files = {}, folders = {};
  let idSeq = 0;
  const nid = p => p + (++idSeq);
  const fetchLog = [];

  function makeSS(title) {
    const id = nid('ss'), sheets = [makeSheet('Sheet1')];
    const ss = {
      getId: () => id, getUrl: () => 'https://docs.google.com/spreadsheets/d/' + id,
      getSheetByName: n => sheets.find(s => s.name === n) || null,
      insertSheet: n => { const s = makeSheet(n); sheets.push(s); return s; },
      deleteSheet: s => { sheets.splice(sheets.indexOf(s), 1); },
      getSheets: () => sheets.slice(), title, sheets,
    };
    spreadsheets[id] = ss;
    return ss;
  }
  function makeFolder(name) {
    const id = nid('fd'), children = [];
    const f = {
      getId: () => id, getUrl: () => 'https://drive.google.com/drive/folders/' + id, name,
      getFoldersByName: n => { const m = children.filter(c => c.kind === 'folder' && c.name === n); let i = 0; return { hasNext: () => i < m.length, next: () => m[i++] }; },
      createFolder: n => { const c = makeFolder(n); c.kind = 'folder'; children.push(c); return c; },
      createFile: blob => {
        const fid = nid('file');
        const file = { id: fid, blob, trashed: false, sharing: null,
          getId: () => fid, getUrl: () => 'https://drive.google.com/file/d/' + fid,
          setSharing: (a, p) => { file.sharing = [a, p]; }, setTrashed: v => { file.trashed = v; } };
        files[fid] = file; children.push(file); return file;
      },
      children,
    };
    folders[id] = f;
    return f;
  }

  const env = {
    PropertiesService: { getScriptProperties: () => ({ getProperty: k => props[k] ?? null, setProperty: (k, v) => { props[k] = String(v); } }) },
    SpreadsheetApp: { create: makeSS, openById: id => { if (!spreadsheets[id]) throw new Error('no ss'); return spreadsheets[id]; } },
    DriveApp: {
      createFolder: makeFolder,
      getFolderById: id => { if (!folders[id]) throw new Error('no folder'); return folders[id]; },
      getFileById: id => { if (!files[id]) throw new Error('no file'); return files[id]; },
      Access: { ANYONE_WITH_LINK: 'ANYONE_WITH_LINK' }, Permission: { VIEW: 'VIEW' },
    },
    LockService: { getScriptLock: () => ({ waitLock: () => {}, releaseLock: () => {} }) },
    ContentService: {
      MimeType: { JSON: 'json' },
      createTextOutput: s => ({ text: s, setMimeType() { return this; }, getContent() { return this.text; } }),
    },
    Utilities: {
      getUuid: () => '1234abcd-5678-90ef-aaaa-bbbbccccdddd',
      base64Decode: s => Buffer.from(s, 'base64'),
      newBlob: (bytes, type, name) => ({ bytes, type, name }),
    },
    UrlFetchApp: {
      fetch: (url, opt) => {
        fetchLog.push({ url, opt, body: JSON.parse(opt.payload) });
        return {
          getResponseCode: () => geminiStatus,
          getContentText: () => JSON.stringify(geminiStatus === 200
            ? { candidates: [{ content: { parts: [{ text: typeof geminiReply === 'function' ? geminiReply(JSON.parse(opt.payload)) : geminiReply }] } }] }
            : { error: { message: 'quota' } }),
        };
      },
    },
    Logger: { log: () => {} },
  };
  return { env, props, spreadsheets, files, folders, fetchLog };
}

module.exports = { makeGas };
