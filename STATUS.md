# Lever Lab: Partners In Balance

## Current Checkpoint

Checkpoint at 2026-09-30 22:50 UTC: isolated baseline commit `237912e`;
implementation checkpoint follows it on the same local branch. Current unit run:
24/24 passing, including model bounds, concurrent build IDs, notebook validation,
individual prediction history, Q7-to-Q11 linkage, and report escaping.
All 68 mapped rows (66 question subparts + Intro/Routine) and T0–T12 are defined
in `src/curriculum.js`; this is an inventory, not full verification.
The modes/notebook/UI/report are integrated. Browser diagnostics found port 4187
was occupied by a different existing game; the test accidentally reached it.
The browser test now chooses an available ephemeral port. The corrected run is
still pending. The existing service was not modified or stopped. Do not call
this playable or complete until that is fixed and the Q1–Q4 browser slice passes.
No review ZIP or screenshot delivery exists yet.

Latest local build before the implementation commit:
`0.1.0_Partners-In-Balance_local-1e3bd62e_build-002_20260930T224635Z_g237912e4a5db-dirty-b5e96dca_web`.
Build is deliberately marked dirty; do not relabel it after committing.

Exact next action: inspect browser startup diagnostics, fix the integration,
rerun `node tests/notebook-browser.mjs`, inspect laptop/projector screenshots,
then package that immutable artifact for the teacher's initial playtest.

Local branch: `work/01-local-learning-foundation`. Source baseline:
`AbbyUsesAIThatCodes/LeversLoadEffortDistance@9bfce52767e51ae728ffa9fec717264c554d026b`.
Source is unchanged. This independent Git copy retains the complete source ancestry.
No remote is configured. No merges, deployments, emails, or auto-merge are authorized.

The approved new repository name is `AbbyUsesAIThatCodes/LeverLab`.
Creation is pending because the available GitHub connector cannot create repositories.
Automatic approval review rejected direct credential-helper access; do not retry it.
Create an empty repository using normal authenticated GitHub capabilities, disable
Actions before the first push, and verify Pages is absent. Push only the sanitized
new baseline/working branch, not every historical ref. Never push to the source.

## Bounded Work

1. Isolate the copy, preserve provenance/licenses, remove active workflow triggers,
   establish build identity and recoverable checkpoints.
2. Add local autosave, validated backup/restore, pair/solo contribution records,
   teacher-controlled role rotation, and human-readable evidence download.
3. Implement all Part 1 Q1–8 and Part 2 Q9–14 subparts with T0–T12 tutorials,
   preserved predictions/retries and exact Learn/return routes.
4. Audit coverage, run model/progress/browser checks, inspect screenshots and
   package the immutable build as a playable review ZIP for teacher playtesting.

## Source And Scope

R06 Part 1 and Part 2 each have six pages. No Optional A–E tasks are required.
The key and goal map are pinned to EES PR #78 commit
`bea8b69fe00fe989f418b985cb3f8005f0b4d41f`; local evidence stays outside this repository.
The student PDFs contain no embedded game hyperlinks. Source identification comes
from the matching key and teacher guide, not an invented PDF link extraction.
The source game has no top-level license. Preserve existing notices without
declaring an unsupported license; this is the owner's authorized adaptation.
No publisher source text, real student data, accounts, telemetry, or network
student storage belongs in this project.

## Review Boundaries

Predictions are captured, never graded for matching the eventual outcome.
Reasoning and student-created sketches need teacher review, never keyword grading.
Completion is evidence coverage, not individual mastery or an official approval.
The game supports physical transfer but does not certify physical build/test work.
Downloads require the student to attach the file and select Turn In in Classroom.
Teacher playtest approval is required before any public deployment.
