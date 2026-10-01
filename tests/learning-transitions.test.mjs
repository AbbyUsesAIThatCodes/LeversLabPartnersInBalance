import test from 'node:test';import assert from 'node:assert/strict';
import {mount} from './helpers/learning-harness.mjs';
import {createNotebook,snapshot,parseBackup,response,evaluatePart} from '../src/notebook.js';
import {PART_BY_ID} from '../src/curriculum.js';import {DEFAULT,restingAngle} from '../src/model.js';import {reportHTML} from '../src/report.js';
const wanted={load:-75,effort:225,fulcrum:0,loadMass:300,effortMass:100};
const seed=(part,state)=>{const b=createNotebook('synthetic-regression');b.mode='challenge';b.part=part;b.workbenches[part]=snapshot(state);return b;};
test('graphical identification requires three consecutive choices and preserves errors across Learn return',()=>{
 const env=mount(seed('Q1a',DEFAULT));try{
  assert.equal(env.api.identifyPart('effort'),true);assert.equal(env.read().part,'Q1a');
  env.api.identifyPart('fulcrum');assert.equal(env.read().part,'Q1b');assert.equal(env.read().checks.Q1b.complete,false);
  env.api.identifyPart('effort');env.click('help');env.click('return');assert.equal(env.read().part,'Q1a');
  env.api.identifyPart('load');env.api.identifyPart('fulcrum');const b=env.read();assert.ok(['Q1a','Q1b','Q1c'].every(id=>b.checks[id].complete));assert.equal(env.api.isIdentifying(),false);assert.equal(b.events.filter(e=>e.type==='identify-picked'&&!e.correct).length,1);assert.doesNotThrow(()=>parseBackup(JSON.stringify(b)));
 }finally{env.dispose();}
});
test('restoring and reopening an active design preserves its exact apparatus and imported history',async()=>{
 const imported=seed('Q14a',wanted);response(imported,'Q14a','loadMass','300');const env=mount();
 try{env.click('session');await env.node('#restore-backup').handlers.change({target:{files:[{size:100,text:async()=>JSON.stringify(imported)}]}});env.node('[data-lab="restore"]').onclick();assert.deepEqual(env.get().state,wanted);assert.deepEqual(env.read().workbenches.Q14a.state,wanted);assert.deepEqual(env.read().history,imported.history);assert.doesNotThrow(()=>parseBackup(JSON.stringify(env.read())));}finally{env.dispose();}
 const reopen=mount(imported);try{assert.deepEqual(reopen.get().state,wanted);assert.deepEqual(reopen.read().workbenches.Q14a.state,wanted);}finally{reopen.dispose();}
});
test('Reset and unexpected held-state transitions interrupt a pending trial without fabricating balance',()=>{
 for(const explicit of [true,false]){const state={...DEFAULT,loadMass:300},b=seed('Q14d',state);b.workbenches.Q14a=snapshot(state);response(b,'Q14c','prediction','Synthetic prediction','A');const env=mount(b);
  try{assert.equal(env.api.beforeRelease(),true);env.app.release();env.api.released();if(explicit)env.api.resetting();env.app.hold();if(explicit)env.set(DEFAULT);env.tick();const t=env.read().trials.at(-1);assert.equal(t.interrupted,true);assert.equal(t.settled,false);assert.equal(t.result,null);assert.equal(t.setup.state.loadMass,300);assert.doesNotThrow(()=>parseBackup(JSON.stringify(env.read())));}finally{env.dispose();}
 }
});
test('Q14 constraints use the recorded trial; untested current edits cannot complete the task',()=>{
 const equal={...DEFAULT,effort:100,loadMass:100},b=seed('Q14d',equal);b.workbenches.Q14a=snapshot(equal);response(b,'Q14c','prediction','Synthetic prediction','A');response(b,'Q14d','observation','Level');response(b,'Q14d','notes','Synthetic observation','A');const env=mount(b);
 try{env.app.release();env.api.released();env.setMotion({angle:restingAngle(equal),velocity:0});env.tick();env.app.hold();env.set({...equal,loadMass:200});let check=evaluatePart(env.read(),PART_BY_ID.Q14d,env.get());assert.equal(check.complete,false);assert.ok(check.failures.some(x=>x.includes('recorded design')));assert.ok(check.missing.some(x=>x.includes('current arrangement')));
  env.set({...DEFAULT});env.app.release();env.api.released();env.setMotion({angle:0,velocity:0});env.tick();assert.equal(evaluatePart(env.read(),PART_BY_ID.Q14d,env.get()).complete,true);assert.equal(env.read().trials.length,2);
 }finally{env.dispose();}
});
test('setup changes invalidate the displayed current check while preserving historical check evidence',()=>{
 const correct=PART_BY_ID.Q3a.target,env=mount(seed('Q3a',correct));try{env.click('check');const history=env.read().events.find(e=>e.type==='part-checked');assert.equal(history.check.complete,true);env.set({...correct,effort:150});assert.equal(env.read().checks.Q3a.complete,false);assert.equal(env.read().checks.Q3a.status,'Needs Recheck');assert.match(env.node('#lab-feedback').innerHTML,/Needs Recheck/);assert.deepEqual(env.read().events.find(e=>e.type==='part-checked'),history);assert.doesNotThrow(()=>parseBackup(JSON.stringify(env.read())));}finally{env.dispose();}
});
test('malformed event-specific payloads are rejected before replacing or exporting the current notebook',async()=>{
 const env=mount();try{env.click('session');const before=env.read();for(const payload of [{type:'part-checked',id:'Q1a'},{type:'control-change',before:DEFAULT},{type:'trial-completed',trialId:'absent'},{type:'session-settings',team:{}},{type:'support-viewed',source:'lesson'}]){const b=createNotebook();b.events.push({part:'Q1a',at:new Date().toISOString(),driver:'A',...payload});assert.throws(()=>parseBackup(JSON.stringify(b)));await env.node('#restore-backup').handlers.change({target:{files:[{size:100,text:async()=>JSON.stringify(b)}]}});assert.equal(env.node('[data-lab="restore"]').disabled,true);env.node('[data-lab="restore"]').onclick();assert.deepEqual(env.read(),before);}assert.doesNotThrow(()=>reportHTML(env.read()));}finally{env.dispose();}
});
test('reopening an older notebook cannot preserve a stale successful check',()=>{
 const correct=PART_BY_ID.Q3a.target,b=seed('Q3a',{...correct,effort:150});b.checks.Q3a=evaluatePart(b,PART_BY_ID.Q3a,snapshot(correct));assert.equal(b.checks.Q3a.complete,true);const env=mount(b);try{assert.equal(env.read().checks.Q3a.complete,false);assert.equal(env.read().checks.Q3a.status,'Needs Recheck');assert.equal(env.get().state.effort,150);}finally{env.dispose();}
});
test('top-level Learn and generic Help record conservative exposure with learner and challenge context',()=>{
 const b=seed('Q3b',DEFAULT);b.team.mode='pair';const env=mount(b);try{env.click('mode-learn');env.api.supportViewed('help','General Help');env.api.supportViewed('tooltip','Load Arm');env.api.supportViewed('reference','Balance And Advantage');const book=env.read();assert.equal(book.returnTo,'Q3b');assert.ok(book.visits.some(v=>v.from==='Q3b'));assert.deepEqual(book.events.filter(e=>e.type==='support-viewed').map(e=>e.source),['lesson','help','tooltip','reference']);assert.ok(book.events.filter(e=>e.type==='support-viewed').every(e=>e.from==='Q3b'&&e.learners.join(',')==='A'));const html=reportHTML(book);assert.match(html,/General Help/);assert.match(html,/Missing logs do not establish independent performance/);assert.doesNotThrow(()=>parseBackup(JSON.stringify(book)));}finally{env.dispose();}
});
