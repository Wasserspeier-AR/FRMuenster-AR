# Ein Wasserspeier kommt selten allein
Im Rahmen einer Bachelorarbeit wurde [ein WebAR-Protyp](https://hannguyen10.github.io/AR_FR_Muenster/homepage.html) zur Erkundung der Wasserspeier des Freiburger Münsters entwickelt.

Im Rahmen eines HiWi-Projektes wurde die Anwendung in Zusammenarbeit mit dem Freiburger Münsterbauverein weiter ausgearbeitet.
Diese ist über diesen Link zugänglich: 

<https://wasserspeier-ar.github.io/FRMuenster-AR/>

Gefördert wurde das Projekt von der [BBBank](https://www.bbbank.de) und der [Erzbischof Hermann Stiftung](https://katholische-stiftungen-freiburg.de/stiftungen/erzbischof-hermann-stiftung/).

### Entwicklung der WebAR-Anwendung

Bao Han Nguyen<br/>
Jérôme Kochenburger

### Erstellung der Wasserspeier 3D-Modelle

Moreli Andrea Paredes Gonzalez

### Projektbetreuung

Hochschule Furtwangen:<br/>
Prof. Dr. Uwe Hahne

Freiburger Münsterbauverein:<br/>
Lena Hipp


## Pflege / Anpassung

Individuelle Wasserspeier können über die Datei `CONFIG.yaml` konfiguriert werden. 

Manche Wasserspeier sind nicht immer zugänglich. Um Frust zu vermeiden, sollten diese für die Dauer der Unzugänglichkeit auf der Karte deaktiviert werden.

Um einen Wasserspeier ein- oder auszuschalten, stelle im jeweiligen Abschnitt den Eintrag `enabled` auf `true`/`false`.

### Hinzufügen von Targets

Sollte sich die Anzahl der Wasserspeier grundlegend ändern (etwa durch einscannen weiterer), müssen die Targets in **einer Datei** [neu kompiliert](https://hiukim.github.io/mind-ar-js-doc/tools/compile) werden. Die resultierende `.mind`-Datei muss in `public/mind_ar/` hinterlegt werden.

## Entwicklung

Das Projekt ist als statische Webanwendung konzipiert, die mit minimalen externen Abhängigkeiten möglichst aufwandsarm unterhalten werden soll.

## Abhängigkeiten

- AR-Backend: [MindAR](https://github.com/hiukim/mind-ar-js)
- Grafik: [Three.js](https://threejs.org/)
- Build Tool & Bundler: [Vite](https://vite.dev/)
- Styling: [Tailwind.css](https://tailwindcss.com/)
- [OpenStreetmap](https://www.openstreetmap.org) Integration: [Leaflet](https://leafletjs.com/)
- Vereinfachte Konfiguration: [js-yaml](https://www.npmjs.com/package/js-yaml)

## Projektstruktur

```toml
# Einige Dateien wurden für bessere Übersicht weggelassen
├── public/
│   ├── mind_ar/
│   │   └── WS_all_Marker2.mind  # Image Targets
│   └── models/                  # 3D-Modelle
├── scripts
│   └── image_augmentations.py   # Script für Modell-Training
├── src
│   ├── assets/
│   ├── locales/                 # Übersetzungen
│   │   ├── de.json
│   │   └── en.json
│   ├── app.js                   # AR-Anwendung (Script)
│   ├── experimental-features.js # Experimentelle Shader; nicht genutzt
│   ├── i18n.js                  # Übersetzungslogik
│   ├── main.js
│   ├── style.css
│   └── style.js
├── vite.config.js
├── app.html                     # AR-Anwendung
├── CONFIG.yaml                  # Konfiguration der Wasserspeier
├── impressum.html               # Impressum
├── index.html                   # Startseite
├── node_modules
├── package.json
├── package-lock.json
└── README.md
```

## Schnellstart

1. Klone dieses Repository und gehe ins Stammverzeichnis
2. `npm install` ausführen
3. `npm run dev` ausführen und dem Link in der Ausgabe folgen

> Anmerkung: Der Entwicklungs-Server wird für die AR-Funktion im HTTPS-Modus gestartet, allerdings wird kein gültiges Zertifikat verwendet. Die Seite wird damit als "unsicher" angezeigt. Einfach auf "Zur Seite fortfahren" drücken.
