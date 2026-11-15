import * as THREE from './vendor/three.module.min.js';

// Passing showers and the rainbow after them. Rain comes at random; when it clears in daylight a rainbow fades in behind the islands.
// Skipped entirely for visitors who ask for reduced motion.
export const RAIN_GAP=[35,80],RAIN_LENGTH=[18,32],RAINBOW_SECONDS=26;
export function createWeather(scene,{reduced,rnd=Math.random}={}){
 const group=new THREE.Group();group.name='weather';scene.add(group);
 // Rain: short falling streaks in a box around the islands, wrapped round as they reach the bottom.
 const N=900,box={x:[-16,14],y:[-3,13],z:[-16,13]},pos=new Float32Array(N*6),speed=new Float32Array(N);
 const span=k=>box[k][1]-box[k][0];
 for(let i=0;i<N;i++){const x=box.x[0]+rnd()*span('x'),y=box.y[0]+rnd()*span('y'),z=box.z[0]+rnd()*span('z');pos.set([x,y,z,x-.04,y-.38,z],i*6);speed[i]=11+rnd()*5;}
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(pos,3));
 const rainMat=new THREE.LineBasicMaterial({color:'#d8e7f3',transparent:true,opacity:0,depthWrite:false});
 const rain=new THREE.LineSegments(geo,rainMat);rain.frustumCulled=false;rain.visible=false;rain.raycast=()=>{};group.add(rain);
 // Rainbow: seven soft bands in a wide arc behind the islands.
 const bow=new THREE.Group();bow.position.set(1,-7,-26);group.add(bow);
 const bands=['#ff5a4f','#ff9a3c','#ffd84a','#6cd26a','#4fa8ff','#5a63e0','#9b5ce0'].map((c,i)=>{const m=new THREE.Mesh(new THREE.TorusGeometry(17-i*.42,.22,6,96,Math.PI),new THREE.MeshBasicMaterial({color:c,transparent:true,opacity:0,depthWrite:false,fog:false}));m.raycast=()=>{};bow.add(m);return m;});
 bow.visible=false;
 let light=1,rainAmt=0,raining=false,next=RAIN_GAP[0]+rnd()*(RAIN_GAP[1]-RAIN_GAP[0]),until=0,bowAmt=0,bowUntil=0,t=0;
 const pick=([a,b])=>a+rnd()*(b-a);
 return {
  // daylight: 0 at night … 1 at noon (a rainbow needs the sun).
  update(dt,daylight=1){light=daylight;if(reduced?.matches){rain.visible=bow.visible=false;rainAmt=bowAmt=0;return;}t+=dt;
   if(!raining&&t>=next){raining=true;until=t+pick(RAIN_LENGTH);}
   if(raining&&t>=until){raining=false;next=t+pick(RAIN_GAP);if(daylight>.45)bowUntil=t+RAINBOW_SECONDS;}
   rainAmt+=((raining?1:0)-rainAmt)*Math.min(1,dt*.8);rain.visible=rainAmt>.02;rainMat.opacity=rainAmt*.55;
   if(rain.visible){for(let i=0;i<N;i++){const k=i*6,d=speed[i]*dt;pos[k+1]-=d;pos[k+4]-=d;if(pos[k+1]<box.y[0]){const y=box.y[1]+pos[k+1]-box.y[0];pos[k+1]=y;pos[k+4]=y-.38;}}geo.attributes.position.needsUpdate=true;}
   const wantBow=t<bowUntil&&!raining?1:0;bowAmt+=(wantBow-bowAmt)*Math.min(1,dt*.5);bow.visible=bowAmt>.01;bands.forEach(b=>b.material.opacity=bowAmt*.42*daylight);},
  // How grey the sky is (0 clear … 1 full shower), for dimming the light.
  rain:()=>rainAmt,
  // For testing and a manual "下雨" toggle: start a shower now, or clear it.
  setRain(on){if(on){raining=true;until=t+pick(RAIN_LENGTH);}else{if(raining&&light>.45)bowUntil=t+RAINBOW_SECONDS;raining=false;until=t;next=t+pick(RAIN_GAP);}},
  state:()=>({raining,rain:Math.round(rainAmt*100)/100,rainbow:Math.round(bowAmt*100)/100,nextIn:Math.max(0,Math.round(next-t))})
 };
}
