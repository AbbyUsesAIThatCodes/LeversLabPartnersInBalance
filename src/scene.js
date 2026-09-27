import * as THREE from "three";
import { WorkshopScene } from "./workshop.js";
import {
  ROLES,
  move,
  step,
  measures,
  advance,
  restingAngle,
  setMass,
  massKey,
} from "./model.js";
import { createApparatus, HEIGHT, SCALE } from "./apparatus.js";

export class LeverScene extends WorkshopScene {
  makeRoom() {
    super.makeRoom();
    // Same classroom backdrop as the latest Mechanical Advantage workbench.
    const wall = this.box(110, 48, 0.4, 0xd8dfd0, 0, 18, -32);
    wall.castShadow = false;
    wall.receiveShadow = false;
    this.classroom = [
      wall,
      this.box(30, 12, 0.45, 0x847453, 1, 15, -31.6),
      this.box(28.8, 10.8, 0.16, 0x355850, 1, 15, -31.3),
      this.box(31, 0.35, 1.2, 0xae9a76, 1, 8.9, -30.9),
    ];
  }
  setState(state) {
    this.state = { ...state };
    this.motion = { angle: 0, velocity: 0 };
    if (!this.apparatus) {
      this.scene.remove(this.moving, this.base);
      this.apparatus = createApparatus();
      const { moving, base, meshes, pickable } = this.apparatus;
      Object.assign(this, { moving, base, meshes, pickable });
      this.scene.add(moving, base);
    }
    this.apparatus.update(state, 0);
    this.highlight(this.hovered);
    this.dirty = true;
    this.draw();
  }
  highlight(part) {
    this.hovered = part;
    for (const mesh of this.meshes || []) {
      mesh.material.emissive.set(
        mesh.userData.part && mesh.userData.part === (part || this.selected)
          ? 0x376b2a
          : 0,
      );
      mesh.material.emissiveIntensity = 0.35;
    }
    this.dirty = true;
  }
  frame(time) {
    if (!this.active) {
      this.frameTime = null;
      return;
    }
    const dt =
      this.frameTime === null
        ? 0
        : Math.max(0, Math.min(0.1, (time - this.frameTime) / 1000));
    this.frameTime = time;
    const old = this.motion.angle;
    if (this.state) {
      if (this.held || this.drag) this.motion = { angle: 0, velocity: 0 };
      else if (this.reduced)
        this.motion = { angle: restingAngle(this.state), velocity: 0 };
      else this.motion = advance(this.state, this.motion, dt);
    }
    const changed = this.drag ? false : this.controls.update();
    if (changed || this.dirty || old !== this.motion.angle) this.draw();
  }
  screenPositions() {
    if (!this.state || !this.apparatus) return {};
    const result = {};
    for (const role of ROLES) {
      result[role] = this.project(
        this.moving.localToWorld(
          new THREE.Vector3(
            (this.state[role] - this.state.fulcrum) / SCALE,
            0,
            0,
          ),
        ),
      );
      if (role !== "fulcrum") {
        const bounds = new THREE.Box3().setFromObject(
          this.apparatus.weights[role],
        );
        const corners = [];
        for (const x of [bounds.min.x, bounds.max.x])
          for (const y of [bounds.min.y, bounds.max.y])
            for (const z of [bounds.min.z, bounds.max.z])
              corners.push(this.project(new THREE.Vector3(x, y, z)));
        result[role + "top"] = Math.min(...corners.map((c) => c.y));
      }
    }
    return result;
  }
  draw() {
    if (!this.moving) return;
    this.scene.fog.near = Math.max(
      65,
      this.camera.position.distanceTo(this.controls.target) + 35,
    );
    this.scene.fog.far = this.scene.fog.near + 80;
    for (const o of this.classroom || [])
      o.visible = this.camera.position.z > -28;
    if (this.state) this.apparatus?.update(this.state, this.motion.angle);
    this.scene.updateMatrixWorld(true);
    this.renderer.render(this.scene, this.camera);
    this.dirty = false;
    this.callbacks.onFrame?.({
      positions: this.screenPositions(),
      angle: this.motion.angle,
      direction: this.state ? measures(this.state).direction : "balance",
      held: this.held || !!this.drag,
    });
  }
  resetCamera() {
    const short = this.host.clientHeight <= 500,
      wide = !short && this.host.clientWidth / this.host.clientHeight > 1.2,
      center = short || wide ? 8 : 6.5;
    const fit =
      Math.max(1, 1.45 / (this.host.clientWidth / this.host.clientHeight)) *
      (short ? 1.3 : 1);
    this.controls.target.set(0, center, 0);
    this.camera.position.set(
      10 * fit,
      center + 14 * fit,
      (wide ? 60 : 47) * fit,
    );
    this.controls.maxDistance = Math.max(75, 60 * fit);
    this.controls.update();
    this.draw();
  }
  sideCamera() {
    const short = this.host.clientHeight <= 500,
      wide = !short && this.host.clientWidth / this.host.clientHeight > 1.2,
      center = short || wide ? 8 : 6.5;
    const fit =
      Math.max(1, 1.45 / (this.host.clientWidth / this.host.clientHeight)) *
      (short ? 1.3 : 1);
    this.controls.target.set(0, center, 0);
    this.camera.position.set(0, center + 0.1, (wide ? 62 : 49) * fit);
    this.controls.update();
    this.draw();
  }
  screenSign() {
    return this.project(new THREE.Vector3(10, HEIGHT, 0)).x >=
      this.project(new THREE.Vector3(-10, HEIGHT, 0)).x
      ? 1
      : -1;
  }
  beginDrag(event, part, kind = "position") {
    if (event.button !== 0 || !event.isPrimary || !this.state) return false;
    this.select(part);
    const a = this.project(new THREE.Vector3(-10, HEIGHT, 0)),
      b = this.project(new THREE.Vector3(10, HEIGHT, 0));
    const dx = b.x - a.x,
      dy = b.y - a.y,
      denom = dx * dx + dy * dy;
    if (kind === "position" && denom < 1600) {
      this.callbacks.onNotice?.(
        "Use Side view or the position controls to move along the beam.",
      );
      return false;
    }
    event.preventDefault();
    event.stopImmediatePropagation();
    this.drag = {
      part,
      kind,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startState: { ...this.state },
      dx,
      dy,
      denom,
      target: event.currentTarget,
    };
    this.controls.enabled = false;
    this.drag.target.setPointerCapture?.(event.pointerId);
    this.motion = { angle: 0, velocity: 0 };
    this.dirty = true;
    this.callbacks.onDrag?.();
    return true;
  }
  installPointers() {
    this.canvas.addEventListener(
      "pointerdown",
      (e) => {
        const p = this.hit(e);
        if (p) this.beginDrag(e, p);
      },
      true,
    );
    this.canvas.addEventListener("pointermove", (e) => {
      if (!this.drag) {
        const p = this.hit(e);
        if (p !== this.hovered) this.highlight(p);
        this.canvas.style.cursor = p ? "grab" : "default";
      }
    });
    this.canvas.addEventListener("pointerleave", () => {
      if (!this.drag) this.highlight(null);
    });
    window.addEventListener(
      "pointermove",
      (e) => {
        const d = this.drag;
        if (!d || d.pointerId !== e.pointerId) return;
        e.preventDefault();
        const field = d.kind === "mass" ? massKey(d.part) : d.part;
        const delta =
          d.kind === "mass"
            ? (d.startY - e.clientY) * 5
            : (((e.clientX - d.startX) * d.dx + (e.clientY - d.startY) * d.dy) /
                d.denom) *
              500;
        const next =
          d.kind === "mass"
            ? setMass(this.state, d.part, d.startState[field] + delta)
            : move(this.state, d.part, d.startState[field] + delta);
        if (next[field] !== this.state[field]) this.callbacks.onChange?.(next);
      },
      { capture: true, passive: false },
    );
    for (const name of ["pointerup", "pointercancel"])
      window.addEventListener(
        name,
        (e) => {
          if (this.drag?.pointerId === e.pointerId)
            this.finishDrag(name === "pointercancel");
        },
        true,
      );
    window.addEventListener("blur", () => this.finishDrag(true));
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") this.finishDrag(true);
    });
    this.canvas.addEventListener("keydown", (e) => {
      if (
        this.selected &&
        ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)
      ) {
        e.preventDefault();
        this.callbacks.onStep?.(this.selected, e.key);
      }
    });
  }
}
