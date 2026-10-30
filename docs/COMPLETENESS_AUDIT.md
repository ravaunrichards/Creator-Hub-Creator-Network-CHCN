# CHCN \u2014 Completeness & Verification Audit (v58 reorganization pass)

This pass took the uploaded `chcn-game-web-v58.zip`, identified the project,
executed a real structural reorganization, and verified the result with runnable
commands. Every status below is backed by a command that was actually run.

## 1. Project identified

- **Creator Hub Creator Network (CHCN)** \u2014 a client-side TVET education PWA.
- Stack: vanilla JS (no bundler), service-worker offline cache, `localStorage`
  persistence, Leaflet maps, Three.js 3D lab; Node-only build/test tooling; a
  **designed (not deployed)** Supabase/PostgreSQL backend under `database/`.
- Data: 35 courses, 12 categories, 1,506 units, 1,064 quiz questions, 80% gate.

## 2. Inventory inspected

- 142 archive entries extracted and inspected (not just by filename).
- Runtime references in `index.html`, `service-worker.js`, `manifest.json`
  confirmed to be **all relative** (no absolute `/\u2026` paths; SW registered with
  relative `service-worker.js`).
- `fetch()`/XHR usage in runtime JS reviewed: only external map-tile and
  user-supplied URLs; **no runtime JS fetches sibling repo files by path**, so
  moving the runtime as a unit is safe.

## 3. Baseline captured BEFORE any change

| Check | Baseline result |
|-------|-----------------|
| JS parse (all shipped `.js`) | 76 OK / 0 fail |
| Unit (grading/gating) | 12 / 12 pass |
| Integration (catalogue + quiz bank) | 3,438 / 3,438 pass |
| Node | v16.20.2 |

## 4. Reorganization executed (real file moves)

The prior (v57) pass kept all runtime files flat in the repo root, arguing that
moving individual files breaks the fixed `<script>` order and the SW cache. That
is true only when files are **scattered**. This pass instead moved the **entire
runtime as one cohesive unit** into `app/`, which preserves every sibling
relative reference while giving the repository a clean, conventional layout.

- Moved: `index.html`, `INSTALL-IPHONE.html`, `manifest.json`,
  `service-worker.js`, all 72 runtime `.js`, 10 `.css`, all `.png`/`.jpg`,
  `leaflet.*`, and `images/` \u2192 `app/`.
- Kept at repo root (already correctly structured by the prior pass):
  `courses/`, `database/`, `scripts/`, `tests/`, `docs/`, `README.md`,
  `.env.example`.
- Updated external consumers to the new location:
  - `scripts/build-registry.js` \u2192 reads `app/courses-data.js`
  - `tests/integration/data-integrity.test.js` \u2192 reads `app/courses-data.js`
  - `scripts/run-tests.sh` \u2192 parses `app/*.js scripts/*.js`
- Bumped `service-worker.js` `CACHE_NAME` `chcn-v57-academy` \u2192 `chcn-v58-academy`.
- Added `package.json` (test/build/serve scripts, no runtime deps) and
  `.gitignore`.
- Removed empty placeholder dirs (`docs/architecture`, `docs/database`,
  `docs/security`, `database/documentation`) rather than leaving empty scaffold;
  authored real docs instead.
- **No file deleted; no runtime content modified** beyond the SW cache-name bump.

## 5. Verification AFTER reorganization (re-run)

| Check | Command | Result |
|-------|---------|--------|
| JS parse | `bash scripts/run-tests.sh` (step 1) | **76 OK / 0 fail** \u2014 PASS |
| Unit tests | step 2 | **12 / 12** \u2014 PASS |
| Integration tests | step 3 | **3,438 / 3,438** \u2014 PASS |
| Registry build reproducible | step 4 / `npm run build:registry` | **35 courses written** \u2014 PASS |
| SQL seed build | `npm run build:sql-seed` | **35 upserts written** \u2014 PASS |
| `index.html` local refs resolve in `app/` | scripted existence check | **0 missing** \u2014 PASS |
| Service-worker local assets resolve | scripted existence check | 95 present / 13 missing \u2014 see note below |

Baseline vs. post-move: **identical pass counts** \u2014 the reorganization introduced
zero regressions.

## 6. Known gaps / honest status

- **13 service-worker asset entries do not exist** (9 `voices/*.wav`,
  `course-audit-report.json`, `COURSE_AUDIT_REPORT.md`, `CURRICULUM-SOURCES.md`,
  `UPDATE-README.md`). These were **already absent in the upload**, not caused
  by this pass. The SW's resilient install skips missing files, so they do not
  break precaching. Logged in `docs/audit/KNOWN_ISSUES.md`.
- **Security authority is still client-side** (localStorage roles/grades; weak
  `hashPassword`). The fix is the designed `database/` backend. Not changed in a
  reorganization pass; documented in `docs/audit/SECURITY_AUDIT.md`.
- **Not verifiable in this environment** (no browser / DB / network / deploy):
  UI render, PWA install, 3D visuals, voice APIs, map tiles, and all
  database/migration/deploy steps. Marked UNVERIFIED throughout; no success is
  claimed for them.

## 7. Secrets scan

- No committed secrets found. `.env.example` holds placeholders only; no real
  keys in any JS, SQL, or doc. (PASS)

## 8. Remaining work (not blockers for this pass)

- Wire and deploy the `database/` backend to move authority server-side.
- Replace the client `hashPassword` with real server-side auth.
- Either ship the 13 missing SW-listed assets or trim them from the asset list.
