/* v2 interactions: nav dropdowns, carousels, material/industry pickers,
   product gallery, hover-play video tiles. Dependency-free. */
(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  document.addEventListener("DOMContentLoaded", function () {
    /* ---------- mobile dropdown toggles ---------- */
    document.querySelectorAll(".nav-item.has-menu > a").forEach(function (a) {
      a.addEventListener("click", function (e) {
        if (window.innerWidth > 900) return;      // desktop uses hover
        e.preventDefault();
        a.parentElement.classList.toggle("open");
      });
    });

    /* ---------- hero slider (auto-rotating) ---------- */
    document.querySelectorAll("[data-hero-slider]").forEach(function (root) {
      var slides = [].slice.call(root.querySelectorAll(".hero-slide"));
      if (slides.length < 2) return;
      var dots = [].slice.call(document.querySelectorAll(".hero-dot"));
      var delay = parseInt(root.dataset.interval, 10) || 6000;
      var cur = 0, timer = null, paused = false;

      function paint(n) {
        slides.forEach(function (s, i) {
          s.classList.remove("is-leaving");
          if (i === n) {
            s.classList.add("is-active");
            s.removeAttribute("aria-hidden");
          } else {
            if (s.classList.contains("is-active")) s.classList.add("is-leaving");
            s.classList.remove("is-active");
            s.setAttribute("aria-hidden", "true");
          }
        });
        dots.forEach(function (dt, i) {
          dt.classList.remove("is-active", "no-anim");
          if (i === n) {
            // restart the fill animation from 0
            dt.classList.add("no-anim");
            dt.querySelector(".dot-fill").style.width = "0%";
            void dt.offsetWidth;
            dt.classList.remove("no-anim");
            dt.style.setProperty("--fill-ms", delay + "ms");
            dt.classList.add("is-active");
            dt.querySelector(".dot-fill").style.width = "";
          } else {
            dt.querySelector(".dot-fill").style.width = "0%";
          }
        });
        cur = n;
      }
      function next() { paint((cur + 1) % slides.length); }
      function start() {
        if (reduce || paused) return;
        clearInterval(timer);
        timer = setInterval(next, delay);
      }
      function stop() { clearInterval(timer); }

      dots.forEach(function (dt, i) {
        dt.addEventListener("click", function () { paint(i); start(); });
      });

      // The hero rotates continuously and is deliberately NOT paused by hover
      // or IntersectionObserver: the hero is a large target, so a cursor simply
      // resting over it would freeze the carousel, and some embedded webviews
      // never deliver IO callbacks at all. Only keyboard focus pauses it, so a
      // user tabbing through the slide links isn't yanked to the next slide.
      root.addEventListener("focusin", function () { paused = true; stop(); });
      root.addEventListener("focusout", function () { paused = false; start(); });

      paint(0);
      start();
    });

    /* ---------- carousels ---------- */
    document.querySelectorAll("[data-carousel]").forEach(function (wrap) {
      var track = wrap.querySelector(".carousel");
      var prev = wrap.querySelector(".car-btn.prev");
      var next = wrap.querySelector(".car-btn.next");
      if (!track) return;
      function step() {
        var first = track.firstElementChild;
        if (!first) return track.clientWidth * 0.6;
        var gap = parseFloat(getComputedStyle(track).columnGap || 26) || 26;
        return first.getBoundingClientRect().width + gap;
      }
      function sync() {
        var max = track.scrollWidth - track.clientWidth - 2;
        if (prev) prev.style.opacity = track.scrollLeft <= 2 ? ".35" : "1";
        if (next) next.style.opacity = track.scrollLeft >= max ? ".35" : "1";
      }
      if (prev) prev.addEventListener("click", function () { track.scrollBy({ left: -step(), behavior: "smooth" }); });
      if (next) next.addEventListener("click", function () { track.scrollBy({ left: step(), behavior: "smooth" }); });
      track.addEventListener("scroll", sync, { passive: true });
      window.addEventListener("resize", sync);
      sync();
    });

    /* ---------- picker (materials / industries) ---------- */
    document.querySelectorAll("[data-picker]").forEach(function (root) {
      var buttons = root.querySelectorAll(".picker-list button");
      var imgs = root.querySelectorAll(".picker-view img");
      var capT = root.querySelector(".cap h4");
      var capP = root.querySelector(".cap p");
      var timer = null;
      var idx = 0;

      function show(i) {
        idx = i;
        buttons.forEach(function (b, n) { b.classList.toggle("active", n === i); });
        imgs.forEach(function (im, n) { im.classList.toggle("on", n === i); });
        var b = buttons[i];
        if (b) {
          if (capT) capT.textContent = b.dataset.title || b.textContent.trim();
          if (capP) capP.textContent = b.dataset.desc || "";
        }
      }
      function auto() {
        if (reduce) return;
        clearInterval(timer);
        timer = setInterval(function () { show((idx + 1) % buttons.length); }, 3200);
      }
      buttons.forEach(function (b, i) {
        b.addEventListener("click", function () { show(i); auto(); });
        b.addEventListener("mouseenter", function () { show(i); clearInterval(timer); });
      });
      root.addEventListener("mouseleave", auto);
      show(0);
      auto();                       // start unconditionally (see slider note)
      if ("IntersectionObserver" in window) {
        new IntersectionObserver(function (es) {
          es.forEach(function (e) { e.isIntersecting ? auto() : clearInterval(timer); });
        }, { threshold: 0.25 }).observe(root);
      }
    });

    /* ---------- product gallery ---------- */
    document.querySelectorAll("[data-gallery]").forEach(function (root) {
      var main = root.querySelector(".gallery-main img");
      var thumbs = root.querySelectorAll(".thumbs button");
      thumbs.forEach(function (t, i) {
        t.addEventListener("click", function () {
          var src = t.querySelector("img").getAttribute("src");
          if (!main || main.getAttribute("src") === src) return;
          main.style.opacity = "0";
          setTimeout(function () {
            main.setAttribute("src", src);
            main.style.opacity = "1";
          }, 180);
          thumbs.forEach(function (o, n) { o.classList.toggle("active", n === i); });
        });
      });
      if (thumbs[0]) thumbs[0].classList.add("active");
    });

    /* ---------- hover-to-play video tiles ---------- */
    document.querySelectorAll(".vid-tile").forEach(function (tile) {
      var v = tile.querySelector("video");
      if (!v) return;
      var playing = false;
      function play() {
        if (playing || reduce) return;
        playing = true;
        tile.classList.add("playing");
        v.muted = true;
        var p = v.play();
        if (p && p.catch) p.catch(function () { playing = false; tile.classList.remove("playing"); });
      }
      function stop() {
        playing = false;
        tile.classList.remove("playing");
        try { v.pause(); v.currentTime = 0; } catch (e) {}
      }
      tile.addEventListener("mouseenter", play);
      tile.addEventListener("mouseleave", stop);
      tile.addEventListener("click", function () {
        if (v.paused) { v.muted = false; v.setAttribute("controls", ""); v.play(); tile.classList.add("playing"); }
      });
    });
  });
})();
