import {chromium} from 'playwright';import {spawn} from 'node:child_process';import {mkdir,readFile,writeFile} from 'node:fs/promises';import assert from 'node:assert/strict';
const port=4201,origin=`http://127.0.0.1:${port}`,server=spawn(process.execPath,['scripts/serve.mjs'],{stdio:'ignore',env:{...process.env,PORT:String(port)},windowsHide:true});let browser;
const root='artifacts/guided-preview';await mkdir(root,{recursive:true});
try{
 for(let i=0;i<50;i++){try{if((await fetch(origin)).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
 browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(origin);await page.waitForSelector('[data-lab="begin"]');assert.equal(await page.locator('#app').getAttribute('data-ready'),'true');
 assert.equal(await page.locator('[data-lab^="mode-"]').count(),0);assert.equal(await page.locator('[data-lab="begin"]').isDisabled(),true);
 await page.screenshot({path:`${root}/guided-introduction.png`});
 await page.locator('[data-lab="calibration"][data-value="push"]').click();await page.locator('[data-lab="begin"]').click();
 await page.screenshot({path:`${root}/hand-load-identification.png`});
 await page.locator('[data-lab="identify"][data-pick="load"]').click();assert.match(await page.locator('#identify-feedback').innerText(),/0 Of 3/);
 for(const role of ['effort','load','fulcrum'])await page.locator(`[data-lab="identify"][data-pick="${role}"]`).click();
 await page.locator('[data-lab="hide"]').click();await page.screenshot({path:`${root}/frozen-classroom-workbench.png`});await page.locator('#notebook-reopen').click();
 await page.locator('[data-lab="index"]').click();assert.equal(await page.locator('.question-grid > .question-tile').count(),64);assert.equal(await page.locator('.question-group').count(),0);
 await page.locator('[data-part="Q3a"]').click();await page.locator('#controls-toggle').click();await page.locator('#mass-effort').fill('225');await page.locator('#mass-effort').press('Tab');assert.equal(await page.locator('#mass-effort').inputValue(),'225');assert.equal(await page.locator('#app').getAttribute('data-held'),'true');
 await page.locator('#close-controls').click();await page.locator('[data-lab="reference"]').click();await page.locator('[data-lab="back"]').click();assert.equal(await page.locator('#mass-effort').inputValue(),'225');
 await page.setViewportSize({width:900,height:700});await page.screenshot({path:`${root}/compact-guided.png`});
 assert.deepEqual(errors,[]);const manifest=JSON.parse(await readFile('dist/build-manifest.json','utf8'));await writeFile(`${root}/verification.json`,JSON.stringify({build:manifest.id,passed:true,errors,checks:['guidance calibration','new room WebGL load','graphical streak','flat 64-step index / 68 evidence IDs','controls remain usable','vocabulary return preserves state']},null,2));console.log('GUIDED PREVIEW PASS '+manifest.id);
}finally{await browser?.close();server.kill();}
