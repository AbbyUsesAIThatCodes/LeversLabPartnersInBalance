# Lever Lab: Partners In Balance

Separate local-first development game based on the unchanged
[source game](docs/LEVERLAB-SOURCE.md). Full Git ancestry, workshop, 3D apparatus,
physics, camera controls, fonts, and fallback diagram are retained.

**Development build for thorough teacher playtesting.** All 68 target coverage
rows (Intro, Routine, and 66 question subparts) and tutorials T0-T12 are implemented.
Complete paired and solo browser walkthroughs have passed. Automated checks do not
grade open reasoning or establish classroom readiness. See [Status](STATUS.md)
for the exact tested build and [Teacher Review](docs/TEACHER-REVIEW.md) for playtests.

## Run Locally

Node.js 22+: `npm ci`, `npm test`, `npm run build`, then `npm run dev`.
Open `http://127.0.0.1:4173/LeverLab/`. Serve over HTTP, not `file://`.
On Windows restricted environments, unit checks can use
`node --test --test-isolation=none tests/*.test.mjs`.
`node tests/notebook-browser.mjs` checks the initial Q1-Q4 slice and local downloads.
`node tests/full-packet-browser.mjs` exercises the entire mapped packet in paired
WebGL and solo diagram modes. `node tests/recovery-browser.mjs` checks interrupted
trials, drawings, unreadable autosaves, and retained Free Play arrangements.
`node tests/weighted-pointer-browser.mjs` checks the inherited motion and controls.
Set `CHROMIUM_EXECUTABLE` to an installed Chrome executable when needed.

For a packaged review, extract the complete ZIP and run `node serve-review.mjs`.
That package needs no npm install or internet connection. Browser storage belongs
to the exact address; download a backup before changing a preview port.

## Learning And Evidence

Free Play preserves the original workbench. Learn has T0–T12 practice and Challenge
has the two six-page R06 packets, without Optional A–E. Individual predictions and
explanations are separate from shared apparatus evidence. Predictions are never
graded for correctness. Explanations/sketches need teacher review, not keyword grading.
No shared mastery score is claimed.

Pair mode uses one laptop with driver/navigator roles. The teacher calls swaps;
an optional reminder never swaps automatically. Solo mode has the same tasks.
Browser autosave is separate from the original game. JSON backups support validated
restore. The self-contained HTML work report includes drawings, responses, history,
review flags, and machine-readable data. Attach the file and select Turn In in
Google Classroom yourself; download is not submission.

No accounts, telemetry, runtime CDN, or student server storage. Use fictional labels
for testing. Simulation does not certify a physical build or test.

## Review Policy

No active workflow, merge, deployment, email, or auto-merge is authorized.
Actions must be disabled and Pages absent before any initial remote push.
The teacher must thoroughly playtest before public deployment.
Preserve [notices](THIRD_PARTY_NOTICES.md), [provenance](docs/LEVERLAB-SOURCE.md),
and [build identity](docs/BUILD_IDENTITY.md). No top-level license is invented.
