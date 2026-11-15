import * as THREE from './vendor/three.module.min.js';

// Original island figures: round heads, simple faces, hair, and arms and legs that swing when they walk.
// They are map characters only; none of them depicts a real student, parent or teacher.
const G={
 leg:new THREE.BoxGeometry(.05,.15,.06).translate(0,-.075,0),
 shoe:new THREE.BoxGeometry(.058,.032,.084).translate(0,-.15,.012),
 body:new THREE.BoxGeometry(.16,.17,.1),
 arm:new THREE.BoxGeometry(.042,.13,.046).translate(0,-.065,0),
 hand:new THREE.SphereGeometry(.026,8,6),
 head:new THREE.SphereGeometry(.088,16,12),
 hair:new THREE.SphereGeometry(.094,16,10,0,Math.PI*2,0,Math.PI*.56),
 eye:new THREE.SphereGeometry(.012,6,4),
 ball:new THREE.SphereGeometry(1,10,8),
 box:new THREE.BoxGeometry(1,1,1),
 pole:new THREE.CylinderGeometry(.007,.007,.44,5),
 shadow:new THREE.CircleGeometry(.12,16).rotateX(-Math.PI/2),
 hit:new THREE.BoxGeometry(.34,.7,.34).translate(0,.33,0)
};
const pennant=new THREE.BufferGeometry();pennant.setAttribute('position',new THREE.Float32BufferAttribute([0,0,0,0,-.1,0,0,-.05,-.17],3));pennant.computeVertexNormals();
const mats=new Map();
function mat(color,side=THREE.FrontSide){const key=color+side;if(!mats.has(key))mats.set(key,new THREE.MeshStandardMaterial({color,roughness:.78,side}));return mats.get(key);}
const shadowMat=new THREE.MeshBasicMaterial({color:'#1f2a24',transparent:true,opacity:.2,depthWrite:false}),hitMat=new THREE.MeshBasicMaterial({visible:false});
export const HAIR_STYLES={short:'短髮',long:'長髮',bun:'丸子頭',cap:'棒球帽'};
export const PROPS={book:'筆記本',backpack:'書包',bag:'側背包',flag:'導覽旗'};
export const FIGURE_SCALE=.85;

export function makeFigure(look={}){
 const {skin='#efcaa6',hair='#3a2e28',hairStyle='short',shirt='#d98f6a',pants='#4e5d6c',shoes='#3b3532',prop=null,accent='#f2c14e'}=look;
 const fig=new THREE.Group();fig.name='figure';
 const add=(parent,geo,color,x=0,y=0,z=0,side)=>{const m=new THREE.Mesh(geo,mat(color,side));m.position.set(x,y,z);parent.add(m);return m;};
 const hips=new THREE.Group();hips.position.y=.17;fig.add(hips);
 const legs=[-1,1].map(side=>{const leg=new THREE.Group();leg.position.x=side*.04;hips.add(leg);add(leg,G.leg,pants);add(leg,G.shoe,shoes);return leg;});
 const torso=new THREE.Group();torso.position.y=.17;fig.add(torso);
 add(torso,G.body,shirt,0,.085,0);
 const arms=[-1,1].map(side=>{const arm=new THREE.Group();arm.position.set(side*.1,.16,0);torso.add(arm);add(arm,G.arm,shirt);add(arm,G.hand,skin,0,-.14,0);return arm;});
 const head=new THREE.Group();head.position.y=.255;torso.add(head);
 add(head,G.head,skin,0,.075,0);
 for(const side of [-1,1]){add(head,G.eye,'#2a2522',side*.032,.085,.08);add(head,G.ball,'#f0a59a',side*.054,.055,.07).scale.set(.016,.01,.008);}
 // The hair cap tilts back so the face stays visible from the usual camera angle.
 const top=add(head,G.hair,hairStyle==='cap'?accent:hair,0,.08,-.008);top.rotation.x=-.32;
 if(hairStyle==='long')add(head,G.box,hair,0,.02,-.055).scale.set(.17,.17,.05);
 if(hairStyle==='bun')add(head,G.ball,hair,0,.19,-.035).scale.setScalar(.045);
 if(hairStyle==='cap')add(head,G.box,accent,0,.12,.085).scale.set(.15,.014,.07);
 if(prop==='book')add(torso,G.box,accent,0,.08,.068).scale.set(.1,.12,.024);
 if(prop==='backpack')add(torso,G.box,accent,0,.09,-.07).scale.set(.13,.15,.05);
 if(prop==='bag'){add(torso,G.box,accent,.098,.02,.01).scale.set(.035,.075,.09);const strap=add(torso,G.box,'#5b4a3c',.02,.11,0);strap.scale.set(.15,.012,.104);strap.rotation.z=-.75;}
 if(prop==='flag'){add(torso,G.pole,'#6b5a45',-.06,.22,-.06);add(torso,pennant,accent,-.06,.43,-.06,THREE.DoubleSide);}
 const shadow=new THREE.Mesh(G.shadow,shadowMat);shadow.position.y=.004;shadow.raycast=()=>{};fig.add(shadow);
 const hit=new THREE.Mesh(G.hit,hitMat);hit.name='figure-hit';fig.add(hit);
 fig.userData.rig={legs,arms,torso,head,hit};
 return fig;
}
// A walk cycle: legs and arms swing against each other and the body bobs twice per stride.
export function pose(phase,amount){const s=Math.sin(phase);return {leg:s*.6*amount,arm:-s*.5*amount,bob:Math.abs(Math.cos(phase))*.016*amount,turn:s*.05*amount};}
export function applyPose(fig,p){const r=fig.userData.rig;r.legs[0].rotation.x=p.leg;r.legs[1].rotation.x=-p.leg;r.arms[0].rotation.x=p.arm;r.arms[1].rotation.x=-p.arm;r.torso.position.y=.17+p.bob;r.torso.rotation.y=p.turn;}

// ---- Routes: walk around the rim of an island (clear of its buildings), then cross to the next island on a little cloud. ----
export const RING=1.06,FRONT_Z=.62;
export const islandTop=p=>p.y+.25;
const angleOf=(x,z)=>Math.atan2(z,x);
export function ringArc(center,a0,a1,r=RING){let d=a1-a0;while(d>Math.PI)d-=2*Math.PI;while(d<-Math.PI)d+=2*Math.PI;const n=Math.max(1,Math.ceil(Math.abs(d)/.22)),y=islandTop(center);
 return Array.from({length:n+1},(_,i)=>{const a=a0+d*i/n;return {x:center.x+Math.cos(a)*r,y,z:center.z+Math.sin(a)*r,ground:true};});}
export function hop(a,b){const dist=Math.hypot(b.x-a.x,b.z-a.z),c={x:(a.x+b.x)/2,y:Math.max(a.y,b.y)+.3+dist*.06,z:(a.z+b.z)/2},n=Math.max(8,Math.ceil(dist/.18));
 return Array.from({length:n+1},(_,i)=>{const t=i/n,u=1-t;return {x:u*u*a.x+2*u*t*c.x+t*t*b.x,y:u*u*a.y+2*u*t*c.y+t*t*b.y,z:u*u*a.z+2*u*t*c.z+t*t*b.z,ground:i===0||i===n};});}
// The rim crossing between two islands, used by the walkers that carry a relation back and forth.
export function crossing(from,to){const out=angleOf(to.x-from.x,to.z-from.z),back=angleOf(from.x-to.x,from.z-to.z);
 return hop({x:from.x+Math.cos(out)*RING,y:islandTop(from),z:from.z+Math.sin(out)*RING},{x:to.x+Math.cos(back)*RING,y:islandTop(to),z:to.z+Math.sin(back)*RING});}
// From where a walker stands to a spot (local x,z) on another island, or on the same one.
export function planRoute(start,from,to,spot){
 const pts=[{x:start.x,y:start.y,z:start.z,ground:true}];
 const leave=angleOf(start.x-from.x,start.z-from.z),end=angleOf(spot.x,spot.z),same=from.x===to.x&&from.z===to.z&&from.y===to.y;
 if(same)pts.push(...ringArc(from,leave,end));
 else{const out=angleOf(to.x-from.x,to.z-from.z),back=angleOf(from.x-to.x,from.z-to.z);
  pts.push(...ringArc(from,leave,out));pts.push(...crossing(from,to).slice(1));pts.push(...ringArc(to,back,end).slice(1));}
 pts.push({x:to.x+spot.x,y:islandTop(to),z:to.z+spot.z,ground:true});
 return makeRoute(pts);
}
export function makeRoute(pts){const cum=[0];for(let i=1;i<pts.length;i++)cum.push(cum[i-1]+Math.hypot(pts[i].x-pts[i-1].x,pts[i].y-pts[i-1].y,pts[i].z-pts[i-1].z));return {pts,cum,total:cum[cum.length-1]};}
// Where a walker is after covering distance s, which way it faces, and whether it is on the ground or on a cloud.
export function along(route,s){const {pts,cum,total}=route;if(pts.length===1||total===0)return {...pts[pts.length-1],heading:null,ground:true};const d=Math.max(0,Math.min(total,s));let i=1;while(i<pts.length-1&&cum[i]<d)i++;
 const a=pts[i-1],b=pts[i],t=(d-cum[i-1])/((cum[i]-cum[i-1])||1);
 return {x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,z:a.z+(b.z-a.z)*t,heading:Math.atan2(b.x-a.x,b.z-a.z),ground:a.ground&&b.ground};}
