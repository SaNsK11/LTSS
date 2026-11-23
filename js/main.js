document.addEventListener("DOMContentLoaded", function () {
  // Mobile nav toggle
  var toggle = document.querySelector(".nav-toggle");
  var links = document.querySelector(".nav-links");
  if (toggle && links) {
    toggle.addEventListener("click", function () {
      links.classList.toggle("open");
      toggle.classList.toggle("open");
    });
    links.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        links.classList.remove("open");
      });
    });
  }

  // Sticky header shadow on scroll
  var header = document.querySelector(".site-header");
  if (header) {
    window.addEventListener("scroll", function () {
      header.classList.toggle("scrolled", window.scrollY > 8);
    });
  }

  // Footer year
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Laser sweep beam in hero
  var hero = document.querySelector(".hero");
  if (hero && !reduceMotion) {
    var beam = document.createElement("div");
    beam.className = "laser-beam";
    hero.appendChild(beam);
  }

  // Scroll-reveal: tag common blocks, stagger siblings inside grids
  var revealTargets = document.querySelectorAll(
    ".section-head, .grid > *, .split > *, .map-block > *, .cta-band, " +
      ".table-wrap, .pill-row, .gallery-grid figure, .stats-strip > div, " +
      ".contact-info-card, .contact-grid > div, .note-box"
  );
  revealTargets.forEach(function (el) {
    if (el.classList.contains("reveal")) return;
    el.classList.add("reveal");
    // stagger children of the same parent
    var siblings = Array.prototype.filter.call(el.parentElement.children, function (c) {
      return c.classList.contains("reveal");
    });
    var idx = siblings.indexOf(el);
    if (idx > 0) el.style.setProperty("--reveal-delay", Math.min(idx * 0.09, 0.45) + "s");
  });
  // alternate slide direction for split layouts
  document.querySelectorAll(".split").forEach(function (split) {
    var kids = split.children;
    if (kids[0]) kids[0].classList.add("reveal-left");
    if (kids[1]) kids[1].classList.add("reveal-right");
  });

  if (!reduceMotion) {
    var pending = Array.prototype.slice.call(document.querySelectorAll(".reveal"));
    var ticking = false;
    function revealVisible() {
      ticking = false;
      var vh = window.innerHeight;
      pending = pending.filter(function (el) {
        var r = el.getBoundingClientRect();
        if (r.top < vh - 40 && r.bottom > 0) {
          el.classList.add("in-view");
          // strip reveal classes after the entrance so hover
          // transitions defined elsewhere behave normally again
          setTimeout(function () {
            el.classList.remove("reveal", "reveal-left", "reveal-right", "in-view");
            el.style.removeProperty("--reveal-delay");
          }, 1400);
          return false;
        }
        return true;
      });
      if (!pending.length) {
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("resize", onScroll);
      }
    }
    function onScroll() {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(revealVisible);
      }
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    document.addEventListener("visibilitychange", function () {
      if (!document.hidden) revealVisible();
    });
    revealVisible();
  } else {
    document.querySelectorAll(".reveal").forEach(function (el) { el.classList.add("in-view"); });
  }

  // Animated number counters (hero stats + stats strip)
  function animateCounter(el) {
    var text = el.textContent.trim();
    var match = text.match(/^(\d+)(.*)$/);
    if (!match) return;
    var target = parseInt(match[1], 10);
    var suffix = match[2] || "";
    var duration = 1400;
    var start = null;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased) + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  if (!reduceMotion) {
    var pendingCounters = Array.prototype.slice.call(
      document.querySelectorAll(".hero-stats strong, .stats-strip strong")
    );
    function checkCounters() {
      var vh = window.innerHeight;
      pendingCounters = pendingCounters.filter(function (el) {
        var r = el.getBoundingClientRect();
        if (r.top < vh - 30 && r.bottom > 0) {
          animateCounter(el);
          return false;
        }
        return true;
      });
      if (!pendingCounters.length) window.removeEventListener("scroll", checkCounters);
    }
    window.addEventListener("scroll", checkCounters, { passive: true });
    checkCounters();
  }

  // Click-to-play video showcase (keeps the 4K file from downloading until wanted)
  document.querySelectorAll(".video-frame").forEach(function (frame) {
    var video = frame.querySelector("video");
    if (!video) return;
    frame.addEventListener("click", function () {
      if (frame.classList.contains("playing")) return;
      frame.classList.add("playing");
      video.setAttribute("controls", "");
      video.play();
    });
    video.addEventListener("pause", function () {
      if (!video.seeking && video.currentTime > 0 && !video.ended) frame.classList.remove("playing");
    });
    video.addEventListener("play", function () { frame.classList.add("playing"); });
  });

  // FAQ accordion
  document.querySelectorAll(".faq-q").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var item = btn.closest(".faq-item");
      var answer = item.querySelector(".faq-a");
      var isOpen = item.classList.contains("open");
      // close siblings
      var parent = item.parentElement;
      parent.querySelectorAll(".faq-item.open").forEach(function (other) {
        if (other !== item) {
          other.classList.remove("open");
          other.querySelector(".faq-a").style.maxHeight = null;
        }
      });
      if (isOpen) {
        item.classList.remove("open");
        answer.style.maxHeight = null;
      } else {
        item.classList.add("open");
        answer.style.maxHeight = answer.scrollHeight + "px";
      }
    });
  });

  // Laser vs TIG/MIG savings calculator
  var calc = document.getElementById("savings-calc");
  if (calc) {
    var inputs = {
      hours: document.getElementById("calc-hours"),
      power: document.getElementById("calc-power"),
      wire: document.getElementById("calc-wire"),
      labour: document.getElementById("calc-labour"),
    };
    function fmtINR(n) {
      return "₹" + Math.round(n).toLocaleString("en-IN");
    }
    function recalc() {
      var hours = +inputs.hours.value; // welding hours per day
      var powerRate = +inputs.power.value; // ₹ per unit
      var wire = +inputs.wire.value; // ₹ consumables per day (TIG/MIG)
      var labour = +inputs.labour.value; // ₹ per operator per day
      var days = 300; // working days / year

      // Assumptions grounded in catalogue comparison claims:
      // laser ~half the electricity of argon welding; laser ~4x faster so
      // ~1/4 the operator-hours for the same output; laser needs no wire/electrode.
      var tigKw = 8, laserKw = 6; // approx draw
      var tigPowerYr = tigKw * hours * powerRate * days;
      // laser does same work in ~1/4 time
      var laserPowerYr = laserKw * (hours / 4) * powerRate * days;

      var tigWireYr = wire * days;
      var laserWireYr = 0;

      var tigLabourYr = labour * days;
      var laserLabourYr = labour * days * 0.25; // 1/4 the operator time

      var tigTotal = tigPowerYr + tigWireYr + tigLabourYr;
      var laserTotal = laserPowerYr + laserWireYr + laserLabourYr;
      var saving = tigTotal - laserTotal;

      document.getElementById("calc-saving").textContent = fmtINR(saving);
      document.getElementById("calc-power-save").textContent = fmtINR(tigPowerYr - laserPowerYr);
      document.getElementById("calc-wire-save").textContent = fmtINR(tigWireYr - laserWireYr);
      document.getElementById("calc-labour-save").textContent = fmtINR(tigLabourYr - laserLabourYr);

      calc.querySelectorAll("[data-out]").forEach(function (el) {
        var k = el.getAttribute("data-out");
        if (k === "hours") el.textContent = hours + " hr/day";
        if (k === "power") el.textContent = "₹" + powerRate + "/unit";
        if (k === "wire") el.textContent = fmtINR(wire) + "/day";
        if (k === "labour") el.textContent = fmtINR(labour) + "/day";
      });
    }
    Object.keys(inputs).forEach(function (k) {
      inputs[k].addEventListener("input", recalc);
    });
    recalc();
  }

  // Demo-intent: when arriving at contact page via #demo, frame it as a demo booking
  function applyDemoIntent() {
    if (window.location.hash !== "#demo") return;
    var heading = document.getElementById("form-heading");
    var sub = document.getElementById("form-subhead");
    var interest = document.getElementById("interest");
    if (heading) heading.textContent = "Book a free demo";
    if (sub) sub.textContent =
      "Bring your own sample and see it marked, welded or cleaned before you invest. Fill in your details and we'll schedule a demo at a time that suits you.";
    if (interest) interest.value = "Book a free demo (I'll bring a sample)";
  }
  applyDemoIntent();
  window.addEventListener("hashchange", applyDemoIntent);

  // Contact form success message (FormSubmit redirects with ?success=true when configured,
  // but we also handle plain fetch submission to avoid leaving the site)
  var form = document.getElementById("contact-form");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var status = document.getElementById("form-status");
      var btn = form.querySelector("button[type=submit]");
      var originalText = btn.textContent;
      btn.disabled = true;
      btn.textContent = "Sending...";

      fetch(form.action, {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" },
      })
        .then(function (res) {
          if (res.ok) {
            form.reset();
            status.textContent = "Thank you! Your enquiry has been sent — our team will get back to you shortly.";
            status.className = "form-status success";
          } else {
            throw new Error("Network response error");
          }
        })
        .catch(function () {
          status.textContent =
            "Something went wrong sending the form. Please call/WhatsApp +91 8851534795 or email info@lasertechsystems.co.in directly.";
          status.className = "form-status error";
        })
        .finally(function () {
          btn.disabled = false;
          btn.textContent = originalText;
        });
    });
  }
});
