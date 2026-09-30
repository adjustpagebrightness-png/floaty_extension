/*! Floaty – YouTube Pop Out Player | (c) 2026 Floaty. All rights reserved. See LICENSE. */
// Shared by the popup and the welcome page.
// If the user picked a language in the popup, its messages are kept in
// chrome.storage.local; otherwise Chrome's own language is used.
const FLOATY_LANGS = {
  en: 'English', tr: 'Türkçe', de: 'Deutsch', fr: 'Français', es: 'Español (España)',
  es_419: 'Español (Latinoamérica)', pt_BR: 'Português (Brasil)', pt_PT: 'Português (Portugal)',
  it: 'Italiano', nl: 'Nederlands', pl: 'Polski', ru: 'Русский', uk: 'Українська', ja: '日本語',
  ko: '한국어', zh_CN: '中文（简体）', zh_TW: '中文（繁體）', ar: 'العربية', he: 'עברית', fa: 'فارسی',
  hi: 'हिन्दी', bn: 'বাংলা', mr: 'मराठी', gu: 'ગુજરાતી', ta: 'தமிழ்', te: 'తెలుగు', kn: 'ಕನ್ನಡ',
  ml: 'മലയാളം', am: 'አማርኛ', sw: 'Kiswahili', fil: 'Filipino', id: 'Bahasa Indonesia',
  ms: 'Bahasa Melayu', vi: 'Tiếng Việt', th: 'ไทย', bg: 'Български', ca: 'Català', cs: 'Čeština',
  sk: 'Slovenčina', da: 'Dansk', no: 'Norsk', sv: 'Svenska', fi: 'Suomi', et: 'Eesti',
  lv: 'Latviešu', lt: 'Lietuvių', hu: 'Magyar', ro: 'Română', hr: 'Hrvatski', sr: 'Српски',
  sl: 'Slovenščina', el: 'Ελληνικά',
};
const FLOATY_RTL = ['ar', 'he', 'fa'];

// Maps Chrome's UI language ("en-US", "pt-BR", "zh-TW") to one of our locales.
function floatyBrowserLocale() {
  const ui = chrome.i18n.getUILanguage().replace('-', '_');
  if (FLOATY_LANGS[ui]) return ui;
  const base = ui.split('_')[0];
  if (base === 'zh') return 'zh_CN';
  if (base === 'nb' || base === 'nn') return 'no';
  if (base === 'es') return 'es_419';
  if (base === 'pt') return 'pt_BR';
  return FLOATY_LANGS[base] ? base : 'en';
}

const floatyI18n = (async () => {
  let saved = {};
  try { saved = await chrome.storage.local.get(['lang', 'messages']); } catch {}
  const override = saved.messages || null;
  const lang = saved.lang || null;
  const msg = (k) => (override && override[k]) || chrome.i18n.getMessage(k);

  const root = document.documentElement;
  const active = lang || floatyBrowserLocale();
  root.lang = active.replace('_', '-');
  root.dir = FLOATY_RTL.includes(active.split('_')[0]) ? 'rtl' : 'ltr';

  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const v = msg(el.dataset.i18n);
    if (v) el.textContent = v;
  });
  document.querySelectorAll('[data-i18n-label]').forEach((el) => {
    const v = msg(el.dataset.i18nLabel);
    if (v) el.setAttribute('aria-label', v);
  });
  return { msg, lang };
})();
