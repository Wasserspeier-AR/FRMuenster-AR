import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { clone } from "three/addons/utils/SkeletonUtils.js";
const { MindARThree } = await import("mind-ar/dist/mindar-image-three.prod.js"); // Dynamic loading forces Rolldown to chunk this off

import * as CFG from "./config.js";

const { markers_per_target: n, scales } = CFG.targets;

// Pose smoothing on top of MindAR's own filter
// const smoothing = true;     // false = follow the anchor exactly
// const smoothingRateMin = 2; // Follow speed when nearly still. Lower is calmer
// const smootingRateMax = 60; // Extra follow speed per radian of error

const gate = createGate();
export const suspend = gate.suspend;
export const resume = gate.resume;

export async function init() {
  const mThree = new MindARThree({
    container: document.querySelector("#container"),
    imageTargetSrc: CFG.targets.file,
    filterMinCF: 0.001,
    filterBeta: 1000,
    warmupTolerance: 5
  });

  const hemLight = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 0.3);
  const dirLight = new THREE.DirectionalLight(0xefdfc4, 2);
  const rimLight = new THREE.DirectionalLight(0xffffff, 0.75);
  dirLight.position.set(1, 2, 1);
  rimLight.position.set(-3, 1, -3);
  mThree.scene.add(hemLight, rimLight, dirLight);

  const anchors = (
    await Promise.all(
      CFG.targetList
        .filter((t) => t.enabled)
        .map((t) => createModelAnchors(mThree, t))
    )
  ).flat();

  let prev = performance.now();
  mThree.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  mThree.renderer.setAnimationLoop((now) => {
    const dt = Math.min((now - prev) / 1000, 0.1);
    prev = now;
    for (const record of anchors) follow(record, dt);
    mThree.renderer.render(mThree.scene, mThree.camera);
  });
  await mThree.start();

  // Applies anything requested while the scene was still loading
  gate.activate({
    stop: () => {
      mThree.controller.stopProcessVideo();
      mThree.ui?.hideScanning?.();
    },
    start: () => {
      // Drop stale detections so targets re-trigger cleanly
      for (const a of mThree.anchors) {
        a.group.visible = false;
        if (a.visible) {
          a.visible = false;
          a.onTargetLost?.();
        }
      }
      mThree.ui?.showScanning?.();
      mThree.controller.processVideo(mThree.video);
    }
  });

  return { mThree, anchors };
}

async function createModelAnchors(mThree, target) {
  const model = await loadNormalizedModel(target.model);

  return Array.from({ length: n }, (_, variant) => {
    const anchor = mThree.addAnchor(target.id * n + variant);

    // The holder compensates for the variant's framing
    const holder = new THREE.Group();
    holder.scale.setScalar(scales[variant] ?? 1);
    holder.add(variant === 0 ? model : clone(model)); // Clones share geometry and textures

    const pivot = new THREE.Group();
    pivot.add(holder);

    // MindAR overwrites anchor.group every update, so the pivot lives under
    // a separate group in the scene that chases the anchor's pose instead.
    const smoother = new THREE.Group();
    smoother.visible = false;
    smoother.add(pivot);
    mThree.scene.add(smoother);

    return { id: target.id, variant, anchor, smoother, pivot };
  });
}

const pos = new THREE.Vector3();
const quat = new THREE.Quaternion();
const scl = new THREE.Vector3();

// Moves the smoother toward the anchor's world pose: slowly for jitter,
// quickly for real motion.
function follow({ anchor, smoother }, dt) {
  if (!anchor.group.visible) {
    smoother.visible = false;
    return;
  }
  anchor.group.updateWorldMatrix(true, false);
  anchor.group.matrixWorld.decompose(pos, quat, scl);

  if (!smoother.visible || !CFG.smoothing.enabled) {
    // First frame after detection: snap instead of gliding in from the old pose
    smoother.position.copy(pos);
    smoother.quaternion.copy(quat);
    smoother.scale.copy(scl);
    smoother.visible = true;
    return;
  }

  const rate =
    CFG.smoothing.rate_min +
    CFG.smoothing.rate_max * smoother.quaternion.angleTo(quat);
  const k = 1 - Math.exp(-dt * rate);
  smoother.position.lerp(pos, k);
  smoother.quaternion.slerp(quat, k);
  smoother.scale.lerp(scl, k);
}

async function loadNormalizedModel(uri) {
  const model = (await new GLTFLoader().loadAsync(uri)).scene;

  const size = new THREE.Box3()
    .setFromObject(model)
    .getSize(new THREE.Vector3());
  model.scale.setScalar(0.5 / Math.max(size.x, size.y, size.z));

  const center = new THREE.Box3()
    .setFromObject(model)
    .getCenter(new THREE.Vector3());
  model.position.sub(center);

  return model;
}

// Run detection only while nothing has asked for suspension
function createGate() {
  const SETTLE_MS = 300;
  const reasons = new Set();
  let actions = null; // { stop, start }, set by activate()
  let running = false;
  let stoppedAt = 0;
  let timer = null;

  function reconcile() {
    clearTimeout(timer);
    if (!actions) return;

    if (reasons.size > 0) {
      if (!running) return;
      actions.stop();
      running = false;
      stoppedAt = performance.now();
    } else if (!running) {
      // Give an in-flight detection iteration time to finish
      const wait = Math.max(0, SETTLE_MS - (performance.now() - stoppedAt));
      timer = setTimeout(() => {
        actions.start();
        running = true;
      }, wait);
    }
  }

  return {
    suspend(reason) {
      reasons.add(reason);
      reconcile();
    },
    resume(reason) {
      reasons.delete(reason);
      reconcile();
    },
    activate(a) {
      actions = a;
      running = true;
      reconcile();
    }
  };
}
