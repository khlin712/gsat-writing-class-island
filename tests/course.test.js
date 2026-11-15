import test from 'node:test';
import assert from 'node:assert/strict';
import {lessons,lessonTitle,stairPath,SUMMIT,STAIRS_FROM,stageOf} from '../dist/course.js';
import {topics} from '../dist/content.js';
const at=id=>{const t=topics.find(t=>t.id===id);return {x:(t.x-470)*.0127,y:t.lift||0,z:(t.y-340)*.018};};
test('課程步道：每堂課一段，從課堂島均勻爬升到成果高點，不壓到任何島',()=>{
 const from=at(STAIRS_FROM),to=at(SUMMIT);assert.ok(to.y>1.5,'成果島在高處');
 const path=stairPath(lessons.length*4,from,to);assert.equal(path.length,lessons.length*4);
 for(let i=1;i<path.length;i++){assert.ok(path[i].y>path[i-1].y,'逐階升高');const d=Math.hypot(path[i].x-path[i-1].x,path[i].z-path[i-1].z);assert.ok(d>.08&&d<.2,`步距 ${d}`);}
 for(const p of path)for(const t of topics){const c=at(t.id);assert.ok(Math.hypot(p.x-c.x,p.z-c.z)>1.4,`第 ${path.indexOf(p)+1} 段壓到 ${t.id}`);}
});
test('課名未提供時顯示第幾課，不編造內容',()=>{assert.equal(lessonTitle({n:3,title:''}),'第 3 課');assert.ok(lessons.every(l=>!l.title&&!l.learn.length&&!l.uses.length));});
test('階梯分兩段：前段銀色、後段金色，兩段都有課',()=>{const stages=lessons.map((_,k)=>stageOf(k));assert.equal(stages[0],'silver');assert.equal(stages.at(-1),'gold');assert.equal(stages.lastIndexOf('silver')+1,stages.indexOf('gold'));});
