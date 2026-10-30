/* Creator Hub Creator Network — dynamic category-filter population.
   The course grid is filled by several renderers (legacy security/driver cards
   in index.html, plus academic-music, instrument, Music, Dance, Drama, Visual
   Arts and Arts Management academies). The #filterCategory dropdown originally
   listed only the legacy categories, so the newer courses could not be filtered
   by category. This script scans every card actually present in #coursesGrid
   and adds any category that is missing from the dropdown — so the Category
   filter always covers every course on the page, present and future.
   First-party app code only; no external/untrusted content is injected. */
(function(){
  function populate(){
    var sel=document.getElementById('filterCategory');
    var grid=document.getElementById('coursesGrid');
    if(!sel||!grid) return;
    // Categories already offered in the dropdown (case-insensitive).
    var have={};
    for(var i=0;i<sel.options.length;i++){
      var v=(sel.options[i].value||'').trim();
      if(v) have[v.toLowerCase()]=true;
    }
    // Unique categories currently rendered on the grid.
    var found={};
    var cards=grid.querySelectorAll('.course-card');
    for(var j=0;j<cards.length;j++){
      var c=(cards[j].getAttribute('data-category')||'').trim();
      if(c) found[c]=true;
    }
    // Append the missing ones, kept in alphabetical order.
    var missing=[];
    for(var k in found){ if(found.hasOwnProperty(k) && !have[k.toLowerCase()]) missing.push(k); }
    if(!missing.length) return;
    missing.sort(function(a,b){return a.toLowerCase()<b.toLowerCase()?-1:1;});
    for(var m=0;m<missing.length;m++){
      var opt=document.createElement('option');
      opt.value=missing[m];
      opt.textContent=missing[m];
      sel.appendChild(opt);
      have[missing[m].toLowerCase()]=true;
    }
  }

  function boot(){
    populate();
    // Re-scan a few times in case some renderers run after us.
    var tries=0;
    var iv=setInterval(function(){ populate(); if(++tries>=8) clearInterval(iv); },400);
    // And react to any later additions to the grid.
    var grid=document.getElementById('coursesGrid');
    if(grid && typeof MutationObserver!=='undefined'){
      var t=null;
      var mo=new MutationObserver(function(){ if(t) clearTimeout(t); t=setTimeout(populate,150); });
      mo.observe(grid,{childList:true});
    }
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot); else boot();
})();
