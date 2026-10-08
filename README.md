# Münster AR

🌐 [**Webseite**](https://wasserspeier-ar.github.io/FRMuenster-AR)

> [!NOTE]
> For an English version reference [README_en.md](README_en.md). **!TODO: DATEI ERSTELLEN**

**!TODO: EINFÜHRUNGSTEXT ÜBERARBEITEN**

Im Rahmen einer Bachelorarbeit wurde [ein WebAR-Protyp](https://hannguyen10.github.io/AR_FR_Muenster/homepage.html) zur Erkundung der Wasserspeier des [Freiburger Münsters](https://www.freiburgermuenster.info) entwickelt.

Im Rahmen eines HiWi-Projektes wurde die Anwendung in Zusammenarbeit mit dem Freiburger Münsterbauverein weiter ausgearbeitet.

## Features

- Erkunde das Freiburger Münster in Augmented Reality
- Scanne eine Mauersektion unter einem Wasserspeier
- Interagiere mit seinem 3D-Scan
- Erhalte Hintergrundinformationen
- Orientiere dich anhand der Karte

## Pflege und Anpassung

Für Instruktionen zur Pflege der App besuche das [Wiki](). **!TODO: LINK EINFÜGEN**

## Lokale Entwicklung

Das Projekt ist als statische Webanwendung konzipiert, die mit minimalen externen Abhängigkeiten möglichst aufwandsarm unterhalten werden soll.

### Installation

#### Voraussetzungen

- [Node.js](https://nodejs.org/) 26 oder neuer
- [npm](https://npmjs.com/) oder äquivalenter Node Package Manager
- Ein moderner Webbrowser mit Unterstützung für WebAR und WASM
- Ein Endgerät mit Kamera und Standortdienst (optional)

```sh
npm install
```

### Verwendung

```sh
npm run dev
```

Öffne den _Network_-Link in der Ausgabe auf deinem Mobile-Gerät.

> [!NOTE]
> Der Entwicklungs-Server wird für die AR-Funktion im HTTPS-Modus gestartet, allerdings wird hier kein gültiges Zertifikat verwendet. Der Browser gibt daher meist ein Warnung aus ("Diese Verbindung ist nicht sicher") und blockiert die direkte Verbindung. Umgehe diese Warnung durch klicken/tippen auf "Zur Seite fortfahren".

### Mobile-Debugging

- [Chromium-basiert](https://developer.chrome.com/docs/devtools/remote-debugging)
- [Firefox-basiert](https://firefox-source-docs.mozilla.org/devtools-user/about_colon_debugging/index.html)

### Deployment

```sh
npm run build # Kopiert zusätzlich lokal die aktuellste NOTICE.md ins Repo
git add --all
git commit -m "Change"
git push
```

Die Seite wird automatisch auf Github Pages bereitgestellt.

### Projektstruktur

**!TODO: AKTUELLE STRUKTUR HINZUFÜGEN̶̶**

```

```

### Verwendete Projekte

|                                                  |                                                        |
| ------------------------------------------------ | ------------------------------------------------------ |
| AR-Backend                                       | [MindAR](https://github.com/hiukim/mind-ar-js)         |
| Build Tool                                       | [Vite](https://vite.dev/)                              |
| Grafik                                           | [Three.js](https://threejs.org/)                       |
| Icons                                            | [Font Awesome](https://fontawesome.com/)               |
| Konfiguration                                    | [smol-toml](https://github.com/squirrelchat/smol-toml) |
| [OSM](https://www.openstreetmap.org) Integration | [Leaflet](https://leafletjs.com/)                      |
| OSM Basemap                                      | [CARTO](https://carto.com/basemaps/)                   |
| Styling                                          | [Tailwind.css](https://tailwindcss.com/)               |

## Autor*innen

### Entwicklung

> Bao Han Nguyen\
> Jérôme Kochenburger

### Erstellung der Wasserspeier 3D-Modelle

> Moreli Andrea Paredes Gonzalez

### Projektbetreuung

[Hochschule Furtwangen](https://www.hs-furtwangen.de/):

> Prof. Dr. Uwe Hahne

[Freiburger Münsterbauverein](https://www.freiburgermuenster.info):

> Lena Hipp

## Förderung

Das Projekt wurde gefördert von der [BBBank](https://www.bbbank.de) und der [Erzbischof Hermann Stiftung](https://katholische-stiftungen-freiburg.de/stiftungen/erzbischof-hermann-stiftung/).

## Lizenz

Dieses Projekt ist [LIZENZNAME](LICENSE) lizenziert. **!TODO: LIZENZNAME EINFÜGEN**

Teile des Projektes basieren auf externen Abhängigkeiten. Siehe [NOTICE.md](NOTICE.md) für deren Lizenzen.

Die Namen und Logos der BBBank, der Erzbischof Hermann Stiftung, der Hochschule Furtwangen und des Freiburger Münsters sind Marken bzw. geschützte Kennzeichen ihrer jeweiligen Inhaber. Ihre Nutzung bedarf der vorherigen schriftlichen Zustimmung der jeweiligen Rechteinhaber. Eine unbefugte Nutzung, Vervielfältigung, Bearbeitung oder Darstellung der Marken ist nicht gestattet.
