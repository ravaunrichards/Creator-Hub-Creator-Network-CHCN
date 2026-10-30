/* =============================================================================
 * Creator Hub Creator Network — GLOBAL UI GLUE
 * Floating accessibility dock (voice everywhere), Settings center, and the
 * upgraded Payment/Donation + receipt upload. Depends on the CHCN services.
 * ========================================================================== */
(function (global) {
  'use strict';
  var CHCN = global.CHCN = global.CHCN || {};
  var S = CHCN.Settings, V = CHCN.Voice, Mic = CHCN.Mic;
  function el(id) { return document.getElementById(id); }
  function toast(m, err) { if (typeof global.showToast === 'function') global.showToast(m, err); }

  /* ---- Floating accessibility dock: voice on EVERY page ---- */
  function buildDock() {
    if (el('chcnDock')) return;
    var d = document.createElement('div');
    d.id = 'chcnDock';
    d.className = 'chcn-dock';
    d.setAttribute('role', 'region');
    d.setAttribute('aria-label', 'Creator Hub voice and accessibility controls');
    d.innerHTML = [
      '<button id="chcnDockToggle" class="chcn-dock-fab" aria-label="Open voice controls" title="Voice & accessibility">\uD83C\uDF99\uFE0F</button>',
      '<div id="chcnDockPanel" class="chcn-dock-panel" aria-hidden="true">',
      '  <button data-act="mic" id="chcnMicBtn">\uD83C\uDF99\uFE0F Voice commands</button>',
      '  <button data-act="read" id="chcnReadBtn">\uD83D\uDD0A Read aloud</button>',
      '  <button data-act="readpage">\uD83D\uDCC4 Read this page</button>',
      '  <button data-act="stop">\u23F9 Stop</button>',
      '  <button data-act="settings">\u2699\uFE0F Settings</button>',
      '  <div id="chcnMicStatus" class="chcn-mic-status" aria-live="polite">Voice off</div>',
      '</div>'
    ].join('');
    document.body.appendChild(d);
    el('chcnDockToggle').addEventListener('click', function () {
      var p = el('chcnDockPanel');
      var open = p.classList.toggle('open');
      p.setAttribute('aria-hidden', open ? 'false' : 'true');
    });
    d.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-act]'); if (!b) return;
      var act = b.getAttribute('data-act');
      if (act === 'mic') global.chcnToggleVoiceCommands();
      else if (act === 'read') V.setReadAloud(!V.isReadAloud());
      else if (act === 'readpage') { S.set('readAloud', true); V.readCurrentPage(); }
      else if (act === 'stop') V.stop();
      else if (act === 'settings') global.openSettings();
      refreshDock();
    });
    refreshDock();
  }
  function refreshDock() {
    var mic = el('chcnMicBtn'), read = el('chcnReadBtn'), st = el('chcnMicStatus');
    if (read) read.classList.toggle('active', V.isReadAloud());
    if (read) read.textContent = V.isReadAloud() ? '\uD83D\uDD0A Read aloud: On' : '\uD83D\uDD0A Read aloud';
    var listening = Mic.isListening();
    if (mic) mic.classList.toggle('active', listening);
    if (mic) mic.textContent = listening ? '\uD83C\uDF99\uFE0F Listening\u2026 (tap to stop)' : '\uD83C\uDF99\uFE0F Voice commands';
    if (st) st.textContent = 'Mic: ' + Mic.state();
  }
  global.addEventListener('chcn:mic-state', refreshDock);
  global.addEventListener('chcn:read-aloud-toggled', refreshDock);
  global.addEventListener('chcn:mic-interim', function (e) { var st = el('chcnMicStatus'); if (st) st.textContent = '\u201C' + (e.detail.text || '') + '\u201D'; });
  global.addEventListener('chcn:command-heard', function (e) { var st = el('chcnMicStatus'); if (st) st.textContent = 'Heard: ' + (e.detail.text || ''); });

  /* ---- Settings Center ---- */
  function buildSettings() {
    if (el('chcnSettingsModal')) return;
    var m = document.createElement('div');
    m.id = 'chcnSettingsModal';
    m.className = 'chcn-settings-overlay';
    m.setAttribute('aria-hidden', 'true');
    m.innerHTML = '<div class="chcn-settings" role="dialog" aria-modal="true" aria-label="Settings">'
      + '<div class="chcn-settings-head"><h2>\u2699\uFE0F Settings</h2><button id="chcnSettingsClose" aria-label="Close settings">\u2715</button></div>'
      + '<div class="chcn-settings-body" id="chcnSettingsBody"></div></div>';
    document.body.appendChild(m);
    el('chcnSettingsClose').addEventListener('click', global.closeSettings);
    m.addEventListener('click', function (e) { if (e.target === m) global.closeSettings(); });
    renderSettings();
  }

  function row(label, control) { return '<label class="chcn-set-row"><span>' + label + '</span>' + control + '</label>'; }
  function toggle(id, on) { return '<input type="checkbox" id="' + id + '"' + (on ? ' checked' : '') + '>'; }

  function renderSettings() {
    var b = el('chcnSettingsBody'); if (!b) return;
    var voiceOpts = V.getVoices().map(function (v, i) {
      var id = v.id || v.name;
      return '<option value="' + id + '"' + (String(S.get('selectedVoiceId')) === String(id) ? ' selected' : '') + '>' + (v.name || 'Voice ' + i) + ' \u2014 ' + (v.lang || '') + '</option>';
    }).join('');
    b.innerHTML = [
      '<section><h3>Voice & Accessibility</h3>',
      row('Read aloud', toggle('set_readAloud', S.get('readAloud'))),
      row('Voice commands', toggle('set_voiceCommands', S.get('voiceCommands'))),
      row('Speak translations', toggle('set_speakTranslations', S.get('speakTranslations'))),
      row('Navigation voice', toggle('set_navigationVoice', S.get('navigationVoice'))),
      row('Auto-read notifications', toggle('set_autoReadNotifications', S.get('autoReadNotifications'))),
      row('High contrast', toggle('set_highContrast', S.get('highContrast'))),
      row('Voice', '<select id="set_selectedVoiceId">' + (voiceOpts || '<option value="">Device default</option>') + '</select>'),
      row('Speech speed', '<input type="range" id="set_speechRate" min="0.6" max="1.6" step="0.05" value="' + S.get('speechRate') + '"> <b id="set_speechRate_v">' + S.get('speechRate') + '</b>'),
      row('Speech pitch', '<input type="range" id="set_speechPitch" min="0.6" max="1.6" step="0.05" value="' + S.get('speechPitch') + '"> <b id="set_speechPitch_v">' + S.get('speechPitch') + '</b>'),
      row('Font size', '<input type="range" id="set_fontScale" min="0.9" max="1.5" step="0.05" value="' + S.get('fontScale') + '"> <b id="set_fontScale_v">' + S.get('fontScale') + '</b>'),
      '<div class="chcn-set-actions"><button id="set_testVoice">\uD83D\uDD0A Test voice</button><button id="set_resetVoice">Reset voice settings</button></div>',
      '</section>',
      '<section><h3>Language & Translation</h3>',
      row('Full app translation', toggle('set_fullAppTranslation', S.get('fullAppTranslation'))),
      row('Auto-detect language', toggle('set_autoDetectLanguage', S.get('autoDetectLanguage'))),
      row('Preferred language', '<input type="text" id="set_preferredLanguage" value="' + S.get('preferredLanguage') + '" style="width:90px">'),
      '</section>',
      '<section><h3>Map, Navigation & Compass</h3>',
      row('Map orientation', '<select id="set_mapOrientation"><option value="north-up"' + (S.get('mapOrientation') === 'north-up' ? ' selected' : '') + '>North up</option><option value="heading-up"' + (S.get('mapOrientation') === 'heading-up' ? ' selected' : '') + '>Heading up</option></select>'),
      row('Units', '<select id="set_measurementUnits"><option value="metric"' + (S.get('measurementUnits') === 'metric' ? ' selected' : '') + '>Metric (km)</option><option value="imperial"' + (S.get('measurementUnits') === 'imperial' ? ' selected' : '') + '>Imperial (mi)</option></select>'),
      '</section>',
      '<section><h3>Appearance</h3>',
      row('Dark mode', toggle('set_theme', S.get('theme') === 'dark')),
      row('Data saver', toggle('set_dataSaver', S.get('dataSaver'))),
      '</section>',
      '<p class="chcn-set-note">All changes save instantly and persist across pages and app restarts.</p>'
    ].join('');
    wireSettings();
  }

  function wireSettings() {
    var bindToggle = function (id, key, after) {
      var e = el(id); if (!e) return;
      e.addEventListener('change', function () { S.set(key, e.checked); if (after) after(e.checked); });
    };
    bindToggle('set_readAloud', 'readAloud', function (v) { if (!v) V.stop(); refreshDock(); });
    bindToggle('set_voiceCommands', 'voiceCommands', function (v) { global.chcnSetVoiceCommands(v); });
    bindToggle('set_speakTranslations', 'speakTranslations');
    bindToggle('set_navigationVoice', 'navigationVoice');
    bindToggle('set_autoReadNotifications', 'autoReadNotifications');
    bindToggle('set_highContrast', 'highContrast', applyAppearance);
    bindToggle('set_fullAppTranslation', 'fullAppTranslation');
    bindToggle('set_autoDetectLanguage', 'autoDetectLanguage');
    bindToggle('set_dataSaver', 'dataSaver');
    var themeEl = el('set_theme');
    if (themeEl) themeEl.addEventListener('change', function () { S.set('theme', themeEl.checked ? 'dark' : 'light'); applyAppearance(); });
    var bindRange = function (id, key, after) {
      var e = el(id), out = el(id + '_v'); if (!e) return;
      e.addEventListener('input', function () { var val = parseFloat(e.value); if (out) out.textContent = val.toFixed(2); S.set(key, val); if (after) after(val); });
    };
    bindRange('set_speechRate', 'speechRate');
    bindRange('set_speechPitch', 'speechPitch');
    bindRange('set_fontScale', 'fontScale', applyAppearance);
    var bindSelect = function (id, key) { var e = el(id); if (e) e.addEventListener('change', function () { S.set(key, e.value); }); };
    bindSelect('set_selectedVoiceId', 'selectedVoiceId');
    bindSelect('set_mapOrientation', 'mapOrientation');
    bindSelect('set_measurementUnits', 'measurementUnits');
    var pref = el('set_preferredLanguage'); if (pref) pref.addEventListener('change', function () { S.set('preferredLanguage', pref.value.trim()); });
    var tv = el('set_testVoice'); if (tv) tv.addEventListener('click', function () { V.announce('This is a preview of the selected voice at the current speed and pitch.'); });
    var rv = el('set_resetVoice'); if (rv) rv.addEventListener('click', function () { S.reset('speechRate'); S.reset('speechPitch'); S.reset('selectedVoiceId'); renderSettings(); toast('Voice settings reset'); });
  }

  function applyAppearance() {
    document.documentElement.style.setProperty('--chcn-font-scale', S.get('fontScale'));
    document.body.style.fontSize = (100 * (parseFloat(S.get('fontScale')) || 1)) + '%';
    document.body.classList.toggle('chcn-dark', S.get('theme') === 'dark');
    document.body.classList.toggle('chcn-contrast', !!S.get('highContrast'));
  }

  global.openSettings = function () { buildSettings(); renderSettings(); var m = el('chcnSettingsModal'); m.classList.add('open'); m.setAttribute('aria-hidden', 'false'); };
  global.closeSettings = function () { var m = el('chcnSettingsModal'); if (m) { m.classList.remove('open'); m.setAttribute('aria-hidden', 'true'); } };

  document.addEventListener('DOMContentLoaded', function () {
    buildDock();
    applyAppearance();
    // Restore read-aloud visual state
    refreshDock();
  });

})(window);
