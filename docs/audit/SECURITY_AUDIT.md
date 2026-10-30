# CHCN — Security Audit

## Headline finding

**The shipped app has no security boundary.** It is a client-side PWA whose
"accounts", "roles" and "progress" live entirely in the browser's
`localStorage`. Anyone with the device can read or edit all of it. This is
acceptable for an offline demo but is **not** a platform that can protect
student records, grades, certificates or a Founder role.

## Specific issues

1. **Mislabelled password hashing (fixed comment).** `hashPassword()` in
   `app.js` was commented "Simple SHA-256 hash" but is actually a 32-bit
   non-cryptographic rolling digest. Trivially reversible/collidable. The
   misleading comment has been corrected to state the truth and point here.
   The function was **not** silently changed to async real crypto, because
   that alters the sign-in flow and could not be browser-verified in this
   environment. The real fix is server-side auth (below).
2. **No server-side authorization.** Role checks (founder/instructor/student)
   are UI-only. "Hiding a button is not security" — exactly the failure mode
   the brief warns about.
3. **Client-trusted outcomes.** Quiz pass/fail, progress and certificate
   issuance are computed and stored client-side, so they can be forged.
4. **Secrets.** None were found committed (good). No `.env`, no API keys in
   the archive. `global-payment.js` is UI-only; no live payment credentials.

## The real fix delivered here (designed, NOT deployed)

`database/migrations/0001_core_schema.sql` + `0002_rls_policies.sql` define a
Supabase/PostgreSQL backend that moves the security boundary to the server:

- `profiles.role` is an enum and is **never** client-writable; role changes go
  only through the `set_user_role()` `SECURITY DEFINER` function, which checks
  the caller is founder/admin and writes an `audit_events` row.
- **Row Level Security** on every table: students see only their own enrolment,
  progress, attempts and certificates; instructors see only courses they are
  assigned to teach (`teaches()`); staff helpers (`is_staff()`) gate admin.
- **Correct answers are not client-readable** — `quiz_questions.correct` is
  exposed only to staff; learners read the `quiz_questions_public` view.
- **Certificates/grades are server-issued** — no client INSERT policy;
  issued only by the grading/completion RPC after a verified passing final.
- **Audit log** (`audit_events`) has no client write policy → append-only via
  `SECURITY DEFINER` functions, making role/publish/grade changes tamper-evident.
- Attempt idempotency via `unique(user_id, quiz_id, attempt_no)`.

### Founder bootstrap (documented, not executed)
The founder account must be created out-of-band (Supabase dashboard create
user, then a one-time SQL `update profiles set role='founder' where email=...`
run with the service role). The founder role is **not** obtainable via public
signup, client metadata, or any open API. See `docs/deployment/DEPLOYMENT.md`.

## Status

| Item | Status |
|------|--------|
| Misleading hash comment corrected | DONE (code) |
| Server-side RBAC schema + RLS | DESIGNED — NOT DEPLOYED / NOT VERIFIED |
| Client auth replaced by server auth | NOT DONE (requires Supabase wiring + browser QA) |
| Secrets scan | PASS (none committed) |
