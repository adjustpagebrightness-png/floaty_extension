/*! Floaty – YouTube Pop Out Player | (c) 2026 Floaty. All rights reserved. See LICENSE. */
(async () => {
  const { msg, lang } = await floatyI18n;

  // ---- rating ----
  const STORE = `https://chromewebstore.google.com/detail/${chrome.runtime.id}/reviews`;
  const NS = 'http://www.w3.org/2000/svg';
  const STAR = 'M12 2.8l2.84 5.76 6.36.92-4.6 4.48 1.09 6.33L12 17.3l-5.69 2.99 1.09-6.33-4.6-4.48 6.36-.92z';
  const box = document.querySelector('.stars');
  document.querySelector('.rate h2').id = 'rateTitle';
  const stars = [];
  const light = (n) => stars.forEach((b, i) => b.classList.toggle('lit', i < n));
  for (let i = 1; i <= 5; i++) {
    const b = document.createElement('button');
    b.setAttribute('aria-label', `${i} / 5`);
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    const p = document.createElementNS(NS, 'path');
    p.setAttribute('d', STAR);
    p.setAttribute('stroke-linejoin', 'round');
    svg.appendChild(p);
    b.appendChild(svg);
    b.addEventListener('mouseenter', () => light(i));
    b.addEventListener('focus', () => light(i));
    b.addEventListener('click', () => {
      chrome.tabs.create({ url: STORE });
      window.close();
    });
    stars.push(b);
    box.appendChild(b);
  }
  box.addEventListener('mouseleave', () => light(0));

  // ---- language ----
  const select = document.getElementById('lang');
  const auto = document.createElement('option');
  auto.value = '';
  auto.textContent = `${msg('langAuto')} (${FLOATY_LANGS[floatyBrowserLocale()]})`;
  select.appendChild(auto);
  const codes = Object.keys(FLOATY_LANGS).sort((a, b) =>
    a === 'en' ? -1 : b === 'en' ? 1 : FLOATY_LANGS[a].localeCompare(FLOATY_LANGS[b])
  );
  for (const code of codes) {
    const o = document.createElement('option');
    o.value = code;
    o.textContent = FLOATY_LANGS[code];
    select.appendChild(o);
  }
  select.value = lang || '';

  select.addEventListener('change', async () => {
    const code = select.value;
    if (!code) {
      await chrome.storage.local.remove(['lang', 'messages']);
    } else {
      const res = await fetch(chrome.runtime.getURL(`_locales/${code}/messages.json`));
      const raw = await res.json();
      const messages = Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, v.message]));
      await chrome.storage.local.set({ lang: code, messages });
    }
    location.reload();
  });
})();
