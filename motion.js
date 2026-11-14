// Camera flights ease in and out like a guided move, so the visitor never loses where an island sits on the map.
export const FLY_MS=800;
export function easeInOutCubic(t){return t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;}
// Pixels of the map covered by the detail card: a side card hides the right edge, a bottom sheet hides the bottom.
export function coveredInset(map,card){
 if(!map||!card||card.right<=map.left||card.left>=map.right||card.bottom<=map.top||card.top>=map.bottom)return {right:0,bottom:0};
 const sideCard=card.left>map.left+map.width*.3;
 if(sideCard)return {right:Math.min(map.right-card.left,map.width*.6),bottom:0};
 // A sheet that hides most of the map: centre the island so it is in place once the sheet closes.
 if(card.top<map.top+map.height*.4)return {right:0,bottom:0};
 return {right:0,bottom:map.bottom-card.top};
}
