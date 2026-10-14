import * as THREE from "three";
import { bindGestures } from "./gestures.js";
import { loadPreview } from "./scene.js";

const fill = 0.4;

let showTicket = 0;
let scene = null;
let camera = null;
let records = [];
let current = null;
let mode = "live"; // "live" | "frozen" | "virtual"
let detected = false;
let onTrackingChange = () => {};

export const isPaused = () => mode !== "live";
export const isTargetVisible = () => isPaused() || detected;
export const getCurrentTarget = () => current?.id ?? null;

export function onChange(cb) {
  onTrackingChange = cb;
}

export function init({ mThree, anchors }) {
  scene = mThree.scene;
  camera = mThree.camera;
  records = anchors;

  for (const record of anchors) {
    record.anchor.onTargetFound = () => {
      if (isPaused()) return;
      current = record;
      detected = true;
      onTrackingChange();
    };
    record.anchor.onTargetLost = () => {
      if (isPaused() || record !== current) return;
      detected = false;
      onTrackingChange();
    };
  }

  bindGestures(mThree.renderer.domElement, () =>
    current && isTargetVisible() ? current.pivot : null
  );
}

export function pauseTracking() {
  if (isPaused() || !current || !detected) return;
  mode = "frozen";
  freezeAtSmoother(current);
  onTrackingChange();
}

export function unpauseTracking() {
  if (!isPaused()) return;
  release(current);
  mode = "live";
  detected = false;
  onTrackingChange();
}

function release(record) {
  resetPivot(record.pivot);
  if (record.smoother) record.smoother.add(record.pivot);
  else record.frozen.remove(record.pivot);
  scene.remove(record.frozen);
  record.frozen = null;
}

export async function showModel(id) {
  const ticket = ++showTicket;
  const record =
    records.find((r) => r.id === id && r.variant === 0) ??
    (await loadPreview(id));

  if (ticket !== showTicket) return true;
  if (!record) return false;

  if (isPaused()) release(current);
  hideLiveModels(); // One model on screen at all times

  current = record;
  mode = "virtual";
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
  const frozen = createFrozen(record);
  frozen.position.copy(record.smoother.position);
  frozen.quaternion.copy(record.smoother.quaternion);
  frozen.scale.copy(record.smoother.scale);
}

function freezeInFront(record) {
  resetPivot(record.pivot);
  const frozen = createFrozen(record);

  camera.updateWorldMatrix(true, false);
  const dist = Math.max(camera.near * 3, 1);
  frozen.position.copy(camera.localToWorld(new THREE.Vector3(0, 0, -dist)));
  camera.getWorldQuaternion(frozen.quaternion); // Face the camera
  frozen.scale.setScalar(1);
  frozen.updateMatrixWorld(true);

  const size = new THREE.Box3()
    .setFromObject(record.pivot)
    .getSize(new THREE.Vector3());
  const viewH = 2 * dist * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  frozen.scale.setScalar((viewH * fill) / Math.max(size.x, size.y, size.z));
}

function resetPivot(pivot) {
  pivot.position.set(0, 0, 0);
  pivot.quaternion.identity();
  pivot.scale.setScalar(1);
}
