import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";

export async function verifyTooltips(browser, url, watch = () => {}) {
  const folder = "artifacts/issue-9";
  await mkdir(folder, { recursive: true });
  const metrics = {};
  const state = (page) => page.evaluate(() => ({
    values: [...document.querySelectorAll('#controls-panel input')].map((e) => e.value),
    coordinates: [...document.querySelectorAll('[data-tag]')].map((e) => e.dataset.coordinate),
    held: document.querySelector('#app').dataset.held,
    angle: document.querySelector('#app').dataset.angle,
  }));
  async function ready(page, mode = "true") {
    await page.waitForFunction((mode) => document.querySelector('#app').dataset.ready === mode, mode);
    await page.evaluate(() => document.fonts.ready);
  }
  async function visibleTooltip(page, trigger) {
    assert.equal(await page.locator('#tooltip').isVisible(), true);
    assert.equal(await page.locator('#tooltip').innerText(), await trigger.getAttribute('data-tip'));
    assert.match(await trigger.getAttribute('aria-describedby'), /(?:^| )tooltip(?: |$)/);
    assert.equal(await page.locator('[aria-describedby~="tooltip"]').count(), 1, 'only one active trigger');
    const fits = await page.locator('#tooltip').evaluate((box) => {
      const r = box.getBoundingClientRect();
      const hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
      return r.left >= 11 && r.top >= 11 && r.right <= innerWidth - 11 && r.bottom <= innerHeight - 11 && box.contains(hit);
    });
    assert.ok(fits, 'tooltip fits viewport and is above scrolling panels');
  }
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  watch(page);
  await page.goto(url);
  await ready(page);
  await page.locator('#controls-toggle').click();
  assert.equal(await page.locator('[data-tip]').evaluateAll((nodes) => nodes.every((e) =>
    e.tagName === 'BUTTON' && !e.parentElement.closest('button, label, [data-tip]') &&
    (e.getAttribute('aria-describedby') || '').split(/\s+/).every((id) => document.getElementById(id)?.textContent.trim())
  )), true, 'native help buttons have descriptions before focus and are never nested controls');
  const load = page.getByRole('button', { name: 'Load Help', exact: true });
  const effort = page.getByRole('button', { name: 'Effort Help', exact: true });
  const original = await load.getAttribute('aria-describedby');
  const initial = await state(page);
  await load.hover();
  await visibleTooltip(page, load);
  await page.locator('#tooltip').hover();
  await page.waitForTimeout(350);
  await visibleTooltip(page, load);
  await page.mouse.move(1360, 400);
  await page.waitForTimeout(350);
  assert.equal(await page.locator('#tooltip').isHidden(), true, 'hover tooltip closes after pointer leaves');
  await load.focus();
  await page.mouse.move(1350, 410);
  await page.waitForTimeout(350);
  await visibleTooltip(page, load);
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#tooltip').isHidden(), true);
  assert.equal(await load.getAttribute('aria-describedby'), original, 'description survives dismissal');
  assert.ok(await load.evaluate((e) => e === document.activeElement), 'Escape keeps trigger focus');
  assert.ok(await page.locator('#controls-panel').isVisible(), 'first Escape leaves controls open');
  await page.keyboard.press('Enter');
  await visibleTooltip(page, load);
  await page.keyboard.press('Enter');
  assert.ok(await page.locator('#tooltip').isHidden(), 'Enter toggles pinned help');
  await page.keyboard.press('Space');
  await visibleTooltip(page, load);
  await effort.focus();
  await visibleTooltip(page, effort);
  await page.keyboard.press('Tab');
  assert.ok(await page.locator('#tooltip').isVisible(), 'next help trigger replaces current tooltip');
  await page.locator('#mass-effort').focus();
  assert.ok(await page.locator('#tooltip').isHidden(), 'moving focus to input clears tooltip');
  const fulcrum = page.locator('#fulcrum-help');
  const descriptions = await fulcrum.getAttribute('aria-describedby');
  await fulcrum.click();
  await visibleTooltip(page, fulcrum);
  assert.match(await fulcrum.getAttribute('aria-describedby'), /fulcrum-note/);
  await fulcrum.click();
  assert.equal(await fulcrum.getAttribute('aria-describedby'), descriptions, 'existing coordinate description preserved');
  assert.deepEqual(await state(page), initial, 'help cannot edit masses/positions, release, or drag apparatus');
  await page.locator('#forces-help').focus();
  await visibleTooltip(page, page.locator('#forces-help'));
  await page.screenshot({ path: `${folder}/keyboard-tooltip.png` });
  await page.locator('#help').click();
  assert.ok(await page.locator('#tooltip').isHidden());
  assert.ok(await page.locator('#help-dialog').isVisible(), 'full Help remains available');
  await page.keyboard.press('Escape');
  await page.locator('#model-help').click();
  await visibleTooltip(page, page.locator('#model-help'));
  assert.ok(await page.locator('#help-dialog').isHidden(), 'model help opens only the relevant tooltip');
  await page.locator('#tab-force').click();
  assert.ok(await page.locator('#tooltip').isHidden(), 'switching math tabs clears stale help');
  await page.getByRole('button', { name: 'Load Torque Help', exact: true }).focus();
  await visibleTooltip(page, page.getByRole('button', { name: 'Load Torque Help', exact: true }));
  await page.keyboard.press('Escape');
  await page.screenshot({ path: `${folder}/force-math.png` });
  await page.locator('#tab-balance').click();
  await page.locator('#model-help').click();
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.locator('#tooltip').waitFor({ state: 'hidden' });
  assert.ok(await page.locator('#tooltip').isHidden(), 'resize clears stale placement');
  for (const [name, width, height] of [['laptop', 1366, 768], ['projector', 1920, 1080]]) {
    await page.setViewportSize({ width, height });
    await page.locator('#fit').click();
    await page.mouse.move(width - 2, height / 2);
    await page.locator('#mass-load').focus();
    await page.waitForTimeout(100);
    metrics[name] = await measure(page);
    assert.ok(metrics[name]['#math-panel'].height < 230, 'math panel has an actually smaller footprint');
    assert.ok(metrics[name]['#panel-load'].height < 310, 'role cards have an actually smaller footprint');
    assert.ok(metrics[name]['#math-panel'].scroll <= metrics[name]['#math-panel'].height, 'all default math fits without vertical scrolling');
    await page.screenshot({ path: `${folder}/after-${name}.png` });
  }
  await page.close();

  // Compact touch is a 1024×768 laptop-sized viewport, not a phone target.
  for (const fallback of [false, true]) {
    const touch = await browser.newPage({ viewport: { width: 1024, height: 768 }, hasTouch: true });
    watch(touch);
    if (fallback) await touch.addInitScript(() => {
      const get = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (kind, ...rest) {
        return kind.startsWith('webgl') ? null : get.call(this, kind, ...rest);
      };
    });
    await touch.goto(url);
    await ready(touch, fallback ? 'fallback' : 'true');
    await touch.locator('#controls-toggle').tap();
    const before = await state(touch);
    const help = touch.getByRole('button', { name: 'Load Arm Length Help', exact: true });
    await help.tap();
    await visibleTooltip(touch, help);
    await help.tap();
    assert.ok(await touch.locator('#tooltip').isHidden(), 'second tap dismisses help');
    await help.tap();
    await touch.locator('#tooltip').tap();
    await visibleTooltip(touch, help);
    await touch.locator('#heading-effort').tap();
    assert.ok(await touch.locator('#tooltip').isHidden(), 'outside tap dismisses help');
    const units = touch.getByRole('button', { name: 'Load Mass Units Help', exact: true });
    await units.tap();
    assert.ok(await units.evaluate((e) => e === document.activeElement), 'unit help does not activate the neighboring input');
    await visibleTooltip(touch, units);
    assert.deepEqual(await state(touch), before, 'touch help leaves model unchanged');
    await touch.keyboard.press('Escape');
    metrics[fallback ? 'fallback' : 'compact-touch'] = await measure(touch);
    await touch.screenshot({ path: `${folder}/after-${fallback ? 'fallback' : 'compact-touch'}.png` });
    await touch.locator('#model-help').tap();
    await visibleTooltip(touch, touch.locator('#model-help'));
    await touch.screenshot({ path: `${folder}/${fallback ? 'fallback' : 'touch'}-tooltip.png` });
    await touch.keyboard.press('Escape');
    await touch.getByRole('button', { name: 'Double Load Mass', exact: true }).tap();
    assert.equal(await touch.locator('#mass-load').inputValue(), '400', 'normal controls still work after help');
    assert.ok(await touch.locator('#tooltip').isHidden(), 'model rerender leaves no orphan tooltip');
    // Exercise a genuinely scrolling card, preserving the laptop viewport.
    await touch.locator('#panel-load').evaluate((e) => e.style.maxHeight = '150px');
    await touch.getByRole('button', { name: 'Load Help', exact: true }).tap();
    await visibleTooltip(touch, touch.getByRole('button', { name: 'Load Help', exact: true }));
    await touch.locator('#panel-load').evaluate((e) => e.scrollTop = 70);
    await touch.waitForTimeout(100);
    assert.ok(await touch.locator('#tooltip').isHidden(), 'scroll dismisses without leaving clipped help');
    await touch.close();
  }
  await writeFile(`${folder}/metrics.json`, JSON.stringify(metrics, null, 2) + '\n');
  console.log('PASS: shared help hover/focus/pinning/Escape, descriptions, touch, scrolling, compact laptop layouts, and no-WebGL tooltips.');
}

function measure(page) {
  return page.evaluate(() => Object.fromEntries(['#top', '#math-panel', '#panel-load', '#panel-effort', '#panel-fulcrum'].map((s) => {
    const e = document.querySelector(s), r = e.getBoundingClientRect();
    return [s, { width: r.width, height: r.height, top: r.top, bottom: r.bottom, scroll: e.scrollHeight }];
  })));
}
