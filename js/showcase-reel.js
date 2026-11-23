/* LTSS Showcase Reel — canvas animation for "Who We Are" section */
(function () {
  const el = document.getElementById('ltss-reel');
  if (!el) return;

  /* ---- image catalogue (slug → sample count) ---- */
  const CATS = [
    {
      name: 'Laser Marking',
      sub: 'Fiber · CO₂ · UV · 360° · Desktop',
      images: [
        'images/samples/360-degree-laser-marking-machine-sample-1.jpg',
        'images/samples/360-degree-laser-marking-machine-sample-3.jpg',
        'images/samples/desktop-laser-marking-machine-sample-1.jpg',
        'images/samples/desktop-laser-marking-machine-sample-2.jpg',
        'images/samples/handheld-laser-marking-machine-sample-1.jpg',
        'images/samples/uv-laser-marking-machine-sample-1.jpg',
      ]
    },
    {
      name: 'Laser Welding',
      sub: 'Handheld · 3-in-1 · Air Cooled · Jewellery',
      images: [
        'images/samples/handheld-laser-welding-machine-sample-1.jpg',
        'images/samples/handheld-laser-welding-machine-sample-2.jpg',
        'images/samples/3in1-laser-welding-machine-sample-1.jpg',
        'images/samples/air-cooled-laser-welding-machine-sample-1.jpg',
        'images/samples/jewellery-laser-welding-machine-sample-1.jpg',
        'images/samples/3in1-laser-welding-machine-sample-3.jpg',
      ]
    },
    {
      name: 'Laser Cutting',
      sub: 'Sheet · Tube · Sheet-and-Tube',
      images: [
        'images/samples/sheet-metal-cutting-machine-sample-1.jpg',
        'images/samples/sheet-metal-cutting-machine-sample-2.jpg',
        'images/samples/sheet-and-tube-cutting-machine-sample-1.jpg',
        'images/samples/metal-tube-cutting-machine-sample-1.jpg',
        'images/samples/sheet-metal-cutting-machine-sample-3.jpg',
        'images/samples/sheet-and-tube-cutting-machine-sample-2.jpg',
      ]
    },
    {
      name: 'Laser Cleaning',
      sub: 'CW · Pulse — rust, paint, oxide removal',
      images: [
        'images/samples/cw-laser-cleaning-machine-sample-1.jpg',
        'images/samples/cw-laser-cleaning-machine-sample-3.jpg',
        'images/samples/cw-laser-cleaning-machine-sample-5.jpg',
        'images/samples/pulse-laser-cleaning-machine-sample-1.jpg',
        'images/samples/cw-laser-cleaning-machine-sample-7.jpg',
        'images/samples/pulse-laser-cleaning-machine-sample-2.jpg',
      ]
    },
    {
      name: 'Laser Bending',
      sub: 'Precision sheet metal forming',
      images: [
        'images/samples/bending-machine-sample-1.jpg',
        'images/samples/bending-machine-sample-2.jpg',
        'images/samples/bending-machine-sample-3.jpg',
        'images/samples/sheet-metal-cutting-machine-sample-4.jpg',
        'images/samples/bending-machine-sample-1.jpg',
        'images/samples/bending-machine-sample-2.jpg',
      ]
    }
  ];

  /* ---- resolve path prefix (depth 0 = index.html) ---- */
  const prefix = (function () {
    const p = window.location.pathname.split('/');
    const depth = p.filter(s => s && !s.endsWith('.html')).length;
    return depth === 0 ? '' : '../'.repeat(depth);
  })();

  /* ---- canvas setup ---- */
  const cvs = document.createElement('canvas');
  cvs.style.cssText = 'display:block;width:100%;height:100%;border-radius:22px;';
  el.style.position = 'relative';
  el.appendChild(cvs);
  const ctx = cvs.getContext('2d');

  function resize() {
    cvs.width = el.offsetWidth * devicePixelRatio;
    cvs.height = el.offsetHeight * devicePixelRatio;
    ctx.scale(devicePixelRatio, devicePixelRatio);
  }
  resize();
  window.addEventListener('resize', resize, { passive: true });

  const W = () => cvs.width / devicePixelRatio;
  const H = () => cvs.height / devicePixelRatio;

  /* ---- pre-load images ---- */
  const imgCache = {};
  CATS.forEach(c => c.images.forEach(src => {
    const full = prefix + src;
    if (!imgCache[full]) {
      const i = new Image();
      i.src = full;
      imgCache[full] = i;
    }
  }));

  /* ---- particle system ---- */
  const PARTS = Array.from({ length: 55 }, () => resetParticle({}));
  function resetParticle(p) {
    p.x = Math.random() * 1200;
    p.y = Math.random() * 700;
    p.vx = (Math.random() - .5) * .45;
    p.vy = (Math.random() - .5) * .45;
    p.r = Math.random() * 1.4 + .3;
    p.a = Math.random() * .5 + .1;
    return p;
  }

  /* ---- state ---- */
  let ci = 0;             // current category index
  let tick = 0;
  let phaseTick = 0;
  const PHASE_DUR = 175;  // ticks per category (~7s at 25fps)

  /* ---- draw ---- */
  function draw() {
    const w = W(), h = H();
    if (w < 10 || h < 10) { requestAnimationFrame(draw); return; }

    tick++;
    phaseTick++;
    if (phaseTick >= PHASE_DUR) {
      phaseTick = 0;
      ci = (ci + 1) % CATS.length;
    }

    const fadeIn  = Math.min(1, phaseTick / 28);
    const fadeOut = Math.min(1, (PHASE_DUR - phaseTick) / 28);
    const fade    = Math.min(fadeIn, fadeOut);
    const cat     = CATS[ci];

    /* background */
    ctx.fillStyle = '#07090f';
    ctx.fillRect(0, 0, w, h);

    /* grid lines */
    ctx.save();
    ctx.globalAlpha = .04;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = .5;
    for (let x = 0; x < w; x += 48) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
    for (let y = 0; y < h; y += 48) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
    ctx.restore();

    /* laser beam sweeps */
    for (let i = 0; i < 3; i++) {
      const a = tick * .0018 + i * Math.PI * .65;
      const bx = w / 2 + Math.cos(a) * w * .55;
      const by = h / 2 + Math.sin(a) * h * .4;
      const g = ctx.createLinearGradient(w / 2, h / 2, bx, by);
      g.addColorStop(0, 'rgba(226,35,26,0)');
      g.addColorStop(.5, `rgba(226,35,26,${.07 + Math.sin(tick * .04 + i) * .03})`);
      g.addColorStop(1, 'rgba(226,35,26,0)');
      ctx.save();
      ctx.strokeStyle = g; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(w / 2, h / 2); ctx.lineTo(bx, by); ctx.stroke();
      ctx.restore();
    }

    /* particles */
    PARTS.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0) p.x = w; if (p.x > w) p.x = 0;
      if (p.y < 0) p.y = h; if (p.y > h) p.y = 0;
      ctx.save();
      ctx.globalAlpha = p.a * .25;
      ctx.fillStyle = '#e2231a';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    });

    /* image strip — 3 images in a row */
    const cols = 3;
    const pad = 10, gap = 8;
    const tw = (w - pad * 2 - gap * (cols - 1)) / cols;
    const th = h * .52;
    const ty = pad;

    for (let i = 0; i < cols; i++) {
      const tx = pad + i * (tw + gap);
      const srcStr = prefix + cat.images[i % cat.images.length];
      const im = imgCache[srcStr];
      ctx.save();
      ctx.globalAlpha = .85 * fade;

      /* image tile */
      ctx.beginPath();
      roundRect(ctx, tx, ty, tw, th, 10);
      ctx.clip();

      if (im && im.complete && im.naturalWidth) {
        /* cover-fit */
        const scale = Math.max(tw / im.naturalWidth, th / im.naturalHeight);
        const sw = im.naturalWidth * scale, sh = im.naturalHeight * scale;
        ctx.drawImage(im, tx + (tw - sw) / 2, ty + (th - sh) / 2, sw, sh);
      } else {
        ctx.fillStyle = '#131722';
        ctx.fillRect(tx, ty, tw, th);
      }

      /* dark vignette over image */
      const ov = ctx.createLinearGradient(tx, ty + th * .6, tx, ty + th);
      ov.addColorStop(0, 'transparent');
      ov.addColorStop(1, 'rgba(7,9,15,.85)');
      ctx.fillStyle = ov;
      ctx.fillRect(tx, ty, tw, th);

      ctx.restore();

      /* red border on hover-active tile (cycle) */
      const borderAlpha = i === (Math.floor(tick / 60) % cols) ? .7 : .2;
      ctx.save();
      ctx.globalAlpha = borderAlpha * fade;
      ctx.strokeStyle = '#e2231a';
      ctx.lineWidth = 1.5;
      ctx.beginPath(); roundRect(ctx, tx, ty, tw, th, 10); ctx.stroke();
      ctx.restore();
    }

    /* category name */
    const midY = h * .72;
    ctx.save();
    ctx.globalAlpha = fade;
    ctx.textAlign = 'center';
    ctx.font = `700 ${Math.min(22, w * .065)}px 'Space Grotesk', system-ui, sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(cat.name, w / 2, midY);
    ctx.font = `400 ${Math.min(12, w * .033)}px 'Space Grotesk', system-ui, sans-serif`;
    ctx.fillStyle = '#e2231a';
    ctx.fillText(cat.sub, w / 2, midY + Math.min(24, w * .06));
    ctx.restore();

    /* progress dots */
    const dotY = h * .88;
    const spacing = 16;
    const totalW = (CATS.length - 1) * spacing;
    CATS.forEach((_, i) => {
      const dx = w / 2 - totalW / 2 + i * spacing;
      ctx.beginPath();
      ctx.arc(dx, dotY, i === ci ? 4 : 2.5, 0, Math.PI * 2);
      ctx.fillStyle = i === ci ? '#e2231a' : 'rgba(255,255,255,.22)';
      ctx.fill();
    });

    /* progress bar */
    const barW = w * .45, barH = 2;
    const barX = (w - barW) / 2, barY = h * .94;
    ctx.save();
    ctx.globalAlpha = .3;
    ctx.fillStyle = 'rgba(255,255,255,.15)';
    ctx.beginPath(); roundRect(ctx, barX, barY, barW, barH, 1); ctx.fill();
    ctx.globalAlpha = .8;
    ctx.fillStyle = '#e2231a';
    ctx.beginPath(); roundRect(ctx, barX, barY, barW * (phaseTick / PHASE_DUR), barH, 1); ctx.fill();
    ctx.restore();

    requestAnimationFrame(draw);
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  draw();
})();
