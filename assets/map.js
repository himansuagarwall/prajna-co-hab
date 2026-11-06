/* Map master: Leaflet label-pane pattern (sample-websites #9). Two CARTO
   layers: light_nolabels under, light_only_labels in a custom pane at
   zIndex 650 with pointer-events none, so labels float above the quiet
   basemap and never block the marker. Warm CSS filter keeps the parchment
   ground. Static fallback frame if CDN/tiles fail. */
(function(){
  "use strict";
  var el = document.getElementById("map");
  if (!el) return;
  var ADDR = "Anandrao Lande Road, Balaji Nagar, Bhosari Industrial Estate, Pimpri-Chinchwad, Maharashtra 411026";
  var MAPS = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(ADDR);
  var MAIL = "mailto:srijna2b@gmail.com?subject=" + encodeURIComponent("Prajna Co-hab enquiry") +
             "&body=" + encodeURIComponent("Hi, I would like to enquire about Prajna Co-hab.");
  var LOTUS = '<svg viewBox="0 0 120 80" aria-hidden="true"><g stroke="#3a322a" stroke-width="3" stroke-linejoin="round">'
    + '<path d="M60 50 C46 48 28 44 14 38 C26 50 46 54 60 50 Z" fill="#c05621"/>'
    + '<path d="M60 50 C74 48 92 44 106 38 C94 50 74 54 60 50 Z" fill="#c05621"/>'
    + '<path d="M60 50 C50 42 38 30 32 14 C46 22 58 36 60 50 Z" fill="#d9a441"/>'
    + '<path d="M60 50 C70 42 82 30 88 14 C74 22 62 36 60 50 Z" fill="#d9a441"/>'
    + '<path d="M60 50 C52 36 53 18 60 6 C67 18 68 36 60 50 Z" fill="#c05621"/></g>'
    + '<path d="M18 66 Q60 72 102 66" fill="none" stroke="#7a5a1c" stroke-width="4" stroke-linecap="round"/></svg>';

  function staticFrame(){
    if (el.querySelector(".map-static")) return;
    var d = document.createElement("div");
    d.className = "map-static";
    d.setAttribute("role","img");
    d.setAttribute("aria-label","Map showing Prajna Co-hab in Balaji Nagar, Bhosari");
    d.innerHTML = LOTUS + "<b>Prajna Co-hab</b><span>" + ADDR + "</span>"
      + '<div class="map-static-links"><a class="btn ghost" href="' + MAPS + '" target="_blank" rel="noopener">Open in Maps</a>'
      + '<a class="btn" href="' + MAIL + '">Enquire</a></div>';
    el.appendChild(d);
  }
  staticFrame();

  if (typeof L === "undefined") return;
  try {
    var m = L.map("map", { scrollWheelZoom:false, attributionControl:true }).setView([18.6305,73.8826], 15);
    var base = L.tileLayer("https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png",
      { attribution:"&copy; OpenStreetMap contributors &copy; CARTO", subdomains:"abcd", maxZoom:19 }).addTo(m);
    m.createPane("labels");
    m.getPane("labels").style.zIndex = 650;
    m.getPane("labels").style.pointerEvents = "none";
    var labels = L.tileLayer("https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png",
      { attribution:"&copy; OpenStreetMap contributors &copy; CARTO", subdomains:"abcd", maxZoom:19, pane:"labels" }).addTo(m);
    var failed = 0;
    function onFail(){ failed++; if (failed > 4) { try{ m.removeLayer(base); }catch(e){} try{ m.removeLayer(labels); }catch(e){} } }
    base.on("tileerror", onFail);
    labels.on("tileerror", onFail);
    var icon = L.divIcon({ className:"", html:'<span class="lotus-pin">' + LOTUS + "</span>",
      iconSize:[44,44], iconAnchor:[22,44], popupAnchor:[0,-40] });
    L.marker([18.6305,73.8826], { icon:icon, title:"Prajna Co-hab" }).addTo(m)
      .bindPopup("<b>Prajna Co-hab</b><br>" + ADDR
        + '<br><a class="map-pop-enquire" href="' + MAIL + '">Enquire</a>')
      .openPopup();
    m.on("focus", function(){ m.scrollWheelZoom.enable(); });
    m.on("blur", function(){ m.scrollWheelZoom.disable(); });
  } catch(e) { /* static frame remains */ }
})();
