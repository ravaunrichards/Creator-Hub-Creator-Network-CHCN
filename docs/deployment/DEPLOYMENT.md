# CHCN — Deployment & Founder Bootstrap Runbook

> Status of this document: **instructions only.** Nothing below was executed in
> the build environment (no browser, no database, no deploy credentials, no
> network to a Postgres/Supabase instance). Every step is marked with who must
> run it and where.

## 1. What the app is
A static client-side PWA. It can be served as-is from any static host; the
backend (section 3) is **optional but required for real, tamper-proof grades,
roles and certificates**.

## 2. Deploy the static PWA (no backend)
Run on YOUR machine / host (not done here):
```bash
# Any static server works. Examples:
npx serve .            # local preview
# or copy the folder to Netlify / Vercel / GitHub Pages / S3+CloudFront
```
Requirements:
- Serve over **HTTPS** (PWA + service worker require it off localhost).
- Keep all runtime files at the site root so relative `<script>` paths and the
  `service-worker.js` cache manifest resolve.
- After deploying an update, the cache name bump (v57) forces clients to fetch
  the new shell on next load.

Verification YOU must do in a real browser (cannot be done here):
- App loads, sign-up/sign-in works, a course enrols, a quiz grades at the 80%
  gate, a certificate issues, the 3D lab renders, PWA installs & works offline.

## 3. Optional real backend (Supabase) — recommended for production
> DESIGNED, NOT DEPLOYED. No credentials exist in this archive.

1. Create a Supabase project (YOU). Copy its URL + anon key + service role key.
2. Fill `.env` from `.env.example` (service role key stays **server-side only**,
   never in client JS).
3. Apply migrations **in order** with your migration tool / `psql`:
   ```bash
   psql "$SUPABASE_DB_URL" -f database/migrations/0001_core_schema.sql
   psql "$SUPABASE_DB_URL" -f database/migrations/0002_rls_policies.sql
   psql "$SUPABASE_DB_URL" -f database/seeds/courses.generated.sql
   ```
   The chain is idempotent/re-runnable (if-exists guards). It never drops data.
4. After schema changes on Supabase, reload PostgREST cache:
   ```sql
   notify pgrst, 'reload schema';
   ```
5. Move authority server-side: roles, pass/fail, certificate issuance and
   payment status must be decided by the server / RLS, never trusted from the
   client. Client-side `isFounder` / hidden buttons are **not** security.

## 4. Founder bootstrap (first privileged account)
> Must be a **server-side, one-time** action — never a client flag.

1. Sign up normally through the app with the Founder email.
2. Promote that account **once**, server-side, with the audited role function:
   ```sql
   -- run as the service role, server-side only
   select set_user_role('<founder-auth-uid>', 'founder');
   ```
   `set_user_role()` (in `0002_rls_policies.sql`) is `SECURITY DEFINER` and
   writes an `audit_events` row, so every role change is logged.
3. Do **not** hardcode the Founder email in client JS as an authority check.

## 5. Password security
Do **not** rely on the client `hashPassword()` (weak djb2, not SHA-256). With
Supabase, authentication and password hashing are handled by Supabase Auth
(bcrypt/scrypt server-side). Remove client-side password handling when the
backend is wired.

## 6. Authorization gate before any production use
Per the Founder's standing rule: **no production deploy without explicit
authorization.** This runbook does not deploy anything; it only documents how.
