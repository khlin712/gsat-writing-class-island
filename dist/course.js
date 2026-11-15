// Course stairs: one step per lesson, climbing from the classroom island up to the student-results summit.
// Lesson names, skills and what each lesson carries forward are left for the teacher to fill in; nothing here is invented.
// To fill in: title '段落怎麼接', learn ['段落銜接'], uses [{lesson:2,skill:'立意'}].
export const SUMMIT='stories',STAIRS_FROM='method';
export const lessons=Array.from({length:8},(_,i)=>({n:i+1,title:'',learn:[],uses:[]}));
// The stairs come in two flights: the first SILVER lessons are silver steps, the rest climb on in gold. Adjust once the real schedule is in.
export const SILVER=4;
export const stageOf=k=>k<SILVER?'silver':'gold';
export const lessonTitle=l=>l.title||`第 ${l.n} 課`;
// Where each step floats: a curve bowing away from the viewer (so each step reads higher on screen), rising evenly from the lower island's rim to the summit's rim.
export function stairPath(count,from,to,{rim=1.5,bulge=2.6,base=.3}={}){
 const dx=to.x-from.x,dz=to.z-from.z,len=Math.hypot(dx,dz)||1,ux=dx/len,uz=dz/len;
 let px=-uz,pz=ux;if(pz>0){px=-px;pz=-pz;}
 const s={x:from.x+ux*rim,z:from.z+uz*rim},e={x:to.x-ux*rim,z:to.z-uz*rim},c={x:(s.x+e.x)/2+px*bulge,z:(s.z+e.z)/2+pz*bulge};
 const rise=(to.y||0)-(from.y||0),at=t=>{const a=(1-t)*(1-t),b=2*(1-t)*t,d=t*t;return {x:a*s.x+b*c.x+d*e.x,z:a*s.z+b*c.z+d*e.z};};
 // Even spacing along the curve, so every lesson is one equal stride.
 const samples=[{t:0,l:0}];let prev=at(0);for(let i=1;i<=200;i++){const t=i/200,p=at(t);samples.push({t,l:samples[i-1].l+Math.hypot(p.x-prev.x,p.z-prev.z)});prev=p;}
 const total=samples[200].l;
 return Array.from({length:count},(_,i)=>{const f=(i+.5)/count,want=f*total;let j=1;while(j<200&&samples[j].l<want)j++;const lo=samples[j-1],hi=samples[j],t=lo.t+(hi.t-lo.t)*((want-lo.l)/((hi.l-lo.l)||1));
  return {...at(t),y:(from.y||0)+base+rise*f};});
}
