# CHCN \u2014 Architecture

## What this project is

Creator Hub Creator Network (CHCN) is a **client-side Progressive Web App (PWA)**
for technical & vocational education and training (TVET). It runs entirely in
the browser: no server process ships with the app. Persistence is the browser's
`localStorage`; offline support is a service worker.

A relational backend is **designed but not deployed** under `database/`
(Supabase/PostgreSQL schema + Row Level Security). It is the intended path to
move authority off the client, and is not wired into the running app.

## Runtime shape (`app/`)

```
index.html  ->  loads ~72 plain <script> files in a FIXED ORDER  ->  app boots
```

- There is **no bundler and no build step for the runtime**. `index.html` is the
  single entry point. It pulls in `leaflet.js`, the native/global bridges, then
  the application core and feature modules by relative `<script src="...">`.
- **Load order is significant.** Many modules monkey-patch functions defined by
  earlier modules (for example `chcn-quiz-gate.js` wraps `startQuiz`/`submitQuiz`
  from `course-integrity.js`; the `*-patch.js` / `enhance.js` overlays adjust
  earlier behaviour). Reordering or naive bundling will change behaviour.
- `service-worker.js` precaches an explicit asset list (resilient install: a
  missing file is skipped, never aborts the precache) and serves cache-first
  with background refresh.
- `manifest.json` makes it installable (`start_url` / `scope` are relative).

## Major module groups

| Group | Representative files | Responsibility |
|-------|----------------------|----------------|
| App core | `app.js` | Boot, routing/navigation, accounts (localStorage), map, UI glue |
| Course data | `courses-data.js`, `quizzes-data.js` | `window.NEW_COURSES` (35 courses) + `window.NEW_QUIZBANK` (1,064 questions) |
| Course engine | `course-integrity.js`, `chcn-course-integrity.js`, `chcn-quiz-gate.js` | Lessons, quiz flow, 80% pass gate, attempt registry |
| Registration | `creator-tools.js` (`window.CHCNreg`) | Safe extension point: `registerPages`, `ensureContainers`, `hookNavigate`, `addNavLink` |
| Academies | `music-academy.js`, `dance-academy.js`, `drama-academy.js`, `visual-arts-academy.js`, `arts-management-academy.js`, `academic-music.js`, `instrument-music.js` | Arts curricula registered via `CHCNreg` |
| Games | `game-center.js`, `game-center-plus.js`, `game-center-expansion.js`, `chcn-game-upgrade.js` | Game center features |
| 3D lab | `chcn-3d-lab.js` | Three.js fire-safety P.A.S.S. simulation with accessible fallback |
| Life/creator tools | `chcn-*` family (calc, cycle, period, family-center, genetics, bloodtype, handbook, docstudio, office-viewer, resume-photo, idprofile\u2026) | Standalone utilities self-registering pages |
| Platform services | `global-services.js`, `global-voice.js`, `global-commands.js`, `global-ui.js`, `global-payment.js`, `voice-accessibility.js` | Voice, commands, UI, payment (UI-only) |
| Maps | `leaflet.js`, `leaflet.css`, `images/marker-*` | Offline-capable Leaflet map |

## Data model (verified via Node)

- `window.NEW_COURSES` \u2014 35 TVET courses, 12 categories, 1,506 units.
- `window.NEW_QUIZBANK` \u2014 keyed by course id, 1,064 questions; every course
  has a bank (0 missing). Each course has a final-assessment lesson.
- Pass gate: 80% (canonicalised in `scripts/grading.js`, enforced in the browser
  by the course engine).

## Build / tooling (`scripts/`, Node only)

These never touch the runtime at load time; they generate derived artefacts:

- `build-registry.js` reads `app/courses-data.js` \u2192 writes
  `courses/course-registry.json` (deterministic master registry).
- `build-sql-seed.js` reads `courses/course-registry.json` \u2192 writes
  `database/seeds/courses.generated.sql` so the SQL catalogue stays consistent
  with the shipped app.
- `grading.js` is the executable specification of the pass/gating rule shared
  with the unit tests.

## Designed backend (`database/`, NOT deployed)

- `migrations/0001_core_schema.sql` \u2014 core PostgreSQL schema.
- `migrations/0002_rls_policies.sql` \u2014 Row Level Security: students see only
  their own records; instructors see only assigned courses; correct answers are
  staff-only; certificates/grades are server-issued; role changes go through a
  `SECURITY DEFINER` function with an append-only audit log.
- `seeds/` \u2014 catalogue seed (header + generated upserts).

This is the intended security boundary. See `docs/audit/SECURITY_AUDIT.md`.

## Boundaries / flows

```
Browser (app/)
  \u251c\u2500 UI + routing (app.js)
  \u251c\u2500 course/quiz engine (course-integrity.js, chcn-quiz-gate.js)
  \u251c\u2500 localStorage  <-- current persistence + current (forgeable) authority
  \u2514\u2500 service-worker.js (offline cache)

Node tooling (scripts/)  reads app/courses-data.js -> courses/course-registry.json -> database/seeds/*.sql

Designed backend (database/, not deployed)
  \u2514\u2500 Supabase/PostgreSQL + RLS  <-- intended server-side authority
```
