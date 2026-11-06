/* =====================================================
   PRAJNA CO-HAB - the runtime layer.
   config.js owns every price and every contact detail; this file
   only renders it. If config.js is missing, the static HTML stands
   untouched instead of being overwritten with dashes.
   ===================================================== */
window.PRAJNA = window.PRAJNA || {};

(function(){
  var C = window.PRAJNA;
  /* v53: THE CONTACT CHANNEL IS EMAIL.
     The owner's number is never published. A visitor writes, and the
     number comes out in the reply if they want to talk. wa() is gone:
     every WhatsApp deep link on this site pointed at a channel we
     have deliberately closed. mail() returns null when no address is
     configured, so a CTA can never open an empty mail client. */
  function mail(subject, body){
    if(!C.email || C.email.indexOf("@") < 1){ return null; }
    var s = subject || "Prajna Co-hab enquiry";
    var b = body || "Hi,\n\nI saw the Prajna Co-hab site and I'd like to ask about rooms.\n\nMove-in month:\nRoom type (double sharing / private):\nWith or without dinner:\n\nMy phone number (so you can reply or call if easier):\n\nThanks.";
    return "mailto:" + C.email + "?subject=" + encodeURIComponent(s) + "&body=" + encodeURIComponent(b);
  }
  function inr(n){ return "\u20B9" + Number(n).toLocaleString("en-IN"); }
  function money(n){ return (typeof n === "number" && isFinite(n) && n > 0) ? inr(n) : null; }
  function set(key, val){ if(val == null){ return; } var els = document.querySelectorAll('[data-cfg="'+key+'"]'); for(var i=0;i<els.length;i++){ els[i].textContent = val; } }

  /* nav active state */
  var here = location.pathname.split("/").pop() || "index.html";
  var links = document.querySelectorAll(".navlinks a");
  for(var i=0;i<links.length;i++){
    var href = links[i].getAttribute("href");
    if(href === here){ links[i].className = "on"; }
  }

  /* availability badge */
  if(C.availability){
    var b = document.getElementById("availbadge");
    if(b){ b.textContent = C.availability; b.style.display = "inline-block"; }
  }

  /* prices + food
     Every figure comes from config.js. When a value is missing the
     static HTML is left alone, so a broken config never prints "-". */
  var rj = money(C.twinRent);
  var rjm = money(C.twinRentMeal);
  var rs = money(C.singleRent);
  var rsm = money(C.singleRentMeal);
  if(rj){ set("twinRent", rj + " / month"); set("twinRentFlat", Number(C.twinRent).toLocaleString("en-IN")); }
  if(rjm){ set("twinRentMeal", rjm + " / month"); set("twinRentMealFlat", Number(C.twinRentMeal).toLocaleString("en-IN")); }
  if(rs){ set("singleRent", rs + " / month"); set("singleRentFlat", Number(C.singleRent).toLocaleString("en-IN")); }
  if(rsm){ set("singleRentMeal", rsm + " / month"); set("singleRentMealFlat", Number(C.singleRentMeal).toLocaleString("en-IN")); }
  if(C.twinDeposit){ set("twinDeposit", inr(C.twinDeposit)); } if(C.singleDeposit){ set("singleDeposit", inr(C.singleDeposit)); }

  /* the dinner add-on, derived in config.js, shown the same way everywhere */
  if(typeof C.twinMealDelta === "number"){ set("twinMealDelta", "+" + inr(C.twinMealDelta)); }
  if(typeof C.singleMealDelta === "number"){ set("singleMealDelta", "+" + inr(C.singleMealDelta)); }

  var foodWord = "dinner included in the meal plan";
  set("foodWord", foodWord);
  set("foodLineTwin", "Dinner included with the meal plan");
  set("foodLineSingle", "Dinner included with the meal plan");

  var dl = document.getElementById("depositline");
  var depBits = [];
  if(C.twinDeposit) depBits.push("Double sharing " + inr(C.twinDeposit));
  if(C.singleDeposit) depBits.push("Private " + inr(C.singleDeposit));
  if(dl && depBits.length){
    dl.textContent = "Refundable deposit: " + depBits.join(" · ");
    dl.style.display = "list-item";
  }

  /* first-month cost card: rent + refundable deposit, per meal plan */
  set("costTwin", money(C.costTwin) ? inr(C.costTwin) + " (rent + deposit)" : null);
  set("costTwinMeal", money(C.costTwinMeal) ? inr(C.costTwinMeal) + " (rent + deposit)" : null);
  set("costSingle", money(C.costSingle) ? inr(C.costSingle) + " (rent + deposit)" : null);
  set("costSingleMeal", money(C.costSingleMeal) ? inr(C.costSingleMeal) + " (rent + deposit)" : null);

  if(C.lockInMonths && C.noticeMonths){
    var terms = document.getElementById("termsline");
    if(terms){
      terms.textContent = C.lockInMonths + "-month lock-in (minimum stay), " + C.noticeMonths + "-month notice (advance warning) to leave.";
      /* .hidden is display:none!important, so removing the class is the only
         way this line ever becomes visible */
      terms.classList.remove("hidden");
      terms.style.display = "block";
    }
  }

  /* email CTAs (data-mailsubject lets each button pre-fill its own subject) */
  var mlinks = document.querySelectorAll(".mail-link");
  for(var j=0;j<mlinks.length;j++){
    var subj = mlinks[j].getAttribute("data-mailsubject") || "Prajna Co-hab enquiry";
    var url = mail(subj, mlinks[j].getAttribute("data-mailbody"));
    if(!url){
      /* no address configured: take the CTA out of the tab order and the
         layout rather than parking a link that opens an empty mail client. */
      mlinks[j].setAttribute("aria-hidden","true");
      mlinks[j].setAttribute("tabindex","-1");
      mlinks[j].style.display = "none";
      continue;
    }
    mlinks[j].setAttribute("href", url);
  }
  /* v53: the number is never public, so there are no tel: links anywhere.
     Any legacy #calllink is removed from the page entirely rather than
     left as a dead control. */
  var call = document.getElementById("calllink");
  if(call && call.parentNode){ call.parentNode.removeChild(call); }
  /* v53: no telephone is injected into the structured data. The number is
     never public, and a stale "+91-0000000000" in the JSON-LD is worse
     than no number at all. */
  var ld = document.getElementById("ldjson");
  if(ld){
    try{
      var o = JSON.parse(ld.textContent);
      if(o.telephone === "+91-0000000000"){ delete o.telephone; }
      ld.textContent = JSON.stringify(o);
    }catch(e){}
  }
  var comm = document.getElementById("communitylink");
  if(comm){
    if(C.community){ comm.href = C.community; comm.setAttribute("target","_blank"); comm.setAttribute("rel","noopener"); }
    else {
      /* v53: there is no WhatsApp Community. This control used to sit at
         half opacity with no explanation, reading as a broken site. Point
         it at email instead, which is the channel we actually use. */
      var cm = mail("Joining The Pit board");
      if(cm){ comm.href = cm; comm.classList.add("mail-link"); }
      else { comm.parentNode && comm.parentNode.removeChild(comm); }
    }
  }

  /* ---------------- lead capture ----------------
     One engine for every form on the site: contact, feedback, board.

     Rules that matter:
     - FormData, not an input loop. The old loop walked every
       input[name] and kept the last value, so a radio group always
       serialised its last option: every rating was stored as 1 star.
     - `company` is a honeypot. A bot that fills it gets a success
       message and nothing is sent.
     - With no endpoint the visitor gets a prefilled email AND keeps
       what they typed. The old code called reset() immediately, so a
       lost mail client meant a lost enquiry.
     - With an endpoint the payload is posted once, with a 15s
       timeout, a stable id for de-duplication and a real error state
       that keeps the data and offers the email route.
  */
  function showResult(f, state, text, link, linkLabel){
    var r = f.querySelector(".fresult");
    if(!r){ return; }
    r.setAttribute("role","status");
    r.setAttribute("aria-live","polite");
    r.className = "fresult show" + (state ? " fresult-" + state : "");
    r.textContent = text;
    if(link){
      var a = document.createElement("a");
      a.href = link;
      a.textContent = " " + (linkLabel || "Email it instead.");
      r.appendChild(a);
    }
  }
  function collect(f){
    var data = {};
    var fd = new FormData(f);
    fd.forEach(function(v, k){
      if(typeof v !== "string"){ return; }
      v = v.trim();
      if(v === ""){ return; }
      data[k] = v.slice(0, 1200);
    });
    return data;
  }
  function newId(){
    try{
      if(window.crypto && crypto.randomUUID){ return crypto.randomUUID(); }
    }catch(e){}
    return "p" + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
  }
  function label(type){
    return type === "board" ? "The Pit board" : (type === "feedback" ? "Feedback" : "Room enquiry");
  }
  function asEmail(data){
    var lines = [];
    for(var k in data){
      if(k === "type" || k === "company" || k === "id" || k === "ts" || k === "page" || k === "ref"){ continue; }
      lines.push(k + ": " + data[k]);
    }
    return mail(label(data.type) + " - Prajna Co-hab", "Hi,\n\n" + lines.join("\n") + "\n\nThanks.");
  }
  function doneText(type){
    return type === "board"
      ? "Got it. We read every post before it goes up."
      : "Got it. We reply by email to the address you gave.";
  }
  function post(endpoint, payload){
    var ctl = window.AbortController ? new AbortController() : null;
    var timer = ctl ? setTimeout(function(){ ctl.abort(); }, 15000) : null;
    return fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
      signal: ctl ? ctl.signal : undefined
    }).then(function(r){
      if(timer){ clearTimeout(timer); }
      return r.text().then(function(t){
        var out = null;
        try{ out = JSON.parse(t); }catch(e){ out = null; }
        if(!r.ok){ throw new Error((out && out.error) || ("HTTP " + r.status)); }
        if(!out || out.ok !== true){ throw new Error((out && out.error) || "The server did not confirm the save."); }
        return out;
      });
    }, function(err){
      if(timer){ clearTimeout(timer); }
      throw err;
    });
  }

  var forms = document.querySelectorAll("form[data-formtype]");
  for(var k=0;k<forms.length;k++){
    (function(f){
      var busy = false;
      f.addEventListener("submit", function(ev){
        ev.preventDefault();
        if(busy){ return; }
        var type = f.getAttribute("data-formtype") || "inquiry";
        var data = collect(f);
        var sub = f.querySelector("button[type=submit]");
        if(sub && !sub.dataset.label){ sub.dataset.label = sub.textContent; }

        /* honeypot: a human never sees this field, let alone fills it */
        if(data.company){
          showResult(f, "ok", doneText(type));
          f.reset();
          return;
        }

        var emailField = f.querySelector('input[name="email"]');
        if(emailField && !emailField.validity.valid){
          showResult(f, "err", "That email address does not look right. Check it and send again.");
          emailField.focus();
          return;
        }
        var ratingField = f.querySelector('input[name="rating"]');
        if(ratingField && !f.querySelector('input[name="rating"]:checked')){
          showResult(f, "err", "Pick a rating first, one to five stars.");
          return;
        }

        data.type = type;
        data.id = newId();
        data.ts = new Date().toISOString();
        data.page = location.pathname.split("/").pop() || "index.html";
        data.ref = document.referrer || "";

        busy = true;
        if(sub){ sub.disabled = true; sub.textContent = "Sending..."; }

        function finish(ok, msg){
          busy = false;
          if(sub){ sub.disabled = false; sub.textContent = sub.dataset.label || "Send"; }
          if(ok){ f.reset(); }
          showResult(f, ok ? "ok" : "err", msg);
          f.dispatchEvent(new CustomEvent("ix:done", { detail: { ok: !!ok } }));
        }

        if(!C.endpoint){
          var link = asEmail(data);
          if(link){ window.location.href = link; }
          busy = false;
          if(sub){ sub.disabled = false; sub.textContent = sub.dataset.label || "Send"; }
          f.dispatchEvent(new CustomEvent("ix:done", { detail: { ok: true } }));
          showResult(f, "info",
            "Your mail app should be open with everything filled in. Nothing is sent until you press send there, and this form keeps what you typed either way.",
            link, "Open the email again.");
          return;
        }

        post(C.endpoint, data).then(function(){
          finish(true, doneText(type));
        }, function(err){
          var link = asEmail(data);
          finish(false, "Could not send that. Your details are still here, nothing is lost. " + (err && err.message ? "(" + err.message + ")" : ""));
          var r2 = f.querySelector(".fresult");
          if(r2 && link){
            var a2 = document.createElement("a");
            a2.href = link;
            a2.textContent = " Email it instead.";
            r2.appendChild(a2);
          }
        });
      });
    })(forms[k]);
  }

  /* automotive board */
  var board = document.getElementById("board");
  if(board){
    var seed = [
      { name:"Prajna", topic:"Welcome", msg:"Mechanics you trust, spare-part shops, used bikes, RTO doubts, carpooling \u2014 ask. Keep it on-topic." }
    ];
    function render(list, demo){
      board.innerHTML = "";
      for(var n=0;n<list.length;n++){
        var el = document.createElement("div"); el.className = "post";
        var meta = document.createElement("div"); meta.className = "meta";
        /* v50: this used to build the meta line with innerHTML, splicing the
           post's name and topic straight from the endpoint into markup. Any
           markup in those fields executed. Built with real nodes + textContent
           now, so a bad value renders as text and nothing else. */
        meta.appendChild(document.createTextNode(list[n].name || ""));
        var topic = document.createElement("span"); topic.className = "topic";
        topic.textContent = list[n].topic || "General";
        meta.appendChild(topic);
        if(demo){
          var dt = document.createElement("span"); dt.className = "demo-tag";
          dt.textContent = "demo";
          meta.appendChild(document.createTextNode(" "));
          meta.appendChild(dt);
        }
        var body = document.createElement("p"); body.textContent = list[n].message || list[n].msg || "";
        el.appendChild(meta); el.appendChild(body); board.appendChild(el);
      }
    }
    render(seed, false);
    if(C.endpoint){
      fetch(C.endpoint + "?type=board")
        .then(function(r){ return r.json(); })
        .then(function(list){ if(list && list.length){ render(list, false); } })
        .catch(function(){});
    }
  }

  /* gallery lightbox */
/* v38: the .gal lightbox was dead code on every page (gallery uses the
   #gal-ss slideshow with its own zoom). Removed. */
  /* v43: the .gal lightbox block was removed in v38, but the `if(gal){`
     wrapper and its body were left behind. `gal` is never declared, so this
     threw ReferenceError on EVERY page and killed everything after it in this
     IIFE - footer year, sticky-header shadow, 3D tilt, service-worker
     registration. Deleted the whole block. */

  /* footer year */
  var yr = document.getElementById("yr"); if(yr){ yr.textContent = new Date().getFullYear(); }

  /* ---------- v4 polish layer ---------- */
  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* sticky header shadow */
  var hd = document.querySelector("header");
  function onScroll(){
    if(!hd){ return; }
    if(window.scrollY > 8){ hd.classList.add("scrolled"); } else { hd.classList.remove("scrolled"); }
  }
  window.addEventListener("scroll", onScroll, { passive:true });
  onScroll();

  /* v38: the .reveal IntersectionObserver fought fluid.js's .flow system
     (one set transform:none!important while the other animated it). .flow
     owns arrival now, so this is gone. */

  /* gentle 3D tilt on cards (desktop pointers only) */
  if(!reduced && window.matchMedia && window.matchMedia("(pointer:fine)").matches){
    var tilts = document.querySelectorAll(".tilt");
    for(var t=0;t<tilts.length;t++){
      (function(el){
        el.addEventListener("mousemove", function(ev){
          var b = el.getBoundingClientRect();
          var x = (ev.clientX - b.left) / b.width - .5;
          var y = (ev.clientY - b.top) / b.height - .5;
          el.style.transform = "perspective(900px) rotateX(" + (-y*4.5).toFixed(2) + "deg) rotateY(" + (x*4.5).toFixed(2) + "deg) translateY(-3px)";
        });
        el.addEventListener("mouseleave", function(){ el.style.transform = ""; });
      })(tilts[t]);
    }
  }


  /* one-time heal: if a previous deploy left a stale offline cache, clear it and reload once */
  if ("serviceWorker" in navigator && "caches" in window && !sessionStorage.getItem("prajna-healed")) {
    caches.keys().then(function(keys){
      var stale = keys.filter(function(k){ return k.indexOf("prajna-") === 0 && k !== "prajna-v75"; });
      if (!stale.length) return;
      Promise.all(stale.map(function(k){ return caches.delete(k); })).then(function(){
        sessionStorage.setItem("prajna-healed", "1");
        /* v34: purge silently. The old code reloaded mid-visit and discarded
           scroll position, focus and any half-typed form. */
      });
    }).catch(function(){});
  }

  /* installable app + offline shell (v6) */
  var mf = document.createElement("link");
  mf.rel = "manifest"; mf.href = "manifest.webmanifest";
  document.head.appendChild(mf);
  var th = document.createElement("meta");
  th.name = "theme-color"; th.content = "#c05a2e";
  document.head.appendChild(th);
  if ("serviceWorker" in navigator && (location.protocol === "https:" || /^(http|https):\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(location.href))) {
    window.addEventListener("load", function(){
      navigator.serviceWorker.register("sw.js").then(function(reg){
        reg.update();
        if (reg.waiting) reg.waiting.postMessage({ type: "skip" });
      }).catch(function(){});
    });
  }

  /* desktop floating email button - mobile keeps its bottom bar.
     This used to draw the WhatsApp glyph on an email link, which is
     the worst of both: a logo for a channel we closed, on a control
     that opens a mail client. Envelope now, matching what it does. */
  if(C.email && !document.querySelector(".mail-float")){
    var wf = document.createElement("a");
    wf.className = "mail-float";
    wf.setAttribute("aria-label", "Email us");
    wf.href = mail("Prajna Co-hab enquiry");
    wf.innerHTML = '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M6 8h20a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2zm10 8.2L7.4 10H24.6L16 16.2zM6 12.6V22h20v-9.4l-10 7-10-7z"/></svg>';
    document.body.appendChild(wf);
  }
})();
/* v19: live vacancy badge - count from config, date always today (IST) */
(function(){
  var b=document.getElementById('vacancy-badge'); if(!b) return;
  var cfg=window.PRAJNA||{}; var n=cfg.bedsOpen;
  if(typeof n!=='number'||n<0){b.hidden=true;return;}
  var txt=b.querySelector('.vtxt');
  if(n===0){
    /* "0 beds open" reads like a bug. Say the true thing in plain words. */
    txt.textContent='No beds free right now';
    b.removeAttribute('data-mailsubject');
    b.setAttribute('data-mailsubject','Tell me when a bed opens at Prajna Co-hab');
    b.hidden=false;
    return;
  }
  var ds=new Date().toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short',timeZone:'Asia/Kolkata'});
  txt.textContent=n+' bed'+(n===1?'':'s')+' open · '+ds;
  b.setAttribute('data-mailsubject','Is a bed open at Prajna Co-hab?');
  b.hidden=false;
})();

/* v24: visit + intent analytics - own backend, no cookies, no third party */
(function(){
  var cfg=window.PRAJNA||{}, EP=cfg.endpoint;
  function qs(k){ var m=location.search.match(new RegExp('[?&]'+k+'=([^&]*)')); return m?decodeURIComponent(m[1]):''; }
  function log(ev, extra){
    if(!EP || EP.indexOf('script.google')!==0 && EP.indexOf('https://script.google')!==0) return;
    var d={type:'visit',event:ev,page:location.pathname,ref:document.referrer||'',
      src:qs('utm_source'),med:qs('utm_medium'),cmp:qs('utm_campaign'),
      screen:(screen.width||0)+'x'+(screen.height||0),lang:navigator.language||'',extra:extra||''};
    try{ navigator.sendBeacon(EP, JSON.stringify(d)); }catch(e){}
  }
  log('page_view');
  var t0=Date.now(), sent=false;
  function dwell(){ if(sent)return; sent=true; log('dwell', Math.round((Date.now()-t0)/1000)+'s'); }
  window.addEventListener('pagehide', dwell);
  document.addEventListener('visibilitychange', function(){ if(document.visibilityState==='hidden') dwell(); });
  document.addEventListener('click', function(e){
    var a=e.target.closest ? e.target.closest('a') : null; if(!a) return;
    if(a.classList.contains('mail-link')) log('mail_click', (a.getAttribute('data-mailsubject')||'enquiry').slice(0,60));
    else if(a.classList.contains('share-btn')){ log('share_tap',''); }
    else if(a.closest('.gal')) log('gallery_open', (a.getAttribute('href')||'').split('/').pop().slice(0,40));
    else if(a.classList.contains('btn')) log('cta_click', (a.textContent||'').trim().slice(0,40));
  }, {passive:true});
})();

/* v26: send-to-a-friend - the word-of-mouth door, logged as share_tap */
(function(){
  function share(){
    var url=location.href;
    log('share_tap','');
    var cfg = window.PRAJNA || {}, from = (typeof cfg.fromRent === 'number') ? cfg.fromRent.toLocaleString('en-IN') : null;
    var txt = 'Prajna Co-hab - owner-run co-living in Moshi, Pimpri-Chinchwad.' + (from ? ' Rooms from Rs ' + from + ' a month.' : '');
    if(navigator.share){ navigator.share({title:'Prajna Co-hab', text:txt, url:url}).catch(function(){}); }
    else if(!navigator.clipboard || !navigator.clipboard.writeText){
      var t2 = document.getElementById("share-note");
      if(!t2){ var b=document.querySelector('.share-btn'); if(b){ t2=document.createElement('span'); t2.id='share-note'; b.after(t2); } }
      if(t2){ t2.textContent = "Copy this link: " + url; t2.style.display = "block"; }
    }
    else if(navigator.clipboard && navigator.clipboard.writeText){
      /* v53: the old fallback opened a chat share link. The number is never
         public, so sharing goes through the clipboard instead - works with
         no WhatsApp involved. */
      navigator.clipboard.writeText(txt + ' ' + url).then(function(){
        var t = document.getElementById("share-note");
        if(t){ t.textContent = "Link copied."; t.style.display = "block"; }
      }).catch(function(){});
    }
  }
  document.addEventListener('click', function(e){
    var b=e.target.closest ? e.target.closest('.share-btn') : null;
    if(b){ e.preventDefault(); share(); }
  }, {passive:false});
  function log(ev, extra){
    var cfg=window.PRAJNA||{}, EP=cfg.endpoint; if(!EP) return;
    try{ navigator.sendBeacon(EP, JSON.stringify({type:'visit',event:ev,page:location.pathname,extra:extra||'',src:qs('utm_source'),med:qs('utm_medium'),cmp:qs('utm_campaign'),ref:document.referrer||'',screen:(screen.width||0)+'x'+(screen.height||0),lang:navigator.language||''})); }catch(e){}
    function qs(k){ var m=location.search.match(new RegExp('[?&]'+k+'=([^&]*)')); return m?decodeURIComponent(m[1]):''; }
  }
})();

/* v60: mobile nav drawer toggle */
(function(){
  var toggle = document.querySelector('.nav-toggle');
  var navlinks = document.querySelector('.navlinks');
  if(!toggle || !navlinks) return;
  function setInert(el, off){ try{ el.inert = !!off; }catch(e){ if(off){ el.setAttribute('aria-hidden','true'); } else { el.removeAttribute('aria-hidden'); } } }
  setInert(navlinks, true);
  toggle.addEventListener('click', function(){
    var open = navlinks.classList.toggle('open');
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    setInert(navlinks, !open);
  });
  /* close on link click */
  navlinks.addEventListener('click', function(e){
    if(e.target.tagName === 'A'){ navlinks.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); setInert(navlinks, true); }
  });
  /* close on Escape */
  document.addEventListener('keydown', function(e){
    if(e.key === 'Escape' && navlinks.classList.contains('open')){
      navlinks.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); setInert(navlinks, true); toggle.focus();
    }
  });
})();

/* ============================================================
   INTERIOR rich-effects pass - vanilla port of interior.dev
   headless hooks. Timings: press 140ms, hover 220ms, state
   380ms, arrival 760ms. No new deps, no colours, reduced-motion
   respected. Each block is defensive: absent element = no-op.
   ============================================================ */
(function(){
  "use strict";
  var doc = document, root = doc.documentElement;
  var reduced = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  root.classList.add("ix-ready");
  var cfg = window.PRAJNA || {};
  function onReady(fn){ if(doc.readyState === "loading"){ doc.addEventListener("DOMContentLoaded", fn); } else { fn(); } }
  function each(els, fn){ Array.prototype.forEach.call(els || [], fn); }

  /* --- reading-progress (vanilla; skip if motion.js bar exists) --- */
  function progressBar(){
    if(doc.querySelector(".scrollbar-progress")){ return; }
    var bar = doc.createElement("div");
    bar.className = "reading-progress"; bar.setAttribute("aria-hidden","true");
    doc.body.appendChild(bar);
    var ticking = false;
    function update(){
      var h = doc.documentElement;
      var max = h.scrollHeight - h.clientHeight;
      bar.style.transform = "scaleX(" + (max > 0 ? (h.scrollTop / max) : 0) + ")";
      ticking = false;
    }
    window.addEventListener("scroll", function(){ if(!ticking){ ticking = true; requestAnimationFrame(update); } }, { passive:true });
    update();
  }
  setTimeout(function(){
    if(!doc.querySelector(".scrollbar-progress")){ progressBar(); }
  }, 800);

  /* --- hide-on-scroll (sticky-header already in CSS) --- */
  if(!reduced){
    var hd = doc.querySelector("header"), lastY = window.scrollY;
    window.addEventListener("scroll", function(){
      if(!hd){ return; }
      var y = window.scrollY;
      var drawerOpen = doc.querySelector(".navlinks.open");
      if(drawerOpen || y < 240 || y < lastY - 4){ hd.classList.remove("hide-away"); }
      else if(y > lastY + 6){ hd.classList.add("hide-away"); }
      lastY = y;
    }, { passive:true });
  }

  /* --- press-depth ripple + loading-button state --- */
  if(!reduced){
    doc.addEventListener("pointerdown", function(e){
      var b = e.target.closest ? e.target.closest(".btn,button,.chip") : null;
      if(!b){ return; }
      var r = b.getBoundingClientRect(), d = Math.max(r.width, r.height) * 2;
      var s = doc.createElement("span");
      s.className = "ripple";
      s.style.width = s.style.height = d + "px";
      s.style.left = (e.clientX - r.left - d/2) + "px";
      s.style.top = (e.clientY - r.top - d/2) + "px";
      b.appendChild(s);
      setTimeout(function(){ s.remove(); }, 780);
    }, { passive:true });
  }
  each(doc.querySelectorAll("form[data-formtype]"), function(f){
    f.addEventListener("submit", function(){
      var sub = f.querySelector("button[type=submit]");
      if(sub){ sub.classList.add("is-loading"); }
    });
  });

  /* --- blur-up-image + skeleton-swap --- */
  each(doc.querySelectorAll("img"), function(img){
    function done(){ img.classList.add("loaded"); }
    if(img.complete && img.naturalWidth){ done(); }
    else { img.addEventListener("load", done); img.addEventListener("error", done); }
  });

  /* --- accordion: single-open within .faq --- */
  each(doc.querySelectorAll(".faq"), function(group){
    each(group.querySelectorAll("details"), function(d){
      d.addEventListener("toggle", function(){
        if(!d.open){ return; }
        each(group.querySelectorAll("details[open]"), function(o){ if(o !== d){ o.open = false; } });
      });
    });
  });

  /* --- segmented-control + tabs on rooms pricing --- */
  each(doc.querySelectorAll("[data-segmented]"), function(seg){
    var panel = doc.querySelector(seg.getAttribute("data-segmented"));
    var tabs = seg.querySelectorAll('[role="tab"]');
    function select(tab, focus){
      each(tabs, function(t){ t.setAttribute("aria-selected", t === tab ? "true" : "false"); t.tabIndex = t === tab ? 0 : -1; });
      if(panel){ panel.classList.toggle("plan-plain", tab.getAttribute("data-plan") === "plain"); panel.classList.toggle("plan-meal", tab.getAttribute("data-plan") === "meal"); }
      if(focus){ tab.focus(); }
    }
    each(tabs, function(t, i){
      t.addEventListener("click", function(){ select(t); });
      t.addEventListener("keydown", function(e){
        var n = null;
        if(e.key === "ArrowRight"){ n = tabs[(i+1) % tabs.length]; }
        if(e.key === "ArrowLeft"){ n = tabs[(i-1+tabs.length) % tabs.length]; }
        if(n){ e.preventDefault(); select(n, true); }
      });
    });
  });

  /* --- tabs: wire aria-controls for rooms segmented --- */
  each(doc.querySelectorAll("[data-segmented]"), function(seg){
    var panel = doc.querySelector(seg.getAttribute("data-segmented"));
    var tabs = seg.querySelectorAll('[role="tab"]');
    if(!panel){ return; }
    if(!panel.id){ panel.id = "pricetable-panel"; }
    each(tabs, function(t, i){
      var tid = t.id || ("segmented-tab-" + i);
      t.id = tid;
      t.setAttribute("aria-controls", panel.id);
      t.setAttribute("aria-selected", t === seg.querySelector('[aria-selected="true"]') ? "true" : "false");
    });
    panel.setAttribute("role", "tabpanel");
    panel.setAttribute("aria-labelledby", (seg.querySelector('[aria-selected="true"]') || seg.querySelector('[role="tab"]')).id);
  });

  /* --- scroll-spy for .spy-nav chips --- */
  var spyNav = doc.querySelector(".spy-nav");
  if(spyNav && "IntersectionObserver" in window){
    var spyLinks = spyNav.querySelectorAll("a[href^='#']");
    var spyMap = {};
    each(spyLinks, function(a){ spyMap[a.getAttribute("href").slice(1)] = a; });
    var spyObs = new IntersectionObserver(function(entries){
      entries.forEach(function(en){
        if(en.isIntersecting){
          each(spyLinks, function(a){ a.classList.remove("on"); });
          var link = spyMap[en.target.id];
          if(link){ link.classList.add("on"); }
        }
      });
    }, { rootMargin: "-30% 0px -60% 0px" });
    each(spyLinks, function(a){
      var sec = doc.getElementById(a.getAttribute("href").slice(1));
      if(sec){ spyObs.observe(sec); }
    });
  }

  /* --- show-more on inclusions lists --- */
  var incl = doc.getElementById("inclusions");
  if(incl && !reduced){
    var btn = doc.createElement("button");
    btn.type = "button"; btn.className = "btn ghost showmore-btn";
    btn.setAttribute("aria-expanded","false");
    btn.textContent = "Show more inclusions";
    var lists = incl.querySelectorAll(".card ul");
    var hidden = [];
    function collapse(){
      hidden = [];
      each(lists, function(ul){
        var items = ul.querySelectorAll("li");
        for(var i = 4; i < items.length; i++){ items[i].style.display = "none"; hidden.push(items[i]); }
      });
    }
    collapse();
    btn.addEventListener("click", function(){
      var open = btn.getAttribute("aria-expanded") === "true";
      btn.setAttribute("aria-expanded", open ? "false" : "true");
      btn.textContent = open ? "Show more inclusions" : "Show fewer";
      each(hidden, function(li){ li.style.display = open ? "none" : ""; });
    });
    var grid = incl.querySelector(".grid");
    if(grid){ grid.after(btn); } else { incl.appendChild(btn); }
  }

  /* --- modal lightbox for room photos (rooms.html) --- */
  var photos = doc.getElementById("room-photos");
  if(photos && !doc.getElementById("lightbox-backdrop")){
    var figs = Array.prototype.slice.call(photos.querySelectorAll("figure"));
    if(figs.length && doc.createElement("dialog").showModal){
      var dlg = doc.createElement("dialog");
      dlg.className = "room-lb"; dlg.setAttribute("aria-label","Room photo viewer");
      dlg.innerHTML = '<img alt=""><figcaption></figcaption><div class="lb-bar"><button type="button" class="lb-prev">Previous</button><span class="lb-count" style="color:var(--paper);font-family:var(--font-ui);font-size:.8rem"></span><button type="button" class="lb-next">Next</button><button type="button" class="lb-close">Close</button></div>';
      doc.body.appendChild(dlg);
      var lbImg = dlg.querySelector("img"), lbCap = dlg.querySelector("figcaption"), lbCount = dlg.querySelector(".lb-count");
      var lbIdx = 0, returnFocus = null;
      function paint(i){
        lbIdx = (i + figs.length) % figs.length;
        var src = figs[lbIdx].querySelector("img");
        lbImg.src = src.src; lbImg.alt = src.alt;
        var cap = figs[lbIdx].querySelector("figcaption");
        lbCap.textContent = cap ? cap.textContent : src.alt;
        lbCount.textContent = (lbIdx+1) + " / " + figs.length;
      }
      figs.forEach(function(fig, i){
        fig.style.cursor = "zoom-in";
        fig.setAttribute("tabindex","0");
        fig.setAttribute("role","button");
        fig.setAttribute("aria-label","View larger: " + (fig.querySelector("img")||{}).alt);
        function open(){ returnFocus = fig; paint(i); dlg.showModal(); }
        fig.addEventListener("click", open);
        fig.addEventListener("keydown", function(e){ if(e.key === "Enter" || e.key === " "){ e.preventDefault(); open(); } });
      });
      dlg.querySelector(".lb-close").addEventListener("click", function(){ dlg.close(); });
      dlg.querySelector(".lb-prev").addEventListener("click", function(){ paint(lbIdx-1); });
      dlg.querySelector(".lb-next").addEventListener("click", function(){ paint(lbIdx+1); });
      dlg.addEventListener("click", function(e){ if(e.target === dlg){ dlg.close(); } });
      dlg.addEventListener("close", function(){ if(returnFocus){ returnFocus.focus({ preventScroll:true }); } });
    }
  }

  /* --- floating-label + inline-validation on lead forms --- */
  each(doc.querySelectorAll("form[data-formtype]"), function(f){
    each(f.querySelectorAll("input,textarea,select"), function(input){
      if(input.type === "hidden" || input.type === "radio" || input.type === "checkbox" || input.name === "company"){ return; }
      var wrap = input.parentElement;
      if(!wrap || wrap.classList.contains("fld")){ return; }
      var label = wrap.querySelector("label");
      if(!label){ return; }
      wrap.classList.add("fld");
      var err = doc.createElement("span");
      err.className = "fld-err"; err.setAttribute("role","alert");
      err.id = (input.id || input.name || "fld") + "-err";
      wrap.appendChild(err);
      input.setAttribute("aria-describedby", err.id);
      function syncFloat(){ wrap.classList.toggle("is-float", !!(input.value && input.value.length)); }
      function validate(){
        var msg = "";
        if(input.required && !input.value.trim()){ msg = "This field is required."; }
        else if(input.type === "email" && input.value && !input.validity.valid){ msg = "That email address does not look right."; }
        err.textContent = msg;
        err.classList.toggle("show", !!msg);
        if(msg){ input.setAttribute("aria-invalid","true"); } else { input.removeAttribute("aria-invalid"); }
        return !msg;
      }
      syncFloat();
      input.addEventListener("input", function(){ syncFloat(); if(input.getAttribute("aria-invalid")){ validate(); } });
      input.addEventListener("blur", validate);
    });
  });

  /* --- copy-button for email (contact + footer) --- */
  function copyEmail(btn){
    var email = cfg.email || "";
    if(!email){ return; }
    function done(){
      btn.textContent = "Copied"; btn.classList.add("copied");
      setTimeout(function(){ btn.textContent = btn.getAttribute("data-label") || "Copy email"; btn.classList.remove("copied"); }, 2000);
    }
    if(navigator.clipboard && navigator.clipboard.writeText){ navigator.clipboard.writeText(email).then(done, done); }
    else {
      var ta = doc.createElement("textarea"); ta.value = email; doc.body.appendChild(ta);
      ta.select(); try{ doc.execCommand("copy"); }catch(e){} ta.remove(); done();
    }
  }
  each(doc.querySelectorAll("[data-copy-email]"), function(btn){ btn.addEventListener("click", function(){ copyEmail(btn); }); });
  var footerMail = doc.querySelector("footer .fcols a[href^='mailto:'], footer a.mail-link");
  if(footerMail && cfg.email && !doc.querySelector("[data-copy-email]")){
    var cb = doc.createElement("button");
    cb.type = "button"; cb.className = "copy-btn"; cb.setAttribute("data-copy-email","");
    cb.setAttribute("data-label","Copy email"); cb.textContent = "Copy email";
    cb.style.marginTop = ".6rem";
    footerMail.parentElement.appendChild(cb);
    cb.addEventListener("click", function(){ copyEmail(cb); });
  }

  /* --- value-flash for config price updates --- */
  function flash(el){
    if(reduced || !el){ return; }
    el.classList.remove("value-flash"); void el.offsetWidth; el.classList.add("value-flash");
  }
  if("MutationObserver" in window){
    var mo = new MutationObserver(function(muts){
      muts.forEach(function(m){
        var t = m.target.closest ? m.target.closest("[data-cfg]") : null;
        if(t){ flash(t); }
      });
    });
    each(doc.querySelectorAll("[data-cfg]"), function(el){ mo.observe(el, { childList:true, characterData:true, subtree:true }); });
  }
  requestAnimationFrame(function(){ each(doc.querySelectorAll(".price [data-cfg], .pricerow [data-cfg]"), flash); });

  /* --- tooltip-group keyboard access (amenities/promises) --- */
  each(doc.querySelectorAll("[data-tip]"), function(el){
    if(!el.hasAttribute("tabindex")){ el.setAttribute("tabindex","0"); }
  });
})();

/* ============================================================
   INTERIOR strict pass (2026-11-05) - vanilla ports of the
   interior.dev headless hooks. Timings: press 140, hover 220,
   state 380, arrival 760. Easing cubic-bezier(.22,.61,.36,1).
   Reduced-motion = instant. No React, no motion package.
   Audit register: INTERIOR-AUDIT.md (repo root).
   ============================================================ */
(function(){
  "use strict";
  var doc = document, root = doc.documentElement;
  var reduced = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  var EASE = "cubic-bezier(.22,.61,.36,1)";
  var cfg = window.PRAJNA || {};
  function each(els, fn){ Array.prototype.forEach.call(els || [], fn); }
  function onReady(fn){ if(doc.readyState === "loading"){ doc.addEventListener("DOMContentLoaded", fn); } else { fn(); } }

  onReady(function(){
    /* ---- sticky-header: scrolled shadow class ---- */
    var hd = doc.querySelector("header");
    if(hd){
      var onScroll = function(){ hd.classList.toggle("scrolled", window.scrollY > 8); };
      window.addEventListener("scroll", onScroll, { passive:true }); onScroll();
    }

    /* ---- press-depth (strict): pointer-tracked press with origin ----
       Mirror of usePressDepth: press only while pointer is inside,
       keyboard Space/Enter press, blur/visibility release. */
    each(doc.querySelectorAll(".btn, button, .chip, .gallery-filters button, .segmented [role=tab]"), function(el){
      if(el.dataset.ixPress){ return; } el.dataset.ixPress = "1";
      var down = false, pointerId = null;
      function setPressed(v){
        if(down === v){ return; } down = v;
        el.classList.toggle("is-pressed", v);
      }
      function release(){ pointerId = null; setPressed(false); }
      el.addEventListener("pointerdown", function(e){
        if(reduced || e.disabled) return;
        if(e.pointerType === "mouse" && e.button !== 0) return;
        pointerId = e.pointerId;
        var r = el.getBoundingClientRect();
        el.style.setProperty("--px", Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width) * 2 - 1)).toFixed(2));
        el.style.setProperty("--py", Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height) * 2 - 1)).toFixed(2));
        setPressed(true);
      });
      el.addEventListener("pointermove", function(e){
        if(e.pointerId !== pointerId){ return; }
        var r = el.getBoundingClientRect();
        setPressed(e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom);
      });
      el.addEventListener("pointerup", release);
      el.addEventListener("pointercancel", release);
      el.addEventListener("keydown", function(e){ if(!reduced && (e.key === " " || e.key === "Enter")){ setPressed(true); } });
      el.addEventListener("keyup", function(){ setPressed(false); });
      el.addEventListener("blur", release);
      doc.addEventListener("visibilitychange", function(){ if(doc.hidden){ release(); } });
    });

    /* ---- ripple (strict): max 4, minVisible 220ms, fade 380ms ----
       Mirror of useRipple. Keyboard press spawns centered ripple. */
    if(!reduced){
      var seq = 0, born = {};
      function spawn(el, cx, cy){
        var r = el.getBoundingClientRect();
        var x = cx == null ? Math.round(r.width / 2) : Math.round(cx - r.left);
        var y = cy == null ? Math.round(r.height / 2) : Math.round(cy - r.top);
        var reach = Math.max(Math.hypot(x, y), Math.hypot(r.width - x, y), Math.hypot(x, r.height - y), Math.hypot(r.width - x, r.height - y));
        var s = doc.createElement("span"); s.className = "ripple-ix";
        var d = Math.max(40, reach * 2);
        s.style.width = s.style.height = d + "px";
        s.style.left = (x - d / 2) + "px"; s.style.top = (y - d / 2) + "px";
        s.style.setProperty("--rip-scale", Math.max(1, Math.round(reach * 200 / 40) / 100));
        el.appendChild(s);
        var id = ++seq; born[id] = performance.now();
        var wait = Math.max(0, 220 - (performance.now() - born[id]));
        setTimeout(function(){ s.classList.add("released"); }, 0);
        setTimeout(function(){ s.remove(); delete born[id]; }, 220 + 320);
        var kids = el.querySelectorAll(".ripple-ix");
        if(kids.length > 4){ kids[0].remove(); }
      }
      doc.addEventListener("pointerdown", function(e){
        var b = e.target.closest ? e.target.closest(".btn,button,.chip") : null;
        if(!b){ return; }
        if(b.querySelectorAll(".ripple-ix").length >= 4){ b.querySelector(".ripple-ix").remove(); }
        spawn(b, e.clientX, e.clientY);
      }, { passive:true });
      doc.addEventListener("keydown", function(e){
        if((e.key === " " || e.key === "Enter") && e.target && e.target.closest){
          var b = e.target.closest(".btn,button,.chip");
          if(b && (b.tagName === "BUTTON" || b.getAttribute("role") === "tab")){ spawn(b, null, null); }
        }
      });
    }

    /* ---- loading-button (strict): idle/pending/success/error ----
       Mirror of useAsyncAction: resetAfter 1380ms, guards re-entry,
       spinner 760ms linear (reduced: static). Wired to lead forms
       (state class only; site.js still owns send/finish). */
    each(doc.querySelectorAll("form[data-formtype]"), function(f){
      var sub = f.querySelector("button[type=submit]");
      if(!sub || sub.dataset.ixLoad){ return; } sub.dataset.ixLoad = "1";
      sub.setAttribute("aria-busy", "false");
      function setStatus(st){
        sub.dataset.status = st;
        sub.setAttribute("aria-busy", st === "pending" ? "true" : "false");
        sub.classList.toggle("is-loading", st === "pending");
        sub.classList.toggle("is-success", st === "success");
        sub.classList.toggle("is-error", st === "error");
        if(st === "success" || st === "error"){
          setTimeout(function(){ if(sub.dataset.status === st){ setStatus("idle"); } }, 1400);
        }
      }
      sub._ixSetStatus = setStatus;
      f.addEventListener("submit", function(){ setStatus("pending"); }, false);
      f.addEventListener("ix:done", function(e){ setStatus(e.detail && e.detail.ok ? "success" : "error"); });
    });

    /* ---- blur-up-image (strict): decode() + error state ----
       Cached images reveal instantly, failures keep the skeleton. */
    each(doc.querySelectorAll("img"), function(img){
      if(img.dataset.ixBlur){ return; } img.dataset.ixBlur = "1";
      function ready(){ img.classList.add("loaded"); img.classList.remove("img-error"); }
      function fail(){ img.classList.add("loaded", "img-error"); }
      if(img.complete){
        if(img.naturalWidth > 0){ ready(); } else { fail(); }
        return;
      }
      img.addEventListener("load", function(){
        if(img.decode){ img.decode().then(ready, fail); } else { ready(); }
      });
      img.addEventListener("error", fail);
    });

    /* ---- skeleton-swap: board skeleton with 140ms delay, 380ms min ----
       Fragment stays mounted; a shimmer shell shows while the board
       renders its first post (Pit board #board). */
    var board = doc.getElementById("board");
    if(board && !reduced){
      var shownAt = 0;
      var skel = doc.createElement("div");
      skel.className = "ix-skeleton"; skel.setAttribute("aria-hidden", "true");
      skel.innerHTML = "<span></span><span></span><span></span>";
      function paintSkel(){
        var hasPosts = board.querySelectorAll(".post").length > 0;
        if(!hasPosts){
          if(!skel.isConnected){ board.appendChild(skel); shownAt = performance.now(); }
        } else {
          var rest = Math.max(0, 380 - (performance.now() - (shownAt || performance.now())));
          setTimeout(function(){ if(skel.isConnected){ skel.remove(); } }, rest);
        }
      }
      new MutationObserver(paintSkel).observe(board, { childList:true });
      setTimeout(paintSkel, 120);
    }

    /* ---- text-reveal (strict): word stagger on view, 760ms ----
       Mirror of useTextReveal: 10px rise + blur(8px), .06s stagger,
       once. Reduced-motion reveals instantly. Headings h2 only. */
    if(!reduced && "IntersectionObserver" in window){
      var tvObs = new IntersectionObserver(function(entries){
        entries.forEach(function(en){
          if(!en.isIntersecting){ return; }
          var h = en.target; tvObs.unobserve(h);
          var words = h.textContent.trim().split(/\s+/);
          h.textContent = "";
          words.forEach(function(w, i){
            var s = doc.createElement("span"); s.className = "tv-word"; s.textContent = w;
            s.style.transitionDelay = (i * 60) + "ms";
            h.appendChild(s);
            h.appendChild(doc.createTextNode(" "));
          });
          requestAnimationFrame(function(){ h.classList.add("tv-in"); });
          setTimeout(function(){ h.classList.remove("tv-in"); h.classList.add("tv-done"); }, 600 + words.length * 60);
        });
      }, { threshold: 0.4 });
      each(doc.querySelectorAll("main h2"), function(h){ if(h.textContent.trim().length > 12){ tvObs.observe(h); } });
    }

    /* ---- live-activity (strict): vacancy announcer linger 760ms ----
       Mirror of useLiveActivity: status text in an aria-live region,
       dot pulses while announcing, peek 2760ms. */
    (function(){
      var region = doc.querySelector("[data-live-region]");
      if(!region){
        region = doc.createElement("p");
        region.className = "ix-sr"; region.setAttribute("data-live-region", "");
        region.setAttribute("aria-live", "polite"); region.setAttribute("role", "status");
        doc.body.appendChild(region);
      }
      var avail = cfg.availability || "";
      var text = avail ? avail : "Rooms listed on this page.";
      var dot = doc.querySelector("header .vdot, .vdot");
      function announce(){
        region.textContent = text;
        if(dot && !reduced){ dot.classList.add("is-live"); }
        setTimeout(function(){ if(dot){ dot.classList.remove("is-live"); } }, 2000);
      }
      announce();
      /* value-flash drives off data-cfg writes; re-announce on change */
      if("MutationObserver" in window){
        var mo = new MutationObserver(function(muts){
          each(muts, function(m){
            var t = m.target.closest ? m.target.closest("[data-cfg]") : null;
            if(t){ announce(); }
          });
        });
        each(doc.querySelectorAll("[data-cfg]"), function(el){ mo.observe(el, { childList:true, characterData:true, subtree:true }); });
      }
    })();

    /* ---- tooltip-group (strict): one open at a time ----
       openDelay 220ms, closeDelay 140ms, skipDelay 380ms (registry).
       Esc closes. aria-describedby points at the tip. */
    (function(){
      var openEl = null, openTimer = null, closeTimer = null, warmUntil = 0;
      function close(instant){
        if(closeTimer){ clearTimeout(closeTimer); closeTimer = null; }
        if(openTimer){ clearTimeout(openTimer); openTimer = null; }
        if(openEl){ openEl.classList.remove("tip-open"); openEl.removeAttribute("aria-describedby"); openEl = null; }
        warmUntil = Date.now() + 400;
      }
      each(doc.querySelectorAll("[data-tip]"), function(el){
        if(!el.hasAttribute("tabindex")){ el.setAttribute("tabindex", "0"); }
        var id = el.getAttribute("aria-describedby") || ("tip-" + Math.random().toString(36).slice(2, 8));
        el.setAttribute("aria-describedby", id);
        function open(){
          if(openTimer){ clearTimeout(openTimer); }
          if(closeTimer){ clearTimeout(closeTimer); closeTimer = null; }
          if(openEl && openEl !== el){ close(); }
          var delay = Date.now() < warmUntil ? 0 : 200;
          openTimer = setTimeout(function(){
            openEl = el; el.classList.add("tip-open");
            var tip = el.getAttribute("data-tip");
            var tipEl = doc.getElementById(id);
            if(!tipEl){
              tipEl = doc.createElement("span"); tipEl.className = "tip-body"; tipEl.id = id; tipEl.textContent = tip;
              el.appendChild(tipEl);
            }
          }, delay);
        }
        el.addEventListener("mouseenter", open);
        el.addEventListener("focus", open);
        el.addEventListener("mouseleave", function(){ closeTimer = setTimeout(close, 120); });
        el.addEventListener("blur", function(){ closeTimer = setTimeout(close, 120); });
        el.addEventListener("keydown", function(e){ if(e.key === "Escape"){ e.stopPropagation(); close(true); } });
      });
      doc.addEventListener("keydown", function(e){ if(e.key === "Escape"){ close(true); } });
      doc.addEventListener("click", function(e){ var t = e.target.closest ? e.target.closest("[data-tip]") : null; if(!t){ close(); } });
    })();

    /* ---- progress-bar (strict): determinate + indeterminate ----
       Mirrors useProgressBar: value null = indeterminate sweep.
       Live region announces percent. */
    (function(){
      var shell = doc.querySelector("#page-progress");
      if(!shell){
        shell = doc.createElement("div"); shell.className = "ix-progress";
        shell.setAttribute("role", "progressbar"); shell.setAttribute("aria-hidden", "true");
        var fill = doc.createElement("span"); fill.className = "ix-progress-fill";
        shell.appendChild(fill); doc.body.prepend(shell);
      }
      var fillEl = shell.querySelector(".ix-progress-fill");
      shell.dataset.value = "0";
      function set(v){
        shell.dataset.value = v;
        fillEl.style.transform = "scaleX(" + Math.max(0, Math.min(1, v)) + ")";
      }
      var max = doc.documentElement.scrollHeight - doc.documentElement.clientHeight;
      function onScroll(){ set(max > 0 ? doc.documentElement.scrollTop / max : 0); }
      window.addEventListener("scroll", function(){
        requestAnimationFrame(function(){
          max = doc.documentElement.scrollHeight - doc.documentElement.clientHeight;
          onScroll();
        });
      }, { passive:true });
      onScroll();
    })();

    /* ---- collapsible-banner (strict): open/folded/dismissed ----
       Vacancy announcement with fold + dismiss (DISCLOSE spring
       ~190/30; our 380ms state ease). Persisted per session. */
    (function(){
      var vacancyEl = doc.querySelector("header .vacancy");
      var availability = cfg.availability || "";
      if(!vacancyEl || !availability || doc.querySelector(".ix-banner")){ return; }
      if(sessionStorage.getItem("ix-banner") === "dismissed"){ return; }
      var banner = doc.createElement("div");
      banner.className = "ix-banner"; banner.setAttribute("role", "status");
      banner.innerHTML = '<span class="ix-banner-text"></span> <a class="ix-banner-wait" href="mailto:srijna2b@gmail.com?subject=Join%20the%20waiting%20list%20at%20Prajna%20Co-hab">Join the waiting list</a><button type="button" class="ix-banner-fold" aria-expanded="true" aria-label="Fold announcement">Fold</button><button type="button" class="ix-banner-close" aria-label="Dismiss announcement">Dismiss</button>';
      banner.querySelector(".ix-banner-text").textContent = availability;
      var foldBtn = banner.querySelector(".ix-banner-fold");
      var state = "open";
      function commit(next){
        state = next;
        banner.dataset.state = next;
        if(next === "dismissed"){
          banner.classList.add("is-leaving");
          setTimeout(function(){ banner.remove(); sessionStorage.setItem("ix-banner", "dismissed"); }, reduced ? 0 : 380);
        } else if(next === "folded"){
          banner.classList.add("is-folded");
          foldBtn.setAttribute("aria-expanded", "false"); foldBtn.textContent = "More";
        } else {
          banner.classList.remove("is-folded");
          foldBtn.setAttribute("aria-expanded", "true"); foldBtn.textContent = "Fold";
        }
      }
      foldBtn.addEventListener("click", function(){ commit(state === "open" ? "folded" : "open"); });
      banner.querySelector(".ix-banner-close").addEventListener("click", function(){ commit("dismissed"); });
      var main = doc.querySelector("main");
      if(main){ main.prepend(banner); } else { doc.body.prepend(banner); }
    })();

    /* ---- expanding-search (strict): collapsed 40px, expands on focus ----
       Mirror of useExpandingSearch (COLLAPSED 40, debounce announce
       380ms). Host: Pit search (#pit-search). */
    (function(){
      var input = doc.getElementById("pit-search");
      if(!input){ return; }
      var wrap = input.closest(".pit-searchwrap") || input.parentElement;
      wrap.classList.add("ix-expanding");
      var countSlot = doc.createElement("span");
      countSlot.className = "ix-search-count"; countSlot.setAttribute("aria-hidden", "true");
      countSlot.setAttribute("aria-live", "polite");
      wrap.appendChild(countSlot);
      var announceTimer = null;
      function announce(){
        var n = board ? board.querySelectorAll(".post:not([hidden])").length : 0;
        countSlot.textContent = input.value ? (n + " match" + (n === 1 ? "" : "es")) : "";
      }
      input.addEventListener("focus", function(){ wrap.classList.add("is-open"); });
      input.addEventListener("blur", function(){
        if(!input.value){ wrap.classList.remove("is-open"); }
      });
      input.addEventListener("input", function(){
        wrap.classList.add("is-open");
        clearTimeout(announceTimer); announceTimer = setTimeout(announce, 500);
      });
    })();

    /* ---- filter-grid (strict): counts per filter, 380ms layout ----
       Mirror of useFilterGrid: filter buttons carry counts, layout
       animates via .gallery-item transition (380ms). Gallery host. */
    (function(){
      each(doc.querySelectorAll(".gallery-filters"), function(bar){
        var items = Array.prototype.slice.call(doc.querySelectorAll(".gallery-item"));
        each(bar.querySelectorAll("[data-filter]"), function(btn){
          var v = btn.getAttribute("data-filter");
          var n = v === "all" ? items.length : items.filter(function(it){ return it.getAttribute("data-category") === v; }).length;
          var c = doc.createElement("span"); c.className = "ix-filter-count"; c.textContent = n;
          btn.appendChild(c);
        });
        bar.addEventListener("click", function(e){
          var btn = e.target.closest("[data-filter]"); if(!btn){ return; }
          each(items, function(it){ it.classList.add("ix-fading"); });
          setTimeout(function(){ each(items, function(it){ it.classList.remove("ix-fading"); }); }, reduced ? 0 : 380);
        });
      });
    })();

    /* ---- dropdown (strict): native selects get listbox motion ----
       Mirror of useDropdown essentials (listbox role, aria-expanded,
       220ms open). Applied to Pit template selects without
       replacing native controls (keyboard + SR semantics intact). */
    each(doc.querySelectorAll(".pit-filters select, select[data-dropdown]"), function(sel){
      sel.setAttribute("aria-haspopup", "listbox");
      sel.classList.add("ix-dropdown");
      sel.addEventListener("focus", function(){ sel.classList.add("is-open"); });
      sel.addEventListener("blur", function(){ setTimeout(function(){ sel.classList.remove("is-open"); }, 140); });
    });

    /* ---- popover (strict): price detail popover anchored to ---- */
    (function(){
      var anchor = doc.querySelector("[data-popover]");
      if(!anchor){ return; }
      var panel = doc.createElement("div");
      panel.className = "ix-popover"; panel.setAttribute("role", "dialog");
      panel.setAttribute("aria-hidden", "true");
      panel.innerHTML = anchor.getAttribute("data-popover") || "";
      doc.body.appendChild(panel);
      anchor.setAttribute("aria-haspopup", "dialog");
      anchor.setAttribute("aria-expanded", "false");
      function place(){
        var r = anchor.getBoundingClientRect();
        panel.style.left = Math.max(8, Math.min(window.innerWidth - 320, r.left)) + "px";
        panel.style.top = (window.scrollY + r.bottom + 10) + "px";
      }
      function openPop(){
        panel.setAttribute("aria-hidden", "false"); panel.classList.add("is-open");
        anchor.setAttribute("aria-expanded", "true"); place();
      }
      function closePop(){
        panel.setAttribute("aria-hidden", "true"); panel.classList.remove("is-open");
        anchor.setAttribute("aria-expanded", "false");
      }
      anchor.addEventListener("click", function(e){ e.preventDefault(); panel.classList.contains("is-open") ? closePop() : openPop(); });
      doc.addEventListener("click", function(e){ if(panel.classList.contains("is-open") && !e.target.closest(".ix-popover") && e.target !== anchor){ closePop(); } });
      doc.addEventListener("keydown", function(e){ if(e.key === "Escape"){ closePop(); anchor.focus(); } });
      window.addEventListener("resize", function(){ if(panel.classList.contains("is-open")){ place(); } });
    })();

    /* ---- task-steps (strict): enquiry progress tracker ---- */
    (function(){
      var form = doc.querySelector("form[data-formtype='inquiry']");
      if(!form || doc.querySelector(".ix-steps")){ return; }
      var steps = ["Write your details", "We reply by email", "Visit the house", "Sign one page", "Move in"];
      var ol = doc.createElement("ol");
      ol.className = "ix-steps"; ol.setAttribute("aria-label", "What happens next");
      var state = 0;
      function paint(){
        ol.innerHTML = "";
        each(steps, function(label, i){
          var li = doc.createElement("li");
          li.className = i < state ? "done" : (i === state ? "active" : "todo");
          li.innerHTML = '<span aria-hidden="true">' + (i < state ? "Done" : String(i + 1)) + '</span>' + label;
          if(i === state){ li.setAttribute("aria-current", "step"); }
          ol.appendChild(li);
        });
        var live = doc.createElement("span"); live.className = "ix-sr"; live.setAttribute("aria-live", "polite");
        live.textContent = state >= steps.length ? "All 5 steps complete" : (steps[Math.min(state, steps.length - 1)] + ", step " + (state + 1) + " of " + steps.length);
        ol.appendChild(live);
      }
      paint();
      form.insertBefore(ol, form.firstChild.nextSibling);
      /* advance on successful submit (loading-button hook reports) */
      form.addEventListener("ix:done", function(e){ if(e.detail && e.detail.ok){ state = Math.min(state + 2, steps.length); paint(); } });
      /* mark step active on focus of first field */
      var first = form.querySelector("input,textarea,select");
      if(first){ first.addEventListener("focus", function(){ if(state === 0){ state = 1; paint(); } }); }
    })();

    /* ---- new-items-pill (strict): Pit board unread pill ---- */
    (function(){
      var boardEl = doc.getElementById("board");
      if(!boardEl){ return; }
      var pill = doc.createElement("button");
      pill.type = "button"; pill.className = "ix-new-pill"; pill.hidden = true;
      pill.textContent = "New posts";
      pill.setAttribute("aria-live", "polite");
      var unread = 0;
      function isPinned(){
        var scroller = doc.scrollingElement || doc.documentElement;
        var gap = scroller.scrollHeight - (scroller.scrollTop + scroller.clientHeight);
        return gap < 480;
      }
      function show(){
        if(isPinned()){ return; }
        pill.hidden = false;
        pill.textContent = unread + " new post" + (unread === 1 ? "" : "s");
      }
      function hide(){ unread = 0; pill.hidden = true; }
      window.addEventListener("scroll", function(){ if(isPinned() && !pill.hidden){ hide(); } }, { passive:true });
      pill.addEventListener("click", function(){
        var target = doc.getElementById("pit-board") || boardEl;
        target.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
        hide();
      });
      doc.body.appendChild(pill);
      new MutationObserver(function(muts){
        each(muts, function(m){
          if(m.type === "childList" && m.addedNodes.length){ unread += m.addedNodes.length; show(); }
        });
      }).observe(boardEl, { childList:true });
    })();

    /* ---- load-more + pagination (strict): sentinel-driven reveal ----
       Mirror of useLoadMore (IntersectionObserver sentinel) +
       usePagination (prev/next). Host: blog posts. */
    (function(){
      var list = doc.getElementById("blog-posts");
      if(!list){ return; }
      var cards = Array.prototype.slice.call(list.querySelectorAll(".post"));
      var PAGE = 2, visible = PAGE;
      var sentinel = doc.createElement("div"); sentinel.className = "ix-sentinel"; sentinel.setAttribute("aria-hidden", "true");
      var btn = doc.createElement("button"); btn.type = "button"; btn.className = "btn ghost ix-loadmore";
      btn.textContent = "Load more guides";
      list.after(sentinel); sentinel.after(btn);
      var status = doc.createElement("p"); status.className = "ix-sr"; status.setAttribute("aria-live", "polite");
      btn.after(status);
      function paint(){
        each(cards, function(card, i){ card.hidden = i >= visible; });
        var done = visible >= cards.length;
        btn.hidden = done;
        btn.textContent = done ? "All guides" : ("Load more (" + (cards.length - visible) + " left)");
        status.textContent = "Showing " + Math.min(visible, cards.length) + " of " + cards.length + " guides";
        /* pager */
        var old = list.parentElement.querySelector(".ix-pager");
        if(old){ old.remove(); }
        if(cards.length > PAGE){
          var pager = doc.createElement("nav"); pager.className = "ix-pager"; pager.setAttribute("aria-label", "Guides pages");
          var prev = doc.createElement("button"); prev.type = "button"; prev.textContent = "Previous";
          var next = doc.createElement("button"); next.type = "button"; next.textContent = "Next";
          var count = document.createElement("span"); count.textContent = "Page " + Math.ceil(visible / PAGE);
          prev.disabled = visible <= PAGE;
          next.disabled = done;
          prev.addEventListener("click", function(){ visible = Math.max(PAGE, visible - PAGE); paint(); window.scrollTo({ top: list.offsetTop - 80, behavior: reduced ? "auto" : "smooth" }); });
          next.addEventListener("click", function(){ visible = Math.min(cards.length, visible + PAGE); paint(); });
          pager.appendChild(prev); pager.appendChild(count); pager.appendChild(next);
          list.after(pager); pager.after(sentinel);
          sentinel.after(btn); btn.after(status);
        }
      }
      paint();
      function maybeLoad(){
        var r = sentinel.getBoundingClientRect();
        if(r.top < window.innerHeight + 160 && visible < cards.length){
          visible = Math.min(cards.length, visible + PAGE); paint();
        }
      }
      btn.addEventListener("click", function(){
        if(visible >= cards.length){ return; }
        btn.disabled = true; btn.textContent = "Loading...";
        setTimeout(function(){ visible = Math.min(cards.length, visible + PAGE); btn.disabled = false; paint(); }, reduced ? 0 : 380);
      });
      window.addEventListener("scroll", maybeLoad, { passive:true });
      if("IntersectionObserver" in window){
        new IntersectionObserver(function(entries){
          each(entries, function(en){ if(en.isIntersecting){ maybeLoad(); } });
        }).observe(sentinel);
      }
    })();

    /* ---- icon-morph (strict): nav toggle morphs to X ----
       Mirror of useIconMorph: number-matched path morph (CSS
       transforms), reduced-motion swaps instantly. aria-expanded
       drives the morph; JS only re-affirms the state. */
    (function(){
      var toggle = doc.querySelector(".nav-toggle");
      if(!toggle){ return; }
      function sync(){
        toggle.classList.toggle("is-x", toggle.getAttribute("aria-expanded") === "true");
      }
      sync();
      new MutationObserver(sync).observe(toggle, { attributes:true, attributeFilter:["aria-expanded"] });
    })();

    /* ---- tooltip-group + press-depth + ripple CSS hooks ---- */
    doc.addEventListener("pointerdown", function(){}); // passive no-op keeps bundlers honest
  });
})();
