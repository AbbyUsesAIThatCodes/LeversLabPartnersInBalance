import test from 'node:test';
import assert from 'node:assert/strict';
import {measures,effortPushNewtons,loadWeightNewtons,advance,appliedTorque,DEFAULT} from '../src/model.js';
import {createNotebook,response,snapshot,parseBackup} from '../src/notebook.js';
import {adoptRepresentation,REPRESENTATION,LEGACY_REPRESENTATION} from '../src/representation.js';
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-10,`${a} != ${b}`);
test('calibrated push preserves every packet balance case and the reciprocal force bridge',()=>{
 const cases=[[400,200,100,200],[400,400,100,100],[300,400,100,75],[300,300,100,100],[300,200,100,150],[300,150,100,200],[200,100,100,200],[200,150,150,200],[200,200,200,200],[300,100,75,225]];
 for(const [loadMass,effortMass,loadArm,effortArm] of cases){const s={loadMass,effortMass,load:-loadArm,effort:effortArm,fulcrum:0},m=measures(s);assert.equal(m.direction,'balance');close(m.effortForce,m.loadForce/m.ima);close(appliedTorque(s),0);}
 close(effortPushNewtons({...DEFAULT,effortMass:100}),.981);
 close(loadWeightNewtons({...DEFAULT,loadMass:100}),.981);
 const off={load:-150,effort:150,fulcrum:-50,loadMass:300,effortMass:150};assert.equal(measures(off).direction,'balance');
});
test('stronger push changes applied force without adding an effort-side point mass',()=>{
 const a={...DEFAULT,effortMass:100},b={...a,effortMass:200},dt=1e-6;
 const va=advance(a,{angle:0,velocity:0},dt).velocity,vb=advance(b,{angle:0,velocity:0},dt).velocity;
 const c={...a,effortMass:300},vc=advance(c,{angle:0,velocity:0},dt).velocity;
 close(vb-va,vc-vb);
});
test('legacy evidence keeps its representation and values when the new apparatus is introduced',()=>{
 const b=createNotebook();delete b.representation;response(b,'Q3b','prediction','Original hanging-effort prediction','A');delete b.history[0].representation;b.workbenches.Q3b=snapshot(DEFAULT);delete b.workbenches.Q3b.representation;
 assert.equal(adoptRepresentation(b),true);assert.equal(b.history[0].representation,LEGACY_REPRESENTATION);assert.equal(b.history[0].value,'Original hanging-effort prediction');assert.equal(b.representation,REPRESENTATION);
 response(b,'Q3b','prediction','Revised applied-push prediction','A');assert.equal(b.history.at(-1).representation,REPRESENTATION);assert.equal(b.history[0].value,'Original hanging-effort prediction');assert.doesNotThrow(()=>parseBackup(JSON.stringify(b)));assert.equal(adoptRepresentation(b),false);
});
