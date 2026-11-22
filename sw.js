// Service Worker: App-Shell vorab cachen, Tesseract-Dateien beim ersten Gebrauch cachen.
const VERSION='__VERSION__';
const SHELL=`shell-${VERSION}`;
const OCR='ocr-v1';      // Tesseract-Dateien, groß und versioniert über ihren Pfad
const FONTS='fonts-v1';
const ASSETS=['./','index.html','manifest.webmanifest','src/app.js','src/parser.js','src/data.js','src/ocr.js',
  'data/bltu.json','icons/icon.svg','icons/icon-192.png','icons/icon-512.png','icons/icon-maskable-512.png'];

self.addEventListener('install',e=>{
  e.waitUntil(caches.open(SHELL).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()));
});

self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(
    keys.filter(k=>k.startsWith('shell-')&&k!==SHELL).map(k=>caches.delete(k))
  )).then(()=>self.clients.claim()));
});

async function cacheFirst(cacheName,req){
  const cache=await caches.open(cacheName);
  const hit=await cache.match(req);
  if(hit)return hit;
  const res=await fetch(req);
  if(res.ok||res.type==='opaque')cache.put(req,res.clone());
  return res;
}
async function networkFirst(cacheName,req){
  const cache=await caches.open(cacheName);
  try{const res=await fetch(req);if(res.ok)cache.put(req,res.clone());return res}
  catch(e){const hit=await cache.match(req,{ignoreSearch:true});if(hit)return hit;throw e}
}

self.addEventListener('fetch',e=>{
  const req=e.request;if(req.method!=='GET')return;
  const url=new URL(req.url);
  if(url.origin==='https://fonts.googleapis.com'||url.origin==='https://fonts.gstatic.com'){
    e.respondWith(cacheFirst(FONTS,req));return;
  }
  if(url.origin!==location.origin)return;
  if(url.pathname.includes('/vendor/tesseract/')){e.respondWith(cacheFirst(OCR,req));return}
  // App-Shell und Daten: erst Netz (damit Updates ankommen), offline aus dem Cache
  e.respondWith(networkFirst(SHELL,req).catch(async()=>
    req.mode==='navigate'?(await caches.match('index.html')):Response.error()));
});
