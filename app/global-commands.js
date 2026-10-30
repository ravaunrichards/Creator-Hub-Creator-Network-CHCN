/* =============================================================================
 * Creator Hub Creator Network — GLOBAL VOICE COMMANDS + COMPASS + UI GLUE
 * Depends on global-services.js and global-voice.js.
 * ========================================================================== */
(function (global) {
  'use strict';
  var CHCN = global.CHCN = global.CHCN || {};
  var S = CHCN.Settings, V = CHCN.Voice, Mic = CHCN.Mic;
  function emit(n, d) { try { global.dispatchEvent(new CustomEvent(n, { detail: d })); } catch (e) {} }
  function go(page) { if (typeof global.navigate === 'function') global.navigate(page); }

  /* =========================================================================
   * 5. GlobalVoiceCommandService — an extensible command registry.
   *    Additional commands can be registered later via CHCN.Commands.register.
   * ====================================================================== */
  var CommandService = (function () {
    var registry = [];
    function register(patterns, handler, help) {
      registry.push({ patterns: patterns, handler: handler, help: help || '' });
    }
    function handle(raw) {
      var t = (raw || '').toLowerCase().trim();
      if (!t) return false;
      for (var i = 0; i < registry.length; i++) {
        var e = registry[i];
        for (var j = 0; j < e.patterns.length; j++) {
          var p = e.patterns[j];
          var matched = (p instanceof RegExp) ? p.test(t) : (t === p || t.indexOf(p) !== -1);
          if (matched) {
            var m = (p instanceof RegExp) ? t.match(p) : null;
            try { e.handler(t, m); } catch (er) {}
            return true;
          }
        }
      }
      return false;
    }
    return { register: register, handle: handle, list: function () { return registry.slice(); } };
  })();

  // ---- Built-in global commands (work from any page) ----
  CommandService.register(['go home', 'open home', 'home page'], function () { go('index'); V.announce('Going home.'); });
  CommandService.register(['open courses', 'show courses', 'my courses', 'courses'], function () { go('courses'); V.announce('Opening courses.'); });
  CommandService.register(['open my profile', 'open profile', 'my account', 'account'], function () { go('account'); V.announce('Opening your account.'); });
  CommandService.register(['open settings', 'settings'], function () { if (typeof global.openSettings === 'function') global.openSettings(); V.announce('Opening settings.'); });
  CommandService.register(['open map', 'show map', 'map'], function () { go('map'); V.announce('Opening the map.'); });
  CommandService.register(['open payments', 'open payment', 'payment', 'payments'], function () { go('payment'); V.announce('Opening payments.'); });
  CommandService.register(['open donations', 'open donation', 'donate', 'donation'], function () { go('payment'); var d = document.getElementById('donateSection'); if (d) d.scrollIntoView({ behavior: 'smooth' }); V.announce('Opening donations.'); });
  CommandService.register(['open dictionary', 'dictionary'], function () { if (global.openVoiceHub) global.openVoiceHub(); V.announce('Opening dictionary.'); });
  CommandService.register(['open phrasebook', 'phrasebook'], function () { if (global.openOfflineLanguagePack) global.openOfflineLanguagePack(); });
  CommandService.register([/^search (for )?(.+)/], function (t, m) {
    var q = m ? (m[2] || '').trim() : '';
    go('courses');
    var box = document.getElementById('filterSearch');
    if (box) { box.value = q; if (typeof global.filterCourses === 'function') global.filterCourses(); }
    V.announce('Searching for ' + q + '.');
  });
  CommandService.register(['read this page', 'read page', 'read aloud'], function () { S.set('readAloud', true); V.readCurrentPage(); });
  CommandService.register(['read this section', 'read section'], function () { S.set('readAloud', true); V.readCurrentPage(); });
  CommandService.register(['read selected text', 'read selection'], function () { V.readSelection(); });
  CommandService.register(['stop reading', 'stop', 'pause reading', 'quiet'], function () { V.stop(); });
  CommandService.register(['pause'], function () { V.pause(); });
  CommandService.register(['resume'], function () { V.resume(); });
  CommandService.register(['turn read aloud on', 'read aloud on', 'turn on read aloud'], function () { V.setReadAloud(true); V.announce('Read aloud is on.'); });
  CommandService.register(['turn read aloud off', 'read aloud off', 'turn off read aloud'], function () { V.setReadAloud(false); });
  CommandService.register(['turn voice commands off', 'turn off voice commands', 'stop listening', 'stop voice commands'], function () { global.chcnSetVoiceCommands(false); });
  CommandService.register(['increase speech speed', 'speak faster', 'faster'], function () { var r = Math.min(1.6, (parseFloat(S.get('speechRate')) || 1) + 0.15); S.set('speechRate', r); V.announce('Speech speed increased.'); });
  CommandService.register(['decrease speech speed', 'speak slower', 'slower'], function () { var r = Math.max(0.6, (parseFloat(S.get('speechRate')) || 1) - 0.15); S.set('speechRate', r); V.announce('Speech speed decreased.'); });
  CommandService.register(['translate this page', 'translate page'], function () { if (global.openVoiceHub) global.openVoiceHub(); V.announce('Opening translation.'); });
  CommandService.register([/translate this to (.+)/], function (t, m) { if (global.openVoiceHub) global.openVoiceHub(); V.announce('Opening translation to ' + (m ? m[1] : '') + '.'); });
  CommandService.register(['where am i', 'my location'], function () { go('map'); if (typeof global.locateMe === 'function') global.locateMe(); V.announce('Finding your location.'); });
  CommandService.register(['start navigation', 'take me to', 'find a route'], function () { go('map'); V.announce('Opening the route planner.'); });
  CommandService.register(['show compass', 'compass'], function () { go('map'); if (global.CHCN.Compass) global.CHCN.Compass.start(); V.announce('Showing the compass.'); });
  CommandService.register(['about us', 'open about'], function () { go('about'); V.announce('Opening about us.'); });
  CommandService.register(['contact us', 'open contact'], function () { go('contact'); V.announce('Opening contact.'); });
  CommandService.register(['go back'], function () { history.back(); });
  CommandService.register(['scroll down'], function () { global.scrollBy({ top: global.innerHeight * 0.8, behavior: 'smooth' }); });
  CommandService.register(['scroll up'], function () { global.scrollBy({ top: -global.innerHeight * 0.8, behavior: 'smooth' }); });

  function onCommand(txt) {
    emit('chcn:command-heard', { text: txt });
    if (!CommandService.handle(txt)) {
      V.announce('Sorry, that command is not available yet.');
    }
  }

  // Public helpers used by UI + commands themselves.
  global.chcnSetVoiceCommands = function (on) {
    S.set('voiceCommands', !!on);
    if (on) { Mic.start(onCommand); }
    else { Mic.stop('USER_STOPPED'); }
    emit('chcn:voice-commands-toggled', { on: !!on });
  };
  global.chcnToggleVoiceCommands = function () {
    global.chcnSetVoiceCommands(!S.get('voiceCommands'));
  };

  CHCN.Commands = CommandService;

  /* =========================================================================
   * 6. CompassService — real heading from device orientation sensors.
   *    Honest: if no sensor/permission, reports unavailable (no fake heading).
   * ====================================================================== */
  var CompassService = (function () {
    var running = false, heading = null, hasSensor = false, handler = null;
    function dirName(deg) {
      var dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
      return dirs[Math.round((deg % 360) / 45) % 8];
    }
    function onOrient(e) {
      var h = null;
      if (typeof e.webkitCompassHeading === 'number') h = e.webkitCompassHeading;      // iOS
      else if (e.absolute === true && typeof e.alpha === 'number') h = 360 - e.alpha;  // Android absolute
      else if (typeof e.alpha === 'number') h = 360 - e.alpha;
      if (h === null || isNaN(h)) return;
      hasSensor = true;
      h = (h + 360) % 360;
      // light smoothing to prevent jitter
      heading = (heading === null) ? h : heading + shortestAngle(heading, h) * 0.25;
      heading = (heading + 360) % 360;
      emit('chcn:heading', { heading: heading, direction: dirName(heading) });
      if (handler) handler(heading, dirName(heading));
    }
    function shortestAngle(a, b) { var d = ((b - a + 540) % 360) - 180; return d; }
    function start(cb) {
      handler = cb || handler;
      if (running) return;
      running = true;
      function attach() {
        if ('ondeviceorientationabsolute' in global) global.addEventListener('deviceorientationabsolute', onOrient, true);
        global.addEventListener('deviceorientation', onOrient, true);
      }
      // iOS 13+ permission gate
      if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
        DeviceOrientationEvent.requestPermission().then(function (r) { if (r === 'granted') attach(); else emit('chcn:compass-denied', {}); }).catch(function () { emit('chcn:compass-denied', {}); });
      } else { attach(); }
      // If no sensor reports within 2.5s, tell the UI to fall back to GPS bearing.
      setTimeout(function () { if (!hasSensor) emit('chcn:compass-unavailable', {}); }, 2500);
    }
    function stop() {
      running = false;
      global.removeEventListener('deviceorientation', onOrient, true);
      if ('ondeviceorientationabsolute' in global) global.removeEventListener('deviceorientationabsolute', onOrient, true);
    }
    function bearingTo(lat1, lon1, lat2, lon2) {
      var toRad = function (x) { return x * Math.PI / 180; }, toDeg = function (x) { return x * 180 / Math.PI; };
      var dLon = toRad(lon2 - lon1);
      var y = Math.sin(dLon) * Math.cos(toRad(lat2));
      var x = Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) - Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLon);
      return (toDeg(Math.atan2(y, x)) + 360) % 360;
    }
    return {
      start: start, stop: stop,
      heading: function () { return heading; },
      hasSensor: function () { return hasSensor; },
      directionName: dirName,
      bearingTo: bearingTo
    };
  })();
  CHCN.Compass = CompassService;

  /* =========================================================================
   * Native bridge hooks (Android WebView pushes here).
   * ====================================================================== */
  global.__creatorHubHandleNativeTranscript = function (text) { Mic.pushNativeTranscript(text); };

  /* =========================================================================
   * Startup: restore persisted state so preferences survive restarts.
   * ====================================================================== */
  document.addEventListener('DOMContentLoaded', function () {
    V.init();
    // NOTE: We deliberately do NOT auto-arm the microphone on load, even if the
    // user previously turned voice commands on. In an Android WebView the Web
    // Speech permission is not persisted per recognizer session, so starting
    // the mic without a fresh user gesture re-triggers the "wants to use your
    // microphone" prompt on every launch/navigation. The mic now only starts
    // from an explicit tap on the voice-command button. We just restore the
    // button/toggle label so the UI reflects the saved preference.
    try {
      if (S.get('voiceCommands')) {
        // Saved preference is kept, but the mic stays OFF until the user taps.
        S.set('voiceCommands', false);
        emit('chcn:voice-commands-toggled', { on: false });
      }
    } catch (e) {}
    emit('chcn:services-ready', {});
  });

})(window);
