import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { ROOM, BENCHES, TABLES, ANCHORS, SOUTH_DOOR, POSTER_LAYOUT } from './layout.js';
import { blockTexture, floorTexture, woodTexture, ceilingTexture, signTexture, clockTexture } from './textures.js';
import { posterAtlas, posterGeometry, postersReady } from './posters.js';
import release from '../release.json';

/** Standalone environment: no renderer, camera, input, animation loop or game state. */
export function createClassroom() {
  const root = new THREE.Group(); root.name = 'NCH_Classroom';
  root.userData = {version:release.version, units:'metres', dimensions:ROOM, reconstruction:'Photo-informed; dimensions estimated'};
  const groups = {}, colliders = [], anchors = {};
  const material = (name,color,extra={}) => {const m=new THREE.MeshStandardMaterial({color,roughness:.8,...extra});m.name=name;return m;};
  const M = {
    cream:material('Paint_cream','#e6e0c9'), ivory:material('Cabinets_warm_gray','#bdbdaf'),
    dark:material('Graphite','#252e30'), rubber:material('Rubber','#1d2324'), steel:material('Brushed_metal','#9babab',{metalness:.55,roughness:.37}),
    yellow:material('Stool_yellow','#f6c71f',{roughness:.4}), red:material('Stool_burgundy','#932e37',{roughness:.4}),
    wood:material('Butcher_block','#ffffff',{map:woodTexture(),roughness:.58}), gray:material('Laminate_gray','#dddeda',{roughness:.55}),
    board:material('Whiteboard','#f6f5e9',{roughness:.28}), cork:material('Noticeboard','#a39b89'),
    teal:material('Paper_turquoise','#29bcb7'), pink:material('Paper_pink','#eb7888'), gold:material('Paper_yellow','#edcf41'),
    green:material('Paper_green','#57aa76'), blue:material('Paper_blue','#627aa3'), white:material('Paper_white','#efede2'),
    blueTape:material('Blue_floor_tape','#415f96'), bin:material('Storage_trays_red','#c62c35'),
    oak:material('Oak_cabinet','#b5915b'), glass:material('Window_blue','#acd3e1',{roughness:.35,emissive:'#7fbed2',emissiveIntensity:.28}),
    lens:material('Printer_window','#244754',{metalness:.3,roughness:.22}), light:material('Ceiling_diffuser','#f7f7ec',{emissive:'#fff2d5',emissiveIntensity:.75}),
  };
  const unitBox = new THREE.BoxGeometry(1,1,1);
  const roundBox = new RoundedBoxGeometry(1,1,1,2,.065);
  const cylinder = new THREE.CylinderGeometry(1,1,1,12);
  const sphere = new THREE.IcosahedronGeometry(1,1);
  function group(name,parent=root){const g=new THREE.Group();g.name=name;parent.add(g);return g;}
  function mesh(geo,mat,pos,scale,parent,name=''){const m=new THREE.Mesh(geo,mat);m.name=name;m.position.set(...pos);m.scale.set(...scale);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
  function box(p,x,y,z,w,h,d,mat,rounded=false){return mesh(rounded?roundBox:unitBox,mat,[x,y,z],[w,h,d],p);}
  function cyl(p,x,y,z,r,h,mat){return mesh(cylinder,mat,[x,y,z],[r,h,r],p);}
  function ball(p,x,y,z,r,mat){return mesh(sphere,mat,[x,y,z],[r,r,r],p);}
  function rod(p,a,b,r,mat){const aa=new THREE.Vector3(...a),bb=new THREE.Vector3(...b);const m=cyl(p,0,0,0,r,aa.distanceTo(bb),mat);m.position.copy(aa).add(bb).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),bb.sub(aa).normalize());return m;}
  function block(name,x,z,w,d,minY=0,maxY=2){colliders.push({name,minX:x-w/2,maxX:x+w/2,minZ:z-d/2,maxZ:z+d/2,minY,maxY});}
  function picture(p,x,y,z,w,h,texture,rotation=0,frame=true){const g=group('Panel',p);g.position.set(x,y,z);g.rotation.y=rotation;if(p===groups.Decor)g.userData.wall=x< -3?'left':z>6.9?'back':'other';if(frame)box(g,0,0,-.012,w+.045,h+.045,.035,M.steel);const m=material('Graphic', '#ffffff',{map:texture,roughness:.85});return mesh(new THREE.PlaneGeometry(w,h),m,[0,0,.009],[1,1,1],g);}
  function wall(name,x,z,w,h,d,mapWidth,rotation=0){const g=group(name,groups.Architecture);groups[name]=g;const mat=material(name+'_blocks','#ffffff',{map:blockTexture(mapWidth,h)});const b=box(g,x,h/2,z,w,h,d,mat);b.rotation.y=rotation;return g;}
  groups.Architecture=group('Architecture');groups.Furniture=group('Furniture');groups.Equipment=group('Equipment');groups.Decor=group('Decor');groups.Anchors=group('Anchors');
  const floor=group('Floor',groups.Architecture);
  const fl=mesh(new THREE.PlaneGeometry(7,14),material('Terrazzo_tiles','#ffffff',{map:floorTexture(),roughness:.7}),[0,0,0],[1,1,1],floor);fl.rotation.x=-Math.PI/2;fl.castShadow=false;
  box(floor,0,-.11,0,7.28,.2,14.28,M.cream);
  const left=wall('LeftWall',-3.59,0,.18,3.6,14.18,14);
  // Map long wall correctly instead of stretching its block joints.
  left.children[0].material.map.rotation=0;
  const right=group('RightWall',groups.Architecture);groups.RightWall=right;
  const rightMat=material('Right_wall_blocks','#ffffff',{map:blockTexture(8.9,3.6)});
  box(right,3.59,1.8,-2.55,.18,3.6,8.9,rightMat);
  box(right,3.59,1.8,5.15,.18,3.6,3.7,material('Right_rear_blocks','#ffffff',{map:blockTexture(3.7,3.6)}));
  box(right,3.59,2.94,2.55,.18,1.32,1.3,M.cream);
  const back=group('BackWall',groups.Architecture);groups.BackWall=back;
  const backMat=material('BackWall_blocks','#ffffff',{map:blockTexture(7.36,3.6)});
  const southLeft=SOUTH_DOOR.x-SOUTH_DOOR.width/2,southRight=SOUTH_DOOR.x+SOUTH_DOOR.width/2;
  // Real southwest aperture; the former southeast door position is solid wall.
  for(const [name,a,b] of [['SouthWallWestPier',-3.68,southLeft],['SouthWallEastSpan',southRight,3.68]]){
    box(back,(a+b)/2,1.8,7.09,b-a,3.6,.18,backMat).name=name;
    block(name,(a+b)/2,7.09,b-a,.18,0,3.6);
  }
  box(back,SOUTH_DOOR.x,(3.6+SOUTH_DOOR.height)/2,7.09,SOUTH_DOOR.width,3.6-SOUTH_DOOR.height,.18,backMat).name='SouthWallLintel';
  block('SouthWallLintel',SOUTH_DOOR.x,7.09,SOUTH_DOOR.width,.18,SOUTH_DOOR.height,3.6);
  block('RearExitDoor_Closed',SOUTH_DOOR.x,SOUTH_DOOR.z,1.02,.05,0,2.16);
  const front=group('FrontWall',groups.Architecture);groups.FrontWall=front;
  const fm=material('Front_blocks','#ffffff',{map:blockTexture(7,3.6)});
  // True window opening. Frames and blinds sit inside the opening.
  box(front,-2.05,1.8,-7.09,3.26,3.6,.18,fm);box(front,2.11,1.8,-7.09,3.14,3.6,.18,fm);
  box(front,.06,.38,-7.09,1.02,.76,.18,M.cream);box(front,.06,3.38,-7.09,1.02,.44,.18,M.cream);
  for(const x of [-.49,.61])box(front,x,1.98,-6.98,.055,2.47,.13,M.steel);
  for(const y of [.76,1.68,3.2])box(front,.06,y,-6.98,1.16,.055,.13,M.steel);
  box(front,.06,1.98,-7.08,1.04,2.39,.028,M.glass);
  for(let y=.83;y<3.15;y+=.057)box(front,.06,y,-7.015,1.02,.013,.04, y>1.7?M.glass:M.white);
  box(front,.06,.75,-6.89,1.25,.055,.3,M.ivory);
  for(const [p,x,z,w,d] of [[left,-3.48,0,.04,14],[right,3.48,-2.5,.04,9],[right,3.48,5.15,.04,3.7],[front,0,-6.98,7,.04]])box(p,x,.07,z,w,.14,d,M.dark);
  for(const [a,b] of [[-3.5,southLeft],[southRight,3.5]])box(back,(a+b)/2,.07,6.98,b-a,.14,.04,M.dark);
  block('Wall_left',-3.59,0,.18,14.4);block('Wall_front',0,-7.09,7.36,.18);block('Wall_right_front',3.59,-2.55,.18,8.9);block('Wall_right_rear',3.59,5.15,.18,3.7);
  // Shallow visible preparation room at the side doorway.
  const store=group('PrepRoom',groups.Architecture);
  box(store,4.05,-.03,2.55,1.15,.06,1.3,M.ivory);box(store,4.6,1.35,2.55,.1,2.7,1.4,M.cream);
  for(const z of [1.88,3.23]){box(store,4.07,1.35,z,1.25,2.7,.1,M.cream);block('Prep_side',4.07,z,1.25,.1);}
  block('Prep_back',4.6,2.55,.1,1.4);
  // Only the doorway/recess is retained; no invented prep-room furniture.
  for(const z of [2.1,2.98])box(right,3.47,1.13,z,.16,2.26,.06,M.oak);
  box(right,3.47,2.28,2.55,.16,.065,.96,M.oak);
  // Door panels are visual landmarks; neither exterior is modelled.
  function door(p,x,z,rot,frontExit=false){const g=group(frontExit?'FrontExitDoor':'RearExitDoor',p);g.position.set(x,0,z);g.rotation.y=rot;
    box(g,0,1.08,0,1.02,2.16,.05,M.dark);for(const xx of [-.55,.55])box(g,xx,1.1,.02,.07,2.24,.09,M.steel);box(g,0,2.2,.02,1.18,.07,.09,M.steel);
    if(frontExit){
      // Owner-requested readable push bar. Photos obscure part of the hardware.
      const bar=group('ExitPushBar',g);
      for(const xx of [-.39,.39])box(bar,xx,1.08,.105,.13,.14,.16,M.steel,true);
      rod(bar,[-.39,1.08,.2],[.39,1.08,.2],.036,M.steel);
    }else{
      box(g,0,1.34,.036,.28,.94,.02,M.red);box(g,0,1.34,.05,.23,.87,.01,M.pink);
      const latch=cyl(g,.35,.94,.09,.055,.06,M.steel);latch.rotation.x=Math.PI/2;box(g,.29,.94,.14,.17,.032,.035,M.steel);
    }
    box(g,-.12,2.04,.07,.47,.08,.06,M.steel);
    picture(g,0,2.4,.08,.53,.22,signTexture('EXIT',[],'#ba4549','exit'),0,false);
  }
  door(front,-2.15,-6.96,0,true);door(back,SOUTH_DOOR.x,SOUTH_DOOR.z,Math.PI);
  const ceiling=group('Ceiling',groups.Architecture);groups.Ceiling=ceiling;
  const cm=material('Acoustic_ceiling','#ffffff',{map:ceilingTexture()});box(ceiling,0,3.65,-1.1,7.18,.12,11.8,cm).castShadow=false;
  box(ceiling,0,3.125,4.88,7.15,.95,.2,M.cream).castShadow=false;
  box(ceiling,0,2.72,5.98,7.16,.14,2.18,cm).castShadow=false;
  for(const z of [-5.7,-3.25,-.8,1.65,4])for(const x of [-2.1,0,2.1]){
    box(ceiling,x,3.57,z,.62,.05,1.19,M.steel).castShadow=false;
    box(ceiling,x,3.535,z,.56,.018,1.12,M.light).castShadow=false;
    for(const dx of [-.17,0,.17])box(ceiling,x+dx,3.518,z,.028,.024,1.08,M.white).castShadow=false;
  }
  for(const z of [-4.4,.35,3.0]){box(ceiling,.2,3.51,z,1.19,.09,1.1,M.white).castShadow=false;box(ceiling,.2,3.46,z,1.04,.016,.95,M.glass).castShadow=false;}
  for(const x of [-2,1])box(ceiling,x,2.64,5.95,.58,.02,1.05,M.light).castShadow=false;
  for(const z of [-4.5,0,3]){box(ceiling,-1.1,3.51,z,.55,.04,.52,M.gray);for(let i=0;i<9;i++)box(ceiling,-1.1,3.48,z-.21+i*.052,.49,.014,.012,M.dark);}

  function caster(p,x,z){const w=cyl(p,x,.07,z,.055,.05,M.rubber);w.rotation.z=Math.PI/2;box(p,x,.13,z,.035,.09,.035,M.steel);}
  function stool(x,z,yellow=true){const g=group(`Stool_${yellow?'yellow':'red'}`,groups.Furniture);g.position.set(x,0,z);const mat=yellow?M.yellow:M.red;
    // Split seat leaves the characteristic rectangular carry slot open.
    for(const sx of [-.117,.117])box(g,sx,.61,0,.19,.045,.36,mat,true);
    for(const sz of [-.11,.11])box(g,0,.61,sz,.05,.045,.14,mat,true);
    for(const sx of [-1,1])for(const sz of [-1,1]){rod(g,[sx*.19,.04,sz*.19],[sx*.13,.6,sz*.13],.016,mat);ball(g,sx*.19,.032,sz*.19,.023,M.rubber);}
    for(const s of [-1,1]){rod(g,[s*.17,.22,-.17],[s*.17,.22,.17],.012,mat);rod(g,[-.17,.22,s*.17],[.17,.22,s*.17],.012,mat);}
    block(g.name,x,z,.4,.4,0,.65);return g;
  }
  function papers(g,x,y,z){const cols=[M.teal,M.gold,M.pink,M.green];for(let i=0;i<3;i++){const b=box(g,x+i*.06,y+.005+i*.004,z+i*.035,.3,.006,.24,cols[i]);b.rotation.y=.08+i*.15;}cyl(g,x+.37,y+.072,z,.035,.14,M.red);for(let i=0;i<5;i++)rod(g,[x+.35+i*.01,y+.08,z],[x+.34+i*.014,y+.21,z+.007],.003,M.gold);}
  BENCHES.forEach((b,i)=>{
    const g=group(b.id,groups.Furniture);g.position.set(b.x,0,b.z);
    box(g,0,.52,0,b.width-.12,.8,b.depth-.1,M.ivory);box(g,0,b.height,0,b.width,.085,b.depth,M.wood,true);
    for(const xx of [-.78,0,.78]){box(g,xx,.54,b.depth/2-.027,.74,.68,.035,M.ivory);box(g,xx,.68,b.depth/2+.004,.16,.02,.025,M.steel);box(g,xx-.38,.55,b.depth/2,.009,.68,.01,M.dark);}
    for(const x of [-1,1])for(const z of [-.32,.32])caster(g,x,z);
    block(b.id,b.x,b.z,b.width,b.depth,0,1);
    papers(g,.59,.989,.08);
    stool(b.x-.64,b.z+.89,i===1);stool(b.x+.61,b.z+.89,i%2===0);
    if(i===3){const rig=group('Mechanical_apparatus',g);cyl(rig,-.5,1.01,0,.29,.04,M.dark);cyl(rig,-.5,1.36,0,.025,.68,M.steel);const wheel=cyl(rig,-.5,1.65,0,.19,.035,M.dark);wheel.rotation.x=Math.PI/2;
      box(rig,.06,1.2,0,.27,.42,.08,M.gold);const ramp=box(rig,.28,1.12,.07,.66,.027,.28,M.gray);ramp.rotation.z=.3;}
  });
  TABLES.forEach((t,i)=>{const g=group(t.id,groups.Furniture);g.position.set(t.x,0,t.z);
    box(g,0,t.height,0,t.width,.065,t.depth,M.gray,true);box(g,0,.825,0,t.width-.04,.13,t.depth-.04,M.dark);
    box(g,0,.27,0,t.width-.12,.038,t.depth-.13,M.dark);
    for(const x of [-t.width*.43,t.width*.43])for(const z of [-t.depth*.43,t.depth*.43]){box(g,x,.42,z,.045,.8,.045,M.dark);cyl(g,x,.03,z,.034,.045,M.rubber);}
    box(g,0,.38,0,.6,.2,.49,M.dark,true);box(g,0,.49,0,.62,.025,.51,M.gray);
    block(t.id,t.x,t.z,t.width,t.depth,0,.95);
    // Keep the near desk pair clear for downstream educational activities.
    if(t.pair===1){papers(g,-.25,.935,0);box(g,-.3,.937,-.4,.21,.008,.29,M.white);}
    stool(t.x,t.z+.99,i%2===0);if(i%2===0)stool(t.x-.93,t.z-.12,false);
  });
  // Side lectern seen next to the robot storage shelf.
  const lectern=group('Standing_lectern',groups.Furniture);lectern.position.set(2.72,0,4.03);box(lectern,0,1.04,0,.72,.055,.44,M.dark,true);rod(lectern,[0,.12,0],[0,1.02,0],.024,M.dark);box(lectern,0,.08,0,.55,.045,.4,M.dark);papers(lectern,-.14,1.073,0);block('Lectern',2.72,4.03,.72,.44);
  // Whiteboard and interactive display, on the long right wall.
  const wb=group('Whiteboard',groups.Equipment);wb.position.set(3.43,1.56,-1.62);wb.rotation.y=-Math.PI/2;
  box(wb,0,0,0,4.93,1.47,.045,M.steel);box(wb,-.38,0,.03,4.06,1.39,.016,M.board);
  box(wb,2.06,0,.03,.72,1.4,.02,M.cork);box(wb,-.38,-.75,.07,4.09,.032,.14,M.steel);
  const pockets=group('Colored_paper_pockets',wb);box(pockets,2.05,0,.057,.63,1.3,.025,M.dark);
  const papersM=[M.pink,M.gold,M.teal,M.white,M.green,M.red];
  for(let r=0;r<9;r++)for(let c=0;c<3;c++)box(pockets,1.84+c*.2,.55-r*.135,.081,.17,.044,.025,papersM[(r+c)%6]);
  const display=group('ViewBoard',groups.Equipment);display.position.set(3.07,0,-1.5);display.rotation.y=-Math.PI/2;
  for(const x of [-.45,.45]){box(display,x,.09,0,.055,.08,.77,M.dark);for(const z of [-.3,.3])caster(display,x,z);}
  rod(display,[0,.2,-.06],[0,1.3,-.06],.055,M.dark);box(display,0,1.79,0,1.83,1.09,.12,M.dark,true);
  picture(display,0,1.79,.067,1.72,.97,signTexture('Our Classroom',[],'#3f827e','screen'),0,false);
  box(display,0,1.26,.08,.11,.016,.01,M.steel);block('ViewBoard_stand',3.07,-1.5,.78,1.83);
  const projector=group('Projector',groups.Equipment);projector.position.set(3.1,2.65,-1.5);rod(projector,[.35,0,0],[-.45,0,0],.025,M.dark);box(projector,-.45,.02,0,.36,.15,.3,M.dark,true);ball(projector,-.5,-.025,.15,.04,M.lens);
  picture(groups.Decor,3.465,2.52,.95,.34,.34,clockTexture(),-Math.PI/2,false);
  // Flag: geometry instead of a copyrighted photographed texture.
  const flag=group('Classroom_flag',groups.Decor);flag.position.set(3.26,2.67,-.1);flag.rotation.y=-Math.PI/2;rod(flag,[0,0,0],[.27,-.48,.15],.009,M.oak);
  for(let i=0;i<13;i++)box(flag,.3,-.04-i*.033,.13,.38,.033,.007,i%2?M.white:M.red);box(flag,.19,-.12,.139,.17,.18,.008,M.blue);
  for(let r=0;r<4;r++)for(let c=0;c<4;c++)ball(flag,.126+c*.039,-.055-r*.039,.149,.005,M.white);

  function rack(x,z,rot){const g=group('Robotics_storage_rack',groups.Equipment);g.position.set(x,0,z);g.rotation.y=rot;
    for(const xx of [-.69,.69])for(const zz of [-.24,.24]){rod(g,[xx,.1,zz],[xx,2.2,zz],.016,M.steel);caster(g,xx,zz);}
    for(const y of [.2,.7,1.2,1.72,2.12]){box(g,0,y,0,1.43,.025,.53,M.steel);for(let n=0;n<10;n++)rod(g,[-.68+n*.15,y+.016,-.25],[-.68+n*.15,y+.016,.25],.004,M.dark);
      if(y<2)for(let c=0;c<3;c++){const xx=-.47+c*.47;box(g,xx,y+.07,.01,.41,.1,.45,M.bin);box(g,xx,y+.125,.01,.36,.009,.4,M.dark);for(let j=0;j<4;j++)box(g,xx-.12+j*.065,y+.147,.04,.035,.025,.14,M.steel);}}
    for(let i=0;i<3;i++){box(g,-.47+i*.47,2.26,0,.43,.25,.49,M.gray);box(g,-.47+i*.47,2.4,0,.45,.026,.51,M.dark);}
    block('Robot_rack',x,z,rot===0?1.45:.57,rot===0?.57:1.45);
  }
  rack(-3.04,4.42,Math.PI/2);rack(2.99,4.88,Math.PI/2);
  function cabinet(x,z,w,h,d){const g=group('Storage_cabinet',groups.Furniture);g.position.set(x,0,z);box(g,0,h/2,0,w,h,d,M.oak);for(const xx of [-w*.25,w*.25]){box(g,xx,h/2,d*.5+.016,w*.48,h-.06,.025,M.oak);box(g,xx>0?.04:-.04,h*.52,d*.5+.04,.018,.16,.025,M.steel);}block('Cabinet',x,z,w,d);return g;}
  cabinet(2.8,-6.47,.72,2.04,.64);
  // Clear the corrected southwest doorway; keep the cupboard in the south nook.
  const cupboard=cabinet(2.3,6.55,.81,2.1,.65);cupboard.name='South_storage_cabinet';cupboard.traverse(o=>{if(o.isMesh&&o.material===M.oak)o.material=M.ivory;});
  const printerBench=group('Printer_counter',groups.Furniture);box(printerBench,-.3,.78,6.6,3.9,.07,.73,M.dark);
  for(const x of [-2.12,-.2,1.53])box(printerBench,x,.38,6.6,.055,.76,.66,M.dark);box(printerBench,-.3,.27,6.6,3.88,.04,.65,M.dark);block('Printer_counter',-.3,6.6,3.9,.73);
  for(let i=0;i<4;i++){
    const g=group(`MakerBot_Sketch_${i+1}`,groups.Equipment);g.position.set(-1.75+i*.91,.83,6.57);g.rotation.y=Math.PI;
    box(g,0,.045,0,.48,.09,.44,M.dark,true);box(g,0,.51,0,.49,.085,.45,M.dark,true);
    for(const x of [-.22,.22]){box(g,x,.28,0,.04,.43,.43,M.dark);box(g,x,.29,.224,.025,.43,.019,M.steel);}
    box(g,0,.28,-.21,.44,.42,.034,M.dark);box(g,0,.15,0,.34,.025,.31,M.lens);
    rod(g,[-.18,.4,0],[.18,.4,0],.012,M.steel);box(g,.05,.36,0,.065,.085,.07,M.gray);cyl(g,.05,.2,0,.06,.055,[M.gold,M.teal,M.pink,M.green][i]);
    box(g,.145,.47,.238,.065,.043,.012,M.teal);ball(g,-.145,.48,.24,.035,[M.gold,M.green,M.pink,M.teal][i]);
  }
  for(let i=0;i<7;i++){box(printerBench,-1.8+i*.49,.38,6.58,.4,.16,.44,M.gray,true);box(printerBench,-1.8+i*.49,.47,6.58,.42,.025,.46,[M.gold,M.dark][i%2]);}
  const desk=group('Teacher_desk',groups.Furniture);desk.position.set(.55,0,5.36);box(desk,0,.76,0,2.05,.057,.8,M.wood,true);
  for(const x of [-.91,.91]){box(desk,x,.37,0,.06,.7,.06,M.steel);box(desk,x,.055,0,.5,.045,.68,M.dark);}
  box(desk,0,.45,.28,1.82,.28,.035,M.gray);block('Teacher_desk',.55,5.36,2.05,.8);
  const monitor=group('Teacher_monitor',desk);monitor.rotation.y=Math.PI;box(monitor,0,1.12,0,.67,.4,.035,M.dark,true);rod(monitor,[0,.81,0],[0,1.06,0],.023,M.steel);box(monitor,0,.8,0,.27,.023,.17,M.dark);box(monitor,0,1.12,.023,.61,.34,.008,M.lens);
  papers(desk,.51,.8,.06);box(desk,-.58,.805,.17,.36,.02,.17,M.gray);
  const chair=group('Teacher_chair',groups.Furniture);chair.position.set(.55,0,6.04);box(chair,0,.47,0,.49,.075,.48,M.dark,true);box(chair,0,.74,.22,.5,.5,.08,M.dark,true);cyl(chair,0,.25,0,.035,.43,M.steel);for(let i=0;i<5;i++){const a=i/5*Math.PI*2;rod(chair,[0,.12,0],[Math.cos(a)*.3,.08,Math.sin(a)*.3],.015,M.dark);}block('Teacher_chair',.55,6.04,.55,.55);
  // Front-wall equipment: plotter, cutter, mobile charging cabinet.
  const equipment=group('Front_equipment',groups.Equipment);
  box(equipment,.6,.82,-6.44,1.4,.26,.54,M.white,true);box(equipment,.6,.77,-6.14,1.15,.085,.12,M.dark);for(const x of [0,1.2])box(equipment,x,.35,-6.44,.065,.7,.52,M.dark);
  box(equipment,-.85,.55,-6.45,.65,1.02,.56,M.white);for(let n=0;n<9;n++)box(equipment,-.85,.19+n*.086,-6.158,.5,.023,.007,M.gray);
  box(equipment,-2.1,.82,-6.38,1.22,.23,.47,M.ivory,true);box(equipment,-2.1,.92,-6.37,1.03,.022,.38,M.dark);
  block('Front_plotter',.6,-6.44,1.4,.54);block('Charging_cabinet',-.85,-6.45,.65,.56);block('Front_cutter',-2.1,-6.38,1.22,.47);

  // User-supplied finished wall art; source classroom photos and student work remain excluded.
  const decor=groups.Decor;
  const posterM=material('User_Quote_Posters','#ffffff',{map:posterAtlas,roughness:.9});
  for(const {page,x,y,z,width,rotation,wall,cardinal} of POSTER_LAYOUT){
    const g=group('QuotePoster_'+String(page).padStart(2,'0'),decor);
    g.position.set(x,y,z);g.rotation.y=rotation;
    g.userData={wall,cardinal,sourcePage:page,source:'Quotes Document.pdf'};
    mesh(posterGeometry(page,width),posterM,[0,0,0],[1,1,1],g);
  }
  picture(decor,3.47,2.39,-2.7,1.55,.19,signTexture('Think  •  Build  •  Share',[],'#547f73'),-Math.PI/2,false);
  picture(decor,-.3,1.54,6.974,1.55,.28,signTexture('The Maker Corner',['Imagine.   Prototype.   Try again.'], '#a17c51'),Math.PI);
  // Fire extinguisher and wall dispensers near preparation doorway.
  const extinguisher=group('FireExtinguisher',decor);extinguisher.position.set(3.35,.99,1.55);extinguisher.rotation.y=-Math.PI/2;
  const fireRed=material('Extinguisher_red','#d63d39');
  cyl(extinguisher,0,0,0,.085,.33,fireRed);ball(extinguisher,0,.165,0,.085,fireRed);ball(extinguisher,0,-.165,0,.085,fireRed);
  cyl(extinguisher,0,.03,0,.092,.18,M.white);cyl(extinguisher,0,-.095,0,.096,.027,M.dark);
  box(extinguisher,0,-.02,-.075,.12,.34,.07,M.dark);cyl(extinguisher,0,.245,0,.028,.075,M.steel);
  box(extinguisher,.027,.29,0,.16,.025,.048,M.steel);const lever=box(extinguisher,.022,.324,0,.15,.021,.043,M.steel);lever.rotation.z=-.16;
  const gauge=cyl(extinguisher,.032,.235,.05,.031,.022,M.white);gauge.rotation.x=Math.PI/2;
  const hosePath=new THREE.CatmullRomCurve3([new THREE.Vector3(-.04,.25,0),new THREE.Vector3(-.145,.22,.01),new THREE.Vector3(-.17,.08,.025),new THREE.Vector3(-.15,-.13,.045)]);
  mesh(new THREE.TubeGeometry(hosePath,20,.013,6,false),M.dark,[0,0,0],[1,1,1],extinguisher,'CurvedHose');
  box(extinguisher,-.15,-.16,.045,.035,.075,.033,M.dark);
  box(decor,3.35,1.4,3.49,.22,.35,.22,M.dark,true);box(decor,3.32,.32,3.68,.36,.6,.37,M.gray,true);
  block('Waste_bin',3.32,3.68,.36,.37,0,.65);
  // Blue floor boundary from the photographs.
  box(decor,2.67,.004,3.2,.018,.007,3.0,M.blueTape);box(decor,1.1,.004,4.71,3.16,.007,.018,M.blueTape);
  for(const z of [-5.5,-1.2,3.6]){box(decor,-3.47,.35,z,.018,.09,.06,M.white);box(decor,3.47,.35,z,.018,.09,.06,M.white);}
  const fairy=group('StringLights',decor);groups.StringLights=fairy;
  const bulbM=['#ff2028','#ff8300','#ffe000','#16d34d','#168bff','#913dff'].map((c,i)=>material('Fairy_bulb_'+i,c,{emissive:c,emissiveIntensity:.45,toneMapped:false}));
  function garland(a,b,baseY,sag){const points=[];const n=35;
    for(let i=0;i<=n;i++){const t=i/n;points.push(new THREE.Vector3(a[0]+(b[0]-a[0])*t,baseY-Math.sin(t*Math.PI)*sag,a[1]+(b[1]-a[1])*t));}
    const geo=new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),35,.005,3,false);mesh(geo,M.dark,[0,0,0],[1,1,1],fairy);
    for(let i=0;i<=n;i+=2){const p=points[i];ball(fairy,p.x,p.y-.015,p.z,.015,bulbM[(i/2)%bulbM.length]);}
  }
  for(const x of [-3.45,3.45])for(let z=-7;z<4.5;z+=2.3){garland([x,z],[x,Math.min(z+2.3,4.8)],3.07,.38);garland([x,z],[x,Math.min(z+2.3,4.8)],2.65,.23);}
  for(let x=-3.4;x<3.4;x+=1.7){garland([x,6.93],[x+1.7,6.93],2.49,.27);garland([x,-6.93],[x+1.7,-6.93],2.9,.32);}
  for(const a of ANCHORS){const g=group(a.name,groups.Anchors);g.position.set(...a.position);g.userData={...a};anchors[a.name]=g;}
  root.userData.colliders=colliders;
  // Merge sibling primitive meshes, preserving useful furniture and architecture names.
  function batch(g){for(const child of [...g.children])if(child.isGroup)batch(child);
    const buckets=new Map();for(const child of [...g.children])if(child.isMesh&&!child.name){const key=child.material.uuid+'|'+child.castShadow;const list=buckets.get(key)||[];list.push(child);buckets.set(key,list);}
    for(const list of buckets.values()){if(list.length<2)continue;const geometries=list.map(m=>{m.updateMatrix();return m.geometry.clone().applyMatrix4(m.matrix);});const geo=mergeGeometries(geometries);if(!geo){geometries.forEach(x=>x.dispose());continue;}
      const m=new THREE.Mesh(geo,list[0].material);m.name=g.name+'_'+list[0].material.name;m.castShadow=list[0].castShadow;m.receiveShadow=true;g.add(m);list.forEach(x=>g.remove(x));geometries.forEach(x=>x.dispose());}
  }
  batch(root);
  return {root,groups,anchors,colliders,dimensions:ROOM,ready:postersReady};
}

export function addClassroomLighting(scene) {
  const g=new THREE.Group();g.name='PreviewLighting';
  g.add(new THREE.HemisphereLight('#f3f4ea','#8b8173',2.25));
  const key=new THREE.DirectionalLight('#fff5dc',2.8);key.position.set(-2,8,-4);key.target.position.set(0,0,0);key.castShadow=true;
  key.shadow.mapSize.set(2048,2048);Object.assign(key.shadow.camera,{left:-9,right:9,top:10,bottom:-10,near:.1,far:25});key.shadow.bias=-.0003;key.shadow.normalBias=.025;key.shadow.radius=3;
  g.add(key,key.target);
  const fill=new THREE.DirectionalLight('#cceaff',.6);fill.position.set(0,2,-8);g.add(fill);
  scene.add(g);return g;
}
