// Keep layout decisions independent of WebGL so crowded views and sheet gestures can be checked directly.
export function overlaps(a,b,gap=4){return a.left<b.right+gap&&a.right>b.left-gap&&a.top<b.bottom+gap&&a.bottom>b.top-gap;}
export function placeLabels(items,bounds,obstacles=[]){
 const kept=[],result=[];
 for(const item of [...items].sort((a,b)=>a.priority-b.priority||a.order-b.order)){
  let placed=null;
  for(const compact of [false,true]){
   const w=compact?item.badgeWidth:item.width,h=compact?item.badgeHeight:item.height;
   const offsets=[[0,0],[0,-h-8],[0,h+8],[-w*.6,0],[w*.6,0]];
   for(const [dx,dy]of offsets){const box={left:item.x+dx-w/2,right:item.x+dx+w/2,top:item.y+dy-h/2,bottom:item.y+dy+h/2};
    if(box.left<bounds.left||box.right>bounds.right||box.top<bounds.top||box.bottom>bounds.bottom)continue;
    if([...obstacles,...kept].some(r=>overlaps(box,r)))continue;
    placed={id:item.id,compact,visible:true,dx,dy,box};break;
   }
   if(placed)break;
  }
  if(placed){kept.push(placed.box);result.push(placed);}else result.push({id:item.id,visible:false,compact:true,dx:0,dy:0});
 }
 return result;
}
export function fitDistance(radius,fov,aspect,widthFraction=1,heightFraction=1){
 const vertical=Math.tan(fov*Math.PI/360)*Math.max(.25,Math.min(1,heightFraction));
 const horizontal=Math.tan(fov*Math.PI/360)*Math.max(.1,aspect)*Math.max(.25,Math.min(1,widthFraction));
 return Math.max(5,Math.min(32,Math.max(.1,radius)*1.2/Math.sin(Math.atan(Math.min(vertical,horizontal)))));
}
export function sheetGesture(full,delta){return delta < -36?'full':delta > 36?(full?'peek':'close'):null;}
