/* Prajna gallery: WebGL depth displacement + multi-layer parallax.
   Single shared WebGL context on an offscreen canvas; each gallery image
   gets a 2D overlay canvas that receives the processed frame on hover.
   Falls back gracefully when WebGL or pointer events are missing. */
(function () {
  "use strict";

  if (!window.WebGLRenderingContext) return;

  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) return;

  var VERT = [
    "attribute vec2 a_pos;",
    "attribute vec2 a_uv;",
    "varying vec2 v_uv;",
    "void main(){",
    "  gl_Position = vec4(a_pos, 0.0, 1.0);",
    "  v_uv = a_uv;",
    "}"
  ].join("\n");

  var FRAG = [
    "precision mediump float;",
    "varying vec2 v_uv;",
    "uniform sampler2D u_img;",
    "uniform vec2 u_mouse;",
    "uniform vec2 u_dir;",
    "uniform float u_time;",
    "uniform vec2 u_res;",
    "void main(){",
    "  vec2 uv = v_uv;",
    "  vec4 c = texture2D(u_img, uv);",
    "  float lum = dot(c.rgb, vec3(0.299, 0.587, 0.114));",
    "  float depth = smoothstep(0.12, 0.78, lum);",
    "  vec2 shift = u_dir * 0.048 * depth;",
    "  vec2 d = uv - 0.5;",
    "  float r = length(d);",
    "  shift += d * r * 0.02 * depth;",
    "  float ca = 0.0020 * depth * length(u_dir);",
    "  float rr = texture2D(u_img, uv + shift + vec2(ca, 0.0)).r;",
    "  float gg = texture2D(u_img, uv + shift).g;",
    "  float bb = texture2D(u_img, uv + shift - vec2(ca, 0.0)).b;",
    "  float aa = c.a;",
    "  float vig = 1.0 - r * 0.38;",
    "  gl_FragColor = vec4(vec3(rr, gg, bb) * vig, aa);",
    "}"
  ].join("\n");

  function compileShader(gl, type, src) {
    var s = gl.createShader(type);
    s.shaderSource(src);
    s.compileShader();
    if (!s.getShaderParameter(s, s.COMPILE_STATUS)) {
      console.warn("depth-gallery shader error:", s.getShaderInfoLog(s));
      gl.deleteShader(s);
      return null;
    }
    return s;
  }

  function initGL() {
    var off = document.createElement("canvas");
    off.width = 4; off.height = 4;
    var gl = off.getContext("webgl", { alpha: true, premultipliedAlpha: false, antialias: false });
    if (!gl) return null;

    var vs = compileShader(gl, gl.VERTEX_SHADER, VERT);
    var fs = compileShader(gl, gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return null;

    var prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.warn("depth-gallery link error:", gl.getProgramInfoLog(prog));
      return null;
    }

    var loc = {
      aPos: gl.getAttribLocation(prog, "a_pos"),
      aUv: gl.getAttribLocation(prog, "a_uv"),
      uImg: gl.getUniformLocation(prog, "u_img"),
      uMouse: gl.getUniformLocation(prog, "u_mouse"),
      uDir: gl.getUniformLocation(prog, "u_dir"),
      uTime: gl.getUniformLocation(prog, "u_time"),
      uRes: gl.getUniformLocation(prog, "u_res"),
      quad: null
    };

    loc.quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, loc.quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1, 0, 1,   1, -1, 1, 1,  -1, 1, 0, 0,   1, 1, 1, 0
    ]), gl.STATIC_DRAW);

    return { gl: gl, prog: prog, loc: loc };
  }

  var state = initGL();
  if (!state) return;
  var gl = state.gl, prog = state.prog, loc = state.loc;

  var items = document.querySelectorAll(".gallery-item");
  if (!items.length) return;

  var entries = [];
  var mouseX = 0, mouseY = 0, dirX = 0, dirY = 0;
  var raf = null;

  function setupItem(item) {
    var img = item.querySelector(".gallery-image-link img");
    var link = item.querySelector(".gallery-image-link");
    if (!img || !link) return;

    var canvas = document.createElement("canvas");
    canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;pointer-events:none;opacity:0;transition:opacity .32s ease;";
    canvas.setAttribute("aria-hidden", "true");
    link.style.position = "relative";
    link.appendChild(canvas);

    var tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);

    entries.push({ item: item, canvas: canvas, img: img, link: link, tex: tex });

    link.addEventListener("pointermove", function (e) {
      var box = link.getBoundingClientRect();
      mouseX = (e.clientX - box.left) / box.width - 0.5;
      mouseY = (e.clientY - box.top) / box.height - 0.5;
      dirX += (mouseX - dirX) * 0.14;
      dirY += (mouseY - dirY) * 0.14;
      canvas.style.opacity = "1";
      img.style.opacity = "0";
      if (!raf) raf = requestAnimationFrame(renderAll);
    });

    link.addEventListener("pointerleave", function () {
      canvas.style.opacity = "0";
      img.style.opacity = "1";
    });
  }

  function renderOne(entry, t) {
    var w = entry.canvas.clientWidth;
    var h = entry.canvas.clientHeight;
    if (w < 4 || h < 4) return;
    if (entry.canvas.width !== w || entry.canvas.height !== h) {
      entry.canvas.width = w;
      entry.canvas.height = h;
    }
    gl.viewport(0, 0, w, h);
    gl.useProgram(prog);

    gl.bindBuffer(gl.ARRAY_BUFFER, loc.quad);
    gl.enableVertexAttribArray(loc.aPos);
    gl.vertexAttribPointer(loc.aPos, 2, gl.FLOAT, false, 16, 0);
    gl.enableVertexAttribArray(loc.aUv);
    gl.vertexAttribPointer(loc.aUv, 2, gl.FLOAT, false, 16, 8);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, entry.tex);
    gl.uniform1i(loc.uImg, 0);
    gl.uniform2f(loc.uMouse, mouseX, mouseY);
    gl.uniform2f(loc.uDir, dirX, dirY);
    gl.uniform1f(loc.uTime, t * 0.001);
    gl.uniform2f(loc.uRes, w, h);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  function renderAll(t) {
    var any = false;
    for (var i = 0; i < entries.length; i++) {
      if (entries[i].canvas.style.opacity === "1") {
        any = true;
        renderOne(entries[i], t);
      }
    }
    if (!any) {
      raf = null;
      return;
    }
    raf = requestAnimationFrame(renderAll);
  }

  for (var i = 0; i < items.length; i++) {
    setupItem(items[i]);
  }
})();
