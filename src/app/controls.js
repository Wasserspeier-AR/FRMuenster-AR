import * as THREE from "three";
import { bindGestures } from "./gestures.js";

const fill = 0.4;

let currentRecord = null;
let paused = false;
let virtual = false;
let targetVisible = false;
let scene = null;
let camera = null;
let records = [];
let onTrackingChange = () => {};

export function onChange(cb) {
  onTrackingChange = cb;
}

export function init({ mThree, anchors }) {
  scene = mThree.scene;
  camera = mThree.camera;
  records = anchors;

  for (const record of anchors) {
    record.anchor.onTargetFound = () => {
      if (paused && record !== currentRecord) return;
      currentRecord = record;
      targetVisible = true;
      onTrackingChange();
    };
    record.anchor.onTargetLost = () => {
      if (paused || record !== currentRecord) return;
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
  freezeAtSmoother(currentRecord);
  onTrackingChange();
}

export function unpauseTracking() {
  if (!paused) return;
  paused = false;
  release(currentRecord);
  if (virtual) {
    virtual = false;
    targetVisible = false;
  }
  onTrackingChange();
}

export function showModel(id) {
  const record = records.find((r) => r.id === id && r.variant === 0);
  if (!record) return false;

  if (paused) release(currentRecord);
  hideLiveModels();

  currentRecord = record;
  paused = true;
  virtual = true;
  targetVisible = true;
  freezeInFront(record);
  onTrackingChange();
  return true;
}

function hideLiveModels() {
  for (const { smoother, anchor } of records) {
    smoother.visible = false;
    anchor.group.visible = false;
    anchor.visible = false;
  }
}

function createFrozen(record) {
  const frozen = new THREE.Group();
  scene.add(frozen);
  frozen.add(record.pivot);
  record.frozen = frozen;
  return frozen;
}

function freezeAtSmoother(record) {
  const { smoother } = record;
  const frozen = createFrozen(record);
  frozen.position.copy(smoother.position);
  frozen.quaternion.copy(smoother.quaternion);
  frozen.scale.copy(smoother.scale);
}

function freezeInFront(record) {
  const { pivot } = record;
  resetPivot(pivot);
  const frozen = createFrozen(record);

  camera.updateWorldMatrix(true, false);
  const dist = Math.max(camera.near * 3, 1);
  frozen.position.copy(camera.localToWorld(new THREE.Vector3(0, 0, -dist)));
  camera.getWorldQuaternion(frozen.quaternion); // Face the camera
  frozen.scale.setScalar(1);
  frozen.updateMatrixWorld(true);

  const size = new THREE.Box3()
    .setFromObject(pivot)
    .getSize(new THREE.Vector3());
  const viewH = 2 * dist * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  frozen.scale.setScalar((viewH * fill) / Math.max(size.x, size.y, size.z));
}

function release(record) {
  const { pivot, smoother, frozen } = record;
  resetPivot(pivot);
  smoother.add(pivot);
  scene.remove(frozen);
  record.frozen = null;
}

function resetPivot(pivot) {
  pivot.position.set(0, 0, 0);
  pivot.quaternion.identity();
  pivot.scale.setScalar(1);
}

export const getCurrentTarget = () => currentRecord?.id ?? null;
export const isPaused = () => paused;
export const isTargetVisible = () => targetVisible;
