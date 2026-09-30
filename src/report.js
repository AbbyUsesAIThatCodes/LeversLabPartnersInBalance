import { PARTS, LESSONS } from './curriculum.js';
import { coverage } from './notebook.js';
export const escapeHTML=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function drawingSVG(drawing){
 const shapes=(drawing?.elements??[]).map(e=>{
  const x=Number(e.x)||0,y=Number(e.y)||0,color={load:'#89500b',effort:'#176b61',fulcrum:'#714896'}[e.role]??'#163b39';
  let shape='';
  if(e.kind==='beam')shape=`<path d="M40 ${y} H560" stroke="#785a39" stroke-width="10"/>`;
  if(e.kind==='load')shape=`<rect x="${x-17}" y="${y-34}" width="34" height="34" fill="${color}"/>`;
  if(e.kind==='effort')shape=`<path d="M${x} ${y} v35" stroke="${color}" stroke-width="3"/><circle cx="${x}" cy="${y+45}" r="14" fill="${color}"/>`;
  if(e.kind==='fulcrum')shape=`<path d="M${x} ${y} l-20 38 h40 Z" fill="${color}"/>`;
  if(e.kind==='stroke')shape=`<polyline points="${(e.points??[]).map(p=>p.map(v=>Number(v)||0).join(',')).join(' ')}" fill="none" stroke="#163b39" stroke-width="3"/>`;
  return shape+`<text x="${x}" y="${Math.max(18,y-43)}" text-anchor="middle" font-size="14" fill="${color}">${escapeHTML(e.label??'')}</text>`;
 }).join('');
 return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 280" role="img" aria-label="Student-created lever sketch"><rect width="600" height="280" fill="#fffdf3"/>${shapes}</svg>`;
}
const jsonBlock=value=>`<pre>${escapeHTML(JSON.stringify(value,null,2))}</pre>`;
export function reportHTML(book,manifest){
 const rows=coverage(book),done=rows.filter(r=>r.complete).length;
 const people=Object.fromEntries(book.team.learners.map(l=>[l.id,l.label]));people.shared='Shared Apparatus / Factual Response';
 const sections=PARTS.map(part=>{
  const owners=book.answers[part.id]??{};
  const responseRows=Object.entries(owners).map(([owner,answers])=>`<h4>${escapeHTML(people[owner])}</h4>${part.fields.map(f=>`<div class="response"><b>${escapeHTML(f.label)}</b>${f.type==='sketch'?drawingSVG(answers[f.key]):`<p>${escapeHTML(answers[f.key]??'[No response recorded]')}</p>`}</div>`).join('')}`).join('');
  const trials=book.trials.filter(t=>t.part===part.id);
  return `<section><h2>${part.id}: ${escapeHTML(part.title)}</h2><p>${escapeHTML(part.page)} · ${escapeHTML(book.checks[part.id]?.status??'Not Started')}</p>${responseRows||'<p>No response recorded.</p>'}<h3>Checks And Review Flags</h3>${jsonBlock(book.checks[part.id]??{})}${trials.length?`<h3>Apparatus Trials</h3>${jsonBlock(trials)}`:''}<details><summary>Original Responses And Revisions</summary>${jsonBlock(book.history.filter(h=>h.id===part.id))}</details><details><summary>Help Used And Check History</summary>${jsonBlock({lessons:book.visits.filter(v=>v.from===part.id),checks:book.events.filter(e=>e.type==='part-checked'&&e.id===part.id)})}</details></section>`;
 }).join('');
 return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Lever Lab Student Work</title><style>body{font-family:"Comic Sans MS","Comic Sans",system-ui,sans-serif;max-width:950px;margin:30px auto;padding:0 20px;color:#173b38;line-height:1.45}h1,h2,h3,h4{break-after:avoid}section{border-top:2px solid #638b74;margin-top:30px;padding-top:10px}.response{break-inside:avoid;margin:12px 0}p{white-space:pre-wrap}pre{white-space:pre-wrap;overflow-wrap:anywhere;font-size:11px;background:#f3f5f0;padding:12px}svg{width:100%;max-width:600px;border:1px solid #9aaa96}table{border-collapse:collapse;width:100%}td,th{padding:5px;border:1px solid #aab8a5;text-align:left}@media print{body{margin:0;max-width:none}details>*{display:block}details{display:block}summary{font-weight:bold}pre{font-size:8pt}section{break-before:auto}} </style><body><h1>Lever Lab: Partners In Balance</h1><h2>Student Work And Evidence</h2><p>Session: ${escapeHTML(book.id)}<br>Mode: ${escapeHTML(book.team.mode)}<br>Learners: ${escapeHTML(book.team.learners.slice(0,book.team.mode==='pair'?2:1).map(l=>l.label).join(' / '))}<br>Saved: ${escapeHTML(book.updatedAt)}<br>Build: ${escapeHTML(manifest?.id??book.build)}<br>Source Revision: ${escapeHTML(manifest?.source?.sha??'Local Development')}</p><p>${done} of ${rows.length} coverage items have recorded/checkable evidence. This is not a mastery score. Open explanations and drawings require teacher review. Predictions are retained without grading their correctness.</p><p>Download does not submit work. Attach this file to your Google Classroom assignment and select Turn In. The game cannot verify submission. This simulation supports lever reasoning; physical building and testing remain separate.</p><h2>Completion Map</h2><table><thead><tr><th>Item</th><th>Status</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${r.id}</td><td>${escapeHTML(r.status)}</td></tr>`).join('')}</tbody></table>${sections}<section><h2>Tutorial Visits And Role Contributions</h2>${jsonBlock({lessons:LESSONS.map(l=>({id:l.id,title:l.title,record:book.tutorials[l.id]??null})),visits:book.visits,roleEvents:book.events.filter(e=>e.type==='roles-swapped'||e.type==='session-settings')})}</section><details><summary>Complete Machine-Readable Notebook</summary><p>The JSON below can also be downloaded separately as Restore Backup data.</p>${jsonBlock(book)}</details><script type="application/json" id="lever-lab-notebook">${JSON.stringify(book).replace(/</g,'\\u003c')}</script></body></html>`;
}
