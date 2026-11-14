import {createWorld} from './world.js';
import {topics,findTopics,makeOutline,explorationRoute,readStored,entryRoutes,concerns,concernsFor,introSteps,INTRO_KEY} from './content.js';
import {mapInsets} from './motion.js';
import {bindSheet} from './sheets.js';
const $=s=>document.querySelector(s), list=$('#topic-list'), modal=$('#modal');
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const phone=matchMedia('(max-width:720px)'), isPhone=()=>phone.matches;
let selected=null,category='全部',world,showConnections=true,previousFocus=null,entry=null,selectedConcern=null,detailOpener=null,view='concerns',indexBeforeDetail=null;
let stored={};try{stored=readStored(localStorage.getItem('writing-island-course'));}catch{}
let consultQuestions=Array.isArray(stored.questions)?stored.questions.filter(q=>typeof q==='string'&&q.trim()).slice(0,30):[];
let saved=new Set(Array.isArray(stored.saved)?stored.saved.filter(id=>topics.some(t=>t.id===id)):[]);
let answers=stored.answers&&typeof stored.answers==='object'&&!Array.isArray(stored.answers)?stored.answers:{};
let role=['學生','家長','其他'].includes(stored.role)?stored.role:'學生',note=typeof stored.note==='string'?stored.note:'';
function persist(){try{localStorage.setItem('writing-island-course',JSON.stringify({saved:[...saved],answers,role,note,questions:consultQuestions}));}catch{toast('瀏覽器無法儲存；本次操作仍可繼續，請先複製提綱。');}}
function toast(message){$('#toast').textContent=message;$('#toast').classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('#toast').classList.remove('show'),3500);}
const topicOf=id=>topics.find(t=>t.id===id);
const stepLabel=s=>s.split('：')[0];

// ---- Map framing: keep the subject in the part of the map that floating panels leave open. ----
function visible(el){return el&&!el.hidden&&el.getClientRects().length&&getComputedStyle(el).visibility!=='hidden';}
function insets(){
 const map=$('#map').getBoundingClientRect(),rects=[];
 // Phones stack the actions in a narrow right-hand column; it hides the right edge, not a top strip.
 const top=[...document.querySelectorAll(isPhone()?'.brand-card,.map-tools':'.brand-card,.map-tools,.top-actions')].filter(visible).map(el=>el.getBoundingClientRect().bottom);
 if(isPhone())rects.push($('.top-actions').getBoundingClientRect());
 if(top.length)rects.push({left:map.left,right:map.right,top:map.top,bottom:Math.max(...top)+8});
 const caption=$('.map-caption');if(visible(caption))rects.push({left:map.left,right:map.right,top:caption.getBoundingClientRect().top-8,bottom:map.bottom});
 if(!$('#detail').hidden)rects.push($('#detail').getBoundingClientRect());
 if(isPhone())rects.push($('#index-panel').getBoundingClientRect());
 return mapInsets(map,rects);
}
let refitTimer;
function refitView(){clearTimeout(refitTimer);if(world?.flying()){refitTimer=setTimeout(refitView,100);return;}world?.refit(insets());}

// ---- Index: common questions and topic islands, like a book index beside the map. ----
function showView(next,{focusTab=false}={}){view=next;for(const [name,tab]of [['concerns',$('#tab-concerns')],['topics',$('#tab-topics')]]){tab.classList.toggle('active',name===next);tab.setAttribute('aria-pressed',name===next);}$('#concerns-view').hidden=next!=='concerns';$('#topics-view').hidden=next!=='topics';if(focusTab)(next==='topics'?$('#tab-topics'):$('#tab-concerns')).focus();}
$('#tab-concerns').onclick=()=>showView('concerns');$('#tab-topics').onclick=()=>showView('topics');
function renderList(){const visibleTopics=findTopics($('#search').value,category);
 list.innerHTML=visibleTopics.length?visibleTopics.map(t=>{const active=t.id===selected;return `<div class="topic-item${active?' active':''}"><button class="topic-row${active?' active':''}" data-id="${t.id}" aria-pressed="${active}"><span class="num">${t.n}</span><span class="topic-name"><strong>${t.title}</strong><small>${t.tag}${saved.has(t.id)?' · 已收藏':''}</small></span><span class="count" aria-label="${t.steps.length} 個了解重點">${t.steps.length} ↗</span></button>${active?`<ol class="topic-steps" aria-label="${t.title}的了解重點">${t.steps.map(s=>`<li>${stepLabel(s)}</li>`).join('')}</ol>`:''}</div>`;}).join(''):'<p class="empty">沒有找到符合的主題。試試「收費」、「成果」或清除搜尋。</p>';
 $('#result-count').textContent=`${visibleTopics.length} 座主題島`;$('#topic-count').textContent=visibleTopics.length;
 world?.filter(visibleTopics.map(t=>t.id));}
list.addEventListener('click',e=>{const row=e.target.closest('[data-id]');if(row)selectTopic(row.dataset.id);});
function renderConcerns(){const items=concernsFor(entry);$('#concerns-list').innerHTML=items.map(c=>`<button data-concern="${c.id}" aria-pressed="${c.id===selectedConcern?.id&&!$('#detail').hidden}"><span class="q-mark" aria-hidden="true">Q</span><span>${c.question}</span><span class="arrow" aria-hidden="true">↗</span></button>`).join('');$('#concern-count').textContent=items.length;$('#entry-note').textContent=entry?entryRoutes[entry].intro:'選一個問題，看看相關做法與待確認資訊。';world?.emphasize(entry?entryRoutes[entry].topics:[]);}
$('#concerns-list').onclick=e=>{const b=e.target.closest('[data-concern]');if(!b)return;const c=concerns.find(c=>c.id===b.dataset.concern);selectTopic(c.topic,{concern:c.id});};
for(const button of document.querySelectorAll('[data-entry]'))button.onclick=()=>{entry=button.dataset.entry;if(entryRoutes[entry].role){role=entryRoutes[entry].role;persist();}for(const b of document.querySelectorAll('[data-entry]'))b.setAttribute('aria-pressed',b===button);showView('concerns');renderConcerns();if(entry==='teacher')selectTopic('teacher');else if(!$('#detail').hidden)closeDetail({restoreFocus:false});};
$('#search').oninput=()=>{if($('#search').value.trim())showView('topics');renderList();};
for(const b of document.querySelectorAll('[data-category]'))b.onclick=()=>{category=b.dataset.category;for(const el of document.querySelectorAll('[data-category]')){el.classList.toggle('active',el===b);el.setAttribute('aria-pressed',el===b);}renderList();};

// ---- Detail card: floats on the left of the map on desktop, a bottom sheet on phones. ----
const audienceLabel={parents:'對象：家長',students:'對象：學生',teacher:'認識老師'};
function selectTopic(id,{focus=true,concern=null}={}){
 const t=topicOf(id);if(!t)return;const moveCamera=id!==selected||$('#detail').hidden;if(focus&&!$('#detail').contains(document.activeElement))detailOpener=document.activeElement;selected=id;selectedConcern=concerns.find(c=>c.id===concern)||null;
 const related=[...new Set([...(selectedConcern?.related||[]),...t.links])];
 $('#detail-crumb').textContent=`主題 ${t.n} · ${t.title}${selectedConcern?' · 常見問題':''}`;
 $('#detail-content').innerHTML=`<div class="detail-head"><span class="detail-badge" style="--badge:${t.color}" aria-hidden="true">${t.n}</span><div><p class="eyebrow">${t.title} · ${t.tag}</p><h2 id="detail-title">${selectedConcern?selectedConcern.question:t.title}</h2></div></div>
 <div class="chips"><span class="chip strong">主題 ${t.n}</span><span class="chip">${t.tag}</span>${selectedConcern?`<span class="chip">${audienceLabel[selectedConcern.audience]}</span>`:''}<span class="chip draft">待老師補充</span></div>
 <div class="answer-first"><p class="lead">${selectedConcern?selectedConcern.answer:t.intro}</p></div>
 <section class="card-section"><h3>重點 · 先確認這些做法</h3><ol class="key-points">${t.steps.map(s=>`<li>${s}</li>`).join('')}</ol></section>
 <details class="card-section evidence-section"><summary>目前資訊與證據 <span>待補充</span></summary><p>${t.body}</p><dl class="topic-facts">${t.facts.map(([label,value])=>`<div><dt>${label}</dt><dd>${value}</dd></div>`).join('')}</dl></details>
 <details class="card-section question-notes" ${answers[id]?'open':''}><summary>補充你的情況 <span>選填</span></summary><div class="exercise"><label for="exercise-answer">${t.task}</label><textarea id="exercise-answer" maxlength="2000" placeholder="寫下你的顧慮、期待，或還想了解的事…">${escape(typeof answers[id]==='string'?answers[id]:'')}</textarea><small class="helper">只儲存在這個瀏覽器，不會傳送。</small><p class="question-example">${t.example}</p></div></details>
 <section class="card-section"><h3>和這些主題一起看</h3><div class="related">${related.map(rid=>{const r=topicOf(rid);return `<button data-related="${rid}"><b>${r.n}</b><span>→ ${r.title}</span><i aria-hidden="true">↗</i></button>`;}).join('')}</div></section>
 <div class="detail-actions"><button class="ask-topic" id="ask-topic">就這件事問老師 ↗</button><button class="save-topic" id="save-topic" aria-pressed="${saved.has(id)}">${saved.has(id)?'✓ 已收藏這個主題':'＋ 先收藏，晚點再聊'}</button><small>先整理諮詢提綱，不會直接送出訊息。</small></div>`;
 const wasHidden=$('#detail').hidden;$('#detail').hidden=false;document.body.classList.add('detail-open');
 if(wasHidden&&isPhone()){indexBeforeDetail=indexSheet.state();indexSheet.set('peek');}
 if(!selectedConcern)showView('topics');
 $('#map-message').textContent=`正在探索 ${t.title} · ${t.tag}`;
 $('#exercise-answer').oninput=e=>{answers[id]=e.target.value;persist();};
 $('#save-topic').onclick=()=>{saved.has(id)?saved.delete(id):saved.add(id);persist();updateCount();selectTopic(id,{focus:false,concern:selectedConcern?.id});$('#save-topic').focus();toast(saved.has(id)?'已加入討論清單':'已從討論清單移除');};
 $('#ask-topic').onclick=()=>{saved.add(id);const question=selectedConcern?.question||t.question;if(!consultQuestions.includes(question))consultQuestions.push(question);persist();updateCount();$('#save-topic').setAttribute('aria-pressed','true');$('#save-topic').textContent='✓ 已收藏這個主題';discussion();};
 for(const b of document.querySelectorAll('[data-related]'))b.onclick=()=>selectTopic(b.dataset.related);
 updateMap();renderList();renderConcerns();
 if(moveCamera)world?.focus(id,insets());
 if(!isPhone())document.querySelector('.topic-item.active')?.scrollIntoView({block:'nearest'});
 if(focus){$('#detail').scrollTop=0;$('#close-detail').focus();}
}
function updateMap(){world?.select(selected);world?.connections(showConnections);}
function closeDetail({restoreFocus=true}={}){const id=selected;$('#detail').hidden=true;document.body.classList.remove('detail-open');selected=null;selectedConcern=null;
 if(isPhone()&&indexBeforeDetail)indexSheet.set(indexBeforeDetail);indexBeforeDetail=null;
 updateMap();renderList();renderConcerns();refitView();$('#map-message').textContent='點一座島，開始你的寫作旅程';
 if(!restoreFocus)return;const row=document.querySelector(`.topic-row[data-id="${id}"]`);const target=[detailOpener,row,$('#concerns-list button'),$('#tab-concerns')].find(el=>el?.isConnected&&el.getClientRects().length);target?.focus();}
$('#close-detail').onclick=()=>closeDetail();
$('#detail').addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();closeDetail();}});
function updateCount(){$('#saved-count').textContent=saved.size;renderList();}

// ---- Dialogs: discussion list, outline, about, tours. ----
function showModal(html){if(!modal.open)previousFocus=document.activeElement;$('#modal-content').innerHTML=html;if(!modal.open)modal.showModal();$('#close-modal').focus();}
$('#close-modal').onclick=()=>modal.close();modal.addEventListener('close',()=>{if(document.activeElement===document.body||modal.contains(document.activeElement))previousFocus?.focus();});
const stepper=current=>`<ol class="stepper" aria-label="整理提綱的步驟">${['挑問題','寫情況','帶提綱'].map((s,i)=>`<li${i===current?' aria-current="step"':''}><b>0${i+1}</b>${s}</li>`).join('')}</ol>`;
function discussion(){showModal(`<p class="kicker">MY DISCUSSION LIST · 討論清單</p><h2>讓我們從問題開始。</h2>${stepper(consultQuestions.length||saved.size?1:0)}<p>不用先想好答案，帶著一個真實的困難就好。</p>
 <section class="consult-block"><h3>想帶進討論的問題 <span>${consultQuestions.length}</span></h3>${consultQuestions.length?`<div class="consult-context">${consultQuestions.map((q,i)=>`<div class="consult-question"><p>${escape(q)}</p><button data-remove-question="${i}" aria-label="移除問題：${escape(q)}">×</button></div>`).join('')}</div>`:'<p class="helper">在主題卡片按「就這件事問老師」，問題會出現在這裡。</p>'}</section>
 <section class="consult-block"><h3>收藏的主題 <span>${saved.size}</span></h3><div id="saved-pills">${[...saved].map(id=>`<span class="pill"><b>${topicOf(id).n}</b>${topicOf(id).title}<button data-remove="${id}" aria-label="移除${topicOf(id).title}">×</button></span>`).join('')||'<p class="helper">尚未收藏主題；也可以直接寫下你的問題。</p>'}</div></section>
 <section class="consult-block"><h3>你的情況</h3><label for="role">我是</label><select id="role">${['學生','家長','其他'].map(x=>`<option ${role===x?'selected':''}>${x}</option>`).join('')}</select><label for="note">目前的情況，或想和老師討論的事</label><textarea id="note" rows="4" maxlength="3000" placeholder="例如：常常卡在作文開頭，想了解課堂會如何練習…">${escape(note)}</textarea><p class="helper">內容只留在你的瀏覽器。這裡不會寄送訊息，也不收集聯絡資料。</p></section>
 <div class="modal-actions"><button class="primary" id="outline-button">產生討論提綱 ↗</button><button id="back-explore">繼續探索</button></div>`);
 $('#role').onchange=e=>{role=e.target.value;persist();};$('#note').oninput=e=>{note=e.target.value;persist();};
 for(const b of document.querySelectorAll('[data-remove-question]'))b.onclick=()=>{consultQuestions.splice(Number(b.dataset.removeQuestion),1);persist();discussion();};
 for(const b of document.querySelectorAll('[data-remove]'))b.onclick=()=>{saved.delete(b.dataset.remove);persist();updateCount();if(selected===b.dataset.remove)selectTopic(selected,{focus:false,concern:selectedConcern?.id});discussion();};
 $('#outline-button').onclick=outline;$('#back-explore').onclick=()=>modal.close();}
function outline(){const text=makeOutline(role,[...saved],note,answers,consultQuestions);showModal(`<p class="kicker">DISCUSSION OUTLINE · 討論提綱</p><h2>把下一步，帶進對話。</h2>${stepper(2)}<pre class="outline">${escape(text)}</pre><p class="helper">這份提綱還沒有寄給任何人。複製或下載後，透過你平常與老師聯絡的管道分享；聯絡方式尚待教師提供。</p><div class="modal-actions"><button class="primary" id="copy">複製討論提綱</button><button id="download">下載文字檔</button><button id="edit-outline">← 返回編輯</button></div>`);$('#copy').onclick=async()=>{try{await navigator.clipboard.writeText(text);toast('已複製討論提綱');}catch{toast('無法存取剪貼簿，請下載文字檔或手動選取提綱。');}};$('#download').onclick=()=>{const url=URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='作文討論提綱.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};$('#edit-outline').onclick=discussion;}
$('#discuss').onclick=discussion;
$('#about').onclick=()=>{showModal(`<p class="kicker">ABOUT · 關於作文學習島</p><h2>先認識教學，再開始對話。</h2><p>「萬能考場作文：理論與實作」希望讓對教學有興趣的學生與家長，透過探索與提問，更清楚了解課程，並與老師討論自己的學習需求。</p><p>地圖連起老師的經驗與理念、上課方式、學習收穫、學生案例、收費，以及家長與學生的顧慮。你可以從最關心的事開始。</p><p class="helper">這是可操作的教學展示提案。教師介紹、正式課綱、授課對象、費用與聯絡方式尚待提供；目前呈現介紹架構與提問範例，不代表已確認的教學經歷、價格、服務或成效。</p><div class="modal-actions"><button class="primary" id="about-start">從認識老師開始 ↗</button></div>`);$('#about-start').onclick=()=>{modal.close();selectTopic('teacher');};};
let tourIndex=0;const tour=topics.map(t=>t.id);
function guide(){selectTopic(tour[tourIndex],{focus:false});const t=topicOf(tour[tourIndex]);showModal(`<p class="kicker">ISLAND TOUR · ${String(tourIndex+1).padStart(2,'0')} / 09</p><h2>${t.title}</h2><p>${t.intro}</p><p>${t.body}</p><div class="progress"><span style="width:${(tourIndex+1)/9*100}%"></span></div><div class="modal-actions">${tourIndex?'<button id="tour-prev">← 上一步</button>':''}<button class="primary" id="tour-next">${tourIndex===8?'開始自由探索':'下一座島 →'}</button><button id="tour-exit">離開導覽</button></div>`);$('#tour-prev')?.addEventListener('click',()=>{tourIndex--;guide();});$('#tour-next').onclick=()=>{if(tourIndex===8){modal.close();$('#close-detail').focus();}else{tourIndex++;guide();}};$('#tour-exit').onclick=()=>{modal.close();$('#close-detail').focus();};}
$('#guide').onclick=()=>{tourIndex=0;guide();};
let quizIndex=0,quizAnswers=[];const questions=[{q:'你現在以什麼身分了解課程？',options:['我是學生，想判斷是否適合自己','我是家長，想了解孩子的學習安排']},{q:'目前最想先了解哪一部分？',options:['老師的經驗與教學理念','上課方式、收穫與學生成果','收費、安排與報名前的顧慮']},{q:'你希望接下來怎麼了解？',options:['先認識老師與課程','先看真實案例與成果的資訊','帶著自己的問題與老師討論']}];
function quiz(){const q=questions[quizIndex];showModal(`<p class="kicker">FIND YOUR ROUTE · ${quizIndex+1} / 3</p><h2>${q.q}</h2><div class="progress"><span style="width:${(quizIndex+1)/3*100}%"></span></div><div class="quiz-options">${q.options.map((s,i)=>`<button data-answer="${i}" aria-pressed="${quizAnswers[quizIndex]===i}"><b>${String.fromCharCode(65+i)}</b><span>${s}</span><i aria-hidden="true">↗</i></button>`).join('')}</div>${quizIndex?'<div class="modal-actions"><button id="quiz-prev">← 上一題</button></div>':''}`);$('#quiz-prev')?.addEventListener('click',()=>{quizIndex--;quiz();});for(const b of document.querySelectorAll('[data-answer]'))b.onclick=()=>{quizAnswers[quizIndex]=Number(b.dataset.answer);if(quizIndex<2){quizIndex++;quiz();}else quizResult();};}
function quizResult(){role=quizAnswers[0]===1?'家長':'學生';persist();const ids=explorationRoute(quizAnswers);world?.emphasize(ids);showModal(`<p class="kicker">YOUR ROUTE · 你的探索路線</p><h2>從這三座島開始。</h2><p>這是依照你的選擇安排的探索順序，地圖上已標出這三座島。它不會評定能力，也不會判定你是否適合報名。</p><div class="quiz-options route">${ids.map((id,i)=>`<button data-route="${id}"><b>${i+1}</b><span>${topicOf(id).n} ${topicOf(id).title}<small>${topicOf(id).intro}</small></span><i aria-hidden="true">↗</i></button>`).join('')}</div><div class="modal-actions"><button id="quiz-restart">重新選擇</button></div>`);for(const b of document.querySelectorAll('[data-route]'))b.onclick=()=>{modal.close();selectTopic(b.dataset.route);};$('#quiz-restart').onclick=()=>{quizIndex=0;quizAnswers=[];quiz();};}
$('#quiz').onclick=()=>{quizIndex=0;quizAnswers=[];quiz();};

// ---- Map tools and top actions. ----
$('#reset').onclick=()=>{if(!$('#detail').hidden)closeDetail({restoreFocus:false});world?.home(insets());};
$('#zoom-in').onclick=()=>world?.zoom(.85);$('#zoom-out').onclick=()=>world?.zoom(1.15);
$('#connection').onclick=()=>{showConnections=!showConnections;$('#connection').setAttribute('aria-pressed',showConnections);updateMap();};
$('#names').onclick=()=>{const on=$('#names').getAttribute('aria-pressed')!=='true';$('#names').setAttribute('aria-pressed',on);$('#names').setAttribute('aria-label',on?'隱藏島名':'顯示島名');world?.names(on);};
function setPaused(paused){document.body.classList.toggle('paused',paused);$('#pause').setAttribute('aria-pressed',paused);$('#pause').innerHTML=paused?'<i>▷</i><span>播放</span>':'<i>Ⅱ</i><span>暫停</span>';$('#pause').setAttribute('aria-label',paused?'播放動畫':'暫停動畫');$('#pause').title=paused?'播放動畫':'暫停動畫';world?.pause(paused);}
$('#pause').onclick=()=>setPaused(!document.body.classList.contains('paused'));
$('#day').onclick=()=>{const night=document.body.classList.toggle('night');$('#day').setAttribute('aria-pressed',night);world?.night(night);};
$('#rotate').onclick=()=>{const rotate=$('#rotate').getAttribute('aria-pressed')!=='true';$('#rotate').setAttribute('aria-pressed',rotate);world?.mode(rotate);$('#map-message').textContent=rotate?'旋轉模式 · 拖曳改變視角':'平移模式 · 拖曳上下左右移動';};
// 清單: phones fold the index sheet down to a slim bar; desktop slides the index away to widen the map.
function syncListToggle(){const open=isPhone()?!$('#index-panel').classList.contains('sheet-peek'):!document.body.classList.contains('index-collapsed');$('#list-toggle').setAttribute('aria-expanded',open);$('#list-toggle').classList.toggle('active',open);}
$('#list-toggle').onclick=()=>{if(isPhone())indexSheet.set(indexSheet.state()==='peek'?'half':'peek');else{document.body.classList.toggle('index-collapsed');syncListToggle();}};

try{world=createWorld($('#map'),topics,id=>selectTopic(id));setPaused(matchMedia('(prefers-reduced-motion: reduce)').matches);}catch(error){$('#map').innerHTML='<p class="webgl-message">這個瀏覽器無法開啟 3D 地圖。請使用主題清單繼續探索。</p>';console.error(error);}
function syncPhone(){document.body.classList.toggle('shell-mobile',isPhone());}
syncPhone();phone.addEventListener('change',()=>{syncPhone();syncListToggle();requestAnimationFrame(refitView);});
const indexSheet=bindSheet($('#index-panel'),$('#index-handle'),$('#index-size'),{peekable:true,onChange:()=>{syncListToggle();requestAnimationFrame(refitView);}});
bindSheet($('#detail'),$('#detail-handle'),$('#detail-size'),{onChange:()=>requestAnimationFrame(refitView),onClose:()=>closeDetail()});
for(const el of [$('#detail'),$('#index-panel')])el.addEventListener('transitionend',e=>{if(['height','transform'].includes(e.propertyName))refitView();});
new ResizeObserver(()=>requestAnimationFrame(refitView)).observe($('#map'));
document.querySelector('main').addEventListener('transitionend',e=>{if(e.propertyName==='grid-template-columns')refitView();});

// ---- First-visit walkthrough (separate storage key; never touches writing-island-course). ----
let introStep=0;const touch=matchMedia('(hover: none) and (pointer: coarse)').matches;
function finishIntro(){try{localStorage.setItem(INTRO_KEY,'1');}catch{}}
function intro(){const s=introSteps[introStep],last=introStep===introSteps.length-1;showModal(`<p class="kicker">HELLO, WRITER · 0${introStep+1} / 0${introSteps.length}</p><h2>${s.title}</h2><p>${touch&&s.touchBody?s.touchBody:s.body}</p><div class="progress"><span style="width:${(introStep+1)/introSteps.length*100}%"></span></div><div class="modal-actions intro-actions"><button id="intro-skip">${introStep?'← 上一步':'略過'}</button><button class="primary" id="intro-next">${last?'開始探索 →':'下一步 →'}</button></div>`);$('#intro-next').focus();$('#intro-skip').onclick=()=>{if(introStep){introStep--;intro();}else modal.close();};$('#intro-next').onclick=()=>{if(last)modal.close();else{introStep++;intro();}};}
modal.addEventListener('close',()=>{if($('#intro-next'))finishIntro();});
$('#help').onclick=()=>{introStep=0;intro();};

updateCount();renderConcerns();syncListToggle();requestAnimationFrame(refitView);
let seenIntro=false;try{seenIntro=localStorage.getItem(INTRO_KEY)==='1';}catch{}if(!seenIntro&&world)intro();
for(const button of document.querySelectorAll('.map-tools button,.top-actions button'))button.title=button.getAttribute('aria-label');
// Read-only camera state for manual QA of pan / rotate / zoom / fly (no effect on the page).
window.__islandView=()=>world?.view();
setInterval(()=>{if(world)$('#map').dataset.cameraView=JSON.stringify(world.view());},150);
