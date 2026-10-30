# Creator Hub Creator Network (CHCN) \u2014 TVET Education Platform

A client-side Progressive Web App (PWA) delivering technical & vocational
education (TVET): a 35-course catalogue, quiz-gated progression, certificates,
arts academies, life/creator tools, a game center, maps, and a 3D learning lab.

## Quick facts (data-verified)

- **35 courses**, **12 categories**, **1,506 units**, **1,064 quiz questions**
- Pass gate: **80%**, with an attempt registry
- Architecture: static PWA \u2014 `app/index.html` loads ~72 JS modules in a fixed
  order; offline via `app/service-worker.js`; persistence via `localStorage`
- No runtime build step. A backend is **designed** under `database/`
  (Supabase/PostgreSQL + RLS), **not deployed**.

## Repository layout

```
app/        Self-contained runtime PWA (the deployable web root)
courses/    course-registry.json (generated)
database/   migrations/ + seeds/ (designed Supabase backend \u2014 NOT deployed)
scripts/    build-registry.js, build-sql-seed.js, grading.js, run-tests.sh
tests/      unit/ + integration/ (grading + data integrity)
docs/       ARCHITECTURE, REPOSITORY_STRUCTURE, DEVELOPMENT, OPERATIONS,
            COMPLETENESS_AUDIT + audit/ + deployment/
package.json  npm scripts (test / build / serve; no runtime deps)
.env.example  credential placeholders (no real secrets)
```

Full annotated tree: `docs/REPOSITORY_STRUCTURE.md`.

## Run the tests

```bash
npm test        # or: bash scripts/run-tests.sh
```

Result in this build environment (Node v16.20.2):
**JS parse 76/76, unit 12/12, integration 3,438/3,438, registry build OK.**

## Preview locally

```bash
npm run serve   # serves ./app; open the printed localhost URL (HTTPS/localhost)
```

## Regenerate derived data

```bash
npm run build   # app/courses-data.js -> courses/course-registry.json -> database/seeds/courses.generated.sql
```

## Deploy

Serve the **`app/`** directory as the web document root over HTTPS. See
`docs/OPERATIONS.md`. No deployment is performed by this repo; deploy only with
Founder authorization.

## Honest status

See `docs/audit/KNOWN_ISSUES.md` and `docs/COMPLETENESS_AUDIT.md`. In short:
security authority is currently client-side and must move server-side for
production; passwords use a weak client hash; persistence is per-device
`localStorage` until the `database/` backend is wired. UI render, PWA install,
3D visuals, voice, map tiles, and all database/deploy steps were **not
verifiable in this environment** and are marked UNVERIFIED in the audits.

## Preservation

No original files were deleted. The entire runtime was relocated into `app/` as
a cohesive unit (all relative references preserved); see
`docs/audit/MOVEMENT_MANIFEST.md`.
