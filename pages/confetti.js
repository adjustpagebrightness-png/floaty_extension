/*! Floaty – YouTube Pop Out Player | (c) 2026 Floaty. All rights reserved. See LICENSE. */
// One celebratory burst when the welcome page opens. No libraries.
(() => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const canvas = document.getElementById('confetti');
  const ctx = canvas.getContext('2d');
  const COLORS = ['#FFC24B', '#211600', '#FFFFFF', '#FF6B6B', '#4DD4AC', '#5B8DEF', '#FFE08A'];
  let W = 0, H = 0;

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    W = innerWidth; H = innerHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  addEventListener('resize', resize);

  const parts = [];
  const rnd = (a, b) => a + Math.random() * (b - a);

  function piece(x, y, vx, vy) {
    parts.push({
      x, y, vx, vy,
      w: rnd(6, 11), h: rnd(8, 16),
      rot: rnd(0, Math.PI * 2), vr: rnd(-0.25, 0.25),
      tilt: rnd(0, Math.PI * 2), vt: rnd(0.06, 0.16),
      color: COLORS[(Math.random() * COLORS.length) | 0],
      round: Math.random() < 0.2,
    });
  }

  function cannon(x, y, angle, count) {
    for (let i = 0; i < count; i++) {
      const a = angle + rnd(-0.45, 0.45);
      const v = rnd(11, 21);
      piece(x, y, Math.cos(a) * v, Math.sin(a) * v);
    }
  }

  function rain(count) {
    for (let i = 0; i < count; i++) piece(rnd(0, W), rnd(-80, -10), rnd(-1.5, 1.5), rnd(1, 4));
  }

  cannon(0, H * 0.8, -Math.PI / 3, 110);
  cannon(W, H * 0.8, (-2 * Math.PI) / 3, 110);
  setTimeout(() => rain(90), 450);

  function frame() {
    ctx.clearRect(0, 0, W, H);
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.vx *= 0.985; p.vy = p.vy * 0.985 + 0.32;
      p.x += p.vx + Math.sin(p.tilt) * 0.6; p.y += p.vy;
      p.rot += p.vr; p.tilt += p.vt;
      if (p.y > H + 40) { parts.splice(i, 1); continue; }
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.scale(1, Math.cos(p.tilt));
      ctx.fillStyle = p.color;
      if (p.round) { ctx.beginPath(); ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2); ctx.fill(); }
      else ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    }
    if (parts.length) requestAnimationFrame(frame);
    else { ctx.clearRect(0, 0, W, H); canvas.remove(); }
  }
  requestAnimationFrame(frame);
})();
