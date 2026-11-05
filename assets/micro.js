/* Prajna Co-hab - micro-repo wiring (v73)
   Vanilla ports only. No React, no motion lib, no npm.
   Adds patterns NOT already in assets/site.js (interior strict pass:
   press-depth, ripple, loading-button, accordion, tabs, segmented,
   filter-grid, blur-up, lightbox, copy-button, progress are already
   live there and are kept, not duplicated).
   New here, from design-repo-kit micro repos:
     microkit   magnetic-fill-button  -> hero/pagehead/cta primary CTA
     uniqueui   border-beam           -> featured .costcard (index/rooms)
     uniqueui   aurora-glow-button    -> hero/pagehead primary CTA halo
     Amicro     SpotlightCard         -> .card spotlight (--mx/--my)
     react-bits Spotlight/TiltedCard  -> same spotlight + focus parity
     uselayouts animated-tabs         -> sliding pill on .gallery-filters
                                         and .segmented (rooms pricing)
     ui viberdy animated-tabs         -> same pill (shared implementation)
   Timings (interior.dev): press 140ms, hover 220ms, state 380ms,
   arrival 760ms, easing cubic-bezier(.22,.61,.36,1) = --e-out.
   All effects bail on prefers-reduced-motion; magnetic/spotlight
   only on pointer:fine. Palette stays inside DESIGN-SYSTEM.md
   (terra/ochre/paper only). See MICRO-WIRING.md for page map. */
(function () {
  "use strict";
  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced) return;
  var fine = window.matchMedia && window.matchMedia("(pointer:fine)").matches;
  var doc = document;

  /* 1. microkit magnetic-fill-button: primary CTA leans toward the
     cursor by at most 6px and springs back on leave. Skips ghost
     buttons so secondary actions stay still. */
  if (fine) {
    doc.querySelectorAll(".hero .btn:not(.ghost), .pagehead .btn:not(.ghost), .cta-strip .btn:not(.ghost), .cta-row .btn:not(.ghost)").forEach(function (el) {
      el.addEventListener("mousemove", function (e) {
        var r = el.getBoundingClientRect();
        var dx = (e.clientX - r.left) / r.width - 0.5;
        var dy = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = "translate(" + (dx * 12).toFixed(1) + "px," + (dy * 8).toFixed(1) + "px)";
      });
      el.addEventListener("mouseleave", function () { el.style.transform = ""; });
    });

    /* 2. Amicro SpotlightCard + react-bits Spotlight: cursor radial
       glow on cards via --mx/--my. Hosts: .card on every content
       page (about/pune/discover grids, blog posts, gallery teasers,
       rooms inclusions, index cards). */
    doc.querySelectorAll(".card").forEach(function (el) {
      el.addEventListener("mousemove", function (e) {
        var r = el.getBoundingClientRect();
        el.style.setProperty("--mx", ((e.clientX - r.left) / r.width * 100).toFixed(1) + "%");
        el.style.setProperty("--my", ((e.clientY - r.top) / r.height * 100).toFixed(1) + "%");
      });
    });
  }

  /* 3. uselayouts / ui animated-tabs: one sliding pill behind the
     active tab. Hosts: .gallery-filters (gallery, aria-pressed) and
     .segmented (rooms pricing, aria-selected). The pill carries the
     active colour; the active button goes transparent so the pill
     shows through. Works with the existing site.js tab logic. */
  function pill(group, btnSel, activeTest) {
    var tabs = group.querySelectorAll(btnSel);
    if (!tabs.length) return;
    group.classList.add("micro-tabs");
    var p = doc.createElement("span");
    p.className = "micro-pill";
    p.setAttribute("aria-hidden", "true");
    group.appendChild(p);
    function move() {
      var on = null;
      tabs.forEach(function (t) { if (activeTest(t)) on = t; });
      if (!on) on = tabs[0];
      p.style.left = on.offsetLeft + "px";
      p.style.top = on.offsetTop + "px";
      p.style.width = on.offsetWidth + "px";
      p.style.height = on.offsetHeight + "px";
    }
    tabs.forEach(function (t) {
      t.addEventListener("click", function () { setTimeout(move, 0); });
      t.addEventListener("keydown", function () { setTimeout(move, 0); });
    });
    window.addEventListener("resize", move);
    if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(move);
    move();
  }
  doc.querySelectorAll(".gallery-filters").forEach(function (g) {
    pill(g, "button[data-filter]", function (t) { return t.getAttribute("aria-pressed") === "true"; });
  });
  doc.querySelectorAll(".segmented").forEach(function (g) {
    pill(g, '[role="tab"]', function (t) { return t.getAttribute("aria-selected") === "true"; });
  });

  /* 4. ui aurora-glow-button: rotating conic halo on the first
     primary CTA in the hero/pagehead. Terra/ochre only. */
  var heroBtn = doc.querySelector(".hero .btn:not(.ghost), .pagehead .btn:not(.ghost), .cta-strip .btn:not(.ghost), .cta-row .btn:not(.ghost), main .btn:not(.ghost)");
  if (heroBtn) heroBtn.classList.add("micro-aurora");

  /* 5. uniqueui border-beam: slow light beam travels the featured
     price card border. Hosts: .costcard on index and rooms. */
  doc.querySelectorAll(".costcard").forEach(function (el) { el.classList.add("micro-beam"); });

  /* 6. react-ui-interactions card hover lift: keyboard-focus parity
     so focus-visible gets the same lift as hover. */
  doc.querySelectorAll(".card").forEach(function (el) {
    el.addEventListener("focusin", function () { el.classList.add("micro-focus"); });
    el.addEventListener("focusout", function () { el.classList.remove("micro-focus"); });
  });
})();
