/* ===== Creator Hub \u2013 Creator Tools (100% offline) =====
   Caption / Bio / Hashtag generators, TikTok Money Calculator,
   Currency Converter (cached dated rates), and a Calculator
   (margin / discount / tax). Also shows a birthday greeting.
   No network required. Nothing fabricated: the money calculator
   is clearly labelled an ESTIMATE and the FX rates are dated.
*/
(function(){
  'use strict';
  var PAGES=['tools'];
  function esc(s){ return String(s==null?'':s).replace(/[&<>\"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]; }); }
  function toast(m,bad){ if(typeof showToast==='function') showToast(m,!!bad); else alert(m); }
  function copy(t){ try{ if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(t);} else {var ta=document.createElement('textarea');ta.value=t;document.body.appendChild(ta);ta.select();document.execCommand('copy');document.body.removeChild(ta);} toast('Copied'); }catch(e){ toast('Copy failed',true);} }
  window.CTcopy=copy;

  // ---------- shared: register page + nav hook + nav link ----------
  function registerPages(names){ try{ if(Array.isArray(window.pages)){ names.forEach(function(p){ if(window.pages.indexOf(p)<0) window.pages.push(p); }); } }catch(e){} }
  function ensureContainers(names){ names.forEach(function(p){ if(!document.getElementById('page-'+p)){ var d=document.createElement('div'); d.id='page-'+p; d.style.display='none'; var a=document.getElementById('page-course-view'); if(a&&a.parentNode) a.parentNode.insertBefore(d,a.nextSibling); else document.body.appendChild(d); } }); }
  function hookNavigate(map){ if(window.__ctNavHook){ window.__ctNavHook.push(map); return; } window.__ctNavHook=[map]; var orig=window.navigate; window.navigate=function(page){ var r=orig?orig.apply(this,arguments):undefined; (window.__ctNavHook||[]).forEach(function(m){ if(m[page]) try{ m[page](); }catch(e){ console.warn(e);} }); return r; }; }
  function addNavLink(afterPage,page,label){ try{ var nav=document.querySelector('.navbar nav'); if(!nav||nav.querySelector('[data-page=\"'+page+'\"]')) return; var ref=nav.querySelector('[data-page=\"'+afterPage+'\"]'); var a=document.createElement('a'); a.className='nav-link'; a.setAttribute('data-page',page); a.setAttribute('onclick',"navigate('"+page+"')"); a.textContent=label; if(ref&&ref.nextSibling) nav.insertBefore(a,ref.nextSibling); else nav.appendChild(a); }catch(e){} }
  window.CHCNreg={ registerPages:registerPages, ensureContainers:ensureContainers, hookNavigate:hookNavigate, addNavLink:addNavLink, esc:esc, toast:toast, copy:copy };

  // ---------- styles ----------
  function injectCSS(){ if(document.getElementById('ct-css')) return; var s=document.createElement('style'); s.id='ct-css'; s.textContent=[
    '.ct-wrap{max-width:860px;margin:0 auto;padding:16px;}',
    '.ct-hero{background:linear-gradient(135deg,#111,#2b2b2b);color:#fff;border-radius:14px;padding:22px;margin-bottom:16px;}',
    '.ct-hero h1{margin:0 0 6px;font-size:24px;}',
    '.ct-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;}',
    '.ct-tile{background:#fff;border:1px solid #e6e8eb;border-radius:12px;padding:16px;cursor:pointer;transition:.15s;text-align:center;}',
    '.ct-tile:hover{border-color:#FE2C55;box-shadow:0 4px 14px rgba(0,0,0,.08);}',
    '.ct-tile .emo{font-size:30px;}',
    '.ct-card{background:#fff;border:1px solid #e6e8eb;border-radius:12px;padding:16px;margin:12px 0;}',
    '.ct-card h3{margin:0 0 10px;}',
    '.ct-field{margin:8px 0;} .ct-field label{display:block;font-weight:600;font-size:13px;margin-bottom:4px;}',
    '.ct-field input,.ct-field select,.ct-field textarea{width:100%;padding:9px;border:1px solid #d0d5dd;border-radius:8px;font-size:14px;box-sizing:border-box;}',
    '.ct-out{background:#f7f8fa;border:1px dashed #cfd4da;border-radius:8px;padding:12px;margin-top:8px;white-space:pre-wrap;font-size:14px;}',
    '.ct-row{display:flex;gap:8px;flex-wrap:wrap;}',
    '.ct-note{font-size:12px;color:#667085;margin-top:6px;}',
    '.ct-chip{display:inline-block;background:#eef;border-radius:999px;padding:3px 10px;margin:3px;font-size:13px;cursor:pointer;}',
    '.ct-birthday{background:linear-gradient(135deg,#FE2C55,#ff7a59);color:#fff;border-radius:14px;padding:18px;margin:12px auto;max-width:860px;text-align:center;}'
  ].join(''); document.head.appendChild(s); }
  // ---------- hub ----------
  function renderTools(){ injectCSS(); var el=document.getElementById('page-tools'); if(!el) return;
    var h='<div class="ct-wrap"><div class="ct-hero"><h1>\uD83E\uDDF0 Creator Tools</h1><p>Free offline tools for creators \u2013 generate captions, bios and hashtags, estimate TikTok earnings, convert currency and do quick business maths. Everything runs on your device.</p></div>';
    h+='<div class="ct-grid">'
      +tile('caption','\u270D\uFE0F','Caption Generator')
      +tile('bio','\uD83D\uDC64','Bio Generator')
      +tile('hashtag','\uD83C\uDFF7\uFE0F','Hashtag Generator')
      +tile('money','\uD83D\uDCB0','TikTok Money Calculator')
      +tile('fx','\uD83D\uDCB1','Currency Converter')
      +tile('calc','\uD83E\uDDEE','Calculator')
      +'</div>';
    h+='<div id="ctPanel"></div></div>';
    el.innerHTML=h; showTool('caption');
  }
  function tile(k,emo,label){ return '<div class="ct-tile" onclick="CTshow(\''+k+'\')"><div class="emo">'+emo+'</div><div>'+esc(label)+'</div></div>'; }
  window.CTshow=showTool;
  function showTool(k){ var p=document.getElementById('ctPanel'); if(!p) return;
    if(k==='caption') p.innerHTML=capUI();
    else if(k==='bio') p.innerHTML=bioUI();
    else if(k==='hashtag') p.innerHTML=hashUI();
    else if(k==='money') p.innerHTML=moneyUI();
    else if(k==='fx') p.innerHTML=fxUI();
    else if(k==='calc') p.innerHTML=calcUI();
    p.scrollIntoView({behavior:'smooth',block:'start'});
  }
  // ---------- Caption Generator ----------
  function capUI(){ return '<div class="ct-card"><h3>\u270D\uFE0F Caption Generator</h3>'
    +'<div class="ct-field"><label>What is your video about?</label><input id="capTopic" placeholder="e.g. morning gym routine"></div>'
    +'<div class="ct-field"><label>Tone</label><select id="capTone"><option>Fun</option><option>Motivational</option><option>Professional</option><option>Chill</option><option>Bold</option></select></div>'
    +'<div class="ct-row"><button class="btn btn-primary" onclick="CTgenCap()">Generate 5 captions</button></div>'
    +'<div id="capOut"></div></div>'; }
  window.CTgenCap=function(){ var t=(document.getElementById('capTopic').value||'').trim(); var tone=document.getElementById('capTone').value; if(!t){ toast('Type what your video is about.',true); return; }
    var templ={ Fun:['POV: '+t+' and loving every second \uD83D\uDE04','Nobody:  Me: '+t+' again \uD83D\uDE02','This is your sign to try '+t+' today \u2728','Tell me you love '+t+' without telling me\u2026','Warning: '+t+' may cause good vibes \uD83D\uDD25'],
      Motivational:['Small steps today, big '+t+' wins tomorrow \uD83D\uDCAA','Your future self will thank you for this '+t+' \uD83D\uDE4C','Consistency beats talent \u2013 '+t+' edition','Dream it, start it: '+t+' \uD83D\uDE80','Progress over perfection with '+t+' \u2728'],
      Professional:[t+': here is what actually works.','3 things I learned about '+t+'.','A quick, honest take on '+t+'.','How I approach '+t+' \u2013 step by step.','Save this if you care about '+t+'.'],
      Chill:['just vibing with a little '+t+' \uD83C\uDF43','slow mornings & '+t+' \u2615','no rush, just '+t+' today','soft life = '+t+' \uD83E\uDD0D','taking it easy with '+t+'\u2026'],
      Bold:['Say it louder: '+t+' changes everything \uD83D\uDD25','I said what I said about '+t+'.','Stop scrolling. Watch this '+t+'.','This '+t+' take is unpopular but true.','Not sorry for loving '+t+' \uD83D\uDCAF'] };
    var arr=templ[tone]||templ.Fun; var h='';
    arr.forEach(function(c){ h+='<div class="ct-out">'+esc(c)+' <button class="btn btn-sm btn-outline" onclick="CTcopy(this.previousSibling.textContent?this.parentNode.firstChild.textContent:\'\')" style="display:none;"></button></div>'; });
    // simpler copy buttons
    h=''; arr.forEach(function(c){ h+='<div class="ct-out" style="display:flex;justify-content:space-between;gap:8px;align-items:center;"><span>'+esc(c)+'</span><button class="btn btn-sm btn-outline" onclick=\'CTcopy('+JSON.stringify(c)+')\'>Copy</button></div>'; });
    document.getElementById('capOut').innerHTML=h; };

  // ---------- Bio Generator ----------
  function bioUI(){ return '<div class="ct-card"><h3>\uD83D\uDC64 Bio Generator</h3>'
    +'<div class="ct-field"><label>Niche / what you do</label><input id="bioNiche" placeholder="e.g. fitness coach"></div>'
    +'<div class="ct-field"><label>Location (optional)</label><input id="bioLoc" placeholder="e.g. Jamaica \uD83C\uDDEF\uD83C\uDDF2"></div>'
    +'<div class="ct-field"><label>Call to action (optional)</label><input id="bioCTA" placeholder="e.g. DM to book"></div>'
    +'<div class="ct-row"><button class="btn btn-primary" onclick="CTgenBio()">Generate bios</button></div>'
    +'<div id="bioOut"></div><p class="ct-note">TikTok bios allow about 80 characters \u2013 each option shows its length.</p></div>'; }
  window.CTgenBio=function(){ var n=(document.getElementById('bioNiche').value||'').trim(); var loc=(document.getElementById('bioLoc').value||'').trim(); var cta=(document.getElementById('bioCTA').value||'').trim(); if(!n){ toast('Enter your niche.',true); return; }
    var L=loc?(' \uD83D\uDCCD'+loc):''; var C=cta?(' \u2193 '+cta):'';
    var opts=[ n+L+C, '\u2728 '+n+' \u2022 sharing what works'+C, n+' | daily tips \uD83C\uDFAF'+L, 'Helping you with '+n+C, n+' creator'+L+' \uD83D\uDE4C'+C ];
    var h=''; opts.forEach(function(b){ var over=b.length>80; h+='<div class="ct-out" style="display:flex;justify-content:space-between;gap:8px;align-items:center;"><span>'+esc(b)+' <small style="color:'+(over?'#c00':'#667085')+'">('+b.length+')</small></span><button class="btn btn-sm btn-outline" onclick=\'CTcopy('+JSON.stringify(b)+')\'>Copy</button></div>'; });
    document.getElementById('bioOut').innerHTML=h; };
  // ---------- Hashtag Generator ----------
  function hashUI(){ return '<div class="ct-card"><h3>\uD83C\uDFF7\uFE0F Hashtag Generator</h3>'
    +'<div class="ct-field"><label>Topic / keywords (comma separated)</label><input id="hashKw" placeholder="e.g. dance, afrobeat, jamaica"></div>'
    +'<div class="ct-field"><label>How many?</label><select id="hashN"><option>10</option><option selected>15</option><option>20</option><option>30</option></select></div>'
    +'<div class="ct-row"><button class="btn btn-primary" onclick="CTgenHash()">Generate</button></div>'
    +'<div id="hashOut"></div><p class="ct-note">Mixes broad, niche and your own keywords. Pick a relevant set \u2013 do not spam unrelated tags.</p></div>'; }
  window.CTgenHash=function(){ var raw=(document.getElementById('hashKw').value||'').trim(); var n=parseInt(document.getElementById('hashN').value,10)||15; if(!raw){ toast('Type a topic.',true); return; }
    var kws=raw.split(',').map(function(s){return s.trim().toLowerCase().replace(/[^a-z0-9]/g,'');}).filter(Boolean);
    var broad=['fyp','foryou','foryoupage','viral','trending','tiktok','explore','creator'];
    var mods=['tips','daily','life','community','lover','challenge','content','reels'];
    var set=[]; kws.forEach(function(k){ set.push('#'+k); mods.forEach(function(m){ set.push('#'+k+m); }); });
    broad.forEach(function(b){ set.push('#'+b); });
    // dedupe
    var seen={},out=[]; set.forEach(function(t){ if(!seen[t]){seen[t]=1;out.push(t);} });
    out=out.slice(0,n); var str=out.join(' ');
    var h='<div class="ct-out">'+esc(str)+'</div><div class="ct-row" style="margin-top:8px;"><button class="btn btn-primary" onclick=\'CTcopy('+JSON.stringify(str)+')\'>Copy all</button></div>';
    document.getElementById('hashOut').innerHTML=h; };

  // ---------- TikTok Money Calculator (ESTIMATE) ----------
  function moneyUI(){ return '<div class="ct-card"><h3>\uD83D\uDCB0 TikTok Money Calculator</h3>'
    +'<p class="ct-note">This is a rough <strong>ESTIMATE</strong> based on figures you enter \u2013 TikTok does not publish fixed pay rates, so real earnings vary a lot. Nothing here is a guarantee.</p>'
    +'<div class="ct-field"><label>Average views per video</label><input id="mkViews" type="number" inputmode="numeric" placeholder="e.g. 50000"></div>'
    +'<div class="ct-field"><label>Videos per month</label><input id="mkVids" type="number" inputmode="numeric" value="20"></div>'
    +'<div class="ct-field"><label>Est. RPM \u2013 earnings per 1,000 views (USD)</label><input id="mkRpm" type="number" step="0.01" value="0.03"><p class="ct-note">Creator Rewards is commonly reported around $0.02\u2013$0.04 per 1,000 qualified views. Adjust to your own data.</p></div>'
    +'<div class="ct-field"><label>Extra monthly income \u2013 gifts, brand deals, affiliate (USD, optional)</label><input id="mkExtra" type="number" step="0.01" value="0"></div>'
    +'<div class="ct-row"><button class="btn btn-primary" onclick="CTcalcMoney()">Estimate</button></div>'
    +'<div id="mkOut"></div></div>'; }
  window.CTcalcMoney=function(){ var v=num('mkViews'),vids=num('mkVids'),rpm=num('mkRpm'),ex=num('mkExtra'); if(v<=0){ toast('Enter average views.',true); return; }
    var monthlyViews=v*vids; var creatorPay=monthlyViews/1000*rpm; var total=creatorPay+ex;
    var h='<div class="ct-out">Monthly views: <strong>'+Math.round(monthlyViews).toLocaleString('en-US')+'</strong>\n'
      +'Creator Rewards (views \u00d7 RPM): <strong>$'+creatorPay.toFixed(2)+'</strong>\n'
      +'Extra income: <strong>$'+ex.toFixed(2)+'</strong>\n'
      +'\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n'
      +'Estimated per month: <strong>$'+total.toFixed(2)+'</strong>\n'
      +'Estimated per year: <strong>$'+(total*12).toFixed(2)+'</strong></div>'
      +'<p class="ct-note">Estimate only. Real payouts depend on watch time, region, qualified views and TikTok policy.</p>';
    document.getElementById('mkOut').innerHTML=h; };
  function num(id){ var e=document.getElementById(id); return e?(parseFloat(e.value)||0):0; }
  // ---------- Currency Converter ----------
  // Indicative USD-based rates (snapshot). Users can Refresh when online.
  var FX_SNAPSHOT_DATE='2026-01-15';
  var FX_DEFAULT={ USD:1, JMD:156.5, EUR:0.92, GBP:0.79, CAD:1.44, TTD:6.78, XCD:2.70, BBD:2.00, JPY:157.0, CNY:7.25 };
  function fxLoad(){ try{ var s=JSON.parse(localStorage.getItem('ct_fx')); if(s&&s.rates&&s.date) return s; }catch(e){} return { date:FX_SNAPSHOT_DATE, rates:FX_DEFAULT, live:false }; }
  function fxSave(o){ try{ localStorage.setItem('ct_fx',JSON.stringify(o)); }catch(e){} }
  function fxUI(){ var s=fxLoad(); var cur=Object.keys(s.rates); function sel(id,def){ var o=''; cur.forEach(function(c){ o+='<option '+(c===def?'selected':'')+'>'+c+'</option>'; }); return '<select id="'+id+'">'+o+'</select>'; }
    return '<div class="ct-card"><h3>\uD83D\uDCB1 Currency Converter</h3>'
    +'<div class="ct-field"><label>Amount</label><input id="fxAmt" type="number" step="0.01" value="100"></div>'
    +'<div class="ct-row"><div class="ct-field" style="flex:1;"><label>From</label>'+sel('fxFrom','USD')+'</div>'
    +'<div class="ct-field" style="flex:1;"><label>To</label>'+sel('fxTo','JMD')+'</div></div>'
    +'<div class="ct-row"><button class="btn btn-primary" onclick="CTfxConvert()">Convert</button>'
    +'<button class="btn btn-outline" onclick="CTfxRefresh()">\u21BB Refresh rates (needs internet)</button></div>'
    +'<div id="fxOut"></div>'
    +'<p class="ct-note">Indicative rates'+(s.live?' (live, refreshed '+esc(s.date)+')':' as of '+esc(s.date)+' \u2013 for guidance only')+'. Tap Refresh when online for current rates. Always confirm with your bank before transacting.</p></div>'; }
  window.CTfxConvert=function(){ var s=fxLoad(); var amt=parseFloat(document.getElementById('fxAmt').value)||0; var f=document.getElementById('fxFrom').value, t=document.getElementById('fxTo').value; var rf=s.rates[f], rt=s.rates[t]; if(!rf||!rt){ toast('Rate unavailable.',true); return; } var usd=amt/rf; var res=usd*rt; document.getElementById('fxOut').innerHTML='<div class="ct-out"><strong>'+amt.toLocaleString('en-US')+' '+f+' = '+res.toLocaleString('en-US',{maximumFractionDigits:2})+' '+t+'</strong>\n1 '+f+' = '+(rt/rf).toLocaleString('en-US',{maximumFractionDigits:4})+' '+t+'</div>'; };
  window.CTfxRefresh=function(){ toast('Fetching live rates\u2026'); fetch('https://open.er-api.com/v6/latest/USD').then(function(r){return r.json();}).then(function(d){ if(d&&d.rates){ var keep=Object.keys(FX_DEFAULT); var rates={}; keep.forEach(function(c){ if(d.rates[c]!=null) rates[c]=d.rates[c]; }); rates.USD=1; var date=(d.time_last_update_utc||new Date().toISOString()).slice(0,16); fxSave({date:date,rates:rates,live:true}); showTool('fx'); toast('Rates updated.'); } else { toast('Could not read rates \u2013 using saved.',true); } }).catch(function(){ toast('No internet \u2013 using saved indicative rates.',true); }); };

  // ---------- Calculator (margin / discount / tax) ----------
  function calcUI(){ return '<div class="ct-card"><h3>\uD83E\uDDEE Business Calculator</h3>'
    +'<div class="ct-field"><label>Mode</label><select id="caMode" onchange="CTcalcMode()"><option value="margin">Profit margin / markup</option><option value="discount">Discount</option><option value="tax">Tax (GCT / VAT)</option></select></div>'
    +'<div id="caBody"></div><div id="caOut"></div></div>'; }
  window.CTcalcMode=function(){ var m=document.getElementById('caMode').value; var b=document.getElementById('caBody'); document.getElementById('caOut').innerHTML='';
    if(m==='margin') b.innerHTML=f('caCost','Cost price','e.g. 1000')+f('caSell','Selling price','e.g. 1500')+btn('CTcalcMargin','Calculate margin');
    else if(m==='discount') b.innerHTML=f('caPrice','Original price','e.g. 2000')+f('caPct','Discount %','e.g. 20')+btn('CTcalcDisc','Apply discount');
    else b.innerHTML=f('caBase','Amount (before tax)','e.g. 1000')+f('caRate','Tax rate %','e.g. 15')+btn('CTcalcTax','Add tax'); };
  function f(id,label,ph){ return '<div class="ct-field"><label>'+label+'</label><input id="'+id+'" type="number" step="0.01" placeholder="'+ph+'"></div>'; }
  function btn(fn,label){ return '<div class="ct-row"><button class="btn btn-primary" onclick="'+fn+'()">'+label+'</button></div>'; }
  window.CTcalcMargin=function(){ var c=num('caCost'),s=num('caSell'); if(s<=0){ toast('Enter selling price.',true); return; } var profit=s-c; var margin=profit/s*100; var markup=c>0?profit/c*100:0; out('caOut','Profit: <strong>$'+profit.toFixed(2)+'</strong>\nMargin (of price): <strong>'+margin.toFixed(2)+'%</strong>\nMarkup (on cost): <strong>'+markup.toFixed(2)+'%</strong>'); };
  window.CTcalcDisc=function(){ var p=num('caPrice'),d=num('caPct'); var save=p*d/100; out('caOut','You save: <strong>$'+save.toFixed(2)+'</strong>\nFinal price: <strong>$'+(p-save).toFixed(2)+'</strong>'); };
  window.CTcalcTax=function(){ var b=num('caBase'),r=num('caRate'); var tax=b*r/100; out('caOut','Tax: <strong>$'+tax.toFixed(2)+'</strong>\nTotal with tax: <strong>$'+(b+tax).toFixed(2)+'</strong>'); };
  function out(id,t){ var e=document.getElementById(id); if(e) e.innerHTML='<div class="ct-out">'+t+'</div>'; }
  // ---------- Birthday greeting ----------
  function userDOB(){ try{ var u=(typeof getUser==='function')?getUser():null; if(!u) return null; var mo=u.dobMonth, da=u.dobDay; if(mo==null||da==null) return null; mo=parseInt(mo,10); da=parseInt(da,10); if(!mo||!da) return null; return {mo:mo,da:da,name:u.name||u.firstName||''}; }catch(e){ return null; } }
  function checkBirthday(){ var d=userDOB(); if(!d) return; var now=new Date(); if((now.getMonth()+1)===d.mo && now.getDate()===d.da){ showBirthday(d.name); var key='ct_bday_'+now.getFullYear(); if(!localStorage.getItem(key)){ try{ localStorage.setItem(key,'1'); }catch(e){} toast('\uD83C\uDF89 Happy Birthday'+(d.name?', '+d.name:'')+'!'); } } }
  function showBirthday(name){ var host=document.getElementById('page-index'); if(!host||document.getElementById('ctBday')) return; var b=document.createElement('div'); b.id='ctBday'; b.className='ct-birthday'; b.innerHTML='\uD83C\uDF82 <strong>Happy Birthday'+(name?', '+esc(name):'')+'!</strong><br>Everyone at Creator Hub Creator Network wishes you an amazing day. \uD83C\uDF89'; host.insertBefore(b, host.firstChild); }

  // ---------- boot ----------
  function boot(){ injectCSS(); registerPages(PAGES); ensureContainers(PAGES); hookNavigate({ 'tools':renderTools });
    /* Consolidated: no standalone "Tools" nav link. Creator Tools now lives
       inside the single "Life & Tools" section (reached as a sub-card).
       Register its route as a child of lifetools so the breadcrumb is correct. */
    if(typeof NavigationService!=='undefined'){ try{ NavigationService.registerRoute('tools',{ title:'Creator Tools', parent:'lifetools' }); }catch(e){} }
    checkBirthday(); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
