import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../dist/vendor/three.module.min.js';
import {topics} from '../dist/content.js';
import {SUMMIT,STAIRS_FROM,UNIVERSITY,SPAWN_FROM,SUMMIT_AT,UNIVERSITY_AT,WALKWAYS,RING,TOP,stairsPath,buildGraph,walkRoute} from '../dist/summit.js';
import {createArchitecture} from '../dist/architecture.js';
const centers=new Map(topics.map(t=>[t.id,t.id===SUMMIT?{...SUMMIT_AT}:{x:(t.x-470)*.0127,y:t.lift||0,z:(t.y-340)*.018}]));centers.set(UNIVERSITY,{...UNIVERSITY_AT});
const stairs=stairsPath(centers.get(STAIRS_FROM),centers.get(SUMMIT)),graph=buildGraph(centers,{stairs});
const ground=[...centers].filter(([id])=>id!==SUMMIT&&id!==UNIVERSITY).map(([,c])=>c);

test('成果高點在島群正後方的高處，大學緊鄰在旁',()=>{const xs=ground.map(c=>c.x),zs=ground.map(c=>c.z);assert.ok(SUMMIT_AT.z<Math.min(...zs)-2,'在島群後方');assert.ok(SUMMIT_AT.x>Math.min(...xs)&&SUMMIT_AT.x<Math.max(...xs),'左右置中範圍內');assert.ok(SUMMIT_AT.y>=3);assert.equal(UNIVERSITY_AT.y,SUMMIT_AT.y);const d=Math.hypot(UNIVERSITY_AT.x-SUMMIT_AT.x,UNIVERSITY_AT.z-SUMMIT_AT.z);assert.ok(d>2.8&&d<4,`距離 ${d}`);});
test('階梯一路上升、間距平均，沿外圍繞過其他島',()=>{for(let i=1;i<stairs.length;i++){assert.ok(stairs[i].y>stairs[i-1].y);const g=Math.hypot(stairs[i].x-stairs[i-1].x,stairs[i].z-stairs[i-1].z);assert.ok(g>.15&&g<.19,`間距 ${g}`);}
 for(const p of stairs.slice(3,-3))for(const [id,c]of centers)if(id!==STAIRS_FROM&&id!==SUMMIT)assert.ok(Math.hypot(p.x-c.x,p.z-c.z)>1.45,`階梯穿過 ${id}`);});
test('人物只走在島面、步道與階梯上，九座島兩兩都走得到',()=>{const stairSet=new Set(stairs.map(p=>`${p.x},${p.y},${p.z}`)),pairs=new Set(WALKWAYS.map(w=>[...w].sort().join(':')));
 const where=p=>{if(stairSet.has(`${p.x},${p.y},${p.z}`))return 'stairs';for(const [id,c]of centers)if(Math.abs(p.y-((c.y||0)+TOP))<1e-9&&Math.hypot(p.x-c.x,p.z-c.z)<=RING+1e-9)return id;return null;};
 for(const a of topics)for(const b of topics){const c=centers.get(a.id),start={x:c.x+.16,y:(c.y||0)+TOP,z:c.z+.68};const r=walkRoute(graph,start,a.id,b.id,{x:.16,z:.68});assert.ok(r,`${a.id}→${b.id} 走不到`);
  let prev=null;for(const p of r.pts){const w=where(p);assert.ok(w,`${a.id}→${b.id} 有一點懸空`);if(prev&&w!=='stairs'&&prev!=='stairs'&&w!==prev)assert.ok(pairs.has([w,prev].sort().join(':')),`${prev}→${w} 沒有步道`);prev=w;}}});
test('學生從主建築生成、走進大學；大學建築留在島面內',()=>{assert.ok(topics.some(t=>t.id===SPAWN_FROM));const r=walkRoute(graph,{x:centers.get(SPAWN_FROM).x,y:TOP,z:centers.get(SPAWN_FROM).z+.6},SPAWN_FROM,UNIVERSITY,{x:0,z:.5});assert.ok(r.hops.includes('stairs'));
 const unit=new THREE.BoxGeometry(1,1,1);const mesh=(g,geo,c,x,y,z,sx=1,sy=1,sz=1)=>{const m=new THREE.Mesh(geo,new THREE.MeshStandardMaterial());m.position.set(x,y,z);m.scale.set(sx,sy,sz);g.add(m);return m;};
 const kit=createArchitecture({mesh,box:(g,x,y,z,w,h,d,c)=>mesh(g,unit,c,x,y+h/2,z,w,h,d),tree(){}});const model=kit.build(new THREE.Group(),{kind:'university'});model.updateMatrixWorld(true);const b=new THREE.Box3().setFromObject(model);
 assert.ok(b.min.x>=-1.2&&b.max.x<=1.2&&b.min.z>=-1.2&&b.max.z<=1.2&&b.max.y<2);let r2=0;model.traverse(m=>{if(m.isMesh)for(const v of [[b.min.x,b.min.z],[b.max.x,b.max.z]])r2=Math.max(r2,Math.hypot(...v));});assert.ok(Math.hypot(b.max.x,b.max.z)<RING,'環島步道在建築外圍');});
