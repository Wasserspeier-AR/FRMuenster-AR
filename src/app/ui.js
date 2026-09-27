import { t } from "../i18n.js";

import * as CONTROLS from "./controls.js";

export function init() {
  const guideButton = document.querySelector("#guide-button");
  // Might need later
  // const guideWS = document.querySelector("#guideWS");
  // const guideClose = guideWS.querySelector(".guide-close");

  const mapButton = document.querySelector("#map-button");
  const pauseButton = document.querySelector("#pause-button");
  const infoButton = document.querySelector("#info-button");
  const backButton = document.querySelector("#unpause-button");

  const infoWS = document.querySelector("#infoWS");
  const infoText = document.querySelector("#info-text");
  const closeBtn = infoWS.querySelector(".close");

  const mapWS = document.querySelector("#mapWS");
  const mapCloseBtn = mapWS.querySelector(".map-close");

  infoWS.style.display = "none";
  mapWS.style.display = "none";

  let mapModalOpen = false;

  // Guide and Info share one modal, so opening one should visually
  // deactivate the other if it was previously toggled active.
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

  function showMapModal() {
    mapWS.style.display = "flex";
    mapModalOpen = true;
    document.body.classList.add("map-is-open");
    document.querySelector("#container").style.pointerEvents = "none";
  }

  function hideMapModal() {
    mapWS.style.display = "none";
    mapModalOpen = false;
    document.body.classList.remove("map-is-open");
    document.querySelector("#container").style.pointerEvents = "auto";
  }

  function updateTrackingUI() {
    pauseButton.disabled = !CONTROLS.isTargetVisible();
  }
  updateTrackingUI();
  CONTROLS.onChange(updateTrackingUI);

  infoWS.addEventListener("click", (e) => {
    if (e.target === infoWS) closeTextModal();
  });
  closeBtn.addEventListener("click", closeTextModal);

  mapWS.addEventListener("click", (e) => {
    if (e.target === mapWS) hideMapModal();
  });
  mapCloseBtn.addEventListener("click", hideMapModal);

  guideButton.addEventListener("click", () => {
    if (activeTextButton === guideButton) {
      closeTextModal();
    } else {
      openTextModal(guideButton, t("app.guide-text"));
    }
  });

  infoButton.addEventListener("click", () => {
    if (activeTextButton === infoButton) {
      closeTextModal();
      return;
    }
    const text =
      CONTROLS.getCurrentTarget() === null
        ? t("app.info.none")
        : t(`app.info.${CONTROLS.getCurrentTarget()}`);
    openTextModal(infoButton, text);
  });

  mapButton.addEventListener("click", () => {
    const opening = !mapModalOpen;
    opening ? showMapModal() : hideMapModal();
    _setActive(mapButton, opening);
  });

  pauseButton.addEventListener("click", () => {
    const pausing = !CONTROLS.isPaused();
    pausing ? CONTROLS.pauseTracking() : CONTROLS.unpauseTracking();
    _setActive(pauseButton, pausing);
  });

  backButton.addEventListener("click", () => {
    window.location.href = import.meta.env.BASE_URL;
  });
}

function _setActive(button, active) {
  if (!button) return;
  button.classList.toggle("active", active);
}
