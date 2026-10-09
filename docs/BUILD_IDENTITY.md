# Lever Lab Build Identity

`release.json` is authoritative: development `0.1.0`, **Partners In Balance**,
slug `Partners-In-Balance`. Version must match `package.json`. The new notebook
uses schema 2 and its own storage key; incompatible saves require migration or a
schema change. No classroom release has been accepted.

Canonical ID: `<version>_<codename>_<scope>_build-<ordinal>_<UTC>_g<revision>[-dirty-<fingerprint>]_web`.
Every artifact-producing invocation reserves a new ordinal. Local scopes and
counters use the inherited atomic allocator under `.git/build-identity/`.
UTC is captured once before bundling. Full SHA, dirty state, and input fingerprint
are recorded. Retesting an artifact preserves its ID. No PR ordinal is invented.

| Surface | Location | Check |
| --- | --- | --- |
| Release | `release.json`, `package.json` | Build consistency gate |
| Local Ordinals | `scripts/build-identity.mjs`, `.git/build-identity/` | Concurrent allocator test |
| Console | `scripts/build.mjs` | Full start/success/failure ID |
| Artifact | `artifacts/builds/<ID>/` | `scripts/verify-build.mjs` |
| Visible UI | `public/index.html`, `#build-summary` | Compact version and Local Review or real PR; full ID retained hidden |
| Manifest/Report | `build-manifest.json`, `BUILD_REPORT.md` | Consistency verifier |
| Current Review | `artifacts/current-build.json` | Matches immutable manifest |
| Student Export | `src/report.js` | Full packet browser checks verify embedded data and build |
| Review ZIP | `scripts/package-review.mjs`, `output/<ID>.zip` | Requires matching browser evidence; ID in filename |
| CI/Deployment | None active | No authorized Actions or Pages |

The user explicitly approved the compact game-display exception below.
The inherited remote allocator is dormant; no workflow is authorized to invoke it.

## Approved Compact Game Display

The user explicitly requested compact version plus Local Review in the upper left,
or version-PRnumber once an actual PR exists. The full identity stays in the
console, build manifest, exports, artifact filenames, and review documentation.

## October 9 Pages Promotion

The current deployment record is [Verified Pages Release](../deployment/RELEASE.md) and its hash inventory. `site/` contains the existing identified artifact. The workflow verifies and copies it without a build, so no new ordinal or timestamp is allocated. The source SHA in the embedded manifest remains the original runtime source; the publication commit is separate provenance.
