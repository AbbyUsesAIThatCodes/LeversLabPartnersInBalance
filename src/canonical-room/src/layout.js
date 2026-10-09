// Metres, right-handed coordinates, +Y up. Window wall = -Z; teacher nook = +Z.
// Photo-informed estimates, not surveyed dimensions. Keep these placements editable.
export const ROOM = Object.freeze({width: 7, length: 14, height: 3.6, nookStart: 4.8, nookHeight: 2.65});
// North = window wall (-Z), west = -X. Keep the south opening and its closed leaf aligned.
export const SOUTH_DOOR = Object.freeze({x:-2.85,z:6.96,width:1.1,height:2.24});
// Clockwise perimeter order. The north door/window and lower nook constrain spacing.
// Alternate heights continuously, including the wrap from page 38 back to page 1.
const placements = [
  ...[-3.14,-1.08,1.21,2.13,3.05].map((x,i)=>({wall:'front',cardinal:'north',x,z:-6.973,width:[.58,.76,.76,.76,.66][i],rotation:0})),
  ...[-6.45,-5.26,-4.06,-2.95,-2.1,-.48,.72,1.91,3.11,4.3,5.95,6.63].map(z=>({wall:'other',cardinal:'east',x:3.473,z,width:z>4.8?.66:(z===-2.95||z===-2.1)?.76:.84,rotation:-Math.PI/2})),
  ...[3.12,2.3,1.48,.8,.12,-.56,-1.24,-1.92].map(x=>({wall:'back',cardinal:'south',x,z:6.973,width:.6,rotation:Math.PI})),
  ...[6.45,5.51,...Array.from({length:11},(_,i)=>4.3-i*1.075)].map(z=>({wall:'left',cardinal:'west',x:-3.473,z,width:z>4.8?.66:.84,rotation:Math.PI/2})),
];
export const POSTER_LAYOUT = Object.freeze(placements.map((p,i)=>Object.freeze({
  ...p,page:i+1,y:p.z>4.8?(i%2===0?2.37:1.94):(i%2===0?3.15:(p.cardinal==='east'&&p.z===.72?3.04:2.83)),
})));
export const BENCHES = [-4.5, -2.1, .3, 2.7].map((z, i) => ({id: `Workbench_${i + 1}`, x: -2.24, z, width: 2.35, depth: .95, height: .94}));
// Four separate tops in two pairs, checked against original photo 1000008855.jpg.
export const TABLES = [-3.8, .0].flatMap((z, pair) => [-1,1].map((side,i)=>({id:`Desk_Pair_${pair+1}_${i+1}`,pair:pair+1,x:1.05+side*.5525,z,width:1.08,depth:1.5,height:.9})));
export const VIEWS = {
  entrance: {label: 'Down The Classroom', position: [0, 1.65, 4.35], target: [.1, 1.5, -6.8]},
  board: {label: 'ViewBoard & Tables', position: [-.3, 1.65, 1.1], target: [3.25, 1.6, -1.5]},
  workshop: {label: 'Engineering Benches', position: [-.74, 1.65, -1.36], target: [-3.15, 1.1, -2.1]},
  maker: {label: 'Printer Corner', position: [-.4, 1.65, 4.4], target: [-.3, 1.25, 6.8]},
  window: {label: 'From The Window', position: [0, 1.65, -5.9], target: [0, 1.5, 5.8]},
};
export const ANCHORS = [
  {name: 'PlayerSpawn', position: VIEWS.entrance.position, role: 'camera_spawn', note: 'Eye height, facing -Z'},
  {name: 'GameAnchor_Lever', position: [-2.24, .983, .3], role: 'tabletop', note: 'Centre of third wooden workbench; top surface'},
  {name: 'GameAnchor_Design', position: [TABLES[2].x, .9325, TABLES[2].z], role: 'tabletop', note: 'Centre of near pair left desk; top surface'},
  {name: 'GameAnchor_Skimmer', position: [0, .015, -1.5], role: 'floor', note: 'Centre aisle; no implicit race length'},
  {name: 'ViewBoard_Surface', position: [3.025, 1.79, -1.5], role: 'display', note: 'Screen centre; faces -X'},
  {name: 'MakerCorner', position: [-.3, 1.35, 6.4], role: 'point_of_interest'},
];
