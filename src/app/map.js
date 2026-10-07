import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { icon } from "@fortawesome/fontawesome-svg-core";
import {
  faLocationCrosshairs,
  faLocationDot
} from "@fortawesome/free-solid-svg-icons";

import { t } from "../i18n.js";
import outlineImg from "../assets/Outline_orientated.avif";
import * as CONF from "./config.js";

const marker_style = {
  radius: 8,
  color: "#1d4ed8",
  fillColor: "#3b82f6",
  fillOpacity: 0.9
};
const h = 28;
const w = (faLocationDot.icon[0] / faLocationDot.icon[1]) * h;
const targetIcon = L.divIcon({
  className: "target-marker",
  html: icon(faLocationDot).html[0],
  iconSize: [w, h],
  iconAnchor: [w / 2 + 5, h], // Bottom-center -> pin tip
  popupAnchor: [0, -h]
});
const LocateControl = L.Control.extend({
  options: { position: "bottomright" },

  onAdd() {
    const container = L.DomUtil.create("div", "leaflet-bar leaflet-control");
    const button = L.DomUtil.create("a", "locate-toggle", container);
    button.href = "#";
    button.title = "Meinen Standort anzeigen";
    button.setAttribute("role", "button");
    button.setAttribute("aria-label", button.title);
    button.setAttribute("aria-pressed", "false");
    button.replaceChildren(icon(faLocationCrosshairs).node[0]);

    L.DomEvent.disableClickPropagation(container);
    L.DomEvent.on(button, "click", (e) => {
      L.DomEvent.preventDefault(e);
      this.toggle();
    });

    this._button = button;
    return container;
  },

  toggle() {
    if (locateWanted) {
      stopLiveLocation();
      locateWanted = false;
    } else {
      locateWanted = startLiveLocation(); // false if unsupported
    }
    this.setActive(locateWanted);
  },

  setActive(active) {
    this._button.classList.toggle("active", active);
    this._button.setAttribute("aria-pressed", String(active));
  }
});

let map = null;
let locateControl = null;
let userMarker = null;
let geoWatchId = null;
let locateWanted = false;
let onSelect = () => {};

export function onMarkerSelect(cb) {
  onSelect = cb;
}

export async function init() {
  if (map) return map;

  map = createMap();
  addBasemap(map);
  addOutlineOverlay(map);
  addTargetMarkers(map);
  locateControl = new LocateControl().addTo(map);

  return map;
}

export function refresh() {
  if (!map) return;
  map.invalidateSize();
  map.setView(CONF.map.center, map.getZoom(), { animate: false });
}

export function pauseLocation() {
  stopLiveLocation();
}

export function resumeLocation() {
  if (locateWanted) startLiveLocation();
}

function createMap() {
  return L.map("map", {
    maxBounds: L.latLngBounds(...CONF.map.pan_bounds),
    maxBoundsViscosity: 0.8
  }).setView(CONF.map.center, CONF.map.zoom.initial);
}

function addBasemap(map) {
  L.tileLayer(CONF.devEnv ? CONF.map.osm_basemap : CONF.map.basemap, {
    attribution: CONF.devEnv ? CONF.map.osm_attribution : CONF.map.attribution,
    minZoom: CONF.map.zoom.min,
    maxZoom: CONF.map.zoom.max
  }).addTo(map);
}

function addOutlineOverlay(map) {
  const layer = L.layerGroup().addTo(map);
  L.imageOverlay(outlineImg, CONF.map.outline_bounds, {
    opacity: 0.85
  }).addTo(layer);
}

function addTargetMarkers(map) {
  CONF.targetList
    .filter(
      (entry) =>
        entry.coordinates?.[0] != null && entry.coordinates?.[1] != null
    )
    .forEach((entry) => {
      L.marker(entry.coordinates, { icon: targetIcon, opacity: 0.75 })
        .addTo(map)
        .bindPopup(() => buildPopup(entry.id), { closeButton: false });
    });
}

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
      const latlng = [pos.coords.latitude, pos.coords.longitude];
      updateUserMarker(latlng);

      // Pan to the user once, if they're inside the allowed area
      if (firstFix && map.options.maxBounds.contains(latlng)) map.panTo(latlng);
      firstFix = false;
    },
    (err) => {
      console.warn("Geolocation unavailable:", err.message);
      locateWanted = false;
      stopLiveLocation();
      locateControl?.setActive(false);
    },
    {
      enableHighAccuracy: true,
      maximumAge: 5000,
      timeout: 10000
    }
  );
  return true;
}

function stopLiveLocation() {
  if (geoWatchId !== null) navigator.geolocation.clearWatch(geoWatchId);
  geoWatchId = null;
  userMarker?.remove();
  userMarker = null;
}

function updateUserMarker(latlng) {
  if (userMarker) {
    userMarker.setLatLng(latlng);
  } else {
    userMarker = L.circleMarker(latlng, marker_style).addTo(map);
  }
}
