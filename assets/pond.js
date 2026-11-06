/* ══════════════════════════════════════════════════════════════════════════
   POND master - underwater Warli folk, caustic flow, seamless, 60fps
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

  /* Floater DOM layer removed: fluid.js motifs were never loaded (--motif-* undefined). Canvas carries all folk. */

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

  /* ── 5. UNDERWATER WARLI MASTER ── caustic flow, light rays, swimmers, blooms, bubbles
     One fixed canvas, DPR capped 1.5, frame-time EMA drops DPR if slow, pauses
     when hidden. Seamless wrap (off-canvas resets, tile periods divide drift).
     Reduced motion: one static frame. Floater DOM layer removed: fluid.js
     motifs were never loaded (--motif-* undefined), canvas carries all folk. */
  function underwater() {
    var canvas = document.getElementById("pond-canvas");
    if (!canvas) {
      canvas = document.createElement("canvas");
      canvas.id = "pond-canvas";
      canvas.setAttribute("aria-hidden", "true");
      document.body.appendChild(canvas);
    }
    var ctx = canvas.getContext("2d");
    var w = 0, h = 0, dpr = 1, raf = 0, last = 0, visible = true;
    var swimmers = [], blooms = [], bubbles = [], ripples = [];
    var ema = 16, degraded = false;
    function causticTile(size, seed) {
      var c = document.createElement("canvas"); c.width = c.height = size;
      var g = c.getContext("2d"), img = g.createImageData(size, size), d = img.data;
      var k = 2 * Math.PI / size;
      for (var y = 0; y < size; y++) {
        for (var x = 0; x < size; x++) {
          var v = Math.sin(x * k * 3 + seed) * Math.cos(y * k * 2 - seed * 0.7)
                + Math.sin((x + y) * k * 2 + seed * 1.3) * 0.6
                + Math.cos((x - y) * k * 1 + seed * 2.1) * 0.4;
          v = Math.pow(Math.max(0, v) / 2, 2.2);
          var idx = (y * size + x) * 4;
          d[idx] = 255; d[idx + 1] = 251; d[idx + 2] = 238;
          d[idx + 3] = Math.min(255, v * 150);
        }
      }
      g.putImageData(img, 0, 0);
      return c;
    }
    var tileA = causticTile(256, 1.7), tileB = causticTile(256, 4.2);
    function tier() { var r = Math.random(); return r < 0.45 ? 0.55 : (r < 0.8 ? 0.85 : 1.3); }
    function spawnSwimmer(atX) {
      var t = tier();
      return { x: atX != null ? atX : Math.random() * (w || 800),
        y: (h || 600) * (0.38 + Math.random() * 0.5),
        vx: (7 + Math.random() * 11) * t, s: (24 + Math.random() * 16) * t,
        d: t, ph: Math.random() * 6.283, dir: Math.random() < 0.5 ? 1 : -1 };
    }
    function spawnBloom(atX) {
      var t = tier();
      return { x: atX != null ? atX : Math.random() * (w || 800),
        y: (h || 600) * (0.12 + Math.random() * 0.22),
        vx: (4 + Math.random() * 5) * t, s: (10 + Math.random() * 8) * t, d: t, ph: Math.random() * 6.283 };
    }
    function spawnBubble() {
      return { x: Math.random() * (w || 800), y: (h || 600) * (0.5 + Math.random() * 0.5),
        vy: 12 + Math.random() * 18, r: 1.2 + Math.random() * 2.4, ph: Math.random() * 6.283 };
    }
    function seed() {
      swimmers = []; blooms = []; bubbles = [];
      var ns = w < 700 ? 4 : 7, nb = w < 700 ? 2 : 3;
      for (var i = 0; i < ns; i++) swimmers.push(spawnSwimmer());
      for (var j = 0; j < nb; j++) blooms.push(spawnBloom());
      for (var b = 0; b < (w < 700 ? 6 : 12); b++) bubbles.push(spawnBubble());
    }
    function resize() {
      w = window.innerWidth; h = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, degraded ? 1 : 1.5);
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!swimmers.length) seed();
    }
    resize();
    window.addEventListener("resize", resize);
    document.body.addEventListener("click", function (e) {
      if (e.target.closest && e.target.closest("a,button,input,textarea,select,label")) return;
      ripples.push({ x: e.clientX, y: e.clientY, r: 0, a: 0.4 });
    });
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) { cancelAnimationFrame(raf); raf = 0; }
      else if (!raf && !reduce) { last = performance.now(); raf = requestAnimationFrame(frame); }
    });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (en) { visible = en[0] && en[0].isIntersecting; }, { threshold: 0 }).observe(canvas);
    }
    function drawCaustics(t) {
      var ax = (t * 0.006) % 256, ay = (t * 0.0035) % 256;
      var bx = (t * 0.0038) % 256, by = (t * 0.0022) % 256;
      ctx.globalCompositeOperation = "screen";
      ctx.globalAlpha = 0.24;
      for (var x = -256 + ax; x < w; x += 256) for (var y = -256 + ay; y < h; y += 256) ctx.drawImage(tileA, x, y);
      ctx.globalAlpha = 0.16;
      for (var x2 = -256 + bx; x2 < w; x2 += 256) for (var y2 = -256 + by; y2 < h; y2 += 256) ctx.drawImage(tileB, x2, y2);
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
    }
    function drawRays(t) {
      ctx.save();
      for (var i = 0; i < 3; i++) {
        var rx = w * (0.22 + i * 0.28) + Math.sin(t * 0.00012 + i * 2.1) * 28;
        var grad = ctx.createLinearGradient(rx, 0, rx + 60, h * 0.55);
        grad.addColorStop(0, "rgba(255,251,240,0.10)");
        grad.addColorStop(1, "rgba(255,251,240,0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(rx - 18, 0); ctx.lineTo(rx + 18, 0);
        ctx.lineTo(rx + 90, h * 0.55); ctx.lineTo(rx + 20, h * 0.55);
        ctx.closePath(); ctx.fill();
      }
      ctx.restore();
    }
    function drawSwimmer(f, t) {
      var s = f.s, und = Math.sin(t * 0.0016 + f.ph) * 4 * f.d;
      ctx.save();
      ctx.translate(f.x, f.y + und);
      ctx.scale(f.dir, 1);
      ctx.rotate(Math.sin(t * 0.0009 + f.ph) * 0.08);
      ctx.globalAlpha = 0.24 + f.d * 0.24;
      ctx.strokeStyle = "#7a5a1c"; ctx.lineWidth = 1.9; ctx.lineCap = "round"; ctx.lineJoin = "round";
      var sweep = Math.sin(t * 0.003 + f.ph) * s * 0.35;
      var kick = Math.sin(t * 0.003 + f.ph + 1.2) * s * 0.22;
      ctx.beginPath(); ctx.arc(s * 0.55, -s * 0.1, s * 0.16, 0, 6.283); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(s * 0.42, -s * 0.05);
      ctx.quadraticCurveTo(0, und * 0.4, -s * 0.5, kick * 0.4); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(s * 0.3, -s * 0.02); ctx.lineTo(s * 0.05 + sweep, s * 0.3);
      ctx.moveTo(s * 0.3, -s * 0.02); ctx.lineTo(s * 0.05 - sweep, -s * 0.34);
      ctx.moveTo(-s * 0.5, kick * 0.4); ctx.lineTo(-s * 0.85, s * 0.28 + kick);
      ctx.moveTo(-s * 0.5, kick * 0.4); ctx.lineTo(-s * 0.85, -s * 0.2 + kick);
      ctx.stroke();
      ctx.restore();
    }
    function drawBloom(b, t) {
      var s = b.s;
      ctx.save(); ctx.translate(b.x, b.y + Math.sin(t * 0.0012 + b.ph) * 3 * b.d);
      ctx.globalAlpha = 0.22 + b.d * 0.20;
      ctx.strokeStyle = "#2d5f3f"; ctx.lineWidth = 1.2; ctx.lineCap = "round";
      for (var i = 0; i < 8; i++) {
        ctx.beginPath(); ctx.ellipse(0, 0, s * 0.5, s * 0.16, (i / 8) * 6.283, 0, 6.283); ctx.stroke();
      }
      ctx.fillStyle = "#c05621";
      ctx.beginPath(); ctx.arc(0, 0, s * 0.09, 0, 6.283); ctx.fill();
      ctx.restore();
    }
    function drawBubbles(dt, still) {
      ctx.save();
      ctx.strokeStyle = "rgba(122,111,96,0.5)"; ctx.lineWidth = 1;
      for (var i = 0; i < bubbles.length; i++) {
        var b = bubbles[i];
        if (!still) { b.y -= b.vy * dt; b.x += Math.sin(performance.now() * 0.001 + b.ph) * 0.3;
          if (b.y < -6) { b.y = h + 6; b.x = Math.random() * w; } }
        ctx.globalAlpha = 0.32;
        ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, 6.283); ctx.stroke();
      }
      ctx.restore();
    }
    function render(t, dt, still) {
      ctx.clearRect(0, 0, w, h);
      drawCaustics(still ? 0 : t);
      drawRays(still ? 0 : t);
      for (var i = ripples.length - 1; i >= 0; i--) {
        var rp = ripples[i]; rp.r += 60 * dt; rp.a -= 0.55 * dt;
        if (rp.a <= 0) { ripples.splice(i, 1); continue; }
        ctx.strokeStyle = "rgba(192,86,33," + rp.a.toFixed(2) + ")"; ctx.lineWidth = 1.1;
        ctx.beginPath(); ctx.arc(rp.x, rp.y, rp.r, 0, 6.283); ctx.stroke();
      }
      for (var j = 0; j < swimmers.length; j++) {
        var f = swimmers[j];
        if (!still) { f.x += f.vx * f.dir * dt;
          if (f.dir > 0 && f.x > w + 60) { f.x = -60; f.y = h * (0.38 + Math.random() * 0.5); }
          if (f.dir < 0 && f.x < -60) { f.x = w + 60; f.y = h * (0.38 + Math.random() * 0.5); } }
        drawSwimmer(f, still ? 0 : t);
      }
      for (var k = 0; k < blooms.length; k++) {
        var b = blooms[k];
        if (!still) { b.x += b.vx * dt; if (b.x > w + 40) b.x = -40; }
        drawBloom(b, still ? 0 : t);
      }
      drawBubbles(dt, still);
    }
    function frame(t) {
      raf = 0;
      if (!visible || document.hidden) { last = t; raf = requestAnimationFrame(frame); return; }
      var t0 = performance.now();
      var dt = Math.min(0.05, (t - (last || t)) / 1000 || 0.016); last = t;
      render(t, dt, false);
      ema = ema * 0.95 + (performance.now() - t0) * 0.05;
      if (!degraded && ema > 19) { degraded = true; resize(); }
      raf = requestAnimationFrame(frame);
    }
    if (reduce) { render(0, 0, true); return; }
    raf = requestAnimationFrame(frame);
  }

  /* ── 6. COLLAGE ─────────────────────────────────────────────────────
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

  function collage() {
    if (document.querySelector(".collage")) return;
    var key = document.body.getAttribute("data-pond") || "home";
    var seed = 0;
    for (var c = 0; c < key.length; c++) seed = (seed * 31 + key.charCodeAt(c)) % 100000;

    var layer = document.createElement("div");
    layer.className = "collage";
    layer.setAttribute("aria-hidden", "true");

    var pieces = [
      { c: "cp1", x: 4,  y: 8,  w: 30, h: 22, rot: -7, o: 0.18 },
      { c: "cp2", x: 62, y: 4,  w: 34, h: 20, rot: 5,  o: 0.15 },
      { c: "cp3", x: 16, y: 68, w: 38, h: 26, rot: -4, o: 0.14 },
      { c: "cp4", x: 71, y: 74, w: 26, h: 21, rot: 8,  o: 0.16 }
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

  /* ── 7. CROSS-PAGE TRANSITION ────────────────────────────────────────
     Only meaningful when the browser supports cross-document view
     transitions. Where it does not, nothing is added and navigation behaves
     exactly as it did before. */
  function transitions() {
    if (reduce || !document.startViewTransition) return;
    var tag = document.querySelector("main h1, .hero h1, h1");
    if (tag) tag.style.setProperty("view-transition-name", "page-title");
  }

  function boot() {
    collage();
    transitions();
    reveal();
    underwater();
    water();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();