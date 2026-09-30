/*! Floaty – YouTube Pop Out Player | (c) 2026 Floaty. All rights reserved. See LICENSE. */
// "Back to tab" button inside the floating window.
chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg?.type === 'floaty:focus' && sender.tab) {
    chrome.tabs.update(sender.tab.id, { active: true });
    chrome.windows.update(sender.tab.windowId, { focused: true });
  }
});

chrome.runtime.onInstalled.addListener(async ({ reason }) => {
  // First install: show the welcome page.
  if (reason === 'install') {
    chrome.tabs.create({ url: chrome.runtime.getURL('pages/welcome.html') });
  }
  // Install or update: make Floaty work in YouTube tabs that are already open.
  const tabs = await chrome.tabs.query({ url: 'https://www.youtube.com/*' });
  for (const t of tabs) {
    chrome.scripting.executeScript({ target: { tabId: t.id }, files: ['content.js'] }).catch(() => {});
  }
});

// Feedback form that opens when the user uninstalls Floaty.
// To auto-fill version and language, replace FORM_URL with the form's
// pre-filled link using VER and LANG as placeholders.
const FORM_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLSdY4vjsRZBuKh5bNx_KbRXF6KQVIdMLvJ_irSzGe9dJMg665A/viewform';

async function setUninstallForm() {
  let lang = chrome.i18n.getUILanguage();
  try {
    const saved = await chrome.storage.local.get('lang');
    if (saved.lang) lang = saved.lang;
  } catch {}
  const url = FORM_URL
    .replace('VER', encodeURIComponent(chrome.runtime.getManifest().version))
    .replace('LANG', encodeURIComponent(lang));
  chrome.runtime.setUninstallURL(url);
}
setUninstallForm();
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && 'lang' in changes) setUninstallForm();
});
