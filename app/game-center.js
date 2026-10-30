/* ===== Creator Hub \u2013 Game Center (original offline games) =====
   Arcade + educational games, all original, no third-party assets, fully
   offline. Shared framework: difficulty levels (Beginner/Intermediate/
   Advanced), appearance themes, editable background, settings (tips, sound,
   save & resume, save on exit), per-game hints and help. Pure JS + DOM.
*/
(function(){
  'use strict';
  var R=window.CHCNreg||{}; var esc=R.esc||function(s){return String(s==null?'':s).replace(/[&<>\"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c];});}; var toast=R.toast||function(m){try{alert(m);}catch(e){}};
  var PAGES=['games'];
  var LS={ get:function(k,d){ try{ var v=localStorage.getItem(k); return v==null?d:JSON.parse(v); }catch(e){ return d; } }, set:function(k,v){ try{ localStorage.setItem(k,JSON.stringify(v)); }catch(e){} } };

  // ---- global state ----
  var LEVELS=['beginner','intermediate','advanced'];
  var THEMES={ violet:{a:'#7c3aed',b:'#4c1d95',n:'Violet'}, ocean:{a:'#0ea5e9',b:'#0369a1',n:'Ocean'}, sunset:{a:'#f97316',b:'#b91c1c',n:'Sunset'}, forest:{a:'#16a34a',b:'#14532d',n:'Forest'}, dark:{a:'#64748b',b:'#0f172a',n:'Dark'} };
  var BGS={ 'default':{c:'#f6f7fb',n:'Default'}, paper:{c:'#fffdf5',n:'Paper'}, slate:{c:'#e9eef5',n:'Slate'}, mint:{c:'#eafbf1',n:'Mint'}, lavender:{c:'#f3f0ff',n:'Lavender'}, charcoal:{c:'#1f2937',n:'Charcoal'} };
  var SET=LS.get('chcn_gc_settings',{ sound:true, tips:true, theme:'violet', bg:'default', saveOnExit:true, skWalls:false });
  var LEVEL=LS.get('chcn_gc_level','intermediate');
  var CUR=null; // current game key
  function saveSettings(){ LS.set('chcn_gc_settings',SET); }
  function setLevel(v){ LEVEL=v; LS.set('chcn_gc_level',v); if(CUR) GCshow(CUR,true); }

  // ---- sound ----
  var _AC=null; function ac(){ if(!_AC){ try{ _AC=new (window.AudioContext||window.webkitAudioContext)(); }catch(e){} } if(_AC&&_AC.state==='suspended'){ try{_AC.resume();}catch(e){} } return _AC; }
  function tone(freq,dur,type){ if(!SET.sound) return; var c=ac(); if(!c) return; try{ var o=c.createOscillator(),g=c.createGain(); o.type=type||'sine'; o.frequency.value=freq; o.connect(g); g.connect(c.destination); var t=c.currentTime; g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(0.25,t+0.01); g.gain.exponentialRampToValueAtTime(0.0001,t+(dur||0.18)); o.start(t); o.stop(t+(dur||0.18)+0.02); }catch(e){} }
  function sGood(){ tone(660,0.12,'sine'); setTimeout(function(){tone(880,0.14,'sine');},90); }
  function sBad(){ tone(180,0.25,'sawtooth'); }
  function sClick(){ tone(440,0.06,'triangle'); }

  // ---- save / resume ----
  function saveKey(k){ return 'chcn_gc_save_'+k; }
  function hasSave(k){ return LS.get(saveKey(k),null)!=null; }
  function putSave(k,obj){ LS.set(saveKey(k),{t:Date.now(),s:obj}); }
  function getSave(k){ var v=LS.get(saveKey(k),null); return v?v.s:null; }
  function clearSave(k){ try{ localStorage.removeItem(saveKey(k)); }catch(e){} }

  // ---- CSS ----
  function injectCSS(){ if(document.getElementById('gc-css')) return; var s=document.createElement('style'); s.id='gc-css'; s.textContent=[
    '.gc-wrap{max-width:760px;margin:0 auto;padding:16px;--gc-a:#7c3aed;--gc-b:#4c1d95;--gc-bg:#f6f7fb;background:var(--gc-bg);min-height:100%;border-radius:14px;overflow-x:auto;}',
    '.gc-hero{background:linear-gradient(135deg,var(--gc-b),var(--gc-a));color:#fff;border-radius:14px;padding:22px;margin-bottom:16px;}',
    '.gc-hero h1{margin:0 0 6px;font-size:24px;}',
    '.gc-sec-title{font-weight:800;color:#334155;margin:18px 2px 8px;font-size:15px;}',
    '.gc-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;}',
    '.gc-tile{background:#fff;border:1px solid #e6e8eb;border-radius:12px;padding:16px;cursor:pointer;text-align:center;transition:.15s;}',
    '.gc-tile:hover{border-color:var(--gc-a);box-shadow:0 4px 14px rgba(0,0,0,.08);}',
    '.gc-tile .emo{font-size:30px;}',
    '.gc-tile .edu{display:inline-block;font-size:10px;font-weight:700;color:#166534;background:#dcfce7;border-radius:20px;padding:1px 8px;margin-top:4px;}',
    '.gc-card{background:#fff;border:1px solid #e6e8eb;border-radius:12px;padding:16px;margin:12px 0;}',
    '.gc-bar{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:10px;}',
    '.gc-stat{font-weight:700;}',
    '.gc-ctrl{display:flex;flex-wrap:wrap;gap:6px;align-items:center;background:#f8f7ff;border:1px solid #ece9ff;border-radius:10px;padding:8px;margin-bottom:10px;}',
    '.gc-ctrl select,.gc-ctrl .gcbtn{font-size:13px;padding:6px 10px;border-radius:8px;border:1px solid #d6d3ef;background:#fff;cursor:pointer;}',
    '.gc-ctrl .gcbtn:hover{border-color:var(--gc-a);} .gc-ctrl .gcbtn.pri{background:var(--gc-a);color:#fff;border-color:var(--gc-a);}',
    '.gc-ctrl label{font-size:12px;color:#475569;font-weight:700;}',
    '.gc-howto{background:#f8f7ff;border:1px solid #e9e5ff;border-left:3px solid var(--gc-a);border-radius:8px;padding:10px 12px;margin:0 0 12px;font-size:13px;color:#475569;line-height:1.5;}',
    '.gc-howto b{color:var(--gc-b);}',
    '.gc-tip{background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:8px 10px;margin:8px 0;font-size:12px;color:#92400e;}',
    '.gc-modal{position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:6000;display:flex;align-items:center;justify-content:center;padding:16px;}',
    '.gc-modal .box{background:#fff;border-radius:14px;max-width:460px;width:100%;max-height:85vh;overflow:auto;padding:20px;}',
    '.gc-modal h3{margin:0 0 10px;} .gc-modal .close{float:right;cursor:pointer;font-size:22px;line-height:1;color:#64748b;}',
    '.gc-modal .srow{display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid #f1f5f9;}',
    '.mm-grid{display:grid;gap:8px;}',
    '.mm-card{aspect-ratio:1;background:var(--gc-a);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:24px;cursor:pointer;user-select:none;color:transparent;transition:.15s;}',
    '.mm-card.open{background:#ede9fe;color:var(--gc-b);} .mm-card.done{background:#dcfce7;color:#166534;cursor:default;} .mm-card.hint{outline:3px solid #f59e0b;}',
    '.mn-grid{display:grid;gap:4px;}',
    '.mn-cell{aspect-ratio:1;background:#cbd5e1;border-radius:6px;display:flex;align-items:center;justify-content:center;font-weight:700;cursor:pointer;user-select:none;font-size:14px;}',
    '.mn-cell.open{background:#f1f5f9;cursor:default;} .mn-cell.flag{background:#fde68a;} .mn-cell.boom{background:#fca5a5;} .mn-cell.hint{outline:3px solid #22c55e;}',
    '.tf-grid{display:grid;gap:8px;background:#bbada0;padding:8px;border-radius:8px;touch-action:none;}',
    '.tf-cell{aspect-ratio:1;border-radius:6px;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:20px;background:#cdc1b4;color:#776e65;}',
    '.sk-wrap{display:flex;justify-content:center;}',
    '.sk-canvas{background:#0f172a;border-radius:8px;touch-action:none;max-width:100%;}',
    '.sk-pad{display:grid;grid-template-columns:repeat(3,56px);grid-template-rows:repeat(3,56px);gap:6px;justify-content:center;margin:12px auto 0;} .sk-pad button{font-size:20px;}',
    '.sm-board{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;max-width:320px;margin:0 auto;}',
    '.sm-pad{aspect-ratio:1;border-radius:14px;cursor:pointer;opacity:.55;transition:opacity .12s;border:3px solid rgba(0,0,0,.08);} .sm-pad.lit{opacity:1;}',
    '.sm-g{background:#22c55e;} .sm-r{background:#ef4444;} .sm-y{background:#eab308;} .sm-b{background:#3b82f6;}',
    '.ed-q{font-size:26px;font-weight:800;text-align:center;margin:14px 0;color:var(--gc-b);}',
    '.ed-opts{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;}',
    '.ed-opt{padding:14px;border:2px solid #e5e7eb;border-radius:10px;text-align:center;font-size:18px;font-weight:700;cursor:pointer;background:#fff;}',
    '.ed-opt:hover{border-color:var(--gc-a);} .ed-opt.good{background:#dcfce7;border-color:#22c55e;} .ed-opt.bad{background:#fee2e2;border-color:#ef4444;}',
    '.ed-in{width:100%;font-size:18px;padding:10px;border:2px solid #e5e7eb;border-radius:10px;text-align:center;}',
    '.ed-type{width:100%;font-size:16px;padding:10px;border:2px solid #e5e7eb;border-radius:10px;min-height:70px;}',
    '.ed-target{background:#f1f5f9;border-radius:10px;padding:12px;font-size:16px;line-height:1.6;margin:8px 0;}'
  ].join(''); document.head.appendChild(s); }

  function applyTheme(el){ var t=THEMES[SET.theme]||THEMES.violet; var bg=BGS[SET.bg]||BGS['default']; el.style.setProperty('--gc-a',t.a); el.style.setProperty('--gc-b',t.b); el.style.setProperty('--gc-bg',bg.c); el.style.color=(SET.bg==='charcoal')?'#e5e7eb':''; }

  // ---- game catalogue ----
  var GAMES={
    memory:{emo:'\uD83E\uDDE0',name:'Memory Match',edu:false,hint:true,arcade:true,tip:'Say the emoji out loud when you flip it \u2013 naming things helps you remember where they are.',help:'Flip two cards per turn. Matching pairs stay face-up. Clear every pair in as few moves as you can. Difficulty changes how many pairs are in play.'},
    mines:{emo:'\uD83D\uDCA3',name:'Mines',edu:false,hint:true,arcade:true,tip:'A revealed number tells you how many mines touch that square. Start from the big open areas.',help:'Tap to reveal squares. Numbers show how many mines are next to that square. Turn on Flag mode (or long-press / right-click) to mark mines. Clear every safe square to win. Difficulty changes the board size and number of mines.'},
    merge:{emo:'\uD83D\uDD22',name:'Number Merge',edu:false,hint:true,arcade:true,tip:'Keep your biggest tile in one corner and build around it.',help:'Swipe, use the arrow keys, or the on-screen arrows to slide all tiles. Two equal tiles merge into one that is double the value. Reach 2048! Advanced level uses a larger, tougher board.'},
    snake:{emo:'\uD83D\uDC0D',name:'Snake',edu:false,hint:false,arcade:true,tip:'Plan a path around the edges so you never trap yourself.',help:'Steer the snake with the arrow buttons or your keyboard. Eat the food to grow and score. Do not hit the walls or your own tail. Higher difficulty = faster snake on a bigger board.'},
    simon:{emo:'\uD83C\uDFB5',name:'Simon Says',edu:false,hint:false,arcade:true,tip:'Hum the tone of each colour \u2013 the sound makes the sequence easier to recall.',help:'Watch the colours light up in order, then tap them back in the same order. Each round adds one step. Higher difficulty plays the sequence faster.'},
    math:{emo:'\u2795',name:'Math Challenge',edu:true,hint:true,arcade:false,tip:'Break big sums into friendly numbers (e.g. 7+8 = 7+7+1).',help:'Solve as many arithmetic questions as you can before the timer runs out. Pick the correct answer. Beginner uses add/subtract with small numbers; Intermediate adds multiply/divide; Advanced mixes everything with bigger numbers.'},
    scramble:{emo:'\uD83D\uDD24',name:'Word Scramble',edu:true,hint:true,arcade:false,tip:'Look for common endings like -ING, -ED, or -TION first.',help:'Unscramble the letters to spell the hidden word, then press Check. Use Hint to reveal the next letter. Harder levels use longer words and less time.'},
    capitals:{emo:'\uD83C\uDF0D',name:'Capital Cities',edu:true,hint:true,arcade:false,tip:'Capitals are often (not always) the largest or most historic city of a country.',help:'Choose the correct capital city for the country shown. All facts are real-world geography. Advanced level includes trickier, less common countries.'},
    typing:{emo:'\u2328\uFE0F',name:'Typing Test',edu:true,hint:false,arcade:false,tip:'Keep your fingers on the home row and look at the text, not the keys.',help:'Type the shown sentence exactly, then press Done to see your words-per-minute and accuracy. Longer sentences appear at higher difficulty.'}
  };
  function gmeta(k){ return GAMES[k]||GAMES.memory; }
  function tipHtml(k){ var g=gmeta(k); return (SET.tips&&g.tip)?('<div class="gc-tip">\uD83D\uDCA1 Tip: '+esc(g.tip)+'</div>'):''; }
  function howto(txt){ return '<div class="gc-howto"><b>How to play:</b> '+esc(txt)+'</div>'; }

  // ---- shared control bar ----
  function ctrlBar(k){ var g=gmeta(k); var h='<div class="gc-ctrl">';
    h+='<label>Level</label><select onchange="GCsetLevel(this.value)">';
    LEVELS.forEach(function(L){ h+='<option value="'+L+'"'+(L===LEVEL?' selected':'')+'>'+L.charAt(0).toUpperCase()+L.slice(1)+'</option>'; });
    h+='</select>';
    h+='<button class="gcbtn pri" onclick="GCnew()">New game</button>';
    h+='<button class="gcbtn" onclick="GCrestart()">Restart</button>';
    if(g.hint) h+='<button class="gcbtn" onclick="GChint()">\uD83D\uDCA1 Hint</button>';
    h+='<button class="gcbtn" onclick="GCsaveGame()">\uD83D\uDCBE Save</button>';
    h+='<button class="gcbtn" onclick="GChelp()">\u2753 Help</button>';
    h+='<label>Theme</label><select onchange="GCsetTheme(this.value)">';
    Object.keys(THEMES).forEach(function(t){ h+='<option value="'+t+'"'+(t===SET.theme?' selected':'')+'>'+THEMES[t].n+'</option>'; });
    h+='</select>';
    h+='<label>Background</label><select onchange="GCsetBg(this.value)">';
    Object.keys(BGS).forEach(function(b){ h+='<option value="'+b+'"'+(b===SET.bg?' selected':'')+'>'+BGS[b].n+'</option>'; });
    h+='</select>';
    h+='<button class="gcbtn" onclick="GCsettings()">\u2699\uFE0F Options</button>';
    h+='<button class="gcbtn" onclick="GCquit()">\u2715 Quit</button>';
    h+='</div>'; return h; }

  // control handlers (dispatch to current game)
  window.GCsetLevel=function(v){ setLevel(v); };
  window.GCsetTheme=function(v){ SET.theme=v; saveSettings(); var w=document.querySelector('.gc-wrap'); if(w) applyTheme(w); };
  window.GCsetBg=function(v){ SET.bg=v; saveSettings(); var w=document.querySelector('.gc-wrap'); if(w) applyTheme(w); };
  window.GCnew=function(){ if(CUR){ clearSave(CUR); GCshow(CUR,true); } };
  window.GCrestart=function(){ if(CUR) GCshow(CUR,true); };
  window.GChint=function(){ var f=HINTS[CUR]; if(typeof f==='function') f(); else toast('No hint for this game.'); };
  window.GChelp=function(){ var g=gmeta(CUR); modal('\u2753 How to play \u2013 '+g.name, '<p style="line-height:1.6;">'+esc(g.help)+'</p>'+(g.tip?'<p class="gc-tip" style="margin-top:10px;">\uD83D\uDCA1 '+esc(g.tip)+'</p>':'')); };
  window.GCquit=function(){ if(CUR&&SET.saveOnExit) GCsaveGame(true); CUR=null; renderGames(); };
  window.GCsaveGame=function(silent){ if(!CUR) return; var f=SAVERS[CUR]; if(typeof f!=='function'){ if(!silent) toast('This game cannot be saved.'); return; } var st=f(); if(st==null){ if(!silent) toast('Nothing to save yet \u2013 make a move first.'); return; } putSave(CUR,st); if(!silent) toast('\uD83D\uDCBE Game saved \u2013 reopen it to resume.'); };

  var HINTS={}, SAVERS={}, RESTORERS={}, STARTERS={};

  // ---- settings / help modal ----
  function modal(title,bodyHtml){ var old=document.getElementById('gcModal'); if(old) old.parentNode.removeChild(old); var d=document.createElement('div'); d.id='gcModal'; d.className='gc-modal'; d.innerHTML='<div class="box"><span class="close" onclick="GCcloseModal()">\u2715</span><h3>'+title+'</h3>'+bodyHtml+'</div>'; d.addEventListener('click',function(e){ if(e.target===d) GCcloseModal(); }); document.body.appendChild(d); }
  window.GCcloseModal=function(){ var d=document.getElementById('gcModal'); if(d) d.parentNode.removeChild(d); };
  window.GCsettings=function(){ var sw=function(on){return on?'checked':'';}; var b=''
    +'<div class="srow"><span><strong>Show tips</strong><br><small style="color:#64748b;">Hint banners while you play.</small></span><label class="switch"><input type="checkbox" '+sw(SET.tips)+' onchange="GCopt(\'tips\',this.checked)"></label></div>'
    +'<div class="srow"><span><strong>Play sound</strong><br><small style="color:#64748b;">Sound effects (generated, offline).</small></span><label class="switch"><input type="checkbox" '+sw(SET.sound)+' onchange="GCopt(\'sound\',this.checked)"></label></div>'
    +'<div class="srow"><span><strong>Save game on exit</strong><br><small style="color:#64748b;">Auto-save when you quit so you can resume later.</small></span><label class="switch"><input type="checkbox" '+sw(SET.saveOnExit)+' onchange="GCopt(\'saveOnExit\',this.checked)"></label></div>'
    +'<div style="margin-top:14px;display:flex;gap:8px;flex-wrap:wrap;">'
    +(CUR&&SAVERS[CUR]?'<button class="gcbtn pri" onclick="GCsaveGame();GCcloseModal();">\uD83D\uDCBE Save &amp; resume later</button>':'')
    +(CUR&&hasSave(CUR)?'<button class="gcbtn" onclick="GCresume()">\u21BA Resume saved game</button>':'')
    +'<button class="gcbtn" onclick="GCcloseModal()">Close</button></div>';
    modal('\u2699\uFE0F Options', b); }
  window.GCopt=function(k,v){ SET[k]=v; saveSettings(); if(k==='tips'&&CUR) GCshow(CUR,true); };
  window.GCresume=function(){ GCcloseModal(); if(CUR) GCshow(CUR,false); };

  // ---- lobby + router ----
  function tile(k){ var g=gmeta(k); return '<div class="gc-tile" onclick="GCshow(\''+k+'\')"><div class="emo">'+g.emo+'</div><div>'+esc(g.name)+'</div>'+(hasSave(k)?'<div class="edu" style="background:#e0e7ff;color:#3730a3;">\u21BA saved</div>':(g.edu?'<div class="edu">Educational</div>':''))+'</div>'; }
  function renderGames(){ injectCSS(); var el=document.getElementById('page-games'); if(!el) return; CUR=null;
    var h='<div class="gc-wrap"><div class="gc-hero"><h1>\uD83C\uDFAE Game Center</h1><p>Original offline games \u2013 arcade fun and brain-training, no internet needed. Pick a game, choose your level, and play. Your progress can be saved and resumed.</p></div>';
    h+='<div class="gc-sec-title">\uD83D\uDD79\uFE0F Arcade &amp; puzzle</div><div class="gc-grid">';
    Object.keys(GAMES).forEach(function(k){ if(gmeta(k).arcade) h+=tile(k); });
    h+='</div><div class="gc-sec-title">\uD83C\uDF93 Educational</div><div class="gc-grid">';
    Object.keys(GAMES).forEach(function(k){ if(gmeta(k).edu) h+=tile(k); });
    h+='</div><div id="gcPanel"></div></div>';
    el.innerHTML=h; var w=el.querySelector('.gc-wrap'); if(w) applyTheme(w);
  }
  window.GCshow=function(k,forceNew){ CUR=k; var panel=document.getElementById('gcPanel'); if(!panel){ renderGames(); panel=document.getElementById('gcPanel'); } var w=document.querySelector('.gc-wrap'); if(w) applyTheme(w); var saved=(!forceNew&&hasSave(k)&&RESTORERS[k])?getSave(k):null; var start=STARTERS[k]; if(typeof start==='function') start(saved); if(panel){ try{ panel.scrollIntoView({behavior:'smooth',block:'start'}); }catch(e){} } };
  function panelHtml(k,inner){ var g=gmeta(k); var bar='<div class="gc-bar"><h3 style="margin:0;">'+g.emo+' '+esc(g.name)+'</h3></div>'; return '<div class="gc-card">'+bar+ctrlBar(k)+howto(g.help)+tipHtml(k)+'<div id="gcBoard">'+inner+'</div></div>'; }
  function setPanel(html){ var p=document.getElementById('gcPanel'); if(p) p.innerHTML=html; }
  function setBoard(html){ var b=document.getElementById('gcBoard'); if(b) b.innerHTML=html; }

  // ================= MEMORY MATCH =================
  var MM_EMO=['\uD83C\uDFB5','\uD83C\uDFB8','\uD83C\uDFA4','\uD83C\uDFAC','\uD83D\uDCF8','\uD83C\uDF1F','\uD83D\uDD25','\uD83D\uDE80','\uD83C\uDF08','\uD83C\uDFAF','\uD83D\uDC8E','\uD83C\uDF81','\uD83C\uDF55','\uD83C\uDFB2','\uD83C\uDF34','\uD83C\uDFA7'];
  var MM={ cards:[], first:-1, lock:false, moves:0, matched:0, pairs:8 };
  function mmPairs(){ return LEVEL==='beginner'?6:(LEVEL==='advanced'?12:8); }
  function mmCols(){ return MM.pairs<=6?4:(MM.pairs<=8?4:6); }
  STARTERS.memory=function(saved){ if(saved){ MM=saved; } else { var pairs=mmPairs(); var pool=MM_EMO.slice(0,pairs); var deck=pool.concat(pool); for(var i=deck.length-1;i>0;i--){ var j=Math.floor(Math.random()*(i+1)); var t=deck[i];deck[i]=deck[j];deck[j]=t; } MM={ cards:deck.map(function(e){return {e:e,open:false,done:false};}), first:-1, lock:false, moves:0, matched:0, pairs:pairs }; } setPanel(panelHtml('memory', mmBoard())); }
  function mmBoard(){ var cols=mmCols(); var h='<div class="gc-bar"><span class="gc-stat">Moves: '+MM.moves+' \u2022 Pairs: '+MM.matched+'/'+MM.pairs+'</span></div>'; h+='<div class="mm-grid" style="grid-template-columns:repeat('+cols+',1fr);">'; MM.cards.forEach(function(c,i){ var cls='mm-card'+(c.done?' done':(c.open?' open':'')); h+='<div class="'+cls+'" id="mm'+i+'" onclick="GCmm('+i+')">'+((c.open||c.done)?c.e:'?')+'</div>'; }); h+='</div>'; return h; }
  window.GCmm=function(i){ if(MM.lock) return; var c=MM.cards[i]; if(!c||c.open||c.done) return; sClick(); c.open=true; if(MM.first<0){ MM.first=i; setBoard(mmBoard()); return; } MM.moves++; var a=MM.cards[MM.first]; if(a.e===c.e){ a.done=c.done=true; MM.matched++; MM.first=-1; sGood(); setBoard(mmBoard()); if(MM.matched===MM.pairs){ clearSave('memory'); setTimeout(function(){ toast('\uD83C\uDF89 You won in '+MM.moves+' moves!'); },150); } } else { MM.lock=true; sBad(); setBoard(mmBoard()); setTimeout(function(){ a.open=false; c.open=false; MM.first=-1; MM.lock=false; setBoard(mmBoard()); },700); } };
  HINTS.memory=function(){ var map={}; for(var i=0;i<MM.cards.length;i++){ var c=MM.cards[i]; if(c.done) continue; if(map[c.e]!=null){ var j=map[c.e]; var a=document.getElementById('mm'+i),b=document.getElementById('mm'+j); if(a)a.classList.add('hint'); if(b)b.classList.add('hint'); tone(760,0.12); setTimeout(function(){ if(a)a.classList.remove('hint'); if(b)b.classList.remove('hint'); },900); return; } map[c.e]=i; } toast('No pairs left to hint.'); };
  SAVERS.memory=function(){ if(MM.moves===0&&MM.first<0) return null; return JSON.parse(JSON.stringify(MM)); };
  RESTORERS.memory=true;

  // ================= MINES =================
  var MN={ n:9, mines:12, grid:[], open:[], flag:[], over:false, won:false, placed:false, flagMode:false };
  function mnCfg(){ return LEVEL==='beginner'?{n:8,m:10}:(LEVEL==='advanced'?{n:12,m:30}:{n:9,m:12}); }
  STARTERS.mines=function(saved){ if(saved){ MN=saved; } else { var c=mnCfg(); var N=c.n*c.n; MN={ n:c.n, mines:c.m, grid:new Array(N).fill(0), open:new Array(N).fill(false), flag:new Array(N).fill(false), over:false, won:false, placed:false, flagMode:false }; } setPanel(panelHtml('mines', mnBoard())); }
  function mnNeighbors(i){ var n=MN.n, r=Math.floor(i/n), c=i%n, out=[]; for(var dr=-1;dr<=1;dr++) for(var dc=-1;dc<=1;dc++){ if(!dr&&!dc) continue; var rr=r+dr,cc=c+dc; if(rr>=0&&rr<n&&cc>=0&&cc<n) out.push(rr*n+cc); } return out; }
  function mnPlace(safe){ var N=MN.n*MN.n; var idx=[]; for(var i=0;i<N;i++){ if(i!==safe) idx.push(i); } for(var i=idx.length-1;i>0;i--){ var j=Math.floor(Math.random()*(i+1)); var t=idx[i];idx[i]=idx[j];idx[j]=t; } for(var k=0;k<MN.mines;k++){ MN.grid[idx[k]]=-1; } for(var i=0;i<N;i++){ if(MN.grid[i]===-1) continue; var cnt=0; mnNeighbors(i).forEach(function(nb){ if(MN.grid[nb]===-1) cnt++; }); MN.grid[i]=cnt; } MN.placed=true; }
  function mnReveal(i){ if(MN.open[i]||MN.flag[i]) return; MN.open[i]=true; if(MN.grid[i]===0){ mnNeighbors(i).forEach(function(nb){ if(!MN.open[nb]) mnReveal(nb); }); } }
  function mnBoard(){ var flags=MN.flag.filter(Boolean).length; var h='<div class="gc-bar"><span class="gc-stat">Mines: '+MN.mines+' \u2022 Flags: '+flags+'</span><button class="gcbtn '+(MN.flagMode?'pri':'')+'" onclick="GCmnFlagMode()">\uD83D\uDEA9 Flag '+(MN.flagMode?'ON':'OFF')+'</button></div>'; h+='<div class="mn-grid" style="grid-template-columns:repeat('+MN.n+',1fr);">'; var N=MN.n*MN.n; for(var i=0;i<N;i++){ var cls='mn-cell'; var txt=''; if(MN.open[i]){ cls+=' open'; if(MN.grid[i]===-1){ cls+=' boom'; txt='\uD83D\uDCA3'; } else if(MN.grid[i]>0){ txt=MN.grid[i]; } } else if(MN.flag[i]){ cls+=' flag'; txt='\uD83D\uDEA9'; } h+='<div class="'+cls+'" id="mn'+i+'" oncontextmenu="GCmnFlag(event,'+i+')" onclick="GCmnTap('+i+')">'+txt+'</div>'; } h+='</div>'; if(MN.over) h+='<p class="gc-stat" style="color:'+(MN.won?'#166534':'#b91c1c')+';margin-top:10px;">'+(MN.won?'\uD83C\uDF89 Cleared! Well done.':'\uD83D\uDCA5 Boom! Game over.')+'</p>'; return h; }
  window.GCmnFlagMode=function(){ MN.flagMode=!MN.flagMode; sClick(); setBoard(mnBoard()); };
  window.GCmnTap=function(i){ if(MN.over) return; if(MN.flagMode){ return window.GCmnFlag(null,i); } if(MN.flag[i]) return; if(!MN.placed) mnPlace(i); if(MN.grid[i]===-1){ MN.open[i]=true; MN.over=true; sBad(); for(var k=0;k<MN.grid.length;k++){ if(MN.grid[k]===-1) MN.open[k]=true; } clearSave('mines'); setBoard(mnBoard()); return; } sClick(); mnReveal(i); var N=MN.n*MN.n, closed=0; for(var k=0;k<N;k++){ if(!MN.open[k]) closed++; } if(closed===MN.mines){ MN.over=true; MN.won=true; sGood(); clearSave('mines'); } setBoard(mnBoard()); };
  window.GCmnFlag=function(ev,i){ if(ev){ ev.preventDefault(); ev.stopPropagation(); } if(MN.over||MN.open[i]) return false; MN.flag[i]=!MN.flag[i]; sClick(); setBoard(mnBoard()); return false; };
  HINTS.mines=function(){ if(!MN.placed){ toast('Tap any square first to start the board.'); return; } var N=MN.n*MN.n; var cands=[]; for(var i=0;i<N;i++){ if(!MN.open[i]&&!MN.flag[i]&&MN.grid[i]!==-1) cands.push(i); } if(!cands.length){ toast('No safe hint available.'); return; } var pick=cands[Math.floor(Math.random()*cands.length)]; var el=document.getElementById('mn'+pick); if(el){ el.classList.add('hint'); tone(720,0.12); setTimeout(function(){ el.classList.remove('hint'); },1100); } };
  SAVERS.mines=function(){ if(!MN.placed) return null; return JSON.parse(JSON.stringify(MN)); };
  RESTORERS.mines=true;

  // ================= NUMBER MERGE (2048-style) =================
  var TF_COL={2:'#eee4da',4:'#ede0c8',8:'#f2b179',16:'#f59563',32:'#f67c5f',64:'#f65e3b',128:'#edcf72',256:'#edcc61',512:'#edc850',1024:'#edc53f',2048:'#edc22e'};
  var TF={ n:4, grid:[], score:0, over:false, won:false };
  function tfN(){ return LEVEL==='advanced'?5:4; }
  STARTERS.merge=function(saved){ if(saved){ TF=saved; } else { var n=tfN(); TF={ n:n, grid:new Array(n*n).fill(0), score:0, over:false, won:false }; tfAdd(); tfAdd(); } setPanel(panelHtml('merge', tfBoard())); tfBind(); }
  function tfAdd(){ var N=TF.n*TF.n; var empty=[]; for(var i=0;i<N;i++) if(!TF.grid[i]) empty.push(i); if(!empty.length) return; var idx=empty[Math.floor(Math.random()*empty.length)]; TF.grid[idx]=(LEVEL==='beginner')?2:(Math.random()<0.9?2:4); }
  function tfBoard(){ var n=TF.n; var h='<div class="gc-bar"><span class="gc-stat">Score: '+TF.score+'</span></div>'; h+='<div class="tf-grid" id="tfGrid" style="grid-template-columns:repeat('+n+',1fr);">'; for(var i=0;i<n*n;i++){ var v=TF.grid[i]; var bg=v?(TF_COL[v]||'#3c3a32'):'#cdc1b4'; var col=(v<=4)?'#776e65':'#f9f6f2'; h+='<div class="tf-cell" style="background:'+bg+';color:'+col+';font-size:'+(v>=1024?'16px':(v>=128?'18px':'20px'))+';">'+(v||'')+'</div>'; } h+='</div>'; h+='<div style="display:flex;justify-content:center;margin-top:10px;"><button class="gcbtn" onclick="GCtf(\'up\')">\u2191</button></div><div style="display:flex;justify-content:center;gap:6px;margin-top:6px;"><button class="gcbtn" onclick="GCtf(\'left\')">\u2190</button><button class="gcbtn" onclick="GCtf(\'down\')">\u2193</button><button class="gcbtn" onclick="GCtf(\'right\')">\u2192</button></div>'; if(TF.over) h+='<p class="gc-stat" style="color:#b91c1c;margin-top:8px;">Game over \u2013 no more moves. Score: '+TF.score+'</p>'; if(TF.won) h+='<p class="gc-stat" style="color:#166534;margin-top:8px;">\uD83C\uDF89 You reached 2048!</p>'; return h; }
  function tfLineMerge(line,n){ var a=line.filter(function(x){return x;}); var gained=0; for(var i=0;i<a.length-1;i++){ if(a[i]===a[i+1]){ a[i]*=2; gained+=a[i]; if(a[i]===2048) TF.won=true; a.splice(i+1,1); } } while(a.length<n) a.push(0); return {line:a,gained:gained}; }
  function tfApply(dir,commit){ var n=TF.n, moved=false, gained=0; var g=commit?TF.grid:TF.grid.slice(); function get(r,c){ return g[r*n+c]; } function set(r,c,v){ g[r*n+c]=v; } for(var k=0;k<n;k++){ var line=[]; for(var m=0;m<n;m++){ if(dir==='left') line.push(get(k,m)); else if(dir==='right') line.push(get(k,n-1-m)); else if(dir==='up') line.push(get(m,k)); else line.push(get(n-1-m,k)); } var res=tfLineMerge(line,n); gained+=res.gained; for(var m=0;m<n;m++){ var v=res.line[m]; var o; if(dir==='left'){o=get(k,m);set(k,m,v);} else if(dir==='right'){o=get(k,n-1-m);set(k,n-1-m,v);} else if(dir==='up'){o=get(m,k);set(m,k,v);} else {o=get(n-1-m,k);set(n-1-m,k,v);} if(o!==v) moved=true; } } return {moved:moved,gained:gained}; }
  window.GCtf=function(dir){ if(TF.over) return; var r=tfApply(dir,true); if(r.moved){ TF.score+=r.gained; if(r.gained>0) tone(520,0.08); else sClick(); tfAdd(); if(!tfCanMove()){ TF.over=true; sBad(); clearSave('merge'); } setBoard(tfBoard()); } };
  function tfCanMove(){ var N=TF.n*TF.n,n=TF.n; for(var i=0;i<N;i++){ if(!TF.grid[i]) return true; var r=Math.floor(i/n),c=i%n; if(c<n-1&&TF.grid[i]===TF.grid[i+1]) return true; if(r<n-1&&TF.grid[i]===TF.grid[i+n]) return true; } return false; }
  HINTS.merge=function(){ var best=null,bestG=-1; ['up','down','left','right'].forEach(function(d){ var r=tfApply(d,false); if(r.moved&&r.gained>bestG){ bestG=r.gained; best=d; } }); if(best){ var names={up:'\u2191 Up',down:'\u2193 Down',left:'\u2190 Left',right:'\u2192 Right'}; toast('Hint: try '+names[best]+(bestG>0?' \u2013 it merges tiles.':' \u2013 it opens space.')); } else toast('No moves left.'); };
  SAVERS.merge=function(){ if(TF.score===0&&TF.grid.filter(function(x){return x;}).length<=2) return null; return JSON.parse(JSON.stringify(TF)); };
  RESTORERS.merge=true;
  function tfBind(){ if(window.__tfBound) return; window.__tfBound=true; document.addEventListener('keydown',function(e){ if(CUR!=='merge') return; var g=document.getElementById('page-games'); if(!g||g.style.display==='none') return; var k=e.key; if(k==='ArrowLeft'){GCtf('left');e.preventDefault();} else if(k==='ArrowRight'){GCtf('right');e.preventDefault();} else if(k==='ArrowUp'){GCtf('up');e.preventDefault();} else if(k==='ArrowDown'){GCtf('down');e.preventDefault();} }); var sx=0,sy=0; document.addEventListener('touchstart',function(e){ var grid=document.getElementById('tfGrid'); if(!grid||!grid.contains(e.target)) return; sx=e.touches[0].clientX; sy=e.touches[0].clientY; },{passive:true}); document.addEventListener('touchend',function(e){ if(CUR!=='merge') return; var grid=document.getElementById('tfGrid'); if(!grid) return; var dx=e.changedTouches[0].clientX-sx, dy=e.changedTouches[0].clientY-sy; if(Math.abs(dx)<24&&Math.abs(dy)<24) return; if(Math.abs(dx)>Math.abs(dy)) GCtf(dx>0?'right':'left'); else GCtf(dy>0?'down':'up'); }); }

  // ================= SNAKE =================
  var SK={ grid:16, cell:18, snake:[], dir:null, next:null, food:0, score:0, over:false, timer:null, started:false, speed:140 };
  function skCfg(){ return LEVEL==='beginner'?{g:12,s:180}:(LEVEL==='advanced'?{g:20,s:95}:{g:16,s:140}); }
  STARTERS.snake=function(saved){ if(SK.timer){ clearInterval(SK.timer); SK.timer=null; } if(saved){ SK=saved; SK.timer=null; SK.started=false; } else { var c=skCfg(); var g=c.g; SK={ grid:g, cell:(g<=12?22:(g>=20?15:18)), snake:[Math.floor(g*g/2)+1, Math.floor(g*g/2), Math.floor(g*g/2)-1], dir:{x:1,y:0}, next:{x:1,y:0}, food:0, score:0, over:false, timer:null, started:false, speed:c.s }; skFood(); } setPanel(panelHtml('snake', skBoard())); skBind(); skDraw(); }
  function skFood(){ var g=SK.grid, N=g*g, c; do { c=Math.floor(Math.random()*N); } while(SK.snake.indexOf(c)>=0); SK.food=c; }
  function skBoard(){ var px=SK.grid*SK.cell; var h='<div class="gc-bar"><span class="gc-stat" id="skScore">Score: '+SK.score+'</span><span style="display:flex;gap:6px;"><button class="gcbtn" id="skWalls" onclick="GCskWalls()" title="Toggle edge barriers. Wrap = pass through edges to the opposite side. Walls = hitting an edge ends the game.">'+(SET.skWalls?'🧱 Walls: On':'🔄 Wrap: On')+'</button><button class="gcbtn" id="skPause" onclick="GCskPause()">⏸️ Pause</button></span></div>'; h+='<div class="sk-wrap"><canvas id="skCanvas" class="sk-canvas" width="'+px+'" height="'+px+'"></canvas></div>'; h+='<div class="sk-pad"><span></span><button class="gcbtn" onclick="GCskDir(0,-1)">\u2191</button><span></span><button class="gcbtn" onclick="GCskDir(-1,0)">\u2190</button><button class="gcbtn" onclick="GCskDir(0,1)">\u2193</button><button class="gcbtn" onclick="GCskDir(1,0)">\u2192</button></div>'; h+='<p class="gc-stat" id="skMsg" style="margin-top:8px;color:#b91c1c;"></p>'; return h; }
  function skDraw(){ var cv=document.getElementById('skCanvas'); if(!cv||!cv.getContext) return; var ctx=cv.getContext('2d'); if(!ctx||typeof ctx.fillRect!=='function') return; var g=SK.grid, cs=SK.cell; ctx.fillStyle='#0f172a'; ctx.fillRect(0,0,cv.width,cv.height); var fx=SK.food%g, fy=Math.floor(SK.food/g); ctx.fillStyle='#f43f5e'; if(ctx.beginPath){ ctx.beginPath(); ctx.arc(fx*cs+cs/2, fy*cs+cs/2, cs/2-2, 0, 7); ctx.fill(); } else { ctx.fillRect(fx*cs+1,fy*cs+1,cs-2,cs-2); } SK.snake.forEach(function(c,i){ var x=c%g, y=Math.floor(c/g); ctx.fillStyle=(i===0)?'#22c55e':'#4ade80'; ctx.fillRect(x*cs+1,y*cs+1,cs-2,cs-2); }); var sc=document.getElementById('skScore'); if(sc) sc.textContent='Score: '+SK.score; }
  function skStep(){ if(SK.over) return; SK.dir=SK.next; var g=SK.grid; var head=SK.snake[0]; var hx=head%g+SK.dir.x, hy=Math.floor(head/g)+SK.dir.y; if(hx<0||hx>=g||hy<0||hy>=g){ if(SET.skWalls){ return skEnd(); } hx=(hx+g)%g; hy=(hy+g)%g; } var nh=hy*g+hx; if(SK.snake.indexOf(nh)>=0 && nh!==SK.snake[SK.snake.length-1]){ return skEnd(); } SK.snake.unshift(nh); if(nh===SK.food){ SK.score++; tone(680,0.07); skFood(); } else { SK.snake.pop(); } skDraw(); }
  function skEnd(){ SK.over=true; sBad(); if(SK.timer){ clearInterval(SK.timer); SK.timer=null; } clearSave('snake'); var m=document.getElementById('skMsg'); if(m) m.textContent='\uD83D\uDCA5 Game over \u2013 score '+SK.score+'. Tap New game to retry.'; }
  window.GCskWalls=function(){ SET.skWalls=!SET.skWalls; saveSettings(); var btn=document.getElementById('skWalls'); if(btn) btn.textContent=(SET.skWalls?'🧱 Walls: On':'🔄 Wrap: On'); var m=document.getElementById('skMsg'); if(m) m.textContent=(SET.skWalls?'Walls on – hitting an edge ends the game.':'Wrap on – the snake passes through edges to the opposite side.'); };
  window.GCskPause=function(){ if(SK.over||!SK.started) return; var btn=document.getElementById('skPause'); if(SK.timer){ clearInterval(SK.timer); SK.timer=null; SK.paused=true; if(btn) btn.textContent='▶️ Resume'; var m=document.getElementById('skMsg'); if(m) m.textContent='⏸️ Paused – tap Resume to continue.'; } else { SK.paused=false; SK.timer=setInterval(skStep,SK.speed); if(btn) btn.textContent='⏸️ Pause'; var m2=document.getElementById('skMsg'); if(m2) m2.textContent=''; } };
  window.GCskDir=function(x,y){ if(SK.over) return; if(SK.dir.x===-x&&SK.dir.y===-y) return; SK.next={x:x,y:y}; if(!SK.started){ SK.started=true; SK.timer=setInterval(skStep,SK.speed); } };
  function skBind(){ if(window.__skBound) return; window.__skBound=true; document.addEventListener('keydown',function(e){ if(CUR!=='snake') return; var cv=document.getElementById('skCanvas'); if(!cv) return; var k=e.key; if(k==='ArrowUp'){GCskDir(0,-1);e.preventDefault();} else if(k==='ArrowDown'){GCskDir(0,1);e.preventDefault();} else if(k==='ArrowLeft'){GCskDir(-1,0);e.preventDefault();} else if(k==='ArrowRight'){GCskDir(1,0);e.preventDefault();} }); }
  SAVERS.snake=function(){ if(SK.score===0&&!SK.started) return null; var c={ grid:SK.grid, cell:SK.cell, snake:SK.snake.slice(), dir:{x:SK.dir.x,y:SK.dir.y}, next:{x:SK.dir.x,y:SK.dir.y}, food:SK.food, score:SK.score, over:false, timer:null, started:false, speed:SK.speed }; return c; }
  RESTORERS.snake=true;

  // ================= SIMON SAYS =================
  var SM={ seq:[], step:0, playing:false, best:0, cols:['g','r','y','b'], gap:560 };
  var SM_FREQ={g:329.63,r:261.63,y:220.00,b:164.81};
  function smGap(){ return LEVEL==='beginner'?640:(LEVEL==='advanced'?430:560); }
  STARTERS.simon=function(saved){ if(saved){ SM.seq=saved.seq||[]; SM.best=saved.best||0; } else { SM.seq=[]; SM.best=0; } SM.step=0; SM.playing=false; SM.gap=smGap(); setPanel(panelHtml('simon', smBoard())); setTimeout(function(){ if(SM.seq.length) smPlay(); else smAdd(); },500); }
  function smBoard(){ var h='<div class="gc-bar"><span class="gc-stat" id="smScore">Round: '+SM.seq.length+' \u2022 Best: '+SM.best+'</span></div>'; h+='<div class="sm-board">'; SM.cols.forEach(function(c){ h+='<div class="sm-pad sm-'+c+'" id="sm-'+c+'" onclick="GCsmTap(\''+c+'\')"></div>'; }); h+='</div><p class="gc-stat" id="smMsg" style="text-align:center;margin-top:10px;color:#475569;">Watch the sequence\u2026</p>'; return h; }
  function smFlash(c,ms){ var el=document.getElementById('sm-'+c); if(!el) return; el.classList.add('lit'); var old=SET.sound; tone(SM_FREQ[c]||300,0.3); setTimeout(function(){ el.classList.remove('lit'); },ms||300); }
  function smAdd(){ SM.seq.push(SM.cols[Math.floor(Math.random()*4)]); SM.step=0; smPlay(); }
  function smPlay(){ SM.playing=true; var msg=document.getElementById('smMsg'); if(msg) msg.textContent='Watch the sequence\u2026'; var i=0; var iv=setInterval(function(){ if(i>=SM.seq.length){ clearInterval(iv); SM.playing=false; var m=document.getElementById('smMsg'); if(m) m.textContent='Your turn \u2013 repeat it!'; return; } smFlash(SM.seq[i],Math.max(220,SM.gap-220)); i++; },SM.gap); var sc=document.getElementById('smScore'); if(sc) sc.textContent='Round: '+SM.seq.length+' \u2022 Best: '+SM.best; }
  window.GCsmTap=function(c){ if(SM.playing||!SM.seq.length) return; smFlash(c,200); if(c===SM.seq[SM.step]){ SM.step++; if(SM.step===SM.seq.length){ if(SM.seq.length>SM.best) SM.best=SM.seq.length; sGood(); var m=document.getElementById('smMsg'); if(m) m.textContent='\u2714 Nice! Next round\u2026'; setTimeout(smAdd,700); } } else { SM.playing=true; sBad(); clearSave('simon'); var m=document.getElementById('smMsg'); if(m){ m.style.color='#b91c1c'; m.textContent='\u2716 Wrong! You reached round '+SM.seq.length+'. Tap New game.'; } } };
  SAVERS.simon=function(){ if(SM.seq.length<=1) return null; return { seq:SM.seq.slice(), best:SM.best }; }
  RESTORERS.simon=true;

  // ================= MATH CHALLENGE (educational) =================
  var MA={ score:0, time:60, timer:null, q:'', ans:0, opts:[], over:false };
  function rnd(a,b){ return a+Math.floor(Math.random()*(b-a+1)); }
  function maGen(){ var a,b,op,ans,q; if(LEVEL==='beginner'){ op=['+','-'][rnd(0,1)]; a=rnd(1,12); b=rnd(1,12); if(op==='-'&&b>a){ var t=a;a=b;b=t; } ans=op==='+'?a+b:a-b; q=a+' '+op+' '+b; } else if(LEVEL==='intermediate'){ op=['+','-','\u00D7','\u00F7'][rnd(0,3)]; if(op==='\u00D7'){ a=rnd(2,12); b=rnd(2,12); ans=a*b; } else if(op==='\u00F7'){ b=rnd(2,12); ans=rnd(2,12); a=b*ans; } else { a=rnd(5,50); b=rnd(1,50); if(op==='-'&&b>a){ var t=a;a=b;b=t; } ans=op==='+'?a+b:a-b; } q=a+' '+op+' '+b; } else { var mode=rnd(0,2); if(mode===0){ a=rnd(2,15); b=rnd(2,15); var c=rnd(1,20); ans=a*b+c; q=a+' \u00D7 '+b+' + '+c; } else if(mode===1){ b=rnd(2,15); ans=rnd(3,15); a=b*ans; ans=ans; q=a+' \u00F7 '+b; } else { a=rnd(20,200); b=rnd(20,200); op=['+','-'][rnd(0,1)]; if(op==='-'&&b>a){ var t=a;a=b;b=t; } ans=op==='+'?a+b:a-b; q=a+' '+op+' '+b; } } var opts=[ans]; var guard=0; while(opts.length<4&&guard++<50){ var d=ans+rnd(-Math.max(3,Math.round(Math.abs(ans)*0.2)),Math.max(3,Math.round(Math.abs(ans)*0.2))); if(d!==ans&&opts.indexOf(d)<0) opts.push(d); } while(opts.length<4) opts.push(ans+opts.length); for(var i=opts.length-1;i>0;i--){ var j=rnd(0,i); var t=opts[i];opts[i]=opts[j];opts[j]=t; } MA.q=q; MA.ans=ans; MA.opts=opts; }
  STARTERS.math=function(){ if(MA.timer){ clearInterval(MA.timer); MA.timer=null; } MA.score=0; MA.time=60; MA.over=false; maGen(); setPanel(panelHtml('math', maBoard())); MA.timer=setInterval(function(){ MA.time--; if(MA.time<=0){ MA.time=0; MA.over=true; clearInterval(MA.timer); MA.timer=null; sBad(); } var t=document.getElementById('maTime'); if(t) t.textContent='\u23F1\uFE0F '+MA.time+'s'; if(MA.over) setBoard(maBoard()); },1000); }
  function maBoard(){ if(MA.over){ return '<div class="ed-q">\u23F0 Time!</div><p style="text-align:center;font-size:18px;">You scored <strong>'+MA.score+'</strong> correct answers. Press New game to try again or change the level.</p>'; } var h='<div class="gc-bar"><span class="gc-stat" id="maTime">\u23F1\uFE0F '+MA.time+'s</span><span class="gc-stat">Score: '+MA.score+'</span></div>'; h+='<div class="ed-q">'+esc(MA.q)+' = ?</div><div class="ed-opts">'; MA.opts.forEach(function(o,i){ h+='<div class="ed-opt" id="ma'+i+'" onclick="GCmaAns('+i+')">'+o+'</div>'; }); h+='</div>'; return h; }
  window.GCmaAns=function(i){ if(MA.over) return; var val=MA.opts[i]; var el=document.getElementById('ma'+i); if(val===MA.ans){ MA.score++; if(el) el.classList.add('good'); sGood(); setTimeout(function(){ maGen(); setBoard(maBoard()); },260); } else { if(el) el.classList.add('bad'); sBad(); var gi=MA.opts.indexOf(MA.ans); var ge=document.getElementById('ma'+gi); if(ge) ge.classList.add('good'); setTimeout(function(){ maGen(); setBoard(maBoard()); },650); } };
  HINTS.math=function(){ if(MA.over) return; var removed=0; for(var i=0;i<MA.opts.length&&removed<2;i++){ if(MA.opts[i]!==MA.ans){ var el=document.getElementById('ma'+i); if(el&&!el.classList.contains('bad')){ el.classList.add('bad'); el.style.pointerEvents='none'; el.style.opacity='.4'; removed++; } } } tone(700,0.1); };

  // ================= WORD SCRAMBLE (educational) =================
  var WS_WORDS={ beginner:['apple','music','happy','green','water','light','smile','dance','sunny','tiger','bread','cloud','phone','chair','plant'], intermediate:['creator','journey','picture','freedom','harmony','teacher','diamond','rainbow','student','capture','network','balance','melody','camera','mindful'], advanced:['knowledge','adventure','community','education','celebrate','wonderful','character','marketing','discovery','telephone','influence','framework','breakfast','vegetable','xylophone'] };
  var WS={ word:'', scrambled:'', revealed:0, score:0 };
  function wsPick(){ var list=WS_WORDS[LEVEL]||WS_WORDS.intermediate; var w=list[rnd(0,list.length-1)]; var arr=w.split(''); var s; do { for(var i=arr.length-1;i>0;i--){ var j=rnd(0,i); var t=arr[i];arr[i]=arr[j];arr[j]=t; } s=arr.join(''); } while(s===w&&w.length>1); WS.word=w; WS.scrambled=s; WS.revealed=0; }
  STARTERS.scramble=function(saved){ if(saved){ WS.score=saved.score||0; } else { WS.score=0; } wsPick(); setPanel(panelHtml('scramble', wsBoard())); var inp=document.getElementById('wsIn'); if(inp) inp.focus(); }
  function wsBoard(){ var h='<div class="gc-bar"><span class="gc-stat">Solved: '+WS.score+'</span><span class="gc-stat">'+WS.word.length+' letters</span></div>'; h+='<div class="ed-q" style="letter-spacing:6px;">'+esc(WS.scrambled.toUpperCase())+'</div>'; if(WS.revealed>0) h+='<p style="text-align:center;color:#64748b;">Starts with: <strong>'+esc(WS.word.slice(0,WS.revealed).toUpperCase())+'</strong></p>'; h+='<input class="ed-in" id="wsIn" placeholder="type the word" onkeydown="if(event.key===\'Enter\')GCwsCheck()"><div style="display:flex;gap:8px;justify-content:center;margin-top:10px;"><button class="gcbtn pri" onclick="GCwsCheck()">Check</button><button class="gcbtn" onclick="GCwsSkip()">Skip</button></div><p class="gc-stat" id="wsMsg" style="text-align:center;margin-top:8px;"></p>'; return h; }
  window.GCwsCheck=function(){ var inp=document.getElementById('wsIn'); if(!inp) return; var v=(inp.value||'').trim().toLowerCase(); var m=document.getElementById('wsMsg'); if(v===WS.word){ WS.score++; sGood(); if(m){ m.style.color='#166534'; m.textContent='\u2714 Correct!'; } wsPick(); setTimeout(function(){ setBoard(wsBoard()); var ni=document.getElementById('wsIn'); if(ni) ni.focus(); },500); } else { sBad(); if(m){ m.style.color='#b91c1c'; m.textContent='\u2716 Not quite \u2013 try again or use a hint.'; } } };
  window.GCwsSkip=function(){ sClick(); wsPick(); setBoard(wsBoard()); var ni=document.getElementById('wsIn'); if(ni) ni.focus(); };
  HINTS.scramble=function(){ if(WS.revealed<WS.word.length-1) WS.revealed++; tone(700,0.1); var inp=document.getElementById('wsIn'); var cur=inp?inp.value:''; setBoard(wsBoard()); var ni=document.getElementById('wsIn'); if(ni){ ni.value=cur; ni.focus(); } };
  SAVERS.scramble=function(){ if(WS.score===0) return null; return { score:WS.score }; }
  RESTORERS.scramble=true;

  // ================= CAPITAL CITIES (educational, real geography) =================
  var CAP={
    beginner:[['France','Paris'],['Japan','Tokyo'],['Italy','Rome'],['Egypt','Cairo'],['Russia','Moscow'],['China','Beijing'],['Spain','Madrid'],['Germany','Berlin'],['United Kingdom','London'],['Mexico','Mexico City'],['Jamaica','Kingston'],['Greece','Athens'],['India','New Delhi'],['Cuba','Havana'],['Portugal','Lisbon']],
    intermediate:[['Canada','Ottawa'],['Australia','Canberra'],['Turkey','Ankara'],['Brazil','Bras\u00EDlia'],['Switzerland','Bern'],['Netherlands','Amsterdam'],['Norway','Oslo'],['Sweden','Stockholm'],['Kenya','Nairobi'],['Nigeria','Abuja'],['South Korea','Seoul'],['Thailand','Bangkok'],['Austria','Vienna'],['Ireland','Dublin'],['Argentina','Buenos Aires']],
    advanced:[['Kazakhstan','Astana'],['Myanmar','Naypyidaw'],['Morocco','Rabat'],['Bhutan','Thimphu'],['New Zealand','Wellington'],['Pakistan','Islamabad'],['Vietnam','Hanoi'],['Tanzania','Dodoma'],['South Africa','Pretoria'],['Belize','Belmopan'],['Bolivia','Sucre'],['Finland','Helsinki'],['Croatia','Zagreb'],['Philippines','Manila'],['Ivory Coast','Yamoussoukro']]
  };
  function capAll(){ var out=[]; ['beginner','intermediate','advanced'].forEach(function(L){ CAP[L].forEach(function(p){ out.push(p[1]); }); }); return out; }
  var CG={ score:0, country:'', capital:'', opts:[] };
  function capPick(){ var pool=CAP[LEVEL]||CAP.intermediate; var p=pool[rnd(0,pool.length-1)]; CG.country=p[0]; CG.capital=p[1]; var all=capAll(); var opts=[p[1]]; var guard=0; while(opts.length<4&&guard++<100){ var cand=all[rnd(0,all.length-1)]; if(opts.indexOf(cand)<0) opts.push(cand); } for(var i=opts.length-1;i>0;i--){ var j=rnd(0,i); var t=opts[i];opts[i]=opts[j];opts[j]=t; } CG.opts=opts; }
  STARTERS.capitals=function(saved){ if(saved){ CG.score=saved.score||0; } else { CG.score=0; } capPick(); setPanel(panelHtml('capitals', capBoard())); }
  function capBoard(){ var h='<div class="gc-bar"><span class="gc-stat">Score: '+CG.score+'</span></div>'; h+='<div class="ed-q">What is the capital of<br>'+esc(CG.country)+'?</div><div class="ed-opts">'; CG.opts.forEach(function(o,i){ h+='<div class="ed-opt" id="cg'+i+'" onclick="GCcapAns('+i+')">'+esc(o)+'</div>'; }); h+='</div><p class="gc-stat" id="cgMsg" style="text-align:center;margin-top:8px;"></p>'; return h; }
  window.GCcapAns=function(i){ var val=CG.opts[i]; var el=document.getElementById('cg'+i); var m=document.getElementById('cgMsg'); if(val===CG.capital){ CG.score++; if(el) el.classList.add('good'); sGood(); setTimeout(function(){ capPick(); setBoard(capBoard()); },500); } else { if(el) el.classList.add('bad'); sBad(); var gi=CG.opts.indexOf(CG.capital); var ge=document.getElementById('cg'+gi); if(ge) ge.classList.add('good'); if(m){ m.style.color='#b91c1c'; m.textContent='The capital of '+CG.country+' is '+CG.capital+'.'; } setTimeout(function(){ capPick(); setBoard(capBoard()); },1100); } };
  HINTS.capitals=function(){ var removed=0; for(var i=0;i<CG.opts.length&&removed<2;i++){ if(CG.opts[i]!==CG.capital){ var el=document.getElementById('cg'+i); if(el&&!el.classList.contains('bad')){ el.classList.add('bad'); el.style.pointerEvents='none'; el.style.opacity='.4'; removed++; } } } tone(700,0.1); };
  SAVERS.capitals=function(){ if(CG.score===0) return null; return { score:CG.score }; }
  RESTORERS.capitals=true;

  // ================= TYPING TEST (educational) =================
  var TY_TEXT={ beginner:['The sun is bright today.','I love to read good books.','We play games after school.','A cat sat on the warm mat.','She sings a happy song.'], intermediate:['Creators who stay consistent tend to grow the fastest.','Practice a little every day and your skills will improve.','A clear plan turns a big goal into small, easy steps.','Good lighting and clean audio make videos look professional.'], advanced:['Discipline is choosing between what you want now and what you want most in the long run.','Great storytelling combines a strong hook, genuine emotion, and a satisfying, memorable payoff.','Measuring your progress with honest metrics beats guessing about what your audience truly enjoys.'] };
  var TY={ target:'', started:false, start:0, done:false };
  STARTERS.typing=function(){ var list=TY_TEXT[LEVEL]||TY_TEXT.intermediate; TY.target=list[rnd(0,list.length-1)]; TY.started=false; TY.start=0; TY.done=false; setPanel(panelHtml('typing', tyBoard())); var ta=document.getElementById('tyIn'); if(ta) ta.focus(); }
  function tyBoard(){ var h='<div class="ed-target">'+esc(TY.target)+'</div>'; h+='<textarea class="ed-type" id="tyIn" placeholder="Start typing here\u2026" oninput="GCtyInput()"></textarea>'; h+='<div style="display:flex;gap:8px;justify-content:center;margin-top:10px;"><button class="gcbtn pri" onclick="GCtyDone()">Done</button></div><div class="gc-stat" id="tyMsg" style="text-align:center;margin-top:10px;"></div>'; return h; }
  window.GCtyInput=function(){ if(!TY.started){ TY.started=true; TY.start=Date.now(); } };
  window.GCtyDone=function(){ if(TY.done) return; var ta=document.getElementById('tyIn'); if(!ta) return; var typed=ta.value||''; if(!TY.started||!typed){ toast('Start typing first.'); return; } var secs=Math.max(1,(Date.now()-TY.start)/1000); var words=TY.target.trim().split(/\s+/).length; var wpm=Math.round((words/secs)*60); var tgt=TY.target, correct=0; for(var i=0;i<Math.min(typed.length,tgt.length);i++){ if(typed[i]===tgt[i]) correct++; } var acc=Math.round((correct/tgt.length)*100); TY.done=true; sGood(); var m=document.getElementById('tyMsg'); if(m){ m.style.color='#166534'; m.innerHTML='\u2328\uFE0F <strong>'+wpm+' WPM</strong> \u2022 Accuracy <strong>'+acc+'%</strong> \u2022 Time '+secs.toFixed(1)+'s<br><small style="color:#64748b;">Press New game for another sentence.</small>'; } };

  // ---- Audit ----
  window.auditGameCenter=function(){ var issues=[],ok=[]; var saveLevel=LEVEL; LEVEL='intermediate';
    if(mmPairs()!==8) issues.push('Memory pair count wrong'); var mc=mnCfg(); if(!(mc.n>0&&mc.m>0&&mc.m<mc.n*mc.n)) issues.push('Mines config invalid');
    for(var i=0;i<30;i++){ maGen(); if(MA.opts.length!==4) issues.push('Math options != 4'); if(MA.opts.indexOf(MA.ans)<0) issues.push('Math answer missing from options'); }
    for(var i=0;i<10;i++){ wsPick(); if(!WS.word||WS.scrambled.length!==WS.word.length) issues.push('Scramble length mismatch'); }
    for(var i=0;i<20;i++){ capPick(); if(CG.opts.length!==4) issues.push('Capitals options != 4'); if(CG.opts.indexOf(CG.capital)<0) issues.push('Capitals answer missing'); }
    LEVEL=saveLevel;
    ok.push('Games: '+Object.keys(GAMES).length+' (5 arcade + 4 educational)');
    ok.push('Levels: '+LEVELS.join(' / '));
    ok.push('Themes: '+Object.keys(THEMES).length+' \u2022 Backgrounds: '+Object.keys(BGS).length);
    ok.push('Settings: tips/sound/save-on-exit; save & resume supported');
    var rep={ pass:issues.length===0, issues:issues, info:ok }; console.log('[auditGameCenter]',rep); return rep; };
  window.renderGames=renderGames;

  function boot(){ injectCSS(); if(R.registerPages) R.registerPages(PAGES); if(R.ensureContainers) R.ensureContainers(PAGES); if(R.hookNavigate) R.hookNavigate({ 'games':renderGames }); if(R.addNavLink) R.addNavLink('studio','games','\uD83C\uDFAE Games');
    if(!window.__gcNavHook && typeof window.navigate==='function'){ window.__gcNavHook=true; var orig=window.navigate; window.navigate=function(p){ try{ if(CUR&&p!=='games'){ if(SET.saveOnExit&&typeof SAVERS[CUR]==='function') GCsaveGame(true); if(SK.timer){ clearInterval(SK.timer); SK.timer=null; } if(MA.timer){ clearInterval(MA.timer); MA.timer=null; } } }catch(e){} return orig.apply(this,arguments); }; } }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
