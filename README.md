# Lever Lab: Partners In Balance

Separate local-first development game based on the unchanged
[source game](docs/LEVERLAB-SOURCE.md). Full Git ancestry, workshop, 3D apparatus,
physics, camera controls, fonts, and fallback diagram are retained.

**Development build for thorough teacher playtesting.** All 68 target coverage
rows (Intro, Routine, and 66 question subparts) and tutorials T0-T12 are implemented.
Complete shared-classwork browser walkthroughs have passed in both renderers. Automated checks do not
grade open reasoning or establish classroom readiness. See [Status](STATUS.md)
for the exact tested build and [Teacher Review](docs/TEACHER-REVIEW.md) for playtests.

## Run Locally

Node.js 22+: `npm ci`, `npm test`, `npm run build`, then `npm run dev`.
Open `http://127.0.0.1:4173/LeverLab/`. Serve over HTTP, not `file://`.
On Windows restricted environments, unit checks can use
`node --test --test-isolation=none tests/*.test.mjs`.
`node tests/notebook-browser.mjs` checks graphical identification, the anonymous interface, Learn return, and recovery.
`node tests/full-packet-browser.mjs` exercises the entire mapped packet in
WebGL and diagram modes. `node tests/recovery-browser.mjs` checks interrupted
trials, drawings, unreadable autosaves, and retained Free Play arrangements.
`node tests/weighted-pointer-browser.mjs` checks the inherited motion and controls.
Set `CHROMIUM_EXECUTABLE` to an installed Chrome executable when needed.

For a packaged review, extract the complete ZIP and run `node serve-review.mjs`.
That package needs no npm install or internet connection. Browser storage belongs
to the exact address; download a backup before changing a preview port.

## Learning And Evidence

Free Play preserves the original workbench. Learn has T0–T12 practice and Challenge
has the two six-page R06 packets, without Optional A-E. One anonymous notebook
works for a classwork partnership or someone working independently. Classroom
handles identity; the teacher guides partner routines outside this interface.
Predictions are never graded for correctness. Explanations/sketches need teacher
review, not keyword grading. Completion records required evidence, not a mastery score.

Identify Parts uses Effort, Load, and Fulcrum clicks with a three-correct streak,
blue candidate cues, and keyboard access. Hide Notebook / Show Notebook clears
the workbench. Question Index uses lever icons and distinguishes complete evidence
from writing/sketches that need teacher review. Learn This includes Return To Question.

Browser autosave is separate from the original game. Question Index offers
Recover Saved Work with validated JSON backup/restore. After all required evidence
is recorded, Download Completed Work produces a self-contained HTML report with
drawings, responses, history, review flags, and machine-readable data. Attach the
file and select Turn In in Google Classroom; downloading is not submission.

No accounts, telemetry, runtime CDN, or student server storage. No names or roles
are required. Simulation does not certify a physical build or test.

## Review Policy

No active workflow, merge, deployment, email, or auto-merge is authorized.
Actions must be disabled and Pages absent before any initial remote push.
The teacher must thoroughly playtest before public deployment.
Preserve [notices](THIRD_PARTY_NOTICES.md), [provenance](docs/LEVERLAB-SOURCE.md),
and [build identity](docs/BUILD_IDENTITY.md). No top-level license is invented.
