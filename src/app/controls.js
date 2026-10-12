import * as THREE from "three";

const rotateSpeed = 0.01; // Radians per pixel dragged
const maxTilt = Math.PI / 2;
const scale = { min: 0.2, max: 5 };

let currentRecord = null;
let paused = false;
let targetVisible = false;
let scene = null;
let onTrackingChange = () => {};

export function onChange(cb) {
  onTrackingChange = cb;
}

export function init({ mThree, anchors }) {
  scene = mThree.scene;
  bindAnchors(anchors);
  bindGestures(mThree.renderer.domElement);
}

export function pauseTracking() {
  if (paused || !currentRecord || !targetVisible) return;
  paused = true;
  scene.attach(currentRecord.pivot);
  onTrackingChange();
}
export function unpauseTracking() {
  if (!paused) return;
  paused = false;
  currentRecord.anchor.group.attach(currentRecord.pivot);
  onTrackingChange();
}
export function getCurrentTarget() {
  return currentRecord?.id ?? null;
}
export function isPaused() {
  return paused;
}
export function isTargetVisible() {
  return targetVisible;
}

function bindAnchors(anchors) {
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
}

function touchDistance([a, b]) {
  return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
}

function bindGestures(el) {
  let last = null;
  let lastDist = null;

  // Resume single-finger tracking cleanly when lifting only one finger
  const syncGesture = (touches) => {
    last =
      touches.length === 1
        ? { x: touches[0].clientX, y: touches[0].clientY }
        : null;
    lastDist = touches.length === 2 ? touchDistance(touches) : null;
  };

  const onTouchChange = (e) => syncGesture(e.touches);
  el.addEventListener("touchstart", onTouchChange, { passive: true });
  el.addEventListener("touchend", onTouchChange, { passive: true });
  el.addEventListener("touchcancel", onTouchChange, { passive: true });

  el.addEventListener(
    "touchmove",
    (e) => {
      const pivot = getActivePivot();
      if (!pivot) return;
      const { touches } = e;

      if (touches.length === 1 && last !== null) {
        const x = touches[0].clientX;
        const y = touches[0].clientY;
        pivot.rotation.y += (x - last.x) * rotateSpeed;
        pivot.rotation.x = THREE.MathUtils.clamp(
          pivot.rotation.x + (y - last.y) * rotateSpeed,
          -maxTilt,
          maxTilt
        );
        last = { x, y };
      } else if (touches.length === 2 && lastDist !== null) {
        const dist = touchDistance(touches);
        pivot.scale.multiplyScalar(dist / lastDist);
        pivot.scale.clampScalar(scale.min, scale.max);
        lastDist = dist;
      }
    },
    { passive: true }
  );
}

function getActivePivot() {
  return currentRecord && (paused || targetVisible)
    ? currentRecord.pivot
    : null;
}
