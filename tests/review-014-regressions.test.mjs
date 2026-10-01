import test from 'node:test';
import assert from 'node:assert/strict';
import {mount} from './helpers/learning-harness.mjs';
import {createNotebook,snapshot,response,parseBackup,NOTEBOOK_KEY,event,checkPart} from '../src/notebook.js';
import {recordPrediction} from '../src/guided.js';
import {PART_BY_ID} from '../src/curriculum.js';
import {DEFAULT} from '../src/model.js';
import {reportHTML} from '../src/report.js';
const seed=(part,state)=>{const b=createNotebook('synthetic-review-014');b.mode='challenge';b.guided.startedAt=new Date().toISOString();b.part=part;b.workbenches[part]=snapshot(state);return b;};
test('Q14 replacement prediction fields retain their schema owner and revised products round-trip',()=>{
 const state={...DEFAULT,loadMass:300},b=seed('Q14d',state);b.workbenches.Q14a=snapshot(state);
 response(b,'Q14c','loadProduct','30000');response(b,'Q14c','effortProduct','20000');response(b,'Q14c','prediction','Synthetic original prediction','A');recordPrediction(b,PART_BY_ID.Q14d,state);
 const env=mount(b);try{env.set({...state,load:-75,effort:225});const html=env.html();
  for(const [key,value] of [['loadProduct','22500'],['effortProduct','22500']]){const owner=html.match(new RegExp(`data-answer="${key}" data-owner="([^"]+)" data-response-part="Q14c"`))?.[1];assert.equal(owner,'shared');response(b,'Q14c',key,value,owner);}
  assert.doesNotThrow(()=>parseBackup(JSON.stringify(b)));assert.equal(b.history.filter(h=>h.key==='loadProduct').length,2);
 }finally{env.dispose();}
});
test('returning to a completed Q7 setup cannot reuse a trial from before the intervening edit',()=>{
 const s={...PART_BY_ID.Q7b1.initial,effortMass:400},b=seed('Q7b1',s);response(b,b.part,'predictedMass','400','A');response(b,b.part,'finalMass','400');response(b,b.part,'observation','Level');recordPrediction(b,PART_BY_ID.Q7b1,s);
 const env=mount(b);try{env.app.release();env.api.released();env.tick();assert.equal(env.read().checks.Q7b1.complete,true);const original=env.read().trials[0];env.app.hold();env.set({...s,effortMass:375});env.set(s);env.click('next');
  assert.equal(env.read().part,'Q7b1');assert.equal(env.read().checks.Q7b1.complete,false);assert.equal(env.read().trials[0].id,original.id);assert.equal(env.read().trials[0].result,'balance');assert.doesNotThrow(()=>parseBackup(env.raw()));
 }finally{env.dispose();}
});
test('the complete HTML report sanitizes historical session names without changing the source backup',()=>{
 const b=createNotebook();b.team.learners[0].label='Synthetic Old Partner Alpha';b.team.learners[1].label='Synthetic Old Partner Beta';event(b,'session-settings',{team:structuredClone(b.team)});b.archivedQuestions.Q99a={answers:{},history:[],trials:[],events:[structuredClone(b.events[0])]};
 const original=JSON.stringify(b),html=reportHTML(b);assert.equal(html.includes('Synthetic Old Partner'),false);assert.equal(JSON.stringify(b),original);assert.ok(html.includes('Shared Classwork'));
});
test('anonymous report history removes generated name prefixes while retaining authored evidence',()=>{
 const b=createNotebook();b.team.learners[0].label='Synthetic Prior Learner';event(b,'session-settings',{team:structuredClone(b.team)});
 response(b,'Q12f','reason','Synthetic authored explanation.','A');checkPart(b,PART_BY_ID.Q12f,snapshot(DEFAULT));
 const check=structuredClone(b.checks.Q12f);b.completionHistory.Q12f=[{contentRevision:1,check}];b.archivedQuestions.Q99a={answers:{},history:[],trials:[],events:[],check:structuredClone(check)};
 b.team.learners[0].label='Shared Classwork';const original=JSON.stringify(b),html=reportHTML(b);assert.equal(html.includes('Synthetic Prior Learner'),false);assert.ok(html.includes('Synthetic authored explanation.'));assert.equal(JSON.stringify(b),original);
});
test('mount and later autosaves cannot replace legacy bytes while the migration archive is blocked; retry recovers',async()=>{
 const b=seed('Q12a',DEFAULT);b.schema=1;for(const key of ['assignment','originalBuild','currentBuild','migrations','archivedQuestions','completionHistory','representation'])delete b[key];const raw=JSON.stringify(b);let blocked=true;
 const env=mount(b,DEFAULT,{beforeWrite(key){if(blocked&&key===NOTEBOOK_KEY+'.migration-original')throw Error('Synthetic quota failure');}});
 try{assert.equal(env.raw(),raw);assert.match(env.node('#save-status').textContent,/Migration|Backup/);env.set({...DEFAULT,loadMass:300});env.click('session');assert.equal(env.raw(),raw);assert.match(env.node('#session-body').innerHTML,/Download Pre-Update Copy/);assert.match(env.node('#session-body').innerHTML,/Retry Saving/);
  const replacement=createNotebook();await env.node('#restore-backup').handlers.change({target:{files:[{size:100,text:async()=>JSON.stringify(replacement)}]}});env.node('[data-lab="restore"]').onclick();assert.equal(env.raw(),raw);assert.match(env.node('#restore-preview').textContent,/not applied|before restoring/i);
  blocked=false;env.click('retry-save');assert.equal(env.raw(NOTEBOOK_KEY+'.migration-original'),raw);assert.equal(env.read().schema,2);assert.equal(env.read().workbenches.Q12a.state.loadMass,300);assert.doesNotThrow(()=>parseBackup(env.raw()));env.set({...DEFAULT,loadMass:325});assert.equal(env.raw(NOTEBOOK_KEY+'.migration-original'),raw);
 }finally{env.dispose();}
});
