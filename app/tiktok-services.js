/* =====================================================================
   Creator Hub Creator Network — TikTok Promotion Services
   Self-contained, offline (no backend). Honest order-intake front-end.
   - Service catalogue + administrator-configurable price table
   - Username-only profile connect (NO password, NO automation)
   - Order form, bank-transfer-only payment, camera receipt upload
   - WhatsApp order forwarding to the business owner
   - Local order tracking + admin dashboard + auditTikTokServices()
   ETHICS: We never fabricate follower/engagement counts, never ask for a
   TikTok password, never run bots. Results may vary; nothing is guaranteed.
   ===================================================================== */
(function () {
  'use strict';

  // ---- Business constants (owner-provided; do NOT fabricate) ----
  var OWNER_WHATSAPP = '18768875573';            // Ravaun Richards (intl, no +)
  var OWNER_EMAIL    = 'info.creatorhubcreatornetwork@gmail.com';
  var OWNER_TIKTOK   = '@creatorhubcreatornetwork';
  var BRAND          = 'Creator Hub Creator Network';

  // ---- Owner bank accounts (owner-supplied; all in the name Ravaun Richards) ----
  var BANKS = [
    { id:'ncb',  name:'National Commercial Bank (NCB)', short:'NCB',  acct:'844158459',    type:'Savings',  holder:'Ravaun Richards' },
    { id:'jn',   name:'Jamaica National (JN)',          short:'JN',   acct:'20000219970',  type:'Chequing', holder:'Ravaun Richards' },
    { id:'cibc', name:'First Caribbean Bank (CIBC)',    short:'CIBC', acct:'1002353405',   type:'Chequing', holder:'Ravaun Richards' }
  ];
  function bankById(id){ for(var i=0;i<BANKS.length;i++) if(BANKS[i].id===id) return BANKS[i]; return null; }

  // ---- Storage keys ----
  var K_PRICES   = 'chcn_tk_prices';     // administrator price overrides
  var K_MINORDER = 'chcn_tk_minorder';   // administrator minimum order total
  var K_BANK     = 'chcn_tk_bank';       // administrator bank details
  var K_PROFILES = 'chcn_tk_profiles';   // saved TikTok usernames
  var K_ORDERS   = 'chcn_tk_orders';     // all orders (customer + admin)
  var K_ADMINPIN = 'chcn_tk_adminpin';   // local admin PIN
  var K_ADMINOK  = 'chcn_tk_adminok';     // session admin unlock flag

  // ---- Default price table ----
  // Anchor supplied by owner: 100,000 followers = US$1000  => $0.01 / follower.
  // Other services default proportionally and are ADMIN-EDITABLE in the
  // dashboard. These are the shop's configured list prices, not claims.
  // Retail selling prices (USD per unit) \u2013 set to include the owner's profit
  // margin. Followers keep the agreed anchor of 100k = $1000. All prices are
  // admin-editable in the dashboard, and a minimum order total guarantees a
  // profit even on small orders.
  var DEFAULT_RATES = {
    followers: 0.01000, // $/unit  -> 100k = $1000 (agreed anchor)
    likes:     0.00500,
    views:     0.00060,
    comments:  0.04000,
    shares:    0.00800,
    saves:     0.00500,
    pk:        0.00400  // PK / battle boost votes
  };
  var DEFAULT_MIN_ORDER = 20; // USD \u2013 minimum charge per order (admin-editable)

  var SERVICES = [
    { key:'followers', label:'Followers', icon:'\uD83D\uDC65', tiers:[1000,5000,10000,25000,50000,100000],
      note:'Promotion of your profile to grow follower reach.' },
    { key:'likes', label:'Likes', icon:'\u2764\uFE0F', tiers:[1000,5000,10000,25000,50000,100000],
      note:'Likes added to a specific video you choose.' },
    { key:'views', label:'Views', icon:'\uD83D\uDC41\uFE0F', tiers:[10000,50000,100000,250000,500000,1000000],
      note:'Video view promotion for a specific video.' },
    { key:'comments', label:'Comments', icon:'\uD83D\uDCAC', tiers:[50,100,250,500,1000,2500],
      note:'Comment engagement on a specific video.' },
    { key:'shares', label:'Shares', icon:'\uD83D\uDD01', tiers:[500,1000,5000,10000,25000,50000],
      note:'Share promotion for a specific video.' },
    { key:'saves', label:'Saves', icon:'\uD83D\uDD16', tiers:[500,1000,5000,10000,25000,50000],
      note:'Saves / bookmarks on a specific video.' },
    { key:'pk', label:'PK / Live Battle Boost', icon:'\u2694\uFE0F', tiers:[1000,5000,10000,25000,50000,100000],
      note:'Support points for a scheduled PK / live battle.' }
  ];

  // ---- Small storage helpers ----
  function readJSON(k, def){ try { var v=JSON.parse(localStorage.getItem(k)); return v==null?def:v; } catch(e){ return def; } }
  function writeJSON(k, v){ try { localStorage.setItem(k, JSON.stringify(v)); } catch(e){} }
  function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
  function money(n){ return '$' + Number(n||0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}) + ' USD'; }
  function toast(msg, bad){ if (typeof showToast==='function') showToast(msg, !!bad); else alert(msg); }

  function getRates(){ var o=readJSON(K_PRICES,{}); var r={}; Object.keys(DEFAULT_RATES).forEach(function(k){ r[k]=(typeof o[k]==='number'&&o[k]>=0)?o[k]:DEFAULT_RATES[k]; }); return r; }
  function getMinOrder(){ var m=readJSON(K_MINORDER,null); return (typeof m==='number'&&m>=0)?m:DEFAULT_MIN_ORDER; }
  function unitPrice(service){ return getRates()[service] || 0; }
  function rawPrice(service, qty){ return Math.max(0, unitPrice(service) * Number(qty||0)); }
  function calcPrice(service, qty){ return Math.max(rawPrice(service, qty), getMinOrder()); }

  function getProfiles(){ return readJSON(K_PROFILES, []); }
  function setProfiles(a){ writeJSON(K_PROFILES, a); }
  function getOrders(){ return readJSON(K_ORDERS, []); }
  function setOrders(a){ writeJSON(K_ORDERS, a); }
  function getBank(){ return readJSON(K_BANK, null); }

  function normUser(u){ u=String(u||'').trim(); if(!u) return ''; if(u[0]!=='@') u='@'+u; return u.replace(/\s+/g,''); }
  function validUser(u){ return /^@[A-Za-z0-9._]{2,24}$/.test(u); }

  function orderId(){
    var d=new Date();
    var p=function(n){return (n<10?'0':'')+n;};
    var stamp=''+d.getFullYear()+p(d.getMonth()+1)+p(d.getDate());
    var rnd=Math.floor(100000+Math.random()*900000);
    return 'CH-TK-'+stamp+'-'+rnd;
  }

  var STATUSES = ['Pending Payment','Payment Submitted \u2013 Under Review','Confirmed','In Progress','Completed','Cancelled'];

  // expose a few internals for other modules / console
  window.CHCN_TK = {
    SERVICES: SERVICES, getRates: getRates, calcPrice: calcPrice,
    getOrders: getOrders, getProfiles: getProfiles, STATUSES: STATUSES
  };

  // ---- Inject styles once ----
  function injectStyles(){
    if (document.getElementById('tk-styles')) return;
    var s=document.createElement('style'); s.id='tk-styles';
    s.textContent = [
      '.tk-wrap{max-width:1100px;margin:0 auto;padding:16px;}',
      '.tk-hero{background:linear-gradient(135deg,#111 0%,#25F4EE 60%,#FE2C55 100%);color:#fff;border-radius:16px;padding:26px;margin-bottom:18px;}',
      '.tk-hero h1{margin:0 0 6px;font-size:26px;} .tk-hero p{margin:0;opacity:.95;}',
      '.tk-note{background:#FFF4F4;border:1px solid #FE2C55;color:#9B0E29;border-radius:10px;padding:12px 14px;margin:14px 0;font-size:13px;}',
      '.tk-note strong{color:#C21038;}',
      '.tk-cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;margin:12px 0;}',
      '.tk-card{border:2px solid #eee;border-radius:12px;padding:12px;cursor:pointer;text-align:center;transition:.15s;background:#fff;}',
      '.tk-card:hover{border-color:#FE2C55;transform:translateY(-2px);}',
      '.tk-card.sel{border-color:#FE2C55;background:#FFF4F6;}',
      '.tk-card .ic{font-size:26px;} .tk-card .nm{font-weight:700;margin-top:4px;} .tk-card .rt{font-size:12px;color:#667085;margin-top:2px;}',
      '.tk-sec{background:#fff;border:1px solid #eee;border-radius:14px;padding:16px;margin:14px 0;}',
      '.tk-sec h3{margin:0 0 10px;}',
      '.tk-row{display:flex;flex-wrap:wrap;gap:10px;}',
      '.tk-field{flex:1 1 220px;display:flex;flex-direction:column;gap:4px;margin-bottom:8px;}',
      '.tk-field label{font-size:13px;font-weight:600;color:#344054;}',
      '.tk-field input,.tk-field select,.tk-field textarea{padding:9px 10px;border:1px solid #d0d5dd;border-radius:8px;font-size:14px;}',
      '.tk-tiers{display:flex;flex-wrap:wrap;gap:8px;margin:8px 0;}',
      '.tk-tier{border:1px solid #d0d5dd;border-radius:20px;padding:6px 12px;cursor:pointer;font-size:13px;background:#fff;}',
      '.tk-tier.sel{background:#FE2C55;color:#fff;border-color:#FE2C55;}',
      '.tk-total{font-size:22px;font-weight:800;color:#111;}',
      '.tk-prof{display:flex;align-items:center;justify-content:space-between;gap:8px;border:1px solid #eee;border-radius:10px;padding:8px 12px;margin:6px 0;}',
      '.tk-prof.sel{border-color:#25F4EE;background:#EEFEFF;}',
      '.tk-badge{display:inline-block;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:700;}',
      '.st-pending{background:#FEF0C7;color:#93600A;}.st-review{background:#E0F2FE;color:#0B6AA3;}.st-conf{background:#D1FADF;color:#05603A;}.st-prog{background:#E9D7FE;color:#5925A6;}.st-done{background:#D1FADF;color:#027A48;}.st-cxl{background:#FEE4E2;color:#B42318;}',
      '.tk-ord{border:1px solid #eee;border-radius:12px;padding:12px;margin:10px 0;background:#fff;}',
      '.tk-ord h4{margin:0 0 4px;font-size:15px;} .tk-ord .mini{font-size:12px;color:#667085;}',
      '.tk-receipt{max-width:120px;border-radius:8px;border:1px solid #ddd;margin-top:6px;}',
      '.tk-btns{display:flex;flex-wrap:wrap;gap:8px;margin-top:8px;}',
      '.tk-chk{display:flex;gap:8px;align-items:flex-start;font-size:13px;margin:8px 0;}',
      '.tk-chk input{margin-top:3px;}',
      '.tk-bank{background:#F8FAFC;border:1px dashed #cbd5e1;border-radius:10px;padding:12px;font-size:14px;}',
      '.tk-bank .warn{color:#B42318;font-weight:600;}'
    ].join('');
    document.head.appendChild(s);
  }

  // ---- selection state for the order builder ----
  var SEL = { service:'followers', qty:10000, profile:'', bank:'' };

  function renderTikTokServices(){
    injectStyles();
    var el=document.getElementById('page-tiktok'); if(!el) return;
    var rates=getRates();
    var h='<div class="tk-wrap">';
    h+='<div class="tk-hero"><h1>TikTok Promotion Services</h1><p>Grow your presence with '+esc(BRAND)+'. Order followers, likes, views, comments, shares, saves and PK support. Pay by bank transfer, upload your receipt, and your order is sent straight to our team.</p></div>';
    h+='<div class="tk-coins" style="background:#fff;border:1px solid #ece9ff;border-radius:12px;padding:14px 16px;margin:10px 0;display:flex;flex-wrap:wrap;align-items:center;gap:10px;justify-content:space-between;">'
      +'<div style="min-width:220px;"><div style="font-weight:700;">🪙 TikTok Coins</div><div style="font-size:12px;color:#667085;">Top up Coins on TikTok to send gifts during LIVE. Purchases are completed on TikTok’s official service – '+esc(BRAND)+' does not process TikTok Coin payments and never asks for your TikTok password.</div></div>'
      +'<button class="btn btn-primary" onclick="TKgetCoins()">GET COINS</button></div>';
    h+='<div class="tk-note"><strong>Please read:</strong> This is a <strong>promotion / marketing</strong> service, separate from our training courses. We <strong>never ask for your TikTok password</strong> \u2013 only your public @username. Results and delivery times may vary and are <strong>not guaranteed</strong>. All sales are <strong style="text-decoration:underline;">NON-REFUNDABLE</strong> once an order is confirmed.</div>';

    // 1) Choose service
    h+='<div class="tk-sec"><h3>1. Choose a service</h3><div class="tk-cards" id="tkCards">';
    SERVICES.forEach(function(sv){
      h+='<div class="tk-card'+(sv.key===SEL.service?' sel':'')+'" data-sv="'+sv.key+'" onclick="TKselectService(\''+sv.key+'\')">'
        +'<div class="ic">'+sv.icon+'</div><div class="nm">'+esc(sv.label)+'</div>'
        +'<div class="rt">'+money(rates[sv.key])+' / unit</div></div>';
    });
    h+='</div><p class="mini" id="tkSvNote" style="font-size:12px;color:#667085;"></p></div>';

    // 2) Quantity + price (filled by JS)
    h+='<div class="tk-sec"><h3>2. Choose quantity</h3><div class="tk-tiers" id="tkTiers"></div>'
      +'<div class="tk-row"><div class="tk-field"><label>Custom quantity</label><input type="number" id="tkQty" min="1" step="1" oninput="TKsetQty(this.value)"></div>'
      +'<div class="tk-field"><label>Estimated total</label><div class="tk-total" id="tkTotal">$0.00 USD</div></div></div>'
      +'<p class="mini" id="tkMinNote" style="font-size:12px;color:#667085;">Minimum order '+money(getMinOrder())+' USD.</p></div>';

    // 3) Profiles
    h+='<div class="tk-sec"><h3>3. Connect your TikTok profile</h3>'
      +'<p class="mini" style="font-size:12px;color:#667085;">Username only \u2013 no password. Make sure it is spelled exactly.</p>'
      +'<div class="tk-note" style="margin:6px 0;"><strong>Important:</strong> Your TikTok account must be set to <strong>Public</strong> (not Private) for a promotion to run. <strong>Do not change your @username while an order is active</strong> \u2013 changing it will stop the promotion. Wait until your order shows <strong>Completed</strong> before changing your username.</div>'
      +'<div class="tk-row"><div class="tk-field"><label>TikTok @username</label><input id="tkNewUser" placeholder="@yourusername"></div>'
      +'<div class="tk-field" style="flex:0 0 auto;justify-content:flex-end;"><label>&nbsp;</label><button class="btn btn-primary" onclick="TKaddProfile()">Add profile</button></div></div>'
      +'<div id="tkProfiles"></div></div>';

    // 4) Order details
    h+='<div class="tk-sec"><h3>4. Your details</h3><div class="tk-row">'
      +'<div class="tk-field"><label>Your name *</label><input id="tkName"></div>'
      +'<div class="tk-field"><label>WhatsApp / phone *</label><input id="tkPhone" placeholder="+1876..."></div>'
      +'<div class="tk-field"><label>Email</label><input id="tkEmail" type="email"></div></div>'
      +'<div class="tk-field"><label>Target video / live URL (required for likes, views, comments, shares, saves, PK)</label><input id="tkTarget" placeholder="https://www.tiktok.com/@you/video/..."></div>'
      +'<div class="tk-field"><label>Notes / instructions (optional)</label><textarea id="tkNotes" rows="2"></textarea></div></div>';

    // 5) Payment + receipt
    h+='<div class="tk-sec"><h3>5. Payment \u2013 Bank transfer only</h3>'+bankHtml()
      +'<div class="tk-field" style="margin-top:10px;"><label>Upload payment receipt (photo) *</label>'
      +'<input type="file" id="tkReceipt" accept="image/*" capture="environment" onchange="TKreceipt(this)"></div>'
      +'<img id="tkReceiptPrev" class="tk-receipt" style="display:none;" alt="receipt preview">'
      +'<div id="tkReceiptBtns"></div></div>';

    // 6) Confirm + submit
    h+='<div class="tk-sec"><h3>6. Confirm &amp; send order</h3>'
      +'<label class="tk-chk"><input type="checkbox" id="tkC1"><span>I confirm my @username is correct, my account is <strong>Public</strong>, and I will not change my username until the order is completed.</span></label>'
      +'<label class="tk-chk"><input type="checkbox" id="tkC2"><span>I understand results and timing may vary and are not guaranteed.</span></label>'
      +'<label class="tk-chk"><input type="checkbox" id="tkC3"><span>I understand this payment is <strong>NON-REFUNDABLE</strong> once the order is confirmed.</span></label>'
      +'<div class="tk-btns"><button class="btn btn-primary" onclick="TKsubmit()">\uD83D\uDCF2 Place order &amp; send on WhatsApp</button>'
      +'<button class="btn btn-outline" onclick="navigate(\'tiktok-track\')">My orders</button></div>'
      +'<p class="mini" style="font-size:12px;color:#667085;margin-top:8px;">When you place the order it is saved on this device and a pre-filled message opens in WhatsApp to '+esc(OWNER_TIKTOK)+'\u2019s team. Attach your receipt photo in WhatsApp as well.</p></div>';

    h+=tikleapHtml();

    h+='</div>';
    el.innerHTML=h;
    TKrenderTiers(); TKrenderProfiles(); TKupdateTotal(); TKsvNote();
  }

  function bankHtml(){
    var h='<p class="mini" style="font-size:13px;color:#344054;"><strong>Bank transfer only.</strong> Transfer the exact total to one of the accounts below, then upload your receipt. All accounts are in the name <strong>Ravaun Richards</strong>. We do not accept PayPal or card here.</p>';
    // Account details (owner-supplied) \u2013 shown so the customer can transfer the exact amount.
    h+='<div class="tk-bank-accts">';
    BANKS.forEach(function(b){
      h+='<div class="tk-bank" style="margin:8px 0;"><strong>'+esc(b.name)+'</strong><br>'
        +'Account #: <strong>'+esc(b.acct)+'</strong> <button class="btn btn-sm btn-outline" onclick="TKcopy(\''+b.acct+'\')">Copy</button><br>'
        +'Type: '+esc(b.type)+' &bull; Member name: '+esc(b.holder)+'</div>';
    });
    h+='</div>';
    // Checkbox (single-select) bank chooser. The customer ticks the bank they
    // are paying to; this just records the choice and shows which account to
    // transfer to. No external online-banking site is opened.
    h+='<p class="mini" style="margin:12px 0 6px;"><strong>Choose your bank</strong> \u2013 tick the account you are transferring to:</p>';
    h+='<div class="tk-bank-list" style="display:flex;flex-direction:column;gap:8px;">';
    BANKS.forEach(function(b){
      var on=(SEL.bank===b.id);
      h+='<label class="tk-chk tk-bank-pick'+(on?' sel':'')+'" style="display:flex;align-items:center;gap:10px;padding:10px 12px;border:1px solid '+(on?'#7c3aed':'#d0d5dd')+';border-radius:10px;cursor:pointer;background:'+(on?'#f5f3ff':'#fff')+';">'
        +'<input type="checkbox" '+(on?'checked':'')+' onchange="TKpickBank(\''+b.id+'\')" style="width:18px;height:18px;flex:0 0 auto;">'
        +'<span>\uD83C\uDFE6 <strong>'+esc(b.name)+'</strong> \u2013 Acct #'+esc(b.acct)+' ('+esc(b.type)+')</span></label>';
    });
    h+='</div>';
    h+='<p id="tkBankStatus" class="mini" style="font-size:12px;color:#667085;margin:8px 0 0;"></p>';
    return h;
  }
  window.TKpickBank=function(id){ var b=bankById(id); if(!b) return; SEL.bank=(SEL.bank===id?'':id); var st=document.getElementById('tkBankStatus'); if(st){ if(SEL.bank){ st.textContent='Selected '+b.short+'. Transfer the exact total to account #'+b.acct+' ('+b.type+'), in the name of Ravaun Richards, then upload your receipt below.'; } else { st.textContent=''; } } TKrenderBankPicks(); };
  function TKrenderBankPicks(){ var box=document.querySelector('.tk-bank-list'); if(!box) return; var labels=box.querySelectorAll('.tk-bank-pick'); for(var i=0;i<labels.length;i++){ var on=(SEL.bank===BANKS[i].id); var inp=labels[i].querySelector('input'); if(inp) inp.checked=on; labels[i].style.border='1px solid '+(on?'#7c3aed':'#d0d5dd'); labels[i].style.background=(on?'#f5f3ff':'#fff'); if(on) labels[i].classList.add('sel'); else labels[i].classList.remove('sel'); } }
  window.TKcopy=function(t){ try{ if(navigator.clipboard&&navigator.clipboard.writeText){ navigator.clipboard.writeText(t); } else { var ta=document.createElement('textarea'); ta.value=t; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta); } toast('Copied: '+t); }catch(e){ toast('Copy this: '+t); } };
  function svDef(key){ for(var i=0;i<SERVICES.length;i++) if(SERVICES[i].key===key) return SERVICES[i]; return SERVICES[0]; }

  // ---- Tikleap ranking + Live Gift Earnings Estimator (offline estimator) ----
  // Diamond->USD payout rate is an ESTIMATE, not a guarantee. Industry figure is
  // roughly US$0.005 per diamond (TikTok keeps ~50% of the coin value). These are
  // editable guides so creators can plan - real payouts vary by region/period.
  var TIKLEAP_URL = 'https://tikleap.com/';
  // Official TikTok Coin recharge destination (owner-supplied). Change here if TikTok updates it.
  var COIN_URL = 'https://www.tiktok.com/coin?lang=en';
  var DIAMOND_USD = 0.005;   // estimated creator payout per diamond (USD)
  function tikleapHtml(){
    var h='<div class="tk-sec"><h3>7. Tikleap ranking &amp; LIVE gift earnings</h3>';
    h+='<p class="mini" style="font-size:13px;color:#344054;">Tikleap publishes public LIVE creator rankings and gift leaderboards. Open it to see where creators rank, then use the estimator below to turn LIVE gift <strong>diamonds</strong> into an approximate USD payout.</p>';
    h+='<div class="tk-btns"><button class="btn btn-primary" onclick="TKopenTikleap()">\uD83C\uDFC6 Open Tikleap rankings</button></div>';
    h+='<p class="mini" style="font-size:11px;color:#667085;margin:6px 0 12px;">Opens tikleap.com in your browser (needs internet). Rankings are provided by Tikleap, not by '+esc(BRAND)+'.</p>';
    h+='<div class="tk-bank"><strong>LIVE Gift Earnings Estimator</strong>'
      +'<div class="tk-row" style="margin-top:8px;">'
      +'<div class="tk-field"><label>Diamonds received</label><input type="number" id="tkDiam" min="0" step="1" placeholder="e.g. 10000" oninput="TKestGift()"></div>'
      +'<div class="tk-field"><label>Est. creator payout</label><div class="tk-total" id="tkGiftOut">$0.00 USD</div></div></div>'
      +'<p class="mini" id="tkGiftNote" style="font-size:11px;color:#667085;margin:4px 0 0;">Estimate only, using \u2248$'+DIAMOND_USD.toFixed(4)+' per diamond. TikTok keeps roughly half of each gift\u2019s value, and actual rates vary by region and time \u2013 this is a planning guide, not a guaranteed payout.</p>'
      +'</div></div>';
    return h;
  }
  window.TKopenTikleap=function(){ try{ var w=window.open(TIKLEAP_URL,'_blank','noopener,noreferrer'); if(!w) location.href=TIKLEAP_URL; }catch(e){ location.href=TIKLEAP_URL; } toast('Opening Tikleap rankings\u2026'); };
  // Opens TikTok's official Coin recharge page. CHCN never emulates TikTok checkout or collects TikTok credentials.
  window.TKgetCoins=function(){ try{ var w=window.open(COIN_URL,'_blank','noopener,noreferrer'); if(!w) location.href=COIN_URL; }catch(e){ location.href=COIN_URL; } if(typeof toast==='function') toast('Opening TikTok\u2019s official Coins page\u2026'); };
  window.TKestGift=function(){ var d=Math.max(0, Number((document.getElementById('tkDiam')||{}).value)||0); var out=document.getElementById('tkGiftOut'); if(out) out.textContent=money(d*DIAMOND_USD); };
  function needsTarget(key){ return key!=='followers'; }

  window.TKselectService=function(key){
    SEL.service=key;
    var sv=svDef(key); SEL.qty=sv.tiers[2]||sv.tiers[0];
    document.querySelectorAll('#tkCards .tk-card').forEach(function(c){ c.classList.toggle('sel', c.getAttribute('data-sv')===key); });
    TKrenderTiers(); TKupdateTotal(); TKsvNote();
  };
  function TKsvNote(){ var n=document.getElementById('tkSvNote'); if(n){ var sv=svDef(SEL.service); n.textContent=sv.note+(needsTarget(sv.key)?' A target video/live URL is required.':''); } }

  function TKrenderTiers(){
    var box=document.getElementById('tkTiers'); if(!box) return;
    var sv=svDef(SEL.service); var h='';
    sv.tiers.forEach(function(q){
      h+='<div class="tk-tier'+(q===SEL.qty?' sel':'')+'" onclick="TKsetQty('+q+')">'+q.toLocaleString('en-US')+'</div>';
    });
    box.innerHTML=h;
    var qi=document.getElementById('tkQty'); if(qi) qi.value=SEL.qty;
  }
  window.TKsetQty=function(v){
    v=Math.max(0,Math.floor(Number(v)||0)); SEL.qty=v;
    document.querySelectorAll('#tkTiers .tk-tier').forEach(function(t){ t.classList.toggle('sel', Number(t.textContent.replace(/,/g,''))===v); });
    var qi=document.getElementById('tkQty'); if(qi && Number(qi.value)!==v) qi.value=v;
    TKupdateTotal();
  };
  function TKupdateTotal(){ var t=document.getElementById('tkTotal'); if(t) t.textContent=money(calcPrice(SEL.service, SEL.qty)); }

  // ---- Profiles ----
  function TKrenderProfiles(){
    var box=document.getElementById('tkProfiles'); if(!box) return;
    var ps=getProfiles(); if(!ps.length){ box.innerHTML='<p class="mini" style="font-size:12px;color:#98a2b3;">No profiles saved yet.</p>'; return; }
    var h='';
    ps.forEach(function(u,i){
      h+='<div class="tk-prof'+(u===SEL.profile?' sel':'')+'">'
        +'<span onclick="TKpickProfile('+i+')" style="cursor:pointer;font-weight:600;">'+(u===SEL.profile?'\u2714 ':'')+esc(u)+'</span>'
        +'<span class="tk-btns" style="margin:0;">'
        +'<button class="btn btn-sm btn-outline" onclick="TKopenProfile('+i+')">Open</button>'
        +'<button class="btn btn-sm btn-outline" onclick="TKeditProfile('+i+')">Edit</button>'
        +'<button class="btn btn-sm btn-outline" onclick="TKremoveProfile('+i+')">Remove</button></span></div>';
    });
    box.innerHTML=h;
  }
  window.TKaddProfile=function(){
    var inp=document.getElementById('tkNewUser'); var u=normUser(inp.value);
    if(!validUser(u)){ toast('Enter a valid TikTok @username (letters, numbers, dot, underscore).', true); return; }
    var ps=getProfiles(); if(ps.indexOf(u)>=0){ toast('That profile is already saved.', true); SEL.profile=u; TKrenderProfiles(); return; }
    ps.push(u); setProfiles(ps); SEL.profile=u; inp.value=''; TKrenderProfiles(); toast('Profile added. Confirm it is correct before ordering.');
  };
  window.TKpickProfile=function(i){ var ps=getProfiles(); SEL.profile=ps[i]||''; TKrenderProfiles(); };
  window.TKopenProfile=function(i){ var ps=getProfiles(); var u=ps[i]; if(!u) return; var url='https://www.tiktok.com/'+encodeURIComponent(u); window.open(url,'_blank'); };
  window.TKeditProfile=function(i){ var ps=getProfiles(); var cur=ps[i]; var v=prompt('Edit TikTok @username:', cur); if(v==null) return; var u=normUser(v); if(!validUser(u)){ toast('Invalid username.', true); return; } if(SEL.profile===cur) SEL.profile=u; ps[i]=u; setProfiles(ps); TKrenderProfiles(); toast('Profile updated.'); };
  window.TKremoveProfile=function(i){ var ps=getProfiles(); var u=ps[i]; if(!confirm('Remove '+u+'?')) return; if(SEL.profile===u) SEL.profile=''; ps.splice(i,1); setProfiles(ps); TKrenderProfiles(); };

  // ---- Receipt (camera / gallery) with downscale ----
  var _receiptData=null;
  window.TKreceipt=function(input){
    var f=input.files&&input.files[0]; if(!f) return;
    if(f.size>12*1024*1024){ toast('Image too large (max 12MB).', true); input.value=''; return; }
    var r=new FileReader();
    r.onload=function(e){
      var img=new Image();
      img.onload=function(){
        var max=900, w=img.width, hgt=img.height;
        if(w>max||hgt>max){ var s=Math.min(max/w,max/hgt); w=Math.round(w*s); hgt=Math.round(hgt*s); }
        var cv=document.createElement('canvas'); cv.width=w; cv.height=hgt;
        cv.getContext('2d').drawImage(img,0,0,w,hgt);
        try { _receiptData=cv.toDataURL('image/jpeg',0.6); } catch(err){ _receiptData=e.target.result; }
        var p=document.getElementById('tkReceiptPrev'); if(p){ p.src=_receiptData; p.style.display='block'; }
        var b=document.getElementById('tkReceiptBtns'); if(b){ b.innerHTML='<div class="tk-btns"><button class="btn btn-sm btn-outline" onclick="TKreceiptClear()">Remove / retake</button></div>'; }
      };
      img.onerror=function(){ toast('Could not read that image.', true); };
      img.src=e.target.result;
    };
    r.readAsDataURL(f);
  };
  window.TKreceiptClear=function(){ _receiptData=null; var p=document.getElementById('tkReceiptPrev'); if(p){p.style.display='none';p.src='';} var i=document.getElementById('tkReceipt'); if(i)i.value=''; var b=document.getElementById('tkReceiptBtns'); if(b)b.innerHTML=''; };
  function buildWhatsAppMsg(o){
    var lines=[];
    lines.push('*New TikTok Promotion Order \u2013 '+BRAND+'*');
    lines.push('Order ID: '+o.id);
    lines.push('Date: '+new Date(o.createdAt).toLocaleString());
    lines.push('');
    lines.push('Service: '+o.serviceLabel);
    lines.push('Quantity: '+o.qty.toLocaleString('en-US'));
    lines.push('Unit price: '+money(o.unitPrice));
    lines.push('TOTAL: '+money(o.total)+'  (Bank transfer)');
    if(o.bankName) lines.push('Paid to: '+o.bankName+' \u2013 '+o.bankAcct+' ('+o.bankHolder+')');
    lines.push('');
    lines.push('TikTok profile: '+o.username);
    if(o.target) lines.push('Target URL: '+o.target);
    lines.push('');
    lines.push('Customer: '+o.name);
    lines.push('Phone/WhatsApp: '+o.phone);
    if(o.email) lines.push('Email: '+o.email);
    if(o.notes) lines.push('Notes: '+o.notes);
    lines.push('');
    lines.push('Payment: Bank transfer (receipt uploaded in app \u2013 I will also attach it here).');
    lines.push('I confirm this order is non-refundable once confirmed.');
    return lines.join('\n');
  }

  window.TKsubmit=function(){
    var name=(document.getElementById('tkName').value||'').trim();
    var phone=(document.getElementById('tkPhone').value||'').trim();
    var email=(document.getElementById('tkEmail').value||'').trim();
    var target=(document.getElementById('tkTarget').value||'').trim();
    var notes=(document.getElementById('tkNotes').value||'').trim();
    var sv=svDef(SEL.service);
    if(!SEL.profile){ toast('Add and select the TikTok profile to promote.', true); return; }
    if(!name){ toast('Enter your name.', true); return; }
    if(!phone){ toast('Enter a WhatsApp / phone number.', true); return; }
    if(SEL.qty<1){ toast('Enter a quantity.', true); return; }
    if(needsTarget(sv.key) && !/^https?:\/\//i.test(target)){ toast('A target video/live URL is required for '+sv.label+'.', true); return; }
    if(!SEL.bank){ toast('Select which bank account you paid to.', true); return; }
    if(!_receiptData){ toast('Upload your bank-transfer receipt photo first.', true); return; }
    if(!document.getElementById('tkC1').checked||!document.getElementById('tkC2').checked||!document.getElementById('tkC3').checked){ toast('Please tick all three confirmation boxes.', true); return; }
    var o={
      id:orderId(), createdAt:Date.now(), service:sv.key, serviceLabel:sv.label,
      qty:SEL.qty, unitPrice:unitPrice(sv.key), total:calcPrice(sv.key,SEL.qty),
      username:SEL.profile, target:target, name:name, phone:phone, email:email,
      notes:notes, paymentMethod:'Bank Transfer', receipt:_receiptData,
      bankName:(bankById(SEL.bank)||{}).name||'', bankAcct:(bankById(SEL.bank)||{}).acct||'', bankHolder:(bankById(SEL.bank)||{}).holder||'',
      status:'Payment Submitted \u2013 Under Review', hidden:false,
      baseline:'', current:''
    };
    var orders=getOrders(); orders.unshift(o); setOrders(orders);
    _receiptData=null;
    var msg=buildWhatsAppMsg(o);
    var wa='https://wa.me/'+OWNER_WHATSAPP+'?text='+encodeURIComponent(msg);
    toast('Order '+o.id+' saved. Opening WhatsApp\u2026');
    try { window.open(wa,'_blank'); } catch(e){ location.href=wa; }
    setTimeout(function(){ navigate('tiktok-track'); }, 400);
  };

  function statusClass(s){
    if(/Pending/.test(s)) return 'st-pending';
    if(/Review/.test(s)) return 'st-review';
    if(/Confirmed/.test(s)) return 'st-conf';
    if(/Progress/.test(s)) return 'st-prog';
    if(/Completed/.test(s)) return 'st-done';
    if(/Cancelled/.test(s)) return 'st-cxl';
    return 'st-pending';
  }

  // ---- Customer order tracking ----
  function renderTikTokTrack(){
    injectStyles();
    var el=document.getElementById('page-tiktok-track'); if(!el) return;
    var orders=getOrders().filter(function(o){ return !o.hidden; });
    var h='<div class="tk-wrap"><div class="tk-hero"><h1>My TikTok Orders</h1><p>Orders are stored on this device. Delivery times and results may vary and are not guaranteed.</p></div>';
    h+='<div class="tk-btns" style="margin-bottom:10px;"><button class="btn btn-primary" onclick="navigate(\'tiktok\')">+ New order</button><button class="btn btn-outline" onclick="navigate(\'tiktok-admin\')">Admin</button></div>';
    if(!orders.length){ h+='<div class="tk-sec"><p>You have no TikTok promotion orders yet.</p></div></div>'; el.innerHTML=h; return; }
    orders.forEach(function(o){
      h+='<div class="tk-ord"><h4>'+esc(o.serviceLabel)+' \u00d7 '+o.qty.toLocaleString('en-US')+' <span class="tk-badge '+statusClass(o.status)+'">'+esc(o.status)+'</span></h4>';
      h+='<div class="mini">'+esc(o.id)+' \u2022 '+new Date(o.createdAt).toLocaleString()+'</div>';
      h+='<div class="mini">Profile: '+esc(o.username)+' \u2022 Total: '+money(o.total)+' (Bank transfer)</div>';
      if(o.target) h+='<div class="mini">Target: '+esc(o.target)+'</div>';
      if(o.baseline||o.current) h+='<div class="mini">Baseline: '+esc(o.baseline||'\u2014')+' \u2192 Current: '+esc(o.current||'\u2014')+' (manually entered)</div>';
      if(o.receipt) h+='<img class="tk-receipt" src="'+o.receipt+'" alt="receipt">';
      h+='<div class="tk-btns"><button class="btn btn-sm btn-outline" onclick="TKresend(\''+o.id+'\')">Resend on WhatsApp</button>';
      h+='<button class="btn btn-sm btn-outline" onclick="TKtrackMetric(\''+o.id+'\')">Update my count</button>';
      h+='<button class="btn btn-sm btn-outline" onclick="TKhideOrder(\''+o.id+'\')">Remove from my list</button></div></div>';
    });
    h+='</div>'; el.innerHTML=h;
  }
  window.TKresend=function(id){ var o=getOrders().filter(function(x){return x.id===id;})[0]; if(!o) return; var wa='https://wa.me/'+OWNER_WHATSAPP+'?text='+encodeURIComponent(buildWhatsAppMsg(o)); try{window.open(wa,'_blank');}catch(e){location.href=wa;} };
  window.TKtrackMetric=function(id){ var orders=getOrders(); var o=orders.filter(function(x){return x.id===id;})[0]; if(!o) return; var b=prompt('Your count BEFORE the order (optional):', o.baseline||''); if(b!=null)o.baseline=b.trim(); var c=prompt('Your count NOW (check your TikTok and type it):', o.current||''); if(c!=null)o.current=c.trim(); setOrders(orders); renderTikTokTrack(); toast('Saved. These numbers are what you typed \u2013 we never auto-fill counts.'); };
  window.TKhideOrder=function(id){ if(!confirm('Remove this order from your list? Our team still keeps the record for your order.')) return; var orders=getOrders(); orders.forEach(function(o){ if(o.id===id) o.hidden=true; }); setOrders(orders); renderTikTokTrack(); };
  // ---- Admin dashboard (local-only, PIN gated) ----
  function adminUnlocked(){ return sessionStorage.getItem(K_ADMINOK)==='1'; }
  window.TKadminLogin=function(){
    var pin=readJSON(K_ADMINPIN,null);
    var entered=(document.getElementById('tkPin').value||'').trim();
    if(pin==null){ if(entered.length<4){ toast('Set a PIN of at least 4 digits.', true); return; } writeJSON(K_ADMINPIN, entered); sessionStorage.setItem(K_ADMINOK,'1'); toast('Admin PIN set.'); renderTikTokAdmin(); return; }
    if(entered===pin){ sessionStorage.setItem(K_ADMINOK,'1'); renderTikTokAdmin(); } else { toast('Wrong PIN.', true); }
  };
  window.TKadminLogout=function(){ sessionStorage.removeItem(K_ADMINOK); renderTikTokAdmin(); };

  function renderTikTokAdmin(){
    injectStyles();
    var el=document.getElementById('page-tiktok-admin'); if(!el) return;
    var h='<div class="tk-wrap"><div class="tk-hero" style="background:linear-gradient(135deg,#111,#333);"><h1>TikTok Service Admin</h1><p>Local, offline dashboard for '+esc(BRAND)+'. Data stays on this device.</p></div>';
    if(!adminUnlocked()){
      var isSet=readJSON(K_ADMINPIN,null)!=null;
      h+='<div class="tk-sec"><h3>'+(isSet?'Enter admin PIN':'Set an admin PIN')+'</h3>'
        +'<div class="tk-field" style="max-width:220px;"><input id="tkPin" type="password" inputmode="numeric" placeholder="PIN"></div>'
        +'<button class="btn btn-primary" onclick="TKadminLogin()">'+(isSet?'Unlock':'Set PIN')+'</button>'
        +'<p class="mini" style="font-size:12px;color:#667085;">This is a simple on-device lock, not account security.</p></div>';
      h+='<button class="btn btn-outline" onclick="navigate(\'tiktok\')">\u2190 Back</button></div>'; el.innerHTML=h; return;
    }
    var orders=getOrders();
    // summary
    var revenue=0,open=0; orders.forEach(function(o){ if(o.status!=='Cancelled') revenue+=o.total; if(!/Completed|Cancelled/.test(o.status)) open++; });
    h+='<div class="tk-sec"><h3>Overview</h3><div class="tk-row">'
      +'<div class="tk-field"><label>Total orders</label><div class="tk-total">'+orders.length+'</div></div>'
      +'<div class="tk-field"><label>Open orders</label><div class="tk-total">'+open+'</div></div>'
      +'<div class="tk-field"><label>Order value (non-cancelled)</label><div class="tk-total">'+money(revenue)+'</div></div></div>'
      +'<div class="tk-btns"><button class="btn btn-outline" onclick="TKeditPrices()">Edit prices</button>'
      +'<button class="btn btn-outline" onclick="TKrunAudit()">Run audit</button>'
      +'<button class="btn btn-outline" onclick="TKadminLogout()">Lock</button></div>'
      +'<p class="mini" style="font-size:12px;color:#667085;margin-top:8px;">Bank accounts (NCB / JN / CIBC, Ravaun Richards) are fixed in the app. Customers choose which to pay to at checkout.</p></div>';
    // filter
    h+='<div class="tk-sec"><h3>Orders</h3><div class="tk-field" style="max-width:260px;"><label>Filter by status</label>'
      +'<select id="tkFilter" onchange="TKadminRender()"><option value="">All</option>';
    STATUSES.forEach(function(s){ h+='<option>'+esc(s)+'</option>'; });
    h+='</select></div><div id="tkAdminList"></div></div>';
    h+='<button class="btn btn-outline" onclick="navigate(\'tiktok\')">\u2190 Back to services</button></div>';
    el.innerHTML=h; TKadminRender();
  }
  window.TKadminRender=function(){
    var box=document.getElementById('tkAdminList'); if(!box) return;
    var f=(document.getElementById('tkFilter')||{}).value||'';
    var orders=getOrders().filter(function(o){ return !f || o.status===f; });
    if(!orders.length){ box.innerHTML='<p class="mini">No orders.</p>'; return; }
    var h='';
    orders.forEach(function(o){
      h+='<div class="tk-ord"><h4>'+esc(o.serviceLabel)+' \u00d7 '+o.qty.toLocaleString('en-US')+' <span class="tk-badge '+statusClass(o.status)+'">'+esc(o.status)+'</span>'+(o.hidden?' <span class="mini">(hidden from customer)</span>':'')+'</h4>';
      h+='<div class="mini">'+esc(o.id)+' \u2022 '+new Date(o.createdAt).toLocaleString()+' \u2022 '+money(o.total)+'</div>';
      h+='<div class="mini">'+esc(o.name)+' \u2022 '+esc(o.phone)+(o.email?(' \u2022 '+esc(o.email)):'')+'</div>';
      h+='<div class="mini">Profile: '+esc(o.username)+(o.target?(' \u2022 '+esc(o.target)):'')+'</div>';
      if(o.notes) h+='<div class="mini">Notes: '+esc(o.notes)+'</div>';
      if(o.receipt) h+='<img class="tk-receipt" src="'+o.receipt+'" alt="receipt">';
      h+='<div class="tk-row" style="margin-top:6px;"><div class="tk-field" style="max-width:260px;"><label>Status</label><select onchange="TKsetStatus(\''+o.id+'\',this.value)">';
      STATUSES.forEach(function(s){ h+='<option'+(s===o.status?' selected':'')+'>'+esc(s)+'</option>'; });
      h+='</select></div></div>';
      h+='<div class="tk-btns"><button class="btn btn-sm btn-outline" onclick="TKresend(\''+o.id+'\')">WhatsApp msg</button>';
      h+='<button class="btn btn-sm btn-outline" onclick="TKadminDelete(\''+o.id+'\')">Delete permanently</button></div></div>';
    });
    box.innerHTML=h;
  };
  window.TKsetStatus=function(id,s){ var orders=getOrders(); orders.forEach(function(o){ if(o.id===id)o.status=s; }); setOrders(orders); toast('Status updated.'); };
  window.TKadminDelete=function(id){ if(!confirm('Permanently delete order '+id+'? This cannot be undone.')) return; var orders=getOrders().filter(function(o){return o.id!==id;}); setOrders(orders); TKadminRender(); };
  window.TKeditBank=function(){ var b=getBank()||{}; b.bank=prompt('Bank name:', b.bank||'')||b.bank||''; b.accountName=prompt('Account name:', b.accountName||'')||b.accountName||''; b.accountNumber=prompt('Account number:', b.accountNumber||'')||b.accountNumber||''; b.branch=prompt('Branch / account type (optional):', b.branch||'')||''; b.routing=prompt('Routing / sort code (optional):', b.routing||'')||''; writeJSON(K_BANK,b); toast('Bank details saved.'); };
  window.TKeditPrices=function(){ var r=getRates(); SERVICES.forEach(function(sv){ var v=prompt('Price per unit for '+sv.label+' (USD):', r[sv.key]); if(v!=null && v!=='' && !isNaN(Number(v))) r[sv.key]=Number(v); }); writeJSON(K_PRICES,r); var mo=prompt('Minimum order total (USD) \u2013 guarantees profit on small orders:', getMinOrder()); if(mo!=null && mo!=='' && !isNaN(Number(mo))) writeJSON(K_MINORDER, Number(mo)); toast('Prices saved.'); renderTikTokAdmin(); };

  // ---- Audit ----
  window.auditTikTokServices=function(){
    var issues=[], ok=[];
    var r=getRates();
    Object.keys(DEFAULT_RATES).forEach(function(k){ if(typeof r[k]!=='number'||isNaN(r[k])||r[k]<0) issues.push('Bad price for '+k); });
    if(Math.abs(calcPrice('followers',100000)-100000*r.followers)>0.001) issues.push('Follower price engine mismatch');
    if(!/^\d{6,15}$/.test(OWNER_WHATSAPP)) issues.push('Owner WhatsApp number invalid');
    SERVICES.forEach(function(sv){ if(!sv.tiers||!sv.tiers.length) issues.push('No tiers for '+sv.key); });
    getOrders().forEach(function(o){ if(!o.id||typeof o.total!=='number'||isNaN(o.total)) issues.push('Corrupt order '+(o.id||'?')); if(o.paymentMethod!=='Bank Transfer') issues.push('Non bank-transfer order '+o.id); });
    if(!BANKS.length) issues.push('No bank accounts configured'); BANKS.forEach(function(b){ if(!b.acct||!b.name||!b.holder) issues.push('Incomplete bank entry'); });
    ok.push('Services: '+SERVICES.length); ok.push('Orders: '+getOrders().length); ok.push('Profiles: '+getProfiles().length);
    ok.push('Bank accounts configured: '+BANKS.length+' (NCB / JN / CIBC \u2013 Ravaun Richards)');
    var rep={ pass:issues.length===0, issues:issues, info:ok };
    console.log('[auditTikTokServices]', rep); return rep;
  };
  window.TKrunAudit=function(){ var r=auditTikTokServices(); toast(r.pass?('Audit PASS \u2013 '+r.info.join(' | ')):('Audit found '+r.issues.length+' issue(s): '+r.issues.join('; ')), !r.pass); };

  // ---- Navigation hooks + boot ----
  window.renderTikTokServices=renderTikTokServices;
  window.renderTikTokTrack=renderTikTokTrack;
  window.renderTikTokAdmin=renderTikTokAdmin;

  function boot(){
    // register pages in the global navigate() list if present
    try { if (Array.isArray(window.pages)) { ['tiktok','tiktok-track','tiktok-admin'].forEach(function(p){ if(window.pages.indexOf(p)<0) window.pages.push(p); }); } } catch(e){}
    // ensure page containers exist
    ['tiktok','tiktok-track','tiktok-admin'].forEach(function(p){
      if(!document.getElementById('page-'+p)){ var d=document.createElement('div'); d.id='page-'+p; d.style.display='none'; var anchor=document.getElementById('page-course-view'); if(anchor&&anchor.parentNode) anchor.parentNode.insertBefore(d, anchor.nextSibling); else document.body.appendChild(d); }
    });
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', boot); else boot();
/*__TK_END__*/
})();
