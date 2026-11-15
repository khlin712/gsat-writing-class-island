import * as THREE from './vendor/three.module.min.js';
import {makeFigure,pose,applyPose,makeRoute,along,islandTop,FIGURE_SCALE,FRONT_Z} from './people.js';
import {STATIONS} from './journey.js';
import {ROPES} from './route3d.js';
import {walkRoute as findRoute,UNIVERSITY,SUMMIT,SPAWN_FROM,RESTART,STOPS,CLIFFS} from './summit.js';

// Who walks on the map:
// - parents (one per island to begin with) stroll on an island's front path, and now and then walk over to another island;
// - STUDENTS students in all (the teacher's current number of students): some carry a notebook back and forth on each relation
//   that has a real walkway, the rest wander from island to island; now and then one climbs the stairs past the trophy and
//   reaches the university: half walk in and disappear (going on to university) and come out again on SPAWN_FROM (the start), so the
//   count holds; the other half turn away and carry on to the calendar, sign-up and contact islands;
// - the guide waits at the start; when a visitor asks, it leads them round the journey (GUIDE_ROUTE) one stop at a time;
// - "my character" is the visitor's own figure, which walks wherever they send it.
// Everyone walks on walkways and stairs, never through the air. All of them are decorative map characters, not real people.
const RESIDENTS=[
 {shirt:'#e07a5f',hair:'#3a2e28',hairStyle:'short',skin:'#efcaa6',prop:'backpack',accent:'#5f8fb4'},
 {shirt:'#6f9bb8',hair:'#5a3d2b',hairStyle:'long',skin:'#f3d6bb',pants:'#6b5d52'},
 {shirt:'#8fb07a',hair:'#2a2622',hairStyle:'bun',skin:'#d9a983',prop:'bag',accent:'#c9774f'},
 {shirt:'#e3b85a',hair:'#3d3330',hairStyle:'cap',skin:'#f1cfae',accent:'#4f7d74'},
 {shirt:'#a688bd',hair:'#6b4a33',hairStyle:'short',skin:'#e4b994',pants:'#3f4a5a'},
 {shirt:'#e9e1d0',hair:'#2f2a28',hairStyle:'long',skin:'#f5dcc4',pants:'#5d7186',prop:'backpack',accent:'#d0695a'}
];
// The teacher's current number of students (given by the teacher). Change it here when the class size changes.
export const STUDENTS=47;
// The guide's round: ① start → ② trailhead → results (the trophy, over the bridge) → ④ university → ⑤ calendar → ⑥ sign-up → ⑦ contact → ① again.
export const GUIDE_ROUTE=['start','fork',SUMMIT,UNIVERSITY,'calendar','signup','contact'];
const PARENTS=[{shirt:'#7d8a96',pants:'#3f4652',hair:'#2f2a28',hairStyle:'short',skin:'#e9c3a0',prop:'bag',accent:'#8a5a3b'},{shirt:'#b07d6a',pants:'#4a4040',hair:'#4a3a30',hairStyle:'long',skin:'#f1cfae',prop:'bag',accent:'#5b6f60'},{shirt:'#6e8a74',pants:'#3a4250',hair:'#3a3330',hairStyle:'bun',skin:'#d9a983'}];
const STUDENT_SHIRTS=['#e07a5f','#5f8fb4','#7aa66b','#e2b84c','#9a7bb8','#4f7d74','#f0f0ea','#d98fa0'],STUDENT_HAIR=['short','long','bun','cap','short','long'];
const studentLook=i=>({shirt:STUDENT_SHIRTS[i%STUDENT_SHIRTS.length],hairStyle:STUDENT_HAIR[(i*5)%STUDENT_HAIR.length],hair:['#2a2622','#3a2e28','#5a3d2b'][i%3],skin:['#efcaa6','#e4b994','#f5dcc4','#d9a983'][(i*3)%4],pants:['#3f4f63','#4e5d6c','#5d5248'][i%3],prop:i%3?'backpack':'book',accent:['#d0695a','#5f8fb4','#e2b84c','#7aa66b','#fff3cf'][i%5]});
export const SHIRTS=['#e07a5f','#5f8fb4','#7aa66b','#e2b84c','#9a7bb8','#4f7d74'];
export const AVATAR_ROLES={學生:'backpack',家長:'bag',其他:null};
export const AVATAR_KEY='writing-island-avatar';
export function readAvatar(raw){let v={};try{v=JSON.parse(raw)||{};}catch{}
 return {name:typeof v.name==='string'?v.name.trim().slice(0,8):'',role:v.role in AVATAR_ROLES?v.role:'學生',hairStyle:['short','long','bun','cap'].includes(v.hairStyle)?v.hairStyle:'short',shirt:SHIRTS.includes(v.shirt)?v.shirt:SHIRTS[0]};}
const avatarLook=a=>({shirt:a.shirt,hairStyle:a.hairStyle,hair:'#3a2e28',skin:'#efcaa6',pants:'#3f4f63',prop:AVATAR_ROLES[a.role],accent:a.role==='家長'?'#8a5a3b':'#f2c14e'});
const GUIDE_SPOT={x:-.12,z:.74},AVATAR_SPOT={x:.16,z:.68},DOOR={x:0,z:.5},EXIT={x:0,z:.6};

export function createWalkers({scene,topics,positions,graph,links,CSS2DObject,reduced,avatar:initial,onArrive=()=>{},onLog=()=>{},onGuide=()=>{}}){
 const group=new THREE.Group();group.name='walkers';scene.add(group);
 const walkers=[],byId=id=>topics.find(t=>t.id===id)||(s=>s&&{id,n:s.n,title:s.short})(STATIONS.find(s=>s.id===id)),order=topics.map(t=>t.id);
 const ring=new THREE.Mesh(new THREE.RingGeometry(.15,.2,28).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:'#e2793f',transparent:true,opacity:.9,depthWrite:false}));ring.position.y=.008;ring.raycast=()=>{};ring.visible=false;
 function tag(w,text,className){const el=document.createElement('button');el.type='button';el.className='walker-tag '+className;el.innerHTML=text;el.tabIndex=-1;el.onclick=e=>{e.stopPropagation();onClickAll(w);};const o=new CSS2DObject(el);o.position.set(0,.82,0);w.fig.add(o);w.tag={el,o};}
 function spawn(kind,look,props){const fig=makeFigure(look);const size=FIGURE_SCALE*(props?.grown||1);fig.scale.setScalar(size);group.add(fig);
  const w={kind,fig,size,route:null,s:0,dir:1,speed:.3,wait:0,phase:Math.random()*6,heading:0,walking:0,sliding:0,...props};fig.userData.walker=w;walkers.push(w);return w;}
 const place=(w,p,heading=0)=>{w.fig.position.set(p.x,p.y,p.z);w.heading=heading;w.fig.rotation.y=heading;};

 // Parents: one per island, a little taller, on the paved path along the front edge.
 topics.forEach((t,i)=>{const p=positions.get(t.id),x=i%2?.4:-.42,w=spawn('parent',PARENTS[i%PARENTS.length],{island:t.id,grown:1.14,speed:.13+.02*(i%3),wait:1+i%3});place(w,{x:p.x+x,y:islandTop(p),z:p.z+FRONT_Z});});
 // Relation walkers: back and forth along the walkway of each relation that has one, notebook in hand.
 links.map(l=>({...l,edge:graph.edges.find(e=>e.kind==='bridge'&&e.from===l.a&&e.to===l.b)})).filter(l=>l.edge).forEach((l,i)=>{const route=makeRoute(l.edge.pts);const w=spawn('messenger',{...studentLook(i*7+2),prop:'book',accent:'#fff3cf'},{key:l.key,a:l.a,b:l.b,route,speed:.36,s:route.total*((i*.37)%1),dir:i%2?1:-1});
  const A=byId(l.a),B=byId(l.b);tag(w,`<b>${A.n}↔${B.n}</b><span>學生 · 帶著關聯問題</span>`,'bubble');w.tag.el.setAttribute('aria-label',`學生（關聯步道）：${A.title} 與 ${B.title}`);place(w,along(route,w.s));});
 // The guide: round the journey stops in order, a short stop at each.
 const guideSpot=id=>STOPS[id]?.ledge?{x:.12,z:.22}:GUIDE_SPOT;
 const guide=spawn('guide',{shirt:'#2f6f73',pants:'#38424f',hair:'#2a2622',hairStyle:'cap',accent:'#f2c14e',prop:'flag',skin:'#e7bf98'},{island:GUIDE_ROUTE[0],next:null,speed:.48,wait:0});
 {const p=positions.get(GUIDE_ROUTE[0]);place(guide,{x:p.x+GUIDE_SPOT.x,y:islandTop(p),z:p.z+GUIDE_SPOT.z});}
 tag(guide,'<i>⚑</i><span>導覽員</span>','guide-tag');guide.tag.el.setAttribute('aria-label','導覽員');
 // The other students wander from island to island; a few at a time head up the stairs to the university.
 const ground=[...order.filter(id=>id!==SUMMIT),'start','calendar','signup','contact'],messengerCount=walkers.filter(w=>w.kind==='messenger').length;
 const spotOn=()=>{if(Math.random()<.5)return {x:-.62+Math.random()*1.24,z:.58+Math.random()*.12};const a=Math.random()*Math.PI*2;return {x:Math.cos(a)*.95,z:Math.sin(a)*.95};};
 const students=Array.from({length:Math.max(0,STUDENTS-messengerCount)},(_,k)=>{const w=spawn('student',studentLook(k),{island:ground[k%ground.length],speed:.3+(k%5)*.035,wait:Math.random()*6});teleport(w,w.island,spotOn());w.heading=Math.random()*6;return w;});
 // My character.
 let look=readAvatar(JSON.stringify(initial||{})),onClickAll=()=>{},frozen=false;
 let me=null;
 function makeMe(){const old=me;me=spawn('avatar',avatarLook(look),{island:old?.island||order[0],speed:.62,mode:old?.mode||'stroll',wait:old?.wait??1.2,target:old?.target||null,route:old?.route||null,s:old?.s||0});
  if(old){place(me,old.fig.position,old.heading);me.sliding=old.sliding;remove(old);if(ring.parent===old.fig)me.fig.add(ring);}else{const p=positions.get(me.island);place(me,{x:p.x+AVATAR_SPOT.x,y:islandTop(p),z:p.z+AVATAR_SPOT.z});}
  tag(me,`<i>我</i><span>${look.name?escapeHtml(look.name):'我的角色'}</span>`,'me-tag');me.tag.el.setAttribute('aria-label','我的角色');}
 function remove(w){group.remove(w.fig);w.tag?.o.removeFromParent();w.tag?.el.remove();walkers.splice(walkers.indexOf(w),1);}
 makeMe();

 function stand(w,dt,heading=0){w.walking+=(0-w.walking)*Math.min(1,dt*8);w.heading=turn(w.heading,heading,dt*4);}
 function turn(a,b,k){let d=b-a;while(d>Math.PI)d-=2*Math.PI;while(d<-Math.PI)d+=2*Math.PI;return a+d*Math.min(1,k);}
 // Walk w along its route; returns true on arrival.
 function walkRoute(w,dt){w.s+=w.speed*(w.climbing>.5?.3:w.riding?1.8:w.onTrail?.6:1)*dt*w.dir;const end=w.dir>0?w.s>=w.route.total:w.s<=0;w.s=Math.max(0,Math.min(w.route.total,w.s));const at=along(w.route,w.s);
  w.fig.position.set(at.x,at.y,at.z);if(at.heading!==null)w.heading=turn(w.heading,w.dir>0?at.heading:at.heading+Math.PI,dt*10);w.climbing=at.climb?1:0;w.onTrail=at.trail;if(at.climb&&w.rope){w.fig.position.x+=ROPE_T.x*w.rope;w.fig.position.z+=ROPE_T.z*w.rope;}w.riding=!!at.slide;w.walking+=((w.riding?0:1)-w.walking)*Math.min(1,dt*8);return end;}
 // Find the way by walkways and stairs; returns false if there is none.
 function goTo(w,id,spot){const r=findRoute(graph,w.fig.position,w.island,id,spot);if(!r)return false;w.route=makeRoute(r.pts);w.s=0;w.dir=1;w.target=id;return true;}
 const reducedNow=()=>reduced?.matches;
 function arrive(w){const t=byId(w.target);w.island=w.target;w.route=null;w.target=null;w.sliding=0;return t;}
 function teleport(w,id,spot){const p=positions.get(id);place(w,{x:p.x+spot.x,y:islandTop(p),z:p.z+spot.z});w.island=id;w.route=null;w.target=null;w.sliding=0;}

 // Parents: a few strolls on one island, then off along the walkways to another, so nobody looks like a guard on duty.
 const PARENT_STOPS=()=>[...order,'start','calendar','signup','contact'];
 function updateParent(w,dt){
  if(w.route){if(walkRoute(w,dt)){arrive(w);w.speed=w.strollSpeed;w.wait=1.5;w.strolls=2+Math.floor(Math.random()*4);w.goal=undefined;}return;}
  if(w.wait<=0&&w.goal===undefined&&(w.strolls??3)<=0){const choices=PARENT_STOPS().filter(id=>id!==w.island);const next=choices[Math.floor(Math.random()*choices.length)];
   // Stroll slowly, but walk over to the next island at a normal pace.
   if(goTo(w,next,{x:-.5+Math.random(),z:FRONT_Z})){w.strollSpeed=w.strollSpeed??w.speed;w.speed=.38;w.strolls=3;return;}w.strolls=2;}
  const before=w.goal;updateResident(w,dt);if(before!==undefined&&w.goal===undefined)w.strolls=(w.strolls??3)-1;}
 function updateResident(w,dt){const p=positions.get(w.island);
  if(w.wait>0){w.wait-=dt;stand(w,dt,0);return;}
  if(w.goal===undefined){let g;do g=-.66+Math.random()*1.32;while(Math.abs(g-(w.fig.position.x-p.x))<.2);w.goal=g;}
  const x=w.fig.position.x-p.x,d=w.goal-x,step=Math.sign(d)*Math.min(Math.abs(d),w.speed*dt);w.fig.position.x+=step;w.heading=turn(w.heading,d>0?Math.PI/2:-Math.PI/2,dt*10);w.walking+=(1-w.walking)*Math.min(1,dt*8);
  if(Math.abs(d)<.005){w.goal=undefined;w.wait=1+Math.random()*3;}}
 function updateMessenger(w,dt){if(w.wait>0){w.wait-=dt;stand(w,dt,w.heading);return;}if(walkRoute(w,dt)){w.dir=-w.dir;w.wait=1.2+Math.random()*1.5;}}
 // The guide stands at the start facing visitors until asked to lead; then it walks briskly to each stop it is sent to.
 function updateGuide(w,dt){
  if(w.born!==undefined){w.born+=dt;w.fig.scale.setScalar(w.size*Math.min(1,w.born/.5));if(w.born>=.5)w.born=undefined;}
  if(w.route){if(walkRoute(w,dt)){const id=w.target,t=arrive(w);if(t)onLog(`導覽員帶路抵達 ${t.n} ${t.title}`,{kind:'guide',id});onGuide(id);}return;}
  stand(w,dt,0);}
 // Pop the guide up at any island, so a visitor who wandered off can pick the tour up again right where they are.
 function guideAppear(id){if(!positions.has(id))return false;teleport(guide,id,guideSpot(id));guide.heading=0;if(!reducedNow()){guide.born=0;guide.fig.scale.setScalar(0);}return true;}
 function guideTo(id){if(!positions.has(id))return false;if(reducedNow()||frozen){teleport(guide,id,guideSpot(id));onGuide(id);return true;}guide.speed=id===GUIDE_ROUTE[0]?1.2:1.6;return goTo(guide,id,guideSpot(id));}
 const MAX_UP=26;
 // Along the rim, sideways from the climb line: each climber holds one of the ropes.
 const ROPE_T=(()=>{const S=positions.get(SUMMIT),F=STOPS.wallfoot,d=Math.hypot(F.x-S.x,F.z-S.z);return {x:-(F.z-S.z)/d,z:(F.x-S.x)/d};})();
 // The outer edge of each cliff top on the rough road (facing away from the islands): where those who fall step off.
 const cliffEdge=id=>{const s=STOPS[id],dx=s.x+1.17,dz=s.z,d=Math.hypot(dx,dz)||1;return {x:dx/d*.55,z:dz/d*.55};};
 function updateStudent(w,dt){
  // Gone through the university door: shrink away, wait, then step out of the main building on SPAWN_FROM.
  if(w.gone!==undefined){w.gone+=dt;if(w.gone<.6){w.fig.scale.setScalar(w.size*Math.max(0,1-w.gone/.6));return;}w.fig.userData.hidden=true;
   if(w.gone>5){w.gone=undefined;w.born=0;w.up=false;w.onward=null;w.fig.userData.hidden=false;teleport(w,SPAWN_FROM,EXIT);w.heading=0;w.wait=1;}return;}
  if(w.born!==undefined){w.born+=dt;w.fig.scale.setScalar(w.size*Math.min(1,w.born/.6));if(w.born>=.6)w.born=undefined;}
  // A wrong turn: drop off a cliff top or lose grip on the ropes, then start again on RESTART.
  if(w.fall!==undefined){w.fall+=dt;const t=w.fall;if(w.fallKind==='cliff'||w.fallKind==='wall'){const back=w.fallKind==='wall'?-1:1;w.vy-=9*dt;w.fig.position.y+=w.vy*dt;w.fig.position.x+=Math.sin(w.heading)*.6*back*dt;w.fig.position.z+=Math.cos(w.heading)*.6*back*dt;w.fig.rotation.x=back*Math.min(1.4,t*2);}else{w.fig.position.y-=dt*.35;}
   w.fig.scale.setScalar(w.size*Math.max(0,1-t/1.1));if(t>1.1)w.fig.userData.hidden=true;if(t>3.5){w.fall=undefined;w.fig.rotation.x=0;w.born=0;w.up=false;w.slipAt=null;w.fig.userData.hidden=false;teleport(w,RESTART,EXIT);w.heading=0;w.wait=1.5;}return;}
  // Partway up the steep wall, some lose their grip.
  if(w.route&&w.climbing&&w.slipAt!=null&&w.fig.position.y>w.slipAt){w.route=null;w.target=null;w.slipAt=null;w.fall=0;w.fallKind='wall';w.vy=.6;return;}
  if(w.route){if(walkRoute(w,dt)){const up=w.up,to=w.target;arrive(w);if(up&&to===w.fallAt){w.fallAt=null;w.fall=0;w.fallKind='cliff';w.vy=1.2;}else if(up&&to==='wallfoot'){w.rope=ROPES[Math.floor(Math.random()*ROPES.length)];w.slipAt=Math.random()<.45?.6+Math.random()*1.4:null;if(!goTo(w,UNIVERSITY,DOOR)){w.up=false;w.wait=2;}}
   // At the university: half walk in through the door and are gone; the rest turn away and carry on to the calendar, sign-up and contact.
   else if(up&&to===UNIVERSITY){if(Math.random()<.5)w.gone=0;else{w.up=false;w.onward=['calendar','signup','contact'];w.wait=1.2;}}
   else if(up&&to==='fork')pickPath(w);else w.wait=(w.onward?.length?1.5:2+Math.random()*6);}return;}
  if(w.wait>0){w.wait-=dt;stand(w,dt,w.heading);return;}
  if(w.onward?.length){const next=w.onward.shift();if(!goTo(w,next,spotOn()))w.onward=null;return;}
  // Mostly a walk to another island; sometimes, while few are on the way, the journey: to the trailhead first, then one of three paths.
  if(students.filter(x=>x.up).length<MAX_UP&&Math.random()<.75){w.up=true;if(goTo(w,'fork',{x:0,z:0}))return;w.up=false;}
  const next=Math.random()<.3?w.island:ground[Math.floor(Math.random()*ground.length)];if(!goTo(w,next,spotOn()))w.wait=3;}
 // At the trailhead: one in five follows the sign onto the bridge (the right way, the course); four in five take the rough road,
 // where some fall off one of the cliff tops and the rest reach the steep wall, climb slowly and may still fall.
 function pickPath(w){const r=Math.random();const cliff=CLIFFS[Math.floor(Math.random()*CLIFFS.length)];const ok=r<.2?goTo(w,UNIVERSITY,DOOR):r<.55?(w.fallAt=cliff,goTo(w,cliff,cliffEdge(cliff))):goTo(w,'wallfoot',{x:0,z:0});if(!ok){w.up=false;w.wait=2;}}
 function updateMe(w,dt){
  if(w.route){if(walkRoute(w,dt)){const quiet=w.quiet,id=w.target,t=arrive(w);w.quiet=false;w.wait=w.mode==='auto'?3:1.5;if(quiet)return;onArrive(id,{kind:'avatar'});onLog(`${look.name||'我的角色'}抵達 ${t.n} ${t.title}`,{kind:'avatar',id});}return;}
  if(w.wait>0){w.wait-=dt;stand(w,dt,0);return;}
  if(w.mode==='auto'){const others=order.filter(id=>id!==w.island);if(!goTo(w,others[Math.floor(Math.random()*others.length)],AVATAR_SPOT))w.wait=1;return;}
  if(w.mode==='stroll'){updateResident(w,dt);return;}
  stand(w,dt,0);}

 let shown=true,filterIds=new Set(order),connections=true,selectedIsland=null,activeRelation=null,hoverWalker=null,selectedWalker=null;
 function sync(){for(const w of walkers){let on;
   if(w.kind==='avatar')on=true;
   else if(!shown)on=false;
   else if(w.kind==='messenger')on=connections&&filterIds.has(w.a)&&filterIds.has(w.b)&&(!selectedIsland||selectedIsland===w.a||selectedIsland===w.b||w.key===activeRelation);
   else if(w.kind==='student')on=!w.fig.userData.hidden&&(!order.includes(w.island)||filterIds.has(w.island)||!!w.route);
   else on=w.kind==='guide'||filterIds.has(w.island)||!order.includes(w.island)||!!w.route;
   w.fig.visible=on;
   if(w.kind==='messenger'){const loud=on&&(w.key===activeRelation||w===hoverWalker||w===selectedWalker);w.tag.o.visible=loud;w.tag.el.classList.toggle('active',w.key===activeRelation||w===selectedWalker);}
   else if(w.tag)w.tag.o.visible=on;}
  if(selectedWalker&&!selectedWalker.fig.visible)select(null);}

 function select(w){selectedWalker=w;if(w){w.fig.add(ring);ring.visible=true;}else{ring.removeFromParent();ring.visible=false;}for(const x of walkers)x.tag?.el.classList.toggle('selected',x===w);sync();}
 function update(dt,still){frozen=still;ring.material.opacity=.65+Math.sin(performance.now()/260)*.25;if(still)return;
  for(const w of walkers){if(!w.fig.visible&&w.kind!=='guide'&&w.kind!=='avatar'&&w.kind!=='student')continue;
   if(w.kind==='parent'){const on=!!w.route;updateParent(w,dt);if(on!==!!w.route)sync();}
   else if(w.kind==='student'){const was=w.fig.userData.hidden,on=!!w.route;updateStudent(w,dt);if(was!==w.fig.userData.hidden||on!==!!w.route)sync();}
   else if(w.kind==='messenger')updateMessenger(w,dt);
   else if(w.kind==='guide')updateGuide(w,dt);
   else updateMe(w,dt);
   w.phase+=dt*w.speed*34;
   w.fig.rotation.y=w.heading;applyPose(w.fig,pose(w.phase,w.walking,0,w.climbing||0));}}
 function pick(raycaster){const hits=raycaster.intersectObjects(walkers.filter(w=>w.fig.visible).map(w=>w.fig.userData.rig.hit),false);if(!hits.length)return null;let node=hits[0].object;while(node&&!node.userData.walker)node=node.parent;return node?{walker:node.userData.walker,distance:hits[0].distance}:null;}
 const describe=w=>({kind:w.kind,island:w.island||null,target:w.target||null,key:w.key||null,mode:w.mode||null,walking:Math.round(w.walking*100)/100,visible:w.fig.visible,position:w.fig.position.toArray().map(n=>Math.round(n*100)/100),sliding:w.sliding>.5,hidden:!!w.fig.userData.hidden});
 return {
  update,pick,select,
  // Where visible people stand, for lighting the bridge under their feet.
  feet:()=>walkers.filter(w=>w.fig.visible&&w.fig.position.y>.3).map(w=>w.fig.position),
  selected:()=>selectedWalker,
  hover(w){if(w!==hoverWalker){hoverWalker=w;sync();}},
  sync(state){({shown=shown,filterIds=filterIds,connections=connections,selectedIsland=selectedIsland,activeRelation=activeRelation}=state);if(state.filterIds)filterIds=new Set(state.filterIds);sync();},
  onClick(fn){onClickAll=fn;},
  guide:()=>guide,me:()=>me,guideTo,guideAppear,
  // kind is parent / student / messenger / guide / avatar, or a relation key for that relation's walker.
  find:(kind,i=0)=>kind.includes(':')?walkers.find(w=>w.key===kind)||null:walkers.filter(w=>w.kind===kind)[i]||null,
  // Where a walker stands right now, in world space.
  where:w=>w.fig.position.clone(),
  avatar:{
   look(next){look=readAvatar(JSON.stringify(next));makeMe();sync();return look;},
   get:()=>look,
   go(id,spot=AVATAR_SPOT){if(!positions.has(id))return;me.mode='goto';me.goal=undefined;me.wait=0;if(reducedNow()||frozen||!goTo(me,id,spot)){teleport(me,id,spot);onArrive(id,{kind:'avatar'});onLog(`${look.name||'我的角色'}抵達 ${byId(id).n} ${byId(id).title}`,{kind:'avatar',id});}},
   mode(m){me.mode=m;me.goal=undefined;if(m==='goto'||me.route)return;me.wait=.2;
    // Strolling happens on the front path; walk there first if the character stands elsewhere.
    const p=positions.get(me.island),z=me.fig.position.z-p.z;if(m==='stroll'&&Math.abs(z-AVATAR_SPOT.z)>.08){if(reducedNow()||frozen)teleport(me,me.island,AVATAR_SPOT);else{goTo(me,me.island,AVATAR_SPOT);me.quiet=true;}}},
   state:()=>({...describe(me),look})
  },
  state:()=>({count:walkers.length,visible:walkers.filter(w=>w.fig.visible).length,walking:walkers.filter(w=>w.walking>.5).length,guide:describe(guide),me:describe(me),selected:selectedWalker?describe(selectedWalker):null,messengers:walkers.filter(w=>w.kind==='messenger').map(describe),students:students.map(describe),studentCount:students.length+messengerCount,parents:walkers.filter(w=>w.kind==='parent').length,parentWalkers:walkers.filter(w=>w.kind==='parent').map(describe)})
 };
}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
