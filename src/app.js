import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MindARThree } from "mind-ar/dist/mindar-image-three.prod.js";

const loader = new GLTFLoader();
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

// #region DEBUG
// scene.background = new THREE.Color(0x0f1117); // Disable distracting camera feed
// scene.add(new THREE.AxesHelper(1).translateZ(-10));
// #endregion DEBUG

// Scene setup

const hemiLight = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 0.75);
scene.add(hemiLight);
const dirLight = new THREE.DirectionalLight(0xefdfc4, 1.5);
dirLight.position.set(1, 2, 1);
scene.add(dirLight);

init();

// = Functions =

async function addModelAnchor(targetIndex, modelUrl, transform) {
  const anchor = mindarThree.addAnchor(targetIndex);
  const pivot = new THREE.Group();
  
  const gltf = await loader.loadAsync(modelUrl);
  const model = gltf.scene;

  const t = {
    rotation: transform.rotation || [0, 0, 0],
    position: transform.position || [0, 0, 0],
    scale: transform.scale || [1, 1, 1]
  };

  model.rotation.set(
    THREE.MathUtils.degToRad(t.rotation[0]),
    THREE.MathUtils.degToRad(t.rotation[1]),
    THREE.MathUtils.degToRad(t.rotation[2])
  );
  model.position.set(t.position[0], t.position[1], t.position[2]);
  model.scale.set(t.scale[0], t.scale[1], t.scale[2]);

  anchor.group.add(pivot);
  pivot.add(model);

  // attach metadata
  anchor.userData = {
    targetIndex,
    modelUrl
  };

  // detection events
  anchor.onTargetFound = () => {
    console.info("FOUND:", anchor.userData);
  };

  // anchor.onTargetLost = () => {
  //   console.log("LOST:", anchor.userData);
  //   clearUI();
  // };

  return anchor;
}

await Promise.all([
  addModelAnchor(0, "models/00_unicorn.gltf", {
    rotation: [25, 25, 0],
    position: [0, 0, 0],
    scale: [0.2, 0.2, 0.2]
  }),
  addModelAnchor(1, "models/01_man-with-book.gltf", {
    rotation: [0, 80, 0],
    position: [0, 0, 0],
    scale: [0.2, 0.2, 0.2]
  }),
  addModelAnchor(2, "models/02_dog.gltf", {
    rotation: [45, 0, 0],
    position: [0, 0, 0],
    scale: [0.2, 0.2, 0.2]
  }),
  addModelAnchor(3, "models/06_monsterdog.gltf", {
    rotation: [0, 140, 0],
    position: [0, 0, 0],
    scale: [0.4, 0.4, 0.4]
  }),
  addModelAnchor(4, "models/07_zanner.gltf", {
    rotation: [0, 100, 0],
    position: [0, 0, 0],
    scale: [0.3, 0.3, 0.3]
  }),
  addModelAnchor(5, "models/08_human-skeleton.gltf", {
    rotation: [0, -50, 0],
    position: [0, 0, 0],
    scale: [0.2, 0.2, 0.2]
  }),
  addModelAnchor(6, "models/09_dog-with-rabbit.gltf", {
    rotation: [0, 50, 0],
    position: [0, 0, 0],
    scale: [0.2, 0.2, 0.2]
  }),
  addModelAnchor(7, "models/10_griffin.gltf", {
    rotation: [45, 0, 0],
    position: [0, 0, 0],
    scale: [0.4, 0.4, 0.4]
  }),
  addModelAnchor(8, "models/11_fish.gltf", {
    rotation: [0, 0, 0],
    position: [0, 0, 0],
    scale: [0.4, 0.4, 0.4]
  }),
  addModelAnchor(9, "models/12_devilry.gltf", {
    rotation: [0, 0, 0],
    position: [0, 0, 0],
    scale: [0.4, 0.4, 0.4]
  }),
  addModelAnchor(11, "models/15_man-with-jug.gltf", {
    rotation: [0, 50, 0],
    position: [0, -1.0, 0],
    scale: [0.2, 0.2, 0.2]
  }),
  addModelAnchor(12, "models/16_knight.gltf", {
    rotation: [0, 150, 0],
    position: [0, 0, 0],
    scale: [0.2, 0.2, 0.2]
  })
]);

async function init() {
  await mindarThree.start();
}

async function stop() {
  await mindarThree.stop();
  renderer.setAnimationLoop(null);
}