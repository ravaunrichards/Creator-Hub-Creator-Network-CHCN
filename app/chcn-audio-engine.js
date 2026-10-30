/* ============================================================================
 * CHCN Audio Engine (v52) — ADDITIVE, reusable Web Audio synthesis
 * ----------------------------------------------------------------------------
 * Media Studio previously had a PIANO + DRUM pads + a guitar TUNER, but NO
 * playable guitar instrument. This file adds:
 *   - CHCNAudio: a shared, offline Web-Audio engine (shared AudioContext,
 *     Karplus-Strong plucked-string synth + simple tone synth), reusable by
 *     any part of the app.
 *   - A playable GUITAR and BASS fretboard, injected into the existing
 *     Media Studio "Virtual Instruments" panel without rewriting it.
 * Everything is generated live — no audio files — so it works fully offline.
 * ========================================================================= */
(function () {
  'use strict';

  var AC = null;
  function ctx() {
    if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; } }
    if (AC && AC.state === 'suspended') { try { AC.resume(); } catch (e) {} }
    return AC;
  }
  var NOTE_NAMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
  function noteFreq(midi) { return 440 * Math.pow(2, (midi - 69) / 12); }
  function nameToMidi(name, oct) { return (oct + 1) * 12 + NOTE_NAMES.indexOf(name); }

  /* ---- Karplus-Strong plucked string: fills an AudioBuffer with a decaying
     string tone, then plays it through a gentle "body" resonance so a guitar
     sounds like a plucked string rather than a beep. ---- */
  function pluck(freq, opts) {
    var c = ctx(); if (!c || !freq) return;
    opts = opts || {};
    var dur = opts.dur || 1.8;
    var damp = opts.damp == null ? 0.995 : opts.damp; // closer to 1 = longer sustain
    var sr = c.sampleRate;
    var N = Math.max(2, Math.round(sr / freq));
    var len = Math.floor(sr * dur);
    var buf = c.createBuffer(1, len, sr);
    var d = buf.getChannelData(0);
    // initial noise burst (the "pluck")
    for (var i = 0; i < N && i < len; i++) d[i] = (Math.random() * 2 - 1);
    // feedback low-pass delay line
    for (var n = N; n < len; n++) {
      var a = d[n - N];
      var b = d[n - N + 1] != null ? d[n - N + 1] : d[n - N];
      d[n] = damp * 0.5 * (a + b);
    }
    var src = c.createBufferSource(); src.buffer = buf;
    // body resonance: two gentle peaking filters emulate a guitar body
    var body1 = c.createBiquadFilter(); body1.type = 'peaking'; body1.frequency.value = 110; body1.gain.value = 4; body1.Q.value = 1;
    var body2 = c.createBiquadFilter(); body2.type = 'peaking'; body2.frequency.value = 400; body2.gain.value = 3; body2.Q.value = 1.2;
    var lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = opts.bass ? 2600 : 5200;
    var g = c.createGain(); g.gain.value = opts.gain == null ? 0.9 : opts.gain;
    src.connect(body1); body1.connect(body2); body2.connect(lp); lp.connect(g); g.connect(c.destination);
    src.start();
    return src;
  }

  // simple tone synth (reusable for melodic UI, feedback blips, etc.)
  function tone(freq, opts) {
    var c = ctx(); if (!c || !freq) return;
    opts = opts || {};
    var o = c.createOscillator(), g = c.createGain();
    o.type = opts.type || 'triangle'; o.frequency.value = freq;
    o.connect(g); g.connect(c.destination);
    var t = c.currentTime, dur = opts.dur || 0.9, peak = opts.gain == null ? 0.3 : opts.gain;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.start(t); o.stop(t + dur + 0.05);
    return o;
  }

  window.CHCNAudio = {
    ctx: ctx, pluck: pluck, tone: tone,
    noteFreq: noteFreq, nameToMidi: nameToMidi, NOTE_NAMES: NOTE_NAMES
  };
  // ================= PLAYABLE GUITAR / BASS FRETBOARD =================
  var GUITAR = { name: 'Guitar', frets: 12, strings: [64, 59, 55, 50, 45, 40], bass: false }; // E4 B3 G3 D3 A2 E2
  var BASS = { name: 'Bass', frets: 12, strings: [43, 38, 33, 28], bass: true };            // G2 D2 A1 E1
  var activeInst = GUITAR;

  function escA(s){ var d=document.createElement('div'); d.textContent=s==null?'':String(s); return d.innerHTML; }
  function noteLabel(midi){ return CHCNAudio.NOTE_NAMES[((midi%12)+12)%12] + (Math.floor(midi/12)-1); }

  function injectCSS() {
    if (document.getElementById('chcn-ae-css')) return;
    var s = document.createElement('style'); s.id = 'chcn-ae-css';
    s.textContent =
      '.ae-wrap{margin-top:18px;border-top:1px solid #e5e7eb;padding-top:14px}'+
      '.ae-head{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:10px}'+
      '.ae-tab{padding:6px 12px;border:1px solid #cbd5e1;border-radius:999px;background:#f8fafc;cursor:pointer;font-size:13px}'+
      '.ae-tab.on{background:#0f172a;color:#fff;border-color:#0f172a}'+
      '.ae-fb{overflow-x:auto;border:1px solid #cbd5e1;border-radius:10px;background:#3b2a1a;padding:8px}'+
      '.ae-row{display:flex;align-items:stretch;gap:0}'+
      '.ae-open{min-width:46px;display:flex;align-items:center;justify-content:center;color:#f8fafc;font-weight:700;font-size:12px;background:#1f1206;border-radius:6px 0 0 6px}'+
      '.ae-fret{min-width:52px;height:38px;border-left:2px solid #caa472;display:flex;align-items:center;justify-content:center;color:#f3e8d8;font-size:12px;cursor:pointer;user-select:none;background:#4a3824}'+
      '.ae-fret:hover{background:#6b4f2e}.ae-fret:active{background:#caa472;color:#2a1c0c}'+
      '.ae-nut .ae-fret:first-child{border-left:6px solid #e7e2d8}'+
      '.ae-marks{display:flex;color:#94a3b8;font-size:11px;padding-left:46px}'+
      '.ae-marks span{min-width:52px;text-align:center}'+
      '.ae-hint{color:#64748b;font-size:12px;margin-top:8px}';
    document.head.appendChild(s);
  }

  function buildFretboard(inst) {
    var h = '<div class="ae-fb"><div class="ae-nut">';
    inst.strings.forEach(function (open, si) {
      h += '<div class="ae-row" data-str="' + si + '">';
      h += '<div class="ae-open">' + escA(noteLabel(open)) + '</div>';
      for (var f = 0; f <= inst.frets; f++) {
        var midi = open + f;
        h += '<div class="ae-fret" data-midi="' + midi + '" title="' + escA(noteLabel(midi)) + '">' + (f === 0 ? '' : escA(noteLabel(midi))) + '</div>';
      }
      h += '</div>';
    });
    h += '</div></div>';
    // fret-marker numbers
    h += '<div class="ae-marks"><span></span>';
    for (var k = 1; k <= inst.frets; k++) h += '<span>' + ([3,5,7,9,12].indexOf(k) !== -1 ? k : '') + '</span>';
    h += '</div>';
    return h;
  }

  function render(panel) {
    injectCSS();
    var wrap = panel.querySelector('#ae-wrap');
    if (!wrap) { wrap = document.createElement('div'); wrap.id = 'ae-wrap'; wrap.className = 'ae-wrap'; panel.appendChild(wrap); }
    wrap.innerHTML =
      '<h4 style="margin:4px 0 6px;">\ud83c\udfb8 Playable String Instruments</h4>'+
      '<div class="ae-head">'+
        '<button class="ae-tab' + (activeInst===GUITAR?' on':'') + '" data-inst="guitar">\ud83c\udfb8 Guitar</button>'+
        '<button class="ae-tab' + (activeInst===BASS?' on':'') + '" data-inst="bass">\ud83c\udfb8 Bass</button>'+
      '</div>'+
      '<div id="ae-board">' + buildFretboard(activeInst) + '</div>'+
      '<p class="ae-hint">Standard tuning. Tap any fret to pluck that note \u2014 the string tone is synthesised live with a Karplus-Strong model (no audio files, fully offline). Open-string notes are shown on the left; fret-marker numbers are below.</p>';
    wrap.querySelectorAll('.ae-tab').forEach(function (b) {
      b.onclick = function () { activeInst = b.getAttribute('data-inst') === 'bass' ? BASS : GUITAR; render(panel); };
    });
    var board = wrap.querySelector('#ae-board');
    function play(e) {
      var t = e.target.closest ? e.target.closest('.ae-fret') : null;
      if (!t) return;
      var midi = parseInt(t.getAttribute('data-midi'), 10);
      if (isNaN(midi)) return;
      CHCNAudio.pluck(CHCNAudio.noteFreq(midi), { bass: activeInst.bass, dur: activeInst.bass ? 2.4 : 1.8, damp: activeInst.bass ? 0.997 : 0.995 });
      e.preventDefault();
    }
    board.addEventListener('mousedown', play);
    board.addEventListener('touchstart', play, { passive: false });
  }

  // Hook the existing Media Studio panel switcher without rewriting it:
  // after the "Virtual Instruments" panel renders, append our fretboard.
  function install() {
    if (typeof window.MSshow === 'function' && !window.MSshow.__chcnAE) {
      var orig = window.MSshow;
      window.MSshow = function (k) {
        var r = orig.apply(this, arguments);
        if (k === 'inst') { var p = document.getElementById('msPanel'); if (p) setTimeout(function () { render(p); }, 40); }
        return r;
      };
      window.MSshow.__chcnAE = true;
    }
    // expose a direct opener too
    window.CHCNAudio.renderFretboard = render;
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install); else install();
  // MSshow may be (re)defined after us; retry once shortly.
  setTimeout(install, 800);
})();
