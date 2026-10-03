 import { t } from "../i18n.js";

import * as MAP from "./map.js";
import * as CONTROLS from "./controls.js";

export function init() {
  const container = document.querySelector("#container");
  const pauseButton = document.querySelector("#pause-button");
  const infoText = document.querySelector("#info-text");

  const guide = createModal({
    el: document.querySelector("#guideWS"),
    button: document.querySelector("#guide-button"),
    closeBtn: document.querySelector("#guideWS .guide-close")
  });

  const info = createModal({
    el: document.querySelector("#infoWS"),
    button: document.querySelector("#info-button"),
    closeBtn: document.querySelector("#infoWS .close")
  });

  const map = createModal({
    el: document.querySelector("#mapWS"),
    button: document.querySelector("#map-button"),
    closeBtn: document.querySelector("#mapWS .map-close"),
    onOpen() {
      document.body.classList.add("map-is-open");
      container.style.pointerEvents = "none";
      requestAnimationFrame(() => MAP.refresh());
    },
    onClose() {
      document.body.classList.remove("map-is-open");
      container.style.pointerEvents = "auto";
    }
  });

  guide.button.addEventListener("click", guide.toggle);
  map.button.addEventListener("click", map.toggle);

  info.button.addEventListener("click", () => {
    if (!info.isOpen()) {
      const id = CONTROLS.getCurrentTarget();
      infoText.textContent = t(id === null ? "app.info.none" : `app.info.${id}`);
    }
    info.toggle();
  });

  function updateTrackingUI() {
    pauseButton.disabled = !CONTROLS.isTargetVisible();
    _setActive(pauseButton, CONTROLS.isPaused());
  }
  updateTrackingUI();
  CONTROLS.onChange(updateTrackingUI);

  pauseButton.addEventListener("click", () => {
    CONTROLS.isPaused() ? CONTROLS.unpauseTracking() : CONTROLS.pauseTracking();
  });

  document.querySelector("#back-button").addEventListener("click", () => {
    window.location.href = import.meta.env.BASE_URL;
  });
}

function createModal({ el, button, closeBtn, onOpen, onClose }) {
  let open = false;

  function set(value) {
    if (open === value) return;
    open = value;
    el.style.display = value ? "flex" : "none";
    _setActive(button, value);
    (value ? onOpen : onClose)?.();
  }

  const modal = {
    button,
    isOpen: () => open,
    open: () => set(true),
    close: () => set(false),
    toggle: () => set(!open)
  };

  el.style.display = "none";
  closeBtn?.addEventListener("click", modal.close);
  el.addEventListener("click", (e) => {
    if (e.target === el) modal.close();
  });

  return modal;
}

function _setActive(button, active) {
  button?.classList.toggle("active", active);
}
