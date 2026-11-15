import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../dist/vendor/three.module.min.js';
import {makeFigure,pose,applyPose,planRoute,crossing,along,islandTop,RING,HAIR_STYLES,PROPS,FIGURE_SCALE} from '../dist/people.js';
import {readAvatar,SHIRTS} from '../dist/walkers.js';
import {topics} from '../dist/content.js';
const centers=new Map(topics.map(t=>[t.id,{x:(t.x-470)*.0127,y:t.lift||0,z:(t.y-340)*.018}]));

test('人物有臉、頭髮、手腳，不是空殼；大小與部件數有上限',()=>{const shapes=new Set(),props=Object.keys(PROPS);Object.keys(HAIR_STYLES).forEach((hairStyle,k)=>{const fig=makeFigure({hairStyle,prop:props[k%props.length]});fig.scale.setScalar(FIGURE_SCALE);fig.updateMatrixWorld(true);
  const {legs,arms,head,hit}=fig.userData.rig;assert.equal(legs.length,2);assert.equal(arms.length,2);
  let eyes=0,meshes=0;const box=new THREE.Box3();fig.traverse(m=>{if(!m.isMesh||m===hit||m.geometry.type==='CircleGeometry')return;meshes++;assert.equal(m.material.map,null);box.expandByObject(m);if(m.parent===head&&m.material.color.getHexString()==='2a2522')eyes++;});
  assert.equal(eyes,2,'兩隻眼睛');assert.ok(meshes<=24,`部件 ${meshes}`);const h=box.max.y-box.min.y;assert.ok(h>.45&&h<.62,`身高 ${h}`);shapes.add(`${meshes}:${h.toFixed(3)}`);});
 assert.ok(shapes.size>=3,'髮型看得出差異');});
test('走路時手腳前後交錯擺動，站著時回到原位',()=>{const fig=makeFigure();const {legs,arms}=fig.userData.rig;applyPose(fig,pose(1.2,1));assert.ok(legs[0].rotation.x>.3);assert.equal(legs[1].rotation.x,-legs[0].rotation.x);assert.ok(Math.sign(arms[0].rotation.x)!==Math.sign(legs[0].rotation.x));applyPose(fig,pose(1.2,0));for(const p of [...legs,...arms])assert.equal(Math.abs(p.rotation.x),0);});
test('路線沿島緣避開建築、跨島時走在雲上，終點就是目的地',()=>{const ids=[...centers.keys()];for(const a of ids)for(const b of ids){const from=centers.get(a),to=centers.get(b),spot={x:.16,z:.68},start={x:from.x-.44,y:islandTop(from),z:from.z+.62};const route=planRoute(start,from,to,spot);const pts=route.pts;
  for(let i=1;i<pts.length;i++)assert.ok(Math.hypot(pts[i].x-pts[i-1].x,pts[i].y-pts[i-1].y,pts[i].z-pts[i-1].z)<.4,`${a}→${b} 一步太大`);
  for(const p of pts){const near=Math.min(...[...centers.values()].map(c=>Math.hypot(p.x-c.x,p.z-c.z)));if(p.ground)assert.ok(near>.6,`${a}→${b} 踩進建築 ${near}`);else assert.ok(p.y>=Math.min(islandTop(from),islandTop(to))-1e-9);}
  const end=along(route,route.total);assert.ok(Math.hypot(end.x-(to.x+spot.x),end.z-(to.z+spot.z))<1e-9);assert.equal(end.ground,true);
  if(a!==b){assert.ok(pts.some(p=>!p.ground),'跨島需要雲');const mid=along(route,route.total/2);assert.ok(typeof mid.heading==='number');}}});
test('關聯行人從一座島的島緣走到另一座島的島緣',()=>{const a=centers.get('belief'),b=centers.get('method'),pts=crossing(a,b);assert.ok(Math.abs(Math.hypot(pts[0].x-a.x,pts[0].z-a.z)-RING)<1e-9);assert.ok(Math.abs(Math.hypot(pts.at(-1).x-b.x,pts.at(-1).z-b.z)-RING)<1e-9);assert.ok(pts.slice(1,-1).every(p=>!p.ground));});
test('我的角色只接受已知選項，名字最多 8 字，壞資料回到預設',()=>{assert.deepEqual(readAvatar('not json'),{name:'',role:'學生',hairStyle:'short',shirt:SHIRTS[0]});assert.deepEqual(readAvatar(JSON.stringify({name:'  很長很長很長很長的名字  ',role:'家長',hairStyle:'bun',shirt:SHIRTS[3]})),{name:'很長很長很長很長',role:'家長',hairStyle:'bun',shirt:SHIRTS[3]});assert.equal(readAvatar(JSON.stringify({role:'老師',hairStyle:'mohawk',shirt:'red'})).role,'學生');});
