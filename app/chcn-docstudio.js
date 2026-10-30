/* ===== Creator Hub Creator Network — Career Studio + Word-style editor (v27)
   - Auto-build Resume, Application (cover) Letter and Career Portfolio from
     the learner's profile, certificates and enrolled courses.
   - Full document editor: File / Home / Insert / Layout / Design / References
     / Review ribbon, undo-redo, fonts, colours, lists, tables, pictures,
     find & replace, format painter, headers/footers, page setup, themes,
     table of contents, citations, spell-check, track changes, comments.
   - Save to device, Save As .docx / .doc / .html / .txt, Print, Export PDF,
     Share by email, Open from device. Purely additive. */
(function () {
  'use strict';

  function esc(s) { var d = document.createElement('div'); d.textContent = String(s == null ? '' : s); return d.innerHTML; }
  function getUserSafe() { try { return (typeof getUser === 'function') ? getUser() : null; } catch (e) { return null; } }
  function toast(m, e) { if (typeof showToast === 'function') showToast(m, e); }
  function uid() { return 'doc' + Date.now().toString(36) + Math.floor(Math.random() * 1000); }

  function loadDocs() { try { return JSON.parse(localStorage.getItem('chcn_docs')) || []; } catch (e) { return []; } }
  function saveDocs(a) { try { localStorage.setItem('chcn_docs', JSON.stringify(a)); return true; } catch (e) { toast('Storage full — document not saved', true); return false; } }
  function getDoc(id) { return loadDocs().filter(function (d) { return d.id === id; })[0]; }
  function putDoc(doc) {
    var a = loadDocs(); var found = false;
    for (var i = 0; i < a.length; i++) if (a[i].id === doc.id) { a[i] = doc; found = true; }
    if (!found) a.unshift(doc);
    return saveDocs(a);
  }

  // -------- profile snapshot for auto-generation --------
  function profileData() {
    var u = getUserSafe() || {};
    var addr = [u.addr1, u.addr2, u.city, u.state, u.zip, u.country].filter(Boolean).join(', ');
    var certs = []; try { certs = JSON.parse(localStorage.getItem('chcn_certs')) || []; } catch (e) {}
    var enrolled = []; try { enrolled = JSON.parse(localStorage.getItem('chcn_enrolled')) || []; } catch (e) {}
    return {
      name: (u.name || 'Your Name'), email: u.email || '', phone: u.phone || '',
      address: addr, nationality: u.nationality || '', headline: u.headline || '',
      bio: u.bio || '', certs: certs, enrolled: enrolled
    };
  }
  function certTitle(c) { return c.courseName || c.name || c.certFull || c.cert || 'Course completion'; }

  // -------- templates --------
  function tmplResume(p) {
    var h = '<h1 style="text-align:center;margin:0;">' + esc(p.name) + '</h1>';
    var contact = [p.email, p.phone, p.address, p.nationality ? ('Nationality: ' + p.nationality) : ''].filter(Boolean).join('  •  ');
    h += '<p style="text-align:center;color:#555;">' + esc(contact) + '</p>';
    if (p.headline) h += '<p style="text-align:center;"><strong>' + esc(p.headline) + '</strong></p>';
    h += '<hr>';
    h += '<h2>Professional Summary</h2><p>' + esc(p.bio || 'Motivated learner building practical, career-ready skills through Creator Hub Creator Network. Add your summary here.') + '</p>';
    h += '<h2>Certifications &amp; Training</h2>';
    if (p.certs.length) { h += '<ul>'; p.certs.forEach(function (c) { h += '<li><strong>' + esc(certTitle(c)) + '</strong>' + (c.date ? ' — ' + esc(c.date) : '') + '</li>'; }); h += '</ul>'; }
    else h += '<ul><li>Add your certificates and completed courses here.</li></ul>';
    h += '<h2>Skills</h2><ul><li>Add a key skill</li><li>Add a key skill</li><li>Add a key skill</li></ul>';
    h += '<h2>Experience</h2><p><strong>Job title</strong> — Company, Location (dates)</p><ul><li>Describe an achievement or responsibility.</li></ul>';
    h += '<h2>Education</h2><p>School / programme — qualification (year)</p>';
    h += '<h2>References</h2><p>Available on request.</p>';
    return h;
  }
  function tmplLetter(p) {
    var today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    var h = '<p>' + esc(p.name) + '</p>';
    if (p.address) h += '<p>' + esc(p.address) + '</p>';
    var line2 = [p.phone, p.email].filter(Boolean).join('  •  ');
    if (line2) h += '<p>' + esc(line2) + '</p>';
    h += '<p>' + esc(today) + '</p><br>';
    h += '<p>Hiring Manager<br>[Company name]<br>[Company address]</p><br>';
    h += '<p>Dear Hiring Manager,</p>';
    h += '<p>I am writing to express my strong interest in the [position] role at [Company]. ' + esc(p.headline ? ('As ' + p.headline + ', ') : '') + 'I am confident that my training and drive make me a strong candidate.</p>';
    h += '<p>Through Creator Hub Creator Network I have completed' + (p.certs.length ? ' ' + p.certs.length + ' certification(s), including ' + esc(certTitle(p.certs[0])) + ',' : ' focused training') + ' and developed practical, job-ready skills. I am eager to apply what I have learned and to keep growing with your team.</p>';
    h += '<p>Thank you for considering my application. I would welcome the opportunity to discuss how I can contribute. I can be reached at ' + esc(p.phone || p.email || '[your contact]') + '.</p>';
    h += '<p>Sincerely,</p><p>' + esc(p.name) + '</p>';
    return h;
  }
  function tmplPortfolio(p) {
    var h = '<h1 style="text-align:center;margin:0;">' + esc(p.name) + '</h1>';
    h += '<p style="text-align:center;color:#555;">Career Portfolio</p>';
    var contact = [p.email, p.phone, p.address].filter(Boolean).join('  •  ');
    if (contact) h += '<p style="text-align:center;">' + esc(contact) + '</p>';
    h += '<hr><h2>About Me</h2><p>' + esc(p.bio || 'Introduce yourself, your goals and what you are passionate about.') + '</p>';
    h += '<h2>Achievements &amp; Certificates</h2>';
    if (p.certs.length) { h += '<ul>'; p.certs.forEach(function (c) { h += '<li><strong>' + esc(certTitle(c)) + '</strong>' + (c.date ? ' — ' + esc(c.date) : '') + '</li>'; }); h += '</ul>'; }
    else h += '<p>Add certificates, awards and milestones here.</p>';
    h += '<h2>Projects &amp; Work Samples</h2><p><strong>Project title</strong></p><p>Describe the project, your role and the result. Insert a picture with the Insert tab.</p>';
    h += '<h2>Skills</h2><ul><li>Skill</li><li>Skill</li><li>Skill</li></ul>';
    h += '<h2>Contact</h2><p>' + esc(contact || 'Add your contact details.') + '</p>';
    return h;
  }


  // -------- template registry --------
  var TEMPLATES = [
    { kind: 'resume', label: 'Resume', icon: '\uD83D\uDCC4', cat: 'career' },
    { kind: 'letter', label: 'Application Letter', icon: '\u2709\uFE0F', cat: 'career' },
    { kind: 'portfolio', label: 'Career Portfolio', icon: '\uD83D\uDCBC', cat: 'career' },
    { kind: 'businessplan', label: 'Business Plan', icon: '\uD83D\uDCCA', cat: 'business' },
    { kind: 'invoice', label: 'Invoice', icon: '\uD83E\uDDFE', cat: 'business' },
    { kind: 'minutes', label: 'Meeting Minutes', icon: '\uD83D\uDCDD', cat: 'business' },
    { kind: 'proposal', label: 'Project Proposal', icon: '\uD83D\uDCCB', cat: 'business' },
    { kind: 'training', label: 'Training Manual', icon: '\uD83D\uDCD6', cat: 'business' },
    { kind: 'monthlyreport', label: 'Monthly Report', icon: '\uD83D\uDCC8', cat: 'business' },
    { kind: 'businessletter', label: 'Business Letter', icon: '\uD83D\uDCED', cat: 'business' },
    { kind: 'memo', label: 'Memo', icon: '\uD83D\uDCCC', cat: 'business' },
    { kind: 'budget', label: 'Budget / Spreadsheet', icon: '\uD83D\uDCB0', cat: 'finance' },
    { kind: 'presentation', label: 'Presentation Outline', icon: '\uD83D\uDDA5\uFE0F', cat: 'business' },
    { kind: 'research', label: 'Research Report', icon: '\uD83D\uDD2C', cat: 'academic' },
    { kind: 'evaluation', label: 'Employee Evaluation', icon: '\u2B50', cat: 'hr' },
    { kind: 'incident', label: 'Incident Report', icon: '\uD83D\uDEA8', cat: 'hr' },
    { kind: 'timesheet', label: 'Weekly Timesheet', icon: '\u23F1\uFE0F', cat: 'hr' },
    { kind: 'lessonplan', label: 'Lesson Plan', icon: '\uD83C\uDF93', cat: 'academic' },
    { kind: 'newsletter', label: 'Newsletter', icon: '\uD83D\uDCF0', cat: 'marketing' },
    { kind: 'pressrelease', label: 'Press Release', icon: '\uD83D\uDCE2', cat: 'marketing' },
    { kind: 'swot', label: 'SWOT Analysis', icon: '\uD83D\uDD0D', cat: 'strategy' },
    { kind: 'actionplan', label: 'Action Plan', icon: '\uD83C\uDFAF', cat: 'strategy' },
    { kind: 'sop', label: 'SOP', icon: '\uD83D\uDCD0', cat: 'strategy' },
    { kind: 'blank', label: 'Blank / Custom', icon: '\uD83D\uDCDD', cat: 'other' }
  ];
  var CATS = [
    { id: 'career', label: 'Career', icon: '\uD83D\uDC64' },
    { id: 'business', label: 'Business', icon: '\uD83C\uDFE2' },
    { id: 'finance', label: 'Finance', icon: '\uD83D\uDCB0' },
    { id: 'hr', label: 'HR / People', icon: '\uD83D\uDC65' },
    { id: 'academic', label: 'Academic', icon: '\uD83C\uDF93' },
    { id: 'marketing', label: 'Marketing', icon: '\uD83D\uDCE3' },
    { id: 'strategy', label: 'Strategy', icon: '\uD83E\uDDE0' },
    { id: 'other', label: 'Other', icon: '\uD83D\uDCDD' }
  ];

  function getTemplateHtml(kind, p) {
    if (kind === 'resume') return tmplResume(p);
    if (kind === 'letter') return tmplLetter(p);
    if (kind === 'portfolio') return tmplPortfolio(p);
    if (kind === 'businessplan') return tmplBusinessPlan(p);
    if (kind === 'invoice') return tmplInvoice(p);
    if (kind === 'minutes') return tmplMeetingMinutes(p);
    if (kind === 'proposal') return tmplProjectProposal(p);
    if (kind === 'training') return tmplTrainingManual(p);
    if (kind === 'monthlyreport') return tmplMonthlyReport(p);
    if (kind === 'businessletter') return tmplBusinessLetter(p);
    if (kind === 'memo') return tmplMemo(p);
    if (kind === 'budget') return tmplBudget(p);
    if (kind === 'presentation') return tmplPresentation(p);
    if (kind === 'research') return tmplResearch(p);
    if (kind === 'evaluation') return tmplEvaluation(p);
    if (kind === 'incident') return tmplIncident(p);
    if (kind === 'timesheet') return tmplTimesheet(p);
    if (kind === 'lessonplan') return tmplLessonPlan(p);
    if (kind === 'newsletter') return tmplNewsletter(p);
    if (kind === 'pressrelease') return tmplPressRelease(p);
    if (kind === 'swot') return tmplSWOT(p);
    if (kind === 'actionplan') return tmplActionPlan(p);
    if (kind === 'sop') return tmplSOP(p);
    return '<p><br></p>';
  }
  function getTemplateTitle(kind, p) {
    if (kind === 'resume') return p.name + ' \u2014 Resume';
    if (kind === 'letter') return 'Application Letter';
    if (kind === 'portfolio') return p.name + ' \u2014 Career Portfolio';
    if (kind === 'businessplan') return 'Business Plan';
    if (kind === 'invoice') return 'Invoice';
    if (kind === 'minutes') return 'Meeting Minutes';
    if (kind === 'proposal') return 'Project Proposal';
    if (kind === 'training') return 'Training Manual';
    if (kind === 'monthlyreport') return 'Monthly Report';
    if (kind === 'businessletter') return 'Business Letter';
    if (kind === 'memo') return 'Memo';
    if (kind === 'budget') return 'Budget / Spreadsheet';
    if (kind === 'presentation') return 'Presentation Outline';
    if (kind === 'research') return 'Research Report';
    if (kind === 'evaluation') return 'Employee Evaluation';
    if (kind === 'incident') return 'Incident Report';
    if (kind === 'timesheet') return 'Weekly Timesheet';
    if (kind === 'lessonplan') return 'Lesson Plan';
    if (kind === 'newsletter') return 'Newsletter';
    if (kind === 'pressrelease') return 'Press Release';
    if (kind === 'swot') return 'SWOT Analysis';
    if (kind === 'actionplan') return 'Action Plan';
    if (kind === 'sop') return 'SOP';
    return 'Untitled document';
  }

  window.chcnCreateDoc = function (kind) {
    var p = profileData(); var html, title;
    html = getTemplateHtml(kind || 'blank', p); title = getTemplateTitle(kind || 'blank', p);
    var doc = { id: uid(), kind: kind || 'blank', title: title, html: html, ts: Date.now(), updated: Date.now() };
    putDoc(doc); renderCareer();
    openEditor(doc.id);
  };
  window.chcnRenameDoc = function (id) {
    var d = getDoc(id); if (!d) return;
    var t = window.prompt('Rename document', d.title); if (t == null) return;
    d.title = t.trim() || d.title; d.updated = Date.now(); putDoc(d); renderCareer();
  };
  window.chcnDuplicateDoc = function (id) {
    var d = getDoc(id); if (!d) return;
    var copy = { id: uid(), kind: d.kind, title: d.title + ' (copy)', html: d.html, ts: Date.now(), updated: Date.now() };
    putDoc(copy); renderCareer(); toast('Duplicated.');
  };
  window.chcnDeleteDoc = function (id) {
    if (!window.confirm('Delete this document? This cannot be undone.')) return;
    saveDocs(loadDocs().filter(function (d) { return d.id !== id; })); renderCareer(); toast('Document deleted.');
  };

  function kindIcon(k) {
    var t = TEMPLATES.filter(function (x) { return x.kind === k; })[0];
    return t ? t.icon : '📝';
  }

  var _catFilter = 'all';

  function renderCareer() {
    var mount = document.getElementById('chcnCareerMount'); if (!mount) return;
    var docs = loadDocs();
    var h = '<h3>Career Studio</h3>';
    h += '<p style="color:#666;font-size:14px;margin-top:-6px;">Build professional documents — auto-filled from your profile, then edit in a full word processor. Choose where to save.</p>';
    h += '<div class="chcn-cat-tabs">';
    h += '<button class="chcn-cat-tab' + (_catFilter === 'all' ? ' active' : '') + '" onclick="chcnFilterCat(\'all\')">All Templates</button>';
    CATS.forEach(function (c) {
      h += '<button class="chcn-cat-tab' + (_catFilter === c.id ? ' active' : '') + '" onclick="chcnFilterCat(\'' + c.id + '\')">' + c.icon + ' ' + c.label + '</button>';
    });
    h += '</div><div class="chcn-cs-new">';
    TEMPLATES.forEach(function (t) {
      if (_catFilter !== 'all' && t.cat !== _catFilter) return;
      h += '<button class="chcn-cs-tile" onclick="chcnCreateDoc(\'' + t.kind + '\')"><span>' + t.icon + '</span>' + t.label + '</button>';
    });
    h += '<button class="chcn-cs-tile" onclick="chcnOpenFromDevice()"><span>📂</span>Open File</button></div>';
    h += '<h4 style="margin-top:24px;">My documents</h4>';
    if (!docs.length) { h += '<p style="color:#888;font-size:14px;">No documents yet. Create one above — it fills in automatically from your profile.</p>'; }
    else {
      h += '<div class="chcn-cs-list">';
      docs.forEach(function (d) {
        h += '<div class="chcn-cs-item"><div class="chcn-cs-ic">' + kindIcon(d.kind) + '</div>';
        h += '<div class="chcn-cs-info"><strong>' + esc(d.title) + '</strong><span>Updated ' + new Date(d.updated || d.ts).toLocaleString() + '</span></div>';
        h += '<div class="chcn-cs-actions">';
        h += '<button class="btn btn-primary btn-sm" onclick="chcnOpenDoc(\'' + d.id + '\')">Open / Edit</button>';
        h += '<button class="btn btn-outline btn-sm" onclick="chcnRenameDoc(\'' + d.id + '\')">Rename</button>';
        h += '<button class="btn btn-outline btn-sm" onclick="chcnDuplicateDoc(\'' + d.id + '\')">Duplicate</button>';
        h += '<button class="btn btn-outline btn-sm" onclick="chcnDeleteDoc(\'' + d.id + '\')">Delete</button>';
        h += '</div></div>';
      });
      h += '</div>';
    }
    mount.innerHTML = h;
  }
  window.chcnFilterCat = function (cat) { _catFilter = cat; renderCareer(); };
  window.chcnOpenDoc = function (id) { openEditor(id); };
  window.chcnCareerRender = renderCareer;

  // -------- NEW v27 template functions --------

  function tmplBusinessPlan(p) {
    var today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    var h = '<h1 style="text-align:center;">Business Plan</h1>';
    h += '<p style="text-align:center;color:#555;"><strong>' + esc(p.name || '[Company Name]') + '</strong></p>';
    h += '<p style="text-align:center;color:#888;">Prepared: ' + esc(today) + '</p><hr>';
    h += '<h2>1. Executive Summary</h2><p>Brief overview of your business concept, target market, revenue model, and resources needed.</p>';
    h += '<h2>2. Company Description</h2><p><strong>Business name:</strong> [Name]</p><p><strong>Legal structure:</strong> [Sole proprietor / LLC / Corporation / Partnership]</p>';
    h += '<p><strong>Location:</strong> [Address]</p><p><strong>Mission:</strong> [One sentence]</p><p><strong>Vision:</strong> [Long-term impact]</p>';
    h += '<h2>3. Products &amp; Services</h2><table><tr><th>Product / Service</th><th>Description</th><th>Price Range</th></tr><tr><td>[Product 1]</td><td>[Description]</td><td>$[Amount]</td></tr><tr><td>[Product 2]</td><td>[Description]</td><td>$[Amount]</td></tr></table>';
    h += '<h2>4. Market Analysis</h2><p><strong>Target market:</strong> Who are your ideal customers?</p><p><strong>Competitors:</strong></p>';
    h += '<table><tr><th>Competitor</th><th>Strengths</th><th>Weaknesses</th></tr><tr><td>[Competitor A]</td><td>[Strength]</td><td>[Weakness]</td></tr><tr><td>[Competitor B]</td><td>[Strength]</td><td>[Weakness]</td></tr></table>';
    h += '<h2>5. Marketing &amp; Sales Strategy</h2><p>How will customers find you? Describe channels, pricing, and sales process.</p>';
    h += '<h2>6. Operations Plan</h2><p><strong>Facilities:</strong> [Location]</p><p><strong>Key personnel:</strong></p>';
    h += '<table><tr><th>Role</th><th>Name</th><th>Responsibility</th></tr><tr><td>Owner</td><td>' + esc(p.name) + '</td><td>Overall operations</td></tr><tr><td>[Role]</td><td>[Name]</td><td>[Responsibility]</td></tr></table>';
    h += '<h2>7. Financial Plan</h2><table><tr><th>Item</th><th>Month 1</th><th>Month 2</th><th>Month 3</th><th>Total Q1</th></tr><tr><td>Revenue</td><td>$0</td><td>$0</td><td>$0</td><td>$0</td></tr><tr><td>Expenses</td><td>$0</td><td>$0</td><td>$0</td><td>$0</td></tr><tr><td>Net Profit</td><td>$0</td><td>$0</td><td>$0</td><td>$0</td></tr></table>';
    h += '<h2>8. Goals &amp; Milestones</h2><table><tr><th>Timeframe</th><th>Goal</th><th>KPI</th></tr><tr><td>0\u20133 months</td><td>[Goal]</td><td>[Measure]</td></tr><tr><td>3\u20136 months</td><td>[Goal]</td><td>[Measure]</td></tr></table>';
    return h;
  }

  function tmplInvoice(p) {
    var today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    var invNum = 'INV-' + new Date().getFullYear() + '-' + String(Date.now()).slice(-4);
    var h = '<h1 style="text-align:center;">INVOICE</h1>';
    h += '<table style="width:100%;"><tr><td style="vertical-align:top;width:50%;"><strong>From:</strong><br>' + esc(p.name) + '<br>';
    if (p.address) h += esc(p.address) + '<br>';
    if (p.phone) h += esc(p.phone) + '<br>';
    if (p.email) h += esc(p.email);
    h += '</td><td style="vertical-align:top;text-align:right;"><strong>Invoice #:</strong> ' + esc(invNum) + '<br><strong>Date:</strong> ' + esc(today) + '<br><strong>Due Date:</strong> [Due date]<br><strong>Status:</strong> Unpaid</td></tr></table><br>';
    h += '<p><strong>Bill To:</strong></p><p>[Client / Company name]<br>[Client address]</p><hr>';
    h += '<table><tr><th style="width:50%;">Description</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr><tr><td>[Service or product 1]</td><td>1</td><td>$0.00</td><td>$0.00</td></tr><tr><td>[Service or product 2]</td><td>1</td><td>$0.00</td><td>$0.00</td></tr>';
    h += '<tr><td colspan="3" style="text-align:right;"><strong>Subtotal</strong></td><td><strong>$0.00</strong></td></tr><tr><td colspan="3" style="text-align:right;">Tax / VAT</td><td>$0.00</td></tr><tr><td colspan="3" style="text-align:right;"><strong>TOTAL DUE</strong></td><td><strong>$0.00</strong></td></tr></table><hr>';
    h += '<h3>Payment Details</h3><p><strong>Bank:</strong> [Bank name]</p><p><strong>Account name:</strong> ' + esc(p.name) + '</p><p><strong>Account number:</strong> [Account number]</p>';
    h += '<br><p style="color:#888;font-size:13px;">Thank you for your business. Payment is due within [30] days.</p>';
    return h;
  }

  function tmplMeetingMinutes(p) {
    var today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    var h = '<h1 style="text-align:center;">Meeting Minutes</h1>';
    h += '<table style="width:100%;"><tr><td style="width:50%;vertical-align:top;"><strong>Date:</strong> ' + esc(today) + '<br><strong>Time:</strong> [Start] \u2013 [End]<br><strong>Location:</strong> [Room / Online]</td>';
    h += '<td style="width:50%;vertical-align:top;"><strong>Chair:</strong> ' + esc(p.name || '[Name]') + '<br><strong>Note-taker:</strong> [Name]<br><strong>Type:</strong> [Regular / Special]</td></tr></table><hr>';
    h += '<h2>Attendees</h2><table><tr><th>Name</th><th>Role</th><th>Present</th></tr><tr><td>' + esc(p.name || '[Name]') + '</td><td>[Role]</td><td>Yes</td></tr><tr><td>[Name]</td><td>[Role]</td><td>[Yes/No]</td></tr></table>';
    h += '<h2>Agenda</h2><table><tr><th>#</th><th>Item</th><th>Presenter</th></tr><tr><td>1</td><td>[Item]</td><td>[Name]</td></tr><tr><td>2</td><td>[Item]</td><td>[Name]</td></tr></table>';
    h += '<h2>Discussion Summary</h2><p><strong>Item 1:</strong> [Topic] \u2014 Key points and conclusions.</p>';
    h += '<h2>Decisions</h2><table><tr><th>Decision</th><th>Responsible</th><th>Deadline</th></tr><tr><td>[Decision]</td><td>[Name]</td><td>[Date]</td></tr></table>';
    h += '<h2>Action Items</h2><table><tr><th>Action</th><th>Owner</th><th>Priority</th><th>Due</th><th>Status</th></tr><tr><td>[Action]</td><td>[Name]</td><td>[H/M/L]</td><td>[Date]</td><td>Open</td></tr></table>';
    h += '<h2>Next Meeting</h2><p><strong>Date:</strong> [Date] | <strong>Time:</strong> [Time]</p>';
    h += '<hr><p><strong>Approved by:</strong> ________________________ &nbsp;&nbsp; <strong>Date:</strong> ____________</p>';
    return h;
  }

  function tmplProjectProposal(p) {
    var today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    var h = '<h1 style="text-align:center;">Project Proposal</h1><p style="text-align:center;color:#555;">' + esc(p.name || '[Title]') + '</p>';
    h += '<p style="text-align:center;color:#888;">Submitted: ' + esc(today) + '</p><hr>';
    h += '<h2>1. Project Summary</h2><p>Describe the project, purpose, and expected outcome.</p>';
    h += '<h2>2. Background</h2><p>What problem does this project address? Provide context.</p>';
    h += '<h2>3. Objectives</h2><table><tr><th>#</th><th>Objective</th><th>Measure</th></tr><tr><td>1</td><td>[Objective]</td><td>[Measure]</td></tr><tr><td>2</td><td>[Objective]</td><td>[Measure]</td></tr></table>';
    h += '<h2>4. Scope</h2><p><strong>In scope:</strong> [List]</p><p><strong>Out of scope:</strong> [List]</p>';
    h += '<h2>5. Timeline</h2><table><tr><th>Phase</th><th>Activity</th><th>Start</th><th>End</th><th>Deliverable</th></tr><tr><td>Planning</td><td>[Activity]</td><td>[Date]</td><td>[Date]</td><td>[Deliverable]</td></tr></table>';
    h += '<h2>6. Budget</h2><table><tr><th>Category</th><th>Cost</th></tr><tr><td>Personnel</td><td>$0</td></tr><tr><td>Equipment</td><td>$0</td></tr><tr><td><strong>Total</strong></td><td><strong>$0</strong></td></tr></table>';
    h += '<h2>7. Risks</h2><table><tr><th>Risk</th><th>Likelihood</th><th>Impact</th><th>Mitigation</th></tr><tr><td>[Risk]</td><td>[H/M/L]</td><td>[H/M/L]</td><td>[Action]</td></tr></table>';
    h += '<hr><p><strong>Prepared by:</strong> ' + esc(p.name) + ' | ' + esc(p.email || p.phone || '[Contact]') + '</p>';
    return h;
  }

  function tmplTrainingManual(p) {
    var h = '<h1 style="text-align:center;">Training Manual</h1><p style="text-align:center;color:#555;">' + esc(p.name || '[Course Title]') + '</p>';
    h += '<p style="text-align:center;color:#888;">Creator Hub Creator Network</p><hr>';
    h += '<h2>Introduction</h2><p>Purpose, audience, and how to use this manual.</p>';
    h += '<h2>Learning Objectives</h2><ul><li>Objective 1</li><li>Objective 2</li><li>Objective 3</li></ul>';
    h += '<h2>Module 1: [Title]</h2><h3>Key Concepts</h3><ul><li>Concept 1</li><li>Concept 2</li></ul>';
    h += '<h3>Procedure</h3><table><tr><th>Step</th><th>Action</th><th>Notes</th></tr><tr><td>1</td><td>[Action]</td><td>[Tip]</td></tr><tr><td>2</td><td>[Action]</td><td>[Note]</td></tr></table>';
    h += '<h3>Practice Exercise</h3><p>[Hands-on exercise]</p>';
    h += '<h3>Knowledge Check</h3><p>1. Question? A) Option A  B) Option B  C) Option C</p>';
    h += '<h2>Module 2: [Title]</h2><p>[Same structure]</p>';
    h += '<h2>Glossary</h2><table><tr><th>Term</th><th>Definition</th></tr><tr><td>[Term]</td><td>[Definition]</td></tr></table>';
    return h;
  }

  function tmplMonthlyReport(p) {
    var d = new Date(); var month = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    var h = '<h1 style="text-align:center;">Monthly Report</h1><p style="text-align:center;color:#555;"><strong>' + esc(month) + '</strong></p>';
    h += '<p style="text-align:center;color:#888;">Prepared by: ' + esc(p.name) + '</p><hr>';
    h += '<h2>Executive Summary</h2><p>High-level overview of achievements, challenges and key numbers.</p>';
    h += '<h2>KPIs</h2><table><tr><th>KPI</th><th>Target</th><th>Actual</th><th>Status</th></tr><tr><td>[KPI 1]</td><td>[Target]</td><td>[Actual]</td><td>[On track]</td></tr></table>';
    h += '<h2>Accomplishments</h2><ul><li>[Accomplishment 1]</li><li>[Accomplishment 2]</li></ul>';
    h += '<h2>Challenges</h2><table><tr><th>Issue</th><th>Impact</th><th>Action</th><th>Status</th></tr><tr><td>[Issue]</td><td>[Impact]</td><td>[Action]</td><td>[Resolved]</td></tr></table>';
    h += '<h2>Financial Summary</h2><table><tr><th>Category</th><th>Budget</th><th>Actual</th><th>Variance</th></tr><tr><td>Revenue</td><td>$0</td><td>$0</td><td>$0</td></tr><tr><td>Expenses</td><td>$0</td><td>$0</td><td>$0</td></tr></table>';
    h += '<h2>Plans for Next Month</h2><ul><li>[Plan 1]</li><li>[Plan 2]</li></ul>';
    return h;
  }

  function tmplBusinessLetter(p) {
    var today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    var h = '<p>' + esc(p.name) + '</p>';
    if (p.address) h += '<p>' + esc(p.address) + '</p>';
    h += '<p>' + esc(today) + '</p><br><p>[Recipient Name]<br>[Title]<br>[Company]<br>[Address]</p><br>';
    h += '<p>RE: [Subject line]</p><br><p>Dear [Recipient Name],</p>';
    h += '<p>[Opening \u2014 state the purpose.]</p><p>[Body \u2014 details and context.]</p><p>[Closing \u2014 expected action.]</p>';
    h += '<br><p>Sincerely,</p><br><p>' + esc(p.name) + '</p>';
    return h;
  }

  function tmplMemo(p) {
    var today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    var h = '<h1>MEMORANDUM</h1><hr>';
    h += '<table style="width:100%;"><tr><td style="width:15%;"><strong>TO:</strong></td><td>[Recipient(s)]</td></tr>';
    h += '<tr><td><strong>FROM:</strong></td><td>' + esc(p.name) + '</td></tr>';
    h += '<tr><td><strong>DATE:</strong></td><td>' + esc(today) + '</td></tr>';
    h += '<tr><td><strong>RE:</strong></td><td>[Subject]</td></tr></table><hr>';
    h += '<h2>Purpose</h2><p>[State the purpose.]</p>';
    h += '<h2>Background</h2><p>[Provide context.]</p>';
    h += '<h2>Details</h2><p>[Main information.]</p>';
    h += '<h2>Action Required</h2><p>[What the recipient needs to do and by when.]</p>';
    return h;
  }

  function tmplBudget(p) {
    var h = '<h1 style="text-align:center;">Budget / Spreadsheet</h1><p style="text-align:center;color:#555;">Prepared by: ' + esc(p.name) + '</p><hr>';
    h += '<h2>Monthly Budget</h2>';
    h += '<table><tr><th>Category</th><th>Subcategory</th><th>Budgeted ($)</th><th>Actual ($)</th><th>Difference ($)</th></tr>';
    h += '<tr><td><strong>Income</strong></td><td>Salary / Wages</td><td>0</td><td>0</td><td>0</td></tr>';
    h += '<tr><td></td><td>Other Income</td><td>0</td><td>0</td><td>0</td></tr>';
    h += '<tr><td><strong>Expenses</strong></td><td>Housing / Rent</td><td>0</td><td>0</td><td>0</td></tr>';
    h += '<tr><td></td><td>Utilities</td><td>0</td><td>0</td><td>0</td></tr>';
    h += '<tr><td></td><td>Transport</td><td>0</td><td>0</td><td>0</td></tr>';
    h += '<tr><td></td><td>Food / Groceries</td><td>0</td><td>0</td><td>0</td></tr>';
    h += '<tr><td colspan="2" style="text-align:right;"><strong>Net</strong></td><td><strong>0</strong></td><td><strong>0</strong></td><td><strong>0</strong></td></tr></table>';
    h += '<h2>Annual Summary</h2><table><tr><th>Quarter</th><th>Income</th><th>Expenses</th><th>Net</th></tr>';
    h += '<tr><td>Q1</td><td>$0</td><td>$0</td><td>$0</td></tr><tr><td>Q2</td><td>$0</td><td>$0</td><td>$0</td></tr><tr><td>Q3</td><td>$0</td><td>$0</td><td>$0</td></tr><tr><td>Q4</td><td>$0</td><td>$0</td><td>$0</td></tr></table>';
    return h;
  }

  function tmplPresentation(p) {
    var h = '<h1 style="text-align:center;">Presentation Outline</h1>';
    h += '<p style="text-align:center;color:#555;">' + esc(p.name || '[Title]') + '</p>';
    h += '<p style="text-align:center;color:#888;">Presenter: ' + esc(p.name || '[Name]') + ' | Duration: [Time]</p><hr>';
    h += '<h2>Slide 1 \u2014 Title</h2><p>Title, subtitle, presenter.</p>';
    h += '<h2>Slide 2 \u2014 Agenda</h2><p>3\u20135 main points.</p>';
    h += '<h2>Slide 3 \u2014 Problem / Hook</h2><p>State the problem or opportunity.</p>';
    h += '<h2>Slides 4\u20137 \u2014 Main Content</h2><table><tr><th>Slide</th><th>Heading</th><th>Key Points</th><th>Visual</th></tr>';
    h += '<tr><td>4</td><td>[Heading]</td><td>[Bullets]</td><td>[Image]</td></tr><tr><td>5</td><td>[Heading]</td><td>[Bullets]</td><td>[Chart]</td></tr></table>';
    h += '<h2>Slide 8 \u2014 Data / Evidence</h2><p>Data or case study.</p>';
    h += '<h2>Slide 9 \u2014 Recommendations</h2><p>What you propose and why.</p>';
    h += '<h2>Slide 10 \u2014 Call to Action &amp; Q&amp;A</h2><p>Next steps. Open for questions.</p>';
    return h;
  }

  function tmplResearch(p) {
    var today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    var h = '<h1 style="text-align:center;">Research Report</h1><p style="text-align:center;color:#555;">' + esc(p.name || '[Title]') + '</p>';
    h += '<p style="text-align:center;color:#888;">Author: ' + esc(p.name) + ' | Date: ' + esc(today) + '</p><hr>';
    h += '<h2>Abstract</h2><p>Summarise the research question, method, findings and conclusion in 150\u2013250 words.</p>';
    h += '<h2>1. Introduction</h2><p>Research problem, significance and scope.</p><p><strong>Research question:</strong> [Question]</p>';
    h += '<h2>2. Literature Review</h2><p>Summarise existing research and identify the gap.</p>';
    h += '<h2>3. Methodology</h2><p><strong>Design:</strong> [Qualitative / Quantitative / Mixed]</p><p><strong>Sample:</strong> [Who, how many]</p><p><strong>Tools:</strong> [Survey, interview, etc.]</p>';
    h += '<h2>4. Findings</h2><table><tr><th>Variable</th><th>Result</th><th>Interpretation</th></tr><tr><td>[Variable]</td><td>[Result]</td><td>[Meaning]</td></tr></table>';
    h += '<h2>5. Discussion</h2><p>Interpret findings, compare with literature, note limitations.</p>';
    h += '<h2>6. Conclusion</h2><p>Key takeaway and recommendations.</p>';
    h += '<h2>References</h2><p>[List sources in APA, MLA or preferred format.]</p>';
    return h;
  }

  function tmplEvaluation(p) {
    var today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    var h = '<h1 style="text-align:center;">Employee Performance Evaluation</h1><hr>';
    h += '<table style="width:100%;"><tr><td style="width:50%;"><strong>Employee:</strong> [Name]<br><strong>Position:</strong> [Title]</td>';
    h += '<td style="width:50%;"><strong>Reviewer:</strong> ' + esc(p.name) + '<br><strong>Date:</strong> ' + esc(today) + '</td></tr></table><hr>';
    h += '<h2>Ratings</h2><p style="font-size:12px;color:#888;">1 = Unsatisfactory | 2 = Needs Improvement | 3 = Meets | 4 = Exceeds | 5 = Outstanding</p>';
    h += '<table><tr><th>Competency</th><th>Rating (1\u20135)</th><th>Comments</th></tr>';
    h += '<tr><td>Job Knowledge</td><td>[1\u20135]</td><td>[Comment]</td></tr><tr><td>Quality of Work</td><td>[1\u20135]</td><td>[Comment]</td></tr>';
    h += '<tr><td>Productivity</td><td>[1\u20135]</td><td>[Comment]</td></tr><tr><td>Communication</td><td>[1\u20135]</td><td>[Comment]</td></tr>';
    h += '<tr><td>Teamwork</td><td>[1\u20135]</td><td>[Comment]</td></tr><tr><td>Attendance</td><td>[1\u20135]</td><td>[Comment]</td></tr>';
    h += '<tr><td>Initiative</td><td>[1\u20135]</td><td>[Comment]</td></tr><tr><td>Adaptability</td><td>[1\u20135]</td><td>[Comment]</td></tr></table>';
    h += '<h2>Achievements</h2><ul><li>[Achievement 1]</li></ul>';
    h += '<h2>Improvement Areas</h2><ul><li>[Area 1]</li></ul>';
    h += '<h2>Goals</h2><table><tr><th>Goal</th><th>Action</th><th>Date</th></tr><tr><td>[Goal]</td><td>[Action]</td><td>[Date]</td></tr></table>';
    h += '<hr><p><strong>Employee:</strong> ________________________ &nbsp;&nbsp; <strong>Reviewer:</strong> ________________________</p>';
    return h;
  }

  function tmplIncident(p) {
    var today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    var h = '<h1 style="text-align:center;">Incident Report</h1><hr>';
    h += '<table style="width:100%;"><tr><td style="width:50%;"><strong>Report #:</strong> [INC-XXXX]<br><strong>Incident Date:</strong> [Date]</td>';
    h += '<td style="width:50%;"><strong>Location:</strong> [Location]<br><strong>Reported by:</strong> ' + esc(p.name) + '<br><strong>Date:</strong> ' + esc(today) + '</td></tr></table><hr>';
    h += '<h2>People Involved</h2><table><tr><th>Name</th><th>Role</th><th>Contact</th></tr><tr><td>' + esc(p.name) + '</td><td>[Role]</td><td>' + esc(p.phone || p.email || '') + '</td></tr></table>';
    h += '<h2>Description</h2><p>Describe what happened in chronological order. Be specific and factual.</p>';
    h += '<h2>Immediate Actions</h2><ul><li>[Action 1]</li><li>[Action 2]</li></ul>';
    h += '<h2>Witnesses</h2><table><tr><th>Name</th><th>Contact</th><th>Statement</th></tr><tr><td>[Name]</td><td>[Contact]</td><td>[Summary]</td></tr></table>';
    h += '<h2>Damages / Injuries</h2><p>[Describe any damage or injuries.]</p>';
    h += '<h2>Root Cause</h2><p>[What caused or contributed?]</p>';
    h += '<h2>Corrective Actions</h2><table><tr><th>Action</th><th>Responsible</th><th>Deadline</th><th>Status</th></tr><tr><td>[Action]</td><td>[Name]</td><td>[Date]</td><td>[Open/Closed]</td></tr></table>';
    h += '<hr><p><strong>Reported by:</strong> ' + esc(p.name) + ' &nbsp;&nbsp; <strong>Signature:</strong> ________________________</p>';
    return h;
  }

  function tmplTimesheet(p) {
    var h = '<h1 style="text-align:center;">Weekly Timesheet</h1>';
    h += '<p style="text-align:center;color:#555;"><strong>Employee:</strong> ' + esc(p.name) + ' | <strong>Week of:</strong> [Monday] \u2013 [Sunday]</p><hr>';
    h += '<table><tr><th>Day</th><th>Date</th><th>Clock In</th><th>Lunch Out</th><th>Lunch In</th><th>Clock Out</th><th>Hrs</th><th>OT</th></tr>';
    var days = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
    days.forEach(function (day) { h += '<tr><td>' + day + '</td><td>[Date]</td><td>[Time]</td><td>[Time]</td><td>[Time]</td><td>[Time]</td><td>0.0</td><td>0.0</td></tr>'; });
    h += '<tr><td colspan="6" style="text-align:right;"><strong>Total</strong></td><td><strong>0.0</strong></td><td><strong>0.0</strong></td></tr></table>';
    h += '<hr><p><strong>Employee:</strong> ________________________ &nbsp;&nbsp; <strong>Supervisor:</strong> ________________________</p>';
    return h;
  }

  function tmplLessonPlan(p) {
    var h = '<h1 style="text-align:center;">Lesson Plan</h1><hr>';
    h += '<table style="width:100%;"><tr><td style="width:50%;"><strong>Subject:</strong> [Subject]<br><strong>Topic:</strong> [Topic]<br><strong>Level:</strong> [Level]</td>';
    h += '<td style="width:50%;"><strong>Instructor:</strong> ' + esc(p.name) + '<br><strong>Duration:</strong> [Min]<br><strong>Date:</strong> [Date]</td></tr></table><hr>';
    h += '<h2>Objectives</h2><ul><li>Objective 1</li><li>Objective 2</li><li>Objective 3</li></ul>';
    h += '<h2>Materials</h2><ul><li>[Material 1]</li><li>[Material 2]</li></ul>';
    h += '<h2>Outline</h2><table><tr><th>Phase</th><th>Time</th><th>Activity</th><th>Details</th></tr>';
    h += '<tr><td>Opening</td><td>[5 min]</td><td>[Activity]</td><td>[Description]</td></tr><tr><td>Instruction</td><td>[15 min]</td><td>[Activity]</td><td>[Concepts]</td></tr>';
    h += '<tr><td>Guided Practice</td><td>[15 min]</td><td>[Activity]</td><td>[With support]</td></tr><tr><td>Independent</td><td>[10 min]</td><td>[Activity]</td><td>[On their own]</td></tr>';
    h += '<tr><td>Closing</td><td>[5 min]</td><td>[Activity]</td><td>[Summary]</td></tr></table>';
    h += '<h2>Assessment</h2><p><strong>Formative:</strong> [How you check understanding]</p><p><strong>Summative:</strong> [How you measure achievement]</p>';
    return h;
  }

  function tmplNewsletter(p) {
    var today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
    var h = '<h1 style="text-align:center;">Newsletter</h1><p style="text-align:center;color:#555;"><strong>' + esc(today) + ' Edition</strong></p>';
    h += '<p style="text-align:center;color:#888;">Creator Hub Creator Network</p><hr>';
    h += '<h2>Featured Story</h2><h3>[Headline]</h3><p>[Lead paragraph \u2014 who, what, when, where, why.]</p>';
    h += '<h2>Announcements</h2><ul><li><strong>[1]:</strong> [Details]</li><li><strong>[2]:</strong> [Details]</li></ul>';
    h += '<h2>Upcoming Events</h2><table><tr><th>Date</th><th>Event</th><th>Location</th></tr><tr><td>[Date]</td><td>[Event]</td><td>[Location]</td></tr></table>';
    h += '<h2>Learner Spotlight</h2><p><strong>[Name]</strong> \u2014 [Achievement]</p>';
    h += '<h2>Quick Tips</h2><ul><li>[Tip 1]</li><li>[Tip 2]</li></ul>';
    h += '<hr><p style="color:#888;font-size:12px;text-align:center;">\u00a9 ' + new Date().getFullYear() + ' Creator Hub Creator Network.</p>';
    return h;
  }

  function tmplPressRelease(p) {
    var today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    var h = '<p style="text-align:center;color:#888;">FOR IMMEDIATE RELEASE</p>';
    h += '<h1 style="text-align:center;">[Press Release Headline]</h1><hr>';
    h += '<p><strong>' + esc(today) + '</strong> \u2014 [City, Country] \u2014 [Opening paragraph with the most important facts.]</p>';
    h += '<p>[Second paragraph \u2014 details and context.]</p>';
    h += '<p>\u201c[Quote from a key person],\u201d said [Name], [Title].</p>';
    h += '<p>[Background and data.]</p>';
    h += '<hr><h3>About [Organisation]</h3><p>[One paragraph describing the organisation.]</p>';
    h += '<h3>Media Contact</h3><p>' + esc(p.name) + '<br>' + esc(p.email || '[Email]') + '</p>';
    h += '<hr><p style="text-align:center;color:#888;">### (End of release)</p>';
    return h;
  }

  function tmplSWOT(p) {
    var h = '<h1 style="text-align:center;">SWOT Analysis</h1><p style="text-align:center;color:#555;">' + esc(p.name || '[Organisation]') + '</p><hr>';
    h += '<table style="width:100%;">';
    h += '<tr><th style="width:50%;background:#e8f5e9;color:#2e7d32;">Strengths (Internal)</th><th style="width:50%;background:#fff3e0;color:#e65100;">Weaknesses (Internal)</th></tr>';
    h += '<tr><td style="vertical-align:top;background:#f1f8e9;"><ul><li>[Strength 1]</li><li>[Strength 2]</li><li>[Strength 3]</li></ul></td>';
    h += '<td style="vertical-align:top;background:#fff8e1;"><ul><li>[Weakness 1]</li><li>[Weakness 2]</li><li>[Weakness 3]</li></ul></td></tr>';
    h += '<tr><th style="background:#e3f2fd;color:#1565c0;">Opportunities (External)</th><th style="background:#fce4ec;color:#c62828;">Threats (External)</th></tr>';
    h += '<tr><td style="vertical-align:top;background:#e8f4fd;"><ul><li>[Opportunity 1]</li><li>[Opportunity 2]</li><li>[Opportunity 3]</li></ul></td>';
    h += '<td style="vertical-align:top;background:#fde8ea;"><ul><li>[Threat 1]</li><li>[Threat 2]</li><li>[Threat 3]</li></ul></td></tr></table>';
    h += '<h2>Strategic Actions</h2><table><tr><th>Strategy</th><th>Combine</th><th>Action</th></tr>';
    h += '<tr><td>SO</td><td>[S + O]</td><td>[Leverage]</td></tr><tr><td>WO</td><td>[W + O]</td><td>[Improve]</td></tr>';
    h += '<tr><td>ST</td><td>[S + T]</td><td>[Defend]</td></tr><tr><td>WT</td><td>[W + T]</td><td>[Minimise]</td></tr></table>';
    return h;
  }

  function tmplActionPlan(p) {
    var today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    var h = '<h1 style="text-align:center;">Action Plan</h1><p style="text-align:center;color:#555;">' + esc(p.name || '[Goal]') + '</p>';
    h += '<p style="text-align:center;color:#888;">Created: ' + esc(today) + '</p><hr>';
    h += '<h2>Goal Statement</h2><p>[Specific, measurable, time-bound goal.]</p>';
    h += '<h2>Key Actions</h2><table><tr><th>#</th><th>Action</th><th>Owner</th><th>Priority</th><th>Start</th><th>End</th><th>Resources</th><th>Status</th></tr>';
    h += '<tr><td>1</td><td>[Step]</td><td>' + esc(p.name || '[Name]') + '</td><td>[H/M/L]</td><td>[Date]</td><td>[Date]</td><td>[List]</td><td>Not Started</td></tr></table>';
    h += '<h2>Success Criteria</h2><ul><li>[How will you know this succeeded?]</li></ul>';
    h += '<h2>Obstacles</h2><table><tr><th>Obstacle</th><th>Likelihood</th><th>Contingency</th></tr><tr><td>[Obstacle]</td><td>[H/M/L]</td><td>[Plan]</td></tr></table>';
    h += '<h2>Progress Log</h2><table><tr><th>Date</th><th>Update</th><th>Next Step</th></tr><tr><td>[Date]</td><td>[Update]</td><td>[Next]</td></tr></table>';
    return h;
  }

  function tmplSOP(p) {
    var today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    var h = '<h1 style="text-align:center;">Standard Operating Procedure (SOP)</h1><hr>';
    h += '<table style="width:100%;"><tr><td style="width:50%;"><strong>Title:</strong> [Title]<br><strong>SOP #:</strong> [SOP-XXXX]<br><strong>Version:</strong> 1.0</td>';
    h += '<td style="width:50%;"><strong>Effective:</strong> ' + esc(today) + '<br><strong>Author:</strong> ' + esc(p.name) + '<br><strong>Dept:</strong> [Department]</td></tr></table><hr>';
    h += '<h2>1. Purpose</h2><p>[Why does this procedure exist?]</p>';
    h += '<h2>2. Scope</h2><p>[Who, what and where does this apply?]</p>';
    h += '<h2>3. Definitions</h2><table><tr><th>Term</th><th>Definition</th></tr><tr><td>[Term]</td><td>[Definition]</td></tr></table>';
    h += '<h2>4. Responsibilities</h2><table><tr><th>Role</th><th>Responsibility</th></tr><tr><td>[Role]</td><td>[What they do]</td></tr></table>';
    h += '<h2>5. Procedure</h2><table><tr><th>Step</th><th>Action</th><th>Responsible</th><th>Notes</th></tr>';
    h += '<tr><td>1</td><td>[Action]</td><td>[Role]</td><td>[Note]</td></tr><tr><td>2</td><td>[Action]</td><td>[Role]</td><td>[Note]</td></tr><tr><td>3</td><td>[Action]</td><td>[Role]</td><td>[Note]</td></tr></table>';
    h += '<h2>6. Quality Checks</h2><table><tr><th>Check</th><th>Frequency</th><th>Acceptable</th><th>If Failed</th></tr><tr><td>[Check]</td><td>[Daily]</td><td>[Range]</td><td>[Action]</td></tr></table>';
    h += '<h2>7. Revision History</h2><table><tr><th>Version</th><th>Date</th><th>Author</th><th>Change</th></tr><tr><td>1.0</td><td>' + esc(today) + '</td><td>' + esc(p.name) + '</td><td>Initial</td></tr></table>';
    h += '<hr><p><strong>Approved by:</strong> ________________________ &nbsp;&nbsp; <strong>Date:</strong> ____________</p>';
    return h;
  }

  // ===================== EDITOR =====================
  var ED = { id: null, painter: null, track: false, tab: 'home', dirty: false };
  function area() { return document.getElementById('chcnDocArea'); }
  function focusArea() { var a = area(); if (a) a.focus(); }
  function markDirty() { ED.dirty = true; var s = document.getElementById('chcnEdState'); if (s) s.textContent = 'Unsaved changes'; }
  function cmd(c, v) { focusArea(); try { document.execCommand(c, false, v || null); } catch (e) {} markDirty(); }

  var FONTS = ['Arial','Calibri','Cambria','Georgia','Times New Roman','Helvetica','Verdana','Tahoma','Trebuchet MS','Courier New','Garamond','Comic Sans MS'];
  var SIZES = [['8','1'],['10','2'],['12','3'],['14','4'],['18','5'],['24','6'],['36','7']];

  function grp(tab, inner) { return '<div class="chcn-ed-panel' + (tab === 'home' ? ' active' : '') + '" data-panel="' + tab + '">' + inner + '</div>'; }
  function b(fn, label) { return '<button class="chcn-ed-btn" onmousedown="return chcnKeepSel(event)" onclick="' + fn + '">' + label + '</button>'; }
  window.chcnKeepSel = function (e) { e.preventDefault(); return false; };

  function ribbon() {
    var h = '<div class="chcn-ed-tabs">';
    ['File','Home','Insert','Layout','Design','References','Review'].forEach(function (t) {
      var k = t.toLowerCase();
      h += '<button class="chcn-ed-tab' + (k === 'home' ? ' active' : '') + '" data-tab="' + k + '" onclick="chcnEdTab(\'' + k + '\')">' + t + '</button>';
    });
    h += '</div><div class="chcn-ed-panels">';
    h += grp('file', ''
      + b("chcnCreateDoc('blank')", '📄 New') + b('chcnOpenFromDevice()', '📂 Open')
      + b('chcnDocSave()', '💾 Save') + b('chcnDocSaveAs("docx")', '⬇ Save .docx')
      + b('chcnDocSaveAs("doc")', 'Save .doc') + b('chcnDocSaveAs("html")', 'Save .html') + b('chcnDocSaveAs("txt")', 'Save .txt')
      + b('chcnDocSaveToPicker()', '📁 Save to Location')
      + b('chcnDocPrint()', '🖨 Print') + b('chcnDocPrint()', '📄 Export PDF')
      + b('chcnDocShare()', '✉️ Share / Email') + b('chcnCloseEditor()', '✕ Close'));
    var fsel = '<select class="chcn-ed-sel" onchange="chcnEdFont(this.value)" title="Font">';
    FONTS.forEach(function (f) { fsel += '<option value="' + f + '">' + f + '</option>'; });
    fsel += '</select>';
    var ssel = '<select class="chcn-ed-sel sm" onchange="chcnEdSize(this.value)" title="Font size">';
    SIZES.forEach(function (s) { ssel += '<option value="' + s[1] + '">' + s[0] + '</option>'; });
    ssel += '</select>';
    var hsel = '<select class="chcn-ed-sel" onchange="chcnEdBlock(this.value)" title="Style"><option value="P">Normal</option><option value="H1">Heading 1</option><option value="H2">Heading 2</option><option value="H3">Heading 3</option><option value="BLOCKQUOTE">Quote</option><option value="PRE">Code</option></select>';
    h += grp('home', ''
      + hsel + fsel + ssel
      + b("chcnEd('bold')", '<b>B</b>') + b("chcnEd('italic')", '<i>I</i>') + b("chcnEd('underline')", '<u>U</u>')
      + b("chcnEd('strikeThrough')", '<s>S</s>') + b("chcnEd('subscript')", 'x₂') + b("chcnEd('superscript')", 'x²')
      + '<label class="chcn-ed-color" title="Text colour">A<input type="color" onchange="chcnEdColor(this.value)"></label>'
      + '<label class="chcn-ed-color hl" title="Highlight">✎<input type="color" value="#ffff00" onchange="chcnEdHilite(this.value)"></label>'
      + b("chcnEd('justifyLeft')", '☰L') + b("chcnEd('justifyCenter')", '≡C') + b("chcnEd('justifyRight')", '☰R') + b("chcnEd('justifyFull')", '≡J')
      + b("chcnEd('insertUnorderedList')", '• List') + b("chcnEd('insertOrderedList')", '1. List')
      + b("chcnEd('outdent')", '⬅ Outdent') + b("chcnEd('indent')", 'Indent ➡')
      + b("chcnEd('undo')", '↶ Undo') + b("chcnEd('redo')", '↷ Redo')
      + b("chcnEd('removeFormat')", '✗ Clear') + b('chcnPainter(this)', '🧹 Format Painter')
      + b('chcnFindReplace()', '🔍 Find &amp; Replace'));
    h += grp('insert', ''
      + b('chcnInsertTable()', '▦ Table')
      + '<label class="chcn-ed-btn">🖼 Picture<input type="file" accept="image/*" onchange="chcnInsertImage(event)" style="display:none;"></label>'
      + b('chcnInsertShape()', '◆ Shape / Icon') + b("chcnEd('insertHorizontalRule')", '― Line')
      + b('chcnInsertLink()', '🔗 Link') + b('chcnInsertPageBreak()', '✂ Page break')
      + b('chcnToggleHeader()', '📄 Header/Footer') + b('chcnInsertPageNo()', '# Page number'));
    h += grp('layout', ''
      + '<span class="chcn-ed-lbl">Margins</span>'
      + b("chcnMargins('normal')", 'Normal') + b("chcnMargins('narrow')", 'Narrow') + b("chcnMargins('wide')", 'Wide')
      + '<span class="chcn-ed-lbl">Orientation</span>'
      + b("chcnOrient('portrait')", '📄 Portrait') + b("chcnOrient('landscape')", '📃 Landscape')
      + '<span class="chcn-ed-lbl">Columns</span>'
      + b('chcnColumns(1)', '1') + b('chcnColumns(2)', '2') + b('chcnColumns(3)', '3'));
    h += grp('design', ''
      + '<span class="chcn-ed-lbl">Themes</span>'
      + b("chcnTheme('classic')", 'Classic') + b("chcnTheme('modern')", 'Modern') + b("chcnTheme('elegant')", 'Elegant') + b("chcnTheme('bold')", 'Bold')
      + '<span class="chcn-ed-lbl">Templates</span>'
      + b("chcnApplyTemplate('resume')", 'Resume') + b("chcnApplyTemplate('letter')", 'Letter') + b("chcnApplyTemplate('portfolio')", 'Portfolio')
      + b("chcnApplyTemplate('businessplan')", 'Biz Plan') + b("chcnApplyTemplate('invoice')", 'Invoice') + b("chcnApplyTemplate('minutes')", 'Minutes')
      + b("chcnApplyTemplate('memo')", 'Memo') + b("chcnApplyTemplate('budget')", 'Budget') + b("chcnApplyTemplate('swot')", 'SWOT'));
    h += grp('references', ''
      + b('chcnInsertTOC()', '📑 Table of Contents') + b('chcnInsertCitation()', '“ ” Citation') + b('chcnInsertBibliography()', '📚 Bibliography'));
    h += grp('review', ''
      + b('chcnToggleSpell(this)', '✅ Spell check') + b('chcnToggleTrack(this)', '✍ Track changes')
      + b('chcnAddComment()', '💬 Comment') + b('chcnWordCount()', '🔢 Word count'));
    h += '</div>';
    return h;
  }
  window.chcnEdTab = function (k) {
    ED.tab = k;
    document.querySelectorAll('.chcn-ed-tab').forEach(function (el) { el.classList.toggle('active', el.getAttribute('data-tab') === k); });
    document.querySelectorAll('.chcn-ed-panel').forEach(function (el) { el.classList.toggle('active', el.getAttribute('data-panel') === k); });
  };
  window.chcnEd = function (c) { cmd(c); };
  window.chcnEdFont = function (v) { cmd('fontName', v); };
  window.chcnEdSize = function (v) { cmd('fontSize', v); };
  window.chcnEdColor = function (v) { cmd('foreColor', v); };
  window.chcnEdHilite = function (v) { focusArea(); try { document.execCommand('hiliteColor', false, v); } catch (e) { try { document.execCommand('backColor', false, v); } catch (e2) {} } markDirty(); };
  window.chcnEdBlock = function (v) { cmd('formatBlock', v); };
  function openEditor(id) {
    var d = getDoc(id); if (!d) { toast('Document not found', true); return; }
    ED.id = id; ED.dirty = false; ED.track = false; ED.painter = null;
    var old = document.getElementById('chcnDocEditor'); if (old) old.remove();
    var ov = document.createElement('div'); ov.id = 'chcnDocEditor'; ov.className = 'chcn-doc-editor';
    var h = '<div class="chcn-ed-bar"><input id="chcnDocTitle" class="chcn-ed-title" value="' + esc(d.title) + '" onchange="chcnDocTitleChange(this.value)">';
    h += '<span class="chcn-ed-save-state" id="chcnEdState"></span>';
    h += '<button class="chcn-ed-close" onclick="chcnCloseEditor()" aria-label="Close">✕</button></div>';
    h += ribbon();
    h += '<div class="chcn-ed-scroll"><div class="chcn-doc-page" id="chcnDocPageWrap">';
    h += '<div id="chcnDocHeader" class="chcn-doc-hf" style="display:none;" contenteditable="true" data-ph="Header"></div>';
    h += '<div id="chcnDocArea" class="chcn-doc-area" contenteditable="true" spellcheck="true">' + d.html + '</div>';
    h += '<div id="chcnDocFooter" class="chcn-doc-hf" style="display:none;" contenteditable="true" data-ph="Footer"></div>';
    h += '</div></div>';
    ov.innerHTML = h;
    document.body.appendChild(ov);
    document.body.classList.add('chcn-ed-open');
    var a = area();
    a.addEventListener('input', markDirty);
    a.addEventListener('mouseup', maybePaint);
    a.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key && e.key.toLowerCase() === 's') { e.preventDefault(); window.chcnDocSave(); }
    });
    chcnEdTab('home');
  }
  window.chcnCloseEditor = function () {
    if (ED.dirty) { if (window.confirm('Save changes before closing?')) window.chcnDocSave(true); }
    var ov = document.getElementById('chcnDocEditor'); if (ov) ov.remove();
    document.body.classList.remove('chcn-ed-open');
    ED.id = null; renderCareer();
  };
  window.chcnDocTitleChange = function (v) { var d = getDoc(ED.id); if (d) { d.title = v.trim() || d.title; d.updated = Date.now(); putDoc(d); } };

  // ---- Insert handlers ----
  function insertHtmlAtCursor(html) {
    focusArea();
    try { document.execCommand('insertHTML', false, html); }
    catch (e) { var a = area(); if (a) a.innerHTML += html; }
    markDirty();
  }
  window.chcnInsertTable = function () {
    var r = parseInt(window.prompt('Number of rows', '3'), 10);
    var c = parseInt(window.prompt('Number of columns', '3'), 10);
    if (!r || !c || r < 1 || c < 1 || r > 50 || c > 20) return;
    var t = '<table class="chcn-doc-tbl" border="1" cellspacing="0" cellpadding="6" style="border-collapse:collapse;width:100%;"><tbody>';
    for (var i = 0; i < r; i++) { t += '<tr>'; for (var j = 0; j < c; j++) t += '<td style="border:1px solid #999;padding:6px;">&nbsp;</td>'; t += '</tr>'; }
    t += '</tbody></table><p><br></p>';
    insertHtmlAtCursor(t);
  };
  window.chcnInsertImage = function (ev) {
    var f = ev.target.files && ev.target.files[0]; if (!f) return;
    if (f.size > 8 * 1024 * 1024) { toast('Image too large (max 8 MB)', true); ev.target.value = ''; return; }
    var rd = new FileReader();
    rd.onload = function () { insertHtmlAtCursor('<img src="' + rd.result + '" style="max-width:100%;height:auto;" alt="image">'); };
    rd.readAsDataURL(f); ev.target.value = '';
  };
  var SHAPES = ['■','●','▲','◆','★','❤️','✔️','➡️','⭐','📌','💡','🎯','📈','📊'];
  window.chcnInsertShape = function () {
    var pick = window.prompt('Type a shape/icon to insert, or copy one of these:\n' + SHAPES.join('  '), '★');
    if (pick) insertHtmlAtCursor('<span style="font-size:24px;">' + esc(pick) + '</span>');
  };
  window.chcnInsertLink = function () { var url = window.prompt('Link URL', 'https://'); if (url) cmd('createLink', url); };
  window.chcnInsertPageBreak = function () { insertHtmlAtCursor('<div class="chcn-doc-pgbreak"></div><p><br></p>'); };
  window.chcnToggleHeader = function () {
    var hd = document.getElementById('chcnDocHeader'), ft = document.getElementById('chcnDocFooter');
    var show = hd.style.display === 'none';
    hd.style.display = ft.style.display = show ? 'block' : 'none';
    toast(show ? 'Header & footer shown' : 'Header & footer hidden');
  };
  window.chcnInsertPageNo = function () {
    var ft = document.getElementById('chcnDocFooter');
    if (ft && ft.style.display === 'none') window.chcnToggleHeader();
    if (ft) { ft.innerHTML = (ft.innerHTML || '') + '<span class="chcn-doc-pageno">Page 1</span>'; markDirty(); }
  };

  // ---- Format painter ----
  function currentInlineStyle() {
    var s = window.getSelection(); if (!s || !s.anchorNode) return null;
    var node = s.anchorNode.nodeType === 1 ? s.anchorNode : s.anchorNode.parentNode;
    if (!node) return null;
    var cs = window.getComputedStyle(node);
    return { color: cs.color, font: cs.fontFamily, weight: cs.fontWeight, style: cs.fontStyle, deco: (cs.textDecorationLine || cs.textDecoration || '') };
  }
  window.chcnPainter = function (btn) {
    ED.painter = currentInlineStyle();
    if (btn) btn.classList.toggle('active', !!ED.painter);
    toast(ED.painter ? 'Format painter on — select text to apply' : 'Nothing to copy');
  };
  function maybePaint() {
    if (!ED.painter) return;
    var st = ED.painter; var s = window.getSelection();
    if (!s || s.isCollapsed) return;
    try {
      document.execCommand('foreColor', false, st.color);
      document.execCommand('fontName', false, st.font.replace(/"/g, ''));
      if (parseInt(st.weight, 10) >= 600 || st.weight === 'bold') document.execCommand('bold');
      if (st.style === 'italic') document.execCommand('italic');
      if (st.deco && st.deco.indexOf('underline') > -1) document.execCommand('underline');
    } catch (e) {}
    ED.painter = null;
    document.querySelectorAll('.chcn-ed-btn.active').forEach(function (bt) { bt.classList.remove('active'); });
    markDirty();
  }

  // ---- Find & Replace ----
  window.chcnFindReplace = function () {
    var find = window.prompt('Find what:'); if (find == null || find === '') return;
    var repl = window.prompt('Replace with (leave blank to just count):', '');
    var a = area(); if (!a) return;
    var count = 0;
    (function walk(node) {
      if (node.nodeType === 3) {
        if (repl == null) return;
        var txt = node.nodeValue, lower = txt.toLowerCase(), fl = find.toLowerCase();
        var out = '', pos = 0, idx;
        while ((idx = lower.indexOf(fl, pos)) > -1) { out += txt.slice(pos, idx) + repl; pos = idx + find.length; count++; }
        out += txt.slice(pos);
        if (out !== txt) node.nodeValue = out;
      } else if (node.nodeType === 1 && node.childNodes && node.id !== 'chcnDocHeader' && node.id !== 'chcnDocFooter') {
        for (var i = node.childNodes.length - 1; i >= 0; i--) walk(node.childNodes[i]);
      }
    })(a);
    markDirty();
    toast('Replaced ' + count + ' occurrence(s).');
  };
  // ---- Layout ----
  window.chcnMargins = function (m) { var p = document.getElementById('chcnDocArea'); if (!p) return; var v = m === 'narrow' ? '12mm' : m === 'wide' ? '32mm' : '20mm'; p.style.padding = v; markDirty(); };
  window.chcnOrient = function (o) { var w = document.getElementById('chcnDocPageWrap'); if (!w) return; w.classList.toggle('landscape', o === 'landscape'); markDirty(); };
  window.chcnColumns = function (n) { var a = area(); if (!a) return; a.style.columnCount = n > 1 ? n : ''; a.style.columnGap = n > 1 ? '28px' : ''; markDirty(); };

  // ---- Design ----
  var THEMES = { classic: { f: 'Georgia, serif', c: '#1a1a2e' }, modern: { f: 'Calibri, Arial, sans-serif', c: '#0b6e99' }, elegant: { f: '"Times New Roman", serif', c: '#4a3b2a' }, bold: { f: 'Arial, sans-serif', c: '#b8002e' } };
  window.chcnTheme = function (t) {
    var a = area(); if (!a) return; var th = THEMES[t] || THEMES.classic;
    a.style.fontFamily = th.f;
    a.querySelectorAll('h1,h2,h3').forEach(function (el) { el.style.color = th.c; });
    markDirty(); toast('Theme applied: ' + t);
  };
  window.chcnApplyTemplate = function (kind) {
    if (!window.confirm('Replace the current content with a fresh template? Your current text will be lost.')) return;
    var p = profileData(); var a = area(); if (!a) return;
    a.innerHTML = getTemplateHtml(kind, p);
    markDirty();
  };

  // ---- References ----
  window.chcnInsertTOC = function () {
    var a = area(); if (!a) return;
    var hs = a.querySelectorAll('h1,h2,h3'); if (!hs.length) { toast('Add some headings (Heading 1/2/3) first', true); return; }
    var toc = '<div class="chcn-doc-toc"><strong>Table of Contents</strong><ul>';
    hs.forEach(function (hd) { var lvl = hd.tagName.toLowerCase(); toc += '<li class="toc-' + lvl + '">' + esc(hd.textContent) + '</li>'; });
    toc += '</ul></div>';
    var first = a.firstChild;
    var wrap = document.createElement('div'); wrap.innerHTML = toc;
    if (first) a.insertBefore(wrap.firstChild, first); else a.appendChild(wrap.firstChild);
    markDirty();
  };
  window.chcnInsertCitation = function () {
    var author = window.prompt('Author(s):', ''); if (author == null) return;
    var title = window.prompt('Title:', '') || '';
    var year = window.prompt('Year:', '') || '';
    var src = window.prompt('Publisher / URL:', '') || '';
    var num = (a_bib().length + 1);
    var entry = author + (year ? ' (' + year + ').' : '.') + ' ' + title + '. ' + src;
    var arr = a_bib(); arr.push(entry); set_bib(arr);
    insertHtmlAtCursor('<sup class="chcn-doc-cite">[' + num + ']</sup>');
  };
  function a_bib() { try { return JSON.parse(sessionStorage.getItem('chcn_bib_' + ED.id)) || []; } catch (e) { return []; } }
  function set_bib(a) { try { sessionStorage.setItem('chcn_bib_' + ED.id, JSON.stringify(a)); } catch (e) {} }
  window.chcnInsertBibliography = function () {
    var arr = a_bib(); if (!arr.length) { toast('Add citations first', true); return; }
    var h = '<h2>References</h2><ol class="chcn-doc-bib">';
    arr.forEach(function (e) { h += '<li>' + esc(e) + '</li>'; });
    h += '</ol>';
    var a = area(); if (a) { a.insertAdjacentHTML('beforeend', h); markDirty(); }
  };

  // ---- Review ----
  window.chcnToggleSpell = function (btn) {
    var a = area(); if (!a) return;
    var on = a.getAttribute('spellcheck') !== 'false';
    a.setAttribute('spellcheck', on ? 'false' : 'true');
    if (btn) btn.classList.toggle('active', !on);
    toast('Spell check ' + (on ? 'off' : 'on') + ' — right-click a red-underlined word for corrections');
  };
  window.chcnToggleTrack = function (btn) {
    ED.track = !ED.track;
    if (btn) btn.classList.toggle('active', ED.track);
    toast('Track changes ' + (ED.track ? 'on — new text is marked, deletions struck through' : 'off'));
  };
  window.chcnAddComment = function () {
    var s = window.getSelection(); if (!s || s.isCollapsed) { toast('Select the text you want to comment on', true); return; }
    var note = window.prompt('Comment:'); if (!note) return;
    var span = document.createElement('span'); span.className = 'chcn-doc-comment'; span.title = note; span.setAttribute('data-comment', note);
    try { s.getRangeAt(0).surroundContents(span); } catch (e) { toast('Could not add comment on that selection', true); return; }
    markDirty(); toast('Comment added — hover the highlight to read it');
  };
  window.chcnWordCount = function () {
    var a = area(); if (!a) return;
    var txt = (a.innerText || '').trim();
    var words = txt ? txt.split(/\s+/).length : 0;
    toast(words + ' words • ' + txt.length + ' characters');
  };

  // track-changes input handling
  document.addEventListener('keydown', function (e) {
    if (!ED.track || !ED.id) return;
    var a = area(); if (!a || document.activeElement !== a) return;
    if ((e.key === 'Backspace' || e.key === 'Delete')) {
      var s = window.getSelection();
      if (s && !s.isCollapsed) {
        e.preventDefault();
        var span = document.createElement('span'); span.className = 'chcn-doc-del';
        try { s.getRangeAt(0).surroundContents(span); s.collapseToEnd(); markDirty(); } catch (err) {}
      }
    }
  }, true);

  // ---- File: save / open / print / share ----
  function currentHtml() { var a = area(); return a ? a.innerHTML : ''; }
  window.chcnDocSave = function (silent) {
    var d = getDoc(ED.id); if (!d) return;
    var tEl = document.getElementById('chcnDocTitle');
    if (tEl) d.title = tEl.value.trim() || d.title;
    d.html = currentHtml(); d.updated = Date.now();
    if (putDoc(d)) { ED.dirty = false; var s = document.getElementById('chcnEdState'); if (s) s.textContent = 'Saved'; if (!silent) toast('Saved to your device.'); }
  };
  function docTitle() { var tEl = document.getElementById('chcnDocTitle'); return (tEl && tEl.value.trim()) || 'document'; }
  function safeName(n) { return n.replace(/[^a-z0-9\-_ ]/gi, '').trim().replace(/\s+/g, '-') || 'document'; }
  function download(blob, fname) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a'); a.href = url; a.download = fname; document.body.appendChild(a); a.click();
    setTimeout(function () { document.body.removeChild(a); URL.revokeObjectURL(url); }, 1500);
  }
  function fullHtmlDoc(inner, forWord) {
    var head = '<meta charset="utf-8"><title>' + esc(docTitle()) + '</title>';
    var css = 'body{font-family:Georgia,"Times New Roman",serif;font-size:12pt;line-height:1.5;color:#111;margin:1in;}h1{font-size:22pt;}h2{font-size:16pt;}h3{font-size:13pt;}table{border-collapse:collapse;}td,th{border:1px solid #999;padding:6px;}img{max-width:100%;}.chcn-doc-comment{background:#fff3b0;}.chcn-doc-del{color:#c0392b;text-decoration:line-through;}';
    var xmlns = forWord ? ' xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"' : '';
    return '<!DOCTYPE html><html' + xmlns + '><head>' + head + '<style>' + css + '</style></head><body>' + inner + '</body></html>';
  }
  window.chcnDocPrint = function () {
    var doc = fullHtmlDoc(currentHtml(), false);
    var f = document.createElement('iframe'); f.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;';
    document.body.appendChild(f); f.srcdoc = doc;
    f.onload = function () { setTimeout(function () { try { f.contentWindow.focus(); f.contentWindow.print(); } catch (e) {} setTimeout(function () { try { document.body.removeChild(f); } catch (e) {} }, 3000); }, 300); };
  };
  window.chcnDocShare = function () {
    var a = area(); var text = a ? (a.innerText || '') : '';
    var subject = encodeURIComponent(docTitle());
    var body = encodeURIComponent(text.slice(0, 1800));
    try { window.location.href = 'mailto:?subject=' + subject + '&body=' + body; }
    catch (e) { toast('Could not open email app', true); }
    toast('Opening your email app. Tip: use Save as .docx to attach the full file.');
  };
  window.chcnOpenFromDevice = function () {
    var inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.html,.htm,.txt,.doc,.docx,text/html,text/plain';
    inp.onchange = function () {
      var f = inp.files && inp.files[0]; if (!f) return;
      var rd = new FileReader();
      rd.onload = function () {
        var content = String(rd.result || '');
        var isHtml = /\.html?$|\.doc$/i.test(f.name) || /<[a-z]/i.test(content);
        var html = isHtml ? content.replace(/^[\s\S]*?<body[^>]*>/i, '').replace(/<\/body>[\s\S]*$/i, '') : ('<p>' + esc(content).replace(/\n/g, '</p><p>') + '</p>');
        var doc = { id: uid(), kind: 'blank', title: f.name.replace(/\.[^.]+$/, ''), html: html || '<p><br></p>', ts: Date.now(), updated: Date.now() };
        putDoc(doc); renderCareer(); openEditor(doc.id);
        if (/\.docx$/i.test(f.name)) toast('Opened text from .docx. Complex Word layouts may differ.');
      };
      rd.readAsText(f);
    };
    inp.click();
  };
  // ===================== .docx EXPORT (real OOXML) =====================
  var _crcT;
  function crc32(bytes) {
    if (!_crcT) { _crcT = []; for (var n = 0; n < 256; n++) { var c = n; for (var k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1); _crcT[n] = c >>> 0; } }
    var crc = 0xFFFFFFFF;
    for (var i = 0; i < bytes.length; i++) crc = (crc >>> 8) ^ _crcT[(crc ^ bytes[i]) & 0xFF];
    return (crc ^ 0xFFFFFFFF) >>> 0;
  }
  var _enc = new TextEncoder();
  function u8(str) { return _enc.encode(str); }
  function concat(arrs) {
    var len = 0, i; for (i = 0; i < arrs.length; i++) len += arrs[i].length;
    var out = new Uint8Array(len), off = 0;
    for (i = 0; i < arrs.length; i++) { out.set(arrs[i], off); off += arrs[i].length; }
    return out;
  }
  function w16(n) { return new Uint8Array([n & 255, (n >>> 8) & 255]); }
  function w32(n) { return new Uint8Array([n & 255, (n >>> 8) & 255, (n >>> 16) & 255, (n >>> 24) & 255]); }
  function buildZip(files) {
    var locals = [], central = [], offset = 0, i;
    for (i = 0; i < files.length; i++) {
      var nameB = u8(files[i].name), data = files[i].data, crc = crc32(data);
      var lh = concat([w32(0x04034b50), w16(20), w16(0), w16(0), w16(0), w16(0), w32(crc), w32(data.length), w32(data.length), w16(nameB.length), w16(0), nameB, data]);
      locals.push(lh);
      var ch = concat([w32(0x02014b50), w16(20), w16(20), w16(0), w16(0), w16(0), w16(0), w32(crc), w32(data.length), w32(data.length), w16(nameB.length), w16(0), w16(0), w16(0), w16(0), w32(0), w32(offset), nameB]);
      central.push(ch);
      offset += lh.length;
    }
    var cd = concat(central), cdOff = offset;
    var eocd = concat([w32(0x06054b50), w16(0), w16(0), w16(files.length), w16(files.length), w32(cd.length), w32(cdOff), w16(0)]);
    return new Blob([concat(locals), cd, eocd], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
  }
  function xmlEsc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

  // ----- HTML DOM -> WordprocessingML -----
  var _media, _rels, _imgN;
  function px2half(px) { return Math.max(2, Math.round(px * 0.75 * 2)); } // px->pt->half-points
  function colorHex(c) {
    if (!c) return null;
    var m = c.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
    if (m) { return ((+m[1]) << 16 | (+m[2]) << 8 | (+m[3])).toString(16).padStart(6, '0'); }
    m = c.match(/^#([0-9a-f]{6})$/i); if (m) return m[1];
    m = c.match(/^#([0-9a-f]{3})$/i); if (m) return m[1].replace(/(.)/g, '$1$1');
    return null;
  }
  function runProps(fmt) {
    var p = '';
    if (fmt.b) p += '<w:b/>';
    if (fmt.i) p += '<w:i/>';
    if (fmt.u) p += '<w:u w:val="single"/>';
    if (fmt.strike) p += '<w:strike/>';
    if (fmt.color) p += '<w:color w:val="' + fmt.color + '"/>';
    if (fmt.font) p += '<w:rFonts w:ascii="' + xmlEsc(fmt.font) + '" w:hAnsi="' + xmlEsc(fmt.font) + '"/>';
    if (fmt.sz) p += '<w:sz w:val="' + fmt.sz + '"/>';
    if (fmt.hl) p += '<w:highlight w:val="yellow"/>';
    return p ? '<w:rPr>' + p + '</w:rPr>' : '';
  }
  function textRun(text, fmt) {
    if (!text) return '';
    var runs = text.split('\n');
    var out = '';
    for (var i = 0; i < runs.length; i++) {
      if (i > 0) out += '<w:r><w:br/></w:r>';
      if (runs[i] === '') continue;
      out += '<w:r>' + runProps(fmt) + '<w:t xml:space="preserve">' + xmlEsc(runs[i]) + '</w:t></w:r>';
    }
    return out;
  }
  function b64ToU8(b64) {
    var bin = atob(b64), len = bin.length, arr = new Uint8Array(len);
    for (var i = 0; i < len; i++) arr[i] = bin.charCodeAt(i);
    return arr;
  }
  function imageRun(img) {
    try {
      var src = img.getAttribute('src') || '';
      var m = src.match(/^data:(image\/(png|jpeg|jpg|gif));base64,(.*)$/i);
      if (!m) return '';
      var ext = m[2].toLowerCase() === 'jpg' ? 'jpeg' : m[2].toLowerCase();
      var data = b64ToU8(m[3]);
      _imgN++; var fname = 'image' + _imgN + '.' + (ext === 'jpeg' ? 'jpg' : ext);
      _media.push({ name: 'word/media/' + fname, data: data });
      var rId = 'rIdImg' + _imgN;
      _rels.push('<Relationship Id="' + rId + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/' + fname + '"/>');
      var w = img.naturalWidth || img.width || 400, h = img.naturalHeight || img.height || 300;
      var maxW = 600; if (w > maxW) { h = Math.round(h * maxW / w); w = maxW; }
      var cx = w * 9525, cy = h * 9525;
      return '<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0">' +
        '<wp:extent cx="' + cx + '" cy="' + cy + '"/><wp:docPr id="' + _imgN + '" name="Picture ' + _imgN + '"/>' +
        '<a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">' +
        '<pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="' + _imgN + '" name="Picture ' + _imgN + '"/><pic:cNvPicPr/></pic:nvPicPr>' +
        '<pic:blipFill><a:blip r:embed="' + rId + '"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>' +
        '<pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="' + cx + '" cy="' + cy + '"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic>' +
        '</a:graphicData></a:graphic></wp:inline></w:drawing></w:r>';
    } catch (e) { return ''; }
  }
  function inlineRuns(node, fmt) {
    var out = '';
    for (var i = 0; i < node.childNodes.length; i++) {
      var n = node.childNodes[i];
      if (n.nodeType === 3) { out += textRun(n.nodeValue.replace(/\s+/g, ' '), fmt); continue; }
      if (n.nodeType !== 1) continue;
      var tag = n.tagName.toLowerCase();
      if (tag === 'br') { out += '<w:r><w:br/></w:r>'; continue; }
      if (tag === 'img') { out += imageRun(n); continue; }
      var f = { b: fmt.b, i: fmt.i, u: fmt.u, strike: fmt.strike, color: fmt.color, font: fmt.font, sz: fmt.sz, hl: fmt.hl };
      if (tag === 'b' || tag === 'strong') f.b = true;
      if (tag === 'i' || tag === 'em') f.i = true;
      if (tag === 'u') f.u = true;
      if (tag === 's' || tag === 'strike' || tag === 'del') f.strike = true;
      var st = n.style || {};
      if (st.fontWeight && (st.fontWeight === 'bold' || parseInt(st.fontWeight, 10) >= 600)) f.b = true;
      if (st.fontStyle === 'italic') f.i = true;
      if (st.textDecorationLine ? /underline/.test(st.textDecorationLine) : /underline/.test(st.textDecoration || '')) f.u = true;
      var col = colorHex(st.color); if (col) f.color = col;
      if (st.fontFamily) f.font = st.fontFamily.split(',')[0].replace(/['"]/g, '').trim();
      if (st.fontSize && /px$/.test(st.fontSize)) f.sz = px2half(parseFloat(st.fontSize));
      if (st.backgroundColor && st.backgroundColor !== 'transparent' && !/rgba\(0, 0, 0, 0\)/.test(st.backgroundColor)) f.hl = true;
      out += inlineRuns(n, f);
    }
    return out;
  }
  function alignOf(el) {
    var ta = (el.style && el.style.textAlign) || '';
    if (ta === 'center') return 'center'; if (ta === 'right') return 'right'; if (ta === 'justify') return 'both';
    return '';
  }
  function para(runsXml, opts) {
    opts = opts || {};
    var pPr = '';
    if (opts.style) pPr += '<w:pStyle w:val="' + opts.style + '"/>';
    if (opts.align) pPr += '<w:jc w:val="' + opts.align + '"/>';
    if (opts.hr) pPr += '<w:pBdr><w:bottom w:val="single" w:sz="6" w:space="1" w:color="999999"/></w:pBdr>';
    pPr = pPr ? '<w:pPr>' + pPr + '</w:pPr>' : '';
    return '<w:p>' + pPr + (runsXml || '') + '</w:p>';
  }
  var HEAD = { h1: 'Heading1', h2: 'Heading2', h3: 'Heading3', h4: 'Heading4', h5: 'Heading5', h6: 'Heading6' };
  function blockToXml(el) {
    var tag = el.tagName ? el.tagName.toLowerCase() : '';
    if (tag === 'ul' || tag === 'ol') {
      var out = '', n = 1;
      for (var i = 0; i < el.children.length; i++) {
        var li = el.children[i]; if (li.tagName.toLowerCase() !== 'li') continue;
        var prefix = tag === 'ol' ? (n++ + '. ') : '\u2022  ';
        out += para(textRun(prefix, {}) + inlineRuns(li, {}), { });
      }
      return out;
    }
    if (tag === 'table') return tableToXml(el);
    if (tag === 'hr') return para('', { hr: true });
    if (tag === 'img') return para(imageRun(el), { align: alignOf(el) });
    if (tag === 'div' && el.className === 'chcn-doc-pgbreak') return '<w:p><w:r><w:br w:type="page"/></w:r></w:p>';
    var opts = { align: alignOf(el) };
    if (HEAD[tag]) opts.style = HEAD[tag];
    return para(inlineRuns(el, {}), opts);
  }
  function tableToXml(table) {
    var rows = table.querySelectorAll('tr'), out = '<w:tbl><w:tblPr><w:tblW w:w="0" w:type="auto"/><w:tblBorders>' +
      '<w:top w:val="single" w:sz="4" w:color="999999"/><w:left w:val="single" w:sz="4" w:color="999999"/>' +
      '<w:bottom w:val="single" w:sz="4" w:color="999999"/><w:right w:val="single" w:sz="4" w:color="999999"/>' +
      '<w:insideH w:val="single" w:sz="4" w:color="999999"/><w:insideV w:val="single" w:sz="4" w:color="999999"/></w:tblBorders></w:tblPr>';
    for (var r = 0; r < rows.length; r++) {
      out += '<w:tr>';
      var cells = rows[r].children;
      for (var c = 0; c < cells.length; c++) {
        out += '<w:tc><w:tcPr><w:tcW w:w="0" w:type="auto"/></w:tcPr>' + para(inlineRuns(cells[c], { b: cells[c].tagName.toLowerCase() === 'th' })) + '</w:tc>';
      }
      out += '</w:tr>';
    }
    return out + '</w:tbl><w:p/>';
  }
  function domToBody(root) {
    var out = '';
    for (var i = 0; i < root.childNodes.length; i++) {
      var n = root.childNodes[i];
      if (n.nodeType === 3) { if (n.nodeValue.trim()) out += para(textRun(n.nodeValue.replace(/\s+/g, ' '), {})); continue; }
      if (n.nodeType !== 1) continue;
      out += blockToXml(n);
    }
    return out;
  }
  function stylesXml() {
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
      '<w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Georgia" w:hAnsi="Georgia"/><w:sz w:val="24"/></w:rPr></w:rPrDefault></w:docDefaults>' +
      '<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style>' +
      '<w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:pPr><w:spacing w:before="240" w:after="120"/></w:pPr><w:rPr><w:b/><w:sz w:val="44"/><w:color w:val="1a1a2e"/></w:rPr></w:style>' +
      '<w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:pPr><w:spacing w:before="200" w:after="100"/></w:pPr><w:rPr><w:b/><w:sz w:val="32"/><w:color w:val="1a1a2e"/></w:rPr></w:style>' +
      '<w:style w:type="paragraph" w:styleId="Heading3"><w:name w:val="heading 3"/><w:pPr><w:spacing w:before="160" w:after="80"/></w:pPr><w:rPr><w:b/><w:sz w:val="28"/></w:rPr></w:style>' +
      '<w:style w:type="paragraph" w:styleId="Heading4"><w:name w:val="heading 4"/><w:rPr><w:b/><w:sz w:val="26"/></w:rPr></w:style>' +
      '<w:style w:type="paragraph" w:styleId="Heading5"><w:name w:val="heading 5"/><w:rPr><w:b/><w:sz w:val="24"/></w:rPr></w:style>' +
      '<w:style w:type="paragraph" w:styleId="Heading6"><w:name w:val="heading 6"/><w:rPr><w:b/><w:i/><w:sz w:val="24"/></w:rPr></w:style>' +
      '</w:styles>';
  }
  function buildDocx() {
    _media = []; _rels = []; _imgN = 0;
    var a = area();
    var body = domToBody(a);
    var wrap = document.getElementById('chcnDocPageWrap');
    var landscape = wrap && wrap.classList.contains('landscape');
    var pg = landscape ? '<w:pgSz w:w="15840" w:h="12240" w:orient="landscape"/>' : '<w:pgSz w:w="12240" w:h="15840"/>';
    var sect = '<w:sectPr>' + pg + '<w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="720" w:footer="720" w:gutter="0"/></w:sectPr>';
    var docXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" ' +
      'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" ' +
      'xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" ' +
      'xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" ' +
      'xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">' +
      '<w:body>' + body + sect + '</w:body></w:document>';
    var relsBody = '<Relationship Id="rIdStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>' + _rels.join('');
    var docRels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' + relsBody + '</Relationships>';
    var exts = {}; _media.forEach(function (m) { var e = m.name.split('.').pop().toLowerCase(); exts[e] = true; });
    var defaults = '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>';
    if (exts.png) defaults += '<Default Extension="png" ContentType="image/png"/>';
    if (exts.jpg || exts.jpeg) defaults += '<Default Extension="jpg" ContentType="image/jpeg"/>';
    if (exts.gif) defaults += '<Default Extension="gif" ContentType="image/gif"/>';
    var ct = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' + defaults +
      '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>' +
      '<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>';
    var rootRels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>';
    var files = [
      { name: '[Content_Types].xml', data: u8(ct) },
      { name: '_rels/.rels', data: u8(rootRels) },
      { name: 'word/document.xml', data: u8(docXml) },
      { name: 'word/styles.xml', data: u8(stylesXml()) },
      { name: 'word/_rels/document.xml.rels', data: u8(docRels) }
    ];
    _media.forEach(function (m) { files.push(m); });
    return buildZip(files);
  }
  window.chcnDocSaveAs = function (fmt) {
    var name = safeName(docTitle());
    try {
      if (fmt === 'docx') { download(buildDocx(), name + '.docx'); toast('Saved ' + name + '.docx'); }
      else if (fmt === 'doc') { download(new Blob(['\ufeff' + fullHtmlDoc(currentHtml(), true)], { type: 'application/msword' }), name + '.doc'); toast('Saved ' + name + '.doc'); }
      else if (fmt === 'html') { download(new Blob([fullHtmlDoc(currentHtml(), false)], { type: 'text/html' }), name + '.html'); toast('Saved ' + name + '.html'); }
      else if (fmt === 'txt') { var a = area(); download(new Blob([a ? a.innerText : ''], { type: 'text/plain' }), name + '.txt'); toast('Saved ' + name + '.txt'); }
    } catch (e) { toast('Export failed: ' + (e && e.message ? e.message : e), true); }
  };


  // ===================== SAVE TO LOCATION (File System Access API) =====================
  window.chcnDocSaveToLocation = function (fmt) {
    var name = safeName(docTitle());
    var format = fmt || 'docx';
    var blob, ext;
    try {
      if (format === 'docx') { blob = buildDocx(); ext = '.docx'; }
      else if (format === 'doc') { blob = new Blob(['\ufeff' + fullHtmlDoc(currentHtml(), true)], { type: 'application/msword' }); ext = '.doc'; }
      else if (format === 'html') { blob = new Blob([fullHtmlDoc(currentHtml(), false)], { type: 'text/html' }); ext = '.html'; }
      else if (format === 'txt') { var a = area(); blob = new Blob([a ? a.innerText : ''], { type: 'text/plain' }); ext = '.txt'; }
      else if (format === 'pdf') { toast('Use Print \u2192 Save as PDF to choose your save location.'); window.chcnDocPrint(); return; }
      else { blob = buildDocx(); ext = '.docx'; }
    } catch (e) { toast('Export failed: ' + (e && e.message ? e.message : e), true); return; }
    if (window.showSaveFilePicker) {
      var mimeMap = { docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', doc: 'application/msword', html: 'text/html', txt: 'text/plain' };
      var extMap = { docx: ['.docx'], doc: ['.doc'], html: ['.html'], txt: ['.txt'] };
      var opts = { suggestedName: name + ext, types: [{ description: format.toUpperCase() + ' Document', accept: {} }] };
      opts.types[0].accept[mimeMap[format] || 'application/octet-stream'] = extMap[format] || [ext];
      window.showSaveFilePicker(opts).then(function (handle) { return handle.createWritable(); })
        .then(function (w) { return w.write(blob).then(function () { return w.close(); }); })
        .then(function () { toast('Saved to your chosen location!'); ED.dirty = false; var s = document.getElementById('chcnEdState'); if (s) s.textContent = 'Saved'; })
        .catch(function (err) { if (err && err.name === 'AbortError') return; download(blob, name + ext); toast('Browser cannot choose location \u2014 file downloaded instead.'); });
    } else {
      download(blob, name + ext);
      toast('Your browser does not support choosing a save location. File downloaded to default folder. Tip: use Chrome or Edge for Save to Location.');
    }
  };

  window.chcnDocSaveToPicker = function () {
    var existing = document.getElementById('chcnSaveToModal');
    if (existing) existing.remove();
    var m = document.createElement('div'); m.id = 'chcnSaveToModal';
    m.style.cssText = 'position:fixed;inset:0;z-index:9000;background:rgba(15,15,30,.65);display:flex;align-items:center;justify-content:center;';
    var box = '<div style="background:#fff;border-radius:16px;max-width:420px;width:90%;padding:28px 24px;box-shadow:0 8px 32px rgba(0,0,0,.22);">';
    box += '<h3 style="margin:0 0 12px;color:#1a1a2e;">Save to Location</h3>';
    box += '<p style="color:#666;font-size:13px;margin:0 0 18px;">Choose a format, then pick where to save on your device.</p>';
    box += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">';
    box += '<button class="chcn-save-to-fmt" onclick="chcnDocSaveToLocation(\'docx\')" style="padding:12px;border:1px solid #e2e2ec;border-radius:10px;background:#fff;cursor:pointer;font-size:14px;font-weight:600;">\uD83D\uDCC4 .docx</button>';
    box += '<button class="chcn-save-to-fmt" onclick="chcnDocSaveToLocation(\'doc\')" style="padding:12px;border:1px solid #e2e2ec;border-radius:10px;background:#fff;cursor:pointer;font-size:14px;font-weight:600;">\uD83D\uDCC4 .doc</button>';
    box += '<button class="chcn-save-to-fmt" onclick="chcnDocSaveToLocation(\'html\')" style="padding:12px;border:1px solid #e2e2ec;border-radius:10px;background:#fff;cursor:pointer;font-size:14px;font-weight:600;">\uD83C\uDF10 .html</button>';
    box += '<button class="chcn-save-to-fmt" onclick="chcnDocSaveToLocation(\'txt\')" style="padding:12px;border:1px solid #e2e2ec;border-radius:10px;background:#fff;cursor:pointer;font-size:14px;font-weight:600;">\uD83D\uDCDD .txt</button>';
    box += '<button class="chcn-save-to-fmt" onclick="chcnDocSaveToLocation(\'pdf\')" style="padding:12px;border:1px solid #e2e2ec;border-radius:10px;background:#fff;cursor:pointer;font-size:14px;font-weight:600;">\uD83D\uDDA8\uFE0F .pdf</button>';
    box += '<button onclick="document.getElementById(\'chcnSaveToModal\').remove()" style="padding:12px;border:1px solid #e2e2ec;border-radius:10px;background:#f8f8f8;cursor:pointer;font-size:14px;font-weight:600;color:#888;">\u2715 Cancel</button>';
    box += '</div></div>';
    m.innerHTML = box;
    document.body.appendChild(m);
    m.addEventListener('click', function (e) { if (e.target === m) m.remove(); });
  };

  // ===================== INIT =====================
  function install() {
    try { renderCareer(); } catch (e) {}
    if (typeof window.switchAccountTab === 'function' && !window.switchAccountTab.__chcnCareer) {
      var orig = window.switchAccountTab;
      window.switchAccountTab = function (panelId, link) { orig.apply(this, arguments); if (panelId === 'panel-career') { try { renderCareer(); } catch (e) {} } };
      window.switchAccountTab.__chcnCareer = true;
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
  else install();
})();

