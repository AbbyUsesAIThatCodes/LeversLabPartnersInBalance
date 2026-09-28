import { measures, massKey, GRAVITY } from "./model.js";
const $ = (s) => document.querySelector(s);
export const fmt = (n, d = 4) =>
  Number(n.toFixed(d)).toLocaleString("en-US", { maximumFractionDigits: d });
const tips = {
  g: "g means gram: a unit of mass. Mass tells how much matter an object has. 1,000 g = 1 kg.",
  kg: "kg means kilogram: 1 kilogram is 1,000 grams.",
  mm: "mm means millimeter: a small unit of length. 10 mm = 1 cm; 1,000 mm = 1 m.",
  m: "m means meter: 1 meter is 1,000 millimeters.",
  N: "N means newton: a unit of force. Here it measures the downward pull of gravity on the mass.",
  "N/kg":
    "N/kg means newtons per kilogram. Near Earth, gravity pulls with about 9.81 N on each kilogram.",
  "N·m":
    "N·m means newton-meter: force multiplied by its perpendicular distance from the fulcrum. It measures turning effect (torque).",
  "g·mm":
    "g·mm means gram-millimeter: mass multiplied by distance. Compare the two sides using this shortcut; both masses feel the same gravity.",
  times:
    "Multiply: combine a force or mass with its distance. Twice either value gives twice the turning effect.",
  divide:
    "Divide: find how many times the bottom value fits into the top value.",
  equals: "Equals: both sides have the same value.",
  approx:
    "Approximately equal: this displayed number is rounded. The model calculates using the full value.",
  ima: "Ideal mechanical advantage (IMA) is effort-arm distance divided by load-arm distance. It describes the advantage provided by the lever’s shape.",
  effort:
    "Effort is the input force used to balance or move the load. In this lab one hanging weight supplies that force.",
  load: "Load is the force you want the lever to balance or move. The gold crate rests on the beam and tilts with it. This ideal model applies its downward force at the labeled beam-axis point; it does not simulate the crate’s full center of mass.",
  fulcrum:
    "The fulcrum is the movable pivot. Measure each arm along the beam from its center to the labeled force point.",
  balance:
    "The two turning effects are equal. The lever can remain level when released.",
};
export const tip = (text, keyOrText, cls = "") =>
  `<span class="tip ${cls}" tabindex="0" data-tip="${tips[keyOrText] || keyOrText}">${text}</span>`;
export const unit = (u) => tip(u, u),
  op = (symbol, k) => tip(symbol, k);
const value = (n, u, cls = "") =>
  `<span class="${cls}">${fmt(n)} ${unit(u)}</span>`;
const equalSign = (n, decimals = 4) =>
  Number(n.toFixed(decimals)) === n ? op("=", "equals") : op("≈", "approx");
export function renderMath(state) {
  const m = measures(state),
    balanced = m.direction === "balance";
  const needed =
    Number.isInteger(m.neededMass / 25) &&
    m.neededMass >= 25 &&
    m.neededMass <= 1000;
  const comparison = balanced ? "=" : m.loadMoment > m.effortMoment ? ">" : "<";
  $("#balance-math").innerHTML = `<div class="math-grid">
  <div class="math-cell"><h2>1 · Compare the Turning Effects</h2><div class="turning"><span class="load-color">Load: ${value(state.loadMass, "g")} ${op("×", "times")} ${value(m.loadArm, "mm")}</span><b id="load-product">${fmt(m.loadMoment)}</b><span class="effort-color">Effort: ${value(state.effortMass, "g")} ${op("×", "times")} ${value(m.effortArm, "mm")}</span><b id="effort-product">${fmt(m.effortMoment)}</b></div><p>${value(m.loadMoment, "g·mm")} ${tip(comparison, balanced ? "equals" : `${m.direction === "load" ? "Load" : "Effort"} has the larger turning effect.`)} ${value(m.effortMoment, "g·mm")}</p><p><b>${balanced ? "Equal turning effects → balanced." : `${m.direction === "load" ? "Load" : "Effort"} side goes down when released.`}</b></p></div>
  <div class="math-cell"><h2>2 · Ideal Mechanical Advantage</h2><div class="equation">${tip("IMA", "ima")} ${op("=", "equals")} <span class="fraction"><span>effort arm</span><span>load arm</span></span> ${op("=", "equals")} <span class="fraction"><span>${value(m.effortArm, "mm", "effort-color")}</span><span>${value(m.loadArm, "mm", "load-color")}</span></span> ${equalSign(m.ima, 2)} <span id="ima-result" class="math-result">${fmt(m.ima, 2)}×</span></div><p>${m.ima === 1 ? "Equal arms need equal masses." : m.ima > 1 ? "A longer effort arm needs less effort force at balance." : "A shorter effort arm needs more effort force at balance."}</p></div>
  <div class="math-cell"><h2>3 · Required Effort Mass</h2><div class="equation compact"><span class="fraction"><span>${value(state.loadMass, "g", "load-color")} ${op("×", "times")} ${value(m.loadArm, "mm", "load-color")}</span><span>${value(m.effortArm, "mm", "effort-color")}</span></span> ${equalSign(m.neededMass)} <span id="needed-mass" class="math-result">${value(m.neededMass, "g", "effort-color")}</span></div><p>${tip("Divide by the effort-arm distance.", "divide")} Find the effort mass needed to balance the load.</p><p id="step-note">${needed ? "Try it, then release the lever." : m.neededMass < 25 || m.neededMass > 1000 ? "This exact answer is outside the 25–1,000 g range. Change an arm length or the load mass." : "This exact answer is between the available 25 g steps. Change an arm length or the load mass."}</p></div></div>
  <p class="math-footnote">Distances run from the <b>fulcrum</b> to each labeled force point along the beam. Force ratio equals IMA <b>only at ideal balance</b>. ${tip("≈ means rounded.", "approx")}</p>`;
  $("#force-math").innerHTML = `<div class="conversion-grid">${[
    "load",
    "effort",
  ]
    .map((role) => {
      const mass = state[massKey(role)],
        f = m[role + "Force"],
        distance = m[role + "Arm"],
        t = m[role + "Torque"];
      return `<div><h2 class="${role}-color">${role === "load" ? "Load" : "Effort"} · Mass → Force → Torque</h2><p>${value(mass, "g")} ${tip("÷", "Divide by 1,000 to change grams into kilograms.")} 1,000 ${op("=", "equals")} ${value(mass / 1000, "kg")}</p><p>${value(mass / 1000, "kg")} ${op("×", "times")} ${value(GRAVITY, "N/kg")} ${equalSign(f)} ${value(f, "N")}</p><p>${value(distance, "mm")} ${tip("÷", "Divide by 1,000 to change millimeters into meters.")} 1,000 ${op("=", "equals")} ${value(distance / 1000, "m")}</p><p>${value(f, "N")} ${op("×", "times")} ${value(distance / 1000, "m")} ${Number(f.toFixed(4)) === f ? equalSign(t) : op("≈", "approx")} ${value(t, "N·m")}</p></div>`;
    })
    .join(
      "",
    )}<div><h2>Why the Shortcut Works</h2><p>Both masses feel the same gravity. Multiplying both sides by the same number keeps the balance.</p><p>${tip("Load force ÷ effort force", "The actual force ratio equals IMA only at ideal balance.")} ${equalSign(m.forceRatio, 3)} <b id="force-ratio">${fmt(m.forceRatio, 3)}</b></p><p>${tip("IMA", "ima")} ${equalSign(m.ima, 3)} <b>${fmt(m.ima, 3)}</b> · ${balanced ? "the ratios match." : "not balanced yet; do not equate these ratios."}</p><p class="note">Gravity ≈ 9.81 ${unit("N/kg")}. Torque shown at level. When tilted, both torques multiply by cos(angle). Displayed results may be rounded; calculations use full precision.</p></div></div>`;
  for (const f of document.querySelectorAll(".fraction")) {
    f.classList.add("tip");
    f.tabIndex = 0;
    f.dataset.tip =
      "A fraction means divide: the entire top value divided by the bottom value. The mm units cancel in IMA.";
  }
}
export function installTooltips() {
  let target = null,
    timer;
  const box = $("#tooltip");
  function hide() {
    target?.removeAttribute("aria-describedby");
    target = null;
    box.hidden = true;
  }
  function show(t) {
    clearTimeout(timer);
    hide();
    target = t;
    box.textContent = t.dataset.tip;
    box.hidden = false;
    t.setAttribute("aria-describedby", "tooltip");
    const r = t.getBoundingClientRect(),
      b = box.getBoundingClientRect();
    box.style.left = `${Math.min(innerWidth - b.width - 12, Math.max(12, r.left + (r.width - b.width) / 2))}px`;
    box.style.top = `${r.top > b.height + 16 ? r.top - b.height - 10 : Math.min(innerHeight - b.height - 12, r.bottom + 10)}px`;
  }
  document.addEventListener("pointerover", (e) => {
    const t = e.target.closest("[data-tip]");
    if (t) show(t);
  });
  document.addEventListener("pointerout", (e) => {
    if (e.target.closest("[data-tip]")) timer = setTimeout(hide, 170);
  });
  box.addEventListener("pointerenter", () => clearTimeout(timer));
  box.addEventListener("pointerleave", hide);
  document.addEventListener("focusin", (e) => {
    const t = e.target.closest("[data-tip]");
    if (t) show(t);
    else hide();
  });
  document.addEventListener("focusout", hide);
  document.addEventListener("click", (e) => {
    const t = e.target.closest("[data-tip]");
    if (t) show(t);
    else hide();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") hide();
  });
  window.addEventListener("resize", hide);
  window.addEventListener("scroll", hide, true);
  return hide;
}
