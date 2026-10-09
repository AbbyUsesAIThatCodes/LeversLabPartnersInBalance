import {selectQuestion,choose,openRecovery,readBook} from './helpers/student-browser.mjs';
import {reportHTML} from '../src/report.js';
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
 assert.equal(await page.locator('#build-identity').innerText(),manifest.id);assert.equal(await page.locator('#build-identity').isVisible(),false);assert.equal(await page.locator('#build-summary').innerText(),'0.1.0 Local Review');
 await page.screenshot({path:'artifacts/notebook-review/free-play.png'});
 await page.locator('[data-lab="mode-challenge"]').click();
 const field=(k,o='shared')=>page.locator(`[data-answer="${k}"][data-owner="${o}"]`);
 const select=id=>selectQuestion(page,id), book=()=>readBook(page);
 assert.equal(await page.locator('#team-mode,#role-status,#question-select,#part-select').count(),0);
 assert.equal(await page.locator('#notebook select').count(),0);
 assert.doesNotMatch(await page.locator('#notebook').innerText(),/Q1[abc]/);
 assert.equal(await page.locator('.identify-choices .identify-candidate').count(),3);
 await page.screenshot({path:'artifacts/notebook-review/graphical-identification.png'});
 await page.locator('[data-tag="load"]').click();assert.match(await page.locator('#identify-feedback').innerText(),/0 Of 3/);
 await page.locator('[data-tag="effort"]').focus();await page.keyboard.press('Enter');assert.match(await page.locator('#identify-feedback').innerText(),/1 Of 3/);
 await page.locator('[data-lab="help"]').click();assert.equal(await page.locator('[data-lab="return"]').innerText(),'Return To Question');
 await page.locator('[data-lab="return"]').click();assert.match(await page.locator('#identify-feedback').innerText(),/1 Of 3/);
 // Main apparatus candidate buttons support keyboard choice without dragging.
 await page.locator('[data-tag="load"]').focus();await page.keyboard.press('Space');
 await page.locator('[data-tag="fulcrum"]').click();assert.match(await page.locator('#identify-feedback').innerText(),/3 Of 3/);
 const identified=await book();assert.ok(['Q1a','Q1b','Q1c'].every(id=>identified.checks[id]?.complete));
 await page.locator('[data-lab="hide"]').click();assert.equal(await page.locator('#notebook').isVisible(),false);assert.equal(await page.locator('#notebook-reopen').innerText(),'Show Notebook');await page.locator('#notebook-reopen').click();
 await page.locator('[data-lab="next"]').click();
 for(const [kind,x]of [['beam',300],['load',100],['fulcrum',300],['effort',500]]){await page.locator('[data-sketch-kind]').selectOption(kind);await page.locator('[data-sketch-x]').fill(String(x));await page.locator('[data-lab="sketch-add"]').click();}
 assert.match(await page.locator('#lab-feedback').innerText(),/Teacher Review/);
 await select('Q3a');await page.locator('[data-control="effort"]').fill('100');await page.locator('[data-control="effort"]').press('Tab');assert.match(await page.locator('#lab-feedback').innerText(),/Ready To Continue/);
 await select('Q3c');await page.locator('[data-lab="hold"]').click();assert.equal(await page.locator('#hold').innerText(),'Release','missing prediction blocks release');
 await select('Q3b');await field('prediction','A').fill('I expect the load side to drop.');await select('Q3c');await page.locator('[data-lab="hold"]').click();await page.waitForFunction(()=>JSON.parse(localStorage.getItem('lever-lab-notebook-v1')).trials.some(t=>t.part==='Q3c'&&t.settled));await choose(page,'observation','Level');await field('notes','A').fill('The beam stayed level.');await field('notes','A').press('Tab');assert.match(await page.locator('#lab-feedback').innerText(),/Teacher Review/);
 await page.reload();await page.waitForSelector('#notebook');assert.equal((await book()).part,'Q3c');assert.equal(await field('notes','A').inputValue(),'The beam stayed level.');
 await page.screenshot({path:'artifacts/notebook-review/challenge-laptop.png'});
 await page.locator('[data-lab="index"]').click();assert.equal(await page.locator('[data-lab="report"]').count(),0);assert.ok(await page.locator('.question-tile.complete').count()>0);
 await openRecovery(page);const save=page.waitForEvent('download');await page.locator('[data-lab="backup"]').click();await(await save).saveAs('artifacts/notebook-review/test-backup.json');
 await page.locator('#restore-backup').setInputFiles({name:'bad.json',mimeType:'application/json',buffer:Buffer.from('{"schema":999}')});await page.waitForFunction(()=>document.querySelector('#restore-preview').textContent.includes('not a supported'));assert.equal(await page.locator('[data-lab="restore"]').isDisabled(),true);
 await page.locator('#restore-backup').setInputFiles('artifacts/notebook-review/test-backup.json');await page.waitForFunction(()=>document.querySelector('#restore-preview').textContent.includes('Ready to restore'));await page.locator('[data-lab="restore"]').click();
 assert.equal((await book()).answers.Q3b.A.prediction,'I expect the load side to drop.');
 await page.setViewportSize({width:1920,height:1080});await page.screenshot({path:'artifacts/notebook-review/challenge-projector.png'});
 await page.setViewportSize({width:800,height:900});await page.screenshot({path:'artifacts/notebook-review/challenge-portrait.png'});
 const data=await book();assert.ok(data.events.some(e=>e.type==='identify-picked'&&!e.correct));assert.ok(data.visits.some(v=>v.from==='Q1a'&&v.lesson==='T1'));
 await writeFile('artifacts/notebook-review/test-student-work.html',reportHTML(data,manifest));
 const reportPage=await browser.newPage();await reportPage.goto('file:///'+process.cwd().replaceAll('\\','/')+'/artifacts/notebook-review/test-student-work.html');assert.equal(await reportPage.locator('section h2').count(),67);assert.ok(await reportPage.locator('svg').count()>0);await reportPage.screenshot({path:'artifacts/notebook-review/report-preview.png'});
 assert.deepEqual(errors,[]);assert.deepEqual(external,[]);await writeFile('artifacts/notebook-review/verification.json',JSON.stringify({build:manifest.id,mode:'WebGL',verified:'Graphical identification reset and keyboard streak; anonymous UI and compact identity; Q3 setup, prediction gate and release; exact Learn return; autosave/recovery; final download gated; no external requests',notVerified:'Full 68-row walkthrough and fallback paths are verified separately in full-packet-review',errors,external},null,2));console.log('NOTEBOOK BROWSER SLICE PASSED '+manifest.id);
}finally{await browser?.close();server.kill();}
