// Baut die statische Seite nach dist/: App-Dateien + selbst gehostetes Tesseract.js.
import {cp,mkdir,rm,readFile,writeFile,access} from 'node:fs/promises';
import {execSync} from 'node:child_process';
import {createRequire} from 'node:module';
import path from 'node:path';

const require=createRequire(import.meta.url);
const root=path.resolve(path.dirname(new URL(import.meta.url).pathname),'..');
const dist=path.join(root,'dist');
const pkgDir=name=>path.dirname(require.resolve(`${name}/package.json`));
const exists=p=>access(p).then(()=>true,()=>false);

await rm(dist,{recursive:true,force:true});
await mkdir(dist,{recursive:true});

for(const f of ['index.html','manifest.webmanifest','sw.js','src','icons'])
  await cp(path.join(root,f),path.join(dist,f),{recursive:true});
// Optionales Betriebsverzeichnis (siehe scripts/bltu-to-json.mjs); sonst leere Datei
await mkdir(path.join(dist,'data'),{recursive:true});
if(await exists(path.join(root,'data/bltu.json')))
  await cp(path.join(root,'data/bltu.json'),path.join(dist,'data/bltu.json'));
else await writeFile(path.join(dist,'data/bltu.json'),'{"betriebe":{}}');

// Tesseract.js: Bibliothek, Worker, LSTM-Kerne (nur die, die bei OEM 1 geladen werden) und Sprachdaten
const v=path.join(dist,'vendor/tesseract');
await mkdir(path.join(v,'core'),{recursive:true});
await mkdir(path.join(v,'lang'),{recursive:true});
const tjs=pkgDir('tesseract.js'),core=pkgDir('tesseract.js-core');
for(const f of ['tesseract.esm.min.js','worker.min.js']) await cp(path.join(tjs,'dist',f),path.join(v,f));
for(const f of ['tesseract-core-lstm.wasm.js','tesseract-core-simd-lstm.wasm.js','tesseract-core-relaxedsimd-lstm.wasm.js'])
  await cp(path.join(core,f),path.join(v,'core',f));
for(const l of ['deu','eng'])
  await cp(path.join(pkgDir(`@tesseract.js-data/${l}`),'4.0.0_best_int',`${l}.traineddata.gz`),path.join(v,'lang',`${l}.traineddata.gz`));
for(const [d,f] of [[tjs,'LICENSE.md'],[core,'LICENSE']])
  if(await exists(path.join(d,f))) await cp(path.join(d,f),path.join(v,path.basename(d)+'-'+f));

// Cache-Version des Service Workers: Commit-Hash oder Zeitstempel
let version;
try{version=execSync('git rev-parse --short HEAD',{cwd:root,stdio:['ignore','pipe','ignore']}).toString().trim()}catch{}
version=(version||'dev')+'-'+Date.now().toString(36);
const sw=path.join(dist,'sw.js');
await writeFile(sw,(await readFile(sw,'utf8')).replace('__VERSION__',version));

await writeFile(path.join(dist,'.nojekyll'),'');
console.log(`dist/ gebaut (Version ${version})`);
