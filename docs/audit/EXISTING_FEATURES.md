# CHCN — Existing Features (preserved)

Status key: WORKS (logic present + parses + consistent), PARTIAL, UI-ONLY.
None of these were removed or rewritten in this pass.

| Feature | File(s) | Status | Notes |
|---------|---------|--------|-------|
| 35-course TVET catalogue | `courses-data.js` | WORKS | validated (3,438 assertions) |
| Quiz bank (1,064 Qs) | `quizzes-data.js`, `courses-data.js` | WORKS | answer indices valid |
| Quiz engine | `course-integrity.js`, `chcn-course-integrity.js` | WORKS | renders + grades |
| 80% pass gate + attempt registry | `chcn-quiz-gate.js` | WORKS | spec covered by unit tests |
| Accounts / sign-in / sign-up | `app.js` | PARTIAL | localStorage only; weak hash (see security) |
| Per-account data isolation | `chcn-account-data.js` | WORKS | scopes keys per email |
| Enrolment / progress / certificates | `app.js` | WORKS | client-side persistence |
| Game center (Minesweeper, 2048, Snake, maths, etc.) | `game-center*.js`, `chcn-game-upgrade.js` | WORKS | self-registers page |
| Arts academies (music/dance/drama/visual/mgmt) | `*-academy.js`, `academic-music.js` | WORKS | extra content modules |
| Creator tools (captions/bio/hashtags) | `creator-tools.js` | WORKS | defines `CHCNreg` |
| Life-tools (calc, period, family, bloodtype, genetics) | `chcn-*` | WORKS | self-contained utilities |
| Document / office viewer | `chcn-docstudio.js`, `chcn-office-viewer.js` | PARTIAL | client preview |
| Voice / accessibility | `voice-accessibility.js`, `global-voice.js` | PARTIAL | browser speech APIs |
| Maps | `leaflet.js`, `leaflet.css`, `images/` | WORKS | vendored Leaflet |
| PWA install / offline | `manifest.json`, `service-worker.js` | WORKS | cache bumped to v57 |
| "Message the Founder" | `app.js` | UI-ONLY | opens device mail (mailto) |
| Payments | `global-payment.js` | UI-ONLY | no live gateway wired |

## Added in this pass (additive, non-breaking)

| New | File | Status |
|-----|------|--------|
| 3D Learning Lab (fire-safety P.A.S.S.) | `chcn-3d-lab.js` | CODE COMPLETE — not render-verified (no browser here) |
| Canonical grading/gating spec | `scripts/grading.js` | WORKS (unit-tested) |
| Master course registry | `courses/course-registry.json` | WORKS (generated) |
| Backend schema + RLS | `database/migrations/*.sql` | DESIGNED — not deployed |
| Test suite + runner | `tests/`, `scripts/run-tests.sh` | RUNS — all pass |
