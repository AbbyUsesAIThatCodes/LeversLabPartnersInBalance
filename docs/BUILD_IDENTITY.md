# Lever Lab Build Identity

`release.json` is authoritative: development `0.1.0`, **Partners In Balance**,
slug `Partners-In-Balance`. Version must match `package.json`. The new notebook
uses schema 1 and its own storage key; incompatible saves require migration or a
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
| Visible UI | `public/index.html`, `#build-identity` | Browser verification pending |
| Manifest/Report | `build-manifest.json`, `BUILD_REPORT.md` | Consistency verifier |
| Current Review | `artifacts/current-build.json` | Matches immutable manifest |
| Student Export | `src/report.js` | Source/build embedded; browser check pending |
| Review ZIP | Pending | Must contain ID in filename |
| CI/Deployment | None active | No authorized Actions or Pages |

The original game's hidden-display exception does not apply to this new project.
The inherited remote allocator is dormant; no workflow is authorized to invoke it.
