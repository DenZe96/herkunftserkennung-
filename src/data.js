// Nachschlagetabellen für Kennzeichen, Eiercodes und Produktarten.

export const LAND={AT:'Österreich',BE:'Belgien',BG:'Bulgarien',CY:'Zypern',CZ:'Tschechien',DE:'Deutschland',DK:'Dänemark',EE:'Estland',EL:'Griechenland',GR:'Griechenland',ES:'Spanien',FI:'Finnland',FR:'Frankreich',HR:'Kroatien',HU:'Ungarn',IE:'Irland',IT:'Italien',LT:'Litauen',LU:'Luxemburg',LV:'Lettland',MT:'Malta',NL:'Niederlande',PL:'Polen',PT:'Portugal',RO:'Rumänien',SE:'Schweden',SI:'Slowenien',SK:'Slowakei',UK:'Vereinigtes Königreich',GB:'Vereinigtes Königreich',CH:'Schweiz',NO:'Norwegen',IS:'Island'};

export const BL={BW:'Baden-Württemberg',BY:'Bayern',BE:'Berlin',BB:'Brandenburg',HB:'Bremen',HH:'Hamburg',HE:'Hessen',MV:'Mecklenburg-Vorpommern',NI:'Niedersachsen',NW:'Nordrhein-Westfalen',RP:'Rheinland-Pfalz',SL:'Saarland',SN:'Sachsen',ST:'Sachsen-Anhalt',SH:'Schleswig-Holstein',TH:'Thüringen'};

export const SUF={EG:'Deutsch / Niederländisch / Schwedisch',EC:'Englisch',CE:'Französisch / Spanisch / Italienisch / Portugiesisch / Rumänisch',ES:'Tschechisch / Slowakisch / Slowenisch',EF:'Dänisch',EY:'Finnisch',EK:'Ungarisch / Lettisch',EB:'Litauisch',WE:'Polnisch',EÜ:'Estnisch',KE:'Maltesisch',EO:'Bulgarisch',ΕΚ:'Griechisch'};

export const BLNR={'01':'Schleswig-Holstein','02':'Hamburg','03':'Niedersachsen','04':'Bremen','05':'Nordrhein-Westfalen','06':'Hessen','07':'Rheinland-Pfalz','08':'Baden-Württemberg','09':'Bayern','10':'Saarland','11':'Berlin','12':'Brandenburg','13':'Mecklenburg-Vorpommern','14':'Sachsen','15':'Sachsen-Anhalt','16':'Thüringen'};

export const EIHF={0:'Bio (ökologische Erzeugung)',1:'Freilandhaltung',2:'Bodenhaltung',3:'Kleingruppen-/Käfighaltung'};

export const HF={1:'Stall (gesetzlicher Mindeststandard)',2:'Stall + Platz (etwas mehr Platz, Beschäftigung)',3:'Frischluftstall (Außenklima)',4:'Auslauf / Weide',5:'Bio'};

export const KAT={
 fleisch:{name:'Fleisch & Wurst',note:'Dieser Betrieb hat das Fleisch zuletzt zerlegt, verarbeitet oder verpackt. Es ist meist nicht der Hof und nicht unbedingt der Schlachthof. Bei Rindfleisch stehen Schlachtland und Schlachthof zusätzlich auf dem Etikett.',
  f:[['Tierart','tierart'],['Produkt','produkt'],['Geboren in','geboren'],['Aufgezogen in','aufgezogen'],['Geschlachtet in','geschlachtet'],['Zerlegt in','zerlegt'],['Referenznummer','referenz'],['Haltungsform','haltungsform'],['Bio-Kontrollnummer','bio'],['Verbrauchen bis','mhd'],['Weitere Angaben','sonstiges']]},
 milch:{name:'Milch & Milchprodukte',note:'Dieser Betrieb ist die Molkerei oder Käserei, die das Produkt hergestellt oder abgefüllt hat. Von welchen Höfen die Milch stammt, steht nicht im Kennzeichen. Viele Handels- und Herstellermarken kommen aus derselben Molkerei.',
  f:[['Produkt','produkt'],['Tierart','tierart'],['Hersteller / Marke','hersteller'],['Herkunft der Milch','herkunft'],['Haltung / Weide','haltungsform'],['Fettgehalt','fett'],['Wärmebehandlung','behandlung'],['Bio-Kontrollnummer','bio'],['Siegel','siegel'],['Mindestens haltbar bis','mhd'],['Weitere Angaben','sonstiges']]},
 eier:{name:'Eier & Eiprodukte',note:'Das Oval auf der Packung nennt die Packstelle. Den Hof findest du über den Erzeugercode auf dem Ei selbst.',
  f:[['Produkt','produkt'],['Güteklasse / Größe','groesse'],['Packstelle / Marke','hersteller'],['Bio-Kontrollnummer','bio'],['Siegel','siegel'],['Mindestens haltbar bis','mhd'],['Weitere Angaben','sonstiges']]},
 fisch:{name:'Fisch & Meeresfrüchte',note:'Dieser Betrieb hat den Fisch zuletzt verarbeitet oder verpackt. Wo und wie er gefangen oder gezüchtet wurde, steht in den Pflichtangaben auf dem Etikett.',
  f:[['Fischart','tierart'],['Produkt','produkt'],['Gefangen / gezüchtet','erzeugung'],['Fanggebiet','fanggebiet'],['Fanggerät','fanggeraet'],['Herkunftsland','herkunft'],['Bio-Kontrollnummer','bio'],['Siegel','siegel'],['Verbrauchen bis','mhd'],['Weitere Angaben','sonstiges']]},
 sonstiges:{name:'Lebensmittel tierischen Ursprungs',note:'Dieser Betrieb hat das Produkt zuletzt hergestellt, verarbeitet oder verpackt. Er ist nicht unbedingt der Erzeuger der Rohstoffe.',
  f:[['Produkt','produkt'],['Hersteller / Marke','hersteller'],['Herkunft','herkunft'],['Bio-Kontrollnummer','bio'],['Siegel','siegel'],['Haltbar bis','mhd'],['Weitere Angaben','sonstiges']]}
};
