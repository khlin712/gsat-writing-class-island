import * as THREE from 'three';
import {OrbitControls} from './vendor/OrbitControls.js';
import {CSS2DRenderer,CSS2DObject} from './vendor/CSS2DRenderer.js';
import {FLY_MS,easeInOutCubic} from './motion.js';
import {createArchitecture} from './architecture.js';
import {relationKey} from './relations.js';
import {mapGestures} from './gestures.js';
import {createSky,random,dayPhase} from './sky.js';
import {createWeather} from './weather.js';
import {createDecor} from './decor.js';
import {placeLabels,fitDistance,pinSpots} from './layout.js';
import {SUMMIT,UNIVERSITY,SUMMIT_AT,UNIVERSITY_AT,RISE,WALKWAYS,STOPS,bridgePath,trailPath,slidePath,climbPath,buildGraph} from './summit.js';
import {STATIONS} from './journey.js';
import {createRoute} from './route3d.js';
import {createWalkers} from './walkers.js';

export function createWorld(host,topics,onSelect,{onRelation=()=>{},onStation=()=>{},onWalker=()=>{},onArrive=()=>{},onLog=()=>{},onPlace=()=>{},onGuide=()=>{},avatar=null}={}){
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const scene=new THREE.Scene();scene.fog=new THREE.Fog('#cbe0ee',30,95);
 const camera=new THREE.PerspectiveCamera(38,1,.1,120);
 const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.setClearColor('#dcebf4');
 renderer.domElement.setAttribute('aria-label','3D 作文學習島。拖曳平移、右鍵旋轉、滾輪縮放，也可使用工具列與主題清單。');renderer.domElement.setAttribute('role','img');host.append(renderer.domElement);
 const labels=new CSS2DRenderer();labels.domElement.className='world-labels';host.append(labels.domElement);
 const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.09;controls.minDistance=3;controls.maxDistance=44;controls.minPolarAngle=.15;controls.maxPolarAngle=Math.PI/2.12;controls.screenSpacePanning=true;controls.enableZoom=false;controls.maxTargetRadius=16;controls.mouseButtons={LEFT:null,MIDDLE:THREE.MOUSE.DOLLY,RIGHT:THREE.MOUSE.ROTATE};controls.touches={ONE:null,TWO:null};
 const ambient=new THREE.HemisphereLight('#f6f9ff','#cbbd9c',2.8);scene.add(ambient);
 const sun=new THREE.DirectionalLight('#fff3d5',3.2);sun.position.set(-7,14,8);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-12;sun.shadow.camera.right=12;sun.shadow.camera.top=12;sun.shadow.camera.bottom=-12;sun.shadow.normalBias=.04;sun.shadow.bias=-.0001;scene.add(sun);
 const materialCache=new Map();function material(color){if(!materialCache.has(color))materialCache.set(color,new THREE.MeshStandardMaterial({color,roughness:1}));return materialCache.get(color);}
 const geometries={box:new THREE.BoxGeometry(1,1,1),trunk:new THREE.CylinderGeometry(.035,.05,1,5),leaf:new THREE.ConeGeometry(1,1,5),ball:new THREE.IcosahedronGeometry(1,0)};
 function mesh(parent,geometry,color,x,y,z,sx=1,sy=1,sz=1){const m=new THREE.Mesh(geometry,material(color));m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
 function box(g,x,y,z,w,h,d,color){return mesh(g,geometries.box,color,x,y+h/2,z,w,h,d);}
 function tree(g,x,z,scale=1){mesh(g,geometries.trunk,'#8e7954',x,.55*scale,z,1,scale,1);mesh(g,geometries.leaf,'#698760',x,1*scale,z,.3*scale,.68*scale,.3*scale);mesh(g,geometries.leaf,'#8c9f71',x,1.3*scale,z,.23*scale,.6*scale,.23*scale);}
 const architecture=createArchitecture({box,mesh,tree});
 // Each island hangs in the air on a rough rock cone, with a few loose rocks drifting beneath it.
 const rockMaterial=new THREE.MeshStandardMaterial({color:'#9b8a6c',roughness:1,flatShading:true}),soilMaterial=new THREE.MeshStandardMaterial({color:'#7f7058',roughness:1,flatShading:true});
 const waterMaterial=new THREE.MeshBasicMaterial({color:'#e4f4fa',transparent:true,opacity:.62,depthWrite:false});
 const floaters=[];
 function rock(radius,height,seed,sides=6){const geometry=new THREE.ConeGeometry(radius,height,sides,3);geometry.rotateY(Math.PI/6);geometry.rotateX(Math.PI);const r=random(seed),p=geometry.attributes.position;for(let i=0;i<p.count;i++){const y=p.getY(i);if(y>height/2-.01)continue;const k=.8+r()*.35;p.setXYZ(i,p.getX(i)*k+(r()-.5)*.12,y+(r()-.5)*.12,p.getZ(i)*k+(r()-.5)*.12);}geometry.computeVertexNormals();return geometry;}
 function underside(g,t,i){const r=random(101+i*17),tall=t.lift?.7:0;const main=new THREE.Mesh(rock(1.24,1.7+tall+r()*.6,7+i),rockMaterial);main.position.y=-.11-.85-tall/2;main.castShadow=true;g.add(main);
  const band=new THREE.Mesh(new THREE.CylinderGeometry(1.23,1.12,.16,6),soilMaterial);band.geometry.rotateY(Math.PI/6);band.position.y=-.17;g.add(band);
  const side=new THREE.Mesh(rock(.5,.9+r()*.4,31+i,5),rockMaterial);side.position.set((r()-.5)*1.1,-.75-r()*.3,(r()-.5)*.9);g.add(side);
  for(let k=0;k<2;k++){const a=r()*Math.PI*2,stone=new THREE.Mesh(new THREE.DodecahedronGeometry(.11+r()*.12,0),rockMaterial);stone.position.set(Math.cos(a)*(1.35+r()*.4),-.9-r()*1.1,Math.sin(a)*(1.2+r()*.4));stone.castShadow=true;g.add(stone);floaters.push({mesh:stone,y:stone.position.y,phase:r()*6});}
  if(t.kind==='trees'||t.kind==='pavilion'){const fall=new THREE.Mesh(new THREE.BoxGeometry(.2,2.7,.03),waterMaterial);fall.position.set(-.62,-1.15,-1.02);fall.rotation.y=Math.PI/6;g.add(fall);const pool=new THREE.Mesh(new THREE.BoxGeometry(.26,.03,.12),waterMaterial);pool.position.set(-.62,.235,-.98);pool.rotation.y=Math.PI/6;g.add(pool);}
 }
 // The selected island gets a dark outline around its rim.
 function hexRing(inner,outer){const corner=(r,i)=>new THREE.Vector3(r*Math.sin(i*Math.PI/3),0,r*Math.cos(i*Math.PI/3)).applyAxisAngle(new THREE.Vector3(0,1,0),Math.PI/6);const shape=new THREE.Shape(),hole=new THREE.Path();for(let i=0;i<=6;i++){const o=corner(outer,i),n=corner(inner,i);i?shape.lineTo(o.x,o.z):shape.moveTo(o.x,o.z);i?hole.lineTo(n.x,n.z):hole.moveTo(n.x,n.z);}shape.holes.push(hole);const geometry=new THREE.ShapeGeometry(shape);geometry.rotateX(Math.PI/2);return geometry;}
 const ringGeometry=hexRing(1.37,1.5),ringMaterial=new THREE.MeshBasicMaterial({color:'#2f3b33',side:THREE.DoubleSide});const rings=new Map();
 const groups=new Map(),tops=new Map(),labelButtons=new Map(),labelObjects=new Map(),positions=new Map(),radii=new Map();
 const topGeometry=new THREE.CylinderGeometry(1.34,1.34,.08,6);topGeometry.rotateY(Math.PI/6);
 const baseGeometry=new THREE.CylinderGeometry(1.34,1.23,.27,6);baseGeometry.rotateY(Math.PI/6);
 for(const t of topics){const g=new THREE.Group();if(t.id===SUMMIT)g.position.set(SUMMIT_AT.x,SUMMIT_AT.y,SUMMIT_AT.z);else g.position.set((t.x-470)*.0127,t.lift||0,(t.y-340)*.018);g.userData.id=t.id;scene.add(g);groups.set(t.id,g);positions.set(t.id,g.position.clone());mesh(g,baseGeometry,'#a3aa84',0,.025,0);const top=mesh(g,topGeometry,t.color,0,.2,0);tops.set(t.id,top);const ring=new THREE.Mesh(ringGeometry,ringMaterial);ring.position.y=.22;ring.visible=false;g.add(ring);rings.set(t.id,ring);box(g,0,.245,.59,1.52,.012,.15,'#e5dabb');architecture.build(g,t);if(t.kind!=='trees'){tree(g,-.86,-.14,.56);tree(g,.83,.04,.64);tree(g,.55,-.64,.45);}
 const label=document.createElement('button');label.className='island-3d-label';label.innerHTML=`<span>${t.n}</span><span class="island-title">${t.title}</span>`;label.title=t.title;label.setAttribute('aria-label',`${t.n} ${t.title}，${t.tag}`);label.onclick=()=>onSelect(t.id);const object=new CSS2DObject(label);object.position.set(0,.25,.98);g.add(object);labelButtons.set(t.id,label);labelObjects.set(t.id,object);radii.set(t.id,new THREE.Box3().setFromObject(g).getBoundingSphere(new THREE.Sphere()).radius);
 underside(g,t,topics.indexOf(t));
 }
 const sky=createSky(scene,{reduced});
 // The university: a raised island next to the summit; students walk in through its door. Clicking it opens the results summit.
 const uniGroup=new THREE.Group();uniGroup.position.set(UNIVERSITY_AT.x,UNIVERSITY_AT.y,UNIVERSITY_AT.z);uniGroup.name='university';scene.add(uniGroup);
 mesh(uniGroup,baseGeometry,'#a3aa84',0,.025,0);mesh(uniGroup,topGeometry,'#cdb98f',0,.2,0);box(uniGroup,0,.245,.59,1.52,.012,.15,'#e5dabb');architecture.build(uniGroup,{kind:'university'});underside(uniGroup,{lift:RISE,kind:'university'},topics.length);
 // ---- The journey stops (see summit.js / journey.js): start, trailhead, lava cave, cliff, steep wall, calendar, sign-up, contact. ----
 const lavaMat=new THREE.MeshStandardMaterial({color:'#ff7a2a',emissive:'#ff4d00',emissiveIntensity:1.3,roughness:.5});
 const stopGroups=new Map(),stationLabels=new Map(),stationOf={start:'start',fork:'fork',lava:'fork',cliff:'fork',wallfoot:'fork',wall:'fork',calendar:'calendar',signup:'signup',contact:'contact',[UNIVERSITY]:'university'};
 const stopColor={start:'#9fc47e',lava:'#8d7a6c',cliff:'#a7b48a',wall:'#b9ad95',calendar:'#c9d3dc',signup:'#e9bf95',contact:'#a8c3ae'};
 Object.entries(STOPS).forEach(([id,s],k)=>{const g=new THREE.Group();g.position.set(s.x,s.y,s.z);g.name='stop-'+id;g.userData.stop=id;scene.add(g);stopGroups.set(id,g);
  if(s.ledge){mesh(g,new THREE.CylinderGeometry(.7,.62,.22,7),'#b9ad95',0,.13,0);mesh(g,new THREE.CylinderGeometry(.66,.66,.04,7),'#d8ccb2',0,.25,0);const r=new THREE.Mesh(rock(.6,1.1,40+k,5),rockMaterial);r.position.y=-.55;g.add(r);}
  else{mesh(g,baseGeometry,id==='lava'?'#5b3a2e':'#a3aa84',0,.025,0);const top=mesh(g,topGeometry,stopColor[id]||'#cdb98f',0,.2,0);
   // The lava has spread over the whole island: a glowing top and molten streaks running down its sides.
   if(id==='lava'){top.material=lavaMat;for(let i=0;i<6;i++){const a=i/6*Math.PI*2+.3,st=box(g,Math.cos(a)*1.2,-.75,Math.sin(a)*1.2,.12,.95,.06,'#ff7a2a');st.material=lavaMat;st.rotation.y=-a+Math.PI/2;st.castShadow=false;}}architecture.build(g,{kind:s.kind});
   // The steep wall stands on a sheer rock column: its face is what the climbers go up.
   if(id==='wall'){const col=new THREE.Mesh(new THREE.CylinderGeometry(1.24,1.2,s.y+1.4,6),rockMaterial);col.geometry.rotateY(Math.PI/6);col.position.y=-(s.y+1.4)/2-.05;col.castShadow=col.receiveShadow=true;g.add(col);const tip=new THREE.Mesh(rock(1.1,1.2,77,6),rockMaterial);tip.position.y=-s.y-1.9;g.add(tip);}
   else underside(g,{lift:s.y,kind:s.kind},topics.length+1+k);}});
 // ② The trailhead: a roofed notice board, like the one at the start of a mountain trail, and three arrows pointing down the three paths.
 {const f=stopGroups.get('fork'),F=STOPS.fork,wood='#8a6a48';for(const x of [-.32,.32])box(f,x,.27,-.28,.06,.78,.06,wood);box(f,0,.62,-.27,.74,.42,.05,wood);box(f,0,.63,-.24,.66,.34,.01,'#fff4d6');const roof=mesh(f,new THREE.BoxGeometry(1,1,1),'#5f5047',0,1.08,-.27,.84,.05,.2);roof.rotation.x=.18;
  box(f,.25,.27,.18,.05,.72,.05,wood);[['bridge','#d9a521'],['lava','#d0482a'],['cliff','#8a8f99'],['wallfoot','#6b5a45']].forEach(([to,c],i)=>{const T=to==='bridge'?bridgePath()[6]:STOPS[to],a=Math.atan2(T.z-F.z,T.x-F.x),arm=new THREE.Group();arm.position.set(.25,.84-i*.13,.18);arm.rotation.y=-a;f.add(arm);box(arm,.17,0,0,.34,.1,.025,c).castShadow=true;});}
 {const w=stopGroups.get('wallfoot');for(let i=0;i<3;i++)mesh(w,new THREE.TorusGeometry(.12-i*.025,.018,6,16),'#d8b679',.15,.29+i*.02,-.1).rotation.x=Math.PI/2;}
 // Map labels for the stations (①–⑦) and the three paths at the trailhead.
 function stationLabel(id,text,at,cls,station,extra){const el=document.createElement('button');el.type='button';el.className='station-label '+cls;el.innerHTML=text;el.setAttribute('aria-label',el.textContent);el.onclick=e=>{e.stopPropagation();onStation(station,extra);};const o=new CSS2DObject(el);o.position.copy(at);scene.add(o);stationLabels.set(id,{el,o});}
 const st=id=>STATIONS.find(s=>s.id===id);
 for(const [stop,station,dy]of [['start','start',1.5],['fork','fork',1.35],['calendar','calendar',1.25],['signup','signup',1.2],['contact','contact',1.3]]){const s=STOPS[stop];stationLabel(station,`<b>${st(station).n}</b><span>${st(station).short}</span>`,new THREE.Vector3(s.x,s.y+dy,s.z),'',station);}
 stationLabel('university',`<b>${st('university').n}</b><span>${st('university').short}</span>`,new THREE.Vector3(UNIVERSITY_AT.x,UNIVERSITY_AT.y+1.85,UNIVERSITY_AT.z),'','university');
 for(const p of st('fork').paths){const s=STOPS[p.id==='wall'?'wallfoot':p.id];stationLabel('path-'+p.id,`<span>${p.name}</span>`,new THREE.Vector3(s.x,s.y+(p.id==='wall'?1.3:1),s.z),'path '+p.id,'fork',{path:p.id});}
 // Walkways, ② the climb, ③ the golden bridge to the trophy and the stairs down from the university (see summit.js / route3d.js).
 const centers=new Map(positions);centers.set(UNIVERSITY,uniGroup.position.clone());for(const [id,s]of Object.entries(STOPS))centers.set(id,new THREE.Vector3(s.x,s.y,s.z));for(const [id,s]of Object.entries(STOPS))if(s.ring)centers.get(id).ring=s.ring;
 const bridge=bridgePath(STOPS.fork,positions.get(SUMMIT)),graph=buildGraph(centers);
 // ② The steep wall: a sheer rock face on the trophy island's outer side, rising from the ledge at its foot.
 {const S=positions.get(SUMMIT),F=STOPS.wallfoot,a=Math.atan2(F.z-S.z,F.x-S.x),w=stopGroups.get('wallfoot'),h=S.y+.55;const slab=new THREE.Mesh(new THREE.BoxGeometry(1.5,h,.5),rockMaterial);
  slab.position.set(S.x+Math.cos(a)*1.08-F.x,h/2-.3,S.z+Math.sin(a)*1.08-F.z);slab.rotation.y=-a+Math.PI/2;slab.castShadow=slab.receiveShadow=true;w.add(slab);}
 createDecor({scene,centers,graph,skip:id=>id==='lava'||!!STOPS[id]?.ledge});
 const route=createRoute({scene,centers,walkways:WALKWAYS,bridge,slide:slidePath(),climb:climbPath(),trail:trailPath(),trophyAt:positions.get(SUMMIT),reduced});
 {const m=bridge[Math.floor(bridge.length/2)];stationLabel('bridge',`<b>${st('bridge').n}</b><span>${st('bridge').short}</span>`,new THREE.Vector3(m.x,m.y+.75,m.z),'','bridge');}
 // Choosing the summit (trophy or bridge) lights the bridge step by step from the bottom up; the trophy itself always shines.
 let trophyLit=0,summitOn=false;
 function climb(on){summitOn=!!on&&on!==-1;route.light(summitOn);}
 // The trophy always shines gold; choosing it (or the bridge) lights the bridge step by step from the bottom up.
 function updateStairs(now,delta){route.update(delta,elapsed);trophyLit=1;architecture.shine(1);}
 const routePoints=[...route.points().filter((_,i)=>i%6===0),...Object.values(STOPS).flatMap(s=>[[-1,-1],[1,-1],[-1,1],[1,1]].map(([x,z])=>({x:s.x+x*1.3,y:s.y+(s.ledge?.6:1.3),z:s.z+z*1.2}))),...[[-1,-1],[1,-1],[-1,1],[1,1]].map(([x,z])=>({x:UNIVERSITY_AT.x+x*1.3,y:UNIVERSITY_AT.y+1.7,z:UNIVERSITY_AT.z+z*1.2}))];
 function stairBox(){const box=new THREE.Box3();for(const id of [SUMMIT]){const p=positions.get(id);box.expandByPoint(p.clone().add(new THREE.Vector3(-1.3,0,-1.2)));box.expandByPoint(p.clone().add(new THREE.Vector3(1.3,id===SUMMIT?1.9:1.1,1.2)));}for(const p of routePoints)box.expandByPoint(new THREE.Vector3(p.x,p.y,p.z));return box;}
 // Choosing the trophy: the camera rides along the bridge with the light as it climbs, then closes in on the trophy.
 const SWEEP_MS=1600,RIDE_MS=SWEEP_MS+800,RIDE_DIR=new THREE.Vector3(1.2,3.4,8.3).normalize();
 function trophyView(inset){const p=positions.get(SUMMIT),target=p.clone().add(new THREE.Vector3(0,1.35,-.05));const [wf,hf]=fractions(inset);const distance=Math.max(4.6,fitDistance(1.7,camera.fov,camera.aspect,wf,hf));return {target,distance};}
 function bridgeAt(g){const f=Math.max(0,Math.min(1,g))*(bridge.length-1),i=Math.floor(f),a=bridge[i],b=bridge[Math.min(i+1,bridge.length-1)],u=f-i;return new THREE.Vector3(a.x+(b.x-a.x)*u,a.y+(b.y-a.y)*u+.3,a.z+(b.z-a.z)*u);}
 function focusClimb(inset,instant=false){lastInset=inset;framing={kind:'climb'};
  // A panel opening mid-ride only updates where the ride ends.
  if(instant&&fly?.ride){fly.inset=inset;return;}
  const end=trophyView(inset);
  if(instant||reduced.matches){const position=end.target.clone().addScaledVector(RIDE_DIR,end.distance);flyTo(...shifted(position,end.target.clone(),end.distance,inset),true);return;}
  gestures.stop();follow=null;const fromP=camera.position.clone(),fromT=controls.target.clone();
  fly={ride:true,time:performance.now(),inset,path(t){const ms=t*RIDE_MS,fin=trophyView(this.inset),k=v=>v*v*(3-2*v),cl=v=>Math.max(0,Math.min(1,v));
   const toTrophy=k(cl((ms-1000)/(RIDE_MS-1000))),target=bridgeAt(ms/SWEEP_MS+.06).lerp(fin.target,toTrophy),distance=8.5+(fin.distance-8.5)*toTrophy;
   const [pos,tg]=shifted(target.clone().addScaledVector(RIDE_DIR,distance),target.clone(),distance,this.inset),blend=k(cl(ms/300));
   return [fromP.clone().lerp(pos,blend),fromT.clone().lerp(tg,blend)];}};}
 // Key-point pins: numbered tags on stems standing over the selected island.
 const pinGroup=new THREE.Group();scene.add(pinGroup);const pinMaterial=new THREE.LineBasicMaterial({color:'#5b6f60',transparent:true,opacity:.75});let pinViews=[],pinIsland=null;
 function showPins(id,items=[],{onPick=()=>{},onHover=()=>{}}={}){for(const v of pinViews){pinGroup.remove(v.line,v.label);v.line.geometry.dispose();v.el.remove();}pinViews=[];pinIsland=id;if(!id||!positions.has(id))return;
  const p=positions.get(id),spots=pinSpots(items.length);
  items.forEach((item,k)=>{const base=p.clone().add(new THREE.Vector3(spots[k].x,.3,spots[k].z)),tip=base.clone().add(new THREE.Vector3(0,spots[k].lift+(p.y>0?1:0),0));
   const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints([base,tip]),pinMaterial);const el=document.createElement('button');el.className='step-pin';el.type='button';el.innerHTML=`<b>${item.mark}</b><span>${item.label}</span>`;el.setAttribute('aria-label',`了解重點 ${k+1}：${item.label}`);
   el.onclick=e=>{e.stopPropagation();onPick(k);};el.onpointerenter=e=>{if(e.pointerType==='mouse')onHover(k,true);};el.onpointerleave=e=>{if(e.pointerType==='mouse')onHover(k,false);};el.onfocus=()=>onHover(k,true);el.onblur=()=>onHover(k,false);
   const label=new CSS2DObject(el);label.position.copy(tip);pinGroup.add(line,label);pinViews.push({line,label,el});});
  lastLayout=-Infinity;}
 function pinState({hot=-1,sel=-1}={}){pinViews.forEach((v,k)=>{v.el.classList.toggle('hot',k===hot);v.el.classList.toggle('sel',k===sel);v.el.setAttribute('aria-pressed',k===sel);});}
 // Times of day: sky, haze and light change together.
 const LIGHT={dawn:{sun:'#ffd5b8',power:2.4,at:[12,6,7],sky:'#f4e7f0',ground:'#c8b6a6',ambient:2.4,clear:'#f7d6c8'},day:{sun:'#fff3d5',power:3.2,at:[-7,14,8],sky:'#f6f9ff',ground:'#cbbd9c',ambient:2.8,clear:'#dcebf4'},dusk:{sun:'#ffbe8c',power:2.8,at:[-11,8,6],sky:'#f6dcd2',ground:'#c2a598',ambient:2.7,clear:'#f3a87c'},night:{sun:'#c9d5ff',power:.7,at:[-7,14,8],sky:'#9fb2d8',ground:'#4a5068',ambient:1.2,clear:'#24365a'}};
 // The clock: light, sky, stars and lit windows follow the hour, blending smoothly between dawn, day, dusk and night; rain greys it all.
 const weather=createWeather(scene,{reduced});
 let hour=8,lightAt=-Infinity,lastPaint=null,phase=dayPhase(8);
 const C1=new THREE.Color(),C2=new THREE.Color(),V1=new THREE.Vector3();
 function applyLight(){const p=dayPhase(hour),A=LIGHT[p.a],B=LIGHT[p.b],t=p.t,wet=weather.rain();phase=p;
  sun.color.set(A.sun).lerp(C1.set(B.sun),t);sun.intensity=(A.power+(B.power-A.power)*t)*(1-.45*wet);sun.position.copy(V1.set(...A.at).lerp(new THREE.Vector3(...B.at),t));
  ambient.color.set(A.sky).lerp(C1.set(B.sky),t);ambient.groundColor.set(A.ground).lerp(C1.set(B.ground),t);ambient.intensity=(A.ambient+(B.ambient-A.ambient)*t)*(1-.2*wet);
  renderer.setClearColor(C2.set(A.clear).lerp(C1.set(B.clear),t));
  const key=`${Math.round(hour*30)}:${Math.round(wet*30)}`;if(key!==lastPaint){lastPaint=key;sky.blend(p.a,p.b,t,wet,p.stars);}
  architecture.time(p.stars>.5?'night':p.name==='dusk'||p.name==='dawn'?'dusk':'day');}
 function time(name){hour={dawn:6.4,day:12,dusk:18,night:22}[name]??12;applyLight();}
 const flows=[],seen=new Set();
 for(const t of topics)for(const id of t.links){const key=relationKey(t.id,id);if(seen.has(key))continue;seen.add(key);const a=positions.get(t.id).clone(),b=positions.get(id).clone();a.y+=.3;b.y+=.3;const mid=a.clone().lerp(b,.5);mid.y=Math.max(a.y,b.y)+.17;const curve=new THREE.QuadraticBezierCurve3(a,mid,b);const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(32)),new THREE.LineDashedMaterial({color:'#fff0ba',dashSize:.12,gapSize:.12,transparent:true,opacity:.9}));line.computeLineDistances();scene.add(line);const dot=mesh(scene,new THREE.SphereGeometry(.035,6,4),'#fff4c5',0,.3,0);dot.castShadow=false;line.userData.relation=key;flows.push({key,line,dot,curve,a:t.id,b:id});}
 // People walking on the map (see walkers.js); the visitor's own character is one of them.
 const walkers=createWalkers({scene,topics,positions:centers,graph,links:flows.map(f=>({key:f.key,a:f.a,b:f.b})),CSS2DObject,reduced,avatar,onArrive,onLog,onGuide});walkers.onClick(w=>onWalker(w));
 let follow=null,followLast=null,placing=false,peopleOn=true;
 let selected=null,selectedRelation=null,hoveredRelation=null,connections=true,paused=false,frame=0,elapsed=0,lastTime=0,fly=null,framing=null,lastLayout=-Infinity;
 function redrawSelection(){const pair=(hoveredRelation||selectedRelation)?.split(':')||[];
  for(const [id]of tops){const active=pair.length?pair.includes(id):id===selected;rings.get(id).visible=active;labelButtons.get(id).classList.toggle('selected',active);labelButtons.get(id).classList.toggle('dim',!!(selected||selectedRelation)&&!active);labelButtons.get(id).setAttribute('aria-pressed',active);}
  for(const f of flows){const active=f.key===selectedRelation||f.key===hoveredRelation;f.line.visible=f.dot.visible=connections&&groups.get(f.a).visible&&groups.get(f.b).visible&&(!selected||selected===f.a||selected===f.b||active);f.line.material.color.set(active?'#b9793f':'#fff0ba');f.line.material.opacity=selectedRelation && !active ? .25 : active ? 1 : .8;f.dot.scale.setScalar(active?1.65:1);}
 walkers.sync({shown:peopleOn,filterIds:[...groups].filter(([,g])=>g.visible).map(([id])=>id),connections,selectedIsland:selected,activeRelation:selectedRelation||hoveredRelation});
 }
 function relationAt(e){if(!connections)return null;const rect=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);ray.setFromCamera(pointer,camera);ray.params.Line.threshold=camera.position.distanceTo(controls.target)*.012;const hits=ray.intersectObjects(flows.filter(f=>f.line.visible).map(f=>f.line),false);const land=ray.intersectObjects([...groups.values()].filter(g=>g.visible),true)[0];return hits.find(h=>!land||h.distance<land.distance)?.object.userData.relation||null;}
 const ray=new THREE.Raycaster(),pointer=new THREE.Vector2();let start=null,moved=false;
 renderer.domElement.addEventListener('pointerdown',()=>{fly=null;framing=null;follow=null;});renderer.domElement.addEventListener('wheel',()=>{fly=null;framing=null;follow=null;},{passive:true});
 renderer.domElement.addEventListener('pointerdown',e=>{if(e.button!==0)return;start={x:e.clientX,y:e.clientY};moved=false;});
 renderer.domElement.addEventListener('pointermove',e=>{if(start&&Math.hypot(e.clientX-start.x,e.clientY-start.y)>5)moved=true;});
 renderer.domElement.addEventListener('pointerup',e=>{if(e.button!==0||!start||moved){start=null;return;}start=null;const rect=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);ray.setFromCamera(pointer,camera);const hit=ray.intersectObjects([...groups.values()].filter(g=>g.visible),true)[0];if(placing){const any=ray.intersectObjects([...groups.values(),...stopGroups.values()].filter(g=>g.visible),true)[0];let node=any?.object;while(node&&!node.userData.id&&!node.userData.stop)node=node.parent;if(!node||node.userData.stop&&STOPS[node.userData.stop].ledge||['lava','cliff'].includes(node.userData.stop)){onPlace(null);return;}const pid=node.userData.id||node.userData.stop,hit2=any;const c=centers.get(pid),dx=hit2.point.x-c.x,dz=hit2.point.z-c.z,r=Math.hypot(dx,dz)||1,k=Math.min(1.12,Math.max(.76,r))/r;placing=false;onPlace(pid,{x:dx*k,z:dz*k});return;}const who=walkers.pick(ray);if(who&&(!hit||who.distance<=hit.distance+.4)){onWalker(who.walker);return;}const part=ray.intersectObjects([...route.pickables,uniGroup,...stopGroups.values()],true)[0];if(part&&(!hit||part.distance<hit.distance)){let n=part.object;while(n&&!n.userData.stop&&n!==uniGroup&&n.name!=='golden-bridge')n=n.parent;onStation(n?.name==='golden-bridge'?'bridge':n===uniGroup?'university':stationOf[n?.userData.stop]||'start',n?.userData.stop&&['lava','cliff','wall','wallfoot'].includes(n.userData.stop)?{path:n.userData.stop==='wallfoot'?'wall':n.userData.stop}:undefined);return;}const link=relationAt(e);if(link){onRelation(link);return;}if(hit){let node=hit.object;while(node&&!node.userData.id)node=node.parent;if(node)onSelect(node.userData.id);}});
 renderer.domElement.addEventListener('pointermove',e=>{if(start||e.pointerType!=='mouse')return;const key=relationAt(e),who=walkers.pick(ray)?.walker||null;walkers.hover(who?.kind==='messenger'?who:null);if(key!==hoveredRelation){hoveredRelation=key;redrawSelection();}renderer.domElement.style.cursor=placing?'crosshair':key||who?'pointer':'';});
 renderer.domElement.addEventListener('pointerleave',()=>{hoveredRelation=null;walkers.hover(null);redrawSelection();renderer.domElement.style.cursor='';});
 renderer.domElement.addEventListener('pointercancel',()=>{start=null;});renderer.domElement.addEventListener('contextmenu',e=>e.preventDefault());
 // Keep multitouch camera gestures from being mistaken for a single tap.
 renderer.domElement.addEventListener('pointerdown',e=>{if(!e.isPrimary)moved=true;});
 const gestures=mapGestures({host,canvas:renderer.domElement,camera,controls,onStart:()=>{fly=null;framing=null;follow=null;}});
 function flyTo(position,target,instant){gestures.stop();follow=null;if(instant||reduced.matches){fly=null;camera.position.copy(position);controls.target.copy(target);controls.update();return;}fly={time:performance.now(),from:camera.position.clone(),to:position,old:controls.target.clone(),target};}
 // Shift the camera so the subject sits in the middle of the uncovered part of the map.
 function shifted(position,target,distance,{left=0,right=0,top=0,bottom=0}){const height=host.clientHeight||1;const unitsPerPx=2*distance*Math.tan(THREE.MathUtils.degToRad(camera.fov/2))/height;const look=new THREE.Matrix4().lookAt(position,target,camera.up);const xAxis=new THREE.Vector3().setFromMatrixColumn(look,0),yAxis=new THREE.Vector3().setFromMatrixColumn(look,1);const shift=xAxis.multiplyScalar((right-left)/2*unitsPerPx).add(yAxis.multiplyScalar(-(bottom-top)/2*unitsPerPx));return [position.add(shift),target.add(shift)];}
 function fractions({left=0,right=0,top=0,bottom=0}){const width=host.clientWidth||1,height=host.clientHeight||1;return [(width-left-right)/width,(height-top-bottom)/height];}
 let lastInset={};
 // Overview: find the nearest distance at which every island (with its buildings) projects inside the uncovered area.
 const probe=new THREE.PerspectiveCamera();
 function fitsAt(distance,direction,target,inset){const width=host.clientWidth||1,height=host.clientHeight||1,{left=0,right=0,top=0,bottom=0}=inset;const [position,look]=shifted(target.clone().add(direction.clone().multiplyScalar(distance)),target.clone(),distance,inset);probe.copy(camera);probe.position.copy(position);probe.lookAt(look);probe.updateMatrixWorld();probe.updateProjectionMatrix();
  const minX=-1+2*left/width+.04,maxX=1-2*right/width-.04,minY=-1+2*bottom/height+.04,maxY=1-2*top/height-.04,v=new THREE.Vector3();
  for(const p of positions.values())for(const dx of [-1.3,1.3])for(const dz of [-1.2,1.2])for(const y of [p.y,p.y+(p.y>0?1.9:1.1)]){v.set(p.x+dx,y,p.z+dz).project(probe);if(v.x<minX||v.x>maxX||v.y<minY||v.y>maxY)return false;}
  for(const p of routePoints){v.set(p.x,p.y+.3,p.z).project(probe);if(v.x<minX||v.x>maxX||v.y<minY||v.y>maxY)return false;}
  return true;}
 // Aim at the middle of everything on the map (islands, stairs, university), so the overview wastes no space now that the summit sits high at the back.
 function sceneCenter(){const box=new THREE.Box3();for(const p of positions.values()){box.expandByPoint(new THREE.Vector3(p.x-1.3,p.y,p.z-1.2));box.expandByPoint(new THREE.Vector3(p.x+1.3,p.y+(p.y>0?1.9:1.1),p.z+1.2));}for(const p of routePoints)box.expandByPoint(new THREE.Vector3(p.x,p.y,p.z));const c=box.getCenter(new THREE.Vector3());c.y=Math.min(c.y,1.2);return c;}
 function home({instant=false,bird=false,...inset}={}){lastInset=inset;framing={kind:'home',bird};const mobile=host.clientWidth<650;const target=sceneCenter();const direction=(bird?new THREE.Vector3(.3,14,1.9):mobile?new THREE.Vector3(.6,10,9.5):new THREE.Vector3(2.8,9.4,13.6)).normalize();
  let lo=6,hi=controls.maxDistance;if(!fitsAt(hi,direction,target,inset))lo=hi;else for(let i=0;i<14;i++){const mid=(lo+hi)/2;if(fitsAt(mid,direction,target,inset))hi=mid;else lo=mid;}
  const distance=Math.max(lo,Math.min(hi,controls.maxDistance));flyTo(...shifted(target.clone().add(direction.multiplyScalar(distance)),target,distance,inset),instant);}
 // Move toward an island and keep it in the part of the map that panels do not cover.
 function focus(id,{instant=false,...inset}={}){const p=positions.get(id);if(!p)return;lastInset=inset;framing={kind:'focus',id};if(id===SUMMIT){focusClimb(inset,instant);return;}const target=p.clone().setY(p.y+.65);const [wf,hf]=fractions(inset);const distance=fitDistance(radii.get(id),camera.fov,camera.aspect,wf,hf);const position=target.clone().add(new THREE.Vector3(2.4,7,8.3).normalize().multiplyScalar(distance));flyTo(...shifted(position,target,distance,inset),instant);}
 // Move in close to one key point of an island.
 function focusStep(id,k,count,{instant=false,...inset}={}){const p=positions.get(id);if(!p)return;const spot=pinSpots(count)[k];if(!spot)return;lastInset=inset;framing={kind:'step',id,k,count};const target=p.clone().add(new THREE.Vector3(spot.x*.7,.75,spot.z*.7));const [wf,hf]=fractions(inset);const distance=Math.max(5.5,fitDistance(1.15,camera.fov,camera.aspect,wf,hf));const position=target.clone().add(new THREE.Vector3(2.4,6,8.3).normalize().multiplyScalar(distance));flyTo(...shifted(position,target,distance,inset),instant);}
 function focusRelation(key,{instant=false,...inset}={}){const [a,b]=key.split(':').map(id=>positions.get(id));if(!a||!b)return;lastInset=inset;framing={kind:'relation',key};const target=a.clone().lerp(b,.5);target.y+=.65;const [wf,hf]=fractions(inset),distance=fitDistance(a.distanceTo(b)/2+1.8,camera.fov,camera.aspect,wf,hf);const position=target.clone().add(new THREE.Vector3(2.4,7,8.3).normalize().multiplyScalar(distance));flyTo(...shifted(position,target,distance,inset),instant);}
 function focusWalker(w,{instant=false,...inset}={}){if(!w)return;lastInset=inset;framing={kind:'walker',w};const target=walkers.where(w).add(new THREE.Vector3(0,.32,0));const [wf,hf]=fractions(inset);const distance=Math.min(7,Math.max(3.6,fitDistance(.95,camera.fov,camera.aspect,wf,hf)));const position=target.clone().add(new THREE.Vector3(1.2,3.4,5.6).normalize().multiplyScalar(distance));flyTo(...shifted(position,target,distance,inset),instant);follow=w;followLast=walkers.where(w);}
 function followStep(){if(!follow)return;const now=walkers.where(follow),d=now.clone().sub(followLast);followLast=now;if(d.lengthSq()===0)return;if(fly){fly.to.add(d);fly.target.add(d);}else{camera.position.add(d);controls.target.add(d);}}
 // Fly to one station of the journey; the trailhead shows all three paths at once, the bridge its whole length.
 function focusStation(id,{instant=false,...inset}={}){lastInset=inset;framing={kind:'station',id};let target,radius=1.7;
  const pts=id==='bridge'?bridge.map(p=>new THREE.Vector3(p.x,p.y,p.z)):id==='fork'?['fork','lava','cliff','wallfoot'].map(k=>centers.get(k).clone()):null;
  if(pts){const sp=new THREE.Box3().setFromPoints(pts).getBoundingSphere(new THREE.Sphere());target=sp.center.setY(sp.center.y+.4);radius=sp.radius*.8+.6;}
  else{const c=centers.get(id==='university'?UNIVERSITY:id);target=new THREE.Vector3(c.x,c.y+.7,c.z);}
  const [wf,hf]=fractions(inset);const distance=Math.max(4.6,fitDistance(radius,camera.fov,camera.aspect,wf,hf));const position=target.clone().add(new THREE.Vector3(1.2,4.4,8.3).normalize().multiplyScalar(distance));flyTo(...shifted(position,target,distance,inset),instant);}
 function refit(inset=lastInset){if(framing?.kind==='relation')focusRelation(framing.key,{...inset,instant:true});else if(framing?.kind==='focus')focus(framing.id,{...inset,instant:true});else if(framing?.kind==='step')focusStep(framing.id,framing.k,framing.count,{...inset,instant:true});else if(framing?.kind==='climb')focusClimb(inset,true);else if(framing?.kind==='station')focusStation(framing.id,{...inset,instant:true});else if(framing?.kind==='walker')focusWalker(framing.w,{...inset,instant:true});else if(framing?.kind==='home')home({...inset,bird:framing.bird,instant:true});}
 function layoutLabels(){
  const bounds=host.getBoundingClientRect(),items=[],obstacles=[];
  for(const el of document.querySelectorAll('.brand-card,.map-tools,.top-actions,.map-caption,.legend,#detail,#index-panel,.step-pin')){if(el.hidden||getComputedStyle(el).visibility==='hidden')continue;const r=el.getBoundingClientRect();if(r.width&&r.height)obstacles.push(r);}
  const visible=[...labelButtons].filter(([id])=>groups.get(id).visible);
  for(const [,el]of visible)el.classList.remove('compact');
  const sizes=new Map(visible.map(([id,el])=>[id,{width:el.offsetWidth,height:el.offsetHeight}]));
  for(const [,el]of visible)el.classList.add('compact');
  for(const [id,el]of visible){const point=labelObjects.get(id).getWorldPosition(new THREE.Vector3()).project(camera);if(point.z< -1||point.z>1){el.style.visibility='hidden';continue;}items.push({id,...sizes.get(id),badgeWidth:el.offsetWidth,badgeHeight:el.offsetHeight,x:bounds.left+(point.x+1)/2*bounds.width,y:bounds.top+(1-point.y)/2*bounds.height,priority:id===selected||document.activeElement===el?0:el.classList.contains('recommended')?1:2,order:topics.findIndex(t=>t.id===id)});}
  for(const placement of placeLabels(items,bounds,obstacles)){const el=labelButtons.get(placement.id);el.classList.toggle('compact',placement.compact);el.style.marginLeft=placement.dx+'px';el.style.marginTop=placement.dy+'px';el.style.visibility=placement.visible?'':'hidden';}
 }

 function resize(){const w=host.clientWidth,h=host.clientHeight;camera.aspect=w/h;camera.fov=camera.aspect<.8?50:38;camera.updateProjectionMatrix();renderer.setSize(w,h);labels.setSize(w,h);lastLayout=-Infinity;}
 const observer=new ResizeObserver(resize);observer.observe(host);resize();home({instant:true});
 function animate(now){frame=requestAnimationFrame(animate);const delta=lastTime?Math.min((now-lastTime)/1000,.05):0;lastTime=now;if(!paused)elapsed+=delta;walkers.update(delta,paused);followStep();if(fly?.ride){const t=Math.min(1,(now-fly.time)/RIDE_MS),[p,tg]=fly.path(t);camera.position.copy(p);controls.target.copy(tg);if(t===1)fly=null;}else if(fly){const t=Math.min(1,(now-fly.time)/FLY_MS),v=easeInOutCubic(t);camera.position.lerpVectors(fly.from,fly.to,v);controls.target.lerpVectors(fly.old,fly.target,v);if(t===1)fly=null;}gestures.update(delta*1000);controls.update();sky.update(elapsed,camera);weather.update(paused?0:delta,phase.daylight);if(now-lightAt>100){lightAt=now;applyLight();}if(!reduced.matches)lavaMat.emissiveIntensity=1.2+Math.sin(elapsed*2.6)*.25+Math.sin(elapsed*7.1)*.1;updateStairs(now,delta);if(!reduced.matches)for(const f of floaters)f.mesh.position.y=f.y+Math.sin(elapsed*.8+f.phase)*.07;for(let i=0;i<flows.length;i++)if(flows[i].dot.visible)flows[i].dot.position.copy(flows[i].curve.getPoint((elapsed*.12+i*.13)%1));renderer.render(scene,camera);labels.render(scene,camera);if(now-lastLayout>120){layoutLabels();lastLayout=now;}}
 frame=requestAnimationFrame(animate);
 renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();host.querySelector('.webgl-message')?.remove();const message=document.createElement('p');message.className='webgl-message';message.textContent='3D 畫面暫時中斷。你仍可用主題清單探索；請重新整理恢復地圖。';host.append(message);});
 return {
  people(on){peopleOn=on;redrawSelection();},
  setHour(h){hour=h;},hour:()=>hour,phase:()=>phase,weather:()=>weather.state(),rain(on){weather.setRain(on);},guideTo(id){return walkers.guideTo(id);},guideAppear(id){return walkers.guideAppear(id);},
  focusStation(id,inset){focusStation(id,inset);},stationSelect(id){for(const [k,v]of stationLabels)v.el.classList.toggle('selected',k===id||(id==='fork'&&k.startsWith('path-')));},
  stationPoint(id){const l=stationLabels.get(id);if(!l)return null;const v=l.o.position.clone().project(camera),r=renderer.domElement.getBoundingClientRect();return {x:r.left+(v.x+1)/2*r.width,y:r.top+(1-v.y)/2*r.height};},stopFollow(){follow=null;if(framing?.kind==='walker')framing=null;},
  walkerSelect(w){walkers.select(w);},walkerFocus(w,inset){focusWalker(w,inset);},following:()=>!!follow,guide:()=>walkers.guide(),me:()=>walkers.me(),
  avatarLook(look){const v=walkers.avatar.look(look);if(follow&&follow.kind==='avatar'){follow=walkers.me();followLast=walkers.where(follow);}if(framing?.kind==='walker'&&framing.w.kind==='avatar')framing.w=walkers.me();walkers.select(walkers.selected()?.kind==='avatar'?walkers.me():walkers.selected());return v;},avatarGo(id,spot){walkers.avatar.go(id,spot);},avatarMode(m){walkers.avatar.mode(m);},placing(on){placing=on;renderer.domElement.style.cursor=on?'crosshair':'';},
  walkerState:()=>({...walkers.state(),following:follow?.kind||null,placing}),
  islandPoint(id,dx=0,dz=0){const p=positions.get(id);if(!p)return null;const v=new THREE.Vector3(p.x+dx,p.y+.25,p.z+dz).project(camera),r=renderer.domElement.getBoundingClientRect();return {x:r.left+(v.x+1)/2*r.width,y:r.top+(1-v.y)/2*r.height};},
  walkerPoint(kind,i=0){const target=walkers.find(kind,i);if(!target||!target.fig.visible)return null;const v=walkers.where(target).add(new THREE.Vector3(0,.25,0)).project(camera),r=renderer.domElement.getBoundingClientRect();return {x:r.left+(v.x+1)/2*r.width,y:r.top+(1-v.y)/2*r.height};},
  names(value){host.classList.toggle('labels-off',!value);lastLayout=-Infinity;},emphasize(ids){for(const [id,label]of labelButtons)label.classList.toggle('recommended',ids.includes(id));},select(id){selected=id;selectedRelation=null;hoveredRelation=null;redrawSelection();},relation(key){selectedRelation=key;hoveredRelation=null;redrawSelection();},hoverRelation(key){hoveredRelation=key;redrawSelection();},filter(ids){for(const [id,g]of groups)g.visible=ids.includes(id);redrawSelection();},connections(value){connections=value;redrawSelection();},pause(value){paused=value;},night(value){time(value?'night':'day');},time,pins:showPins,pinState,climb,stairsLit:()=>route.lit(),trophy:()=>Math.round(trophyLit*100)/100,stairPoint(t){const v=route.stairPoint(t).project(camera),r=renderer.domElement.getBoundingClientRect();return [r.left+(v.x+1)/2*r.width,r.top+(1-v.y)/2*r.height];},focusStep,birdView:()=>framing?.kind==='home'&&framing.bird,mode(rotate){gestures.rotate(rotate);},zoom(factor){fly=null;framing=null;gestures.stop();camera.position.sub(controls.target).multiplyScalar(factor).add(controls.target);controls.update();},home,focus,focusRelation,refit,flying:()=>!!fly,view(){const r=v=>v.toArray().map(n=>Math.round(n*100)/100);return {target:r(controls.target),position:r(camera.position),distance:Math.round(camera.position.distanceTo(controls.target)*100)/100,drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,azimuth:Math.round(controls.getAzimuthalAngle()*100)/100,polar:Math.round(controls.getPolarAngle()*100)/100};},dispose(){cancelAnimationFrame(frame);observer.disconnect();controls.dispose();renderer.dispose();labels.domElement.remove();renderer.domElement.remove();}};
}
