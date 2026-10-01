import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";
const manifest = JSON.parse(await readFile("dist/build-manifest.json", "utf8"));
const artifact = `artifacts/builds/${manifest.id}`;
assert.deepEqual(JSON.parse(await readFile(`${artifact}/build-manifest.json`, "utf8")), manifest);
assert.deepEqual(JSON.parse(await readFile("artifacts/current-build.json", "utf8")), manifest);
for (const root of ["dist", artifact]) {
  const html = await readFile(`${root}/index.html`, "utf8");
  assert.ok(html.includes(`<div id="build-identity" aria-label="Build Identifier" hidden>${manifest.id}</div>`));
  assert.ok(html.includes(`id="build-summary">${manifest.version} ${manifest.scope.startsWith('pr-') ? '-PR'+manifest.scope.slice(3) : 'Local Review'}`) || html.includes(`id="build-summary">${manifest.version}-PR${manifest.scope.slice(3)}`));
  assert.ok((await readFile(`${root}/BUILD_REPORT.md`, "utf8")).includes(manifest.id));
}
console.log(`BUILD VERIFIED ${manifest.id}`);
