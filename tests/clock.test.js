import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

test('15:20停留五秒，跨過邊界只累加超出時間，暫停不補時且仍可跳時',()=>{
 const source=readFileSync(new URL('../dist/app.js',import.meta.url),'utf8');
 const block=source.slice(source.indexOf('const ISLAND_START='),source.indexOf('function setBird('));
 let now=1000,paused=false;const elements=new Map(),world={setHour(h){this.hour=h;},phase:()=>({name:'day',stars:0}),weather:()=>({})};
 const context=vm.createContext({performance:{now:()=>now},document:{body:{classList:{contains:()=>paused,toggle(){}},dataset:{}}},world,window:{},setInterval(){},$:id=>{if(!elements.has(id))elements.set(id,{setAttribute(k,v){this[k]=v;}});return elements.get(id);}});
 vm.runInContext(block,context);const tick=()=>vm.runInContext('tickClock()',context),clock=()=>context.window.__islandClock();
 tick();assert.equal(clock().time,'15:20');assert.equal(world.hour,15+20/60);
 now=5999;tick();assert.equal(clock().minutes,920);
 now=6250;tick();assert.equal(clock().minutes,921,'只累加五秒後的0.25秒');
 now=8000;tick();assert.equal(clock().minutes,930,'兩秒推進10分鐘');
 paused=true;now=10000;tick();assert.equal(clock().minutes,930);
 paused=false;now=11000;tick();assert.equal(clock().minutes,935,'恢復後不補暫停時間');
 elements.get('#day').onclick();assert.equal(clock().time,'18:00');assert.match(elements.get('#day')['aria-label'],/島上 5 分鐘/);
 // Opening delay is real time, including time spent paused.
 now=0;vm.runInContext('islandSeconds=0;islandOffset=0;clockLast=0;clockHoldUntil=5000',context);paused=true;now=6000;tick();paused=false;now=7000;tick();assert.equal(clock().minutes,925);
});
