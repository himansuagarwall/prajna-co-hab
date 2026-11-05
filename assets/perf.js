/* perf: lightweight monitoring - only active in dev (localhost / 127.0.0.1 / ?perf=1). No console output in production. */
(function(){
  var isDev = location.hostname === '127.0.0.1' || location.hostname === 'localhost' || location.search.indexOf('perf=1') >= 0;
  if(!isDev) return;
  if('PerformanceObserver' in window){
    try { var lcp = new PerformanceObserver(function(list){ window.__perf_lcp = list.getEntries().pop(); }); lcp.observe({type:'largest-contentful-paint', buffered:true}); } catch(e){}
    try { var cls = new PerformanceObserver(function(list){ var s=0; list.getEntries().forEach(function(e){ if(!e.hadRecentInput) s+=e.value; }); window.__perf_cls = s; }); cls.observe({type:'layout-shift', buffered:true}); } catch(e){}
  }
})();
