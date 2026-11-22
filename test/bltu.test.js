import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseCsv,convert,keyFor} from '../scripts/bltu-to-json.mjs';

test('keyFor normalisiert Zulassungsnummern', ()=>{
  assert.equal(keyFor('BY 10234'),'DE-BY-10234');
  assert.equal(keyFor('DE BY 10234 EG'),'DE-BY-10234');
  assert.equal(keyFor('NW-12345'),'DE-NW-12345');
  assert.equal(keyFor('Unsinn'),null);
});

test('CSV mit Semikolon, Anführungszeichen und Kopfzeile', ()=>{
  const csv='﻿Liste Abschnitt I\nZulassungsnummer;Name des Betriebs;PLZ;Ort;Tätigkeiten\n'+
    'BY 10234;"Muster ""Fleisch"" GmbH";80331;München;CP\n'+
    'NW 12345;Beispiel AG;;Köln;"PP; RW"\n'+
    ';ohne Nummer;;;\n';
  const {betriebe,skipped}=convert(parseCsv(csv));
  assert.deepEqual(betriebe['DE-BY-10234'],{name:'Muster "Fleisch" GmbH',ort:'80331 München',taetigkeit:'CP'});
  assert.deepEqual(betriebe['DE-NW-12345'],{name:'Beispiel AG',ort:'Köln',taetigkeit:'PP; RW'});
  assert.equal(skipped,1);
});
