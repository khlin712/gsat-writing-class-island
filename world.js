import * as THREE from 'three';
import {OrbitControls} from './vendor/OrbitControls.js';
import {CSS2DRenderer,CSS2DObject} from './vendor/CSS2DRenderer.js';
import {FLY_MS,easeInOutCubic} from './motion.js';
import {createArchitecture} from './architecture.js';
import {relationKey} from './relations.js';
import {mapGestures} from './gestures.js';
import {createSky,random,dayPhase} from './sky.js';
import {createWeather} from './weather.js';
import {walkingObstacles} from './navigation.js';
import {createDecor} from './decor.js';
import {placeLabels,fitDistance,pinSpots} from './layout.js';
import {SUMMIT,UNIVERSITY,SUMMIT_AT,UNIVERSITY_AT,RISE,WALKWAYS,STOPS,bridgePath,trailPath,TRAIL,descentPath,climbPath,buildGraph} from './summit.js';
import {STATIONS} from './journey.js';
import {createRoute,SWEEP_MS} from './route3d.js';
import {createResolution} from './resolution.js';
import {createTrailHazards} from './hazards.js';
import {createWalkers} from './walkers.js';

export function createWorld(host,topics,onSelect,{onRelation=()=>{},onStation=()=>{},onWalker=()=>{},onArrive=()=>{},onLog=()=>{},onPlace=()=>{},onGuide=()=>{},avatar=null}={}){
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const scene=new THREE.Scene();scene.fog=new THREE.Fog('#cbe0ee',30,95);
 const camera=new THREE.PerspectiveCamera(38,1,.1,120);
 const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false});// Starts at the screen's sharpness (at most 2×); resolution.js lowers it on devices that cannot keep up, and raises it again.
 let held=false,textSigns=null,trails=[];
 const SIGN_READ_DIST=16,signAt=new THREE.Vector3(),signNdc=new THREE.Vector3();
 function collectTextSigns(){const out=[],aniso=renderer.capabilities.getMaxAnisotropy?.()||1;scene.traverse(o=>{if(o.userData?.textSign){out.push(o);const map=o.material?.map;if(map&&map.anisotropy!==aniso){map.anisotropy=aniso;map.needsUpdate=true;}}});return out;}
 function readable(m){m.getWorldPosition(signAt);if(signAt.distanceTo(camera.position)>SIGN_READ_DIST)return false;signNdc.copy(signAt).project(camera);return Math.abs(signNdc.x)<1&&Math.abs(signNdc.y)<1&&signNdc.z<1;}
 const resolution=createResolution({max:Math.min(devicePixelRatio||1,2)});renderer.setPixelRatio(resolution.ratio);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.setClearColor('#dcebf4');
 renderer.domElement.setAttribute('aria-label','3D 作文學習島。拖曳平移、右鍵旋轉、滾輪縮放，也可使用工具列與主題清單。');renderer.domElement.setAttribute('role','img');host.append(renderer.domElement);
 const labels=new CSS2DRenderer();labels.domElement.className='world-labels';host.append(labels.domElement);
 const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.09;controls.minDistance=3;controls.maxDistance=44;controls.minPolarAngle=.15;controls.maxPolarAngle=Math.PI/2.12;controls.screenSpacePanning=true;controls.enableZoom=false;controls.maxTargetRadius=16;controls.mouseButtons={LEFT:null,MIDDLE:THREE.MOUSE.DOLLY,RIGHT:THREE.MOUSE.ROTATE};controls.touches={ONE:null,TWO:null};
 // Custom gestures own left/touch capture; OrbitControls must not retain those pointers and block a later right drag.
 const orbitDown=controls._onPointerDown;renderer.domElement.removeEventListener('pointerdown',orbitDown);renderer.domElement.addEventListener('pointerdown',e=>{if(e.pointerType!=='touch'&&e.button===2)orbitDown(e);});
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
 // Low scenery adds depth inside the ring without creating another destination or blocking a route.
 const scenery=new THREE.Group();scenery.name='inner-scenery';scene.add(scenery);
 for(const [i,[x,y,z,r]]of [[2.2,-2.5,-1.8,.55],[3.9,-3,-3.4,.4],[.65,-2.3,2.9,.45]].entries()){
  const g=new THREE.Group();g.position.set(x,y,z);g.name='scenic-islet';scenery.add(g);
  const stone=new THREE.Mesh(rock(r,r*1.8,401+i),rockMaterial);stone.position.y=-r*.9;g.add(stone);
  mesh(g,new THREE.CylinderGeometry(r,r*.92,.1,6),'#8d9d75',0,.04,0);
  tree(g,-r*.15,0,r*.8);mesh(g,geometries.ball,'#a99a7c',r*.4,.12,r*.2,r*.15,r*.13,r*.12);
 }
 const pages=new THREE.Group();pages.name='writing-pages';pages.position.set(.55,.6,3.65);pages.rotation.set(.12,-.45,-.15);scenery.add(pages);
 for(const side of [-1,1]){const page=mesh(pages,geometries.box,'#fff4d9',side*.16,0,0,.31,.014,.4);page.rotation.z=side*.18;}
 box(pages,0,-.025,0,.025,.025,.42,'#b68b55');
 const plane=new THREE.BufferGeometry();plane.setAttribute('position',new THREE.Float32BufferAttribute([0,0,-.3,-.24,0,.22,0,.07,.08,0,0,-.3,0,.07,.08,.24,0,.22],3));plane.computeVertexNormals();
 const paper=new THREE.Mesh(plane,new THREE.MeshStandardMaterial({color:'#f5e7c5',side:THREE.DoubleSide,roughness:1}));paper.name='paper-plane';paper.position.set(1.15,.65,2.85);paper.rotation.set(.1,.5,-.18);scenery.add(paper);
 floaters.push({mesh:pages,y:pages.position.y,phase:1},{mesh:paper,y:paper.position.y,phase:3});
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
 // 02: three stepping stones for before, during and after class, where those key points' pins stand (keys 3–5 of five).
 {const g=groups.get('teaching'),t=topics.find(x=>x.id==='teaching');if(g&&t){const spots=pinSpots(t.steps.length);['#e8c27a','#f2a76a','#e07a5f'].forEach((c,i)=>{const sp=spots[i+2];if(!sp)return;const st=mesh(g,new THREE.CylinderGeometry(.13,.15,.05,10),c,sp.x,.255,sp.z);st.castShadow=false;mesh(g,new THREE.CylinderGeometry(.09,.1,.02,10),'#fff4d6',sp.x,.29,sp.z).castShadow=false;});}}
 // ---- The journey stops (see summit.js / journey.js): start, trailhead, the two cliff tops on the rough road, the foot of the
 // steep wall, calendar, trial-class & sign-up (an open-air cinema) and the service desk. ----
 const stopGroups=new Map(),stationLabels=new Map(),stationOf={start:'start',fork:'fork',wallfoot:'fork',pass1:'fork',pass2:'fork',calendar:'calendar',signup:'signup',contact:'contact',[UNIVERSITY]:'university'};
 const stopColor={start:'#9fc47e',fork:'#d9c99a',calendar:'#c9d3dc',signup:'#b9c98f',contact:'#a8c3ae'};
 Object.entries(STOPS).forEach(([id,s],k)=>{const g=new THREE.Group();g.position.set(s.x,s.y,s.z);g.name='stop-'+id;g.userData.stop=id;scene.add(g);stopGroups.set(id,g);
  if(s.ledge){mesh(g,new THREE.CylinderGeometry(.7,.62,.22,7),'#b9ad95',0,.13,0);mesh(g,new THREE.CylinderGeometry(.66,.66,.04,7),'#d8ccb2',0,.25,0);
   if(s.kind==='crag'){
    // A cliff top: jagged rocks round a bare ledge over a sheer drop — where people on the rough road can fall.
    const col=new THREE.Mesh(rock(.62,2.6+s.y,40+k,6),rockMaterial);col.position.y=-1.3-s.y/2;col.castShadow=true;g.add(col);
    for(let i=0;i<5;i++){const a=i/5*Math.PI*2+.4,sp=mesh(g,new THREE.ConeGeometry(.09,.32+(i%2)*.18,5),'#8d7c63',Math.cos(a)*.56,.36,Math.sin(a)*.56);sp.rotation.z=(i%2?.18:-.14);}
   }else{const r=new THREE.Mesh(rock(.6,1.1,40+k,5),rockMaterial);r.position.y=-.55;g.add(r);}}
  else{mesh(g,baseGeometry,'#a3aa84',0,.025,0);mesh(g,topGeometry,stopColor[id]||'#cdb98f',0,.2,0);architecture.build(g,{kind:s.kind});underside(g,{lift:s.y,kind:s.kind},topics.length+1+k);}});
 // ② The trailhead: a roofed notice board like the one at the start of a mountain trail, standing off to the back-left so the way in
 // from the start, the bridge and the rough road all stay clear; two arrows point to the bridge and to the rough road.
 // ② The trailhead sign says plainly that the bridge is one way among others, and the other side shows common pitfalls.
 function forkSignMaterial(){const m=new THREE.MeshStandardMaterial({color:'#fff4d6',roughness:.9});if(typeof document==='undefined')return m;
  const c=document.createElement('canvas');c.width=768;c.height=396;const x=c.getContext('2d');x.fillStyle='#fff4d6';x.fillRect(0,0,768,396);x.textAlign='center';
  x.fillStyle='#c4612f';x.font='bold 56px "Noto Sans TC",sans-serif';x.fillText('寫出高分作文的路不只一條。',384,80);
  x.fillStyle='#2f3b33';x.font='bold 46px "Noto Sans TC",sans-serif';[['這座橋呈現的是我經過驗證',160],['「有效」且「高效」的學習路徑；',220],['另一側呈現大多學生',300],['學習作文遇到的誤區。',360]].forEach(([t,y])=>x.fillText(t,384,y));
  const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;m.map=tex;m.color.set('#ffffff');
  // A faint glow of its own, so the words stay readable at dusk and at night.
  m.emissive.set('#ffffff');m.emissiveMap=tex;m.emissiveIntensity=.32;return m;}
 {const f=stopGroups.get('fork'),F=STOPS.fork,wood='#8a6a48',
   // Rear-left beside the golden bridge entrance, matching the marked island area.
   bx=-.5,bz=-.62,board=new THREE.Group();board.position.set(bx,-.06,bz);
  // (see above: where the board stands and which way it faces)
  // Face the dedicated second-stop view, slightly off axis; keep the fork and both entrances visible.
  board.rotation.y=-.12;board.scale.setScalar(1.15);f.add(board);
  for(const x of [-.32,.32])box(board,x,.27,0,.06,.78,.06,wood);box(board,0,.62,0,.74,.42,.05,wood);{const face=box(board,0,.63,.03,.66,.34,.01,'#fff4d6');face.name='fork-sign-face';face.material=forkSignMaterial();face.userData.textSign=true;}const roof=mesh(board,new THREE.BoxGeometry(1,1,1),'#5f5047',0,1.08,0,.84,.05,.2);roof.rotation.x=.18;
  const post=new THREE.Group();post.position.set(.1,0,.35);f.add(post);box(post,0,.27,0,.05,.72,.05,wood);
  [['bridge','#d9a521'],['pass1','#6b5a45']].forEach(([to,c],i)=>{const T=to==='bridge'?bridgePath()[6]:STOPS[to],a=Math.atan2(T.z-F.z-post.position.z,T.x-F.x-post.position.x),arm=new THREE.Group();arm.position.set(0,.84-i*.13,0);arm.rotation.y=-a;post.add(arm);box(arm,.17,0,0,.34,.1,.025,c).castShadow=true;});}
 {const w=stopGroups.get('wallfoot');for(let i=0;i<3;i++)mesh(w,new THREE.TorusGeometry(.12-i*.025,.018,6,16),'#d8b679',.15,.29+i*.02,-.1).rotation.x=Math.PI/2;}
 // Map labels for the stations (①–⑦) and the wrong ways on the rough road.
 function stationLabel(id,text,at,cls,station,extra){const el=document.createElement('button');el.type='button';el.className='station-label '+cls;el.innerHTML=text;el.setAttribute('aria-label',el.textContent);el.onclick=e=>{e.stopPropagation();onStation(station,extra);};const o=new CSS2DObject(el);o.position.copy(at);scene.add(o);stationLabels.set(id,{el,o});}
 const st=id=>STATIONS.find(s=>s.id===id);
 for(const [stop,station,dy]of [['start','start',1.5],['fork','fork',1.6],['calendar','calendar',1.25],['signup','signup',1.3],['contact','contact',1.3]]){const s=STOPS[stop];stationLabel(station,`<b>${st(station).n}</b><span>${st(station).short}</span>`,new THREE.Vector3(s.x,s.y+dy,s.z),'',station);}
 stationLabel('university',`<b>${st('university').n}</b><span>${st('university').short}</span>`,new THREE.Vector3(UNIVERSITY_AT.x,UNIVERSITY_AT.y+1.85,UNIVERSITY_AT.z),'','university');
 for(const [label,stop,path]of [['path-cliff','pass1','cliff'],['path-cliff2','pass2','cliff'],['path-wall','wallfoot','wall']]){const s=STOPS[stop],p=st('fork').paths.find(x=>x.id===path);stationLabel(label,`<span>${p.name}</span>`,new THREE.Vector3(s.x,s.y+(path==='wall'?1.3:1.05),s.z),'path '+path,'fork',{path});}
 // Walkways, ② the climb, ③ the golden bridge to the trophy and the stairs down from the university (see summit.js / route3d.js).
 const centers=new Map(positions);centers.set(UNIVERSITY,uniGroup.position.clone());for(const [id,s]of Object.entries(STOPS))centers.set(id,new THREE.Vector3(s.x,s.y,s.z));for(const [id,s]of Object.entries(STOPS))if(s.ring)centers.get(id).ring=s.ring;
 const bridge=bridgePath(centers.get('fork'),positions.get(SUMMIT)),graph=buildGraph(centers);
 // ② The steep wall: a sheer rock face on the trophy island's outer side, rising from the ledge at its foot.
 // (The climb itself is a set of ropes hanging from the trophy island's rim — see route3d.js.)
 // Only low solid parts block feet; roofs and ground slabs leave walking space open.
 for(const [id,g] of [...groups,[UNIVERSITY,uniGroup],...stopGroups]){const c=centers.get(id);if(c)c.obstacles=walkingObstacles(g,c.y||0);}
 createDecor({scene,centers,graph});
 const hazards=createTrailHazards(TRAIL.length,{reduced});
 const route=createRoute({hazards,scene,centers,walkways:WALKWAYS,bridge,descent:descentPath(),climb:climbPath(),trail:(trails=TRAIL.map(([a,b,o])=>trailPath(centers.get(a),centers.get(b),.2,o))),trophyAt:positions.get(SUMMIT),reduced});
 {const m=bridge[Math.floor(bridge.length/2)];stationLabel('bridge',`<b>${st('bridge').n}</b><span>${st('bridge').short}</span>`,new THREE.Vector3(m.x,m.y+.75,m.z),'','bridge');}
 // Choosing the summit (trophy or bridge) lights the bridge step by step from the bottom up; the trophy itself always shines.
 let trophyLit=0,summitOn=false;
 function climb(on){summitOn=!!on&&on!==-1;route.light(summitOn);}
 // The trophy always shines gold; choosing it (or the bridge) lights the bridge step by step from the bottom up.
 function updateStairs(now,delta){route.update(paused?0:delta,elapsed,walkers.feet());trophyLit=1;architecture.shine(1);}
 const routePoints=[...route.points().filter((_,i)=>i%6===0),...Object.values(STOPS).flatMap(s=>[[-1,-1],[1,-1],[-1,1],[1,1]].map(([x,z])=>({x:s.x+x*1.3,y:s.y+(s.ledge?.6:1.3),z:s.z+z*1.2}))),...[[-1,-1],[1,-1],[-1,1],[1,1]].map(([x,z])=>({x:UNIVERSITY_AT.x+x*1.3,y:UNIVERSITY_AT.y+1.7,z:UNIVERSITY_AT.z+z*1.2}))];
 function stairBox(){const box=new THREE.Box3();for(const id of [SUMMIT]){const p=positions.get(id);box.expandByPoint(p.clone().add(new THREE.Vector3(-1.3,0,-1.2)));box.expandByPoint(p.clone().add(new THREE.Vector3(1.3,id===SUMMIT?1.9:1.1,1.2)));}for(const p of routePoints)box.expandByPoint(new THREE.Vector3(p.x,p.y,p.z));return box;}
 // Choosing the trophy: the camera rides along the bridge with the light as it climbs, then closes in on the trophy.
 const RIDE_MS=2400,RIDE_DIR=new THREE.Vector3(1.2,3.4,8.3).normalize();
 function trophyView(inset){const p=positions.get(SUMMIT),target=p.clone().add(new THREE.Vector3(0,1.35,-.05));const [wf,hf]=fractions(inset);const distance=Math.max(4.6,fitDistance(1.7,camera.fov,camera.aspect,wf,hf));return {target,distance};}
 function bridgeAt(g){const f=Math.max(0,Math.min(1,g))*(bridge.length-1),i=Math.floor(f),a=bridge[i],b=bridge[Math.min(i+1,bridge.length-1)],u=f-i;return new THREE.Vector3(a.x+(b.x-a.x)*u,a.y+(b.y-a.y)*u+.3,a.z+(b.z-a.z)*u);}
 // Choosing the trophy: first the bridge and the trophy together, while the light climbs the bridge step by step from the bottom;
 // only when it reaches the top does the camera close in on the trophy.
 let zoomAt=null;
 function bridgeView(inset){const pts=[...bridge.map(p=>new THREE.Vector3(p.x,p.y,p.z)),positions.get(SUMMIT).clone().add(new THREE.Vector3(0,2.2,0))];const sp=new THREE.Box3().setFromPoints(pts).getBoundingSphere(new THREE.Sphere());const [wf,hf]=fractions(inset);const distance=fitDistance(sp.radius*.82,camera.fov,camera.aspect,wf,hf);return {target:sp.center,distance};}
 function focusClimb(inset,instant=false){lastInset=inset;framing={kind:'climb'};
  // A panel opening mid-sequence only changes where the camera ends up.
  if(instant&&(zoomAt||fly)){return;}
  const end=trophyView(inset);
  if(instant||reduced.matches){zoomAt=null;const position=end.target.clone().addScaledVector(RIDE_DIR,end.distance);flyTo(...shifted(position,end.target.clone(),end.distance,inset),true);return;}
  const view=bridgeView(inset),position=view.target.clone().addScaledVector(RIDE_DIR,view.distance);flyTo(...shifted(position,view.target.clone(),view.distance,inset));
  route.light(false);route.light(true,FLY_MS);summitOn=true;zoomAt=performance.now()+FLY_MS+SWEEP_MS+300;}
 function trophyZoom(){zoomAt=null;const end=trophyView(lastInset),position=end.target.clone().addScaledVector(RIDE_DIR,end.distance);flyTo(...shifted(position,end.target.clone(),end.distance,lastInset));framing={kind:'climb-done'};}
 // Key-point pins: numbered tags on stems standing over the selected island.
 const pinGroup=new THREE.Group();scene.add(pinGroup);const pinMaterial=new THREE.LineBasicMaterial({color:'#5b6f60',transparent:true,opacity:.75});let pinViews=[],pinIsland=null;
 function showPins(id,items=[],{onPick=()=>{},onHover=()=>{}}={}){for(const v of pinViews){pinGroup.remove(v.line,v.label);v.line.geometry.dispose();v.el.remove();}pinViews=[];pinIsland=id;if(!id||!positions.has(id))return;
  const p=positions.get(id),spots=pinSpots(items.length);
  items.forEach((item,k)=>{const base=p.clone().add(new THREE.Vector3(spots[k].x,.3,spots[k].z)),tip=base.clone().add(new THREE.Vector3(0,spots[k].lift+(p.y>0?1:0),0));
   const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints([base,tip]),pinMaterial);const el=document.createElement('button');el.className='step-pin'+(items.length>3?' compact':'');el.title=item.label;el.type='button';el.innerHTML=`<b>${item.mark}</b><span>${item.label}</span>`;el.setAttribute('aria-label',`了解重點 ${k+1}：${item.label}`);
   el.onclick=e=>{e.stopPropagation();onPick(k);};el.onpointerenter=e=>{if(e.pointerType==='mouse')onHover(k,true);};el.onpointerleave=e=>{if(e.pointerType==='mouse')onHover(k,false);};el.onfocus=()=>onHover(k,true);el.onblur=()=>onHover(k,false);
   const label=new CSS2DObject(el);label.position.copy(tip);pinGroup.add(line,label);pinViews.push({line,label,el});});
  lastLayout=-Infinity;}
 // Key-point pins stand at fixed spots on the island, but on a narrow screen or from some angles two can land on top of each
 // other. After each frame, overlapping pins are eased apart on screen (CSS `translate`, separate from the renderer's transform).
 const PIN_GAP=4;
 function declutterPins(){const live=pinViews.filter(v=>v.el.isConnected&&v.el.offsetWidth);if(live.length<2)return;
  const box=live.map(v=>{const r=v.el.getBoundingClientRect(),ox=v.ax||0,oy=v.ay||0;return {v,x:r.left-ox,y:r.top-oy,w:r.width,h:r.height,tx:0,ty:0};});
  for(let it=0;it<8;it++){let moved=false;for(let i=0;i<box.length;i++)for(let j=i+1;j<box.length;j++){const a=box[i],b=box[j];
   const ax=a.x+a.tx,ay=a.y+a.ty,bx=b.x+b.tx,by=b.y+b.ty,dx=Math.min(ax+a.w,bx+b.w)-Math.max(ax,bx)+PIN_GAP,dy=Math.min(ay+a.h,by+b.h)-Math.max(ay,by)+PIN_GAP;
   if(dx<=0||dy<=0)continue;moved=true;
   // Push along the axis that needs the smaller move, half each way.
   if(dx<dy){const s=(ax+a.w/2<=bx+b.w/2)?1:-1;a.tx-=s*dx/2;b.tx+=s*dx/2;}else{const s=(ay+a.h/2<=by+b.h/2)?1:-1;a.ty-=s*dy/2;b.ty+=s*dy/2;}}if(!moved)break;}
  const k=reduced.matches?1:.35;for(const b of box){const v=b.v;v.ox=(v.ox||0)+(b.tx-(v.ox||0))*k;v.oy=(v.oy||0)+(b.ty-(v.oy||0))*k;if(Math.abs(v.ox)<.3&&Math.abs(v.oy)<.3){v.ox=v.oy=v.ax=v.ay=0;v.el.style.translate='';}
   // Only move a pin when its offset has really changed (more than ¾ px), so it never flickers between two pixels.
   else if(Math.abs(v.ox-(v.ax||0))>.75||Math.abs(v.oy-(v.ay||0))>.75){v.ax=Math.round(v.ox);v.ay=Math.round(v.oy);v.el.style.translate=`${v.ax}px ${v.ay}px`;}}}
 function pinState({hot=-1,sel=-1}={}){pinViews.forEach((v,k)=>{v.el.classList.toggle('hot',k===hot);v.el.classList.toggle('sel',k===sel);v.el.setAttribute('aria-pressed',k===sel);});}
 // Times of day: sky, haze and light change together.
 const LIGHT={dawn:{sun:'#ffd5b8',power:2.4,at:[12,6,7],sky:'#f4e7f0',ground:'#c8b6a6',ambient:2.4,clear:'#f7d6c8'},day:{sun:'#fff3d5',power:3.2,at:[-7,14,8],sky:'#f6f9ff',ground:'#cbbd9c',ambient:2.8,clear:'#dcebf4'},dusk:{sun:'#ffbe8c',power:2.8,at:[-11,8,6],sky:'#f6dcd2',ground:'#c2a598',ambient:2.7,clear:'#f3a87c'},night:{sun:'#c4d4ff',power:1.45,at:[-6,12,-8],sky:'#9fb2d8',ground:'#4a5068',ambient:1.2,clear:'#24365a'}};
 // The clock: light, sky, stars and lit windows follow the hour, blending smoothly between dawn, day, dusk and night; rain greys it all.
 const weather=createWeather(scene,{reduced});
 let hour=8,lightAt=-Infinity,lastPaint=null,phase=dayPhase(8);
 const C1=new THREE.Color(),C2=new THREE.Color(),V1=new THREE.Vector3();
 function applyLight(){const p=dayPhase(hour),A=LIGHT[p.a],B=LIGHT[p.b],t=p.t,wet=weather.rain();phase=p;
  sun.color.set(A.sun).lerp(C1.set(B.sun),t);sun.intensity=(A.power+(B.power-A.power)*t)*(1-.45*wet);sun.position.copy(V1.set(...A.at).lerp(new THREE.Vector3(...B.at),t));
  ambient.color.set(A.sky).lerp(C1.set(B.sky),t);ambient.groundColor.set(A.ground).lerp(C1.set(B.ground),t);ambient.intensity=(A.ambient+(B.ambient-A.ambient)*t)*(1-.2*wet);
  renderer.setClearColor(C2.set(A.clear).lerp(C1.set(B.clear),t));
  const key=`${Math.round(hour*30)}:${Math.round(wet*30)}`;if(key!==lastPaint){lastPaint=key;sky.blend(p.a,p.b,t,wet,p.stars);}
  architecture.time(p.stars>.5?'night':p.name==='dusk'||p.name==='dawn'?'dusk':'day');
  // City lights after dark: every building, path and island surface gets a warm self-light so the town stays readable at night.
  const glow=Math.max(0,p.stars-.15)*.32*(1-.3*wet);if(Math.abs(glow-townGlow)>.005){townGlow=glow;for(const m of materialCache.values()){m.emissive.copy(m.color).lerp(WARM,.35);m.emissiveIntensity=glow;}}}
 let townGlow=-1;const WARM=new THREE.Color('#ffcf8a');
 function time(name){hour={dawn:6.4,day:12,dusk:18,night:22}[name]??12;applyLight();}
 const flows=[],seen=new Set();
 for(const t of topics)for(const id of t.links){const key=relationKey(t.id,id);if(seen.has(key))continue;seen.add(key);const a=positions.get(t.id).clone(),b=positions.get(id).clone();a.y+=.3;b.y+=.3;const mid=a.clone().lerp(b,.5);mid.y=Math.max(a.y,b.y)+.17;const curve=new THREE.QuadraticBezierCurve3(a,mid,b);const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(32)),new THREE.LineDashedMaterial({color:'#fff0ba',dashSize:.12,gapSize:.12,transparent:true,opacity:.9}));line.computeLineDistances();scene.add(line);const dot=mesh(scene,new THREE.SphereGeometry(.035,6,4),'#fff4c5',0,.3,0);dot.castShadow=false;line.userData.relation=key;flows.push({key,line,dot,curve,a:t.id,b:id});}
 // People walking on the map (see walkers.js); the visitor's own character is one of them.
 const walkers=createWalkers({hazards,rain:()=>weather.rain(),scene,topics,positions:centers,graph,links:flows.map(f=>({key:f.key,a:f.a,b:f.b})),CSS2DObject,reduced,avatar,onArrive,onLog,onGuide});walkers.onClick(w=>onWalker(w));
 let follow=null,followLast=null,followFalling=false,placing=false,peopleOn=true;
 let selected=null,selectedRelation=null,hoveredRelation=null,connections=true,paused=false,frame=0,elapsed=0,lastTime=0,fly=null,framing=null,lastLayout=-Infinity;
 function redrawSelection(){const pair=(hoveredRelation||selectedRelation)?.split(':')||[];
  for(const [id]of tops){const active=pair.length?pair.includes(id):id===selected;rings.get(id).visible=active;labelButtons.get(id).classList.toggle('selected',active);labelButtons.get(id).classList.toggle('dim',!!(selected||selectedRelation)&&!active);labelButtons.get(id).setAttribute('aria-pressed',active);}
  for(const f of flows){const active=f.key===selectedRelation||f.key===hoveredRelation;f.line.visible=f.dot.visible=connections&&groups.get(f.a).visible&&groups.get(f.b).visible&&(!selected||selected===f.a||selected===f.b||active);f.line.material.color.set(active?'#b9793f':'#fff0ba');f.line.material.opacity=selectedRelation && !active ? .25 : active ? 1 : .8;f.dot.scale.setScalar(active?1.65:1);}
 walkers.sync({shown:peopleOn,filterIds:[...groups].filter(([,g])=>g.visible).map(([id])=>id),connections,selectedIsland:selected,activeRelation:selectedRelation||hoveredRelation});
 }
 function relationAt(e){if(!connections)return null;const rect=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);ray.setFromCamera(pointer,camera);ray.params.Line.threshold=camera.position.distanceTo(controls.target)*.012;const hits=ray.intersectObjects(flows.filter(f=>f.line.visible).map(f=>f.line),false);const land=ray.intersectObjects([...groups.values()].filter(g=>g.visible),true)[0];return hits.find(h=>!land||h.distance<land.distance)?.object.userData.relation||null;}
 const ray=new THREE.Raycaster(),pointer=new THREE.Vector2();let start=null,moved=false;
 renderer.domElement.addEventListener('pointerdown',()=>{fly=null;framing=null;follow=null;zoomAt=null;});renderer.domElement.addEventListener('wheel',()=>{fly=null;framing=null;follow=null;zoomAt=null;},{passive:true});
 renderer.domElement.addEventListener('pointerdown',e=>{if(e.button!==0)return;start={x:e.clientX,y:e.clientY};moved=false;});
 renderer.domElement.addEventListener('pointermove',e=>{if(start&&Math.hypot(e.clientX-start.x,e.clientY-start.y)>5)moved=true;});
 renderer.domElement.addEventListener('pointerup',e=>{if(e.button!==0||!start||moved){start=null;return;}start=null;const rect=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);ray.setFromCamera(pointer,camera);const hit=ray.intersectObjects([...groups.values()].filter(g=>g.visible),true)[0];if(placing){const any=ray.intersectObjects([...groups.values(),...stopGroups.values()].filter(g=>g.visible),true)[0];let node=any?.object;while(node&&!node.userData.id&&!node.userData.stop)node=node.parent;if(!node||node.userData.stop&&STOPS[node.userData.stop].ledge){onPlace(null);return;}const pid=node.userData.id||node.userData.stop,hit2=any;const c=centers.get(pid),dx=hit2.point.x-c.x,dz=hit2.point.z-c.z,r=Math.hypot(dx,dz)||1,k=Math.min(1.12,Math.max(.76,r))/r;placing=false;onPlace(pid,{x:dx*k,z:dz*k});return;}const who=walkers.pick(ray);if(who&&(!hit||who.distance<=hit.distance+.4)){onWalker(who.walker);return;}const part=ray.intersectObjects([...route.pickables,uniGroup,...stopGroups.values()],true)[0];if(part&&(!hit||part.distance<hit.distance)){let n=part.object;while(n&&!n.userData.stop&&!n.userData.path&&n!==uniGroup&&n.name!=='golden-bridge')n=n.parent;if(n?.userData.path){onStation('fork',{path:n.userData.path});return;}onStation(n?.name==='golden-bridge'?'bridge':n===uniGroup?'university':stationOf[n?.userData.stop]||'start',n?.userData.stop&&['pass1','pass2','wallfoot'].includes(n.userData.stop)?{path:n.userData.stop==='wallfoot'?'wall':'cliff'}:undefined);return;}const link=relationAt(e);if(link){onRelation(link);return;}if(hit){let node=hit.object;while(node&&!node.userData.id)node=node.parent;if(node)onSelect(node.userData.id);}});
 renderer.domElement.addEventListener('pointermove',e=>{if(start||e.pointerType!=='mouse')return;const key=relationAt(e),who=walkers.pick(ray)?.walker||null;walkers.hover(who?.kind==='messenger'?who:null);if(key!==hoveredRelation){hoveredRelation=key;redrawSelection();}renderer.domElement.style.cursor=placing?'crosshair':key||who?'pointer':'';});
 renderer.domElement.addEventListener('pointerleave',()=>{hoveredRelation=null;walkers.hover(null);redrawSelection();renderer.domElement.style.cursor='';});
 renderer.domElement.addEventListener('pointercancel',()=>{start=null;});renderer.domElement.addEventListener('contextmenu',e=>e.preventDefault());
 // Keep multitouch camera gestures from being mistaken for a single tap.
 renderer.domElement.addEventListener('pointerdown',e=>{if(!e.isPrimary)moved=true;});
 const gestures=mapGestures({host,canvas:renderer.domElement,camera,controls,onStart:()=>{fly=null;framing=null;follow=null;zoomAt=null;}});
 function flyTo(position,target,instant){gestures.stop();follow=null;zoomAt=null;if(instant||reduced.matches){fly=null;camera.position.copy(position);controls.target.copy(target);controls.update();return;}fly={time:performance.now(),from:camera.position.clone(),to:position,old:controls.target.clone(),target};}
 // Shift the camera so the subject sits in the middle of the uncovered part of the map.
 function shifted(position,target,distance,{left=0,right=0,top=0,bottom=0}){const height=host.clientHeight||1;const unitsPerPx=2*distance*Math.tan(THREE.MathUtils.degToRad(camera.fov/2))/height;const look=new THREE.Matrix4().lookAt(position,target,camera.up);const xAxis=new THREE.Vector3().setFromMatrixColumn(look,0),yAxis=new THREE.Vector3().setFromMatrixColumn(look,1);const shift=xAxis.multiplyScalar((right-left)/2*unitsPerPx).add(yAxis.multiplyScalar(-(bottom-top)/2*unitsPerPx));return [position.add(shift),target.add(shift)];}
 function fractions({left=0,right=0,top=0,bottom=0}){const width=host.clientWidth||1,height=host.clientHeight||1;return [(width-left-right)/width,(height-top-bottom)/height];}
 let lastInset={};
 // Overview: find the nearest distance at which every island (with its buildings) projects inside the uncovered area.
 const probe=new THREE.PerspectiveCamera();
 function fitsAt(distance,direction,target,inset){const width=host.clientWidth||1,height=host.clientHeight||1,{left=0,right=0,top=0,bottom=0}=inset;const [position,look]=shifted(target.clone().add(direction.clone().multiplyScalar(distance)),target.clone(),distance,inset);probe.copy(camera);probe.position.copy(position);probe.lookAt(look);probe.updateMatrixWorld();probe.updateProjectionMatrix();
  const minX=-1+2*left/width+.04,maxX=1-2*right/width-.04,minY=-1+2*bottom/height+.04,maxY=1-2*top/height-.04,v=new THREE.Vector3();
  for(const p of positions.values())for(const dx of [-1.3,1.3])for(const dz of [-1.2,1.2])for(const y of [p.y,p.y+(p.y>0?1.9:1.1)]){v.set(p.x+dx,y,p.z+dz).project(probe);if(v.x<minX||v.x>maxX||v.y<minY||v.y>maxY)return false;}
  for(const p of (host.clientWidth<650?phoneCore:routePoints)){v.set(p.x,p.y+.3,p.z).project(probe);if(v.x<minX||v.x>maxX||v.y<minY||v.y>maxY)return false;}
  return true;}
 // Aim at the middle of everything on the map (islands, stairs, university), so the overview wastes no space now that the summit sits high at the back.
 // On a phone in portrait the whole ring cannot fit at a readable size, so the overview frames the middle islands, the start,
 // the trailhead and the trophy; the outer stops are a swipe away.
 const phoneCore=['start','fork'].flatMap(id=>{const s=STOPS[id];return [[-1,-1],[1,-1],[-1,1],[1,1]].map(([x,z])=>({x:s.x+x*1.2,y:s.y+1,z:s.z+z*1.1}));});
 function sceneCenter(){const box=new THREE.Box3();if(host.clientWidth<650){for(const p of positions.values()){box.expandByPoint(new THREE.Vector3(p.x-1.3,p.y,p.z-1.2));box.expandByPoint(new THREE.Vector3(p.x+1.3,p.y+1.1,p.z+1.2));}for(const p of phoneCore)box.expandByPoint(new THREE.Vector3(p.x,p.y,p.z));const c=box.getCenter(new THREE.Vector3());c.y=Math.min(c.y,1.2);return c;}for(const p of positions.values()){box.expandByPoint(new THREE.Vector3(p.x-1.3,p.y,p.z-1.2));box.expandByPoint(new THREE.Vector3(p.x+1.3,p.y+(p.y>0?1.9:1.1),p.z+1.2));}for(const p of routePoints)box.expandByPoint(new THREE.Vector3(p.x,p.y,p.z));const c=box.getCenter(new THREE.Vector3());c.y=Math.min(c.y,1.2);return c;}
 function home({instant=false,bird=false,...inset}={}){lastInset=inset;framing={kind:'home',bird};const mobile=host.clientWidth<650;const target=sceneCenter();const direction=(bird?new THREE.Vector3(.3,14,1.9):mobile?new THREE.Vector3(.3,12,9.5):new THREE.Vector3(1.3,11.2,12.2)).normalize();
  let lo=6,hi=controls.maxDistance;if(!fitsAt(hi,direction,target,inset))lo=hi;else for(let i=0;i<14;i++){const mid=(lo+hi)/2;if(fitsAt(mid,direction,target,inset))hi=mid;else lo=mid;}
  const distance=Math.max(lo,Math.min(hi,controls.maxDistance));flyTo(...shifted(target.clone().add(direction.multiplyScalar(distance)),target,distance,inset),instant);}
 // Move toward an island and keep it in the part of the map that panels do not cover.
 function focus(id,{instant=false,...inset}={}){const p=positions.get(id);if(!p)return;lastInset=inset;framing={kind:'focus',id};if(id===SUMMIT){focusClimb(inset,instant);return;}const target=p.clone().setY(p.y+.65);const [wf,hf]=fractions(inset);const distance=fitDistance(radii.get(id),camera.fov,camera.aspect,wf,hf);const position=target.clone().add(new THREE.Vector3(2.4,7,8.3).normalize().multiplyScalar(distance));flyTo(...shifted(position,target,distance,inset),instant);}
 // Move in close to one key point of an island.
 function focusStep(id,k,count,{instant=false,...inset}={}){const p=positions.get(id);if(!p)return;const spot=pinSpots(count)[k];if(!spot)return;lastInset=inset;framing={kind:'step',id,k,count};const target=p.clone().add(new THREE.Vector3(spot.x*.7,.75,spot.z*.7));const [wf,hf]=fractions(inset);const distance=Math.max(5.5,fitDistance(1.15,camera.fov,camera.aspect,wf,hf));const position=target.clone().add(new THREE.Vector3(2.4,6,8.3).normalize().multiplyScalar(distance));flyTo(...shifted(position,target,distance,inset),instant);}
 function focusRelation(key,{instant=false,...inset}={}){const [a,b]=key.split(':').map(id=>positions.get(id));if(!a||!b)return;lastInset=inset;framing={kind:'relation',key};const target=a.clone().lerp(b,.5);target.y+=.65;const [wf,hf]=fractions(inset),distance=fitDistance(a.distanceTo(b)/2+1.8,camera.fov,camera.aspect,wf,hf);const position=target.clone().add(new THREE.Vector3(2.4,7,8.3).normalize().multiplyScalar(distance));flyTo(...shifted(position,target,distance,inset),instant);}
 function focusWalker(w,{instant=false,...inset}={}){if(!w||w.fall!==undefined)return;followFalling=false;lastInset=inset;framing={kind:'walker',w};const target=walkers.where(w).add(new THREE.Vector3(0,.32,0));const [wf,hf]=fractions(inset);const distance=Math.min(7,Math.max(3.6,fitDistance(.95,camera.fov,camera.aspect,wf,hf)));const position=target.clone().add(new THREE.Vector3(1.2,3.4,5.6).normalize().multiplyScalar(distance));flyTo(...shifted(position,target,distance,inset),instant);follow=w;followLast=walkers.where(w);}
 function followStep(){if(!follow)return;
  // Stay above the scene during a fall; refit after respawn instead of accumulating the teleport against target limits.
  if(follow.fall!==undefined){followFalling=true;followLast=walkers.where(follow);return;}
  if(followFalling){focusWalker(follow,lastInset);return;}
  const now=walkers.where(follow),d=now.clone().sub(followLast);followLast=now;if(d.lengthSq()===0)return;if(fly){fly.to.add(d);fly.target.add(d);}else{camera.position.add(d);controls.target.add(d);}}
 // Fly to one station of the journey; the trailhead shows all three paths at once, the bridge its whole length.
 // ② The trailhead: viewed from in front of the split, with the reference view’s left/right arrangement — the bridge on the left, the rough road on the
 // right. Frame the nearby sign for reading; distant cliffs are available through the tour detours.
 // Low enough that the sign's words face the camera and can be read; the two ways still part to left and right behind it.
 const FORK_DIR=new THREE.Vector3(-.18,.48,1).normalize();
 function focusStation(id,{instant=false,...inset}={}){lastInset=inset;framing={kind:'station',id};let target,radius=1.7;
  const pts=id==='bridge'?bridge.map(p=>new THREE.Vector3(p.x,p.y,p.z)):null;
  if(id==='fork')target=centers.get('fork').clone().add(new THREE.Vector3(camera.aspect<.8?-.58:.15,.85,-.45));
  else if(pts){const sp=new THREE.Box3().setFromPoints(pts).getBoundingSphere(new THREE.Sphere());target=sp.center.setY(sp.center.y+.4);radius=sp.radius*.8+.6;}
  else{const c=centers.get(id==='university'?UNIVERSITY:id);target=new THREE.Vector3(c.x,c.y+.7,c.z);}
  const [wf,hf]=fractions(inset);const distance=id==='fork'?(camera.aspect<.8?3.05:4.2):Math.max(4.6,fitDistance(radius,camera.fov,camera.aspect,wf,hf));const position=target.clone().add((id==='fork'?FORK_DIR:new THREE.Vector3(1.2,4.4,8.3).normalize()).clone().multiplyScalar(distance));flyTo(...shifted(position,target,distance,inset),instant);}
 function refit(inset=lastInset){if(framing?.kind==='relation')focusRelation(framing.key,{...inset,instant:true});else if(framing?.kind==='focus')focus(framing.id,{...inset,instant:true});else if(framing?.kind==='step')focusStep(framing.id,framing.k,framing.count,{...inset,instant:true});else if(framing?.kind==='climb')focusClimb(inset,true);else if(framing?.kind==='climb-done'){const e=trophyView(inset),q=e.target.clone().addScaledVector(RIDE_DIR,e.distance);flyTo(...shifted(q,e.target.clone(),e.distance,inset),true);framing={kind:'climb-done'};}else if(framing?.kind==='station')focusStation(framing.id,{...inset,instant:true});else if(framing?.kind==='walker')focusWalker(framing.w,{...inset,instant:true});else if(framing?.kind==='home')home({...inset,bird:framing.bird,instant:true});}
 function layoutLabels(){
  const bounds=host.getBoundingClientRect(),items=[],obstacles=[];
  for(const el of document.querySelectorAll('.brand-card,.map-tools,.top-actions,.map-caption,.legend,#detail,#index-panel,.step-pin,.station-label')){if(el.hidden||getComputedStyle(el).visibility==='hidden')continue;const r=el.getBoundingClientRect();if(r.width&&r.height)obstacles.push(r);}
  const visible=[...labelButtons].filter(([id])=>groups.get(id).visible);
  for(const [,el]of visible)el.classList.remove('compact');
  const sizes=new Map(visible.map(([id,el])=>[id,{width:el.offsetWidth,height:el.offsetHeight}]));
  for(const [,el]of visible)el.classList.add('compact');
  for(const [id,el]of visible){const point=labelObjects.get(id).getWorldPosition(new THREE.Vector3()).project(camera);if(point.z< -1||point.z>1){el.style.visibility='hidden';continue;}items.push({id,...sizes.get(id),badgeWidth:el.offsetWidth,badgeHeight:el.offsetHeight,x:bounds.left+(point.x+1)/2*bounds.width,y:bounds.top+(1-point.y)/2*bounds.height,priority:id===selected||document.activeElement===el?0:el.classList.contains('recommended')?1:2,order:topics.findIndex(t=>t.id===id)});}
  for(const placement of placeLabels(items,bounds,obstacles)){const el=labelButtons.get(placement.id);el.classList.toggle('compact',placement.compact);el.style.marginLeft=placement.dx+'px';el.style.marginTop=placement.dy+'px';el.style.visibility=placement.visible?'':'hidden';}
 }

 function resize(){const w=host.clientWidth,h=host.clientHeight;camera.aspect=w/h;camera.fov=camera.aspect<.8?50:38;camera.updateProjectionMatrix();renderer.setSize(w,h);labels.setSize(w,h);lastLayout=-Infinity;}
 const observer=new ResizeObserver(resize);observer.observe(host);resize();home({instant:true});
 function animate(now){frame=requestAnimationFrame(animate);const frameMs=lastTime?now-lastTime:0,delta=lastTime?Math.min(frameMs/1000,.05):0;lastTime=now;
  if(held)return;
  // Boards with words on them are never drawn soft: while one is close enough to read and on screen, the image stays at full
  // sharpness whatever the frame rate (see resolution.js lock).
  {textSigns??=collectTextSigns();const lock=resolution.lock(textSigns.some(readable));const next=lock??resolution.sample(now,frameMs,document.hidden);if(next!==null){renderer.setPixelRatio(next);resize();}}if(!paused)elapsed+=delta;hazards.update(paused?0:delta);walkers.update(delta,paused);followStep();if(fly?.ride){const t=Math.min(1,(now-fly.time)/RIDE_MS),[p,tg]=fly.path(t);camera.position.copy(p);controls.target.copy(tg);if(t===1)fly=null;}else if(fly){const t=Math.min(1,(now-fly.time)/FLY_MS),v=easeInOutCubic(t);camera.position.lerpVectors(fly.from,fly.to,v);controls.target.lerpVectors(fly.old,fly.target,v);if(t===1)fly=null;}gestures.update(delta*1000);controls.update();sky.update(elapsed,camera);weather.update(paused?0:delta,phase.daylight);if(now-lightAt>100){lightAt=now;applyLight();}updateStairs(now,delta);if(zoomAt&&now>=zoomAt&&!fly)trophyZoom();if(!reduced.matches)for(const f of floaters)f.mesh.position.y=f.y+Math.sin(elapsed*.8+f.phase)*.07;for(let i=0;i<flows.length;i++)if(flows[i].dot.visible)flows[i].dot.position.copy(flows[i].curve.getPoint((elapsed*.12+i*.13)%1));renderer.render(scene,camera);// While the bridge lights up with the camera pulled back, the trophy is small on screen and its pins would pile up: they wait
  // until the camera has finished closing in on the trophy.
  pinGroup.visible=!(zoomAt&&framing?.kind==='climb'||framing?.kind==='climb-done'&&fly);labels.render(scene,camera);declutterPins();if(now-lastLayout>120){layoutLabels();lastLayout=now;}}
 frame=requestAnimationFrame(animate);
 renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();host.querySelector('.webgl-message')?.remove();const message=document.createElement('p');message.className='webgl-message';message.textContent='3D 畫面暫時中斷。你仍可用主題清單探索；請重新整理恢復地圖。';host.append(message);});
 return {
  people(on){peopleOn=on;redrawSelection();},
  setHour(h){hour=h;},hour:()=>hour,phase:()=>phase,weather:()=>weather.state(),hazards:()=>hazards.state(),rain(on){weather.setRain(on);},guideTo(id){return walkers.guideTo(id);},guideAppear(id,options){return walkers.guideAppear(id,options);},
  // The auto-play tour drives the camera itself: while it plays, dragging, pinching and the wheel are switched off.
  // While a video plays the scene stops drawing (and moving) until it is closed.
  hold(on){held=!!on;},held:()=>held,
  // QA: where a point on the rough way (segment, 0…1 along it) is on screen.
  trailPoint(seg,u){const pts=trails[seg];if(!pts)return null;const p=pts[Math.round(Math.max(0,Math.min(1,u))*(pts.length-1))],v=new THREE.Vector3(p.x,p.y,p.z).project(camera),r=renderer.domElement.getBoundingClientRect();return {x:r.left+(v.x+1)/2*r.width,y:r.top+(1-v.y)/2*r.height};},
  lockControls(on){controls.enabled=!on;if(on){gestures.stop();follow=null;}},
  focusStation(id,inset){focusStation(id,inset);},stationSelect(id){for(const [k,v]of stationLabels)v.el.classList.toggle('selected',k===id||(id==='fork'&&k.startsWith('path-')));},
  stationPoint(id){const l=stationLabels.get(id);if(!l)return null;const v=l.o.position.clone().project(camera),r=renderer.domElement.getBoundingClientRect();return {x:r.left+(v.x+1)/2*r.width,y:r.top+(1-v.y)/2*r.height};},stopFollow(){follow=null;if(framing?.kind==='walker')framing=null;},
  walkerSelect(w){walkers.select(w);},walkerFocus(w,inset){focusWalker(w,inset);},following:()=>!!follow,guide:()=>walkers.guide(),me:()=>walkers.me(),
  avatarLook(look){const v=walkers.avatar.look(look);if(follow&&follow.kind==='avatar'){follow=walkers.me();followLast=walkers.where(follow);}if(framing?.kind==='walker'&&framing.w.kind==='avatar')framing.w=walkers.me();walkers.select(walkers.selected()?.kind==='avatar'?walkers.me():walkers.selected());return v;},avatarGo(id,spot){walkers.avatar.go(id,spot);},avatarMode(m){walkers.avatar.mode(m);},placing(on){placing=on;renderer.domElement.style.cursor=on?'crosshair':'';},
  walkerState:()=>({...walkers.state(),following:follow?.kind||null,placing}),
  islandPoint(id,dx=0,dz=0){const p=positions.get(id);if(!p)return null;const v=new THREE.Vector3(p.x+dx,p.y+.25,p.z+dz).project(camera),r=renderer.domElement.getBoundingClientRect();return {x:r.left+(v.x+1)/2*r.width,y:r.top+(1-v.y)/2*r.height};},
  walkerPoint(kind,i=0){const target=walkers.find(kind,i);if(!target||!target.fig.visible)return null;const v=walkers.where(target).add(new THREE.Vector3(0,.25,0)).project(camera),r=renderer.domElement.getBoundingClientRect();return {x:r.left+(v.x+1)/2*r.width,y:r.top+(1-v.y)/2*r.height};},
  names(value){host.classList.toggle('labels-off',!value);lastLayout=-Infinity;},emphasize(ids){for(const [id,label]of labelButtons)label.classList.toggle('recommended',ids.includes(id));},select(id){selected=id;selectedRelation=null;hoveredRelation=null;redrawSelection();},relation(key){selectedRelation=key;hoveredRelation=null;redrawSelection();},hoverRelation(key){hoveredRelation=key;redrawSelection();},filter(ids){for(const [id,g]of groups)g.visible=ids.includes(id);redrawSelection();},connections(value){connections=value;redrawSelection();},pause(value){paused=value;},night(value){time(value?'night':'day');},time,pins:showPins,pinState,climb,stairsLit:()=>route.lit(),trophy:()=>Math.round(trophyLit*100)/100,stairPoint(t){const v=route.stairPoint(t).project(camera),r=renderer.domElement.getBoundingClientRect();return [r.left+(v.x+1)/2*r.width,r.top+(1-v.y)/2*r.height];},focusStep,birdView:()=>framing?.kind==='home'&&framing.bird,mode(rotate){gestures.rotate(rotate);},zoom(factor){fly=null;framing=null;gestures.stop();camera.position.sub(controls.target).multiplyScalar(factor).add(controls.target);controls.update();},home,focus,focusRelation,refit,flying:()=>!!fly,view(){const r=v=>v.toArray().map(n=>Math.round(n*100)/100);return {target:r(controls.target),position:r(camera.position),distance:Math.round(camera.position.distanceTo(controls.target)*100)/100,drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,azimuth:Math.round(controls.getAzimuthalAngle()*100)/100,pixelRatio:renderer.getPixelRatio(),held,signLock:resolution.locked,polar:Math.round(controls.getPolarAngle()*100)/100};},dispose(){cancelAnimationFrame(frame);observer.disconnect();controls.dispose();renderer.dispose();labels.domElement.remove();renderer.domElement.remove();}};
}
