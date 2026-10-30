/* ==========================================================================
 * Creator Hub – Game Center MASTER UPGRADE (chcn-game-upgrade.js)
 * --------------------------------------------------------------------------
 * v57 upgrade: chess AI anti-repetition, Garden Guardians expansion,
 * racing vehicle/track/missions, cross-game profile, floating tools manager,
 * AI anti-repetition engine, game guides. Loaded AFTER game-center-expansion.js.
 * Patches existing modules directly on the CHCNGameModules global which is
 * the same reference as the IIFE-closure MODULES.
 * ========================================================================== */
(function (global) {
  'use strict';
  if (global.__gcxUpgrade) return; global.__gcxUpgrade = true;

  var MOD = global.CHCNGameModules;
  if (!MOD) { console.warn('[v57] CHCNGameModules not found – upgrade skipped'); return; }

  var R = global.CHCNreg || {};
  var LS = {
    get: function (k, d) { try { var v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };

  // Helper to get ENV (may not be available at load time)
  function getENV() { return global.GCXEnv || { sfx: function(){}, toast: function(){}, setScore: function(){}, setInfo: function(){}, gameOver: function(){}, vibrate: function(){}, diffNum: function(k){ return 1; }, addPad: function(){}, best: function(){ return 0; }, setBest: function(){}, gset: function(){ return {}; }, LS: LS, esc: function(s){ return s; } }; }

  // =====================================================================
  //  SECTION 1: AI ANTI-REPETITION ENGINE (shared across all AI games)
  // =====================================================================
  var CHCNAntiRepeat = (function () {
    var histories = {};
    var MAX_HIST = 24;
        var LOOP_WINDOW = 6;

    function record(gameKey, move) {
      if (!histories[gameKey]) histories[gameKey] = [];
      var h = histories[gameKey];
      h.push({ f: move.f, t: move.t, piece: move.p || move.piece || '', cap: move.cap || '.' });
      if (h.length > MAX_HIST) h.splice(0, h.length - MAX_HIST);
    }

        function detectLoop(gameKey) {
      var h = histories[gameKey] || [];
      if (h.length < 4) return false;
      var recent = h.slice(-Math.min(LOOP_WINDOW, h.length));
      var counts = {};
      for (var i = 0; i < recent.length; i++) {
        var key = String(recent[i].f) + '->' + String(recent[i].t);
        counts[key] = (counts[key] || 0) + 1;
        if (counts[key] >= 3) return true;
      }
      // AB-AB pattern: last 4 moves alternate between two squares
      if (recent.length >= 4) {
        var p = recent.slice(-4);
        if (String(p[0].f) === String(p[2].f) && String(p[0].t) === String(p[2].t) && String(p[1].f) === String(p[3].f) && String(p[1].t) === String(p[3].t)) return true;
      }
      return false;
    }

    function isRepetitive(gameKey, move) {
      if (!detectLoop(gameKey)) return false;
      var h = histories[gameKey] || [];
        var recent = h.slice(-Math.min(LOOP_WINDOW, h.length));
      for (var i = 0; i < recent.length; i++) {
        if (String(recent[i].f) === String(move.f) && String(recent[i].t) === String(move.t)) return true;
      }
      return false;
    }

    function penalty(gameKey, move) {
      return isRepetitive(gameKey, move) ? -80 : 0;
    }

    function clear(gameKey) { delete histories[gameKey]; }

    return { record: record, detectLoop: detectLoop, isRepetitive: isRepetitive, penalty: penalty, clear: clear };
  })();
  global.CHCNAntiRepeat = CHCNAntiRepeat;

  // =====================================================================
  //  SECTION 2: CHESS AI – anti-repetition + position evaluation upgrade
  // =====================================================================
  MOD.chess = { kind: 'dom', help: 'Full chess: legal moves, check, checkmate, stalemate, castling, en passant and promotion. Play a friend (2P) or a thinking AI (difficulty = search depth). Anti-repetition prevents rook loops. Click a piece, then its destination.', make: function (G, root) {
    var GLY = { P:'\u2659',N:'\u2658',B:'\u2657',R:'\u2656',Q:'\u2655',K:'\u2654',p:'\u265F',n:'\u265E',b:'\u265D',r:'\u265C',q:'\u265B',k:'\u265A' };
    var VAL = { p:100,n:320,b:330,r:500,q:900,k:20000 };
    var PST = {
      P:[0,0,0,0,0,0,0,0,50,50,50,50,50,50,50,50,10,10,20,30,30,20,10,10,5,5,10,25,25,10,5,5,0,0,0,20,20,0,0,0,5,-5,-10,0,0,-10,-5,5,5,10,10,-20,-20,10,10,5,0,0,0,0,0,0,0,0],
      N:[-50,-40,-30,-30,-30,-30,-40,-50,-40,-20,0,0,0,0,-20,-40,-30,0,10,15,15,10,0,-30,-30,5,15,20,20,15,5,-30,-30,0,15,20,20,15,0,-30,-30,5,10,15,15,10,5,-30,-40,-20,0,5,5,0,-20,-40,-50,-40,-30,-30,-30,-30,-40,-50],
      B:[-20,-10,-10,-10,-10,-10,-10,-20,-10,0,0,0,0,0,0,-10,-10,0,5,10,10,5,0,-10,-10,5,5,10,10,5,5,-10,-10,0,10,10,10,10,0,-10,-10,10,10,10,10,10,10,-10,-10,5,0,0,0,0,5,-10,-20,-10,-10,-10,-10,-10,-10,-20],
      R:[0,0,0,0,0,0,0,0,5,10,10,10,10,10,10,5,-5,0,0,0,0,0,0,-5,-5,0,0,0,0,0,0,-5,-5,0,0,0,0,0,0,-5,-5,0,0,0,0,0,0,-5,-5,0,0,0,0,0,0,-5,0,0,0,5,5,0,0,0],
      Q:[-20,-10,-10,-5,-5,-10,-10,-20,-10,0,0,0,0,0,0,-10,-10,0,5,5,5,5,0,-10,-5,0,5,5,5,5,0,-5,0,0,5,5,5,5,0,-5,-10,5,5,5,5,5,0,-10,-10,0,5,0,0,0,0,-10,-20,-10,-10,-5,-5,-10,-10,-20],
      K:[-30,-40,-40,-50,-50,-40,-40,-30,-30,-40,-40,-50,-50,-40,-40,-30,-30,-40,-40,-50,-50,-40,-40,-30,-30,-40,-40,-50,-50,-40,-40,-30,-20,-30,-30,-40,-40,-30,-30,-20,-10,-20,-20,-20,-20,-20,-20,-10,20,20,0,0,0,0,20,20,20,30,10,0,0,10,30,20]
    };
    function start(){return 'rnbqkbnr'.split('').concat('pppppppp'.split('')).concat('........'.split('').repeat?[]:['.','.','.','.','.','.','.','.','.','.','.','.','.','.','.','.','.','.','.','.','.','.','.','.','.'].slice(0,32)).concat('PPPPPPPP'.split('')).concat('RNBQKBNR'.split(''));}
    // Better start function
    function startBoard() { var b=[]; b.push('r','n','b','q','k','b','n','r'); for(var i=0;i<8;i++) b.push('p'); for(var j=0;j<32;j++) b.push('.'); for(var k=0;k<8;k++) b.push('P'); b.push('R','N','B','Q','K','B','N','R'); return b; }
    var ST = { b: startBoard(), turn: 'w', cr: { K:true, Q:true, k:true, q:true }, ep: -1, hist: [], vsAI: true, aiHistory: [] };
    function isW(p){return p!=='.'&&p===p.toUpperCase();}
    function side(p){return p==='.'?null:(isW(p)?'w':'b');}
    function onB(r,c){return r>=0&&r<8&&c>=0&&c<8;}
    function idx(r,c){return r*8+c;}
    function kingSq(b,s){var t=s==='w'?'K':'k';for(var i=0;i<64;i++)if(b[i]===t)return i;return -1;}
    function attacked(b,sq,by){
      var r=(sq/8)|0,c=sq%8,pd=by==='w'?1:-1,pr=r+pd;
      if(onB(pr,c-1)&&b[idx(pr,c-1)]===(by==='w'?'P':'p'))return true;
      if(onB(pr,c+1)&&b[idx(pr,c+1)]===(by==='w'?'P':'p'))return true;
      var N=[[1,2],[2,1],[-1,2],[-2,1],[1,-2],[2,-1],[-1,-2],[-2,-1]];
      for(var i=0;i<8;i++){var nr=r+N[i][0],nc=c+N[i][1];if(onB(nr,nc)&&b[idx(nr,nc)]===(by==='w'?'N':'n'))return true;}
      var dB=[[1,1],[1,-1],[-1,1],[-1,-1]],dR=[[1,0],[-1,0],[0,1],[0,-1]];
      function ray(ds,pieces){for(var d=0;d<ds.length;d++){var nr=r+ds[d][0],nc=c+ds[d][1];while(onB(nr,nc)){var q=b[idx(nr,nc)];if(q!=='.'){if(side(q)===by&&pieces.indexOf(q.toUpperCase())>=0)return true;break;}nr+=ds[d][0];nc+=ds[d][1];}}return false;}
      if(ray(dB,['B','Q']))return true;if(ray(dR,['R','Q']))return true;
      var K=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
      for(var j=0;j<8;j++){var kr=r+K[j][0],kc=c+K[j][1];if(onB(kr,kc)&&b[idx(kr,kc)]===(by==='w'?'K':'k'))return true;}
      return false;
    }
    function inCheck(b,s){return attacked(b,kingSq(b,s),s==='w'?'b':'w');}
    function pseudo(s){
      var b=ST.b,mv=[];
      for(var i=0;i<64;i++){var p=b[i];if(p==='.'||side(p)!==s)continue;var r=(i/8)|0,c=i%8,up=p.toUpperCase();
        function add(tr,tc,opt){if(!onB(tr,tc))return false;var t=b[idx(tr,tc)];if(t!=='.'&&side(t)===s)return false;var m={f:i,t:idx(tr,tc),p:p,cap:t};if(opt)for(var k in opt)m[k]=opt[k];mv.push(m);return t==='.';}
        if(up==='P'){var dir=s==='w'?-1:1,sr=s==='w'?6:1;
          if(onB(r+dir,c)&&b[idx(r+dir,c)]==='.'){if(r+dir===(s==='w'?0:7)){['Q','R','B','N'].forEach(function(pp){mv.push({f:i,t:idx(r+dir,c),p:p,cap:'.',promo:s==='w'?pp:pp.toLowerCase()});});}else{mv.push({f:i,t:idx(r+dir,c),p:p,cap:'.'});if(r===sr&&b[idx(r+2*dir,c)]==='.')mv.push({f:i,t:idx(r+2*dir,c),p:p,cap:'.',dbl:true});}}
          [[dir,-1],[dir,1]].forEach(function(dd){var tr=r+dd[0],tc=c+dd[1];if(!onB(tr,tc))return;var t=b[idx(tr,tc)];if(t!=='.'&&side(t)!==s){if(tr===(s==='w'?0:7)){['Q','R','B','N'].forEach(function(pp){mv.push({f:i,t:idx(tr,tc),p:p,cap:t,promo:s==='w'?pp:pp.toLowerCase()});});}else mv.push({f:i,t:idx(tr,tc),p:p,cap:t});}else if(idx(tr,tc)===ST.ep)mv.push({f:i,t:idx(tr,tc),p:p,cap:s==='w'?'p':'P',epc:true});});
        }else if(up==='N'){[[1,2],[2,1],[-1,2],[-2,1],[1,-2],[2,-1],[-1,-2],[-2,-1]].forEach(function(d){add(r+d[0],c+d[1]);});}
        else if(up==='K'){[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]].forEach(function(d){add(r+d[0],c+d[1]);});
          if(!inCheck(b,s)){var rr=s==='w'?7:0;var ks=s==='w'?'K':'k',qs=s==='w'?'Q':'q';
            if(ST.cr[ks]&&b[idx(rr,5)]==='.'&&b[idx(rr,6)]==='.'&&b[idx(rr,7)]===(s==='w'?'R':'r')&&!attacked(b,idx(rr,5),s==='w'?'b':'w')&&!attacked(b,idx(rr,6),s==='w'?'b':'w'))mv.push({f:i,t:idx(rr,6),p:p,cap:'.',castle:'k'});
            if(ST.cr[qs]&&b[idx(rr,3)]==='.'&&b[idx(rr,2)]==='.'&&b[idx(rr,1)]==='.'&&b[idx(rr,0)]===(s==='w'?'R':'r')&&!attacked(b,idx(rr,3),s==='w'?'b':'w')&&!attacked(b,idx(rr,2),s==='w'?'b':'w'))mv.push({f:i,t:idx(rr,2),p:p,cap:'.',castle:'q'});
          }
        }else{var ds=up==='B'?[[1,1],[1,-1],[-1,1],[-1,-1]]:up==='R'?[[1,0],[-1,0],[0,1],[0,-1]]:[[1,1],[1,-1],[-1,1],[-1,-1],[1,0],[-1,0],[0,1],[0,-1]];
          ds.forEach(function(d){var nr=r+d[0],nc=c+d[1];while(add(nr,nc)){nr+=d[0];nc+=d[1];}});}
      }
      return mv;
    }
    function apply(m){
      var b=ST.b,fr=(m.f/8)|0;
      var undo={m:m,cr:{K:ST.cr.K,Q:ST.cr.Q,k:ST.cr.k,q:ST.cr.q},ep:ST.ep,extra:null};
      b[m.t]=m.promo?m.promo:m.p;b[m.f]='.';
      if(m.epc){var cs=idx(fr,m.t%8);undo.extra={sq:cs,pc:b[cs]};b[cs]='.';}
      if(m.castle==='k'){undo.extra={rookFrom:idx(fr,7),rookTo:idx(fr,5)};b[idx(fr,5)]=b[idx(fr,7)];b[idx(fr,7)]='.';}
      if(m.castle==='q'){undo.extra={rookFrom:idx(fr,0),rookTo:idx(fr,3)};b[idx(fr,3)]=b[idx(fr,0)];b[idx(fr,0)]='.';}
      if(m.p==='K'){ST.cr.K=ST.cr.Q=false;}if(m.p==='k'){ST.cr.k=ST.cr.q=false;}
      if(m.f===63||m.t===63)ST.cr.K=false;if(m.f===56||m.t===56)ST.cr.Q=false;
      if(m.f===7||m.t===7)ST.cr.k=false;if(m.f===0||m.t===0)ST.cr.q=false;
      ST.ep=m.dbl?((m.f+m.t)/2):-1;
      ST.turn=ST.turn==='w'?'b':'w';ST.hist.push(undo);
    }
    function undoMove(){
      var u=ST.hist.pop();if(!u)return;var b=ST.b,m=u.m;
      b[m.f]=m.p;b[m.t]='.';
      if(m.epc){b[u.extra.sq]=u.extra.pc;}else b[m.t]=m.cap;
      if(m.castle==='k'||m.castle==='q'){b[u.extra.rookFrom]=b[u.extra.rookTo];b[u.extra.rookTo]='.';}
      ST.cr=u.cr;ST.ep=u.ep;ST.turn=ST.turn==='w'?'b':'w';
    }
    function legal(s){var out=[];pseudo(s).forEach(function(m){apply(m);if(!inCheck(ST.b,s))out.push(m);undoMove();});return out;}

    function evalBoard(){
      var sc=0;
      for(var i=0;i<64;i++){var p=ST.b[i];if(p==='.')continue;var v=VAL[p.toLowerCase()];var up=p.toUpperCase();var pst=PST[up];var pv=0;if(pst){pv=isW(p)?pst[i]:pst[63-i];}sc+=isW(p)?(v+pv):-(v+pv);}
      return sc;
    }

    function negamax(depth,a,bb,s){
      if(depth===0){var e=evalBoard();return s==='w'?e:-e;}
      var ms=legal(s);if(!ms.length){return inCheck(ST.b,s)?-99999+(3-depth):0;}
      var bestv=-1e9;
      for(var i=0;i<ms.length;i++){apply(ms[i]);var v=-negamax(depth-1,-bb,-a,s==='w'?'b':'w');undoMove();if(v>bestv)bestv=v;if(v>a)a=v;if(a>=bb)break;}
      return bestv;
    }

    // === ANTI-REPETITION AI MOVE ===
    function aiMove(){
      var ENV=getENV();
      var s=ST.turn,ms=legal(s);if(!ms.length)return null;
      var d=ENV.diffNum('chess');
      var depth=[1,2,3][d],best=null,bv=-1e9;
      ms.sort(function(x,y){return(y.cap!=='.'?1:0)-(x.cap!=='.'?1:0);});
      for(var i=0;i<ms.length;i++){
        apply(ms[i]);
        var v=-negamax(depth-1,-1e9,1e9,s==='w'?'b':'w');
        undoMove();
        // Anti-repetition: penalize moves that repeat recent patterns
        var moveKey=ms[i].f+'->'+ms[i].t;
        var recentAI=ST.aiHistory.slice(-8);
        var repCount=0;
        for(var j=0;j<recentAI.length;j++){if(recentAI[j]===moveKey)repCount++;}
        if(repCount>=2)v-=60*repCount;
        // Penalize moving back to previous square (rook shuffle)
        if(ST.aiHistory.length>0){
          var lastParts=ST.aiHistory[ST.aiHistory.length-1].split('->');
          if(String(ms[i].f)===lastParts[1]&&String(ms[i].t)===lastParts[0])v-=100;
        }
        // Additional: penalize if this exact move appears 3+ times in last 10 AI moves
        var fullHist=ST.aiHistory.slice(-10);
        var fullCount=0;
        for(var fc=0;fc<fullHist.length;fc++){if(fullHist[fc]===moveKey)fullCount++;}
        if(fullCount>=3)v-=150;
        // Easy randomness
        if(d===0)v+=(Math.random()*50-25);
        if(v>bv){bv=v;best=ms[i];}
      }
      if(best){
        ST.aiHistory.push(best.f+'->'+best.t);
        if(ST.aiHistory.length>20)ST.aiHistory.shift();
        CHCNAntiRepeat.record('chess',{f:best.f,t:best.t,p:best.p,cap:best.cap});
      }
      return best;
    }

    var sel=-1,legalCache=[],msg='';
    function status(){
      var s=ST.turn,ms=legal(s),chk=inCheck(ST.b,s);
      if(!ms.length)return chk?((s==='w'?'Black':'White')+' wins by checkmate'):'Stalemate \u2013 draw';
      return(s==='w'?'White':'Black')+' to move'+(chk?' \u2013 check!':'');
    }
    function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
    function render(){
      var light='#f0d9b5',dark='#b58863';
      var h='<div style="max-width:400px;margin:0 auto;">';
      h+='<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:8px;">'+
        '<button type="button" class="gcx-btn" id="chMode">Mode: '+(ST.vsAI?'vs AI':'2 Players')+'</button>'+
        '<button type="button" class="gcx-btn" id="chUndo">\u21A9 Undo</button>'+
        '<button type="button" class="gcx-btn" id="chNew">\u21BB New</button></div>';
      h+='<div id="chMsg" style="font-weight:800;color:#4c1d95;margin-bottom:6px;">'+esc(msg||status())+'</div>';
      h+='<div style="display:grid;grid-template-columns:repeat(8,1fr);width:100%;max-width:380px;margin:0 auto;aspect-ratio:1;border:3px solid #4c1d95;border-radius:6px;overflow:hidden;">';
      for(var r=0;r<8;r++)for(var c=0;c<8;c++){var i=idx(r,c);var base=(r+c)%2?dark:light;
        var isSel=i===sel;var isTgt=legalCache.some(function(m){return m.t===i;});
        var bg=isSel?'#f6e05e':(isTgt?'#86efac':base);var p=ST.b[i];
        h+='<div data-i="'+i+'" style="display:flex;align-items:center;justify-content:center;background:'+bg+';font-size:min(8vw,30px);cursor:pointer;user-select:none;line-height:1;color:'+(isW(p)?'#fafafa':'#111')+';text-shadow:0 1px 1px rgba(0,0,0,.35);">'+(p==='.'?'':GLY[p])+'</div>';
      }
      h+='</div></div>';
      root.innerHTML=h;
      root.querySelector('#chMode').onclick=function(){ST.vsAI=!ST.vsAI;ST.aiHistory=[];sel=-1;legalCache=[];msg='';render();};
      root.querySelector('#chUndo').onclick=function(){if(ST.hist.length){undoMove();if(ST.vsAI&&ST.hist.length){undoMove();if(ST.aiHistory.length)ST.aiHistory.pop();}sel=-1;legalCache=[];msg='';render();}};
      root.querySelector('#chNew').onclick=function(){ST.b=startBoard();ST.turn='w';ST.cr={K:true,Q:true,k:true,q:true};ST.ep=-1;ST.hist=[];ST.aiHistory=[];sel=-1;legalCache=[];msg='';CHCNAntiRepeat.clear('chess');render();};
      Array.prototype.forEach.call(root.querySelectorAll('[data-i]'),function(cell){cell.onclick=function(){onCell(parseInt(cell.getAttribute('data-i'),10));};});
    }
    function onCell(i){
      var ms=legal(ST.turn);if(!ms.length)return;
      if(ST.vsAI&&ST.turn==='b')return;
      var hit=legalCache.filter(function(m){return m.t===i;})[0];
      if(sel>=0&&hit){
        if(hit.promo){var pc=prompt('Promote to (Q, R, B, N)?','Q');if(pc){pc=pc.toUpperCase();if('QRBN'.indexOf(pc)>=0){var want=ST.turn==='w'?pc:pc.toLowerCase();hit=legalCache.filter(function(m){return m.t===i&&m.promo===want;})[0]||hit;}}}
        apply(hit);var ENV=getENV();ENV.sfx(hit.cap!=='.'?300:520,0.07,'triangle');sel=-1;legalCache=[];render();
        var st=status();if(/wins|Stalemate/.test(st)){msg=st;render();ENV.sfx(880,0.2,'sine');return;}
        if(ST.vsAI&&ST.turn==='b'){msg='AI thinking\u2026';render();setTimeout(function(){var am=aiMove();if(am){apply(am);ENV.sfx(am.cap!=='.'?280:460,0.07,'square');}msg='';render();var s2=status();if(/wins|Stalemate/.test(s2)){msg=s2;render();}},140);}
        return;
      }
      if(ST.b[i]!=='.'&&side(ST.b[i])===ST.turn){sel=i;legalCache=ms.filter(function(m){return m.f===i;});}else{sel=-1;legalCache=[];}
      render();
    }
    render();
    return{update:function(){},render:function(){},destroy:function(){}};
  }};

  // =====================================================================
  //  SECTION 3: GARDEN GUARDIANS – major expansion
  // =====================================================================
  MOD.garden = { kind: 'raf', w: 420, h: 580, help: 'Lane defence with 7 plant types, 9 enemy types, boss waves, upgrades, save/restore. Survive 20 waves to win! Tap a plant in the top bar, then tap a tile. Tap existing plants to upgrade.', make: function (G) {
    var ctx=G.ctx,W=G.w,H=G.h;
    var ENV=getENV();
    var d=ENV.diffNum(G.key);
    var COLS=9,ROWS=5,padT=74,gx=6,gy=padT,gw=W-12,gh=H-padT-6;
    var cw=gw/COLS,ch=gh/ROWS;

    var PLANTS=[
      {id:'sprout',cost:50,hp:60,col:'#f59e0b',label:'Sprout',rate:6,energyAmt:30},
      {id:'shooter',cost:100,hp:80,col:'#16a34a',label:'Shooter',rate:1.4,dmg:20},
      {id:'wall',cost:50,hp:300,col:'#6b7280',label:'Wall'},
      {id:'producer',cost:75,hp:50,col:'#eab308',label:'Solar',rate:4,energyAmt:50},
      {id:'ranged',cost:150,hp:70,col:'#0ea5e9',label:'Frost',rate:2.0,dmg:15,slow:0.5},
      {id:'splash',cost:175,hp:65,col:'#ef4444',label:'Bomb',rate:3.0,dmg:30,splash:1},
      {id:'special',cost:200,hp:90,col:'#8b5cf6',label:'Tesla',rate:2.5,dmg:25,chain:2}
    ];

    var ENEMIES=[
      {id:'basic',hp:40,sp:14,col:'#7f1d1d'},
      {id:'fast',hp:25,sp:28,col:'#dc2626'},
      {id:'armored',hp:100,sp:10,col:'#1e3a5f'},
      {id:'ranged',hp:50,sp:12,col:'#9333ea',range:true,rate:2.0,dmg:15},
      {id:'tank',hp:200,sp:8,col:'#14532d'},
      {id:'jumper',hp:35,sp:18,col:'#06b6d4',jump:true},
      {id:'shield',hp:120,sp:11,col:'#78350f',shieldHP:60},
      {id:'healer',hp:45,sp:10,col:'#10b981',healRate:3.0,healAmt:10},
      {id:'boss',hp:500,sp:6,col:'#7c2d12',boss:true}
    ];

    var SAVE_KEY='chcn_garden_save';
    function loadSave(){return LS.get(SAVE_KEY,null);}
    function writeSave(){LS.set(SAVE_KEY,{energy:S.energy,plants:S.plants.map(function(p){return{c:p.c,r:p.r,type:p.type,hp:p.hp,max:p.max,upgrade:p.upgrade||0};}),wave:S.wave,kills:S.kills});}
    function clearSave(){try{localStorage.removeItem(SAVE_KEY);}catch(e){}}

    var S={energy:100,sel:'shooter',plants:[],foes:[],shots:[],kills:0,wave:1,spawnT:4,pulse:0,waveLeft:8+d*2,waveTotal:8+d*2,bossWave:false,bossActive:false,victory:false};
    var saved=loadSave();
    if(saved&&saved.wave>1){S.energy=saved.energy;S.wave=saved.wave;S.kills=saved.kills;S.plants=saved.plants.map(function(p){return{c:p.c,r:p.r,type:p.type,hp:p.hp,max:p.max,upgrade:p.upgrade||0,t:Math.random()};});S.waveLeft=0;S.waveTotal=0;clearSave();}

    function cellOf(c,r){return S.plants.filter(function(p){return p.c===c&&p.r===r;})[0];}

    function spawnFoe(){
      var r=Math.floor(Math.random()*ROWS);
      var pool=[0];
      if(S.wave>=2)pool.push(1);if(S.wave>=3)pool.push(2);if(S.wave>=5)pool.push(3);
      if(S.wave>=7)pool.push(4);if(S.wave>=8)pool.push(5);if(S.wave>=10)pool.push(6);if(S.wave>=12)pool.push(7);
      var pick=pool[Math.floor(Math.random()*pool.length)];
      var E=ENEMIES[pick];
      var hm=1+S.wave*0.2+d*0.3,sm=1+d*0.15;
      var foe={x:W-10,r:r,hp:Math.floor(E.hp*hm),max:Math.floor(E.hp*hm),sp:Math.floor(E.sp*sm),chew:0,type:E.id,col:E.col,shieldHP:E.shieldHP?Math.floor(E.shieldHP*hm):0,t:Math.random()};
      if(E.range){foe.range=true;foe.rate=E.rate;foe.dmg=E.dmg;foe.shootT=E.rate;}
      if(E.jump){foe.jump=true;foe.jumpT=0;}
      if(E.healRate){foe.healRate=E.healRate;foe.healAmt=E.healAmt;foe.healT=0;}
      S.foes.push(foe);S.waveLeft--;
    }

    function spawnBoss(){
      var r=Math.floor(Math.random()*ROWS);
      var E=ENEMIES[8];var hm=1+S.wave*0.3+d*0.5;
      S.foes.push({x:W-10,r:r,hp:Math.floor(E.hp*hm),max:Math.floor(E.hp*hm),sp:E.sp+d*2,chew:0,type:'boss',col:E.col,boss:true,shieldHP:0,t:0});
      S.bossActive=true;
    }

    return{
      onPointer:function(x,y,t){
        if(t!=='down')return;
        if(y<padT){var i=Math.floor(x/(W/PLANTS.length));if(PLANTS[i]){S.sel=PLANTS[i].id;ENV.sfx(600,0.05);}return;}
        var c=Math.floor((x-gx)/cw),r=Math.floor((y-gy)/ch);
        if(c<0||c>=COLS||r<0||r>=ROWS)return;
        var existing=cellOf(c,r);
        if(existing){
          var T=PLANTS.filter(function(q){return q.id===existing.type;})[0];
          var upgCost=Math.floor(T.cost*(1+(existing.upgrade||0))*0.6);
          if(S.energy>=upgCost&&(existing.upgrade||0)<3){S.energy-=upgCost;existing.upgrade=(existing.upgrade||0)+1;existing.max=T.hp*(1+existing.upgrade*0.3);existing.hp=Math.min(existing.hp+T.hp*0.5,existing.max);ENV.sfx(760,0.08);}
          else ENV.toast('Need '+upgCost+' energy / max 3 upgrades');
          return;
        }
        var T=PLANTS.filter(function(q){return q.id===S.sel;})[0];
        if(!T)return;
        if(S.energy<T.cost){ENV.toast('Not enough energy');return;}
        S.energy-=T.cost;S.plants.push({c:c,r:r,type:T.id,hp:T.hp,max:T.hp,t:Math.random(),upgrade:0});ENV.sfx(760,0.08);
      },
      update:function(dt){
        if(S.victory)return;
        S.pulse+=dt;if(S.pulse>=4){S.pulse=0;S.energy+=20;}
        S.plants.forEach(function(p){
          var T=PLANTS.filter(function(q){return q.id===p.type;})[0];var upg=p.upgrade||0;p.t+=dt;
          if(T.energyAmt&&p.t>=(T.rate-upg*0.3)){p.t=0;S.energy+=T.energyAmt+upg*5;ENV.sfx(900,0.05,'sine');}
          if(T.dmg&&p.t>=(T.rate-upg*0.2)){
            var tgt=S.foes.some(function(f){return f.r===p.r&&f.x>gx+p.c*cw;});
            if(tgt){p.t=0;var dm=1+upg*0.2;
              S.shots.push({x:gx+p.c*cw+cw*0.7,y:gy+p.r*ch+ch/2,r:p.r,dmg:Math.floor(T.dmg*dm),slow:T.slow||0,splash:T.splash||0,chain:T.chain||0,col:T.col});
              ENV.sfx(520,0.04,'triangle');}
          }
        });
        for(var i=S.shots.length-1;i>=0;i--){var s=S.shots[i];s.x+=320*dt;if(s.x>W){S.shots.splice(i,1);continue;}
          for(var k=0;k<S.foes.length;k++){var f=S.foes[k];
            if(f.r===s.r&&Math.abs(f.x-s.x)<18){
              var dmg=s.dmg;if(f.shieldHP>0){var ab=Math.min(f.shieldHP,dmg);f.shieldHP-=ab;dmg-=ab;}
              f.hp-=dmg;if(s.slow&&f.sp>5)f.sp=Math.max(5,f.sp*s.slow);
              if(s.splash){for(var si=0;si<S.foes.length;si++){if(si!==k&&S.foes[si].r===f.r&&Math.abs(S.foes[si].x-f.x)<cw*1.5)S.foes[si].hp-=Math.floor(s.dmg*0.5);}}
              if(s.chain>0){var chained=0;for(var ci=0;ci<S.foes.length&&chained<s.chain;ci++){if(ci!==k&&S.foes[ci].r===f.r&&Math.abs(S.foes[ci].x-f.x)<cw*3){S.foes[ci].hp-=Math.floor(s.dmg*0.6);chained++;}}}
              S.shots.splice(i,1);break;}
          }
        }
        for(var j=S.foes.length-1;j>=0;j--){
          var fo=S.foes[j];
          if(fo.hp<=0){S.foes.splice(j,1);S.kills++;S.energy+=5;ENV.setScore(S.kills);ENV.sfx(300,0.1,'square');if(fo.boss)S.bossActive=false;continue;}
          if(fo.range){fo.shootT-=dt;if(fo.shootT<=0){fo.shootT=fo.rate;var tgt=null,minD=999;S.plants.forEach(function(p){if(p.r===fo.r&&fo.x>gx+p.c*cw){var dist=fo.x-(gx+p.c*cw);if(dist<minD){minD=dist;tgt=p;}}});if(tgt){tgt.hp-=fo.dmg;if(tgt.hp<=0)S.plants.splice(S.plants.indexOf(tgt),1);}}}
          if(fo.healRate){fo.healT-=dt;if(fo.healT<=0){fo.healT=fo.healRate;S.foes.forEach(function(o){if(o!==fo&&Math.abs(o.x-fo.x)<cw*2&&o.r===fo.r)o.hp=Math.min(o.max,o.hp+fo.healAmt);});}}
          if(fo.jump){fo.jumpT-=dt;if(fo.jumpT<=0&&fo.x>gx+cw*2){fo.jumpT=6;var fp=null;S.plants.forEach(function(p){if(p.r===fo.r&&fo.x>gx+p.c*cw+cw){if(!fp||p.c>fp.c)fp=p;}});if(fp)fo.x=gx+(fp.c-1)*cw;}}
          var cc=Math.floor((fo.x-gx)/cw);var block=cc>=0&&cc<COLS?cellOf(cc,fo.r):null;
          if(block){fo.chew+=dt;if(fo.chew>=0.5){fo.chew=0;block.hp-=15+(fo.boss?20:0);if(block.hp<=0)S.plants.splice(S.plants.indexOf(block),1);}}
          else fo.x-=fo.sp*dt;
          if(fo.x<gx){writeSave();ENV.gameOver('Garden overrun!','Guardians defeated \u2022 '+S.kills+' stopped \u2022 Wave '+S.wave);return;}
        }
        S.spawnT-=dt;
        if(S.waveLeft>0&&S.spawnT<=0){spawnFoe();S.spawnT=Math.max(0.5,2.0-d*0.3-S.wave*0.06);}
        if(S.waveLeft<=0&&S.foes.length===0&&!S.bossActive){
          if(S.wave%5===0&&!S.bossWave){S.bossWave=true;ENV.toast('BOSS WAVE '+S.wave+'!');spawnBoss();S.waveLeft=3+d;}
          else if(S.wave>=20){S.victory=true;ENV.gameOver('Victory!','Survived 20 waves! '+S.kills+' enemies defeated');clearSave();return;}
          else{S.wave++;S.bossWave=false;S.waveLeft=8+d*2+S.wave*2;S.waveTotal=S.waveLeft;S.spawnT=4;S.energy+=40+S.wave*5;ENV.toast('Wave '+S.wave);}
        }
        if(S.waveLeft<=0&&S.foes.length===0)writeSave();
        ENV.setInfo('\u26A1'+S.energy+'  Wave '+S.wave+'/20'+(S.bossActive?' BOSS!':''));
      },
      render:function(){
        ctx.fillStyle='#0b2e14';ctx.fillRect(0,0,W,H);
        var pw=W/PLANTS.length;
        PLANTS.forEach(function(t,i){
          ctx.fillStyle=S.sel===t.id?'#14532d':'#052e16';ctx.fillRect(i*pw,0,pw-2,padT-6);
          ctx.fillStyle=t.col;ctx.beginPath();ctx.arc(i*pw+14,padT/2-2,9,0,7);ctx.fill();
          ctx.fillStyle=S.energy>=t.cost?'#e5e7eb':'#9ca3af';ctx.font='bold 10px sans-serif';ctx.textAlign='left';
          ctx.fillText(t.label+' '+t.cost,i*pw+26,padT/2+2);
        });
        for(var r=0;r<ROWS;r++)for(var c=0;c<COLS;c++){ctx.fillStyle=(r+c)%2?'#166534':'#15803d';ctx.fillRect(gx+c*cw,gy+r*ch,cw-1,ch-1);}
        S.plants.forEach(function(p){
          var T=PLANTS.filter(function(q){return q.id===p.type;})[0];
          var cx=gx+p.c*cw+cw/2,cy=gy+p.r*ch+ch/2;
          ctx.fillStyle=T.col;ctx.beginPath();ctx.arc(cx,cy,Math.min(cw,ch)*0.32,0,7);ctx.fill();
          if(p.upgrade){ctx.fillStyle='#fde047';ctx.font='8px sans-serif';ctx.textAlign='center';ctx.fillText('\u2605'.repeat(Math.min(p.upgrade,3)),cx,cy-12);}
          ctx.fillStyle='rgba(0,0,0,.3)';ctx.fillRect(cx-12,cy+12,24,3);ctx.fillStyle='#4ade80';ctx.fillRect(cx-12,cy+12,24*(p.hp/p.max),3);
        });
        S.shots.forEach(function(s){ctx.fillStyle=s.col||'#bbf7d0';ctx.beginPath();ctx.arc(s.x,s.y,5,0,7);ctx.fill();if(s.slow){ctx.strokeStyle='#0ea5e9';ctx.lineWidth=2;ctx.beginPath();ctx.arc(s.x,s.y,8,0,7);ctx.stroke();}if(s.chain){ctx.strokeStyle='#8b5cf6';ctx.lineWidth=1;ctx.beginPath();ctx.arc(s.x,s.y,10,0,7);ctx.stroke();}});
        S.foes.forEach(function(f){
          var cy=gy+f.r*ch+ch/2;var rad=f.boss?Math.min(cw,ch)*0.45:Math.min(cw,ch)*0.3;
          ctx.fillStyle=f.col;ctx.beginPath();ctx.arc(f.x,cy,rad,0,7);ctx.fill();
          if(f.shieldHP>0){ctx.strokeStyle='#fbbf24';ctx.lineWidth=2;ctx.beginPath();ctx.arc(f.x,cy,rad+4,0,7);ctx.stroke();}
          if(f.boss){ctx.fillStyle='rgba(220,38,38,0.3)';ctx.beginPath();ctx.arc(f.x,cy,rad+8,0,7);ctx.fill();}
          ctx.fillStyle='#450a0a';ctx.fillRect(f.x-14,cy-rad-6,28,3);ctx.fillStyle='#fca5a5';ctx.fillRect(f.x-14,cy-rad-6,28*(f.hp/f.max),3);
        });
        if(S.waveTotal>0&&S.waveLeft>0){var pct=1-S.waveLeft/S.waveTotal;ctx.fillStyle='rgba(255,255,255,0.1)';ctx.fillRect(6,H-10,W-12,6);ctx.fillStyle=S.bossActive?'#ef4444':'#4ade80';ctx.fillRect(6,H-10,(W-12)*pct,6);}
        if(S.victory){ctx.fillStyle='rgba(0,0,0,0.6)';ctx.fillRect(0,0,W,H);ctx.fillStyle='#4ade80';ctx.font='bold 28px sans-serif';ctx.textAlign='center';ctx.fillText('VICTORY!',W/2,H/2-10);ctx.fillStyle='#e5e7eb';ctx.font='16px sans-serif';ctx.fillText('Survived 20 waves!',W/2,H/2+20);}
      },
      destroy:function(){writeSave();}
    };
  }};

  // =====================================================================
  //  SECTION 4: RACING UPGRADE – vehicle selection, tracks, AI, missions
  // =====================================================================
  function enhancedRoadRacer(cfg){
    return function make(G){
      var ctx=G.ctx,W=G.w,H=G.h;
      var ENV=getENV();
      var d=ENV.diffNum(G.key);
      var roadX=W*0.12,roadW=W*0.76;

      var VEHICLES=[
        {id:'sport',name:'Sport',w:34,h:58,speed:260,accel:1600,grip:0.88,col:'#7c3aed',nitroCap:100},
        {id:'muscle',name:'Muscle',w:38,h:60,speed:300,accel:2000,grip:0.82,col:'#dc2626',nitroCap:80},
        {id:'tuner',name:'Tuner',w:30,h:52,speed:220,accel:1400,grip:0.92,col:'#0ea5e9',nitroCap:120},
        {id:'bike',name:'Bike',w:22,h:46,speed:280,accel:1800,grip:0.80,col:'#111827',nitroCap:90}
      ];
      if(cfg.moto)VEHICLES=[VEHICLES[3]];

      var TRACKS=[
        {id:'city',name:'City',tMult:1.2},
        {id:'highway',name:'Highway',tMult:0.7},
        {id:'circuit',name:'Circuit',tMult:1.0}
      ];

      var MISSIONS=[
        {id:'race',name:'Race',laps:3},
        {id:'time',name:'Time Trial',time:60},
        {id:'pursuit',name:'Pursuit',police:true}
      ];

      var selV=0,selT=0,selM=cfg.police?2:(cfg.goalTime?1:0);
      if(cfg.moto)selV=0;
      var inMenu=true,menuTab=0;

      var S={px:W/2,vx:0,dist:0,speed:0,baseSpeed:260,lives:3,inv:0,cars:[],tokens:[],spawnT:0,tokT:1.2,nitro:100,nitroOn:false,lineOff:0,rivalsPassed:0,lapsDone:0,lapDist:3000,police:null,timeLeft:cfg.goalTime||60,aiRacers:[],vehicle:VEHICLES[selV],track:TRACKS[0],mission:MISSIONS[selM]};
      if(cfg.police)S.police={x:W/2,y:H+80,active:false,t:6-d};
      G._s=S;

      ENV.addPad([{a:'left',t:'\u25C0'},{a:'right',t:'\u25B6'}],cfg.nitro?[{a:'nitro',t:'\u26A1'}]:[{a:'up',t:'\u25B2'},{a:'down',t:'\u25BC'}]);

      function startRace(){
        inMenu=false;var V=S.vehicle;
        S.px=W/2;S.vx=0;S.dist=0;S.speed=V.speed+d*40;S.baseSpeed=V.speed+d*40;
        S.lives=3;S.inv=0;S.cars=[];S.tokens=[];S.spawnT=0;S.tokT=1.2;
        S.nitro=V.nitroCap;S.nitroOn=false;S.lapsDone=0;S.rivalsPassed=0;
        S.lapDist=3000+selT*500;S.timeLeft=S.mission.time||60;
        if(S.mission.police)S.police={x:W/2,y:H+80,active:false,t:6-d};else S.police=null;
        S.aiRacers=[];var numAI=2+Math.floor(d*0.5);
        for(var a=0;a<numAI;a++){var aiV=VEHICLES[Math.floor(Math.random()*VEHICLES.length)];S.aiRacers.push({x:roadX+30+Math.random()*(roadW-60),y:H*0.3+a*50,w:aiV.w,h:aiV.h,col:['#ef4444','#22d3ee','#f59e0b','#a78bfa'][a%4],speed:aiV.speed*(0.7+Math.random()*0.4),vx:0,steerT:Math.random()*2,passed:false});}
      }

      function spawnCar(){var x=roadX+20+Math.random()*(roadW-40);S.cars.push({x:x,y:-70,w:32,h:56,vy:S.speed*(0.25+Math.random()*0.2),c:['#ef4444','#22d3ee','#f59e0b','#a78bfa','#34d399'][Math.floor(Math.random()*5)],rival:S.mission.id==='time'&&Math.random()<0.5});}
      function hit(a,b){return Math.abs(a.x-b.x)<(a.w+b.w)/2-6&&Math.abs(a.y-b.y)<(a.h+b.h)/2-6;}

      return{
        onPointer:function(x,y,t){
          if(t!=='down'||!inMenu)return;
          if(y<H*0.4){if(x<W/3)menuTab=0;else if(x<W*2/3)menuTab=1;else menuTab=2;}
          else if(y>H*0.6&&y<H*0.8){var items=menuTab===0?VEHICLES:menuTab===1?TRACKS:MISSIONS;var itemW=W/items.length;var idx=Math.floor((x-10)/itemW);if(idx>=0&&idx<items.length){if(menuTab===0){selV=idx;S.vehicle=VEHICLES[idx];}else if(menuTab===1){selT=idx;S.track=TRACKS[idx];}else{selM=idx;S.mission=MISSIONS[idx];}ENV.sfx(600,0.05);}}
          else if(y>H*0.85){startRace();ENV.sfx(800,0.1,'sine');}
        },
        update:function(dt){
          if(inMenu)return;
          var V=S.vehicle;
          var left=G.keys['ArrowLeft']||G.keys['a']||G.btn.left;
          var right=G.keys['ArrowRight']||G.keys['d']||G.btn.right;
          var up=G.keys['ArrowUp']||G.keys['w']||G.btn.up;
          var down=G.keys['ArrowDown']||G.keys['s']||G.btn.down;
          S.vx+=((right?1:0)-(left?1:0))*V.accel*dt;S.vx*=V.grip;S.px+=S.vx*dt;
          if(S.px<roadX+V.w/2){S.px=roadX+V.w/2;S.vx=0;}
          if(S.px>roadX+roadW-V.w/2){S.px=roadX+roadW-V.w/2;S.vx=0;}
          S.nitroOn=(G.keys[' ']||G.btn.nitro)&&S.nitro>0;
          if(S.nitroOn)S.nitro=Math.max(0,S.nitro-40*dt);else S.nitro=Math.min(V.nitroCap,S.nitro+12*dt);
          var tgt=S.baseSpeed+(up?160:0)-(down?120:0)+(S.nitroOn?260:0);
          S.speed+=(tgt-S.speed)*Math.min(1,dt*3);S.dist+=S.speed*dt;S.lineOff=(S.lineOff+S.speed*dt)%60;
          if(S.dist>S.lapDist*(S.lapsDone+1)){S.lapsDone++;if(S.mission.laps&&S.lapsDone>=S.mission.laps){ENV.gameOver('Race Won!','Completed '+S.lapsDone+' laps \u2022 Score '+Math.floor(S.dist/10));return;}ENV.toast('Lap '+(S.lapsDone+1));}
          ENV.setScore(Math.floor(S.dist/10));
          S.spawnT-=dt;var gap=V.w<26?0.75:0.95;gap-=d*0.18;gap*=(S.track&&S.track.tMult)||1;
          if(S.spawnT<=0){spawnCar();S.spawnT=gap+Math.random()*0.5;}
          S.tokT-=dt;if(S.tokT<=0){S.tokens.push({x:roadX+20+Math.random()*(roadW-40),y:-30,w:18,h:18});S.tokT=2+Math.random()*2;}
          var pc={x:S.px,y:H-V.h/2-14,w:V.w,h:V.h};
          for(var i=S.cars.length-1;i>=0;i--){var c=S.cars[i];c.y+=(S.speed-c.vy)*dt;if(c.y>H+80){S.cars.splice(i,1);if(c.rival){S.rivalsPassed++;ENV.sfx(880,0.1,'sine');}continue;}if(S.inv<=0&&hit(pc,c)){crash();S.cars.splice(i,1);}}
          for(var j=S.tokens.length-1;j>=0;j--){var tk=S.tokens[j];tk.y+=S.speed*dt;if(tk.y>H+30){S.tokens.splice(j,1);continue;}if(hit(pc,tk)){S.tokens.splice(j,1);S.dist+=400;S.nitro=Math.min(V.nitroCap,S.nitro+25);ENV.sfx(1040,0.09,'triangle');}}
          for(var ai=0;ai<S.aiRacers.length;ai++){var ar=S.aiRacers[ai];ar.steerT-=dt;if(ar.steerT<=0){ar.steerT=1+Math.random()*2;ar.vx=(Math.random()-0.5)*80;}ar.x+=ar.vx*dt;if(ar.x<roadX+ar.w/2)ar.x=roadX+ar.w/2;if(ar.x>roadX+roadW-ar.w/2)ar.x=roadX+roadW-ar.w/2;ar.y+=(S.speed-ar.speed)*dt;if(ar.y>H+80){ar.y=-80;ar.speed=ar.speed*(0.9+Math.random()*0.2);if(!ar.passed){S.rivalsPassed++;ar.passed=true;}}if(ar.y<-120){ar.y=-80;ar.passed=false;}}
          if(S.police){var P=S.police;P.t-=dt;if(P.t<=0&&!P.active){P.active=true;P.y=H+60;}if(P.active){var aggr=60+d*50;P.x+=Math.max(-aggr*dt,Math.min(aggr*dt,(S.px-P.x)));P.y+=(H-V.h-90-P.y)*Math.min(1,dt*(0.5+d*0.3));if(S.inv<=0&&Math.abs(P.x-pc.x)<28&&Math.abs(P.y-pc.y)<54)crash();}}
          if(S.inv>0)S.inv-=dt;
          if(S.mission.time&&!S.mission.laps){S.timeLeft-=dt;ENV.setInfo('Time '+Math.max(0,S.timeLeft).toFixed(0)+'s \u2022 Rivals '+S.rivalsPassed+' \u2022 Lap '+(S.lapsDone+1));if(S.timeLeft<=0)ENV.gameOver('Time!','Overtook '+S.rivalsPassed+' rivals \u2022 score '+Math.floor(S.dist/10));}
          else ENV.setInfo('\u2764\uFE0F'+S.lives+(S.nitroOn?'  \u26A1'+Math.floor(S.nitro):'')+' \u2022 Lap '+(S.lapsDone+1)+'/'+(S.mission.laps||3));
          function crash(){S.lives--;S.inv=1.6;ENV.sfx(140,0.3,'sawtooth');ENV.vibrate(120);if(S.lives<=0)ENV.gameOver('Crashed!','Distance '+Math.floor(S.dist/10));}
        },
        render:function(){
          if(inMenu){
            ctx.fillStyle='#111827';ctx.fillRect(0,0,W,H);
            ctx.fillStyle='#7c3aed';ctx.font='bold 18px sans-serif';ctx.textAlign='center';
            ctx.fillText(cfg.moto?'VELOCITY MOTO':cfg.night?'NIGHTSHIFT':'STREET PURSUIT',W/2,30);
            var tabs=['Vehicle','Track','Mission'];var tabW=W/3;
            for(var ti=0;ti<3;ti++){ctx.fillStyle=menuTab===ti?'#7c3aed':'#374151';ctx.fillRect(ti*tabW+4,44,tabW-8,30);ctx.fillStyle='#fff';ctx.font='bold 12px sans-serif';ctx.fillText(tabs[ti],ti*tabW+tabW/2,64);}
            var items,sels;if(menuTab===0){items=VEHICLES;sels=selV;}else if(menuTab===1){items=TRACKS;sels=selT;}else{items=MISSIONS;sels=selM;}
            var itemW=(W-20)/items.length;
            for(var ii=0;ii<items.length;ii++){var ix=10+ii*itemW,iy=90;ctx.fillStyle=sels===ii?'#7c3aed':'#1e293b';ctx.fillRect(ix,iy,itemW-6,120);ctx.fillStyle='#fff';ctx.font='bold 13px sans-serif';ctx.fillText(items[ii].name||items[ii].id,ix+(itemW-6)/2,iy+22);ctx.font='10px sans-serif';ctx.fillStyle='#94a3b8';var desc=items[ii].desc||(''+((items[ii].laps||'')+(items[ii].time||'')+(items[ii].police?'Police':'')));ctx.fillText(desc,ix+(itemW-6)/2,iy+40);if(menuTab===0&&items[ii].col){ctx.fillStyle=items[ii].col;ctx.fillRect(ix+(itemW-6)/2-12,iy+50,24,40);}}
            ctx.fillStyle='#22c55e';ctx.fillRect(W/2-60,H-60,120,40);ctx.fillStyle='#fff';ctx.font='bold 16px sans-serif';ctx.fillText('START',W/2,H-35);
            return;
          }
          var night=cfg.night||(S.track&&S.track.id==='circuit');
          ctx.fillStyle=night?'#07101f':'#1f6b2e';ctx.fillRect(0,0,W,H);
          ctx.fillStyle=night?'#111827':'#3b3f46';ctx.fillRect(roadX,0,roadW,H);
          ctx.fillStyle='#e5e7eb';for(var y=-60+S.lineOff;y<H;y+=60)ctx.fillRect(W/2-3,y,6,34);
          ctx.fillStyle='#fde047';ctx.fillRect(roadX-4,0,4,H);ctx.fillRect(roadX+roadW,0,4,H);
          S.tokens.forEach(function(t){ctx.fillStyle='#facc15';ctx.beginPath();ctx.arc(t.x,t.y,9,0,7);ctx.fill();});
          S.cars.forEach(function(c){carDraw(c.x,c.y,c.w,c.h,c.c);});
          S.aiRacers.forEach(function(ar){carDraw(ar.x,ar.y,ar.w,ar.h,ar.col);});
          if(S.police&&S.police.active){carDraw(S.police.x,S.police.y,34,58,'#1e3a8a');ctx.fillStyle=(Math.floor(Date.now()/150)%2)?'#ef4444':'#3b82f6';ctx.fillRect(S.police.x-10,S.police.y-30,20,5);}
          var blink=S.inv>0&&Math.floor(Date.now()/100)%2;
          if(!blink){if(S.vehicle.id==='bike'){ctx.fillStyle='#111827';rrDraw(S.px-10,H-S.vehicle.h/2-2-20,20,40,8);ctx.fillStyle=S.vehicle.col;rrDraw(S.px-7,H-S.vehicle.h/2-2-10,14,20,5);ctx.fillStyle='#e5e7eb';ctx.beginPath();ctx.arc(S.px,H-S.vehicle.h/2-2-26,7,0,7);ctx.fill();}else carDraw(S.px,H-S.vehicle.h/2-14,S.vehicle.w,S.vehicle.h,S.vehicle.col);}
          if(night){var grd=ctx.createRadialGradient(S.px,H-120,20,S.px,H-120,200);grd.addColorStop(0,'rgba(255,255,200,0.18)');grd.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=grd;ctx.fillRect(0,0,W,H);}
          ctx.fillStyle='rgba(255,255,255,0.1)';ctx.fillRect(W-40,10,30,H*0.3);
          S.aiRacers.forEach(function(ar){var my=10+(H*0.3)*(1-Math.max(0,Math.min(1,ar.y/H)));ctx.fillStyle=ar.col;ctx.fillRect(W-35,my,8,4);});
          ctx.fillStyle='#7c3aed';ctx.fillRect(W-35,10+H*0.3-6,8,4);
          function carDraw(x,y,w,h,col){ctx.fillStyle=col;rrDraw(x-w/2,y-h/2,w,h,7);ctx.fillStyle='#0b1020';rrDraw(x-w/2+4,y-h/2+8,w-8,h*0.28,3);ctx.fillStyle='#cbd5e1';rrDraw(x-w/2+4,y+h*0.12,w-8,h*0.22,3);}
          function rrDraw(x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.fill();}
        },
        destroy:function(){}
      };
    };
  }

  MOD.pursuit={kind:'raf',w:360,h:540,help:'Select your ride and track, then weave through traffic and shake the pursuit car. Vehicle & track selection + AI opponents!',make:enhancedRoadRacer({police:true})};
  MOD.nightshift={kind:'raf',w:360,h:540,help:'Night circuit racing with vehicle & track selection. Overtake rivals before time runs out!',make:enhancedRoadRacer({night:true,goalTime:60})};
  MOD.moto={kind:'raf',w:360,h:540,help:'Motorcycle traffic with nitro. Track & mission selection, AI racers, minimap!',make:enhancedRoadRacer({moto:true,nitro:true})};

  // =====================================================================
  //  SECTION 5: CROSS-GAME PROFILE SYSTEM
  // =====================================================================
  var CHCNProfile=(function(){
    var KEY='chcn_game_profile';
    var DEFAULT={xp:0,level:1,achievements:[],stats:{},favorites:[],totalGames:0,totalScore:0,streak:0,lastPlay:0};
    function get(){return LS.get(KEY,DEFAULT);}
    function save(p){LS.set(KEY,p);}
    function xpForLevel(lvl){return Math.floor(100*Math.pow(1.5,lvl-1));}
    function addXP(amount,gameKey){var p=get();p.xp+=amount;p.totalGames++;p.lastPlay=Date.now();if(!p.stats[gameKey])p.stats[gameKey]={plays:0,best:0,total:0};p.stats[gameKey].plays++;while(p.xp>=xpForLevel(p.level)){p.xp-=xpForLevel(p.level);p.level++;}save(p);return p;}
    function addScore(gameKey,score){var p=get();if(!p.stats[gameKey])p.stats[gameKey]={plays:0,best:0,total:0};p.stats[gameKey].total+=score;if(score>p.stats[gameKey].best)p.stats[gameKey].best=score;p.totalScore+=score;save(p);}
    function unlockAchievement(id,name){var p=get();if(p.achievements.some(function(a){return a.id===id;}))return false;p.achievements.push({id:id,name:name,date:Date.now()});save(p);return true;}
    function toggleFavorite(gameKey){var p=get();var idx=p.favorites.indexOf(gameKey);if(idx>=0)p.favorites.splice(idx,1);else p.favorites.push(gameKey);save(p);}
    function getProfileHTML(){
      var p=get();var nextXP=xpForLevel(p.level);
      var h='<div class="gcx-modal" id="gcxProfileModal"><div class="box" style="max-width:420px;">';
      h+='<span class="close" onclick="CHCNProfileClose()">\u2715</span>';
      h+='<h3 style="color:#7c3aed;">\u26A1 Game Profile</h3>';
      h+='<div style="margin:8px 0;"><strong>Level '+p.level+'</strong> \u2022 '+p.xp+'/'+nextXP+' XP</div>';
      h+='<div style="background:#374151;border-radius:6px;height:8px;margin:4px 0;"><div style="background:#7c3aed;border-radius:6px;height:8px;width:'+Math.floor(p.xp/nextXP*100)+'%;"></div></div>';
      h+='<div style="margin:8px 0;color:#94a3b8;">Total games: '+p.totalGames+' \u2022 Total score: '+p.totalScore+'</div>';
      h+='<div style="margin:10px 0;"><strong>Achievements ('+p.achievements.length+')</strong></div>';
      if(p.achievements.length)p.achievements.forEach(function(a){h+='<div style="padding:4px 8px;background:#1e293b;border-radius:4px;margin:2px 0;">\u2B50 '+esc(a.name)+'</div>';});
      else h+='<div style="color:#6b7280;">No achievements yet \u2013 play games to earn them!</div>';
      h+='<div style="margin:10px 0;"><strong>Game Stats</strong></div>';
      var keys=Object.keys(p.stats);
      if(keys.length)keys.forEach(function(k){var s=p.stats[k];h+='<div style="padding:4px 8px;background:#1e293b;border-radius:4px;margin:2px 0;">'+k+': '+s.plays+' plays \u2022 best '+s.best+' \u2022 total '+s.total+'</div>';});
      else h+='<div style="color:#6b7280;">No stats yet</div>';
      h+='<button type="button" class="gcx-btn pri" style="margin-top:12px;" onclick="CHCNProfileClose()">Close</button></div></div>';
      return h;
    }
    function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
    return{get:get,save:save,addXP:addXP,addScore:addScore,unlockAchievement:unlockAchievement,toggleFavorite:toggleFavorite,getProfileHTML:getProfileHTML,xpForLevel:xpForLevel};
  })();
  global.CHCNProfile=CHCNProfile;
  global.CHCNProfileClose=function(){var m=document.getElementById('gcxProfileModal');if(m)m.parentNode.removeChild(m);};

  var ACHIEVEMENTS={
    first_win:{name:'First Victory',check:function(p,gk){return p.stats[gk]&&p.stats[gk].plays>=1;}},
    score_100:{name:'Century Scorer',check:function(p,gk){return p.stats[gk]&&p.stats[gk].best>=100;}},
    score_500:{name:'High Roller',check:function(p,gk){return p.stats[gk]&&p.stats[gk].best>=500;}},
    score_1000:{name:'Grand Master',check:function(p,gk){return p.stats[gk]&&p.stats[gk].best>=1000;}},
    play_10:{name:'Dedicated Player',check:function(p){return p.totalGames>=10;}},
    play_50:{name:'Veteran',check:function(p){return p.totalGames>=50;}},
    level_5:{name:'Rising Star',check:function(p){return p.level>=5;}},
    level_10:{name:'Champion',check:function(p){return p.level>=10;}},
    garden_wave10:{name:'Green Thumb',check:function(p){return p.stats.garden&&p.stats.garden.best>=30;}},
    chess_play:{name:'Chess Mind',check:function(p){return p.stats.chess&&p.stats.chess.plays>=3;}},
    racing_nitro:{name:'Speed Demon',check:function(p){return(p.stats.pursuit||p.stats.moto||p.stats.nightshift)&&((p.stats.pursuit||p.stats.moto||p.stats.nightshift).plays>=3);}},
    all_games:{name:'Omni-Gamer',check:function(p){return Object.keys(p.stats).length>=10;}}
  };

  // Hook profile into setBest flow
  var _origSetBest=null;
  function hookProfile(){
    if(!global.GCXEnv)return;if(_origSetBest)return;
    _origSetBest=global.GCXEnv.setBest;
    global.GCXEnv.setBest=function(key,score){
      if(_origSetBest)_origSetBest(key,score);
      CHCNProfile.addXP(10+Math.floor(score/50),key);
      CHCNProfile.addScore(key,score);
      var p=CHCNProfile.get();
      Object.keys(ACHIEVEMENTS).forEach(function(id){if(!p.achievements.some(function(a){return a.id===id;})){if(ACHIEVEMENTS[id].check(p,key))CHCNProfile.unlockAchievement(id,ACHIEVEMENTS[id].name);}});
    };
  }
  hookProfile();setTimeout(hookProfile,500);setTimeout(hookProfile,2000);

  // =====================================================================
  //  SECTION 6: FLOATING TOOLS MANAGER
  // =====================================================================
  var CHCNToolsManager=(function(){
    var KEY='chcn_tools_config';
    var tools=[
      {id:'fab',name:'Game FAB',desc:'Floating action button'},
      {id:'profile',name:'Profile Badge',desc:'XP/level on cards'},
      {id:'guides',name:'Game Guides',desc:'Per-game help'},
      {id:'haptic',name:'Vibration',desc:'Haptic feedback'},
      {id:'audio',name:'Sound FX',desc:'Sound effects'},
      {id:'saves',name:'Auto-save',desc:'Save progress'},
      {id:'antirepeat',name:'AI Anti-Loop',desc:'Break AI loops'},
      {id:'minimap',name:'Mini-map',desc:'Racing mini-map'}
    ];
    function getConfig(){return LS.get(KEY,{master:true,tools:{}});}
    function saveConfig(c){LS.set(KEY,c);}
    function isEnabled(tid){var c=getConfig();if(!c.master)return false;return c.tools[tid]!==false;}
    function setEnabled(tid,on){var c=getConfig();c.tools[tid]=on;saveConfig(c);if(tid==='fab'){var fab=document.getElementById('gcxFab');if(fab)fab.style.display=on?'':'none';}}
    function setMaster(on){var c=getConfig();c.master=on;saveConfig(c);}
    function getSettingsHTML(){
      var c=getConfig();
      var h='<div class="gcx-modal" id="gcxToolsModal"><div class="box" style="max-width:400px;">';
      h+='<span class="close" onclick="CHCNToolsClose()">\u2715</span>';
      h+='<h3 style="color:#7c3aed;">\u2699\uFE0F Tools Manager</h3>';
      h+='<div style="display:flex;justify-content:space-between;align-items:center;padding:8px;background:#1e293b;border-radius:8px;margin:6px 0;"><strong style="color:#e5e7eb;">Master Switch</strong><input type="checkbox" id="toolsMaster" '+(c.master?'checked':'')+' onchange="CHCNToolsToggle(\'master\',this.checked)"></div>';
      tools.forEach(function(t){var on=c.tools[t.id]!==false;h+='<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 8px;border-bottom:1px solid #1e293b;"><div><strong style="color:#e5e7eb;">'+t.name+'</strong><div style="color:#6b7280;font-size:11px;">'+t.desc+'</div></div><input type="checkbox" '+(on&&c.master?'checked':'')+' '+(c.master?'':'disabled')+' onchange="CHCNToolsToggle(\''+t.id+'\',this.checked)"></div>';});
      h+='<button type="button" class="gcx-btn pri" style="margin-top:12px;" onclick="CHCNToolsClose()">Done</button></div></div>';
      return h;
    }
    return{isEnabled:isEnabled,setEnabled:setEnabled,setMaster:setMaster,getConfig:getConfig,getSettingsHTML:getSettingsHTML,tools:tools};
  })();
  global.CHCNToolsManager=CHCNToolsManager;
  global.CHCNToolsClose=function(){var m=document.getElementById('gcxToolsModal');if(m)m.parentNode.removeChild(m);};
  global.CHCNToolsToggle=function(id,on){if(id==='master')CHCNToolsManager.setMaster(on);else CHCNToolsManager.setEnabled(id,on);var m=document.getElementById('gcxToolsModal');if(m)m.outerHTML=CHCNToolsManager.getSettingsHTML();};

  // =====================================================================
  //  SECTION 7: GAME GUIDES SYSTEM
  // =====================================================================
  var CHCNGuides=(function(){
    var guides={
      chess:{title:'Chess Guide',sections:[
        {title:'Pieces & Movement',content:'King: 1 square any direction. Queen: any direction unlimited. Rook: straight lines. Bishop: diagonals. Knight: L-shape (2+1). Pawn: forward 1, capture diagonal, 2 from start.'},
        {title:'Special Moves',content:'Castling: King+Rook swap (if neither moved, no pieces between, king not in check). En passant: capture pawn that just double-moved. Promotion: pawn reaches far rank, becomes any piece.'},
        {title:'AI Tips',content:'AI uses negamax+alpha-beta. Easy=depth 1, Normal=2, Hard=3. Anti-repetition prevents rook loops. Control center, develop pieces, king safety first!'},
        {title:'Winning',content:'Checkmate: king attacked, cannot escape. Stalemate: no legal moves but not in check = draw. Win material, then checkmate.'}
      ]},
      garden:{title:'Garden Guardians Guide',sections:[
        {title:'7 Plant Types',content:'Sprout(50): energy. Shooter(100): fires peas. Wall(50): blocks. Solar(75): big energy. Frost(150): slows enemies. Bomb(175): area damage. Tesla(200): chain lightning.'},
        {title:'9 Enemy Types',content:'Crawler: basic. Runner: fast. Armored: tough. Spitter: ranged. Giant: very tough. Leaper: jumps over. Shield: absorbs dmg. Healer: heals others. Boss: every 5 waves!'},
        {title:'Strategy',content:'Start with 2 Sprouts, then Shooters. Use Walls to block. Frost slows groups. Bomb for clusters. Tesla chains. Tap plants to upgrade (max 3 stars). Survive 20 waves to win!'},
        {title:'Waves & Bosses',content:'Waves get harder. Every 5th wave is Boss wave with a giant enemy! Save energy before bosses. Game auto-saves between waves.'}
      ]},
      pursuit:{title:'Street Pursuit Guide',sections:[
        {title:'4 Vehicles',content:'Sport: balanced(260). Muscle: power(300). Tuner: handling(220). Bike: narrow+fast(280).'},
        {title:'3 Tracks',content:'City: dense traffic. Highway: fast & open. Circuit: tight.'},
        {title:'Controls',content:'Arrows/WASD to steer. Up/Down speed. Space=nitro. Touch buttons on mobile.'},
        {title:'3 Missions',content:'Race: 3 laps. Time Trial: 60s max distance. Pursuit: shake the cops!'}
      ]},
      forge:{title:'Battle Forge Guide',sections:[{title:'Controls',content:'A/D: move. W: jump. J: punch. K: kick. L: block. Chain for combos.'},{title:'Strategy',content:'Mix attacks. Block when opponent winds up. Best of 3 rounds.'}]},
      void:{title:'Void Frontier Guide',sections:[{title:'Controls',content:'WASD/Arrows to fly. Auto-target. Star=pulse (charges by scoring).'},{title:'Survival',content:'Keep moving. Use pulse when surrounded. Collect power-ups.'}]},
      strikers:{title:'World Strikers Guide',sections:[{title:'Controls',content:'Arrows to move. Touch ball to dribble. Shoot to kick.'},{title:'Tactics',content:'Pass. Shoot close-range. Defend goal.'}]}  
    };
    function show(gameKey){
      var g=guides[gameKey];if(!g){if(global.showToast)global.showToast('No guide for '+gameKey);return;}
      var h='<div class="gcx-modal" id="gcxGuideModal"><div class="box" style="max-width:420px;max-height:80vh;overflow-y:auto;">';
      h+='<span class="close" onclick="CHCNGuideClose()">\u2715</span>';
      h+='<h3 style="color:#7c3aed;">'+g.title+'</h3>';
      g.sections.forEach(function(sec){h+='<div style="margin:10px 0;padding:8px;background:#1e293b;border-radius:8px;"><strong style="color:#e5e7eb;">'+sec.title+'</strong><p style="color:#94a3b8;margin:4px 0;line-height:1.4;">'+sec.content+'</p></div>';});
      h+='<button type="button" class="gcx-btn pri" style="margin-top:12px;" onclick="CHCNGuideClose()">Got it!</button></div></div>';
      var d=document.createElement('div');d.innerHTML=h;d.firstChild.addEventListener('click',function(e){if(e.target===d.firstChild)CHCNGuideClose();});document.body.appendChild(d.firstChild);
    }
    function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
    return{show:show,guides:guides};
  })();
  global.CHCNGuides=CHCNGuides;
  global.CHCNGuideClose=function(){var m=document.getElementById('gcxGuideModal');if(m)m.parentNode.removeChild(m);};

  // =====================================================================
  //  SECTION 8: INJECT PROFILE + TOOLS + GUIDES INTO FAB
  // =====================================================================
  function injectFabButtons(){
    var fabMenu=document.getElementById('gcxFabMenu');if(!fabMenu)return;
    if(fabMenu.querySelector('[onclick*="CHCNProfileOpen"]'))return;
    var btns=['<button type="button" onclick="CHCNProfileOpen()" style="text-align:left;border:none;background:#f8f7ff;border-radius:8px;padding:9px 12px;font-size:13px;font-weight:700;color:#4c1d95;cursor:pointer;">\u26A1 Profile</button>','<button type="button" onclick="CHCNToolsOpen()" style="text-align:left;border:none;background:#f8f7ff;border-radius:8px;padding:9px 12px;font-size:13px;font-weight:700;color:#4c1d95;cursor:pointer;">\u2699\uFE0F Tools</button>','<button type="button" onclick="CHCNGuideForActive()" style="text-align:left;border:none;background:#f8f7ff;border-radius:8px;padding:9px 12px;font-size:13px;font-weight:700;color:#4c1d95;cursor:pointer;">\uD83D\uDCD6 Guide</button>'];
    btns.forEach(function(b){fabMenu.insertAdjacentHTML('beforeend',b);});
  }

  global.CHCNProfileOpen=function(){var d=document.createElement('div');d.innerHTML=CHCNProfile.getProfileHTML();d.firstChild.addEventListener('click',function(e){if(e.target===d.firstChild)CHCNProfileClose();});document.body.appendChild(d.firstChild);};
  global.CHCNToolsOpen=function(){var d=document.createElement('div');d.innerHTML=CHCNToolsManager.getSettingsHTML();d.firstChild.addEventListener('click',function(e){if(e.target===d.firstChild)CHCNToolsClose();});document.body.appendChild(d.firstChild);};
  global.CHCNGuideForActive=function(){var a=document.getElementById('gcxStage');if(a)CHCNGuides.show('chess');else if(global.showToast)global.showToast('Start a game first');};

  // Try to get the active game key for guide
  // We need to read from the expansion's ACTIVE variable
  // Since it's closure-scoped, we expose it via GCXActive
  var _injectInterval=setInterval(function(){injectFabButtons();if(document.getElementById('gcxFabMenu')&&document.getElementById('gcxFabMenu').querySelector('[onclick*="CHCNProfileOpen"]'))clearInterval(_injectInterval);},1000);

  // =====================================================================
  //  SECTION 9: PROFILE BADGES ON LOBBY CARDS
  // =====================================================================
  function addProfileBadges(){
    var profile=CHCNProfile.get();if(profile.level<=1&&profile.totalGames===0)return;
    var cards=document.querySelectorAll('.gc-card');cards.forEach(function(card){if(card.querySelector('.profile-badge'))return;var badge=document.createElement('span');badge.className='profile-badge';badge.style.cssText='position:absolute;top:4px;right:4px;background:#7c3aed;color:#fff;font-size:10px;padding:2px 6px;border-radius:4px;font-weight:700;';badge.textContent='Lv'+profile.level;card.style.position='relative';card.appendChild(badge);});
  }
  setInterval(addProfileBadges,3000);

  // =====================================================================
  //  SECTION 10: UPDATE REGISTRY VERSION
  // =====================================================================
  if(global.CHCNGameRegistry){global.CHCNGameRegistry.version='57';}

  console.log('[CHCN v57] Master upgrade loaded: chess anti-repetition, garden expansion (7 plants, 9 enemies, bosses, save), racing (vehicles/tracks/missions/AI), cross-game profile, floating tools manager, AI anti-repeat engine, game guides');

})(window);
