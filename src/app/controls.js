import { bindGestures } from "./gestures.js";

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

  bindGestures(mThree.renderer.domElement, () =>
    currentRecord && (paused || targetVisible) ? currentRecord.pivot : null
  );
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

export const getCurrentTarget = () => currentRecord?.id ?? null;
export const isPaused = () => paused;
export const isTargetVisible = () => targetVisible;
