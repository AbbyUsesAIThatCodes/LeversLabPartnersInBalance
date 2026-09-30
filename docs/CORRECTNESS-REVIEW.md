# Correctness Review Follow-Up

Independent review reproduced five defects in build 007. That build is on hold
for student use. Ordinary complete packet walkthroughs had not covered these
state transitions; their passing results did not establish edge-case correctness.

## Corrections

1. Reset interrupts a pending trial before changing state. Changes and the settling
   observer also defensively interrupt if the apparatus is held or no longer matches
   the captured setup. Interrupted trials retain their original prediction/setup,
   with no fabricated settled result. The resulting autosave remains restorable.
2. Restore and startup load the selected imported workbench before any navigation
   saves the current apparatus. Old drafts are flushed to the old notebook first;
   pending trials are interrupted and imported records remain separate.
3. Q14 validates constraints against the recorded trial setup. A changed current
   arrangement needs a new completed trial. Editing the current mass cannot repair
   the evidence from an earlier noncompliant balanced trial.
4. Apparatus/response changes invalidate current completion without removing the
   historical check event. The UI and coverage count update immediately. Reopening
   or restoring also rechecks saved successful statuses so older stale statuses
   cannot remain successful when their saved evidence does not support them.
5. Restore validates event-specific payloads, including historical check results,
   responses, setups, control changes, trial references, session settings, and
   support exposures, before replacing the open notebook.

Top-level Learn, linked tutorials, general Help, tooltips, expanded vocabulary,
and Math views now record conservative support exposure with learner/context
attribution. Reports include those records and explicitly state that missing logs
do not establish independent performance. Older builds may have incomplete logs.

## Regression Evidence

`tests/learning-transitions.test.mjs` reproduces the state transitions with small
app/DOM doubles, including stale saves. `tests/correctness-browser.mjs` repeats the
five reported defects and support routes through real controls in WebGL and
diagram mode. Reset clicks are dispatched within one browser task so the test
always interrupts before the minimum settling interval; slower automation must
not accidentally test a Reset after the result already completed.

The complete paired/solo walkthrough, notebook/recovery checks, physics/control
regression, and coverage inventory are rerun against the final artifact. Exact
build-specific results live in the review ZIP. See STATUS.md for the delivered
build, source revision, and remaining independent/teacher review boundary.

No merge, public deployment, email, or automatic classroom approval is authorized.
