/* =============================================================================
 * Creator Hub Creator Network — PAYMENT CENTER + DONATIONS + RECEIPT UPLOAD
 * Separates donations from course payments, fixes the mobile file picker, and
 * lays out a secure PayPal architecture (no secrets in the client).
 * ========================================================================== */
(function (global) {
  'use strict';
  var CHCN = global.CHCN = global.CHCN || {};
  function el(id) { return document.getElementById(id); }
  function toast(m, err) { if (typeof global.showToast === 'function') global.showToast(m, err); }
  function esc(s) { var d = document.createElement('div'); d.textContent = s == null ? '' : String(s); return d.innerHTML; }

  // Client-safe config only. Secrets/verification live on the server.
  // Set window.CHCN_PAYPAL_CLIENT_ID + a server verify endpoint to go live.
  var PAYPAL = {
    clientId: global.CHCN_PAYPAL_CLIENT_ID || '',
    configured: !!global.CHCN_PAYPAL_CLIENT_ID
  };
  var ALLOWED = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  var MAX_BYTES = 8 * 1024 * 1024;

  // Creator Hub PayPal account (donations are sent directly to this address).
  var PAYPAL_EMAIL = 'ravaunrichards565@gmail.com';
  var PAYPAL_NAME = 'Ravaun Richards';
  // Build a PayPal "send money / donate" link addressed to the account above.
  // Opens PayPal's donate page with the recipient (and amount, if chosen)
  // pre-filled, so the user can pay straight to this account from their phone.
  function paypalDonateUrl(amount) {
    var u = 'https://www.paypal.com/donate/?business=' + encodeURIComponent(PAYPAL_EMAIL)
      + '&item_name=' + encodeURIComponent('Donation to Creator Hub Creator Network')
      + '&currency_code=USD';
    if (amount > 0) u += '&amount=' + encodeURIComponent(amount.toFixed(2));
    return u;
  }

  // Online-banking portals for donation-by-bank-transfer. These match the
  // bank accounts already listed on the payment page (all in Ravaun Richards' name).
  var DONATE_BANKS = [
    { name: 'National Commercial Bank (NCB)', url: 'https://retail.ncbelink.com/corp/AuthenticationController?__START_TRAN_FLAG__=Y&FORMSGROUP_ID__=AuthenticationFG&__EVENT_ID__=LOAD&FG_BUTTONS__=LOAD&ACTION.LOAD=Y&AuthenticationFG.LOGIN_FLAG=1&BANK_ID=077&LANGUAGE_ID=001' },
    { name: 'Jamaica National (JN)', url: 'https://www.jnbslive.com/Default.aspx' },
    { name: 'First Caribbean Bank (CIBC)', url: 'https://onlinebanking.cibccaribbean.com/' }
  ];

  function stagedReceipts() { try { return JSON.parse(localStorage.getItem('chcn_receipts') || '[]'); } catch (e) { return []; } }
  function saveStaged(arr) { try { localStorage.setItem('chcn_receipts', JSON.stringify(arr)); } catch (e) {} }

  function injectPaymentUpgrades() {
    var page = el('page-payment'); if (!page) return;
    if (el('receiptUploadCard')) return; // already injected

    /* ----- Receipt upload (fixes \u201CChoose File does nothing\u201D) ----- */
    var receipt = document.createElement('section');
    receipt.style.padding = '10px 0';
    receipt.innerHTML = '<div class="container"><div class="pay-note" id="receiptUploadCard">'
      + '<h4>\uD83E\uDDFE Send your payment receipt</h4>'
      + '<p>Attach a PDF or photo of your bank transfer so your access can be verified. Accepted: PDF, JPG, PNG, WEBP (max 8 MB).</p>'
      + '<input type="file" id="receiptFileInput" accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/*" style="display:none">'
      + '<div class="chcn-file-actions"><button class="btn btn-primary" id="receiptChooseBtn" type="button">\uD83D\uDCCE Choose file</button></div>'
      + '<div id="receiptChooseMenu" class="chcn-file-actions" hidden style="margin-top:8px;"></div>'
      + '<div id="receiptPreview" class="chcn-receipt-preview" aria-live="polite"></div>'
      + '<p class="chcn-set-note" id="receiptHint"></p>'
      + '</div></div>';
    page.appendChild(receipt);

    /* ----- Separate, professional Donation section ----- */
    var donate = document.createElement('section');
    donate.id = 'donateSection';
    donate.style.padding = '10px 0 30px';
    donate.innerHTML = '<div class="container"><div class="pay-note" style="border-left:4px solid var(--success,#16a34a)">'
      + '<h3 style="margin-top:0">\uD83D\uDC9A Donate to Creator Hub</h3>'
      + '<p>Donations help keep Creator Hub Creator Network courses free and accessible. Donations are separate from course tuition. You choose the amount securely on PayPal.</p>'
      + '<label>Name (optional)</label><input type="text" id="donorName" placeholder="Your name">'
      + '<label>Email (optional)</label><input type="email" id="donorEmail" placeholder="you@example.com">'
      + '<label>Message (optional)</label><textarea id="donorMessage" rows="2" placeholder="Leave a message"></textarea>'
      + '<div class="chcn-file-actions"><button class="btn btn-primary" id="donatePaypalBtn" type="button">Donate with PayPal</button>'
      + '<button class="btn btn-outline" id="donateBankBtn" type="button">Donate by bank transfer</button></div>'
      + '<div id="bankChooser" class="chcn-bank-chooser" hidden></div>'
      + '<div id="donateStatus" class="voice-status" aria-live="polite"></div>'
      + '<p class="chcn-set-note" id="paypalNote"></p>'
      + '</div></div>';
    page.appendChild(donate);

    wireReceipt();
    wireDonate();
  }

  function wireReceipt() {
    var input = el('receiptFileInput'), choose = el('receiptChooseBtn');
    var hint = el('receiptHint'), menu = el('receiptChooseMenu');
    // Inside the Android app the in-app browser (WebView) is blocked from
    // opening the system file picker directly, so "Choose file" instead offers
    // the email / WhatsApp apps — from there the receipt can be attached
    // straight from the phone's Gallery or Files. In a normal web browser the
    // real file input opens as expected.
    var isApp = !!global.CreatorHubNative;
    if (hint) {
      hint.innerHTML = isApp
        ? 'On the app, tap <strong>Choose file</strong> to open your Email or WhatsApp, where you can attach the receipt directly from your <strong>Gallery</strong> or <strong>Files</strong>.'
        : 'Pick your receipt to preview it here, then use the <strong>Email</strong> or <strong>WhatsApp</strong> buttons above to send it to the founder.';
    }
    function closeMenu() { if (menu) { menu.hidden = true; menu.innerHTML = ''; } }
    function openAppAttachMenu() {
      if (!menu) { if (typeof global.emailPaymentProof === 'function') global.emailPaymentProof(); return; }
      if (!menu.hidden) { closeMenu(); return; }
      menu.innerHTML = '<button class="btn btn-outline" type="button" id="rcpEmailBtn">\uD83D\uDCE7 Attach with Email (Gallery / Files)</button>'
        + '<button class="btn btn-outline" type="button" id="rcpWaBtn">\uD83D\uDCAC Send with WhatsApp</button>';
      menu.hidden = false;
      var eb = el('rcpEmailBtn'), wb = el('rcpWaBtn');
      if (eb) eb.addEventListener('click', function () { closeMenu(); if (typeof global.emailPaymentProof === 'function') global.emailPaymentProof(); });
      if (wb) wb.addEventListener('click', function () { closeMenu(); if (typeof global.whatsappPayment === 'function') global.whatsappPayment(); });
    }
    choose.addEventListener('click', function () {
      if (isApp) { openAppAttachMenu(); return; }
      input.value = ''; input.click();
    });
    input.addEventListener('change', function () {
      var f = input.files && input.files[0];
      var prev = el('receiptPreview');
      if (!f) { prev.innerHTML = '<span class="chcn-err">No file was selected.</span>'; return; }
      var typeOk = ALLOWED.indexOf(f.type) !== -1 || /\.(pdf|jpe?g|png|webp)$/i.test(f.name);
      if (!typeOk) { prev.innerHTML = '<span class="chcn-err">Unsupported file type. Use PDF, JPG, PNG or WEBP.</span>'; return; }
      if (f.size > MAX_BYTES) { prev.innerHTML = '<span class="chcn-err">File is too large (' + (f.size / 1048576).toFixed(1) + ' MB). Max 8 MB.</span>'; return; }
      var kb = f.size < 1048576 ? (f.size / 1024).toFixed(0) + ' KB' : (f.size / 1048576).toFixed(1) + ' MB';
      var thumb = '';
      if (/^image\//.test(f.type)) {
        var url = URL.createObjectURL(f);
        thumb = '<img src="' + url + '" alt="Receipt preview" class="chcn-thumb" onload="URL.revokeObjectURL(this.src)">';
      } else { thumb = '<span class="chcn-thumb chcn-thumb-pdf">PDF</span>'; }
      prev.innerHTML = thumb + '<div class="chcn-file-meta"><b>' + esc(f.name) + '</b><span>' + esc(f.type || 'file') + ' \u00B7 ' + kb + '</span>'
        + '<button type="button" class="btn btn-sm" id="receiptReplaceBtn">Replace</button> '
        + '<button type="button" class="btn btn-sm" id="receiptRemoveBtn">Remove</button></div>';
      el('receiptReplaceBtn').addEventListener('click', function () { input.value = ''; input.click(); });
      el('receiptRemoveBtn').addEventListener('click', function () { input.value = ''; prev.innerHTML = ''; });
    });
  }

  function wireDonate() {
    var note = el('paypalNote');
    note.textContent = 'PayPal opens in a new tab addressed to ' + PAYPAL_NAME + ' (' + PAYPAL_EMAIL + ', on PayPal since 2024). You choose the donation amount on the PayPal page. Donations are processed in USD.';
    el('donatePaypalBtn').addEventListener('click', function () {
      var status = el('donateStatus');
      var url = paypalDonateUrl(0);
      // Open ONCE in a separate page without ever leaving the app's main screen.
      if (typeof global.chcnOpenExternal === 'function') { global.chcnOpenExternal(url, 'PayPal'); }
      else { var win = global.open(url, '_blank', 'noopener,noreferrer'); if (!win) global.open(url, '_blank'); }
      status.textContent = 'Opening PayPal in a separate page to send your donation to ' + PAYPAL_NAME + '. Choose your amount and complete the payment there — this app stays open.';
    });
    el('donateBankBtn').addEventListener('click', function () {
      var chooser = el('bankChooser');
      if (!chooser) return;
      // Toggle the bank picker open/closed.
      if (!chooser.hidden && chooser.getAttribute('data-open') === '1') {
        chooser.hidden = true; chooser.setAttribute('data-open', '0'); chooser.innerHTML = '';
        return;
      }
      var html = '<p class="chcn-set-note" style="margin:10px 0 6px"><strong>Choose your bank</strong> to open its secure online-banking site in a new tab, then make your transfer there:</p><div class="chcn-bank-list">';
      DONATE_BANKS.forEach(function (b, i) {
        html += '<button type="button" class="btn btn-outline" data-bank="' + i + '">🏦 ' + esc(b.name) + '</button>';
      });
      html += '</div>';
      chooser.innerHTML = html;
      chooser.hidden = false; chooser.setAttribute('data-open', '1');
      chooser.querySelectorAll('button[data-bank]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var bank = DONATE_BANKS[parseInt(btn.getAttribute('data-bank'), 10)];
          if (!bank) return;
          // Open the bank portal ONCE in its own page/tab. Never navigate the
          // app's main page away (fixes "loads 2 pages" / "exits main page").
          if (typeof global.chcnOpenExternal === 'function') { global.chcnOpenExternal(bank.url, bank.name); }
          else { var win = global.open(bank.url, '_blank', 'noopener,noreferrer'); if (!win) global.open(bank.url, '_blank'); }
          el('donateStatus').textContent = 'Opening ' + bank.name + ' in a separate secure page — this app stays open. Complete your transfer there; all accounts are in the name of Ravaun Richards.';
        });
      });
    });
  }

  document.addEventListener('DOMContentLoaded', injectPaymentUpgrades);
  // Re-run when navigating to payment (page starts hidden).
  var _nav = global.navigate;
  if (typeof _nav === 'function') {
    global.navigate = function (p) { _nav.apply(this, arguments); if (p === 'payment') injectPaymentUpgrades(); };
  }
})(window);
