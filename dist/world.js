import * as THREE from 'three';
import {OrbitControls} from './vendor/OrbitControls.js';
import {CSS2DRenderer,CSS2DObject} from './vendor/CSS2DRenderer.js';
import {FLY_MS,easeInOutCubic} from './motion.js';
import {createArchitecture} from './architecture.js';
import {relationKey} from './relations.js';
import {mapGestures} from './gestures.js';
import {createSky,random} from './sky.js';
import {placeLabels,fitDistance,pinSpots} from './layout.js';

export function createWorld(host,topics,onSelect,{onRelation=()=>{}}={}){
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const scene=new THREE.Scene();scene.fog=new THREE.Fog('#cbe0ee',30,95);
 const camera=new THREE.PerspectiveCamera(38,1,.1,120);
 const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.setClearColor('#dcebf4');
 renderer.domElement.setAttribute('aria-label','3D 作文學習島。拖曳平移、右鍵旋轉、滾輪縮放，也可使用工具列與主題清單。');renderer.domElement.setAttribute('role','img');host.append(renderer.domElement);
 const labels=new CSS2DRenderer();labels.domElement.className='world-labels';host.append(labels.domElement);
 const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.09;controls.minDistance=5;controls.maxDistance=44;controls.minPolarAngle=.15;controls.maxPolarAngle=Math.PI/2.12;controls.screenSpacePanning=true;controls.enableZoom=false;controls.maxTargetRadius=16;controls.mouseButtons={LEFT:null,MIDDLE:THREE.MOUSE.DOLLY,RIGHT:THREE.MOUSE.ROTATE};controls.touches={ONE:null,TWO:null};
 const ambient=new THREE.HemisphereLight('#f6f9ff','#cbbd9c',2.8);scene.add(ambient);
 const sun=new THREE.DirectionalLight('#fff3d5',3.2);sun.position.set(-7,14,8);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-12;sun.shadow.camera.right=12;sun.shadow.camera.top=12;sun.shadow.camera.bottom=-12;sun.shadow.normalBias=.04;sun.shadow.bias=-.0001;scene.add(sun);
 const materialCache=new Map();function material(color){if(!materialCache.has(color))materialCache.set(color,new THREE.MeshStandardMaterial({color,roughness:1}));return materialCache.get(color);}
 const geometries={box:new THREE.BoxGeometry(1,1,1),trunk:new THREE.CylinderGeometry(.035,.05,1,5),leaf:new THREE.ConeGeometry(1,1,5),ball:new THREE.IcosahedronGeometry(1,0)};
 function mesh(parent,geometry,color,x,y,z,sx=1,sy=1,sz=1){const m=new THREE.Mesh(geometry,material(color));m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
 function box(g,x,y,z,w,h,d,color){return mesh(g,geometries.box,color,x,y+h/2,z,w,h,d);}
 function tree(g,x,z,scale=1){mesh(g,geometries.trunk,'#8e7954',x,.55*scale,z,1,scale,1);mesh(g,geometries.leaf,'#698760',x,1*scale,z,.3*scale,.68*scale,.3*scale);mesh(g,geometries.leaf,'#8c9f71',x,1.3*scale,z,.23*scale,.6*scale,.23*scale);}
 const people=[];
 function person(g,x,z,color){const p=new THREE.Group();p.position.set(x,.2,z);g.add(p);box(p,-.035,0,0,.045,.14,.06,'#526354');box(p,.035,0,0,.045,.14,.06,'#526354');box(p,0,.14,0,.13,.18,.09,color);mesh(p,geometries.ball,'#e4c49e',0,.39,0,.075,.08,.075);mesh(p,geometries.ball,'#536155',0,.44,-.01,.077,.04,.077);people.push(p);}
 const architecture=createArchitecture({box,mesh,tree});
 // Each island hangs in the air on a rough rock cone, with a few loose rocks drifting beneath it.
 const rockMaterial=new THREE.MeshStandardMaterial({color:'#9b8a6c',roughness:1,flatShading:true}),soilMaterial=new THREE.MeshStandardMaterial({color:'#7f7058',roughness:1,flatShading:true});
 const waterMaterial=new THREE.MeshBasicMaterial({color:'#e4f4fa',transparent:true,opacity:.62,depthWrite:false});
 const floaters=[];
 function rock(radius,height,seed,sides=6){const geometry=new THREE.ConeGeometry(radius,height,sides,3);geometry.rotateY(Math.PI/6);geometry.rotateX(Math.PI);const r=random(seed),p=geometry.attributes.position;for(let i=0;i<p.count;i++){const y=p.getY(i);if(y>height/2-.01)continue;const k=.8+r()*.35;p.setXYZ(i,p.getX(i)*k+(r()-.5)*.12,y+(r()-.5)*.12,p.getZ(i)*k+(r()-.5)*.12);}geometry.computeVertexNormals();return geometry;}
 function underside(g,t,i){const r=random(101+i*17);const main=new THREE.Mesh(rock(1.24,1.7+r()*.6,7+i),rockMaterial);main.position.y=-.11-.85;main.castShadow=true;g.add(main);
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
 for(const t of topics){const g=new THREE.Group();g.position.set((t.x-470)*.0127,0,(t.y-340)*.018);g.userData.id=t.id;scene.add(g);groups.set(t.id,g);positions.set(t.id,g.position.clone());mesh(g,baseGeometry,'#a3aa84',0,.025,0);const top=mesh(g,topGeometry,t.color,0,.2,0);tops.set(t.id,top);const ring=new THREE.Mesh(ringGeometry,ringMaterial);ring.position.y=.22;ring.visible=false;g.add(ring);rings.set(t.id,ring);box(g,0,.245,.59,1.52,.012,.15,'#e5dabb');architecture.build(g,t);if(t.kind!=='trees'){tree(g,-.86,-.14,.56);tree(g,.83,.04,.64);tree(g,.55,-.64,.45);}person(g,-.45,.64,'#d1986b');person(g,.45,.58,'#75959c');
 const label=document.createElement('button');label.className='island-3d-label';label.innerHTML=`<span>${t.n}</span><span class="island-title">${t.title}</span>`;label.title=t.title;label.setAttribute('aria-label',`${t.n} ${t.title}，${t.tag}`);label.onclick=()=>onSelect(t.id);const object=new CSS2DObject(label);object.position.set(0,.25,.98);g.add(object);labelButtons.set(t.id,label);labelObjects.set(t.id,object);radii.set(t.id,new THREE.Box3().setFromObject(g).getBoundingSphere(new THREE.Sphere()).radius);
 underside(g,t,topics.indexOf(t));
 }
 const sky=createSky(scene,{reduced});
 // Key-point pins: numbered tags on stems standing over the selected island.
 const pinGroup=new THREE.Group();scene.add(pinGroup);const pinMaterial=new THREE.LineBasicMaterial({color:'#5b6f60',transparent:true,opacity:.75});let pinViews=[],pinIsland=null;
 function showPins(id,items=[],{onPick=()=>{},onHover=()=>{}}={}){for(const v of pinViews){pinGroup.remove(v.line,v.label);v.line.geometry.dispose();v.el.remove();}pinViews=[];pinIsland=id;if(!id||!positions.has(id))return;
  const p=positions.get(id),spots=pinSpots(items.length);
  items.forEach((item,k)=>{const base=p.clone().add(new THREE.Vector3(spots[k].x,.3,spots[k].z)),tip=base.clone().add(new THREE.Vector3(0,spots[k].lift,0));
   const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints([base,tip]),pinMaterial);const el=document.createElement('button');el.className='step-pin';el.type='button';el.innerHTML=`<b>${item.mark}</b><span>${item.label}</span>`;el.setAttribute('aria-label',`了解重點 ${k+1}：${item.label}`);
   el.onclick=e=>{e.stopPropagation();onPick(k);};el.onpointerenter=e=>{if(e.pointerType==='mouse')onHover(k,true);};el.onpointerleave=e=>{if(e.pointerType==='mouse')onHover(k,false);};el.onfocus=()=>onHover(k,true);el.onblur=()=>onHover(k,false);
   const label=new CSS2DObject(el);label.position.copy(tip);pinGroup.add(line,label);pinViews.push({line,label,el});});
  lastLayout=-Infinity;}
 function pinState({hot=-1,sel=-1}={}){pinViews.forEach((v,k)=>{v.el.classList.toggle('hot',k===hot);v.el.classList.toggle('sel',k===sel);v.el.setAttribute('aria-pressed',k===sel);});}
 // Times of day: sky, haze and light change together.
 const LIGHT={dawn:{sun:'#ffd5b8',power:2.4,at:[12,6,7],sky:'#f4e7f0',ground:'#c8b6a6',ambient:2.4,clear:'#f7d6c8'},day:{sun:'#fff3d5',power:3.2,at:[-7,14,8],sky:'#f6f9ff',ground:'#cbbd9c',ambient:2.8,clear:'#dcebf4'},dusk:{sun:'#ffbe8c',power:2.8,at:[-11,8,6],sky:'#f6dcd2',ground:'#c2a598',ambient:2.7,clear:'#f3a87c'},night:{sun:'#c9d5ff',power:.7,at:[-7,14,8],sky:'#9fb2d8',ground:'#4a5068',ambient:1.2,clear:'#24365a'}};
 function time(name){const l=LIGHT[name]||LIGHT.day;sky.time(name);architecture.time(name);renderer.setClearColor(l.clear);sun.color.set(l.sun);sun.intensity=l.power;sun.position.set(...l.at);ambient.color.set(l.sky);ambient.groundColor.set(l.ground);ambient.intensity=l.ambient;}
 const flows=[],seen=new Set();
 for(const t of topics)for(const id of t.links){const key=relationKey(t.id,id);if(seen.has(key))continue;seen.add(key);const a=positions.get(t.id).clone(),b=positions.get(id).clone();a.y=b.y=.3;const mid=a.clone().lerp(b,.5);mid.y=.47;const curve=new THREE.QuadraticBezierCurve3(a,mid,b);const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(32)),new THREE.LineDashedMaterial({color:'#fff0ba',dashSize:.12,gapSize:.12,transparent:true,opacity:.9}));line.computeLineDistances();scene.add(line);const dot=mesh(scene,new THREE.SphereGeometry(.035,6,4),'#fff4c5',0,.3,0);dot.castShadow=false;line.userData.relation=key;flows.push({key,line,dot,curve,a:t.id,b:id});if(a.distanceTo(b)<3.7){const bridge=box(scene,(a.x+b.x)/2,.1,(a.z+b.z)/2,.21,.11,a.distanceTo(b),'#c6b28c');bridge.rotation.y=Math.atan2(b.x-a.x,b.z-a.z);for(const direction of [-1,1]){const rail=box(scene,(a.x+b.x)/2,.22,(a.z+b.z)/2,.025,.07,a.distanceTo(b),'#e3d7b6');rail.rotation.y=bridge.rotation.y;rail.translateX(direction*.14);}}}
 let selected=null,selectedRelation=null,hoveredRelation=null,connections=true,paused=false,frame=0,elapsed=0,lastTime=0,fly=null,framing=null,lastLayout=-Infinity;
 function redrawSelection(){const pair=(hoveredRelation||selectedRelation)?.split(':')||[];
  for(const [id]of tops){const active=pair.length?pair.includes(id):id===selected;rings.get(id).visible=active;labelButtons.get(id).classList.toggle('selected',active);labelButtons.get(id).classList.toggle('dim',!!(selected||selectedRelation)&&!active);labelButtons.get(id).setAttribute('aria-pressed',active);}
  for(const f of flows){const active=f.key===selectedRelation||f.key===hoveredRelation;f.line.visible=f.dot.visible=connections&&groups.get(f.a).visible&&groups.get(f.b).visible&&(!selected||selected===f.a||selected===f.b||active);f.line.material.color.set(active?'#b9793f':'#fff0ba');f.line.material.opacity=selectedRelation && !active ? .25 : active ? 1 : .8;f.dot.scale.setScalar(active?1.65:1);}
 }
 function relationAt(e){if(!connections)return null;const rect=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);ray.setFromCamera(pointer,camera);ray.params.Line.threshold=camera.position.distanceTo(controls.target)*.012;const hits=ray.intersectObjects(flows.filter(f=>f.line.visible).map(f=>f.line),false);const land=ray.intersectObjects([...groups.values()].filter(g=>g.visible),true)[0];return hits.find(h=>!land||h.distance<land.distance)?.object.userData.relation||null;}
 const ray=new THREE.Raycaster(),pointer=new THREE.Vector2();let start=null,moved=false;
 renderer.domElement.addEventListener('pointerdown',()=>{fly=null;framing=null;});renderer.domElement.addEventListener('wheel',()=>{fly=null;framing=null;},{passive:true});
 renderer.domElement.addEventListener('pointerdown',e=>{if(e.button!==0)return;start={x:e.clientX,y:e.clientY};moved=false;});
 renderer.domElement.addEventListener('pointermove',e=>{if(start&&Math.hypot(e.clientX-start.x,e.clientY-start.y)>5)moved=true;});
 renderer.domElement.addEventListener('pointerup',e=>{if(e.button!==0||!start||moved){start=null;return;}start=null;const rect=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);ray.setFromCamera(pointer,camera);const link=relationAt(e);if(link){onRelation(link);return;}const hit=ray.intersectObjects([...groups.values()].filter(g=>g.visible),true)[0];if(hit){let node=hit.object;while(node&&!node.userData.id)node=node.parent;if(node)onSelect(node.userData.id);}});
 renderer.domElement.addEventListener('pointermove',e=>{if(start||e.pointerType!=='mouse')return;const key=relationAt(e);if(key!==hoveredRelation){hoveredRelation=key;redrawSelection();}renderer.domElement.style.cursor=key?'pointer':'';});
 renderer.domElement.addEventListener('pointerleave',()=>{hoveredRelation=null;redrawSelection();renderer.domElement.style.cursor='';});
 renderer.domElement.addEventListener('pointercancel',()=>{start=null;});renderer.domElement.addEventListener('contextmenu',e=>e.preventDefault());
 // Keep multitouch camera gestures from being mistaken for a single tap.
 renderer.domElement.addEventListener('pointerdown',e=>{if(!e.isPrimary)moved=true;});
 const gestures=mapGestures({host,canvas:renderer.domElement,camera,controls,onStart:()=>{fly=null;framing=null;}});
 function flyTo(position,target,instant){gestures.stop();if(instant||reduced.matches){fly=null;camera.position.copy(position);controls.target.copy(target);controls.update();return;}fly={time:performance.now(),from:camera.position.clone(),to:position,old:controls.target.clone(),target};}
 // Shift the camera so the subject sits in the middle of the uncovered part of the map.
 function shifted(position,target,distance,{left=0,right=0,top=0,bottom=0}){const height=host.clientHeight||1;const unitsPerPx=2*distance*Math.tan(THREE.MathUtils.degToRad(camera.fov/2))/height;const look=new THREE.Matrix4().lookAt(position,target,camera.up);const xAxis=new THREE.Vector3().setFromMatrixColumn(look,0),yAxis=new THREE.Vector3().setFromMatrixColumn(look,1);const shift=xAxis.multiplyScalar((right-left)/2*unitsPerPx).add(yAxis.multiplyScalar(-(bottom-top)/2*unitsPerPx));return [position.add(shift),target.add(shift)];}
 function fractions({left=0,right=0,top=0,bottom=0}){const width=host.clientWidth||1,height=host.clientHeight||1;return [(width-left-right)/width,(height-top-bottom)/height];}
 let lastInset={};
 // Overview: find the nearest distance at which every island (with its buildings) projects inside the uncovered area.
 const probe=new THREE.PerspectiveCamera();
 function fitsAt(distance,direction,target,inset){const width=host.clientWidth||1,height=host.clientHeight||1,{left=0,right=0,top=0,bottom=0}=inset;const [position,look]=shifted(target.clone().add(direction.clone().multiplyScalar(distance)),target.clone(),distance,inset);probe.copy(camera);probe.position.copy(position);probe.lookAt(look);probe.updateMatrixWorld();probe.updateProjectionMatrix();
  const minX=-1+2*left/width+.04,maxX=1-2*right/width-.04,minY=-1+2*bottom/height+.04,maxY=1-2*top/height-.04,v=new THREE.Vector3();
  for(const p of positions.values())for(const dx of [-1.3,1.3])for(const dz of [-1.2,1.2])for(const y of [0,1.1]){v.set(p.x+dx,y,p.z+dz).project(probe);if(v.x<minX||v.x>maxX||v.y<minY||v.y>maxY)return false;}
  return true;}
 function home({instant=false,bird=false,...inset}={}){lastInset=inset;framing={kind:'home',bird};const mobile=host.clientWidth<650;const target=new THREE.Vector3(0,0,mobile?.2:0);const direction=(bird?new THREE.Vector3(.3,14,1.9):mobile?new THREE.Vector3(.6,10,9.5):new THREE.Vector3(2.8,9.4,13.6)).normalize();
  let lo=6,hi=controls.maxDistance;if(!fitsAt(hi,direction,target,inset))lo=hi;else for(let i=0;i<14;i++){const mid=(lo+hi)/2;if(fitsAt(mid,direction,target,inset))hi=mid;else lo=mid;}
  const distance=Math.max(lo,Math.min(hi,controls.maxDistance));flyTo(...shifted(target.clone().add(direction.multiplyScalar(distance)),target,distance,inset),instant);}
 // Move toward an island and keep it in the part of the map that panels do not cover.
 function focus(id,{instant=false,...inset}={}){const p=positions.get(id);if(!p)return;lastInset=inset;framing={kind:'focus',id};const target=p.clone().setY(.65);const [wf,hf]=fractions(inset);const distance=fitDistance(radii.get(id),camera.fov,camera.aspect,wf,hf);const position=target.clone().add(new THREE.Vector3(2.4,7,8.3).normalize().multiplyScalar(distance));flyTo(...shifted(position,target,distance,inset),instant);}
 // Move in close to one key point of an island.
 function focusStep(id,k,count,{instant=false,...inset}={}){const p=positions.get(id);if(!p)return;const spot=pinSpots(count)[k];if(!spot)return;lastInset=inset;framing={kind:'step',id,k,count};const target=p.clone().add(new THREE.Vector3(spot.x*.7,.75,spot.z*.7));const [wf,hf]=fractions(inset);const distance=Math.max(controls.minDistance+.5,fitDistance(1.15,camera.fov,camera.aspect,wf,hf));const position=target.clone().add(new THREE.Vector3(2.4,6,8.3).normalize().multiplyScalar(distance));flyTo(...shifted(position,target,distance,inset),instant);}
 function focusRelation(key,{instant=false,...inset}={}){const [a,b]=key.split(':').map(id=>positions.get(id));if(!a||!b)return;lastInset=inset;framing={kind:'relation',key};const target=a.clone().lerp(b,.5).setY(.65);const [wf,hf]=fractions(inset),distance=fitDistance(a.distanceTo(b)/2+1.8,camera.fov,camera.aspect,wf,hf);const position=target.clone().add(new THREE.Vector3(2.4,7,8.3).normalize().multiplyScalar(distance));flyTo(...shifted(position,target,distance,inset),instant);}
 function refit(inset=lastInset){if(framing?.kind==='relation')focusRelation(framing.key,{...inset,instant:true});else if(framing?.kind==='focus')focus(framing.id,{...inset,instant:true});else if(framing?.kind==='step')focusStep(framing.id,framing.k,framing.count,{...inset,instant:true});else if(framing?.kind==='home')home({...inset,bird:framing.bird,instant:true});}
 function layoutLabels(){
  const bounds=host.getBoundingClientRect(),items=[],obstacles=[];
  for(const el of document.querySelectorAll('.brand-card,.map-tools,.top-actions,#detail,#index-panel,.step-pin')){if(el.hidden||getComputedStyle(el).visibility==='hidden')continue;const r=el.getBoundingClientRect();if(r.width&&r.height)obstacles.push(r);}
  const visible=[...labelButtons].filter(([id])=>groups.get(id).visible);
  for(const [,el]of visible)el.classList.remove('compact');
  const sizes=new Map(visible.map(([id,el])=>[id,{width:el.offsetWidth,height:el.offsetHeight}]));
  for(const [,el]of visible)el.classList.add('compact');
  for(const [id,el]of visible){const point=labelObjects.get(id).getWorldPosition(new THREE.Vector3()).project(camera);if(point.z< -1||point.z>1){el.style.visibility='hidden';continue;}items.push({id,...sizes.get(id),badgeWidth:el.offsetWidth,badgeHeight:el.offsetHeight,x:bounds.left+(point.x+1)/2*bounds.width,y:bounds.top+(1-point.y)/2*bounds.height,priority:id===selected||document.activeElement===el?0:el.classList.contains('recommended')?1:2,order:topics.findIndex(t=>t.id===id)});}
  for(const placement of placeLabels(items,bounds,obstacles)){const el=labelButtons.get(placement.id);el.classList.toggle('compact',placement.compact);el.style.marginLeft=placement.dx+'px';el.style.marginTop=placement.dy+'px';el.style.visibility=placement.visible?'':'hidden';}
 }

 function resize(){const w=host.clientWidth,h=host.clientHeight;camera.aspect=w/h;camera.fov=camera.aspect<.8?50:38;camera.updateProjectionMatrix();renderer.setSize(w,h);labels.setSize(w,h);lastLayout=-Infinity;}
 const observer=new ResizeObserver(resize);observer.observe(host);resize();home({instant:true});
 function animate(now){frame=requestAnimationFrame(animate);const delta=lastTime?Math.min((now-lastTime)/1000,.05):0;lastTime=now;if(!paused)elapsed+=delta;if(fly){const t=Math.min(1,(now-fly.time)/FLY_MS),v=easeInOutCubic(t);camera.position.lerpVectors(fly.from,fly.to,v);controls.target.lerpVectors(fly.old,fly.target,v);if(t===1)fly=null;}gestures.update(delta*1000);controls.update();for(let i=0;i<people.length;i++)people[i].position.y=.2+Math.sin(elapsed*2+i)*.015;sky.update(elapsed,camera);if(!reduced.matches)for(const f of floaters)f.mesh.position.y=f.y+Math.sin(elapsed*.8+f.phase)*.07;for(let i=0;i<flows.length;i++)if(flows[i].dot.visible)flows[i].dot.position.copy(flows[i].curve.getPoint((elapsed*.12+i*.13)%1));renderer.render(scene,camera);labels.render(scene,camera);if(now-lastLayout>120){layoutLabels();lastLayout=now;}}
 frame=requestAnimationFrame(animate);
 renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();host.querySelector('.webgl-message')?.remove();const message=document.createElement('p');message.className='webgl-message';message.textContent='3D 畫面暫時中斷。你仍可用主題清單探索；請重新整理恢復地圖。';host.append(message);});
 return {names(value){host.classList.toggle('labels-off',!value);lastLayout=-Infinity;},emphasize(ids){for(const [id,label]of labelButtons)label.classList.toggle('recommended',ids.includes(id));},select(id){selected=id;selectedRelation=null;hoveredRelation=null;redrawSelection();},relation(key){selectedRelation=key;hoveredRelation=null;redrawSelection();},hoverRelation(key){hoveredRelation=key;redrawSelection();},filter(ids){for(const [id,g]of groups)g.visible=ids.includes(id);redrawSelection();},connections(value){connections=value;redrawSelection();},pause(value){paused=value;},night(value){time(value?'night':'day');},time,pins:showPins,pinState,focusStep,birdView:()=>framing?.kind==='home'&&framing.bird,mode(rotate){gestures.rotate(rotate);},zoom(factor){fly=null;framing=null;gestures.stop();camera.position.sub(controls.target).multiplyScalar(factor).add(controls.target);controls.update();},home,focus,focusRelation,refit,flying:()=>!!fly,view(){const r=v=>v.toArray().map(n=>Math.round(n*100)/100);return {target:r(controls.target),position:r(camera.position),distance:Math.round(camera.position.distanceTo(controls.target)*100)/100,drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,azimuth:Math.round(controls.getAzimuthalAngle()*100)/100,polar:Math.round(controls.getPolarAngle()*100)/100};},dispose(){cancelAnimationFrame(frame);observer.disconnect();controls.dispose();renderer.dispose();labels.domElement.remove();renderer.domElement.remove();}};
}
