#!/usr/bin/env node
// Wandelt eine lokal gespeicherte CSV-Fassung der BVL-Liste zugelassener Betriebe (BLtU)
// in data/bltu.json um, damit die App zur Zulassungsnummer Betriebsname und Ort zeigt.
//
//   npm run bltu -- pfad/zur/liste.csv [weitere.csv …]
//
// WICHTIG: Vor dem Veröffentlichen von data/bltu.json die Nutzungsbedingungen der BVL prüfen
// (siehe README, Abschnitt "Betriebsverzeichnis"). Das Skript lädt nichts aus dem Netz.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {parse,bltuKey} from '../src/parser.js';

/** Einfacher CSV-Parser (Trennzeichen ; oder , oder Tab, Anführungszeichen, Zeilenumbrüche in Feldern). */
export function parseCsv(text){
  text=text.replace(/^﻿/,'');
  const first=text.split(/\r?\n/,1)[0];
  const sep=[';','\t',','].sort((a,b)=>first.split(b).length-first.split(a).length)[0];
  const rows=[];let row=[],f='',q=false;
  for(let i=0;i<text.length;i++){const c=text[i];
    if(q){if(c==='"'){if(text[i+1]==='"'){f+='"';i++}else q=false}else f+=c;continue}
    if(c==='"')q=true;
    else if(c===sep){row.push(f);f=''}
    else if(c==='\n'||c==='\r'){if(c==='\r'&&text[i+1]==='\n')i++;row.push(f);rows.push(row);row=[];f=''}
    else f+=c;}
  if(f||row.length){row.push(f);rows.push(row)}
  return rows.filter(r=>r.some(x=>x.trim()));
}

const COLS={
  nr:/zulassungs|approval|kennnummer|registriernummer/i,
  name:/^(name|betrieb|firma|establishment)|name/i,
  ort:/^(ort|stadt|town|city|gemeinde)|ort$/i,
  plz:/plz|postleitzahl|post ?code/i,
  taetigkeit:/t(ä|ae)tigkeit|activit|kategorie|category/i
};

/** Normalisiert eine Zulassungsnummer auf den App-Schlüssel, z. B. "BY 10234" → "DE-BY-10234". */
export function keyFor(nr){
  const c=parse(nr)||parse('DE '+nr);
  return c?bltuKey(c):null;
}

export function convert(rows){
  const hi=rows.findIndex(r=>r.some(x=>COLS.nr.test(x)));
  if(hi<0)throw new Error('Keine Spalte "Zulassungsnummer" gefunden. Bitte Kopfzeile prüfen.');
  const head=rows[hi].map(x=>x.trim());
  const idx={};for(const [k,re] of Object.entries(COLS))idx[k]=head.findIndex(h=>re.test(h));
  if(idx.name===idx.nr)idx.name=head.findIndex((h,i)=>i!==idx.nr&&COLS.name.test(h));
  const out={};let skipped=0;
  for(const r of rows.slice(hi+1)){
    const get=k=>idx[k]>=0?(r[idx[k]]||'').replace(/\s+/g,' ').trim():'';
    const key=keyFor(get('nr'));
    if(!key||!get('name')){skipped++;continue}
    const ort=[get('plz'),get('ort')].filter(Boolean).join(' ');
    const e={name:get('name')};if(ort)e.ort=ort;if(get('taetigkeit'))e.taetigkeit=get('taetigkeit');
    out[key]=e;
  }
  return {betriebe:out,skipped};
}

if(import.meta.url===`file://${process.argv[1]}`){
  const files=process.argv.slice(2);
  if(!files.length){console.error('Aufruf: npm run bltu -- liste.csv [weitere.csv …]');process.exit(1)}
  const all={};
  for(const f of files){
    const {betriebe,skipped}=convert(parseCsv(await readFile(f,'utf8')));
    Object.assign(all,betriebe);
    console.log(`${path.basename(f)}: ${Object.keys(betriebe).length} Betriebe, ${skipped} Zeilen übersprungen`);
  }
  const target=path.resolve(path.dirname(new URL(import.meta.url).pathname),'../data/bltu.json');
  await mkdir(path.dirname(target),{recursive:true});
  await writeFile(target,JSON.stringify({quelle:'BVL – Liste der zugelassenen Betriebe (BLtU)',stand:new Date().toISOString().slice(0,10),betriebe:all}));
  console.log(`→ ${path.relative(process.cwd(),target)} (${Object.keys(all).length} Einträge)`);
}
