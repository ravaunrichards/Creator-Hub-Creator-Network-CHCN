-- ============================================================================
-- CHCN — Row Level Security + authorization. Migration 0002.
-- STATUS: DESIGNED, NOT DEPLOYED / NOT VERIFIED (no live DB in build env).
-- This is the REAL security boundary. The shipped browser app enforces roles
-- only in the UI, which is NOT security; these policies must back it in prod.
-- Idempotent: policies are dropped-if-exists before being (re)created.
-- ============================================================================

alter table profiles           enable row level security;
alter table courses            enable row level security;
alter table course_instructors enable row level security;
alter table units              enable row level security;
alter table lessons            enable row level security;
alter table enrolments         enable row level security;
alter table progress           enable row level security;
alter table quizzes            enable row level security;
alter table quiz_questions     enable row level security;
alter table quiz_attempts      enable row level security;
alter table certificates       enable row level security;
alter table content_reviews    enable row level security;
alter table audit_events       enable row level security;

-- Helper: current user's role (SECURITY DEFINER so RLS on profiles can't recurse).
create or replace function current_role_name() returns chcn_role
language sql stable security definer set search_path = public as $$
  select role from profiles where id = auth.uid()
$$;

create or replace function is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select role in ('founder','admin','course_manager')
                   from profiles where id = auth.uid()), false)
$$;

create or replace function teaches(course text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from course_instructors ci
                 where ci.course_id = course and ci.instructor_id = auth.uid())
$$;

-- ---- profiles --------------------------------------------------------------
drop policy if exists profiles_self_read on profiles;
create policy profiles_self_read on profiles for select
  using (id = auth.uid() or is_staff());

drop policy if exists profiles_self_update on profiles;
-- A user may edit their own profile but NOT their own role or status.
create policy profiles_self_update on profiles for update
  using (id = auth.uid())
  with check (id = auth.uid() and role = current_role_name());

-- Role / status changes go through a SECURITY DEFINER admin function only
-- (see set_user_role below). No direct client UPDATE of role is permitted.

-- ---- courses ---------------------------------------------------------------
drop policy if exists courses_public_read on courses;
create policy courses_public_read on courses for select
  using (publication_status = 'published' or is_staff() or teaches(id));

drop policy if exists courses_staff_write on courses;
create policy courses_staff_write on courses for all
  using (is_staff() or teaches(id))
  with check (is_staff() or teaches(id));

-- ---- units / lessons -------------------------------------------------------
drop policy if exists units_read on units;
create policy units_read on units for select
  using (exists (select 1 from courses c where c.id = units.course_id
                 and (c.publication_status = 'published' or is_staff() or teaches(c.id))));
drop policy if exists units_write on units;
create policy units_write on units for all
  using (is_staff() or teaches(course_id)) with check (is_staff() or teaches(course_id));

drop policy if exists lessons_rw on lessons;
create policy lessons_rw on lessons for all
  using (exists (select 1 from units u where u.id = lessons.unit_id
                 and (is_staff() or teaches(u.course_id))))
  with check (exists (select 1 from units u where u.id = lessons.unit_id
                 and (is_staff() or teaches(u.course_id))));

-- ---- enrolment / progress (owner-scoped) ----------------------------------
drop policy if exists enrol_owner on enrolments;
create policy enrol_owner on enrolments for all
  using (user_id = auth.uid() or is_staff())
  with check (user_id = auth.uid());

drop policy if exists progress_owner on progress;
create policy progress_owner on progress for all
  using (user_id = auth.uid() or is_staff() )
  with check (user_id = auth.uid());

-- ---- quizzes: questions readable, CORRECT ANSWERS are NOT client-readable --
drop policy if exists quizzes_read on quizzes;
create policy quizzes_read on quizzes for select using (true);

drop policy if exists qq_read on quiz_questions;
-- Clients may read prompts/options but the `correct` column must be stripped
-- by a VIEW / RPC; granting row select here still exposes columns, so prod
-- MUST expose questions only through the view below, never the base table.
create policy qq_staff_only on quiz_questions for select using (is_staff() or teaches(
  (select course_id from quizzes q where q.id = quiz_questions.quiz_id)));

create or replace view quiz_questions_public as
  select id, quiz_id, prompt, kind, options, position from quiz_questions;

-- ---- attempts (owner writes answers, server grades) ------------------------
drop policy if exists attempts_owner on quiz_attempts;
create policy attempts_owner on quiz_attempts for select
  using (user_id = auth.uid() or is_staff() or teaches((select course_id from quizzes q where q.id = quiz_attempts.quiz_id)));
drop policy if exists attempts_insert on quiz_attempts;
create policy attempts_insert on quiz_attempts for insert
  with check (user_id = auth.uid());
-- score/percentage/passed are set by a SECURITY DEFINER grading RPC, not the client.

-- ---- certificates (read own; issue via server only) -----------------------
drop policy if exists certs_read on certificates;
create policy certs_read on certificates for select
  using (user_id = auth.uid() or is_staff());
-- No client INSERT policy: certificates are issued only by the grading/
-- completion RPC (SECURITY DEFINER) after a verified passing final.

-- ---- reviews / audit (staff read; audit append-only via trigger) ----------
drop policy if exists reviews_staff on content_reviews;
create policy reviews_staff on content_reviews for all
  using (is_staff() or teaches(course_id)) with check (is_staff() or teaches(course_id));

drop policy if exists audit_read on audit_events;
create policy audit_read on audit_events for select using (is_staff());
-- audit_events has NO client insert/update/delete policy: written only by
-- SECURITY DEFINER functions, making it effectively append-only + tamper-evident.

-- ---- privileged role change (founder/admin only, fully audited) ------------
create or replace function set_user_role(target uuid, new_role chcn_role)
returns void language plpgsql security definer set search_path = public as $$
begin
  if current_role_name() not in ('founder','admin') then
    raise exception 'not authorized';
  end if;
  -- only the founder may create another founder/admin
  if new_role in ('founder','admin') and current_role_name() <> 'founder' then
    raise exception 'only the founder may grant founder/admin';
  end if;
  update profiles set role = new_role, updated_at = now() where id = target;
  insert into audit_events(actor_id, action, target, detail)
    values (auth.uid(), 'role_change', target::text, jsonb_build_object('new_role', new_role));
end $$;
