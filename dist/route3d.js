import * as THREE from './vendor/three.module.min.js';

// Draws the walkways between islands and the silver-and-gold stairs up to the trophy.
// Repeated parts are instanced, so the whole route costs a handful of draws.
const up=new THREE.Vector3(0,1,0);
function frames(pts){return pts.map((p,i)=>{const a=pts[Math.max(0,i-1)],b=pts[Math.min(pts.length-1,i+1)];const t=new THREE.Vector3(b.x-a.x,0,b.z-a.z).normalize();const side=new THREE.Vector3().crossVectors(t,up).normalize();return {p:new THREE.Vector3(p.x,p.y,p.z),t,side,yaw:Math.atan2(t.x,t.z)};});}
function instanced(geo,mat,list){const m=new THREE.InstancedMesh(geo,mat,Math.max(1,list.length)),o=new THREE.Object3D();list.forEach((x,i)=>{o.position.copy(x.p);o.rotation.set(x.rx||0,x.yaw||0,0);o.scale.copy(x.s||new THREE.Vector3(1,1,1));o.updateMatrix();m.setMatrixAt(i,o.matrix);});m.count=list.length;m.castShadow=m.receiveShadow=true;m.instanceMatrix.needsUpdate=true;m.computeBoundingSphere();return m;}

export function createRoute({scene,centers,walkways,stairs,trophyAt,reduced}){
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
 // ---- Gold sparkles: stars twinkle round the trophy and along the stairs while they are lit, with a burst each time they are chosen. ----
 const star=(()=>{const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d'),g=x.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.25,'rgba(255,236,170,.9)');g.addColorStop(1,'rgba(255,200,80,0)');x.fillStyle=g;x.fillRect(0,0,64,64);
  x.strokeStyle='rgba(255,250,220,.95)';x.lineWidth=2.5;x.beginPath();x.moveTo(32,2);x.lineTo(32,62);x.moveTo(2,32);x.lineTo(62,32);x.stroke();const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;})();
 const sparkle=[];
 if(trophyAt)for(let i=0;i<70;i++){const a=Math.random()*Math.PI*2,r=.25+Math.random()*1.05;sparkle.push({x:trophyAt.x+Math.cos(a)*r,y:trophyAt.y+.9+Math.random()*2,z:trophyAt.z+Math.sin(a)*r,rise:.5+Math.random()*1.4,base:trophyAt.y+.9,span:2.2});}
 for(let i=0;i<130;i++){const x=f[Math.floor(Math.random()*f.length)],k=(Math.random()-.5)*.9;sparkle.push({x:x.p.x+x.side.x*k,y:x.p.y+.1+Math.random()*.6,z:x.p.z+x.side.z*k,rise:.2+Math.random()*.5,base:x.p.y+.05,span:.75});}
 const sp=new Float32Array(sparkle.length*3),sc=new Float32Array(sparkle.length*3);sparkle.forEach((p,i)=>{sp.set([p.x,p.y,p.z],i*3);p.phase=Math.random()*Math.PI*2;p.speed=2+Math.random()*4;});
 const sGeo=new THREE.BufferGeometry();sGeo.setAttribute('position',new THREE.BufferAttribute(sp,3));sGeo.setAttribute('color',new THREE.BufferAttribute(sc,3));
 const sMat=new THREE.PointsMaterial({size:.26,map:star,vertexColors:true,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,sizeAttenuation:true});
 const stars=new THREE.Points(sGeo,sMat);stars.name='gold-sparkles';stars.raycast=()=>{};stars.visible=false;stars.frustumCulled=false;group.add(stars);
 let burst=0;
 let want=0,lit=0;
 return {group,stairGroup,
  pickables:[stairGroup],
  light(on){if(on&&!want)burst=1;want=on?1:0;},
  sparkle:()=>({on:stars.visible,count:sparkle.length,burst:Math.round(burst*100)/100}),
  lit:()=>Math.round(lit*100)/100,
  update(dt,elapsed){const k=reduced?.matches?1:Math.min(1,dt*7);lit+=(want-lit)*k;if(Math.abs(want-lit)<.002)lit=want;
   silver.emissiveIntensity=lit*.5;gold.emissiveIntensity=lit*.6;lampGlow.emissiveIntensity=.2+lit*1.4;
   burst=Math.max(0,burst-dt*.7);stars.visible=lit>.01;if(stars.visible){const still=reduced?.matches;sMat.size=.26*(1+burst*1.2);
    sparkle.forEach((p,i)=>{const tw=still?.7:Math.max(0,Math.sin(elapsed*p.speed+p.phase)),b=lit*(.15+.85*tw*tw)+burst*.6;sc[i*3]=b;sc[i*3+1]=b*.82;sc[i*3+2]=b*.42;
     if(!still){p.y+=p.rise*dt*.25;if(p.y>p.base+p.span)p.y=p.base;sp[i*3+1]=p.y;}});sGeo.attributes.color.needsUpdate=true;sGeo.attributes.position.needsUpdate=true;}
   const show=lit>.3&&!reduced?.matches;moteMat.opacity=Math.min(.9,lit);for(const p of motes){p.m.visible=show;if(!show)continue;const t=((elapsed*.07+p.phase)%1)*(f.length-1),i=Math.floor(t),a=f[i].p,b=f[Math.min(i+1,f.length-1)].p,u=t-i;p.m.position.set(a.x+(b.x-a.x)*u,a.y+(b.y-a.y)*u+p.lift+Math.sin(elapsed*2+p.phase*9)*.03,a.z+(b.z-a.z)*u);}},
  points(){return stairs;},
  stairPoint(t){return f[Math.round(Math.max(0,Math.min(1,t))*(f.length-1))].p.clone();}
 };
}
