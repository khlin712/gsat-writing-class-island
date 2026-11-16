// Image quality that follows the device: the renderer's pixel ratio steps down a notch when frames come too slowly, and back
// up after the scene has run smoothly for a while. Frames after a hidden tab or a long stall are ignored, so coming back to
// the page never counts as slow. The first seconds after the page opens (shaders compiling, models loading) are ignored too.
export const STEP=.25,SLOW_MS=26,SMOOTH_MS=18.5,WINDOW_MS=2000,UP_AFTER_MS=6000,STALL_MS=1000,WARMUP_MS=3000;
export function createResolution({max=1,min=Math.min(1,max)}={}){
 let ratio=max,start=null,sum=0,count=0,smoothSince=null,born=null;
 const reset=now=>{start=now;sum=0;count=0;};
 return {
  get ratio(){return ratio;},
  // now: frame time (ms); frameMs: time since the previous frame; hidden: the page is not visible.
  // Returns the new pixel ratio when it changes, otherwise null.
  sample(now,frameMs,hidden=false){
   born??=now;if(now-born<WARMUP_MS)return null;
   if(hidden||!(frameMs>0)||frameMs>STALL_MS){reset(now);smoothSince=null;return null;}
   if(start===null)reset(now);
   sum+=frameMs;count++;if(now-start<WINDOW_MS)return null;
   const avg=sum/count;reset(now);
   if(avg>SLOW_MS){smoothSince=null;if(ratio>min){ratio=Math.max(min,Math.round((ratio-STEP)*100)/100);return ratio;}return null;}
   if(avg<SMOOTH_MS){smoothSince??=now;if(ratio<max&&now-smoothSince>=UP_AFTER_MS){ratio=Math.min(max,Math.round((ratio+STEP)*100)/100);smoothSince=now;return ratio;}return null;}
   smoothSince=null;return null;}
 };
}
