// Parser für EU-Identitätskennzeichen (Oval), Eier-Erzeugercodes und Produktarten.
// Reine Funktionen ohne DOM, damit sie im Browser und in Node-Tests laufen.
import {LAND,BLNR} from './data.js';

const SUFS='EG|EC|CE|ES|EF|EY|EK|EB|WE|EÜ|KE|EO|ΕΚ';
// Wortende, das auch nach Umlauten/griechischen Buchstaben funktioniert (\b ist nur ASCII).
const END='(?![A-Z0-9ÄÖÜΑ-Ω])';
const START='(?<![A-Z0-9ÄÖÜΑ-Ω])';

/** Rät die Produktart aus Freitext (Produktname, Tierart). Liefert '' wenn unklar. */
export function guessKat(t){t=String(t||'').toLowerCase();
 if(/milch|käse|kaese|joghurt|quark|butter|sahne|rahm|molkerei|kefir/.test(t))return'milch';
 if(/\bei(er)?\b|eier/.test(t))return'eier';
 if(/fisch|lachs|thun|hering|garnele|shrimp|forelle|kabeljau|seelachs|fao/.test(t))return'fisch';
 if(/fleisch|wurst|schinken|rind|schwein|hähnchen|huhn|pute|lamm|hack|salami/.test(t))return'fleisch';
 return'';}

/**
 * Eier-Erzeugercode, z. B. "1-DE-0512345".
 * strict: für Live-OCR. Deutsche Codes müssen dann 7 Ziffern mit gültigem Bundesland (01–16) haben.
 */
export function parseEgg(raw,{strict=false}={}){
 const t=String(raw??'').toUpperCase();
 const re=new RegExp(`${START}([0-3])[\\s-]*([A-Z]{2})[\\s-]*([0-9]{5,9})${END}`,'g');
 for(const m of t.matchAll(re)){
  if(!LAND[m[2]])continue;
  if(strict&&m[2]==='DE'&&!(m[3].length===7&&BLNR[m[3].slice(0,2)]))continue;
  return{hf:m[1],land:m[2],nr:m[3]};
 }
 return null;
}

/**
 * Identitätskennzeichen, z. B. "DE BY 10234 EG" oder "ES 10.04321/M CE".
 * strict: für Live-OCR. Verlangt das EU-Kürzel (EG, CE, …), um Zufallstreffer zu vermeiden.
 */
export function parse(raw,{strict=false}={}){
 const t=String(raw??'').toUpperCase().replace(/[\n\r]+/g,' ').replace(/\s+/g,' ');
 let m=t.match(new RegExp(`${START}(DE)[\\s-]*(BW|BY|BE|BB|HB|HH|HE|MV|NI|NW|RP|SL|SN|ST|SH|TH)[\\s-]*([0-9]{2,6}[A-Z]?)[\\s-]*(EG|EC|CE)?${END}`));
 if(m&&(!strict||m[4]))return{land:'DE',region:m[2],nr:m[3],suf:m[4]||''};
 m=t.match(new RegExp(`${START}([A-Z]{2})[\\s-]+([A-Z0-9][A-Z0-9.\\/\\- ]{0,16}?)[\\s-]+(${SUFS})${END}`));
 if(m&&LAND[m[1]]&&/[0-9]/.test(m[2]))return{land:m[1],region:'',nr:m[2].trim(),suf:m[3]};
 if(strict)return null;
 m=t.match(new RegExp(`${START}([A-Z]{2})[\\s-]+([0-9][0-9.\\/\\- ]{1,14}[0-9])${END}`));
 if(m&&LAND[m[1]])return{land:m[1],region:'',nr:m[2].trim(),suf:''};
 return null;
}

/** Typische OCR-Verwechslungen neben Ziffern korrigieren: O/Q/D→0, I/l/|→1, S→5, B→8. */
export function ocrClean(text){
 return String(text??'')
  .replace(/[|]/g,'I')
  .replace(/(?<=[0-9])[OQ]|[OQ](?=[0-9])/g,'0')
  .replace(/(?<=[0-9])[Il](?=[0-9])/g,'1')
  .replace(/(?<=[0-9])S(?=[0-9])/g,'5')
  .replace(/(?<=[0-9])B(?=[0-9])/g,'8')
  .replace(/[‐‑‒–—]/g,'-');
}

/**
 * Sucht im (OCR-)Text nach einem Kennzeichen oder Eiercode.
 * Liefert {type:'oval',code} | {type:'egg',egg} | null.
 */
export function findCode(text,{strict=false}={}){
 for(const t of [String(text??''),ocrClean(text)]){
  // Eiercode zuerst: "1-DE-0512345" würde sonst als Oval "DE 0512345" gelesen.
  const e=parseEgg(t,{strict});if(e)return{type:'egg',egg:e};
  const c=parse(t,{strict});if(c)return{type:'oval',code:c};
 }
 return null;
}

export const codeStr=c=>[c.land,c.region,c.nr,c.suf].filter(Boolean).join(' ');
export const eggStr=e=>`${e.hf}-${e.land}-${e.nr}`;
export const offSlug=c=>[c.land,c.region,c.nr,c.suf?'ec':''].filter(Boolean).join('-').toLowerCase().replace(/[.\/\s]+/g,'-');

/** Schlüssel für das Betriebsverzeichnis, z. B. "DE-BY-10234". */
export const bltuKey=c=>[c.land,c.region,c.nr].filter(Boolean).join('-').toUpperCase().replace(/\s+/g,'');
