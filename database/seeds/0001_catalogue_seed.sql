-- ============================================================================
-- CHCN dev/test seed — catalogue ONLY. Migration-style, idempotent (upsert).
-- Contains NO fake students, NO fake grades, NO fake certificates, NO payments.
-- Course rows are the real 35-course catalogue (see courses/course-registry.json).
-- Generate the full INSERTs with: node scripts/build-sql-seed.js  (optional).
-- STATUS: NOT APPLIED to any database in this build environment.
-- ============================================================================

insert into course_categories (id, name) values
  ('agriculture','Agriculture'),
  ('allied-health','Allied Health'),
  ('automotive','Automotive'),
  ('beauty-wellness','Beauty and Wellness'),
  ('business-management','Business and Management'),
  ('construction-trades','Construction and Trades'),
  ('education-childcare','Education and Childcare'),
  ('electrical-hvac','Electrical and HVAC'),
  ('hospitality','Hospitality'),
  ('ict','ICT'),
  ('logistics-operations','Logistics and Operations'),
  ('security','Security')
on conflict (id) do update set name = excluded.name;

-- Course rows: load from the generated file database/seeds/courses.generated.sql
-- which is produced deterministically from the shipped catalogue so the SQL and
-- the app never drift. Run scripts/build-sql-seed.js to (re)generate it.
