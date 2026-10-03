# Frozen Classroom Consumer Handoff

Validated source revision: [`28e31ff0fbf06ee5fd9fe58cb499f0ef0d757f9a`](https://github.com/AbbyUsesAIThatCodes/ClassroomVirtualization/tree/28e31ff0fbf06ee5fd9fe58cb499f0ef0d757f9a). Tested build: `0.1.1_First-Light_pr-3_build-004_20261001T014014Z_g28e31ff0fbf0_web-glb-godot-source`. This remains an unmerged draft source snapshot; pin this SHA, not the moving branch. [Canonical Room Manifest](CANONICAL-ROOM-MANIFEST.json) records SHA-256 and Git blob IDs for every procedural source dependency. The source ZIP contains exact Git blob bytes. Separate tested-workspace hashes identify Windows checkout line endings; the atlas JavaScript wrapper and poster metadata JSON differ only by CRLF/LF, with identical embedded image bytes. Current GLB/layout hashes and format limits are in [Current Review](CURRENT-REVIEW.md).

## Import Boundaries

Copy the eight manifest-listed files as one folder, keeping `src/` beside the room's `release.json` so internal imports resolve. Use the already tested Three.js 0.180.0 API and its matching addons. The room's release metadata is provenance, separate from the consuming game's own version/build identity. Do not overwrite the game's release record.

Import `createClassroom` from the copied `src/classroom.js`, call it once, `await room.ready`, then add `room.root` to the host scene. This wait decodes the embedded unchanged poster atlas. Keep `classroom.js`, `layout.js`, `textures.js`, `posters.js` and all three poster assets together. Do not copy this repository's `app.js`, HTML, controls or optional lever activity into the consumer.

The host owns its renderer, camera, controls, simulation and activity props. Preserve LeverLab's cutting mat, pad and pencil, including their materials and attachment/world transforms; inventory them before and after integration. Replace only the classroom subtree and matching room collision data. Reattach host props using the existing six named anchors and verify the intended tabletop. `GameAnchor_Design` is the near-left pale desktop at `[0.4975, 0.9325, 0]`; `GameAnchor_Lever` remains `[-2.24, 0.983, 0.3]`. Do not change game physics while converting visual units.

One unit is one metre. North/window is -Z, west is -X; rear door `[-2.85,0,6.96]` is southwest. The north door is unchanged. All 38 posters are clockwise and inward-facing: north 5, east 12, south 8, west 13. Keep the original atlas bytes and per-page UVs. Six steady rainbow colors add no dynamic lights or flicker. Host lighting stays a separate concern; `addClassroomLighting` is the optional standalone preview setup.

Use the regenerated room collider array (46 boxes, or 47 including the native floor). The south wall has real side spans and lintel plus a closed-leaf collider; do not retain the old full-width south collider or an old southeast doorway. For a cutaway, hide `Ceiling`, `LeftWall`, `BackWall`, and decor children tagged `wall: left/back` together. Keep all walls/posters visible for room exports.

## Consumer Validation

Verify all eight SHA-256 values before adapting imports. Record any consumer-specific adaptation separately. Check all walls, poster normals/UVs and corner/door clearance, the southwest opening and closed-door approach, unchanged north door, camera spawns and game-prop transforms. Test the consumer's actual desktop/mobile/offline paths and rebuild only its supported exports with its own next build identity. The standalone validation does not establish consumer compatibility by itself.

Keep [source provenance](CLASSROOM-PROVENANCE.md), [poster provenance and licensing limits](POSTER-ART.md), and third-party notices. Finished pages 1-38 are approved user wall art; page 39, the raw PDF, private classroom photographs and student data stay excluded. This handoff changes no consumer repository or shared catalog. The parent task coordinates the LeverLab import independently.
