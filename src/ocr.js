// Texterkennung im Browser mit Tesseract.js (selbst gehostet unter vendor/tesseract/).
// Die Sprachdaten werden beim ersten Start geladen und danach von Tesseract in IndexedDB
// sowie vom Service Worker zwischengespeichert.

const base=new URL('../vendor/tesseract/',import.meta.url);
let workerPromise=null;
let progressCb=()=>{};

export function onProgress(cb){progressCb=cb||(()=>{})}

export function getWorker(){
  if(!workerPromise){
    workerPromise=(async()=>{
      const mod=await import(new URL('tesseract.esm.min.js',base).href);
      const createWorker=mod.createWorker||mod.default.createWorker;
      const w=await createWorker(['deu','eng'],1,{
        workerPath:new URL('worker.min.js',base).href,
        corePath:new URL('core/',base).href,
        langPath:new URL('lang',base).href,
        logger:m=>{if(m.status&&typeof m.progress==='number')progressCb(m)}
      });
      await w.setParameters({
        tessedit_pageseg_mode:'6', // ein Textblock
        // Kleinbuchstaben bleiben erlaubt, damit die Produktart erraten werden kann
        tessedit_char_whitelist:'ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÜabcdefghijklmnopqrstuvwxyzäöüß0123456789-./ ',
        preserve_interword_spaces:'1'
      });
      return w;
    })().catch(e=>{workerPromise=null;throw e});
  }
  return workerPromise;
}

/** Graustufen + Kontrast strecken; verbessert die Erkennung auf glänzenden Folien. */
export function enhance(canvas){
  const ctx=canvas.getContext('2d',{willReadFrequently:true});
  const img=ctx.getImageData(0,0,canvas.width,canvas.height),d=img.data;
  let lo=255,hi=0;
  for(let i=0;i<d.length;i+=4){const g=(d[i]*.299+d[i+1]*.587+d[i+2]*.114)|0;d[i]=g;if(g<lo)lo=g;if(g>hi)hi=g}
  const k=hi>lo?255/(hi-lo):1;
  for(let i=0;i<d.length;i+=4){const g=(d[i]-lo)*k;d[i]=d[i+1]=d[i+2]=g}
  ctx.putImageData(img,0,0);
  return canvas;
}

/**
 * Binarisiert das Bild und entfernt Rahmenlinien, vor allem das Oval selbst.
 * Tesseract erkennt Text, der von einer Linie umschlossen ist, sonst oft gar nicht.
 * Entfernt werden zusammenhängende dunkle Flächen, die groß und zugleich "hohl" sind
 * (wenig Füllung im Verhältnis zu ihrem Umriss) oder fast das ganze Bild umspannen.
 */
export function removeFrames(canvas){
  const W=canvas.width,H=canvas.height,N=W*H;
  const ctx=canvas.getContext('2d',{willReadFrequently:true});
  const img=ctx.getImageData(0,0,W,H),d=img.data;
  // Otsu-Schwelle auf dem Grauwert (Bild ist bereits durch enhance() grau)
  const hist=new Uint32Array(256);for(let i=0;i<N;i++)hist[d[i*4]]++;
  let sum=0;for(let i=0;i<256;i++)sum+=i*hist[i];
  let sB=0,wB=0,best=0,thr=128;
  for(let i=0;i<256;i++){wB+=hist[i];if(!wB)continue;const wF=N-wB;if(!wF)break;sB+=i*hist[i];
    const mB=sB/wB,mF=(sum-sB)/wF,v=wB*wF*(mB-mF)**2;if(v>best){best=v;thr=i}}
  const ink=new Uint8Array(N);let dark=0;
  for(let i=0;i<N;i++){if(d[i*4]<=thr){ink[i]=1;dark++}}
  if(dark>N/2)for(let i=0;i<N;i++)ink[i]^=1; // heller Text auf dunklem Grund
  // Zusammenhängende Komponenten (4er-Nachbarschaft)
  const lab=new Int32Array(N),stack=new Int32Array(N),comps=[];
  for(let s=0;s<N;s++){
    if(!ink[s]||lab[s])continue;
    const id=comps.length+1;let sp=0,n=0,x0=W,x1=0,y0=H,y1=0;
    stack[sp++]=s;lab[s]=id;
    while(sp){const p=stack[--sp];n++;const x=p%W,y=(p/W)|0;
      if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y;
      if(x>0&&ink[p-1]&&!lab[p-1]){lab[p-1]=id;stack[sp++]=p-1}
      if(x<W-1&&ink[p+1]&&!lab[p+1]){lab[p+1]=id;stack[sp++]=p+1}
      if(y>0&&ink[p-W]&&!lab[p-W]){lab[p-W]=id;stack[sp++]=p-W}
      if(y<H-1&&ink[p+W]&&!lab[p+W]){lab[p+W]=id;stack[sp++]=p+W}}
    comps.push({n,w:x1-x0+1,h:y1-y0+1});
  }
  const hs=comps.filter(c=>c.n>20).map(c=>c.h).sort((a,b)=>a-b);
  const med=hs.length?hs[hs.length>>1]:10;
  const drop=new Uint8Array(comps.length+1);
  comps.forEach((c,i)=>{const fill=c.n/(c.w*c.h);
    if(c.n<=4||c.w>W*.6||c.h>H*.6||(fill<.12&&Math.max(c.w,c.h)>3*med))drop[i+1]=1});
  for(let i=0;i<N;i++){const v=ink[i]&&!drop[lab[i]]?0:255;d[i*4]=d[i*4+1]=d[i*4+2]=v;d[i*4+3]=255}
  ctx.putImageData(img,0,0);
  return canvas;
}

let psm='6';
/** psm '6' = ein Textblock (Live-Ausschnitt), '11' = verstreuter Text (ganzes Foto). */
export async function recognize(canvas,{mode='6'}={}){
  const w=await getWorker();
  if(mode!==psm){await w.setParameters({tessedit_pageseg_mode:mode});psm=mode}
  const {data}=await w.recognize(canvas);
  return data.text||'';
}
