# Contributor Instructions

Keep one implementation draft PR at a time. No merges, deployment, email,
auto-merge, active Actions workflows, or changes to the source repository.
Read STATUS.md and docs/LEVERLAB-SOURCE.md before work. Preserve source ancestry.
Preserve the classroom mass-distance equation, Lever Lab's separate save key, continuous
motion during edits, and parity between WebGL and the fallback diagram.

Apply [Build Identity](docs/BUILD_IDENTITY.md) to every artifact-producing
invocation. Use `npm run build` and its manifest-derived output folder; never
invent or reuse a PR build ordinal. Test with `npm test`, then run focused
browser checks for changed interactions on student laptop/projector dimensions.
Show the full Lever Lab build identity; the upstream display exception applied
only to the original game. Keep local identities until a real PR exists.
Use Title Case for new or edited interface headings and feature titles.
