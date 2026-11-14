import {sheetGesture} from './layout.js';
export function bindSheet(element,handle,toggle,{onChange=()=>{},onClose=()=>{}}={}){
 const mobile=matchMedia('(max-width:720px)');let start=null,lastDrag=-Infinity;
 function setFull(full){element.classList.toggle('sheet-full',full);for(const button of [handle,toggle])button.setAttribute('aria-expanded',String(full));toggle.textContent=full?'收合':'展開';onChange();}
 function click(e){if(e.detail&&performance.now()-lastDrag<500)return;setFull(!element.classList.contains('sheet-full'));}
 handle.addEventListener('click',click);toggle.addEventListener('click',click);
 handle.addEventListener('pointerdown',e=>{if(!mobile.matches||e.button!==0||!e.isPrimary)return;start={id:e.pointerId,y:e.clientY};handle.setPointerCapture(e.pointerId);});
 handle.addEventListener('pointerup',e=>{if(!start||start.id!==e.pointerId)return;const action=sheetGesture(element.classList.contains('sheet-full'),e.clientY-start.y);start=null;if(!action)return;lastDrag=performance.now();if(action==='close')onClose();else setFull(action==='full');});
 handle.addEventListener('pointercancel',()=>{start=null;});handle.addEventListener('lostpointercapture',()=>{start=null;});
 setFull(false);
 return {setFull};
}
