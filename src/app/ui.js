import { t } from "../i18n.js";

import * as CONFIG from "./config.js";
import * as MAP from "./map.js";
import * as CONTROLS from "./controls.js";
import * as SCENE from "./scene.js";

const selectors = {
  container: "#container",
  pauseButton: "#pause-button",
  backButton: "#back-button",

  infoText: "#info-text",
  infoTitle: "#info-title",
  infoDate: "#info-date",
  infoMat: "#info-mat",
  infoImg: "#info-img",
  infoImgWrap: "#info-img-wrap",

  guideEl: "#guideWS",
  guideButton: "#guide-button",
  guideClose: "#guideWS .guide-close",

  infoEl: "#infoWS",
  infoButton: "#info-button",
  infoClose: "#infoWS .close",

  mapEl: "#mapWS",
  mapButton: "#map-button",
  mapClose: "#mapWS .map-close"
};

const preloaded = new Map();
let displayedId = null;
let pinned = false;
let wasVisible = false;
let lastId = null;

export function init() {
  const dom = queryDom();
  const modals = createModals(dom);

  bindModalButtons(modals);
  bindPauseButton(dom);
  bindBackButton(dom);
  bindTrackingUI(dom, modals.info);
  bindMapMarkers(modals);
}

function queryDom() {
  return Object.fromEntries(
    Object.entries(selectors).map(([key, selector]) => [
      key,
      document.querySelector(selector)
    ])
  );
}

function createModals(dom) {
  const guide = createModal({
    el: dom.guideEl,
    button: dom.guideButton,
    closeBtn: dom.guideClose,
    onOpen: () => SCENE.suspend("guide"),
    onClose: () => SCENE.resume("guide")
  });

  const info = createModal({
    el: dom.infoEl,
    button: dom.infoButton,
    closeBtn: dom.infoClose,
    onOpen: () => updateTrackingUI(dom, info),
    onClose: () => {
      pinned = false;
      updateTrackingUI(dom, info);
    }
  });

  const map = createModal({
    el: dom.mapEl,
    button: dom.mapButton,
    closeBtn: dom.mapClose,
    onOpen: () => onMapOpen(dom),
    onClose: () => onMapClose(dom)
  });

  return { guide, info, map, dom };
}

function bindModalButtons({ guide, info, map, dom }) {
  guide.button.addEventListener("click", guide.toggle);
  map.button.addEventListener("click", map.toggle);
  info.button.addEventListener("click", () => {
    if (!info.isOpen()) renderInfo(dom, CONTROLS.getCurrentTarget());
    info.toggle();
  });
}

function bindPauseButton({ pauseButton }) {
  pauseButton.addEventListener("click", () => {
    if (CONTROLS.isPaused()) {
      CONTROLS.unpauseTracking();
      SCENE.resume("pause");
    } else {
      CONTROLS.pauseTracking();
      if (CONTROLS.isPaused()) SCENE.suspend("pause");
    }
  });
}

function bindBackButton({ backButton }) {
  backButton.addEventListener("click", () => {
    window.location.href = import.meta.env.BASE_URL;
  });
}

function bindTrackingUI(dom, info) {
  const update = () => updateTrackingUI(dom, info);
  update();
  CONTROLS.onChange(update);
}

function bindMapMarkers({ map, info, dom }) {
  MAP.onMarkerSelect((id) => {
    map.close(); // the map would otherwise cover the info modal
    renderInfo(dom, id, { pin: true });
    info.open();
  });
}

function onMapOpen({ container }) {
  document.body.classList.add("map-is-open");
  container.style.pointerEvents = "none";
  SCENE.suspend("map");
  requestAnimationFrame(() => {
    MAP.refresh();
    MAP.resumeLocation();
  });
}

function onMapClose({ container }) {
  document.body.classList.remove("map-is-open");
  container.style.pointerEvents = "auto";
  MAP.pauseLocation();
  SCENE.resume("map");
}

function updateTrackingUI(dom, info) {
  const { pauseButton, infoButton } = dom;
  const visible = CONTROLS.isTargetVisible();
  const id = CONTROLS.getCurrentTarget();

  // True only on a real detection, not on pause toggles or other onChange calls
  const justFound = visible && (!wasVisible || id !== lastId);
  wasVisible = visible;
  lastId = id;

  pauseButton.disabled = !visible;
  pauseButton?.classList.toggle("active", CONTROLS.isPaused());

  if (visible) preloadImage(CONFIG.contentImageUrl(CONFIG.getTarget(id)));

  if (justFound && !pinned && info.isOpen() && id !== displayedId) {
    renderInfo(dom, id);
  }

  infoButton.disabled = !visible && !info.isOpen();
}

function renderInfo(dom, id, { pin = false } = {}) {
  displayedId = id;
  pinned = pin;
  const entry = id === null ? null : CONFIG.getTarget(id);

  if (!entry) {
    setInfoText(dom, { text: t("app.info.none") });
    hideInfoImage(dom);
    return;
  }

  const title = t(`app.info.title.${id}`);
  setInfoText(dom, {
    title,
    date: t(`app.info.date.${id}`),
    material: t(`app.info.material.${id}`),
    text: t(`app.info.${id}`)
  });

  const url = CONFIG.contentImageUrl(entry);
  if (url) showInfoImage(dom, url, title);
  else hideInfoImage(dom);
}

function showInfoImage({ infoImg, infoImgWrap }, url, alt) {
  infoImgWrap.classList.remove("hidden"); // grey placeholder box
  delete infoImg.dataset.loaded; // hide the previous image immediately
  infoImg.alt = alt;
  infoImg.onload = () => {
    infoImg.dataset.loaded = "";
  };
  infoImg.onerror = () => {}; // stay on the grey box if loading fails
  infoImg.removeAttribute("src");
  infoImg.src = url;
}

function hideInfoImage({ infoImg, infoImgWrap }) {
  infoImgWrap.classList.add("hidden");
  delete infoImg.dataset.loaded;
  infoImg.onload = infoImg.onerror = null;
  infoImg.removeAttribute("src");
}

function setInfoText(dom, { title = "", date = "", material = "", text = "" }) {
  dom.infoTitle.textContent = title;
  dom.infoDate.textContent = date;
  dom.infoMat.textContent = material;
  dom.infoText.textContent = text;
}

function createModal({ el, button, closeBtn, onOpen, onClose }) {
  let open = false;

  function set(value) {
    if (open === value) return;
    open = value;
    el.style.display = value ? "flex" : "none";
    button?.classList.toggle("active", value);
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
