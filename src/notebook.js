import { DEFAULT, valid, arm, measures } from './model.js';
import { PARTS, PART_BY_ID, LESSONS, REQUIRED_IDS } from './curriculum.js';
import {REPRESENTATION,representationValid} from './representation.js';
export const NOTEBOOK_KEY='lever-lab-notebook-v1';
export const FORMAT='lever-lab-notebook';
export const SCHEMA=1;
export const MAX_BACKUP_BYTES=12*1024*1024;
const clone=value=>structuredClone(value);
export const stamp=()=>new Date().toISOString();
export function createNotebook(build='Local Development') {
 const now=stamp();
 return {format:FORMAT,schema:SCHEMA,representation:REPRESENTATION,id:globalThis.crypto.randomUUID(),createdAt:now,updatedAt:now,build,mode:'free',part:'Q1a',lesson:'T0',returnTo:null,team:{mode:'solo',learners:[{id:'A',label:'Shared Classwork'},{id:'B',label:'Earlier Imported Response'}],driver:'A',reminderMinutes:0,rotationStarted:null},answers:{},history:[],trials:[],events:[],checks:{},visits:[],tutorials:{},workbenches:{},freeWorkbench:{state:{...DEFAULT},held:true},coverage:{Intro:false,Routine:false}};
}
export const learners=book=>book.team.mode==='pair'?book.team.learners:book.team.learners.slice(0,1);
export const ownerFor=(field,learner)=>field.personal?learner.id:'shared';
export function answer(book,id,key,owner='shared') {return book.answers[id]?.[owner]?.[key]??'';}
export function response(book,id,key,value,owner='shared',recordHistory=true) {
 const previous=answer(book,id,key,owner);
 if(JSON.stringify(previous)===JSON.stringify(value))return;
 book.answers[id]??={}; book.answers[id][owner]??={};
 book.answers[id][owner][key]=clone(value);
 if(recordHistory)book.history.push({id,key,owner,value:clone(value),previous:clone(previous),at:stamp(),driver:book.team.driver,representation:book.representation??REPRESENTATION});
 // Editing evidence invalidates only this latest check, not historical checks.
 invalidateChecks(book,[id]);book.updatedAt=stamp();
}
export function invalidateChecks(book,ids,reason='Evidence changed. Review this step again.') {
 for(const id of ids)if(book.checks[id])book.checks[id]={status:'Needs Recheck',complete:false,failures:[],missing:[reason],review:[],at:stamp()};
}
export const sameState=(a,b)=>!!a&&!!b&&Object.keys(DEFAULT).every(k=>a[k]===b[k]);
export function event(book,type,detail={}){book.events.push({type,at:stamp(),part:book.part,driver:book.team.driver,representation:book.representation??REPRESENTATION,...clone(detail)});book.updatedAt=stamp();}
export function rotate(book) {if(book.team.mode!=='pair')return;book.team.driver=book.team.driver==='A'?'B':'A';book.team.rotationStarted=stamp();event(book,'roles-swapped',{driver:book.team.driver});}
export function supportViewed(book,source,resource,from=book.mode==='challenge'?book.part:book.returnTo){event(book,'support-viewed',{source,resource,from:from??null,mode:book.mode,learners:learners(book).map(l=>l.id)});}
export function visitLesson(book,id,from=null){book.visits.push({lesson:id,from,at:stamp(),driver:book.team.driver});supportViewed(book,'lesson',id,from);book.lesson=id;book.returnTo=from;book.mode='learn';}
export function predictionReady(book,part) {
 if(!part.prediction)return true;
 const source=part.prediction===true?part:PART_BY_ID[part.prediction];
 return !!source && source.fields.filter(f=>f.prediction).every(f=>learners(book).every(l=>String(answer(book,source.id,f.key,l.id)).trim()));
}
export function snapshot(state,held=true,representation=REPRESENTATION){return {state:{...state},loadArm:arm(state,'load'),effortArm:arm(state,'effort'),held,representation};}
export function latestTrial(book,id){return book.trials.findLast(t=>t.part===id && t.completedAt && !t.interrupted);}
export function selectedQ7Trial(book,id){return book.trials.find(t=>t.id===id&&/^Q7b[1-4]$/.test(t.part)&&t.settled&&t.result==='balance'&&!t.interrupted);}
export function sketchComplete(drawing){return !!drawing&&Array.isArray(drawing.elements)&&drawing.elements.some(e=>e.kind==='beam'||e.kind==='stroke')&&['load','effort','fulcrum'].every(role=>drawing.elements.some(e=>e.role===role&&e.label?.trim()));}
export function evaluatePart(book,part,workbench) {
 const failures=[],review=[],missing=[];
 const values=book.answers[part.id]??{};
 for(const field of part.fields){
  const owners=field.personal?learners(book).map(l=>l.id):['shared'];
  for(const owner of owners){
   const v=values[owner]?.[field.key];const label=`${owner==='shared'?'Shared':book.team.learners.find(l=>l.id===owner)?.label}: ${field.label}`;
   if(field.type==='sketch'){if(!sketchComplete(v))missing.push(label+' needs a student-created beam/strokes and labeled load, effort, and fulcrum.');else review.push(label);continue;}
   if(v===undefined||v===null||String(v).trim()===''){missing.push(label);continue;}
   if(field.type==='number'&&!Number.isFinite(Number(v))){failures.push(label+' needs a number.');continue;}
   if(field.answer!==undefined){const okay=field.type==='number'?Math.abs(Number(v)-field.answer)<1e-8:v===field.answer;if(!okay)failures.push(label+' needs another look.');}
   if(field.review)review.push(label);
  }
 }
 const state=workbench?.state;
 if(part.setup){
  if(!state||!valid(state)||!workbench.held)failures.push('Prepare an allowed arrangement and hold it level.');
  else if(part.target&&!Object.keys(part.target).every(k=>state[k]===part.target[k]))failures.push('The setup does not yet match the requested controlled change.');
 }
 const t=latestTrial(book,part.trial?part.id:part.requiresTrial);
 const designState=part.trial?t?.setup.state:state;
 if(part.design&&designState){
  if(!valid(designState)||designState.fulcrum!==0||designState.loadMass<2*designState.effortMass)failures.push('The recorded design needs legal coordinates, a centered fulcrum, and load mass at least twice effort mass.');
  if(part.setup){for(const [key,want] of Object.entries({loadMass:state.loadMass,effortMass:state.effortMass,loadArm:arm(state,'load'),effortArm:arm(state,'effort')})){if(Number(values.shared?.[key])!==want)failures.push('Recorded '+key+' must match your own setup.');}}
 }
 if(part.trial||part.requiresTrial){
  if(!t)missing.push('A recorded, completed level-release trial.');
  else {
   const goal=part.goal??PART_BY_ID[part.requiresTrial]?.goal;
   if(goal&&t.result!==goal)failures.push('Your recorded trial has not met the target yet. Keep it as evidence and retry.');
   if(!t.settled)failures.push('Wait for the apparatus to settle before recording a result.');
   if(part.trial&&(!sameState(state,t.setup.state)||book.trials.some(x=>x.part===part.id&&!x.completedAt)))missing.push('Release and record a completed trial for this current arrangement.');
   const observation=values.shared?.observation;
   if(observation&&observation!=={balance:'Level',load:'Load Side Down',effort:'Effort Side Down'}[t.result])failures.push('Your observation differs from the recorded apparatus result. Review the trial.');
   if(values.shared?.finalMass!==undefined&&Number(values.shared.finalMass)!==t.setup.state.effortMass)failures.push('Final mass must match the recorded trial.');
   if(part.id==='Q13c'&&Number(values.shared?.arm)!==t.setup.effortArm)failures.push('The arm must match your successful lifting trial.');
  }
 }
 if(part.id==='Q10a')for(const type of ['side-view-used','controls-opened'])if(!book.events.some(e=>e.part===part.id&&e.type===type))missing.push(type==='side-view-used'?'Use Side View (or the side diagram).':'Open Controls and find Fulcrum Beam Position.');
 for(const id of part.references??[])if(!latestTrial(book,id))missing.push(`Record your own ${id} trial before linking its evidence.`);
 if(part.products||part.priorTrial){
  const prior=part.priorTrial?selectedQ7Trial(book,values.shared?.trialId):null;
  const productState=part.products??prior?.setup.state;
  if(!productState)missing.push('Choose a real saved balanced Q7 trial, or recreate one in Q7.');
  else {const m=measures(productState);for(const [key,want] of Object.entries({loadMass:productState.loadMass,effortMass:productState.effortMass,loadArm:m.loadArm,effortArm:m.effortArm,loadProduct:m.loadMoment,effortProduct:m.effortMoment})){if(Number(values.shared?.[key])!==want)failures.push(key+' does not match the selected source arrangement.');}}
 }
 if(part.designPrediction){const design=book.workbenches.Q14a?.state;if(!design)missing.push('Save your Q14a arrangement first.');else {const m=measures(design);if(Number(values.shared?.loadProduct)!==m.loadMoment||Number(values.shared?.effortProduct)!==m.effortMoment)failures.push('The products must represent your own Q14 design.');}}
 const status=failures.length?'Try Again':missing.length?'In Progress':review.length?'Recorded · Teacher Review':'Checked';
 return {status,failures,missing,review,at:stamp(),complete:!failures.length&&!missing.length};
}
export function checkPart(book,part,workbench){const check=evaluatePart(book,part,workbench);book.checks[part.id]=check;event(book,'part-checked',{part:part.id,id:part.id,check,setup:snapshot(workbench.state,workbench.held),answers:clone(book.answers[part.id]??{})});return check;}
export function revalidateChecks(book){for(const p of PARTS)if(book.checks[p.id]?.complete&&!evaluatePart(book,p,book.workbenches[p.id]).complete)invalidateChecks(book,[p.id],'Saved evidence no longer meets this check. Review this step again.');}
export function coverage(book){return REQUIRED_IDS.map(id=>({id,status:id==='Intro'||id==='Routine'?(book.coverage[id]?'Recorded':'Not Started'):(book.checks[id]?.status??'Not Started'),complete:id==='Intro'||id==='Routine'?book.coverage[id]:!!book.checks[id]?.complete}));}
// Validate before replacing any in-memory/current save. No imported HTML runs.
export function parseBackup(text){
 if(typeof text!=='string'||new TextEncoder().encode(text).length>MAX_BACKUP_BYTES)throw new Error('Backup exceeds the 12 MB limit.');
 let b;try{b=JSON.parse(text);}catch{throw new Error('This is not valid JSON.');}
 const fail=()=>{throw new Error('This file is not a supported, valid Lever Lab notebook. Your current work was kept.');};
 const obj=x=>x&&typeof x==='object'&&!Array.isArray(x);
 const str=(x,max=10000)=>typeof x==='string'&&x.length<=max;
 const walk=(x,depth=0)=>{if(depth>25)fail();if(x&&typeof x==='object'){for(const k of Object.keys(x)){if(['__proto__','constructor','prototype'].includes(k))fail();walk(x[k],depth+1);}}else if(typeof x==='string'&&x.length>100000)fail();};
 if(!obj(b))fail();walk(b);
 if(b.format!==FORMAT||b.schema!==SCHEMA||!str(b.id,100)||!str(b.build,300)||!str(b.createdAt,50)||!str(b.updatedAt,50)||!['free','learn','challenge'].includes(b.mode)||!PART_BY_ID[b.part]||!LESSONS.some(l=>l.id===b.lesson)||!(b.returnTo===null||PART_BY_ID[b.returnTo]))fail();
 if(!obj(b.team)||!['solo','pair'].includes(b.team.mode)||!['A','B'].includes(b.team.driver)||!Array.isArray(b.team.learners)||b.team.learners.length!==2||b.team.learners.some((l,i)=>!obj(l)||l.id!==['A','B'][i]||!str(l.label,80))||![0,2,3,5].includes(b.team.reminderMinutes)||!(b.team.rotationStarted===null||str(b.team.rotationStarted,50)))fail();
 for(const k of ['answers','checks','tutorials','workbenches','coverage'])if(!obj(b[k]))fail();
 for(const k of ['history','trials','events','visits'])if(!Array.isArray(b[k])||b[k].length>100000)fail();
 const wb=w=>obj(w)&&valid(w.state)&&typeof w.held==='boolean'&&(!('loadArm' in w)||w.loadArm===arm(w.state,'load'))&&(!('effortArm' in w)||w.effortArm===arm(w.state,'effort'));
 if(!wb(b.freeWorkbench)||Object.entries(b.workbenches).some(([id,w])=>!PART_BY_ID[id]||!wb(w)))fail();
 const validateDrawing=d=>obj(d)&&Array.isArray(d.elements)&&d.elements.length<=1000&&d.elements.every(e=>obj(e)&&['beam','load','effort','fulcrum','stroke','label'].includes(e.kind)&&(!e.role||['load','effort','fulcrum'].includes(e.role))&&str(e.label??'',100)&&Number.isFinite(e.x)&&Number.isFinite(e.y)&&e.x>=0&&e.x<=600&&e.y>=0&&e.y<=280&&(!e.points||(Array.isArray(e.points)&&e.points.length<=5000&&e.points.every(p=>Array.isArray(p)&&p.length===2&&p.every(v=>Number.isFinite(v)&&v>=0&&v<=600)))));
 const fieldValue=(f,v)=>f.type==='sketch'?validateDrawing(v):str(v,10000);
 const ownerValid=(f,owner)=>f.personal?['A','B'].includes(owner):owner==='shared';
 const answersValid=(id,owners)=>{if(!PART_BY_ID[id]||!obj(owners))return false;for(const [owner,answers]of Object.entries(owners)){if(!obj(answers))return false;for(const [key,value]of Object.entries(answers)){const f=PART_BY_ID[id].fields.find(f=>f.key===key);if(!f||!ownerValid(f,owner)||!fieldValue(f,value))return false;}}return true;};
 if(b.representation!==undefined&&!representationValid(b.representation))fail();
 for(const item of [...b.history,...b.events,...b.trials,...Object.values(b.workbenches)])if(item.representation!==undefined&&!representationValid(item.representation))fail();
 for(const [id,owners] of Object.entries(b.answers))if(!answersValid(id,owners))fail();
 for(const [id,t] of Object.entries(b.tutorials))if(!LESSONS.some(l=>l.id===id)||!obj(t)||('note' in t&&!str(t.note))||('drawing' in t&&!validateDrawing(t.drawing))||('completedAt' in t&&!str(t.completedAt,50)))fail();
 for(const t of b.trials)if(!obj(t)||!str(t.id,100)||!PART_BY_ID[t.part]?.trial||!wb(t.setup)||!['A','B'].includes(t.driver)||!str(t.startedAt,50)||!(t.result===null||['balance','load','effort'].includes(t.result))||typeof t.settled!=='boolean'||typeof t.interrupted!=='boolean'||!obj(t.predictions)||!Array.isArray(t.changes))fail();
 for(const t of b.trials){const p=PART_BY_ID[t.part],source=p.prediction===true?p.id:p.prediction;if(source?!answersValid(source,t.predictions):Object.keys(t.predictions).length)fail();if(t.completedAt!==null&&!str(t.completedAt,50))fail();if(t.settled&&(t.result!==measures(t.setup.state).direction||!t.completedAt))fail();for(const c of t.changes)if(!obj(c)||!wb(c.before)||!wb(c.after)||!str(c.at,50)||!['A','B'].includes(c.driver))fail();}
 for(const h of b.history){if(!obj(h)||!PART_BY_ID[h.id]||!str(h.key,100)||!str(h.at,50)||!['A','B'].includes(h.driver))fail();const f=PART_BY_ID[h.id].fields.find(f=>f.key===h.key);if(!f||!ownerValid(f,h.owner)||!fieldValue(f,h.value)||(h.previous!==''&&!fieldValue(f,h.previous)))fail();}
 const checkValid=ch=>obj(ch)&&str(ch.status,100)&&typeof ch.complete==='boolean'&&str(ch.at,50)&&['failures','missing','review'].every(k=>Array.isArray(ch[k])&&ch[k].every(v=>str(v)));
 for(const e of b.events){
  if(!obj(e)||!str(e.type,100)||!str(e.at,50)||!['A','B'].includes(e.driver)||!PART_BY_ID[e.part])fail();
  if(e.type==='part-checked'&&(!PART_BY_ID[e.id]||e.id!==e.part||!checkValid(e.check)||!wb(e.setup)||!answersValid(e.id,e.answers)))fail();
  if(e.type==='identify-picked'&&(!['effort','load','fulcrum'].includes(e.picked)||!['effort','load','fulcrum'].includes(e.expected)||typeof e.correct!=='boolean'||e.correct!==(e.picked===e.expected)||!Number.isInteger(e.streak)||e.streak<0||e.streak>3||(!e.correct&&e.streak!==0)))fail();
  if(e.type==='control-change'&&(!valid(e.before)||!valid(e.after)||typeof e.held!=='boolean'))fail();
  if(['trial-completed','trial-interrupted'].includes(e.type)&&(!str(e.trialId,100)||!b.trials.some(t=>t.id===e.trialId&&t.part===e.part)))fail();
  if(e.type==='session-settings'&&(!obj(e.team)||!['solo','pair'].includes(e.team.mode)||!Array.isArray(e.team.learners)||e.team.learners.length!==2||e.team.learners.some((l,i)=>!obj(l)||l.id!==['A','B'][i]||!str(l.label,80))))fail();
  if(e.type==='support-viewed'&&(!['lesson','help','tooltip','reference','math'].includes(e.source)||!str(e.resource,2000)||!(e.from===null||PART_BY_ID[e.from])||!['free','learn','challenge'].includes(e.mode)||!Array.isArray(e.learners)||!e.learners.length||e.learners.length>2||e.learners.some(id=>!['A','B'].includes(id))))fail();
 }
 for(const v of b.visits)if(!obj(v)||!LESSONS.some(l=>l.id===v.lesson)||!(v.from===null||PART_BY_ID[v.from])||!str(v.at,50))fail();
 for(const [id,ch] of Object.entries(b.checks))if(!PART_BY_ID[id]||!checkValid(ch))fail();
 if(typeof b.coverage.Intro!=='boolean'||typeof b.coverage.Routine!=='boolean')fail();
 return b;
}
export function loadNotebook(storage,build){let raw=null;try{raw=storage.getItem(NOTEBOOK_KEY);return {book:raw?parseBackup(raw):createNotebook(build),error:null,recovery:null,fresh:!raw};}catch(e){return {book:createNotebook(build),error:e.message,recovery:raw,fresh:false};}}
export function saveNotebook(storage,book){book.updatedAt=stamp();try{storage.setItem(NOTEBOOK_KEY,JSON.stringify(book));return {ok:true};}catch{return {ok:false,error:'Browser saving is unavailable or full. Download a backup now; keep this tab open.'};}}
