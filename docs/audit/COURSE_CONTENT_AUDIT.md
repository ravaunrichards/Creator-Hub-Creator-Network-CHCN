# CHCN — Course Content Audit

Source of truth: `courses-data.js` (`window.NEW_COURSES` / `window.NEW_QUIZBANK`).
Machine-readable catalogue regenerated to `courses/course-registry.json`.

## On the seven "Security Officer" course names in the brief

The master command listed seven security-officer / supervisor course names as
"a starting inventory, not a confirmed complete catalogue" and instructed: _do
not invent official course names, awarding bodies, accreditation_. 

**Finding:** none of those seven exist in the project. The only security
course present is **Industrial Security Operations — Level 3**. The brief's
names were therefore **not** fabricated into the catalogue. If they are real
programmes, their curricula must be supplied before they can be added.

## Catalogue as it actually exists — 35 courses, 12 categories

| # | Category | Course | Lvl | Units | Hours | Quiz Qs |
|---|----------|--------|-----|-------|-------|---------|
| 1 | Agriculture | Tractor Operation and Maintenance | 2 | 33 | 2805 | ✓ |
| 2 | Allied Health | Health Care Assistance (Patient Care) | 2 | 32 | 970 | ✓ |
| 3 | Allied Health | Health Care Assistance (Patient Care) | 3 | 59 | 1715 | ✓ |
| 4 | Automotive | Electric / Hybrid Vehicle Hazard Management | 1 | 16 | 840 | ✓ |
| 5 | Automotive | Motor Vehicle Repairs | 2 | 36 | 2625 | ✓ |
| 6 | Beauty & Wellness | Cosmetology | 2 | 41 | 1095 | ✓ |
| 7 | Beauty & Wellness | General Beauty Therapy | 3 | 38 | 1140 | ✓ |
| 8 | Beauty & Wellness | Hair Styling | 2 | 24 | 770 | ✓ |
| 9 | Beauty & Wellness | Massage Therapy | 4 | 45 | 1431 | ✓ |
| 10 | Business & Mgmt | Business Management (Supervision) | 3 | 64 | 1562 | ✓ |
| 11 | Business & Mgmt | Human Resource Management | 4 | 33 | 1845 | ✓ |
| 12 | Business & Mgmt | Supervisory Management | 3 | 50 | 3855 | ✓ |
| 13 | Business & Mgmt | Customer Service | 2 | 44 | 952 | ✓ |
| 14 | Education & Childcare | Early Childhood Special Needs | 3 | 55 | 1710 | ✓ |
| 15 | Electrical & HVAC | Electrical Installation | 3 | 63 | 4340 | ✓ |
| 16 | Electrical & HVAC | Electrical Installation | 4 | 26 | 2115 | ✓ |
| 17 | Electrical & HVAC | Mechatronics | 3 | 54 | 3705 | ✓ |
| 18 | Construction & Trades | Carpentry | 3 | 64 | 4985 | ✓ |
| 19 | Agriculture | Greenhouse Technology | 2 | 35 | 1045 | ✓ |
| 20 | Hospitality | Housekeeping Operations | 2 | 41 | 2370 | ✓ |
| 21 | Business & Mgmt | Housekeeping Supervision | 3 | 60 | 3800 | ✓ |
| 22 | Hospitality | Commercial Food Preparation | 2 | 48 | 3045 | ✓ |
| 23 | Hospitality | Hospitality Villa / Properties Services | 2 | 58 | 3690 | ✓ |
| 24 | Hospitality | Housekeeping (Linen Room Attendant) | 2 | 28 | 659 | ✓ |
| 25 | Security | Industrial Security Operations | 3 | 64 | 1148 | ✓ |
| 26 | ICT | Computer Service and Support | 2 | 27 | 640 | ✓ |
| 27 | ICT | Data Operations | 2 | 37 | 690 | ✓ |
| 28 | ICT | Network Engineering | 4 | 49 | 1160 | ✓ |
| 29 | Electrical & HVAC | A/C & Refrigeration (Commercial/Industrial) | 2 | 56 | 1507 | ✓ |
| 30 | Electrical & HVAC | A/C & Refrigeration (Domestic/Light-Comm) | 2 | 37 | 2595 | ✓ |
| 31 | Electrical & HVAC | Electrical / Electronic Maintenance | 2 | 38 | 890 | ✓ |
| 32 | Electrical & HVAC | Industrial Electrical Maintenance | 3 | 41 | 910 | ✓ |
| 33 | Construction & Trades | Plumbing | 2 | 40 | 825 | ✓ |
| 34 | Construction & Trades | Welding | 2 | 35 | 830 | ✓ |
| 35 | Logistics & Operations | Forklifting Operations | 2 | 35 | 1665 | ✓ |

**Totals:** 35 courses, 1,506 units, 65,929 hours, 1,064 quiz questions.
Every course has modular structure, outcomes, a final assessment lesson, and
a quiz bank (validated by `tests/integration/data-integrity.test.js`).

## Content quality / verification status

- Curricula are structured as competency units with hour allocations and cite
  HEART/NSTA Trust (NVQ-J) and O*NET as sources. These citations are
  **present but UNVERIFIED** by this pass — marked `PENDING_SME_REVIEW` in the
  registry. A qualified SME must confirm awarding body, framework level and
  accreditation before any course is presented as officially recognised.
- Quiz banks are largely "which unit belongs to this programme / how many
  hours" recall items. They are internally consistent (answer indices valid)
  but are **catalogue-recall**, not deep competency assessment. Recommended
  enhancement: add scenario and applied-knowledge items per unit outcome.

## Preservation

No course was deleted, renamed or rewritten. The registry is an **additive**
derived artifact; `courses-data.js` is unchanged.
