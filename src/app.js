import {LAND,BL,SUF,BLNR,EIHF,KAT} from './data.js';
import {parse,parseEgg,guessKat,findCode,codeStr,eggStr,offSlug,bltuKey} from './parser.js';
import {getWorker,recognize,enhance,removeFrames,onProgress} from './ocr.js';

const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

/* ---------- Betriebsverzeichnis (optional, data/bltu.json) ---------- */
let bltu=null;
const bltuReady=fetch('data/bltu.json').then(r=>r.ok?r.json():null).then(j=>{bltu=j?.betriebe||null}).catch(()=>{});

/* ---------- Darstellung ---------- */
function stamp(c){
  const line1=c.land, line2=[c.region,c.nr].filter(Boolean).join(' '), line3=c.suf||'·';
  const fs2=line2.length>10?40:52;
  return `<svg viewBox="0 0 520 300" role="img" aria-label="Kennzeichen ${esc(codeStr(c))}">
   <ellipse cx="260" cy="150" rx="248" ry="138" fill="none" stroke="var(--stamp)" stroke-width="9"/>
   <ellipse cx="260" cy="150" rx="232" ry="122" fill="none" stroke="var(--stamp)" stroke-width="2" opacity=".6"/>
   <text x="260" y="100" text-anchor="middle" font-size="46">${esc(line1)}</text>
   <text x="260" y="168" text-anchor="middle" font-size="${fs2}">${esc(line2)}</text>
   <text x="260" y="228" text-anchor="middle" font-size="46">${esc(line3)}</text></svg>`;
}

function eggHtml(e){
  const bl=e.land==='DE'?BLNR[e.nr.slice(0,2)]:'';
  const betrieb=e.land==='DE'&&e.nr.length===7?e.nr.slice(2,6):e.nr;
  const stall=e.land==='DE'&&e.nr.length===7?e.nr.slice(6):'';
  return `<h2>Erzeugercode auf dem Ei</h2><p style="font:700 clamp(26px,7vw,40px) 'Archivo Narrow',sans-serif;color:var(--stamp);margin:4px 0 10px">${esc(eggStr(e))}</p>
  <div class="parts">
   <div class="part"><span>Haltung</span><b>${esc(e.hf)}</b><div>${esc(EIHF[e.hf])}</div></div>
   <div class="part"><span>Land</span><b>${esc(e.land)}</b><div>${esc(LAND[e.land]||'')}</div></div>
   ${bl?`<div class="part"><span>Bundesland</span><b>${esc(e.nr.slice(0,2))}</b><div>${esc(bl)}</div></div>`:''}
   <div class="part"><span>Betrieb</span><b>${esc(betrieb)}</b><div>Nummer des Legebetriebs</div></div>
   ${stall?`<div class="part"><span>Stall</span><b>${esc(stall)}</b><div>Stallnummer im Betrieb</div></div>`:''}
  </div>
  <div class="note">Mit diesem Code kommst du bis zum Hof: Über die Ei-Suche von KAT (Verein für kontrollierte alternative Tierhaltungsformen) lässt sich der Betrieb bei teilnehmenden Erzeugern nachschlagen.</div>
  <div class="links"><a href="https://www.was-steht-auf-dem-ei.de">Erzeuger auf was-steht-auf-dem-ei.de suchen</a></div>`;
}

const GENERIC='Dieser Betrieb hat das Produkt zuletzt hergestellt, verarbeitet oder verpackt. Bei Fleisch ist es meist nicht der Hof, bei Milch die Molkerei.';
function katChips(kat){
  return `<p class="mute" style="margin:0 0 4px">Produktart wählen für eine genauere Erklärung:</p><div class="kats" id="kats">${
    Object.entries(KAT).map(([k,v])=>`<button type="button" data-k="${k}" aria-pressed="${k===kat}">${esc(v.name)}</button>`).join('')}</div>`;
}
function betriebHtml(c){
  const b=bltu?.[bltuKey(c)];
  if(!b)return'';
  return `<table style="margin-bottom:12px"><tr><td>Betrieb</td><td>${esc(b.name)}</td></tr>${b.ort?`<tr><td>Ort</td><td>${esc(b.ort)}</td></tr>`:''}${b.taetigkeit?`<tr><td>Tätigkeit</td><td>${esc(b.taetigkeit)}</td></tr>`:''}</table>`;
}

function render(c,kat){
  kat=KAT[kat]?kat:'';
  const parts=[
    `<div class="part"><span>Land</span><b>${esc(c.land)}</b><div>${esc(LAND[c.land]||'unbekannt')}</div></div>`,
    c.region?`<div class="part"><span>Bundesland</span><b>${esc(c.region)}</b><div>${esc(BL[c.region]||'')}</div></div>`:'',
    `<div class="part"><span>Zulassungsnummer</span><b>${esc(c.nr)}</b><div>des Betriebs</div></div>`,
    c.suf?`<div class="part"><span>EU-Kürzel</span><b>${esc(c.suf)}</b><div>„EU-zugelassen“ auf ${esc(SUF[c.suf]||'Landessprache')}</div></div>`:''
  ].join('');
  const links=[`<a href="https://world.openfoodfacts.org/packager-code/${encodeURIComponent(offSlug(c))}">Bei Open Food Facts nachsehen</a>`];
  if(c.land==='DE')links.unshift(`<a href="https://www.bvl.bund.de/EN/Tasks/01_Food/01_tasks/02_OfficialFoodControl/11_Datamanagement/Datamanagement_node.html">Betrieb in der BVL-Liste (BLtU) suchen</a>`);
  $('#out').innerHTML=`<h2>Erkanntes Kennzeichen</h2><div class="stampbox">${stamp(c)}</div>
   <div class="parts">${parts}</div>${betriebHtml(c)}
   ${katChips(kat)}
   <div class="note" id="katNote"><b>Was das bedeutet:</b> ${kat?KAT[kat].note:GENERIC}</div>
   <div class="links">${links.join('')}</div>`;
  $('#kats').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
    const k=b.dataset.k;
    $('#kats').querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));
    $('#katNote').innerHTML=`<b>Was das bedeutet:</b> ${KAT[k].note}`;});
  save(codeStr(c));
  if(!bltu)bltuReady.then(()=>{if(bltu?.[bltuKey(c)]&&$('#katNote'))render(c,kat)});
}
function renderEgg(e){
  $('#out').innerHTML=eggHtml(e);
  save(eggStr(e));
}
function renderNone(text){
  const t=String(text||'').replace(/\s+/g,' ').trim().slice(0,200);
  $('#out').innerHTML=`<h2>Kein Kennzeichen gefunden</h2><p>Das ovale Zeichen war auf dem Foto nicht lesbar. Versuch es näher, gerader und ohne Spiegelung, oder tipp den Code oben ein.</p>`+(t?`<p class="mute">Gelesen: ${esc(t)}</p>`:'');
}
function show(hit,kat){if(hit.type==='egg')renderEgg(hit.egg);else render(hit.code,kat)}

function check(v){const s=String(v||'').trim();
  const e=/^[0-3]/.test(s)?parseEgg(s):null;if(e){renderEgg(e);return true}
  const c=parse(s);if(c){render(c);return true}return false}
const toResult=()=>$('#result').scrollIntoView({behavior:'smooth'});

/* ---------- Verlauf ---------- */
let hist=[];try{hist=JSON.parse(localStorage.getItem('fc-hist')||'[]')}catch(e){}
function save(s){hist=[s,...hist.filter(x=>x!==s)].slice(0,8);try{localStorage.setItem('fc-hist',JSON.stringify(hist))}catch(e){}drawHist()}
function drawHist(){if(!hist.length)return;$('#hist').innerHTML=hist.map(h=>`<button data-c="${esc(h)}">${esc(h)}</button>`).join('')}
$('#hist').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(check(b.dataset.c))toResult()});
drawHist();

/* ---------- Manuelle Eingabe ---------- */
function status(t,err){const s=$('#status');s.textContent=t;s.className='status'+(err?' err':'')}
$('#manual').addEventListener('submit',e=>{e.preventDefault();const v=$('#code').value;
  if(check(v)){status('');toResult()}else status('Das sieht nicht wie ein Kennzeichen aus. Format z. B.: DE NW 12345 EG oder beim Ei 1-DE-0512345',true)});

const STAGE={'loading tesseract core':'Texterkennung wird geladen','loading language traineddata':'Sprachdaten werden geladen','initializing api':'Texterkennung startet'};
onProgress(m=>{const s=STAGE[m.status];if(!s||m.progress>=1)return;
  const t=`${s} … ${Math.round(m.progress*100)} %`;
  if(!$('#scanner').classList.contains('hide'))$('#hint').textContent=t;else status(t)});

/* ---------- Live-Scanner ---------- */
const video=$('#video'),frame=$('#frame'),hint=$('#hint');
let stream=null,timer=0,busy=false,running=false;
const crop=document.createElement('canvas');

function cropFrame(){
  const vw=video.videoWidth,vh=video.videoHeight;if(!vw||!vh)return null;
  const vr=video.getBoundingClientRect(),fr=frame.getBoundingClientRect();
  // object-fit: cover → Bildschirmkoordinaten auf Videopixel umrechnen
  const k=Math.max(vr.width/vw,vr.height/vh);
  const ox=(vr.width-vw*k)/2,oy=(vr.height-vh*k)/2;
  const sx=(fr.left-vr.left-ox)/k,sy=(fr.top-vr.top-oy)/k,sw=fr.width/k,sh=fr.height/k;
  const scale=Math.min(2,1400/sw);
  crop.width=Math.round(sw*scale);crop.height=Math.round(sh*scale);
  crop.getContext('2d',{willReadFrequently:true}).drawImage(video,sx,sy,sw,sh,0,0,crop.width,crop.height);
  return removeFrames(enhance(crop));
}

async function tick(){
  if(!running)return;
  const t0=performance.now();
  if(!busy&&video.readyState>=2){
    busy=true;
    try{
      const c=cropFrame();
      const text=c?await recognize(c,{mode:'6'}):'';
      if(!running)return;
      hint.textContent='Oval oder Eiercode in den Rahmen halten';
      const hit=findCode(text,{strict:true});
      if(hit){found(hit,text);return}
    }catch(e){console.error(e);hint.textContent='Texterkennung fehlgeschlagen, versuche es erneut …'}
    finally{busy=false}
  }
  timer=setTimeout(tick,Math.max(150,1000-(performance.now()-t0)));
}

function found(hit,text){
  running=false;clearTimeout(timer);
  frame.classList.add('hit');navigator.vibrate?.(60);
  video.pause();releaseCamera();
  hint.textContent='Gefunden: '+(hit.type==='egg'?eggStr(hit.egg):codeStr(hit.code));
  $('#resumeBtn').classList.remove('hide');$('#torchBtn').classList.add('hide');
  show(hit,guessKat(text));toResult();
}

function releaseCamera(){stream?.getTracks().forEach(t=>t.stop());stream=null}

async function startCamera(){
  $('#scanner').classList.remove('hide');$('#resumeBtn').classList.add('hide');frame.classList.remove('hit');
  $('#preview').style.display='none';status('');
  hint.textContent='Kamera wird gestartet …';
  getWorker().catch(()=>{}); // OCR parallel vorladen
  try{
    stream=await navigator.mediaDevices.getUserMedia({audio:false,video:{facingMode:{ideal:'environment'},width:{ideal:1920},height:{ideal:1080}}});
  }catch(e){
    $('#scanner').classList.add('hide');
    status(e?.name==='NotAllowedError'?'Kamerazugriff wurde nicht erlaubt. Lade stattdessen ein Foto hoch oder gib den Code ein.':'Die Kamera konnte nicht gestartet werden. Lade stattdessen ein Foto hoch oder gib den Code ein.',true);
    return;
  }
  video.srcObject=stream;await video.play().catch(()=>{});
  const track=stream.getVideoTracks()[0];
  const torch=track?.getCapabilities?.().torch;
  $('#torchBtn').classList.toggle('hide',!torch);$('#torchBtn').setAttribute('aria-pressed','false');$('#torchBtn').textContent='Licht an';
  hint.textContent='Oval oder Eiercode in den Rahmen halten';
  try{await getWorker()}catch(e){
    stopCamera();status('Die Texterkennung konnte nicht geladen werden. Beim ersten Start ist eine Internetverbindung nötig.',true);return}
  running=true;tick();
}

function stopCamera(){
  running=false;clearTimeout(timer);releaseCamera();video.srcObject=null;
  $('#scanner').classList.add('hide');
}

if(navigator.mediaDevices?.getUserMedia){
  $('#liveBtn').addEventListener('click',startCamera);
}else{
  $('#liveBtn').classList.add('hide');
  $('.actions').style.gridTemplateColumns='minmax(0,1fr)';
}
$('#resumeBtn').addEventListener('click',startCamera);
$('#stopBtn').addEventListener('click',stopCamera);
$('#torchBtn').addEventListener('click',async e=>{
  const b=e.currentTarget,on=b.getAttribute('aria-pressed')!=='true';
  try{await stream?.getVideoTracks()[0].applyConstraints({advanced:[{torch:on}]});
    b.setAttribute('aria-pressed',String(on));b.textContent=on?'Licht aus':'Licht an'}catch(_){}
});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&running)stopCamera()});

/* ---------- Foto hochladen ---------- */
function loadImage(file){return new Promise((res,rej)=>{const img=new Image();img.onload=()=>res(img);img.onerror=rej;img.src=URL.createObjectURL(file)})}

async function handleFile(file){
  if(!file)return;
  stopCamera();
  $('#preview').src=URL.createObjectURL(file);$('#preview').style.display='block';
  status('Etikett wird gelesen …');
  document.querySelectorAll('.btn').forEach(b=>b.setAttribute('disabled',''));
  try{
    const img=await loadImage(file);
    const k=Math.min(1,2000/Math.max(img.width,img.height));
    const cv=document.createElement('canvas');cv.width=Math.round(img.width*k);cv.height=Math.round(img.height*k);
    cv.getContext('2d',{willReadFrequently:true}).drawImage(img,0,0,cv.width,cv.height);
    enhance(cv);
    const raw=document.createElement('canvas');raw.width=cv.width;raw.height=cv.height;raw.getContext('2d').drawImage(cv,0,0);
    removeFrames(cv);
    // 1. ohne Rahmenlinien, verstreuter Text  2. Originalbild, automatische Seitenanalyse
    let text='',hit=null;
    for(const [c,mode] of [[cv,'11'],[raw,'3']]){
      const t=await recognize(c,{mode});text+=' '+t;
      hit=findCode(t,{strict:true})||findCode(t);if(hit)break;
    }
    status('');
    if(hit)show(hit,guessKat(text));else renderNone(text);
    toResult();
  }catch(e){
    console.error(e);
    status('Das Bild konnte nicht gelesen werden. Bitte erneut versuchen oder den Code eintippen.',true);
  }finally{document.querySelectorAll('.btn').forEach(b=>b.removeAttribute('disabled'));$('#pick').value=''}
}
$('#pick').addEventListener('change',e=>handleFile(e.target.files[0]));
document.querySelectorAll('label.btn').forEach(l=>l.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();l.querySelector('input').click()}}));

/* ---------- PWA ---------- */
if('serviceWorker' in navigator&&location.protocol!=='file:'){
  window.addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));
}
