/* =============================================================================
 * Creator Hub Creator Network — CONVERSATIONAL ASSISTANT + EXTENDED COMMANDS
 * Extends CHCN.Commands (built by global-commands.js). Loaded LAST so the
 * natural-conversation catch-all only runs after every specific command misses.
 * Every action is REAL — no fake confirmations, honest failure reporting.
 * The assistant has a configurable name and is NEVER called “Siri”.
 * ========================================================================== */
(function (global) {
  'use strict';
  var CHCN = global.CHCN = global.CHCN || {};
  var C = CHCN.Commands, S = CHCN.Settings, V = CHCN.Voice;
  if (!C || !C.register) return; // commands service must be present

  var doc = global.document;
  function say(t) { try { V.announce(t); } catch (e) {} }
  function go(page) { if (typeof global.navigate === 'function') global.navigate(page); }
  function toast(m, isErr) { if (typeof global.showToast === 'function') { try { global.showToast(m, isErr); } catch (x) {} } }
  function has(fn) { return typeof global[fn] === 'function'; }

  // ---- Assistant identity (configurable, never “Siri”) ----------------
  function aName() { var n = (S && S.get) ? S.get('assistantName', 'Nova') : 'Nova'; return n || 'Nova'; }
  function setName(n) { n = (n || '').trim(); if (!n) return; if (/^siri$/i.test(n)) { say('I\u2019d rather not use that name — pick another one.'); return; } if (S && S.set) S.set('assistantName', n); say('Okay, you can call me ' + n + ' from now on.'); }

  // ---- Open an external site: native/window.open, honest fallback -------
  function openExternal(url, label) {
    // Open ONCE in a separate page; never navigate the app's main view away.
    if (typeof global.chcnOpenExternal === 'function') {
      var ok = global.chcnOpenExternal(url, label);
      say('Opening ' + (label || 'the page') + '.');
      if (!ok) toast('Could not open external link', true);
      return;
    }
    var w = null;
    try { w = global.open(url, '_blank', 'noopener,noreferrer'); } catch (e) {}
    if (w) { say('Opening ' + (label || 'the page') + '.'); toast('Opening ' + (label || url)); return; }
    say('Sorry, I could not open ' + (label || 'that link') + ' on this device.');
    toast('Could not open external link', true);
  }
  function q(s) { return encodeURIComponent((s || '').trim()); }

  var R = function (p, h, help) { C.register(p, h, help); };

  /* ===================================================================== *
   * 1. NAVIGATION — lots of natural synonyms mapping to real pages.
   * ===================================================================== */
  R(['take me home', 'go to the home page', 'back to home', 'main page', 'start page'], function () { go('index'); say('Taking you home.'); }, 'Go to the home page');
  R(['show my courses', 'open my courses', 'view courses', 'course list', 'browse courses', 'lessons', 'classes'], function () { go('courses'); say('Here are your courses.'); }, 'Open your courses');
  R(['open my account', 'my profile', 'show my profile', 'view my account', 'account settings'], function () { go('account'); say('Opening your account.'); }, 'Open your account');
  R(['show the map', 'open the map', 'navigation', 'gps', 'directions'], function () { go('map'); say('Opening the map.'); }, 'Open the map');
  R(['make a payment', 'pay now', 'open billing', 'billing', 'checkout'], function () { go('payment'); say('Opening payments.'); }, 'Open payments');
  R(['i want to donate', 'give a donation', 'support the network', 'contribute'], function () { go('payment'); var d = doc.getElementById('donateSection'); if (d) d.scrollIntoView({ behavior: 'smooth' }); say('Opening donations.'); }, 'Open donations');
  R(['tell me about you', 'about the network', 'who are you guys', 'company info'], function () { go('about'); say('Opening about us.'); }, 'About the network');
  R(['get in touch', 'reach support', 'help me contact', 'support', 'contact page'], function () { go('contact'); say('Opening contact.'); }, 'Contact page');
  R(['sign me out', 'log me out', 'log out', 'sign out'], function () { if (has('handleSignOut')) { global.handleSignOut(); say('You are signed out.'); } else { say('I could not find the sign-out option here.'); } }, 'Sign out');

  /* ===================================================================== *
   * 2. COURSES, LESSONS & QUIZ — real in-app controls.
   * ===================================================================== */
  R(['next question', 'go to next question'], function () { if (has('quizNext')) { global.quizNext(); say('Next question.'); } else { say('That works only during a quiz.'); } }, 'Quiz: next question');
  R(['previous question', 'go back a question', 'last question'], function () { if (has('quizPrev')) { global.quizPrev(); say('Previous question.'); } else { say('That works only during a quiz.'); } }, 'Quiz: previous question');
  R(['submit quiz', 'submit my quiz', 'finish quiz', 'submit answers'], function () { if (has('submitQuiz')) { global.submitQuiz(); } else { say('There is no quiz open right now.'); } }, 'Submit the quiz');
  R([/^(sort|order) courses by (.+)/], function (t, m) { if (has('sortCourses') && m) { try { global.sortCourses(m[2].trim()); say('Sorting courses by ' + m[2].trim() + '.'); return; } catch (e) {} } say('I could not sort the courses from here.'); }, 'Sort courses');
  R([/^(filter|show) courses (for |in |about )?(.+)/], function (t, m) { if (has('filterCourses') && m) { try { global.filterCourses(m[3].trim()); say('Filtering courses for ' + m[3].trim() + '.'); return; } catch (e) {} } go('courses'); }, 'Filter courses');

  /* ===================================================================== *
   * 3. MAP EXTRAS — 3D earth view + compass (real functions).
   * ===================================================================== */
  R(['open google earth', 'show 3d view', 'earth view', 'satellite view'], function () { if (has('openGoogleEarth')) { global.openGoogleEarth(); } else { openExternal('https://earth.google.com/web/', 'Google Earth'); } }, 'Open Google Earth 3D');

  /* ===================================================================== *
   * 4. EXTERNAL SITES & SEARCH — open real URLs, report failures honestly.
   * ===================================================================== */
  R([/^(search |look up )?youtube (for )?(.+)/], function (t, m) { openExternal('https://www.youtube.com/results?search_query=' + q(m[3]), 'YouTube search for ' + m[3].trim()); }, 'Search YouTube');
  R(['open youtube', 'youtube'], function () { openExternal('https://www.youtube.com/', 'YouTube'); }, 'Open YouTube');
  R([/^google (?:search )?(.+)/, /^search (?:the )?(?:web|google|internet) (?:for )?(.+)/], function (t, m) { var term = (m[1] || m[2] || '').trim(); openExternal('https://www.google.com/search?q=' + q(term), 'a web search for ' + term); }, 'Search the web');
  R(['open google', 'google'], function () { openExternal('https://www.google.com/', 'Google'); }, 'Open Google');
  R([/^(open |search )?tiktok (?:for )?(.+)/], function (t, m) { openExternal('https://www.tiktok.com/search?q=' + q(m[2]), 'TikTok for ' + m[2].trim()); }, 'Search TikTok');
  R(['open tiktok', 'tiktok'], function () { openExternal('https://www.tiktok.com/', 'TikTok'); }, 'Open TikTok');
  R(['open facebook', 'facebook'], function () { openExternal('https://www.facebook.com/', 'Facebook'); }, 'Open Facebook');
  R(['open instagram', 'instagram'], function () { openExternal('https://www.instagram.com/', 'Instagram'); }, 'Open Instagram');
  R(['open whatsapp', 'whatsapp'], function () { openExternal('https://wa.me/', 'WhatsApp'); }, 'Open WhatsApp');
  R([/^(?:play )?music (?:for |about )?(.+) on youtube/], function (t, m) { openExternal('https://www.youtube.com/results?search_query=' + q(m[1] + ' music'), 'music for ' + m[1].trim()); }, 'Play music on YouTube');
  R([/^(?:find|show) (?:me )?(.+) near me/, /^where is the nearest (.+)/], function (t, m) { var place = (m[1] || '').trim(); openExternal('https://www.google.com/maps/search/' + q(place), place + ' near you'); }, 'Find places near you');
  R([/^(?:open |show )?(?:google )?maps? (?:for |to |of )(.+)/], function (t, m) { openExternal('https://www.google.com/maps/search/' + q(m[1]), m[1].trim() + ' on the map'); }, 'Open maps for a place');
  R([/^wikipedia (?:for |about )?(.+)/, /^what is (?:a |an |the )?(.+) on wikipedia/], function (t, m) { var term = (m[1] || '').trim(); openExternal('https://en.wikipedia.org/wiki/Special:Search?search=' + q(term), 'Wikipedia for ' + term); }, 'Search Wikipedia');

  /* ===================================================================== *
   * 5. CALCULATOR — real arithmetic, spoken back.
   * ===================================================================== */
  var WORDNUM = { zero:0, one:1, two:2, three:3, four:4, five:5, six:6, seven:7, eight:8, nine:9, ten:10, eleven:11, twelve:12, thirteen:13, fourteen:14, fifteen:15, sixteen:16, seventeen:17, eighteen:18, nineteen:19, twenty:20, thirty:30, forty:40, fifty:50, sixty:60, seventy:70, eighty:80, ninety:90, hundred:100, thousand:1000 };
  function wordsToNums(str) {
    return str.replace(/\b(zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|thousand)\b/g, function (w) { return WORDNUM[w]; });
  }
  function fmt(n) { if (!isFinite(n)) return 'undefined'; var r = Math.round(n * 1e6) / 1e6; return String(r); }
  R([/(-?\d+(?:\.\d+)?)\s*percent of\s*(-?\d+(?:\.\d+)?)/], function (t, m) { var a = parseFloat(m[1]), b = parseFloat(m[2]); say(fmt(a) + ' percent of ' + fmt(b) + ' is ' + fmt(a / 100 * b) + '.'); }, 'X percent of Y');
  R([/(-?\d+(?:\.\d+)?)\s*(plus|minus|times|multiplied by|divided by|over)\s*(-?\d+(?:\.\d+)?)/], function (t, m) {
    var a = parseFloat(m[1]), b = parseFloat(m[3]), op = m[2], r;
    if (op === 'plus') r = a + b; else if (op === 'minus') r = a - b; else if (op === 'times' || op === 'multiplied by') r = a * b; else r = a / b;
    say(fmt(a) + ' ' + op + ' ' + fmt(b) + ' equals ' + fmt(r) + '.');
  }, 'Basic arithmetic');
  R([/square root of\s*(-?\d+(?:\.\d+)?)/], function (t, m) { var a = parseFloat(m[1]); if (a < 0) { say('The square root of a negative number is not real.'); return; } say('The square root of ' + fmt(a) + ' is ' + fmt(Math.sqrt(a)) + '.'); }, 'Square root');
  R([/(-?\d+(?:\.\d+)?)\s*squared/], function (t, m) { var a = parseFloat(m[1]); say(fmt(a) + ' squared is ' + fmt(a * a) + '.'); }, 'Square a number');

  /* ===================================================================== *
   * 6. UNIT CONVERSION — length, weight, temperature, speed. Real math.
   * ===================================================================== */
  // to a base unit: length→metres, weight→grams, speed→m/s
  var LEN = { mm:0.001, millimeter:0.001, millimeters:0.001, cm:0.01, centimeter:0.01, centimeters:0.01, m:1, meter:1, meters:1, metre:1, metres:1, km:1000, kilometer:1000, kilometers:1000, kilometre:1000, kilometres:1000, inch:0.0254, inches:0.0254, in:0.0254, foot:0.3048, feet:0.3048, ft:0.3048, yard:0.9144, yards:0.9144, mile:1609.344, miles:1609.344, mi:1609.344 };
  var MASS = { mg:0.001, milligram:0.001, milligrams:0.001, g:1, gram:1, grams:1, kg:1000, kilogram:1000, kilograms:1000, kilo:1000, kilos:1000, oz:28.349523, ounce:28.349523, ounces:28.349523, lb:453.59237, lbs:453.59237, pound:453.59237, pounds:453.59237, ton:1000000, tonne:1000000, tonnes:1000000 };
  var SPEED = { 'kmh':0.277778, 'kph':0.277778, 'km/h':0.277778, 'kilometers per hour':0.277778, 'mph':0.44704, 'miles per hour':0.44704, 'm/s':1, 'meters per second':1, 'knots':0.514444, 'knot':0.514444 };
  function convTemp(v, from, to) {
    var c; from = from.toLowerCase(); to = to.toLowerCase();
    if (/^c|celsius|centigrade/.test(from)) c = v; else if (/^f|fahrenheit/.test(from)) c = (v - 32) * 5 / 9; else if (/^k|kelvin/.test(from)) c = v - 273.15; else return null;
    if (/^c|celsius|centigrade/.test(to)) return c; if (/^f|fahrenheit/.test(to)) return c * 9 / 5 + 32; if (/^k|kelvin/.test(to)) return c + 273.15; return null;
  }
  R([/convert\s*(-?\d+(?:\.\d+)?)\s*(?:degrees?\s*)?(celsius|centigrade|fahrenheit|kelvin|c|f|k)\s*(?:in|to|into)\s*(?:degrees?\s*)?(celsius|centigrade|fahrenheit|kelvin|c|f|k)/], function (t, m) { var r = convTemp(parseFloat(m[1]), m[2], m[3]); if (r === null) { say('I could not convert that temperature.'); return; } say(fmt(parseFloat(m[1])) + ' degrees ' + m[2] + ' is ' + fmt(r) + ' degrees ' + m[3] + '.'); }, 'Convert temperature');
  R([/convert\s*(-?\d+(?:\.\d+)?)\s*([a-z\/ ]+?)\s*(?:in|to|into)\s*([a-z\/ ]+)/], function (t, m) {
    var v = parseFloat(m[1]), from = m[2].trim(), to = m[3].trim(), tbl = null;
    if (LEN[from] !== undefined && LEN[to] !== undefined) tbl = LEN; else if (MASS[from] !== undefined && MASS[to] !== undefined) tbl = MASS; else if (SPEED[from] !== undefined && SPEED[to] !== undefined) tbl = SPEED;
    if (!tbl) { say('I can convert length, weight, speed and temperature. I did not recognise those units.'); return; }
    var r = v * tbl[from] / tbl[to];
    say(fmt(v) + ' ' + from + ' is ' + fmt(r) + ' ' + to + '.');
  }, 'Convert units');

  /* ===================================================================== *
   * 7. TIME & DATE — real device clock.
   * ===================================================================== */
  R(['what time is it', 'what\u2019s the time', 'whats the time', 'current time', 'tell me the time', 'the time'], function () { var d = new Date(); say('It is ' + d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) + '.'); }, 'Tell the time');
  R(['what\u2019s the date', 'whats the date', 'what is the date', 'today\u2019s date', 'todays date', 'what day is it', 'what day is today'], function () { var d = new Date(); say('Today is ' + d.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) + '.'); }, 'Tell the date');

  /* ===================================================================== *
   * 8. APPEARANCE & ACCESSIBILITY — real, persisted changes.
   * ===================================================================== */
  function applyLook() { try { doc.documentElement.style.setProperty('--chcn-font-scale', S.get('fontScale')); doc.body.style.fontSize = (100 * (parseFloat(S.get('fontScale')) || 1)) + '%'; doc.body.classList.toggle('chcn-dark', S.get('theme') === 'dark'); doc.body.classList.toggle('chcn-contrast', !!S.get('highContrast')); } catch (e) {} }
  R(['increase text size', 'bigger text', 'make text bigger', 'zoom in text', 'larger font'], function () { var v = Math.min(1.5, (parseFloat(S.get('fontScale')) || 1) + 0.1); S.set('fontScale', v); applyLook(); say('Text is bigger.'); }, 'Increase text size');
  R(['decrease text size', 'smaller text', 'make text smaller', 'zoom out text', 'smaller font'], function () { var v = Math.max(0.9, (parseFloat(S.get('fontScale')) || 1) - 0.1); S.set('fontScale', v); applyLook(); say('Text is smaller.'); }, 'Decrease text size');
  R(['dark mode', 'turn on dark mode', 'enable dark mode', 'night mode'], function () { S.set('theme', 'dark'); applyLook(); say('Dark mode is on.'); }, 'Dark mode');
  R(['light mode', 'turn off dark mode', 'disable dark mode', 'day mode'], function () { S.set('theme', 'light'); applyLook(); say('Light mode is on.'); }, 'Light mode');
  R(['high contrast on', 'turn on high contrast', 'enable high contrast'], function () { S.set('highContrast', true); applyLook(); say('High contrast is on.'); }, 'High contrast on');
  R(['high contrast off', 'turn off high contrast', 'disable high contrast'], function () { S.set('highContrast', false); applyLook(); say('High contrast is off.'); }, 'High contrast off');

  /* ===================================================================== *
   * 9. ASSISTANT IDENTITY + HELP.
   * ===================================================================== */
  R([/^(?:call yourself|change your name to|your name is|i(?:'| wi)ll call you|rename yourself to)\s+(.+)/], function (t, m) { setName(m[1]); }, 'Rename the assistant');
  R(['what\u2019s your name', 'whats your name', 'what is your name', 'who are you'], function () { say('I\u2019m ' + aName() + ', your Creator Hub voice assistant. I can navigate the app, open your courses, do maths, convert units, tell the time, search the web and just chat.'); }, 'Assistant name');
  R(['help', 'what can you do', 'what can i say', 'commands', 'list commands', 'help me'], function () {
    say(aName() + ' can help you get around and get things done. Try: open my courses, make a payment, show the map, open Google Earth, what is fifteen percent of two hundred, convert ten miles to kilometers, what time is it, search YouTube for gospel music, dark mode, or read this page. You can also just talk to me. Say stop listening to turn me off.');
  }, 'Help / what can you do');

  /* ===================================================================== *
   * 10. NATURAL CONVERSATION — the catch-all. Registered LAST so it only
   *     runs after every specific command above has missed. Handles small
   *     talk, follow-up yes/no confirmations, and offers a real web search
   *     for anything it does not otherwise understand (never fakes an action).
   * ===================================================================== */
  var pending = null; // { onYes: fn, onNo: fn }
  function askConfirm(question, onYes, onNo) { pending = { onYes: onYes || null, onNo: onNo || null }; say(question); }

  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function reply(t) {
    var n = aName();
    // greetings
    if (/\b(hello|hi|hey|yo|good morning|good afternoon|good evening|what'?s up|howdy)\b/.test(t)) { say(pick(['Hey there! How can I help?', 'Hi! What would you like to do?', 'Hello! I\u2019m listening.'])); return true; }
    if (/how are you|how'?s it going|how do you feel|you good/.test(t)) { say(pick(['I\u2019m doing great and ready to help. What do you need?', 'All good here! What can I do for you?'])); return true; }
    if (/thank(s| you)|appreciate it|much obliged/.test(t)) { say(pick(['You\u2019re welcome!', 'Anytime!', 'Happy to help.'])); return true; }
    if (/good (night|bye)|see you|goodbye|later/.test(t)) { say(pick(['Talk soon!', 'Goodbye for now.'])); return true; }
    if (/who (made|created|built) you|who'?s your (maker|creator)|who owns you/.test(t)) { say('I\u2019m ' + n + ', the voice assistant built into Creator Hub Creator Network, founded by Ravaun Richards.'); return true; }
    if (/what are you|are you (a robot|human|real|ai)/.test(t)) { say('I\u2019m ' + n + ', an in-app voice assistant. Not human — but I\u2019m here to help you use the app hands-free.'); return true; }
    if (/tell me a joke|make me laugh|say something funny/.test(t)) { say(pick(['Why did the developer go broke? Because they used up all their cache.', 'I would tell you a UDP joke, but you might not get it.'])); return true; }
    if (/i love you|you'?re (awesome|great|the best|amazing)/.test(t)) { say('That\u2019s kind of you — I\u2019m glad I can help!'); return true; }
    if (/are you (there|listening|awake)|you there/.test(t)) { say('Yes, I\u2019m listening. Go ahead.'); return true; }
    if (/sorry|my (bad|mistake)|never ?mind|forget it/.test(t)) { say('No problem at all.'); return true; }
    return false;
  }

  function conversationHandler(t) {
    // 1) resolve a pending yes/no confirmation first
    if (pending) {
      if (/^(yes|yeah|yep|sure|okay|ok|do it|go ahead|please|confirm)\b/.test(t)) { var f = pending.onYes; pending = null; if (f) { try { f(); } catch (e) {} } else { say('Okay.'); } return; }
      if (/^(no|nope|nah|cancel|stop|don'?t|never ?mind)\b/.test(t)) { var g = pending.onNo; pending = null; if (g) { try { g(); } catch (e) {} } else { say('Okay, cancelled.'); } return; }
      // not a yes/no — drop the pending question and keep going
      pending = null;
    }
    // 2) small talk / natural conversation
    if (reply(t)) return;
    // 3) genuine fallback — offer a REAL web search instead of pretending
    var term = t.replace(/^(please|hey|ok|okay|um|uh)\s+/i, '').trim();
    if (term.length > 2) {
      askConfirm('I\u2019m not sure how to do that in the app. Would you like me to search the web for “' + term + '”?',
        function () { openExternal('https://www.google.com/search?q=' + q(term), 'a web search for ' + term); });
    } else {
      say('I didn\u2019t catch that. Say help to hear what I can do.');
    }
  }
  // Register the catch-all AFTER the current script pass so any commands added
  // by later-loading modules (chcn-nav, chcn-platform, …) keep priority and this
  // conversation handler is always the LAST matcher in the registry.
  function registerCatchAll() { C.register([/[\s\S]*/], conversationHandler, ''); }
  if (doc && doc.readyState === 'loading') { doc.addEventListener('DOMContentLoaded', function () { setTimeout(registerCatchAll, 0); }); } else { setTimeout(registerCatchAll, 0); }
  CHCN.Assistant = { name: aName, setName: setName, askConfirm: askConfirm, openExternal: openExternal };

})(typeof window !== 'undefined' ? window : this);
