import * as THREE from 'three';

// Original, compact child's hand: one continuous palm/wrist volume and five
// articulated, tapered digits. All dimensions are visual; force never scales it.
const SKIN=0x68412e,NAIL=0xae8070,CREASE=0x513324;
const vector=p=>new THREE.Vector3(...p);
function section(curve,t){
 const center=curve.getPoint(t),tangent=curve.getTangent(t).normalize();
 const across=new THREE.Vector3(1,0,0).addScaledVector(tangent,-tangent.x).normalize();
 const outward=new THREE.Vector3().crossVectors(across,tangent).normalize();
 return {center,tangent,across,outward};
}
function widthAt(stops,t){
 const end=stops.findIndex(s=>s[0]>=t);if(end<=0)return stops[Math.max(0,end)].slice(1);
 const a=stops[end-1],b=stops[end],f=(t-a[0])/(b[0]-a[0]);
 return [a[1]+(b[1]-a[1])*f,a[2]+(b[2]-a[2])*f];
}
function sculpt(curve,widths,rings=32,sides=16){
 const positions=[],indices=[];
 for(let i=0;i<=rings;i++){
  const t=i/rings,{center,across,outward}=section(curve,t),[w,h]=widthAt(widths,t);
  for(let j=0;j<=sides;j++){const a=j/sides*Math.PI*2,p=center.clone().addScaledVector(across,Math.cos(a)*w).addScaledVector(outward,Math.sin(a)*h);positions.push(p.x,p.y,p.z);}
 }
 for(let i=0;i<rings;i++)for(let j=0;j<sides;j++){const a=i*(sides+1)+j,b=a+sides+1;indices.push(a,b,a+1,b,b+1,a+1);}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();return g;
}
export function createEffortHand(add){
 const skinMeshes=[],details=[];
 const surface=(geometry,color,name)=>{const m=add(geometry,color,[0,0,0],name);m.material.metalness=0;m.material.roughness=color===NAIL?.58:.87;m.userData.handSurface=true;return m;};
 const palmCurve=new THREE.CatmullRomCurve3([[0,.75,.40],[0,.92,.75],[0,1.08,1.10],[0,1.38,1.22],[0,1.72,1.22]].map(vector));
 const palm=surface(sculpt(palmCurve,[[0,.05,.035],[.10,.60,.19],[.30,.72,.31],[.53,.61,.32],[.72,.37,.26],[.94,.35,.25],[.98,.29,.21],[1,.001,.001]]),SKIN,'contacting-palm');skinMeshes.push(palm);
 const digits=[
  {name:'index',x:-.49,root:.58,tip:-.06,r:.165,height:.89},
  {name:'middle',x:-.15,root:.48,tip:-.23,r:.175,height:.96},
  {name:'ring',x:.21,root:.54,tip:-.12,r:.166,height:.91},
  {name:'little',x:.53,root:.71,tip:.16,r:.137,height:.78},
 ];
 function digit(name,points,r){
  const curve=new THREE.CatmullRomCurve3(points.map(vector)),profile=[[0,.78*r,.68*r],[.12,r,.90*r],[.30,1.05*r,.95*r],[.43,.84*r,.78*r],[.59,.92*r,.82*r],[.73,.76*r,.68*r],[.85,.78*r,.70*r],[.94,.57*r,.50*r],[1,.001,.001]];
  const m=surface(sculpt(curve,profile,28,14),SKIN,name+'-finger');m.userData.digit=name;skinMeshes.push(m);
  // A small softly squared nail follows the distal phalanx, not a painted stripe.
  const frame=section(curve,.80),nail=new THREE.Shape();const w=r*.63,h=r*.93,k=.045;
  nail.moveTo(-w+k,-h);nail.lineTo(w-k,-h);nail.quadraticCurveTo(w,-h,w,-h+k);nail.lineTo(w,h-k);nail.quadraticCurveTo(w,h,w-k,h);nail.lineTo(-w+k,h);nail.quadraticCurveTo(-w,h,-w,h-k);nail.lineTo(-w,-h+k);nail.quadraticCurveTo(-w,-h,-w+k,-h);
  const geo=new THREE.ExtrudeGeometry(nail,{depth:.009,bevelEnabled:true,bevelThickness:.012,bevelSize:.022,bevelSegments:2,steps:1,curveSegments:4});
  const basis=new THREE.Matrix4().makeBasis(frame.across,frame.tangent,frame.outward);
  geo.applyMatrix4(basis);geo.translate(...frame.center.clone().addScaledVector(frame.outward,r*.73).toArray());
  const n=surface(geo,NAIL,name+'-nail');n.userData.noCue=true;details.push(n);
  // Shallow joint creases follow the curved back of each finger.
  for(const t of [.33,.59]){const f=section(curve,t),[width,height]=widthAt(profile,t),pts=[];
   for(let i=0;i<=8;i++){const u=(i/8-.5)*1.25;pts.push(f.center.clone().addScaledVector(f.across,u*width).addScaledVector(f.outward,Math.sqrt(1-u*u)*height+.004));}
   const crease=surface(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),8,.008,4,false),CREASE,name+'-crease');crease.userData.noCue=true;details.push(crease);
  }
 }
 for(const d of digits)digit(d.name,[[d.x,d.height,d.root+.18],[d.x,d.height+.02,d.root],[d.x,.57,d.tip+.29],[d.x,.25,d.tip+.10],[d.x,.11,d.tip]],d.r);
 digit('thumb',[[-.43,.98,1.25],[-.76,.93,1.02],[-.91,.64,.75],[-.88,.30,.44],[-.71,.12,.28]],.207);
 // Place the lowest finger pad on the beam without changing hand proportions.
 let bottom=Infinity;for(const m of skinMeshes){m.geometry.computeBoundingBox();bottom=Math.min(bottom,m.geometry.boundingBox.min.y);}
 for(const m of [...skinMeshes,...details]){m.geometry.translate(0,-bottom,0);m.geometry.scale(1.55,1.55,1.55);m.geometry.computeBoundingBox();}
 return {palm,skinMeshes,details};
}
