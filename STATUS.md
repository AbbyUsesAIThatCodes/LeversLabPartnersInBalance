# Lever Lab: Partners In Balance

## Current Repair Candidate - Build 016

App source: `7f2e52806be7a0dc041b05506a42bfecd950b42c` (clean when built).
Build: `0.1.0_Partners-In-Balance_local-1e3bd62e_build-016_20261001T030128Z_g7f2e52806be7_web`.
All 55 unit tests pass. All four reported defects are repaired, including a
related generated-name leak in historical check metadata. The four original
regressions failed before repair; the additional report regression also failed
before its correction. Student-authored evidence and original backups are retained.

Exact-build browser suites all pass: two complete 68-row guided walkthroughs,
all new edge cases in WebGL and diagram mode, the earlier five integrity
regressions, migration of build-011 synthetic work (all 209 revisions), and the
graphical preview. They exercise Q7-to-Q11 traceability, Q12, Q13/Q14 drawings,
final readable reports, restore/reload, quota recovery, and generated identity
removal. Eight frozen-room hashes match. No browser errors were reported.

Evidence: `artifacts/guided-full/verification.json`,
`artifacts/review-014-edges/verification.json`,
`artifacts/guided-correctness/verification.json`,
`artifacts/guided-migration/verification.json`,
`artifacts/guided-preview/verification.json`, and
`artifacts/review014-unit-final.txt`.

The local ZIP is `output/0.1.0_Partners-In-Balance_local-1e3bd62e_build-016_20261001T030128Z_g7f2e52806be7_web.zip`
(4,122,237 bytes, 43 entries; ZIP integrity verified).
SHA256: `5715b8a5fa779ff5540686e6cb203917b8a35e58aa04034db2b52e83c5fa03b3`.
It includes the launcher, screenshots, complete synthetic reports/backups, all
five browser-suite verification records, source record, and license notices.
Artifact paths and hashes: `artifacts/build016-review-deliverables.json`.

Private JESS_PC preview `http://127.0.0.1:4200/` was verified serving build 016
(owned helper PID 6248). `StartReview.cmd` is in its review package; the launcher
uses port 4201 by default. Saves are tied to the preview address. The prior 014
package and ZIP remain intact; its prior helper alone was replaced.

Independent recheck and user playtest approval remain pending. Hold student use.
No new Library version was uploaded: existing ZIP/screenshots remain version 2
(build 014), preserved and held. Replace those same identities only after recheck.
There is no configured remote or issue/PR URL; the parent/user still handles the
empty LeverLab repository. No deployment, merge, email, or source-game change.

## Preserved Guided Review - Build 014

This preserved artifact is superseded by the repair candidate above and is on
hold for student use. App source: `439abfc7261ecb2db6f1d9b7307b5da94bbef209` (clean when built).
Full identity: `0.1.0_Partners-In-Balance_local-1e3bd62e_build-014_20261001T022507Z_g439abfc7261e_web`.
Later documentation/test-harness checkpoints do not relabel this artifact.

One guided route embeds T0–T12 instruction and worked examples into all 68 R06
coverage IDs. Controls remain usable; setup changes pause the beam and require
a fresh prediction before testing. The constant-size contacting hand supplies
calibrated effort push; the hanging object is the load. The flat index retains
all evidence IDs. Writing and sketches remain teacher review, not falsely correct.

The frozen room source is `28e31ff0fbf06ee5fd9fe58cb499f0ef0d757f9a`.
All eight canonical hashes match; 38 posters are present; the mat, paper pad,
sheet, and pencil retain their transforms/materials. Room source files are unchanged.
Library materialization was unavailable on Windows due to os.setxattr; the exact
public frozen Git blobs supplied by the parent were retrieved and hash-verified.

## Validation

50 unit tests pass. Exact-build browser evidence:

- `artifacts/guided-full/verification.json`: two full 68-row flows, WebGL and
  diagram; setup-bound predictions, automatic release, Q7 retries and Q7→Q11
  selection, Q12 ratios, Q13 lift, Q14 keyboard sketch/design, final report,
  native-print expansion/restoration, and backup restoration. No browser errors
  or external runtime requests.
- `artifacts/guided-correctness/verification.json`: all five reported integrity
  regressions pass in both renderers; support exposure remains attributable.
- `artifacts/guided-preview/verification.json`: introduction, new room, retained
  props, 38 posters, graphical streak, flat 64-step index, editable controls,
  main/notebook synchronization, vertical load/push gestures, vocabulary return.
- `artifacts/guided-migration/verification.json`: actual build-011 synthetic
  notebook retains all answers and 209 history entries; semantic revisions need
  another look, unchanged IMA completion remains, raw pre-update bytes survive
  autosaves/reload and can be downloaded, future schema rejected atomically.

An initial report screenshot capture failed after print expansion. The test
harness now captures the interactive report separately, then checks print
expansion/restoration; both final full walkthroughs passed. No app change or
rebuild was needed for that harness correction.

## Delivered Preview

Same three Library items, all now version 2:

- ZIP: `libfile_b5341add39fc819197cb64a7f01bedc9`
- Identification: `libfile_4abd580955888191bd72908f5f32e64d`
- Design Evidence: `libfile_ff0ef5b87fe081919fe1c14698970f2c`

Exact filenames, file IDs, byte counts, and SHA-256 values are retained in
`artifacts/library-guided-delivery/confirmed-deliverables.json`.
ZIP SHA-256: `47dd49bbeff4b11cff395cc08e4b96a5dbd8a054e0b0fd8c2481bb539bed5aae`; 4,107,273 bytes, 38 entries.
ZIP contents were checked. It includes StartReview.cmd and Node.js local server,
the offline game, screenshots, synthetic completed work, and exact-build evidence.

JESS_PC preview: http://127.0.0.1:4200/ (build 014).
Server/launcher/package details: `artifacts/FINAL-PREVIEW.json`.
The packaged launcher defaults to port 4201; browser storage is tied to the
address, so use recovery download/import when changing ports or devices.

Prepared Library uploads returned a deterministic unavailable error before any
write. Authorized owned replacements then succeeded with version-1 guards.
Windows cannot store the returned extended attributes; the authoritative identity
and new versions are preserved in the local sidecar above.

## Boundaries And Remaining Work

The source repository remains clean at baseline
`9bfce52767e51ae728ffa9fec717264c554d026b`. No active Actions workflow, remote,
public deployment, merge, auto-merge, email, or original-game change.
Empty LeverLab remote creation remains with the parent/user. History bundle stays
local. All learner evidence is local; Classroom attachment/Turn In is manual.
Automated evidence checks do not certify reasoning quality or physical building.

## Earlier Checkpoints

## New Revision In Progress

The latest user direction supersedes the three-mode UI and previous apparatus
representation. See `docs/GUIDED-ASSIGNMENT.md` for the saved semantic decision and
bounded plan. Work proceeds locally; the room integration waits for the parent's
frozen ClassroomVirtualization handoff. Build 011 below is the prior validated
preview, not an implementation of this new direction.

## Current Review

Build 011 is ready for the user's playtest and independent recheck. It fixes all
five reproduced build-007 defects and implements the user's simpler graphical,
anonymous classwork interface. Build 007 remains superseded and on hold.

App source: `07c125517aad08eaf6d3e7cac40a209ced71f286` (clean when built).
Full identity: `0.1.0_Partners-In-Balance_local-1e3bd62e_build-011_20261001T002116Z_g07c125517aad_web`.
Subsequent documentation and packaging checkpoints do not relabel this artifact.

The compact upper-left display is `0.1.0 Local Review`; no PR number is invented.
The full identity remains in console output, manifest, exports, and filenames.

## Implemented And Verified

- All 68 required rows: Intro, Routine, and 66 subparts across both six-page R06
  packets (Q1-Q8 and Q9-Q14). All 13 tutorials remain accessible. Optional A-E is excluded.
- Effort / Load / Fulcrum identification uses equal blue cues, apparatus clicks,
  keyboard buttons, green/red plus written feedback, and three consecutive correct
  choices. An error resets the streak and preserves the attempt.
- Anonymous shared classwork; no partner names, roles, or timer UI. The teacher
  guides partnership routines externally. Imported earlier responses remain recoverable.
- Hide Notebook / Show Notebook, graphical Question Index, and exact Return To
  Question from Learn. No internal subpart IDs or navigation dropdowns are displayed.
- Required evidence is checked automatically. Explanations and drawings retain
  honest teacher-review status; predictions are not graded for correctness.
- Browser autosave, validated restore, and recovery copy. Final readable HTML work
  download appears after all required evidence; JSON retains machine-readable data.
- Original 3D room, fallback diagram, physics, camera, and controls are preserved.

35 unit tests pass. Exact build 011 passed:

- `artifacts/full-packet-review/verification.json`: two complete 68-row runs,
  WebGL and diagram, all T0-T12 locations, incorrect factual answers and exact
  tutorial return, Q7 retries and Q7-to-Q11 traceability, Q12 reciprocal force
  comparisons, Q13 legal lift limits, Q14 own design/sketch, final export and restore.
- `artifacts/correctness-review/verification.json`: pending Reset interruption,
  restored apparatus preservation, Q14 recorded-trial constraints, stale-check
  invalidation, malformed-event rejection, and conservative support logging.
- `artifacts/notebook-review/verification.json`: graphical/keyboard streaks,
  anonymous UI, compact identity, prediction gate, exact Learn return, recovery,
  gated final download, and laptop/projector/portrait screenshots.
- `artifacts/recovery-review/verification.json`: interrupted reload, original
  prediction/retry, pointer sketch/Undo, unreadable save retention, two off-center swaps.
- `artifacts/weighted-pointer/verification.json`: preserved continuous motion,
  drag/cancel, Hold/Help/reduced motion, smallest imbalance, fallback/context-loss parity.
- `artifacts/print-review/verification.json`: native print expands all evidence
  sections, then restores the interactive layout. Machine appendix stays out of print.

No browser errors or external runtime requests occurred in the full UI runs.
Synthetic responses are test fixtures, not model explanations. These checks do not
establish teaching quality, official approval, mastery, or classroom readiness.

## Delivered Files And Local Preview

The same three Library items were replaced successfully at version 1. Their full
filenames, file IDs, SHA-256 hashes, and local paths are recorded in
`artifacts/library-replace-20260930/confirmed-deliverables.json`.

- ZIP: `libfile_b5341add39fc819197cb64a7f01bedc9`
- Graphical Identification: `libfile_4abd580955888191bd72908f5f32e64d`
- Shared Design Evidence: `libfile_ff0ef5b87fe081919fe1c14698970f2c`

ZIP: `output/0.1.0_Partners-In-Balance_local-1e3bd62e_build-011_20261001T002116Z_g07c125517aad_web.zip`
ZIP SHA-256: `52fb9b97d4b1e82a8a8d6daef23173b524a16bed79b907bfadbf92853c3d3868`; 1,961,493 bytes, 37 files.
The ZIP contains the runnable game, screenshots, synthetic completed reports and
backups, exact-build test evidence, source record, coverage inventory, and retained licenses.

Confirmed on JESS_PC: http://127.0.0.1:4200/ (build 011, process 25100).
`artifacts/FINAL-PREVIEW.json` records the server and package. No public deployment.
The ZIP starts with `node serve-review.mjs` after extraction; Node.js 22+ is needed,
with no npm install or internet. No StartReview launcher was present. Port 4199 is
an older local preview; use 4200 on this computer and back up before changing addresses.

Library writes succeeded. Local extended attributes are unsupported by Windows
Python; the authoritative returned identity/version mappings are retained in JSON.

## Source, Remote, And Remaining Gates

Source: `AbbyUsesAIThatCodes/LeversLoadEffortDistance` at
`9bfce52767e51ae728ffa9fec717264c554d026b`. Complete Git ancestry is preserved.
The source checkout/live game is unchanged; its local push URL is disabled.
No top-level source license was present. Existing Comic Neue/Three.js licenses
and notices were retained; no new license grant is invented.

Branch: `work/01-local-learning-foundation`; sanitized baseline `review-baseline`
at `237912e4a5db4b50201d41059ab28e553b96acb7`. There is no configured remote.
The parent is awaiting the user's empty `AbbyUsesAIThatCodes/LeverLab` repository.
No repository, issue, or PR URL has been created. Keep one bounded draft PR at a time.
Before any first push, verify Actions disabled and Pages unconfigured. Push only
sanitized branches, never all historical refs. The inherited workflow is inert
at `docs/upstream/pages.yml.disabled`; no active Actions workflow is present.

Independent recheck and thorough user playtesting remain pending. No merge,
deployment, email, auto-merge, or claim of classroom approval is authorized.
The user writes their own communications. Earlier automatic approval rejected
credential-helper access; it was not retried. Use supported GitHub capabilities only.

R06 authority is EES PR #78 commit `bea8b69fe00fe989f418b985cb3f8005f0b4d41f`.
Teacher audit sources remain outside the repository. No proprietary packet text
or real student identity is included. The user-approved anonymous UI supersedes
the original individual-partner interface requirement while retaining all content.

Attach the downloaded work in Google Classroom and select Turn In manually.
The game has no accounts, telemetry, or student server records; download does not
verify submission. Physical building/testing remains a separate experience.
The notebook can cover apparatus labels; Hide Notebook clears the view. Full
print evidence histories can be long; the interactive HTML is the primary work file.

## Force Adapter Checkpoint

Calibrated effort helpers, force-only effort inertia, and explicit legacy/new
representation metadata are implemented. All 38 unit tests pass, including exact
packet balance cases, the force/IMA bridge, and preservation of legacy evidence.
No new browser build is claimed yet. Latest flow refinement keeps controls usable:
only the beam pauses for setup/prediction; Continue gates required evidence.
Recording a prediction starts its test; setup edits make that prediction stale
without deleting it. Vertical drag adjusts load mass or calibrated push, with a
direction threshold separating position changes. Hand size remains constant.


## Save Compatibility Checkpoint

A bounded schema-2 migration contract is implemented with stable app/assignment and
question IDs, independent content revisions, preserved original/current builds,
archived retired-question evidence, and historical completion records. Valid old
schema-1 data migrates; semantic changes require another look while cosmetic changes
retain completion. Staged validated saves retain original bytes under quota failure.
Failed imports leave the current notebook/apparatus unchanged. No real student data
was read. See docs/SAVE-COMPATIBILITY.md. Full guided UI/browser validation is pending.

## Guided Sequence Checkpoint

The guided sequence, embedded instruction, flat question index, setup-bound prediction records, and schema-2 migration foundation now pass all 45 current unit tests, including the five integrity regressions. This is a source checkpoint, not a completed preview. The hand/load visuals, force-label audit, frozen room integration, and current-revision browser runs remain. The Library room helper failed with Windows os.setxattr unavailable; canonical public source files will be retrieved at the supplied frozen revision and hash-verified. The remote does not block this work.


## Integrated Guided Source

The new hanging-load/contacting-hand apparatus, constant-size push semantics, downward-to-increase gestures, updated force controls/help/report, and frozen room adapter are implemented. All 45 existing/current unit tests passed before four focused guided-prediction regressions were added. Frozen room files match all eight canonical hashes. The mat/pad/pencil inventory is retained. Browser validation for this revision is next; prior build evidence is not claimed for these changes.


## Guided Build 013 Validation And Final Corrections

Build 013 completed both full 68-row browser walkthroughs, including Q7-to-Q11 selection, Q12 comparisons, Q13 lifting, Q14 drawing/revisions, final report and restore. Both renderers passed all five integrity browser regressions. Subsequent bounded corrections synchronize notebook/main controls, retain a downloadable pre-update raw copy across autosaves, validate new prediction links/future question revisions, and turn the hand for a clearer silhouette. All 50 unit tests pass. The next build will repeat the affected guided browser suites before packaging; no old build evidence is substituted.

# Build 014 Review Hold And Repair Checkpoint

Build 014 and its Library version 2 remain preserved, but are on hold for student
use after independent review found four edge cases. The bounded repair fixes Q14
retry product ownership, rejects completed trials predating an intervening setup
edit, renders the entire HTML report from its anonymized copy, and keeps migration
raw bytes protected until their verified archive succeeds. Recovery offers a
pre-update download and Retry Saving; a blocked migration cannot be bypassed by
ordinary autosave or restore.

All four new regressions failed against the pre-repair source and now pass. All
54 unit tests pass, including the earlier five integrity regressions. Evidence:
`artifacts/build014-edge-regressions-before.txt` and
`artifacts/review014-unit-after.txt`. Real-browser edge-case and full guided runs
on the next build are pending. No Library replacement is authorized before
independent recheck of this repair. No remote, issue, PR, or deployment exists.
