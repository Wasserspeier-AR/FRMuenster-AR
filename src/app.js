import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MindARThree } from "mind-ar/dist/mindar-image-three.prod.js";
import { t } from "./i18n.js";

import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";


// Leaflet's default marker icon paths break under bundlers; point them
// at the bundled asset URLs instead.
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const SITE_LOCATION = [47.995437, 7.85285];
const PAN_BOUNDS = L.latLngBounds(
  [47.99, 7.8490], // southwest corner
  [47.9983, 7.8563]  // northeast corner
);

let map = null;
let userMarker = null;
let geoWatchId = null;
let imageOverlayLayer = null; // placeholder group for a future image layer





let activePivot = null;
let currentIndex = null;
const anchorGroups = {}; // index -> anchor.group
let currentAnchorIndex = null;
let isPaused = false;
let isHidden = true;

const base = import.meta.env.BASE_URL;
const models = {
  0: `${base}models/0_unicorn.glb`,
  1: `${base}models/1_man_with_book.glb`,
  2: `${base}models/2_dog.glb`,
  3: `${base}models/6_monster_dog.glb`,
  4: `${base}models/7_zanner.glb`,
  5: `${base}models/8_human_skeleton.glb`,
  6: `${base}models/9_dog_with_rabbit.glb`,
  7: `${base}models/10_griffin.glb`,
  8: `${base}models/11_fish.glb`,
  9: `${base}models/12_devilry.glb`,
  11: `${base}models/15_man_with_jug.glb`,
  12: `${base}models/16_knight.glb`
};
const mindarThree = new MindARThree({
  container: document.querySelector("#container"),
  imageTargetSrc: `${base}mind_ar/WS_all_Marker2.mind`,
  filterMinCF: 0.001,
  filterBeta: 0.001,
  warmupTolerance: 3
});
const { renderer, scene, camera } = mindarThree;
renderer.setAnimationLoop(() => {
  renderer.render(scene, camera);
});

initMindAR();
initScene();
initTouchControls();
initUI();
await Promise.all(
  Object.entries(models).map(([index, path]) =>
    addModelAnchor(Number(index), path)
  )
);


// = Functions =
async function addModelAnchor(index, modelURI) {
  const anchor = mindarThree.addAnchor(index);
  const model = (await new GLTFLoader().loadAsync(modelURI)).scene;
  const box = new THREE.Box3().setFromObject(model);

  model.position.sub(box.getCenter(new THREE.Vector3()));

  const size = new THREE.Vector3();
  box.getSize(size);
  const scale = 0.2 / Math.max(...size);
  model.scale.setScalar(scale).clampScalar(0.5, 2);

  const pivot = new THREE.Group();
  pivot.add(model);
  anchor.group.add(pivot);

  anchorGroups[index] = anchor.group;

  anchor.onTargetFound = () => {
    if (isPaused) return; // ignore tracking events while paused
    activePivot = pivot;
    currentAnchorIndex = index;
  };
  anchor.onTargetLost = () => {
    if (isPaused) return;
    activePivot = null;
  };

  return anchor;
}

function pauseTracking() {
  if (isPaused || !activePivot) return;
  isPaused = true;

  scene.attach(activePivot);
}

function unpauseTracking() {
  if (!isPaused) return;
  isPaused = false;

  const group = anchorGroups[currentAnchorIndex];
  if (group && activePivot) {
    group.attach(activePivot); // reparent back, will snap to live tracking pose
  }
}

function initTouchControls() {
  const el = renderer.domElement;
  let lastX = null, lastY = null, lastDist = null;

  el.addEventListener("touchstart", (e) => {
    if (e.touches.length === 1) {
      lastX = e.touches[0].clientX;
      lastY = e.touches[0].clientY;
    } else if (e.touches.length === 2) {
      lastDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
    }
  }, { passive: true });

  el.addEventListener("touchmove", (e) => {
    if (!activePivot) return;

    if (e.touches.length === 1 && lastX !== null) {
      const dx = e.touches[0].clientX - lastX;
      const dy = e.touches[0].clientY - lastY;
      lastX = e.touches[0].clientX;
      lastY = e.touches[0].clientY;

      activePivot.rotation.y += dx * 0.01;
      activePivot.rotation.x = THREE.MathUtils.clamp(
        activePivot.rotation.x + dy * 0.01,
        -Math.PI / 2,
        Math.PI / 2
      );
    } else if (e.touches.length === 2 && lastDist !== null) {
      const newDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      activePivot.scale.multiplyScalar(newDist / lastDist);
      activePivot.scale.clampScalar(0.2, 5);
      lastDist = newDist;
    }
  }, { passive: true });

  el.addEventListener("touchend", (e) => {
    if (e.touches.length === 0) {
      lastX = null; lastY = null; lastDist = null;
    } else if (e.touches.length === 1) {
      // Lifted one finger from pinch - resume single-finger tracking cleanly
      lastDist = null;
      lastX = e.touches[0].clientX;
      lastY = e.touches[0].clientY;
    }
  }, { passive: true });
}

function initScene() {
  const hemLight = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 0.3);
  scene.add(hemLight);

  const dirLight = new THREE.DirectionalLight(0xefdfc4, 2);
  dirLight.position.set(1, 2, 1);
  scene.add(dirLight);

  const rimLight = new THREE.DirectionalLight(0xffffff, 0.75);
  rimLight.position.set(-3, 1, -3);
  scene.add(rimLight);
}

async function initMindAR() {
  await mindarThree.start();
}

async function stop() {
  mindarThree.stop();
  renderer.setAnimationLoop(null);
}

// --- UI wiring ---
function initUI() {
  const guideButton = document.querySelector("#guide-button");
  const mapButton = document.querySelector("#map-button");
  const pauseButton = document.querySelector("#pause-button");
  const infoButton = document.querySelector("#info-button");
  const backButton = document.querySelector("#unpause-button");

  const infoWS = document.querySelector("#infoWS");
  const infoText = document.querySelector("#info-text");
  const closeBtn = infoWS.querySelector(".close");

  const mapWS = document.querySelector("#mapWS");
  const mapCloseBtn = mapWS.querySelector(".map-close");

  infoWS.style.display = "none";
  mapWS.style.display = "none";

  let infoModalOpen = false;
  let mapModalOpen = false;

  function showModal(text) {
    infoText.textContent = text;
    infoWS.style.display = "flex";
    infoModalOpen = true;
  }

  function hideModal() {
    infoWS.style.display = "none";
    infoModalOpen = false;
  }

  function showMapModal() {
    mapWS.style.display = "flex";
    mapModalOpen = true;
    initMap("map"); // lazy: builds the map once, reuses it after
    // Leaflet can't measure a display:none container, so nudge it
    // to recompute its size right after becoming visible.
    requestAnimationFrame(() => map.invalidateSize());
  }

  function hideMapModal() {
    mapWS.style.display = "none";
    mapModalOpen = false;
  }

  infoWS.addEventListener("click", (e) => {
    if (e.target === infoWS) hideModal();
  });
  closeBtn.addEventListener("click", hideModal);

  mapWS.addEventListener("click", (e) => {
    if (e.target === mapWS) hideMapModal();
  });
  mapCloseBtn.addEventListener("click", hideMapModal);

  guideButton.addEventListener("click", () => {
    infoModalOpen ? hideModal() : showModal(t("app.guide-text"));
  });

  infoButton.addEventListener("click", () => {
    infoModalOpen ? hideModal() : showModal(t(`app.info.${currentIndex}`));
  });

  mapButton.addEventListener("click", () => {
    mapModalOpen ? hideMapModal() : showMapModal();
  });

  pauseButton.addEventListener("click", () => {
    isPaused ? unpauseTracking() : pauseTracking();
  });

  backButton.addEventListener("click", () => {
    window.location.href = base;
  });
}

function initMap(containerId) {
  if (map) return map;

  map = L.map(containerId, {
      maxBounds: PAN_BOUNDS,
      maxBoundsViscosity: 0.8
    }).setView(SITE_LOCATION, 18);

  // "https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png", '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>' -> Looks better, but requires a key (free)
  // "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" --> Just works
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    minZoom: 16,
    maxZoom: 19,
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map);

  // Reserved layer for a future image overlay (floor plan, historic map, etc.)
  imageOverlayLayer = L.layerGroup().addTo(map);
  // Later:
  // const bounds = [[47.9954, 7.8524], [47.9959, 7.8529]];
  // L.imageOverlay('path/to/image.png', bounds).addTo(imageOverlayLayer);

  startLiveLocation();

  return map;
}

function startLiveLocation() {
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
          fillOpacity: 0.9,
        }).addTo(map);
      } else {
        userMarker.setLatLng(latlng);
      }
    },
    (err) => console.warn("Geolocation unavailable:", err.message),
    { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
  );
}

function stopLiveLocation() {
  if (geoWatchId !== null) {
    navigator.geolocation.clearWatch(geoWatchId);
    geoWatchId = null;
  }
}
