// The seven-station journey round the island, and everything the teacher fills in later.
// Edit this file only: leave a value empty ('' or []) and the page shows 「待老師提供」 instead of inventing anything.
// Links open outside pages (forms, messaging apps); this site never sends a message or collects personal data itself.

export const STATIONS=[
 {id:'start',n:'①',title:'為何高中一定要學國寫？',short:'為何高中一定要學國寫？',
  lead:'旅程從這裡出發，先想清楚兩件事：第一，為什麼高中一定要學國寫？第二，為什麼要選擇我、選擇這堂課？',
  // The two themes of the start, each with the teacher's own answer. Empty answer → 待老師提供.
  themes:[
   {q:'為什麼高中一定要學國寫？',label:'主題一 · 作文',body:'',document:'writing'},
   {q:'為什麼要選擇我？為什麼要選擇這堂課？',label:'主題二 · 選擇',body:''}],
  next:'fork',nextLabel:'走到入口指引牌'},
 {id:'fork',n:'②',title:'入口指引牌：選哪一條路？',short:'指引牌',
  lead:'寫出高分作文的路不只一條。這座橋呈現的是我經過驗證「有效」且「高效」的學習路徑；另一側呈現大多學生學習作文遇到的誤區。',
  // Shown right under the lead: how to read the two sides.
  view:'站在入口往前看：左邊的橋是有方向的練習，右邊是容易繞遠的練習。導覽員可以帶你去看看右邊的誤區。',
  // The bridge (one way the teacher offers — not the only one), then short metaphor captions for the pitfalls on the other side
  // (editable). They describe ways of practising, not any teacher or school.
  right:{name:'走上橋',caption:'我經過驗證有效且高效的學習路徑：照著指引一步一步走，方向清楚；每個人的速度仍不一樣。',ends:'其中一條路'},
  paths:[
   {id:'cliff',stop:'pass1',name:'第一座懸崖',title:'沒有固定架構',caption:'寫作缺少固定架構，面對新題目時，容易不知道如何組織想法與安排段落。',body:'固定架構是幫助自己整理思考的支架，不是每一道題目都套用同一份模板。先有穩定的組織方式，再依題目調整內容。',ends:'沒有架構，容易失去方向'},
   {id:'cliff2',stop:'pass2',name:'第二座懸崖',title:'批改沒有遵循最小修改原則',caption:'批改過度聚焦用字遣詞、語句等細節，卻沒有優先處理影響整篇文章的關鍵問題。',body:'最小修改原則：先找出最關鍵的問題，用最少且必要的修改改善文章，再處理用字遣詞與語句等細節，讓學生知道這次最需要改的是什麼。',ends:'只改細節，看不見關鍵問題'},
   {id:'wall',stop:'wallfoot',name:'陡峭山壁',caption:'方法不對，但真的很努力：攀著繩子一點一點往上爬，還是有機會爬到獎盃；只是很慢，爬一爬還可能掉下來。',ends:'爬得到，但很辛苦'}],
  rough:'沒有護欄的棧道翻過兩座懸崖，有人會在懸崖邊掉下去；走到盡頭，還要攀繩爬上陡峭山壁。也有人走到第一座懸崖前發現不對，回頭改走橋——方法隨時可以調整。',
  next:'bridge',nextLabel:'照著指引，走上橋'},
 {id:'bridge',n:'③',title:'走上橋，通往獎盃',short:'橋',
  lead:'這是我能陪你走的一條路。',
  note:'有方向地練習，比摸索著爬陡峭山壁順得多；路還是要自己一步一步走。',
  body:'',
  next:'university',nextLabel:'看學生回饋'},
 {id:'university',n:'④',title:'學生回饋',short:'學生回饋',
  lead:'走過獎盃，學生走進大學。點開來看看學生寫下的回饋。',
  next:'calendar',nextLabel:'走樓梯下到課程行事曆'},
 {id:'calendar',n:'⑤',title:'課程教學行事曆',short:'行事曆',
  lead:'先看116學測班的教學行事曆，了解課程安排；開班、插班與報名狀態，請再向老師確認。',document:'calendar',
  next:'signup',nextLabel:'前往試聽＆報名'},
 {id:'signup',n:'⑥',title:'試聽＆報名',short:'試聽＆報名',
  lead:'在露天講堂認識課堂；準備好了，就從這裡了解試聽與報名。',
  next:'contact',nextLabel:'到服務台'},
 {id:'contact',n:'⑦',title:'服務台',short:'服務台',
  lead:'有問題就到服務台：用你習慣的方式找到我。',
  next:null}
];

// ④ Student feedback, word for word, only with the student's consent to publish it. Each one:
//   {text:'學生的原話……', school:'景美女中', name:'黃同學', consent:true}
// The signature reads 「景美女中 黃同學」. An item without consent:true (or without text) is never shown — not on ④, and not in
// the paper-plane letters floating over the islands. Line breaks in text are kept.
export const FEEDBACK=[];
export const feedbackSignature=f=>[f.school,f.name].map(s=>typeof s==='string'?s.trim():'').filter(Boolean).join(' ')||(typeof f.who==='string'?f.who.trim():'');
export function publicFeedback(list=FEEDBACK){return list.filter(f=>f&&f.consent===true&&typeof f.text==='string'&&f.text.trim());}

// ⑤ Open classes by grade. status 'open' (有開班，可報名) or 'preregister' (年紀還小，只開放預先登記).
// e.g. {grade:'高一',status:'open',schedule:'每週六 10:00–12:00',start:'2027/2/15',note:''}
export const CLASSES=[];

// ⑤ Fees and arrangements, asked on the calendar island. Fill in prices and rules when they are public; until then only the questions show.
export const PRICING={
 questions:['費用：每堂、每期或其他方式計費？包含哪些服務？','安排：上課多久、多久一次、線上或實體、個別或團體？','規則：試上、請假、補課、取消與退費如何處理？'],
 facts:[]        // e.g. ['每期費用','NT$ ……（含批改）']
};

// ⑤⑥⑦ Links. Each is a full https:// address; empty → the button shows 「連結待老師提供」.
export const LINKS={
 preregister:'',   // 預先登記表單
 signup:'',        // 報名表單
 videoDM:''        // 私訊索取線上教學視聽（例如 LINE 官方帳號或 Instagram 私訊連結）
};

// ⑦ Contact methods to show. e.g. {label:'LINE 官方帳號',value:'@xxxx',href:'https://lin.ee/...'}
export const CONTACTS=[
 {label:'LINE',value:'透過 LINE 聯繫我',href:'https://line.me/ti/p/2rcgyFdA-b'},
 {label:'Facebook',value:'0kh127',href:'https://www.facebook.com/0kh127'},
 {label:'Threads',value:'@0kh127',href:'https://www.threads.com/@0kh127'},
 {label:'Instagram',value:'@0kh127',href:'https://www.instagram.com/0kh127'},
 {label:'Google Classroom',value:'第一手課程資訊與寫作學習文章',href:'https://classroom.google.com/',note:'加入班級需要邀請碼，可以先用 LINE 向老師索取。'}
];

// Public source files stay on Drive; replacing the same file version keeps the embedded URL current.
export const DOCUMENTS={
 writing:{title:'為何高中一定要學國寫？',driveId:'1s5ue0r9_nz0S_q2fAsaL6fL42LLv-7GV'},
 calendar:{title:'116學測班｜教學行事曆',driveId:'1Dm7ROkMDJCHvWmUANFYB5VdzL1mi8RCD'}
};
export function documentURLs(key){if(!Object.hasOwn(DOCUMENTS,key))return null;const d=DOCUMENTS[key];if(typeof d.driveId!=='string'||!/^[-\w]+$/.test(d.driveId))return null;const base='https://drive.google.com/file/d/'+d.driveId;return {view:base+'/view',preview:base+'/preview'};}

export const isLink=s=>typeof s==='string'&&/^https:\/\//.test(s);

// ⑥ In-site videos — only clips the teacher chooses to make public (e.g. a short look at a class). Fill one of:
//   driveId: a Google Drive file id (the video plays in Drive's own player), or
//   hd / sd: full https:// addresses of .mp4 files (sd is the lighter fallback when hd cannot play).
// Leave everything empty and the card shows 「待老師提供」 instead.
export const VIDEOS={
 trial:{title:'課堂片段',driveId:'',hd:'',sd:''}
};
export function videoSource(key){if(!Object.hasOwn(VIDEOS,key))return null;const v=VIDEOS[key];
 if(typeof v.driveId==='string'&&/^[-\w]{10,}$/.test(v.driveId))return {kind:'drive',title:v.title,preview:'https://drive.google.com/file/d/'+v.driveId+'/preview',view:'https://drive.google.com/file/d/'+v.driveId+'/view'};
 const files=[v.hd,v.sd].filter(u=>isLink(u)&&/\.mp4(\?|#|$)/i.test(u));
 return files.length?{kind:'file',title:v.title,files,view:files[0]}:null;}
