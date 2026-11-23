/* v3: nav flyout, scroll reveals, marquee duplication, video lightbox. */
(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  document.addEventListener("DOMContentLoaded", function () {

    /* ---------- mobile: category flyout toggles ---------- */
    document.querySelectorAll(".nav-cat > a").forEach(function (a) {
      a.addEventListener("click", function (e) {
        if (window.innerWidth > 900) return;   // desktop uses hover
        var cat = a.parentElement;
        if (cat.querySelector(".nav-sub")) {
          e.preventDefault();
          cat.classList.toggle("open");
        }
      });
    });

    /* ---------- marquees: duplicate content for a seamless loop ---------- */
    document.querySelectorAll(".marquee-track").forEach(function (tr) {
      if (tr.dataset.cloned) return;
      tr.dataset.cloned = "1";
      tr.innerHTML += tr.innerHTML;          // 2x content, animation shifts -50%
    });

    /* ---------- scroll reveals ----------
       Plain scroll listener rather than IntersectionObserver: some embedded
       webviews (in-app browsers) never deliver IO callbacks, which would leave
       every revealed element stuck invisible. */
    var rv = [].slice.call(document.querySelectorAll("[data-rv]"));
    if (reduce) {
      rv.forEach(function (el) { el.classList.add("seen"); });
    } else {
      // stagger siblings inside a common grid/row
      rv.forEach(function (el) {
        var sibs = [].filter.call(el.parentElement.children, function (c) { return c.hasAttribute("data-rv"); });
        var i = sibs.indexOf(el);
        if (i > 0) el.style.setProperty("--rvd", Math.min(i * 0.08, 0.4) + "s");
      });
      var ticking = false;
      function check() {
        ticking = false;
        var vh = window.innerHeight;
        rv = rv.filter(function (el) {
          var r = el.getBoundingClientRect();
          if (r.top < vh - 60 && r.bottom > 0) { el.classList.add("seen"); return false; }
          return true;
        });
        if (!rv.length) {
          window.removeEventListener("scroll", onScroll);
          window.removeEventListener("resize", onScroll);
        }
      }
      function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(check); } }
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onScroll);
      check();
      setTimeout(check, 350);   // catch late layout (fonts/images)
    }

    /* ---------- video lightbox ---------- */
    var lb = document.createElement("div");
    lb.className = "lb";
    lb.innerHTML = '<div class="lb-inner"><button class="lb-close" aria-label="Close">&#10005;</button>' +
                   '<video controls playsinline></video><div class="lb-cap"></div></div>';
    document.body.appendChild(lb);
    var lbVideo = lb.querySelector("video");
    var lbCap = lb.querySelector(".lb-cap");

    function openLb(src, cap) {
      lbVideo.src = src;
      lbCap.textContent = cap || "";
      lb.classList.add("open");
      document.body.style.overflow = "hidden";
      var p = lbVideo.play();
      if (p && p.catch) p.catch(function () {});
    }
    function closeLb() {
      lb.classList.remove("open");
      lbVideo.pause();
      lbVideo.removeAttribute("src");
      lbVideo.load();
      document.body.style.overflow = "";
    }
    lb.addEventListener("click", function (e) {
      if (e.target === lb || e.target.closest(".lb-close")) closeLb();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && lb.classList.contains("open")) closeLb();
    });

    document.querySelectorAll("[data-video]").forEach(function (el) {
      el.addEventListener("click", function () {
        openLb(el.dataset.video, el.dataset.caption || "");
      });
      el.style.cursor = "pointer";
    });
  });
})();
