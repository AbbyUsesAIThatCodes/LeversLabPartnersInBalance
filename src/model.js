// Adapted from ThreeKindsOfLevers and MechanicalAdvantage; see docs/PROVENANCE.md.
// Coordinates are signed mm along the beam. Identity and mass belong to roles.
export const ROLES = Object.freeze(["load", "fulcrum", "effort"]);
export const OBJECTS = Object.freeze(["load", "effort"]);
export const LIMIT = 250,
  STEP = 25,
  GAP = 75,
  GRAVITY = 9.81,
  STOP = Math.PI / 15;
export const MASS = Object.freeze({ min: 25, max: 1000, step: 25 });
export const DEFAULT = Object.freeze({
  load: -100,
  fulcrum: 0,
  effort: 200,
  loadMass: 200,
  effortMass: 100,
});
export const PRESETS = Object.freeze({
  double: DEFAULT,
  equal: Object.freeze({
    load: -150,
    fulcrum: 0,
    effort: 150,
    loadMass: 100,
    effortMass: 100,
  }),
  offset: Object.freeze({
    load: -175,
    fulcrum: -75,
    effort: 125,
    loadMass: 300,
    effortMass: 150,
  }),
});
export const massKey = (role) => `${role}Mass`;
export const arm = (state, role) => Math.abs(state[role] - state.fulcrum);
export function valid(state) {
  return (
    !!state &&
    ROLES.every(
      (role) =>
        Number.isFinite(state[role]) &&
        Math.abs(state[role]) <= LIMIT &&
        state[role] % STEP === 0,
    ) &&
    OBJECTS.every(
      (role) =>
        Number.isFinite(state[massKey(role)]) &&
        state[massKey(role)] >= MASS.min &&
        state[massKey(role)] <= MASS.max &&
        state[massKey(role)] % MASS.step === 0,
    ) &&
    (state.load - state.fulcrum) * (state.effort - state.fulcrum) < 0 &&
    OBJECTS.every((role) => arm(state, role) >= GAP)
  );
}
const numeric = (value) =>
  (typeof value === "number" ||
    (typeof value === "string" && value.trim() !== "")) &&
  Number.isFinite(Number(value));
const clampStep = (value, min, max) =>
  Math.max(min, Math.min(max, Math.round(value / STEP) * STEP));
export function positionBounds(state, role) {
  if (role === "fulcrum")
    return [
      Math.min(state.load, state.effort) + GAP,
      Math.max(state.load, state.effort) - GAP,
    ];
  return state[role] < state.fulcrum
    ? [-LIMIT, state.fulcrum - GAP]
    : [state.fulcrum + GAP, LIMIT];
}
export function distanceBounds(state, role) {
  return [
    GAP,
    state[role] < state.fulcrum ? LIMIT + state.fulcrum : LIMIT - state.fulcrum,
  ];
}
export function move(state, role, value) {
  if (!ROLES.includes(role) || !numeric(value)) return { ...state };
  const [min, max] = positionBounds(state, role);
  return { ...state, [role]: clampStep(Number(value), min, max) };
}
export function setDistance(state, role, value) {
  if (!OBJECTS.includes(role) || !numeric(value)) return { ...state };
  const [min, max] = distanceBounds(state, role);
  const distance = clampStep(Number(value), min, max);
  return move(
    state,
    role,
    state.fulcrum + Math.sign(state[role] - state.fulcrum) * distance,
  );
}
export function setMass(state, role, value) {
  if (!OBJECTS.includes(role) || !numeric(value)) return { ...state };
  return {
    ...state,
    [massKey(role)]: clampStep(Number(value), MASS.min, MASS.max),
  };
}
export function step(state, role, direction) {
  return [-1, 1].includes(direction)
    ? move(state, role, state[role] + direction * STEP)
    : { ...state };
}
export function swapPositions(state) {
  return { ...state, load: state.effort, effort: state.load };
}
export function measures(state) {
  const loadArm = arm(state, "load"),
    effortArm = arm(state, "effort");
  const loadMoment = state.loadMass * loadArm,
    effortMoment = state.effortMass * effortArm;
  const loadForce = (state.loadMass / 1000) * GRAVITY,
    effortForce = (state.effortMass / 1000) * GRAVITY;
  return {
    loadArm,
    effortArm,
    loadMoment,
    effortMoment,
    loadForce,
    effortForce,
    loadTorque: (loadForce * loadArm) / 1000,
    effortTorque: (effortForce * effortArm) / 1000,
    direction:
      loadMoment === effortMoment
        ? "balance"
        : loadMoment > effortMoment
          ? "load"
          : "effort",
    ima: effortArm / loadArm,
    neededMass: loadMoment / effortArm,
    forceRatio: loadForce / effortForce,
  };
}
// Ideal vertical point loads at labeled beam-axis points, not mesh centers of
// mass (including the seated crate's height). Positive rotation raises +x.
export function torque(state, angle = 0) {
  return (
    ((-(
      state.loadMass * (state.load - state.fulcrum) +
      state.effortMass * (state.effort - state.fulcrum)
    ) *
      GRAVITY) /
      1e6) *
      Math.cos(angle) || 0
  );
}
export function restingAngle(state) {
  return Math.sign(torque(state)) * STOP;
}
export function advance(state, motion, seconds) {
  if (!Number.isFinite(seconds) || seconds <= 0) return { ...motion };
  const elapsed = Math.min(seconds, 0.1),
    count = Math.ceil(elapsed * 240),
    dt = elapsed / count;
  const inertia = OBJECTS.reduce(
    (sum, role) =>
      sum + (state[massKey(role)] / 1000) * (arm(state, role) / 1000) ** 2,
    0,
  );
  let { angle, velocity } = motion;
  for (let i = 0; i < count; i++) {
    // Illustrative point-mass motion; damping is visual settling, not static friction.
    velocity =
      (velocity + (torque(state, angle) / inertia) * dt) * Math.exp(-4 * dt);
    angle += velocity * dt;
    if (Math.abs(angle) > STOP) {
      angle = Math.sign(angle) * STOP;
      velocity = 0;
    }
  }
  return { angle, velocity };
}
export const STORAGE_KEY = "levers-load-effort-distance-v1";
export function restore(raw) {
  const defaults = {
    state: { ...DEFAULT },
    held: true,
    showMath: true,
    reduced: false,
  };
  try {
    const saved = JSON.parse(raw);
    if (!valid(saved?.state)) return defaults;
    return {
      state: Object.fromEntries(
        Object.keys(DEFAULT).map((k) => [k, saved.state[k]]),
      ),
      held: saved.held !== false,
      showMath: saved.showMath !== false,
      reduced: saved.reduced === true,
    };
  } catch {
    return defaults;
  }
}
