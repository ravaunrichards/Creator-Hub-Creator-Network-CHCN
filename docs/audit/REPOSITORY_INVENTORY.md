# CHCN — Repository Inventory

_Generated during the audit of `chcn-game-web-v57.zip`. Evidence-based; every
figure below was produced by inspecting the actual files._

## What this project actually is

A **client-side-only Progressive Web App (PWA)**. There is **no backend, no
server, no build system, and no real database** in the uploaded archive:

- 0 `package.json`, 0 `*.sql`, 0 `server*.js`, 0 `.env`, 0 bundler config.
- Everything runs in the browser from a single `index.html` that loads ~72
  plain `<script>` files in a fixed order, plus 10 CSS files.
- Persistence is the browser's `localStorage` (accounts, enrolment, progress,
  certificates, quiz attempts). See `app.js`, `chcn-account-data.js`.
- Offline support via `service-worker.js` (cache `chcn-v55-games`, bumped to
  `chcn-v57-academy` in this pass).

## File census (101 files, ~6.7 MB)

| Type | Count | Notes |
|------|-------|-------|
| `.js` | 72 (shipped) | app logic, course data, games, life-tools |
| `.css` | 10 | design system + feature styles |
| `.png` | 12 | icons, logos, map markers |
| `.jpg` | 4 | dress-code / uniform photos, logo |
| `.html` | 2 | `index.html`, `INSTALL-IPHONE.html` |
| `.json` | 1 | `manifest.json` (PWA) |

## Application entry + load order

`index.html` (513 lines) loads, in order: `leaflet.js`, native/global bridges,
then at the end `app.js` → `courses-data.js` → `quizzes-data.js` → the game
center family → the academy modules → a series of `*-patch.js` / `enhance.js`
overlays → the `chcn-*` life-tools → `chcn-command-center.js`. Order matters:
many files monkey-patch functions defined earlier (e.g. `chcn-quiz-gate.js`
wraps `startQuiz`/`submitQuiz` from `course-integrity.js`).

## Core data model (verified via Node)

- `window.NEW_COURSES` — **35 TVET courses** across **12 categories**,
  **1,506 competency units**, **65,929 total hours**.
- `window.NEW_QUIZBANK` — keyed by course id, **1,064 quiz questions** total;
  every course has a bank (0 missing).
- Separate academy modules (`music-academy.js`, `dance-academy.js`,
  `drama-academy.js`, `visual-arts-academy.js`, `arts-management-academy.js`,
  `academic-music.js`, `instrument-music.js`) register additional arts content.

## Registration pattern

`creator-tools.js` defines `window.CHCNreg` with `registerPages`,
`ensureContainers`, `hookNavigate`, `addNavLink`. Feature modules (game-center,
and now the new `chcn-3d-lab.js`) self-register pages and nav links through it.
This is the safe extension point and was reused rather than re-architected.

## Roles / "security" (as shipped)

- A single hard-coded founder contact (`app.js`, mailto to the founder).
- Accounts are stored in `localStorage` with a **non-cryptographic** salted
  digest mislabelled "SHA-256" (`hashPassword` in `app.js`). See SECURITY_AUDIT.
- There is **no server-side authorization**; role/permission logic is UI-only.
