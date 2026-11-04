/* perf: lightweight monitoring — only active in dev (localhost / 127.0.0.1 / ?perf=1) */
(function(){
  var isDev = location.hostname === '127.0.0.1'
    || location.hostname === 'localhost'
    || location.search.indexOf('perf=1') >= 0;
  if(!isDev) return;

  function log(name, value){ console.log('[perf] ' + name + ': ' + value + 'ms'); }

  if('PerformanceObserver' in window){
    try {
      var lcp = new PerformanceObserver(function(list){
        var entries = list.getEntries();
        var last = entries[entries.length - 1];
        if(last) log('LCP', Math.round(last.startTime));
      });
      lcp.observe({type:'largest-contentful-paint', buffered:true});
    } catch(e){}

    try {
      var fid = new PerformanceObserver(function(list){
        var entries = list.getEntries();
        for(var i=0;i<entries.length;i++){
          log('FID', Math.round(entries[i].processingStart - entries[i].startTime));
        }
      });
      fid.observe({type:'first-input', buffered:true});
    } catch(e){}
  }
})();
