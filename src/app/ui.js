import { t } from "../i18n.js";

import * as MAP from "./map.js";
import * as CONTROLS from "./controls.js";

export function init() {
  const guideButton = document.querySelector("#guide-button");
  const guideWS = document.querySelector("#guideWS");
  const guideClose = guideWS.querySelector(".guide-close");

  const mapButton = document.querySelector("#map-button");
  const pauseButton = document.querySelector("#pause-button");
  const infoButton = document.querySelector("#info-button");
  const backButton = document.querySelector("#back-button");

  const infoWS = document.querySelector("#infoWS");
  const infoText = document.querySelector("#info-text");
  const closeBtn = infoWS.querySelector(".close");

  const mapWS = document.querySelector("#mapWS");
  const mapCloseBtn = mapWS.querySelector(".map-close");

  infoWS.style.display = "none";
  mapWS.style.display = "none";

  let mapModalOpen = false;
  let guideModalOpen = false;
  let activeTextButton = null;

  function openTextModal(button, text) {
    infoText.textContent = text;
    infoWS.style.display = "flex";
    _setActive(activeTextButton, false);
    _setActive(button, true);
    activeTextButton = button;
  }

  function closeTextModal() {
    infoWS.style.display = "none";
    _setActive(activeTextButton, false);
    activeTextButton = null;
  }

  function openGuideModal() {
    guideWS.classList.remove("hidden");
    guideWS.classList.add("flex");

    guideModalOpen = true;
    _setActive(guideButton, true);
  }

  function closeGuideModal() {
    guideWS.classList.remove("flex");
    guideWS.classList.add("hidden");

    guideModalOpen = false;
    _setActive(guideButton, false);
  }

  function showMapModal() {
    mapWS.style.display = "flex";
    mapModalOpen = true;
    document.body.classList.add("map-is-open");
    document.querySelector("#container").style.pointerEvents = "none";
    requestAnimationFrame(() => MAP.refresh());
  }

  function hideMapModal() {
    mapWS.style.display = "none";
    mapModalOpen = false;
    document.body.classList.remove("map-is-open");
    document.querySelector("#container").style.pointerEvents = "auto";
  }

  function updateTrackingUI() {
    pauseButton.disabled = !CONTROLS.isTargetVisible();
    _setActive(pauseButton, CONTROLS.isPaused());
  }
  updateTrackingUI();
  CONTROLS.onChange(updateTrackingUI);

  infoWS.addEventListener("click", (e) => {
    if (e.target === infoWS) closeTextModal();
  });
  closeBtn.addEventListener("click", closeTextModal);

  guideClose.addEventListener("click", closeGuideModal);

  mapWS.addEventListener("click", (e) => {
    if (e.target === mapWS) hideMapModal();
  });
  mapCloseBtn.addEventListener("click", hideMapModal);

  guideButton.addEventListener("click", () => {
    if (guideModalOpen) {
      closeGuideModal();
    } else {
      openGuideModal();
    }
  });

  infoButton.addEventListener("click", () => {
    if (activeTextButton === infoButton) {
      closeTextModal();
      return;
    }
    const id = CONTROLS.getCurrentTarget();
    openTextModal(infoButton, t(id === null ? "app.info.none" : `app.info.${id}`));
  });

  mapButton.addEventListener("click", () => {
    const opening = !mapModalOpen;
    opening ? showMapModal() : hideMapModal();
    _setActive(mapButton, opening);
  });

  pauseButton.addEventListener("click", () => {
    CONTROLS.isPaused() ? CONTROLS.unpauseTracking() : CONTROLS.pauseTracking();
  });

  backButton.addEventListener("click", () => {
    window.location.href = import.meta.env.BASE_URL;
  });
}

function _setActive(button, active) {
  if (!button) return;
  button.classList.toggle("active", active);
}
