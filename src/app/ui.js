import { t } from "../i18n.js";

import * as CONFIG from "./config.js";
import * as MAP from "./map.js";
import * as CONTROLS from "./controls.js";

const preloaded = new Map();
let displayedId = null;

export function init() {
  const container = document.querySelector("#container");
  const pauseButton = document.querySelector("#pause-button");
  const infoText = document.querySelector("#info-text");
  const infoTitle = document.querySelector("#info-title");
  const infoDate = document.querySelector("#info-date");
  // const infoMat = document.querySelector("#info-mat");
  const infoImg = document.querySelector("#info-img");

  const guide = createModal({
    el: document.querySelector("#guideWS"),
    button: document.querySelector("#guide-button"),
    closeBtn: document.querySelector("#guideWS .guide-close")
  });

  const info = createModal({
    el: document.querySelector("#infoWS"),
    button: document.querySelector("#info-button"),
    closeBtn: document.querySelector("#infoWS .close"),
    onClose: updateTrackingUI
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
    if (!info.isOpen()) renderInfo(CONTROLS.getCurrentTarget());
    info.toggle();
  });

  function updateTrackingUI() {
    const visible = CONTROLS.isTargetVisible();
    const id = CONTROLS.getCurrentTarget();

    pauseButton.disabled = !visible;
    _setActive(pauseButton, CONTROLS.isPaused());

    if (visible) {
      preloadImage(CONFIG.contentImageUrl(CONFIG.getTarget(id)));

      // Switch content only when a different target is found while open
      if (info.isOpen() && id !== displayedId) renderInfo(id);
    }

    // Lost target + open modal: keep content, keep button enabled so it can be closed
    info.button.disabled = !visible && !info.isOpen();
  }
  updateTrackingUI();
  CONTROLS.onChange(updateTrackingUI);

  pauseButton.addEventListener("click", () => {
    CONTROLS.isPaused() ? CONTROLS.unpauseTracking() : CONTROLS.pauseTracking();
  });

  document.querySelector("#back-button").addEventListener("click", () => {
    window.location.href = import.meta.env.BASE_URL;
  });

  function renderInfo(id) {
    displayedId = id;
    const entry = id === null ? null : CONFIG.getTarget(id);

    if (!entry) {
      infoTitle.textContent = "";
      infoDate.textContent = "";
      infoText.textContent = t("app.info.none");
      infoImg.classList.add("hidden");
      infoImg.removeAttribute("src");
      return;
    }

    const title = t(`app.info.title.${id}`);
    infoTitle.textContent = title;
    infoDate.textContent = t(`app.info.date.${id}`);
    infoText.textContent = t(`app.info.${id}`);

    const url = CONFIG.contentImageUrl(entry);
    if (url) {
      infoImg.src = url;
      infoImg.alt = title;
      infoImg.classList.remove("hidden");
    } else {
      infoImg.classList.add("hidden");
      infoImg.removeAttribute("src");
    }
  }
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

function preloadImage(url) {
  if (!url || preloaded.has(url)) return;
  const img = new Image();
  img.decoding = "async";
  img.src = url;
  img.decode?.().catch(() => {});
  preloaded.set(url, img); // Keep a reference to prevent garbage collection
}

function _setActive(button, active) {
  button?.classList.toggle("active", active);
}
