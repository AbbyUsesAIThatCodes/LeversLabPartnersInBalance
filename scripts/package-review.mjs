import { readFile,writeFile,mkdir,cp,copyFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
const manifest=JSON.parse(await readFile('artifacts/current-build.json','utf8'));
const source=path.resolve('artifacts/builds',manifest.id),destination=path.resolve('artifacts/review-packages',manifest.id);
const reviews={
 'notebook-review':['verification.json','free-play.png','challenge-laptop.png','challenge-projector.png','challenge-portrait.png','report-preview.png'],
 'full-packet-review':['verification.json','solo-complete-backup.json','solo-complete-work.html','pair-complete-backup.json','pair-complete-work.html','solo-design-sketch.png','pair-design-sketch.png','solo-report-design.png','pair-report-design.png'],
 'recovery-review':['verification.json'],
 'weighted-pointer':['verification.json'],
};
for(const folder of Object.keys(reviews)){
 const result=JSON.parse(await readFile(path.join('artifacts',folder,'verification.json'),'utf8'));
 if((result.build??result.buildId)!==manifest.id)throw new Error(folder+' did not verify this exact build');
 if(result.passed===false||result.errors?.length||result.external?.length||result.runs?.some(r=>r.errors.length||r.external.length||r.completedRows!==68))throw new Error(folder+' has incomplete verification');
}
await mkdir(path.dirname(destination),{recursive:true});await mkdir(destination);await cp(source,destination,{recursive:true});
for(const [folder,files]of Object.entries(reviews)){
 const target=path.join(destination,'review',folder);await mkdir(target,{recursive:true});
 for(const file of files)await copyFile(path.join('artifacts',folder,file),path.join(target,file));
}
await copyFile('THIRD_PARTY_NOTICES.md',path.join(destination,'THIRD_PARTY_NOTICES.md'));
await copyFile('docs/TEACHER-REVIEW.md',path.join(destination,'TEACHER-REVIEW.md'));
await copyFile('docs/LEVERLAB-SOURCE.md',path.join(destination,'SOURCE-RECORD.md'));
await copyFile('docs/R06-COVERAGE.json',path.join(destination,'review','R06-COVERAGE.json'));
const server=`import http from 'node:http';\nimport {readFile} from 'node:fs/promises';\nimport path from 'node:path';\nimport {fileURLToPath} from 'node:url';\nconst root=path.dirname(fileURLToPath(import.meta.url)),port=Number(process.env.PORT||4199);\nconst types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.woff2':'font/woff2','.svg':'image/svg+xml','.png':'image/png'};\nhttp.createServer(async(req,res)=>{try{const url=new URL(req.url,'http://localhost');const relative=decodeURIComponent(url.pathname);const file=path.resolve(root,'.'+relative+(relative.endsWith('/')?'index.html':''));if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}const data=await readFile(file);res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'}).end(data);}catch{res.writeHead(404).end('Not found');}}).on('error',e=>{console.error('Could not start local review:',e.message,'Choose another PORT if this one is occupied.');process.exitCode=1;}).listen(port,'127.0.0.1',()=>console.log('Open http://127.0.0.1:'+port+'/  |  Build ${manifest.id}'));\n`;
await writeFile(path.join(destination,'serve-review.mjs'),server);
await writeFile(path.join(destination,'START-HERE.txt'),`Lever Lab: Partners In Balance\nTEACHER PLAYTEST BUILD - All 68 coverage rows passed paired and solo browser walkthroughs.\n\nBuild: ${manifest.id}\nOriginal source baseline: 9bfce52767e51ae728ffa9fec717264c554d026b\n\n1. Extract this complete ZIP.\n2. With Node.js 22 or later installed, open a terminal in the extracted folder.\n3. Run: node serve-review.mjs\n4. Open http://127.0.0.1:4199/ in your browser.\n\nKeep the terminal open while reviewing. Press Ctrl+C when done. No npm install or internet is required. If this port is occupied, choose another PORT; browser saves are tied to the address, so download a backup before switching. Do not double-click index.html.\n\nFree Play, Learn T0-T12, and Challenge Q1-Q14 are available. Use Partners & Saves for pair/solo mode, teacher-called role swaps, backup/restore, and Student Work download. The HTML report is printable and contains drawings, original predictions, corrections, and trial history. Attach the downloaded file to Classroom and select Turn In yourself.\n\nTeacher approval is still needed before any deployment. Automated completion checks do not evaluate the quality of reasoning or drawings, teaching quality, accessibility for every learner, or physical build/test work. See TEACHER-REVIEW.md for suggested playtests. The notebook floats over the room; See Workbench collapses it when you need a clear apparatus view.\n\nScreenshots, synthetic full-run reports/backups, and exact build-specific test results are in review/. Synthetic test responses are validation fixtures, not model student explanations. No real student data is included.\n`);
await mkdir('output',{recursive:true});
// Python's standard-library zipfile keeps this packaging step dependency-free.
const python=process.env.REVIEW_PYTHON||'python';
execFileSync(python,['-c',"import pathlib,sys,zipfile; root=pathlib.Path(sys.argv[1]); out=pathlib.Path(sys.argv[2]); z=zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED); [z.write(p,p.relative_to(root.parent)) for p in root.rglob('*') if p.is_file()]; z.close()",destination,path.resolve('output',manifest.id+'.zip')]);
console.log(path.resolve('output',manifest.id+'.zip'));
