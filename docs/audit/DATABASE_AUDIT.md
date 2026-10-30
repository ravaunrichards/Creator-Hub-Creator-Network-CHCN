# CHCN — Database Audit

## Current state

**There is no database.** All persistence is browser `localStorage`:

| localStorage key | Holds | Written by |
|------------------|-------|-----------|
| `chcn_accounts` | account registry (name,email,hash) | `app.js` |
| `chcn_session_email` | active session | `chcn-account-data.js` |
| `chcn_enrolled` | enrolled course ids | `app.js` |
| `chcn_progress` | per-item completion state | `app.js`, `chcn-quiz-gate.js` |
| `chcn_certs` | issued certificates | `app.js` |
| `chcn_quiz_attempts` | attempt records | `chcn-quiz-gate.js` |
| `chcn_wishlist`, `chcn_avatar`, `chcn_cover`, `chcn_id_docs` | profile/media | `chcn-account-data.js` |

This is per-device, forgeable, and lost on cache clear — adequate for an
offline demo, inadequate for a real LMS with grades and certificates.

## Delivered design (NOT deployed / NOT verified)

A normalised PostgreSQL schema for Supabase lives in `database/`:

- `migrations/0001_core_schema.sql` — roles enum, `profiles`, `courses`,
  `course_categories`, `course_instructors`, `units`, `lessons`, `enrolments`,
  `progress`, `quizzes`, `quiz_questions`, `quiz_attempts`, `certificates`,
  `content_reviews`, `audit_events`, with PKs, FKs, unique constraints,
  checks, and indexes.
- `migrations/0002_rls_policies.sql` — Row Level Security + `SECURITY DEFINER`
  helpers and the audited `set_user_role()` role-change function.
- `seeds/0001_catalogue_seed.sql` + generated `courses.generated.sql`
  (from `scripts/build-sql-seed.js`) — **catalogue only**, no fake students,
  grades, certificates or payments.

### Migration safety
All statements are `create table if not exists` / `drop policy if exists`
before `create`, so the chain is additive and re-runnable. No `drop table`,
no data reset. It has **not** been applied to any database in this build
environment (no DB credentials / no network to a Postgres instance).

### Mapping localStorage → tables (upgrade path)
`chcn_enrolled`→`enrolments`, `chcn_progress`→`progress`,
`chcn_quiz_attempts`→`quiz_attempts`, `chcn_certs`→`certificates`,
accounts→`profiles` (passwords handled by Supabase Auth, not migrated).
