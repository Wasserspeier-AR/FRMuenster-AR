import * as THREE from "three";

let currentRecord = null;
let paused = false;
let targetVisible = false;
let sceneRef = null;

let onTrackingChange = () => {};
export function onChange(cb) {
  onTrackingChange = cb;
}

export function init({ mThree, anchors }) {
  const { scene, renderer } = mThree;
  sceneRef = scene;

  for (const record of anchors) {
    record.anchor.onTargetFound = () => {
      if (paused && record !== currentRecord) return;
      currentRecord = record;
      targetVisible = true;
      onTrackingChange();
    };
    record.anchor.onTargetLost = () => {
      if (record !== currentRecord) return;
      targetVisible = false;
      onTrackingChange();
    };
  }

  let lastX = null, lastY = null, lastDist = null;
  const el = renderer.domElement;
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
      const pivot = getGesturePivot();
      if (!pivot) return;

      if (e.touches.length === 1 && lastX !== null) {
        const dx = e.touches[0].clientX - lastX;
        const dy = e.touches[0].clientY - lastY;
        lastX = e.touches[0].clientX;
        lastY = e.touches[0].clientY;

        pivot.rotation.y += dx * 0.01;
        pivot.rotation.x = THREE.MathUtils.clamp(
          pivot.rotation.x + dy * 0.01,
          -Math.PI / 2,
          Math.PI / 2
        );
      } else if (e.touches.length === 2 && lastDist !== null) {
        const newDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        pivot.scale.multiplyScalar(newDist / lastDist);
        pivot.scale.clampScalar(0.2, 5);
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

export function pauseTracking() {
  if (paused || !currentRecord || !targetVisible || !currentRecord) return;
  paused = true;
  sceneRef.attach(currentRecord.pivot);
  onTrackingChange();
}

export function unpauseTracking() {
  if (!paused) return;
  paused = false;
  currentRecord.anchor.group.attach(currentRecord.pivot);
  onTrackingChange();
}

export function getActivePivot() { return getGesturePivot(); }
export function getCurrentTarget() { return currentRecord?.id ?? null; }
export function isPaused() { return paused; }
export function isTargetVisible() { return targetVisible; }

function getGesturePivot() {
  return currentRecord && (paused || targetVisible) ? currentRecord.pivot : null;
}
