# Levers: Load, Effort, and Distance

An independent classroom lever game: a **gold Load** presses on a supported tray,
and a **teal Effort** hangs below the beam. Change either mass, change either arm,
move the purple fulcrum, predict the result, and release the beam.

Version **0.1.0** implements the integrated core in
[Issue #2](https://github.com/AbbyUsesAIThatCodes/LeversLoadEffortDistance/issues/2).
It still needs the classroom readiness work in
[Issue #3](https://github.com/AbbyUsesAIThatCodes/LeversLoadEffortDistance/issues/3).
See the [Roadmap](docs/ROADMAP.md).

## Explore

- **Controls** opens number boxes, sliders, and halve/double buttons for each
  object's mass and arm length, plus the fulcrum's beam coordinate.
- Drag an object, the fulcrum, or a floating role label. The fulcrum always stays
  between the objects. Tab to a label and use left/right arrows to move across
  the screen; up/down changes that object's mass.
- **Swap Positions** exchanges the objects' exact coordinates, keeping each
  object's mass, mesh, color, role, and label. The fulcrum stays fixed. The arm
  lengths exchange. Swap twice to return to the original arrangement.
- **Hold Level** and **Hide Math** support predictions. Release tests the current
  turning effects. A held arrangement stays held after swapping; a released
  arrangement responds to the new balance. Every edit clears old tilt/velocity.
- **Balance & Advantage** compares mass × distance, IMA, and required effort mass.
  **Grams → Newtons** expands SI conversions. Focus, tap, or hover on dotted math
  terms for definitions. The actual force ratio equals IMA only at ideal balance.
- Orbit/zoom freely, or use **Side View** and **Fit View**. Panels are overlays;
  opening them never resizes the full-window 3D viewport.
- If WebGL is unavailable or lost, the diagram, math, presets, swap, hold/release,
  and numeric controls still work. Storage failure does not prevent use.

## Run Locally

Use Node.js 22 or later:

```sh
npm ci
npm run build
npm run dev
```

Open <http://localhost:4173/LeversLoadEffortDistance/> or
<http://localhost:4173/>. Serve `dist/` over HTTP, not `file://`.

```sh
npm test
npx playwright install chromium
npm run test:browser
```

For headless Linux, `BROWSER_SOFTWARE_GL=1` enables software WebGL and
`CHROMIUM_EXECUTABLE` can point to an existing compatible Chromium.
`PORT` overrides the server port (4173 for development, 4178 in the browser check).
Screenshots from browser checks go to ignored `artifacts/`.

## Bounds and Assumptions

| Quantity                | Permitted Values                                                               |
| ----------------------- | ------------------------------------------------------------------------------ |
| Load and Effort masses  | 25–1,000 g, in 25 g steps                                                      |
| Object beam coordinates | −250 to +250 mm, in 25 mm steps                                                |
| Minimum arm length      | 75 mm                                                                          |
| Fulcrum coordinate      | Between the objects, at least 75 mm from each; global extremes ±175 mm         |
| Arm lengths             | Derived from coordinates; 75–425 mm, depending on the current fulcrum and side |
| Beam motion             | ±12°, with illustrative damping                                                |

The taller support, stable tray, and bounds keep the maximum masses above the
work surface at both stops. The tray stays level and the load stays in contact.
The only modeled masses are the labeled Load and Effort. The beam and attachments
are ideal and massless; the pivot is ideal. Read
[Model and Teaching Notes](docs/MODEL-AND-TEACHING.md) for support assumptions,
force application points, torque, and motion limitations.

## Independent Identity and Review

This game adapts [ThreeKindsOfLevers](https://github.com/AbbyUsesAIThatCodes/ThreeKindsOfLevers)
and [MechanicalAdvantage](https://github.com/AbbyUsesAIThatCodes/MechanicalAdvantage).
Exact source commits and adapted components are recorded in
[Provenance](docs/PROVENANCE.md), with licenses in
[Third-Party Notices](THIRD_PARTY_NOTICES.md).

Changes are delivered as PRs for review before merging. This core implementation
adds no deployment workflow and does not publish or modify either source game.
Classroom release verification and publishing belong to Issue #3; classroom
virtualization belongs to Issue #4.

All scripts, fonts, and visuals are bundled locally. No accounts, tracking,
student data, or runtime CDN requests are used. This app saves its arrangement,
hold setting, math visibility, and reduced-animation preference only under
`levers-load-effort-distance-v1`. It does not read or overwrite the source games'
saved state. Invalid saves revert to the safe default.
