import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

import * as CONFIG from "./config.js";

let anchorGroups = {};
let activePivot = null;
let paused = false;
let targetVisible = false;
let currentTarget = null;
let sceneRef = null;

let onTrackingChange = () => {};
export function onChange(cb) { onTrackingChange = cb; }

export async function init(mindARThree) {
  const { scene, renderer } = mindARThree;
  const el = renderer.domElement;
  sceneRef = scene;
  let lastX = null, lastY = null, lastDist = null;

  await loadAnchors(mindARThree);

  el.addEventListener(
    "touchstart",
    (e) => {
      if (e.touches.length === 1) {
        lastX = e.touches[0].clientX;
        lastY = e.touches[0].clientY;
      } else if (e.touches.length === 2) {
        lastDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
      }
    },
    { passive: true }
  );

  el.addEventListener(
    "touchmove",
    (e) => {
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
    },
    { passive: true }
  );

  el.addEventListener(
    "touchend",
    (e) => {
      if (e.touches.length === 0) {
        lastX = null;
        lastY = null;
        lastDist = null;
      } else if (e.touches.length === 1) {
        // Resume single-finger tracking cleanly when lifting only one finger
        lastDist = null;
        lastX = e.touches[0].clientX;
        lastY = e.touches[0].clientY;
      }
    },
    { passive: true }
  );
}

export async function addModelAnchor(index, modelURI, mT) {
  const anchor = mT.addAnchor(index);
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
    if (paused && index !== currentTarget) return; // ignore other markers while paused
    currentTarget = index;
    targetVisible = true;
    if (!paused) activePivot = pivot;
    onTrackingChange();
  };
  anchor.onTargetLost = () => {
    if (index !== currentTarget) return;
    targetVisible = false;
    if (!paused) activePivot = null;
    onTrackingChange();
  };

  return anchor;
}

export function pauseTracking() {
  if (paused || !activePivot || !targetVisible) return;
  paused = true;
  sceneRef.attach(activePivot);
  onTrackingChange();
}

export function unpauseTracking() {
  if (!paused || !targetVisible) return;
  paused = false;
  const group = anchorGroups[currentTarget];
  if (group && activePivot) group.attach(activePivot);
  onTrackingChange();
}

export function isPaused() {
  return paused;
}

export function isTargetVisible() {
  return targetVisible;
}

export function getCurrentTarget() {
  return currentTarget;
}

export function getActivePivot() {
  return activePivot;
}

export function getAnchorGroups(idx) {
  return anchorGroups[idx];
}

function loadAnchors(mT) {
  return Promise.all(
    CONFIG.targetList.map((entry) =>
      addModelAnchor(entry.id, CONFIG.targets.model_path + entry.model, mT)
    )
  );
}
