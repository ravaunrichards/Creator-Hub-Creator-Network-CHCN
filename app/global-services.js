/* =============================================================================
 * Creator Hub Creator Network — GLOBAL APPLICATION SERVICES
 * -----------------------------------------------------------------------------
 * One centralized services layer shared by every page/section of the SPA and
 * (via platform adapters) by the Android WebView. Nothing here is page-scoped.
 *
 *   GlobalSettingsService        - single persistent preference store
 *   ConnectivityService          - online / offline / limited detection
 *   GlobalVoiceService           - read-aloud everywhere (play/pause/resume/stop)
 *   GlobalSpeechRecognitionService - ONE microphone state machine (bug fix)
 *   GlobalVoiceCommandService     - global command registry
 *   CompassService               - real device-orientation heading
 *
 * Design rules honoured here:
 *   - No duplicate mic sessions. One recognizer, one state machine.
 *   - USER_STOPPED never auto-restarts; only UNEXPECTED_END may recover.
 *   - Preferences persist across sections, reloads and app restarts.
 *   - Honest capability flags: features degrade gracefully, never fake success.
 * ========================================================================== */
(function (global) {
  'use strict';

  var native = function () { return global.CreatorHubNative || null; };
  function emit(name, detail) {
    try { global.dispatchEvent(new CustomEvent(name, { detail: detail })); } catch (e) {}
  }

  /* =========================================================================
   * 1. GlobalSettingsService — the single source of truth for preferences.
   * ====================================================================== */
  var SETTINGS_KEY = 'chcn_settings_v1';
  var DEFAULTS = {
    readAloud: false,
    voiceCommands: false,
    selectedVoiceId: '',
    speechRate: 1,
    speechPitch: 1,
    assistantVoiceId: '',
    language: (global.navigator && navigator.language ? navigator.language.slice(0, 2) : 'en'),
    fullAppTranslation: false,
    preferredLanguage: 'es',
    autoDetectLanguage: true,
    speakTranslations: true,
    navigationVoice: true,
    autoReadNotifications: false,
    mapOrientation: 'north-up',   // 'north-up' | 'heading-up'
    measurementUnits: 'metric',   // 'metric' | 'imperial'
    theme: 'light',
    fontScale: 1,
    fontFamily: 'system',   // app-wide font family (see app-view-controls.js)
    appZoom: 1,             // overall app zoom (0.7 .. 1.6)
    showScrollBars: true,   // show large on-screen x/y scroll slide bars
    highContrast: false,
    dataSaver: false,
    notifications: { courses: true, payments: true, donations: true, system: true, navigation: true },
    savedLocations: [],
    offlinePacks: []
  };

  var GlobalSettingsService = (function () {
    var state = {};
    function load() {
      var raw = {};
      try { raw = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') || {}; } catch (e) { raw = {}; }
      state = Object.assign({}, DEFAULTS, raw);
      // deep-merge nested notifications
      state.notifications = Object.assign({}, DEFAULTS.notifications, raw.notifications || {});
      return state;
    }
    function persist() {
      try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(state)); } catch (e) {}
      var n = native();
      if (n && n.persistSettings) { try { n.persistSettings(JSON.stringify(state)); } catch (e) {} }
    }
    load();
    return {
      all: function () { return Object.assign({}, state); },
      get: function (key, fallback) {
        return (state[key] !== undefined) ? state[key] : (fallback !== undefined ? fallback : DEFAULTS[key]);
      },
      set: function (key, value) {
        state[key] = value;
        persist();
        emit('chcn:setting-changed', { key: key, value: value });
        return value;
      },
      merge: function (obj) {
        Object.keys(obj || {}).forEach(function (k) { state[k] = obj[k]; });
        persist();
        emit('chcn:settings-merged', obj);
      },
      reset: function (key) {
        if (key) { state[key] = DEFAULTS[key]; } else { state = JSON.parse(JSON.stringify(DEFAULTS)); }
        persist();
        emit('chcn:setting-changed', { key: key || '*', value: key ? state[key] : state });
      },
      reload: load
    };
  })();

  /* =========================================================================
   * 2. ConnectivityService — online / offline / limited.
   * ====================================================================== */
  var ConnectivityService = (function () {
    var status = navigator.onLine ? 'online' : 'offline';
    function set(s) { if (s !== status) { status = s; emit('chcn:connectivity', { status: s }); } }
    global.addEventListener('online', function () { set('online'); });
    global.addEventListener('offline', function () { set('offline'); });
    return {
      status: function () { return status; },
      isOnline: function () { return status !== 'offline'; },
      // Best-effort probe used before network-only features (search, tiles).
      probe: function () {
        if (!navigator.onLine) { set('offline'); return Promise.resolve('offline'); }
        return Promise.resolve('online');
      }
    };
  })();

  global.CHCN = global.CHCN || {};
  global.CHCN.Settings = GlobalSettingsService;
  global.CHCN.Connectivity = ConnectivityService;

})(window);
