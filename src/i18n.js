import en from "./locales/en.json";
import de from "./locales/de.json";

const translations = { en, de };
const defaultLang = "de";
const storageKey = "lang";
const manualImages = import.meta.glob("./assets/manual/*.{avif,png}", {
  eager: true,
  query: "?url",
  import: "default"
});

let lang = pick(readStored());
let switchButtons = [];

export function initI18n() {
  switchButtons = [...document.querySelectorAll("[data-lang-switch]")];
  for (const btn of switchButtons) {
    btn.addEventListener("click", () => setLang(btn.dataset.langSwitch));
  }
  apply();
}

// Plain text (markers removed), e.g. for alerts, attributes or textContent
export const tl = (keys) => stripMarkup(lookup(keys));

// HTML with <strong>/<em>, e.g. for el.innerHTML
export const tHtml = (keys) => format(lookup(keys));

function setLang(next) {
  lang = pick(next);
  try {
    localStorage.setItem(storageKey, lang);
  } catch {} // storage can be blocked (private mode); the choice then lasts for this session only
  apply();
  document.dispatchEvent(new CustomEvent("langchange", { detail: lang }));
}

function manualUrl(step, ext) {
  const file = (l) => `./assets/manual/${l.toUpperCase()}_Anleitung_Schritt_${step}.${ext}`;
  return manualImages[file(lang)] ?? manualImages[file(defaultLang)];
}

function apply() {
  document.documentElement.lang = lang;

  for (const btn of switchButtons) {
    btn.classList.toggle("active", btn.dataset.langSwitch === lang);
  }

  for (const el of document.querySelectorAll("[data-i18n]")) {
    el.innerHTML = tHtml(el.dataset.i18n);
  }

  // Placeholders, titles, etc. Format: "title:key -> aria-label:key"
  for (const el of document.querySelectorAll("[data-i18n-attr]")) {
    for (const pair of el.dataset.i18nAttr.split(";")) {
      const [attr, keys] = pair.split(":");
      el.setAttribute(attr.trim(), tl(keys));
    }
  }

  for (const pic of document.querySelectorAll("picture[data-manual-step]")) {
      const step = pic.dataset.manualStep;
      const avif = manualUrl(step, "avif");
      const png = manualUrl(step, "png");
      const source = pic.querySelector("source[type='image/avif']");
      const img = pic.querySelector("img");
      if (source && avif) source.srcset = avif;
      if (img && png) img.src = png;
    }
}

function readStored() {
  try {
    return localStorage.getItem(storageKey);
  } catch {
    return null;
  }
}

function pick(candidate) {
  return Object.hasOwn(translations, candidate) ? candidate : defaultLang;
}

// "a.b + a.c" joins several keys. Missing keys fall back to the default language, then to the key itself.
function lookup(keys) {
  return keys
    .split("+")
    .map((k) => {
      const key = k.trim();
      return translations[lang][key] ?? translations[defaultLang][key] ?? key;
    })
    .join("");
}

const escapes = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;"
};

// ***bold italic***, **bold**, *italic*
function format(str) {
  return str
    .replace(/[&<>"']/g, (c) => escapes[c])
    .replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>");
}

function stripMarkup(str) {
  return str.replace(/\*{1,3}(.+?)\*{1,3}/g, "$1");
}
