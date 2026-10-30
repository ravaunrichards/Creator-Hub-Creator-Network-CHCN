# CHCN — Known Issues & Honest Limitations

Severity: HIGH (fix before real users), MED, LOW.

## Security
- **HIGH — Password hashing is weak.** `app.js` `hashPassword()` is a djb2-style
  hash (it was *mislabelled* "SHA-256"; comment corrected this pass). It is not
  a password hash. On a real backend, delegate to Supabase Auth / bcrypt/argon2.
  Client-side hashing is not a security control at all.
- **HIGH — All authority is client-side.** Roles, pass/fail, certificate
  issuance and "isFounder" checks live in the browser and are trivially
  forgeable via devtools/localStorage. Hiding admin buttons is **not** security.
  Server-authoritative checks require the proposed backend.
- **MED — No transport security assumptions.** Being a static PWA, it must be
  served over HTTPS; there is no server to enforce this itself.

## Data
- **HIGH — Persistence is per-device localStorage.** Grades/certs are not
  durable, not shareable across devices, and user-editable. Real LMS needs the
  DB in `database/`.
- **LOW — No data export/backup for users.**

## Content / scope
- **MED — Brief vs reality mismatch (NOT fabricated).** The command referenced
  7 security-officer courses; only *Industrial Security Operations L3* exists in
  the data. The other 6 were **not** invented. Catalogue = 35 real courses /
  12 categories / 1,506 units / 1,064 quiz questions.
- **LOW — Course hour totals (65,929 hrs) are data-declared, not accredited.**
  No external accreditation claims are made.

## Architecture
- **MED — Monkey-patch load order is fragile.** ~72 JS files load sequentially;
  several patch earlier modules. Reordering or bundling naively will break
  behaviour. No automated guard exists for load order (only JS parse check).
- **LOW — Payment + some voice/doc features are UI-only / browser-dependent.**

## Service worker asset list
- **LOW — 13 precache entries reference files that were never shipped**
  (9 `voices/*.wav`, `course-audit-report.json`, `COURSE_AUDIT_REPORT.md`,
  `CURRICULUM-SOURCES.md`, `UPDATE-README.md`). These were already absent in the
  upload (not caused by the v58 reorganization). The resilient install `.catch()`es
  each add, so a missing file never aborts precaching; the only visible effect is
  a console warning. Fix later by shipping the assets or trimming the list.

## Verification gaps (sandbox limits — cannot be tested here)
- **No browser** → UI render, PWA install, 3D lab visuals, voice APIs, map tiles
  are **NOT render-verified**.
- **No database / network to Postgres** → migrations/RLS/seeds **NOT applied**.
- **No deploy target / credentials** → nothing deployed.
- These are marked UNVERIFIED throughout; no success is claimed for them.
