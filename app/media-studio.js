/* ===== Creator Hub \u2013 Media Studio (offline) =====
   Guitar Tuner (reference tones + live mic pitch detection),
   Virtual Instruments (Web Audio piano + drum pads),
   Photo Editor (canvas: filters, brush, text, crop, export).
   All offline using Web Audio API + Canvas. Mic/camera use the
   permissions already in the app shell.
*/
(function(){
  'use strict';
  var R=window.CHCNreg||{}; var esc=R.esc||function(s){return s;}; var toast=R.toast||function(m){alert(m);};
  var PAGES=['studio'];
  var MS_BASE_OCT=4; // lowest octave scrolled-to on the piano (shiftable 1..7)
  var MS_PK_W=40;    // white-key width in px (adjustable size)
  var MS_LO_OCT=1, MS_HI_OCT=7; // full rendered range (C1..B7) – scrolls horizontally
  var AC=null; function ac(){ if(!AC){ try{ AC=new (window.AudioContext||window.webkitAudioContext)(); }catch(e){} } if(AC&&AC.state==='suspended'){ try{AC.resume();}catch(e){} } return AC; }

  function injectCSS(){ if(document.getElementById('ms-css')) return; var s=document.createElement('style'); s.id='ms-css'; s.textContent=[
    '.ms-wrap{max-width:900px;margin:0 auto;padding:16px;}',
    '.ms-hero{background:linear-gradient(135deg,#0f172a,#334155);color:#fff;border-radius:14px;padding:22px;margin-bottom:16px;}',
    '.ms-hero h1{margin:0 0 6px;font-size:24px;}',
    '.ms-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;}',
    '.ms-tile{background:#fff;border:1px solid #e6e8eb;border-radius:12px;padding:16px;cursor:pointer;text-align:center;transition:.15s;}',
    '.ms-tile:hover{border-color:#0ea5e9;box-shadow:0 4px 14px rgba(0,0,0,.08);}',
    '.ms-tile .emo{font-size:30px;}',
    '.ms-card{background:#fff;border:1px solid #e6e8eb;border-radius:12px;padding:16px;margin:12px 0;}',
    '.ms-note{font-size:12px;color:#667085;margin-top:6px;}',
    '.tuner-dial{font-size:46px;font-weight:800;text-align:center;margin:10px 0;}',
    '.tuner-cents{height:14px;background:#eceff3;border-radius:7px;position:relative;margin:10px 0;}',
    '.tuner-cents .mid{position:absolute;left:50%;top:-4px;width:2px;height:22px;background:#333;}',
    '.tuner-cents .ptr{position:absolute;top:-3px;width:12px;height:20px;border-radius:4px;background:#0ea5e9;transform:translateX(-50%);transition:left .08s,background .08s;}',
    '.string-row{display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin:10px 0;}',
    '.string-btn{min-width:52px;padding:12px;border:1px solid #cbd5e1;border-radius:10px;background:#f8fafc;font-weight:700;cursor:pointer;}',
    '.string-btn:active{background:#0ea5e9;color:#fff;}',
    '.piano{position:relative;height:160px;max-width:100%;overflow-x:auto;overflow-y:hidden;white-space:nowrap;border:1px solid #ddd;border-radius:8px;background:#111;padding:0;scroll-behavior:smooth;-webkit-overflow-scrolling:touch;}',
    '.piano .pk{width:var(--pkw,40px);}',
    '.pk{display:inline-block;position:relative;width:40px;height:160px;background:#fff;border:1px solid #999;border-radius:0 0 5px 5px;vertical-align:top;cursor:pointer;}',
    '.pk.black{width:calc(var(--pkw,40px) * 0.62);height:62%;background:#111;margin:0 calc(var(--pkw,40px) * -0.31);z-index:2;border-radius:0 0 4px 4px;}',
    '.pk:active{background:#0ea5e9;}',
    '.pk-lbl{position:absolute;bottom:6px;left:0;right:0;text-align:center;font-size:10px;color:#98a2b3;pointer-events:none;}',
    '.pk.black:active{background:#0ea5e9;}',
    '.ms-oct{display:flex;align-items:center;justify-content:center;gap:12px;margin:10px 0;flex-wrap:wrap;}',
    '.ms-oct-lbl{font-weight:600;color:#334155;min-width:70px;text-align:center;}',
    '.ms-size{display:flex;align-items:center;justify-content:center;gap:10px;margin:8px 0;flex-wrap:wrap;}',
    '.ms-size input[type=range]{width:180px;max-width:60vw;}',
    '.ms-size label{font-weight:600;color:#334155;font-size:13px;}',
    '.pads{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;}',
    '.pad{padding:22px 8px;border-radius:12px;background:#1e293b;color:#fff;text-align:center;font-weight:700;cursor:pointer;user-select:none;}',
    '.pad:active{background:#0ea5e9;}',
    '.pe-tools{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:8px 0;}',
    '.pe-canvas{max-width:100%;border:1px solid #ccc;border-radius:8px;touch-action:none;background:#f3f4f6;}'
  ].join(''); document.head.appendChild(s); }

  function renderStudio(){ injectCSS(); var el=document.getElementById('page-studio'); if(!el) return;
    var h='<div class="ms-wrap"><div class="ms-hero"><h1>\uD83C\uDFB5 Media Studio</h1><p>Offline creative tools \u2013 tune your guitar, play virtual instruments, and edit photos right on your device.</p></div>';
    h+='<div class="ms-grid">'
      +'<div class="ms-tile" onclick="MSshow(\'tuner\')"><div class="emo">\uD83C\uDFB8</div><div>Guitar Tuner</div></div>'
      +'<div class="ms-tile" onclick="MSshow(\'inst\')"><div class="emo">\uD83C\uDFB9</div><div>Virtual Instruments</div></div>'
      +'<div class="ms-tile" onclick="MSshow(\'photo\')"><div class="emo">\uD83D\uDDBC\uFE0F</div><div>Photo Editor</div></div>'
      +'</div><div id="msPanel"></div></div>';
    el.innerHTML=h; MSshow('tuner');
  }
  window.MSshow=function(k){ var p=document.getElementById('msPanel'); if(!p) return; stopTuner(); if(k==='tuner') p.innerHTML=tunerUI(); else if(k==='inst'){ p.innerHTML=instUI(); setTimeout(function(){ scrollToOctave(MS_BASE_OCT); },60); } else if(k==='photo'){ p.innerHTML=photoUI(); photoInit(); } p.scrollIntoView({behavior:'smooth',block:'start'}); };
  // ================= GUITAR TUNER =================
  var GSTRINGS=[{n:'E2',f:82.41},{n:'A2',f:110.00},{n:'D3',f:146.83},{n:'G3',f:196.00},{n:'B3',f:246.94},{n:'E4',f:329.63}];
  var NOTE_NAMES=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
  function tunerUI(){ var btns=GSTRINGS.map(function(s,i){ return '<button class="string-btn" onclick="MStone('+i+')">'+s.n+'</button>'; }).join('');
    return '<div class="ms-card"><h3>\uD83C\uDFB8 Guitar Tuner</h3>'
    +'<p class="ms-note">Standard tuning (E A D G B E). Tap a string to hear its reference tone, or use the live tuner with your microphone.</p>'
    +'<div class="string-row">'+btns+'</div>'
    +'<hr style="border:none;border-top:1px solid #eee;margin:14px 0;">'
    +'<h4 style="margin:0 0 6px;">Live tuner (microphone)</h4>'
    +'<div class="ms-note">Pluck one string at a time near the mic in a quiet room.</div>'
    +'<div id="tunerLive" style="display:none;">'
      +'<div class="tuner-dial" id="tunerNote">\u2013</div>'
      +'<div class="tuner-cents"><div class="mid"></div><div class="ptr" id="tunerPtr" style="left:50%;"></div></div>'
      +'<div style="text-align:center;" id="tunerHz" class="ms-note"></div></div>'
    +'<div class="ct-row" style="margin-top:10px;"><button class="btn btn-primary" id="tunerStartBtn" onclick="MStunerStart()">\uD83C\uDF99\uFE0F Start live tuner</button>'
    +'<button class="btn btn-outline" onclick="MStunerStop()">Stop</button></div>'
    +'<div id="tunerErr" class="ms-note" style="color:#c00;"></div></div>'; }
  window.MStone=function(i){ var c=ac(); if(!c){ toast('Audio not available.',true); return; } var s=GSTRINGS[i]; var o=c.createOscillator(),g=c.createGain(); o.type='sine'; o.frequency.value=s.f; g.gain.value=0.0001; o.connect(g); g.connect(c.destination); var t=c.currentTime; g.gain.exponentialRampToValueAtTime(0.25,t+0.02); g.gain.exponentialRampToValueAtTime(0.0001,t+2.0); o.start(t); o.stop(t+2.05); };

  var _tuner={stream:null,an:null,raf:0,buf:null};
  window.MStunerStart=function(){ var c=ac(); if(!c){ toast('Audio not available.',true); return; } if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){ document.getElementById('tunerErr').textContent='Microphone not available on this device.'; return; }
    navigator.mediaDevices.getUserMedia({audio:{echoCancellation:false,noiseSuppression:false,autoGainControl:false}}).then(function(stream){ _tuner.stream=stream; var src=c.createMediaStreamSource(stream); var an=c.createAnalyser(); an.fftSize=2048; src.connect(an); _tuner.an=an; _tuner.buf=new Float32Array(an.fftSize); document.getElementById('tunerLive').style.display='block'; document.getElementById('tunerErr').textContent=''; document.getElementById('tunerStartBtn').textContent='Listening\u2026'; tunerLoop(); }).catch(function(e){ document.getElementById('tunerErr').textContent='Microphone permission denied or unavailable.'; }); };
  window.MStunerStop=function(){ stopTuner(); };
  function stopTuner(){ if(_tuner.raf){ cancelAnimationFrame(_tuner.raf); _tuner.raf=0; } if(_tuner.stream){ _tuner.stream.getTracks().forEach(function(t){t.stop();}); _tuner.stream=null; } _tuner.an=null; var b=document.getElementById('tunerStartBtn'); if(b) b.textContent='\uD83C\uDF99\uFE0F Start live tuner'; var lv=document.getElementById('tunerLive'); if(lv) lv.style.display='none'; }
  function tunerLoop(){ if(!_tuner.an) return; _tuner.an.getFloatTimeDomainData(_tuner.buf); var f=autoCorrelate(_tuner.buf, (AC?AC.sampleRate:44100)); if(f>0){ var midi=Math.round(69+12*Math.log2(f/440)); var ref=440*Math.pow(2,(midi-69)/12); var cents=Math.floor(1200*Math.log2(f/ref)); var name=NOTE_NAMES[((midi%12)+12)%12]+(Math.floor(midi/12)-1); var nd=document.getElementById('tunerNote'); if(nd){ nd.textContent=name; nd.style.color=Math.abs(cents)<=5?'#16a34a':'#0f172a'; } var ptr=document.getElementById('tunerPtr'); if(ptr){ var pct=Math.max(0,Math.min(100,50+cents)); ptr.style.left=pct+'%'; ptr.style.background=Math.abs(cents)<=5?'#16a34a':(cents<0?'#f59e0b':'#ef4444'); } var hz=document.getElementById('tunerHz'); if(hz) hz.textContent=f.toFixed(1)+' Hz  ('+(cents>=0?'+':'')+cents+' cents)'; }
    _tuner.raf=requestAnimationFrame(tunerLoop); }
  function autoCorrelate(buf, sr){ var SIZE=buf.length, rms=0; for(var i=0;i<SIZE;i++){ rms+=buf[i]*buf[i]; } rms=Math.sqrt(rms/SIZE); if(rms<0.01) return -1; var r1=0,r2=SIZE-1,thres=0.2; for(var i=0;i<SIZE/2;i++){ if(Math.abs(buf[i])<thres){ r1=i; break; } } for(var i=1;i<SIZE/2;i++){ if(Math.abs(buf[SIZE-i])<thres){ r2=SIZE-i; break; } } buf=buf.slice(r1,r2); SIZE=buf.length; var c=new Array(SIZE).fill(0); for(var i=0;i<SIZE;i++){ for(var j=0;j<SIZE-i;j++){ c[i]+=buf[j]*buf[j+i]; } } var d=0; while(c[d]>c[d+1]) d++; var maxval=-1,maxpos=-1; for(var i=d;i<SIZE;i++){ if(c[i]>maxval){ maxval=c[i]; maxpos=i; } } var T0=maxpos; var x1=c[T0-1]||0,x2=c[T0]||0,x3=c[T0+1]||0; var a=(x1+x3-2*x2)/2, b=(x3-x1)/2; if(a) T0=T0-b/(2*a); return sr/T0; }
  // ================= VIRTUAL INSTRUMENTS =================
  function buildPiano(){ // full range MS_LO_OCT..MS_HI_OCT, horizontally scrollable
    var whites=['C','D','E','F','G','A','B']; var html='';
    var blackAfter={C:'C#',D:'D#',F:'F#',G:'G#',A:'A#'};
    for(var oc=MS_LO_OCT; oc<=MS_HI_OCT; oc++){
      (function(oc){ whites.forEach(function(w){
        var wf=noteFreq(w,oc);
        html+='<div class="pk" data-oct="'+oc+'" data-note="'+w+'" onmousedown="MSnote('+wf+')" ontouchstart="event.preventDefault();MSnote('+wf+')"><span class="pk-lbl">'+w+oc+'</span></div>';
        var b=blackAfter[w];
        if(b){ var bf=noteFreq(b,oc); html+='<div class="pk black" onmousedown="event.stopPropagation();MSnote('+bf+')" ontouchstart="event.preventDefault();event.stopPropagation();MSnote('+bf+')"></div>'; }
      }); })(oc);
    }
    return html; }
  function scrollToOctave(oc){ var p=document.getElementById('msPiano'); if(!p) return;
    var key=p.querySelector('.pk[data-oct="'+oc+'"][data-note="C"]');
    if(key){ p.scrollTo({left:Math.max(0,key.offsetLeft-4),behavior:'smooth'}); } }
  window.MSoctave=function(dir){ var n=MS_BASE_OCT+dir; if(n<MS_LO_OCT) n=MS_LO_OCT; if(n>MS_HI_OCT) n=MS_HI_OCT; MS_BASE_OCT=n; scrollToOctave(MS_BASE_OCT); var lbl=document.getElementById('msOctLbl'); if(lbl) lbl.textContent='C'+MS_BASE_OCT; };
  window.MSpkSize=function(v){ MS_PK_W=parseInt(v,10)||40; var p=document.getElementById('msPiano'); if(p) p.style.setProperty('--pkw',MS_PK_W+'px'); var o=document.getElementById('msSizeLbl'); if(o) o.textContent=MS_PK_W+'px'; };
  function noteFreq(name,oc){ var idx=NOTE_NAMES.indexOf(name); var midi=(oc+1)*12+idx; return 440*Math.pow(2,(midi-69)/12); }
  function instUI(){ return '<div class="ms-card"><h3>\uD83C\uDFB9 Virtual Instruments</h3>'
    +'<h4 style="margin:4px 0;">Piano</h4>'
    +'<div class="ct-field" style="max-width:220px;"><label>Sound</label><select id="instVoice"><option value="triangle">Soft (triangle)</option><option value="sine">Pure (sine)</option><option value="square">Retro (square)</option><option value="sawtooth">Bright (saw)</option></select></div>'
    +'<div class="ms-oct"><button class="btn btn-sm btn-outline" onclick="MSoctave(-1)">\u25C0 Lower octave</button>'
    +'<span id="msOctLbl" class="ms-oct-lbl">C'+MS_BASE_OCT+'</span>'
    +'<button class="btn btn-sm btn-outline" onclick="MSoctave(1)">Higher octave \u25B6</button></div>'
    +'<div class="ms-size"><label>Key size</label><input type="range" min="24" max="72" step="2" value="'+MS_PK_W+'" oninput="MSpkSize(this.value)"><span id="msSizeLbl" class="ms-oct-lbl" style="min-width:48px;">'+MS_PK_W+'px</span></div>'
    +'<div class="ms-note" style="text-align:center;">Full keyboard C'+MS_LO_OCT+'\u2013B'+MS_HI_OCT+'. Swipe or drag the scroll bar under the keys, use \u25C0 / \u25B6 to jump octaves, and the slider to resize.</div>'
    +'<div class="piano" id="msPiano" style="--pkw:'+MS_PK_W+'px;">'+buildPiano()+'</div>'
    +'<h4 style="margin:16px 0 6px;">Drum pads</h4>'
    +'<div class="pads">'
      +'<div class="pad" onmousedown="MSdrum(\'kick\')" ontouchstart="event.preventDefault();MSdrum(\'kick\')">Kick</div>'
      +'<div class="pad" onmousedown="MSdrum(\'snare\')" ontouchstart="event.preventDefault();MSdrum(\'snare\')">Snare</div>'
      +'<div class="pad" onmousedown="MSdrum(\'hat\')" ontouchstart="event.preventDefault();MSdrum(\'hat\')">Hi-hat</div>'
      +'<div class="pad" onmousedown="MSdrum(\'clap\')" ontouchstart="event.preventDefault();MSdrum(\'clap\')">Clap</div>'
      +'<div class="pad" onmousedown="MSdrum(\'tom\')" ontouchstart="event.preventDefault();MSdrum(\'tom\')">Tom</div>'
      +'<div class="pad" onmousedown="MSdrum(\'rim\')" ontouchstart="event.preventDefault();MSdrum(\'rim\')">Rim</div>'
      +'<div class="pad" onmousedown="MSdrum(\'crash\')" ontouchstart="event.preventDefault();MSdrum(\'crash\')">Crash</div>'
      +'<div class="pad" onmousedown="MSdrum(\'perc\')" ontouchstart="event.preventDefault();MSdrum(\'perc\')">Perc</div>'
    +'</div>'
    +'<p class="ms-note">All sounds are generated live with the Web Audio API \u2013 no files, fully offline. Tip: use headphones for the best sound.</p></div>'; }
  window.MSnote=function(freq){ var c=ac(); if(!c) return; var v=(document.getElementById('instVoice')||{}).value||'triangle'; var o=c.createOscillator(),g=c.createGain(); o.type=v; o.frequency.value=freq; o.connect(g); g.connect(c.destination); var t=c.currentTime; g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(0.3,t+0.01); g.gain.exponentialRampToValueAtTime(0.0001,t+1.1); o.start(t); o.stop(t+1.15); };
  window.MSdrum=function(type){ var c=ac(); if(!c) return; var t=c.currentTime;
    function noiseBuf(dur){ var len=Math.floor(c.sampleRate*dur); var b=c.createBuffer(1,len,c.sampleRate); var d=b.getChannelData(0); for(var i=0;i<len;i++) d[i]=Math.random()*2-1; return b; }
    function env(g,peak,dur){ g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(peak,t+0.005); g.gain.exponentialRampToValueAtTime(0.0001,t+dur); }
    if(type==='kick'){ var o=c.createOscillator(),g=c.createGain(); o.frequency.setValueAtTime(150,t); o.frequency.exponentialRampToValueAtTime(45,t+0.15); env(g,0.9,0.3); o.connect(g); g.connect(c.destination); o.start(t); o.stop(t+0.32); }
    else if(type==='tom'){ var o=c.createOscillator(),g=c.createGain(); o.frequency.setValueAtTime(220,t); o.frequency.exponentialRampToValueAtTime(90,t+0.2); env(g,0.7,0.35); o.connect(g); g.connect(c.destination); o.start(t); o.stop(t+0.37); }
    else { var dur=(type==='crash')?0.9:(type==='hat'?0.05:0.2); var src=c.createBufferSource(); src.buffer=noiseBuf(dur); var f=c.createBiquadFilter(); f.type=(type==='hat'||type==='crash')?'highpass':'bandpass'; f.frequency.value=(type==='hat'?8000:(type==='crash'?6000:(type==='snare'?1800:(type==='rim'?2500:1200)))); var g=c.createGain(); env(g,(type==='clap'?0.6:0.5),dur); src.connect(f); f.connect(g); g.connect(c.destination); src.start(t); src.stop(t+dur+0.02); } };
  // ================= PHOTO EDITOR =================
  var PE={ canvas:null, ctx:null, img:null, mode:'none', drawing:false, last:null, brush:'#FE2C55', size:6, start:null, baseFilter:'none', text:'' };
  function photoUI(){ return '<div class="ms-card"><h3>\uD83D\uDDBC\uFE0F Photo Editor</h3>'
    +'<div class="pe-tools"><input type="file" id="peFile" accept="image/*" onchange="MSpeLoad(this)"></div>'
    +'<div class="pe-tools">'
      +'<button class="btn btn-sm btn-outline" onclick="MSpeFilter(\'none\')">Original</button>'
      +'<button class="btn btn-sm btn-outline" onclick="MSpeFilter(\'grayscale(1)\')">B&amp;W</button>'
      +'<button class="btn btn-sm btn-outline" onclick="MSpeFilter(\'sepia(0.8)\')">Sepia</button>'
      +'<button class="btn btn-sm btn-outline" onclick="MSpeFilter(\'contrast(1.3)\')">Contrast+</button>'
      +'<button class="btn btn-sm btn-outline" onclick="MSpeFilter(\'brightness(1.2)\')">Bright+</button>'
      +'<button class="btn btn-sm btn-outline" onclick="MSpeFilter(\'saturate(1.6)\')">Vivid</button>'
      +'<button class="btn btn-sm btn-outline" onclick="MSpeFilter(\'invert(1)\')">Invert</button>'
      +'<button class="btn btn-sm btn-outline" onclick="MSpeFilter(\'blur(2px)\')">Blur</button>'
    +'</div>'
    +'<div class="pe-tools">'
      +'<button class="btn btn-sm" id="peBrushBtn" onclick="MSpeMode(\'brush\')">\u270F\uFE0F Brush</button>'
      +'<input type="color" value="#FE2C55" onchange="MSpeColor(this.value)" title="Brush colour">'
      +'<input type="range" min="2" max="40" value="6" onchange="MSpeSize(this.value)" title="Brush size">'
      +'<button class="btn btn-sm" onclick="MSpeAddText()">\uD83D\uDD24 Text</button>'
      +'<button class="btn btn-sm" id="peCropBtn" onclick="MSpeMode(\'crop\')">\u2702\uFE0F Crop</button>'
      +'<button class="btn btn-sm btn-outline" onclick="MSpeReset()">\u21BA Reset</button>'
    +'</div>'
    +'<canvas id="peCanvas" class="pe-canvas" width="320" height="240"></canvas>'
    +'<div class="pe-tools"><button class="btn btn-primary" onclick="MSpeExport()">\u2B07\uFE0F Save / Export PNG</button></div>'
    +'<p class="ms-note" id="peHint">Load a photo to start. Brush: drag on the image. Text: type, then tap where to place it. Crop: drag a box, release to crop. Everything stays on your device.</p></div>'; }
  function photoInit(){ PE.canvas=document.getElementById('peCanvas'); PE.ctx=PE.canvas?PE.canvas.getContext('2d'):null; PE.img=null; PE.mode='none'; PE.baseFilter='none'; if(PE.ctx){ PE.ctx.fillStyle='#e5e7eb'; PE.ctx.fillRect(0,0,PE.canvas.width,PE.canvas.height); PE.ctx.fillStyle='#9ca3af'; PE.ctx.font='14px sans-serif'; PE.ctx.textAlign='center'; PE.ctx.fillText('No photo loaded',PE.canvas.width/2,PE.canvas.height/2); } bindCanvas(); }
  window.MSpeLoad=function(input){ var f=input.files&&input.files[0]; if(!f) return; var r=new FileReader(); r.onload=function(e){ var im=new Image(); im.onload=function(){ var maxW=640, scale=Math.min(1,maxW/im.width); var w=Math.round(im.width*scale), h=Math.round(im.height*scale); PE.canvas.width=w; PE.canvas.height=h; PE.img=im; PE.baseFilter='none'; redraw(); }; im.src=e.target.result; }; r.readAsDataURL(f); };
  function redraw(){ if(!PE.ctx||!PE.img) return; PE.ctx.save(); PE.ctx.filter=PE.baseFilter||'none'; PE.ctx.drawImage(PE.img,0,0,PE.canvas.width,PE.canvas.height); PE.ctx.restore(); }
  window.MSpeFilter=function(fl){ if(!PE.img){ toast('Load a photo first.',true); return; } PE.baseFilter=fl; redraw(); };
  window.MSpeColor=function(v){ PE.brush=v; }; window.MSpeSize=function(v){ PE.size=parseInt(v,10)||6; };
  window.MSpeMode=function(m){ if(!PE.img){ toast('Load a photo first.',true); return; } PE.mode=(PE.mode===m)?'none':m; var bb=document.getElementById('peBrushBtn'),cb=document.getElementById('peCropBtn'); if(bb) bb.className='btn btn-sm'+(PE.mode==='brush'?' btn-primary':' btn-outline'); if(cb) cb.className='btn btn-sm'+(PE.mode==='crop'?' btn-primary':' btn-outline'); };
  window.MSpeAddText=function(){ if(!PE.img){ toast('Load a photo first.',true); return; } var t=prompt('Enter text to add:'); if(!t) return; PE.text=t; PE.mode='text'; toast('Tap on the photo to place the text.'); };
  window.MSpeReset=function(){ if(PE.img){ PE.baseFilter='none'; redraw(); } };
  function pos(ev){ var r=PE.canvas.getBoundingClientRect(); var cx=(ev.touches?ev.touches[0].clientX:ev.clientX)-r.left; var cy=(ev.touches?ev.touches[0].clientY:ev.clientY)-r.top; return { x:cx*(PE.canvas.width/r.width), y:cy*(PE.canvas.height/r.height) }; }
  function bindCanvas(){ var cv=PE.canvas; if(!cv||cv.__bound) return; cv.__bound=true;
    function down(e){ if(!PE.img) return; var p=pos(e); if(PE.mode==='brush'){ PE.drawing=true; PE.last=p; e.preventDefault(); } else if(PE.mode==='crop'){ PE.start=p; e.preventDefault(); } else if(PE.mode==='text'){ PE.ctx.save(); PE.ctx.fillStyle=PE.brush; PE.ctx.font='bold '+Math.max(16,PE.size*4)+'px sans-serif'; PE.ctx.textAlign='left'; PE.ctx.fillText(PE.text,p.x,p.y); PE.ctx.restore(); PE.mode='none'; } }
    function move(e){ if(!PE.img) return; if(PE.mode==='brush'&&PE.drawing){ var p=pos(e); PE.ctx.strokeStyle=PE.brush; PE.ctx.lineWidth=PE.size; PE.ctx.lineCap='round'; PE.ctx.beginPath(); PE.ctx.moveTo(PE.last.x,PE.last.y); PE.ctx.lineTo(p.x,p.y); PE.ctx.stroke(); PE.last=p; e.preventDefault(); } }
    function up(e){ if(PE.mode==='crop'&&PE.start){ var p=pos(e); var x=Math.min(PE.start.x,p.x),y=Math.min(PE.start.y,p.y),w=Math.abs(p.x-PE.start.x),h=Math.abs(p.y-PE.start.y); if(w>8&&h>8){ var data=PE.ctx.getImageData(x,y,w,h); PE.canvas.width=w; PE.canvas.height=h; PE.ctx.putImageData(data,0,0); var tmp=new Image(); tmp.onload=function(){ PE.img=tmp; PE.baseFilter='none'; }; tmp.src=PE.canvas.toDataURL(); } PE.start=null; PE.mode='none'; var cb=document.getElementById('peCropBtn'); if(cb) cb.className='btn btn-sm btn-outline'; } PE.drawing=false; }
    cv.addEventListener('mousedown',down); cv.addEventListener('mousemove',move); window.addEventListener('mouseup',up);
    cv.addEventListener('touchstart',down,{passive:false}); cv.addEventListener('touchmove',move,{passive:false}); cv.addEventListener('touchend',up); }
  window.MSpeExport=function(){ if(!PE.img){ toast('Load a photo first.',true); return; } try{ var url=PE.canvas.toDataURL('image/png'); var a=document.createElement('a'); a.href=url; a.download='creator-hub-edit-'+Date.now()+'.png'; document.body.appendChild(a); a.click(); document.body.removeChild(a); toast('Saved to your downloads.'); }catch(e){ toast('Export failed on this device.',true); } };
  // ---- Audit ----
  window.auditMediaStudio=function(){ var issues=[],ok=[]; if(GSTRINGS.length!==6) issues.push('Guitar strings != 6'); GSTRINGS.forEach(function(s){ if(!(s.f>0)) issues.push('Bad freq '+s.n); }); if(typeof autoCorrelate!=='function') issues.push('Pitch detector missing'); ok.push('Tuner strings: '+GSTRINGS.length); ok.push('AudioContext: '+((window.AudioContext||window.webkitAudioContext)?'available':'MISSING')); ok.push('getUserMedia: '+((navigator.mediaDevices&&navigator.mediaDevices.getUserMedia)?'available':'not available (live tuner disabled)')); var rep={pass:issues.length===0,issues:issues,info:ok}; console.log('[auditMediaStudio]',rep); return rep; };

  function boot(){ injectCSS(); if(R.registerPages) R.registerPages(PAGES); if(R.ensureContainers) R.ensureContainers(PAGES); if(R.hookNavigate) R.hookNavigate({ 'studio':renderStudio }); if(R.addNavLink) R.addNavLink('tiktok','studio','\uD83C\uDFB5 Studio'); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
