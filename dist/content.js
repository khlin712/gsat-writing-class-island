// Course introduction draft: factual teacher details remain unfilled until supplied.
export const topics = [
 {id:'teacher',n:'01',title:'認識老師',tag:'認識教學',color:'#dcb26e',x:378,y:423,kind:'school',intro:'先認識教你的人，再了解這堂課。',body:'你可以在這裡了解老師的教學經歷、帶過的學生與累積的方法，判斷這些經驗是否貼近自己的需求。教師姓名、經歷與年資尚待本人提供。',steps:['教學經歷：帶過哪些年級、考試與程度的學生？','教學經驗：曾遇過什麼困難，如何調整教法？','課程對象：哪些學生適合，哪些需求需要另行討論？'],facts:[['教師介紹','尚待提供'],['授課年資與經歷','尚待提供可公開資料'],['適合對象','尚待確認年級、考試與程度']],task:'你最想先了解老師哪一部分的經歷？',example:'例如：老師是否帶過和我程度、目標相近的學生？',links:['teaching','questions','stories'],question:'我想了解你的教學經歷，以及是否帶過與我需求相近的學生。'},
 {id:'teaching',n:'02',title:'教學理念與上課方式',tag:'認識教學',color:'#92b5a2',x:265,y:284,kind:'tower',intro:'你為什麼這樣教？一堂課實際怎麼進行？',body:'這座島說明「萬能考場作文：理論與實作」背後的教學主張，以及理念如何落在一堂課的課前、課中、課後。以下是介紹架構，正式理念、流程、頻率與服務範圍由老師親自補充。',steps:['核心主張：你認為作文最重要的是什麼？','教學選擇：為什麼採取這些方法，而不是其他做法？','課前：如何了解學生的程度、目標與困難？','課中：理論如何配合示範、討論與實作？','課後：如何批改、回饋、追蹤與安排下一步？'],facts:[['核心教學主張','待老師以自己的話說明'],['一堂課的流程','待補實際上課步驟'],['練習與作業量','待補頻率與預估用時'],['批改與回饋方式','學生寫完作文後線上傳給老師批改，老師改完再傳回去；學生依批改內容優化下一次的寫作。（服務範圍待補）'],['提問','學習上遇到問題，不限時間都可以問']],
  // The teacher's own account of how the teaching works, in their words. Shown on the card and acted out on the island by the
  // sheet of paper that goes round the ring path (see loop.js). `steps` are in order; revise returns to the writing step.
  flow:{title:'我的授課模式',intro:'我會製作教材。學生看完教學後，寫作文，然後線上傳給我批改；我改完之後會傳回去，學生基於批改內容，來優化下一次的寫作內容。',
   steps:[['製作教材','我會製作教材'],['看教學','學生看完教學'],['寫作文','寫作文'],['線上傳給老師','線上傳給我批改'],['老師批改後傳回','我改完之後會傳回去']],
   revise:['優化下一次寫作','學生基於批改內容，來優化下一次的寫作內容'],
   always:'當學生遇到學習上的問題，不限時間都可以問。',
   note:'島上的稿紙會照這個順序繞一圈。紙上的紅筆記號每繞一圈就少一點，只代表要修正的地方越來越少，不是分數。'},task:'選作文課時，你最重視哪一項教學原則，或最想看見哪一段上課過程？',example:'例如：能否用一個實際題目，展示老師如何從討論帶到寫作與修改？',links:['teacher','questions','stories'],question:'我想了解你的教學理念，以及一堂課的課前、課中、課後如何安排。'},
 {id:'questions',n:'03',title:'家長與學生的疑問',tag:'疑問與解法',color:'#b6abc3',x:490,y:284,kind:'pavilion',intro:'適不適合？跟得上嗎？把心裡的疑問說出來。',body:'家長可以從適合程度、課業負擔與如何看見進步開始提問；學生可以直接說出對作文課的期待與擔心。這裡列的是常見疑問，老師的正式回應、方案與可提供的服務仍待補充；尚未提供的服務不視為課程承諾。',steps:['適合程度：基礎不同，教學會如何安排？','時間負擔：作業需要多久？與學校課業如何配合？','學習起點：完全沒頭緒或想突破，都如何開始？','課堂感受：提問、討論與練習會怎麼進行？','卡住時：跟不上或不敢發問，能得到什麼協助？','下一步：還缺哪些資訊，再一起判斷是否適合？'],facts:[['家長與學生疑問的正式回應','待老師逐題補充'],['可對照的資訊','教學理念與上課方式、學生案例與成果、課程行事曆']],task:'你目前最擔心、或一直想問卻還沒問出口的是什麼？',example:'例如：孩子已經很忙，我想知道實際作業量；或是：我怕寫得不好被批評，老師會怎麼帶我？',links:['teacher','teaching','stories'],question:'我想討論適合程度、課業負擔、上課感受，以及卡住時能獲得什麼協助。'},
 {id:'stories',n:'04',title:'學生案例與成果',tag:'課程與成果',color:'#d7bc70',x:283,y:14,lift:2,kind:'trophy',intro:'上課能帶走什麼？用真實的學習歷程看見改變。',body:'這裡預留給課程希望培養的能力，以及過往學生的教學案例：起初的困難、採取的教學做法、練習過程與可核對的改變。學習目標不是已證實的成效，也不是分數保證；目前尚未收到真實案例，不展示虛構作品、評語、成績或進步數字。',steps:['能力目標：希望學生在哪些寫作環節有所改變？','具體產出：課後會留下哪些作品、修訂或練習紀錄？','進步判準：如何比較前後差異，何時一起回顧？','起點：學生原本的情況與學習目標是什麼？','過程：老師如何教，學生實際做了哪些練習？','成果：前後作品有哪些具體差異？有哪些限制？'],facts:[['學習目標','待確認具體能力與適用對象'],['真實學生案例','尚待提供'],['前後作品與成果證據','尚待提供可公開、已去識別資料'],['公開授權','需確認學生／家長同意的展示範圍']],task:'上完一段時間的課，你最希望看見什麼改變？想看哪一類與自己相近的案例？',example:'例如：我想看「有想法但寫得零散」的學生，如何在教學後調整文章。',links:['teacher','teaching','questions'],question:'我想確認課程希望帶來哪些能力，並看與我情況相近的真實學生案例與前後作品。'}
];
export function findTopics(query,category='全部'){const q=query.trim().toLowerCase();return topics.filter(t=>(category==='全部'||t.tag===category)&&[t.title,t.tag,t.intro,t.body,t.task,t.question,t.example,...t.steps,...t.facts.flat()].join(' ').toLowerCase().includes(q));}
export function makeOutline(role,ids,note,answers={},questions=[]){const chosen=topics.filter(t=>ids.includes(t.id));return `萬能考場作文：理論與實作｜課程諮詢提綱\n身分：${role}\n想聊的主題：${chosen.map(t=>t.title).join('、')||'認識老師與課程'}\n\n${chosen.map(t=>'• '+t.question+(typeof answers[t.id]==='string'&&answers[t.id].trim()?'\n  我的問題：'+answers[t.id].trim():'')).join('\n')}\n\n${questions.length?'想帶進討論的問題：\n'+questions.map(q=>'• '+q).join('\n')+'\n\n':''}我的情況與問題：\n${note.trim()||'希望先了解課程是否適合我的需求。'}\n\n希望一起確認：課程是否適合、實際教學安排、費用與預期成果。`;}
export function readStored(raw){try{const value=JSON.parse(raw);return value&&typeof value==='object'&&!Array.isArray(value)?value:{};}catch{return {};}}
export function explorationRoute([audience,interest,goal]){
 if(goal===2)return ['questions','teaching','teacher'];
 if(goal===1)return ['stories','teaching','teacher'];
 if(interest===0)return ['teacher','teaching','stories'];
 if(interest===1)return ['teaching','stories','questions'];
 return ['questions','teaching','stories'];
}

export const entryRoutes = {
 parents:{role:'家長',label:'我是家長',intro:'先了解孩子是否適合、課業負擔與如何看見進步。',topics:['teacher','questions','teaching','stories']},
 students:{role:'學生',label:'我是學生',intro:'先了解上課感受、遇到困難時的協助與學習收穫。',topics:['questions','teaching','stories']},
 teacher:{label:'先認識老師',intro:'先了解教學經驗、理念，以及這些選擇如何落實在課堂。',topics:['teacher','teaching','stories']}
};
export const concerns = [
 {id:'motivation',audience:'parents',question:'孩子對作文沒興趣，適合嗎？',topic:'questions',related:['teaching'],answer:'需要先了解孩子的情況；適合對象與教學回應尚待老師補充。'},
 {id:'workload',audience:'parents',question:'會不會增加孩子的課業負擔？',topic:'teaching',related:['questions'],answer:'實際課程與作業用時尚待確認，可以先把時間顧慮帶進討論。'},
 {id:'progress',audience:'parents',question:'我要怎麼知道孩子有沒有進步？',topic:'stories',related:['teaching'],answer:'進步判準與真實案例尚待提供；學習目標和已證實成果會分開呈現。'},
 {id:'foundation',audience:'students',question:'我基礎不好，也可以上嗎？',topic:'questions',related:['teaching','teacher'],answer:'適合的程度與協助方式尚待老師確認，不會只憑這個問題判定是否適合。'},
 {id:'blank-page',audience:'students',question:'我常常寫不出來，老師會怎麼帶？',topic:'teaching',related:['stories'],answer:'實際引導方式尚待老師補充，你可以直接詢問一個具體的課堂示範。'},
 {id:'pace',audience:'students',question:'如果跟不上，或不敢發問怎麼辦？',topic:'questions',related:['teaching'],answer:'個別協助與課堂互動安排尚待確認，可以先說出你最擔心的情境。'},
 {id:'experience',audience:'teacher',question:'老師帶過和我情況相近的學生嗎？',topic:'teacher',related:['stories','teaching'],answer:'教學經歷與真實案例尚待老師提供，可以先說明你的學習情況與目標。'},
 {id:'teaching-belief',audience:'teacher',question:'老師的教學理念，會怎麼落實在課堂？',topic:'teaching',related:['stories'],answer:'理念原文與課堂實例尚待老師補充；這裡會連起理念、做法與學習目標。'}
];
export function concernsFor(entry){return entry?concerns.filter(c=>c.audience===entry):concerns.filter(c=>['motivation','progress','foundation','blank-page'].includes(c.id));}
// First-visit walkthrough (3 short cards). Wording describes how the map works only; it promises no service or result.
export const introSteps=[
 {title:'跟著導覽員，走一圈旅程',body:'外圍一圈七站，從「① 為何高中一定要學國寫？」的兩個問題出發：為什麼高中一定要學國寫？為什麼選擇這堂課？，一路到報名與聯繫；中間三座島是認識老師、教學理念與上課方式、家長與學生的疑問。點第 1 站的導覽員，或從問題清單開始。',touchBody:'外圍一圈七站，從「① 為何高中一定要學國寫？」的兩個問題出發：為什麼高中一定要學國寫？為什麼選擇這堂課？，一路到報名與聯繫；中間三座島是認識老師、教學理念與上課方式、家長與學生的疑問。點第 1 站的導覽員，或從下方問題清單開始。'},
 {title:'用你的角度看地圖',body:'像看地圖一樣：左鍵拖曳平移，快速一甩會再滑一段；右鍵拖曳旋轉，滾輪往游標所在處縮放；選一座島時，鏡頭會飛過去。按右上「全景」看回整張地圖。',touchBody:'像看地圖一樣：單指拖曳平移，快速一甩會再滑一段；雙指捏合縮放、轉動旋轉，兩指一起上下滑動可傾斜；選一座島時，鏡頭會飛過去。按右上「全景」回到全景。'},
 {title:'把問題整理好，再來聊',body:'收藏主題、寫下自己的情況，最後可產生諮詢提綱，複製或下載後透過你平常聯絡老師的管道分享。內容只存在這個瀏覽器，網站不會代你寄送訊息。'}
];
export const INTRO_KEY='writing-island-onboarded';
// A key point is written as "label：question". Split it for pins, list rows and the key-point card.
export function stepParts(step){const i=step.indexOf('：');return i<0?{label:step,question:''}:{label:step.slice(0,i),question:step.slice(i+1)};}
export const CIRCLED=['①','②','③','④','⑤','⑥','⑦','⑧','⑨'];
