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

export function t(key) {
  const dict = translations[_getLang()] || translations.de;
  return dict[key] || key;
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

function _applyTranslations(lang) {
  const dict = translations[lang] || translations.de;

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    el.textContent = _join(dict, el.getAttribute("data-i18n"));
  });

  // for placeholders, titles, etc.
  document.querySelectorAll("[data-i18n-attr]").forEach((el) => {
    const [attr, keys] = el.getAttribute("data-i18n-attr").split(":");
    el.setAttribute(attr, _join(dict, keys));
  });
}
