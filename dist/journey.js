// The seven-station journey round the island, and everything the teacher fills in later.
// Edit this file only: leave a value empty ('' or []) and the page shows 「待老師提供」 instead of inventing anything.
// Links open outside pages (forms, messaging apps); this site never sends a message or collects personal data itself.

export const STATIONS=[
 {id:'start',n:'①',title:'從這裡出發：先想清楚兩件事',short:'起點',
  lead:'起點有兩個主題：第一，為什麼高中一定要學國寫？第二，為什麼要選擇我、選擇這堂課？',
  // The two themes of the start, each with the teacher's own answer. Empty answer → 待老師提供.
  themes:[
   {q:'為什麼高中一定要學國寫？',label:'主題一 · 作文',body:'',document:'writing'},
   {q:'為什麼要選擇我？為什麼要選擇這堂課？',label:'主題二 · 選擇',body:''}],
  next:'fork',nextLabel:'走到入口指引牌'},
 {id:'fork',n:'②',title:'入口指引牌：選哪一條路？',short:'指引牌',
  lead:'像登山步道入口的指引牌：照著指引走上橋，路最順。另一條是險峻的路，要翻山越嶺；走錯了，就會難以接近目標。導覽員可以帶你先去看看錯的路。',
  // The right way, then short metaphor captions for the three wrong ways (editable). They describe ways of practising, not any teacher or school.
  right:{name:'走上橋',caption:'照著指引，一路順順地走到獎盃。',ends:'對的路'},
  paths:[
   {id:'cliff',name:'懸崖',caption:'只靠背範文、套模板，或埋頭寫卻沒人告訴你哪裡要改，遇到新題目就踩空。',ends:'一不小心就掉下去'},
   {id:'wall',name:'陡峭山壁',caption:'方法不對，但真的很努力：攀著繩子一點一點往上爬，還是有機會爬到獎盃；只是很慢，爬一爬還可能掉下來。',ends:'爬得到，但很辛苦'}],
  rough:'險峻的路：沒有護欄的棧道翻過兩座懸崖，有人會在懸崖邊掉下去；走到盡頭，還要攀繩爬上陡峭山壁。',
  next:'bridge',nextLabel:'照著指引，走上橋'},
 {id:'bridge',n:'③',title:'走上橋，通往獎盃',short:'橋',
  lead:'我能引導你走向正確的路。',
  note:'照著指引走上橋，比自己爬陡峭山壁順得多，也不會半路掉下來。',
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

// ④ Student feedback, word for word, only with the student's consent. e.g. {text:'……',who:'高二學生'}
export const FEEDBACK=[];

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
 {label:'Google Classroom',value:'第一手課程資訊與寫作學習文章',href:'https://classroom.google.com/',note:'需登入 Google；目前連到 Classroom 首頁，加入班級請向老師索取邀請。'}
];

// Public source files stay on Drive; replacing the same file version keeps the embedded URL current.
export const DOCUMENTS={
 writing:{title:'為何高中一定要學國寫？',driveId:'1s5ue0r9_nz0S_q2fAsaL6fL42LLv-7GV'},
 calendar:{title:'116學測班｜教學行事曆',driveId:'1Dm7ROkMDJCHvWmUANFYB5VdzL1mi8RCD'}
};
export function documentURLs(key){if(!Object.hasOwn(DOCUMENTS,key))return null;const d=DOCUMENTS[key];if(typeof d.driveId!=='string'||!/^[-\w]+$/.test(d.driveId))return null;const base='https://drive.google.com/file/d/'+d.driveId;return {view:base+'/view',preview:base+'/preview'};}

export const isLink=s=>typeof s==='string'&&/^https:\/\//.test(s);
