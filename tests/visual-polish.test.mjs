import test from 'node:test';import assert from 'node:assert/strict';import * as THREE from 'three';
import {createApparatus} from '../src/apparatus.js';import {DEFAULT} from '../src/model.js';import {ATTENTION_COLORS} from '../src/attention.js';import {partIcon} from '../src/part-icons.js';
test('the standalone hand has five distinct shaped digits and an unchanged silhouette at every force setting',()=>{
 const a=createApparatus(),hand=a.weights.effort;assert.equal(hand.getObjectByName('forearm'),undefined);
 assert.deepEqual(hand.children.filter(m=>m.userData.digit).map(m=>m.userData.digit).sort(),['index','little','middle','ring','thumb']);assert.equal(hand.children.filter(m=>m.name.endsWith('-nail')).length,5);
 let previous;for(const mass of [25,100,1000]){a.update({...DEFAULT,effortMass:mass},0);const b=new THREE.Box3().setFromObject(hand).getSize(new THREE.Vector3()).toArray();if(previous)assert.deepEqual(b,previous);previous=b;}
 for(const m of hand.children.filter(m=>m.userData.handSurface)){assert.ok(m.geometry.getAttribute('position').array.every(Number.isFinite));assert.notEqual(m.geometry.type,'CapsuleGeometry');}
});
test('attention is exterior-only, input-transparent, sparse, and static with reduced motion',()=>{
 const a=createApparatus(),colors=a.pickable.map(m=>m.material.color.getHex()),points=[];for(const root of [a.moving,a.base])root.traverse(o=>{if(o.isPoints)points.push(o);});assert.equal(points.length,3);assert.equal(points.reduce((n,p)=>n+p.geometry.getAttribute('position').count,0),36);
 for(const cue of a.cues){assert.equal(cue.material.side,THREE.BackSide);assert.equal(cue.material.depthWrite,false);assert.equal(a.pickable.includes(cue),false);assert.equal(cue.raycast(),undefined);}
 a.attention.setRoles(['effort']);a.attention.update(100,false,{role:'effort',correct:false},1000);assert.equal(points.filter(p=>p.visible).length,1);assert.ok(a.cues.filter(c=>c.visible).every(c=>c.material.color.getHex()===ATTENTION_COLORS.incorrect));
 a.attention.update(1100,false,null,0);assert.ok(a.cues.filter(c=>c.visible).every(c=>c.material.color.getHex()===ATTENTION_COLORS.invite));a.attention.update(1200,true,null,0);assert.ok(points.every(p=>!p.visible));assert.equal(a.attention.update(1400,true,null,0),false);assert.deepEqual(a.pickable.map(m=>m.material.color.getHex()),colors);
});
test('part buttons use recognizable line drawings with decorative SVG semantics',()=>{
 for(const role of ['load','effort','fulcrum']){const icon=partIcon(role);assert.match(icon,/aria-hidden="true"/);assert.match(icon,/focusable="false"/);assert.match(icon,new RegExp(`data-icon="${role}"`));assert.match(icon,/<path/);assert.doesNotMatch(icon,/&#/);}
});
