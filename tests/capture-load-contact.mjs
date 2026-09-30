// Run after npm run build. Capture the same saved arrangements on either revision.
// Output: artifacts/load-contact/<before|after>-<webgl|diagram>-<scenario>.png
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import assert from "node:assert/strict";
import { DEFAULT, STORAGE_KEY, STOP, swapPositions } from "../src/model.js";

const label = process.argv[2] || "after";
assert.ok(["before", "after"].includes(label));
const port = Number(process.env.PORT || 4179);
const url = `http://127.0.0.1:${port}/LeverLab/`;
const server = spawn(process.execPath, ["scripts/serve.mjs"], {
  stdio: "ignore", env: { ...process.env, PORT: String(port) },
});
const extreme = { load: -250, fulcrum: -175, effort: 250, loadMass: 1000, effortMass: 25 };
const cases = [
  { name: "level", state: DEFAULT, angle: 0 },
  { name: "positive-stop", state: extreme, angle: STOP },
  { name: "negative-stop", state: swapPositions(extreme), angle: -STOP },
];
let browser;
try {
  let up = false;
  for (let i = 0; i < 60; i++) {
    try { if ((await fetch(url)).ok) { up = true; break; } } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  assert.ok(up, "server starts");
  const args = ["--no-sandbox"];
  if (process.env.BROWSER_SOFTWARE_GL === "1")
    args.push("--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader");
  browser = await chromium.launch({ headless: true, args, executablePath: process.env.CHROMIUM_EXECUTABLE || undefined });
  await mkdir("artifacts/load-contact", { recursive: true });
  for (const mode of ["webgl", "diagram"]) {
    for (const { name, state, angle } of cases) {
      const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
      await page.addInitScript(({ key, state, diagram }) => {
        localStorage.setItem(key, JSON.stringify({ state, held: false, reduced: true, showMath: true }));
        if (diagram) {
          const get = HTMLCanvasElement.prototype.getContext;
          HTMLCanvasElement.prototype.getContext = function (kind, ...rest) {
            return kind.startsWith("webgl") ? null : get.call(this, kind, ...rest);
          };
        }
      }, { key: STORAGE_KEY, state, diagram: mode === "diagram" });
      await page.goto(url);
      await page.waitForFunction(({ mode, angle }) => {
        const app = document.querySelector("#app");
        return app.dataset.ready === (mode === "webgl" ? "true" : "fallback") &&
          Math.abs(Number(app.dataset.angle) - angle) < 1e-8;
      }, { mode, angle });
      if (mode === "webgl") await page.locator("#side").click();
      await page.evaluate(() => document.fonts.ready);
      await page.mouse.move(0, 0);
      await page.screenshot({ path: `artifacts/load-contact/${label}-${mode}-${name}.png` });
      await page.close();
    }
  }
  console.log(`Captured six ${label} views: level and both stops, WebGL and diagram.`);
} finally {
  await browser?.close();
  server.kill();
}
