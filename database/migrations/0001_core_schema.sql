-- ============================================================================
-- CHCN Education & Training Academy — core schema (Supabase / PostgreSQL)
-- Migration 0001 : roles, users, courses, enrolment, assessment, audit.
-- STATUS: DESIGNED, NOT DEPLOYED. No live database was reachable in the build
-- environment, so this has NOT been applied or verified against a server.
-- It is additive and safe to run on a fresh project. Review before applying.
-- ============================================================================

-- Supabase provides auth.users. We keep an application profile table that
-- references it, and NEVER trust a client-submitted role.

create extension if not exists pgcrypto;

-- ---- Roles -----------------------------------------------------------------
create type chcn_role as enum ('founder','admin','course_manager','instructor','teaching_assistant','student','guest');

create table if not exists profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  email           text unique not null,
  full_name       text,
  role            chcn_role not null default 'student',
  status          text not null default 'active' check (status in ('active','suspended','blocked')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- A single founder is bootstrapped out-of-band (see docs). The role column is
-- only ever writable by the service role / SECURITY DEFINER functions, never
-- by the end user (enforced by RLS in migration 0002).

-- ---- Course catalogue ------------------------------------------------------
create table if not exists course_categories (
  id    text primary key,
  name  text not null
);

create table if not exists courses (
  id                 text primary key,              -- matches course-registry courseId
  title              text not null,
  category_id        text references course_categories(id),
  level              int,
  level_label        text,
  description        text,
  prerequisites      text,
  awarding_body      text,                           -- NULL until SME-verified
  accreditation      text not null default 'UNVERIFIED',
  certificate_label  text,
  unit_count         int default 0,
  total_hours        int default 0,
  owner_id           uuid references profiles(id),
  publication_status text not null default 'draft'
                       check (publication_status in ('draft','under_review','approved','published','archived')),
  version            int not null default 1,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create table if not exists course_instructors (
  course_id    text references courses(id) on delete cascade,
  instructor_id uuid references profiles(id) on delete cascade,
  can_publish  boolean not null default false,
  assigned_at  timestamptz not null default now(),
  primary key (course_id, instructor_id)
);

create table if not exists units (
  id           uuid primary key default gen_random_uuid(),
  course_id    text references courses(id) on delete cascade,
  title        text not null,
  code         text,
  position     int not null default 0,
  hours        int default 0
);

create table if not exists lessons (
  id           uuid primary key default gen_random_uuid(),
  unit_id      uuid references units(id) on delete cascade,
  title        text not null,
  kind         text not null default 'lesson' check (kind in ('lesson','quiz','practical','gate')),
  position     int not null default 0,
  body         jsonb
);

-- ---- Enrolment + progress --------------------------------------------------
create table if not exists enrolments (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references profiles(id) on delete cascade,
  course_id   text references courses(id) on delete cascade,
  enrolled_at timestamptz not null default now(),
  status      text not null default 'active',
  unique (user_id, course_id)
);

create table if not exists progress (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references profiles(id) on delete cascade,
  course_id   text references courses(id) on delete cascade,
  item_key    text not null,            -- module/lesson identifier
  state       text not null check (state in ('done','passed','attempted')),
  updated_at  timestamptz not null default now(),
  unique (user_id, course_id, item_key)
);

-- ---- Assessment ------------------------------------------------------------
create table if not exists quizzes (
  id          uuid primary key default gen_random_uuid(),
  course_id   text references courses(id) on delete cascade,
  unit_id     uuid references units(id) on delete set null,
  title       text not null,
  pass_mark   int not null default 80,
  version     int not null default 1,
  is_final    boolean not null default false
);

create table if not exists quiz_questions (
  id          uuid primary key default gen_random_uuid(),
  quiz_id     uuid references quizzes(id) on delete cascade,
  prompt      text not null,
  kind        text not null default 'single' check (kind in ('single','multi','truefalse','short','scenario','match','order')),
  options     jsonb,                    -- array of option strings
  correct     jsonb,                    -- correct index/indices; server-only read
  explanation text,
  position    int not null default 0
);

-- Attempts are the source of truth for grades. The server computes the score;
-- clients never submit their own pass/score.
create table if not exists quiz_attempts (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references profiles(id) on delete cascade,
  quiz_id       uuid references quizzes(id) on delete cascade,
  attempt_no    int not null default 1,
  answers       jsonb not null,
  score         int,
  percentage    int,
  passed        boolean,
  started_at    timestamptz not null default now(),
  submitted_at  timestamptz,
  -- idempotency: one in-flight attempt row per (user,quiz,attempt_no)
  unique (user_id, quiz_id, attempt_no)
);

create table if not exists certificates (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references profiles(id) on delete cascade,
  course_id     text references courses(id) on delete cascade,
  issued_at     timestamptz not null default now(),
  serial        text unique not null default encode(gen_random_bytes(8),'hex'),
  revoked       boolean not null default false,
  -- a certificate may only exist once the server has recorded a passing final
  unique (user_id, course_id)
);

-- ---- Governance ------------------------------------------------------------
create table if not exists content_reviews (
  id          uuid primary key default gen_random_uuid(),
  course_id   text references courses(id) on delete cascade,
  reviewer_id uuid references profiles(id),
  decision    text check (decision in ('submitted','approved','rejected','published')),
  notes       text,
  created_at  timestamptz not null default now()
);

create table if not exists audit_events (
  id          bigserial primary key,
  actor_id    uuid references profiles(id),
  action      text not null,            -- role_change, publish, grade_change, access_change ...
  target      text,
  detail      jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists idx_progress_user on progress(user_id);
create index if not exists idx_attempts_user on quiz_attempts(user_id);
create index if not exists idx_enrol_user on enrolments(user_id);
create index if not exists idx_audit_actor on audit_events(actor_id);
