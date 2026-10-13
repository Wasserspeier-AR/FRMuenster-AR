# Münster AR

🌐 [**Website**](https://wasserspeier-ar.github.io/FRMuenster-AR)

> [!NOTE]
> Deutsche version in [README.md](README.md).


**A Gargoyle Rarely Comes Alone** is a WebAR application for interactively exploring the gargoyles of [Freiburg Cathedral](https://www.freiburgermuenster.info). Using a smartphone camera, the gargoyles are brought to life on-site in augmented reality. This allows users to learn more about their history and unique features.

The [first prototype](https://hannguyen10.github.io/AR_FR_Muenster/homepage.html) of the application was developed as part of a bachelor’s thesis in collaboration with the Freiburg Cathedral Building Association. The project was subsequently further developed and expanded as part of a student assistant project.

## Features

- Explore the Freiburg Minster in augmented reality
- Scan a section of the wall beneath a gargoyle
- Interact with its 3D scan
- Get background information
- Find your way around using the map

## Maintenance and Adjustment

For instructions on how to maintain the app, visit the [Wiki](https://github.com/Wasserspeier-AR/FRMuenster-AR/wiki) (German only).

## Local Development

The project is designed as a static web application that is intended to be maintained with minimal effort and as few external dependencies as possible.

### Installation

#### Prerequisites

- [Node.js](https://nodejs.org/) 26 or later
- [npm](https://npmjs.com/) or an equivalent Node package manager
- A modern web browser with support for WebAR and WASM
- A device with a camera and location services (optional)

```sh
npm install
```

### Usage

```sh
npm run dev
```

Open the _Network_ link in the output on your mobile device.

> [!NOTE]
> The development server is started in HTTPS mode for the AR feature, but no valid certificate is used here. As a result, the browser usually displays a warning (“This connection is not secure”) and blocks the direct connection. Bypass this warning by clicking or tapping “Continue to this site.”

### Mobile Debugging

- [Chromium-basiert](https://developer.chrome.com/docs/devtools/remote-debugging)
- [Firefox-basiert](https://firefox-source-docs.mozilla.org/devtools-user/about_colon_debugging/index.html)

### Deployment

```sh
npm run build # Also copies the latest NOTICE.md file locally to the repo
git add --all
git commit -m "Change"
git push
```

The site is automatically deployed to GitHub Pages.

### Project Structure

```
.
├── public
│   ├── models
│   └── targets
└── src
    ├── app
    ├── assets
    │   ├── content
    │   └── logos
    └── locales
```

For more Information see [Projektstruktur](https://github.com/Wasserspeier-AR/FRMuenster-AR/wiki/Projektstruktur).

### Projects Used

|                                                  |                                                        |
| ------------------------------------------------ | -------------------------------------------------------|
| AR Backend                                       | [MindAR](https://github.com/hiukim/mind-ar-js)         |
| Build Tool                                       | [Vite (Vanilla JS)](https://vite.dev/)                 |
| Graphics                                         | [Three.js](https://threejs.org/)                       |
| Icons                                            | [Font Awesome](https://fontawesome.com/)               |
| Configuration                                    | [smol-toml](https://github.com/squirrelchat/smol-toml) |
| [OSM](https://www.openstreetmap.org) Integration | [Leaflet](https://leafletjs.com/)                      |
| OSM Basemap                                      | [CARTO](https://carto.com/basemaps/)                   |
| Styling                                          | [Tailwind.css](https://tailwindcss.com/)               |

## Authors

### Development

> Bao Han Nguyen\
> Jérôme Kochenburger

### Creation of 3D models of the gargoyles

> Moreli Andrea Paredes Gonzalez

### Project Management

[Furtwangen University](https://www.hs-furtwangen.de/):

> Prof. Dr. Uwe Hahne

[Freiburger Münsterbauverein (Building Association)](https://www.freiburgermuenster.info):

> Lena Hipp

## Funding

The project was funded by [BBBank](https://www.bbbank.de) and the [Archbishop Hermann Foundation](https://katholische-stiftungen-freiburg.de/stiftungen/erzbischof-hermann-stiftung/).

## License

This project’s software is licensed under the terms specified in [LICENSE](LICENSE).

Assets in the directories specified in [LICENSE-media](LICENSE-media) are licensed under the [Creative Commons Attribution-ShareAlike 4.0 International License (CC BY-SA 4.0)](https://creativecommons.org/licenses/by-sa/4.0/), except for the assets explicitly excluded therein.

Parts of this project are based on external dependencies. See [NOTICE.md](NOTICE.md) for information about their licenses and attributions.

The names and logos of BBBank, the Archbishop Hermann Foundation, Furtwangen University, and Freiburg Minster are marks or registered trademarks of their respective owners. Their use may be subject to separate trademark and other legal restrictions. This license does not grant permission to use these marks or logos.
