import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { clone } from "three/addons/utils/SkeletonUtils.js";
const { MindARThree } = await import("mind-ar/dist/mindar-image-three.prod.js"); // Dynamic loading forces Rolldown to chunk this off

import * as CONFIG from "./config.js";

const settleMS = 300;

let mThree = null;
let ready = false, running = false;
let stoppedAt = 0;
let resumeTimer = null;
const reasons = new Set();

const { markers_per_target: n, variant_scales: scales } = CONFIG.targets;

export async function init() {
  mThree = new MindARThree({
    container: document.querySelector("#container"),
    imageTargetSrc: CONFIG.targets.src,
    filterMinCF: 0.001,
    filterBeta: 0.001,
    warmupTolerance: 3
  });

  const hemLight = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 0.3);
  const dirLight = new THREE.DirectionalLight(0xefdfc4, 2);
  const rimLight = new THREE.DirectionalLight(0xffffff, 0.75);

  dirLight.position.set(1, 2, 1);
  rimLight.position.set(-3, 1, -3);

  mThree.scene.add(hemLight, rimLight, dirLight);

  if (scales.length !== n) {
    console.warn(`config.toml: Expected ${n} entries in variant_scales, got ${scales.length} instead.`);
  }

  const anchors = (
    await Promise.all(CONFIG.targetList.map((entry) => createModelAnchors(mThree, entry)))
  ).flat();

  mThree.renderer.setAnimationLoop(() => {
    mThree.renderer.render(mThree.scene, mThree.camera);
  });
  await mThree.start();

  ready = running = true;
  reconcile(); // Apply anything requested while scene was still loading
  return { mThree, anchors };
}

async function createModelAnchors(mThree, entry) {
  const model = await loadNormalizedModel(CONFIG.targets.model_path + entry.model);

  return Array.from({ length: n }, (_, variant) => {
    const anchor = mThree.addAnchor(entry.id * n + variant);

    // The holder compensates for the variant's framing. Add holder.position.set(x, y, 0)
    const holder = new THREE.Group();
    holder.scale.setScalar(scales[variant] ?? 1);
    holder.add(variant === 0 ? model : clone(model)); // Clones share geometry and textures

    const pivot = new THREE.Group();
    pivot.add(holder);
    anchor.group.add(pivot);

    return { id: entry.id, variant, anchor, pivot };
  });
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

export const suspend = (reason) => (reasons.add(reason), reconcile());
export const resume = (reason) => (reasons.delete(reason), reconcile());

function reconcile() {
  clearTimeout(resumeTimer);
  if (!ready) return;

  if (reasons.size > 0) {
    if (running) stopProcessing();
  } else if (!running) {
    // Give an in-flight detection iteration time to finish (see notes)
    const wait = Math.max(0, settleMS - (performance.now() - stoppedAt));
    resumeTimer = setTimeout(startProcessing, wait);
  }
}

function stopProcessing() {
  mThree.controller.stopProcessVideo();
  running = false;
  stoppedAt = performance.now();
}

function startProcessing() {
  for (const a of mThree.anchors) {
    a.group.visible = false;
    if (a.visible) {
      a.visible = false;
      a.onTargetLost?.();
    }
  }
  mThree.ui?.showScanning?.();
  mThree.controller.processVideo(mThree.video);
  running = true;
}
