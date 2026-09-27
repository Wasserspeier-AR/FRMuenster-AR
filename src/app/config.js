import * as y from "js-yaml";
import configRaw from "../../CONFIG.yaml?raw";
import L from "leaflet";

export const yaml = y.load(configRaw).filter((m) => m.enabled);
// TODO: add markertargets to config

export const mapCenter = [47.995437, 7.85285];
export const panBounds = L.latLngBounds(
  [47.993437, 7.84985], // SW corner
  [47.997437, 7.85585] // NE corner
);
export const maxBoundsViscosity = 0.8
export const floorplanBounds = [
  [47.995067, 7.851915], // SW corner
  [47.99606, 7.853915] // NE corner
];
export const targetSrc = `${import.meta.env.BASE_URL}mind_ar/targets.mind`;
export const base = import.meta.env.BASE_URL;
