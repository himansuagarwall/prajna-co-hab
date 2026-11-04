/* =====================================================
   PRAJNA CO-HAB — the runtime layer.
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
      terms.textContent = C.lockInMonths + "-month lock-in, " + C.noticeMonths + "-month notice to leave.";
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
    return mail(label(data.type) + " — Prajna Co-hab", "Hi,\n\n" + lines.join("\n") + "\n\nThanks.");
  }
  function doneText(type){
    return type === "board"
      ? "Got it. We read every post before it goes up."
      : "Got it. We reply by email, and we call if you left a number.";
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
        }

        if(!C.endpoint){
          var link = asEmail(data);
          if(link){ window.location.href = link; }
          busy = false;
          if(sub){ sub.disabled = false; sub.textContent = sub.dataset.label || "Send"; }
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
      var stale = keys.filter(function(k){ return k.indexOf("prajna-") === 0 && k !== "prajna-v70"; });
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

  /* desktop floating email button — mobile keeps its bottom bar.
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
/* v19: live vacancy badge — count from config, date always today (IST) */
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
    else if(a.getAttribute('href') && a.getAttribute('href').indexOf('tel:')===0) log('call_tap','');
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
    else if(navigator.clipboard && navigator.clipboard.writeText){
      /* v53: the old fallback opened a wa.me share link. The number is never
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
  toggle.addEventListener('click', function(){
    var open = navlinks.classList.toggle('open');
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  /* close on link click */
  navlinks.addEventListener('click', function(e){
    if(e.target.tagName === 'A'){ navlinks.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); }
  });
  /* close on Escape */
  document.addEventListener('keydown', function(e){
    if(e.key === 'Escape' && navlinks.classList.contains('open')){
      navlinks.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); toggle.focus();
    }
  });
})();
