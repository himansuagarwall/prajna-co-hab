/* ══════════════════════════════════════════════════════════════════════════
   POND - page scenes, a seamless load transition, and floating elements
   ---------------------------------------------------------------------------
   fluid.js owns the water itself (one shared canvas, one rAF loop, ~0.7ms a
   frame). This file never draws to that canvas. It adds three things on top,
   all of which are free per frame because they are DOM + CSS, not pixels:

     1. SCENES  - every page currently gets the same five folk motifs. These
                  are chosen per page instead, so the gallery is quiet and the
                  house feels like water. Data comes from <body data-pond="…">.
     2. REVEAL  - a pond-surface overlay on first paint: rings spread, the
                  water settles, then the surface lifts. No white flash, and
                  the page is already visible underneath, so it reads as the
                  pond settling rather than a loader.
     3. TRANSITION - cross-page navigation uses the View Transitions API where
                  the browser supports it, so moving between pages is a single
                  continuous move instead of a cut. Falls back silently.

   Honours prefers-reduced-motion: the reveal is skipped outright and the
   floating elements hold still rather than drifting.
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
      /* parallax depth: far = small/faint/blurred/slow, near = large/clear */
      var depth = 0.6 + Math.random() * 0.9;               /* 0.6 far .. 1.5 near */
      el.style.setProperty("--pf-size", (size * depth).toFixed(0) + "px");
      el.style.setProperty("--pf-blur", ((1.5 - depth) * 0.6).toFixed(2) + "px");
      el.style.setProperty("--pf-x", (x * 100).toFixed(1) + "%");
      el.style.setProperty("--pf-y", (y * 100).toFixed(1) + "%");
      el.style.setProperty("--pf-dur", (span * (1.6 - depth * 0.4)).toFixed(1) + "s");
      el.style.setProperty("--pf-delay", (-Math.random() * span).toFixed(1) + "s");
      el.style.setProperty("--pf-rise", (rise * depth).toFixed(3));
      el.style.setProperty("--pf-tilt", (Math.random() * 26 - 13).toFixed(1) + "deg");
      el.style.setProperty("--pf-op", ((0.30 + Math.random() * 0.30) * (0.5 + depth * 0.4)).toFixed(2));
      layer.appendChild(el);
    }
  }

  /* ── 2. REVEAL ───────────────────────────────────────────────────────
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

  /* ── 5. FOLK ART CANVAS ── Warli figures, diya lamps, lotus blooms, click ripples
     One rAF loop, dt-based (frame-rate independent), paused when hidden
     off-screen. Depth tiers (far/mid/near) give parallax: far is small,
     faint and slow; near is large and clear. All wraps happen fully
     off-canvas so nothing pops, gradients are pre-rendered sprites, and
     reduced-motion draws a single static frame. */
  function folkArt() {
    var canvas = document.getElementById("pond-canvas");
    if (!canvas) {
      canvas = document.createElement("canvas");
      canvas.id = "pond-canvas";
      canvas.setAttribute("aria-hidden", "true");
      document.body.appendChild(canvas);
    }
    var ctx = canvas.getContext("2d");
    var w = 0, h = 0, dpr = 1;
    var warli = [], diyas = [], lotuses = [], ripples = [];
    var lotusAcc = 0, raf = 0, last = 0, visible = true;

    function tier() { var r = Math.random(); return r < 0.4 ? 0.6 : (r < 0.75 ? 1 : 1.45); }
    function spawn(atX) {
      var t = tier();
      return { x: atX != null ? atX : Math.random() * (w || 800),
        y: (h || 600) * 0.55 + Math.random() * (h || 600) * 0.38,
        vx: (6 + Math.random() * 14) * t, s: (13 + Math.random() * 9) * t,
        d: t, ph: Math.random() * 6.283 };
    }
    function spawnDiya(atX) {
      var t = tier();
      return { x: atX != null ? atX : Math.random() * (w || 800),
        y: (h || 600) * 0.58 + Math.random() * (h || 600) * 0.34,
        vx: (3 + Math.random() * 6) * t, s: (8 + Math.random() * 6) * t,
        d: t, bob: Math.random() * 6.283 };
    }
    function flame(s) { /* pre-rendered glow sprite: no per-frame gradient alloc */
      var c = document.createElement("canvas"), r = Math.max(2, Math.round(s * 1.4));
      c.width = c.height = r * 2; var g = c.getContext("2d");
      var gr = g.createRadialGradient(r, r, r * 0.06, r, r, r);
      gr.addColorStop(0, "rgba(255,200,100,.42)"); gr.addColorStop(1, "rgba(199,91,58,0)");
      g.fillStyle = gr; g.fillRect(0, 0, r * 2, r * 2); return c;
    }
    function resize() {
      w = window.innerWidth; h = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!warli.length) { for (var i = 0; i < 5; i++) warli.push(spawn());
        for (var j = 0; j < 6; j++) { var d = spawnDiya(); d.sprite = flame(d.s); diyas.push(d); } }
    }
    resize();
    window.addEventListener("resize", resize);
    document.body.addEventListener("click", function (e) {
      if (e.target.closest && e.target.closest("a,button,input,textarea,select,label")) return;
      ripples.push({ x: e.clientX, y: e.clientY, r: 0, a: 0.5 });
    });
    /* pause when tab hidden or canvas scrolled off-screen: no jank, no wasted frames */
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) { cancelAnimationFrame(raf); raf = 0; }
      else if (!raf && !reduce) { last = performance.now(); raf = requestAnimationFrame(frame); }
    });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (en) { visible = en[0] && en[0].isIntersecting; },
        { threshold: 0 }).observe(canvas);
    }

    function drawWarli(f, t) {
      var s = f.s, walk = Math.sin(t * 0.0018 + f.ph) * 5 * f.d;
      ctx.save(); ctx.translate(f.x, f.y + walk);
      ctx.globalAlpha = 0.35 + f.d * 0.32;
      ctx.strokeStyle = "#C75B3A"; ctx.lineWidth = 1.6; ctx.lineCap = "round"; ctx.lineJoin = "round";
      ctx.beginPath(); ctx.arc(0, -s * 0.75, s * 0.2, 0, 6.283); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, -s * 0.52); ctx.lineTo(-s * 0.28, s * 0.12); ctx.lineTo(s * 0.28, s * 0.12); ctx.closePath(); ctx.stroke();
      var arm = Math.sin(t * 0.0025 + f.ph) * 0.35;
      ctx.beginPath();
      ctx.moveTo(0, s * 0.12); ctx.lineTo(-s * 0.22, s * 0.72);
      ctx.moveTo(0, s * 0.12); ctx.lineTo(s * 0.22, s * 0.72);
      ctx.moveTo(0, -s * 0.32); ctx.lineTo(-s * 0.38 + Math.sin(arm) * s * 0.12, s * 0.04);
      ctx.moveTo(0, -s * 0.32); ctx.lineTo(s * 0.38 - Math.sin(arm) * s * 0.12, s * 0.04);
      ctx.stroke(); ctx.restore();
    }
    function drawDiya(d, t, still) {
      var s = d.s, bob = still ? 0 : Math.sin(t * 0.0035 + d.bob) * 3 * d.d;
      ctx.save(); ctx.translate(d.x, d.y + bob);
      ctx.globalAlpha = 0.4 + d.d * 0.35;
      var fl = still ? 1 : 0.82 + Math.sin(t * 0.012 + d.bob) * 0.18;
      ctx.globalAlpha *= fl;
      if (d.sprite) ctx.drawImage(d.sprite, -s * 0.7, -s * 0.7, s * 1.4, s * 1.4);
      ctx.strokeStyle = "#D4A94C"; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.arc(0, 0, s * 0.32, Math.PI, 0); ctx.stroke();
      ctx.strokeStyle = "#C75B3A"; ctx.lineWidth = 1.1;
      ctx.beginPath(); ctx.moveTo(-s * 0.07, -s * 0.02);
      ctx.quadraticCurveTo(0, -s * 0.42, s * 0.07, -s * 0.02); ctx.stroke();
      ctx.restore();
    }
    function drawLotus(l, t) {
      var s = l.size * l.d * l.scale; if (s < 0.4) return;
      ctx.save(); ctx.translate(l.x, l.y);
      ctx.globalAlpha = l.fade * (0.3 + l.d * 0.35);
      ctx.strokeStyle = "#2D5F3F"; ctx.lineWidth = 1.1; ctx.lineCap = "round";
      for (var i = 0; i < 8; i++) {
        ctx.beginPath(); ctx.ellipse(0, 0, s * 0.45, s * 0.14, (i / 8) * 6.283, 0, 6.283); ctx.stroke();
      }
      ctx.fillStyle = "#D4A94C"; ctx.beginPath(); ctx.arc(0, 0, s * 0.07, 0, 6.283); ctx.fill();
      ctx.restore();
    }
    function render(t, dt, still) {
      ctx.clearRect(0, 0, w, h);
      for (var i = ripples.length - 1; i >= 0; i--) {
        var rp = ripples[i]; rp.r += 66 * dt; rp.a -= 0.6 * dt;
        if (rp.a <= 0) { ripples.splice(i, 1); continue; }
        ctx.strokeStyle = "rgba(192,86,33," + rp.a.toFixed(2) + ")"; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.arc(rp.x, rp.y, rp.r, 0, 6.283); ctx.stroke();
      }
      for (var i = 0; i < warli.length; i++) {
        var f = warli[i]; if (!still) { f.x += f.vx * dt; if (f.x > w + 30) { f.x = -30; f.y = (h || 600) * 0.55 + Math.random() * (h || 600) * 0.38; } }
        drawWarli(f, t);
      }
      for (var i = 0; i < diyas.length; i++) {
        var d = diyas[i]; if (!still) { d.x += d.vx * dt; if (d.x > w + 20) { d.x = -20; d.y = (h || 600) * 0.58 + Math.random() * (h || 600) * 0.34; } }
        drawDiya(d, t, still);
      }
      if (!still) {
        lotusAcc += dt;
        if (lotusAcc > 2.2 + Math.random() * 2.5) { lotusAcc = 0;
          var lt = tier(); lotuses.push({ x: 50 + Math.random() * Math.max(1, w - 100),
            y: (h || 600) * 0.5 + Math.random() * (h || 600) * 0.35,
            size: 10 + Math.random() * 10, d: lt, scale: 0, fade: 0, vx: 4 * lt }); }
        for (var i = lotuses.length - 1; i >= 0; i--) {
          var l = lotuses[i]; l.x += l.vx * dt; l.scale = Math.min(1, l.scale + dt * 0.5);
          l.fade = Math.min(1, l.fade + dt * 0.8);
          if (l.x > w + 30) { lotuses.splice(i, 1); continue; }
          drawLotus(l, t);
        }
      } else { /* reduced-motion: one static frame, no loop */
        var st = { x: w * 0.2, y: h * 0.68, size: 16, d: 0.8, scale: 1, fade: 1 };
        drawLotus(st, t);
      }
    }
    function frame(t) {
      raf = 0;
      if (!visible || document.hidden) { last = t; raf = requestAnimationFrame(frame); return; }
      var dt = Math.min(0.05, (t - (last || t)) / 1000 || 0.016); last = t;
      render(t, dt, false);
      raf = requestAnimationFrame(frame);
    }
    if (reduce) { render(0, 0, true); return; }
    raf = requestAnimationFrame(frame);
  }

  /* ── 6. ASSEMBLAGE ─────────────────────────────────────────────────────
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

  /* ── 4. CROSS-PAGE TRANSITION ────────────────────────────────────────
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
    folkArt();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();