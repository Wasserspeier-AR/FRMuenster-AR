import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

import floorPlanImg from "../assets/Grundriss_ausgerichtet.png";
import * as CONFIG from "./config.js";

let map = null,
  userMarker = null,
  geoWatchId = null;

// Leaflet's default marker icon paths break under bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow
});

export async function init() {
  if (map) return map;

  map = L.map("map", {
    maxBounds: L.latLngBounds(...CONFIG.panBounds),
    maxBoundsViscosity: CONFIG.maxBoundsViscosity
  }).setView(CONFIG.mapCenter, 18);

  const basemapUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
  const attribution =
    "© <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors, ";
  if (!import.meta.env.DEV) {
    // Alternative CARTO basemaps: https://carto.com/basemaps/#styles
    basemapUrl =
      "https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png?key=cb1_3n05_1_ec8829c0a380ba86e1af803d";
    attribution += "© <a href='https://carto.com/attribution/'>CARTO</a>";
  }

  L.tileLayer(basemapUrl, {
    attribution: attribution,
    minZoom: 18,
    maxZoom: 20
  }).addTo(map);

  const imageOverlayLayer = L.layerGroup().addTo(map);
  L.imageOverlay(floorPlanImg, CONFIG.floorplanBounds, {
    opacity: 0.85
  }).addTo(imageOverlayLayer);

  CONFIG.yaml
    .filter(
      (entry) => entry.coordinates[0] !== null && entry.coordinates[1] !== null
    )
    .forEach((entry) => {
      L.marker(entry.coordinates, { opacity: 0.75 })
        .addTo(map)
        .bindPopup(entry.name);
    });
  _startLiveLocation();

  return map;
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
