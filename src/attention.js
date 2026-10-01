import * as THREE from 'three';
export const ATTENTION_COLORS={invite:0x68bce5,correct:0x49b977,incorrect:0xe97869};
// Exterior shells and 12 tiny points per active role. No render targets, bloom
// passes, textures, per-frame geometry allocation, or input surfaces.
export function createAttention(pickable,roots){
 const cues=[],groups=[],enabled=new Set();let lastFrame=-Infinity,lastColor='',animate=true;
 for(const [role,root]of Object.entries(roots)){
  root.updateMatrixWorld(true);const bounds=new THREE.Box3().setFromObject(root),center=bounds.getCenter(new THREE.Vector3()),half=bounds.getSize(new THREE.Vector3()).multiplyScalar(.5);
  const materials=[.045,.105].map((width,layer)=>{
   const m=new THREE.MeshBasicMaterial({color:ATTENTION_COLORS.invite,side:THREE.BackSide,transparent:true,opacity:layer?.09:.32,depthWrite:false});
   m.onBeforeCompile=shader=>{shader.uniforms.cueWidth={value:width};shader.vertexShader='uniform float cueWidth;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\ntransformed += normal * cueWidth;');};
   m.customProgramCacheKey=()=>String(width);return m;
  });
  for(const original of pickable.filter(m=>m.userData.part===role&&!m.userData.noCue))for(const material of materials){
   const shell=new THREE.Mesh(original.geometry,material);shell.visible=false;shell.userData={cueRole:role,attention:true};shell.raycast=()=>{};original.add(shell);cues.push(shell);
  }
  const surfaces=[],directions=[],phases=[],zeros=[];
  for(let i=0;i<12;i++){
   const y=1-2*(i+.5)/12,r=Math.sqrt(1-y*y),a=i*2.3999632297,d=new THREE.Vector3(Math.cos(a)*r,y,Math.sin(a)*r);
   const radius=1/Math.max(Math.abs(d.x)/Math.max(.1,half.x),Math.abs(d.y)/Math.max(.1,half.y),Math.abs(d.z)/Math.max(.1,half.z));
   const p=center.clone().addScaledVector(d,radius+.10);root.worldToLocal(p);surfaces.push(...p.toArray());directions.push(...d.toArray());phases.push(i/12);zeros.push(0,0,0);
  }
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(zeros,3));geometry.setAttribute('cueSurface',new THREE.Float32BufferAttribute(surfaces,3));geometry.setAttribute('cueDirection',new THREE.Float32BufferAttribute(directions,3));geometry.setAttribute('cuePhase',new THREE.Float32BufferAttribute(phases,1));
  const material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{cueTime:{value:0},cueColor:{value:new THREE.Color(ATTENTION_COLORS.invite)}},vertexShader:`uniform float cueTime;attribute vec3 cueSurface;attribute vec3 cueDirection;attribute float cuePhase;varying float alpha;void main(){float age=fract(cueTime*.34+cuePhase);vec3 p=cueSurface+cueDirection*(age*1.25);vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=clamp(135./-mv.z,1.5,3.5);alpha=smoothstep(0.,.16,age)*(1.-age)*(1.-age)*.7;}`,fragmentShader:`uniform vec3 cueColor;varying float alpha;void main(){float d=length(gl_PointCoord-.5);float edge=1.-smoothstep(.15,.5,d);gl_FragColor=vec4(cueColor,alpha*edge);}`});
  const points=new THREE.Points(geometry,material);points.name=role+'-attention-particles';points.visible=false;points.frustumCulled=false;points.userData.attention=true;points.raycast=()=>{};root.add(points);groups.push({role,materials,points});
 }
 return {cues,setRoles(roles,animated=true){animate=animated;enabled.clear();for(const role of roles)if(role)enabled.add(role);for(const cue of cues)cue.visible=enabled.has(cue.userData.cueRole);lastFrame=-Infinity;},update(time,reduced,feedback,until=0){
  const still=reduced||!animate,picked=time<until?feedback:null,colorKey=(picked?picked.role+picked.correct:'blue')+still;
  if(time-lastFrame<1000/30&&colorKey===lastColor)return false;
  const changed=colorKey!==lastColor;lastColor=colorKey;lastFrame=time;
  const pulse=still?1:.90+.10*Math.sin(time*.0022);
  for(const group of groups){const color=group.role===picked?.role?(picked.correct?ATTENTION_COLORS.correct:ATTENTION_COLORS.incorrect):ATTENTION_COLORS.invite;
   group.materials.forEach((m,i)=>{m.color.setHex(color);m.opacity=(i?.10:.34)*pulse;});group.points.visible=enabled.has(group.role)&&!still;group.points.material.uniforms.cueTime.value=time/1000;group.points.material.uniforms.cueColor.value.setHex(color);
  }
  return changed||enabled.size>0&&!still;
 }};
}
