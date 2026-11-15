// The route that wraps half-way round the island group, as seen from the usual camera:
// silver then gold stairs climb from 03 behind the islands up to the results summit (top middle of the view),
// and a short raised walkway leads on to the university. Students who walk in through its door are gone (off to university);
// new ones come out of the main building on SPAWN_FROM, so the map never empties.
// The university building only echoes a well-known library's look as a symbol of going on to university; it carries no name or mark.
export const SUMMIT='stories',STAIRS_FROM='method',UNIVERSITY='university';
// Where new students step out of: the main building on this island (01 認識老師 for now). Change this one id to move it.
export const SPAWN_FROM='teacher';
export const RISE=3.2,TOP=.25,RING=1.06;
const C={x:-1.17,z:0},R=6,BACK=Math.atan2(-13.6,-2.8);
const onArc=(a,y,r=R)=>({x:C.x+Math.cos(a)*r,y,z:C.z+Math.sin(a)*r});
export const SUMMIT_AT=onArc(BACK,RISE),UNIVERSITY_AT=onArc(BACK-.62,RISE);
export const islandOf=(x,z)=>({x:(x-470)*.0127,z:(z-340)*.018});
// Islands joined by plank walkways (the trophy and the university share a raised one).
export const WALKWAYS=[['teacher','belief'],['teacher','method'],['teacher','students'],['teacher','solutions'],['teacher','parents'],['teacher','pricing'],['belief','method'],['belief','pricing'],['method','students'],['students','solutions'],['solutions','parents'],['parents','pricing'],['pricing','benefits'],['parents','benefits'],[SUMMIT,UNIVERSITY]];
const angle=(from,to)=>Math.atan2(to.z-from.z,to.x-from.x);
const smooth=t=>t*t*(3-2*t);
// Points spaced evenly along a curve given as u → {x,z}.
function even(curve,spacing){const N=600,pts=[curve(0)],cum=[0];for(let i=1;i<=N;i++){const p=curve(i/N);cum.push(cum[i-1]+Math.hypot(p.x-pts[i-1].x,p.z-pts[i-1].z));pts.push(p);}
 const total=cum[N],n=Math.max(2,Math.round(total/spacing));return Array.from({length:n+1},(_,k)=>{const want=total*k/n;let i=1;while(i<N&&cum[i]<want)i++;const t=(want-cum[i-1])/((cum[i]-cum[i-1])||1);return {x:pts[i-1].x+(pts[i].x-pts[i-1].x)*t,z:pts[i-1].z+(pts[i].z-pts[i-1].z)*t};});}
// The stairs: from the outer rim of 03, out onto the arc and round behind the islands to the summit's rim, rising evenly.
export function stairsPath(from,summit=SUMMIT_AT,spacing=.17){
 const a0=angle(C,from),r0=Math.hypot(from.x-C.x,from.z-C.z)+1.15,a1=angle(C,summit)+1.2/R;
 const pts=even(u=>{const k=smooth(Math.min(1,u/.3)),a=a0+(a1-a0)*u,r=r0+(R-r0)*k;return {x:C.x+Math.cos(a)*r,z:C.z+Math.sin(a)*r};},spacing);
 const y0=(from.y||0)+TOP,y1=summit.y+TOP;return pts.map((p,i)=>({...p,y:y0+(y1-y0)*i/(pts.length-1)}));}
// ---- Walking graph: every way a person can get from one island to another without leaving the ground. ----
const ringAt=(c,a)=>({x:c.x+Math.cos(a)*RING,y:(c.y||0)+TOP,z:c.z+Math.sin(a)*RING});
export function buildGraph(centers,{stairs}){
 const edges=[];
 for(const [a,b]of WALKWAYS){const A=centers.get(a),B=centers.get(b);if(!A||!B)continue;const ab=angle(A,B),ba=angle(B,A);
  edges.push({from:a,to:b,kind:'bridge',exit:ab,entry:ba,pts:[ringAt(A,ab),ringAt(B,ba)]},{from:b,to:a,kind:'bridge',exit:ba,entry:ab,pts:[ringAt(B,ba),ringAt(A,ab)]});}
 const F=centers.get(STAIRS_FROM),S=centers.get(SUMMIT);
 if(stairs&&F&&S)edges.push({from:STAIRS_FROM,to:SUMMIT,kind:'stairs',exit:angle(F,stairs[0]),entry:angle(S,stairs.at(-1)),pts:stairs},{from:SUMMIT,to:STAIRS_FROM,kind:'stairs',exit:angle(S,stairs.at(-1)),entry:angle(F,stairs[0]),pts:[...stairs].reverse()});
 return {centers,edges};}
export function shortest(graph,from,to){if(from===to)return [];const dist=new Map([[from,0]]),prev=new Map(),todo=new Set([from]);
 while(todo.size){let u=null;for(const n of todo)if(u===null||dist.get(n)<dist.get(u))u=n;todo.delete(u);if(u===to)break;
  for(const e of graph.edges)if(e.from===u){const w=dist.get(u)+length(e.pts)+1.5;if(w<(dist.get(e.to)??Infinity)){dist.set(e.to,w);prev.set(e.to,e);todo.add(e.to);}}}
 if(!prev.has(to))return null;const path=[];for(let n=to;n!==from;n=prev.get(n).from)path.unshift(prev.get(n));return path;}
const length=pts=>pts.reduce((s,p,i)=>i?s+Math.hypot(p.x-pts[i-1].x,p.y-pts[i-1].y,p.z-pts[i-1].z):0,0);
// Round the inside of an island's rim (clear of its buildings) from one angle to another.
export function ringArc(c,a0,a1){let d=a1-a0;while(d>Math.PI)d-=2*Math.PI;while(d<-Math.PI)d+=2*Math.PI;const n=Math.max(1,Math.ceil(Math.abs(d)/.22));return Array.from({length:n+1},(_,i)=>ringAt(c,a0+d*i/n));}
// From where a walker stands on island `from` to a spot (local x,z) on island `to`, by walkways and stairs.
export function walkRoute(graph,start,from,to,spot){const C0=graph.centers.get(from),hops=shortest(graph,from,to);if(!C0||!hops)return null;
 const pts=[{x:start.x,y:start.y,z:start.z}];let here=C0,at=Math.atan2(start.z-C0.z,start.x-C0.x);
 for(const e of hops){pts.push(...ringArc(here,at,e.exit));pts.push(...e.pts);here=graph.centers.get(e.to);at=e.entry;}
 const T=graph.centers.get(to);pts.push(...ringArc(T,at,Math.atan2(spot.z,spot.x)));pts.push({x:T.x+spot.x,y:(T.y||0)+TOP,z:T.z+spot.z});
 return {pts,hops:hops.map(e=>e.kind)};}
