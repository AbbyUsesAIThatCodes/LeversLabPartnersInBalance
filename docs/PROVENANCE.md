# Source Provenance

The source repositories were read at these exact commits on September 27, 2026.
They remain independent and were not changed or deployed.

| Source                                                                                                                          | Exact Commit                               | Adapted Components                                                                                                                                                                                       |
| ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [ThreeKindsOfLevers](https://github.com/AbbyUsesAIThatCodes/ThreeKindsOfLevers/tree/b017384dbcd433ab34e8c432e2a5d4a94846e6e2)   | `b017384dbcd433ab34e8c432e2a5d4a94846e6e2` | Workshop room, camera, pointer infrastructure, procedural rail and support, role colors, label selection/dragging, build/server scripts, local fonts/licenses, browser-check approach                    |
| [MechanicalAdvantage](https://github.com/AbbyUsesAIThatCodes/MechanicalAdvantage/tree/d1c2ffb7d214793b01049832305e56a6ed54f249) | `d1c2ffb7d214793b01049832305e56a6ed54f249` | `src/metric/model.js` mass-distance/SI/IMA calculations and motion integration; `src/metric/app.js` equations, tooltips, conversions, steps/range explanations; `public/lab.css` math-panel presentation |

ThreeKindsOfLevers itself attributes its workshop to MechanicalAdvantage commit
`f316c49745a394e0dd100ff4e8d01c0ae4431286`, descended from LeverWorkshop. That
attribution is retained in the third-party notices.

## Changes for This Game

- A/B masses and fixed-center distances become role-owned `loadMass` and
  `effortMass`, with signed `load`, `effort`, and `fulcrum` coordinates.
- All position and distance mutations enforce first-class ordering. There is no
  lever-class selector, automatic class detection, or role selector.
- `swapPositions` exchanges coordinates without changing role identity or mass.
- Persistent procedural meshes replace the old load cylinder/effort ring with a
  supported gold crate and teal hanging weight. Decorative force arrows were
  later removed from both renderers; the labeled application points remain.
- The fulcrum moves; torque uses signed displacement from its current position.
  Quantitative integration replaces the predetermined lift animation.
- Title, package, served path, saved-state key, README, roadmap, and tests belong
  to LeversLoadEffortDistance. No source deployment configuration is copied.

No VEX CAD assets or private curriculum attachments are needed or distributed.
