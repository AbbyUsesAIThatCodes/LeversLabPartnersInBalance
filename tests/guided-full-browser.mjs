import {choose,openRecovery} from './helpers/student-browser.mjs';
import {chromium} from 'playwright';import {spawn} from 'node:child_process';import net from 'node:net';import {readFile,writeFile,mkdir} from 'node:fs/promises';import assert from 'node:assert/strict';
import {PARTS,LESSONS,REQUIRED_IDS} from '../src/curriculum.js';import {measures,arm,DEFAULT} from '../src/model.js';import {parseBackup} from '../src/notebook.js';
const probe=net.createServer();await new Promise(r=>probe.listen(0,'127.0.0.1',r));const port=probe.address().port;await new Promise(r=>probe.close(r));
const origin=`http://127.0.0.1:${port}`,server=spawn(process.execPath,['scripts/serve.mjs'],{stdio:'ignore',env:{...process.env,PORT:String(port)},windowsHide:true}),root='artifacts/guided-full';await mkdir(root,{recursive:true});let browser;
const manifest=JSON.parse(await readFile('dist/build-manifest.json','utf8')),results=[];
try{
 for(let i=0;i<60;i++){try{if((await fetch(origin)).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
 browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 await Promise.all(['WebGL','Diagram'].map(async renderer=>{
  const context=await browser.newContext({viewport:{width:1440,height:1000},acceptDownloads:true}),page=await context.newPage(),errors=[],external=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(!r.url().startsWith(origin)&&!r.url().startsWith('blob:')&&!r.url().startsWith('data:'))external.push(r.url());});
  if(renderer==='Diagram')await page.addInitScript(()=>{const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(k,...args){return k.startsWith('webgl')?null:get.call(this,k,...args);};});
  const book=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('lever-lab-notebook-v1'))),click=a=>page.locator(`[data-lab="${a}"]`).click(),field=(k,o='shared')=>page.locator(`input[data-answer="${k}"][data-owner="${o}"],textarea[data-answer="${k}"][data-owner="${o}"]`);
  const control=async(k,v)=>{const el=page.locator(`[data-control="${k}"]`);if(await el.inputValue()!==String(v)){await el.fill(String(v));await el.press('Tab');}};
  const state=()=>page.evaluate(()=>({loadMass:Number(document.querySelector('#mass-load').value),effortMass:Number(document.querySelector('#mass-effort').value),load:Number(document.querySelector('[data-tag="load"]').dataset.coordinate),effort:Number(document.querySelector('[data-tag="effort"]').dataset.coordinate),fulcrum:Number(document.querySelector('#fulcrum-position').value)}));
  const configure=async target=>{const now=await state();if((now.load<now.effort)!==(target.load<target.effort))await page.locator('#swap').click();await control('fulcrum',target.fulcrum);for(const k of ['loadMass','effortMass'])await control(k,target[k]);for(const k of ['load','effort'])await control(k,arm(target,k));assert.deepEqual(await state(),target);};
  const settle=async()=>page.waitForFunction(()=>{const b=JSON.parse(localStorage.getItem('lever-lab-notebook-v1'));return b.trials.at(-1)?.part===b.part&&b.trials.at(-1)?.settled;},null,{timeout:18000});
  const draw=async(design=false)=>{const d=page.locator('[data-sketch-owner="A"]');for(const[k,x,label]of [['beam',300,''],['load',225,design?'Load 300 g; 75 mm':'Load'],['fulcrum',300,'Fulcrum'],['effort',525,design?'Effort 100 g-equivalent; 225 mm':'Effort']]){await d.locator('[data-sketch-kind]').selectOption(k);await d.locator('[data-sketch-x]').fill(String(x));await d.locator('[data-sketch-label]').fill(label);await d.locator('[data-lab="sketch-add"]').click();}};
  try{
   await page.goto(origin);await page.waitForSelector('[data-lab="begin"]');assert.equal(await page.locator('#app').getAttribute('data-ready'),renderer==='WebGL'?'true':'fallback');
   await page.locator('[data-lab="calibration"][data-value="push"]').click();await click('begin');for(const role of ['effort','load','fulcrum'])await page.locator(`[data-pick="${role}"]`).click();await click('next');
   const completed=['Q1a','Q1b','Q1c'];let selectedTrial;
   for(const part of PARTS.filter(p=>!['Q1a','Q1b','Q1c'].includes(p.id))){
    assert.equal((await book()).part,part.id);console.log(renderer,part.id);
    if(['Q2a','Q7a','Q8a','Q9a','Q10b','Q13a','Q14a'].includes(part.id))await page.locator('#reset').click();
    if(part.id==='Q10a'){await click('side');await page.locator('#controls-toggle').click();await page.locator('#close-controls').click();}
    if(part.swap)await click('swap');
    else if(part.target)await configure(part.target);
    else if(part.initial&&await page.locator('#app').getAttribute('data-held')==='true')await configure(part.initial);
    if(part.id==='Q13b')await control('effort',225);
    if(part.id==='Q14a')await configure({load:-75,effort:225,fulcrum:0,loadMass:300,effortMass:100});
    if(part.id==='Q11c'){selectedTrial=(await book()).trials.find(t=>t.part==='Q7b3'&&t.result==='balance'&&t.settled);assert.ok(selectedTrial);await choose(page,'trialId',selectedTrial.id);}
    const dynamic={Q11a:{loadMass:400,loadArm:100,loadProduct:40000,effortMass:200,effortArm:200,effortProduct:40000},Q11c:{loadMass:300,loadArm:100,loadProduct:30000,effortMass:200,effortArm:150,effortProduct:30000},Q13c:{arm:225},Q14a:{loadMass:300,effortMass:100,loadArm:75,effortArm:225},Q14c:{loadProduct:22500,effortProduct:22500}}[part.id]??{};
    if(part.trial&&await page.locator('#app').getAttribute('data-held')==='true'){
     if(part.allowed?.includes('effortMass')&&!part.design)await control('effortMass',part.id==='Q7b1'?300:part.fields.find(f=>f.key==='finalMass')?.answer??400);
     if(part.id==='Q13a')await control('effort',200);
    }
    for(const f of part.fields){if(f.key==='observation'||f.key==='trialId')continue;
     if(f.type==='sketch'){await draw(part.id==='Q14b');continue;}
     let v=f.answer??dynamic[f.key];if(f.prediction)v=f.key==='predictedMass'?(part.id==='Q7b1'?300:part.fields.find(x=>x.key==='finalMass').answer):'Synthetic prediction: compare the forces and their own arms.';
     if(f.review)v='Synthetic authored reasoning, saved for teacher review; this is not a model response.';
     if(v===undefined)throw Error('Unspecified fixture '+part.id+'.'+f.key);
     if(f.type==='select')await choose(page,f.key,v);else{await field(f.key,f.personal?'A':'shared').fill(String(v));await field(f.key,f.personal?'A':'shared').press('Tab');}
    }
    if(part.trial){
     if(await page.locator('#app').getAttribute('data-held')==='true')await click('test');await settle();
     if(part.id==='Q7b1'){
      assert.equal((await book()).trials.at(-1).result,'load');await choose(page,'observation','Load Side Down');await click('next');assert.equal((await book()).part,part.id);assert.match(await page.locator('#lab-feedback').innerText(),/Try Again/);
      await control('effortMass',400);const stale=(await book()).guided.predictions.at(-1);assert.ok(stale.invalidatedAt);await field('predictedMass','A').fill('400');await field('predictedMass','A').press('Tab');await click('test');await settle();
     }
     const t=(await book()).trials.at(-1);await choose(page,'observation',{balance:'Level',load:'Load Side Down',effort:'Effort Side Down'}[t.result]);
     if(part.id==='Q14d'){assert.deepEqual(t.setup.state,{load:-75,effort:225,fulcrum:0,loadMass:300,effortMass:100});assert.equal(t.predictions.shared.loadProduct,'22500');}
    }
    const fact=part.fields.find(f=>f.answer!==undefined&&!f.prediction);
    if(fact){const old=(await book()).answers[part.id].shared[fact.key];if(fact.type==='number'){await field(fact.key).fill(String(Number(old)+17));await field(fact.key).press('Tab');}else await choose(page,fact.key,fact.options.find(x=>x!==old));
     await click('next');assert.equal((await book()).part,part.id);assert.match(await page.locator('#lab-feedback').innerText(),/Try Again/);assert.ok(await page.locator('.teaching-card').isVisible());
     if(fact.type==='number'){await field(fact.key).fill(old);await field(fact.key).press('Tab');}else await choose(page,fact.key,old);
    }
    if(part.id==='Q14b')await page.screenshot({path:`${root}/${renderer}-design.png`});
    await click('next');const b=await book();assert.equal(b.checks[part.id]?.complete,true,part.id+': '+JSON.stringify(b.checks[part.id]));completed.push(part.id);
    if(part.id==='Q7b3'){await page.reload();await page.waitForSelector('#notebook');assert.equal((await book()).checks.Q7b3.complete,true);}
    if(part.id==='Q11c')assert.equal(b.answers.Q11c.shared.trialId,selectedTrial.id);
   }
   const b=await book();assert.equal(completed.length,66);assert.ok(b.coverage.Intro&&b.coverage.Routine);assert.equal(Object.values(b.checks).filter(c=>c.complete).length,66);
   const lessons=new Set(Object.values(b.guided.teaching).map(t=>t.lesson));assert.ok(b.events.some(e=>e.source==='embedded'&&e.resource==='T0 / T12'));for(const l of LESSONS.filter(l=>!['T0','T12'].includes(l.id)))assert.ok(lessons.has(l.id));assert.doesNotThrow(()=>parseBackup(JSON.stringify(b)));
   const d=page.waitForEvent('download');await click('report');await(await d).saveAs(`${root}/${renderer}-complete-work.html`);
   await openRecovery(page);const backup=page.waitForEvent('download');await click('backup');await(await backup).saveAs(`${root}/${renderer}-complete-backup.json`);
   await page.locator('#restore-backup').setInputFiles(`${root}/${renderer}-complete-backup.json`);await page.waitForFunction(()=>document.querySelector('#restore-preview').textContent.includes('Ready to restore'));await click('restore');const restored=await book();assert.deepEqual(restored.answers,b.answers);assert.equal(Object.values(restored.checks).filter(c=>c.complete).length,66);
   const rp=await context.newPage();await rp.goto('file:///'+process.cwd().replaceAll('\\','/')+`/${root}/${renderer}-complete-work.html`);assert.match(await rp.locator('body').innerText(),/68 of 68/);assert.equal(await rp.locator('section .response svg').count(),2);assert.equal(JSON.parse(await rp.locator('#lever-lab-notebook').textContent()).guided.predictions[0].source,'Q3b');
   await rp.evaluate(()=>dispatchEvent(new Event('beforeprint')));assert.equal(await rp.locator('section details:not([open])').count(),0);await rp.screenshot({path:`${root}/${renderer}-report.png`});
   assert.deepEqual(errors,[]);assert.deepEqual(external,[]);results.push({renderer,passed:true,completedRows:68,coverage:REQUIRED_IDS,lessons:LESSONS.map(l=>l.id),trials:b.trials.length,predictions:b.guided.predictions.length,errors,external});
  }catch(e){await page.screenshot({path:`${root}/${renderer}-failure.png`});await writeFile(`${root}/${renderer}-failure.txt`,String(e)+'\n'+await page.locator('body').innerText());throw e;}finally{await context.close();}
 }));
 await writeFile(`${root}/verification.json`,JSON.stringify({build:manifest.id,passed:true,runs:results},null,2));console.log('GUIDED FULL 68-ROW RUNS PASS '+manifest.id);
}finally{await browser?.close();server.kill();}
