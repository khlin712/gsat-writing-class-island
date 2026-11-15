import * as THREE from './vendor/three.module.min.js';

// Draws the walkways between islands and the silver-and-gold stairs up to the trophy.
// Repeated parts are instanced, so the whole route costs a handful of draws.
const up=new THREE.Vector3(0,1,0);
function frames(pts){return pts.map((p,i)=>{const a=pts[Math.max(0,i-1)],b=pts[Math.min(pts.length-1,i+1)];const t=new THREE.Vector3(b.x-a.x,0,b.z-a.z).normalize();const side=new THREE.Vector3().crossVectors(t,up).normalize();return {p:new THREE.Vector3(p.x,p.y,p.z),t,side,yaw:Math.atan2(t.x,t.z)};});}
function instanced(geo,mat,list){const m=new THREE.InstancedMesh(geo,mat,Math.max(1,list.length)),o=new THREE.Object3D();list.forEach((x,i)=>{o.position.copy(x.p);o.rotation.set(x.rx||0,x.yaw||0,0);o.scale.copy(x.s||new THREE.Vector3(1,1,1));o.updateMatrix();m.setMatrixAt(i,o.matrix);});m.count=list.length;m.castShadow=m.receiveShadow=true;m.instanceMatrix.needsUpdate=true;m.computeBoundingSphere();return m;}

export function createRoute({scene,centers,walkways,stairs,reduced}){
 const group=new THREE.Group();group.name='summit-route';scene.add(group);
 const unit=new THREE.BoxGeometry(1,1,1),post=new THREE.CylinderGeometry(1,1,1,8),ball=new THREE.SphereGeometry(1,12,8);
 // ---- Plank walkways between islands, with low rails. ----
 const wood=new THREE.MeshStandardMaterial({color:'#c9a77a',roughness:.9}),railMat=new THREE.MeshStandardMaterial({color:'#efe3c6',roughness:.8});
 const decks=[],rails=[],posts=[];
 for(const [a,b]of walkways){const A=centers.get(a),B=centers.get(b);if(!A||!B)continue;const y=(A.y||0)+.2,dx=B.x-A.x,dz=B.z-A.z,len=Math.hypot(dx,dz),yaw=Math.atan2(dx,dz),mid=new THREE.Vector3((A.x+B.x)/2,y,(A.z+B.z)/2),side=new THREE.Vector3(dz,0,-dx).normalize();
  decks.push({p:mid,yaw,s:new THREE.Vector3(.36,.08,len-1.6)});
  for(const k of [-1,1]){rails.push({p:mid.clone().addScaledVector(side,k*.19).setY(y+.16),yaw,s:new THREE.Vector3(.025,.025,len-1.7)});
   for(let i=0;i<=4;i++){const f=-.5+i/4,q=mid.clone().addScaledVector(new THREE.Vector3(dx,0,dz).normalize(),f*(len-1.8)).addScaledVector(side,k*.19);posts.push({p:q.setY(y+.08),s:new THREE.Vector3(.016,.16,.016)});}}}
 group.add(instanced(unit,wood,decks),instanced(unit,railMat,rails),instanced(post,railMat,posts));
 // ---- Stairs: one continuous flight, silver on the lower half and gold above a landing; it all lights up together. ----
 const silver=new THREE.MeshStandardMaterial({color:'#b9c2cc',roughness:.28,metalness:.55,emissive:'#9cc3f5',emissiveIntensity:0});
 const gold=new THREE.MeshStandardMaterial({color:'#dcc07a',roughness:.26,metalness:.6,emissive:'#ffb43c',emissiveIntensity:0});
 const riser=new THREE.MeshStandardMaterial({color:'#ece2cc',roughness:.85});
 const lampGlow=new THREE.MeshStandardMaterial({color:'#fff4d6',emissive:'#ffd27a',emissiveIntensity:.2});
 const f=frames(stairs),half=Math.floor(f.length/2),gap=f.length>1?f[0].p.distanceTo(f[1].p):.17;
 const treads=[[],[]],risers=[],rail=[[],[]],stakes=[],lampPosts=[],lamps=[];
 f.forEach((x,i)=>{const s=i<half?0:1,d=Math.hypot(gap,0);treads[s].push({p:x.p.clone().setY(x.p.y-.025),yaw:x.yaw,s:new THREE.Vector3(.5,.05,d*1.04)});risers.push({p:x.p.clone().setY(x.p.y-.13),yaw:x.yaw,s:new THREE.Vector3(.46,.16,d*1.04)});
  for(const k of [-1,1]){const q=x.p.clone().addScaledVector(x.side,k*.27);rail[k<0?0:1].push(q.clone().setY(q.y+.36));if(i%3===0)stakes.push({p:q.clone().setY(q.y+.18),s:new THREE.Vector3(.014,.36,.014)});}
  if(i%10===5){const k=i%20===5?1:-1,q=x.p.clone().addScaledVector(x.side,k*.33);lampPosts.push({p:q.clone().setY(q.y+.3),s:new THREE.Vector3(.018,.6,.018)});lamps.push({p:q.clone().setY(q.y+.63),s:new THREE.Vector3(.055,.055,.055)});}});
 const treadMeshes=[instanced(unit,silver,treads[0]),instanced(unit,gold,treads[1])];
 const stairGroup=new THREE.Group();stairGroup.name='stairs';stairGroup.add(...treadMeshes,instanced(unit,riser,risers),instanced(post,railMat,stakes),instanced(post,new THREE.MeshStandardMaterial({color:'#5e6a6e',roughness:.6}),lampPosts),instanced(ball,lampGlow,lamps));
 for(const side of rail){const curve=new THREE.CatmullRomCurve3(side);const tube=new THREE.Mesh(new THREE.TubeGeometry(curve,Math.max(8,side.length*2),.018,6,false),new THREE.MeshStandardMaterial({color:'#f6efe0',roughness:.4,metalness:.2}));tube.castShadow=true;stairGroup.add(tube);}
 // A round landing where silver hands over to gold.
 const land=new THREE.Mesh(new THREE.CylinderGeometry(.42,.38,.1,6),silver);land.position.copy(f[half].p).setY(f[half].p.y-.05);land.castShadow=land.receiveShadow=true;stairGroup.add(land);
 group.add(stairGroup);
 // Light motes drifting up the stairs once they are lit.
 const motes=[],moteMat=new THREE.MeshBasicMaterial({color:'#fff3cf',transparent:true,opacity:0,depthWrite:false});
 for(let i=0;i<16;i++){const m=new THREE.Mesh(new THREE.SphereGeometry(.03,6,4),moteMat);m.raycast=()=>{};m.visible=false;group.add(m);motes.push({m,phase:i/16,lift:.14+(i%3)*.07});}
 let want=0,lit=0;
 return {group,stairGroup,
  pickables:[stairGroup],
  light(on){want=on?1:0;},
  lit:()=>Math.round(lit*100)/100,
  update(dt,elapsed){const k=reduced?.matches?1:Math.min(1,dt*7);lit+=(want-lit)*k;if(Math.abs(want-lit)<.002)lit=want;
   silver.emissiveIntensity=lit*.5;gold.emissiveIntensity=lit*.6;lampGlow.emissiveIntensity=.2+lit*1.4;
   const show=lit>.3&&!reduced?.matches;moteMat.opacity=Math.min(.9,lit);for(const p of motes){p.m.visible=show;if(!show)continue;const t=((elapsed*.07+p.phase)%1)*(f.length-1),i=Math.floor(t),a=f[i].p,b=f[Math.min(i+1,f.length-1)].p,u=t-i;p.m.position.set(a.x+(b.x-a.x)*u,a.y+(b.y-a.y)*u+p.lift+Math.sin(elapsed*2+p.phase*9)*.03,a.z+(b.z-a.z)*u);}},
  points(){return stairs;},
  stairPoint(t){return f[Math.round(Math.max(0,Math.min(1,t))*(f.length-1))].p.clone();}
 };
}
