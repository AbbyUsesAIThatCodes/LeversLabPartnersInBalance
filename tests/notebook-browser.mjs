import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import net from 'node:net';
const probe=net.createServer();await new Promise(resolve=>probe.listen(0,'127.0.0.1',resolve));
const port=probe.address().port;await new Promise(resolve=>probe.close(resolve));
const origin=`http://127.0.0.1:${port}`,server=spawn(process.execPath,['scripts/serve.mjs'],{stdio:'ignore',env:{...process.env,PORT:String(port)}});
let browser;const errors=[],external=[];
try{
 for(let i=0;i<50;i++){try{if((await fetch(origin)).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE||'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:1366,height:768},acceptDownloads:true});
 page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(!r.url().startsWith(origin)&&!r.url().startsWith('blob:')&&!r.url().startsWith('data:'))external.push(r.url());});
 await page.goto(origin);await mkdir('artifacts/notebook-review',{recursive:true});
 try{await page.waitForSelector('#lab-navigation');}catch(e){console.log('PAGE ERRORS',errors);console.log('PAGE TEXT',(await page.locator('body').innerText()).slice(0,2500));await page.screenshot({path:'artifacts/notebook-review/startup-error.png'});throw e;}
 assert.equal(await page.locator('#app').getAttribute('data-ready'),'true');
 const manifest=JSON.parse(await readFile('dist/build-manifest.json','utf8'));
 assert.equal(await page.locator('#build-identity').innerText(),manifest.id);assert.equal(await page.locator('#build-identity').isVisible(),true);
 await page.screenshot({path:'artifacts/notebook-review/free-play.png'});
 await page.locator('[data-lab="mode-challenge"]').click();
 const field=(k,o='shared')=>page.locator(`[data-answer="${k}"][data-owner="${o}"]`);
 const select=async id=>{await page.locator('#question-select').selectOption(id.match(/Q(\d+)/)[1]);await page.locator('#part-select').selectOption(id);};
 await field('role').selectOption('Effort');await page.locator('[data-lab="check"]').click();assert.match(await page.locator('#lab-feedback').innerText(),/Try Again/);
 await page.locator('[data-lab="help"]').click();assert.match(await page.locator('#notebook').innerText(),/Roles And Labeled Sketches/);
 await page.locator('[data-lab="return"]').click();assert.equal(await field('role').inputValue(),'Effort');await field('role').selectOption('Load');await page.locator('[data-lab="check"]').click();assert.match(await page.locator('#lab-feedback').innerText(),/Checked/);
 await select('Q1d');for(const [kind,x]of [['beam',300],['load',100],['fulcrum',300],['effort',500]]){await page.locator('[data-sketch-kind]').selectOption(kind);await page.locator('[data-sketch-x]').fill(String(x));await page.locator('[data-lab="sketch-add"]').click();}await page.locator('[data-lab="check"]').click();assert.match(await page.locator('#lab-feedback').innerText(),/Teacher Review/);
 await select('Q3a');await page.locator('[data-control="effort"]').fill('100');await page.locator('[data-control="effort"]').press('Tab');await page.locator('[data-lab="check"]').click();assert.match(await page.locator('#lab-feedback').innerText(),/Checked/);
 await select('Q3c');await page.locator('[data-lab="hold"]').click();assert.equal(await page.locator('#hold').innerText(),'Release','missing prediction blocks release');
 await select('Q3b');await field('prediction','A').fill('I expect the load side to drop.');await select('Q3c');await page.locator('[data-lab="hold"]').click();await page.waitForFunction(()=>JSON.parse(localStorage.getItem('lever-lab-notebook-v1')).trials.some(t=>t.part==='Q3c'&&t.settled));await field('observation').selectOption('Level');await field('notes','A').fill('The beam stayed level.');await page.locator('[data-lab="check"]').click();assert.match(await page.locator('#lab-feedback').innerText(),/Teacher Review/);
 await page.reload();await page.waitForSelector('#notebook');assert.equal(await page.locator('#part-select').inputValue(),'Q3c');assert.equal(await field('notes','A').inputValue(),'The beam stayed level.');
 await select('Q4a');await page.locator('[data-control="loadMass"]').fill('400');await page.locator('[data-control="loadMass"]').press('Tab');await page.locator('[data-lab="check"]').click();assert.match(await page.locator('#lab-feedback').innerText(),/Checked/);
 await select('Q4b');await field('prediction','A').fill('The load will move down because only its mass increased.');await select('Q4c');await page.locator('[data-lab="hold"]').click();await page.waitForFunction(()=>JSON.parse(localStorage.getItem('lever-lab-notebook-v1')).trials.some(t=>t.part==='Q4c'&&t.settled));await field('observation').selectOption('Load Side Down');await field('notes','A').fill('The gold load side moved down.');await page.locator('[data-lab="check"]').click();assert.match(await page.locator('#lab-feedback').innerText(),/Teacher Review/);
 await page.screenshot({path:'artifacts/notebook-review/challenge-laptop.png'});
 await page.locator('[data-lab="session"]').click();await page.locator('#team-mode').selectOption('pair');await page.locator('[data-lab="settings"]').click();const before=await page.locator('#mass-load').inputValue();await page.locator('[data-lab="roles"]').click();assert.equal(await page.locator('#mass-load').inputValue(),before);assert.match(await page.locator('#role-status').innerText(),/Driver: Learner B/);
 const save=page.waitForEvent('download');await page.locator('[data-lab="backup"]').click();const backup=await save;await backup.saveAs('artifacts/notebook-review/test-backup.json');
 const report=page.waitForEvent('download');await page.locator('[data-lab="report"]').click();await (await report).saveAs('artifacts/notebook-review/test-student-work.html');
 await page.locator('#restore-backup').setInputFiles({name:'bad.json',mimeType:'application/json',buffer:Buffer.from('{"schema":999}')});assert.match(await page.locator('#restore-preview').innerText(),/not a supported/);assert.equal(await page.locator('[data-lab="restore"]').isDisabled(),true);
 await page.locator('#restore-backup').setInputFiles('artifacts/notebook-review/test-backup.json');await page.waitForFunction(()=>document.querySelector('#restore-preview').textContent.includes('Ready to restore'));assert.match(await page.locator('#restore-preview').innerText(),/Ready to restore/);await page.locator('[data-lab="restore"]').click();
 await select('Q3b');assert.equal(await field('prediction','A').inputValue(),'I expect the load side to drop.');assert.equal(await field('prediction','B').inputValue(),'');await field('prediction','B').fill('I expect it to stay level.');await select('Q3c');await page.locator('[data-lab="hold"]').click();await page.waitForFunction(()=>JSON.parse(localStorage.getItem('lever-lab-notebook-v1')).trials.filter(t=>t.part==='Q3c'&&t.settled).length===2);
 await page.setViewportSize({width:1920,height:1080});await page.screenshot({path:'artifacts/notebook-review/challenge-projector.png'});
 await page.setViewportSize({width:800,height:900});await page.screenshot({path:'artifacts/notebook-review/challenge-portrait.png'});
 const data=await page.evaluate(()=>JSON.parse(localStorage.getItem('lever-lab-notebook-v1')));assert.ok(data.history.some(h=>h.id==='Q1a'&&h.value==='Effort'));assert.ok(data.visits.some(v=>v.from==='Q1a'&&v.lesson==='T1'));
 const reportPage=await browser.newPage();await reportPage.goto('file:///'+process.cwd().replaceAll('\\','/')+'/artifacts/notebook-review/test-student-work.html');assert.equal(await reportPage.locator('section h2').count(),67);assert.ok(await reportPage.locator('svg').count()>0);await reportPage.screenshot({path:'artifacts/notebook-review/report-preview.png'});
 assert.deepEqual(errors,[]);assert.deepEqual(external,[]);await writeFile('artifacts/notebook-review/verification.json',JSON.stringify({build:manifest.id,mode:'WebGL',verified:'Q1 factual correction and sketch; Q3/Q4 controlled setup, prediction gate, release evidence; Learn return; pair/solo role rotation; autosave reload; validated backup restore; report download; no external requests',notVerified:'Complete paired/solo 68-row runs, Q5–Q14 browser paths, touch sketch, fallback notebook paths',errors,external},null,2));console.log('NOTEBOOK BROWSER SLICE PASSED '+manifest.id);
}finally{await browser?.close();server.kill();}
