import {createWorld} from './world.js';
import {topics,findTopics,makeOutline,explorationRoute,readStored,entryRoutes,concerns,concernsFor,introSteps,INTRO_KEY,stepParts,CIRCLED} from './content.js';
import {buildRelations,findRelations} from './relations.js';
import {SUMMIT,SPAWN_FROM} from './summit.js';
import {mapInsets} from './motion.js';
import {bindSheet} from './sheets.js';
import {AVATAR_KEY,AVATAR_ROLES,SHIRTS,readAvatar} from './walkers.js';
import {HAIR_STYLES} from './people.js';
const $=s=>document.querySelector(s), list=$('#topic-list'), modal=$('#modal');
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const phone=matchMedia('(max-width:720px)'), isPhone=()=>phone.matches;
let selected=null,category='全部',world,showConnections=true,previousFocus=null,entry=null,selectedConcern=null,detailOpener=null,view='concerns',indexBeforeDetail=null,selectedStep=null,hotStep=-1,activeRelation=null;
let stored={};try{stored=readStored(localStorage.getItem('writing-island-course'));}catch{}
let consultQuestions=Array.isArray(stored.questions)?stored.questions.filter(q=>typeof q==='string'&&q.trim()):[];
let saved=new Set(Array.isArray(stored.saved)?stored.saved.filter(id=>topics.some(t=>t.id===id)):[]);
let answers=stored.answers&&typeof stored.answers==='object'&&!Array.isArray(stored.answers)?stored.answers:{};
let role=['學生','家長','其他'].includes(stored.role)?stored.role:'學生',note=typeof stored.note==='string'?stored.note:'';
function persist(){try{localStorage.setItem('writing-island-course',JSON.stringify({saved:[...saved],answers,role,note,questions:consultQuestions}));}catch{toast('瀏覽器無法儲存；本次操作仍可繼續，請先複製提綱。');}}
function toast(message){$('#toast').textContent=message;$('#toast').classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('#toast').classList.remove('show'),3500);}
const relations=buildRelations(topics);
const topicOf=id=>topics.find(t=>t.id===id);
const stepLabel=s=>stepParts(s).label;
const stepItems=t=>t.steps.map((s,k)=>({mark:CIRCLED[k]||k+1,...stepParts(s)}));
// Pins on the island, rows in the card and rows in the index light up together.
function hoverStep(k,on){hotStep=on?k:-1;world?.pinState({hot:hotStep,sel:selectedStep??-1});for(const el of document.querySelectorAll('[data-step]'))el.classList.toggle('hot',on&&+el.dataset.step===k&&(!el.dataset.topic||el.dataset.topic===selected));}
function bindStepRows(root,id){for(const el of root.querySelectorAll('[data-step]')){const k=+el.dataset.step;el.onclick=()=>selectStep(el.dataset.topic||id,k);el.onpointerenter=e=>{if(e.pointerType==='mouse')hoverStep(k,true);};el.onpointerleave=e=>{if(e.pointerType==='mouse')hoverStep(k,false);};el.onfocus=()=>hoverStep(k,true);el.onblur=()=>hoverStep(k,false);}}

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
 const index=$('#index-panel');if(visible(index))rects.push(index.getBoundingClientRect());
 return mapInsets(map,rects);
}
let refitTimer;
function refitView(){clearTimeout(refitTimer);if(world?.flying()){refitTimer=setTimeout(refitView,100);return;}world?.refit(insets());}

// ---- Index: common questions and topic islands, like a book index beside the map. ----
function showView(next,{focusTab=false}={}){view=next;for(const [name,tab]of [['concerns',$('#tab-concerns')],['topics',$('#tab-topics')],['relations',$('#tab-relations')]]){tab.classList.toggle('active',name===next);tab.setAttribute('aria-pressed',name===next);}$('#concerns-view').hidden=next!=='concerns';$('#topics-view').hidden=next!=='topics';$('#relations-view').hidden=next!=='relations';if(next==='relations'){renderRelations();world?.filter(topics.map(t=>t.id));}else renderList();if(focusTab)$('#tab-'+next).focus();}
$('#tab-concerns').onclick=()=>showView('concerns');$('#tab-topics').onclick=()=>showView('topics');$('#tab-relations').onclick=()=>showView('relations');
function renderList(){const visibleTopics=findTopics($('#search').value,category);
 list.innerHTML=visibleTopics.length?visibleTopics.map(t=>{const active=t.id===selected;return `<div class="topic-item${active?' active':''}"><button class="topic-row${active?' active':''}" data-id="${t.id}" aria-pressed="${active}"><span class="num">${t.n}</span><span class="topic-name"><strong>${t.title}</strong><small>${t.tag}${saved.has(t.id)?' · 已收藏':''}</small></span><span class="count" aria-label="${t.steps.length} 個了解重點">${t.steps.length} ↗</span></button>${active?`<ol class="topic-steps" aria-label="${t.title}的了解重點">${stepItems(t).map((it,k)=>`<li><button class="step-link${k===selectedStep?' current':''}" data-topic="${t.id}" data-step="${k}" aria-current="${k===selectedStep}"><span class="pin-no">${it.mark}</span>${it.label}</button></li>`).join('')}</ol>`:''}</div>`;}).join(''):'<p class="empty">沒有找到符合的主題。試試「收費」、「成果」或清除搜尋。</p>';
 $('#result-count').textContent=`${visibleTopics.length} 座主題島`;$('#topic-count').textContent=visibleTopics.length;
 if(view!=='relations'&&!activeRelation)world?.filter(visibleTopics.map(t=>t.id));bindStepRows(list,selected);}
list.addEventListener('click',e=>{const row=e.target.closest('.topic-row[data-id]');if(row)selectTopic(row.dataset.id);});
function renderConcerns(){const items=concernsFor(entry);$('#concerns-list').innerHTML=items.map(c=>`<button data-concern="${c.id}" aria-pressed="${c.id===selectedConcern?.id&&!$('#detail').hidden}"><span class="q-mark" aria-hidden="true">Q</span><span>${c.question}</span><span class="arrow" aria-hidden="true">↗</span></button>`).join('');$('#concern-count').textContent=items.length;$('#entry-note').textContent=entry?entryRoutes[entry].intro:'選一個問題，看看相關做法與待確認資訊。';world?.emphasize(entry?entryRoutes[entry].topics:[]);}
$('#concerns-list').onclick=e=>{const b=e.target.closest('[data-concern]');if(!b)return;const c=concerns.find(c=>c.id===b.dataset.concern);selectTopic(c.topic,{concern:c.id});};
for(const button of document.querySelectorAll('[data-entry]'))button.onclick=()=>{entry=button.dataset.entry;if(entryRoutes[entry].role){role=entryRoutes[entry].role;persist();}for(const b of document.querySelectorAll('[data-entry]'))b.setAttribute('aria-pressed',b===button);showView('concerns');renderConcerns();if(entry==='teacher')selectTopic('teacher');else if(!$('#detail').hidden)closeDetail({restoreFocus:false});};
$('#search').oninput=()=>{if(view==='relations')renderRelations();else{if($('#search').value.trim())showView('topics');renderList();}};
for(const b of document.querySelectorAll('[data-category]'))b.onclick=()=>{category=b.dataset.category;for(const el of document.querySelectorAll('[data-category]')){el.classList.toggle('active',el===b);el.setAttribute('aria-pressed',el===b);}renderList();};

function renderRelations(){const items=findRelations(relations,topics,$('#search').value);$('#relation-count').textContent=items.length;$('#relation-list').innerHTML=items.length?items.map(r=>`<button class="relation-row" aria-pressed="${activeRelation===r.id}" data-relation="${r.id}"><span class="relation-route">${topicOf(r.a).n} ↔ ${topicOf(r.b).n}</span><strong>${topicOf(r.a).title} · ${topicOf(r.b).title}</strong><span>${r.question}</span></button>`).join(''):'<p class="empty">沒有找到關聯，試試主題名稱或清除搜尋。</p>';for(const button of $('#relation-list').querySelectorAll('[data-relation]')){button.onclick=()=>openRelation(button.dataset.relation);button.onpointerenter=()=>world?.hoverRelation(button.dataset.relation);button.onpointerleave=()=>world?.hoverRelation(null);button.onfocus=()=>world?.hoverRelation(button.dataset.relation);button.onblur=()=>world?.hoverRelation(null);}}
function openRelation(id){const r=relations.find(r=>r.id===id);if(!r)return;castCard=null;world?.walkerSelect(null);
 const opener=document.activeElement;if(!$('#detail').hidden)closeDetail({restoreFocus:false});
 activeRelation=id;selected=null;selectedStep=null;world?.pins(null);world?.climb(false);setBird(false);
 $('#detail-crumb').textContent=`主題關聯 · ${topicOf(r.a).n} ↔ ${topicOf(r.b).n}`;
 $('#detail-content').innerHTML=`<div class="detail-head"><span class="detail-badge" aria-hidden="true">↔</span><div><p class="eyebrow">一起了解這兩個主題</p><h2 id="detail-title">${r.question}</h2></div></div><p class="relation-notice">這是依現有主題整理的探索問題，不是已確認的教學做法或成效。</p><div class="relation-stops">${[r.a,r.b].map(tid=>{const t=topicOf(tid);return `<button data-relation-topic="${tid}"><b>${t.n}</b><span><strong>${t.title}</strong><small>${t.intro}</small></span><i aria-hidden="true">↗</i></button>`;}).join('')}</div><section class="card-section"><h3>帶著問題繼續探索</h3><p class="pending-note">老師的具體說明與案例尚待補充。可以分別查看兩個主題，再把這個問題帶進討論。</p></section><div class="detail-actions"><button id="relation-question" class="ask-topic">${consultQuestions.includes(r.question)?'已加入提問 ✓':'把這個關聯問題加入提問'}</button><button id="relation-return" class="save-topic">返回關聯清單</button><small>只會整理提綱，不會寄送訊息。</small></div>`;
 $('#detail').hidden=false;document.body.classList.add('detail-open');if(isPhone()){indexBeforeDetail=indexSheet.state();indexSheet.set('peek');}
 showView('relations');detailOpener=opener?.isConnected?opener:$('#tab-relations');world?.filter(topics.map(t=>t.id));world?.relation(id);
 if(!showConnections){showConnections=true;$('#connection').setAttribute('aria-pressed','true');world?.connections(true);}
 world?.focusRelation(id,insets());$('#map-message').textContent=`正在探索 ${topicOf(r.a).title}與${topicOf(r.b).title}的關聯`;
 for(const button of $('#detail').querySelectorAll('[data-relation-topic]'))button.onclick=()=>selectTopic(button.dataset.relationTopic);
 $('#relation-question').onclick=()=>{if(!consultQuestions.includes(r.question))consultQuestions.push(r.question);saved.add(r.a);saved.add(r.b);persist();updateCount();toast('已加入討論清單，尚未寄送');$('#relation-question').textContent='已加入提問 ✓';};
 $('#relation-return').onclick=()=>{closeDetail({restoreFocus:false});showView('relations');if(isPhone())indexSheet.set('half');const row=[...$('#relation-list').querySelectorAll('[data-relation]')].find(el=>el.dataset.relation===id);(row||$('#tab-relations')).focus();};
 $('#detail').scrollTop=0;$('#close-detail').focus();
}

// ---- Detail card: floats on the left of the map on desktop, a bottom sheet on phones. ----
const audienceLabel={parents:'對象：家長',students:'對象：學生',teacher:'認識老師'};
function selectTopic(id,{focus=true,concern=null}={}){
 const t=topicOf(id);if(!t)return;activeRelation=null;if(castCard){castCard=null;world?.walkerSelect(null);if(placingAvatar)setPlacing(false);}
 if(!findTopics($('#search').value,category).some(t=>t.id===id)){$('#search').value='';category='全部';for(const b of document.querySelectorAll('[data-category]')){const active=b.dataset.category===category;b.classList.toggle('active',active);b.setAttribute('aria-pressed',active);}}
 const moveCamera=id!==selected||$('#detail').hidden;if(focus&&!$('#detail').contains(document.activeElement))detailOpener=document.activeElement;selected=id;selectedConcern=concerns.find(c=>c.id===concern)||null;
 const related=[...new Set([...(selectedConcern?.related||[]),...t.links])];
 $('#detail-crumb').textContent=`主題 ${t.n} · ${t.title}${selectedConcern?' · 常見問題':''}`;
 $('#detail-content').innerHTML=`<div class="detail-head"><span class="detail-badge" style="--badge:${t.color}" aria-hidden="true">${t.n}</span><div><p class="eyebrow">${t.title} · ${t.tag}</p><h2 id="detail-title">${selectedConcern?selectedConcern.question:t.title}</h2></div></div>
 <div class="chips"><span class="chip strong">主題 ${t.n}</span><span class="chip">${t.tag}</span>${selectedConcern?`<span class="chip">${audienceLabel[selectedConcern.audience]}</span>`:''}<span class="chip draft">待老師補充</span></div>
 <div class="answer-first"><p class="lead">${selectedConcern?selectedConcern.answer:t.intro}</p></div>
${id===SUMMIT?routeSection():''}
 <section class="card-section"><h3>重點 · 點一項看細節</h3><ol class="step-rows">${stepItems(t).map((it,k)=>`<li><button class="step-row" data-step="${k}"><b>${it.mark}</b><span><strong>${it.label}</strong><small>${it.question}</small></span><i aria-hidden="true">›</i></button></li>`).join('')}</ol></section>
 <details class="card-section evidence-section"><summary>目前資訊與證據 <span>待補充</span></summary><p>${t.body}</p><dl class="topic-facts">${t.facts.map(([label,value])=>`<div><dt>${label}</dt><dd>${value}</dd></div>`).join('')}</dl></details>
 <details class="card-section question-notes" ${answers[id]?'open':''}><summary>補充你的情況 <span>選填</span></summary><div class="exercise"><label for="exercise-answer">${t.task}</label><textarea id="exercise-answer" maxlength="2000" placeholder="寫下你的顧慮、期待，或還想了解的事…">${escape(typeof answers[id]==='string'?answers[id]:'')}</textarea><small class="helper">只儲存在這個瀏覽器，不會傳送。</small><p class="question-example">${t.example}</p></div></details>
 <section class="card-section"><h3>和這些主題一起看</h3><button class="text-button" id="explore-relations">為什麼這些主題有關聯？ ↗</button><div class="related">${related.map(rid=>{const r=topicOf(rid);return `<button data-related="${rid}"><b>${r.n}</b><span>→ ${r.title}</span><i aria-hidden="true">↗</i></button>`;}).join('')}</div></section>
 <div class="detail-actions"><button class="ask-topic" id="ask-topic">就這件事問老師 ↗</button><button class="save-topic" id="save-topic" aria-pressed="${saved.has(id)}">${saved.has(id)?'✓ 已收藏這個主題':'＋ 先收藏，晚點再聊'}</button><small>先整理諮詢提綱，不會直接送出訊息。</small></div>`;
 const wasHidden=$('#detail').hidden;$('#detail').hidden=false;document.body.classList.add('detail-open');
 if(wasHidden&&isPhone()){indexBeforeDetail=indexSheet.state();indexSheet.set('peek');}
 if(!selectedConcern)showView('topics');
 $('#map-message').textContent=`正在探索 ${t.title} · ${t.tag}`;
 $('#exercise-answer').oninput=e=>{answers[id]=e.target.value;persist();};
 $('#save-topic').onclick=()=>{saved.has(id)?saved.delete(id):saved.add(id);persist();updateCount();selectTopic(id,{focus:false,concern:selectedConcern?.id});$('#save-topic').focus();toast(saved.has(id)?'已加入討論清單':'已從討論清單移除');};
 $('#ask-topic').onclick=()=>{saved.add(id);const question=selectedConcern?.question||t.question;if(!consultQuestions.includes(question))consultQuestions.push(question);persist();updateCount();$('#save-topic').setAttribute('aria-pressed','true');$('#save-topic').textContent='✓ 已收藏這個主題';discussion();};
 $('#explore-relations').onclick=()=>{closeDetail({restoreFocus:false});showView('relations');if(isPhone())indexSheet.set('full');$('#tab-relations').focus();};
 for(const b of document.querySelectorAll('[data-related]'))b.onclick=()=>selectTopic(b.dataset.related);
 selectedStep=null;hotStep=-1;bindStepRows($('#detail-content'),id);world?.pins(id,stepItems(t),{onPick:k=>selectStep(id,k),onHover:hoverStep});world?.pinState({});setBird(false);world?.climb(id===SUMMIT);
 updateMap();renderList();renderConcerns();
 if(moveCamera)world?.focus(id,insets());
 if(!isPhone())document.querySelector('.topic-item.active')?.scrollIntoView({block:'nearest'});
 if(focus){$('#detail').scrollTop=0;$('#close-detail').focus();}
}
function updateMap(){if(activeRelation)world?.relation(activeRelation);else world?.select(selected);world?.connections(showConnections);}
// One key point of an island: what to ask, its status, and a way to carry it into the consultation outline.
function selectStep(id,k){const t=topicOf(id);if(!t)return;const items=stepItems(t),it=items[k];if(!it)return;
 if(selected!==id||$('#detail').hidden)selectTopic(id,{focus:false});
 selectedStep=k;const question=`${it.label}：${it.question}`,asked=consultQuestions.includes(question);
 $('#detail-crumb').textContent=`主題 ${t.n} · ${t.title} › 重點 ${k+1}`;
 $('#detail-content').innerHTML=`<div class="detail-head"><span class="detail-badge" style="--badge:${t.color}" aria-hidden="true">${t.n}</span><div><p class="eyebrow">${t.title} · 了解重點 ${k+1} / ${items.length}</p><h2 id="detail-title"><span class="step-mark">${it.mark}</span>${it.label}</h2></div></div>
 <div class="chips"><span class="chip strong">重點 ${k+1}</span><span class="chip">${t.tag}</span><span class="chip draft">待老師補充</span></div>
 <div class="answer-first"><p class="lead">${it.question||it.label}</p></div>
 <section class="card-section"><h3>老師的說明</h3><p class="pending-note">老師還沒有提供這一點的說明。可以先把這個問題放進諮詢提綱，見面時直接問。</p></section>
 <nav class="step-nav" aria-label="切換了解重點">${k>0?`<button data-step="${k-1}"><small>上一個</small><span>${items[k-1].mark} ${items[k-1].label}</span></button>`:'<span></span>'}${k<items.length-1?`<button data-step="${k+1}" class="next"><small>下一個</small><span>${items[k+1].mark} ${items[k+1].label}</span></button>`:'<span></span>'}</nav>
 <div class="detail-actions"><button class="ask-topic" id="ask-step" aria-pressed="${asked}">${asked?'✓ 已加入提問':'把這個問題加入提問 ↗'}</button><button class="save-topic" id="back-topic">← 回到「${t.title}」</button><small>先整理諮詢提綱，不會直接送出訊息。</small></div>`;
 bindStepRows($('#detail-content .step-nav'),id);
 $('#ask-step').onclick=()=>{if(!consultQuestions.includes(question))consultQuestions.push(question);saved.add(id);persist();updateCount();$('#ask-step').textContent='✓ 已加入提問';$('#ask-step').setAttribute('aria-pressed','true');toast('已加入討論清單的提問');};
 $('#back-topic').onclick=()=>{selectTopic(id);world?.focus(id,insets());};
 hotStep=-1;world?.pinState({sel:k});renderList();$('#map-message').textContent=`正在看 ${t.title} · 重點 ${k+1}`;
 world?.focusStep(id,k,items.length,insets());$('#detail').scrollTop=0;$('#detail-title').setAttribute('tabindex','-1');$('#detail-title').focus({preventScroll:true});}
// ---- The way to the results summit: silver then gold stairs from 03, the trophy, then on to the university. ----
function routeSection(){return `<section class="card-section stairs-section"><h3>從課堂走到大學</h3><p class="stairs-note">地圖後方的半圓步道從「03 課堂怎麼進行」出發：先是銀色階梯，經過平台後換成金色階梯，一路通到獎盃。點獎盃或階梯，獎盃和整條步道會一起亮起來。走過獎盃後，學生走進大學、消失在門裡，新的學生會從「${escape(topicOf(SPAWN_FROM)?.title||'')}」的主建築走出來。獎盃是「成果」的象徵；大學建築只象徵升學目標，不代表任何得獎或錄取紀錄，也沒有與任何學校合作。</p></section>`;}
function closeDetail({restoreFocus=true}={}){const id=selected,relationId=activeRelation;activeRelation=null;castCard=null;world?.walkerSelect(null);world?.stopFollow();if(placingAvatar)setPlacing(false);$('#avatar-button').setAttribute('aria-expanded','false');$('#detail').hidden=true;document.body.classList.remove('detail-open');selected=null;selectedConcern=null;selectedStep=null;world?.pins(null);world?.climb(false);
 if(isPhone()&&indexBeforeDetail)indexSheet.set(indexBeforeDetail);indexBeforeDetail=null;
 updateMap();renderList();renderConcerns();renderRelations();refitView();$('#map-message').textContent='點一座島，開始你的寫作旅程';
 if(!restoreFocus)return;const row=document.querySelector(`.topic-row[data-id="${id}"]`);const relationRow=relationId?[...$('#relation-list').querySelectorAll('[data-relation]')].find(el=>el.dataset.relation===relationId):null;const target=[relationRow,detailOpener,row,$('#concerns-list button'),$('#tab-concerns')].find(el=>el?.isConnected&&el.getClientRects().length);target?.focus();}
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

// ---- People on the map: the guide, island residents, relation walkers and the visitor's own character. ----
// All of them are map characters; none stands for a real teacher, student, parent or case.
let avatarLook=(()=>{try{return readAvatar(localStorage.getItem(AVATAR_KEY));}catch{return readAvatar('');}})();
let castCard=null,castTab='look',placingAvatar=false,avatarStatus='在「01 認識老師」散步',arrivedAt=null;
const islandLog=[];
function saveAvatar(){try{localStorage.setItem(AVATAR_KEY,JSON.stringify(avatarLook));}catch{toast('瀏覽器無法儲存角色外觀；這次仍可使用。');}}
function logEvent(text,{id=null}={}){const d=new Date(),pad=n=>String(n).padStart(2,'0');islandLog.unshift({time:`${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`,text,id});if(islandLog.length>40)islandLog.pop();if(modal.open&&$('#log-list'))renderLog();}
function renderLog(){$('#log-list').innerHTML=islandLog.length?islandLog.map((e,i)=>`<li><time>${e.time}</time><span>${escape(e.text)}</span>${e.id?`<button data-log="${i}">看這座島 ↗</button>`:''}</li>`).join(''):'<li class="empty">島上還很安靜。導覽員或你的角色抵達一座島時，會記在這裡。</li>';for(const b of $('#log-list').querySelectorAll('[data-log]'))b.onclick=()=>{modal.close();selectTopic(islandLog[+b.dataset.log].id);};}
$('#log').onclick=()=>{showModal(`<p class="kicker">ISLAND LOG · 島上日誌</p><h2>島上剛剛發生的事</h2><p class="helper">記錄導覽員與你的角色抵達哪座島。只存在這次瀏覽，重新整理就會清空。</p><ol class="log-list" id="log-list"></ol>`);renderLog();};
$('#people').onclick=()=>{const on=$('#people').getAttribute('aria-pressed')!=='true';$('#people').setAttribute('aria-pressed',on);$('#people').setAttribute('aria-label',on?'隱藏人物':'顯示人物');$('#people').title=$('#people').getAttribute('aria-label');world?.people(on);$('#map-message').textContent=on?'島上的人物出來走動了':'已隱藏人物（你的角色仍會留在島上）';};
function openCastCard(kind,crumb,html){const opener=document.activeElement;if(!$('#detail').hidden)closeDetail({restoreFocus:false});
 activeRelation=null;selected=null;selectedStep=null;selectedConcern=null;castCard=kind;world?.pins(null);world?.climb(false);setBird(false);
 $('#detail-crumb').textContent=crumb;$('#detail-content').innerHTML=html;$('#detail').hidden=false;document.body.classList.add('detail-open');
 if(isPhone()){indexBeforeDetail=indexSheet.state();indexSheet.set('peek');}
 detailOpener=opener?.isConnected&&opener!==document.body&&!$('#detail').contains(opener)?opener:$('#avatar-button');updateMap();renderList();$('#detail').scrollTop=0;}
const followLabel=()=>world?.following()?'鏡頭跟隨中 · 按下停止':'讓鏡頭跟隨';
function bindFollow(w){const b=$('#cast-follow');if(!b)return;b.onclick=()=>{if(world?.following())world.stopFollow();else world?.walkerFocus(castCard==='avatar'?world.me():w,insets());b.textContent=followLabel();b.setAttribute('aria-pressed',!!world?.following());};}
function onWalker(w){if(w.kind==='messenger'){openRelation(w.key);world?.walkerSelect(w);toast('這位行人帶著兩座島之間的關聯問題');return;}if(w.kind==='avatar'){openAvatar();return;}if(w.kind==='guide'){openGuide();return;}openResident(w);}
function openResident(w){const t=topicOf(w.island);if(!t)return;
 openCastCard('resident',`島上居民 · ${t.n} ${t.title}`,`<div class="detail-head"><span class="detail-badge cast-badge" aria-hidden="true">☻</span><div><p class="eyebrow">島上居民 · ${t.n} ${t.title}</p><h2 id="detail-title">在「${t.title}」散步的人</h2></div></div><p class="relation-notice">島上居民是讓地圖熱鬧起來的裝飾角色，不代表真實的學生、家長或案例。</p><div class="detail-actions"><button class="ask-topic" id="cast-island">看「${t.title}」這座島 ↗</button><button class="save-topic" id="cast-follow" aria-pressed="true">鏡頭跟隨中 · 按下停止</button></div>`);
 world?.walkerSelect(w);world?.walkerFocus(w,insets());bindFollow(w);$('#cast-island').onclick=()=>selectTopic(t.id);$('#map-message').textContent=`正在看 ${t.title}的島上居民`;$('#close-detail').focus();}
function guideWhere(){const g=world?.walkerState().guide;if(!g)return '';const t=topicOf(g.target||g.island);return g.target?`正走向 ${t.n} ${t.title}`:`停在 ${t.n} ${t.title}`;}
function openGuide(){const g=world?.guide();if(!g)return;
 openCastCard('guide','地圖角色 · 導覽員',`<div class="detail-head"><span class="detail-badge cast-badge guide" aria-hidden="true">⚑</span><div><p class="eyebrow">地圖角色 · 帶路</p><h2 id="detail-title">導覽員</h2></div></div><div class="chips"><span class="chip strong" id="guide-where" aria-live="polite">${guideWhere()}</span></div><div class="answer-first"><p class="lead">導覽員依 01 到 09 的順序走過每座島，每到一座就停一下，再走向下一座。</p></div><p class="relation-notice">導覽員是帶路用的地圖角色，不代表老師本人或任何真實人物。</p><div class="detail-actions"><button class="ask-topic" id="guide-tour">從導覽員所在的島開始導覽 ↗</button><button class="save-topic" id="cast-follow" aria-pressed="true">鏡頭跟隨中 · 按下停止</button></div>`);
 world.walkerSelect(g);world.walkerFocus(g,insets());bindFollow(g);
 $('#guide-tour').onclick=()=>{const st=world.walkerState().guide;tourIndex=Math.max(0,tour.indexOf(st.target||st.island));closeDetail({restoreFocus:false});guide();};
 $('#map-message').textContent='跟著導覽員看九座島';$('#close-detail').focus();}
function avatarPanel(){const a=avatarLook,me=world?.walkerState().me;
 if(castTab==='look')return `<div class="cast-field"><label for="avatar-name">名字</label><input id="avatar-name" maxlength="8" autocomplete="off" value="${escape(a.name)}" placeholder="幫角色取個名字（選填）"></div>
 <div class="cast-field"><span class="cast-label" id="pick-role">身分</span><div class="cast-options" role="group" aria-labelledby="pick-role">${Object.keys(AVATAR_ROLES).map(r=>`<button data-pick="role" data-value="${r}" aria-pressed="${a.role===r}">${r}</button>`).join('')}</div><small class="helper">學生背書包、家長揹側背包，只改變外觀。</small></div>
 <div class="cast-field"><span class="cast-label" id="pick-hair">髮型</span><div class="cast-options" role="group" aria-labelledby="pick-hair">${Object.entries(HAIR_STYLES).map(([k,v])=>`<button data-pick="hairStyle" data-value="${k}" aria-pressed="${a.hairStyle===k}">${v}</button>`).join('')}</div></div>
 <div class="cast-field"><span class="cast-label" id="pick-shirt">衣服顏色</span><div class="cast-options" role="group" aria-labelledby="pick-shirt">${SHIRTS.map((c,i)=>`<button class="swatch" style="--swatch:${c}" data-pick="shirt" data-value="${c}" aria-pressed="${a.shirt===c}" aria-label="衣服顏色 ${i+1}"></button>`).join('')}</div></div>
 <p class="helper">角色外觀只存在這個瀏覽器，不會上傳。</p>`;
 const mode=me?.mode||'stroll';
 return `<p class="cast-status" id="avatar-status" aria-live="polite">${escape(avatarStatus)}</p><div id="avatar-arrived">${arrivedAt?`<button class="text-button" id="avatar-open-island">看「${topicOf(arrivedAt).title}」這座島 ↗</button>`:''}</div>
 <div class="cast-options wide" role="group" aria-label="角色怎麼走"><button data-mode="stroll" aria-pressed="${mode==='stroll'&&!placingAvatar}">自由漫步</button><button data-mode="auto" aria-pressed="${mode==='auto'&&!placingAvatar}">自動逛逛</button><button id="avatar-place" aria-pressed="${placingAvatar}">點地圖指定</button></div>
 <h3 class="cast-subhead">前往某座島</h3><div class="cast-islands">${topics.map(t=>`<button data-go="${t.id}" aria-current="${me?.target===t.id}"><b>${t.n}</b>${t.title}</button>`).join('')}</div>`;}
function renderAvatar(focusSel){const panel=$('#cast-panel');if(!panel)return;panel.innerHTML=avatarPanel();for(const b of document.querySelectorAll('[data-cast-tab]')){b.setAttribute('aria-pressed',b.dataset.castTab===castTab);}
 $('#avatar-name')?.addEventListener('input',e=>{avatarLook={...avatarLook,name:e.target.value.trim().slice(0,8)};saveAvatar();world?.avatarLook(avatarLook);$('#detail-title').textContent=avatarLook.name||'我的角色';});
 for(const b of panel.querySelectorAll('[data-pick]'))b.onclick=()=>{avatarLook={...avatarLook,[b.dataset.pick]:b.dataset.value};saveAvatar();world?.avatarLook(avatarLook);renderAvatar(`[data-pick="${b.dataset.pick}"][data-value="${b.dataset.value}"]`);};
 for(const b of panel.querySelectorAll('[data-mode]'))b.onclick=()=>{setPlacing(false);world?.avatarMode(b.dataset.mode);const t=topicOf(world?.walkerState().me.island);avatarStatus=b.dataset.mode==='auto'?'自動逛逛中：角色會自己挑下一座島':`在「${t.n} ${t.title}」自由漫步`;arrivedAt=null;world?.walkerFocus(world.me(),insets());renderAvatar(`[data-mode="${b.dataset.mode}"]`);};
 $('#avatar-place')?.addEventListener('click',()=>{setPlacing(!placingAvatar);renderAvatar('#avatar-place');});
 for(const b of panel.querySelectorAll('[data-go]'))b.onclick=()=>sendAvatar(b.dataset.go);
 $('#avatar-open-island')?.addEventListener('click',()=>selectTopic(arrivedAt));
 if(focusSel)panel.querySelector(focusSel)?.focus();}
function sendAvatar(id,spot){const t=topicOf(id);if(!t)return;setPlacing(false);world?.avatarGo(id,spot);arrivedAt=null;const me=world?.walkerState().me;avatarStatus=me?.target?`正走向 ${t.n} ${t.title}`:`已抵達 ${t.n} ${t.title}`;if(!me?.target)arrivedAt=id;if(castCard==='avatar'){castTab='trip';renderAvatar(`[data-go="${id}"]`);}world?.walkerFocus(world.me(),insets());$('#map-message').textContent=`${avatarLook.name||'你的角色'}${me?.target?'正走向':'已抵達'}「${t.title}」`;}
function setPlacing(on){placingAvatar=on;world?.placing(on);$('#map').classList.toggle('placing',on);if(on){world?.stopFollow();$('#map-message').textContent='點地圖指定：點一座島上的位置，角色會走過去';}else if($('#map-message').textContent.startsWith('點地圖指定'))$('#map-message').textContent='點一座島，開始你的寫作旅程';}
function onPlace(id,spot){if(!id){toast('請點在島上的地面，角色才走得過去');return;}sendAvatar(id,spot);}
function onArrive(id){const t=topicOf(id);if(!t)return;arrivedAt=id;avatarStatus=`已抵達 ${t.n} ${t.title}`;toast(`${avatarLook.name||'你的角色'}抵達「${t.title}」`);if(castCard==='avatar'&&castTab==='trip')renderAvatar();}
function openAvatar(){castTab=castTab||'look';
 openCastCard('avatar','我的角色',`<div class="detail-head"><span class="detail-badge cast-badge me" aria-hidden="true">我</span><div><p class="eyebrow">我的角色 · 只存在這個瀏覽器</p><h2 id="detail-title">${escape(avatarLook.name||'我的角色')}</h2></div></div><div class="cast-tabs" role="group" aria-label="角色設定"><button data-cast-tab="look" aria-pressed="${castTab==='look'}">外觀</button><button data-cast-tab="trip" aria-pressed="${castTab==='trip'}">行程</button></div><div id="cast-panel"></div><div class="detail-actions"><button class="save-topic" id="cast-follow" aria-pressed="true">鏡頭跟隨中 · 按下停止</button></div>`);
 for(const b of document.querySelectorAll('[data-cast-tab]'))b.onclick=()=>{castTab=b.dataset.castTab;if(castTab!=='trip')setPlacing(false);renderAvatar(`[data-cast-tab="${castTab}"]`);};
 renderAvatar();world?.walkerSelect(world.me());world?.walkerFocus(world.me(),insets());bindFollow(world?.me());$('#avatar-button').setAttribute('aria-expanded','true');$('#map-message').textContent='你的角色在島上 · 可以換外觀，或叫它走去某座島';$('#close-detail').focus();}
$('#avatar-button').onclick=()=>{if(castCard==='avatar')closeDetail();else openAvatar();};
// Keep live text on the open character card current while people walk.
setInterval(()=>{if(!castCard||!world)return;const b=$('#cast-follow');if(b){b.textContent=followLabel();b.setAttribute('aria-pressed',world.following());}if(castCard==='guide'&&$('#guide-where'))$('#guide-where').textContent=guideWhere();if(castCard!=='avatar')$('#avatar-button').setAttribute('aria-expanded','false');},400);

// ---- Map tools and top actions. ----
$('#reset').onclick=()=>{if(!$('#detail').hidden)closeDetail({restoreFocus:false});world?.home(insets());setBird(false);};
$('#zoom-in').onclick=()=>world?.zoom(.85);$('#zoom-out').onclick=()=>world?.zoom(1.15);
$('#connection').onclick=()=>{showConnections=!showConnections;$('#connection').setAttribute('aria-pressed',showConnections);updateMap();};
$('#names').onclick=()=>{const on=$('#names').getAttribute('aria-pressed')!=='true';$('#names').setAttribute('aria-pressed',on);$('#names').setAttribute('aria-label',on?'隱藏島名':'顯示島名');world?.names(on);};
function setPaused(paused){document.body.classList.toggle('paused',paused);$('#pause').setAttribute('aria-pressed',paused);$('#pause').innerHTML=paused?'<i>▷</i><span>播放</span>':'<i>Ⅱ</i><span>暫停</span>';$('#pause').setAttribute('aria-label',paused?'播放動畫':'暫停動畫');$('#pause').title=paused?'播放動畫':'暫停動畫';world?.pause(paused);}
$('#pause').onclick=()=>setPaused(!document.body.classList.contains('paused'));
const TIMES=['day','dusk','night','dawn'],TIME_NAMES={dawn:'清晨',day:'白天',dusk:'黃昏',night:'夜晚'},TIME_ICONS={dawn:'◒',day:'☀',dusk:'◓',night:'☾'};let timeOfDay='day';
function setTime(name){timeOfDay=name;const next=TIMES[(TIMES.indexOf(name)+1)%TIMES.length];document.body.classList.toggle('night',name==='night');document.body.dataset.time=name;$('#day').innerHTML=`<i>${TIME_ICONS[name]}</i><span>${TIME_NAMES[name]}</span>`;$('#day').setAttribute('aria-label',`時段：${TIME_NAMES[name]}，按下切換到${TIME_NAMES[next]}`);$('#day').title=`切換到${TIME_NAMES[next]}`;world?.time(name);}
$('#day').onclick=()=>setTime(TIMES[(TIMES.indexOf(timeOfDay)+1)%TIMES.length]);
function setBird(on){$('#bird').setAttribute('aria-pressed',on);$('#bird').setAttribute('aria-label',on?'回到一般視角':'鳥瞰全島');}
$('#bird').onclick=()=>{const on=$('#bird').getAttribute('aria-pressed')!=='true';if(!$('#detail').hidden)closeDetail({restoreFocus:false});world?.home({...insets(),bird:on});setBird(on);$('#map-message').textContent=on?'鳥瞰 · 從正上方看九座島':'點一座島，開始你的寫作旅程';};
$('#tools-toggle').onclick=()=>{const open=document.body.classList.toggle('tools-open');$('#tools-toggle').setAttribute('aria-expanded',open);requestAnimationFrame(refitView);};
$('#rotate').onclick=()=>{const rotate=$('#rotate').getAttribute('aria-pressed')!=='true';$('#rotate').setAttribute('aria-pressed',rotate);world?.mode(rotate);$('#map-message').textContent=rotate?'旋轉模式 · 拖曳改變視角':'平移模式 · 拖曳上下左右移動';};
// 清單: phones fold the index sheet down to a slim bar; desktop slides the index away to widen the map.
function syncListToggle(){const open=isPhone()?!$('#index-panel').classList.contains('sheet-peek'):!document.body.classList.contains('index-collapsed');$('#list-toggle').setAttribute('aria-expanded',open);$('#list-toggle').classList.toggle('active',open);}
$('#list-toggle').onclick=()=>{if(isPhone())indexSheet.set(indexSheet.state()==='peek'?'half':'peek');else{document.body.classList.toggle('index-collapsed');syncListToggle();}};

try{world=createWorld($('#map'),topics,id=>selectTopic(id),{onRelation:openRelation,onWalker,onArrive,onLog:logEvent,onPlace,avatar:avatarLook});setPaused(matchMedia('(prefers-reduced-motion: reduce)').matches);}catch(error){$('#map').innerHTML='<p class="webgl-message">這個瀏覽器無法開啟 3D 地圖。請使用主題清單繼續探索。</p>';console.error(error);}
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

updateCount();renderConcerns();renderRelations();syncListToggle();requestAnimationFrame(refitView);
let seenIntro=false;try{seenIntro=localStorage.getItem(INTRO_KEY)==='1';}catch{}if(!seenIntro&&world)intro();
for(const button of document.querySelectorAll('.map-tools button,.top-actions button'))button.title=button.getAttribute('aria-label');
// Read-only camera state for manual QA of pan / rotate / zoom / fly (no effect on the page).
window.__islandView=()=>world?.view();
window.__islandPeople=()=>world?.walkerState();window.__walkerPoint=(kind,i)=>world?.walkerPoint(kind,i);window.__islandPoint=(id,dx,dz)=>world?.islandPoint(id,dx,dz);
window.__islandClimb=()=>({stairs:world?.stairsLit(),trophy:world?.trophy()});window.__stairPoint=t=>world?.stairPoint(t);
setInterval(()=>{if(world)$('#map').dataset.cameraView=JSON.stringify(world.view());},150);
