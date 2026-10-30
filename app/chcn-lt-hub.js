/* =============================================================================
 * Life & Tools — HUB (utility-only landing page)
 * ========================================================================== */
(function () {
  'use strict';
  var A = window.LTApp; if (!A) { return; }

  var GROUPS = [
    { title: 'Creator & Office Tools', items: [
      { page: 'tools', ico: '\uD83E\uDDF0', name: 'Creator Tools', desc: 'Captions, bios & hashtags, a TikTok earnings estimate, currency converter and a business calculator. All offline.' },
      { page: 'officetools', ico: '\uD83D\uDCE6', name: 'Office Tools', desc: 'Open and view documents, spreadsheets and presentations right on your device.' }
    ]},
    { title: 'Family & Relationships', items: [
      { page: 'family', ico: '\uD83D\uDC6A', name: 'Family & Relationships Center', desc: 'Add relatives, auto-calculate how everyone is related, and view your private family tree.' },
      { page: 'bloodtype', ico: '\uD83E\uDE78', name: 'Blood Type Inheritance', desc: 'Possible ABO/Rh blood types a child could inherit from a mother and father.' }
    ]},
    { title: 'Health & Body', items: [
      { page: 'cycle', ico: '\uD83C\uDF19', name: 'Period & Cycle Tracker', desc: 'Private period, cycle and fertility-window tracking. Stays on this device.', badge: 'Private' },
      { page: 'bmi', ico: '\u2696\uFE0F', name: 'BMI Calculator', desc: 'General body-mass-index screening figure. Not a diagnosis.' }
    ]},
    { title: 'Calculators', items: [
      { page: 'calc', ico: '\uD83E\uDDEE', name: 'Everyday Calculator', desc: 'Percentages, tips & bill splitting, percentage change.' },
      { page: 'datecalc', ico: '\uD83D\uDCC5', name: 'Date & Age Calculator', desc: 'Days between dates, age breakdown, add/subtract days.' }
    ]},
    { title: 'Converters', items: [
      { page: 'convert', ico: '\uD83D\uDD01', name: 'Unit Converter', desc: 'Length, mass, volume, speed, temperature and data sizes.' }
    ]}
  ];

  function build() {
    var cards = GROUPS.map(function (g) {
      var items = g.items.map(function (t) {
        var badge = t.badge ? '<span class="lt-badge">' + A.esc(t.badge) + '</span>' : '';
        return '<button class="lt-card" type="button" data-go="' + t.page + '">' +
          '<span class="lt-ico" aria-hidden="true">' + t.ico + '</span>' +
          '<span class="lt-card-body"><span class="lt-card-title">' + A.esc(t.name) + badge + '</span>' +
          '<span class="lt-card-desc">' + A.esc(t.desc) + '</span></span>' +
          '<span class="lt-go" aria-hidden="true">\u2192</span></button>';
      }).join('');
      return '<section class="lt-group"><h2 class="lt-group-title">' + A.esc(g.title) + '</h2>' +
        '<div class="lt-grid">' + items + '</div></section>';
    }).join('');
    return '<div id="page-lifetools" style="display:none">' +
      '<section class="page-header"><h1>Life &amp; Tools</h1>' +
      '<p>Practical utilities that run entirely on your device. Every result is really calculated — nothing here is faked, and your data never leaves this device unless you export it.</p></section>' +
      '<section style="padding:16px 0 48px"><div class="container lt-wrap">' + cards + '</div></section>' +
      '</div>';
  }

  function init() {
    var hub = A.el('page-lifetools'); if (!hub) { return; }
    hub.querySelectorAll('.lt-card[data-go]').forEach(function (b) {
      b.addEventListener('click', function () { window.navigate(b.getAttribute('data-go')); });
    });
  }

  A.register({ name: 'hub', pages: ['lifetools'], build: build, init: init });
})();
