/* ===== Creator Hub Creator Network — per-account data isolation (v48) =====
   Problem this fixes:
   The learning keys (enrolled courses, progress, certificates, wishlist,
   profile picture, cover photo, ID documents) were stored in ONE global
   localStorage slot shared by every account on the device. That meant a
   brand-new sign-up inherited the previous person's enrolments/progress,
   and switching accounts showed the wrong person's records.

   This patch scopes those keys PER ACCOUNT (keyed by email), so:
     - A new account always starts at 0 enrolled / 0 completed /
       0 certificates / 0% progress.
     - Each account's real activity persists and is restored on sign-in.
     - Signing out hides the previous account's data from a guest.
   Purely additive — the live keys still work exactly as before; this just
   mirrors them in/out of a per-email store at the auth boundaries and when
   the data changes. Loaded LAST. */
(function () {
  'use strict';

  // Lightweight learning/profile-media keys that belong to ONE user.
  var PER_USER = [
    'chcn_enrolled', 'chcn_progress', 'chcn_certs', 'chcn_wishlist',
    'chcn_avatar', 'chcn_cover', 'chcn_id_docs', 'chcn_cert_recipient',
    'chcn_quiz_attempts'
  ];
  var SESSION_KEY = 'chcn_session_email';
  var PREFIX = 'chcn_adata::';

  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } }
  function lsDel(k) { try { localStorage.removeItem(k); } catch (e) {} }
  function getUserSafe() { try { return (typeof getUser === 'function') ? getUser() : null; } catch (e) { return null; } }
  function onAccountPage() {
    var p = document.getElementById('page-account');
    return !!(p && (p.classList.contains('active') || p.offsetParent !== null));
  }
  function refreshAccountUI() {
    try { if (typeof loadAccountData === 'function' && onAccountPage()) loadAccountData(); } catch (e) {}
    try { if (typeof updateAuthUI === 'function') updateAuthUI(); } catch (e) {}
  }

  // Capture the current live keys into this email's private store.
  function snapshot(email) {
    if (!email) return;
    var obj = {};
    PER_USER.forEach(function (k) { var v = lsGet(k); if (v !== null) obj[k] = v; });
    if (!lsSet(PREFIX + email, JSON.stringify(obj))) {
      // Quota hit (large avatar/cover/ID files). Keep at least the small
      // learning records so progress/enrolments are never lost.
      var slim = {};
      ['chcn_enrolled', 'chcn_progress', 'chcn_certs', 'chcn_wishlist', 'chcn_cert_recipient', 'chcn_quiz_attempts']
        .forEach(function (k) { if (obj[k] !== undefined) slim[k] = obj[k]; });
      lsSet(PREFIX + email, JSON.stringify(slim));
    }
  }

  // Clear every live per-user key — the true zero state.
  function clearLive() { PER_USER.forEach(lsDel); }

  // Load this email's private store into the live keys (missing => zeroed).
  function restore(email) {
    clearLive();
    if (!email) return;
    var raw = lsGet(PREFIX + email);
    if (!raw) return; // brand-new / no saved data => stays at zero
    var obj; try { obj = JSON.parse(raw) || {}; } catch (e) { obj = {}; }
    PER_USER.forEach(function (k) { if (obj[k] !== undefined && obj[k] !== null) lsSet(k, obj[k]); });
  }

  function setSession(email) { if (email) lsSet(SESSION_KEY, email); else lsDel(SESSION_KEY); }
  function getSession() { return lsGet(SESSION_KEY) || ''; }

  // Save whoever is currently signed in (used on change + before unload).
  function syncCurrent() {
    var u = getUserSafe();
    if (u && u.email) snapshot(u.email);
  }
  window.chcnSyncAccountData = syncCurrent;

  // ---------- Wrap the auth boundaries ----------
  function wrapAuth() {
    if (typeof window.handleSignIn === 'function' && !window.handleSignIn.__chcnAD) {
      var origIn = window.handleSignIn;
      window.handleSignIn = function () {
        var prev = getUserSafe();
        if (prev && prev.email) snapshot(prev.email);
        var r = origIn.apply(this, arguments);
        var u = getUserSafe();
        if (u && u.email && u.email !== (prev && prev.email)) {
          restore(u.email);
          setSession(u.email);
          refreshAccountUI();
        }
        return r;
      };
      window.handleSignIn.__chcnAD = true;
    }

    if (typeof window.handleSignUp === 'function' && !window.handleSignUp.__chcnAD) {
      var origUp = window.handleSignUp;
      window.handleSignUp = function () {
        var prev = getUserSafe();
        if (prev && prev.email) snapshot(prev.email);
        var r = origUp.apply(this, arguments);
        var u = getUserSafe();
        if (u && u.email && u.email !== (prev && prev.email)) {
          // Brand-new account => guaranteed zero state.
          clearLive();
          snapshot(u.email);
          setSession(u.email);
          refreshAccountUI();
        }
        return r;
      };
      window.handleSignUp.__chcnAD = true;
    }

    if (typeof window.handleSignOut === 'function' && !window.handleSignOut.__chcnAD) {
      var origOut = window.handleSignOut;
      window.handleSignOut = function () {
        var u = getUserSafe();
        if (u && u.email) snapshot(u.email);
        var r = origOut.apply(this, arguments);
        clearLive();        // a signed-out guest must not see the last user's data
        setSession('');
        refreshAccountUI();
        return r;
      };
      window.handleSignOut.__chcnAD = true;
    }

    if (typeof window.handleDeleteAccount === 'function' && !window.handleDeleteAccount.__chcnAD) {
      var origDel = window.handleDeleteAccount;
      window.handleDeleteAccount = function () {
        var u = getUserSafe();
        var email = u && u.email;
        var r = origDel.apply(this, arguments);
        // If the account was actually deleted (session cleared), purge its store.
        if (email && !getUserSafe()) { lsDel(PREFIX + email); clearLive(); setSession(''); }
        return r;
      };
      window.handleDeleteAccount.__chcnAD = true;
    }
  }

  // ---------- Persist on every change so nothing is lost if the app closes ----------
  function wrapSetters() {
    ['setEnrolled', 'setProgress', 'setCertificates', 'setWishlist'].forEach(function (fn) {
      if (typeof window[fn] === 'function' && !window[fn].__chcnAD) {
        var orig = window[fn];
        window[fn] = function () { var r = orig.apply(this, arguments); syncCurrent(); return r; };
        window[fn].__chcnAD = true;
      }
    });
  }

  function install() {
    wrapAuth();
    wrapSetters();

    // One-time migration: if someone is already signed in on this device and
    // has no private store yet, adopt their existing live data into it (so the
    // upgrade never wipes real records). Otherwise reconcile the session.
    var u = getUserSafe();
    if (u && u.email) {
      if (lsGet(PREFIX + u.email) === null) snapshot(u.email);
      else if (getSession() !== u.email) restore(u.email);
      setSession(u.email);
    } else {
      // No one signed in — do not expose any prior user's data to a guest.
      if (getSession()) { clearLive(); setSession(''); }
    }

    // Safety nets for media/doc changes that don't go through the setters.
    window.addEventListener('beforeunload', syncCurrent);
    window.addEventListener('pagehide', syncCurrent);
    setInterval(syncCurrent, 20000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
  else install();
})();
