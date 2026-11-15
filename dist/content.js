// Course introduction draft: factual teacher details remain unfilled until supplied.
export const topics = [
 {id:'teacher',n:'01',title:'認識老師',tag:'認識教學',color:'#dcb26e',x:470,y:340,kind:'school',intro:'先認識教你的人，再了解這堂課。',body:'你可以在這裡了解老師的教學經歷、帶過的學生與累積的方法，判斷這些經驗是否貼近自己的需求。教師姓名、經歷與年資尚待本人提供。',steps:['教學經歷：帶過哪些年級、考試與程度的學生？','教學經驗：曾遇過什麼困難，如何調整教法？','課程對象：哪些學生適合，哪些需求需要另行討論？'],facts:[['教師介紹','尚待提供'],['授課年資與經歷','尚待提供可公開資料'],['適合對象','尚待確認年級、考試與程度']],task:'你最想先了解老師哪一部分的經歷？',example:'例如：老師是否帶過和我程度、目標相近的學生？',links:['belief','method','stories'],question:'我想了解你的教學經歷，以及是否帶過與我需求相近的學生。'},
 {id:'belief',n:'02',title:'教學理念',tag:'認識教學',color:'#92b5a2',x:470,y:180,kind:'tower',intro:'你為什麼這樣教？希望學生真正學會什麼？',body:'這座島用來說明「萬能考場作文：理論與實作」背後的教學主張，以及理念如何落在課堂安排與回饋上。以下是介紹架構，正式理念由老師親自補充。',steps:['核心主張：你認為作文最重要的是什麼？','教學選擇：為什麼採取這些方法，而不是其他做法？','課堂實踐：理念如何影響練習、批改與師生互動？'],facts:[['核心教學主張','待老師以自己的話說明'],['理念如何落實','待補課堂實例']],task:'選作文課時，你最重視老師的哪一項教學原則？',example:'例如：我在意考場表現，也想知道是否會保留學生自己的表達方式。',links:['teacher','method','benefits'],question:'我想了解你的教學理念，及它如何落實在每一堂課。'},
 {id:'method',n:'03',title:'課堂怎麼進行',tag:'課程與成果',color:'#d6a082',x:655,y:260,kind:'blocks',intro:'從課前到課後，看見你會怎麼教。',body:'這裡讓學生和家長具體看懂一堂課如何進行：如何了解學生現況、講解方法、陪伴練習，以及提供後續回饋。實際流程、頻率與服務範圍尚待老師確認。',steps:['課前：如何了解學生的程度、目標與困難？','課中：理論如何配合示範、討論與實作？','課後：如何批改、回饋、追蹤與安排下一步？'],facts:[['一堂課的流程','待補實際上課步驟'],['練習與作業量','待補頻率與預估用時'],['批改與回饋方式','待補形式與服務範圍']],task:'你最想看見哪一段上課過程？',example:'例如：能否用一個實際題目，展示老師如何從討論帶到寫作與修改？',links:['belief','benefits','solutions'],question:'我想看一堂課如何進行，以及課前、課中、課後各有哪些安排。'},
 {id:'benefits',n:'04',title:'上課能帶走什麼',tag:'課程與成果',color:'#82b5b9',x:100,y:340,kind:'house',intro:'把「有幫助」說具體，也說清楚如何看見進步。',body:'這座島介紹課程希望培養的能力，以及可以用什麼作品或歷程來觀察改變。下列項目是待確認的學習目標，不是已證實的成效，也不是分數保證。',steps:['能力目標：希望學生在哪些寫作環節有所改變？','具體產出：課後會留下哪些作品、修訂或練習紀錄？','進步判準：如何比較前後差異，何時一起回顧？'],facts:[['學習目標','待確認具體能力與適用對象'],['課後可留下的成果','待確認作品與紀錄形式'],['進步如何評估','待確認觀察方式與時間點']],task:'如果上完一段時間的課，你最希望看見什麼改變？',example:'例如：我希望更能獨立完成一篇文章，並能說明自己為什麼這樣安排段落。',links:['method','stories','solutions'],question:'我想確認課程希望帶來哪些能力、具體產出，以及如何判斷進步。'},
 {id:'stories',n:'05',title:'學生案例與成果',tag:'課程與成果',color:'#d7bc70',x:1147,y:262,lift:2.6,kind:'trophy',intro:'用真實的學習歷程，理解教學如何發生。',body:'這裡預留給過往學生的教學案例：起初的困難、採取的教學做法、練習過程與可核對的改變。目前尚未收到真實案例，不展示虛構作品、評語、成績或進步數字。',steps:['起點：學生原本的情況與學習目標是什麼？','過程：老師如何教，學生實際做了哪些練習？','成果：前後作品有哪些具體差異？有哪些限制？'],facts:[['真實學生案例','尚待提供'],['前後作品與成果證據','尚待提供可公開、已去識別資料'],['公開授權','需確認學生／家長同意的展示範圍']],task:'你想看哪一類與自己情況相近的學生案例？',example:'例如：我想看「有想法但寫得零散」的學生，如何在教學後調整文章。',links:['teacher','method','benefits'],question:'我想看與我情況相近的真實學生案例、教學過程與前後作品。'},
 {id:'parents',n:'06',title:'家長的顧慮',tag:'疑問與解法',color:'#b6abc3',x:285,y:420,kind:'lab',intro:'適不適合孩子？課堂安排能回應孩子的需要嗎？',body:'家長可以從適合程度、課業負擔、回饋方式與成果判斷開始提問。這裡列的是可供選擇的常見顧慮；老師的正式回應、方案與可提供的服務仍待補充。',steps:['適合程度：孩子基礎不同，教學會如何安排？','時間負擔：作業需要多久？與學校課業如何配合？','成效與溝通：家長如何知道學習情況，是否適合持續？'],facts:[['家長疑問的正式回應','待老師逐題補充'],['可對照的資訊','課堂安排、收費與學生案例']],task:'身為家長，你目前最擔心的是哪一件事？',example:'例如：孩子已經很忙，我想知道實際作業量，以及如何判斷這堂課是否適合他。',links:['method','stories','solutions','pricing'],question:'我是家長，想討論適合程度、課業負擔、費用與如何看見孩子的進步。'},
 {id:'students',n:'07',title:'學生心裡的疑問',tag:'疑問與解法',color:'#c3ae88',x:655,y:420,kind:'pavilion',intro:'我寫不好也能來嗎？上課會是什麼感覺？',body:'你可以直接說出自己對作文課的期待與擔心，例如沒有材料、不敢發問、怕跟不上，或不知道批改後怎麼進步。這裡會連到相關的教學安排與解法，正式回應待老師確認。',steps:['學習起點：完全沒頭緒、基礎弱或想突破，都如何開始？','課堂感受：提問、討論與練習會怎麼進行？','實際幫助：卡住時怎麼得到協助，回饋怎麼用？'],facts:[['學生疑問的正式回應','待老師逐題補充'],['可對照的資訊','課堂流程、學習目標與解決方案']],task:'有沒有一個你一直想問、卻還沒有問出口的問題？',example:'例如：我怕寫得不好被批評；如果當下完全想不到內容，老師會怎麼帶我？',links:['belief','method','benefits','solutions'],question:'我是學生，想討論寫作困難、上課方式，以及卡住時能獲得什麼協助。'},
 {id:'solutions',n:'08',title:'解法與討論',tag:'疑問與解法',color:'#7ca69c',x:470,y:500,kind:'dock',intro:'從你的顧慮，找到需要一起確認的下一步。',body:'把問題、相關教學做法與可參考的案例連起來，再帶著討論清單與老師交流。每項方案都應說明適用情況、具體做法與限制；尚未提供的服務不視為課程承諾。',steps:['說清楚顧慮：現在遇到什麼問題，最希望改變什麼？','對照方案：相關教學方法、課程安排與案例能回答什麼？','確認下一步：還缺哪些資訊，再一起判斷是否適合。'],facts:[['個別顧慮的對應方案','待老師補充做法、適用情況與限制'],['聯絡方式','尚待提供；目前可先產生討論提綱']],task:'你最想先解決的顧慮是什麼？希望老師怎麼回應？',example:'例如：我擔心跟不上，希望先了解程度如何評估，以及有哪些具體的協助方式。',links:['parents','students','method','pricing','benefits'],question:'我想針對自己的顧慮，討論具體做法、適用條件、限制與下一步。'},
 {id:'pricing',n:'09',title:'收費與安排',tag:'疑問與解法',color:'#a8bd78',x:285,y:260,kind:'trees',intro:'費用包含什麼？先把上課安排問清楚。',body:'報名前，可以一起確認總費用、計費單位、授課形式，以及批改與課後回饋是否包含在內。目前尚未提供正式價格與規則，這裡不顯示推測金額。',steps:['費用：每堂、每期或其他方式計費？包含哪些服務？','安排：上課多久、多久一次、線上或實體、個別或團體？','規則：試上、請假、補課、取消與退費如何處理？'],facts:[['價格與計費單位','尚未公布'],['課程時長與形式','尚待確認'],['批改與課後回饋','尚待確認是否包含'],['試上、請假與退費','尚待提供正式規則']],task:'關於費用與上課安排，你最需要先確認什麼？',example:'例如：除了上課費，作文批改是否另計？可以先了解完整一期的安排嗎？',links:['method','parents','solutions'],question:'我想確認正式收費、包含服務、上課安排與請假補課規則。'}
];
export function findTopics(query,category='全部'){const q=query.trim().toLowerCase();return topics.filter(t=>(category==='全部'||t.tag===category)&&[t.title,t.tag,t.intro,t.body,t.task,t.question,t.example,...t.steps,...t.facts.flat()].join(' ').toLowerCase().includes(q));}
export function makeOutline(role,ids,note,answers={},questions=[]){const chosen=topics.filter(t=>ids.includes(t.id));return `萬能考場作文：理論與實作｜課程諮詢提綱\n身分：${role}\n想聊的主題：${chosen.map(t=>t.title).join('、')||'認識老師與課程'}\n\n${chosen.map(t=>'• '+t.question+(typeof answers[t.id]==='string'&&answers[t.id].trim()?'\n  我的問題：'+answers[t.id].trim():'')).join('\n')}\n\n${questions.length?'想帶進討論的問題：\n'+questions.map(q=>'• '+q).join('\n')+'\n\n':''}我的情況與問題：\n${note.trim()||'希望先了解課程是否適合我的需求。'}\n\n希望一起確認：課程是否適合、實際教學安排、費用與預期成果。`;}
export function readStored(raw){try{const value=JSON.parse(raw);return value&&typeof value==='object'&&!Array.isArray(value)?value:{};}catch{return {};}}
export function explorationRoute([audience,interest,goal]){
 if(goal===2)return ['solutions',audience===1?'parents':'students','method'];
 if(goal===1)return ['stories','benefits','method'];
 if(interest===0)return ['teacher','belief','method'];
 if(interest===1)return ['method','benefits','stories'];
 return ['pricing',audience===1?'parents':'students','solutions'];
}

export const entryRoutes = {
 parents:{role:'家長',label:'我是家長',intro:'先了解孩子是否適合、課業負擔與如何看見進步。',topics:['teacher','parents','method','stories']},
 students:{role:'學生',label:'我是學生',intro:'先了解上課感受、遇到困難時的協助與學習收穫。',topics:['students','method','benefits','solutions']},
 teacher:{label:'先認識老師',intro:'先了解教學經驗、理念，以及這些選擇如何落實在課堂。',topics:['teacher','belief','method','stories']}
};
export const concerns = [
 {id:'motivation',audience:'parents',question:'孩子對作文沒興趣，適合嗎？',topic:'parents',related:['belief','method'],answer:'需要先了解孩子的情況；適合對象與教學回應尚待老師補充。'},
 {id:'workload',audience:'parents',question:'會不會增加孩子的課業負擔？',topic:'method',related:['parents','pricing'],answer:'實際課程與作業用時尚待確認，可以先把時間顧慮帶進討論。'},
 {id:'progress',audience:'parents',question:'我要怎麼知道孩子有沒有進步？',topic:'benefits',related:['stories','method'],answer:'進步判準與真實案例尚待提供；學習目標和已證實成果會分開呈現。'},
 {id:'foundation',audience:'students',question:'我基礎不好，也可以上嗎？',topic:'students',related:['method','teacher'],answer:'適合的程度與協助方式尚待老師確認，不會只憑這個問題判定是否適合。'},
 {id:'blank-page',audience:'students',question:'我常常寫不出來，老師會怎麼帶？',topic:'method',related:['belief','benefits'],answer:'實際引導方式尚待老師補充，你可以直接詢問一個具體的課堂示範。'},
 {id:'pace',audience:'students',question:'如果跟不上，或不敢發問怎麼辦？',topic:'solutions',related:['students','method'],answer:'個別協助與課堂互動安排尚待確認，可以先說出你最擔心的情境。'},
 {id:'experience',audience:'teacher',question:'老師帶過和我情況相近的學生嗎？',topic:'teacher',related:['stories','method'],answer:'教學經歷與真實案例尚待老師提供，可以先說明你的學習情況與目標。'},
 {id:'teaching-belief',audience:'teacher',question:'老師的教學理念，會怎麼落實在課堂？',topic:'belief',related:['method','benefits'],answer:'理念原文與課堂實例尚待老師補充；這裡會連起理念、做法與學習目標。'}
];
export function concernsFor(entry){return entry?concerns.filter(c=>c.audience===entry):concerns.filter(c=>['motivation','progress','foundation','blank-page'].includes(c.id));}
// First-visit walkthrough (3 short cards). Wording describes how the map works only; it promises no service or result.
export const introSteps=[
 {title:'每座島，是一件你想了解的事',body:'九座島連起老師介紹、教學理念、上課方式、學生案例、家長與學生的顧慮，以及收費安排。點一座島，或從問題清單開始。',touchBody:'九座島連起老師介紹、教學理念、上課方式、學生案例、家長與學生的顧慮，以及收費安排。點一座島，或從下方問題清單開始。'},
 {title:'用你的角度看地圖',body:'像看地圖一樣：左鍵拖曳平移，快速一甩會再滑一段；右鍵拖曳旋轉，滾輪往游標所在處縮放；選一座島時，鏡頭會飛過去。按右上「全景」回到起點。',touchBody:'像看地圖一樣：單指拖曳平移，快速一甩會再滑一段；雙指捏合縮放、轉動旋轉，兩指一起上下滑動可傾斜；選一座島時，鏡頭會飛過去。按右上「全景」回到起點。'},
 {title:'把問題整理好，再來聊',body:'收藏主題、寫下自己的情況，最後可產生諮詢提綱，複製或下載後透過你平常聯絡老師的管道分享。內容只存在這個瀏覽器，網站不會代你寄送訊息。'}
];
export const INTRO_KEY='writing-island-onboarded';
// A key point is written as "label：question". Split it for pins, list rows and the key-point card.
export function stepParts(step){const i=step.indexOf('：');return i<0?{label:step,question:''}:{label:step.slice(0,i),question:step.slice(i+1)};}
export const CIRCLED=['①','②','③','④','⑤','⑥','⑦','⑧','⑨'];
