import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { createApparatus, HEIGHT, SCALE, COLORS } from "../src/apparatus.js";
import { DEFAULT, STOP, swapPositions } from "../src/model.js";
const box = (o) => new THREE.Box3().setFromObject(o),
  point = (o) => o.getWorldPosition(new THREE.Vector3());
const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-6, `${a} ≈ ${b}`);
test("the actual gold and teal meshes retain identity, dimensions, color and mass through swaps", () => {
  const a = createApparatus();
  a.update(DEFAULT, 0);
  const crate = a.weights.load.getObjectByName("gold-crate"),
    weight = a.weights.effort.getObjectByName("teal-weight");
  const size = box(crate).getSize(new THREE.Vector3());
  a.update(swapPositions(DEFAULT), STOP);
  assert.strictEqual(a.weights.load.getObjectByName("gold-crate"), crate);
  assert.strictEqual(a.weights.effort.getObjectByName("teal-weight"), weight);
  assert.equal(crate.material.color.getHex(), COLORS.load);
  assert.equal(weight.material.color.getHex(), COLORS.effort);
  close(box(crate).getSize(new THREE.Vector3()).x, size.x);
});
test("extreme coordinates and masses at both stops clear the desk and support, preserve load contact and force lines", () => {
  const a = createApparatus();
  let checked = 0;
  for (const mass of [25, 1000])
    for (const angle of [-STOP, 0, STOP])
      for (const left of [-250, 100])
        for (const right of [left + 150, 250])
          for (const fulcrum of [left + 75, right - 75])
            for (const reverse of [false, true]) {
              let state = {
                load: left,
                effort: right,
                fulcrum,
                loadMass: mass,
                effortMass: 1025 - mass,
              };
              if (reverse) state = swapPositions(state);
              a.update(state, angle);
              checked++;
              for (const role of ["load", "effort"]) {
                assert.ok(
                  box(a.attachments[role]).min.y > 0,
                  "attachments clear the desk",
                );
                const anchor = point(a.attachments[role]);
                close(
                  anchor.x,
                  state.fulcrum / SCALE +
                    ((state[role] - state.fulcrum) / SCALE) * Math.cos(angle),
                );
                const w = box(a.weights[role]);
                close(w.getCenter(new THREE.Vector3()).x, anchor.x);
                // Weight boxes are fully separated in x from every fulcrum mesh, even at the closest permitted arm.
                for (const support of a.base.children) {
                  const b = box(support);
                  assert.ok(!w.intersectsBox(b), "weight clears fulcrum");
                }
                const direction = new THREE.Vector3(0, 1, 0).applyQuaternion(
                  a.arrows[role].getWorldQuaternion(new THREE.Quaternion()),
                );
                close(direction.x, 0);
                close(direction.y, -1);
              }
              const tray = box(a.attachments.load.getObjectByName("load-tray"));
              const crate = box(a.weights.load.getObjectByName("gold-crate"));
              close(crate.min.y, tray.max.y);
              assert.ok(
                crate.min.x > tray.min.x && crate.max.x < tray.max.x,
                "crate fits supported tray",
              );
              assert.ok(box(a.beam).min.y > 0, "beam clears desk");
              const beamTopAtLoad =
                point(a.attachments.load).y +
                0.42 * Math.cos(angle) +
                1.3 * Math.sin(STOP);
              assert.ok(tray.min.y > beamTopAtLoad, "tray clears tilted rail");
            }
  console.log(
    `Checked ${checked} extreme geometry combinations at pivot height ${HEIGHT}.`,
  );
});
