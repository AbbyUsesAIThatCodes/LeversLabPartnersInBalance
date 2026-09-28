import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
const label = process.argv[2] || 'after';
const port = 4181, url = `http://127.0.0.1:${port}`;
const server = spawn(process.execPath, ['scripts/serve.mjs'], { stdio: 'ignore', env: { ...process.env, PORT: String(port) } });
let browser;
try {
  for (let i = 0; i < 60; i++) {
    try { if ((await fetch(url)).ok) break; } catch {}
    await new Promise(r => setTimeout(r, 100));
  }
  browser = await chromium.launch({executablePath: process.env.CHROMIUM_EXECUTABLE || undefined, args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']});
  await mkdir('artifacts/framing', {recursive:true});
  const metrics = {};
  for (const [width,height] of [[1366,768],[1024,768],[1280,720],[1920,1080],[1280,600],[844,390],[768,1024]]) {
    const page = await browser.newPage({viewport:{width,height}});
    await page.goto(url);
    await page.waitForFunction(() => document.querySelector('#app').dataset.ready === 'true');
    await page.evaluate(() => document.fonts.ready);
    for (const controls of [false,true]) {
      if (controls) await page.locator('#controls-toggle').click();
      await page.mouse.move(0,0);
      await page.waitForTimeout(80);
      const name = `${width}x${height}-${controls?'controls':'normal'}`;
      metrics[name] = await page.evaluate(() => Object.fromEntries(['#top','#math-panel','#panel-fulcrum','#panel-load','#panel-effort','[data-tag="load"]','[data-tag="effort"]'].map(s=>[s,document.querySelector(s).getBoundingClientRect().toJSON()])));
      await page.screenshot({path:`artifacts/framing/${label}-${name}.png`});
    }
    await page.close();
  }
  await writeFile(`artifacts/framing/${label}-metrics.json`,JSON.stringify(metrics,null,2));
} finally { await browser?.close(); server.kill(); }
