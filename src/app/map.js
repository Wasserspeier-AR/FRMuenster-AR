import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { icon } from "@fortawesome/fontawesome-svg-core";
import {
  faLocationCrosshairs,
  faLocationDot
} from "@fortawesome/free-solid-svg-icons";

import { tl } from "../i18n.js";
import outlineAvif from "../assets/Outline_orientated.avif";
import outlinePng from "../assets/Outline_orientated.png";
import * as CONF from "./config.js";

let map = null;
let locator = null;
let onSelect = () => {};

const shape = { h: 28, w: 28 };
shape.w = (faLocationDot.icon[0] / faLocationDot.icon[1]) * shape.h;

const targetIcon = L.divIcon({
  className: "target-marker",
  html: icon(faLocationDot).html[0],
  iconSize: [shape.w, shape.h],
  iconAnchor: [shape.w / 2, shape.h], // Bottom-center -> pin tip
  popupAnchor: [0, -shape.h]
});

const LocateControl = L.Control.extend({
  options: { position: "bottomright", locator: null },

  onAdd() {
    const { locator } = this.options;
    const container = L.DomUtil.create("div", "leaflet-bar leaflet-control");
    const btn = L.DomUtil.create("a", "locate-toggle", container);
    btn.href = "#";
    btn.title = tl("app.map.locate");
    btn.setAttribute("role", "button");
    btn.setAttribute("aria-label", btn.title);
    btn.setAttribute("aria-pressed", "false");
    btn.setAttribute(
      "data-i18n-attr",
      "title:app.map.locate; aria-label:app.map.locate"
    );
    btn.setAttribute("i18n", "app.map.locate");
    btn.replaceChildren(icon(faLocationCrosshairs).node[0]);

    L.DomEvent.disableClickPropagation(container);
    L.DomEvent.on(btn, "click", (e) => {
      L.DomEvent.preventDefault(e);
      locator.toggle();
    });

    locator.onChange((active) => {
      btn.classList.toggle("active", active);
      btn.setAttribute("aria-pressed", String(active));
    });

    return container;
  }
});

export function onMarkerSelect(cb) {
  onSelect = cb;
}

export function init() {
  if (map) return map;

  map = L.map("map", {
    maxBounds: L.latLngBounds(...CONF.map.pan_bounds),
    maxBoundsViscosity: 0.8
  }).setView(CONF.map.center, CONF.map.zoom.initial);

  const dev = import.meta.env.DEV;
  L.tileLayer(dev ? CONF.map.osm_basemap : CONF.map.basemap, {
    attribution: dev ? CONF.map.osm_attribution : CONF.map.attribution,
    minZoom: CONF.map.zoom.min,
    maxZoom: CONF.map.zoom.max
  }).addTo(map);

  L.imageOverlay(outlineAvif, CONF.map.outline_bounds, {
    opacity: 0.85,
    errorOverlayUrl: outlinePng
  }).addTo(map);

  const hasCoords = ({ coordinates: [lat, lng] = [] }) =>
    lat != null && lng != null;
  CONF.targetList.filter(hasCoords).forEach((t) => {
    L.marker(t.coordinates, { icon: targetIcon, opacity: 0.75 })
      .addTo(map)
      .bindPopup(() => buildPopup(t.id), { closeButton: false });
  });

  locator = createLocator(map);
  new LocateControl({ locator }).addTo(map);

  return map;
}

export function refresh() {
  if (!map) return;
  map.invalidateSize();
  map.setView(CONF.map.center, map.getZoom(), { animate: false });
}

function buildPopup(id) {
  const btn = L.DomUtil.create("button", "marker-popup");
  btn.type = "button";
  btn.textContent = tl(`app.info.title.${id}`);
  L.DomEvent.on(btn, "click", () => {
    map.closePopup();
    onSelect(id);
  });
  return btn;
}

export const pauseLocation = () => locator?.pause();
export const resumeLocation = () => locator?.resume();

function createLocator(map) {
  let watchId = null;
  let marker = null;
  let wanted = false; // User toggled it on
  let notify = () => {};

  function start() {
    if (watchId !== null) return true;
    if (!navigator.geolocation) return false;

    let firstFix = true;
    watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const latlng = [pos.coords.latitude, pos.coords.longitude];
        if (marker) marker.setLatLng(latlng);
        else
          marker = L.circleMarker(latlng, {
            radius: 8,
            color: "#1d4ed8",
            fillColor: "#3b82f6",
            fillOpacity: 0.9
          }).addTo(map);

        // Pan to the user once, if they're inside the allowed area
        if (firstFix && map.options.maxBounds.contains(latlng)) {
          map.panTo(latlng);
        }
        firstFix = false;
      },
      (err) => {
        console.warn("Geolocation unavailable:", err.message);
        setWanted(false);
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );
    return true;
  }

  function stop() {
    if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    watchId = null;
    marker?.remove();
    marker = null;
  }

  function setWanted(value) {
    wanted = value && start();
    if (!wanted) stop();
    notify(wanted);
  }

  return {
    toggle: () => setWanted(!wanted),
    pause: stop,
    resume: () => {
      if (wanted) start();
    },
    onChange: (cb) => {
      notify = cb;
    }
  };
}
