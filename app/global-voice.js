/* =============================================================================
 * Creator Hub Creator Network — GLOBAL VOICE / SPEECH / COMMAND / COMPASS
 * Depends on global-services.js (window.CHCN.Settings, .Connectivity).
 * ========================================================================== */
(function (global) {
  'use strict';
  var CHCN = global.CHCN = global.CHCN || {};
  var S = CHCN.Settings;
  var native = function () { return global.CreatorHubNative || null; };
  function emit(n, d) { try { global.dispatchEvent(new CustomEvent(n, { detail: d })); } catch (e) {} }

  /* =========================================================================
   * 3. GlobalVoiceService — read-aloud available on EVERY page.
   * ====================================================================== */
  var GlobalVoiceService = (function () {
    var voices = [];
    var paused = false;

    function loadVoices() {
      var n = native();
      if (n && n.getVoicesJson) {
        try {
          var arr = JSON.parse(n.getVoicesJson());
          voices = arr.map(function (v) { return { name: v.name, lang: v.locale, id: v.id, native: true }; });
        } catch (e) {}
      }
      if ((!voices || !voices.length) && global.speechSynthesis) {
        voices = global.speechSynthesis.getVoices() || [];
      }
      emit('chcn:voices-loaded', { count: voices.length });
      return voices;
    }
    if (global.speechSynthesis) {
      global.speechSynthesis.onvoiceschanged = loadVoices;
    }

    function currentVoiceObj() {
      var id = S.get('selectedVoiceId', '');
      if (!id) return null;
      for (var i = 0; i < voices.length; i++) {
        if (String(voices[i].id) === String(id) || voices[i].name === id) return voices[i];
      }
      return null; // graceful fallback to default voice
    }

    function speak(text) {
      if (!text) return;
      var rate = parseFloat(S.get('speechRate', 1)) || 1;
      var pitch = parseFloat(S.get('speechPitch', 1)) || 1;
      var voice = currentVoiceObj();
      var n = native();
      if (n && n.speak) {
        try { n.speak(text, voice && voice.id ? voice.id : '', rate, pitch); return; } catch (e) {}
      }
      if (!global.speechSynthesis) { emit('chcn:voice-unavailable', {}); return; }
      global.speechSynthesis.cancel();
      paused = false;
      var u = new SpeechSynthesisUtterance(text);
      if (voice && voice instanceof SpeechSynthesisVoice) u.voice = voice;
      else if (voice && voice.native !== true) { try { u.voice = voice; } catch (e) {} }
      u.rate = rate; u.pitch = pitch;
      u.onend = function () { emit('chcn:read-ended', {}); };
      global.speechSynthesis.speak(u);
      emit('chcn:read-started', {});
    }

    function stop() {
      paused = false;
      var n = native();
      if (n && n.stopSpeaking) { try { n.stopSpeaking(); } catch (e) {} }
      if (global.speechSynthesis) global.speechSynthesis.cancel();
      emit('chcn:read-stopped', {});
    }

    // Pull the meaningful content of the visible page/section, not every node.
    function currentPageText() {
      var visible = null;
      var pages = document.querySelectorAll('[id^="page-"]');
      for (var i = 0; i < pages.length; i++) {
        if (pages[i].offsetParent !== null && pages[i].style.display !== 'none') { visible = pages[i]; break; }
      }
      var root = visible || document.querySelector('main') || document.body;
      var parts = [];
      root.querySelectorAll('h1,h2,h3,h4,p,li,.voice-status,[aria-live]').forEach(function (el) {
        if (el.offsetParent === null) return;
        var t = (el.innerText || '').trim();
        if (t && t.length > 1) parts.push(t);
      });
      return parts.join('. ').slice(0, 6000) || (root.innerText || '').slice(0, 6000);
    }

    return {
      init: loadVoices,
      getVoices: function () { return voices.slice(); },
      speak: speak,
      stop: stop,
      pause: function () { if (global.speechSynthesis) { global.speechSynthesis.pause(); paused = true; } },
      resume: function () { if (global.speechSynthesis && paused) { global.speechSynthesis.resume(); paused = false; } },
      readCurrentPage: function () { if (S.get('readAloud')) speak(currentPageText()); },
      readText: function (t) { if (S.get('readAloud')) speak(t); },
      // Speak regardless of the read-aloud toggle (confirmations, command echoes).
      announce: function (t) { speak(t); },
      readSelection: function () {
        var sel = (global.getSelection && global.getSelection().toString()) || '';
        if (sel) speak(sel); else emit('chcn:no-selection', {});
      },
      setReadAloud: function (on) {
        S.set('readAloud', !!on);
        if (!on) stop();
        emit('chcn:read-aloud-toggled', { on: !!on });
      },
      isReadAloud: function () { return !!S.get('readAloud'); }
    };
  })();

  /* =========================================================================
   * 4. GlobalSpeechRecognitionService — ONE microphone. THE BUG FIX.
   *    States: OFF, STARTING, LISTENING, PROCESSING, STOPPING, ERROR.
   *    Distinguishes USER_STOPPED from UNEXPECTED_END so the mic never
   *    silently re-arms after the user turns it off.
   * ====================================================================== */
  var MicService = (function () {
    var SR = global.SpeechRecognition || global.webkitSpeechRecognition;
    var rec = null;
    var state = 'OFF';
    var stopReason = null;     // 'USER_STOPPED' | 'UNEXPECTED_END' | null
    var onTranscript = null;
    var keepAlive = false;     // user wants voice ON until they turn it OFF
    var lastError = null;      // last recognizer error code
    var restartTimes = [];     // timestamps of recent auto-restarts (thrash guard)
    var restartTimer = null;

    function setState(s) { state = s; emit('chcn:mic-state', { state: s }); }
    function usingNative() { var n = native(); return !!(n && n.startListening); }

    // Map the app language to a full BCP-47 recognizer locale.
    var LANG_MAP = {
      en: 'en-US', es: 'es-ES', fr: 'fr-FR', de: 'de-DE', it: 'it-IT', pt: 'pt-BR',
      nl: 'nl-NL', zh: 'zh-CN', ja: 'ja-JP', ko: 'ko-KR', hi: 'hi-IN', ar: 'ar-SA',
      ru: 'ru-RU', tr: 'tr-TR', pl: 'pl-PL', sv: 'sv-SE', id: 'id-ID', vi: 'vi-VN', th: 'th-TH'
    };
    function recognizerLang() {
      var lg = (S.get('language') || 'en');
      return LANG_MAP[lg] || (lg.indexOf('-') !== -1 ? lg : lg + '-' + lg.toUpperCase());
    }

    // A 'fatal' error means the user/OS denied the mic — do NOT loop and
    // re-prompt endlessly; go quiet and let the user tap again.
    function isFatal(err) {
      return err === 'not-allowed' || err === 'service-not-allowed' || err === 'audio-capture';
    }

    // Build a fresh browser recognizer and start it. Used for the first start
    // AND for silent continuous restarts (so one 'on' keeps working command
    // after command until the user turns it off).
    function armWeb() {
      if (!SR) { keepAlive = false; setState('ERROR'); emit('chcn:mic-unsupported', {}); return; }
      try { if (rec) { rec.onend = null; rec.onresult = null; rec.onerror = null; rec.abort(); } } catch (e) {}
      rec = new SR();
      rec.lang = recognizerLang();
      rec.continuous = true;
      rec.interimResults = true;
      rec.onresult = function (e) {
        setState('PROCESSING');
        for (var i = e.resultIndex; i < e.results.length; i++) {
          if (e.results[i].isFinal) {
            var txt = e.results[i][0].transcript.trim();
            emit('chcn:mic-final', { text: txt });
            if (onTranscript) { try { onTranscript(txt); } catch (er) {} }
          } else {
            emit('chcn:mic-interim', { text: e.results[i][0].transcript });
          }
        }
        // Stay LISTENING after a command instead of dropping to OFF.
        if (state !== 'STOPPING' && state !== 'OFF') setState('LISTENING');
      };
      rec.onerror = function (e) {
        lastError = e.error;
        emit('chcn:mic-error', { error: e.error });
        if (isFatal(e.error)) { keepAlive = false; setState('ERROR'); }
        // 'no-speech' / 'network' / 'aborted' are recoverable — onend restarts.
      };
      rec.onend = function () {
        rec = null;
        // CONTINUOUS LISTENING FIX: the browser recognizer ends on its own after
        // a result or a pause. As long as the user has NOT turned voice off and
        // the mic was not denied, silently re-arm so every subsequent command
        // keeps working. Permission is only prompted the first time per origin/
        // session, so restarting does not re-ask once the user has allowed it.
        if (keepAlive && stopReason !== 'USER_STOPPED' && !isFatal(lastError)) {
          scheduleRestart();
        } else {
          setState('OFF');
        }
      };
      try { rec.start(); lastError = null; setState('LISTENING'); }
      catch (e) {
        // start() throws if called too soon after the previous session ended.
        if (keepAlive) scheduleRestart(250); else setState('ERROR');
      }
    }

    // Restart with a small delay + a thrash circuit-breaker so a broken engine
    // can't spin in a tight loop (which would hammer the mic / battery).
    function scheduleRestart(delay) {
      var now = Date.now();
      restartTimes = restartTimes.filter(function (t) { return now - t < 10000; });
      restartTimes.push(now);
      if (restartTimes.length > 8) {
        // Too many restarts in 10s — something is wrong; stop cleanly.
        keepAlive = false; restartTimes = [];
        setState('ERROR');
        return;
      }
      if (restartTimer) clearTimeout(restartTimer);
      restartTimer = setTimeout(function () {
        restartTimer = null;
        if (keepAlive && stopReason !== 'USER_STOPPED') armWeb();
      }, delay || 350);
    }

    function start(handler) {
      if (state === 'LISTENING' || state === 'STARTING') return; // never two sessions
      onTranscript = handler || onTranscript;
      stopReason = null;
      keepAlive = true;
      restartTimes = [];
      setState('STARTING');
      var n = native();
      if (usingNative()) {
        try { n.startListening(); setState('LISTENING'); return; }
        catch (e) { setState('ERROR'); }
      }
      armWeb();
    }

    function stop(reason) {
      stopReason = reason || 'USER_STOPPED';
      keepAlive = false;
      if (restartTimer) { clearTimeout(restartTimer); restartTimer = null; }
      setState('STOPPING');
      var n = native();
      if (n && n.stopListening) { try { n.stopListening(); } catch (e) {} }
      if (rec) {
        try { rec.stop(); } catch (e) {}
        try { rec.abort(); } catch (e) {}
      }
      // Hard guarantee: after a user stop, drop the recognizer entirely.
      if (stopReason === 'USER_STOPPED') {
        if (rec) { try { rec.onend = null; rec.onresult = null; rec.onerror = null; } catch (e) {} }
        rec = null;
        setState('OFF');
      }
      document.querySelectorAll('.listening').forEach(function (x) { x.classList.remove('listening'); });
    }

    return {
      state: function () { return state; },
      isListening: function () { return state === 'LISTENING' || state === 'PROCESSING'; },
      start: start,
      stop: stop,
      // Native bridge pushes transcripts here.
      pushNativeTranscript: function (t) { if (onTranscript) { try { onTranscript(String(t)); } catch (e) {} } }
    };
  })();

  CHCN.Voice = GlobalVoiceService;
  CHCN.Mic = MicService;

})(window);
