/* native-bridge.js — Creator Hub Android native integration shim.
 *
 * Loaded only inside the Android app (where window.CreatorHubNative exists).
 * In a normal browser it is inert. It:
 *   1. Routes navigator.geolocation through the real Android GPS bridge so the
 *      Leaflet map / live tracking receive genuine device positions (and the
 *      runtime location permission is requested on demand).
 *   2. Provides safe global callback handlers the native layer invokes
 *      (__ch_onLocation / __ch_onSpeechError) so bridge calls never throw.
 *   3. Reports uncaught JS errors to the native log for diagnostics.
 */
(function () {
  'use strict';
  var N = window.CreatorHubNative;
  if (!N) return; // running in a plain browser — leave everything untouched.

  // ---- location callback fan-out -------------------------------------
  var geoWatchers = {};      // id -> {success, error}
  var nextWatchId = 1;
  var lastFix = null;

  window.__ch_onLocation = function (lat, lng, accuracy) {
    lastFix = {
      coords: {
        latitude: lat, longitude: lng, accuracy: accuracy,
        altitude: null, altitudeAccuracy: null, heading: null, speed: null
      },
      timestamp: Date.now()
    };
    for (var id in geoWatchers) {
      if (geoWatchers.hasOwnProperty(id) && typeof geoWatchers[id].success === 'function') {
        try { geoWatchers[id].success(lastFix); } catch (e) {}
      }
    }
  };

  window.__ch_onSpeechError = function (code) {
    var s = document.getElementById('voiceCommandStatus');
    if (s) {
      if (code === 'unavailable') s.textContent = 'Speech recognition is not available on this device.';
      else if (code === '9' || code === '7') s.textContent = 'No speech was detected. Please try again.';
      else s.textContent = 'Voice recognition stopped (' + code + ').';
    }
  };

  function ensureLocationPermission() {
    try {
      if (N.hasLocationPermission && !N.hasLocationPermission() && N.requestLocationPermission) {
        N.requestLocationPermission();
      }
    } catch (e) {}
  }

  // ---- override navigator.geolocation to use native GPS --------------
  if (navigator.geolocation && N.startLocationUpdates) {
    var nativeGeo = {
      getCurrentPosition: function (success, error, opts) {
        ensureLocationPermission();
        try { N.startLocationUpdates(); } catch (e) {}
        // Return a cached fix immediately if we have one…
        if (lastFix && typeof success === 'function') { try { success(lastFix); } catch (e) {} return; }
        // …otherwise register a one-shot watcher.
        var id = nextWatchId++;
        geoWatchers[id] = {
          success: function (pos) { delete geoWatchers[id]; if (typeof success === 'function') success(pos); },
          error: error
        };
        // Try to seed from the native cache too.
        try {
          var j = N.getCurrentLocation && JSON.parse(N.getCurrentLocation());
          if (j && j.ok) window.__ch_onLocation(j.lat, j.lng, j.accuracy);
        } catch (e) {}
        setTimeout(function () {
          if (geoWatchers[id]) {
            delete geoWatchers[id];
            if (typeof error === 'function') { try { error({ code: 3, message: 'Location timeout' }); } catch (e) {} }
          }
        }, (opts && opts.timeout) || 15000);
      },
      watchPosition: function (success, error, opts) {
        ensureLocationPermission();
        try { N.startLocationUpdates(); } catch (e) {}
        var id = nextWatchId++;
        geoWatchers[id] = { success: success, error: error };
        if (lastFix && typeof success === 'function') { try { success(lastFix); } catch (e) {} }
        return id;
      },
      clearWatch: function (id) {
        delete geoWatchers[id];
        var remaining = 0; for (var k in geoWatchers) if (geoWatchers.hasOwnProperty(k)) remaining++;
        if (remaining === 0) { try { N.stopLocationUpdates && N.stopLocationUpdates(); } catch (e) {} }
      }
    };
    try {
      Object.defineProperty(navigator, 'geolocation', { value: nativeGeo, configurable: true });
    } catch (e) {
      try { navigator.geolocation.getCurrentPosition = nativeGeo.getCurrentPosition;
            navigator.geolocation.watchPosition = nativeGeo.watchPosition;
            navigator.geolocation.clearWatch = nativeGeo.clearWatch; } catch (e2) {}
    }
  }

  // ---- forward uncaught JS errors to native diagnostics --------------
  window.addEventListener('error', function (ev) {
    try { N.logError && N.logError((ev.message || 'error') + ' @ ' + (ev.filename || '') + ':' + (ev.lineno || 0)); } catch (e) {}
  });
  window.addEventListener('unhandledrejection', function (ev) {
    try { N.logError && N.logError('promise: ' + (ev.reason && (ev.reason.message || ev.reason))); } catch (e) {}
  });

  // Signal readiness for any listeners.
  try { document.dispatchEvent(new Event('creatorhub-native-ready')); } catch (e) {}
})();
