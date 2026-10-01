# Frozen Classroom Integration

Room source: `28e31ff0fbf06ee5fd9fe58cb499f0ef0d757f9a` in
AbbyUsesAIThatCodes/ClassroomVirtualization. The eight files under
`src/canonical-room` retain the exact canonical Git blob bytes and the hashes
from the supplied manifest. Documentation pin: `a4676fdbfbfb3005e688b8c944e59b7a71078369`.

The supported Library materializer failed on Windows because `os.setxattr` was
unavailable. The same eight public source files were retrieved from their exact
frozen Git revision and hash-verified. No room source file was edited.

Lever Lab awaits `room.ready`, owns its renderer/camera/lighting, and attaches
the room at `GameAnchor_Lever`. One room metre maps to 40 host display units;
the tabletop is at the existing host tabletop height of -0.12. This is a
visual scale adapter; it does not change lever physics or packet units.

The old floor and tabletop are removed. Existing cutting mat, grid, paper pad,
sheet, and pencil objects retain their materials and local transforms. The
integration records a before/after inventory in scene metadata. The room's
46 collider definitions remain attached to the room; this orbit-camera host
does not implement character movement or substitute its old wall colliders.

The room includes only the approved quote poster pages 1–38. No source PDF,
private classroom photographs, or student data is included. User-supplied
poster artwork does not imply a general redistribution license. Preserve the
upstream provenance and existing dependency notices; this integration adds no
new license grant.
