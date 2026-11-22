import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parse,parseEgg,guessKat,findCode,ocrClean,codeStr,offSlug,bltuKey} from '../src/parser.js';

test('parse: deutsches Oval mit Bundesland', ()=>{
  assert.deepEqual(parse('DE BY 10234 EG'),{land:'DE',region:'BY',nr:'10234',suf:'EG'});
  assert.deepEqual(parse('de-nw-12345-eg'),{land:'DE',region:'NW',nr:'12345',suf:'EG'});
  assert.deepEqual(parse('DE\nBY 10234\nEG'),{land:'DE',region:'BY',nr:'10234',suf:'EG'});
  assert.deepEqual(parse('DE BY 10234EG'),{land:'DE',region:'BY',nr:'10234',suf:'EG'});
  assert.deepEqual(parse('DE NI 123A EG'),{land:'DE',region:'NI',nr:'123A',suf:'EG'});
});

test('parse: deutsches Oval ohne Kürzel nur im toleranten Modus', ()=>{
  assert.deepEqual(parse('DE BY 10234'),{land:'DE',region:'BY',nr:'10234',suf:''});
  assert.equal(parse('DE BY 10234',{strict:true}),null);
});

test('parse: andere EU-Länder', ()=>{
  assert.deepEqual(parse('ES 10.04321/M CE'),{land:'ES',region:'',nr:'10.04321/M',suf:'CE'});
  assert.deepEqual(parse('FR 35.238.001 CE'),{land:'FR',region:'',nr:'35.238.001',suf:'CE'});
  assert.deepEqual(parse('PL 14611601 WE'),{land:'PL',region:'',nr:'14611601',suf:'WE'});
  assert.deepEqual(parse('AT 60117 EG'),{land:'AT',region:'',nr:'60117',suf:'EG'});
  assert.deepEqual(parse('NL 123 EG',{strict:true}),{land:'NL',region:'',nr:'123',suf:'EG'});
});

test('parse: Kürzel mit Umlaut / griechisch am Textende', ()=>{
  assert.deepEqual(parse('EE 123 EÜ'),{land:'EE',region:'',nr:'123',suf:'EÜ'});
  assert.deepEqual(parse('EL 45 ΕΚ'),{land:'EL',region:'',nr:'45',suf:'ΕΚ'});
});

test('parse: ohne Kürzel (Nicht-EU) nur tolerant', ()=>{
  assert.deepEqual(parse('CH 1234'),{land:'CH',region:'',nr:'1234',suf:''});
  assert.equal(parse('CH 1234',{strict:true}),null);
});

test('parse: kein Kennzeichen', ()=>{
  assert.equal(parse(''),null);
  assert.equal(parse(null),null);
  assert.equal(parse('Hallo Welt'),null);
  assert.equal(parse('XX 12345 EG'),null);           // unbekanntes Land
  assert.equal(parse('FETT 3,5 % HALTBAR'),null);
  assert.equal(parse('DE ES IST EG',{strict:true}),null); // Kürzel, aber keine Nummer
});

test('parseEgg: deutscher Erzeugercode', ()=>{
  assert.deepEqual(parseEgg('1-DE-0512345'),{hf:'1',land:'DE',nr:'0512345'});
  assert.deepEqual(parseEgg('0 DE 0912345'),{hf:'0',land:'DE',nr:'0912345'});
  assert.deepEqual(parseEgg('2DE0312345'),{hf:'2',land:'DE',nr:'0312345'});
  assert.deepEqual(parseEgg('3-NL-4012345'),{hf:'3',land:'NL',nr:'4012345'});
});

test('parseEgg: ungültige Codes', ()=>{
  assert.equal(parseEgg('4-DE-0512345'),null);  // Haltung nur 0–3
  assert.equal(parseEgg('1-XX-0512345'),null);  // unbekanntes Land
  assert.equal(parseEgg('1-DE-123'),null);      // zu kurz
  assert.equal(parseEgg('1-DE-9912345',{strict:true}),null); // Bundesland 99
  assert.deepEqual(parseEgg('1-DE-9912345'),{hf:'1',land:'DE',nr:'9912345'});
});

test('guessKat', ()=>{
  assert.equal(guessKat('Frische Vollmilch'),'milch');
  assert.equal(guessKat('Gouda Käse'),'milch');
  assert.equal(guessKat('Eier Größe M'),'eier');
  assert.equal(guessKat('Lachsfilet'),'fisch');
  assert.equal(guessKat('Schweinehackfleisch'),'fleisch');
  assert.equal(guessKat('Salami'),'fleisch');
  assert.equal(guessKat('Gemüse'),'');
  assert.equal(guessKat(undefined),'');
});

test('ocrClean: typische Verwechslungen', ()=>{
  assert.equal(ocrClean('1-DE-O512345'),'1-DE-0512345');
  assert.equal(ocrClean('DE BY 1O234 EG'),'DE BY 10234 EG');
  assert.equal(ocrClean('DE BY 1l234 EG'),'DE BY 11234 EG');
  assert.equal(ocrClean('1–DE–0512345'),'1-DE-0512345');
});

test('findCode: Live-OCR-Text', ()=>{
  assert.deepEqual(findCode('Hergestellt für XY\nDE NW 12345 EG\nMHD 12.03.',{strict:true}),
    {type:'oval',code:{land:'DE',region:'NW',nr:'12345',suf:'EG'}});
  assert.deepEqual(findCode('1-DE-O512345',{strict:true}),{type:'egg',egg:{hf:'1',land:'DE',nr:'0512345'}});
  assert.equal(findCode('Zutaten: Milch, Salz',{strict:true}),null);
  // Eiercode darf nicht als Oval "DE 0512345" erkannt werden
  assert.equal(findCode('1-DE-0512345').type,'egg');
});

test('Hilfsfunktionen', ()=>{
  const c=parse('DE BY 10234 EG');
  assert.equal(codeStr(c),'DE BY 10234 EG');
  assert.equal(offSlug(c),'de-by-10234-ec');
  assert.equal(offSlug(parse('ES 10.04321/M CE')),'es-10-04321-m-ec');
  assert.equal(bltuKey(c),'DE-BY-10234');
});
