import * as THREE from "three";
const { MindARThree } = await import("mind-ar/dist/mindar-image-three.prod.js") // Dynamic loading forces Rolldown to chunk this off

import * as CONFIG from "./config.js";

export async function init() {
  const mThree = new MindARThree({
    container: document.querySelector("#container"),
    imageTargetSrc: CONFIG.targetSrc,
    filterMinCF: 0.001,
    filterBeta: 0.001,
    warmupTolerance: 3
  });

  mThree.renderer.setAnimationLoop(() => {
    mThree.renderer.render(mThree.scene, mThree.camera);
  });
  await mThree.start();

  const hemLight = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 0.3);
  mThree.scene.add(hemLight);

  const dirLight = new THREE.DirectionalLight(0xefdfc4, 2);
  dirLight.position.set(1, 2, 1);
  mThree.scene.add(dirLight);

  const rimLight = new THREE.DirectionalLight(0xffffff, 0.75);
  rimLight.position.set(-3, 1, -3);
  mThree.scene.add(rimLight);

  return mThree;
}
