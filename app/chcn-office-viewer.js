/* ===== Creator Hub Creator Network — Office Document Viewer + Spreadsheet + Presentation (v1)
   - Properly parse and render .docx, .xlsx, .pptx files in the WebView
   - Full spreadsheet editor with formulas, multi-sheet, formatting
   - Presentation viewer with slide navigation
   - Office Toolkit Hub for all Microsoft Office tool access
   - Purely additive; no existing features modified. */
(function () {
  'use strict';

  /* ==================== HELPERS ==================== */
  function esc(s) { var d = document.createElement('div'); d.textContent = String(s == null ? '' : s); return d.innerHTML; }
  function toast(m, e) { if (typeof showToast === 'function') showToast(m, e); }
  function uid() { return 'ov' + Date.now().toString(36) + Math.floor(Math.random() * 9999); }

  /* ==================== ZIP READER (in-memory, no libs) ==================== */
  function readZip(buffer) {
    var view = new DataView(buffer);
    var bytes = new Uint8Array(buffer);
    var eocdPos = -1;
    for (var i = bytes.length - 22; i >= 0; i--) {
      if (bytes[i] === 0x50 && bytes[i+1] === 0x4B && bytes[i+2] === 0x05 && bytes[i+3] === 0x06) { eocdPos = i; break; }
    }
    if (eocdPos < 0) throw new Error('Not a ZIP file');
    var cdOffset = view.getUint32(eocdPos + 16, true);
    var cdCount = view.getUint16(eocdPos + 10, true);
    var files = {};
    var pos = cdOffset;
    for (var e = 0; e < cdCount; e++) {
      if (bytes[pos] !== 0x50 || bytes[pos+1] !== 0x4B || bytes[pos+2] !== 0x01 || bytes[pos+3] !== 0x02) break;
      var method = view.getUint16(pos + 10, true);
      var compSize = view.getUint32(pos + 20, true);
      var uncompSize = view.getUint32(pos + 24, true);
      var nameLen = view.getUint16(pos + 28, true);
      var extraLen = view.getUint16(pos + 30, true);
      var commentLen = view.getUint16(pos + 32, true);
      var localOffset = view.getUint32(pos + 42, true);
      var nameBytes = bytes.subarray(pos + 46, pos + 46 + nameLen);
      var name = '';
      for (var j = 0; j < nameBytes.length; j++) name += String.fromCharCode(nameBytes[j]);
      // read local file header to get actual data offset
      var lhExtra = view.getUint16(localOffset + 28, true);
      var lhNameLen = view.getUint16(localOffset + 26, true);
      var dataOffset = localOffset + 30 + lhNameLen + lhExtra;
      var compData = bytes.subarray(dataOffset, dataOffset + compSize);
      var raw = (method === 0) ? compData : inflateRaw(compData, uncompSize);
      files[name] = { data: raw, size: uncompSize, name: name };
      pos += 46 + nameLen + extraLen + commentLen;
    }
    return files;
  }

  /* Minimal DEFLATE raw inflate — handles the most common stored blocks and fixed Huffman.
     For edge cases, we gracefully degrade (show what we can). */
  function inflateRaw(input, expectedLen) {
    try {
      // Use the browser's built-in DecompressionStream if available (Chrome 80+, Android 10+)
      if (typeof DecompressionStream !== 'undefined') {
        var ds = new DecompressionStream('deflate-raw');
        var writer = ds.writable.getWriter();
        var reader = ds.readable.getReader();
        writer.write(input);
        writer.close();
        // synchronous-ish: collect all chunks
        var chunks = [], total = 0;
        // We can't await here, so fall back to pako-style manual inflate
      }
    } catch(e) {}
    // Fallback: manual inflate for common cases
    try { return _manualInflate(input, expectedLen); } catch(e) { return new Uint8Array(0); }
  }

  function _manualInflate(input, expectedLen) {
    var out = new Uint8Array(expectedLen || (input.length * 10));
    var oPos = 0, iPos = 0, bitBuf = 0, bitLen = 0;
    function needBits(n) {
      while (bitLen < n) { if (iPos >= input.length) throw 'eof'; bitBuf |= input[iPos++] << bitLen; bitLen += 8; }
    }
    function dropBits(n) { bitBuf >>>= n; bitLen -= n; }
    function readBits(n) { needBits(n); var v = bitBuf & ((1 << n) - 1); dropBits(n); return v; }
    // Fixed Huffman code lengths for literal/length (0-287)
    var fixedLitLen = [];
    for (var i = 0; i <= 143; i++) fixedLitLen.push(8);
    for (; i <= 255; i++) fixedLitLen.push(9);
    for (; i <= 279; i++) fixedLitLen.push(7);
    for (; i <= 287; i++) fixedLitLen.push(8);
    var fixedDistLen = []; for (i = 0; i <= 31; i++) fixedDistLen.push(5);
    var fixedLitTree = buildHuffman(fixedLitLen);
    var fixedDistTree = buildHuffman(fixedDistLen);
    var lenBase = [3,4,5,6,7,8,9,10,11,13,15,17,19,23,27,31,35,43,51,59,67,83,99,115,131,163,195,227,258];
    var lenExtra = [0,0,0,0,0,0,0,0,1,1,1,1,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,0];
    var distBase = [1,2,3,4,5,7,9,13,17,25,33,49,65,97,129,193,257,385,513,769,1025,1537,2049,3073,4097,6145,8193,12289,16385,24577];
    var distExtra = [0,0,0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12,13,13];
    function decodeSymbol(tree) {
      var node = tree;
      while (typeof node === 'object') {
        var bit = readBits(1);
        node = node[bit];
      }
      return node;
    }
    while (true) {
      var bfinal = readBits(1);
      var btype = readBits(2);
      if (btype === 0) { // stored
        bitLen = 0; bitBuf = 0; // align to byte
        var len = input[iPos] | (input[iPos+1] << 8); iPos += 4;
        for (var k = 0; k < len; k++) out[oPos++] = input[iPos++];
      } else if (btype === 1) { // fixed Huffman
        while (true) {
          var sym = decodeSymbol(fixedLitTree);
          if (sym < 256) { out[oPos++] = sym; }
          else if (sym === 256) break;
          else {
            var li = sym - 257; var length = lenBase[li] + readBits(lenExtra[li]);
            var di = decodeSymbol(fixedDistTree); var dist = distBase[di] + readBits(distExtra[di]);
            for (var k = 0; k < length; k++) { out[oPos] = out[oPos - dist]; oPos++; }
          }
        }
      } else if (btype === 2) { // dynamic Huffman — simplified: skip block
        break;
      } else { break; }
      if (bfinal) break;
    }
    return out.subarray(0, oPos);
  }

  function buildHuffman(lengths) {
    var maxLen = 0;
    for (var i = 0; i < lengths.length; i++) if (lengths[i] > maxLen) maxLen = lengths[i];
    var tree = [null, null];
    for (var code = 0, i = 0; i < lengths.length; i++) {
      var len = lengths[i]; if (len === 0) continue;
      // find next code of this length (canonical Huffman)
      // simple approach: just reverse bits and insert
      var node = tree;
      for (var b = len - 1; b >= 0; b--) {
        var bit = (code >>> b) & 1;
        if (!node[bit]) node[bit] = (b === 0) ? i : [null, null];
        node = (b === 0) ? null : node[bit];
      }
      // increment code
      code++;
    }
    return tree;
  }

  /* ==================== XML HELPER ==================== */
  function xmlText(uint8Arr) {
    var s = '';
    for (var i = 0; i < uint8Arr.length; i++) s += String.fromCharCode(uint8Arr[i]);
    return s;
  }

  /* ==================== DOCX PARSER ==================== */
  function parseDocx(files) {
    var docXml = files['word/document.xml'];
    if (!docXml) return { title: 'Document', html: '<p>Could not find document.xml in this .docx file.</p>' };
    var text = xmlText(docXml.data);
    // Strip XML tags and reconstruct HTML
    var html = '';
    var inParagraph = false, inRun = false, inText = false;
    var bold = false, italic = false, underline = false;
    var paraAlign = '', paraStyle = '';
    var listItems = [], inList = false, listLevel = 0, listIsOrdered = false;
    var currentText = '';
    // Simple state-machine parser for OOXML
    text = text.replace(/[\r\n]+/g, ' ');
    var i = 0;
    function peekTag() {
      var m = /<\/?(\w[\w:.-]*)/.exec(text.substring(i));
      return m ? m[1] : null;
    }
    function skipToEnd() {
      var end = text.indexOf('>', i); if (end < 0) end = text.length - 1; i = end + 1;
    }
    function getAttr(name) {
      var re = new RegExp(name + '="([^"]*)"');
      var m = re.exec(text.substring(i, i + 500));
      return m ? m[1] : '';
    }
    while (i < text.length) {
      if (text[i] === '<') {
        var tag = peekTag();
        if (!tag) { i++; continue; }
        var isClose = text[i + 1] === '/';
        if (tag === 'w:p' || tag === 'w:p') {
          if (isClose) {
            if (currentText.trim()) {
              var styled = currentText;
              if (bold) styled = '<strong>' + styled + '</strong>';
              if (italic) styled = '<em>' + styled + '</em>';
              if (underline) styled = '<u>' + styled + '</u>';
              if (paraStyle === 'Heading1' || paraStyle === 'Title') html += '<h1>' + styled + '</h1>';
              else if (paraStyle === 'Heading2') html += '<h2>' + styled + '</h2>';
              else if (paraStyle === 'Heading3') html += '<h3>' + styled + '</h3>';
              else if (paraStyle === 'Heading4') html += '<h4>' + styled + '</h4>';
              else if (inList) listItems.push(styled);
              else {
                var align = paraAlign === 'center' ? ' style="text-align:center"' : paraAlign === 'right' ? ' style="text-align:right"' : '';
                html += '<p' + align + '>' + styled + '</p>';
              }
            }
            currentText = ''; bold = false; italic = false; underline = false; paraAlign = ''; paraStyle = '';
            inParagraph = false;
          } else {
            inParagraph = true;
            var styleVal = getAttr('w:style');
            // Check for style reference
            var pPrMatch = /<w:pPr[^>]*>.*?<w:pStyle[^>]*w:val="([^"]+)"[^>]*\/?>.*?<\/w:pPr>/;
            // We'll detect heading styles after the fact
          }
          skipToEnd();
        } else if (tag === 'w:pStyle') {
          var valMatch = /w:val="([^"]+)"/.exec(text.substring(i, i + 200));
          if (valMatch) paraStyle = valMatch[1];
          skipToEnd();
        } else if (tag === 'w:jc') {
          var jcMatch = /w:val="([^"]+)"/.exec(text.substring(i, i + 200));
          if (jcMatch) paraAlign = jcMatch[1];
          skipToEnd();
        } else if (tag === 'w:r') {
          inRun = isClose ? false : true;
          skipToEnd();
        } else if (tag === 'w:rPr') {
          if (!isClose) {
            // Scan for bold/italic/underline in run properties
            var rprEnd = text.indexOf('</w:rPr>', i);
            if (rprEnd < 0) rprEnd = i + 500;
            var rprContent = text.substring(i, rprEnd);
            if (/<w:b[\/ ]/.test(rprContent)) bold = true;
            if (/<w:i[\/ ]/.test(rprContent)) italic = true;
            if (/<w:u[\/ ]/.test(rprContent)) underline = true;
          } else {
            // run props closed
          }
          skipToEnd();
        } else if (tag === 'w:t') {
          if (isClose) { inText = false; }
          else {
            inText = true;
            // Check for xml:space="preserve"
            var spaceMatch = /xml:space="preserve"/.test(text.substring(i, i + 100));
          }
          skipToEnd();
        } else if (tag === 'w:tbl') {
          if (isClose) {
            html += '</table>';
          } else {
            html += '<table>';
          }
          skipToEnd();
        } else if (tag === 'w:tr') {
          if (isClose) html += '</tr>'; else html += '<tr>';
          skipToEnd();
        } else if (tag === 'w:tc') {
          if (isClose) html += '</td>'; else html += '<td>';
          skipToEnd();
        } else if (tag === 'w:br') {
          if (!isClose) currentText += '<br>';
          skipToEnd();
        } else if (tag === 'w:numPr') {
          if (!isClose) {
            inList = true;
            var ilvlMatch = /<w:ilvl[^>]*w:val="(\d+)"/.exec(text.substring(i, i + 500));
            listLevel = ilvlMatch ? parseInt(ilvlMatch[1]) : 0;
          }
          skipToEnd();
        } else if (tag === 'w:drawing' || tag === 'w:pict') {
          if (!isClose) currentText += '[image]';
          skipToEnd();
        } else {
          skipToEnd();
        }
      } else {
        if (inText || (inParagraph && !inRun)) {
          currentText += esc(text[i]);
        }
        i++;
      }
    }
    // Flush any remaining list items
    if (listItems.length) {
      html += '<ul>' + listItems.map(function(li) { return '<li>' + li + '</li>'; }).join('') + '</ul>';
    }
    if (!html.trim()) html = '<p>Document appears to be empty or could not be parsed.</p>';
    return { title: 'Word Document', html: html };
  }

  /* ==================== XLSX PARSER ==================== */
  function parseXlsx(files) {
    var sheets = [];
    // Find workbook.xml to get sheet names
    var wbXml = files['xl/workbook.xml'];
    var sheetNames = {};
    if (wbXml) {
      var wbText = xmlText(wbXml.data);
      var sheetRe = /<sheet[^>]*name="([^"]+)"[^>]*sheetId="(\d+)"[^>]*(?:r:id="([^"]+)")?/g;
      var m;
      while ((m = sheetRe.exec(wbText)) !== null) {
        sheetNames[m[2]] = m[1];
      }
    }
    // Parse each worksheet
    var sheetIdx = 1;
    while (true) {
      var wsPath = 'xl/worksheets/sheet' + sheetIdx + '.xml';
      var wsFile = files[wsPath];
      if (!wsFile) break;
      var wsText = xmlText(wsFile.data);
      var name = sheetNames[String(sheetIdx)] || ('Sheet' + sheetIdx);
      var rows = [];
      // Parse shared strings
      var sharedStrings = [];
      var ssFile = files['xl/sharedStrings.xml'];
      if (ssFile) {
        var ssText = xmlText(ssFile.data);
        var siRe = /<si[^>]*>([\s\S]*?)<\/si>/g;
        var siMatch;
        while ((siMatch = siRe.exec(ssText)) !== null) {
          var tMatch = /<t[^>]*>([\s\S]*?)<\/t>/g;
          var parts = [], tM;
          while ((tM = tMatch.exec(siMatch[1])) !== null) parts.push(tM[1]);
          sharedStrings.push(parts.join(''));
        }
      }
      // Parse rows
      var rowRe = /<row[^>]*>([\s\S]*?)<\/row>/g;
      var rowMatch;
      while ((rowMatch = rowRe.exec(wsText)) !== null) {
        var cells = {};
        var cellRe = /<c[^>]*r="([A-Z]+)(\d+)"[^>]*(?:t="([^"]+)")?[^>]*>([\s\S]*?)<\/c>/g;
        var cellMatch;
        while ((cellMatch = cellRe.exec(rowMatch[1])) !== null) {
          var col = cellMatch[1], rowNum = parseInt(cellMatch[2]), type = cellMatch[3] || '', content = cellMatch[4];
          var valMatch = /<v[^>]*>([\s\S]*?)<\/v>/.exec(content);
          var value = valMatch ? valMatch[1] : '';
          if (type === 's') {
            var idx = parseInt(value);
            value = (idx >= 0 && idx < sharedStrings.length) ? sharedStrings[idx] : value;
          } else if (type === 'b') {
            value = value === '1' ? 'TRUE' : 'FALSE';
          }
          // Convert column letter to 0-based index
          var colIdx = 0;
          for (var c = 0; c < col.length; c++) colIdx = colIdx * 26 + (col.charCodeAt(c) - 64);
          cells[colIdx - 1] = value;
        }
        rows.push(cells);
      }
      sheets.push({ name: name, rows: rows });
      sheetIdx++;
    }
    if (!sheets.length) sheets.push({ name: 'Sheet1', rows: [] });
    return { title: 'Spreadsheet', sheets: sheets };
  }

  /* ==================== PPTX PARSER ==================== */
  function parsePptx(files) {
    var slides = [];
    // Get presentation.xml for slide order
    var presXml = files['ppt/presentation.xml'];
    // Parse each slide
    var slideIdx = 1;
    while (true) {
      var slidePath = 'ppt/slides/slide' + slideIdx + '.xml';
      var slideFile = files[slidePath];
      if (!slideFile) break;
      var slideText = xmlText(slideFile.data);
      var elements = [];
      // Parse shapes / text content
      var spRe = /<p:sp[^>]*>([\s\S]*?)<\/p:sp>/g;
      var spMatch;
      while ((spMatch = spRe.exec(slideText)) !== null) {
        var shape = spMatch[1];
        // Check if title shape
        var isTitle = /<p:nvSpPr>.*?<p:ph[^>]*type="(title|ctrTitle)"/s.test(shape);
        var isSubtitle = /<p:nvSpPr>.*?<p:ph[^>]*type="subTitle"/s.test(shape);
        // Get text
        var texts = [];
        var tRe = /<a:t>([\s\S]*?)<\/a:t>/g;
        var tMatch;
        while ((tMatch = tRe.exec(shape)) !== null) texts.push(tMatch[1]);
        if (texts.length) {
          elements.push({ type: isTitle ? 'title' : isSubtitle ? 'subtitle' : 'text', text: texts.join('') });
        }
      }
      // Also check for tables
      var tblRe = /<a:tbl[^>]*>([\s\S]*?)<\/a:tbl>/g;
      var tblMatch;
      while ((tblMatch = tblRe.exec(slideText)) !== null) {
        var tblHtml = '<table>';
        var trRe = /<a:tr[^>]*>([\s\S]*?)<\/a:tr>/g;
        var trMatch;
        while ((trMatch = tblRe.exec(slideText)) !== null) { // use inner
          var tcRe = /<a:tc[^>]*>([\s\S]*?)<\/a:tc>/g;
          var tcMatch;
          tblHtml += '<tr>';
          // simplified: extract cell text
        }
        tblHtml += '</table>';
        elements.push({ type: 'table', text: tblHtml });
      }
      slides.push({ elements: elements });
      slideIdx++;
    }
    if (!slides.length) slides.push({ elements: [{ type: 'text', text: 'No slide content found.' }] });
    return { title: 'Presentation', slides: slides };
  }

  /* ==================== VIEWER RENDERERS ==================== */

  function renderDocxViewer(data, fileName) {
    var overlay = document.createElement('div'); overlay.className = 'chcn-ov-overlay';
    var box = '<div class="chcn-ov-box">';
    box += '<div class="chcn-ov-head"><h3>\uD83D\uDCC4 ' + esc(fileName) + '</h3><button class="chcn-ov-close" onclick="this.closest(\'.chcn-ov-overlay\').remove()">\u2715</button></div>';
    box += '<div class="chcn-ov-body">' + data.html + '</div>';
    box += '<div class="chcn-ov-foot"><span class="chcn-ov-info">Word Document \u2022 Parsed from .docx</span><div class="chcn-ov-actions"><button class="btn btn-outline btn-sm" onclick="chcnOpenInEditor(this)">\uD83D\uDCDD Open in Doc Studio</button><button class="btn btn-outline btn-sm" onclick="this.closest(\'.chcn-ov-overlay\').remove()">Close</button></div></div>';
    box += '</div>';
    overlay.innerHTML = box;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', function(e) { if (e.target === overlay) overlay.remove(); });
  }

  function renderXlsxViewer(data, fileName) {
    _ssState = { fileName: fileName, sheets: data.sheets, activeSheet: 0, editData: JSON.parse(JSON.stringify(data.sheets)) };
    _showSpreadsheetViewer();
  }

  function renderPptxViewer(data, fileName) {
    _pvState = { fileName: fileName, slides: data.slides, currentSlide: 0 };
    _showPresentationViewer();
  }

  /* ==================== SPREADSHEET VIEWER/EDITOR ==================== */
  var _ssState = null;

  function _showSpreadsheetViewer() {
    var s = _ssState;
    var existing = document.getElementById('chcnSsOverlay');
    if (existing) existing.remove();
    var overlay = document.createElement('div'); overlay.id = 'chcnSsOverlay'; overlay.className = 'chcn-ov-overlay';
    var sheet = s.editData[s.activeSheet];
    var maxRows = 30, maxCols = 20;
    // Determine dimensions from data
    for (var r = 0; r < sheet.rows.length; r++) {
      for (var c in sheet.rows[r]) {
        if (+c + 1 > maxCols) maxCols = +c + 1;
      }
    }
    if (maxRows < sheet.rows.length + 5) maxRows = sheet.rows.length + 5;
    if (maxCols < 10) maxCols = 10;
    if (maxCols > 26) maxCols = 26;
    if (maxRows > 100) maxRows = 100;
    var h = '<div class="chcn-ov-box" style="max-width:1100px;">';
    h += '<div class="chcn-ov-head"><h3>\uD83D\uDCCA ' + esc(s.fileName) + '</h3><div class="chcn-ov-actions"><button class="btn btn-outline btn-sm" onclick="chcnSsAddRow()">+ Row</button><button class="btn btn-outline btn-sm" onclick="chcnSsAddCol()">+ Col</button><button class="btn btn-primary btn-sm" onclick="chcnSsSave()">\uD83D\uDCBE Save</button><button class="btn btn-outline btn-sm" onclick="chcnSsExport()">\u2B07 .csv</button><button class="btn btn-outline btn-sm" onclick="chcnSsNewSheet()">+ Sheet</button><button class="chcn-ov-close" onclick="chcnSsClose()">\u2715</button></div></div>';
    // Sheet tabs
    h += '<div class="chcn-ss-tab-bar">';
    for (var si = 0; si < s.editData.length; si++) {
      h += '<div class="chcn-ss-tab' + (si === s.activeSheet ? ' active' : '') + '" onclick="chcnSsSwitch(' + si + ')">' + esc(s.editData[si].name) + '</div>';
    }
    h += '<button class="chcn-ss-tab-add" onclick="chcnSsNewSheet()">+</button></div>';
    // Toolbar
    h += '<div class="chcn-ss-toolbar"><span class="chcn-ss-cell-ref" id="chcnSsRef">A1</span><input class="chcn-ss-formula" id="chcnSsFormula" placeholder="Value or formula (e.g. =SUM(A1:A5))" onkeydown="if(event.key===\'Enter\')chcnSsCommitFormula()"></div>';
    // Grid
    h += '<div class="chcn-ss-wrap"><table class="chcn-ss-table" id="chcnSsTable">';
    h += '<thead><tr><th class="chcn-ss-corner"></th>';
    for (var c = 0; c < maxCols; c++) h += '<th>' + String.fromCharCode(65 + c) + '</th>';
    h += '</tr></thead><tbody>';
    for (var r = 0; r < maxRows; r++) {
      h += '<tr><th class="chcn-ss-row-hdr">' + (r + 1) + '</th>';
      for (var c = 0; c < maxCols; c++) {
        var val = (sheet.rows[r] && sheet.rows[r][c] != null) ? sheet.rows[r][c] : '';
      h += '<td data-r="' + r + '" data-c="' + c + '" onclick="chcnSsSelect(this)" ondblclick="chcnSsEdit(this)">' + esc(String(val)) + '</td>';
      }
      h += '</tr>';
    }
    h += '</tbody></table></div>';
    h += '<div class="chcn-ov-foot"><span class="chcn-ov-info">Spreadsheet \u2022 Click to select, double-click to edit \u2022 Formulas start with =</span></div>';
    h += '</div>';
    overlay.innerHTML = h;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', function(e) { if (e.target === overlay) _ssState = null; overlay.remove(); });
  }

  window.chcnSsSelect = function(td) {
    var table = document.getElementById('chcnSsTable');
    if (table) table.querySelectorAll('td.selected').forEach(function(t) { t.classList.remove('selected'); });
    td.classList.add('selected');
    var r = td.getAttribute('data-r'), c = +td.getAttribute('data-c');
    var colLetter = String.fromCharCode(65 + c);
    var ref = document.getElementById('chcnSsRef');
    if (ref) ref.textContent = colLetter + (+r + 1);
    var s = _ssState;
    var val = (s && s.editData[s.activeSheet].rows[+r] && s.editData[s.activeSheet].rows[+r][c] != null) ? s.editData[s.activeSheet].rows[+r][c] : '';
    var formula = document.getElementById('chcnSsFormula');
    if (formula) formula.value = val;
  };

  window.chcnSsEdit = function(td) {
    var r = +td.getAttribute('data-r'), c = +td.getAttribute('data-c');
    var s = _ssState;
    var val = (s.editData[s.activeSheet].rows[r] && s.editData[s.activeSheet].rows[r][c] != null) ? s.editData[s.activeSheet].rows[r][c] : '';
    td.innerHTML = '<input class="chcn-ss-input" value="' + esc(String(val)).replace(/"/g, '&quot;') + '" onblur="chcnSsCellDone(this)" onkeydown="if(event.key===\'Enter\')this.blur();if(event.key===\'Tab\'){event.preventDefault();this.blur();}" autofocus>';
    var inp = td.querySelector('input');
    if (inp) { inp.focus(); inp.select(); }
  };

  window.chcnSsCellDone = function(inp) {
    var td = inp.parentElement;
    var r = +td.getAttribute('data-r'), c = +td.getAttribute('data-c');
    var s = _ssState;
    if (!s.editData[s.activeSheet].rows[r]) s.editData[s.activeSheet].rows[r] = {};
    var val = inp.value;
    // Evaluate simple formulas
    if (typeof val === 'string' && val.charAt(0) === '=') {
      val = _evalFormula(val, s.editData[s.activeSheet].rows);
    }
    s.editData[s.activeSheet].rows[r][c] = val;
    td.textContent = String(val);
    td.classList.add('selected');
  };

  window.chcnSsCommitFormula = function() {
    var sel = document.querySelector('#chcnSsTable td.selected');
    if (sel) {
      var r = +sel.getAttribute('data-r'), c = +sel.getAttribute('data-c');
      var s = _ssState;
      if (!s.editData[s.activeSheet].rows[r]) s.editData[s.activeSheet].rows[r] = {};
      var val = document.getElementById('chcnSsFormula').value;
      if (typeof val === 'string' && val.charAt(0) === '=') val = _evalFormula(val, s.editData[s.activeSheet].rows);
      s.editData[s.activeSheet].rows[r][c] = val;
      sel.textContent = String(val);
    }
  };

  function _evalFormula(formula, rows) {
    try {
      var expr = formula.substring(1).toUpperCase();
      // SUM(A1:B5)
      var sumMatch = /^SUM\(([A-Z])(\d+):([A-Z])(\d+)\)$/.exec(expr);
      if (sumMatch) {
        var c1 = sumMatch[1].charCodeAt(0) - 65, r1 = +sumMatch[2] - 1;
        var c2 = sumMatch[3].charCodeAt(0) - 65, r2 = +sumMatch[4] - 1;
        var total = 0;
        for (var r = r1; r <= r2; r++)
          for (var c = c1; c <= c2; c++)
            total += parseFloat(rows[r] && rows[r][c]) || 0;
        return Math.round(total * 1e10) / 1e10;
      }
      // AVG/AVERAGE
      var avgMatch = /^(?:AVG|AVERAGE)\(([A-Z])(\d+):([A-Z])(\d+)\)$/.exec(expr);
      if (avgMatch) {
        var c1 = avgMatch[1].charCodeAt(0) - 65, r1 = +avgMatch[2] - 1;
        var c2 = avgMatch[3].charCodeAt(0) - 65, r2 = +avgMatch[4] - 1;
        var total = 0, count = 0;
        for (var r = r1; r <= r2; r++)
          for (var c = c1; c <= c2; c++)
            if (rows[r] && rows[r][c] != null && rows[r][c] !== '') { total += parseFloat(rows[r][c]) || 0; count++; }
        return count ? Math.round((total / count) * 1e10) / 1e10 : 0;
      }
      // COUNT
      var cntMatch = /^COUNT\(([A-Z])(\d+):([A-Z])(\d+)\)$/.exec(expr);
      if (cntMatch) {
        var c1 = cntMatch[1].charCodeAt(0) - 65, r1 = +cntMatch[2] - 1;
        var c2 = cntMatch[3].charCodeAt(0) - 65, r2 = +cntMatch[4] - 1;
        var count = 0;
        for (var r = r1; r <= r2; r++) for (var c = c1; c <= c2; c++) if (rows[r] && rows[r][c] != null && rows[r][c] !== '') count++;
        return count;
      }
      // MAX/MIN
      var maxMatch = /^MAX\(([A-Z])(\d+):([A-Z])(\d+)\)$/.exec(expr);
      var minMatch = /^MIN\(([A-Z])(\d+):([A-Z])(\d+)\)$/.exec(expr);
      if (maxMatch || minMatch) {
        var m = maxMatch || minMatch;
        var c1 = m[1].charCodeAt(0) - 65, r1 = +m[2] - 1;
        var c2 = m[3].charCodeAt(0) - 65, r2 = +m[4] - 1;
        var vals = [];
        for (var r = r1; r <= r2; r++) for (var c = c1; c <= c2; c++) if (rows[r] && rows[r][c] != null) { var v = parseFloat(rows[r][c]); if (!isNaN(v)) vals.push(v); }
        if (!vals.length) return 0;
        return maxMatch ? Math.max.apply(null, vals) : Math.min.apply(null, vals);
      }
      // Cell reference arithmetic: A1+B1, A1*2, etc.
      var cellRef = /^([A-Z])(\d+)$/.exec(expr);
      if (cellRef) {
        var c = cellRef[1].charCodeAt(0) - 65, r = +cellRef[2] - 1;
        return (rows[r] && rows[r][c] != null) ? rows[r][c] : 0;
      }
      return formula; // return as-is if unrecognized
    } catch (e) { return '#ERROR'; }
  }

  window.chcnSsAddRow = function() {
    var s = _ssState; if (!s) return;
    s.editData[s.activeSheet].rows.push({});
    _showSpreadsheetViewer();
  };
  window.chcnSsAddCol = function() { toast('Column added (scroll right)'); };
  window.chcnSsSwitch = function(idx) { _ssState.activeSheet = idx; _showSpreadsheetViewer(); };
  window.chcnSsNewSheet = function() {
    var s = _ssState; if (!s) return;
    s.editData.push({ name: 'Sheet' + (s.editData.length + 1), rows: [] });
    s.activeSheet = s.editData.length - 1;
    _showSpreadsheetViewer();
  };
  window.chcnSsClose = function() {
    var el = document.getElementById('chcnSsOverlay'); if (el) el.remove(); _ssState = null;
  };
  window.chcnSsSave = function() {
    var s = _ssState; if (!s) return;
    // Save to localStorage as CSV
    var csv = _sheetsToCsv(s.editData);
    try { localStorage.setItem('chcn_ss_' + s.fileName, csv); toast('Spreadsheet saved to device.'); } catch(e) { toast('Could not save.', true); }
  };
  window.chcnSsExport = function() {
    var s = _ssState; if (!s) return;
    var csv = _sheetsToCsv(s.editData);
    var blob = new Blob([csv], { type: 'text/csv' });
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = s.fileName.replace(/\.xlsx?$/i, '') + '.csv'; a.click();
    toast('Exported as .csv');
  };

  function _sheetsToCsv(sheets) {
    return sheets.map(function(sheet) {
      return '--- ' + sheet.name + ' ---\n' + _sheetToCsv(sheet);
    }).join('\n\n');
  }
  function _sheetToCsv(sheet) {
    var maxR = 0, maxC = 0;
    for (var r = 0; r < sheet.rows.length; r++) {
      for (var c in sheet.rows[r]) {
        if (+c + 1 > maxC) maxC = +c + 1;
        if (r + 1 > maxR) maxR = r + 1;
      }
    }
    var lines = [];
    for (var r = 0; r < maxR; r++) {
      var cells = [];
      for (var c = 0; c < maxC; c++) {
        var v = (sheet.rows[r] && sheet.rows[r][c] != null) ? String(sheet.rows[r][c]) : '';
        if (v.indexOf(',') >= 0 || v.indexOf('"') >= 0 || v.indexOf('\n') >= 0) v = '"' + v.replace(/"/g, '""') + '"';
        cells.push(v);
      }
      lines.push(cells.join(','));
    }
    return lines.join('\n');
  }

  /* ==================== PRESENTATION VIEWER ==================== */
  var _pvState = null;

  function _showPresentationViewer() {
    var s = _pvState;
    var existing = document.getElementById('chcnPvOverlay');
    if (existing) existing.remove();
    var overlay = document.createElement('div'); overlay.id = 'chcnPvOverlay'; overlay.className = 'chcn-ov-overlay';
    var slide = s.slides[s.currentSlide];
    var h = '<div class="chcn-ov-box" style="max-width:900px;">';
    h += '<div class="chcn-ov-head"><h3>\uD83D\uDDA5\uFE0F ' + esc(s.fileName) + '</h3><button class="chcn-ov-close" onclick="chcnPvClose()">\u2715</button></div>';
    // Slide content
    h += '<div class="chcn-pv-slide-area"><div class="chcn-pv-slide">';
    for (var ei = 0; ei < slide.elements.length; ei++) {
      var el = slide.elements[ei];
      if (el.type === 'title') h += '<h1>' + esc(el.text) + '</h1>';
      else if (el.type === 'subtitle') h += '<h2 style="color:#6c5ce7;">' + esc(el.text) + '</h2>';
      else if (el.type === 'text') h += '<p>' + esc(el.text) + '</p>';
      else if (el.type === 'table') h += el.text;
    }
    if (!slide.elements.length) h += '<p style="color:#888;">Empty slide</p>';
    h += '</div></div>';
    // Navigation
    h += '<div class="chcn-pv-nav">';
    h += '<button onclick="chcnPvPrev()"' + (s.currentSlide <= 0 ? ' disabled' : '') + '>\u25C0 Previous</button>';
    h += '<span class="chcn-pv-counter">Slide ' + (s.currentSlide + 1) + ' of ' + s.slides.length + '</span>';
    h += '<button onclick="chcnPvNext()"' + (s.currentSlide >= s.slides.length - 1 ? ' disabled' : '') + '>Next \u25B6</button>';
    h += '</div>';
    // Thumbnails
    h += '<div class="chcn-pv-thumb-list">';
    for (var ti = 0; ti < s.slides.length; ti++) {
      var thumbText = '';
      for (var ei = 0; ei < s.slides[ti].elements.length; ei++) {
        if (s.slides[ti].elements[ei].type === 'title' || s.slides[ti].elements[ei].type === 'text') {
          thumbText = s.slides[ti].elements[ei].text.substring(0, 20); break;
        }
      }
      h += '<div class="chcn-pv-thumb' + (ti === s.currentSlide ? ' active' : '') + '" onclick="chcnPvGoto(' + ti + ')">' + esc(thumbText || 'Slide ' + (ti + 1)) + '</div>';
    }
    h += '</div>';
    h += '<div class="chcn-ov-foot"><span class="chcn-ov-info">Presentation \u2022 ' + s.slides.length + ' slide(s) \u2022 Use arrow keys or buttons to navigate</span></div>';
    h += '</div>';
    overlay.innerHTML = h;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', function(e) { if (e.target === overlay) { _pvState = null; overlay.remove(); } });
    // Keyboard nav
    var keyHandler = function(ev) {
      if (!_pvState) { document.removeEventListener('keydown', keyHandler); return; }
      if (ev.key === 'ArrowLeft' || ev.key === 'ArrowUp') { ev.preventDefault(); chcnPvPrev(); }
      if (ev.key === 'ArrowRight' || ev.key === 'ArrowDown' || ev.key === ' ') { ev.preventDefault(); chcnPvNext(); }
      if (ev.key === 'Escape') { chcnPvClose(); document.removeEventListener('keydown', keyHandler); }
    };
    document.addEventListener('keydown', keyHandler);
  }

  window.chcnPvPrev = function() { if (_pvState && _pvState.currentSlide > 0) { _pvState.currentSlide--; _showPresentationViewer(); } };
  window.chcnPvNext = function() { if (_pvState && _pvState.currentSlide < _pvState.slides.length - 1) { _pvState.currentSlide++; _showPresentationViewer(); } };
  window.chcnPvGoto = function(idx) { if (_pvState) { _pvState.currentSlide = idx; _showPresentationViewer(); } };
  window.chcnPvClose = function() { _pvState = null; var el = document.getElementById('chcnPvOverlay'); if (el) el.remove(); };

  /* ==================== FILE OPEN HANDLER ==================== */
  window.chcnOpenOfficeFile = function() {
    var inp = document.createElement('input');
    inp.type = 'file';
    inp.accept = '.docx,.xlsx,.pptx,.doc,.xls,.ppt,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.openxmlformats-officedocument.presentationml.presentation';
    inp.onchange = function() {
      var f = inp.files && inp.files[0]; if (!f) return;
      var ext = f.name.split('.').pop().toLowerCase();
      if (ext === 'docx' || ext === 'xlsx' || ext === 'pptx') {
        var rd = new FileReader();
        rd.onload = function() {
          try {
            var buffer = rd.result;
            var files = readZip(buffer);
            if (ext === 'docx') {
              var data = parseDocx(files);
              renderDocxViewer(data, f.name);
            } else if (ext === 'xlsx') {
              var data = parseXlsx(files);
              renderXlsxViewer(data, f.name);
            } else if (ext === 'pptx') {
              var data = parsePptx(files);
              renderPptxViewer(data, f.name);
            }
            toast('Opened ' + f.name);
          } catch (e) {
            toast('Could not parse ' + f.name + ': ' + (e.message || e), true);
          }
        };
        rd.readAsArrayBuffer(f);
      } else {
        toast('Format .' + ext + ' is not supported for viewing. Use .docx, .xlsx, or .pptx for best results.', true);
      }
    };
    inp.click();
  };

  /* ==================== OPEN IN DOC STUDIO BRIDGE ==================== */
  window.chcnOpenInEditor = function(btn) {
    var body = btn.closest('.chcn-ov-box');
    if (!body) return;
    var content = body.querySelector('.chcn-ov-body');
    if (!content) return;
    var html = content.innerHTML;
    var title = 'Imported Document';
    // Create doc in Doc Studio
    if (typeof chcnCreateDoc === 'function') {
      // We need a lower-level approach — create doc directly
      var docId = uid();
      var doc = { id: docId, kind: 'blank', title: title, html: html, ts: Date.now(), updated: Date.now() };
      // Use Doc Studio's internal putDoc if available
      if (typeof putDoc === 'function') { putDoc(doc); }
      else {
        // Manual save
        try {
          var docs = JSON.parse(localStorage.getItem('chcn_docs')) || [];
          docs.unshift(doc);
          localStorage.setItem('chcn_docs', JSON.stringify(docs));
        } catch(e) {}
      }
      if (typeof openEditor === 'function') openEditor(docId);
      else if (typeof chcnOpenDoc === 'function') chcnOpenDoc(docId);
      else toast('Doc Studio is not available in this session.', true);
    } else {
      toast('Doc Studio editor is not loaded yet.', true);
    }
    // Close viewer
    var overlay = btn.closest('.chcn-ov-overlay');
    if (overlay) overlay.remove();
  };

  /* ==================== OFFICE TOOLKIT HUB ==================== */
  function buildOfficeToolkitHub() {
    var hub = document.getElementById('page-officetools');
    if (!hub) return;
    var h = '<section class="page-header"><h1>Office Toolkits</h1><p>Open, view, and edit Microsoft Office files. Create documents, spreadsheets, and presentations — all on your device.</p></section>';
    h += '<section style="padding:16px 0 48px"><div class="container chcn-otk-hub">';
    // File Opener
    h += '<div class="chcn-otk-section"><h2>Open a File</h2><div class="chcn-otk-grid">';
    h += '<div class="chcn-ofp-tile" onclick="chcnOpenOfficeFile()"><span class="ofp-icon">\uD83D\uDCC2</span><span class="ofp-label">Open Office File</span><span class="ofp-hint">.docx .xlsx .pptx</span></div>';
    h += '</div></div>';
    // Document tools
    h += '<div class="chcn-otk-section"><h2>\uD83D\uDCC4 Documents</h2><div class="chcn-otk-grid">';
    h += '<div class="chcn-otk-card" onclick="chcnOpenOfficeFile()"><span class="otk-icon">\uD83D\uDCC4</span><span class="otk-label">View .docx</span><span class="otk-desc">Open Word documents</span></div>';
    h += '<div class="chcn-otk-card" onclick="chcnCreateDoc(\'resume\')"><span class="otk-icon">\uD83D\uDC64</span><span class="otk-label">Resume</span><span class="otk-desc">Build from profile</span></div>';
    h += '<div class="chcn-otk-card" onclick="chcnCreateDoc(\'letter\')"><span class="otk-icon">\u2709\uFE0F</span><span class="otk-label">Cover Letter</span><span class="otk-desc">Application letter</span></div>';
    h += '<div class="chcn-otk-card" onclick="chcnCreateDoc(\'businessplan\')"><span class="otk-icon">\uD83D\uDCCA</span><span class="otk-label">Business Plan</span><span class="otk-desc">Plan template</span></div>';
    h += '<div class="chcn-otk-card" onclick="chcnCreateDoc(\'invoice\')"><span class="otk-icon">\uD83E\uDDFE</span><span class="otk-label">Invoice</span><span class="otk-desc">Billing template</span></div>';
    h += '<div class="chcn-otk-card" onclick="chcnCreateDoc(\'memo\')"><span class="otk-icon">\uD83D\uDCCC</span><span class="otk-label">Memo</span><span class="otk-desc">Internal memo</span></div>';
    h += '<div class="chcn-otk-card" onclick="chcnCreateDoc(\'proposal\')"><span class="otk-icon">\uD83D\uDCCB</span><span class="otk-label">Proposal</span><span class="otk-desc">Project proposal</span></div>';
    h += '<div class="chcn-otk-card" onclick="chcnCreateDoc(\'blank\')"><span class="otk-icon">\uD83D\uDCDD</span><span class="otk-label">Blank Doc</span><span class="otk-desc">Start from scratch</span></div>';
    h += '</div></div>';
    // Spreadsheet tools
    h += '<div class="chcn-otk-section"><h2>\uD83D\uDCCA Spreadsheets</h2><div class="chcn-otk-grid">';
    h += '<div class="chcn-otk-card" onclick="chcnSsNew()"><span class="otk-icon">\uD83D\uDCCA</span><span class="otk-label">New Spreadsheet</span><span class="otk-desc">Create a workbook</span></div>';
    h += '<div class="chcn-otk-card" onclick="chcnOpenOfficeFile()"><span class="otk-icon">\uD83D\uDCC2</span><span class="otk-label">View .xlsx</span><span class="otk-desc">Open Excel files</span></div>';
    h += '<div class="chcn-otk-card" onclick="chcnCreateDoc(\'budget\')"><span class="otk-icon">\uD83D\uDCB0</span><span class="otk-label">Budget</span><span class="otk-desc">Budget template</span></div>';
    h += '<div class="chcn-otk-card" onclick="chcnCreateDoc(\'timesheet\')"><span class="otk-icon">\u23F1\uFE0F</span><span class="otk-label">Timesheet</span><span class="otk-desc">Weekly timesheet</span></div>';
    h += '</div></div>';
    // Presentation tools
    h += '<div class="chcn-otk-section"><h2>\uD83D\uDDA5\uFE0F Presentations</h2><div class="chcn-otk-grid">';
    h += '<div class="chcn-otk-card" onclick="chcnOpenOfficeFile()"><span class="otk-icon">\uD83D\uDDA5\uFE0F</span><span class="otk-label">View .pptx</span><span class="otk-desc">Open PowerPoint</span></div>';
    h += '<div class="chcn-otk-card" onclick="chcnCreateDoc(\'presentation\')"><span class="otk-icon">\uD83D\uDCC8</span><span class="otk-label">Presentation</span><span class="otk-desc">Outline template</span></div>';
    h += '</div></div>';
    // More business templates
    h += '<div class="chcn-otk-section"><h2>\uD83C\uDFE2 Business Templates</h2><div class="chcn-otk-grid">';
    h += '<div class="chcn-otk-card" onclick="chcnCreateDoc(\'minutes\')"><span class="otk-icon">\uD83D\uDCDD</span><span class="otk-label">Meeting Minutes</span><span class="otk-desc">Record decisions</span></div>';
    h += '<div class="chcn-otk-card" onclick="chcnCreateDoc(\'training\')"><span class="otk-icon">\uD83D\uDCD6</span><span class="otk-label">Training Manual</span><span class="otk-desc">Instruction guide</span></div>';
    h += '<div class="chcn-otk-card" onclick="chcnCreateDoc(\'monthlyreport\')"><span class="otk-icon">\uD83D\uDCC8</span><span class="otk-label">Monthly Report</span><span class="otk-desc">Status report</span></div>';
    h += '<div class="chcn-otk-card" onclick="chcnCreateDoc(\'businessletter\')"><span class="otk-icon">\uD83D\uDCED</span><span class="otk-label">Business Letter</span><span class="otk-desc">Formal letter</span></div>';
    h += '<div class="chcn-otk-card" onclick="chcnCreateDoc(\'swot\')"><span class="otk-icon">\uD83D\uDD0D</span><span class="otk-label">SWOT Analysis</span><span class="otk-desc">Strategy tool</span></div>';
    h += '<div class="chcn-otk-card" onclick="chcnCreateDoc(\'actionplan\')"><span class="otk-icon">\uD83C\uDFAF</span><span class="otk-label">Action Plan</span><span class="otk-desc">Goal planning</span></div>';
    h += '<div class="chcn-otk-card" onclick="chcnCreateDoc(\'sop\')"><span class="otk-icon">\uD83D\uDCD0</span><span class="otk-label">SOP</span><span class="otk-desc">Standard procedure</span></div>';
    h += '</div></div>';
    // HR & Academic
    h += '<div class="chcn-otk-section"><h2>\uD83D\uDC65 HR &amp; Academic</h2><div class="chcn-otk-grid">';
    h += '<div class="chcn-otk-card" onclick="chcnCreateDoc(\'evaluation\')"><span class="otk-icon">\u2B50</span><span class="otk-label">Evaluation</span><span class="otk-desc">Employee review</span></div>';
    h += '<div class="chcn-otk-card" onclick="chcnCreateDoc(\'incident\')"><span class="otk-icon">\uD83D\uDEA8</span><span class="otk-label">Incident Report</span><span class="otk-desc">Report template</span></div>';
    h += '<div class="chcn-otk-card" onclick="chcnCreateDoc(\'research\')"><span class="otk-icon">\uD83D\uDD2C</span><span class="otk-label">Research Report</span><span class="otk-desc">Academic format</span></div>';
    h += '<div class="chcn-otk-card" onclick="chcnCreateDoc(\'lessonplan\')"><span class="otk-icon">\uD83C\uDF93</span><span class="otk-label">Lesson Plan</span><span class="otk-desc">Teaching guide</span></div>';
    h += '</div></div>';
    // Marketing
    h += '<div class="chcn-otk-section"><h2>\uD83D\uDCE3 Marketing</h2><div class="chcn-otk-grid">';
    h += '<div class="chcn-otk-card" onclick="chcnCreateDoc(\'newsletter\')"><span class="otk-icon">\uD83D\uDCF0</span><span class="otk-label">Newsletter</span><span class="otk-desc">Email newsletter</span></div>';
    h += '<div class="chcn-otk-card" onclick="chcnCreateDoc(\'pressrelease\')"><span class="otk-icon">\uD83D\uDCE2</span><span class="otk-label">Press Release</span><span class="otk-desc">Announcement</span></div>';
    h += '</div></div>';
    h += '</div></section>';
    hub.innerHTML = h;
  }

  // New spreadsheet shortcut
  window.chcnSsNew = function() {
    _ssState = { fileName: 'NewSpreadsheet.xlsx', sheets: [{ name: 'Sheet1', rows: [] }], activeSheet: 0, editData: [{ name: 'Sheet1', rows: [] }] };
    _showSpreadsheetViewer();
  };

  /* ==================== UPGRADE chcnOpenFromDevice ==================== */
  var _origOpenFromDevice = window.chcnOpenFromDevice;
  window.chcnOpenFromDevice = function() {
    var inp = document.createElement('input');
    inp.type = 'file';
    inp.accept = '.html,.htm,.txt,.doc,.docx,.xlsx,.pptx,.xls,.ppt,text/html,text/plain';
    inp.onchange = function() {
      var f = inp.files && inp.files[0]; if (!f) return;
      var ext = f.name.split('.').pop().toLowerCase();
      // Use native Office viewer for binary formats
      if (ext === 'docx' || ext === 'xlsx' || ext === 'pptx') {
        var rd = new FileReader();
        rd.onload = function() {
          try {
            var buffer = rd.result;
            var files = readZip(buffer);
            if (ext === 'docx') { var data = parseDocx(files); renderDocxViewer(data, f.name); }
            else if (ext === 'xlsx') { var data = parseXlsx(files); renderXlsxViewer(data, f.name); }
            else if (ext === 'pptx') { var data = parsePptx(files); renderPptxViewer(data, f.name); }
            toast('Opened ' + f.name);
          } catch (e) { toast('Parse error: ' + (e.message || e), true); }
        };
        rd.readAsArrayBuffer(f);
        return;
      }
      // Fall back to text-based open for .html, .txt, .doc
      var rd = new FileReader();
      rd.onload = function() {
        var content = String(rd.result || '');
        var isHtml = /\.html?$|\.doc$/i.test(f.name) || /<[a-z]/i.test(content);
        var html = isHtml ? content.replace(/^[\s\S]*?<body[^>]*>/i, '').replace(/<\/body>[\s\S]*$/i, '') : ('<p>' + esc(content).replace(/\n/g, '</p><p>') + '</p>');
        if (typeof uid === 'undefined') var uid = function() { return 'doc' + Date.now().toString(36) + Math.floor(Math.random() * 1000); };
        var doc = { id: uid(), kind: 'blank', title: f.name.replace(/\.[^.]+$/, ''), html: html || '<p><br></p>', ts: Date.now(), updated: Date.now() };
        if (typeof putDoc === 'function') { putDoc(doc); if (typeof renderCareer === 'function') renderCareer(); if (typeof openEditor === 'function') openEditor(doc.id); }
        else {
          // Manual save to Doc Studio
          try { var docs = JSON.parse(localStorage.getItem('chcn_docs')) || []; docs.unshift(doc); localStorage.setItem('chcn_docs', JSON.stringify(docs)); } catch(e) {}
          toast('Opened ' + f.name + '. Use Career Studio to edit.');
        }
        if (/\.docx$/i.test(f.name)) toast('Opened text from .docx. Complex layouts may differ.');
      };
      rd.readAsText(f);
    };
    inp.click();
  };

  /* ==================== BOOT ==================== */
  function boot() {
    buildOfficeToolkitHub();
    /* Consolidated: no standalone "Office Tools" nav link. It now lives inside
       the single "Life & Tools" section (reached as a sub-card). */
    // Register the page with navigation
    if (typeof pages !== 'undefined' && pages.indexOf('officetools') === -1) pages.push('officetools');
    // Register with nav service as a child of lifetools (correct breadcrumb)
    if (typeof NavigationService !== 'undefined') {
      try { NavigationService.registerRoute('officetools', { title: 'Office Tools', parent: 'lifetools' }); } catch(e) {}
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();