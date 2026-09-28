// Test-only instrumentation: expose the scene in a separate bundle, never in
// the shipped app, so bounds and camera preservation can be checked directly.
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { mkdir, writeFile } from 'node:fs/promises';
import { DEFAULT, STORAGE_KEY, STOP, swapPositions } from '../src/model.js';

export async function verifyFraming(browser, url, watch = () => {}, viewports = [[1366,768],[1024,768],[1280,720],[1920,1080],[1280,600],[844,390],[768,1024]]) {
  await build({stdin: {contents: `
    import { LeverScene } from './src/scene.js';
    const init = LeverScene.prototype.init;
    LeverScene.prototype.init = async function () {
      await init.call(this);
      window.framingScene = this;
    };
    await import('./src/app.js');`, resolveDir: process.cwd()},
    bundle: true, format: 'esm', outfile: 'dist/assets/framing-test.js'});
  await mkdir('artifacts/framing', {recursive:true});
  const page = await browser.newPage({viewport:{width:1366,height:768}});
  watch(page);
  await page.route('**/assets/app.js', route => route.fulfill({path:'dist/assets/framing-test.js',contentType:'text/javascript'}));
  const extremes = [
    {load:-250,fulcrum:-175,effort:250,loadMass:1000,effortMass:25},
    {load:-250,fulcrum:175,effort:250,loadMass:25,effortMass:1000},
  ];
  const states = [DEFAULT, ...extremes.flatMap(s=>[s,swapPositions(s)]),
    {...DEFAULT,loadMass:1000,effortMass:1000}];
  const report = [];
  await page.goto(url);
  await page.waitForFunction(()=>document.querySelector("#app").dataset.ready==="true");
  for (const [width,height] of viewports) {
    await page.setViewportSize({width,height});
    for (let i=0;i<states.length;i++) {
      await page.evaluate(({key,state})=>localStorage.setItem(key,JSON.stringify({state,held:false,reduced:true,showMath:true})),{key:STORAGE_KEY,state:states[i]});
      await page.reload();
      await page.waitForFunction(()=>document.querySelector('#app').dataset.ready==='true');
      await page.locator('#controls-toggle').click();
      // Include initial framing, before a preset is requested with panels open.
      for (const preset of ['initial','fit','side']) {
        if (preset!=='initial') await page.locator('#'+preset).click();
        const data = await page.evaluate(({stop})=>{
          const s=window.framingScene, area=s.callbacks.viewBounds();
          const original={...s.motion};
          const overflow=[];
          for (let n=0;n<=12;n++) {
            s.apparatus.update(s.state,-stop+2*stop*n/12);
            for (const root of [s.moving,s.base]) root.traverse(o=>{
              if (!o.geometry) return;
              o.geometry.computeBoundingBox();
              const b=o.geometry.boundingBox;
              for (const x of [b.min.x,b.max.x]) for (const y of [b.min.y,b.max.y]) for (const z of [b.min.z,b.max.z]) {
                const p=s.project(o.position.clone().set(x,y,z).applyMatrix4(o.matrixWorld));
                if (p.x<area.left-2 || p.x>area.right+2 || p.y<area.top-2 || p.y>area.bottom+2 || !p.visible)
                  overflow.push({name:o.name,x:p.x,y:p.y,area});
              }
            });
          }
          s.apparatus.update(s.state,original.angle);
          s.draw();
          const a=s.project(s.moving.localToWorld(s.camera.position.clone().set(-12.7-s.state.fulcrum/25,0,0)));
          const b=s.project(s.moving.localToWorld(s.camera.position.clone().set(12.7-s.state.fulcrum/25,0,0)));
          return {overflow:overflow.slice(0,2),beamWidth:Math.abs(b.x-a.x),target:s.controls.target.toArray()};
        },{stop:STOP});
        assert.deepEqual(data.overflow,[],`${width}x${height} state ${i} ${preset} clears overlays through both stops`);
        assert.equal(data.target[1],5.8,'lower orbit target is shared by presets');
        report.push({width,height,state:i,preset,beamWidth:data.beamWidth});
      }
      if (i===0 || (width===1366 && i<5)) {
        await page.locator('#fit').click();
        await page.mouse.move(0,0);
        await page.screenshot({path:`artifacts/framing/verified-${width}x${height}-state-${i}.png`});
      }
    }
  }
  // Panel toggles, math tab changes, and fullscreen retain the camera choice.
  await page.setViewportSize({width:1366,height:768});
  await page.locator('#reset').click();
  await page.locator('#controls-toggle').click();
  const beforeOrbit=await camera(page);
  await page.mouse.move(340,450); await page.mouse.down();
  await page.mouse.move(420,430,{steps:8}); await page.mouse.up();
  await page.mouse.wheel(0,150); await page.waitForTimeout(800);
  await page.evaluate(()=>{
    const s=window.framingScene;
    // Software WebGL frame rates vary. Drain damping before comparing a
    // chosen view so ordinary orbit inertia is not mistaken for a panel jump.
    for(let i=0;i<300;i++) s.controls.update();
    s.draw();
  });
  const chosen=await camera(page);
  assert.notDeepEqual(chosen.position,beforeOrbit.position,'orbit and wheel zoom remain available');
  for (const selector of ['#controls-toggle','#math-toggle','#tab-force','#tab-balance','#controls-toggle','#math-toggle']) {
    const button=page.locator(selector);
    if (await button.isVisible()) await button.click();
    await page.waitForTimeout(80);
    const next=await camera(page);
    for (let j=0;j<3;j++) assert.ok(Math.abs(next.position[j]-chosen.position[j])<0.02,`panels do not reset orbit/zoom: ${selector}, ${JSON.stringify({chosen:chosen.position,next:next.position})}`);
    assert.deepEqual(next.canvas,chosen.canvas,'overlays do not resize canvas');
  }
  await page.setViewportSize({width:1280,height:600});
  await page.waitForTimeout(150);
  const resized=await camera(page);
  for (let j=0;j<3;j++) assert.ok(Math.abs(resized.direction[j]-chosen.direction[j])<0.002,'resize preserves orbit direction');
  assert.ok(Math.abs(resized.zoom-chosen.zoom)<0.002,'resize preserves relative zoom');
  await page.locator('#fit').click();
  await page.setViewportSize({width:1366,height:768});
  await page.waitForTimeout(150);
  if (await page.locator('#fullscreen').isVisible()) {
    await page.locator('#fullscreen').click();
    await page.waitForFunction(()=>!!document.fullscreenElement);
    assert.ok(await page.evaluate(()=>!!document.fullscreenElement),'fullscreen enters');
    await page.evaluate(()=>document.exitFullscreen());
  }
  await page.close();
  await writeFile('artifacts/framing/verification.json',JSON.stringify(report,null,2)+'\n');
  console.log(`PASS: camera bounds at ${viewports.length} viewport sizes, orbit/zoom, panel stability, resize and fullscreen.`);
}
function camera(page) {
  return page.evaluate(()=>{
    const s=window.framingScene,offset=s.camera.position.clone().sub(s.controls.target);
    return {position:s.camera.position.toArray(),direction:offset.clone().normalize().toArray(),zoom:offset.length()/s.fitDistance,
      canvas:document.querySelector('canvas').getBoundingClientRect().toJSON()};
  });
}
