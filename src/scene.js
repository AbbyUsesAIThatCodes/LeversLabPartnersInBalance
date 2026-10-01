import {gestureKind,gestureDelta} from './gesture.js';
import * as THREE from "three";
import { WorkshopScene } from "./workshop.js";
import {
  ROLES,
  DEFAULT,
  STOP,
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
  async makeRoom() {
    super.makeRoom();
    const inventory=()=>this.scene.children.filter(o=>o.name.startsWith('Retained')).map(o=>({name:o.name,position:o.position.toArray(),rotation:o.rotation.toArray(),scale:o.scale.toArray(),material:o.material?.uuid}));
    const before=inventory();
    for(const old of this.legacyRoom)this.scene.remove(old);
    const {createClassroom}=await import('./canonical-room/src/classroom.js');
    this.room=createClassroom();await this.room.ready;
    const anchor=this.room.anchors.GameAnchor_Lever.position;
    this.room.root.scale.setScalar(40);
    this.room.root.position.set(-anchor.x*40,-.12-anchor.y*40,-anchor.z*40);
    this.scene.add(this.room.root);
    this.roomInventory={before,after:inventory(),anchor:'GameAnchor_Lever',source:'28e31ff0fbf06ee5fd9fe58cb499f0ef0d757f9a'};
    this.scene.userData.roomIntegration=this.roomInventory;
    this.scene.fog=null;
  }
  setState(state) {
    this.state = { ...state };
    if (!this.apparatus) {
      this.scene.remove(this.moving, this.base);
      this.apparatus = createApparatus();
      const { moving, base, meshes, pickable } = this.apparatus;
      Object.assign(this, { moving, base, meshes, pickable });
      this.scene.add(moving, base);
    }
    this.apparatus.update(state, this.motion.angle);
    this.highlight(this.hovered);
    this.dirty = true;
    this.draw();
  }
  highlight(part) {
    this.hovered=part;
    for(const cue of this.apparatus?.cues??[]){
      const role=cue.userData.cueRole,picked=this.identifyFeedback?.role===role;
      cue.visible=this.identifying||role===(part||this.selected);
      cue.material.color.set(this.identifying?(picked?(this.identifyFeedback.correct?0x36c36d:0xed5252):0x75cfff):0x78ad82);
      cue.material.opacity=this.identifying?.5:.24;
    }
    this.dirty=true;
  }
  setIdentification(active, feedback) {
    this.identifying = active;
    this.identifyFeedback = feedback;
    this.highlight(null);
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
      if (this.held) this.motion = { angle: 0, velocity: 0 };
      else if (!this.paused) {
        if (this.reduced)
          this.motion = {
            angle: restingAngle(this.state, this.motion.angle), velocity: 0,
          };
        else this.motion = advance(this.state, this.motion, dt);
      }
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
    if (this.state) this.apparatus?.update(this.state, this.motion.angle);
    this.scene.updateMatrixWorld(true);
    this.renderer.render(this.scene, this.camera);
    this.dirty = false;
    this.callbacks.onFrame?.({
      positions: this.screenPositions(),
      angle: this.motion.angle,
      velocity: this.motion.velocity,
      direction: this.state ? measures(this.state).direction : "balance",
      held: this.held,
    });
  }
  // Fit the moving apparatus through its full travel.
  // The camera target remains low on the support; a projection offset places
  // the assembly in the clear area without resizing the full-window canvas.
  fitCamera(side = false) {
    const w = this.host.clientWidth, h = this.host.clientHeight;
    const area = this.callbacks.viewBounds?.() || {
      left: 10, right: w - 10, top: 90, bottom: h - 20,
    };
    const apparatus = this.apparatus || createApparatus();
    const points = [];
    for (const angle of [-STOP, 0, STOP]) {
      apparatus.update(this.state || DEFAULT, angle);
      for (const root of [apparatus.moving, apparatus.base]) root.traverse((object) => {
        if (!object.geometry) return;
        object.geometry.computeBoundingBox();
        const box = object.geometry.boundingBox;
        for (const x of [box.min.x, box.max.x])
          for (const y of [box.min.y, box.max.y])
            for (const z of [box.min.z, box.max.z])
              points.push(new THREE.Vector3(x, y, z).applyMatrix4(object.matrixWorld));
      });
    }
    if (this.apparatus) apparatus.update(this.state, this.motion.angle);
    else for (const root of [apparatus.moving, apparatus.base]) root.traverse((object) => {
      object.geometry?.dispose();
      object.material?.dispose();
    });
    this.camera.clearViewOffset();
    this.controls.target.set(0, 5.8, 0);
    const direction = new THREE.Vector3(side ? 0 : 6, side ? 2 : 28, 51).normalize();
    const boundsAt = (distance) => {
      this.camera.position.copy(this.controls.target).addScaledVector(direction, distance);
      this.camera.lookAt(this.controls.target);
      this.camera.updateMatrixWorld(true);
      const projected = points.map((p) => this.project(p));
      return {
        left: Math.min(...projected.map((p) => p.x)),
        right: Math.max(...projected.map((p) => p.x)),
        top: Math.min(...projected.map((p) => p.y)),
        bottom: Math.max(...projected.map((p) => p.y)),
      };
    };
    let near = this.controls.minDistance, far = 2048;
    for (let i = 0; i < 24; i++) {
      const distance = (near + far) / 2, b = boundsAt(distance);
      if (b.right - b.left > area.right - area.left ||
          b.bottom - b.top > area.bottom - area.top) near = distance;
      else far = distance;
    }
    const b = boundsAt(far);
    this.controls.maxDistance = Math.max(75, far * 2);
    this.camera.far = Math.max(900, far * 3);
    this.camera.setViewOffset(w, h,
      (b.left + b.right - area.left - area.right) / 2,
      (b.top + b.bottom - area.top - area.bottom) / 2, w, h);
    // Clear any unfinished orbit/zoom damping before applying a preset.
    const damping = this.controls.enableDamping;
    this.controls.enableDamping = false;
    this.controls.update();
    boundsAt(far);
    this.controls.update();
    this.controls.enableDamping = damping;
    this.fittedSide = side;
    this.fitDistance = far;
    this.draw();
  }
  resetCamera() {
    this.fitCamera(false);
  }
  sideCamera() {
    this.fitCamera(true);
  }
  resize(reset = false) {
    const w = this.host.clientWidth, h = this.host.clientHeight;
    if (!w || !h) return;
    if (!reset && this.lastSize?.w === w && this.lastSize?.h === h) return;
    const offset = this.camera.position.clone().sub(this.controls.target);
    const zoom = this.fitDistance ? offset.length() / this.fitDistance : 1;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.fitCamera(this.fittedSide);
    if (!reset && this.lastSize) {
      // A real window/fullscreen resize preserves orbit and relative zoom.
      this.camera.position.copy(this.controls.target)
        .add(offset.normalize().multiplyScalar(this.fitDistance * zoom));
      this.controls.update();
    }
    this.lastSize = { w, h };
    this.draw();
  }
  screenSign() {
    return this.project(new THREE.Vector3(10, HEIGHT, 0)).x >=
      this.project(new THREE.Vector3(-10, HEIGHT, 0)).x
      ? 1
      : -1;
  }
  beginDrag(event, part, kind = "auto") {
    if (event.button !== 0 || !event.isPrimary || !this.state) return false;
    this.select(part);
    // Weights slide along the tilted beam; the support moves horizontally.
    // Freeze this screen-space basis for the gesture so beam motion cannot
    // move a stationary pointer's requested coordinate.
    const angle = part === "fulcrum" ? 0 : this.motion.angle;
    const point = (offset) => this.project(new THREE.Vector3(
      this.state.fulcrum / SCALE + offset * Math.cos(angle),
      HEIGHT + offset * Math.sin(angle),
      0,
    ));
    const a = point(-10), b = point(10);
    const dx = b.x - a.x,
      dy = b.y - a.y,
      denom = dx * dx + dy * dy;
    if (part === "fulcrum" && denom < 1600) {
      this.callbacks.onNotice?.(
        "Use Side view or the position controls to move along the beam.",
      );
      return false;
    }
    event.preventDefault();
    event.stopImmediatePropagation();
    this.drag = {
      part,
      kind:part === "fulcrum" ? "position" : kind,
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
    this.dirty = true;
    this.callbacks.onDrag?.();
    return true;
  }
  installPointers() {
    this.canvas.addEventListener(
      "pointerdown",
      (e) => {
        const p = this.hit(e);
        if (p && this.callbacks.onIdentify?.(p)) {
          e.preventDefault();
          e.stopImmediatePropagation();
          return;
        }
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
        if(d.kind === "auto")d.kind=gestureKind(e.clientX-d.startX,e.clientY-d.startY);
        if(d.kind === "auto")return;
        const field = d.kind === "mass" ? massKey(d.part) : d.part;
        const delta=gestureDelta(d,e.clientX,e.clientY);
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
