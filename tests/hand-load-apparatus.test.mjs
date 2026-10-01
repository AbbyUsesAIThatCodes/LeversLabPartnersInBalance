import test from 'node:test';import assert from 'node:assert/strict';import * as THREE from 'three';
import {createApparatus,SCALE,BEAM_TOP,COLORS} from '../src/apparatus.js';
import {DEFAULT,STOP,GRAVITY,swapPositions,appliedTorque} from '../src/model.js';
import {gestureKind,gestureDelta} from '../src/gesture.js';
const pos=o=>o.getWorldPosition(new THREE.Vector3()),close=(a,b)=>assert.ok(Math.abs(a-b)<1e-6,`${a} != ${b}`);
test('hanging load and constant-size contacting hand retain identity through two swaps',()=>{
 const a=createApparatus(),load=a.weights.load.getObjectByName('hanging-load'),palm=a.weights.effort.getObjectByName('contacting-palm');
 for(const s of [DEFAULT,swapPositions(DEFAULT),swapPositions(swapPositions(DEFAULT))])for(const force of [25,200,1000]){
  a.update({...s,effortMass:force},STOP);assert.equal(a.weights.load.getObjectByName('hanging-load'),load);assert.equal(a.weights.effort.getObjectByName('contacting-palm'),palm);assert.deepEqual(a.weights.effort.scale.toArray(),[1,1,1]);assert.equal(load.material.color.getHex(),COLORS.load);assert.ok(a.pickable.includes(palm)&&a.pickable.includes(load));
 }
});
test('hand contact, vertical hanging load, clearance and force anchors survive bounds and both stops',()=>{
 const a=createApparatus();let cases=0;
 for(const mass of [25,100,1000])for(const angle of [-STOP,0,STOP])for(const pair of [[-250,250,-175],[-250,250,175],[-75,75,0]])for(const reverse of [false,true]){
  let s={load:pair[0],effort:pair[1],fulcrum:pair[2],loadMass:mass,effortMass:1000};if(reverse)s=swapPositions(s);a.update(s,angle);cases++;
  close(a.weights.load.getWorldQuaternion(new THREE.Quaternion()).angleTo(new THREE.Quaternion()),0);
  let contactY=Infinity;for(const skin of a.weights.effort.children.filter(m=>m.userData.handSurface&&!m.userData.noCue)){const points=skin.geometry.getAttribute('position');for(let i=0;i<points.count;i++){const p=a.beam.worldToLocal(skin.localToWorld(new THREE.Vector3().fromBufferAttribute(points,i)));contactY=Math.min(contactY,p.y);}}close(contactY,BEAM_TOP);
  let torque=0;for(const role of ['load','effort']){const p=pos(a.attachments[role]);close(p.x,s.fulcrum/SCALE+(s[role]-s.fulcrum)/SCALE*Math.cos(angle));torque-=(p.x-s.fulcrum/SCALE)*s[role+'Mass']*GRAVITY*SCALE/1e6;assert.ok(new THREE.Box3().setFromObject(a.weights[role]).min.y>0,'clears desk');}
  close(torque,appliedTorque(s,angle));
 }assert.equal(cases,54);
});
test('identification shells preserve original surfaces and deliberate vertical gestures increase setting downward',()=>{
 const a=createApparatus();assert.ok(a.cues.length);for(const c of a.cues){assert.equal(c.material.side,THREE.BackSide);assert.equal(c.visible,false);assert.equal(c.userData.attention,true);assert.equal(c.material.depthWrite,false);assert.deepEqual(c.raycast(),undefined);}
 assert.equal(gestureKind(3,4),'auto');assert.equal(gestureKind(15,15),'auto');assert.equal(gestureKind(3,20),'mass');assert.equal(gestureKind(20,3),'position');assert.equal(gestureDelta({kind:'mass',startY:20},0,30),50);assert.equal(gestureDelta({kind:'mass',startY:20},0,10),-50);
});
