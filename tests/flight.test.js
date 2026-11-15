import test from 'node:test';
import assert from 'node:assert/strict';
import {SUMMIT,UNIVERSITY,SUMMIT_AT,UNIVERSITY_AT,TOP,WALKWAYS,flightPath,launchSpot,nodes,buildGraph,walkRoute} from '../dist/summit.js';
import {topics as TOPICS} from '../dist/content.js';

const graph=buildGraph(nodes(TOPICS));
test('獎盃到大學改搭紙飛機：單向航線，起降都在島面上，中段飛得比兩島高',()=>{
 assert.ok(!WALKWAYS.some(w=>w.includes(SUMMIT)&&w.includes(UNIVERSITY)),'獎盃與大學之間不再是步道');
 const f=flightPath();assert.ok(f.every(p=>p.path==='flight'));
 assert.ok(Math.hypot(f[0].x-SUMMIT_AT.x,f[0].z-SUMMIT_AT.z)<1.05,'從獎盃島面起飛');
 assert.ok(Math.hypot(f.at(-1).x-UNIVERSITY_AT.x,f.at(-1).z-UNIVERSITY_AT.z)<1.05,'降落在大學島面');
 assert.ok(Math.max(...f.map(p=>p.y))>SUMMIT_AT.y+TOP+.9,'中段明顯升高');
 assert.ok(graph.edges.some(e=>e.kind==='flight'&&e.from===SUMMIT&&e.to===UNIVERSITY));
 assert.ok(!graph.edges.some(e=>e.kind==='flight'&&e.from===UNIVERSITY),'不會從大學飛回獎盃');
 const r=walkRoute(graph,{x:SUMMIT_AT.x,y:SUMMIT_AT.y+TOP,z:SUMMIT_AT.z},SUMMIT,UNIVERSITY,{x:0,z:.5});assert.deepEqual(r.hops,['flight']);
 const s=launchSpot();assert.ok(Math.hypot(s.x,s.z)>.5&&Math.hypot(s.x,s.z)<.9,'起飛前停在獎盃與起飛台之間');});
