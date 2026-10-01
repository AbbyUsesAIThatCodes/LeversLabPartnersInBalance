import {PARTS} from './curriculum.js';
import {HISTORICAL_PARTS} from './question-history.js';
import {REPRESENTATION,LEGACY_REPRESENTATION} from './representation.js';
export const APP_ID='lever-lab';
export const ASSIGNMENT_ID='r06-levers-part-1-and-2';
export const SAVE_SCHEMA=2;
export const CONTENT_VERSION=2;
// These objectives/evidence labels change with the applied-push representation.
// Coordinate-only and unchanged IMA tasks retain their existing content revision.
const revised=new Set(['Q1a','Q1b','Q1d','Q3d','Q4d','Q5b','Q5c','Q5d','Q6a','Q6b','Q6c','Q7a','Q7b1','Q7b2','Q7b3','Q7b4','Q7c','Q7d','Q8b1','Q8b2','Q8b3','Q8c','Q8e','Q9a','Q9b','Q9c','Q9d','Q9e','Q10b','Q10c','Q10e','Q11a','Q11b','Q11c','Q11d','Q13a','Q13b','Q13c','Q13d','Q14a','Q14b','Q14c','Q14d','Q14e']);
export const QUESTION_REVISIONS=Object.freeze({Intro:2,Routine:2,...Object.fromEntries(PARTS.map(p=>[p.id,revised.has(p.id)?2:1]))});
export const guidanceRecord=()=>({startedAt:null,calibrationChoice:'',teaching:{},predictions:[]});
export const assignmentRecord=()=>({appId:APP_ID,id:ASSIGNMENT_ID,version:CONTENT_VERSION,questions:{...QUESTION_REVISIONS}});
export function reconcileQuestions(book,catalog=QUESTION_REVISIONS){
 const before=book.assignment?.questions??Object.fromEntries(['Intro','Routine',...Object.keys(HISTORICAL_PARTS)].map(id=>[id,1]));
 const changed=[],added=[],retired=[];
 book.archivedQuestions??={};book.completionHistory??={};
 for(const [id,revision] of Object.entries(catalog)){
  if(before[id]===undefined){added.push(id);delete book.checks[id];}
  else if(before[id]!==revision){changed.push(id);if(id==='Intro'||id==='Routine')book.coverage[id]=false;const check=book.checks[id];if(check){(book.completionHistory[id]??=[]).push({contentRevision:before[id],check:structuredClone(check)});book.checks[id]={status:'Needs Another Look',complete:false,failures:[],missing:['This question has updated instructions. Keep your earlier work and review this version.'],review:[],at:new Date().toISOString()};}}
 }
 for(const id of Object.keys(before))if(!(id in catalog)){
  retired.push(id);book.archivedQuestions[id]={contentRevision:before[id],answers:book.answers[id]??{},check:book.checks[id]??null,workbench:book.workbenches[id]??null,history:book.history.filter(h=>h.id===id),trials:book.trials.filter(t=>t.part===id),events:book.events.filter(e=>e.part===id)};
  delete book.answers[id];delete book.checks[id];delete book.workbenches[id];
  book.history=book.history.filter(h=>h.id!==id);book.trials=book.trials.filter(t=>t.part!==id);book.events=book.events.filter(e=>e.part!==id);
 }
 book.assignment={...(book.assignment??{}),appId:APP_ID,id:ASSIGNMENT_ID,version:CONTENT_VERSION,questions:{...catalog}};
 return {changed,added,retired};
}
export function migrateNotebook(input,build=null,catalog=QUESTION_REVISIONS){
 if(![1,SAVE_SCHEMA].includes(input.schema))throw Error('This notebook uses an unsupported save version. Its original data was kept.');
 if(input.assignment&&(input.assignment.appId!==APP_ID||input.assignment.id!==ASSIGNMENT_ID||input.assignment.version>CONTENT_VERSION))throw Error('This notebook belongs to another assignment or a newer content version. Its original data was kept.');
 const book=structuredClone(input),fromSchema=book.schema,prior=book.representation??LEGACY_REPRESENTATION;
 const fromBuild=book.currentBuild??book.build;
 book.originalBuild??=book.build;
 book.currentBuild=build??book.currentBuild??book.build;
 for(const list of [book.history,book.events,book.trials])for(const item of list)item.representation??=prior;
 for(const w of Object.values(book.workbenches))w.representation??=prior;
 for(const trial of book.trials)trial.setup.representation??=prior;
 const changes=reconcileQuestions(book,catalog);
 if(!(book.part in catalog))book.part=Object.keys(catalog).find(id=>id.startsWith('Q'));
 if(book.returnTo&&!(book.returnTo in catalog))book.returnTo=null;
 book.schema=SAVE_SCHEMA;book.representation=REPRESENTATION;
 if(prior!==REPRESENTATION)book.previousRepresentation=prior;
 book.migrations??=[];book.guided??=guidanceRecord();
 if(fromSchema!==SAVE_SCHEMA||changes.changed.length||changes.added.length||changes.retired.length){
  const migration={at:new Date().toISOString(),fromSchema,toSchema:SAVE_SCHEMA,fromBuild,toBuild:book.currentBuild,fromRepresentation:prior,toRepresentation:REPRESENTATION,...changes};
  book.migrations.push(migration);
  book.events.push({type:'notebook-migrated',part:book.part,driver:book.team.driver,at:migration.at,representation:REPRESENTATION,migration:structuredClone(migration)});
 }
 return book;
}
export function anonymousReportNotebook(book){
 const copy=structuredClone(book);
 const archives=Object.values(copy.archivedQuestions??{}),events=[...copy.events,...archives.flatMap(a=>a.events??[])];
 const names=new Set([copy.team,...events.map(e=>e.team)].flatMap(team=>team?.learners??[]).map(person=>person.label).filter(Boolean));
 // These prefixes were generated by older checkers, not authored student responses.
 // Restrict replacement to check metadata; preserve responses, drawings, and backups.
 const anonymizeCheck=check=>{if(check)for(const key of ['failures','missing','review'])if(Array.isArray(check[key]))check[key]=check[key].map(text=>{
  if(typeof text!=='string')return text;
  for(const name of names)if(text.startsWith(name+': '))return 'Classwork Response: '+text.slice(name.length+2);
  return text;
 });};
 for(const check of Object.values(copy.checks))anonymizeCheck(check);
 for(const event of events)anonymizeCheck(event.check);
 for(const records of Object.values(copy.completionHistory??{}).filter(Array.isArray))for(const record of records)anonymizeCheck(record?.check);
 for(const archive of archives)anonymizeCheck(archive.check);
 const anonymize=team=>{if(team?.learners)for(const person of team.learners)person.label=person.id==='A'?'Shared Classwork':'Earlier Imported Response';};
 anonymize(copy.team);
 for(const event of events)anonymize(event.team);
 return copy;
}
