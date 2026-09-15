import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MindARThree } from "mind-ar/dist/mindar-image-three.prod.js";
import { t } from "./i18n.js";

let activePivot = null;
let currentIndex = null; // index of the last recognized target, used by the info popup
const anchorGroups = {}; // index -> anchor.group
let currentAnchorIndex = null;
let isPaused = false;
let isHidden = true;

const base = import.meta.env.BASE_URL;
const models = {
  0: `${base}models/0_unicorn.glb`,
  1: `${base}models/1_man_with_book.glb`,
  2: `${base}models/2_dog.glb`,
  3: `${base}models/6_monster_dog.glb`,
  4: `${base}models/7_zanner.glb`,
  5: `${base}models/8_human_skeleton.glb`,
  6: `${base}models/9_dog_with_rabbit.glb`,
  7: `${base}models/10_griffin.glb`,
  8: `${base}models/11_fish.glb`,
  9: `${base}models/12_devilry.glb`,
  11: `${base}models/15_man_with_jug.glb`,
  12: `${base}models/16_knight.glb`
};
const mindarThree = new MindARThree({
  container: document.querySelector("#container"),
  imageTargetSrc: `${base}mind_ar/WS_all_Marker2.mind`,
  filterMinCF: 0.001,
  filterBeta: 0.001,
  warmupTolerance: 3
});
const { renderer, scene, camera } = mindarThree;
renderer.setAnimationLoop(() => {
  renderer.render(scene, camera);
});

initMindAR();
initScene();
initTouchControls();
initUI();
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

  model.position.sub(box.getCenter(new THREE.Vector3()));

  const size = new THREE.Vector3();
  box.getSize(size);
  const scale = 0.2 / Math.max(...size);
  model.scale.setScalar(scale).clampScalar(0.5, 2);

  const pivot = new THREE.Group();
  pivot.add(model);
  anchor.group.add(pivot);

  anchorGroups[index] = anchor.group;

  anchor.onTargetFound = () => {
    if (isPaused) return; // ignore tracking events while paused
    activePivot = pivot;
    currentAnchorIndex = index;
  };
  anchor.onTargetLost = () => {
    if (isPaused) return;
    activePivot = null;
  };

  return anchor;
}

function pauseTracking() {
  if (isPaused || !activePivot) return;
  isPaused = true;

  scene.attach(activePivot);
}

function unpauseTracking() {
  if (!isPaused) return;
  isPaused = false;

  const group = anchorGroups[currentAnchorIndex];
  if (group && activePivot) {
    group.attach(activePivot); // reparent back, will snap to live tracking pose
  }
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
      // Lifted one finger from pinch - resume single-finger tracking cleanly
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

  const rimLight = new THREE.DirectionalLight(0xffffff, 0.75);
  rimLight.position.set(-3, 1, -3);
  scene.add(rimLight);
}

async function initMindAR() {
  await mindarThree.start();
}

async function stop() {
  mindarThree.stop();
  renderer.setAnimationLoop(null);
}

// --- UI wiring ---
function initUI() {
  const guideButton = document.querySelector("#guide-button");
  const guideWS = document.querySelector("#guideWS");
  const guideClose = guideWS.querySelector(".guide-close");

  const mapButton = document.querySelector("#map-button");
  const pauseButton = document.querySelector("#pause-button");
  const infoButton = document.querySelector("#info-button");
  const backButton = document.querySelector("#unpause-button");

   function setButtonActive(button, active) {
    button.classList.toggle("text-[rgb(118,23,23)]", active);
    button.classList.toggle("text-gray-600", !active);
  }

  const infoWS = document.querySelector("#infoWS");
  const infoText = document.querySelector("#info-text");
  const closeBtn = infoWS.querySelector(".close");

  infoWS.style.display = "none";

  function showModal(text) {
    infoText.textContent = text;
    infoWS.style.display = "flex";
    isHidden = false;
  }

  function hideModal() {
    infoWS.style.display = "none";
    isHidden = true;
  }

  function showGuide() {
    guideWS.classList.remove("hidden");
    guideWS.classList.add("flex");
  }

  function hideGuide() {
    guideWS.classList.remove("flex");
    guideWS.classList.add("hidden");
  }

  infoWS.addEventListener("click", (e) => {
    if (e.target === infoWS) hideModal();
  });
  closeBtn.addEventListener("click", hideModal);

  guideButton.addEventListener("click", () => {
  if (guideWS.classList.contains("hidden")) {
    showGuide();
    
  } else {
    hideGuide();
   
  }
});

  guideClose.addEventListener("click", hideGuide);

  guideWS.addEventListener("click", (e) => {
    if (e.target === guideWS) {
      hideGuide();
    }
  });

  infoButton.addEventListener("click", () => {
    // if (currentIndex === null) {
    //   showModal(t("app.info.none"));
    //   return;
    // }

    if (isHidden) {
      showModal(t(`app.info.${currentIndex}`));
      setButtonActive(infoButton, true);
    } else {
      hideModal();
      setButtonActive(infoButton, false);
    }
  });

  mapButton.addEventListener("click", () => {
    // TODO: open Leaflet map popup
  });

  pauseButton.addEventListener("click", () => {
    if (isPaused) {
      unpauseTracking();
      setButtonActive(pauseButton, false);
    } else {
      pauseTracking();
      setButtonActive(pauseButton, true);
      // TODO: add icon toggle
      // TODO: fix "background tracking"
    }
  });

  backButton.addEventListener("click", () => {
    window.location.href = base;
  });
}
