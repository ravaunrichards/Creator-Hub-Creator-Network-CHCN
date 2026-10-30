# CHCN \u2014 Development Guide

## Prerequisites

- **Node.js \u2265 16** (verified on v16.20.2) \u2014 for the build scripts and tests.
- A static file server for previewing the PWA (any; `npx serve` is convenient).
- A modern browser for manual QA (service worker + install require HTTPS or
  `localhost`).

No runtime npm dependencies are required; the app ships as plain files and the
tooling uses only the Node standard library.

## Preview the app locally

```bash
npm run serve        # serves ./app on a local port; open the printed URL
# or
npx --yes serve app
```

Open the printed `http://localhost:\u2026` URL. Service worker + PWA install only
work over `localhost`/HTTPS.

## Run the checks

```bash
npm test                 # full suite: JS parse + unit + integration + registry build
npm run test:unit        # grading/gating unit tests
npm run test:integration # catalogue + quiz-bank data integrity
```

Expected (Node v16.20.2): **76 JS files parse OK, unit 12/12, integration
3,438/3,438, registry build reproducible.**

## Regenerate derived artefacts

```bash
npm run build            # registry + SQL seed
npm run build:registry   # app/courses-data.js -> courses/course-registry.json
npm run build:sql-seed   # course-registry.json -> database/seeds/courses.generated.sql
```

The registry and the generated SQL seed are **derived** from
`app/courses-data.js`. Treat `courses-data.js` / `quizzes-data.js` as the source
of truth and re-run the build after editing them.

## Coding conventions (as observed in the codebase)

- **Vanilla JS, no modules/bundler.** Each file is an IIFE or attaches to
  `window`. New runtime features must be added as a `<script>` in `index.html`
  **and** to the `service-worker.js` asset list.
- **Respect load order.** Modules patch earlier ones; place a new script after
  everything it depends on. There is no bundler to resolve order for you.
- **Register pages via `window.CHCNreg`** (`creator-tools.js`) rather than
  hand-wiring navigation; this is the stable extension point.
- **Keep authority honest.** Do not present client-side localStorage checks as
  security (see `docs/audit/SECURITY_AUDIT.md`). The real boundary is the
  designed `database/` backend.
- **Relative paths only** inside `app/` so the folder stays portable.

## Adding a runtime module (checklist)

1. Add the `.js` file under `app/`.
2. Add `<script src="your-file.js"></script>` to `app/index.html` in the correct
   position in the load order.
3. Add `'./your-file.js'` to the `ASSETS` list in `app/service-worker.js`.
4. Bump `CACHE_NAME` in `app/service-worker.js` (e.g. `chcn-v58-\u2026` \u2192 `v59`).
5. Run `npm test` (at minimum the JS parse check must stay green).

## Debugging

- Service worker caching stale assets: bump `CACHE_NAME`; the `activate` handler
  deletes old caches.
- Data issues: run `npm run test:integration` \u2014 it validates every course and
  every quiz question against the real catalogue.
