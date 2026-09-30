import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import net from 'node:net';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {PARTS,LESSONS,REQUIRED_IDS} from '../src/curriculum.js';
import {measures,arm} from '../src/model.js';
const probe=net.createServer();await new Promise(r=>probe.listen(0,'127.0.0.1',r));const port=probe.address().port;await new Promise(r=>probe.close(r));
const origin=`http://127.0.0.1:${port}`,server=spawn(process.execPath,['scripts/serve.mjs'],{stdio:'ignore',env:{...process.env,PORT:String(port)}});
const manifest=JSON.parse(await readFile('dist/build-manifest.json','utf8')),results=[];let browser,page;
const root='artifacts/full-packet-review';await mkdir(root,{recursive:true});
try{
 for(let i=0;i<60;i++){try{if((await fetch(origin+'/build-manifest.json')).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE||'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 for(const run of [{team:'solo',renderer:'fallback'},{team:'pair',renderer:'true'}]){
  const context=await browser.newContext({viewport:{width:1366,height:900},acceptDownloads:true});page=await context.newPage();const errors=[],external=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(!r.url().startsWith(origin)&&!r.url().startsWith('blob:')&&!r.url().startsWith('data:'))external.push(r.url());});
  if(run.renderer==='fallback')await page.addInitScript(()=>{const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(kind,...args){return kind.startsWith('webgl')?null:get.call(this,kind,...args);};});
  await page.goto(origin);await page.waitForSelector('#lab-navigation');assert.equal(await page.locator('#app').getAttribute('data-ready'),run.renderer);assert.equal(await page.locator('#build-identity').innerText(),manifest.id);
  const click=a=>page.locator(`[data-lab="${a}"]`).click();
  const book=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('lever-lab-notebook-v1')));
  const answer=(k,o='shared')=>page.locator(`[data-answer="${k}"][data-owner="${o}"]`);
  const setControl=async(k,v)=>{const input=page.locator(`[data-control="${k}"]`);await input.fill(String(v));await input.press('Tab');};
  const select=async id=>{const q=id.match(/Q(\d+)/)[1];if(await page.locator('#question-select').inputValue()!==q)await page.locator('#question-select').selectOption(q);await page.locator('#part-select').selectOption(id);};
  const draw=async(owner,design=false)=>{const el=page.locator(`[data-sketch-owner="${owner}"]`);for(const [kind,x,label] of [['beam',300,''],['load',225,design?'Load 300 g · 75 mm':'Load'],['fulcrum',300,'Fulcrum 0 mm'],['effort',525,design?'Effort 100 g · 225 mm':'Effort']]){await el.locator('[data-sketch-kind]').selectOption(kind);await el.locator('[data-sketch-x]').fill(String(x));await el.locator('[data-sketch-label]').fill(label);await el.locator('[data-lab="sketch-add"]').click();}};
  if(run.team==='pair'){await click('session');await page.locator('#team-mode').selectOption('pair');await click('settings');await click('close-session');}
  await click('mode-challenge');
  const people=run.team==='pair'?['A','B']:['A'];let selectedTrial;
  const done=[];
  for(const part of PARTS){
   await select(part.id);console.log(run.team,part.id);
   if(part.id==='Q10a'){await click('side');
    await page.locator('#controls-toggle').click();await page.locator('#close-controls').click();
   }
   if(part.setup&&part.target){if(part.swap){await click('swap');}else for(const key of part.allowed){const want=key==='load'||key==='effort'?arm(part.target,key):part.target[key];await setControl(key,want);}}
   if(part.id==='Q14a')for(const[k,v]of Object.entries({loadMass:300,effortMass:100,load:75,effort:225}))await setControl(k,v);
   if(part.id==='Q11c'){const b=await book();selectedTrial=b.trials.find(t=>t.part==='Q7b3'&&t.settled&&t.result==='balance');assert.ok(selectedTrial);await answer('trialId').selectOption(selectedTrial.id);}
   const dynamic={Q6b:{mass:400},Q11a:{loadMass:400,loadArm:100,loadProduct:40000,effortMass:200,effortArm:200,effortProduct:40000},Q11c:{loadMass:300,loadArm:100,loadProduct:30000,effortMass:200,effortArm:150,effortProduct:30000},Q13c:{arm:225},Q14a:{loadMass:300,effortMass:100,loadArm:75,effortArm:225},Q14c:{loadProduct:22500,effortProduct:22500}}[part.id]??{};
   for(const f of part.fields){if(f.key==='observation'||f.key==='trialId')continue;for(const owner of f.personal?people:['shared']){
    if(f.type==='sketch'){await draw(owner,part.id==='Q14b');continue;}
    let v=f.answer??dynamic[f.key];
    if(f.prediction)v=f.key==='predictedMass'?(part.id==='Q7b1'?300:part.fields.find(x=>x.key==='finalMass').answer):`Synthetic ${owner} prediction before testing: compare each mass and its own arm.`;
    if(f.review)v=`Synthetic ${owner} review response for ${part.id}: my observation and reasoning are retained for teacher judgment.`;
    if(v===undefined)throw Error('Missing independent response for '+part.id+'.'+f.key);
    if(f.type==='select')await answer(f.key,owner).selectOption(String(v));else await answer(f.key,owner).fill(String(v));
   }}
   if(part.trial){
    if(part.allowed.includes('effortMass')&&part.id!=='Q14d')await setControl('effortMass',part.id==='Q7b1'?300:(part.fields.find(f=>f.key==='finalMass')?.answer??400));
    if(part.id==='Q13a')await setControl('effort',200);
    if(part.id==='Q13c'){await setControl('effort',275);assert.equal(await page.locator('[data-control="effort"]').inputValue(),'250');await setControl('effort',225);}
    const count=(await book()).trials.length;await click('hold');await page.waitForFunction(count=>{const b=JSON.parse(localStorage.getItem('lever-lab-notebook-v1'));return b.trials.length>count&&b.trials.at(-1).settled;},count,{timeout:15000});
    if(part.id==='Q7b1'){
     await answer('observation').selectOption('Load Side Down');await click('check');assert.match(await page.locator('#lab-feedback').innerText(),/Try Again/);await click('help');await click('return');assert.equal(await answer('predictedMass','A').inputValue(),'300');await setControl('effortMass',400);await click('hold');await page.waitForFunction(()=>JSON.parse(localStorage.getItem('lever-lab-notebook-v1')).trials.at(-1).settled,{},{timeout:15000});
    }
    const t=(await book()).trials.at(-1);await answer('observation').selectOption({balance:'Level',load:'Load Side Down',effort:'Effort Side Down'}[t.result]);
    if(part.id==='Q14d'){assert.equal(t.setup.state.loadMass,300);assert.equal(t.setup.state.effortMass,100);assert.equal(t.setup.state.load,-75);assert.equal(t.setup.state.effort,225);assert.equal(t.predictions.shared.loadProduct,'22500');}
   }
   // Exercise the exact help-and-return path for every card with a constrained field.
   const fact=part.fields.find(f=>f.answer!==undefined&&!f.prediction);
   if(fact){const old=await answer(fact.key).inputValue();if(fact.type==='number')await answer(fact.key).fill(String(Number(old)+17));else await answer(fact.key).selectOption(fact.options.find(x=>x!==old));await click('check');assert.match(await page.locator('#lab-feedback').innerText(),/Try Again/,part.id);await click('help');assert.equal(await page.locator('#lesson-select').inputValue(),part.lesson);await click('return');assert.equal(await page.locator('#part-select').inputValue(),part.id);if(fact.type==='number')await answer(fact.key).fill(old);else await answer(fact.key).selectOption(old);}
   await click('check');let b=await book();assert.equal(b.checks[part.id]?.complete,true,part.id+': '+JSON.stringify(b.checks[part.id]));done.push(part.id);
   if(part.id==='Q7b3'){await page.reload();await page.waitForSelector('#notebook');assert.equal(await page.locator('#part-select').inputValue(),part.id);assert.equal((await book()).checks[part.id].complete,true);}
   if(part.id==='Q11c')assert.equal((await book()).answers.Q11c.shared.trialId,selectedTrial.id);
   if(part.id==='Q14b')await page.screenshot({path:`${root}/${run.team}-design-sketch.png`});
   if(run.team==='pair'&&['Q4d','Q8e','Q12f'].includes(part.id)){const before=(await book()).workbenches[part.id];await click('session');await click('roles');await click('close-session');assert.deepEqual((await book()).workbenches[part.id],before);}
  }
  await click('mode-learn');for(const l of LESSONS){await page.locator('#lesson-select').selectOption(l.id);await page.locator('#lesson-note').fill(`Synthetic practice note for ${l.id}.`);await click('lesson-done');}
  let b=await book();assert.ok(b.coverage.Intro&&b.coverage.Routine);assert.equal(done.length,66);assert.equal(Object.values(b.checks).filter(c=>c.complete).length,66);assert.equal(Object.values(b.tutorials).filter(t=>t.completedAt).length,13);
  await click('session');const backupEvent=page.waitForEvent('download');await click('backup');await(await backupEvent).saveAs(`${root}/${run.team}-complete-backup.json`);
  const reportEvent=page.waitForEvent('download');await click('report');await(await reportEvent).saveAs(`${root}/${run.team}-complete-work.html`);
  const historyLength=b.history.length;await page.locator('#restore-backup').setInputFiles(`${root}/${run.team}-complete-backup.json`);await page.waitForFunction(()=>document.querySelector('#restore-preview').textContent.length>0);assert.match(await page.locator('#restore-preview').innerText(),/Ready to restore/);await click('restore');b=await book();assert.equal(Object.values(b.checks).filter(c=>c.complete).length,66);assert.equal(b.history.length,historyLength);
  assert.ok(b.trials.filter(t=>t.part==='Q7b1'&&t.settled).length>=2);assert.equal(b.trials.find(t=>t.part==='Q7b1').predictions.A.predictedMass,'300');assert.ok(b.trials.filter(t=>t.settled).every(t=>t.setup.held&&measures(t.setup.state).direction===t.result));
  const rp=await context.newPage();await rp.goto('file:///'+process.cwd().replaceAll('\\','/')+`/${root}/${run.team}-complete-work.html`);assert.ok((await rp.locator('body').innerText()).includes('68 of 68'));const embedded=JSON.parse(await rp.locator('#lever-lab-notebook').textContent());assert.deepEqual(embedded.answers,b.answers);assert.equal(await rp.locator('section h2').count(),67);const design=rp.locator('section').filter({has:rp.locator('h2',{hasText:'Q14b:'})});assert.equal(await design.locator('.response svg').count(),people.length);await design.screenshot({path:`${root}/${run.team}-report-design.png`});
  assert.deepEqual(errors,[]);assert.deepEqual(external,[]);results.push({...run,build:manifest.id,coverage:REQUIRED_IDS,lessons:LESSONS.map(l=>l.id),completedRows:68,personalAuthors:people,historyEntries:b.history.length,trialCount:b.trials.length,errors,external});await context.close();
 }
 await writeFile(`${root}/verification.json`,JSON.stringify({build:manifest.id,runs:results,scope:'All mapped rows and all tutorial locations exercised through the UI. Open reasoning and drawing quality remain teacher review. No deployment or classroom readiness approval.'},null,2));console.log('FULL PACKET BROWSER RUNS PASSED '+manifest.id);
}catch(e){if(page&&!page.isClosed()){await page.screenshot({path:`${root}/failure.png`});await writeFile(`${root}/failure.txt`,String(e)+'\n'+await page.locator('body').innerText());}throw e;}finally{await browser?.close();server.kill();}
