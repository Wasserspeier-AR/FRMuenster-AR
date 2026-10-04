import L from "leaflet";
import "leaflet/dist/leaflet.css";

import { t } from "../i18n.js";
import outlineImg from "../assets/Grundriss_ausgerichtet.png";
import * as CONFIG from "./config.js";

const dev = import.meta.env.DEV;
let map = null;
let userMarker = null;
let geoWatchId = null;
let locateControl = null;
let locateWanted = false;

const targetIcon = L.divIcon({
  className: "target-marker",
  html: '<i class="fa-solid fa-location-dot" aria-hidden="true"></i>',
  iconSize: [28, 28],
  iconAnchor: [10.5, 28], // Bottom-center -> pin tip
  popupAnchor: [0, -28]
});

let onSelect = () => {};
export function onMarkerSelect(cb) {
  onSelect = cb;
}

export async function init() {
  if (map) return map;

  map = L.map("map", {
    maxBounds: L.latLngBounds(...CONFIG.map.pan_bounds),
    maxBoundsViscosity: 0.8
  }).setView(CONFIG.map.center, 18);

  L.tileLayer(dev ? CONFIG.map.osm_basemap : CONFIG.map.basemap, {
    attribution: dev ? CONFIG.map.osm_attribution : CONFIG.map.attribution,
    minZoom: 18,
    maxZoom: 20
  }).addTo(map);

  const imageOverlayLayer = L.layerGroup().addTo(map);
  L.imageOverlay(outlineImg, CONFIG.map.outline_bounds, {
    opacity: 0.85
  }).addTo(imageOverlayLayer);

  CONFIG.targetList
    .filter((e) => e.coordinates?.[0] != null && e.coordinates?.[1] != null)
    .forEach((entry) => {
      L.marker(entry.coordinates, { icon: targetIcon, opacity: 0.75 })
        .addTo(map)
        .bindPopup(() => buildPopup(entry.id), { closeButton: false });
    });

  locateControl = new LocateControl().addTo(map);

  return map;
}

export function refresh() {
  if (!map) return;
  map.invalidateSize();
  map.setView(CONFIG.map.center, map.getZoom(), { animate: false });
}

const LocateControl = L.Control.extend({
  options: { position: "bottomright" },

  onAdd() {
    const container = L.DomUtil.create("div", "leaflet-bar leaflet-control");
    const button = L.DomUtil.create("a", "locate-toggle", container);
    button.href = "#";
    button.role = "button";
    button.title = "Meinen Standort anzeigen";
    button.setAttribute("aria-label", button.title);
    button.setAttribute("aria-pressed", "false");
    button.innerHTML = '<i class="fa-solid fa-location-crosshairs"></i>';

    L.DomEvent.disableClickPropagation(container);
    L.DomEvent.on(button, "click", (e) => {
      L.DomEvent.preventDefault(e);
      locateWanted = !locateWanted;
      if (locateWanted) {
        locateWanted = startLiveLocation(); // false if unsupported
      } else {
        stopLiveLocation();
      }
      this.setActive(locateWanted);
    });

    this._button = button;
    return container;
  },

  setActive(active) {
    this._button.classList.toggle("active", active);
    this._button.setAttribute("aria-pressed", String(active));
  }
});

function buildPopup(id) {
  const btn = L.DomUtil.create("button", "marker-popup");
  btn.type = "button";
  btn.textContent = t(`app.info.title.${id}`);
  L.DomEvent.on(btn, "click", () => {
    map.closePopup();
    onSelect(id);
  });
  return btn;
}

function startLiveLocation() {
  if (!navigator.geolocation || geoWatchId !== null) return false;

  let firstFix = true;
  geoWatchId = navigator.geolocation.watchPosition(
    (pos) => {
      const { latitude, longitude } = pos.coords;
      const latlng = [latitude, longitude];

      if (!userMarker) {
        userMarker = L.circleMarker(latlng, {
          radius: 8,
          color: "#1d4ed8",
          fillColor: "#3b82f6",
          fillOpacity: 0.9
        }).addTo(map);
      } else {
        userMarker.setLatLng(latlng);
      }

      // Pan to the user once, if they're inside the allowed area
      if (firstFix && map.options.maxBounds.contains(latlng)) {
        map.panTo(latlng);
      }
      firstFix = false;
    },
    (err) => {
      console.warn("Geolocation unavailable:", err.message);
      locateWanted = false;
      stopLiveLocation();
      locateControl?.setActive(false);
    },
    { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
  );
  return true;
}

export function pauseLocation() {
  stopLiveLocation();
}

export function resumeLocation() {
  if (locateWanted) startLiveLocation();
}

function stopLiveLocation() {
  if (geoWatchId !== null) navigator.geolocation.clearWatch(geoWatchId);
  geoWatchId = null;
  userMarker?.remove();
  userMarker = null;
  return false;
}
