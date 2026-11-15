// The seven-station journey round the island, and everything the teacher fills in later.
// Edit this file only: leave a value empty ('' or []) and the page shows 「待老師提供」 instead of inventing anything.
// Links open outside pages (forms, messaging apps); this site never sends a message or collects personal data itself.

export const STATIONS=[
 {id:'start',n:'①',title:'為什麼高中一定要學國寫？',short:'起點',
  lead:'整座島從這個問題開始。',
  body:'',                       // The teacher's own answer to the question. Empty → 待老師提供.
  next:'fork',nextLabel:'走到入口指引牌'},
 {id:'fork',n:'②',title:'入口指引牌：三條路',short:'指引牌',
  lead:'像登山步道入口的指引牌：照著指引走上橋，路最順。走錯了，就會難以接近目標。',
  // The right way, then short metaphor captions for the three wrong ways (editable). They describe ways of practising, not any teacher or school.
  right:{name:'走上橋',caption:'照著指引，一路順順地走到獎盃。',ends:'對的路'},
  paths:[
   {id:'lava',name:'岩漿洞',caption:'埋頭寫了很多，卻沒有人告訴你哪裡要改。',ends:'走進去就出不來'},
   {id:'cliff',name:'懸崖',caption:'只靠背範文、套模板，遇到新題目就踩空。',ends:'走到盡頭會掉下去'},
   {id:'wall',name:'陡峭山壁',caption:'方法不對，但真的很努力，還是有機會爬到獎盃；只是爬得很慢，爬一爬還可能掉下來。',ends:'爬得到，但很辛苦'}],
  next:'bridge',nextLabel:'照著指引，走上橋'},
 {id:'bridge',n:'③',title:'走上橋，通往獎盃',short:'橋',
  lead:'我能引導你走向正確的路。',
  note:'照著指引走上橋，比自己爬陡峭山壁順得多，也不會半路掉下來。',
  body:'',
  next:'university',nextLabel:'看學生回饋'},
 {id:'university',n:'④',title:'學生回饋',short:'學生回饋',
  lead:'走過獎盃，學生走進大學。點開來看看學生寫下的回饋。',
  next:'calendar',nextLabel:'看最新的課程行事曆'},
 {id:'calendar',n:'⑤',title:'課程教學行事曆',short:'行事曆',
  lead:'不同年級各自安排。有開班的年級可以接著報名；年紀還小的，可以先預先登記。',
  next:'signup',nextLabel:'前往報名'},
 {id:'signup',n:'⑥',title:'索取教學視聽・報名',short:'報名',
  lead:'想先看看線上教學的樣子，或已經準備好報名，從這裡開始。',
  next:'contact',nextLabel:'其他聯繫方式'},
 {id:'contact',n:'⑦',title:'聯繫我',short:'聯繫',
  lead:'用你習慣的方式找到我。',
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
export const CONTACTS=[];

export const isLink=s=>typeof s==='string'&&/^https:\/\//.test(s);
