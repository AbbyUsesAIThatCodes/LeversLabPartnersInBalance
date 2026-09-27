import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import assert from "node:assert/strict";
import {
  DEFAULT,
  PRESETS,
  STORAGE_KEY,
  valid,
  swapPositions,
} from "../src/model.js";
const port = Number(process.env.PORT || 4178),
  origin = `http://127.0.0.1:${port}`,
  url = origin + "/LeversLoadEffortDistance/";
const server = spawn(process.execPath, ["scripts/serve.mjs"], {
  stdio: "ignore",
  env: { ...process.env, PORT: String(port) },
});
let browser;
const errors = [],
  external = [];
try {
  let up = false;
  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch(url)).ok) {
        up = true;
        break;
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 100));
  }
  assert.ok(up, "server starts");
  const args = ["--no-sandbox"];
  if (process.env.BROWSER_SOFTWARE_GL === "1")
    args.push(
      "--use-gl=angle",
      "--use-angle=swiftshader",
      "--enable-unsafe-swiftshader",
    );
  browser = await chromium.launch({
    headless: true,
    args,
    executablePath: process.env.CHROMIUM_EXECUTABLE || undefined,
  });
  await mkdir("artifacts", { recursive: true });
  const page = await browser.newPage({
    viewport: { width: 1366, height: 768 },
  });
  function watch(p) {
    p.on("pageerror", (e) => errors.push(e.message));
    p.on("request", (r) => {
      if (
        !r.url().startsWith(origin) &&
        !r.url().startsWith("blob:") &&
        !r.url().startsWith("data:")
      )
        external.push(r.url());
    });
  }
  watch(page);
  async function ready(p = page, mode = "true") {
    await p.waitForFunction(
      (mode) => document.querySelector("#app").dataset.ready === mode,
      mode,
    );
    await p.evaluate(() => document.fonts.ready);
  }
  async function snapshot(p = page) {
    return p.evaluate(() => ({
      load: Number(
        document.querySelector('[data-tag="load"]').dataset.coordinate,
      ),
      effort: Number(
        document.querySelector('[data-tag="effort"]').dataset.coordinate,
      ),
      fulcrum: Number(document.querySelector("#fulcrum-position").value),
      loadMass: Number(document.querySelector("#mass-load").value),
      effortMass: Number(document.querySelector("#mass-effort").value),
    }));
  }
  async function controls(show, p = page) {
    const hidden = await p.locator("#controls-panel").isHidden();
    if (hidden === show) await p.locator("#controls-toggle").click();
  }
  async function setNumber(id, value, p = page) {
    await controls(true, p);
    await p.locator("#" + id).fill(String(value));
    await p.locator("#" + id).press("Tab");
    assert.ok(valid(await snapshot(p)), `${id} keeps valid state`);
  }
  async function layout(p = page) {
    await p.waitForTimeout(80);
    const data = await p.evaluate(() => {
      const rect = (e) => {
        const r = e.getBoundingClientRect();
        return {
          x: r.x,
          y: r.y,
          w: r.width,
          h: r.height,
          right: r.right,
          bottom: r.bottom,
        };
      };
      const math = document.querySelector("#math-panel");
      return {
        tags: [...document.querySelectorAll(".part-tag")].map((e) => ({
          ...rect(e),
          textWidth: e.scrollWidth,
          innerWidth: e.clientWidth,
        })),
        top: rect(document.querySelector("#top")),
        math: math.hidden ? null : rect(math),
        width: innerWidth,
        height: innerHeight,
        scroll: document.documentElement.scrollWidth,
        canvas: rect(document.querySelector("canvas")),
      };
    });
    assert.equal(data.scroll, data.width, "no horizontal page overflow");
    assert.equal(data.canvas.w, data.width);
    assert.equal(data.canvas.h, data.height);
    for (const r of data.tags) {
      assert.ok(
        r.textWidth <= r.innerWidth + 1,
        `role and mass text fit inside labels: ${JSON.stringify(r)}`,
      );
      assert.ok(
        r.x >= -1 && r.right <= data.width + 1,
        "labels stay in viewport",
      );
      assert.ok(r.y >= data.top.bottom - 1, "labels clear toolbar");
      assert.ok(r.bottom < (data.math?.y ?? data.height), "labels clear math");
    }
    for (let i = 0; i < 3; i++)
      for (let j = i + 1; j < 3; j++) {
        const a = data.tags[i],
          b = data.tags[j];
        assert.ok(
          a.right <= b.x ||
            b.right <= a.x ||
            a.bottom <= b.y ||
            b.bottom <= a.y,
          "labels stay separate",
        );
      }
  }
  await page.goto(url);
  await ready();
  await layout();
  assert.deepEqual(await snapshot(), DEFAULT);
  assert.equal(await page.locator("#load-product").innerText(), "20,000");
  assert.equal(await page.locator("#effort-product").innerText(), "20,000");
  assert.equal(await page.locator("#ima-result").innerText(), "2×");
  await page.screenshot({ path: "artifacts/balanced.png" });
  await page.locator("#side").click();
  await page.locator("#swap").click();
  assert.deepEqual(await snapshot(), swapPositions(DEFAULT));
  assert.equal(await page.locator("#load-product").innerText(), "40,000");
  assert.equal(await page.locator("#effort-product").innerText(), "10,000");
  assert.equal(await page.locator("#ima-result").innerText(), "0.5×");
  assert.equal(await page.locator("#app").getAttribute("data-held"), "true");
  assert.equal(
    Number(await page.locator("#app").getAttribute("data-angle")),
    0,
  );
  const loadY = Number(
    await page.locator('[data-point="load"]').getAttribute("cy"),
  );
  await page.locator("#hold").click();
  await page.waitForFunction(
    () => Number(document.querySelector("#app").dataset.angle) < -0.1,
  );
  assert.ok(
    Number(await page.locator('[data-point="load"]').getAttribute("cy")) >
      loadY,
    "visible load moves down",
  );
  await page.screenshot({ path: "artifacts/swapped-released.png" });
  await page.locator("#swap").click();
  assert.deepEqual(await snapshot(), DEFAULT);
  assert.equal(await page.locator("#app").getAttribute("data-held"), "false");
  assert.equal(
    Number(await page.locator("#app").getAttribute("data-angle")),
    0,
    "swap clears stale angle and velocity",
  );
  await page.locator("#preset").selectOption("offset");
  const off = await snapshot();
  await page.locator("#swap").click();
  assert.deepEqual(await snapshot(), swapPositions(off));
  await page.locator("#swap").click();
  assert.deepEqual(await snapshot(), off);
  await page.reload();
  await ready();
  assert.deepEqual(await snapshot(), off);
  assert.equal(await page.locator("#app").getAttribute("data-held"), "false");
  // All UI input paths go through the same constrained role model.
  await page.locator("#reset").click();
  await setNumber("distance-load", 999);
  assert.equal((await snapshot()).load, -250);
  await setNumber("distance-effort", -100);
  assert.equal((await snapshot()).effort, 75);
  await setNumber("fulcrum-position", 999);
  assert.equal((await snapshot()).fulcrum, 0);
  await setNumber("fulcrum-position", -999);
  assert.equal((await snapshot()).fulcrum, -175);
  await setNumber("mass-load", 38);
  assert.equal((await snapshot()).loadMass, 50);
  await setNumber("mass-effort", 10000);
  assert.equal((await snapshot()).effortMass, 1000);
  await page.locator("#mass-load").fill("");
  await page.locator("#mass-load").press("Tab");
  assert.equal(
    (await snapshot()).loadMass,
    50,
    "empty numeric input restores previous mass",
  );
  for (const id of [
    "mass-slider-load",
    "mass-slider-effort",
    "distance-slider-load",
    "distance-slider-effort",
    "fulcrum-slider",
  ]) {
    await page.locator("#" + id).evaluate((input) => {
      input.value = input.max;
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
    assert.ok(valid(await snapshot()));
    await page.locator("#" + id).focus();
    await page.keyboard.press("Home");
    assert.ok(valid(await snapshot()));
  }
  for (const b of await page.locator("[data-scale]").all()) {
    await b.click();
    assert.ok(valid(await snapshot()));
  }
  await controls(false);
  await page.locator("#reset").click();
  await page.locator("#side").click();
  await page.locator('[data-tag="load"]').focus();
  for (let i = 0; i < 20; i++) await page.keyboard.press("ArrowRight");
  assert.equal((await snapshot()).load, -75);
  await page.keyboard.press("ArrowUp");
  assert.equal((await snapshot()).loadMass, 225);
  await page.locator('[data-tag="fulcrum"]').focus();
  for (let i = 0; i < 20; i++) await page.keyboard.press("ArrowLeft");
  assert.equal((await snapshot()).fulcrum, 0);
  assert.ok(valid(await snapshot()));
  const tag = await page.locator('[data-tag="effort"]').boundingBox();
  await page.mouse.move(tag.x + tag.width / 2, tag.y + tag.height / 2);
  await page.mouse.down();
  await page.mouse.move(10, tag.y + tag.height / 2, { steps: 8 });
  await page.mouse.up();
  assert.equal(
    (await snapshot()).effort,
    75,
    "dragging cannot cross the fulcrum",
  );
  const beforeCancel = await snapshot(),
    tag2 = await page.locator('[data-tag="effort"]').boundingBox();
  await page.mouse.move(tag2.x + tag2.width / 2, tag2.y + tag2.height / 2);
  await page.mouse.down();
  await page.mouse.move(tag2.x + 250, tag2.y + tag2.height / 2, { steps: 6 });
  await page.keyboard.press("Escape");
  await page.mouse.up();
  assert.deepEqual(await snapshot(), beforeCancel, "Escape cancels drag");
  await page.locator("#reset").click();
  await page.locator("#side").click();
  const pivot = page.locator('[data-point="fulcrum"]'),
    px = Number(await pivot.getAttribute("cx")),
    py = Number(await pivot.getAttribute("cy"));
  await page.mouse.move(px, py);
  await page.mouse.down();
  await page.mouse.move(px + 40, py, { steps: 5 });
  await page.mouse.up();
  assert.equal(
    await page.locator('[data-tag="fulcrum"]').getAttribute("aria-pressed"),
    "true",
  );
  assert.ok((await snapshot()).fulcrum > 0, "actual 3D fulcrum is draggable");
  // Panel content, tabs, and predictions cannot resize or reframe the scene.
  await page.locator("#reset").click();
  await page.locator("#fit").click();
  await page.waitForTimeout(200);
  const canvas = await page.locator("canvas").boundingBox(),
    points = await page
      .locator("#leaders circle")
      .evaluateAll((nodes) =>
        nodes.map((n) => [n.getAttribute("cx"), n.getAttribute("cy")]),
      );
  await page.locator("#math-toggle").click();
  await controls(true);
  assert.deepEqual(await page.locator("canvas").boundingBox(), canvas);
  const afterPoints = await page
    .locator("#leaders circle")
    .evaluateAll((nodes) =>
      nodes.map((n) => [n.getAttribute("cx"), n.getAttribute("cy")]),
    );
  for (let i = 0; i < points.length; i++)
    for (let axis = 0; axis < 2; axis++)
      assert.ok(
        Math.abs(Number(afterPoints[i][axis]) - Number(points[i][axis])) < 1e-6,
        "panels preserve projected apparatus coordinates",
      );
  await controls(false);
  await page.locator("#math-toggle").click();
  await page.locator("#tab-force").click();
  assert.equal(await page.locator("#force-math").isVisible(), true);
  assert.match(await page.locator("#force-math").innerText(), /kg/);
  assert.match(await page.locator("#force-math").innerText(), /N·m/);
  await page.locator("#tab-force").focus();
  await page.keyboard.press("ArrowLeft");
  assert.equal(await page.locator("#balance-math").isVisible(), true);
  await page
    .locator(
      '#balance-math [data-tip="Ideal mechanical advantage (IMA) is effort-arm distance divided by load-arm distance. It describes the advantage provided by the lever’s shape."]',
    )
    .focus();
  assert.equal(await page.locator("#tooltip").isVisible(), true);
  await page.keyboard.press("Escape");
  assert.equal(await page.locator("#tooltip").isHidden(), true);
  await setNumber("distance-effort", 175);
  assert.match(await page.locator("#step-note").innerText(), /between/);
  await setNumber("mass-load", 1000);
  await setNumber("distance-load", 250);
  await setNumber("distance-effort", 75);
  assert.match(await page.locator("#step-note").innerText(), /outside/);
  await controls(false);
  // Save/reload extreme arrangements with both identities on each side.
  const extremes = [
    { load: -250, fulcrum: -175, effort: 250, loadMass: 25, effortMass: 1000 },
    { load: -250, fulcrum: 175, effort: 250, loadMass: 1000, effortMass: 25 },
  ];
  let i = 0;
  for (const s of extremes.flatMap((s) => [s, swapPositions(s)])) {
    await page.evaluate(
      ({ state, key }) =>
        localStorage.setItem(
          key,
          JSON.stringify({ state, held: false, reduced: true, showMath: true }),
        ),
      { state: s, key: STORAGE_KEY },
    );
    await page.reload();
    await ready();
    await page.locator("#side").click();
    await layout();
    assert.deepEqual(await snapshot(), s);
    assert.ok(
      Math.abs(Number(await page.locator("#app").getAttribute("data-angle"))) >
        0.2,
    );
    await page.screenshot({ path: `artifacts/extreme-${++i}.png` });
  }
  await page.locator("#reset").click();
  await page.locator("#orbit").click();
  await page.locator("#orbit").click();
  await layout();
  await page.screenshot({ path: "artifacts/rear-view.png" });
  for (const [width, height] of [
    [1024, 768],
    [390, 844],
    [844, 390],
    [1366, 768],
  ]) {
    await page.setViewportSize({ width, height });
    await page.locator("#fit").click();
    if (width === 390) {
      await setNumber("mass-load", 1000);
      await setNumber("mass-effort", 1000);
      await controls(false);
    }
    await layout();
    await controls(true);
    assert.deepEqual(await page.locator("canvas").boundingBox(), {
      x: 0,
      y: 0,
      width,
      height,
    });
    await page.screenshot({
      path: `artifacts/controls-${width}x${height}.png`,
    });
    await controls(false);
    await page.screenshot({
      path: `artifacts/viewport-${width}x${height}.png`,
    });
  }
  await page.locator("#help").click();
  await page.locator("#reduced").uncheck();
  await page.getByRole("button", { name: "Back to the Workbench" }).click();
  await page.goto(origin + "/");
  await ready();
  assert.match(await page.title(), /Levers: Load, Effort, and Distance/);
  // Context loss transitions to the same functional fallback without corrupting state.
  const contextState = await snapshot();
  await page
    .locator("canvas")
    .evaluate((c) =>
      c.dispatchEvent(new Event("webglcontextlost", { cancelable: true })),
    );
  await ready(page, "fallback");
  assert.deepEqual(await snapshot(), contextState);
  const fallback = await browser.newPage({
    viewport: { width: 1024, height: 768 },
  });
  watch(fallback);
  await fallback.addInitScript(() => {
    const get = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (kind, ...rest) {
      return kind.startsWith("webgl") ? null : get.call(this, kind, ...rest);
    };
    Object.defineProperty(window, "localStorage", {
      get() {
        throw Error("Storage unavailable");
      },
    });
  });
  await fallback.goto(url);
  await ready(fallback, "fallback");
  await fallback.locator("#swap").click();
  assert.deepEqual(await snapshot(fallback), swapPositions(DEFAULT));
  assert.equal(
    await fallback
      .locator('[data-object="load"]')
      .getAttribute("data-coordinate"),
    "200",
  );
  assert.equal(await fallback.locator("#ima-result").innerText(), "0.5×");
  await fallback.locator("#hold").click();
  await fallback.waitForFunction(
    () => Number(document.querySelector("#app").dataset.angle) < -0.1,
  );
  await setNumber("mass-effort", 400, fallback);
  await controls(false, fallback);
  assert.equal(await fallback.locator("#beam-status").innerText(), "Balanced");
  const fallbackNotice = await fallback.locator("#fallback > p").boundingBox();
  const fallbackMath = await fallback.locator("#math-panel").boundingBox();
  assert.ok(
    fallbackNotice.y + fallbackNotice.height < fallbackMath.y,
    "diagram instructions clear the math panel",
  );
  await fallback.screenshot({ path: "artifacts/fallback.png" });
  await fallback.locator("#reset").click();
  assert.deepEqual(
    await snapshot(fallback),
    DEFAULT,
    "Reset works without WebGL",
  );
  await fallback.locator("#preset").selectOption("offset");
  assert.deepEqual(
    await snapshot(fallback),
    PRESETS.offset,
    "Presets work without WebGL",
  );
  await setNumber("fulcrum-position", 0, fallback);
  assert.ok(valid(await snapshot(fallback)));
  const invalid = await browser.newPage();
  watch(invalid);
  await invalid.addInitScript(
    (key) =>
      localStorage.setItem(
        key,
        JSON.stringify({
          state: {
            load: 100,
            effort: 200,
            fulcrum: 0,
            loadMass: 200,
            effortMass: 100,
          },
        }),
      ),
    STORAGE_KEY,
  );
  await invalid.goto(url);
  await ready(invalid);
  assert.deepEqual(
    await snapshot(invalid),
    DEFAULT,
    "invalid saved ordering is rejected",
  );
  assert.deepEqual(errors, [], "no uncaught page errors");
  assert.deepEqual(external, [], "all assets stay local");
  console.log(
    "PASS: browser contracts, model/UI/save consistency, drag/numeric/keyboard paths, layouts, WebGL-loss and no-WebGL/storage fallbacks.",
  );
} finally {
  await browser?.close();
  server.kill();
}
