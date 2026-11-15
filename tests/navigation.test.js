import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../dist/vendor/three.module.min.js';
import {acrossIsland,walkable,walkSpot} from '../dist/navigation.js';
import {createTrailHazards,TRAIL_WIDTH,TRAIL_LANE} from '../dist/hazards.js';
import {createRoute} from '../dist/route3d.js';
import {nodes,buildGraph,bridgePath,trailPath,TRAIL,SUMMIT} from '../dist/summit.js';
import {topics} from '../dist/content.js';

test('可穿越島中央，並沿島面繞開建築，不穿牆或懸空',()=>{
 const c={ring:1.06};const direct=acrossIsland(c,{x:-.9,z:0},{x:.9,z:0});assert.equal(direct.length,2);
 const wall={...c,obstacles:[{minX:-.3,maxX:.3,minZ:-.35,maxZ:.35}]};const route=acrossIsland(wall,{x:-.9,z:0},{x:.9,z:0});assert.ok(route.length>2);
 for(let j=1;j<route.length;j++)for(let i=0;i<=40;i++){const a=route[j-1],b=route[j],p={x:a.x+(b.x-a.x)*i/40,z:a.z+(b.z-a.z)*i/40};assert.ok(walkable(wall,p),JSON.stringify(p));}
 const spots=Array.from({length:100},()=>walkSpot(wall));assert.ok(spots.every(p=>walkable(wall,p)));assert.ok(spots.some(p=>Math.hypot(p.x,p.z)<.65),'有內部落點');
});
test('錯誤吊橋寬度為舊版兩倍，車道留在橋內，斷裂後可恢復且減少動態不斷橋',()=>{
 assert.equal(TRAIL_WIDTH,.38*2);assert.ok(TRAIL_LANE+.1<TRAIL_WIDTH/2);
 const reduced={matches:false},h=createTrailHazards(3,{rnd:()=>0,reduced});h.update(22);assert.equal(h.span(0).phase,'warning');h.update(2);assert.ok(h.gap(0,.35));assert.ok(!h.gap(0,.1));assert.equal(h.state().breaks,3);h.update(5);assert.ok(h.gap(0,.35),'修復中不開放');h.update(1.5);assert.ok(!h.gap(0,.35));
 reduced.matches=true;h.update(100);assert.ok(h.state().spans.every(s=>s.phase==='safe'));h.update(100);assert.equal(h.state().breaks,3);
});
test('正確橋平時已亮、腳步再加亮；錯誤橋面隨斷裂消失並復原',()=>{
 const centers=nodes(topics),scene=new THREE.Scene(),h=createTrailHazards(3,{rnd:()=>0});
 const stairs=bridgePath(),r=createRoute({scene,centers,walkways:[],bridge:stairs,trail:TRAIL.map(([a,b,o])=>trailPath(centers.get(a),centers.get(b),.2,o)),trophyAt:centers.get(SUMMIT),reduced:{matches:false},hazards:h});
 r.update(.1,1);const steps=r.stairGroup.children.filter(x=>x.userData.step!==undefined),base=steps[0].material.emissiveIntensity;assert.ok(base>=.55);r.update(.1,2,[new THREE.Vector3(stairs[0].x,stairs[0].y,stairs[0].z)]);assert.ok(steps[0].material.emissiveIntensity>base);
 const decks=[];r.group.traverse(m=>{if(m.name==='wrong-route-deck')decks.push(m);});assert.equal(decks.length,3);const m=new THREE.Matrix4(),before=[];decks[0].getMatrixAt(Math.round((decks[0].count-1)*.35),m);before.push(...m.elements);
 h.update(22);h.update(2);h.update(.6);r.update(.1,3);decks[0].getMatrixAt(Math.round((decks[0].count-1)*.35),m);assert.notDeepEqual(m.elements,before);h.update(5);h.update(1.5);r.update(.1,4);decks[0].getMatrixAt(Math.round((decks[0].count-1)*.35),m);assert.deepEqual(m.elements,before);
});

test('真實建築下，全部169組跨島路線可走，非法起點不穿牆銜接',async()=>{
 const {centers,graph}=await import('./fixtures/island-models.js');const {safeSpot}=await import('../dist/navigation.js');const {walkRoute,TOP}=await import('../dist/summit.js');
 for(const [a,c]of centers)for(const [b,d]of centers){const start=safeSpot(c,{x:.16,z:.68}),goal=safeSpot(d,{x:.16,z:.68});assert.ok(walkable(c,start));assert.ok(walkable(d,goal));
  const r=walkRoute(graph,{x:c.x+start.x,y:(c.y||0)+TOP,z:c.z+start.z},a,b,goal);assert.ok(r,`${a}→${b}被建築擋住`);
  for(let i=1;i<r.pts.length;i++){const p=r.pts[i-1],q=r.pts[i];if(p.island&&p.island===q.island){const C=centers.get(p.island);for(let j=0;j<=10;j++)assert.ok(walkable(C,{x:p.x+(q.x-p.x)*j/10-C.x,z:p.z+(q.z-p.z)*j/10-C.z}),`${a}→${b}穿過${p.island}建築`);}}
 }
 const c=centers.get('teacher');assert.equal(acrossIsland(c,{x:0,z:0},{x:0,z:.95}).length,0,'拒絕建築內的起點');
});
test('獎盃有一對對稱展翼，留在島面邊界內',async()=>{const {arch}=await import('./fixtures/island-models.js');const g=arch.build(new THREE.Group(),{kind:'trophy'}),left=g.getObjectByName('trophy-wing-left'),right=g.getObjectByName('trophy-wing-right');assert.ok(left&&right);g.updateMatrixWorld(true);const a=new THREE.Box3().setFromObject(left),b=new THREE.Box3().setFromObject(right);assert.ok(Math.abs(a.min.x+b.max.x)<1e-6);assert.ok(Math.max(Math.abs(a.min.x),b.max.x)<1.2);});

test('斷裂橋板持續下墜並離場，修復時不會從下方浮回',()=>{
 const centers=nodes(topics),h=createTrailHazards(3,{rnd:()=>0}),r=createRoute({scene:new THREE.Scene(),centers,walkways:[],bridge:bridgePath(),trail:TRAIL.map(([a,b,o])=>trailPath(centers.get(a),centers.get(b),.2,o)),trophyAt:centers.get(SUMMIT),hazards:h,reduced:{matches:false}});
 const deck=r.group.getObjectByName('wrong-route-deck'),index=Math.round((deck.count-1)*.35),m=new THREE.Matrix4(),position=new THREE.Vector3(),scale=new THREE.Vector3(),rotation=new THREE.Quaternion();
 const read=()=>{deck.getMatrixAt(index,m);m.decompose(position,rotation,scale);return {y:position.y,scale:scale.length()};};r.update(.1,0);const top=read().y;
 h.update(22);h.update(2);h.update(.3);r.update(.1,1);const early=read();h.update(.5);r.update(.1,2);const later=read();assert.ok(later.y<early.y&&early.y<top);assert.ok(later.scale>1e-6,'未離場前不縮成薄片');
 h.update(.8);r.update(.1,3);assert.equal(read().scale,0,'離場後隱藏');h.update(4);r.update(.1,4);assert.equal(h.span(0).phase,'repair');assert.equal(read().scale,0,'修復中不回浮');h.update(1.5);r.update(.1,5);assert.ok(Math.abs(read().y-top)<1e-6,'原位重建橋面');
});
