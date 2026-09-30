/*! Floaty – YouTube Pop Out Player | (c) 2026 Floaty. All rights reserved. See LICENSE. */
(() => {
  'use strict';

  // If an older copy of this script is still around (e.g. after an update),
  // take ownership so only this instance reacts to clicks and shortcuts.
  const ME = Symbol('floaty');
  window.__floatyOwner = ME;
  const isOwner = () => window.__floatyOwner === ME;
  document.querySelectorAll('.floaty-yt-btn').forEach((b) => b.remove());

  const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3];
  const SVGNS = 'http://www.w3.org/2000/svg';
  const HONEY = '#FFC24B';

  // Language picked in the popup (stored as a full message table), else Chrome's language.
  let override = null;
  const t = (key, fallback) => {
    try {
      return (override && override[key]) || chrome.i18n.getMessage(key) || fallback;
    } catch {
      return fallback;
    }
  };
  function relabelPlayerButton() {
    const b = document.querySelector('.floaty-yt-btn');
    if (!b) return;
    const label = t('btnPlayer', 'Pop out with Floaty (Alt+P)');
    b.setAttribute('aria-label', label);
    b.title = label;
  }
  try {
    chrome.storage.local.get('messages').then((r) => {
      override = r.messages || null;
      relabelPlayerButton();
    }).catch(() => {});
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'local' && 'messages' in changes) {
        override = changes.messages.newValue || null;
        relabelPlayerButton();
      }
    });
  } catch {}

  const ICONS = {
    play: { d: 'M8 5v14l11-7z' },
    pause: { d: 'M6 19h4V5H6v14zm8-14v14h4V5h-4z' },
    prev: { d: 'M6 6h2v12H6zm3.5 6l8.5 6V6z' },
    next: { d: 'M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z' },
    back10: {
      d: 'M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z',
      label: '10',
    },
    fwd10: {
      d: 'M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z',
      label: '10',
      flip: true,
    },
    loop: { d: 'M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z' },
    vol: {
      d: 'M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z',
    },
    mute: {
      d: 'M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z',
    },
    tab: {
      d: 'M19 19H5V5h7V3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z',
    },
    pip: {
      d: 'M19 7h-8v6h8V7zm2-4H3c-1.1 0-2 .9-2 2v14c0 1.1.9 1.98 2 1.98h18c1.1 0 2-.88 2-1.98V5c0-1.1-.9-2-2-2zm0 16.01H3V4.98h18v14.03z',
    },
  };

  // ---------- helpers (no innerHTML: YouTube enforces Trusted Types) ----------

  function el(doc, tag, props = {}, children = []) {
    const n = doc.createElement(tag);
    for (const [k, v] of Object.entries(props)) {
      if (k === 'class') n.className = v;
      else if (k === 'text') n.textContent = v;
      else if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
      else n.setAttribute(k, v);
    }
    for (const c of children) if (c) n.appendChild(c);
    return n;
  }

  function icon(doc, name) {
    const def = ICONS[name];
    const svg = doc.createElementNS(SVGNS, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('aria-hidden', 'true');
    const p = doc.createElementNS(SVGNS, 'path');
    p.setAttribute('d', def.d);
    if (def.flip) p.setAttribute('transform', 'translate(24 0) scale(-1 1)');
    svg.appendChild(p);
    if (def.label) {
      const tx = doc.createElementNS(SVGNS, 'text');
      tx.setAttribute('x', '12');
      tx.setAttribute('y', '15.4');
      tx.setAttribute('text-anchor', 'middle');
      tx.setAttribute('font-size', '6.5');
      tx.setAttribute('font-weight', '700');
      tx.setAttribute('font-family', 'system-ui, sans-serif');
      tx.textContent = def.label;
      svg.appendChild(tx);
    }
    return svg;
  }

  const fmt = (s) => {
    if (!isFinite(s) || s < 0) return '0:00';
    s = Math.floor(s);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = String(s % 60).padStart(2, '0');
    return h ? `${h}:${String(m).padStart(2, '0')}:${sec}` : `${m}:${sec}`;
  };

  const fmtSpeed = (r) => `${Math.round(r * 100) / 100}×`;

  function getVideo() {
    return (
      document.querySelector('#movie_player video.html5-main-video') ||
      document.querySelector('#movie_player video') ||
      document.querySelector('video')
    );
  }

  function getTitle() {
    const h = document.querySelector('ytd-watch-metadata h1, #title h1');
    const txt = h?.textContent?.trim();
    if (txt) return txt;
    return document.title.replace(/^\(\d+\)\s*/, '').replace(/ - YouTube$/, '').trim();
  }

  function toast(text) {
    let n = document.getElementById('floaty-toast');
    if (!n) {
      n = document.createElement('div');
      n.id = 'floaty-toast';
      n.setAttribute('role', 'status');
      n.style.cssText =
        'position:fixed;left:50%;bottom:32px;transform:translateX(-50%);z-index:2147483647;' +
        'background:#1f1f1f;color:#fff;padding:10px 16px;border-radius:10px;' +
        'font:500 14px/1.4 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;' +
        'box-shadow:0 6px 24px rgba(0,0,0,.35);max-width:90vw;';
      document.documentElement.appendChild(n);
    }
    n.textContent = text;
    clearTimeout(n.__floatyTimer);
    n.__floatyTimer = setTimeout(() => n.remove(), 3500);
  }

  // ---------- open / close ----------

  let pip = null;

  async function openFloaty() {
    if (pip) {
      pip.win.close();
      return;
    }
    const video = getVideo();
    if (!video || !(video.currentSrc || video.src)) {
      toast(t('toastNoVideo', 'Open a YouTube video first.'));
      return;
    }
    if (!('documentPictureInPicture' in window)) {
      nativeFallback(video);
      return;
    }
    if (document.pictureInPictureElement) {
      await document.exitPictureInPicture().catch(() => {});
    }
    const ratio =
      video.videoWidth && video.videoHeight ? video.videoHeight / video.videoWidth : 9 / 16;
    const width = 480;
    let win;
    try {
      win = await window.documentPictureInPicture.requestWindow({
        width,
        height: Math.round(width * ratio),
      });
    } catch {
      nativeFallback(video);
      return;
    }
    mount(win, video);
  }

  async function nativeFallback(video) {
    try {
      await video.requestPictureInPicture();
    } catch {
      toast(t('toastNeedClick', 'Click the Floaty button in the player or press Alt+P.'));
    }
  }

  function unmount() {
    if (!pip) return;
    const { video, placeholder, offs } = pip;
    offs.forEach((off) => off());
    const wasPlaying = !video.paused;
    if (placeholder.isConnected) {
      placeholder.replaceWith(video);
    } else {
      const box = document.querySelector('#movie_player .html5-video-container');
      if (box) box.prepend(video);
    }
    if (wasPlaying) video.play().catch(() => {});
    pip = null;
    setPlayerButtonState(false);
  }

  // ---------- the floating window ----------

  function mount(win, video) {
    const doc = win.document;
    const offs = [];
    const on = (target, type, fn, opts) => {
      target.addEventListener(type, fn, opts);
      offs.push(() => target.removeEventListener(type, fn, opts));
    };

    const placeholder = document.createElement('div');
    placeholder.className = 'floaty-placeholder';
    placeholder.style.cssText =
      'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;' +
      'background:#000;color:rgba(255,255,255,.8);z-index:1;' +
      'font:500 16px/1.4 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;';
    placeholder.textContent = t('placeholder', 'Playing in the Floaty window');

    pip = {
      win,
      video,
      placeholder,
      offs,
      desired: video.playbackRate,
      lockUntil: 0,
      loop: video.loop,
      ab: { a: null, b: null },
    };

    // --- styles ---
    const style = doc.createElement('style');
    style.textContent = `
      :root { --honey: ${HONEY}; color-scheme: dark; }
      * { box-sizing: border-box; }
      html, body { margin: 0; height: 100%; background: #000; overflow: hidden; color: #fff;
        font: 13px/1.3 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; user-select: none; }
      video { position: absolute !important; inset: 0 !important; left: 0 !important; top: 0 !important;
        width: 100% !important; height: 100% !important; object-fit: contain !important; }
      .ui { position: absolute; inset: 0; display: flex; flex-direction: column; transition: opacity .2s; }
      .ui.idle { opacity: 0; cursor: none; }
      .top { padding: 10px 12px 28px; background: linear-gradient(rgba(0,0,0,.65), transparent);
        font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .mid { flex: 1; }
      .bottom { position: relative; padding: 30px 8px 6px; background: linear-gradient(transparent, rgba(0,0,0,.8)); }
      .seek { display: flex; align-items: center; gap: 8px; padding: 0 4px; }
      .time { font-variant-numeric: tabular-nums; color: rgba(255,255,255,.8); font-size: 12px; min-width: 36px; }
      .time.end { text-align: right; }
      .track { position: relative; flex: 1; height: 16px; display: flex; align-items: center; }
      .band { position: absolute; top: 50%; height: 8px; transform: translateY(-50%); border-radius: 4px;
        background: rgba(255,194,75,.5); pointer-events: none; display: none; }
      input[type=range] { -webkit-appearance: none; appearance: none; width: 100%; height: 4px; margin: 0;
        border-radius: 2px; cursor: pointer; position: relative;
        background: linear-gradient(to right, #fff var(--p, 0%), rgba(255,255,255,.28) var(--p, 0%)); }
      input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 12px; height: 12px;
        border-radius: 50%; background: #fff; border: 0; }
      input[type=range]:focus-visible { outline: 2px solid var(--honey); outline-offset: 4px; }
      .row { display: flex; align-items: center; justify-content: space-between; margin-top: 4px; }
      .grp { display: flex; align-items: center; gap: 2px; }
      button { all: unset; box-sizing: border-box; display: grid; place-items: center; width: 32px; height: 32px;
        border-radius: 8px; color: #fff; cursor: pointer; }
      button:hover { background: rgba(255,255,255,.14); }
      button:focus-visible { outline: 2px solid var(--honey); outline-offset: 1px; }
      button.on { color: var(--honey); }
      svg { width: 20px; height: 20px; fill: currentColor; }
      svg text { fill: currentColor; }
      .play { width: 38px; height: 38px; }
      .play svg { width: 26px; height: 26px; }
      .speed { width: auto; min-width: 44px; padding: 0 9px; height: 26px; border-radius: 13px;
        font-weight: 700; font-variant-numeric: tabular-nums; border: 1.5px solid rgba(255,255,255,.55); }
      .speed.changed { background: var(--honey); border-color: var(--honey); color: #211600; }
      .speed.changed:hover { background: #ffd27a; }
      .ab { width: auto; padding: 0 7px; font-weight: 700; font-size: 12px; }
      .vol { display: flex; align-items: center; }
      .vol input { width: 0; opacity: 0; transition: width .15s, opacity .15s; }
      .vol:hover input, .vol:focus-within input { width: 64px; opacity: 1; margin: 0 6px 0 2px; }
      .menu { position: absolute; right: 8px; bottom: 50px; display: none; flex-wrap: wrap; gap: 4px;
        max-width: 228px; padding: 6px; border-radius: 12px; background: rgba(24,24,24,.94); }
      .menu.open { display: flex; }
      .menu button { width: auto; height: 28px; padding: 0 9px; font-size: 12px; font-weight: 600;
        font-variant-numeric: tabular-nums; }
      .menu button.sel { background: var(--honey); color: #211600; }
      .flash { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); padding: 8px 16px;
        border-radius: 999px; background: rgba(0,0,0,.65); font-weight: 700; font-size: 18px;
        opacity: 0; transition: opacity .15s; pointer-events: none; white-space: nowrap; }
      .flash.show { opacity: 1; }
      @media (max-width: 380px) { .hide-sm { display: none; } }
      @media (max-width: 300px) { .hide-xs { display: none; } .time { display: none; } }
      @media (prefers-reduced-motion: reduce) { .ui, .flash, .vol input { transition: none; } }
    `;
    doc.head.appendChild(style);

    // --- elements ---
    const btn = (name, label, onclick, cls = '') => {
      const b = el(doc, 'button', { class: cls, 'aria-label': label, title: label, onclick });
      b.appendChild(icon(doc, name));
      return b;
    };
    const setIcon = (b, name) => b.replaceChildren(icon(doc, name));

    const titleEl = el(doc, 'div', { class: 'top', text: getTitle() });
    const mid = el(doc, 'div', { class: 'mid' });

    const cur = el(doc, 'span', { class: 'time', text: '0:00' });
    const dur = el(doc, 'span', { class: 'time end', text: '0:00' });
    const seek = el(doc, 'input', {
      type: 'range', min: '0', max: '0', step: '0.1', value: '0', 'aria-label': t('seek', 'Seek'),
    });
    const band = el(doc, 'div', { class: 'band' });
    const track = el(doc, 'div', { class: 'track' }, [seek, band]);

    const prevBtn = btn('prev', t('prev', 'Previous'), () => prev(), 'hide-sm');
    const backBtn = btn('back10', t('back10', 'Back 10 seconds'), () => skip(-10));
    const playBtn = btn('play', t('play', 'Play'), () => togglePlay(), 'play');
    const fwdBtn = btn('fwd10', t('fwd10', 'Forward 10 seconds'), () => skip(10));
    const nextBtn = btn('next', t('next', 'Next'), () => next(), 'hide-sm');

    const speedBtn = el(doc, 'button', {
      class: 'speed', 'aria-label': t('speed', 'Playback speed'), title: t('speed', 'Playback speed'),
      'aria-haspopup': 'true', 'aria-expanded': 'false',
      onclick: () => toggleMenu(),
    });
    const menu = el(doc, 'div', { class: 'menu', role: 'menu' });
    const menuBtns = SPEEDS.map((s) =>
      el(doc, 'button', {
        role: 'menuitemradio', text: fmtSpeed(s),
        onclick: () => { setSpeed(s); toggleMenu(false); },
      })
    );
    menuBtns.forEach((b) => menu.appendChild(b));

    const abBtn = el(doc, 'button', {
      class: 'ab hide-sm', text: 'A-B', 'aria-label': t('abLoop', 'A-B loop'), title: t('abLoop', 'A-B loop'),
      onclick: () => cycleAB(),
    });
    const loopBtn = btn('loop', t('loop', 'Loop'), () => toggleLoop(), 'hide-xs');
    const volBtn = btn('vol', t('mute', 'Mute'), () => toggleMute());
    const volSlider = el(doc, 'input', {
      type: 'range', min: '0', max: '1', step: '0.01', 'aria-label': t('volume', 'Volume'),
    });
    const vol = el(doc, 'div', { class: 'vol' }, [volBtn, volSlider]);
    const tabBtn = btn('tab', t('backToTab', 'Back to tab'), () => backToTab(), 'hide-xs');

    const bottom = el(doc, 'div', { class: 'bottom' }, [
      el(doc, 'div', { class: 'seek' }, [cur, track, dur]),
      el(doc, 'div', { class: 'row' }, [
        el(doc, 'div', { class: 'grp' }, [prevBtn, backBtn, playBtn, fwdBtn, nextBtn]),
        el(doc, 'div', { class: 'grp' }, [speedBtn, abBtn, loopBtn, vol, tabBtn]),
      ]),
      menu,
    ]);
    const flashEl = el(doc, 'div', { class: 'flash', 'aria-live': 'polite' });
    const ui = el(doc, 'div', { class: 'ui' }, [titleEl, mid, bottom]);

    // Move the real <video> into the floating window.
    const wasPlaying = !video.paused;
    video.replaceWith(placeholder);
    doc.title = getTitle();
    doc.body.append(video, ui, flashEl);
    if (wasPlaying) video.play().catch(() => {});

    // --- actions ---
    let flashT;
    function flash(text) {
      flashEl.textContent = text;
      flashEl.classList.add('show');
      win.clearTimeout(flashT);
      flashT = win.setTimeout(() => flashEl.classList.remove('show'), 700);
    }

    function togglePlay() {
      if (video.paused) video.play().catch(() => {});
      else video.pause();
    }

    function skip(sec) {
      const d = isFinite(video.duration) ? video.duration : Infinity;
      video.currentTime = Math.min(d, Math.max(0, video.currentTime + sec));
      flash(sec > 0 ? `+${sec} s` : `−${Math.abs(sec)} s`);
    }

    const ytButtonVisible = (sel) => {
      const b = document.querySelector(sel);
      return b && getComputedStyle(b).display !== 'none' ? b : null;
    };

    function next() {
      const b = ytButtonVisible('#movie_player .ytp-next-button');
      if (b) b.click();
    }

    function prev() {
      const b = ytButtonVisible('#movie_player .ytp-prev-button');
      if (video.currentTime > 3 || !b) video.currentTime = 0;
      else b.click();
    }

    function setSpeed(s) {
      s = Math.min(3, Math.max(0.25, Math.round(s * 100) / 100));
      pip.desired = s;
      video.playbackRate = s;
      flash(fmtSpeed(s));
    }

    function stepSpeed(dir) {
      const r = video.playbackRate;
      const target =
        dir > 0
          ? SPEEDS.find((s) => s > r + 0.001) ?? SPEEDS[SPEEDS.length - 1]
          : [...SPEEDS].reverse().find((s) => s < r - 0.001) ?? SPEEDS[0];
      setSpeed(target);
    }

    let menuOpen = false;
    function toggleMenu(force) {
      menuOpen = force ?? !menuOpen;
      menu.classList.toggle('open', menuOpen);
      speedBtn.setAttribute('aria-expanded', String(menuOpen));
      if (menuOpen) (menuBtns.find((b) => b.classList.contains('sel')) || menuBtns[2]).focus();
    }

    function toggleLoop() {
      pip.loop = !pip.loop;
      video.loop = pip.loop;
      flash(pip.loop ? t('loopOn', 'Loop on') : t('loopOff', 'Loop off'));
      render();
    }

    function cycleAB() {
      const ab = pip.ab;
      if (ab.a == null) {
        ab.a = video.currentTime;
        flash(t('flashA', 'A set — press again at B'));
      } else if (ab.b == null) {
        if (video.currentTime < ab.a + 0.5) {
          flash(t('flashABShort', 'Play past point A first'));
          return;
        }
        ab.b = video.currentTime;
        video.currentTime = ab.a;
        flash(t('flashABOn', 'A-B loop on'));
      } else {
        ab.a = ab.b = null;
        flash(t('flashABOff', 'A-B loop off'));
      }
      render();
    }

    function toggleMute() {
      if (video.muted || video.volume === 0) {
        video.muted = false;
        if (video.volume === 0) video.volume = 0.5;
      } else {
        video.muted = true;
      }
    }

    function nudgeVolume(delta) {
      video.muted = false;
      video.volume = Math.min(1, Math.max(0, Math.round((video.volume + delta) * 100) / 100));
      flash(`${Math.round(video.volume * 100)}%`);
    }

    function backToTab() {
      try { chrome.runtime.sendMessage({ type: 'floaty:focus' }); } catch {}
      win.close();
    }

    // --- rendering ---
    let seeking = false;
    function renderTime() {
      const d = isFinite(video.duration) ? video.duration : 0;
      seek.max = String(d || 0);
      if (!seeking) seek.value = String(video.currentTime);
      seek.style.setProperty('--p', d ? `${(video.currentTime / d) * 100}%` : '0%');
      cur.textContent = fmt(video.currentTime);
      dur.textContent = fmt(d);
      renderBand(d);
    }

    function renderBand(d) {
      const { a, b } = pip.ab;
      if (a == null || !d) {
        band.style.display = 'none';
        return;
      }
      const end = b ?? video.currentTime;
      band.style.display = 'block';
      band.style.left = `${(a / d) * 100}%`;
      band.style.width = `max(3px, ${((end - a) / d) * 100}%)`;
    }

    function render() {
      const playing = !video.paused;
      setIcon(playBtn, playing ? 'pause' : 'play');
      const pl = playing ? t('pause', 'Pause') : t('play', 'Play');
      playBtn.setAttribute('aria-label', pl);
      playBtn.title = pl;

      const r = video.playbackRate;
      speedBtn.textContent = fmtSpeed(r);
      speedBtn.classList.toggle('changed', Math.abs(r - 1) > 0.001);
      menuBtns.forEach((b, i) => {
        const sel = Math.abs(SPEEDS[i] - r) < 0.001;
        b.classList.toggle('sel', sel);
        b.setAttribute('aria-checked', String(sel));
      });

      loopBtn.classList.toggle('on', pip.loop);
      loopBtn.setAttribute('aria-pressed', String(pip.loop));

      const { a, b } = pip.ab;
      abBtn.textContent = a != null && b == null ? 'A…' : 'A-B';
      abBtn.classList.toggle('on', a != null);

      const muted = video.muted || video.volume === 0;
      setIcon(volBtn, muted ? 'mute' : 'vol');
      const vl = muted ? t('unmute', 'Unmute') : t('mute', 'Mute');
      volBtn.setAttribute('aria-label', vl);
      volBtn.title = vl;
      volSlider.value = String(muted ? 0 : video.volume);
      volSlider.style.setProperty('--p', `${(muted ? 0 : video.volume) * 100}%`);

      renderTime();
    }

    // --- idle auto-hide ---
    let idleT;
    function wake() {
      ui.classList.remove('idle');
      win.clearTimeout(idleT);
      idleT = win.setTimeout(() => {
        if (!video.paused && !menuOpen && !bottom.matches(':hover')) ui.classList.add('idle');
      }, 2200);
    }

    // --- events ---
    on(seek, 'input', () => {
      seeking = true;
      video.currentTime = Number(seek.value);
      renderTime();
    });
    on(seek, 'change', () => { seeking = false; });
    on(volSlider, 'input', () => {
      const v = Number(volSlider.value);
      video.volume = v;
      video.muted = v === 0;
    });
    on(speedBtn, 'wheel', (e) => {
      e.preventDefault();
      stepSpeed(e.deltaY < 0 ? 1 : -1);
    }, { passive: false });
    on(mid, 'click', () => { if (menuOpen) toggleMenu(false); else togglePlay(); });
    on(mid, 'dblclick', (e) => e.preventDefault());
    on(doc, 'mousemove', wake);
    on(doc, 'mouseleave', () => {
      if (!video.paused && !menuOpen) ui.classList.add('idle');
    });

    on(doc, 'keydown', (e) => {
      wake();
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const k = e.key;
      if (e.target.type === 'range' && k.startsWith('Arrow')) return;
      let handled = true;
      if (k === ' ' || k === 'k') togglePlay();
      else if (k === 'ArrowLeft' || k === 'j') skip(-10);
      else if (k === 'ArrowRight' || k === 'l') skip(10);
      else if (k === 'ArrowUp') nudgeVolume(0.05);
      else if (k === 'ArrowDown') nudgeVolume(-0.05);
      else if (k === 'm') toggleMute();
      else if (k === '<' || k === '[' || k === '-') stepSpeed(-1);
      else if (k === '>' || k === ']' || k === '+' || k === '=') stepSpeed(1);
      else if (k === 'r') toggleLoop();
      else if (k === 'a') cycleAB();
      else if (k === 'N') next();
      else if (k === 'P') prev();
      else if (k === 'Escape' && menuOpen) toggleMenu(false);
      else handled = false;
      if (handled) e.preventDefault();
    });

    on(video, 'play', () => { render(); wake(); });
    on(video, 'pause', () => { render(); wake(); });
    on(video, 'timeupdate', renderTime);
    on(video, 'durationchange', renderTime);
    on(video, 'volumechange', render);
    on(video, 'ratechange', () => {
      // YouTube resets speed to 1× when the next video loads; keep the user's choice.
      if (performance.now() < pip.lockUntil && Math.abs(video.playbackRate - pip.desired) > 0.001) {
        video.playbackRate = pip.desired;
        return;
      }
      pip.desired = video.playbackRate;
      render();
    });
    on(video, 'loadstart', () => {
      pip.lockUntil = performance.now() + 3000;
      pip.ab.a = pip.ab.b = null;
    });
    on(video, 'loadedmetadata', () => {
      video.loop = pip.loop;
      if (Math.abs(video.playbackRate - pip.desired) > 0.001) video.playbackRate = pip.desired;
      win.setTimeout(updateTitle, 400);
      render();
    });

    function updateTitle() {
      titleEl.textContent = getTitle();
      doc.title = titleEl.textContent;
    }
    on(document, 'yt-navigate-finish', () => setTimeout(updateTitle, 400));

    // A-B watcher runs on the floating window's timer, which isn't throttled
    // when the YouTube tab is in the background.
    const abTimer = win.setInterval(() => {
      const { a, b } = pip?.ab || {};
      if (a != null && b != null && video.currentTime >= b) video.currentTime = a;
    }, 100);
    offs.push(() => win.clearInterval(abTimer));

    win.addEventListener('pagehide', unmount, { once: true });

    render();
    wake();
    setPlayerButtonState(true);
  }

  // ---------- button inside YouTube's player ----------

  function setPlayerButtonState(active) {
    const b = document.querySelector('.floaty-yt-btn');
    if (!b) return;
    b.setAttribute('aria-pressed', String(active));
    b.style.color = active ? HONEY : '';
  }

  function ensurePlayerButton() {
    if (!isOwner()) return;
    const right = document.querySelector('#movie_player .ytp-right-controls');
    if (!right || right.querySelector('.floaty-yt-btn')) return;
    const label = t('btnPlayer', 'Pop out with Floaty (Alt+P)');
    const b = document.createElement('button');
    b.className = 'ytp-button floaty-yt-btn';
    b.setAttribute('aria-label', label);
    b.setAttribute('aria-pressed', String(!!pip));
    b.title = label;
    b.style.cssText = 'display:inline-flex;align-items:center;justify-content:center;';
    const svg = icon(document, 'pip');
    svg.style.cssText = 'width:24px;height:24px;fill:currentColor;';
    b.appendChild(svg);
    b.addEventListener('click', (e) => {
      e.stopPropagation();
      openFloaty();
    });
    right.insertBefore(b, right.firstChild);
    setPlayerButtonState(!!pip);
  }

  ensurePlayerButton();
  setInterval(ensurePlayerButton, 2000);
  document.addEventListener('yt-navigate-finish', () => setTimeout(ensurePlayerButton, 300));

  // ---------- shortcuts & messages ----------

  document.addEventListener(
    'keydown',
    (e) => {
      if (!isOwner()) return;
      if (e.altKey && !e.ctrlKey && !e.metaKey && e.code === 'KeyP') {
        e.preventDefault();
        e.stopPropagation();
        openFloaty();
      }
    },
    true
  );
})();
