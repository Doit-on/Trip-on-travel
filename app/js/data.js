/* Tabi Note — ฐานข้อมูลสถานที่ + ข้อมูลตั้งต้นของทริป
 * ในเวอร์ชันถัดไปจะดึงจาก Google Sheet (ผ่าน Apps Script) แทนไฟล์นี้
 * รูปแบบข้อความหลายภาษา: { th: '...', ja: '...' }
 * dur = เวลาที่ควรใช้ (นาที), gps = "lat, lng"
 */
'use strict';

const ART = {
  temple:`<svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice"><rect width="100" height="100" fill="#F4D6DA"/><path d="M15 50 Q50 34 85 50 L80 54 Q50 42 20 54Z" fill="#C8605F"/><rect x="26" y="54" width="48" height="30" fill="#E07A6E"/><rect x="44" y="64" width="12" height="20" fill="#6E3B3B"/><rect y="84" width="100" height="16" fill="#EAD9CC"/></svg>`,
  street:`<svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice"><rect width="100" height="100" fill="#F6E7C1"/><path d="M0 40 L30 28 L30 90 L0 90Z" fill="#6B5446"/><path d="M100 40 L70 28 L70 90 L100 90Z" fill="#7E6453"/><path d="M30 90 L45 50 L55 50 L70 90Z" fill="#D9C7A8"/><rect x="47" y="20" width="6" height="30" fill="#5B4A44"/><path d="M42 18 L58 18 L50 10Z" fill="#5B4A44"/></svg>`,
  shrine:`<svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice"><rect width="100" height="100" fill="#DCE7D3"/><path d="M14 34 Q50 26 86 34 L84 40 Q50 32 16 40Z" fill="#E0625A"/><rect x="20" y="46" width="60" height="5" fill="#E0625A"/><rect x="28" y="38" width="6" height="52" fill="#E0625A"/><rect x="66" y="38" width="6" height="52" fill="#E0625A"/></svg>`,
  fuji:`<svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice"><rect width="100" height="100" fill="#D9E6F1"/><path d="M0 90 L42 40 Q50 32 58 40 L100 90Z" fill="#9FB3D1"/><path d="M42 40 Q50 32 58 40 L62 46 L56 44 L50 49 L45 44 L38 46Z" fill="#fff"/><g transform="translate(70 46)" fill="#D97B7B"><rect x="6" y="6" width="5" height="40"/><path d="M-3 14 L20 14 L16 10 L1 10Z"/><path d="M-1 24 L18 24 L14 20 L3 20Z"/><path d="M0 34 L17 34 L13 30 L4 30Z"/></g></svg>`,
  lake:`<svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice"><rect width="100" height="100" fill="#E4DDF0"/><path d="M10 60 L45 24 Q50 20 55 24 L90 60Z" fill="#A9A0CC"/><path d="M45 24 Q50 20 55 24 L60 30 L50 32 L40 30Z" fill="#fff"/><rect y="60" width="100" height="40" fill="#B9D3E6"/><path d="M10 60 L45 90 Q50 94 55 90 L90 60Z" fill="#A9A0CC" opacity=".35"/></svg>`,
  water:`<svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice"><rect width="100" height="100" fill="#DCE7D3"/><ellipse cx="50" cy="70" rx="40" ry="16" fill="#9FC4D6"/><path d="M8 50 Q20 30 34 48 Q48 26 62 46 Q78 28 92 50Z" fill="#7FA36B"/></svg>`,
  park:`<svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice"><rect width="100" height="100" fill="#F6E7C1"/><circle cx="30" cy="50" r="22" fill="#E59A6B"/><circle cx="66" cy="44" r="26" fill="#D9725A"/><rect x="28" y="66" width="4" height="22" fill="#6B5446"/><rect x="64" y="64" width="4" height="24" fill="#6B5446"/><rect y="86" width="100" height="14" fill="#B5CDA3"/></svg>`,
  city:`<svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice"><rect width="100" height="100" fill="#FBD9CF"/><rect x="10" y="44" width="16" height="56" fill="#A9A0CC"/><rect x="30" y="20" width="22" height="80" fill="#8E86B8"/><rect x="56" y="36" width="14" height="64" fill="#B9B2D8"/><rect x="74" y="52" width="18" height="48" fill="#A9A0CC"/><rect x="30" y="16" width="22" height="5" fill="#fff"/></svg>`,
};

const PLACES = {
  sensoji:{ name:{th:'วัดเซนโซจิ',ja:'浅草寺'}, ro:'Sensō-ji', area:{th:'อาซากุสะ',ja:'浅草'}, art:'temple', dur:90, gps:'35.71480, 139.79665',
    hi:{th:['วัดเก่าแก่สุดในโตเกียว ประตูคามินาริมงโคมแดงยักษ์ ถ่ายรูปยังไงก็ปัง','ถนนนากามิเสะ 250 ม. เดินกินขนมเพลินจนลืมเวลา'],
        ja:['東京最古の寺。雷門の大提灯は必見','仲見世通りで食べ歩き']},
    miss:{th:['มาก่อน 8 โมง รูปสวยไม่มีคนแย่งซีน','เสี่ยงเซียมซีโอมิคุจิ ¥100 ได้ใบร้ายก็ผูกทิ้งไว้ที่วัดเลย'],
          ja:['朝8時前なら人が少なく写真が撮りやすい','おみくじ(¥100)に挑戦']},
    transit:{th:'Ginza Line / Asakusa Line ลงสถานี Asakusa ทางออก 1 เดิน 5 นาที',ja:'銀座線・浅草線「浅草駅」1番出口から徒歩5分'} },
  kashiya:{ name:{th:'ซอยขนมคาชิยะโยโกโจ',ja:'菓子屋横丁'}, ro:'Kashiya Yokochō', area:{th:'คาวาโกเอะ',ja:'川越'}, art:'street', dur:60, gps:'35.92754, 139.48406',
    hi:{th:['ตรอกร้านขนมย้อนยุคสมัยโชวะ กว่า 20 ร้าน','ฟุกาชิแท่งยาวเกือบเมตร ถือถ่ายรูปฮาดี'],ja:['昭和レトロな駄菓子屋が20軒以上','長さ約1mの麩菓子']},
    miss:{th:['ไอศกรีมมันหวาน ของดีคาวาโกเอะ','ร้านส่วนใหญ่ปิด 5 โมงเย็น อย่ามาช้า!'],ja:['名物のさつまいもアイス','多くの店は17時閉店']},
    transit:{th:'Seibu Shinjuku Line ลง Hon-Kawagoe ต่อรถบัสโคเอโดะ (ใช้ Seibu Kawagoe Pass ได้)',ja:'西武新宿線「本川越駅」から小江戸巡回バス（西武川越パス利用可）'} },
  tokinokane:{ name:{th:'หอระฆังโทคิโนะคาเนะ',ja:'時の鐘'}, ro:'Toki no Kane', area:{th:'คาวาโกเอะ',ja:'川越'}, art:'street', dur:45, gps:'35.92500, 139.48580',
    hi:{th:['สัญลักษณ์ของเมือง หอระฆังไม้สูง 16 ม.','ถนนคุราซึคุริ บ้านโกดังดินแบบเอโดะ เหมือนหลุดมาในอนิเมะ'],ja:['川越のシンボル、高さ16mの鐘楼','蔵造りの町並み']},
    miss:{th:['ระฆังดังตอน 6:00, 12:00, 15:00, 18:00','สตาร์บัคส์สไตล์ญี่ปุ่นโบราณอยู่ใกล้ๆ'],ja:['6時・12時・15時・18時に鐘が鳴る','近くの和風スターバックス']},
    transit:{th:'เดินจากคาชิยะโยโกโจ 5 นาที',ja:'菓子屋横丁から徒歩5分'} },
  hikawa:{ name:{th:'ศาลเจ้าคาวาโกเอะฮิคาวะ',ja:'川越氷川神社'}, ro:'Kawagoe Hikawa Jinja', area:{th:'คาวาโกเอะ',ja:'川越'}, art:'shrine', dur:60, gps:'35.92640, 139.48800',
    hi:{th:['ศาลเจ้าสายมูเรื่องความรัก อายุกว่า 1,500 ปี','อุโมงค์กระดิ่งลม (หน้าร้อน) สวยฉ่ำ'],ja:['縁結びで有名、1500年の歴史','夏の縁むすび風鈴']},
    miss:{th:['ตกปลากระดาษเสี่ยงทาย ไอไท-มิคุจิ','ช่องขายเครื่องรางปิดเร็วกว่าศาลเจ้า'],ja:['鯛みくじ（あい鯛・一年安鯛）','お守り授与所は早めに閉まる']},
    transit:{th:'เดินจากหอระฆังประมาณ 12 นาที',ja:'時の鐘から徒歩約12分'} },
  chureito:{ name:{th:'เจดีย์ชูเรโตะ',ja:'忠霊塔'}, ro:'Chūreitō', area:{th:'ฟูจิโยชิดะ',ja:'富士吉田'}, art:'fuji', dur:90, gps:'35.50108, 138.80190',
    hi:{th:['มุมโปสการ์ด ฟูจิคู่เจดีย์ห้าชั้น','ใบไม้แดงช่วงกลาง–ปลาย พ.ย.'],ja:['富士山と五重塔の絶景','11月中旬〜下旬は紅葉']},
    miss:{th:['บันได 398 ขั้น ขาสั่นแน่นอน เผื่อเวลา 15–20 นาที','มาก่อน 9 โมง ฟูจิชัดสุด บ่ายๆ เมฆชอบมาบัง'],ja:['398段の階段、15〜20分見ておく','朝9時前が一番クリア']},
    transit:{th:'รถไฟ Fujikyu ลงสถานี Shimoyoshida เดิน 10 นาที · รถเช่าจอดลานจอดอาราคุระยามะ',ja:'富士急行線「下吉田駅」から徒歩10分／車：新倉山浅間公園駐車場'} },
  oishi:{ name:{th:'สวนโออิชิ ทะเลสาบคาวากุจิโกะ',ja:'大石公園'}, ro:'Ōishi Kōen', area:{th:'คาวากุจิโกะ',ja:'河口湖'}, art:'lake', dur:60, gps:'35.52220, 138.74420',
    hi:{th:['ฟูจิสะท้อนน้ำ ฟินแบบไม่ต้องแต่งรูป','ทุ่งโคเคียแดงฟูๆ ต้น–กลาง พ.ย.'],ja:['湖に映る逆さ富士','11月上旬〜中旬は真っ赤なコキア']},
    miss:{th:['ซอฟต์ครีมบลูเบอร์รี่ ห้ามพลาด','ลมริมทะเลสาบแรงมาก พกเสื้อกันลม'],ja:['ブルーベリーソフトクリーム','湖畔は風が強いので上着を']},
    transit:{th:'รถบัส Kawaguchiko Sightseeing (Red Line) ลงป้าย Natural Living Center',ja:'河口湖周遊バス（レッドライン）「河口湖自然生活館」下車'} },
  oshino:{ name:{th:'หมู่บ้านโอชิโนะฮักไก',ja:'忍野八海'}, ro:'Oshino Hakkai', area:{th:'โอชิโนะ',ja:'忍野'}, art:'water', dur:60, gps:'35.46030, 138.83280',
    hi:{th:['บ่อน้ำผุดจากหิมะฟูจิ ใสจนเห็นก้นบ่อ','บ้านหลังคามุงจากแบบดั้งเดิม'],ja:['富士山の雪解け水が湧く透明な池','茅葺き屋根の古民家']},
    miss:{th:['คุสะโมจิย่าง กับเต้าหู้น้ำแร่','11:00–14:00 คนแน่น มาเช้าดีกว่า'],ja:['焼き草餅と湧水豆腐','11〜14時は混雑、朝がおすすめ']},
    transit:{th:'รถบัส Fujikyu จากสถานี Fujisan ราว 20 นาที ลงป้าย Oshino Hakkai',ja:'富士山駅から富士急バスで約20分「忍野八海」下車'} },
  gyoen:{ name:{th:'สวนชินจูกุเกียวเอ็น',ja:'新宿御苑'}, ro:'Shinjuku Gyoen', area:{th:'ชินจูกุ',ja:'新宿'}, art:'park', dur:90, gps:'35.68518, 139.71005',
    hi:{th:['สวนใหญ่กลางเมือง ใบไม้เปลี่ยนสีปลาย พ.ย.','มีทั้งสวนญี่ปุ่น อังกฤษ ฝรั่งเศส ในที่เดียว'],ja:['都心の広大な庭園、11月下旬の紅葉が見事','日本庭園・イギリス風景式・フランス式庭園']},
    miss:{th:['ห้ามพกแอลกอฮอล์เข้า','ค่าเข้า ¥500 ปิดวันจันทร์'],ja:['酒類の持ち込み禁止','入園料¥500、月曜休園']},
    transit:{th:'Marunouchi Line ลงสถานี Shinjuku-gyoemmae เดิน 5 นาที',ja:'丸ノ内線「新宿御苑前駅」から徒歩5分'} },
  omoide:{ name:{th:'ซอยโอโมอิเดะโยโกโจ',ja:'思い出横丁'}, ro:'Omoide Yokochō', area:{th:'ชินจูกุ',ja:'新宿'}, art:'street', dur:60, gps:'35.69310, 139.69910',
    hi:{th:['ซอยยากิโทริเล็กๆ บรรยากาศโชวะ','ควันปิ้งย่างฟุ้ง ฟีลหนังญี่ปุ่นยุคเก่า'],ja:['昭和の雰囲気が残る焼き鳥横丁','煙もくもくのレトロな路地']},
    miss:{th:['ร้านจิ๋วมาก ไปกันหลายคนอาจต้องแยกนั่ง','บางร้านมีค่าโอโทชิ (กับแกล้มบังคับ)'],ja:['店が狭いので大人数は分かれて座ることも','お通し代がかかる店あり']},
    transit:{th:'สถานี Shinjuku ทางออกตะวันตก เดิน 2 นาที',ja:'JR新宿駅西口から徒歩2分'} },
  shibuyasky:{ name:{th:'ชิบูย่าสกาย',ja:'渋谷スカイ'}, ro:'Shibuya Sky', area:{th:'ชิบูย่า',ja:'渋谷'}, art:'city', dur:75, gps:'35.65850, 139.70210',
    hi:{th:['ดาดฟ้าสูง 229 ม. วิว 360° แบบไม่มีกระจกกั้น','มองลงไปเห็นแยกชิบูย่าคนข้ามยั้วเยี้ย'],ja:['地上229mの屋上展望、360°のパノラマ','スクランブル交差点を真上から']},
    miss:{th:['รอบพระอาทิตย์ตกเต็มไว จองล่วงหน้า!','ห้ามถือกระเป๋า/หมวกขึ้นดาดฟ้า มีล็อกเกอร์ให้'],ja:['夕日の時間帯は早めに予約を','屋上は手荷物・帽子NG、ロッカーあり']},
    transit:{th:'อยู่บนตึก Shibuya Scramble Square ติดสถานี Shibuya',ja:'渋谷駅直結「渋谷スクランブルスクエア」'} },
};

/* ข้อมูลตั้งต้น (ตัวอย่าง) — ผู้ใช้แก้ไขได้ทั้งหมด และถูกเก็บใน localStorage */
const SEED = {
  v: 1,
  lang: 'th',
  displayCur: 'THB',
  budget: { amount: 180000, cur: 'JPY' },
  customPlaces: {},
  trip: { name:{th:'โตเกียว & ฟูจิ', ja:'東京と富士山'}, start:'2026-11-09', people:3 },
  days: [
    { title:{th:'ถึงโตเกียว · อาซากุสะ',ja:'東京到着・浅草'}, mode:'transit', start:'15:00', back:35,
      stops:[{id:'sensoji', leg:45}] },
    { title:{th:'คาวาโกเอะ เมืองเอโดะน้อย',ja:'小江戸・川越'}, mode:'transit', start:'09:00', back:60,
      stops:[{id:'kashiya', leg:60}, {id:'tokinokane', leg:5}, {id:'hikawa', leg:60, note:{th:'แวะกินปลาไหลย่าง แล้วเดิน 12 นาที',ja:'うなぎランチ→徒歩12分'}}] },
    { title:{th:'ขับรถเที่ยวรอบฟูจิ',ja:'富士山ドライブ'}, mode:'car', start:'07:00', back:110,
      stops:[{id:'chureito', leg:110}, {id:'oishi', leg:20}, {id:'oshino', leg:25}] },
    { title:{th:'ชินจูกุ · ช้อปกระจาย',ja:'新宿でショッピング'}, mode:'transit', start:'10:00', back:20, stops:[] },
    { title:{th:'บ๊ายบายญี่ปุ่น',ja:'さよなら日本'}, mode:'transit', start:'09:00', back:0, stops:[],
      note:{th:'เที่ยวบิน 16:30 · ออกจากโรงแรมเที่ยง',ja:'16:30発のフライト・正午にホテル出発'} },
  ],
  hotels: [
    { id:'h1', name:'Hotel Gracery Shinjuku', address:'1-19-1 Kabukicho, Shinjuku, Tokyo', gps:'35.69480, 139.70160', checkin:'2026-11-09', checkout:'2026-11-13' },
  ],
  restaurants: [
    { id:'r1', name:'Ichinoya ปลาไหลย่างคาวาโกเอะ', nameJa:'いちのや', area:'คาวาโกเอะ', meal:'lunch', day:2, address:'1-18-10 Matsuecho, Kawagoe', gps:'35.92120, 139.48560', note:'ร้านปลาไหลเก่าแก่ตั้งแต่ปี 1832' },
    { id:'r2', name:'Fuunji ซึเคเมนชินจูกุ', nameJa:'風雲児', area:'ชินจูกุ', meal:'dinner', day:4, address:'2-14-3 Yoyogi, Shibuya', gps:'35.68720, 139.69750', note:'คิวยาวแต่หมุนไว แนะนำซึเคเมนไข่ต้ม' },
  ],
  expenses: [
    { id:'e1', day:0, cat:'stay',      title:'Hotel Gracery Shinjuku (4 คืน)', amount:32800, cur:'JPY' },
    { id:'e2', day:2, cat:'transport', title:'Seibu Kawagoe Pass × 3', amount:2100, cur:'JPY' },
    { id:'e3', day:2, cat:'food',      title:'ปลาไหลย่าง Ichinoya', amount:10800, cur:'JPY' },
    { id:'e4', day:0, cat:'other',     title:'ซิมเน็ตญี่ปุ่น 8 วัน', amount:399, cur:'THB' },
  ],
};
