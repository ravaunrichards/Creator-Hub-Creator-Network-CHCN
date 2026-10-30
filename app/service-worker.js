/* Creator Hub Creator Network — Service Worker */
const CACHE_NAME = 'chcn-v59-simplified-shell';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './chcn-global.css',
  './chcn-lifetools.css',
  './chcn-resume-photo.css',
  './chcn-completeness.css',
  './chcn-docstudio.css',
  './chcn-nav.js',
  './chcn-platform.js',
  './chcn-resume-photo.js',
  './chcn-completeness.js',
  './chcn-idprofile.js',
  './chcn-docstudio.js',
  './chcn-genetics.js',
  './chcn-cycle.js',
  './chcn-family-engine.js',
  './chcn-calc.js',
  './chcn-lt-core.js',
  './chcn-lt-hub.js',
  './chcn-bloodtype.js',
  './chcn-calc-ui.js',
  './chcn-family-center.js',
  './chcn-family-center-logic.js',
  './chcn-period.js',
  './chcn-period-logic.js',
  './global-services.js',
  './chcn-open-external.js',
  './global-voice.js',
  './global-commands.js',
  './global-ui.js',
  './global-payment.js',
  './app.js',
  './courses-data.js',
  './chcn-3d-lab.js',
  './enhance.js',
  './course-integrity.js',
  './global-careers.js',
  './academic-music.js',
  './latest-update.js',
  './instrument-music.js',
  './music-academy.js',
  './dance-academy.js',
  './drama-academy.js',
  './visual-arts-academy.js',
  './arts-management-academy.js',
  './filter-categories.js',
  './final-patch.js',
  './reliability-patch.js',
  './quality-patch.js',
  './master-enhancements.js',
  './voice-accessibility.js','./tiktok-course.js','./instrument-courses.js','./music-studio.js',
  './tiktok-services.js','./quizzes-data.js','./creator-tools.js','./media-studio.js','./game-center.js','./game-center-plus.js','./game-center-expansion.js','./chcn-content-manager.js','./chcn-office-viewer.js','./chcn-office-viewer.css','./chcn-simple-ui.css',
  './chcn-assistant.js',
  './chcn-overlay-manager.js',
  './chcn-qa-audit.js',
  './chcn-download-fix.js',
  './chcn-account-data.js',
  './chcn-quiz-gate.js',
  './chcn-handbook.js',
  './chcn-audio-engine.js',
  './chcn-course-integrity.js',
  './chcn-command-center.js',
  './chcn-voice-registry.js',
  './voices/cartesia-ariana.wav',
  './voices/cartesia-fiona.wav',
  './voices/cartesia-elena-narrator.wav',
  './voices/cartesia-blake.wav',
  './voices/cartesia-brandon.wav',
  './voices/cartesia-camila.wav',
  './voices/cartesia-daniela.wav',
  './voices/cartesia-hao.wav',
  './voices/cartesia-hua.wav',
  './course-uniform.jpg',
  './instructor-dress-code.jpg',
  './training-academy-dress-code.jpg',
  './founder.png',
  './creator-hub-logo-original.jpg',
  './course-audit-report.json',
  './COURSE_AUDIT_REPORT.md',
  './CURRICULUM-SOURCES.md',
  './UPDATE-README.md',
  './career-hub.css',
  './icon.png',
  './icon-192.png',
  './logo.png',
  './manifest.json',
  './leaflet.js',
  './leaflet.css',
  './images/marker-icon.png',
  './images/marker-icon-2x.png',
  './images/marker-shadow.png',
  './images/layers.png',
  './images/layers-2x.png'
];

// Resilient install: cache assets individually so a single missing file
// never aborts the whole precache (cache.addAll is all-or-nothing).
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      Promise.all(ASSETS.map(url =>
        cache.add(url).catch(err => {
          console.warn('[SW] skip precache:', url, err && err.message);
          return null;
        })
      ))
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cached => {
      const fetchPromise = fetch(e.request).then(response => {
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
        return response;
      }).catch(() => cached);
      return cached || fetchPromise;
    })
  );
});