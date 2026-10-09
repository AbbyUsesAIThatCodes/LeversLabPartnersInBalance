// Lock a deliberate gesture to one quantity; downward means more weight/push.
export function gestureKind(dx,dy){
 if(Math.hypot(dx,dy)<10)return 'auto';
 if(Math.abs(dy)>Math.abs(dx)*1.3)return 'mass';
 if(Math.abs(dx)>Math.abs(dy)*1.3)return 'position';
 return 'auto';
}
export const gestureDelta=(d,x,y)=>d.kind==='mass'?(y-d.startY)*5:((x-d.startX)*d.dx+(y-d.startY)*d.dy)/d.denom*500;
