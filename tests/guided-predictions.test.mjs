import test from 'node:test';import assert from 'node:assert/strict';
import {createNotebook,response,parseBackup} from '../src/notebook.js';
import {recordPrediction,freshPrediction,stalePredictions,setupMismatch} from '../src/guided.js';
import {PART_BY_ID} from '../src/curriculum.js';import {DEFAULT,swapPositions} from '../src/model.js';
test('setup changes require a new prediction even if the original setup is restored; originals survive',()=>{
 const b=createNotebook();b.part='Q5b';const p=PART_BY_ID.Q5b,s=p.initial;
 response(b,p.id,'prediction','A surprise is possible.','A');const original=recordPrediction(b,p,s);assert.ok(freshPrediction(b,p,s));
 assert.equal(stalePredictions(b,p,{...s,effortMass:225}),true);assert.equal(freshPrediction(b,p,s),false);assert.equal(b.guided.predictions[0].answers.A.prediction,'A surprise is possible.');
 const next=recordPrediction(b,p,s);assert.notEqual(next.id,original.id);assert.ok(freshPrediction(b,p,s));assert.doesNotThrow(()=>parseBackup(JSON.stringify(b)));
});
test('swap prediction names the planned post-swap geometry and retains pre-swap setup',()=>{
 const b=createNotebook();b.part='Q9b';for(const k of ['mass','roles','balance'])response(b,'Q9b',k,'My expectation.','A');const s=PART_BY_ID.Q9a.initial,p=recordPrediction(b,PART_BY_ID.Q9b,s);
 assert.deepEqual(p.originalSetup.state,s);assert.deepEqual(p.setup.state,swapPositions(s));assert.ok(freshPrediction(b,PART_BY_ID.Q9d,swapPositions(s)));assert.equal(stalePredictions(b,PART_BY_ID.Q9c,swapPositions(s)),false);
});
test('fixed experimental values gate tests without disabling controls; allowed search variable remains free',()=>{
 const p=PART_BY_ID.Q7b1;assert.deepEqual(setupMismatch(p,{...p.initial,effortMass:775}),[]);assert.deepEqual(setupMismatch(p,{...p.initial,loadMass:325}),['loadMass']);
});
test('malformed new prediction events cannot enter autosave or restored reports',()=>{
 const b=createNotebook();b.events.push({type:'prediction-recorded',part:'Q1a',driver:'A',at:new Date().toISOString(),predictionId:'missing',source:'Q5b',target:'Q5b'});assert.throws(()=>parseBackup(JSON.stringify(b)));
});
