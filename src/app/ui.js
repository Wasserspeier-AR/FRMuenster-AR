import { tl } from "../i18n.js";
import * as CONF from "./config.js";
import * as MAP from "./map.js";
import * as CTRL from "./controls.js";
import * as SCENE from "./scene.js";

const selectors = {
  pauseButton: "#pause-button",

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

const preloaded = new Set();
const state = {
  displayedId: null,
  pinned: false,
  wasVisible: false,
  lastId: null
};

let dom;
let modals;

export function init() {
  dom = Object.fromEntries(
    Object.entries(selectors).map(([key, selector]) => {
      const el = document.querySelector(selector);
      if (!el) throw new Error(`ui: element not found: ${selector}`);
      return [key, el];
    })
  );

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
    onButtonClick: () => {
      if (!info.isOpen()) renderInfo(CTRL.getCurrentTarget());
      info.toggle();
    },
    onOpen: updateTrackingUI,
    onClose: () => {
      state.pinned = false;
      updateTrackingUI();
    }
  });
  const map = createModal({
    el: dom.mapEl,
    button: dom.mapButton,
    closeBtn: dom.mapClose,
    onOpen: () => {
      document.body.classList.add("map-is-open");
      SCENE.suspend("map");
      requestAnimationFrame(() => {
        MAP.refresh();
        MAP.resumeLocation();
      });
    },
    onClose: () => {
      document.body.classList.remove("map-is-open");
      MAP.pauseLocation();
      SCENE.resume("map");
    }
  });
  modals = { guide, info, map };

  dom.pauseButton.addEventListener("click", togglePause);
  document.addEventListener("langchange", refreshInfo);
  MAP.onMarkerSelect(showPinnedInfo);
  CTRL.onChange(updateTrackingUI);
  updateTrackingUI();
}

function createModal({ el, button, closeBtn, onButtonClick, onOpen, onClose }) {
  let open = false;

  function set(value) {
    if (open === value) return;
    open = value;
    el.style.display = value ? "flex" : "none";
    button.classList.toggle("active", value);
    (value ? onOpen : onClose)?.();
  }

  const modal = {
    isOpen: () => open,
    open: () => set(true),
    close: () => set(false),
    toggle: () => set(!open)
  };

  el.style.display = "none";
  button.addEventListener("click", onButtonClick ?? modal.toggle);
  closeBtn.addEventListener("click", modal.close);
  el.addEventListener("click", (e) => {
    if (e.target === el) modal.close();
  });

  return modal;
}

function togglePause() {
  if (CTRL.isPaused()) {
    CTRL.unpauseTracking();
    SCENE.resume("pause");
    return;
  }
  CTRL.pauseTracking();
  if (CTRL.isPaused()) SCENE.suspend("pause");
}

function showPinnedInfo(id) {
  modals.map.close(); // The map would otherwise cover the info modal
  renderInfo(id, { pin: true });
  modals.info.open();
}

function updateTrackingUI() {
  const { info } = modals;
  const visible = CTRL.isTargetVisible();
  const id = CTRL.getCurrentTarget();
  const justFound = (visible, id) => {
    const justFound = visible && (!state.wasVisible || id !== state.lastId);
    state.wasVisible = visible;
    state.lastId = id;
    return justFound;
  };

  dom.pauseButton.disabled = !visible;
  dom.pauseButton.classList.toggle("active", CTRL.isPaused());
  dom.infoButton.disabled = !visible && !info.isOpen();

  if (visible) preloadImage(CONF.contentImg(CONF.targetList[id]));

  if (justFound && !state.pinned && info.isOpen() && id !== state.displayedId) {
    renderInfo(id);
  }
}

function renderInfo(id, { pin = false } = {}) {
  state.displayedId = id;
  state.pinned = pin;
  const target = id === null ? null : CONF.targetList[id];

  if (!target) {
    setInfoText({ text: tl("app.info.none") });
    setInfoImage(null);
    return;
  }

  const title = tl(`app.info.title.${id}`);
  setInfoText({
    title,
    date: tl(`app.info.date.${id}`),
    material: tl(`app.info.material.${id}`),
    text: tl(`app.info.${id}`)
  });
  setInfoImage(CONF.contentImg(target), title);
}

function refreshInfo() {
  if (modals.info.isOpen()) {
    renderInfo(state.displayedId, { pin: state.pinned });
  }
}

function setInfoText({ title = "", date = "", material = "", text = "" }) {
  dom.infoTitle.textContent = title;
  dom.infoDate.textContent = date;
  dom.infoMat.textContent = material;
  dom.infoText.textContent = text;
}

function setInfoImage(url, alt) {
  const { infoImg, infoImgWrap } = dom;

  delete infoImg.dataset.loaded; // Hide the previous image immediately
  infoImg.removeAttribute("src");
  infoImg.onload = null;
  infoImgWrap.classList.toggle("hidden", !url); // Grey placeholder box

  if (!url) return;

  infoImg.alt = alt;
  infoImg.onload = () => {
    infoImg.dataset.loaded = "";
  };
  infoImg.src = url;
}

function preloadImage(url) {
  if (!url || preloaded.has(url)) return;
  const img = new Image();
  img.decoding = "async";
  img.src = url;
  img.decode?.().catch(() => {});
  preloaded.add(url);
}
