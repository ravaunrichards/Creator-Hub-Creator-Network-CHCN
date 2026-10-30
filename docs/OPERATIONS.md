# CHCN \u2014 Operations

## Deploying the PWA (static hosting)

The app is a static site. Serve the **`app/`** directory as the web document
root on any static host (Render static site, Netlify, GitHub Pages, S3+CloudFront,
nginx, etc.).

Requirements:

- **HTTPS is mandatory** \u2014 the service worker and PWA install only work over
  HTTPS (or `localhost`). There is no server component to enforce this itself.
- Publish the **contents of `app/`** at the site root so that `index.html`,
  `service-worker.js` (scope), and `manifest.json` sit together.
- After each deploy that changes shell files, confirm `CACHE_NAME` in
  `service-worker.js` was bumped so returning users drop the stale cache.

Example (nginx): point `root` at the deployed `app/` folder; no rewrites needed.

> No deployment is performed by this repository. Deploy only with the required
> authorization.

## Build artefacts before deploy (optional)

The runtime does not require a build, but keep derived data consistent:

```bash
npm run build   # regenerate course-registry.json + courses.generated.sql
npm test        # must be green before shipping
```

## Backend (designed, NOT deployed)

The `database/` backend is the intended server-side authority. It is **not**
applied to any database in this environment. To stand it up (Supabase/PostgreSQL):

1. Provision a Supabase project; copy credentials into `.env` from `.env.example`
   (never commit the real `.env`; the service-role key is server-side only).
2. Apply migrations **in order**:
   - `database/migrations/0001_core_schema.sql`
   - `database/migrations/0002_rls_policies.sql`
3. Seed the catalogue:
   - `database/seeds/0001_catalogue_seed.sql`
   - `database/seeds/courses.generated.sql` (regenerate with `npm run build:sql-seed`)
4. After schema changes on PostgREST/Supabase: `notify pgrst, 'reload schema';`
5. **Founder bootstrap** is out-of-band and must not be reachable by public
   signup. See `docs/deployment/DEPLOYMENT.md`.

Migrations/RLS/seeds were **NOT applied or verified** here (no database, no
network, no credentials). Status: ready, NOT executed.

## Monitoring / troubleshooting

| Symptom | Likely cause | Action |
|---------|--------------|--------|
| Users see an old UI after deploy | Stale service-worker cache | Bump `CACHE_NAME`; verify `activate` purge |
| A module's feature missing | Script not in `index.html` load order or SW list | Add script tag + SW asset; re-run `npm test` |
| Map tiles blank offline | External tile fetch blocked offline | Expected \u2014 tiles are remote; markers are local |
| PWA will not install | Not served over HTTPS | Serve over HTTPS/localhost |
| Precache warnings in console | SW lists some assets that never shipped (see KNOWN_ISSUES) | Harmless \u2014 resilient install skips missing files |

## Recovery

- The runtime is stateless on the server side; redeploy `app/` to recover.
- User data lives in each browser's `localStorage` and is **not** centrally
  backed up until the `database/` backend is deployed (documented limitation).
