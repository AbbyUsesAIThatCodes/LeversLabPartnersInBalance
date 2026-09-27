# Core Verification

Verified locally on September 27, 2026, with Node.js 24.19.0 and Chromium
153.0.8010.0 using software WebGL. The normal Playwright browser download failed
in this environment; the same Playwright test runner used an alternate locally
installed Chromium executable via `CHROMIUM_EXECUTABLE`. No additional runtime
or repository dependency was introduced for that workaround.

## Automated Checks

| Check                  | Result and Coverage                                                                                                                                                                                                                                                                                                          |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm test`             | Seven tests pass. Enumerates all 1,360 legal coordinate arrangements and exercises constrained moves, keyboard steps, distances, masses, swaps, restore, and finite motion.                                                                                                                                                  |
| Required example       | 200 g × 100 mm = 100 g × 200 mm; IMA 2. After swap: 40,000 vs. 10,000 g·mm; IMA 0.5; the Load side descends.                                                                                                                                                                                                                 |
| Off-center swap        | Exact coordinates exchange; fulcrum and masses remain fixed. Two swaps restore the full role-coordinate state.                                                                                                                                                                                                               |
| Actual mesh checks     | Persistent mesh identity and color; 96 extreme mass/position/tilt combinations; tray contact; weights clear support; beam/attachments clear the desk; vertical force lines and downward arrows.                                                                                                                              |
| `npm run build`        | Self-contained static build passes, with bundled JavaScript, local fonts, and retained licenses.                                                                                                                                                                                                                             |
| `npm run test:browser` | Passes under software WebGL. Live model/UI/SVG/save consistency, held and released swaps, motion reset, load-side descent, numeric/slider/halve/double/keyboard/drag constraints, drag cancellation, actual fulcrum raycasting, presets, reset, tabs, tooltips, rounding/range explanations, persistence, and invalid saves. |
| Overlay/layout checks  | 1366×768, 1024×768, 390×844, 844×390; separate readable labels including four-digit masses; stable full-window canvas and projected coordinates when panels toggle; orbit/rear view and both extreme tilt directions.                                                                                                        |
| Degraded access        | WebGL context loss and startup without WebGL or localStorage. Diagram, math, mass/fulcrum inputs, reset, presets, swap, and release remain usable.                                                                                                                                                                           |
| Runtime isolation      | No uncaught page errors and no external runtime asset requests in the browser checks; root and repository-prefix hosting both work.                                                                                                                                                                                          |

## Visual Review

Reviewed desktop and phone screenshots, short landscape, controls, rear view,
required swap/release, no-WebGL diagram, and extreme arrangements at both tilt
stops. Review found and corrected clipped phone label text and a raised load
hidden by a label; the viewport-based fit now reserves more vertical clearance.
The fallback instruction line also stays above the math panel.

Representative screenshots from the automated run:

- [Balanced Default](screenshots/balanced.png)
- [Swapped and Released](screenshots/swapped-released.png)
- [Phone Layout](screenshots/phone.png)
- [Extreme Raised Load](screenshots/extreme-raised-load.png)

## Remaining Limits

- Browser checks used Chromium with software rendering. Native classroom
  hardware, touch gestures, screen readers, and Firefox/Safari need the
  classroom release verification in Issue #3.
- Small screens use scrollable control and math panels. Deliberately orbiting
  into an end-on view can obscure physical geometry; Side View/Fit View and
  numeric controls remain available. This is not an occlusion-free camera.
- Dynamics are an ideal teaching illustration, not calibrated timing or a
  contact/pendulum simulation. See [Model and Teaching Notes](MODEL-AND-TEACHING.md).
- Nothing was deployed. Classroom release preparation is Issue #3; environment
  integration is Issue #4. Source games were neither edited nor deployed.
