import { PARTS,PART_BY_ID,QUESTIONS,LESSONS } from './curriculum.js';
import { DEFAULT,valid,arm,setMass,setDistance,move,measures,restingAngle,balanceStatus } from './model.js';
import { NOTEBOOK_KEY,MAX_BACKUP_BYTES,loadNotebook,saveNotebook,parseBackup,answer,response,learners,stamp,event,rotate,visitLesson,predictionReady,snapshot,latestTrial,checkPart,coverage,invalidateChecks,sameState,supportViewed,revalidateChecks } from './notebook.js';
import {escapeHTML as esc,drawingSVG,reportHTML} from './report.js';
import {emphasizeTerms,vocabularyReference} from './reference.js';
import {studentText,identifyOrder,identifyRoles,isIdentify,identifyStreak,indexHTML,lessonIndexHTML,feedbackHTML,sharedSession,updateIntro} from './student-ui.js';
const $=s=>document.querySelector(s);
const button=(action,label,extra='')=>`<button data-lab="${action}" ${extra}>${label}</button>`;
const options=(values,value)=>values.map(v=>`<option value="${esc(typeof v==='object'?v.value:v)}" ${String(typeof v==='object'?v.value:v)===String(value)?'selected':''}>${esc(typeof v==='object'?v.label:v)}</option>`).join('');
export function mountLearning(app){
 let storage;try{storage=localStorage;}catch{storage={getItem(){throw Error('Browser storage is unavailable.');},setItem(){throw Error();}};}
 const loaded=loadNotebook(storage,$('#build-identity').textContent);let book=loaded.book,manifest=null,pending=null,changes=[],initializing=false,saveError=loaded.error,recoveryRaw=loaded.recovery;
 if(loaded.fresh)book.freeWorkbench=snapshot(app.get().state,app.get().held);
 sharedSession(book);let indexOpen=false,lessonIndexOpen=false,pickFeedback=null;
 const drafts=new Map();
 fetch('./build-manifest.json').then(r=>r.json()).then(x=>manifest=x).catch(()=>{});
 for(const t of book.trials)if(!t.completedAt){t.interrupted=true;t.completedAt=stamp();}
 const nav=document.createElement('nav');nav.id='lab-navigation';nav.setAttribute('aria-label','Learning Modes');nav.innerHTML=`${button('mode-free','Free Play')}${button('mode-learn','Learn')}${button('mode-challenge','Challenge')}<output id="save-status" role="status"></output>`;$('#top').append(nav);
 const pane=document.createElement('aside');pane.id='notebook';pane.setAttribute('aria-label','Learning Notebook');document.querySelector('#app').append(pane);
 const reopen=document.createElement('button');reopen.id='notebook-reopen';reopen.textContent='Show Notebook';reopen.hidden=true;reopen.onclick=()=>{pane.hidden=false;reopen.hidden=true;};$('#app').append(reopen);
 const modal=document.createElement('dialog');modal.id='session-dialog';modal.innerHTML='<h2>Recover Saved Work</h2><div id="session-body"></div>';$('#app').append(modal);
 function persist(){if(recoveryRaw){$('#save-status').textContent='Unreadable Save Kept';return;}const saved=saveNotebook(storage,book);saveError=saved.ok?saveError:saved.error;$('#save-status').textContent=saveError?'Backup Needed':'Saved On This Device';$('#save-status').title=saveError??'Progress stays in this browser. Download a backup before changing devices.';}
 function tell(message){app.notice(message);const out=$('#lab-feedback');if(out)out.textContent=message;}
 function status(){for(const m of ['free','learn','challenge'])nav.querySelector(`[data-lab="mode-${m}"]`).setAttribute('aria-pressed',String(book.mode===m));}
 function flushDrafts(){for(const d of drafts.values()){const current=answer(book,d.id,d.key,d.owner);if(JSON.stringify(current)!==JSON.stringify(d.previous))book.history.push({id:d.id,key:d.key,owner:d.owner,value:structuredClone(current),previous:d.previous,at:stamp(),driver:d.driver});}drafts.clear();}
 function storeWorkbench(){flushDrafts();if(initializing)return;const w=snapshot(app.get().state,app.get().held);if(book.mode==='challenge')book.workbenches[book.part]=w;else if(book.mode==='free')book.freeWorkbench=w;}
 function loadWorkbench(w){initializing=true;app.load(w);initializing=false;}
 function interrupt(){if(pending){pending.interrupted=true;pending.settled=false;pending.result=null;pending.completedAt=stamp();event(book,'trial-interrupted',{trialId:pending.id});pending=null;app.hold();}}
 function selectPart(id,preserveCurrent=true){indexOpen=false;lessonIndexOpen=false;if(isIdentify(id))id=identifyOrder[Math.min(identifyStreak(book),2)];interrupt();if(preserveCurrent)storeWorkbench();book.mode='challenge';book.part=id;changes=[];const part=PART_BY_ID[id];let w=book.workbenches[id];if(!w){let state=part.initial;if(part.design||part.designPrediction||id==='Q14b')state=book.workbenches.Q14a?.state??state;
   if(!state){const index=PARTS.findIndex(p=>p.id===id);const prior=PARTS.slice(0,index).reverse().find(p=>p.question===part.question&&(book.workbenches[p.id]||p.target||p.initial));state=prior?(book.workbenches[prior.id]?.state??prior.target??prior.initial):DEFAULT;}
   w=snapshot(state,true);book.workbenches[id]=w;
  }loadWorkbench({...w,held:true});book.workbenches[id].held=true;app.math(false);render();pane.scrollTop=0;persist();}
 function enterMode(mode){if(mode==='learn'){goLesson(book.lesson,book.mode==='challenge'?book.part:book.returnTo);lessonIndexOpen=true;render();return;}interrupt();storeWorkbench();if(mode==='challenge'){selectPart(book.part,false);return;}book.mode=mode;book.returnTo=null;loadWorkbench(book.freeWorkbench);pane.hidden=true;reopen.hidden=true;render();persist();}
 function resumeNotebook(){sharedSession(book);revalidateChecks(book);if(book.mode==='challenge')selectPart(book.part,false);else{loadWorkbench(book.mode==='free'?book.freeWorkbench:snapshot(LESSONS.find(l=>l.id===book.lesson).initial));if(book.mode==='learn')supportViewed(book,'lesson',book.lesson);render();persist();}}
 function refreshCheckStatus(){if(book.mode!=='challenge'||indexOpen)return;const out=$('#lab-feedback');if(out)out.innerHTML=feedbackHTML(book.checks[book.part]);}
 function autoCheck(){if(book.mode!=='challenge'||indexOpen||isIdentify(book.part))return;storeWorkbench();checkPart(book,PART_BY_ID[book.part],app.get());updateIntro(book);refreshCheckStatus();persist();}
 function identifyPart(role){if(book.mode!=='challenge'||indexOpen||!isIdentify(book.part)||identifyStreak(book)>=3)return false;
  const streak=identifyStreak(book),id=identifyOrder[streak],expected=identifyRoles[streak],correct=role===expected;
  response(book,id,'role',role[0].toUpperCase()+role.slice(1));event(book,'identify-picked',{part:id,expected,picked:role,correct,streak:correct?streak+1:0});
  if(correct)checkPart(book,PART_BY_ID[id],app.get());else invalidateChecks(book,identifyOrder,'Complete all three part choices in a row.');
  pickFeedback={role,correct};if(streak+1<3||!correct)book.part=identifyOrder[correct?streak+1:0];storeWorkbench();render();persist();return true;
 }
 function goLesson(id,from=null){indexOpen=false;lessonIndexOpen=false;interrupt();storeWorkbench();visitLesson(book,id,from);loadWorkbench(snapshot(LESSONS.find(l=>l.id===id).initial));app.math(false);render();pane.scrollTop=0;persist();}
 function simulator(part){const w=app.get(),s=w.state,allowed=book.mode==='learn'?['loadMass','effortMass','load','effort','fulcrum']:(part?.allowed??[]);return `<div class="mini-controls"><p class="state-note">${w.held?'Held Level':'Released'} · Mass g / Distance mm</p><div class="lab-controls">${[['loadMass','Load Mass (g)',s.loadMass],['effortMass','Effort Mass (g)',s.effortMass],['load','Load Arm (mm)',arm(s,'load')],['effort','Effort Arm (mm)',arm(s,'effort')],['fulcrum','Fulcrum Position (mm)',s.fulcrum]].filter(([key])=>allowed.includes(key)).map(([key,label,value])=>`<label>${label}<input data-control="${key}" aria-label="Notebook ${label}" type="number" step="25" value="${value}"></label>`).join('')}</div><div class="button-row">${part?.trial||book.mode==='learn'?button('hold',w.held?'Release':'Hold Level'):''}${part?.id==='Q10a'||book.mode==='learn'?button('side','Side View'):''}${part?.swap||book.mode==='learn'?button('swap','Swap Positions'):''}</div><output id="trial-state" aria-live="polite"></output></div>`;}
 function fieldHTML(part,f,owner){const v=answer(book,part.id,f.key,owner);let control;const attrs=`data-answer="${esc(f.key)}" data-owner="${owner}"`;
  if(f.type==='sketch')return sketchHTML(part.id,owner,v);
  let choices=f.options;
  if(f.key==='trialId')choices=book.trials.filter(t=>/^Q7b/.test(t.part)&&t.result==='balance'&&t.settled&&!t.interrupted).map(t=>({value:t.id,label:`Effort Arm ${t.setup.effortArm} mm · ${t.setup.state.effortMass} g · ${t.startedAt.slice(11,19)}`}));
  if(f.type==='select')return `<div class="response-field"><strong>${esc(studentText(f.label))}</strong><div class="answer-choices" role="group" aria-label="${esc(studentText(f.label))}">${choices.map(choice=>{const value=typeof choice==='object'?choice.value:choice,label=typeof choice==='object'?choice.label:choice;return button('choose',esc(studentText(label)),`data-answer="${f.key}" data-owner="${owner}" data-value="${esc(value)}" aria-pressed="${String(v)===String(value)}"`);}).join('')}</div></div>`;
  else if(f.type==='text')control=`<textarea ${attrs} rows="3" maxlength="10000">${esc(v)}</textarea>`;
  else control=`<input ${attrs} type="number" value="${esc(v)}" step="any">`;
  return `<label class="response-field">${esc(studentText(f.label))}${f.prediction?'<small>Saved before testing; prediction correctness is not graded.</small>':''}${control}</label>`;
 }
 function sketchHTML(id,owner,value){return `<div class="sketch" data-sketch-owner="${owner}"><b>Your Lever Sketch</b><div class="drawing-surface" tabindex="0" aria-label="Draw Your Lever Sketch">${drawingSVG(value||{elements:[]})}</div><p class="lab-note">Draw with a pointer, or build the entire diagram with the keyboard controls below. Add all three role labels. Undo removes your last addition.</p><div class="sketch-controls"><label>Component<select data-sketch-kind>${options(['beam','load','fulcrum','effort','label'],'beam')}</select></label><label>Horizontal Position<input data-sketch-x type="number" min="20" max="580" value="300"></label><label>Vertical Position<input data-sketch-y type="number" min="55" max="220" value="130"></label><label>Label<input data-sketch-label maxlength="100" placeholder="Role, mass, arm, or note"></label></div>${button('sketch-add','Add Component',`data-owner="${owner}"`)}${button('sketch-undo','Undo',`data-owner="${owner}"`)}</div>`;}
 function render(){status();app.identify?.(book.mode==='challenge'&&!indexOpen&&isIdentify(book.part),pickFeedback);if(book.mode==='free'){pane.hidden=true;reopen.hidden=true;return;}pane.hidden=false;reopen.hidden=true;
  const heading=`<div class="notebook-heading">${button('hide','Hide Notebook')}${button('index','Question Index')}</div>`;
  if(indexOpen){pane.innerHTML=heading+indexHTML(book);return;}
  if(book.mode==='learn'){
   if(lessonIndexOpen){pane.innerHTML=heading+(book.returnTo?button('return','Return To Question'):'')+lessonIndexHTML();return;}
   const l=LESSONS.find(x=>x.id===book.lesson);pane.innerHTML=heading+`<h2>${esc(l.title)}</h2>${book.returnTo?button('return','Return To Question'):''}<p>${emphasizeTerms(studentText(l.text))}</p><p class="practice-prompt"><b>Try It</b><br>${emphasizeTerms(studentText(l.practice))}</p>${vocabularyReference}${simulator(null)}${l.id==='T1'?sketchHTML('Q1d','A',book.tutorials.T1?.drawing):''}<label>What Did You Notice?<textarea id="lesson-note" rows="3">${esc(book.tutorials[l.id]?.note??'')}</textarea></label>${button('lesson-done','Record This Practice')}<output id="lab-feedback" role="status"></output>`;
  }else{
   const part=PART_BY_ID[book.part],q=QUESTIONS.find(q=>q.number===part.question),identifying=isIdentify(part.id),streak=identifyStreak(book);
   const identification=identifying?`<h3>${streak<3?'Select The '+identifyRoles[streak][0].toUpperCase()+identifyRoles[streak].slice(1):'All Three Parts Identified'}</h3><p>Select the part in the workbench, or use the matching buttons below.</p><div class="identify-choices">${[['load','Crate','&#9635;'],['effort','Hanging Mass','&#9679;'],['fulcrum','Support','▲']].map(([role,label,icon])=>button('identify',`<span aria-hidden="true">${icon}</span>${label}`,`data-pick="${role}" class="identify-candidate ${pickFeedback?.role===role?(pickFeedback.correct?'right':'wrong'):''}" ${streak===3?'disabled':''}`)).join('')}</div><p id="identify-feedback" role="status">${pickFeedback?(pickFeedback.correct?'Correct. ':'That is not the requested part. Start again with Effort. '):''}${streak} Of 3 Correct In A Row</p>`:'';
   const evidence=(part.references??[]).map(id=>{const t=latestTrial(book,id);return t?`<details><summary>Earlier Trial: ${esc(PART_BY_ID[id].title)}</summary><p>Load ${t.setup.state.loadMass} g at ${t.setup.loadArm} mm; effort ${t.setup.state.effortMass} g at ${t.setup.effortArm} mm.</p></details>`:'';}).join('');
   pane.innerHTML=heading+`<h2>Question ${q.number}: ${esc(q.title)}</h2>${identifying?identification:`<h3 id="part-heading" tabindex="-1">${esc(part.title)}</h3>${part.instructions?`<p>${esc(studentText(part.instructions))}</p>`:''}${part.initial||part.setup||part.trial||part.designPrediction?simulator(part):''}${part.id==='Q10a'?button('side','Side View / Diagram'):''}${part.priorTrial?button('q7','Use Or Recreate An Earlier Trial'):''}${evidence}${part.fields.map(f=>fieldHTML(part,f,f.personal?'A':'shared')).join('')}`}<div class="button-row">${button('help','Learn This')}${button('next','Continue',identifying&&streak<3?'disabled':'')}</div>${identifying?'':`<div id="lab-feedback" role="status">${feedbackHTML(book.checks[part.id])}</div>`}`;
  }
  wireFields();wireSketches();
 }
 function wireFields(){pane.querySelectorAll('input[data-answer],textarea[data-answer]').forEach(input=>input.addEventListener('input',()=>{const key=book.part+'|'+input.dataset.owner+'|'+input.dataset.answer;if(!drafts.has(key))drafts.set(key,{id:book.part,key:input.dataset.answer,owner:input.dataset.owner,previous:structuredClone(answer(book,book.part,input.dataset.answer,input.dataset.owner)),driver:book.team.driver});response(book,book.part,input.dataset.answer,input.value,input.dataset.owner,false);refreshCheckStatus();persist();}));
  pane.querySelectorAll('input[data-answer],textarea[data-answer]').forEach(input=>input.addEventListener('change',autoCheck));
  pane.querySelectorAll('[data-control]').forEach(input=>input.addEventListener('change',()=>{const s=app.get().state,k=input.dataset.control;app.change(k.endsWith('Mass')?setMass(s,k==='loadMass'?'load':'effort',input.value):k==='fulcrum'?move(s,k,input.value):setDistance(s,k,input.value));renderControls();autoCheck();}));
  $('#question-select')?.addEventListener('change',e=>selectPart(QUESTIONS.find(q=>q.number===Number(e.target.value)).parts[0].id));$('#part-select')?.addEventListener('change',e=>selectPart(e.target.value));$('#lesson-select')?.addEventListener('change',e=>goLesson(e.target.value,book.returnTo));
  $('#lesson-note')?.addEventListener('input',e=>{book.tutorials[book.lesson]??={};book.tutorials[book.lesson].note=e.target.value;persist();});
 }
 function renderControls(){const controls=pane.querySelector('.mini-controls');if(controls){controls.outerHTML=simulator(PART_BY_ID[book.part]);pane.querySelectorAll('[data-control]').forEach(input=>input.addEventListener('change',()=>{const s=app.get().state,k=input.dataset.control;app.change(k.endsWith('Mass')?setMass(s,k==='loadMass'?'load':'effort',input.value):k==='fulcrum'?move(s,k,input.value):setDistance(s,k,input.value));renderControls();autoCheck();}));}}
 function sketchSave(owner,drawing){if(book.mode==='learn'){book.tutorials.T1??={};book.tutorials.T1.drawing=drawing;}else response(book,book.part,'drawing',drawing,owner);autoCheck();persist();const surface=pane.querySelector(`[data-sketch-owner="${owner}"] .drawing-surface`);if(surface)surface.innerHTML=drawingSVG(drawing);}
 function wireSketches(){for(const container of pane.querySelectorAll('.sketch')){const surface=container.querySelector('.drawing-surface'),owner=container.dataset.sketchOwner;let points=null;
   const point=e=>{const r=surface.getBoundingClientRect();return [Math.max(0,Math.min(600,(e.clientX-r.left)*600/r.width)),Math.max(0,Math.min(280,(e.clientY-r.top)*280/r.height))];};
   surface.addEventListener('pointerdown',e=>{points=[point(e)];surface.setPointerCapture(e.pointerId);});surface.addEventListener('pointermove',e=>{if(points&&points.length<5000)points.push(point(e));});surface.addEventListener('pointerup',()=>{if(!points)return;const id=book.mode==='learn'?'Q1d':book.part;const d=structuredClone((book.mode==='learn'?book.tutorials.T1?.drawing:answer(book,id,'drawing',owner))||{elements:[]});d.elements.push({kind:'stroke',x:0,y:0,points,label:''});points=null;sketchSave(owner,d);});
  }}
 function download(name,body,type){const url=URL.createObjectURL(new Blob([body],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
 function session(){storeWorkbench();persist();$('#session-body').innerHTML=`<p>Your anonymous classwork saves in this browser. A recovery copy lets you resume on another device.</p>${saveError?`<p>${esc(saveError)}</p>`:''}${recoveryRaw?button('recovery','Download Unreadable Save'):''}${button('backup','Download Recovery Copy')}<label>Restore Saved Work<input id="restore-backup" type="file" accept=".json,application/json"></label><p id="restore-preview"></p>${button('restore','Replace With Reviewed Backup','disabled')}<p>Check the file before replacing this notebook. Your current work stays unchanged if validation fails.</p>${button('close-session','Done')}`;
  let candidate=null;$('#restore-backup').addEventListener('change',async e=>{candidate=null;modal.querySelector('[data-lab="restore"]').disabled=true;try{const file=e.target.files[0];if(!file||file.size>MAX_BACKUP_BYTES)throw Error('Choose a Lever Lab JSON backup smaller than 12 MB.');candidate=parseBackup(await file.text(),{build:$('#build-identity').textContent});$('#restore-preview').textContent=`Ready to restore ${candidate.history.length} revisions · saved ${candidate.updatedAt}`;modal.querySelector('[data-lab="restore"]').disabled=false;}catch(e){$('#restore-preview').textContent=e.message;}});
  modal.querySelector('[data-lab="restore"]').onclick=()=>{if(!candidate)return;
   const prepared=structuredClone(candidate);for(const t of prepared.trials)if(!t.completedAt){t.interrupted=true;t.completedAt=stamp();}
   const saved=saveNotebook(storage,prepared);if(!saved.ok){$('#restore-preview').textContent=saved.error+' Restore was not applied.';return;}
   interrupt();flushDrafts();book=prepared;sharedSession(book);changes=[];indexOpen=false;recoveryRaw=null;candidate=null;saveError=null;modal.close();resumeNotebook();};modal.showModal();
 }
 function action(e){const b=e.target.closest('[data-lab]');if(!b)return;const a=b.dataset.lab;
  if(a.startsWith('mode-'))return enterMode(a.slice(5));
  if(a==='index'){interrupt();storeWorkbench();indexOpen=true;render();persist();return;}
  if(a==='question')return selectPart(b.dataset.part);
  if(a==='lesson')return goLesson(b.dataset.lesson,book.returnTo);
  if(a==='identify')return identifyPart(b.dataset.pick);
  if(a==='choose'){response(book,book.part,b.dataset.answer,b.dataset.value,b.dataset.owner);autoCheck();render();return;}
  if(a==='hide'){pane.hidden=true;reopen.hidden=false;return;}
  if(a==='session')return session();if(a==='close-session'){modal.close();return;}
  if(a==='recovery'){download('LeverLab-Unreadable-Save.json',recoveryRaw,'application/json');return;}
  if(a==='backup'){storeWorkbench();persist();download('LeverLab-Backup-'+book.id.slice(0,8)+'.json',JSON.stringify(book,null,2),'application/json');return;}
  if(a==='report'){if(!coverage(book).every(r=>r.complete)){tell('Complete the required question evidence before downloading the final work.');return;}storeWorkbench();persist();download('LeverLab-Student-Work-'+book.id.slice(0,8)+'.html',reportHTML(book,manifest),'text/html');return;}
  if(a==='hold'){app.toggleHold();renderControls();return;}if(a==='side'){app.side();return;}if(a==='swap'){app.swap();renderControls();return;}
  if(a==='help')return goLesson(PART_BY_ID[book.part].lesson,book.part);
  if(a==='return'){const id=book.returnTo;book.returnTo=null;return selectPart(id);}
  if(a==='q7')return selectPart('Q7b1');
  if(a==='lesson-done'){book.tutorials[book.lesson]={...book.tutorials[book.lesson],note:$('#lesson-note').value,completedAt:stamp(),driver:book.team.driver};if(book.lesson==='T0')book.coverage.Routine=true;if(['T0','T1','T2'].every(id=>book.tutorials[id]?.completedAt))book.coverage.Intro=true;persist();tell('Practice recorded. You can return to your challenge.');return;}
  if(a==='check'){storeWorkbench();checkPart(book,PART_BY_ID[book.part],app.get());persist();render();return;}
  if(a==='next'){if(isIdentify(book.part)){if(identifyStreak(book)<3)return;return selectPart('Q1d');}autoCheck();if(!book.checks[book.part]?.complete)return;const i=PARTS.findIndex(p=>p.id===book.part);if(i===PARTS.length-1){indexOpen=true;render();return;}return selectPart(PARTS[i+1].id);}
  if(a==='sketch-add'||a==='sketch-undo'){const owner=b.dataset.owner,container=b.closest('.sketch'),id=book.mode==='learn'?'Q1d':book.part,d=structuredClone((book.mode==='learn'?book.tutorials.T1?.drawing:answer(book,id,'drawing',owner))||{elements:[]});if(a==='sketch-undo')d.elements.pop();else{const kind=container.querySelector('[data-sketch-kind]').value;d.elements.push({kind,role:['load','effort','fulcrum'].includes(kind)?kind:undefined,x:Math.max(20,Math.min(580,Number(container.querySelector('[data-sketch-x]').value)||300)),y:Math.max(55,Math.min(220,Number(container.querySelector('[data-sketch-y]').value)||130)),label:container.querySelector('[data-sketch-label]').value.trim()||(['load','effort','fulcrum'].includes(kind)?kind:'')});}sketchSave(owner,d);}
 }
 nav.addEventListener('click',action);pane.addEventListener('click',action);modal.addEventListener('click',action);
 const api={
  identifyPart,
  isIdentifying:()=>book.mode==='challenge'&&!indexOpen&&isIdentify(book.part)&&identifyStreak(book)<3,
  allowChange(next){if(initializing||book.mode!=='challenge')return true;const part=PART_BY_ID[book.part];if(!app.get().held){tell('Hold Level before making this challenge change.');return false;}const allowed=part.allowed??[];if(Object.keys(next).some(k=>next[k]!==app.get().state[k]&&!allowed.includes(k))){tell('This step keeps that quantity fixed. Use the named variable or Free Play.');return false;}return true;},
  changed(before,next,held){if(initializing||sameState(before,next))return;interrupt();changes.push({at:stamp(),before:snapshot(before,held),after:snapshot(next,held),driver:book.team.driver});event(book,'control-change',{before,after:next,held});if(book.mode==='challenge')invalidateChecks(book,book.part==='Q14a'?[book.part,'Q14c']:[book.part]);storeWorkbench();refreshCheckStatus();persist();},
  resetting(){interrupt();storeWorkbench();persist();},
  supportViewed(source,resource){supportViewed(book,source,resource);persist();},
  recordAction(type){event(book,type);persist();},
  allowSwap(){if(book.mode!=='challenge')return true;const p=PART_BY_ID[book.part];if(!p.swap||!app.get().held||!predictionReady(book,p)){tell('Hold level and record your swap predictions first.');return false;}event(book,'positions-swapped');persist();return true;},
  allowMath(){if(book.mode!=='challenge')return true;const part=PART_BY_ID[book.part];const own=part.fields.some(f=>f.prediction);if(own&&!predictionReady(book,{...part,prediction:true})||part.prediction&&!predictionReady(book,part)){tell('Record your prediction before showing the math.');return false;}event(book,'math-viewed');persist();return true;},
  beforeRelease(){flushDrafts();if(book.mode!=='challenge')return true;const part=PART_BY_ID[book.part];if(!part.trial){tell('Record this step, then continue to its release-and-observe step.');return false;}if(!predictionReady(book,part)){tell('Record your prediction before Release. It is not graded for correctness.');return false;}if(part.tableRow&&!book.trials.some(t=>t.part===part.id)){const predicted=Number(answer(book,part.id,'predictedMass',book.team.driver));if(!Number.isFinite(predicted)||predicted<25||predicted>1000||predicted%25!==0||app.get().state.effortMass!==predicted){tell('For the first trial, set effort mass to your prediction. Use a legal 25 g step; revisions retain the original prediction.');return false;}}if(part.design&&!book.workbenches.Q14a){tell('Create and record your design first.');return false;}return true;},
  held(){interrupt();storeWorkbench();persist();},
  released(){if(book.mode!=='challenge')return;const part=PART_BY_ID[book.part];const source=part.prediction===true?part.id:part.prediction;pending={id:crypto.randomUUID(),part:part.id,startedAt:stamp(),completedAt:null,driver:book.team.driver,setup:snapshot(app.get().state,true),predictions:structuredClone(source?book.answers[source]??{}:{}),changes:structuredClone(changes),result:null,settled:false,interrupted:false};changes=[];book.trials.push(pending);invalidateChecks(book,[part.id,...PARTS.filter(p=>p.requiresTrial===part.id).map(p=>p.id)]);refreshCheckStatus();book.coverage.Routine=true;storeWorkbench();persist();renderControls();}
 };

 setInterval(()=>{if(pending&&(app.get().held||!sameState(app.get().state,pending.setup.state))){interrupt();storeWorkbench();persist();renderControls();}if(pending){const w=app.get(),motion=app.motion(),elapsed=Date.now()-Date.parse(pending.startedAt),settled=Math.abs(motion.velocity)<Math.PI/1800&&Math.abs(motion.angle-restingAngle(w.state))<Math.PI/1800;const out=$('#trial-state');if(out)out.textContent='Observing… wait for settled motion.';if(elapsed>500&&settled){pending.result=measures(pending.setup.state).direction;pending.settled=true;pending.completedAt=stamp();pending.motion={...motion};pending.engineStatus=balanceStatus(w.state,motion,false);event(book,'trial-completed',{trialId:pending.id});const result=pending.result;pending=null;autoCheck();persist();if(out)out.textContent=`Recorded: ${{balance:'Level',load:'Load Side Down',effort:'Effort Side Down'}[result]}. Now enter your observation.`;}}
 },150);
 addEventListener('pagehide',()=>{storeWorkbench();persist();});
 pane.addEventListener('focusout',()=>{flushDrafts();persist();});
 addEventListener('pointerup',e=>{if(!e.target.closest?.('button,input,textarea,select')&&book.mode==='challenge'&&!indexOpen)autoCheck();});
 addEventListener('keyup',e=>{if(e.key?.startsWith('Arrow'))autoCheck();});
 pane.addEventListener('toggle',e=>{if(e.target.open&&e.target.closest('.vocabulary'))api.supportViewed('reference',e.target.querySelector('summary').textContent);},true);
 resumeNotebook();
 return api;
}
