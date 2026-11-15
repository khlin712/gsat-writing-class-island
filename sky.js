import * as THREE from 'three';

// The islands float in open sky: a gradient dome that follows the camera, a sea of clouds far below,
// a ring of slow clouds at island height, and stars that only show at night.
const DAY={stops:[[-1,'#8fbde0'],[-.35,'#aed0e9'],[-.05,'#e3edf2'],[.12,'#d4e8f4'],[.5,'#a3cbea'],[1,'#7cafdf']],fog:'#cbe0ee',cloud:'#ffffff',glow:.12};
const DAWN={stops:[[-1,'#b9acd2'],[-.35,'#dcc3d3'],[-.05,'#ffdcc6'],[.12,'#f7d6c8'],[.5,'#c8c8e4'],[1,'#98aedb']],fog:'#ead7d6',cloud:'#fff2ec',glow:.14};
const DUSK={stops:[[-1,'#7d76a8'],[-.35,'#c3979f'],[-.05,'#ffc28c'],[.12,'#f3a87c'],[.5,'#9a87b9'],[1,'#4b5d98']],fog:'#d8a99c',cloud:'#ffe3cf',glow:.12};
const NIGHT={stops:[[-1,'#16233a'],[-.08,'#33456a'],[.12,'#24365a'],[.5,'#14223f'],[1,'#0b1530']],fog:'#2a3a5a',cloud:'#9fb0cc',glow:.05};

export function random(seed){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
// Colour of the dome at height h (-1 straight down … 1 straight up).
export function skyColor(stops,h){
 if(h<=stops[0][0])return stops[0][1];
 for(let i=1;i<stops.length;i++)if(h<=stops[i][0]){const [h0,c0]=stops[i-1],[h1,c1]=stops[i];return '#'+new THREE.Color(c0).lerp(new THREE.Color(c1),(h-h0)/(h1-h0)).getHexString();}
 return stops[stops.length-1][1];
}

export const TIMES={dawn:DAWN,day:DAY,dusk:DUSK,night:NIGHT};

export function createSky(scene,{reduced}){
 const dome=new THREE.Mesh(new THREE.SphereGeometry(90,40,20),new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.BackSide,fog:false,depthWrite:false}));
 dome.renderOrder=-1;scene.add(dome);
 const position=dome.geometry.attributes.position;dome.geometry.setAttribute('color',new THREE.BufferAttribute(new Float32Array(position.count*3),3));
 function paint(theme){const color=new THREE.Color(),colors=dome.geometry.attributes.color;for(let i=0;i<position.count;i++){color.set(skyColor(theme.stops,position.getY(i)/90));colors.setXYZ(i,color.r,color.g,color.b);}colors.needsUpdate=true;}

 const puff=new THREE.IcosahedronGeometry(1,2);
 const cloudMaterial=new THREE.MeshStandardMaterial({color:'#ffffff',roughness:1,emissive:'#ffffff',emissiveIntensity:DAY.glow});
 function layer(count,place){const m=new THREE.InstancedMesh(puff,cloudMaterial,count);const dummy=new THREE.Object3D();for(let i=0;i<count;i++){place(dummy,i);dummy.updateMatrix();m.setMatrixAt(i,dummy.matrix);}m.castShadow=false;m.receiveShadow=false;scene.add(m);return m;}
 // Sea of clouds: clumps of puffs spread under and around the islands.
 const r1=random(7),seaClumps=[];for(let i=0;i<52;i++){const a=r1()*Math.PI*2,d=6+Math.sqrt(r1())*56;seaClumps.push([Math.cos(a)*d,-8.5-r1()*2.5,Math.sin(a)*d,1.3+r1()*2]);}
 const below=layer(seaClumps.length*5,(o,i)=>{const [x,y,z,s]=seaClumps[Math.floor(i/5)],k=i%5;o.position.set(x+(k-2)*s*.55+r1()*.6,y+r1()*.5,z+(r1()-.5)*s*.9);const size=s*(.55+r1()*.45);o.scale.set(size*1.25,size*.5,size);});
 // A loose ring of clouds at island height, kept clear of the archipelago.
 const r2=random(11),ringClumps=[];for(let i=0;i<14;i++){const a=i/14*Math.PI*2+r2()*.3,d=17+r2()*16;ringClumps.push([Math.cos(a)*d,-1.5+r2()*4,Math.sin(a)*d,.9+r2()*1.1]);}
 const ring=layer(ringClumps.length*4,(o,i)=>{const [x,y,z,s]=ringClumps[Math.floor(i/4)],k=i%4;o.position.set(x+(k-1.5)*s*.7,y+(k%2)*s*.25,z+(r2()-.5)*s*.6);const size=s*(.6+r2()*.4);o.scale.set(size*1.3,size*.6,size);});

 // Wisps just under the island rims, so clouds show even when looking straight down at the map.
 const r4=random(23),wispClumps=[];for(let i=0;i<12;i++){const a=i/12*Math.PI*2+r4()*.4,d=8+r4()*6;wispClumps.push([Math.cos(a)*d,-2.6-r4()*1.4,Math.sin(a)*d*.85,.8+r4()*.8]);}
 const wisps=layer(wispClumps.length*4,(o,i)=>{const [x,y,z,s]=wispClumps[Math.floor(i/4)],k=i%4;o.position.set(x+(k-1.5)*s*.75,y+(k%2)*s*.2,z+(r4()-.5)*s*.5);const size=s*(.6+r4()*.4);o.scale.set(size*1.4,size*.45,size);});
 const r3=random(3),stars=new Float32Array(500*3);for(let i=0;i<500;i++){const u=r3()*.95+.05,a=r3()*Math.PI*2,rad=Math.sqrt(1-u*u)*85;stars.set([Math.cos(a)*rad,u*85,Math.sin(a)*rad],i*3);}
 const starGeometry=new THREE.BufferGeometry();starGeometry.setAttribute('position',new THREE.BufferAttribute(stars,3));
 const starField=new THREE.Points(starGeometry,new THREE.PointsMaterial({color:'#fff6da',size:1.6,sizeAttenuation:false,fog:false,depthWrite:false}));starField.visible=false;dome.add(starField);

 function theme(name){const t=TIMES[name]||DAY,night=name==='night';paint(t);scene.fog.color.set(t.fog);cloudMaterial.color.set(t.cloud);cloudMaterial.emissive.set(t.cloud);cloudMaterial.emissiveIntensity=t.glow;starField.visible=night;}
 theme('day');
 return {
  time:theme,
  update(elapsed,camera){dome.position.copy(camera.position);if(reduced.matches)return;below.rotation.y=elapsed*.006;ring.rotation.y=-elapsed*.012;wisps.rotation.y=elapsed*.009;}
 };
}
