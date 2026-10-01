# Browser Save Compatibility

The app ID is `lever-lab`; the assignment ID is `r06-levers-part-1-and-2`.
Neither changes with a build, room, UI order, or publication filename. The storage
key stays `lever-lab-notebook-v1` for continuity; its suffix is not the payload schema.
Payload schema 2 is independent of assignment content version and per-question
content revisions in `src/save-contract.js`. The 68 coverage IDs remain stable.

Cosmetic wording, art, and layout changes keep question revisions and completion.
Semantic objective/evidence changes increment the affected question's revision and
the assignment content version. Earlier responses, trials, sketches, and completion
events remain; current completion becomes Needs Another Look. New questions start
unfinished. Retired questions move into an archive with their evidence intact.
Keep their schema definitions in `src/question-history.js`; it validates old data
but never supplies answers or awards completion. Never reuse a retired stable ID.

Valid schema-1 build-007/011-shaped fixtures migrate to schema 2. Unsupported future
schema/content versions, other assignment IDs, malformed events, invalid geometry,
and oversized or unsafe structures are rejected before replacement. No student
records were used to construct these fixtures.

Saving writes a staged copy, checks its exact bytes and validates its schema, keeps
the prior raw save, then replaces and verifies the current key. Quota failures keep
the original current bytes; cleanup removes an incomplete stage. A failed restore
does not replace the running notebook or apparatus. Migration records original and
current builds, schema transition, and changed/new/retired question IDs.

Portable backups retain historical paired responses and labels. The human-readable
report and its embedded JSON anonymize structured partner-name fields without
mutating the backup. Authored response text is preserved. Migration/archive history
is included in the report; earlier grading/check events are never destructively rerun.

Browser storage is limited to the same origin and browser profile. Different preview
ports, browsers, profiles, devices, and future site addresses cannot automatically
share local storage. Download/import a recovery copy across those boundaries. No
account, remote student storage, or automatic Classroom synchronization is added.

Tests cover prior/current formats, semantic/nonsemantic edits, new/retired questions,
corrupt/future data, each quota-failure stage, and anonymous report export.
