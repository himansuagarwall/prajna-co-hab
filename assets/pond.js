/* ══════════════════════════════════════════════════════════════════════════
   POND - page scenes, the water surface, and a seamless load transition
   ---------------------------------------------------------------------------
   fluid.js owns the deep water (one shared canvas, one rAF loop, ~0.7ms a
   frame). This file never draws to that canvas. It adds three things on top,
   all free per frame because they are DOM + CSS, not pixels:

     1. SCENES  - every page currently gets the same five folk motifs. These
                  are chosen per page instead, so the gallery is quiet and the
                  house feels like water. Data comes from <body data-pond="…">.
     2. WATER   - a clear surface over the bed: drifting caustic light, a slow
                  flow sheen, and rings that spread where a finger or cursor
                  touches the water. Transform/opacity only, so the whole
                  layer rides the compositor and costs no per-frame JS.
     3. REVEAL  - a pond-surface overlay on first paint: rings spread, the
                  water settles, then the surface lifts. No white flash, and
                  the page is already visible underneath, so it reads as the
                  pond settling rather than a loader.
     4. TRANSITION - cross-page navigation uses the View Transitions API where
                  the browser supports it, so moving between pages is a single
                  continuous move instead of a cut. Falls back silently.

   Honours prefers-reduced-motion: the reveal is skipped outright, the water
   holds still as a static sheen, and the floating elements hold still.
   ══════════════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ── 1. SCENES ────────────────────────────────────────────────────────
     Motif ids index into fluid.js's MOTIFS array:
       0 lotus · 1 fish · 2 peacock eye · 3 mandana diamond · 4 sprig
     count is how many float; spread is the horizontal area they roam. */
  var SCENES = {
    home:     { motifs: [0, 4, 3],       count: 7,  spread: 1.00, size: [78, 150], rise: [0.10, 0.20] },
    gallery:  { motifs: [3, 2],          count: 4,  spread: 1.00, size: [52,  92], rise: [0.06, 0.11] },
    about:    { motifs: [0, 4],          count: 5,  spread: 0.95, size: [60, 116], rise: [0.08, 0.15] },
    contact:  { motifs: [0, 3],          count: 5,  spread: 0.95, size: [60, 112], rise: [0.08, 0.15] },
    pit:      { motifs: [1, 3],          count: 5,  spread: 0.95, size: [58, 108], rise: [0.09, 0.17] },
    discover: { motifs: [4, 1],          count: 6,  spread: 1.00, size: [62, 124], rise: [0.09, 0.18] },
    pune:     { motifs: [4, 2],          count: 6,  spread: 1.00, size: [62, 124], rise: [0.09, 0.18] },
    feedback: { motifs: [0, 3],          count: 4,  spread: 0.90, size: [56, 104], rise: [0.07, 0.14] },
    notfound: { motifs: [3],             count: 3,  spread: 0.90, size: [54,  98], rise: [0.06, 0.12] },
    blog: { motifs: [4, 0], count: 5, spread: 0.95, size: [58, 108], rise: [0.08, 0.15] },
    testimonials: { motifs: [0, 3], count: 4, spread: 0.90, size: [56, 104], rise: [0.07, 0.14] },
    rooms: { motifs: [0, 4, 3], count: 6, spread: 1.00, size: [60, 116], rise: [0.08, 0.16] }
  };

  function scene() {
    var key = document.body.getAttribute("data-pond");
    return SCENES[key] || SCENES.home;
  }

  function buildFloaters(sc) {
    if (document.querySelector(".pondfloat")) return;
    var layer = document.createElement("div");
    layer.className = "pondfloat";
    layer.setAttribute("aria-hidden", "true");
    document.body.appendChild(layer);

    for (var i = 0; i < sc.count; i++) {
      var el = document.createElement("span");
      el.className = "pf";
      var m = sc.motifs[i % sc.motifs.length];
      var size = sc.size[0] + Math.random() * (sc.size[1] - sc.size[0]);
      var span = (10 + Math.random() * 12).toFixed(1);          /* drift period, s */
      var x = ((i + 0.5) / sc.count) * sc.spread;
      /* jitter each one off its even slot so the row never looks like a grid */
      x = Math.max(0.03, Math.min(0.97, x + (Math.random() - 0.5) * 0.09));
      var y = 0.16 + Math.random() * 0.74;
      var rise = sc.rise[0] + Math.random() * (sc.rise[1] - sc.rise[0]);

      el.style.setProperty("--pf-m", "var(--motif-" + m + ")");
      el.style.setProperty("--pf-size", size.toFixed(0) + "px");
      el.style.setProperty("--pf-x", (x * 100).toFixed(1) + "%");
      el.style.setProperty("--pf-y", (y * 100).toFixed(1) + "%");
      el.style.setProperty("--pf-dur", span + "s");
      el.style.setProperty("--pf-delay", (-Math.random() * span).toFixed(1) + "s");
      el.style.setProperty("--pf-rise", rise.toFixed(3));
      el.style.setProperty("--pf-tilt", (Math.random() * 26 - 13).toFixed(1) + "deg");
      el.style.setProperty("--pf-op", (0.30 + Math.random() * 0.30).toFixed(2));
      layer.appendChild(el);
    }
  }

  /* ── 3. REVEAL ───────────────────────────────────────────────────────
     Runs once per page load. The surface sits over the already-painted page,
     rings spread across it, it thins out, then it is removed from the DOM so
     it can never intercept a click or add a compositing layer. */
  function reveal() {
    if (reduce) return;
    var r = document.createElement("div");
    r.className = "pondreveal";
    r.setAttribute("aria-hidden", "true");
    r.innerHTML = '<span class="pring p1"></span><span class="pring p2"></span><span class="pring p3"></span>';
    document.body.appendChild(r);

    var kill = function () { if (r.parentNode) r.parentNode.removeChild(r); };
    var timer = setTimeout(kill, 1500);
    r.addEventListener("animationend", function (e) {
      if (e.target === r) { clearTimeout(timer); kill(); }
    });
    /* belt and braces: if animations never fire (background tab), still clean up */
    setTimeout(kill, 2600);
  }

  /* ── 2. WATER SURFACE ───────────────────────────────────────────────────
     A clear sheet of water over fluid.js's bed: caustic light drifting in
     two tileable bands at different speeds, a slower flow sheen, and rings
     where the water is touched. Every motion is a CSS transform on a fixed
     layer, so nothing here runs per-frame JavaScript. The patterns repeat
     on exact tile sizes, so each loop is seamless by construction: the
     animation ends exactly one tile over from where it started.

     What sells it: light first (pale caustic bands at very low alpha, so
     the bed stays visible), motion second (slow, in one direction, never
     reversing), and touch last (a quiet ring that opens and thins, gone
     in under a second). No blue, no foam, no clumsy bobbing. */
  function water() {
    if (document.querySelector(".pondwater")) return;
    var layer = document.createElement("div");
    layer.className = "pondwater";
    layer.setAttribute("aria-hidden", "true");
    layer.innerHTML = '<span class="pw-caustic c1"></span><span class="pw-caustic c2"></span><span class="pw-sheen"></span>';
    document.body.appendChild(layer);

    if (reduce) return; /* static sheen only; CSS holds it still */

    var ripples = 0, last = 0;
    var MAX = 10; /* cap live rings so fast tapping never piles up nodes */
    document.addEventListener("pointerdown", function (e) {
      var now = performance.now();
      if (now - last < 70 || ripples >= MAX) return;
      last = now;
      var r = document.createElement("span");
      r.className = "pondripple";
      r.setAttribute("aria-hidden", "true");
      r.style.left = e.clientX + "px";
      r.style.top = e.clientY + "px";
      document.body.appendChild(r);
      ripples++;
      var kill = function () { if (r.parentNode) r.parentNode.removeChild(r); ripples--; };
      r.addEventListener("animationend", kill);
      setTimeout(kill, 1400); /* belt and braces, as with the reveal */
    }, { passive: true });
  }

  /* ── 4. COLLAGE ─────────────────────────────────────────────────────
     The collage look is overlapping pieces of hand-torn paper: irregular
     clip-path outlines, a wash of colour, and a soft shadow so one sits
     above the next. Geometry is derived from the scene so the arrangement is
     stable per page - a reload gives you the same collage, not a new one.
     Fixed and pointer-events:none, so it never costs layout or a click. */
  function torn(seed) {
    /* A torn scrap is NOT a lumpy circle. Two things sell it:
         - the radius swings hard, well outside the 50-66% band a blob uses
         - neighbouring points alternate short/long, which gives the ragged
           peaks-and-valleys of a tear rather than a wobble
       17 points at that variance reads as paper; 13 at 50-66% read as a pebble. */
    var pts = [], n = 17, s = seed;
    function rnd() { s = (s * 9301 + 49297) % 233280; return s / 233280; }
    for (var i = 0; i < n; i++) {
      var a = (i / n) * Math.PI * 2;
      var swing = (i % 2 === 0) ? 1 : 0.58;          /* alternate long / short */
      var r = (40 + rnd() * 26) * swing;
      pts.push((50 + Math.cos(a) * r).toFixed(1) + "% " + (50 + Math.sin(a) * r).toFixed(1) + "%");
    }
    return "polygon(" + pts.join(",") + ")";
  }

  function collage(sc) {
    if (document.querySelector(".collage")) return;
    var key = document.body.getAttribute("data-pond") || "home";
    var seed = 0;
    for (var c = 0; c < key.length; c++) seed = (seed * 31 + key.charCodeAt(c)) % 100000;

    var layer = document.createElement("div");
    layer.className = "collage";
    layer.setAttribute("aria-hidden", "true");

    var pieces = [
      { c: "cp1", x: 4,  y: 8,  w: 30, h: 22, rot: -7, o: 0.30 },
      { c: "cp2", x: 62, y: 4,  w: 34, h: 20, rot: 5,  o: 0.24 },
      { c: "cp3", x: 16, y: 68, w: 38, h: 26, rot: -4, o: 0.22 },
      { c: "cp4", x: 71, y: 74, w: 26, h: 21, rot: 8,  o: 0.26 }
    ];
    for (var i = 0; i < pieces.length; i++) {
      var p = pieces[i], el = document.createElement("span");
      el.className = "cp " + p.c;
      el.style.left = p.x + "%";
      el.style.top = p.y + "%";
      el.style.width = p.w + "%";
      el.style.height = p.h + "%";
      /* as a custom property, not opacity directly: the small-screen rule
         scales it down and an inline opacity would beat that */
      el.style.setProperty("--o", p.o);
      el.style.transform = "rotate(" + p.rot + "deg)";
      el.style.clipPath = torn(seed + i * 977);
      layer.appendChild(el);
    }
    document.body.appendChild(layer);
  }

  /* ── 5. CROSS-PAGE TRANSITION ────────────────────────────────────────
     Only meaningful when the browser supports cross-document view
     transitions. Where it does not, nothing is added and navigation behaves
     exactly as it did before. */
  function transitions() {
    if (reduce || !document.startViewTransition) return;
    var tag = document.querySelector("main h1, .hero h1, h1");
    if (tag) tag.style.setProperty("view-transition-name", "page-title");
  }

  function boot() {
    var sc = scene();
    buildFloaters(sc);
    collage(sc);
    transitions();
    reveal();
    water();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();