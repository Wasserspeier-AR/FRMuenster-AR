import en from './locales/en.json';
import de from './locales/de.json';

const translations = { en, de };
const STORAGE_KEY = 'lang';

function getLang() {
  return localStorage.getItem(STORAGE_KEY) || 'de';
}

function setLang(lang) {
  localStorage.setItem(STORAGE_KEY, lang);
  applyTranslations(lang);
  document.documentElement.lang = lang;
}

function applyTranslations(lang) {
  const dict = translations[lang] || translations.de;

  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    if (dict[key]) el.textContent = dict[key];
  });

  // for placeholders, titles, etc.
  document.querySelectorAll('[data-i18n-attr]').forEach((el) => {
    const [attr, key] = el.getAttribute('data-i18n-attr').split(':');
    if (dict[key]) el.setAttribute(attr, dict[key]);
  });
}

export function initI18n() {
  const lang = getLang();
  document.documentElement.lang = lang;
  applyTranslations(lang);

  document.querySelectorAll('[data-lang-switch]').forEach((btn) => {
    btn.addEventListener('click', () => {
      setLang(btn.getAttribute('data-lang-switch'));
    });
  });
}