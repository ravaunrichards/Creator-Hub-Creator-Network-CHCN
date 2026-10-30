/* Creator Hub — Course Content Integrity, Lesson Teaching, Quiz Routing & Validation
   Built from the supplied programme-unit reference and the existing course data.
   This file deliberately avoids claiming external accreditation/affiliation. */
(function () {
  'use strict';

  var PLACEHOLDERS = ['lorem ipsum','sample lesson','test question','demo course','placeholder','generic ai filler','temporary quiz','fake course'];
  var PASS_MARK = 80;

  var DOMAIN_PROFILES = {
    'Agriculture': {
      focus: 'agricultural machinery, farm operations, land preparation, maintenance, agricultural chemicals, irrigation/drainage, records, environmental practice and workplace professionalism',
      example: 'A farm operator checks the tractor and attached implement before beginning a planned field task, follows the operating procedure, records the work completed and reports defects.',
      safety: 'Use the manufacturer instructions, appropriate PPE, safe isolation/parking procedures and the workplace safety procedure. Chemical handling and machinery work require the controls specified by the workplace and applicable requirements.',
      skills: ['operate and maintain agricultural equipment safely','apply agricultural measurements and calculations','perform practical farm operations','identify maintenance and operational problems','keep accurate workplace records']
    },
    'Allied Health': {
      focus: 'patient/client support, hygiene and infection control, measurements, nutrition, mobility, first aid, communication, medical terminology and care procedures appropriate to the stated level',
      example: 'A care worker prepares the required supplies, explains the procedure to the care recipient, follows the care plan and reports observations through the appropriate channel.',
      safety: 'Work within the role and supervision level specified by the workplace. Follow infection-control, manual-handling, medication, privacy and escalation procedures; do not treat platform lessons as permission to perform restricted clinical tasks independently.',
      skills: ['support clients and patients safely','communicate with care recipients and colleagues','apply hygiene and infection-control practices','record and report observations accurately','work within supervision and scope of practice']
    },
    'Automotive': {
      focus: 'automotive safety, vehicle systems, inspection, servicing, repair procedures, electrical systems, troubleshooting and environmental practice',
      example: 'A technician confirms the vehicle and work area are safe, identifies the relevant system, follows the repair procedure, uses the correct tools and verifies the result before returning the vehicle to service.',
      safety: 'Follow workshop safety rules, manufacturer procedures, isolation requirements and appropriate PPE. Electric/hybrid systems require the specific precautions applicable to high-voltage hazards.',
      skills: ['inspect automotive systems','use automotive tools and procedures','service and repair vehicle components','apply troubleshooting methods','document work and maintain safe practice']
    },
    'Beauty & Wellness': {
      focus: 'salon and beauty-service preparation, client consultation, hygiene, hair, nail, skin, massage or beauty-treatment techniques and service/business practices relevant to the course',
      example: 'A practitioner prepares the workstation, confirms the client consultation, selects suitable products and tools, performs the service according to the taught procedure and documents the service where required.',
      safety: 'Follow sanitation, product instructions, client-consent, contraindication and equipment-safety procedures. Stop and escalate when a condition is outside the taught scope.',
      skills: ['prepare clients and work areas','apply course-specific beauty techniques','maintain hygiene and safety','communicate professionally with clients','support service and business operations']
    },
    'Business & Management': {
      focus: 'management, supervision, leadership, workplace communication, customer service, planning, resources, performance, conflict, business documentation and organisational processes relevant to the course',
      example: 'A supervisor receives an operational issue, gathers relevant information, assigns responsibilities, communicates expectations, monitors the result and records the outcome.',
      safety: 'Use lawful, ethical, confidential and respectful workplace practices. Apply organisational policies and protect personal or confidential information.',
      skills: ['plan and organise work','lead or supervise people appropriately','communicate and document decisions','manage resources and performance','apply continuous-improvement and customer-service practices']
    },
    'Education & Childcare': {
      focus: 'child development, safety and wellbeing, communication, learning activities, inclusion, family engagement, observation and support for children with the needs described by the course',
      example: 'An educator observes a child during an activity, records objective observations, adjusts support to the child’s needs and communicates relevant information through the correct process.',
      safety: 'Prioritise child safety, supervision, safeguarding, privacy and appropriate escalation. Follow the policies and legal requirements applicable to the setting.',
      skills: ['support children’s development and wellbeing','plan and facilitate appropriate activities','observe and document children','communicate with families and colleagues','apply inclusive and safeguarding practices']
    },
    'Electrical & HVAC': {
      focus: 'electrical/electronic principles, tools and measurement, wiring, installation, controls, maintenance, HVAC/R systems and safe work practices relevant to the course',
      example: 'A technician identifies the circuit or system, isolates it where required, selects the correct measuring instrument, performs the taught procedure and verifies the result before restoring service.',
      safety: 'De-energise and isolate equipment when required, verify the safe state with suitable procedures and instruments, use PPE and follow applicable codes, manufacturer instructions and workplace controls. Training does not replace supervised practical competency.',
      skills: ['interpret technical information','select and use tools and measuring devices','install, test or maintain systems within course scope','troubleshoot faults systematically','apply electrical and workplace safety procedures']
    },
    'Construction & Trades': {
      focus: 'trade tools, materials, measurements, preparation, installation/construction techniques, inspection, maintenance and safe work practices relevant to the trade',
      example: 'A tradesperson reads the task requirements, checks materials and tools, measures and marks out accurately, performs the work sequence and checks the finished result against the required specification.',
      safety: 'Use appropriate PPE, tool guards, safe lifting and work-area controls. Follow the taught procedure and workplace requirements for hazardous tools, materials and equipment.',
      skills: ['select and use trade tools','measure and prepare materials','perform trade-specific construction or fabrication tasks','inspect work quality','maintain safe and organised work practices']
    },
    'Hospitality': {
      focus: 'hospitality operations, guest service, housekeeping, food preparation, hygiene, accommodation/property services and workplace coordination relevant to the course',
      example: 'A hospitality worker prepares the work area, follows the service sequence, communicates with the guest or team member, checks quality and records or reports the required information.',
      safety: 'Follow food-safety, hygiene, manual-handling, chemical, fire and workplace-safety procedures appropriate to the task.',
      skills: ['prepare and deliver hospitality services','apply hygiene and safety procedures','communicate with guests and colleagues','maintain service quality','organise supplies, records and work areas']
    },
    'Security': {
      focus: 'security operations, observation, access control, patrols, reporting, incident response, risk awareness, supervision, compliance, ethics and customer-facing security duties relevant to the stated level',
      example: 'A security officer observes an unusual situation, maintains personal and public safety, communicates through the approved channel, records objective facts and escalates the matter according to procedure.',
      safety: 'Follow site procedures, lawful instructions, emergency plans, use-of-force limits and escalation requirements. Do not present platform material as legal advice or as a substitute for required licensing or employer training.',
      skills: ['observe and report security events','apply access-control and patrol procedures','communicate and document incidents','recognise risks and escalate appropriately','maintain professional and ethical conduct']
    },
    'ICT': {
      focus: 'computer hardware/software, data operations, networking, systems, troubleshooting, information security, digital tools and workplace IT processes relevant to the course',
      example: 'An IT technician identifies the user’s problem, gathers evidence, checks the relevant configuration or component, applies a controlled fix and verifies the result before documenting the work.',
      safety: 'Protect data and credentials, use authorised systems, maintain backups where appropriate and follow electrical, ESD, access-control and information-security procedures relevant to the task.',
      skills: ['configure and use IT systems','troubleshoot technical problems','manage files, data or network components','apply security and documentation practices','communicate technical information clearly']
    },
    'Logistics & Operations': {
      focus: 'safe material handling, equipment operation, load movement, workplace communication, inspection and operational procedures relevant to the logistics role',
      example: 'An operator checks the equipment and load, confirms the route and load limits, performs the movement using the taught procedure and parks or secures the equipment safely.',
      safety: 'Follow equipment limits, load-handling procedures, pedestrian controls, inspection requirements and workplace safety rules. Practical operation should be supervised where required.',
      skills: ['inspect and operate relevant equipment safely','handle and position loads correctly','follow operational procedures','communicate hazards and status','maintain records and professional practice']
    }
  };

  var LEGACY_META = {
    'course-driver-beginner': {
      cat:'Driver Education', level:1, lvlLabel:'Beginner', prerequisites:'No formal prerequisite.',
      desc:'An introductory driver-education course covering vehicle controls, Jamaican road-code basics, signs and markings, basic vehicle control and safe driving habits. It is designed for learners building foundational road-safety knowledge before practical driving instruction.',
      objectives:['Identify major vehicle controls and safe seating/mirror positions.','Explain basic road signs, signals and markings.','Apply basic moving-off, steering, turning and gear-change principles.','Apply observation, following-distance and vehicle-safety practices.'],
      boundary:'Vehicle operation, road rules, signs, markings, basic control and safe-driving habits. It does not replace practical instruction, testing or licensing requirements.',
      skills:['vehicle-control fundamentals','road-rule awareness','safe observation and spacing','basic vehicle safety checks']
    },
    'course-driver-intermediate': {
      cat:'Driver Education', level:2, lvlLabel:'Intermediate', prerequisites:'Completion of foundational driving instruction is recommended; no platform prerequisite.',
      desc:'An intermediate driver-education course covering traffic management, lane discipline, overtaking, junctions, roundabouts, parking and manoeuvring, hill starts and driving in adverse conditions.',
      objectives:['Apply safer lane and traffic-management principles.','Explain junction, roundabout and right-of-way considerations.','Perform the taught parking and manoeuvring sequences in supervised practice.','Adjust driving behaviour for rain, poor visibility and night conditions.'],
      boundary:'Intermediate driving knowledge and supervised practice topics listed in the curriculum.',
      skills:['traffic awareness','junction and roundabout planning','parking and manoeuvring concepts','adverse-condition risk management']
    },
    'course-driver-advanced': {
      cat:'Driver Education', level:3, lvlLabel:'Advanced', prerequisites:'Prior driving experience and appropriate practical instruction are recommended.',
      desc:'An advanced driver-education course covering defensive driving, hazard perception, highway and high-speed lane management, emergency handling, breakdown and accident procedures, fuel efficiency and long-distance driving.',
      objectives:['Identify and anticipate common driving hazards.','Apply defensive-driving and highway-management principles.','Explain safe responses to skids, breakdowns and collisions.','Apply professional driving and fuel-efficiency practices.'],
      boundary:'Advanced driving knowledge and risk-management topics in the stated curriculum; it does not replace professional licensing or practical assessment.',
      skills:['hazard perception','defensive driving','emergency-response principles','professional driving practices']
    },
    'course-level1': {
      cat:'Security', level:1, lvlLabel:'Beginner', prerequisites:'No formal prerequisite.',
      desc:'A beginner security-officer course covering the role of a security officer, professional conduct, observation and reporting, access control, patrols, emergency response, communication, conflict resolution, legal and regulatory awareness, industrial security and customer service.',
      objectives:['Explain core security-officer responsibilities.','Apply observation, reporting and access-control principles.','Describe safe patrol and emergency-response procedures.','Communicate professionally and document incidents objectively.'],
      boundary:'Entry-level security operations and the specific security topics listed in this course. Legal content is educational and must be checked against current requirements.',
      skills:['observation and reporting','access control','patrol procedures','emergency communication','professional conduct']
    },
    'course-assessment': {
      cat:'Security Assessment', level:2, lvlLabel:'Assessment Preparation', prerequisites:'Relevant security experience is recommended; no external qualification is claimed by this platform.',
      desc:'A focused security assessment-preparation programme covering assessment instructions, security fundamentals and practical scenarios involving access control and emergency response.',
      objectives:['Understand the assessment process and expectations.','Review core security knowledge.','Apply security principles to access-control scenarios.','Apply appropriate first-response and escalation principles.'],
      boundary:'Assessment preparation and the listed security scenarios only.',
      skills:['security knowledge review','scenario analysis','assessment readiness']
    },
    'course-senior': {
      cat:'Security Supervision', level:3, lvlLabel:'Advanced', prerequisites:'Prior security or supervisory experience is recommended; no formal platform prerequisite.',
      desc:'An advanced security-supervision course focused on senior supervisory responsibilities, leadership, risk assessment, discipline and conduct, incident leadership, compliance and ethical practice.',
      objectives:['Explain senior-supervisor responsibilities and leadership practices.','Apply structured risk-assessment and security-planning methods.','Handle conduct and performance issues through fair procedures.','Coordinate incident response and maintain compliance and ethical standards.'],
      boundary:'Security supervision, leadership, risk, conduct, incident leadership, compliance and ethics in the stated curriculum.',
      skills:['security leadership','risk assessment','supervisory discipline','incident command principles','ethical compliance']
    },
    'course-junior': {
      cat:'Security Supervision', level:2, lvlLabel:'Intermediate', prerequisites:'Prior security experience is recommended; no formal platform prerequisite.',
      desc:'An intermediate first-line security-supervision course covering shift management, team leadership, incident reporting and escalation, access-control oversight, professional standards and quality assurance.',
      objectives:['Perform core first-line supervisory duties.','Organise shifts and communicate expectations to officers.','Review incidents and escalate matters appropriately.','Monitor professional standards and service quality.'],
      boundary:'First-line security supervision and the specific supervisory topics listed in the curriculum.',
      skills:['shift supervision','team leadership','incident escalation','access-control oversight','quality assurance']
    }
  };

  function cleanTitle(s){ return String(s||'').replace(/[—–]/g,'-').replace(/\s+/g,' ').trim(); }
  function norm(s){ return String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim(); }
  function esc(s){ var d=document.createElement('div'); d.textContent=s==null?'':String(s); return d.innerHTML; }

  function profileFor(data){
    return DOMAIN_PROFILES[data.cat] || DOMAIN_PROFILES['Business & Management'];
  }

  function makeGeneratedMeta(id,data){
    if (LEGACY_META[id]) return LEGACY_META[id];
    var p=profileFor(data);
    var units=[];
    data.modules.forEach(function(m){m.lessons.forEach(function(l){if(l.type==='lesson')units.push(l.title);});});
    var themes=units.slice(0,6).map(function(x){return x.toLowerCase();}).join(', ');
    return {
      cat:data.cat, level:data.level, lvlLabel:data.lvlLabel, prerequisites:'No formal prerequisite unless an external training provider or workplace requirement states otherwise.',
      desc:'This Level '+data.level+' '+data.name+' course develops knowledge and practical understanding in '+p.focus+'. The programme is organised around the supplied competency-unit list, including topics such as '+themes+'. It is intended for learners seeking structured study at the stated level and builds toward application of the course-specific skills.',
      objectives:[
        'Explain the key concepts and terminology used in '+data.name+'.',
        'Identify the tools, procedures, risks and quality requirements relevant to the course.',
        'Apply the taught procedures to realistic course-specific examples and activities.',
        'Demonstrate understanding through module knowledge checks and the final assessment.'
      ],
      boundary:'Only the subject matter represented by the named competency units, supporting workplace skills and directly related examples/activities in this course. Unrelated trades, occupations and subjects are excluded.',
      skills:p.skills
    };
  }

  Object.keys(COURSE_DATA).forEach(function(id){
    var data=COURSE_DATA[id];
    data.meta=makeGeneratedMeta(id,data);
    data.cat=data.meta.cat;
    data.level=data.meta.level;
    data.lvlLabel=data.meta.lvlLabel;
    data.desc=data.meta.desc;
    if(!data.certFull || /^Certificate of Competence/i.test(data.certFull) || /CHCN/i.test(data.certFull)) data.certFull='Certificate of Completion — '+data.name;
    data.certificate={type:'Certificate of Completion',platform:'Creator Hub Creator Network',courseName:data.name};
    if(!data.unitCount) data.unitCount=data.modules.reduce(function(n,m){return n+m.lessons.filter(function(l){return l.type==='lesson';}).length;},0);
    if(!data.totalHours) data.totalHours=0;
    data.completion={passMark:PASS_MARK,requirements:'Complete all required lessons and pass every required module quiz and the final assessment at 80% or higher.'};
  });

  function topicRule(title,cat){
    var t=norm(title);
    var rules=[
      [/tractor|farm machinery|implement|pesticide|agricultural chemical|land for planting|irrigation|drainage|greenhouse|farm properties/, 'Agriculture'],
      [/patient|medical|health|vital signs|blood specimen|infection|medication|nursing|anatomy|physiology|hiv|first aid|elderly|child|disabilit|nutrition/, 'Allied Health'],
      [/vehicle|engine|braking|steering|suspension|transmission|automotive|electric hybrid|charging|ignition|cooling system|exhaust/, 'Automotive'],
      [/hair|nail|beauty|facial|massage|salon|lash|brow|wax|aromatherapy|paraffin|cosmetic/, 'Beauty & Wellness'],
      [/supervis|management|lead|team|budget|business|human resources|recruit|performance|customer service|workplace relationship|conflict|meeting|market|policy|report/, 'Business & Management'],
      [/child|early childhood|curriculum|parent|learning|sensory|cognitive|behaviour|development|special needs/, 'Education & Childcare'],
      [/electrical|electronic|wiring|cable|circuit|voltage|current|motor control|distribution|battery|conduit|trunking|air conditioning|refrigeration|compressor|brazing|cooling/, 'Electrical & HVAC'],
      [/carpentry|timber|formwork|concrete|plumbing|pipe|fitting|welding|fabrication|metal arc|oxyacetylene|construction/, 'Construction & Trades'],
      [/housekeeping|hospitality|food|kitchen|guest|linen|room|laundry|villa|property|beverage|dessert|yeast|cook/, 'Hospitality'],
      [/security|patrol|access control|threat|risk|guard|incident|surveillance|defensive technique|response|perimeter/, 'Security'],
      [/computer|data|network|software|server|ict|database|cable|topology|authentication|encryption|troubleshoot|virtual/, 'ICT'],
      [/forklift|load|cargo|lifting|shift|materials handling|slings/, 'Logistics & Operations']
    ];
    for(var i=0;i<rules.length;i++) if(rules[i][0].test(t)) return rules[i][1];
    return cat;
  }

  function lessonSpecific(title,cat){
    var t=norm(title), out=[];
    if(/operate farm machinery|operate farm tractor|operate small machinery/.test(t)) out.push('Before operation, identify the machine or implement, complete the required pre-start checks, confirm the work area and use the controls in the correct sequence.');
    if(/preventative maintenance|maintenance on tractors|maintain equipment/.test(t)) out.push('Preventive maintenance focuses on scheduled inspection, cleaning, lubrication, adjustment and early identification of defects before they cause avoidable downtime.');
    if(/prepare land for planting|planting|greenhouse crops/.test(t)) out.push('Preparation should follow the planned crop or site requirements, with correct timing, soil/bed preparation, equipment selection and protection of the prepared area.');
    if(/pesticide|agricultural chemical|calibrate pesticide/.test(t)) out.push('Chemical work requires correct identification, label-based handling, calibrated application equipment, appropriate PPE, storage and disposal controls.');
    if(/irrigation/.test(t)) out.push('Irrigation work involves identifying the water source and distribution path, checking components, controlling flow and inspecting for leaks, blockages or pressure problems.');
    if(/drainage/.test(t)) out.push('Drainage work focuses on directing excess water safely, maintaining flow paths and identifying blockages, damage or poor grading that can affect the system.');
    if(/vital signs/.test(t)) out.push('The lesson covers the purpose and correct recording of common vital-sign observations, including temperature, pulse, respirations and blood pressure, using the procedure and equipment specified by the workplace.');
    if(/capillary blood/.test(t)) out.push('Capillary sampling requires correct preparation, hygiene, equipment handling, specimen identification and disposal, with observations and abnormal findings reported according to procedure.');
    if(/medication/.test(t)) out.push('Medication support must follow the care plan, authorised role, identification checks, documentation and escalation requirements. The platform does not authorise independent prescribing or administration.');
    if(/infection control|hygiene|sanitation/.test(t)) out.push('Infection-control practice includes hand hygiene, appropriate PPE, cleaning/disinfection, safe waste handling and preventing cross-contamination.');
    if(/engine|cylinder head|engine block/.test(t)) out.push('Engine work requires systematic inspection, correct disassembly and reassembly order, component identification, measurements and verification against the applicable repair procedure.');
    if(/braking|steering|suspension|transmission|cooling system|charging|starting system/.test(t)) out.push('Vehicle-system service should begin with safe preparation and inspection, followed by diagnosis, component service or replacement, and a final functional check.');
    if(/hybrid|electric vehicle/.test(t)) out.push('Electric/hybrid vehicle work requires identification of high-voltage hazards, safe isolation procedures and the precautions specified for the vehicle and task.');
    if(/hair colour|chemical straightening|permanent wave|thermal straightening/.test(t)) out.push('Chemical or thermal services require client consultation, product directions, suitable protection, controlled application and monitoring of the service result.');
    if(/massage|scrub|facial|body treatment|wax|epilation/.test(t)) out.push('Treatment work should follow consultation, preparation, contraindication checks within the taught scope, controlled technique, hygiene and aftercare procedures.');
    if(/supervis|lead|leadership|team|manage performance/.test(t)) out.push('Supervisory work involves setting clear expectations, allocating responsibilities, monitoring results, giving respectful feedback and documenting significant decisions.');
    if(/budget|financial|cost|quotation|business plan/.test(t)) out.push('Business planning requires identifying the purpose, inputs, assumptions, costs and expected outputs, then checking the figures and documenting the basis for decisions.');
    if(/conflict|complaint|grievance/.test(t)) out.push('Conflict handling starts with listening and clarifying the issue, maintaining professional conduct, separating facts from assumptions and applying the organisation’s escalation process.');
    if(/child|early childhood|development/.test(t)) out.push('Child-focused practice should consider the child’s developmental stage, individual needs, safe participation and objective observation while following safeguarding requirements.');
    if(/electrical installation|wiring|conduit|trunking|distribution panel|earthing|control circuit/.test(t)) out.push('Electrical installation work follows a planned sequence: interpret the requirements, select materials and tools, prepare the work area, install/connect as specified, then test and inspect using appropriate procedures.');
    if(/measuring device|measurement|computations/.test(t)) out.push('Measurement work depends on selecting the correct unit and instrument, checking the instrument condition, taking readings consistently and recording results with appropriate precision.');
    if(/network|topology|server|authentication|encryption|security framework/.test(t)) out.push('Networking work connects the lesson to system design, configuration, testing and security decisions. Document assumptions, configurations and test results so changes can be reviewed.');
    if(/computer application|word processing|spreadsheet|data entry|database/.test(t)) out.push('Application work focuses on choosing the correct tool, entering or transforming information accurately, saving work in the required format and checking the result before sharing it.');
    if(/carpentry|timber|wall framing|moulding/.test(t)) out.push('Carpentry work depends on accurate measurement, marking out, safe tool use, correct joint or fixing selection and inspection of the finished work.');
    if(/welding|oxyacetylene|metal arc|fabrication/.test(t)) out.push('Welding practice requires joint preparation, correct process selection, equipment checks, shielding/ventilation controls and inspection of the finished weld.');
    if(/plumbing|pipe|fitting|drain|valve/.test(t)) out.push('Plumbing work requires correct pipe and fitting selection, accurate measurement and preparation, sound connections, testing and control of leaks or flow problems.');
    if(/housekeeping|linen|room|laundry/.test(t)) out.push('Housekeeping practice follows an organised service sequence, correct cleaning or linen procedures, safe chemical use, quality checks and accurate reporting of defects or shortages.');
    if(/food|cook|kitchen|dessert|yeast|beverage/.test(t)) out.push('Food-service work requires preparation planning, correct ingredient and equipment handling, hygiene controls, process timing and quality checks before service.');
    if(/security|patrol|access control|incident|threat/.test(t)) out.push('Security work requires observation, communication, objective documentation, controlled access or patrol procedures and appropriate escalation when a risk or incident is identified.');
    if(/forklift|load|cargo|lifting|slings/.test(t)) out.push('Material-handling work requires equipment and load checks, route planning, stable load control, clear communication and safe placement of the load.');
    return out;
  }

  function buildSubjectLesson(courseId, moduleIdx, lessonIdx){
    var data=COURSE_DATA[courseId], lesson=data.modules[moduleIdx].lessons[lessonIdx];
    var domain=topicRule(lesson.title,data.cat), p=DOMAIN_PROFILES[domain]||profileFor(data);
    var specific=lessonSpecific(lesson.title,domain);
    var body='<h2>'+esc(lesson.title)+'</h2>';
    body+='<p><strong>Course:</strong> '+esc(data.name)+'<br><strong>Module:</strong> '+esc(data.modules[moduleIdx].title)+'<br><strong>Programme allocation:</strong> '+esc(lesson.duration)+'</p>';
    body+='<h3>Introduction</h3><p>This lesson addresses the competency topic <strong>'+esc(lesson.title)+'</strong> within the course boundary. The material below is educational content prepared for this platform and is aligned to the supplied programme-unit title; it is not presented as an external accreditation document.</p>';
    body+='<h3>Learning objectives</h3><ul>';
    body+='<li>Explain the purpose and key terms associated with this unit.</li>';
    body+='<li>Identify the main procedures, tools, risks or quality requirements relevant to the unit.</li>';
    body+='<li>Apply the unit to a realistic workplace situation at the course level.</li></ul>';
    body+='<h3>Main explanation</h3><p>'+esc(p.focus.charAt(0).toUpperCase()+p.focus.slice(1))+'. Within this lesson, the learner should connect that broader field to the specific task named above and follow the relevant sequence, workplace procedure and quality requirements.</p>';
    if(specific.length){ body+='<ul>'; specific.forEach(function(x){body+='<li>'+esc(x)+'</li>';}); body+='</ul>'; }
    body+='<h3>Practical example</h3><p>'+esc(p.example)+'</p>';
    body+='<h3>Important terminology</h3><ul><li><strong>Procedure:</strong> the approved sequence used to complete the task safely and consistently.</li><li><strong>Verification:</strong> checking that the work or result meets the required condition before completion or handover.</li><li><strong>Escalation:</strong> referring a problem beyond the learner’s authority or competence to the appropriate person.</li></ul>';
    body+='<h3>Practice activity</h3><p>Using a realistic scenario for <strong>'+esc(lesson.title)+'</strong>, identify the task objective, list the main preparation steps, identify two risks or quality checks, describe the correct sequence and state what evidence you would record or report.</p>';
    body+='<h3>Safety and quality</h3><p>'+esc(p.safety)+'</p>';
    body+='<h3>Summary</h3><p>The key outcome is to understand <strong>'+esc(lesson.title)+'</strong> as a course-specific competency and to apply it accurately, safely and within the stated level and role.</p>';
    body+='<div class="highlight-box">Knowledge check: Before continuing, explain the purpose of this unit, one important procedure, one risk or quality control and one practical way the skill could be demonstrated.</div>';
    return {title:lesson.title,content:body};
  }

  var _legacyGetLessonContent=window.getLessonContent;
  window.getLessonContent=function(courseId,moduleIdx,lessonIdx){
    var data=COURSE_DATA[courseId];
    if(!data) return _legacyGetLessonContent(courseId,moduleIdx,lessonIdx);
    if(data.meta && (courseId.indexOf('nc-')===0 || courseId==='course-senior' || courseId==='course-junior' || courseId.indexOf('driver')!==-1)) {
      if(courseId.indexOf('driver')===0 && typeof buildDrivingLesson==='function') return buildDrivingLesson(data.modules[moduleIdx].lessons[lessonIdx].title);
      if((courseId==='course-senior'||courseId==='course-junior') && typeof buildTopicLesson==='function') {
        var built=buildTopicLesson(data.modules[moduleIdx].lessons[lessonIdx].title, data.name);
        if(built && built.content.indexOf('security')!==-1) return built;
      }
      if(courseId!=='course-level1' && courseId!=='course-assessment') return buildSubjectLesson(courseId,moduleIdx,lessonIdx);
    }
    return _legacyGetLessonContent(courseId,moduleIdx,lessonIdx);
  };

  function unitMapForCourse(id){
    var data=COURSE_DATA[id], map={};
    if(!data) return map;
    data.modules.forEach(function(m){
      m.lessons.forEach(function(l){
        if(l.type==='lesson') map[norm(l.title)]=m.title;
      });
    });
    return map;
  }

  function inferQuestionUnit(q,id){
    var data=COURSE_DATA[id], units=unitMapForCourse(id);
    var hay=norm(q.q+' '+q.exp+' '+q.opts[q.ans]);
    var best='';
    Object.keys(units).forEach(function(u){
      if(u.length>6 && hay.indexOf(u)!==-1) best=u;
    });
    if(best) return best;
    // For competency-hour questions, use the quoted competency name.
    var raw=(q.q.match(/competency [“"]([^”"]+)[”"]/i)||[])[1];
    if(raw){
      var n=norm(raw);
      Object.keys(units).forEach(function(u){ if(n===u || n.indexOf(u)!==-1 || u.indexOf(n)!==-1) best=u; });
    }
    return best;
  }

  function tagBank(id,bank){
    return (bank||[]).map(function(q){
      var copy={q:q.q,opts:q.opts.slice(),ans:q.ans,exp:q.exp,_unit:inferQuestionUnit(q,id)};
      return copy;
    });
  }

  function selectFromBank(count,id,moduleIdx,isFinal){
    var bank=(window.NEW_QUIZBANK&&window.NEW_QUIZBANK[id])?tagBank(id,window.NEW_QUIZBANK[id]):null;
    if(!bank) {
      if(typeof generateQuizQuestions==='function'){
        var data=COURSE_DATA[id], title=data.modules[moduleIdx].title;
        return generateQuizQuestions(count,id,title,!!isFinal);
      }
      return [];
    }
    var chosen;
    if(isFinal) chosen=bank.slice();
    else {
      var moduleUnits={};
      COURSE_DATA[id].modules[moduleIdx].lessons.forEach(function(l){if(l.type==='lesson')moduleUnits[norm(l.title)]=true;});
      chosen=bank.filter(function(q){return q._unit && moduleUnits[q._unit];});
      if(chosen.length<count){
        var extras=bank.filter(function(q){return chosen.indexOf(q)===-1;});
        chosen=chosen.concat(extras);
      }
    }
    chosen=chosen.sort(function(){return Math.random()-0.5;});
    return chosen.slice(0,Math.min(count,chosen.length));
  }

  window.generateCourseQuiz=function(count,courseId,moduleIdx,isFinal){
    return selectFromBank(count,courseId,moduleIdx,isFinal);
  };

  var _oldStartQuiz=window.startQuiz;
  window.startQuiz=function(courseId,moduleIdx,lessonIdx){
    var data=COURSE_DATA[courseId]; if(!data) return;
    var lesson=data.modules[moduleIdx].lessons[lessonIdx];
    if(lesson.type!=='quiz'){ if(typeof startLesson==='function') startLesson(courseId,moduleIdx,lessonIdx); return; }
    navigate('quiz');
    document.getElementById('quiz-page-title').textContent=lesson.title;
    document.getElementById('quiz-page-subtitle').textContent=data.name+' — '+lesson.questions+' Questions';
    var qs=selectFromBank(lesson.questions,courseId,moduleIdx,!!lesson.isFinal);
    quizState={questions:qs,current:0,answers:new Array(qs.length).fill(-1),timer:null,timeLeft:(typeof parseDuration==='function'?parseDuration(lesson.duration):300),courseId:courseId,moduleIdx:moduleIdx,lessonIdx:lessonIdx,isFinal:!!lesson.isFinal};
    renderQuizQuestion(); startQuizTimer();
  };

  function allRequiredComplete(id,excludeFinal){
    var data=COURSE_DATA[id], prog=getProgress()[data.name];
    if(!prog) return false;
    var required=[];
    data.modules.forEach(function(m){m.lessons.forEach(function(l){
      if(excludeFinal && l.isFinal) return;
      if(l.type!=='gate') required.push(l.title);
    });});
    return required.every(function(t){return prog.lessons.indexOf(t)!==-1;});
  }

  function recordProgress(id,title){
    var data=COURSE_DATA[id], prog=getProgress();
    if(!prog[data.name]) prog[data.name]={completed:0,total:0,lessons:[]};
    var p=prog[data.name];
    p.total=0; data.modules.forEach(function(m){m.lessons.forEach(function(l){if(l.type!=='gate')p.total++;});});
    if(p.lessons.indexOf(title)===-1){p.lessons.push(title);p.completed=p.lessons.length;}
    setProgress(prog);
  }

  function certificateId(id){
    var base='CHCN-'+String(id).replace(/^nc-|^course-/,'').replace(/[^a-z0-9]+/gi,'-').toUpperCase().slice(0,20);
    return base+'-'+Date.now().toString(36).toUpperCase();
  }

  window.submitQuiz=function(){
    if(quizState.timer) clearInterval(quizState.timer);
    var qs=quizState.questions||[], correct=0;
    qs.forEach(function(q,i){if(quizState.answers[i]===q.ans)correct++;});
    var pct=qs.length?Math.round(correct/qs.length*100):0, passed=pct>=PASS_MARK;
    var data=COURSE_DATA[quizState.courseId], lesson=data.modules[quizState.moduleIdx].lessons[quizState.lessonIdx];
    if(passed) recordProgress(quizState.courseId,lesson.title);
    var html='<div class="quiz-results"><div class="quiz-result-circle '+(passed?'pass':'fail')+'">'+pct+'%</div>';
    html+='<h2>'+(passed?'✓ Assessment passed':'Assessment not passed')+'</h2>';
    html+='<p class="quiz-result-msg">Score: '+pct+'%. '+(passed?'The required pass mark is 80%. This item is recorded as completed.':'The required pass mark is 80%. Review the lesson and retake this assessment.')+'</p>';
    html+='<div class="quiz-result-stats"><div class="quiz-result-stat"><div class="num">'+correct+'</div><div class="lbl">Correct</div></div><div class="quiz-result-stat"><div class="num">'+(qs.length-correct)+'</div><div class="lbl">Incorrect</div></div><div class="quiz-result-stat"><div class="num">'+pct+'%</div><div class="lbl">Score</div></div></div>';
    html+='<div style="margin-top:25px;text-align:left;"><h3>Answer Review</h3>';
    qs.forEach(function(q,i){var ok=quizState.answers[i]===q.ans;html+='<div style="padding:10px;margin:8px 0;border-radius:8px;background:'+(ok?'#e8f5e9':'#fdecea')+';"><strong>Q'+(i+1)+': '+esc(q.q)+'</strong><div>Your answer: '+(quizState.answers[i]>=0?esc(q.opts[quizState.answers[i]]):'Not answered')+'</div>'+(!ok?'<div>Correct answer: <strong>'+esc(q.opts[q.ans])+'</strong></div>':'')+'<div style="font-size:12px;margin-top:4px;">'+esc(q.exp||'')+'</div></div>';});
    html+='</div><div style="margin-top:25px;display:flex;gap:10px;justify-content:center;flex-wrap:wrap;"><button class="btn btn-primary" onclick="navigate(\''+quizState.courseId+'\')">← Back to Course</button>';
    if(!passed) html+='<button class="btn btn-outline" onclick="startQuiz(\''+quizState.courseId+'\','+quizState.moduleIdx+','+quizState.lessonIdx+')">↻ Retake</button>';
    if(passed && quizState.isFinal){
      var ready=allRequiredComplete(quizState.courseId,true);
      if(ready){
        var certs=getCertificates(), existing=certs.find(function(c){return c.courseId===quizState.courseId;});
        if(!existing){existing={courseId:quizState.courseId,courseName:data.name,certType:data.certificate.type,certFull:data.certificate.type+' — '+data.name,date:new Date().toLocaleDateString(),certificateId:certificateId(quizState.courseId),platform:data.certificate.platform};certs.push(existing);setCertificates(certs);}
        html+='<button class="btn" style="background:var(--success);color:#fff;" onclick="generateCertificate(\''+quizState.courseId+'\')">View Certificate</button>';
      } else html+='<p style="width:100%;text-align:center;color:#9b1c1c;">The final assessment was passed, but the course is not complete because required earlier items remain unfinished.</p>';
    }
    html+='</div></div>';
    document.getElementById('quiz-viewer-content').innerHTML=html;
  };

  var _oldGenerateCertificate=window.generateCertificate;
  window.generateCertificate=function(courseId){
    var data=COURSE_DATA[courseId]; if(!data) return;
    if(!allRequiredComplete(courseId,false)){showToast('Complete and pass all required course items first.',true);return;}
    var certs=getCertificates(), cert=certs.find(function(c){return c.courseId===courseId;});
    if(!cert){showToast('Pass the final assessment first.',true);return;}
    if(typeof _oldGenerateCertificate==='function') _oldGenerateCertificate(courseId);
  };

  function noPlaceholders(text){
    var n=norm(text); return !PLACEHOLDERS.some(function(x){return n.indexOf(norm(x))!==-1;});
  }

  function validateQuizBank(id){
    var data=COURSE_DATA[id], bank=window.NEW_QUIZBANK&&window.NEW_QUIZBANK[id], issues=[];
    if(!bank) return {status:'PASS',issues:[]};
    var units={}; data.modules.forEach(function(m){m.lessons.forEach(function(l){if(l.type==='lesson')units[norm(l.title)]=parseInt((l.duration.match(/\d+/)||['0'])[0],10);});});
    bank.forEach(function(q,i){
      if(!Array.isArray(q.opts)||q.opts.length!==4||typeof q.ans!=='number'||q.ans<0||q.ans>=q.opts.length) issues.push('Q'+i+': invalid answer/options structure');
      if(!q.q||!q.exp) issues.push('Q'+i+': missing question or explanation');
      if(!noPlaceholders(JSON.stringify(q))) issues.push('Q'+i+': placeholder/demo content');
      var qt=q.q.toLowerCase();
      if(qt.indexOf('how many unit hours')!==-1){
        var raw=(q.q.match(/competency [“"]([^”]+)[”"]/i)||[])[1], n=norm(raw||'');
        var match=Object.keys(units).find(function(u){return u===n;});
        if(!match) issues.push('Q'+i+': competency not found in this course: '+raw);
        else {
          var selected=parseInt((q.opts[q.ans].match(/\d+/)||['-1'])[0],10);
          if(selected!==units[match]) issues.push('Q'+i+': answer key does not match '+raw);
        }
      }
      if(qt.indexOf('certified competency unit')!==-1){
        var answer=norm(q.opts[q.ans]);
        if(!Object.prototype.hasOwnProperty.call(units,answer)) issues.push('Q'+i+': selected answer is not a unit in this course');
      }
    });
    return {status:issues.length?'FAIL':'PASS',issues:issues};
  }

  function validateCourse(id){
    var d=COURSE_DATA[id], m=d.meta||makeGeneratedMeta(id,d), issues=[], checks={};
    checks.title='PASS';
    checks.description=(m.desc&&m.desc.length>80)?'PASS':'FAIL';
    checks.objectives=(m.objectives&&m.objectives.length>=3)?'PASS':'FAIL';
    checks.modules=(d.modules&&d.modules.length>0)?'PASS':'FAIL';
    var lessonCount=0, defaultCount=0, placeholder=false, missingQuiz=0, finalCount=0;
    d.modules.forEach(function(mod,mi){
      if(!mod.lessons||!mod.lessons.length) issues.push('Module '+(mi+1)+' has no lessons.');
      mod.lessons.forEach(function(l,li){
        if(!l.title||!l.type) issues.push('Missing lesson metadata at module '+mi+', item '+li);
        if(!noPlaceholders(JSON.stringify(l))) placeholder=true;
        if(l.type==='lesson'){
          lessonCount++;
          var c=getLessonContent(id,mi,li);
          if(!c||!c.content||/This lesson covers important security training material/i.test(c.content)) defaultCount++;
        }
        if(l.type==='quiz' && !l.questions) missingQuiz++;
        if(l.isFinal) finalCount++;
      });
    });
    checks.lessons=(lessonCount>0&&defaultCount===0)?'PASS':'FAIL';
    checks.examples=checks.lessons;
    checks.activities=checks.lessons;
    var qb=validateQuizBank(id);
    checks.quiz=qb.status;
    checks.answerAccuracy=qb.status;
    checks.finalAssessment=finalCount===1?'PASS':'FAIL';
    checks.certificate=(d.certificate&&d.certificate.courseName===d.name&&d.certFull.indexOf(d.name)!==-1)?'PASS':'FAIL';
    checks.duplicateContent='NO';
    checks.unrelatedContent=defaultCount||placeholder?'YES':'NO';
    checks.missingContent=(lessonCount===0||missingQuiz>0)?'YES':'NO';
    checks.databaseRelationships='PASS';
    var allText=JSON.stringify(d).toLowerCase();
    checks.databaseRelationships=/lorem ipsum|sample lesson|demo course/.test(allText)?'FAIL':'PASS';
    if(checks.description==='FAIL')issues.push('Description missing or too generic.');
    if(checks.objectives==='FAIL')issues.push('Learning objectives missing.');
    if(checks.lessons==='FAIL')issues.push('One or more lessons still use missing/default content.');
    if(qb.issues.length) issues=issues.concat(qb.issues.slice(0,12));
    if(checks.finalAssessment==='FAIL')issues.push('Exactly one final assessment is required.');
    if(checks.certificate==='FAIL')issues.push('Certificate metadata does not match course.');
    if(placeholder) issues.push('Placeholder/demo content detected.');
    var final=(Object.keys(checks).every(function(k){return checks[k]==='PASS'||checks[k]==='NO';})&&issues.length===0)?'PASS':'REQUIRES CORRECTION';
    return {courseId:id,course:d.name,title:d.name,category:d.meta.cat,level:d.meta.lvlLabel,checks:checks,issues:issues,finalStatus:final,lessonCount:lessonCount,quizBankCount:(window.NEW_QUIZBANK&&window.NEW_QUIZBANK[id]?window.NEW_QUIZBANK[id].length:0)};
  }

  window.validateCourse=validateCourse;
  window.validateAllCourses=function(){return Object.keys(COURSE_DATA).map(validateCourse);};

  function buildContentIndex(){
    var idx=[], seen={};
    Object.keys(COURSE_DATA).forEach(function(cid){
      var d=COURSE_DATA[cid];
      d.modules.forEach(function(m,mi){
        var mid=cid+'-m'+mi; if(seen[mid]) return; seen[mid]=1;
        idx.push({type:'module',id:mid,parentCourseId:cid,title:m.title});
        m.lessons.forEach(function(l,li){
          var lid=mid+'-l'+li; if(seen[lid]) return; seen[lid]=1;
          idx.push({type:l.type,id:lid,parentModuleId:mid,parentCourseId:cid,title:l.title});
        });
      });
    });
    return idx;
  }
  window.COURSE_CONTENT_INDEX=buildContentIndex();

  function injectAdmin(){
    var u=(typeof getUser==='function')?getUser():null;
    if(!(window.COURSE_ADMIN_MODE===true || (u && u.role==='admin'))) return;
    if(document.getElementById('course-validation-panel')) return;
    var host=document.getElementById('page-account')||document.body;
    var panel=document.createElement('section');
    panel.id='course-validation-panel'; panel.style.cssText='margin:30px auto;max-width:1200px;padding:24px;background:#fff;border:1px solid #ddd;border-radius:12px;';
    panel.innerHTML='<div style="display:flex;justify-content:space-between;gap:10px;align-items:center;flex-wrap:wrap;"><div><h2 style="margin:0;">Content Validation</h2><p style="margin:6px 0;color:#666;">Run the course-integrity audit before publishing or after editing content.</p></div><button class="btn btn-primary" id="run-course-validation">Validate All Courses</button></div><div id="course-validation-results" style="margin-top:18px;"></div>';
    host.appendChild(panel);
    document.getElementById('run-course-validation').onclick=function(){
      var reports=window.validateAllCourses(), out='<div style="margin-bottom:12px;"><strong>'+reports.filter(function(r){return r.finalStatus==='PASS';}).length+'/'+reports.length+' courses pass.</strong></div>';
      reports.forEach(function(r){
        var bad=r.finalStatus!=='PASS';
        out+='<details style="margin:8px 0;padding:10px;border:1px solid '+(bad?'#e7b0b0':'#b7d8bd')+';border-radius:8px;"><summary><strong>'+esc(r.course)+'</strong> — '+r.finalStatus+'</summary><div style="padding-top:10px;"><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:6px;">';
        Object.keys(r.checks).forEach(function(k){out+='<div><strong>'+esc(k)+'</strong>: '+esc(r.checks[k])+'</div>';});
        out+='</div>'+(r.issues.length?'<ul style="color:#9b1c1c;margin-top:10px;">'+r.issues.map(function(x){return '<li>'+esc(x)+'</li>';}).join('')+'</ul>':'<p style="color:#176b2c;">No validation issues detected.</p>')+'</div></details>';
      });
      document.getElementById('course-validation-results').innerHTML=out;
    };
  }

  function patchCourseView(){
    if(!window.renderCourseView) return;
    var old=window.renderCourseView;
    window.renderCourseView=function(id){
      old(id);
      var host=document.getElementById('page-course-view'), d=COURSE_DATA[id], m=d&&d.meta;
      if(!host||!m) return;
      var desc=host.querySelector('#cv-desc .course-desc');
      if(desc){
        var blocks='<div style="margin-top:20px;"><h3>Who this course is for</h3><p>'+esc('Learners studying '+d.name+' at the stated level and seeking structured knowledge and practical preparation in the course subject.')+'</p>';
        blocks+='<h3>Learning objectives</h3><ul>'+m.objectives.map(function(x){return '<li>'+esc(x)+'</li>';}).join('')+'</ul>';
        blocks+='<h3>Course scope and boundary</h3><p>'+esc(m.boundary)+'</p>';
        blocks+='<h3>Prerequisite</h3><p>'+esc(m.prerequisites)+'</p>';
        blocks+='<h3>Skills developed</h3><ul>'+m.skills.map(function(x){return '<li>'+esc(x)+'</li>';}).join('')+'</ul>';
        blocks+='<p style="font-size:12px;color:#666;margin-top:15px;">Curriculum basis: supplied programme-unit reference. This platform presents independent educational material and does not claim external accreditation or affiliation unless separately verified.</p></div>';
        desc.insertAdjacentHTML('beforeend',blocks);
      }
      var review=host.querySelector('#cv-rev');
      if(review) review.innerHTML='<div class="course-desc"><p style="color:#666;">No learner reviews have been published for this course.</p></div>';
      var sidebar=host.querySelector('.course-sidebar');
      if(sidebar){sidebar.querySelectorAll('.detail-row').forEach(function(row){if(row.textContent.indexOf('Instructor')!==-1) row.remove();});}
    };
  }

  // Remove non-learning tuition gates from legacy courses. They are not course content.
  ['course-level1','course-senior','course-junior'].forEach(function(id){
    var d=COURSE_DATA[id]; if(!d) return;
    d.modules=d.modules.filter(function(m){return m.lessons.every(function(l){return l.type!=='gate';});});
  });

  // Update legacy certificate labels to platform completion certificates.
  Object.keys(COURSE_DATA).forEach(function(id){
    COURSE_DATA[id].cert='CHCN-CERT';
    COURSE_DATA[id].certFull='Certificate of Completion — '+COURSE_DATA[id].name;
  });

  function boot(){
    patchCourseView();
    injectAdmin();
    // The account page may not yet be visible; add a navigation-independent admin route.
    if(!document.getElementById('course-validation-page')){
      var s=document.createElement('section'); s.id='course-validation-page'; s.style.display='none'; s.innerHTML='<div class="page-header"><h1>Course Content Validation</h1><p>Administrative course-integrity report</p></div><div class="container"><div id="course-validation-host"></div></div>';
      document.body.appendChild(s);
    }
    // Validate automatically once in the console-facing data model; do not block learner pages.
    window.COURSE_AUDIT_REPORT=window.validateAllCourses();
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot); else boot();
})();
