/* Prajna photo gallery: filtered editorial grid, immersive fullscreen lightbox with 3D parallax. */
(function () {
  "use strict";

  var grid = document.getElementById("gallery-grid");
  var lightbox = document.getElementById("lightbox-backdrop");
  if (!grid || !lightbox) return;

  var items = Array.prototype.slice.call(grid.querySelectorAll(".gallery-item"));
  var filters = Array.prototype.slice.call(document.querySelectorAll("[data-filter]"));
  var count = document.getElementById("gallery-count");
  var photo = lightbox.querySelector(".lightbox-image");
  var caption = lightbox.querySelector(".lightbox-caption");
  var wrapper = lightbox.querySelector(".lightbox-image-wrapper");
  var counter = lightbox.querySelector(".lightbox-counter");
  var active = [];
  var current = 0;
  var returnFocus = null;
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia && window.matchMedia("(pointer:fine)").matches;

  function labelCount(n) {
    return n + (n === 1 ? " photograph" : " photographs");
  }

  function applyFilter(value) {
    filters.forEach(function (button) {
      var selected = button.getAttribute("data-filter") === value;
      button.setAttribute("aria-pressed", selected ? "true" : "false");
    });
    items.forEach(function (item) {
      item.hidden = value !== "all" && item.getAttribute("data-category") !== value;
    });
    active = items.filter(function (item) { return !item.hidden; });
    count.textContent = labelCount(active.length);
  }

  filters.forEach(function (button) {
    button.addEventListener("click", function () {
      applyFilter(button.getAttribute("data-filter"));
    });
  });
  applyFilter("all");

  function preloadAdjacent() {
    if (!active.length) return;
    var prevIndex = (current - 1 + active.length) % active.length;
    var nextIndex = (current + 1) % active.length;
    var sources = [];
    [prevIndex, nextIndex].forEach(function (idx) {
      var item = active[idx];
      if (!item) return;
      var link = item.querySelector(".gallery-image-link");
      if (!link) return;
      sources.push(link.href);
    });
    sources.forEach(function (src) {
      var img = new Image();
      img.src = src;
    });
  }

  function paint(index) {
    if (!active.length) return;
    current = (index + active.length) % active.length;
    var item = active[current];
    var link = item.querySelector(".gallery-image-link");
    var image = item.querySelector("img");
    var title = item.querySelector("figcaption > span");
    photo.src = link.href;
    photo.alt = image.alt;
    caption.textContent = title ? title.textContent : image.alt;
    counter.textContent = (current + 1) + " / " + active.length;
    preloadAdjacent();
  }

  function openLightbox() {
    active = items.filter(function (item) { return !item.hidden; });
    if (!active.length) return;
    lightbox.setAttribute("aria-hidden", "false");
    lightbox.classList.add("is-open");
    document.body.style.overflow = "hidden";
    preloadAdjacent();
  }

  function closeLightbox() {
    lightbox.classList.remove("is-open");
    lightbox.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    if (returnFocus && document.contains(returnFocus)) returnFocus.focus({ preventScroll: true });
    returnFocus = null;
  }

  grid.addEventListener("click", function (event) {
    var link = event.target.closest(".gallery-image-link");
    if (!link) return;
    event.preventDefault();
    var item = link.closest(".gallery-item");
    active = items.filter(function (item) { return !item.hidden; });
    paint(active.indexOf(item));
    returnFocus = link;
    openLightbox();
    log("gallery_open", item.getAttribute("data-category"));
  });

  lightbox.querySelector(".lightbox-close").addEventListener("click", closeLightbox);
  lightbox.querySelector(".lightbox-prev").addEventListener("click", function () { paint(current - 1); });
  lightbox.querySelector(".lightbox-next").addEventListener("click", function () { paint(current + 1); });

  lightbox.addEventListener("click", function (event) {
    if (event.target === lightbox) closeLightbox();
  });

  document.addEventListener("keydown", function (event) {
    if (!lightbox.classList.contains("is-open")) return;
    if (event.key === "Escape") { event.preventDefault(); closeLightbox(); }
    if (event.key === "ArrowLeft") { event.preventDefault(); paint(current - 1); }
    if (event.key === "ArrowRight") { event.preventDefault(); paint(current + 1); }
  });

  var touchX = null;
  var touchY = null;
  lightbox.addEventListener("touchstart", function (event) {
    touchX = event.touches[0].clientX;
    touchY = event.touches[0].clientY;
  }, { passive: true });
  lightbox.addEventListener("touchmove", function (event) {
    if (touchX === null || touchY === null) return;
    var dx = event.touches[0].clientX - touchX;
    var dy = event.touches[0].clientY - touchY;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10) {
      event.preventDefault();
    }
  }, { passive: false });
  lightbox.addEventListener("touchend", function (event) {
    if (touchX === null) return;
    var delta = event.changedTouches[0].clientX - touchX;
    var vertDelta = event.changedTouches[0].clientY - touchY;
    if (Math.abs(delta) > 48 && Math.abs(delta) > Math.abs(vertDelta)) {
      paint(current + (delta < 0 ? 1 : -1));
    }
    touchX = null;
    touchY = null;
  }, { passive: true });

  /* 3D parallax tilt in lightbox */
  if (finePointer && !reduceMotion) {
    lightbox.addEventListener("pointermove", function (event) {
      var rect = wrapper.getBoundingClientRect();
      var x = (event.clientX - rect.left) / rect.width - 0.5;
      var y = (event.clientY - rect.top) / rect.height - 0.5;
      var tiltX = (-y * 6).toFixed(2) + "deg";
      var tiltY = (x * 6).toFixed(2) + "deg";
      wrapper.style.transform = "rotateX(" + tiltX + ") rotateY(" + tiltY + ") translateZ(0)";
      wrapper.classList.add("is-tilting");
    });
    lightbox.addEventListener("pointerleave", function () {
      wrapper.style.transform = "rotateX(0deg) rotateY(0deg) translateZ(0)";
      wrapper.classList.remove("is-tilting");
    });
  }

  if (!reduceMotion && "IntersectionObserver" in window) {
    document.documentElement.classList.add("gallery-motion-ready");
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("gallery-visible");
        observer.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -48px 0px", threshold: 0.08 });
    items.forEach(function (item) { observer.observe(item); });
  }

  function log(eventName, extra) {
    var endpoint = (window.PRAJNA || {}).endpoint;
    if (!endpoint || !navigator.sendBeacon) return;
    try {
      navigator.sendBeacon(endpoint, JSON.stringify({
        type: "visit", event: eventName, page: location.pathname,
        extra: extra || "", ref: document.referrer || "",
        screen: (screen.width || 0) + "x" + (screen.height || 0),
        lang: navigator.language || ""
      }));
    } catch (error) { /* analytics must never block the gallery */ }
  }
})();
