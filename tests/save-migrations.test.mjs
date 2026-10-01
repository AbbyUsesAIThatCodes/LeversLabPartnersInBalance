import test from 'node:test';import assert from 'node:assert/strict';
import {createNotebook,response,checkPart,snapshot,parseBackup,loadNotebook,saveNotebook,NOTEBOOK_KEY} from '../src/notebook.js';
import {PART_BY_ID} from '../src/curriculum.js';import {DEFAULT} from '../src/model.js';
import {SAVE_SCHEMA,QUESTION_REVISIONS,reconcileQuestions,anonymousReportNotebook} from '../src/save-contract.js';
const fixture=build=>{const b=createNotebook(build);response(b,'Q1a','role','Load');checkPart(b,PART_BY_ID.Q1a,snapshot(DEFAULT));response(b,'Q12a','ima','1');checkPart(b,PART_BY_ID.Q12a,snapshot(DEFAULT));b.schema=1;for(const k of ['assignment','originalBuild','currentBuild','migrations','archivedQuestions','completionHistory','representation'])delete b[k];for(const x of [...b.history,...b.events])delete x.representation;return b;};
const storage=(raw,failKey=null)=>{const data=new Map(raw===null?[]:[[NOTEBOOK_KEY,raw]]);return {data,getItem:k=>data.get(k)??null,setItem(k,v){if(k===failKey)throw Error('QuotaExceededError');data.set(k,v);},removeItem:k=>data.delete(k)};};
test('build 007 and 011 schema-1 fixtures migrate without deleting answers or historical completion',()=>{
 for(const build of ['synthetic-build-007','synthetic-build-011']){const old=fixture(build),next=parseBackup(JSON.stringify(old),{build:'synthetic-guided-build'});assert.equal(next.schema,SAVE_SCHEMA);assert.equal(next.originalBuild,build);assert.equal(next.currentBuild,'synthetic-guided-build');assert.deepEqual(next.answers,old.answers);assert.equal(next.checks.Q1a.status,'Needs Another Look');assert.equal(next.checks.Q1a.complete,false);assert.equal(next.checks.Q12a.complete,true);assert.ok(next.events.some(e=>e.type==='part-checked'&&e.id==='Q1a'&&e.check.complete));assert.equal(next.migrations.length,1);assert.deepEqual(parseBackup(JSON.stringify(next)),next);}
});
test('cosmetic/order edits retain completion; semantic edits, new questions, and retirement preserve evidence',()=>{
 const b=createNotebook();response(b,'Q12a','ima','1');checkPart(b,PART_BY_ID.Q12a,snapshot(DEFAULT));const check=structuredClone(b.checks.Q12a);
 const reordered=Object.fromEntries(Object.entries(QUESTION_REVISIONS).reverse());assert.deepEqual(reconcileQuestions(b,reordered),{changed:[],added:[],retired:[]});assert.deepEqual(b.checks.Q12a,check);
 const next={...reordered,Q12a:2,Q99a:1};delete next.Q1a;b.answers.Q1a={shared:{role:'Load'}};b.history.push({id:'Q1a',value:'Original synthetic response'});
 const changes=reconcileQuestions(b,next);assert.deepEqual(changes.changed,['Q12a']);assert.deepEqual(changes.added,['Q99a']);assert.deepEqual(changes.retired,['Q1a']);assert.equal(b.checks.Q12a.complete,false);assert.equal(b.checks.Q99a,undefined);assert.equal(b.archivedQuestions.Q1a.answers.shared.role,'Load');assert.equal(b.archivedQuestions.Q1a.history.at(-1).value,'Original synthetic response');assert.equal(b.completionHistory.Q12a[0].check.complete,true);
});
test('migration stages and validates the new copy, retaining the exact prior raw save',()=>{
 const raw=JSON.stringify(fixture('synthetic-build-011')),store=storage(raw),result=loadNotebook(store,'synthetic-guided-build');assert.equal(result.error,null);assert.equal(store.getItem(NOTEBOOK_KEY+'.previous'),raw);assert.equal(store.getItem(NOTEBOOK_KEY+'.staged'),null);assert.equal(JSON.parse(store.getItem(NOTEBOOK_KEY)).schema,SAVE_SCHEMA);assert.doesNotThrow(()=>parseBackup(store.getItem(NOTEBOOK_KEY)));
});
test('a retired question survives a validated import in the historical archive',()=>{
 const old=fixture('synthetic-prior-content'),catalog={...QUESTION_REVISIONS};delete catalog.Q1a;
 const next=parseBackup(JSON.stringify(old),{catalog});assert.equal(next.answers.Q1a,undefined);assert.equal(next.archivedQuestions.Q1a.answers.shared.role,'Load');assert.ok(next.archivedQuestions.Q1a.events.some(e=>e.type==='part-checked'&&e.check.complete));assert.notEqual(next.part,'Q1a');assert.doesNotThrow(()=>parseBackup(JSON.stringify(next),{catalog}));
});
test('quota failure at every write stage leaves original browser bytes intact and recoverable',()=>{
 const raw=JSON.stringify(fixture('synthetic-build-007'));
 for(const key of [NOTEBOOK_KEY+'.staged',NOTEBOOK_KEY+'.previous',NOTEBOOK_KEY]){const store=storage(raw,key),result=loadNotebook(store,'synthetic-guided-build');assert.equal(result.migrationPending,true);assert.match(result.error,/previous save was kept/);assert.equal(store.getItem(NOTEBOOK_KEY),raw);assert.equal(store.getItem(NOTEBOOK_KEY+'.staged'),null);assert.equal(result.book.answers.Q1a.shared.role,'Load');}
});
test('corrupt and unsupported future saves are never overwritten',()=>{
 for(const raw of ['{bad',JSON.stringify({...createNotebook(),schema:999}),JSON.stringify({...createNotebook(),assignment:{...createNotebook().assignment,version:999}})]){const store=storage(raw),result=loadNotebook(store,'synthetic-current');assert.equal(result.recovery,raw);assert.equal(store.getItem(NOTEBOOK_KEY),raw);assert.ok(result.error);}
 const b=createNotebook(),store=storage('original bytes');b.events.push({type:'part-checked'});assert.equal(saveNotebook(store,b).ok,false);assert.equal(store.getItem(NOTEBOOK_KEY),'original bytes');
});
test('anonymous reports omit structured partner names while portable historical backup remains intact',()=>{
 const b=createNotebook();b.team.learners[0].label='Synthetic Partner A';b.events.push({team:structuredClone(b.team)});const copy=anonymousReportNotebook(b);assert.equal(copy.team.learners[0].label,'Shared Classwork');assert.equal(copy.events[0].team.learners[0].label,'Shared Classwork');assert.equal(b.team.learners[0].label,'Synthetic Partner A');
});
