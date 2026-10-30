/* Runtime integrity helpers: no destructive DOM replacement, no fabricated delivery/review claims. */
(function(){
  window.addEventListener('error', function(e){
    try { console.error('Creator Hub runtime error:', e.error || e.message); } catch(_) {}
  });
  window.addEventListener('unhandledrejection', function(e){
    try { console.error('Creator Hub promise error:', e.reason); } catch(_) {}
  });
})();
