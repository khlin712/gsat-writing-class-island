// The seven-station journey that wraps round the nine topic islands, as seen from the usual camera:
// ① the start island (front middle) → ② the trailhead sign, where three paths split: a lava cave and a cliff (dead ends: walk in
// and you fall), and a steep wall (the only one you can climb, slowly) → ③ a golden bridge from the top of the wall to the trophy
// (results summit, top middle) → ④ the university → down the stairs to ⑤ the course calendar → ⑥ sign-up → ⑦ contact → back to ①.
// Students who walk in through the university door are gone (off to university); new ones come out of the main building on
// SPAWN_FROM, so the map never empties. The university only echoes a well-known library's look; it carries no name or mark.
export const SUMMIT='stories',UNIVERSITY='university';
// Where students who walked into the university step out again: the gate on this island (① 起點 for now; it was 01 認識老師 before).
// Change this one id to move it.
export const SPAWN_FROM='start';
// Where students who took a wrong turn (lava cave, cliff) start again.
export const RESTART='start';
export const RISE=2,TOP=.25,RING=1.06,LEDGE=.42;
const C={x:-1.17,z:0},R=6,BACK=Math.atan2(-13.6,-2.8);
const onArc=(a,y=0,r=R)=>({x:C.x+Math.cos(a)*r,y,z:C.z+Math.sin(a)*r});
export const SUMMIT_AT=onArc(BACK,RISE),UNIVERSITY_AT=onArc(BACK-.62,RISE);
// Journey stops that are islands (or small ledges) of their own. ring = radius of the walk round the inside of the rim.
export const STOPS={
 start:{...onArc(1.37),kind:'start'},
 fork:{...onArc(.93,0,6.3),kind:'fork',ring:LEDGE,ledge:true},
 lava:{...onArc(1.0,0,8.9),kind:'lava'},
 cliff:{...onArc(.55,0,8.6),kind:'cliff'},
 wallfoot:{...onArc(.45,0,6.3),kind:'wallfoot',ring:LEDGE,ledge:true},
 wall:{...onArc(.12,RISE,6.3),kind:'wall'},
 calendar:{...onArc(-3.4),kind:'calendar'},
 signup:{...onArc(2.35),kind:'signup'},
 contact:{...onArc(1.85),kind:'contact'}
};
export const DEAD_ENDS=['lava','cliff'];
export const islandOf=(x,z)=>({x:(x-470)*.0127,z:(z-340)*.018});
// Plank walkways between neighbouring islands and along the journey.
export const WALKWAYS=[['teacher','belief'],['teacher','method'],['teacher','students'],['teacher','solutions'],['teacher','parents'],['teacher','pricing'],['belief','method'],['belief','pricing'],['method','students'],['students','solutions'],['solutions','parents'],['parents','pricing'],['pricing','benefits'],['parents','benefits'],
 ['solutions','start'],['start','fork'],['fork','lava'],['fork','cliff'],['fork','wallfoot'],[SUMMIT,UNIVERSITY],['calendar','signup'],['signup','contact'],['contact','start']];
const angle=(from,to)=>Math.atan2(to.z-from.z,to.x-from.x);
const smooth=t=>t*t*(3-2*t);
// Points spaced evenly along a curve given as u → {x,z} (with y as a function of the fraction along it).
function even(curve,spacing,y){const N=600,pts=[curve(0)],cum=[0];for(let i=1;i<=N;i++){const p=curve(i/N);cum.push(cum[i-1]+Math.hypot(p.x-pts[i-1].x,p.z-pts[i-1].z));pts.push(p);}
 const total=cum[N],n=Math.max(2,Math.round(total/spacing));return Array.from({length:n+1},(_,k)=>{const want=total*k/n;let i=1;while(i<N&&cum[i]<want)i++;const t=(want-cum[i-1])/((cum[i]-cum[i-1])||1);return {x:pts[i-1].x+(pts[i].x-pts[i-1].x)*t,z:pts[i-1].z+(pts[i].z-pts[i-1].z)*t,y:y(k/n)};});}
const arcAngle=p=>Math.atan2(p.z-C.z,p.x-C.x),arcRadius=p=>Math.hypot(p.x-C.x,p.z-C.z);
// Along the arc from rim to rim of two islands; y(f) gives the height.
function alongArc(from,to,y,spacing,rimA=1.15,rimB=1.15){const ra=arcRadius(from),rb=arcRadius(to);let a0=arcAngle(from),a1=arcAngle(to);while(a1-a0>Math.PI)a1-=2*Math.PI;while(a0-a1>Math.PI)a1+=2*Math.PI;const s=Math.sign(a1-a0);a0+=s*rimA/ra;a1-=s*rimB/rb;
 return even(u=>{const a=a0+(a1-a0)*u,r=ra+(rb-ra)*smooth(u);return {x:C.x+Math.cos(a)*r,z:C.z+Math.sin(a)*r};},spacing,y);}
// ③ The golden bridge: from the top of the wall to the trophy's rim, level with a gentle arch.
export function bridgePath(wall=STOPS.wall,summit=SUMMIT_AT,spacing=.17){const y=summit.y+TOP;return alongArc(wall,summit,f=>y+.35*Math.sin(Math.PI*f),spacing).map(p=>({...p,path:'bridge'}));}
// The way down after the university: plain stone stairs to the calendar island.
export function descentPath(uni=UNIVERSITY_AT,cal=STOPS.calendar,spacing=.17){const y0=uni.y+TOP,y1=(cal.y||0)+TOP;return alongArc(uni,cal,f=>y0+(y1-y0)*f,spacing).map(p=>({...p,path:'descent'}));}
// ② The steep wall: from the ledge at its foot straight up the rock face to the top.
export function climbPath(foot=STOPS.wallfoot,wall=STOPS.wall){const a=angle(wall,foot),x=wall.x+Math.cos(a)*1.32,z=wall.z+Math.sin(a)*1.32,y0=(foot.y||0)+TOP,y1=wall.y+TOP;
 return Array.from({length:12},(_,i)=>({x,z,y:y0+(y1-y0)*i/11,path:'climb'}));}

// ---- Walking graph: every way a person can get about without leaving the ground. ----
const ringR=c=>c.ring||RING;
const ringAt=(c,a)=>({x:c.x+Math.cos(a)*ringR(c),y:(c.y||0)+TOP,z:c.z+Math.sin(a)*ringR(c)});
export function nodes(topics){const m=new Map(topics.map(t=>[t.id,t.id===SUMMIT?{...SUMMIT_AT}:{...islandOf(t.x,t.y),y:t.lift||0}]));m.set(UNIVERSITY,{...UNIVERSITY_AT});for(const [id,s]of Object.entries(STOPS))m.set(id,{...s});return m;}
export function buildGraph(centers){
 const edges=[],add=(from,to,kind,pts)=>{const A=centers.get(from),B=centers.get(to);edges.push({from,to,kind,exit:angle(A,pts[0]),entry:angle(B,pts.at(-1)),pts},{from:to,to:from,kind,exit:angle(B,pts.at(-1)),entry:angle(A,pts[0]),pts:[...pts].reverse()});};
 for(const [a,b]of WALKWAYS){const A=centers.get(a),B=centers.get(b);if(!A||!B)continue;const ab=angle(A,B),ba=angle(B,A);add(a,b,'bridge',[ringAt(A,ab),ringAt(B,ba)]);}
 const W=centers.get('wall'),F=centers.get('wallfoot'),S=centers.get(SUMMIT),U=centers.get(UNIVERSITY),K=centers.get('calendar');
 if(W&&F)add('wallfoot','wall','climb',[ringAt(F,angle(F,W)),...climbPath(F,W)]);
 if(W&&S)add('wall',SUMMIT,'span',bridgePath(W,S));
 // The stairs after the university only go down: the one way up is the steep wall.
 if(U&&K){const pts=descentPath(U,K);edges.push({from:UNIVERSITY,to:'calendar',kind:'descent',exit:angle(U,pts[0]),entry:angle(K,pts.at(-1)),pts});}
 return {centers,edges};}
export function shortest(graph,from,to){if(from===to)return [];const dist=new Map([[from,0]]),prev=new Map(),todo=new Set([from]);
 while(todo.size){let u=null;for(const n of todo)if(u===null||dist.get(n)<dist.get(u))u=n;todo.delete(u);if(u===to)break;
  // Nobody passes through a dead end on the way somewhere else.
  if(u!==from&&DEAD_ENDS.includes(u))continue;
  for(const e of graph.edges)if(e.from===u){const w=dist.get(u)+length(e.pts)*(e.kind==='climb'?3:1)+1.5;if(w<(dist.get(e.to)??Infinity)){dist.set(e.to,w);prev.set(e.to,e);todo.add(e.to);}}}
 if(!prev.has(to))return null;const path=[];for(let n=to;n!==from;n=prev.get(n).from)path.unshift(prev.get(n));return path;}
const length=pts=>pts.reduce((s,p,i)=>i?s+Math.hypot(p.x-pts[i-1].x,p.y-pts[i-1].y,p.z-pts[i-1].z):0,0);
// Round the inside of an island's rim (clear of its buildings) from one angle to another.
export function ringArc(c,a0,a1){let d=a1-a0;while(d>Math.PI)d-=2*Math.PI;while(d<-Math.PI)d+=2*Math.PI;const n=Math.max(1,Math.ceil(Math.abs(d)*ringR(c)/.23));return Array.from({length:n+1},(_,i)=>ringAt(c,a0+d*i/n));}
// From where a walker stands on island `from` to a spot (local x,z) on island `to`, by walkways, the wall, the bridge and stairs.
export function walkRoute(graph,start,from,to,spot){const C0=graph.centers.get(from),hops=shortest(graph,from,to);if(!C0||!hops)return null;
 const pts=[{x:start.x,y:start.y,z:start.z}];let here=C0,at=Math.atan2(start.z-C0.z,start.x-C0.x);
 for(const e of hops){pts.push(...ringArc(here,at,e.exit));pts.push(...e.pts);here=graph.centers.get(e.to);at=e.entry;}
 const T=graph.centers.get(to);pts.push(...ringArc(T,at,Math.atan2(spot.z,spot.x)));pts.push({x:T.x+spot.x,y:(T.y||0)+TOP,z:T.z+spot.z});
 return {pts,hops:hops.map(e=>e.kind)};}
