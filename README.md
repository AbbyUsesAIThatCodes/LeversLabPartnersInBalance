# Lever Lab: Partners In Balance

Separate local-first development game based on the unchanged
[source game](docs/LEVERLAB-SOURCE.md). Full Git ancestry, physics, camera controls, fonts, and fallback diagram are retained.
The guided revision uses a hanging load, a calibrated hand push, and the frozen
ClassroomVirtualization room; the mat, paper pad, and pencil remain.

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
`node tests/guided-preview-browser.mjs` checks the introduction, graphical parts,
room provenance, retained props, controls, gestures, and flat Question Index.
`node tests/guided-full-browser.mjs` completes all 68 coverage rows in both renderers.
`node tests/correctness-browser.mjs` repeats the five integrity regressions.
`node tests/guided-migration-browser.mjs` imports an actual prior-build synthetic
notebook and verifies retained work, recoverable original bytes, and future rejection.
Set `CHROMIUM_EXECUTABLE` to an installed Chrome executable when needed.

For a packaged review, extract the complete ZIP and run `StartReview.cmd` on Windows
or `node serve-review.mjs` with Node.js 22+.
That package needs no npm install or internet connection. Browser storage belongs
to the exact address; download a backup before changing a preview port.

## Learning And Evidence

One guided assignment embeds T0-T12 teaching and worked examples into both
six-page R06 packets, without Optional A-E. One anonymous notebook
works for a classwork partnership or someone working independently. Classroom
handles identity; the teacher guides partner routines outside this interface.
Predictions are never graded for correctness. Explanations/sketches need teacher
review, not keyword grading. Completion records required evidence, not a mastery score.

Identify Parts uses Effort, Load, and Fulcrum clicks with a three-correct streak,
blue candidate cues, and keyboard access. Hide Notebook / Show Notebook clears
the workbench. Question Index uses lever icons and distinguishes complete evidence
from writing/sketches that need teacher review. Vocabulary returns to the current
question without changing its setup. Controls remain usable while the beam pauses.
Recording a prediction starts the test; changed setups require a fresh prediction.
Effort is shown in g-equivalent with an automatic Newton readout, never as hand mass.

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
