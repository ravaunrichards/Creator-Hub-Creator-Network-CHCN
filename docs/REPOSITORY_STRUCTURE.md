# CHCN \u2014 Repository Structure

```
chcn-game-web/
\u251c\u2500 app/                      Self-contained client-side PWA (the deployable web root)
\u2502  \u251c\u2500 index.html             Single entry point; loads ~72 JS modules in fixed order
\u2502  \u251c\u2500 INSTALL-IPHONE.html    iOS install guide (standalone page)
\u2502  \u251c\u2500 manifest.json          PWA manifest (relative start_url / scope)
\u2502  \u251c\u2500 service-worker.js      Offline precache (resilient install) + cache-first fetch
\u2502  \u251c\u2500 app.js                 App core: boot, routing, accounts, map glue
\u2502  \u251c\u2500 courses-data.js        window.NEW_COURSES (35 courses, 1,506 units)
\u2502  \u251c\u2500 quizzes-data.js        window.NEW_QUIZBANK (1,064 questions)
\u2502  \u251c\u2500 course-integrity.js / chcn-quiz-gate.js   Quiz flow + 80% pass gate
\u2502  \u251c\u2500 creator-tools.js       window.CHCNreg extension point (page/nav registration)
\u2502  \u251c\u2500 *-academy.js           Arts academy curricula
\u2502  \u251c\u2500 game-center*.js        Game center + expansions
\u2502  \u251c\u2500 chcn-*.js              Life/creator tools + 3D lab (chcn-3d-lab.js)
\u2502  \u251c\u2500 global-*.js            Voice / commands / UI / payment (UI-only) services
\u2502  \u251c\u2500 leaflet.js / leaflet.css   Offline-capable map library
\u2502  \u251c\u2500 *.css                  Design system + feature styles (10 files)
\u2502  \u251c\u2500 *.png / *.jpg          Icons, logos, dress-code photos
\u2502  \u2514\u2500 images/                Leaflet map markers / layer icons
\u251c\u2500 courses/
\u2502  \u2514\u2500 course-registry.json   GENERATED master registry (scripts/build-registry.js)
\u251c\u2500 database/                 Designed Supabase/PostgreSQL backend (NOT deployed)
\u2502  \u251c\u2500 migrations/
\u2502  \u2502  \u251c\u2500 0001_core_schema.sql
\u2502  \u2502  \u2514\u2500 0002_rls_policies.sql
\u2502  \u2514\u2500 seeds/
\u2502     \u251c\u2500 0001_catalogue_seed.sql
\u2502     \u2514\u2500 courses.generated.sql   GENERATED (scripts/build-sql-seed.js)
\u251c\u2500 scripts/
\u2502  \u251c\u2500 build-registry.js      courses-data.js  -> courses/course-registry.json
\u2502  \u251c\u2500 build-sql-seed.js      course-registry.json -> database/seeds/courses.generated.sql
\u2502  \u251c\u2500 grading.js             Canonical 80% pass/gating spec (shared with tests)
\u2502  \u2514\u2500 run-tests.sh           Full check runner (syntax + unit + integration + build)
\u251c\u2500 tests/
\u2502  \u251c\u2500 unit/grading.test.js            12 assertions on grading/gating
\u2502  \u2514\u2500 integration/data-integrity.test.js  3,438 assertions on the real catalogue/quiz bank
\u251c\u2500 docs/
\u2502  \u251c\u2500 ARCHITECTURE.md
\u2502  \u251c\u2500 REPOSITORY_STRUCTURE.md   (this file)
\u2502  \u251c\u2500 DEVELOPMENT.md
\u2502  \u251c\u2500 OPERATIONS.md
\u2502  \u251c\u2500 COMPLETENESS_AUDIT.md
\u2502  \u251c\u2500 audit/                 Full prior audit set (inventory, features, security, db, etc.)
\u2502  \u2514\u2500 deployment/DEPLOYMENT.md
\u251c\u2500 README.md
\u251c\u2500 package.json              npm scripts for test/build/serve (no runtime deps)
\u251c\u2500 .gitignore
\u2514\u2500 .env.example              Credential placeholders (no real secrets)
```

## Key entry points & config

| Path | Role |
|------|------|
| `app/index.html` | Runtime entry point; also the thing a static host must serve |
| `app/service-worker.js` | Offline cache; `CACHE_NAME` bumped per shell change (now `chcn-v58-academy`) |
| `app/manifest.json` | PWA install metadata |
| `package.json` | `npm test`, `npm run build`, `npm run serve` |
| `scripts/run-tests.sh` | One-command verification |
| `.env.example` | Backend credential template (copy to `.env`, never commit real values) |

## Deploy note

Serve **`app/`** as the web document root. All runtime references are relative,
so the folder is self-contained and portable. The Node tooling, tests, designed
backend and docs stay outside the deployable root.
