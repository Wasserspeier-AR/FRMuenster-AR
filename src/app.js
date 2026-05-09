import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MindARThree } from "mind-ar/dist/mindar-image-three.prod.js";

let activePivot = null;
const models = {
  0: "models/00_unicorn.gltf",
  1: "models/01_man-with-book.gltf",
  2: "models/02_dog.gltf",
  3: "models/06_monsterdog.gltf",
  4: "models/07_zanner.gltf",
  5: "models/08_human-skeleton.gltf",
  6: "models/09_dog-with-rabbit.gltf",
  7: "models/10_griffin.gltf",
  8: "models/11_fish.gltf",
  9: "models/12_devilry.gltf",
  11: "models/15_man-with-jug.gltf",
  12: "models/16_knight.gltf"
};
const mindarThree = new MindARThree({
  container: document.querySelector("#container"),
  imageTargetSrc: "/mind_ar/WS_all_Marker2.mind",
  filterMinCF: 0.001,
  filterBeta: 0.001
});
const { renderer, scene, camera } = mindarThree;
renderer.setAnimationLoop(() => {
  renderer.render(scene, camera);
});


initMindAR();
initScene();
initTouchControls();
await Promise.all(
  Object.entries(models).map(([index, path]) =>
    addModelAnchor(Number(index), path)
  )
);


// = Functions =
async function addModelAnchor(index, modelURI) {
  const anchor = mindarThree.addAnchor(index);
  const model = (await new GLTFLoader().loadAsync(modelURI)).scene;
  const box = new THREE.Box3().setFromObject(model);

  // Center the model
  model.position.sub(box.getCenter(new THREE.Vector3()));
  
  // Normalize scale
  const size = new THREE.Vector3();
  box.getSize(size);
  const scale = 0.2 / Math.max(...size);
  model.scale.setScalar(scale).clampScalar(0.5, 2);

  const pivot = new THREE.Group();
  pivot.add(model);
  anchor.group.add(pivot);

  anchor.onTargetFound = () => activePivot = pivot;
  anchor.onTargetLost = () => activePivot = null;

  return anchor;
}

function initTouchControls() {
  const el = renderer.domElement;
  let lastX = null, lastY = null, lastDist = null;

  el.addEventListener("touchstart", (e) => {
    if (e.touches.length === 1) {
      lastX = e.touches[0].clientX;
      lastY = e.touches[0].clientY;
    } else if (e.touches.length === 2) {
      lastDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
    }
  }, { passive: true });

  el.addEventListener("touchmove", (e) => {
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
  }, { passive: true });

  el.addEventListener("touchend", (e) => {
    if (e.touches.length === 0) {
      lastX = null; lastY = null; lastDist = null;
    } else if (e.touches.length === 1) {
      // Lifted one finger from pinch — resume single-finger tracking cleanly
      lastDist = null;
      lastX = e.touches[0].clientX;
      lastY = e.touches[0].clientY;
    }
  }, { passive: true });
}

function initScene() {
  const hemLight = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 0.3);
  scene.add(hemLight);

  const dirLight = new THREE.DirectionalLight(0xefdfc4, 2);
  dirLight.position.set(1, 2, 1);
  scene.add(dirLight);

  // Might add in, if performance ends up not being a problem:
  // const rimLight = new THREE.DirectionalLight(0xffffff, 0.75);
  // rimLight.position.set(-3, 1, -3);
  // scene.add(rimLight);
}

async function initMindAR() {
  await mindarThree.start();
}

async function stop() {
  await mindarThree.stop();
  renderer.setAnimationLoop(null);
}