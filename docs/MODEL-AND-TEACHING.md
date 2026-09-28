# Model and Teaching Notes

## Force, Mass, and Distance

The Load is the gold crate; the Effort is the teal hanging weight. These roles
stay attached to the objects when they exchange sides. In this apparatus, the
load rests directly on the beam and the effort pulls through its cord. Both
applied forces are downward. A force arrow is not a motion arrow.

Beam coordinates are signed millimeters in the apparatus's coordinate system.
The UI reports each arm as the absolute difference between an object's
coordinate and the fulcrum coordinate. Moving the fulcrum changes both arms.
The other two objects stay in place.

At level:

- Load turning comparison = load mass in g × load arm in mm.
- Effort turning comparison = effort mass in g × effort arm in mm.
- Equal products mean ideal balance. The larger product's object descends.
- IMA = effort arm ÷ load arm, with no unit.
- Required effort mass = load mass × load arm ÷ effort arm.
- Force in N = mass in g ÷ 1,000 × 9.81 N/kg.
- Torque magnitude in N·m = force × arm in mm ÷ 1,000.

The actual load-force/effort-force ratio depends on the masses. It equals IMA
only at ideal balance. Display rounding does not change calculations or the
balance comparison. The UI identifies answers outside the mass range and
answers between available 25 g steps; it does not pretend a rounded answer is
exactly achievable.

## Swap Contract

| State      | Load             | Fulcrum | Effort           | Turning Products     | IMA |
| ---------- | ---------------- | ------- | ---------------- | -------------------- | --- |
| Initial    | 200 g at −100 mm | 0 mm    | 100 g at +200 mm | 20,000 = 20,000 g·mm | 2   |
| Swap Once  | 200 g at +200 mm | 0 mm    | 100 g at −100 mm | 40,000 > 10,000 g·mm | 0.5 |
| Swap Twice | 200 g at −100 mm | 0 mm    | 100 g at +200 mm | 20,000 = 20,000 g·mm | 2   |

The off-center preset uses Load −175 mm, Fulcrum −75 mm, Effort +125 mm.
Swapping puts Load at +125 and Effort at −175, leaving the fulcrum at −75.
This is an exact exchange, not a mirror around either zero or the fulcrum.

## Ideal Apparatus

Only the labeled masses contribute to static balance. The beam, cord,
carriages, and support are ideal and massless. The pivot has no static friction.
The gold crate's base rests directly on the top rail. It scales about its base,
rotates with the beam, and stays fixed at its selected position. Sliding and
independent tipping are constrained, without a raised holder or visible restraint.
The teal Effort counter-rotates to hang vertically. This is an idealized teaching
representation, not a construction specification.

**The crate represents an ideal downward point load at its labeled beam-axis
coordinate. Its rendered center of mass is not the modeled force point.** A real
rigid crate fixed above a tilted beam has an additional horizontal center-of-mass
offset and turning effect; this model deliberately omits that effect. It does
not simulate contact forces or claim physical equivalence to that full crate.
The effort is likewise a point load at its labeled beam-axis coordinate.
At level, both rendered centers align horizontally with their modeled points,
preserving the intended level-balance experiments.

Both force arrows stay vertically downward independently of crate rotation.
Decorative arrows are offset toward the viewer in 3D (rightward in the diagram)
for legibility; they communicate direction, not a different application point.
The guide-line dots in 3D and colored axis dots in the diagram identify the
modeled application points. Both renderers use this same point-load model.

For angle θ, both horizontal moment arms are the labeled arm times cos(θ).
Signed net torque is `−Σ(mass × (objectX − fulcrumX)) × g × cos(θ)` in SI units.
Both arms share the cosine factor, so the equilibrium ratio is unchanged.
The math panel intentionally reports torques at level.

## Motion and Clearance

Motion is illustrative: the model uses point-mass rotational inertia at the
labeled arms and exponential damping. It does not compute real crate or hanging
body inertia, transient contact forces, pendulum swing, or calibrated elapsed
motion. There is no artificial imbalance threshold. Travel stops at ±12°.
Reduced Animation jumps to the appropriate stop (or level if balanced).

The pivot sits 225 mm above the ideal desk in the visual scale. Labeled object
positions stay within ±250 mm along the beam; minimum arm length is 75 mm,
maximum 425 mm.
These limits allow the largest 1,000 g objects at both stops without desk
intersections. The crate base stays on the top rail at all supported masses and
angles, including after swaps; the largest crate slightly overhangs the rail's
width. The beam's end margin keeps the whole crate footprint within its length.

Editing resets angle and velocity while preserving the user's hold/release
setting. Dragging temporarily levels the beam, then a released arrangement
responds to its new turning effects. Escape, pointer cancellation, or window
blur restores the arrangement at the start of the drag. Reset returns to the
balanced default and holds it for prediction. Swapping twice restores masses
and coordinates, not historical transient motion.

## Access and Saved State

Keyboard labels, sliders, number boxes, and halve/double buttons use the same
constraints as dragging. Numeric values snap to allowed steps/ranges, with a
notice when adjusted. Objects cannot cross the fulcrum through these inputs;
Swap Positions is the intentional side-exchange action.

Saved state contains coordinates, role masses, hold/release, math visibility,
and reduced animation. It never stores transient angle or velocity. Loading
validates every field and rejects an invalid arrangement as a whole. WebGL
failure switches to an SVG diagram with the same model and numeric controls.
The diagram shares quantitative motion; local storage is optional.
