// The serialized effortMass key is retained solely for schema-1 compatibility.
// In this representation it calibrates an applied force, never the mass of a hand.
export const REPRESENTATION = 'hanging-load-hand-push-v1';
export const LEGACY_REPRESENTATION = 'crate-load-hanging-effort-v1';
export const representationName = id => id === REPRESENTATION
  ? 'Hanging Load / Applied Hand Push (g-equivalent)'
  : 'Earlier Apparatus: Crate Load / Hanging Effort Mass (g)';
export const representationValid = id => [REPRESENTATION,LEGACY_REPRESENTATION].includes(id);
export function adoptRepresentation(book) {
  if(book.representation === REPRESENTATION)return false;
  const prior=book.representation??LEGACY_REPRESENTATION;
  for(const list of [book.history,book.events,book.trials])for(const item of list)item.representation??=prior;
  for(const w of Object.values(book.workbenches))w.representation??=prior;
  for(const trial of book.trials)trial.setup.representation??=prior;
  book.previousRepresentation=prior;
  book.representation=REPRESENTATION;
  // Historical checks remain in events. New instructions need a fresh completion
  // record, without deleting any original response, trial, drawing, or setup.
  for(const check of Object.values(book.checks))Object.assign(check,{complete:false,status:'Review Updated Instructions',missing:['Review this step with the hanging load and calibrated hand push.']});
  return true;
}
