import {PARTS,PART_BY_ID} from './curriculum.js';
import {sameState,snapshot,stamp,event,predictionReady} from './notebook.js';
import {swapPositions} from './model.js';
export const TEACHING={
 T0:['Set Up And Predict','The beam pauses while you adjust the controls. Record your prediction to start its test. If the setup changes, record a prediction for that setup.','A 100 g-equivalent push has the same strength as the weight of a 100 g object. The hand itself does not have a 100 g mass.'],
 T1:['Meet The Lever','The hanging object is the load. Gravity pulls it down. The hand pushes down with effort. The fulcrum is the pivot between them.','A seesaw turns around its middle support. We name a force by its role, even when we swap its position.'],
 T2:['Measure From The Pivot','Each arm begins at the fulcrum and ends at that force location. The whole gap includes both arms.','If the load is 75 mm from the fulcrum and the hand is 125 mm away on the other side, their gap is 200 mm; the effort arm is 125 mm.'],
 T3:['Make A Fair Comparison','Change the named quantity and keep the other values the same. Predict before testing, then record what you actually see.','Compare a 150 g load and 150 g-equivalent push at equal arms. Increasing only the load to 300 g changes its turning effect.'],
 T4:['Trade Push For Distance','For the same load and load arm, a longer effort arm needs less push to balance. The hand stays the same size.','A 250 g load at 100 mm balances a 125 g-equivalent push at 200 mm: 250 × 100 = 125 × 200. Halving that effort arm requires twice the push.'],
 T5:['Move The Load','Moving the load farther from the fulcrum increases its turning effect. Its mass and weight do not change just because it moves.','With effort arm 150 mm, a 150 g load at 100 mm needs 100 g-equivalent. At 200 mm it needs 200 g-equivalent.'],
 T6:['Swap Positions, Keep Roles','Swap exchanges application coordinates. The load keeps its mass; the hand keeps its push setting. Both forces still act downward.','A balanced 250 g load at 100 mm and 125 g-equivalent push at 200 mm becomes unequal after their coordinates exchange.'],
 T7:['Move One Support','A negative fulcrum coordinate is left of beam center. Moving the fulcrum changes both positive arm distances while the application points stay fixed.','For points at −125 and +125 mm, a fulcrum at −25 mm gives arms 100 and 150 mm. The gap remains 250 mm.'],
 T8:['Compare Turning Effects','Multiply load grams by load arm, and effort g-equivalent by effort arm. Equal products predict balance from level. These comparison products are not SI torque.','250 × 100 = 25,000 and 125 × 200 = 25,000. Use your own saved trial when you apply this rule to your work.'],
 T9:['Use Mechanical Advantage','IMA is effort arm divided by load arm. At ideal balance, required effort force is load weight divided by IMA.','A 150 mm effort arm and 75 mm load arm give IMA 2: half as much effort force is needed. Reversing the arms gives IMA 0.5 and needs twice the force.'],
 T10:['Balance, Then Lift','Equal opposing turning effects balance from level. To raise the load, make the effort-side turning effect greater.','If 150 g-equivalent at 150 mm balances a load, moving the same push to 175 mm can start lifting it. Stay inside the coordinate limits.'],
 T11:['Design, Test, And Explain','Choose legal values, predict using the balance rule, test, and revise. Your sketch and explanation communicate your reasoning.','A 300 g load at 75 mm and 100 g-equivalent push at 225 mm both give 22,500. Your design may use a different valid combination.'],
 T12:['Work Together And Keep Your Work','Use one open laptop. The driver operates the controls; the navigator reads, checks, and discusses. Your teacher calls swaps. Working alone uses the same assignment.','Work saves in this browser profile and address. Use a recovery copy to move devices or preview addresses. Attach completed work in Classroom and select Turn In yourself.'],
};
export const sourcePart=part=>part.prediction===true?part:typeof part.prediction==='string'?PART_BY_ID[part.prediction]:part.fields.some(f=>f.prediction)?part:null;
export const targetPart=part=>part.trial?part:PARTS.find(p=>p.trial&&p.prediction===sourcePart(part)?.id);
export const latestPrediction=(book,target)=>book.guided?.predictions.findLast(p=>p.target===target);
export const freshPrediction=(book,part,state)=>!part.prediction||!!latestPrediction(book,part.id)&&!latestPrediction(book,part.id).invalidatedAt&&sameState(latestPrediction(book,part.id).setup.state,state);
export function recordPrediction(book,part,state){
 const source=sourcePart(part),target=targetPart(part);if(!source||!target||!predictionReady(book,{...target,prediction:source.id}))return null;
 const planned=source.id==='Q9b'&&part.id==='Q9b'?swapPositions(state):state;
 const record={id:crypto.randomUUID(),source:source.id,target:target.id,at:stamp(),setup:snapshot(planned),originalSetup:snapshot(state),answers:structuredClone(book.answers[source.id]??{}),invalidatedAt:null};
 book.guided.predictions.push(record);event(book,'prediction-recorded',{source:source.id,target:target.id,predictionId:record.id});return record;
}
export function stalePredictions(book,part,state){
 const source=sourcePart(part),target=targetPart(part);const record=latestPrediction(book,target?.id??part.id);
 if(record&&!record.invalidatedAt&&!sameState(record.setup.state,state)){record.invalidatedAt=stamp();event(book,'prediction-stale',{predictionId:record.id,source:source?.id??record.source,target:record.target});return true;}return false;
}
export function setupMismatch(part,state){
 if(!part.trial||part.design||!part.initial)return [];
 return Object.keys(part.initial).filter(k=>!(part.allowed??[]).includes(k)&&state[k]!==part.initial[k]);
}
