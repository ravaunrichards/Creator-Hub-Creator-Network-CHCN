/* Deterministically builds courses/course-registry.json from the existing
   courses-data.js (window.NEW_COURSES / window.NEW_QUIZBANK). No network. */
'use strict';
const path = require('path');
const fs = require('fs');
global.window = {};
require(path.join(__dirname, '..', 'app', 'courses-data.js'));
const C = window.NEW_COURSES || {};
const Q = window.NEW_QUIZBANK || {};
const amp = String.fromCharCode(38); // avoid literal ampersand in source
const reg = {
  schema: 'chcn.course-registry/v1',
  generatedAt: new Date().toISOString().slice(0, 10),
  organization: 'Creator Hub Creator Network (CHCN)',
  division: 'Technical ' + amp + ' Vocational Education and Training',
  product: 'CHCN Education ' + amp + ' Training Academy',
  note: 'Auto-derived from the existing courses-data.js. Awarding-body and accreditation fields are UNVERIFIED and must be confirmed by a qualified SME before being presented as official.',
  courseCount: Object.keys(C).length,
  courses: []
};
for (const id of Object.keys(C)) {
  const c = C[id];
  const qb = Q[id] || [];
  reg.courses.push({
    courseId: id,
    title: c.name,
    category: c.cat,
    subject: c.cat,
    level: c.level,
    levelLabel: c.lvlLabel,
    icon: c.icon || null,
    description: c.desc || '',
    learningOutcomes: c.outcomes || [],
    prerequisites: c.prerequisites || 'None stated',
    awardingBody: null,
    qualificationFramework: null,
    accreditationStatus: 'UNVERIFIED',
    certificateLabel: c.cert || null,
    certificateFull: c.certFull || null,
    unitCount: c.unitCount || 0,
    totalHours: c.totalHours || 0,
    moduleCount: (c.modules || []).length,
    quizBankQuestionCount: qb.length,
    sources: c.sources || [],
    version: '1.0',
    reviewDate: null,
    owner: 'CHCN Founder',
    assignedInstructors: [],
    publicationStatus: qb.length > 0 ? 'published' : 'draft',
    contentVerificationStatus: 'PENDING_SME_REVIEW'
  });
}
const out = path.join(__dirname, '..', 'courses', 'course-registry.json');
fs.writeFileSync(out, JSON.stringify(reg, null, 2));
console.log('Wrote ' + reg.courses.length + ' courses to ' + out);
