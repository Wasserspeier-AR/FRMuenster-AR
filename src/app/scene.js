import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { clone } from "three/addons/utils/SkeletonUtils.js";
const { MindARThree } = await import("mind-ar/dist/mindar-image-three.prod.js"); // Dynamic loading forces Rolldown to chunk this off

import * as CFG from "./config.js";

const { markers_per_target: n, scales } = CFG.targets;

const gate = createGate();
export const suspend = gate.suspend;
export const resume = gate.resume;

export async function init() {
  const mThree = new MindARThree({
    container: document.querySelector("#container"),
    imageTargetSrc: CFG.targets.file,
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

  const anchors = (
    await Promise.all(
      CFG.targetList
        .filter((t) => t.enabled)
        .map((t) => createModelAnchors(mThree, t))
    )
  ).flat();

  mThree.renderer.setAnimationLoop(() => {
    mThree.renderer.render(mThree.scene, mThree.camera);
  });
  await mThree.start();

  // Applies anything requested while the scene was still loading
  gate.activate({
    stop: () => mThree.controller.stopProcessVideo(),
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
    anchor.group.add(pivot);

    return { id: target.id, variant, anchor, pivot };
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
