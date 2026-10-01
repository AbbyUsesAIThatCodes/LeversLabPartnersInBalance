import { readFile,writeFile,mkdir,cp,copyFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
const manifest=JSON.parse(await readFile('artifacts/current-build.json','utf8'));
const source=path.resolve('artifacts/builds',manifest.id),destination=path.resolve('artifacts/review-packages',manifest.id);
const reviews={
 'guided-preview':['verification.json','guided-introduction.png','hand-load-identification.png','frozen-classroom-workbench.png','compact-guided.png'],
 'guided-full':['verification.json','WebGL-complete-backup.json','WebGL-complete-work.html','Diagram-complete-backup.json','Diagram-complete-work.html','WebGL-design.png','Diagram-design.png','WebGL-report.png','Diagram-report.png'],
 'guided-correctness':['verification.json'],
 'guided-migration':['verification.json'],
 'review-014-edges':['verification.json','WebGL-revised-design.json','Diagram-revised-design.json','WebGL-retested-row.json','Diagram-retested-row.json'],
};
for(const folder of Object.keys(reviews)){
 const result=JSON.parse(await readFile(path.join('artifacts',folder,'verification.json'),'utf8'));
 if((result.build??result.buildId)!==manifest.id)throw new Error(folder+' did not verify this exact build');
 if(result.passed===false||result.errors?.length||result.external?.length||result.runs?.some(r=>r.errors?.length||r.external?.length||r.passed===false||(folder==='guided-full'&&r.completedRows!==68)))throw new Error(folder+' has incomplete verification');
}
await mkdir(path.dirname(destination),{recursive:true});await mkdir(destination);await cp(source,destination,{recursive:true});
for(const [folder,files]of Object.entries(reviews)){
 const target=path.join(destination,'review',folder);await mkdir(target,{recursive:true});
 for(const file of files)await copyFile(path.join('artifacts',folder,file),path.join(target,file));
}
await cp('docs/room-source',path.join(destination,'room-source'),{recursive:true});
await copyFile('THIRD_PARTY_NOTICES.md',path.join(destination,'THIRD_PARTY_NOTICES.md'));
await copyFile('docs/TEACHER-REVIEW.md',path.join(destination,'TEACHER-REVIEW.md'));
await copyFile('docs/LEVERLAB-SOURCE.md',path.join(destination,'SOURCE-RECORD.md'));
await copyFile('docs/R06-COVERAGE.json',path.join(destination,'review','R06-COVERAGE.json'));
const server=`import {spawn} from 'node:child_process';\nimport http from 'node:http';\nimport {readFile} from 'node:fs/promises';\nimport path from 'node:path';\nimport {fileURLToPath} from 'node:url';\nconst root=path.dirname(fileURLToPath(import.meta.url)),port=Number(process.env.PORT||4201);\nconst types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.woff2':'font/woff2','.svg':'image/svg+xml','.png':'image/png'};\nhttp.createServer(async(req,res)=>{try{const url=new URL(req.url,'http://localhost');const relative=decodeURIComponent(url.pathname);const file=path.resolve(root,'.'+relative+(relative.endsWith('/')?'index.html':''));if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}const data=await readFile(file);res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'}).end(data);}catch{res.writeHead(404).end('Not found');}}).on('error',e=>{console.error('Could not start local review:',e.message,'Choose another PORT if this one is occupied.');process.exitCode=1;}).listen(port,'127.0.0.1',()=>{console.log('Open http://127.0.0.1:'+port+'/  |  Build ${manifest.id}');if(process.argv.includes('--open')&&process.platform==='win32')spawn('cmd',['/c','start','','http://127.0.0.1:'+port+'/'],{windowsHide:true});});\n`;
await writeFile(path.join(destination,'serve-review.mjs'),server);
await writeFile(path.join(destination,'START-HERE.txt'),`Lever Lab: Partners In Balance\nREPAIR REVIEW CANDIDATE - All 68 coverage rows passed shared-classwork browser walkthroughs in both renderers. Independent recheck and user playtest approval remain pending. Hold student use.\n\nBuild: ${manifest.id}\nOriginal source baseline: 9bfce52767e51ae728ffa9fec717264c554d026b\n\n1. Extract this complete ZIP.\n2. On Windows, double-click StartReview.cmd. It uses Node.js from PATH or the existing Codex Node runtime. Otherwise open a terminal in this folder with Node.js 22 or later installed.\n3. Run: node serve-review.mjs\n4. Open http://127.0.0.1:4201/ in your browser.\n\nKeep the terminal open while reviewing. Press Ctrl+C when done. No npm install or internet is required. If this port is occupied, choose another PORT; browser saves are tied to the address, so download a backup before switching. Do not double-click index.html.\n\nOne guided assignment covers both R06 packets. Brief teaching and examples are embedded. The hanging load and hand effort are distinct: g-equivalent is a push calibration, not hand mass. The new frozen classroom retains the mat, paper pad, and pencil. Use Question Index for the lever-icon navigation and Recover Saved Work. Download Completed Work appears after all required question evidence is recorded. Work is anonymous and shared; classroom identity is added in Classroom. The HTML report is printable and contains drawings, original predictions, corrections, and trial history. Attach the downloaded file to Classroom and select Turn In yourself.\n\nTeacher approval is still needed before any deployment. Automated completion checks do not evaluate the quality of reasoning or drawings, teaching quality, accessibility for every learner, or physical build/test work. See TEACHER-REVIEW.md for suggested playtests. The notebook floats over the room; Hide Notebook collapses it when you need a clear apparatus view.\n\nScreenshots, synthetic full-run reports/backups, and exact build-specific test results are in review/. Synthetic test responses are validation fixtures, not model student explanations. No real student data is included.\n`);
await writeFile(path.join(destination,'StartReview.cmd'),'@echo off\r\nsetlocal\r\ncd /d "%~dp0"\r\nset "LAB_NODE=node"\r\nif exist "%USERPROFILE%\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\node\\bin\\node.exe" set "LAB_NODE=%USERPROFILE%\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\node\\bin\\node.exe"\r\n"%LAB_NODE%" serve-review.mjs --open\r\nif errorlevel 1 pause\r\n');
await mkdir('output',{recursive:true});
// Python's standard-library zipfile keeps this packaging step dependency-free.
const python=process.env.REVIEW_PYTHON||'python';
execFileSync(python,['-c',"import pathlib,sys,zipfile; root=pathlib.Path(sys.argv[1]); out=pathlib.Path(sys.argv[2]); z=zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED); [z.write(p,p.relative_to(root.parent)) for p in root.rglob('*') if p.is_file()]; z.close()",destination,path.resolve('output',manifest.id+'.zip')]);
console.log(path.resolve('output',manifest.id+'.zip'));
