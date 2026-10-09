# Hand, Icons, And Attention Review

This focused pass replaces the forearm-and-capsule hand with an original
standalone dark-skinned child's hand. The modeled palm and short rounded wrist
join four unequal, tapered, bent fingers and an opposed thumb. Small nails and
joint creases provide readable landmarks. Its geometry stays the same at every
effort value: the setting describes a calibrated push, not the hand's mass.

The identification buttons and floating labels use line drawings of the hanging
weight, actual support/base, and hand. Their visible names and native button
keyboard behavior remain. Keyboard focus stays with repeated choices and moves
to Continue after the third correct choice. Incorrect choices still reset the
required streak; their history and text feedback remain saved.

Attention uses two thin exterior shells and at most twelve tiny particles per
active role. A stencil mask excludes visible apparatus pixels, so overlapping
parts do not put glow stripes across the hand. Effects cannot intercept a raycast.
Blue invites selection; green/red results are brief and accompanied by text.
Idle selection remains static. Animation is limited to identification or hover,
stops under reduced-motion settings, and pauses behind dialogs. It requires no
post-processing render targets or bloom passes.

## Review Evidence

The focused browser suite covers repeated keyboard and graphical identification,
actual object picking, manual/system reduced motion, a 390-pixel layout, object
dragging versus background orbit, and preservation of completed build-016 work.
Asset-detail screenshots use a test-only close-up camera; that camera hook is
not included in the playable package. A short WebM is included only if the
browser recorder produces usable frames.

The normal guided browser suites use the shipped application. They cover both
complete 68-item packet runs, Q7-to-Q11 trial selection, sketches, reports,
restore/reload, migration, and the earlier integrity regressions. Refer to the
package's exact-build verification records for completed checks.

## Limits

Rendering was checked with software-rendered Chrome on JESS_PC, not measured on
a physical Chromebook. Frozen classroom geometry emits the same batching
warnings as build 016 and retains its unmerged meshes; this pass does not change
that source. All eight frozen source hashes remain the authority.

Physics, force calibration, lesson content, stable question IDs, save schema,
anonymous local storage, teacher review of reasoning/sketches, and manual
Classroom submission are unchanged. Teacher playtesting is still required before
student use or public deployment. Build 016 and previous Library versions remain
available. The remote repository and issue/PR work still await the user's empty
LeverLab repository.
