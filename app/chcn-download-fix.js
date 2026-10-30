/* =============================================================================
 * Creator Hub — Download Failed fix (chcn-download-fix.js)
 * -----------------------------------------------------------------------------
 * In the Android app (WebView) a client-generated file download done with
 * `a.download = name; a.click()` on a blob: URL often shows “Download Failed”
 * because the WebView has no download handler for blob URLs. Normal web
 * browsers handle it fine.
 *
 * This patch intercepts those programmatic blob/data downloads ONLY when we are
 * running inside the app, reads the content, and opens it in a small in-app
 * viewer (iframe) with Print / Open-in-browser / Close buttons — so the user
 * can actually view, print or save the file. In a normal browser the real
 * download runs unchanged. Purely additive.
 * ========================================================================== */
(function (global) {
  'use strict';
  if (global.__chcnDownloadFix) return; global.__chcnDownloadFix = true;

  function insideApp() { try { return !!global.CreatorHubNative; } catch (e) { return false; } }
  function toast(m, err) { try { if (typeof global.showToast === 'function') global.showToast(m, err); } catch (e) {} }

  function mimeFromName(name) {
    var ext = String(name || '').split('.').pop().toLowerCase();
    return ({ html: 'text/html', htm: 'text/html', pdf: 'application/pdf', png: 'image/png',
      jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', txt: 'text/plain',
      csv: 'text/csv', json: 'application/json' })[ext] || 'application/octet-stream';
  }

  function closeViewer() {
    var ov = document.getElementById('chcnDownloadViewer');
    if (ov && ov.parentNode) ov.parentNode.removeChild(ov);
  }

  // Show the generated file in an in-app viewer with Print / Open / Close.
  function openInViewer(dataUrl, mime, filename) {
    closeViewer();
    var ov = document.createElement('div');
    ov.id = 'chcnDownloadViewer';
    ov.setAttribute('role', 'dialog');
    ov.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;padding:16px;';
    var box = document.createElement('div');
    box.style.cssText = 'background:#fff;border-radius:14px;max-width:900px;width:100%;max-height:92vh;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.4);';
    var bar = document.createElement('div');
    bar.style.cssText = 'display:flex;gap:8px;align-items:center;flex-wrap:wrap;padding:12px 14px;border-bottom:1px solid #e5e7eb;';
    var title = document.createElement('strong');
    title.textContent = filename || 'File';
    title.style.cssText = 'flex:1;min-width:120px;font-size:14px;color:#1f2937;word-break:break-all;';
    bar.appendChild(title);

    function mkBtn(label) {
      var b = document.createElement('button');
      b.type = 'button'; b.textContent = label;
      b.style.cssText = 'border:1px solid #d1d5db;background:#f9fafb;border-radius:8px;padding:8px 12px;font-size:13px;cursor:pointer;';
      return b;
    }
    var frame = document.createElement('iframe');
    frame.style.cssText = 'flex:1;width:100%;min-height:60vh;border:0;background:#fff;';
    frame.src = dataUrl;

    var isPrintable = /^text\/html|^application\/pdf|^image\//.test(mime);
    if (isPrintable) {
      var printBtn = mkBtn('\uD83D\uDDA8 Print / Save as PDF');
      printBtn.addEventListener('click', function () {
        try { frame.contentWindow.focus(); frame.contentWindow.print(); }
        catch (e) { if (typeof global.chcnOpenExternal === 'function') global.chcnOpenExternal(dataUrl, filename); }
      });
      bar.appendChild(printBtn);
    }
    var openBtn = mkBtn('\u2197 Open in browser');
    openBtn.addEventListener('click', function () {
      if (typeof global.chcnOpenExternal === 'function') global.chcnOpenExternal(dataUrl, filename);
      else global.open(dataUrl, '_blank');
    });
    bar.appendChild(openBtn);
    var closeBtn = mkBtn('\u2715 Close');
    closeBtn.addEventListener('click', closeViewer);
    bar.appendChild(closeBtn);

    box.appendChild(bar); box.appendChild(frame); ov.appendChild(box);
    ov.addEventListener('click', function (e) { if (e.target === ov) closeViewer(); });
    document.body.appendChild(ov);
    toast('Your file opened here — use Print / Save as PDF, or Open in browser.');
  }

  function rerouteBlob(href, filename) {
    var mime = mimeFromName(filename);
    try {
      global.fetch(href).then(function (r) { return r.blob(); }).then(function (b) {
        var fr = new FileReader();
        fr.onload = function () { openInViewer(fr.result, b.type || mime, filename); };
        fr.onerror = function () { if (typeof global.chcnOpenExternal === 'function') global.chcnOpenExternal(href, filename); };
        fr.readAsDataURL(b);
      }).catch(function () {
        if (typeof global.chcnOpenExternal === 'function') global.chcnOpenExternal(href, filename);
      });
    } catch (e) {
      if (typeof global.chcnOpenExternal === 'function') global.chcnOpenExternal(href, filename);
    }
  }

  // Public helper other code can call directly.
  global.chcnSafeDownload = function (content, filename, mime) {
    mime = mime || mimeFromName(filename);
    if (!insideApp()) {
      try {
        var blob = (content instanceof Blob) ? content : new Blob([content], { type: mime });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a'); a.href = url; a.download = filename || 'download';
        document.body.appendChild(a); a.click();
        setTimeout(function () { try { document.body.removeChild(a); } catch (e) {} URL.revokeObjectURL(url); }, 1500);
        return true;
      } catch (e) { /* fall through to viewer */ }
    }
    try {
      if (content instanceof Blob) {
        var fr = new FileReader();
        fr.onload = function () { openInViewer(fr.result, mime, filename); };
        fr.readAsDataURL(content);
      } else {
        openInViewer('data:' + mime + ';charset=utf-8,' + encodeURIComponent(content), mime, filename);
      }
      return true;
    } catch (e) { return false; }
  };

  // Intercept programmatic blob/data downloads inside the app only.
  var origClick = HTMLAnchorElement.prototype.click;
  HTMLAnchorElement.prototype.click = function () {
    try {
      if (insideApp()) {
        var dl = this.getAttribute && this.getAttribute('download');
        var href = this.href || '';
        if (dl && /^(blob:|data:)/i.test(href)) {
          rerouteBlob(href, dl);
          return;
        }
      }
    } catch (e) {}
    return origClick.apply(this, arguments);
  };
})(window);
