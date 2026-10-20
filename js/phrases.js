/* Tabi Note — ประโยคญี่ปุ่นที่ใช้บ่อย แบ่งหมวด
 * {place} = ช่องเติมชื่อสถานที่ (ผู้ใช้เลือกได้) · {n} = จำนวนคนในทริป (เติมอัตโนมัติ)
 * ทุกประโยคต้องมี th / ja / ro และใช้ช่องเติมให้ตรงกันทั้ง 3 ภาษา (ตรวจโดย tests/check.js)
 */
'use strict';

const PHRASE_CATS = [
  { k:'general',   ic:'smile' },
  { k:'travel',    ic:'train' },
  { k:'food',      ic:'food'  },
  { k:'shop',      ic:'bag'   },
  { k:'stay',      ic:'hotel' },
  { k:'emergency', ic:'sos'   },
];

const PHRASES = [
  // ทั่วไป
  { cat:'general', th:'สวัสดี', ja:'こんにちは', ro:'Konnichiwa' },
  { cat:'general', th:'ขอบคุณมาก', ja:'ありがとうございます', ro:'Arigatō gozaimasu' },
  { cat:'general', th:'ขอโทษนะ / ขอทางหน่อย', ja:'すみません', ro:'Sumimasen' },
  { cat:'general', th:'ห้องน้ำอยู่ที่ไหน', ja:'トイレはどこですか？', ro:'Toire wa doko desu ka?' },
  { cat:'general', th:'พูดภาษาอังกฤษได้ไหม', ja:'英語を話せますか？', ro:'Eigo o hanasemasu ka?' },
  { cat:'general', th:'ไม่เข้าใจ', ja:'わかりません', ro:'Wakarimasen' },
  { cat:'general', th:'ถ่ายรูปได้ไหม', ja:'写真を撮ってもいいですか？', ro:'Shashin o totte mo ii desu ka?' },
  { cat:'general', th:'ช่วยถ่ายรูปให้หน่อยได้ไหม', ja:'写真を撮っていただけますか？', ro:'Shashin o totte itadakemasu ka?' },

  // เดินทาง
  { cat:'travel', id:'how_go', fill:'place', th:'จะไป {place} ต้องไปยังไง', ja:'{place}へはどうやって行けばいいですか？', ro:'{place} e wa dō yatte ikeba ii desu ka?' },
  { cat:'travel', id:'want_go', fill:'place', th:'อยากไป {place}', ja:'{place}に行きたいです', ro:'{place} ni ikitai desu' },
  { cat:'travel', fill:'place', th:'ช่วยไปส่งที่ {place} หน่อย (แท็กซี่)', ja:'{place}までお願いします', ro:'{place} made onegaishimasu' },
  { cat:'travel', th:'ป้ายรถเมล์อยู่ที่ไหน', ja:'バス停はどこですか？', ro:'Basutei wa doko desu ka?' },
  { cat:'travel', th:'สถานีรถไฟอยู่ที่ไหน', ja:'駅はどこですか？', ro:'Eki wa doko desu ka?' },
  { cat:'travel', fill:'place', th:'รถคันนี้ไป {place} ไหม', ja:'これは{place}に行きますか？', ro:'Kore wa {place} ni ikimasu ka?' },
  { cat:'travel', th:'ต้องขึ้นชานชาลาไหน', ja:'何番線ですか？', ro:'Nanbansen desu ka?' },
  { cat:'travel', th:'ใช้เวลากี่นาที', ja:'何分かかりますか？', ro:'Nanpun kakarimasu ka?' },
  { cat:'travel', th:'เติมน้ำมันเรกูลาร์เต็มถัง', ja:'レギュラー満タンでお願いします', ro:'Regyurā mantan de onegaishimasu' },
  { cat:'travel', th:'จอดรถตรงนี้ได้ไหม', ja:'ここに車を停めてもいいですか？', ro:'Koko ni kuruma o tomete mo ii desu ka?' },

  // อาหาร
  { cat:'food', fill:'people', th:'มา {n} คน', ja:'{n}人です', ro:'{n}-nin desu' },
  { cat:'food', th:'ขอเมนูหน่อย', ja:'メニューをください', ro:'Menyū o kudasai' },
  { cat:'food', th:'มีเมนูภาษาอังกฤษไหม', ja:'英語のメニューはありますか？', ro:'Eigo no menyū wa arimasu ka?' },
  { cat:'food', th:'เอาอันนี้', ja:'これをください', ro:'Kore o kudasai' },
  { cat:'food', th:'เมนูแนะนำคืออะไร', ja:'おすすめは何ですか？', ro:'Osusume wa nan desu ka?' },
  { cat:'food', th:'ขอน้ำเปล่า', ja:'お水をください', ro:'Omizu o kudasai' },
  { cat:'food', th:'ไม่กินหมู', ja:'豚肉は食べられません', ro:'Butaniku wa taberaremasen' },
  { cat:'food', th:'แพ้กุ้ง', ja:'エビのアレルギーがあります', ro:'Ebi no arerugī ga arimasu' },
  { cat:'food', th:'ค่าอาหารทั้งหมดเท่าไหร่', ja:'お会計はいくらですか？', ro:'Okaikei wa ikura desu ka?' },
  { cat:'food', th:'เช็คบิลด้วย', ja:'お会計お願いします', ro:'Okaikei onegaishimasu' },
  { cat:'food', th:'อร่อยมาก!', ja:'とても美味しいです！', ro:'Totemo oishii desu!' },

  // ซื้อของ
  { cat:'shop', th:'อันนี้ราคาเท่าไหร่', ja:'これはいくらですか？', ro:'Kore wa ikura desu ka?' },
  { cat:'shop', th:'ใช้บัตรเครดิตได้ไหม', ja:'カードは使えますか？', ro:'Kādo wa tsukaemasu ka?' },
  { cat:'shop', th:'ขอแบบปลอดภาษี (Tax free) ได้ไหม', ja:'免税できますか？', ro:'Menzei dekimasu ka?' },
  { cat:'shop', th:'มีไซซ์อื่นไหม', ja:'他のサイズはありますか？', ro:'Hoka no saizu wa arimasu ka?' },
  { cat:'shop', th:'ขอลองได้ไหม', ja:'試着してもいいですか？', ro:'Shichaku shite mo ii desu ka?' },
  { cat:'shop', th:'ไม่รับถุงนะ', ja:'袋はいりません', ro:'Fukuro wa irimasen' },
  { cat:'shop', th:'แค่ดูเฉยๆ', ja:'見ているだけです', ro:'Mite iru dake desu' },

  // ที่พัก
  { cat:'stay', th:'ขอเช็คอิน', ja:'チェックインをお願いします', ro:'Chekkuin o onegaishimasu' },
  { cat:'stay', th:'ฝากกระเป๋าได้ไหม', ja:'荷物を預かってもらえますか？', ro:'Nimotsu o azukatte moraemasu ka?' },
  { cat:'stay', th:'รหัส Wi-Fi คืออะไร', ja:'Wi-Fiのパスワードは何ですか？', ro:'Waifai no pasuwādo wa nan desu ka?' },
  { cat:'stay', th:'เช็คเอาท์กี่โมง', ja:'チェックアウトは何時ですか？', ro:'Chekkuauto wa nanji desu ka?' },
  { cat:'stay', th:'ช่วยเรียกแท็กซี่ให้หน่อย', ja:'タクシーを呼んでいただけますか？', ro:'Takushī o yonde itadakemasu ka?' },

  // ฉุกเฉิน
  { cat:'emergency', th:'ช่วยด้วย!', ja:'助けて！', ro:'Tasukete!' },
  { cat:'emergency', th:'ช่วยเรียกรถพยาบาลหน่อย', ja:'救急車を呼んでください', ro:'Kyūkyūsha o yonde kudasai' },
  { cat:'emergency', th:'โรงพยาบาลอยู่ที่ไหน', ja:'病院はどこですか？', ro:'Byōin wa doko desu ka?' },
  { cat:'emergency', th:'รู้สึกไม่สบาย', ja:'気分が悪いです', ro:'Kibun ga warui desu' },
  { cat:'emergency', th:'กระเป๋าเงินหาย', ja:'財布をなくしました', ro:'Saifu o nakushimashita' },
  { cat:'emergency', th:'หลงทาง', ja:'道に迷いました', ro:'Michi ni mayoimashita' },
  { cat:'emergency', id:'embassy', th:'ช่วยติดต่อสถานทูตไทยให้หน่อย', ja:'タイ大使館に連絡してください', ro:'Tai taishikan ni renraku shite kudasai' },
];
