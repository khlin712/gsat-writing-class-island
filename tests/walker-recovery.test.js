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
  assert.equal(state.studentCount,47);assert.equal(state.students.filter(p=>p.seated&&p.island==='signup').length,8);assert.ok(w.find('lecturer'));assert.equal(w.find('lecturer').island,'signup');
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
