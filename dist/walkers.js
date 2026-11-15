import * as THREE from './vendor/three.module.min.js';
import {makeFigure,pose,applyPose,makeRoute,along,islandTop,FIGURE_SCALE,FRONT_Z} from './people.js';
import {walkRoute as findRoute,STAIRS_FROM,UNIVERSITY,SUMMIT,SPAWN_FROM} from './summit.js';

// Who walks on the map:
// - residents stroll back and forth on the front path of each island;
// - a relation walker carries a notebook back and forth on each relation that has a real walkway;
// - students come out of the main building on SPAWN_FROM, climb the stairs past the trophy and disappear into the university
//   (going on to university); a little later they come out of the main building again, so the island never empties;
// - the guide visits the islands in order 01 → 09 and stops at each one;
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
export const SHIRTS=['#e07a5f','#5f8fb4','#7aa66b','#e2b84c','#9a7bb8','#4f7d74'];
export const AVATAR_ROLES={學生:'backpack',家長:'bag',其他:null};
export const AVATAR_KEY='writing-island-avatar';
export function readAvatar(raw){let v={};try{v=JSON.parse(raw)||{};}catch{}
 return {name:typeof v.name==='string'?v.name.trim().slice(0,8):'',role:v.role in AVATAR_ROLES?v.role:'學生',hairStyle:['short','long','bun','cap'].includes(v.hairStyle)?v.hairStyle:'short',shirt:SHIRTS.includes(v.shirt)?v.shirt:SHIRTS[0]};}
const avatarLook=a=>({shirt:a.shirt,hairStyle:a.hairStyle,hair:'#3a2e28',skin:'#efcaa6',pants:'#3f4f63',prop:AVATAR_ROLES[a.role],accent:a.role==='家長'?'#8a5a3b':'#f2c14e'});
const GUIDE_SPOT={x:-.12,z:.74},AVATAR_SPOT={x:.16,z:.68},DOOR={x:0,z:.5},EXIT={x:0,z:.6};

export function createWalkers({scene,topics,positions,graph,links,CSS2DObject,reduced,avatar:initial,onArrive=()=>{},onLog=()=>{}}){
 const group=new THREE.Group();group.name='walkers';scene.add(group);
 const walkers=[],byId=id=>topics.find(t=>t.id===id),order=topics.map(t=>t.id);
 const ring=new THREE.Mesh(new THREE.RingGeometry(.15,.2,28).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:'#e2793f',transparent:true,opacity:.9,depthWrite:false}));ring.position.y=.008;ring.raycast=()=>{};ring.visible=false;
 function tag(w,text,className){const el=document.createElement('button');el.type='button';el.className='walker-tag '+className;el.innerHTML=text;el.tabIndex=-1;el.onclick=e=>{e.stopPropagation();onClickAll(w);};const o=new CSS2DObject(el);o.position.set(0,.82,0);w.fig.add(o);w.tag={el,o};}
 function spawn(kind,look,props){const fig=makeFigure(look);fig.scale.setScalar(FIGURE_SCALE);group.add(fig);
  const w={kind,fig,route:null,s:0,dir:1,speed:.3,wait:0,phase:Math.random()*6,heading:0,walking:0,sliding:0,...props};fig.userData.walker=w;walkers.push(w);return w;}
 const place=(w,p,heading=0)=>{w.fig.position.set(p.x,p.y,p.z);w.heading=heading;w.fig.rotation.y=heading;};

 // Residents: two per island, on the paved path along the front edge.
 topics.forEach((t,i)=>{const p=positions.get(t.id);for(let k=0;k<2;k++){const x=k?.42:-.44,w=spawn('resident',RESIDENTS[(i*2+k)%RESIDENTS.length],{island:t.id,speed:.13+.04*k,wait:1+k*1.5});place(w,{x:p.x+x,y:islandTop(p),z:p.z+FRONT_Z});}});
 // Relation walkers: back and forth along the walkway of each relation that has one, notebook in hand.
 links.map(l=>({...l,edge:graph.edges.find(e=>e.kind==='bridge'&&e.from===l.a&&e.to===l.b)})).filter(l=>l.edge).forEach((l,i)=>{const route=makeRoute(l.edge.pts);const w=spawn('messenger',{...RESIDENTS[(i+3)%RESIDENTS.length],prop:'book',accent:'#fff3cf'},{key:l.key,a:l.a,b:l.b,route,speed:.36,s:route.total*((i*.37)%1),dir:i%2?1:-1});
  const A=byId(l.a),B=byId(l.b);tag(w,`<b>${A.n}↔${B.n}</b><span>帶著關聯問題</span>`,'bubble');w.tag.el.setAttribute('aria-label',`關聯行人：${A.title} 與 ${B.title}`);place(w,along(route,w.s));});
 // The guide: island 01 to 09 in order, a short stop at each.
 const guide=spawn('guide',{shirt:'#2f6f73',pants:'#38424f',hair:'#2a2622',hairStyle:'cap',accent:'#f2c14e',prop:'flag',skin:'#e7bf98'},{island:order[0],next:null,speed:.48,wait:2});
 {const p=positions.get(order[0]);place(guide,{x:p.x+GUIDE_SPOT.x,y:islandTop(p),z:p.z+GUIDE_SPOT.z});}
 tag(guide,'<i>⚑</i><span>導覽員</span>','guide-tag');guide.tag.el.setAttribute('aria-label','導覽員');
 // Students on their way to university: up the stairs, past the trophy, in through the university's door.
 const climbers=[0,1,2,3].map(k=>{const w=spawn('climber',{...RESIDENTS[(k*2+1)%RESIDENTS.length],prop:'backpack',accent:['#d0695a','#5f8fb4','#e2b84c','#7aa66b'][k]},{island:SPAWN_FROM,speed:.42});w.gone=5-k*8;w.fig.userData.hidden=true;w.fig.scale.setScalar(0);return w;});
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
 function walkRoute(w,dt){w.s+=w.speed*(1+w.sliding*2.2)*dt*w.dir;const end=w.dir>0?w.s>=w.route.total:w.s<=0;w.s=Math.max(0,Math.min(w.route.total,w.s));const at=along(w.route,w.s);
  w.fig.position.set(at.x,at.y,at.z);if(at.heading!==null)w.heading=turn(w.heading,w.dir>0?at.heading:at.heading+Math.PI,dt*10);w.sliding+=((at.slide?1:0)-w.sliding)*Math.min(1,dt*10);w.walking+=(1-w.walking)*Math.min(1,dt*8);return end;}
 // Find the way by walkways and stairs; returns false if there is none.
 function goTo(w,id,spot){const r=findRoute(graph,w.fig.position,w.island,id,spot);if(!r)return false;w.route=makeRoute(r.pts);w.s=0;w.dir=1;w.target=id;return true;}
 const reducedNow=()=>reduced?.matches;
 function arrive(w){const t=byId(w.target);w.island=w.target;w.route=null;w.target=null;w.sliding=0;return t;}
 function teleport(w,id,spot){const p=positions.get(id);place(w,{x:p.x+spot.x,y:islandTop(p),z:p.z+spot.z});w.island=id;w.route=null;w.target=null;w.sliding=0;}

 function updateResident(w,dt){const p=positions.get(w.island);
  if(w.wait>0){w.wait-=dt;stand(w,dt,0);return;}
  if(w.goal===undefined){let g;do g=-.66+Math.random()*1.32;while(Math.abs(g-(w.fig.position.x-p.x))<.2);w.goal=g;}
  const x=w.fig.position.x-p.x,d=w.goal-x,step=Math.sign(d)*Math.min(Math.abs(d),w.speed*dt);w.fig.position.x+=step;w.heading=turn(w.heading,d>0?Math.PI/2:-Math.PI/2,dt*10);w.walking+=(1-w.walking)*Math.min(1,dt*8);
  if(Math.abs(d)<.005){w.goal=undefined;w.wait=1+Math.random()*3;}}
 function updateMessenger(w,dt){if(w.wait>0){w.wait-=dt;stand(w,dt,w.heading);return;}if(walkRoute(w,dt)){w.dir=-w.dir;w.wait=1.2+Math.random()*1.5;}}
 function updateGuide(w,dt){
  if(w.route){if(walkRoute(w,dt)){const t=arrive(w);w.wait=4.5;onLog(`導覽員抵達 ${t.n} ${t.title}`,{kind:'guide',id:t.id});}return;}
  if(w.wait>0){w.wait-=dt;stand(w,dt,0);return;}
  const next=order[(order.indexOf(w.island)+1)%order.length];goTo(w,next,GUIDE_SPOT);}
 function updateClimber(w,dt){
  // Gone through the university door: shrink away, wait, then step out of the main building on SPAWN_FROM.
  if(w.gone!==undefined){w.gone+=dt;if(w.gone>=0&&w.gone<.6){w.fig.scale.setScalar(FIGURE_SCALE*Math.max(0,1-w.gone/.6));return;}w.fig.userData.hidden=true;
   if(w.gone>5){w.gone=undefined;w.born=0;w.fig.userData.hidden=false;teleport(w,SPAWN_FROM,EXIT);w.heading=0;w.wait=.8;}return;}
  if(w.born!==undefined){w.born+=dt;w.fig.scale.setScalar(FIGURE_SCALE*Math.min(1,w.born/.6));if(w.born>=.6)w.born=undefined;}
  if(w.route){if(walkRoute(w,dt)){arrive(w);w.gone=0;}return;}
  if(w.wait>0){w.wait-=dt;stand(w,dt,0);return;}
  if(!goTo(w,UNIVERSITY,DOOR))w.wait=5;}
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
   else if(w.kind==='climber')on=!w.fig.userData.hidden&&filterIds.has(SUMMIT)&&filterIds.has(STAIRS_FROM)&&filterIds.has(SPAWN_FROM);
   else on=filterIds.has(w.island)||w.kind==='guide';
   w.fig.visible=on;
   if(w.kind==='messenger'){const loud=on&&(w.key===activeRelation||w===hoverWalker||w===selectedWalker);w.tag.o.visible=loud;w.tag.el.classList.toggle('active',w.key===activeRelation||w===selectedWalker);}
   else if(w.tag)w.tag.o.visible=on;}
  if(selectedWalker&&!selectedWalker.fig.visible)select(null);}

 function select(w){selectedWalker=w;if(w){w.fig.add(ring);ring.visible=true;}else{ring.removeFromParent();ring.visible=false;}for(const x of walkers)x.tag?.el.classList.toggle('selected',x===w);sync();}
 function update(dt,still){frozen=still;ring.material.opacity=.65+Math.sin(performance.now()/260)*.25;if(still)return;
  for(const w of walkers){if(!w.fig.visible&&w.kind!=='guide'&&w.kind!=='avatar'&&w.kind!=='climber')continue;
   if(w.kind==='resident')updateResident(w,dt);
   else if(w.kind==='climber'){const was=w.fig.userData.hidden;updateClimber(w,dt);if(was!==w.fig.userData.hidden)sync();}
   else if(w.kind==='messenger')updateMessenger(w,dt);
   else if(w.kind==='guide')updateGuide(w,dt);
   else updateMe(w,dt);
   w.phase+=dt*w.speed*34;
   w.fig.rotation.y=w.heading;applyPose(w.fig,pose(w.phase,w.walking,w.sliding));}}
 function pick(raycaster){const hits=raycaster.intersectObjects(walkers.filter(w=>w.fig.visible).map(w=>w.fig.userData.rig.hit),false);if(!hits.length)return null;let node=hits[0].object;while(node&&!node.userData.walker)node=node.parent;return node?{walker:node.userData.walker,distance:hits[0].distance}:null;}
 const describe=w=>({kind:w.kind,island:w.island||null,target:w.target||null,key:w.key||null,mode:w.mode||null,walking:Math.round(w.walking*100)/100,visible:w.fig.visible,position:w.fig.position.toArray().map(n=>Math.round(n*100)/100),sliding:w.sliding>.5,hidden:!!w.fig.userData.hidden});
 return {
  update,pick,select,
  selected:()=>selectedWalker,
  hover(w){if(w!==hoverWalker){hoverWalker=w;sync();}},
  sync(state){({shown=shown,filterIds=filterIds,connections=connections,selectedIsland=selectedIsland,activeRelation=activeRelation}=state);if(state.filterIds)filterIds=new Set(state.filterIds);sync();},
  onClick(fn){onClickAll=fn;},
  guide:()=>guide,me:()=>me,
  // kind is resident / messenger / guide / avatar, or a relation key for that relation's walker.
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
  state:()=>({count:walkers.length,visible:walkers.filter(w=>w.fig.visible).length,walking:walkers.filter(w=>w.walking>.5).length,guide:describe(guide),me:describe(me),selected:selectedWalker?describe(selectedWalker):null,messengers:walkers.filter(w=>w.kind==='messenger').map(describe),climbers:climbers.map(describe)})
 };
}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
