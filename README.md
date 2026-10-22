# Tabi Note 旅のノート

เว็บแอปวางแผนเที่ยวญี่ปุ่นแบบไปได้จริง ใช้ได้ทั้งมือถือและคอม (ไทย / 日本語)
เชื่อม Google Sheet · Drive · Gemini AI และแชร์ทริปกับทั้งครอบครัวได้

## โครงสร้าง
```
app/                    ← ตัวเว็บ (deploy ขึ้น GitHub Pages)
  index.html
  css/app.css
  js/data.js            ฐานข้อมูลสถานที่ + ทริปตัวอย่าง
  js/phrases.js         ประโยคญี่ปุ่น 6 หมวด
  js/currency.js        สกุลเงิน + เรทจริง (open.er-api.com → สำรอง frankfurter.app)
  js/i18n.js            ข้อความไทย/ญี่ปุ่น
  js/store.js           เก็บข้อมูลในเครื่อง
  js/cloud.js           เชื่อม Google: ซิงก์ / รูป / ชีต Places / Gemini
  js/app.js             ตัวแอป
apps-script/            ← backend บน Google (วางใน script.google.com)
  Code.gs, appsscript.json
  SETUP.md              คู่มือติดตั้งทีละขั้น
tests/
  check.js              ตรวจตัวเอง ~1,100 รายการ (รวม backend บน Google จำลอง)
  gas-mock.js           ตัวจำลอง Google Apps Script
  e2e.js                ทดสอบในเบราว์เซอร์จริง แอป ↔ backend
.githooks/pre-push      รันเทสต์อัตโนมัติก่อน push
.github/workflows/      CI: ตรวจ → E2E → deploy
prototype/              ต้นแบบ UX รุ่นแรก (เก็บไว้อ้างอิง)
```

## ใช้งานในเครื่อง
เปิด `app/index.html` ได้เลย ไม่ต้องติดตั้งอะไร (ยังไม่เชื่อม Google ก็ใช้ได้ ข้อมูลอยู่ในเครื่อง)

ลิงก์ลัด: `#day=3` `#place=chureito` `#talk` `#phrase=8` `#money` `#expense` `#hotels` `#hotel` `#restaurants` `#restaurant` `#sos` `#ai` `#report` `#cloud` `#newplace` และ `?lang=ja`

## เชื่อม Google (Sheet · Drive · AI)
ดู [apps-script/SETUP.md](apps-script/SETUP.md) — ประมาณ 5–10 นาที

## ทดสอบ
```
npm test          # หรือ node tests/check.js && node tests/e2e.js
```
- git hook จะรันเทสต์ให้ก่อน `git push` ทุกครั้ง
- GitHub Actions รันซ้ำอีกรอบ ถ้าไม่ผ่านจะไม่ deploy (เว็บเดิมไม่พัง)

## Deploy ขึ้น GitHub Pages ครั้งแรก
1. สร้าง repo เปล่าบน GitHub (Public)
2. ```
   git remote add origin https://github.com/<user>/<repo>.git
   git push -u origin main
   ```
3. ที่ repo: **Settings → Pages → Source: GitHub Actions**
4. รอ Actions เขียว → เว็บอยู่ที่ `https://<user>.github.io/<repo>/`
