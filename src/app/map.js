import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

import outlineImg from "../assets/Grundriss_ausgerichtet.png";
import * as CONFIG from "./config.js";

const dev = import.meta.env.DEV;
let map = null;
let userMarker = null;
let geoWatchId = null;

// Leaflet's default marker icon paths break under bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow
});

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
    .filter(
      (entry) => entry.coordinates[0] !== null && entry.coordinates[1] !== null
    )
    .forEach((entry) => {
      L.marker(entry.coordinates, { opacity: 0.75 })
        .addTo(map)
      //.bindPopup(entry.name);
    });
  _startLiveLocation();

  return map;
}

export function refresh() {
  if (!map) return;
  map.invalidateSize();
  map.setView(CONFIG.map.center, map.getZoom(), { animate: false });
}

function _startLiveLocation() {
  if (!navigator.geolocation || geoWatchId !== null) return;

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
    },
    (err) => console.warn("Geolocation unavailable:", err.message),
    { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
  );
}
