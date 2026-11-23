/* Futuristic showcase — generative canvas scene (dependency-free).
   Synthwave grid + rotating 3D wireframe crystal + firing laser beams +
   spark bursts + scan sweep, gated to run only when visible. */
(function () {
  var host = document.getElementById("showcase");
  if (!host) return;
  var canvas = host.querySelector(".sc-canvas");
  var ctx = canvas.getContext("2d");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var RED = "#ff4433";
  var RED_DEEP = "#e2231a";
  var CYAN = "#35e0ff";

  var W = 0, H = 0, DPR = Math.min(window.devicePixelRatio || 1, 2);

  function resize() {
    var r = host.getBoundingClientRect();
    W = Math.max(1, r.width);
    H = Math.max(1, r.height);
    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }

  // ---- 3D icosahedron geometry ----
  var PHI = (1 + Math.sqrt(5)) / 2;
  var V = [
    [0, 1, PHI], [0, -1, PHI], [0, 1, -PHI], [0, -1, -PHI],
    [1, PHI, 0], [-1, PHI, 0], [1, -PHI, 0], [-1, -PHI, 0],
    [PHI, 0, 1], [-PHI, 0, 1], [PHI, 0, -1], [-PHI, 0, -1],
  ];
  var E = [];
  for (var a = 0; a < V.length; a++) {
    for (var b = a + 1; b < V.length; b++) {
      var dx = V[a][0] - V[b][0], dy = V[a][1] - V[b][1], dz = V[a][2] - V[b][2];
      if (Math.abs(Math.sqrt(dx * dx + dy * dy + dz * dz) - 2) < 0.05) E.push([a, b]);
    }
  }

  // ---- dynamic state ----
  var embers = [];
  var sparks = [];
  var t = 0;            // seconds
  var gridScroll = 0;
  var beam = { active: false, x: 0, y: 0, life: 0, dur: 0.7 };
  var nextBeam = 1.2;

  function spawnEmbers() {
    embers = [];
    var n = 46;
    for (var i = 0; i < n; i++) {
      embers.push({
        x: Math.random(), y: Math.random(),
        s: 0.4 + Math.random() * 1.6,
        v: 0.02 + Math.random() * 0.06,
        a: 0.2 + Math.random() * 0.5,
      });
    }
  }
  spawnEmbers();

  function rot(p, ax, ay) {
    var cy = Math.cos(ay), sy = Math.sin(ay);
    var x1 = p[0] * cy - p[2] * sy, z1 = p[0] * sy + p[2] * cy, y1 = p[1];
    var cx = Math.cos(ax), sx = Math.sin(ax);
    var y2 = y1 * cx - z1 * sx, z2 = y1 * sx + z1 * cx;
    return [x1, y2, z2];
  }

  function drawGrid(cx, horizon) {
    var lines = 15;
    ctx.lineWidth = 1;
    // horizontal (scrolling toward viewer)
    for (var i = 0; i < lines; i++) {
      var f = ((i + gridScroll) % lines) / lines;      // 0..1
      var p = f * f;                                    // perspective ease
      var y = horizon + (H - horizon) * p;
      var alpha = 0.05 + p * 0.45;
      ctx.strokeStyle = "rgba(255,68,51," + alpha + ")";
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
    // vertical converging lines
    var cols = 14;
    for (var k = -cols; k <= cols; k++) {
      var bx = cx + (k / cols) * W * 1.15;
      ctx.strokeStyle = "rgba(255,68,51,0.16)";
      ctx.beginPath(); ctx.moveTo(cx, horizon); ctx.lineTo(bx, H); ctx.stroke();
    }
    // glowing horizon line
    var g = ctx.createLinearGradient(0, 0, W, 0);
    g.addColorStop(0, "rgba(53,224,255,0)");
    g.addColorStop(0.5, "rgba(53,224,255,0.7)");
    g.addColorStop(1, "rgba(53,224,255,0)");
    ctx.strokeStyle = g; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(0, horizon); ctx.lineTo(W, horizon); ctx.stroke();
  }

  function drawCrystal(cx, cy) {
    var scale = Math.min(W, H) * 0.19;
    var fov = 3.4;
    var ax = t * 0.5, ay = t * 0.72;
    var pts = V.map(function (p) {
      var r = rot(p, ax, ay);
      var pp = fov / (fov + r[2]);
      return { x: cx + r[0] * scale * pp, y: cy + r[1] * scale * pp, d: pp };
    });
    // edges
    ctx.lineCap = "round";
    ctx.shadowColor = RED;
    for (var i = 0; i < E.length; i++) {
      var p1 = pts[E[i][0]], p2 = pts[E[i][1]];
      var dd = (p1.d + p2.d) / 2;
      var al = Math.max(0.08, Math.min(1, (dd - 0.55) * 1.5));
      ctx.strokeStyle = "rgba(255," + Math.round(68 + al * 90) + "," + Math.round(51 + al * 60) + "," + al + ")";
      ctx.lineWidth = 0.6 + dd * 1.3;
      ctx.shadowBlur = 6 * dd;
      ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
    }
    // vertices
    for (var v = 0; v < pts.length; v++) {
      var pv = pts[v];
      ctx.fillStyle = "rgba(255,240,235," + Math.min(1, pv.d) + ")";
      ctx.shadowBlur = 8 * pv.d;
      ctx.beginPath(); ctx.arc(pv.x, pv.y, 1 + pv.d * 1.6, 0, 7); ctx.fill();
    }
    ctx.shadowBlur = 0;
    // core glow
    var cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, scale * 0.9);
    cg.addColorStop(0, "rgba(255,68,51,0.32)");
    cg.addColorStop(1, "rgba(255,68,51,0)");
    ctx.fillStyle = cg;
    ctx.beginPath(); ctx.arc(cx, cy, scale * 0.9, 0, 7); ctx.fill();
    return cy + scale * 0.55; // bottom of crystal (beam origin)
  }

  function fireBeam(cx, horizon) {
    beam.active = true;
    beam.life = 0;
    beam.x = cx + (Math.random() - 0.5) * W * 0.28;
    beam.y = horizon + (H - horizon) * (0.55 + Math.random() * 0.35);
  }

  function drawBeam(originX, originY) {
    if (!beam.active) return;
    var p = Math.min(1, beam.life / beam.dur);    // 0..1 (clamped)
    var reach = Math.min(1, p / 0.45);            // beam extends in first 45%
    var ey = originY + (beam.y - originY) * reach;
    var flick = 0.6 + Math.random() * 0.4;
    // beam line
    var lg = ctx.createLinearGradient(originX, originY, beam.x, ey);
    lg.addColorStop(0, "rgba(255,255,255," + flick + ")");
    lg.addColorStop(0.5, "rgba(255,68,51," + flick + ")");
    lg.addColorStop(1, "rgba(255,68,51,0.2)");
    ctx.strokeStyle = lg;
    ctx.lineWidth = 2.4;
    ctx.shadowColor = RED; ctx.shadowBlur = 16;
    ctx.beginPath(); ctx.moveTo(originX, originY); ctx.lineTo(beam.x, ey); ctx.stroke();
    ctx.shadowBlur = 0;
    // impact ring + sparks once
    if (p >= 0.45 && !beam._hit) {
      beam._hit = true;
      for (var i = 0; i < 26; i++) {
        var ang = Math.random() * Math.PI * 2;
        var sp = 40 + Math.random() * 150;
        sparks.push({
          x: beam.x, y: beam.y,
          vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp - 60,
          life: 0, dur: 0.4 + Math.random() * 0.5,
          c: Math.random() < 0.5 ? "255,255,255" : "255,110,60",
        });
      }
    }
    if (beam._hit) {
      var rp = (p - 0.45) / 0.55;
      var rr = rp * Math.min(W, H) * 0.14;
      ctx.strokeStyle = "rgba(255,120,70," + (1 - rp) * 0.8 + ")";
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(beam.x, beam.y, rr, rr * 0.34, 0, 0, 7); ctx.stroke();
      // hot flash
      var fg = ctx.createRadialGradient(beam.x, beam.y, 0, beam.x, beam.y, 26 * (1 - rp));
      fg.addColorStop(0, "rgba(255,240,220," + (1 - rp) + ")");
      fg.addColorStop(1, "rgba(255,120,70,0)");
      ctx.fillStyle = fg;
      ctx.beginPath(); ctx.arc(beam.x, beam.y, 26, 0, 7); ctx.fill();
    }
  }

  var scanX = -0.2;

  function frame(dt) {
    t += dt;
    gridScroll = (gridScroll + dt * 1.1) % 15;

    ctx.clearRect(0, 0, W, H);
    // background
    var bg = ctx.createRadialGradient(W / 2, H * 0.62, 0, W / 2, H * 0.62, Math.max(W, H) * 0.75);
    bg.addColorStop(0, "#0c0f18");
    bg.addColorStop(1, "#05060a");
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    var cx = W / 2, horizon = H * 0.6;
    drawGrid(cx, horizon);

    // embers
    for (var i = 0; i < embers.length; i++) {
      var e = embers[i];
      e.y -= e.v * dt;
      if (e.y < -0.02) { e.y = 1.02; e.x = Math.random(); }
      ctx.fillStyle = "rgba(255," + (120 + ((i * 37) % 100)) + ",80," + e.a + ")";
      ctx.beginPath(); ctx.arc(e.x * W, e.y * H, e.s, 0, 7); ctx.fill();
    }

    var beamOrigin = drawCrystal(cx, H * 0.4);

    // beams
    if (!reduce) {
      nextBeam -= dt;
      if (!beam.active && nextBeam <= 0) { fireBeam(cx, horizon); }
      if (beam.active) {
        beam.life += dt;
        drawBeam(cx, beamOrigin);
        if (beam.life >= beam.dur) { beam.active = false; beam._hit = false; nextBeam = 1.6 + Math.random() * 1.4; }
      }
    }

    // sparks
    for (var s = sparks.length - 1; s >= 0; s--) {
      var sp = sparks[s];
      sp.life += dt;
      if (sp.life >= sp.dur) { sparks.splice(s, 1); continue; }
      sp.vy += 220 * dt;
      sp.x += sp.vx * dt; sp.y += sp.vy * dt;
      var al = 1 - sp.life / sp.dur;
      ctx.fillStyle = "rgba(" + sp.c + "," + al + ")";
      ctx.beginPath(); ctx.arc(sp.x, sp.y, 1.6 * al + 0.4, 0, 7); ctx.fill();
    }

    // scan sweep
    if (!reduce) {
      scanX += dt * 0.16;
      if (scanX > 1.25) scanX = -0.25;
      var sxp = scanX * W;
      var sg = ctx.createLinearGradient(sxp - 60, 0, sxp + 60, 0);
      sg.addColorStop(0, "rgba(53,224,255,0)");
      sg.addColorStop(0.5, "rgba(53,224,255,0.14)");
      sg.addColorStop(1, "rgba(53,224,255,0)");
      ctx.fillStyle = sg; ctx.fillRect(sxp - 60, 0, 120, H);
    }

    // vignette
    var vg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.max(W, H) * 0.72);
    vg.addColorStop(0, "rgba(0,0,0,0)");
    vg.addColorStop(1, "rgba(0,0,0,0.55)");
    ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
  }

  // ---- run loop, gated to visibility ----
  var last = 0, raf = 0, running = false;
  function loop(now) {
    if (!running) return;
    var dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016;
    last = now;
    frame(dt);
    raf = requestAnimationFrame(loop);
  }
  function start() {
    if (running || host.classList.contains("playing")) return;
    running = true; last = 0; raf = requestAnimationFrame(loop);
  }
  function stop() { running = false; cancelAnimationFrame(raf); }

  if (window.ResizeObserver) {
    new ResizeObserver(resize).observe(host);
  } else {
    window.addEventListener("resize", resize);
  }
  resize();

  if (reduce) {
    // single static composed frame
    frame(0.016);
  } else if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { en.isIntersecting ? start() : stop(); });
    }, { threshold: 0.15 }).observe(host);
  } else {
    start();
  }
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) stop(); else start();
  });

  // ---- equalizer ticker bars ----
  var ticker = document.getElementById("sc-ticker");
  if (ticker) {
    var bars = 44;
    var html = "";
    for (var bI = 0; bI < bars; bI++) {
      var delay = (Math.random() * 1.2).toFixed(2);
      var dur = (0.7 + Math.random() * 0.9).toFixed(2);
      html += '<span style="animation-delay:' + delay + "s;animation-duration:" + dur + 's"></span>';
    }
    ticker.innerHTML = html;
  }

  // ---- HUD data cycling: MARK / WELD / CLEAN ----
  var modes = [
    { name: "MARK", dot: RED, rows: [["λ", "1064 nm"], ["P", "20–50 W"], ["v", "8000 mm/s"]] },
    { name: "WELD", dot: "#ff8a3d", rows: [["λ", "1080 nm"], ["P", "1–3 kW"], ["gap", "≤0.5 mm"]] },
    { name: "CLEAN", dot: CYAN, rows: [["λ", "1064 nm"], ["P", "1500 W"], ["f", "1000 kHz"]] },
  ];
  var mi = 0;
  var modeLabel = document.getElementById("sc-mode-label");
  var modeDot = host.querySelector(".sc-dot");
  var readout = document.getElementById("sc-readout");
  function applyMode() {
    var m = modes[mi];
    if (modeLabel) modeLabel.textContent = m.name;
    if (modeDot) { modeDot.style.background = m.dot; modeDot.style.boxShadow = "0 0 12px 2px " + m.dot; }
    if (readout) {
      readout.innerHTML = m.rows.map(function (r) {
        return '<div><span class="rk">' + r[0] + '</span> <span class="rv">' + r[1] + "</span></div>";
      }).join("");
    }
    mi = (mi + 1) % modes.length;
  }
  applyMode();
  var modeTimer = setInterval(applyMode, 2600);

  // ---- play real footage ----
  var playBtn = document.getElementById("sc-play");
  var video = host.querySelector("video");
  if (playBtn && video) {
    playBtn.addEventListener("click", function () {
      host.classList.add("playing");
      stop();
      clearInterval(modeTimer);
      video.setAttribute("controls", "");
      video.play();
    });
    video.addEventListener("ended", function () {
      host.classList.remove("playing");
      start();
    });
  }
})();
