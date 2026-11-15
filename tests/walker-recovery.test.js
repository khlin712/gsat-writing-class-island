import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../dist/vendor/three.module.min.js';
import {createWalkers} from '../dist/walkers.js';
import {nodes,buildGraph,UNIVERSITY,TRAIL,trailPath,TOP} from '../dist/summit.js';
import {makeRoute} from '../dist/people.js';
import {topics} from '../dist/content.js';
// Minimal label DOM; these are state/geometry tests, not browser or touch validation.
const element=()=>({type:'',className:'',innerHTML:'',classList:{toggle(){}},setAttribute(){},remove(){}});
class Label extends THREE.Object3D{constructor(el){super();this.element=el;}}
test('各類角色在斷橋上跌落、隱藏後仍重生，導覽與訪客恢復原目的地',()=>{
 const old=globalThis.document;globalThis.document={createElement:element};
 try{const positions=nodes(topics),graph=buildGraph(positions),scene=new THREE.Scene();let broken=true;const w=createWalkers({scene,topics,positions,graph,links:[],CSS2DObject:Label,reduced:{matches:false},hazards:{gap:()=>broken}});
  const seg=trailPath(positions.get('fork'),positions.get('pass1'));const chosen=['parent','student','guide','avatar'].map(k=>w.find(k));
  for(const person of chosen){person.route=makeRoute(seg);person.s=person.route.total*.5;person.target='pass1';person.island='fork';person.wait=0;}
  w.update(.05,false);assert.ok(chosen.every(p=>p.fall!==undefined));for(let i=0;i<40;i++)w.update(.05,false);assert.ok(chosen.every(p=>p.fig.userData.hidden));
  broken=false;for(let i=0;i<40;i++)w.update(.05,false);for(const p of chosen){assert.equal(p.fall,undefined);assert.ok(!p.fig.userData.hidden);assert.ok(p.fig.visible);assert.equal(p.island,'start');assert.ok(p.fig.scale.x>.5);}
  assert.equal(w.guide().target,'pass1');assert.equal(w.me().target,'pass1');assert.equal(w.state().studentCount,47);
 }finally{globalThis.document=old;}
});
test('指引牌入場落點分散，行走狀態長時間保持有限且不增生人物',()=>{
 const old=globalThis.document;globalThis.document={createElement:element};
 try{const positions=nodes(topics),graph=buildGraph(positions),scene=new THREE.Scene();const w=createWalkers({scene,topics,positions,graph,links:[],CSS2DObject:Label,reduced:{matches:false}}),ends=new Set();
  for(let i=0;i<2400;i++){w.update(.05,false);for(let k=0;k<47;k++){const p=w.find('student',k);if(p.target==='fork'&&p.route){const e=p.route.pts.at(-1);ends.add(`${e.x.toFixed(1)},${e.z.toFixed(1)}`);}assert.ok(p.fig.position.toArray().every(Number.isFinite));}}
  assert.ok(ends.size>10,`只見到${ends.size}個落點`);assert.equal(w.state().studentCount,47);
 }finally{globalThis.document=old;}
});

test('跌落中以最後一次移動為準，暫停傳送會取消跌落；召回導覽員不再被舊狀態蓋過',()=>{
 const old=globalThis.document;globalThis.document={createElement:element};
 try{const positions=nodes(topics),graph=buildGraph(positions),w=createWalkers({scene:new THREE.Scene(),topics,positions,graph,links:[],CSS2DObject:Label,reduced:{matches:false}}),me=w.me(),guide=w.guide();
  for(const p of [me,guide]){p.fall=1;p.vy=-8;p.resume='calendar';}
  w.avatar.go('contact');w.avatar.go('signup');w.guideTo('calendar');w.guideTo('contact');
  for(let i=0;i<55;i++)w.update(.05,false);assert.equal(me.target,'signup');assert.equal(guide.target,'contact');
  me.fall=1;me.resume='calendar';w.update(0,true);w.avatar.go('contact');assert.equal(me.fall,undefined);assert.equal(me.island,'contact');
  guide.fall=2;guide.fig.userData.hidden=true;guide.fig.visible=false;guide.resume='calendar';assert.ok(w.guideAppear('fork'));assert.equal(guide.fall,undefined);assert.equal(guide.island,'fork');assert.ok(guide.fig.visible);
 }finally{globalThis.document=old;}
});
test('開場兩條橋已有人，露天講堂有老師與八位坐姿學生，總學生仍47',()=>{
 const old=globalThis.document;globalThis.document={createElement:element};
 try{const positions=nodes(topics),w=createWalkers({scene:new THREE.Scene(),topics,positions,graph:buildGraph(positions),links:[],CSS2DObject:Label,reduced:{matches:true}}),state=w.state();
  assert.equal(state.studentCount,47);assert.equal(state.students.filter(p=>p.seated&&p.island==='signup').length,8);assert.ok(w.find('lecturer'));assert.equal(w.find('lecturer').island,'signup');assert.equal(w.find('lecturer').tag,undefined,'授課老師不顯示特殊NPC標記');
  const paths=Array.from({length:47},(_,i)=>w.find('student',i)).filter(p=>p.route).map(p=>p.route.pts[1].path);assert.equal(paths.filter(p=>p==='bridge').length,4);assert.equal(paths.filter(p=>p==='trail').length,16);
  const seated=w.find('student',46);assert.equal(seated.fig.userData.rig.legs[0].rotation.x,-Math.PI/2);w.update(.05,true);assert.equal(seated.fig.userData.rig.legs[0].rotation.x,-Math.PI/2);
 }finally{globalThis.document=old;}
});

test('大雨可將錯誤橋上的人物沖落，不會沖落正確橋人物',()=>{
 const old=globalThis.document,random=Math.random;globalThis.document={createElement:element};
 try{const positions=nodes(topics),w=createWalkers({scene:new THREE.Scene(),topics,positions,graph:buildGraph(positions),links:[],CSS2DObject:Label,reduced:{matches:false},rain:()=>1});Math.random=()=>0;
  w.update(.05,false);assert.ok(w.find('student',1).fall!==undefined);assert.equal(w.find('student',1).fallKind,'rain');assert.equal(w.find('student',0).fall,undefined);
 }finally{Math.random=random;globalThis.document=old;}
});

test('每位學生步速不同，途中能短暫停下，恢復後繼續走',()=>{
 const old=globalThis.document,random=Math.random;globalThis.document={createElement:element};
 try{const positions=nodes(topics),w=createWalkers({scene:new THREE.Scene(),topics,positions,graph:buildGraph(positions),links:[],CSS2DObject:Label,reduced:{matches:false}}),student=w.find('student',0);assert.ok(new Set(w.state().students.filter(p=>!p.seated).map(p=>p.speed)).size>=7);
  const start=student.s;Math.random=()=>0;w.update(.05,false);assert.equal(student.s,start);assert.ok(student.rest>0);Math.random=()=>.99;for(let i=0;i<80;i++)w.update(.05,false);assert.ok(student.s>start);assert.equal(student.fall,undefined);
 }finally{Math.random=random;globalThis.document=old;}
});

test('導覽員在錯誤橋途中要求返回，保留有效行走並最後抵達指引牌',async()=>{
 const {centers,graph:real}=await import('./fixtures/island-models.js');const {along}=await import('../dist/people.js');const old=globalThis.document;globalThis.document={createElement:element};
 try{const arrivals=[],w=createWalkers({scene:new THREE.Scene(),topics,positions:centers,graph:{...real,edges:[...real.edges]},links:[],CSS2DObject:Label,reduced:{matches:false},onGuide:id=>arrivals.push(id)}),guide=w.guide();
  w.guideAppear('fork');assert.ok(w.guideTo('pass1'));guide.s=guide.route.total*.6;const at=along(guide.route,guide.s);guide.fig.position.set(at.x,at.y,at.z);
  assert.equal(w.guideTo('fork'),true,'橋上可接受返回命令');for(let i=0;i<1000&&arrivals.length===0;i++)w.update(.05,false);
  assert.deepEqual(arrivals,['fork']);assert.equal(guide.island,'fork');assert.equal(guide.target,null);
 }finally{globalThis.document=old;}
});
test('導覽員重生後若無法規劃恢復路線，回報安全起點供介面重新開始',async()=>{
 const {centers,graph:real}=await import('./fixtures/island-models.js');const old=globalThis.document;globalThis.document={createElement:element};
 try{const graph={...real,edges:[...real.edges]},arrivals=[],w=createWalkers({scene:new THREE.Scene(),topics,positions:centers,graph,links:[],CSS2DObject:Label,reduced:{matches:false},onGuide:(id,extra)=>arrivals.push({id,extra})}),guide=w.guide();
  guide.fall=3.4;guide.vy=-20;guide.resume='pass1';guide.fig.userData.hidden=true;guide.fig.visible=false;graph.edges.length=0;
  for(let i=0;i<10;i++)w.update(.05,false);assert.equal(guide.island,'start');assert.ok(guide.fig.visible);assert.deepEqual(arrivals,[{id:'start',extra:{recoveryFailed:true}}]);
 }finally{globalThis.document=old;}
});

test('每次刷新建立的16位錯誤橋學生皆沿指引牌→懸崖→攀岩入口向前走',async()=>{
 const {along}=await import('../dist/people.js');const old=globalThis.document;globalThis.document={createElement:element};
 try{for(let refresh=0;refresh<3;refresh++){const positions=nodes(topics),graph=buildGraph(positions),w=createWalkers({scene:new THREE.Scene(),topics,positions,graph,links:[],CSS2DObject:Label,reduced:{matches:false}}),initial=[];
   for(let k=0;k<20;k++){if(k%5===0)continue;const student=w.find('student',k),[from,to]=TRAIL[k%TRAIL.length],forward=graph.edges.find(e=>e.kind==='trail'&&e.from===from&&e.to===to);
    assert.equal(student.island,from);assert.equal(student.target,to,`${from}開場學生不應往${student.target}倒走`);assert.deepEqual(student.route.pts,forward.pts);assert.equal(student.dir,1);
    const at=along(student.route,student.s);assert.ok(Math.cos(student.heading-at.heading)>.99,'開場朝向與前進方向相同');initial.push({student,route:student.route,u:at.trailU});}
   for(let i=0;i<40;i++){w.update(.025,false);for(const p of initial){if(p.student.route!==p.route)continue;const u=along(p.route,p.student.s).trailU;assert.ok(u>=p.u-1e-9,'實際橋上位移不得倒退');p.u=u;}}
  }}finally{globalThis.document=old;}
});

test('完整錯誤橋被雨沖落時先移到橋側，再下降，不能在橋中央縮小消失',async()=>{
 const {along}=await import('../dist/people.js'),{TRAIL_WIDTH}=await import('../dist/hazards.js');const old=globalThis.document,random=Math.random;globalThis.document={createElement:element};
 try{const positions=nodes(topics),w=createWalkers({scene:new THREE.Scene(),topics,positions,graph:buildGraph(positions),links:[],CSS2DObject:Label,reduced:{matches:false},rain:()=>1}),student=w.find('student',1),center=along(student.route,student.s),normal={x:Math.cos(center.heading),z:-Math.sin(center.heading)};
  Math.random=()=>0;w.update(.05,false);const top=student.fig.position.y;assert.equal(student.fallKind,'rain');w.update(.1,false);w.update(.1,false);
  assert.equal(student.fig.position.y,top,'仍在橋面高度橫移');assert.equal(student.fig.scale.x,student.size,'橋面內不能縮小消失');
  for(let i=0;i<3;i++)w.update(.1,false);const offset=Math.abs((student.fig.position.x-center.x)*normal.x+(student.fig.position.z-center.z)*normal.z);assert.ok(offset>TRAIL_WIDTH/2+.06,'墜落前身體已移出完整橋面');assert.ok(student.fig.position.y<top);
 }finally{Math.random=random;globalThis.document=old;}
});

test('跳過走路可立即抵達，清除舊路線、跌落、排程與出生縮放',()=>{
 const old=globalThis.document;globalThis.document={createElement:element};
 try{const positions=nodes(topics),w=createWalkers({scene:new THREE.Scene(),topics,positions,graph:buildGraph(positions),links:[],CSS2DObject:Label,reduced:{matches:false}}),guide=w.guide();
  w.guideTo('pass1');guide.fall=1;guide.vy=-8;guide.resume='pass1';guide.next='fork';guide.fig.userData.hidden=true;guide.fig.visible=false;guide.fig.scale.setScalar(.1);guide.born=.1;
  assert.ok(w.guideAppear('wallfoot',{instant:true}));assert.equal(guide.island,'wallfoot');assert.equal(guide.fall,undefined);assert.equal(guide.born,undefined);assert.equal(guide.route,null);assert.equal(guide.resume,null);assert.equal(guide.next,null);assert.equal(guide.fig.scale.x,guide.size);assert.ok(guide.fig.visible);
 }finally{globalThis.document=old;}
});

test('連續行走的橋頭、橋尾和轉角不突然橫跳，單幀位移有界',()=>{
 const old=globalThis.document;globalThis.document={createElement:element};
 try{const positions=nodes(topics),w=createWalkers({scene:new THREE.Scene(),topics,positions,graph:buildGraph(positions),links:[],CSS2DObject:Label,reduced:{matches:false}}),dt=.02;
  for(let i=0;i<1200;i++){const before=Array.from({length:47},(_,k)=>{const p=w.find('student',k);return {p,route:p.route,at:p.fig.position.clone()};});w.update(dt,false);
   for(const {p,route,at}of before){if(!route||p.route!==route||p.fall!==undefined)continue;const d=Math.hypot(p.fig.position.x-at.x,p.fig.position.z-at.z);assert.ok(d<=(p.speed+.7)*dt+1e-5,`人物單幀橫移${d.toFixed(3)}，上限${((p.speed+.7)*dt).toFixed(3)}`);}
  }
 }finally{globalThis.document=old;}
});

test('角色從起點出生並預設自動探索，自動抵達標明自動、島內漫步不重複抵達',()=>{
 const old=globalThis.document;globalThis.document={createElement:element};
 try{const positions=nodes(topics),arrivals=[],w=createWalkers({scene:new THREE.Scene(),topics,positions,graph:buildGraph(positions),links:[],CSS2DObject:Label,reduced:{matches:false},onArrive:(id,meta)=>arrivals.push({id,meta})}),me=w.me();assert.equal(me.island,'start');assert.equal(me.mode,'auto');
  me.wait=0;w.update(.05,false);assert.ok(me.route&&me.target!=='start');me.s=me.route.total;w.update(.05,false);assert.equal(arrivals.length,1);assert.equal(arrivals[0].meta.automatic,true);
  arrivals.length=0;w.avatar.mode('stroll');me.wait=0;w.update(.05,false);assert.equal(me.target,me.island);me.s=me.route.total;w.update(.05,false);assert.equal(arrivals.length,0,'同島散步不發抵達');
  w.avatar.go('start');me.s=me.route.total;w.update(.05,false);assert.equal(arrivals.length,1);assert.equal(arrivals[0].meta.automatic,false,'手動前往仍發抵達事件');
 }finally{globalThis.document=old;}
});
