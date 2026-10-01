import * as THREE from "three";
import { massKey, POINTER } from "./model.js";
import {createEffortHand} from './effort-hand.js';
import {createAttention} from './attention.js';
export const HEIGHT = 9,
  SCALE = 25,
  BEAM_TOP = 0.42;
export const COLORS = Object.freeze({
  effort: 0x257e73,
  fulcrum: 0x7952a0,
  load: 0xbf8630,
});

// ThreeKindsOfLevers rail and support, with role-owned attachments.
// Ideal point loads act at the labeled beam-axis anchors. The seated crate is
// their visual representation, not a simulated rigid-body center of mass.
export function createApparatus() {
  const moving = new THREE.Group(),
    base = new THREE.Group(),
    beam = new THREE.Group();
  const meshes = [],
    pickable = [],
    attachments = {},
    weights = {};
  moving.name = "moving-apparatus";
  base.name = "fulcrum-support";
  beam.name = "beam";
  moving.add(beam);
  const brass = 0xb68d46,
    steel = 0x8ba0a0;
  function mesh(parent, geometry, color, xyz, role, name) {
    const item = new THREE.Mesh(
      geometry,
      new THREE.MeshStandardMaterial({
        color,
        metalness: 0.45,
        roughness: 0.4,
      }),
    );
    item.position.set(...xyz);
    item.castShadow = item.receiveShadow = true;
    item.userData.part = role;
    item.name = name || role || "rail";
    parent.add(item);
    meshes.push(item);
    if (role) pickable.push(item);
    return item;
  }
  const block = (p, w, h, d, c, x, y, z, r, n) =>
    mesh(p, new THREE.BoxGeometry(w, h, d), c, [x, y, z], r, n);
  const cylinder = (p, r, h, c, x, y, z, role, n) =>
    mesh(p, new THREE.CylinderGeometry(r, r, h, 32), c, [x, y, z], role, n);
  block(base, 3.7, 0.4, 4.2, COLORS.fulcrum, 0, 0.2, 0, "fulcrum");
  for (const z of [-1.28, 1.28]) {
    block(
      base,
      0.5,
      HEIGHT - 0.4,
      0.48,
      steel,
      0,
      (HEIGHT - 0.4) / 2 + 0.4,
      z,
      "fulcrum",
    );
    mesh(
      base,
      new THREE.TorusGeometry(0.4, 0.16, 12, 32),
      brass,
      [0, HEIGHT, z],
      "fulcrum",
    );
    for (const x of [-1.35, 1.35])
      cylinder(base, 0.14, 0.1, brass, x, 0.45, z, "fulcrum");
  }
  const axle = cylinder(base, 0.23, 3.4, 0xcbd6d4, 0, HEIGHT, 0, "fulcrum");
  axle.rotation.x = Math.PI / 2;
  for (const z of [-1.8, 1.8]) {
    const cap = cylinder(
      base,
      0.36,
      0.16,
      COLORS.fulcrum,
      0,
      HEIGHT,
      z,
      "fulcrum",
    );
    cap.rotation.x = Math.PI / 2;
  }
  for (const y of [-BEAM_TOP + 0.08, BEAM_TOP - 0.08])
    block(beam, 25.3, 0.16, 1.7, steel, 0, y, 0);
  for (let x = -12; x <= 12; x++) block(beam, 0.15, 0.52, 1.6, steel, x, 0, 0);
  for (const x of [-12.7, 12.7]) block(beam, 0.24, 0.9, 1.85, brass, x, 0, 0);
  for (let i = -12; i <= 12; i++)
    block(
      beam,
      0.028,
      i % 2 === 0 ? 0.22 : 0.12,
      0.018,
      0x193e39,
      i,
      0.19,
      0.865,
    );
  const pointer = new THREE.Group();
  pointer.name = "balance-pointer";
  moving.add(pointer);
  const pointerLength = POINTER.length / SCALE;
  const hub = cylinder(pointer, 0.21, 0.45, brass, 0, 0, 2.025, null, "pointer-hub");
  hub.rotation.x = Math.PI / 2;
  block(pointer, 0.16, pointerLength, 0.16, brass, 0, -pointerLength / 2, 2.2, null, "pointer-rod");
  const bob = cylinder(pointer, 0.55, 0.3, brass, 0, -pointerLength, 2.2, null, "pointer-bob");
  bob.rotation.x = Math.PI / 2;
  const face = cylinder(pointer, 0.36, 0.035, COLORS.fulcrum, 0, -pointerLength, 2.37, null, "pointer-face");
  face.rotation.x = Math.PI / 2;
  for (const role of ["load", "effort"]) {
    const anchor = new THREE.Group();
    anchor.name = `${role}-attachment`;
    moving.add(anchor);
    attachments[role] = anchor;
    mesh(
      anchor,
      new THREE.SphereGeometry(0.22, 16, 12),
      brass,
      [0, 0, 0],
      role,
      "application-point",
    );
    const weight = new THREE.Group();
    weight.name = `${role}-weight`;
    weight.userData.part = role;
    anchor.add(weight);
    weights[role] = weight;
    if (role === "load") {
      cylinder(anchor,0.055,1.15,0xc4d1cc,0,-0.575,0,role,"load-cord");
      mesh(anchor,new THREE.TorusGeometry(0.2,0.065,8,24),brass,[0,-1.27,0],role,"load-hook");
      cylinder(anchor,0.12,0.23,brass,0,-1.48,0,role,"load-neck");
      cylinder(weight,0.48,0.55,COLORS.load,0,-0.275,0,role,"hanging-load");
      for(const y of [0,-0.55])cylinder(weight,0.53,0.08,brass,0,y,0,role,"weight-rim");
    } else {
      createEffortHand((geometry,color,xyz,name)=>mesh(weight,geometry,color,xyz,role,name));
    }
  }
  const attention=createAttention(pickable,{load:weights.load,effort:weights.effort,fulcrum:base}),cues=attention.cues;

  function update(state, angle) {
    const pivot = state.fulcrum / SCALE;
    moving.position.set(pivot, HEIGHT, 0);
    moving.rotation.z = angle;
    base.position.x = pivot;
    beam.position.x = -pivot;
    for (const role of ["load", "effort"]) {
      const anchor = attachments[role],
        size = Math.cbrt(state[massKey(role)] / 100);
      anchor.position.set((state[role] - state.fulcrum) / SCALE, 0, 0);
      anchor.rotation.z = role === "load" ? -angle : 0;
      weights[role].scale.setScalar(role === "load" ? size : 1);
      if(role === "effort")weights[role].rotation.y=state.effort>state.fulcrum?Math.PI*.8:-Math.PI*.8;
      weights[role].position.y = role === "load" ? -1.6 : BEAM_TOP;
    }
    moving.updateMatrixWorld(true);
    base.updateMatrixWorld(true);
  }
  return {
    cues,
    attention,
    moving,
    base,
    beam,
    pointer,
    meshes,
    pickable,
    attachments,
    weights,
    update,
  };
}
