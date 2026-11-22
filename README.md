# Etikett entschlüsseln

Web-App, die Herkunftskennzeichen auf Lebensmitteletiketten verständlich erklärt.
Kamera auf das Etikett halten, die App findet das ovale EU-Identitätskennzeichen
(z. B. `DE BY 10234 EG`, `ES 10.04321/M CE`) oder den Eier-Erzeugercode
(z. B. `1-DE-0512345`) und zerlegt ihn in seine Bestandteile.

- **Live-Scan** mit der Rückkamera, Texterkennung (Tesseract.js, Deutsch + Englisch)
  etwa einmal pro Sekunde im ovalen Rahmen. Bei einem Treffer pausiert die Kamera.
- **Foto hochladen** und **manuelle Eingabe** als Alternative.
- Erklärung je Produktart (Fleisch, Milch, Eier, Fisch, sonstiges), Links zu BVL,
  Open Food Facts und was-steht-auf-dem-ei.de, Verlauf der letzten Codes.
- **Datenschutz:** Die Texterkennung läuft vollständig im Browser. Es werden keine
  Bilder hochgeladen; Tesseract.js und die Sprachdaten werden von der eigenen Seite
  geladen, nicht von einem CDN.
- **PWA:** installierbar, offline nutzbar. Die Texterkennung (ca. 4 MB Programm +
  4 MB Sprachdaten) wird beim ersten Scan geladen und danach zwischengespeichert.

## Lokal starten

Voraussetzung: Node.js 20 oder neuer.

```bash
npm install
npm start          # baut nach dist/ und startet http://localhost:8080
npm test           # Tests (node:test)
```

Die Kamera funktioniert nur über HTTPS oder `localhost`. Zum Testen auf dem Handy
im selben WLAN also entweder die GitHub-Pages-Version nutzen oder einen HTTPS-Tunnel.

## Projektstruktur

```
index.html              Oberfläche und Styles
src/app.js              Darstellung, Verlauf, Live-Scanner, Foto-Upload
src/parser.js           parse(), parseEgg(), guessKat(), findCode() – ohne DOM, getestet
src/data.js             Ländercodes, Bundesländer, EU-Kürzel, Erklärtexte
src/ocr.js              Tesseract.js-Anbindung und Bildvorverarbeitung
sw.js                   Service Worker (Offline-Cache)
manifest.webmanifest    PWA-Manifest, icons/
scripts/build.mjs       baut dist/ inkl. selbst gehostetem Tesseract.js
scripts/bltu-to-json.mjs  wandelt die BVL-Betriebsliste in data/bltu.json um
test/                   Tests für Parser und BLtU-Konverter
.github/workflows/pages.yml  Tests + Veröffentlichung auf GitHub Pages
```

### Wie die Erkennung funktioniert

1. Der Bildausschnitt im ovalen Rahmen wird in Graustufen umgewandelt und im
   Kontrast gestreckt.
2. Rahmenlinien werden entfernt: Tesseract liest Text, der von einer Linie
   umschlossen ist (also genau das Oval), sonst oft gar nicht. Entfernt werden
   große, „hohle“ zusammenhängende Flächen.
3. Tesseract liest den Text, `findCode()` sucht darin im strengen Modus: Ovale
   brauchen das EU-Kürzel (EG, CE, …), deutsche Eiercodes ein gültiges Bundesland.
   Typische OCR-Verwechslungen (O/0, I/1) werden korrigiert.

## Veröffentlichen auf GitHub Pages

1. Im Repository unter **Settings → Pages → Build and deployment** als Quelle
   **GitHub Actions** auswählen (einmalig).
2. Auf `main` pushen (oder den Workflow „Tests und GitHub Pages“ manuell starten).
   Der Workflow führt die Tests aus, baut `dist/` und veröffentlicht es.
3. Die App liegt dann unter `https://<benutzer>.github.io/<repository>/`.

## Betriebsverzeichnis (optional)

Die App kann zur Zulassungsnummer Betriebsname und Ort anzeigen, wenn
`data/bltu.json` vorhanden ist. Die Datei wird aus der Liste zugelassener Betriebe
des BVL (BLtU) erzeugt:

```bash
# Liste von der BVL-Website herunterladen und als CSV speichern, dann:
npm run bltu -- data/abschnitt-I.csv data/abschnitt-VI.csv
npm run build
```

Das Skript erkennt die Spalten (Zulassungsnummer, Name, PLZ, Ort, Tätigkeit) an der
Kopfzeile und normalisiert die Nummern (z. B. `BY 10234` → `DE-BY-10234`).

**Nutzungsbedingungen noch ungeprüft.** Bevor `data/bltu.json` veröffentlicht wird,
bitte auf bvl.bund.de (Impressum / Nutzungsbedingungen) und ggf. auf GovData prüfen,
ob die Liste weiterverwendet werden darf und welche Quellenangabe nötig ist. Bis
dahin ist die Datei in `.gitignore` eingetragen und wird nicht mit veröffentlicht.

## Hinweise

- Die Texterkennung kann sich verlesen. Wichtige Angaben bitte am Etikett prüfen.
- Das ovale Kennzeichen nennt den Betrieb, der das Produkt zuletzt verarbeitet oder
  verpackt hat, nicht unbedingt den Hof.
- Tesseract.js steht unter der Apache-2.0-Lizenz; die Lizenztexte werden beim Build
  nach `dist/vendor/tesseract/` kopiert.
