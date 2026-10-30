# CHCN \u2014 Reorganization Plan (v58, executed)

## Constraint

The app is a **client-side PWA** whose `index.html` loads ~72 JavaScript files
by **relative path** in a fixed order, and whose `service-worker.js` caches an
explicit list. Scattering these files into `frontend/`, `backend/`, `packages/`
etc. would break both the script order and the offline cache.

## Decision: move the runtime as ONE unit, not file-by-file

Because every runtime reference (`<script>`, `<link>`, `manifest`, SW register,
image `src`) is **relative and sibling-based**, moving the whole runtime
together into a single folder preserves all of them. So the runtime moved
wholesale into `app/`, the deployable web root:

```
chcn-game-web/
  app/        <- ENTIRE runtime (index.html, *.js, *.css, images/, manifest, SW)
  courses/    course-registry.json (generated)
  database/   migrations/ + seeds/ (designed backend, NOT deployed)
  scripts/    build + test tooling (Node)
  tests/      unit/ + integration/
  docs/       architecture, structure, dev, ops, completeness + audit set
  README.md, package.json, .gitignore, .env.example
```

This differs from the v57 pass, which left the runtime flat in the repo root.
Moving as a unit achieves a clean, conventional layout **and** keeps the app
functionally identical (verified: same test pass counts before and after).

## External references updated

- `scripts/build-registry.js` and `tests/integration/data-integrity.test.js`
  now read `app/courses-data.js`.
- `scripts/run-tests.sh` now parses `app/*.js scripts/*.js`.
- `service-worker.js` `CACHE_NAME` bumped to `chcn-v58-academy`.

## What was NOT done (and why)

- **No runtime file renamed, no content rewritten** (only the SW cache-name
  bump). Monkey-patch modules were left intact \u2014 collapsing them risks silent
  behaviour loss (flagged in KNOWN_ISSUES instead).
- **No files deleted.** Only empty placeholder directories were removed, and
  real documentation authored in their place.
- **No bundler introduced.** Adopting Vite/esbuild is a separate migration,
  out of scope for a preserve-everything reorganization.

## Deploy implication

Serve `app/` as the web document root. The folder is self-contained and portable.
