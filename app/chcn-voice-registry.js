/* =============================================================================
 * Creator Hub Creator Network — REAL VOICE REGISTRY
 * -----------------------------------------------------------------------------
 * Fixes the previously-blank voice selection screen by guaranteeing the
 * "Voice" dropdown ALWAYS has selectable, previewable entries, even on devices
 * / WebViews that do not enumerate any SpeechSynthesis voices.
 *
 * Every registry voice carries: voiceId, displayName, language, presentation,
 * provider, preview (bundled sample), status and capabilities.
 *
 * HONEST SCOPE:
 *  - The bundled .wav files are REAL preview samples and play on tap.
 *  - Production text-to-speech synthesis with the Cartesia provider requires a
 *    server-side Cartesia API key (NOT bundled, NOT configured here). Until a
 *    key is configured, selecting a Cartesia voice uses the sample for preview
 *    and read-aloud falls back to the closest available on-device voice.
 *  - No API keys or secrets are stored in this file or the app.
 * ========================================================================== */
(function (global) {
  'use strict';

  // Canonical registry — one entry per bundled preview sample.
  var REGISTRY = [
    { voiceId: 'cartesia-ariana',         displayName: 'Ariana',          language: 'en', presentation: 'female',      provider: 'Cartesia', preview: 'voices/cartesia-ariana.wav',         status: 'preview', capabilities: ['read-aloud','assistant'] },
    { voiceId: 'cartesia-fiona',          displayName: 'Fiona',           language: 'en', presentation: 'female',      provider: 'Cartesia', preview: 'voices/cartesia-fiona.wav',          status: 'preview', capabilities: ['read-aloud','assistant'] },
    { voiceId: 'cartesia-elena-narrator', displayName: 'Elena (Narrator)',language: 'en', presentation: 'female',      provider: 'Cartesia', preview: 'voices/cartesia-elena-narrator.wav', status: 'preview', capabilities: ['read-aloud','narration'] },
    { voiceId: 'cartesia-blake',          displayName: 'Blake',           language: 'en', presentation: 'male',        provider: 'Cartesia', preview: 'voices/cartesia-blake.wav',          status: 'preview', capabilities: ['read-aloud','assistant'] },
    { voiceId: 'cartesia-brandon',        displayName: 'Brandon',         language: 'en', presentation: 'male',        provider: 'Cartesia', preview: 'voices/cartesia-brandon.wav',        status: 'preview', capabilities: ['read-aloud','assistant'] },
    { voiceId: 'cartesia-camila',         displayName: 'Camila',          language: 'es', presentation: 'female',      provider: 'Cartesia', preview: 'voices/cartesia-camila.wav',         status: 'preview', capabilities: ['read-aloud','assistant'] },
    { voiceId: 'cartesia-daniela',        displayName: 'Daniela',         language: 'es', presentation: 'female',      provider: 'Cartesia', preview: 'voices/cartesia-daniela.wav',        status: 'preview', capabilities: ['read-aloud','assistant'] },
    { voiceId: 'cartesia-hao',            displayName: 'Hao',             language: 'zh', presentation: 'male',        provider: 'Cartesia', preview: 'voices/cartesia-hao.wav',            status: 'preview', capabilities: ['read-aloud','assistant'] },
    { voiceId: 'cartesia-hua',            displayName: 'Hua',             language: 'zh', presentation: 'female',      provider: 'Cartesia', preview: 'voices/cartesia-hua.wav',            status: 'preview', capabilities: ['read-aloud','assistant'] }
  ];

  // Public, read-only accessors used by the app / APK / iPhone web build.
  global.CHCN_VOICE_REGISTRY = REGISTRY.slice();
  global.CHCN = global.CHCN || {};
  global.CHCN.Voices = {
    all: function () { return REGISTRY.slice(); },
    byId: function (id) { for (var i = 0; i < REGISTRY.length; i++) if (REGISTRY[i].voiceId === id) return REGISTRY[i]; return null; },
    byLanguage: function (lang) { return REGISTRY.filter(function (v) { return v.language === lang; }); }
  };

  function langLabel(code) {
    var m = { en: 'English', es: 'Spanish', zh: 'Chinese', fr: 'French', de: 'German', pt: 'Portuguese' };
    return m[code] || code;
  }

  // Single shared <audio> for sample preview playback.
  var previewAudio = null;
  function playPreview(url) {
    try {
      if (!previewAudio) previewAudio = new Audio();
      previewAudio.pause();
      previewAudio.src = url;
      previewAudio.currentTime = 0;
      var p = previewAudio.play();
      if (p && p.catch) p.catch(function () {});
    } catch (e) {}
  }

  // Inject registry voices into the #voiceSelect dropdown as a labelled group,
  // and ensure a working ▶ Preview button exists beside it.
  function enhanceVoiceSelect() {
    var sel = document.getElementById('voiceSelect');
    if (!sel) return;
    if (sel.querySelector('optgroup[data-chcn-reg="1"]')) return; // already injected

    var og = document.createElement('optgroup');
    og.label = 'Creator Hub Voices (preview samples)';
    og.setAttribute('data-chcn-reg', '1');
    REGISTRY.forEach(function (v) {
      var o = document.createElement('option');
      o.value = v.voiceId;
      o.textContent = v.displayName + ' — ' + langLabel(v.language) + ' (' + v.presentation + ', ' + v.provider + ')';
      o.setAttribute('data-preview', v.preview);
      og.appendChild(o);
    });
    // Put the curated voices first so the panel is never empty.
    if (sel.firstChild) sel.insertBefore(og, sel.firstChild);
    else sel.appendChild(og);

    // Restore persisted selection if it is one of ours.
    try {
      var S = global.CHCN && global.CHCN.Settings;
      var saved = S ? S.get('selectedVoiceId', '') : (localStorage.getItem('chcn_selected_voice') || '');
      if (saved) sel.value = saved;
    } catch (e) {}

    // Add a Preview button right after the select, once.
    if (!document.getElementById('voicePreviewBtn')) {
      var btn = document.createElement('button');
      btn.id = 'voicePreviewBtn';
      btn.type = 'button';
      btn.className = 'btn btn-outline';
      btn.style.marginTop = '8px';
      btn.textContent = '▶ Preview voice';
      btn.addEventListener('click', function () {
        var opt = sel.options[sel.selectedIndex];
        var url = opt && opt.getAttribute('data-preview');
        if (url) { playPreview(url); return; }
        // Device voice: speak a short sample through the existing read-aloud path.
        if (global.CHCN && global.CHCN.Voice && typeof global.CHCN.Voice.speak === 'function') {
          global.CHCN.Voice.speak('This is a preview of the selected voice.');
        } else if (global.speechSynthesis) {
          try {
            var u = new SpeechSynthesisUtterance('This is a preview of the selected voice.');
            var idx = parseInt(sel.value, 10);
            var dv = global.speechSynthesis.getVoices();
            if (!isNaN(idx) && dv[idx]) u.voice = dv[idx];
            global.speechSynthesis.cancel();
            global.speechSynthesis.speak(u);
          } catch (e) {}
        }
      });
      sel.parentNode.insertBefore(btn, sel.nextSibling);
    }

    // Persist selection changes (registry voices use their voiceId).
    sel.addEventListener('change', function () {
      try {
        var S = global.CHCN && global.CHCN.Settings;
        if (S) S.set('selectedVoiceId', sel.value);
        localStorage.setItem('chcn_selected_voice', sel.value);
      } catch (e) {}
    });
  }

  // Wrap the app's openVoiceHub so our voices are injected every time the panel
  // opens (after the app has populated device voices). Non-destructive.
  function wrapOpen() {
    var orig = global.openVoiceHub;
    if (typeof orig === 'function' && !orig.__chcnWrapped) {
      var wrapped = function () {
        var r = orig.apply(this, arguments);
        setTimeout(enhanceVoiceSelect, 60);
        return r;
      };
      wrapped.__chcnWrapped = true;
      global.openVoiceHub = wrapped;
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { wrapOpen(); enhanceVoiceSelect(); });
  } else {
    wrapOpen(); enhanceVoiceSelect();
  }
  // Also re-wrap shortly after load in case openVoiceHub is defined later.
  setTimeout(wrapOpen, 400);
})(typeof window !== 'undefined' ? window : this);
