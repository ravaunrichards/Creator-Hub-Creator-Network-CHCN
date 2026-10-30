# CHCN \u2014 Movement / Change Manifest (v58 pass)

Every structural change made in this pass. A full copy of the original upload is
preserved outside the repository (the extracted archive). No file was deleted.

## Files RELOCATED (moved as a cohesive unit)

The entire client-side runtime moved from the **repo root** into **`app/`**,
preserving all relative references:

| From (root) | To |
|-------------|----|
| `index.html`, `INSTALL-IPHONE.html` | `app/` |
| `manifest.json`, `service-worker.js` | `app/` |
| all 72 runtime `*.js` (app.js, courses-data.js, quizzes-data.js, chcn-*.js, game-center*.js, *-academy.js, global-*.js, leaflet.js, patches\u2026) | `app/` |
| all 10 `*.css` | `app/` |
| all `*.png` / `*.jpg` (icons, logos, dress-code photos, map markers) | `app/` |
| `images/` (Leaflet markers + layer icons) | `app/images/` |

Repo-level directories kept in place (already correctly structured):
`courses/`, `database/`, `scripts/`, `tests/`, `docs/`, plus root `README.md`
and `.env.example`.

## Files RENAMED

**None.**

## Files DELETED

**None.** Only **empty** placeholder directories were removed (no content lost):
`docs/architecture/`, `docs/database/`, `docs/security/`,
`database/documentation/` \u2014 replaced by real authored documentation.

## Files MODIFIED (in place)

| File | Change | Reason |
|------|--------|--------|
| `app/service-worker.js` | `CACHE_NAME` `chcn-v57-academy` \u2192 `chcn-v58-academy` | Force returning users to drop the stale cached shell after the reorganization |
| `scripts/build-registry.js` | reads `app/courses-data.js` (was `courses-data.js`) | Runtime moved into `app/` |
| `scripts/run-tests.sh` | parses `app/*.js scripts/*.js` (was `*.js`) | Runtime moved into `app/` |
| `tests/integration/data-integrity.test.js` | reads `app/courses-data.js` | Runtime moved into `app/` |

## Files ADDED

| Path | What |
|------|------|
| `package.json` | npm scripts: `test`, `build`, `serve` (no runtime deps) |
| `.gitignore` | Ignores node_modules, `.env`, logs, OS cruft (keeps `.env.example`, source) |
| `docs/ARCHITECTURE.md` | Architecture overview |
| `docs/REPOSITORY_STRUCTURE.md` | Annotated directory tree |
| `docs/DEVELOPMENT.md` | Dev setup, conventions, module-add checklist |
| `docs/OPERATIONS.md` | Deploy/backend/monitoring runbook |
| `docs/COMPLETENESS_AUDIT.md` | This pass's verification report (with evidence) |

## Integrity note

No original content was lost. All runtime moves kept files as siblings, so every
relative reference still resolves (verified: `index.html` 0 missing local refs;
test suite pass counts identical before/after).
