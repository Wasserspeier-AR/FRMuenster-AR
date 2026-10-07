import en from "./locales/en.json";
import de from "./locales/de.json";

const translations = { en, de };
const storage = "lang";

export function initI18n() {
  const lang = _getLang();
  document.documentElement.lang = lang;
  _applyTranslations(lang);
  _updateActiveLangButton(lang);

  document.querySelectorAll("[data-lang-switch]").forEach((btn) => {
    btn.addEventListener("click", () => {
      _setLang(btn.getAttribute("data-lang-switch"));
    });
  });
}

// Plain text (markers removed), e.g. for alerts or attributes
export function t(key) {
  const dict = translations[_getLang()] || translations.de;
  return _stripMarkup(dict[key] || key);
}

// HTML with <strong>/<em>, e.g. for el.innerHTML
export function tHtml(key) {
  const dict = translations[_getLang()] || translations.de;
  return _format(dict[key] || key);
}

function _getLang() {
  return localStorage.getItem(storage) || "de";
}

function _setLang(lang) {
  localStorage.setItem(storage, lang);
  _applyTranslations(lang);
  document.documentElement.lang = lang;
  _updateActiveLangButton(lang);
}

function _updateActiveLangButton(lang) {
  document.querySelectorAll("[data-lang-switch]").forEach((btn) => {
    btn.classList.toggle(
      "active",
      btn.getAttribute("data-lang-switch") === lang
    );
  });
}

function _join(dict, keyString) {
  return keyString
    .split("+")
    .map((k) => dict[k.trim()] ?? k.trim())
    .join("");
}

function _escape(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ***bold italic***, **bold**, *italic*
function _format(str) {
  return _escape(str)
    .replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>");
}

function _stripMarkup(str) {
  return str.replace(/\*{1,3}(.+?)\*{1,3}/g, "$1");
}

function _applyTranslations(lang) {
  const dict = translations[lang] || translations.de;

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    el.innerHTML = _format(_join(dict, el.getAttribute("data-i18n")));
  });

  // for placeholders, titles, etc. (attributes can't contain markup)
  document.querySelectorAll("[data-i18n-attr]").forEach((el) => {
    const [attr, keys] = el.getAttribute("data-i18n-attr").split(":");
    el.setAttribute(attr, _stripMarkup(_join(dict, keys)));
  });
}
