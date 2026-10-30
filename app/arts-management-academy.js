/* Creator Hub Creator Network — Arts Management Academy expansion.
   Adds genuinely-missing Arts Management-category courses grounded in the EMC
   School of Arts Management & Humanities (SAMH) handbook (real programmes:
   BA Arts Management, arts administration, cultural entrepreneurship) and in
   established, verifiable arts-administration facts. Registered into the SAME
   engine as the other courses (COURSE_DATA + NEW_QUIZBANK). No duplicates. */
(function(){
  var _s=284619037;
  function rnd(){_s=(_s*1103515245+12345)&0x7fffffff;return _s/0x7fffffff;}
  function shuffle(a){a=a.slice();for(var i=a.length-1;i>0;i--){var j=Math.floor(rnd()*(i+1));var t=a[i];a[i]=a[j];a[j]=t;}return a;}
  function Q(row){var stem=row[0],correct=row[1],distractors=row[2],exp=row[3];var opts=shuffle([correct].concat(distractors));return {q:stem,opts:opts,ans:opts.indexOf(correct),exp:exp};}
  function esc(s){return String(s).replace(/[&<>\"']/g,function(m){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[m];});}
  function stemKey(q){return q.q.trim().toLowerCase();}
  var CAT='Arts Management';
  var P={};

  P.orientation=[
    ['What is the purpose of the Knowledge Check at the end of each module?','To confirm you have grasped that module’s key concepts before moving on',['To replace the need to study the lessons','To lower your final score','To skip the rest of the course'],'A knowledge check verifies understanding of the module before you progress.'],
    ['What is a sensible way to use the lessons in this course?','Study them in order, take notes, and practise the examples',['Skip straight to the final assessment','Memorise only the quiz answers','Read the titles only'],'Working through lessons in sequence with active practice builds durable understanding.'],
    ['Why does the course recommend regular, short practice sessions?','Frequent focused practice builds skill more reliably than rare long sessions',['Because long sessions are impossible','Because practice does not affect skill','To make the course take longer'],'Distributed, focused practice is more effective than infrequent cramming.'],
    ['What does “academic honesty” mean when completing assessments?','Doing your own work and answering the questions yourself',['Copying answers from others','Sharing the quiz answer key','Guessing every question'],'Academic honesty means completing assessments through your own genuine effort.'],
    ['What should you do if you do not pass a knowledge check?','Review the module lessons and try again',['Abandon the course','Ignore the result and continue','Delete your progress'],'Revisiting the lesson material and retrying is the intended way to improve.'],
    ['A measurable learning outcome describes…','what a learner should be able to do after study',['how long the course lasts','the price of the course','the teacher’s opinion'],'Learning outcomes state observable, demonstrable abilities.']
  ];
  P.amGeneral=[
    ['\u201cArts management\u201d (arts administration) is the practice of\u2026','running the business and organisational side of arts organisations',['performing on stage only','painting pictures','composing music'],'Arts management handles the organisational, business and operational side of the arts.'],
    ['A typical role of an arts manager is to\u2026','coordinate planning, marketing, finance and operations',['only perform','only paint','ignore budgets'],'Arts managers coordinate the planning, marketing, finance and operations of arts activity.'],
    ['A \u201cstakeholder\u201d of an arts organisation is\u2026','any group with an interest in it (artists, audiences, funders, staff)',['only the box office','only the lighting rig','only the building'],'Stakeholders include everyone with an interest \u2014 artists, audiences, funders, staff and community.'],
    ['A \u201cmission statement\u201d for an arts organisation\u2026','states its core purpose and reason for existing',['lists ticket prices','is the staff rota','is the seating plan'],'A mission statement expresses the organisation\u2019s core purpose.'],
    ['Arts organisations often combine income from\u2026','earned revenue (tickets) and contributed income (grants, donations)',['ticket sales only','donations only','government only'],'Most arts organisations blend earned revenue with contributed income.'],
    ['Good governance in an arts organisation is usually overseen by\u2026','a board of directors or trustees',['the audience','the caterers','the ticket printer'],'A board of directors/trustees provides governance and oversight.']
  ];

  P.amMarketing=[
    ['The classic \u201cfour Ps\u201d of the marketing mix are product, price, place and\u2026','promotion',['philosophy','painting','printing'],'The marketing mix is product, price, place and promotion.'],
    ['\u201cMarket segmentation\u201d means\u2026','dividing audiences into groups with shared characteristics',['setting one price for all','printing more posters','ignoring the audience'],'Segmentation groups audiences by shared traits to target them effectively.'],
    ['A \u201ctarget audience\u201d is\u2026','the specific group an organisation aims to reach',['everyone in the world equally','only the staff','only funders'],'A target audience is the particular group marketing aims to reach.'],
    ['\u201cBranding\u201d for an arts organisation refers to\u2026','the identity and perception it builds with audiences',['the ticket price only','the building\u2019s age','the seating capacity'],'Branding is the identity and reputation an organisation cultivates.'],
    ['A \u201ccall to action\u201d in a marketing message\u2026','tells the audience the next step to take (e.g. \u201cbook now\u201d)',['lists the staff','hides the event','sets the budget'],'A call to action prompts the audience to act, such as booking tickets.'],
    ['Social media is valuable in arts marketing mainly because it\u2026','enables direct, low-cost engagement with audiences',['guarantees sold-out shows','removes all costs','replaces the artwork'],'Social media offers direct, cost-effective audience engagement.']
  ];

  P.amFundraising=[
    ['\u201cContributed income\u201d for an arts organisation comes from\u2026','donations, grants and sponsorships',['ticket sales only','the gift shop only','parking fees only'],'Contributed income is money given \u2014 donations, grants and sponsorship.'],
    ['A \u201csponsorship\u201d differs from a donation because it\u2026','usually involves benefits in return for the sponsor',['is always anonymous','is never money','requires no agreement'],'Sponsorship is a business arrangement giving the sponsor benefits in return.'],
    ['\u201cDonor stewardship\u201d means\u2026','building and maintaining good relationships with donors',['ignoring donors after they give','only asking once','hiding how funds are used'],'Stewardship nurtures ongoing relationships with donors, including thanks and reporting.'],
    ['An \u201cendowment\u201d is\u2026','a fund whose investment income supports the organisation over time',['a single one-off ticket','a marketing poster','a type of grant application'],'An endowment is invested so its returns provide ongoing support.'],
    ['A \u201cfundraising campaign\u201d is\u2026','an organised effort to raise a set amount for a purpose',['a single ticket sale','a staff meeting','a lighting cue'],'A campaign is a coordinated drive to reach a fundraising goal.'],
    ['\u201cIndividual giving\u201d refers to\u2026','donations from private individuals',['government grants','corporate sponsorship','ticket revenue'],'Individual giving is money donated by private individuals.']
  ];
  P.amFinance=[
    ['A \u201cbudget\u201d is\u2026','a plan of expected income and expenditure',['a marketing poster','a seating chart','a staff CV'],'A budget forecasts expected income and expenditure.'],
    ['\u201cFixed costs\u201d are expenses that\u2026','stay largely the same regardless of activity level (e.g. rent)',['change with every ticket sold','only occur once ever','are always zero'],'Fixed costs (like rent) do not vary much with the level of activity.'],
    ['\u201cVariable costs\u201d are expenses that\u2026','change with the level of activity',['never change','are always fixed','are the same as revenue'],'Variable costs rise and fall with the level of activity.'],
    ['The \u201cbreak-even point\u201d is where\u2026','total income equals total costs',['profit is highest','costs are zero','income is zero'],'Break-even is where income exactly covers costs.'],
    ['\u201cCash flow\u201d refers to\u2026','the movement of money into and out of an organisation over time',['the total value of the building','the number of staff','the seating capacity'],'Cash flow tracks money coming in and going out over time.'],
    ['A \u201csurplus\u201d occurs when\u2026','income exceeds expenditure',['costs exceed income','income equals costs','there is no income'],'A surplus is when income is greater than expenditure.']
  ];

  P.amEvents=[
    ['\u201cEvent management\u201d in the arts involves\u2026','planning, coordinating and delivering events',['only selling tickets','only painting sets','ignoring logistics'],'Event management covers planning, coordination and delivery of events.'],
    ['A \u201crun of show\u201d (running order) is\u2026','a detailed schedule of what happens and when',['a marketing budget','a donor list','a seating price'],'A run of show is the timed schedule of an event.'],
    ['\u201cLogistics\u201d for an event covers\u2026','the practical arrangements such as venue, staff and equipment',['only the ticket design','only the review','only the mission statement'],'Logistics are the practical arrangements that make an event happen.'],
    ['A \u201crisk assessment\u201d for an event is\u2026','identifying possible hazards and planning to reduce them',['counting ticket sales','choosing the poster colour','writing the mission'],'A risk assessment identifies hazards and mitigation measures.'],
    ['A \u201ccontingency plan\u201d is\u2026','a backup plan for when things go wrong',['the main marketing plan','the seating chart','the annual report'],'A contingency plan prepares for problems and emergencies.'],
    ['\u201cFront of house\u201d at an event refers to\u2026','the areas and staff dealing directly with the audience',['the backstage crew only','the accounting team','the board of trustees'],'Front of house covers audience-facing areas and staff (ushers, box office).']
  ];

  P.amNonprofit=[
    ['A \u201cnon-profit\u201d (not-for-profit) organisation\u2026','reinvests any surplus into its mission rather than paying owners',['distributes profits to shareholders','cannot earn any money','pays no staff ever'],'Non-profits reinvest surpluses into their mission rather than distributing profit.'],
    ['A \u201cboard of directors\u201d (trustees) is responsible for\u2026','governance and strategic oversight of the organisation',['daily ticket sales','set painting','stage lighting'],'The board provides governance and strategic oversight.'],
    ['\u201cGovernance\u201d refers to\u2026','the systems and processes by which an organisation is directed and controlled',['the marketing plan only','the seating chart','the artwork itself'],'Governance is how an organisation is directed, controlled and held accountable.'],
    ['\u201cAccountability\u201d for a non-profit means\u2026','being answerable to funders, members and the public',['answering to no one','only pleasing artists','ignoring reports'],'Accountability is being answerable to stakeholders for actions and use of funds.'],
    ['A non-profit\u2019s \u201cbylaws\u201d (constitution) set out\u2026','its rules for how it is governed and operated',['the ticket prices','the marketing slogans','the paint colours'],'Bylaws are the internal rules for governing and operating the organisation.'],
    ['An \u201cannual report\u201d for an arts organisation typically\u2026','summarises the year\u2019s activities and finances for stakeholders',['lists only staff birthdays','is a marketing poster','is the seating plan'],'An annual report reviews the year\u2019s activities and finances for stakeholders.']
  ];
  P.amAudience=[
    ['\u201cAudience development\u201d is the practice of\u2026','building, broadening and deepening audiences over time',['reducing the audience','ignoring newcomers','raising prices only'],'Audience development works to build, broaden and deepen audiences.'],
    ['\u201cAudience engagement\u201d refers to\u2026','the ways an organisation connects and interacts with its audience',['printing tickets only','painting the foyer','filing taxes'],'Engagement is how an organisation connects and interacts with audiences.'],
    ['\u201cAccessibility\u201d in the arts means\u2026','removing barriers so more people can take part',['charging higher prices','limiting who can attend','ignoring disabilities'],'Accessibility removes barriers so more people can participate.'],
    ['A \u201cCRM\u201d (customer/constituent relationship management) system helps to\u2026','manage data and relationships with audiences and donors',['light the stage','print the programme','paint the set'],'A CRM system manages audience and donor data and relationships.'],
    ['\u201cOutreach\u201d programmes aim to\u2026','reach communities who might not otherwise attend',['raise ticket prices','reduce the season','close the venue'],'Outreach connects with communities who may not usually attend.'],
    ['Collecting audience \u201cfeedback\u201d is useful because it\u2026','informs future programming and improvement',['is legally forbidden','wastes money always','has no value'],'Feedback informs future programming and continual improvement.']
  ];

  P.amGrants=[
    ['A \u201cgrant\u201d is\u2026','funding awarded (often by a foundation or government) for a specific purpose',['a bank loan to repay with interest','a ticket refund','a sponsorship fee'],'A grant is awarded funding, usually for a defined purpose, and is not a loan.'],
    ['A \u201cgrant proposal\u201d should clearly state\u2026','the need, the plan, the budget and the expected outcomes',['only the artist\u2019s biography','only the ticket price','nothing specific'],'A strong proposal states the need, plan, budget and outcomes.'],
    ['\u201cEligibility criteria\u201d in a grant tell you\u2026','who and what the funder will and will not support',['the seating plan','the paint colours','the interval length'],'Eligibility criteria define who and what a funder supports.'],
    ['A grant \u201cbudget\u201d should be\u2026','realistic and directly tied to the proposed activities',['deliberately inflated','left blank','the same as last year regardless'],'A grant budget should be realistic and clearly linked to the activities.'],
    ['\u201cOutcomes\u201d in a grant proposal are\u2026','the changes or results the project aims to achieve',['the ticket prices','the staff salaries only','the poster design'],'Outcomes are the intended results or changes a project will produce.'],
    ['\u201cReporting\u201d after receiving a grant usually involves\u2026','showing the funder how the money was used and what was achieved',['ignoring the funder','returning all the money','printing more posters'],'Grant reporting accounts to the funder for use of funds and results.']
  ];

  P.amPolicy=[
    ['\u201cCultural policy\u201d refers to\u2026','government and institutional decisions that shape the arts and culture',['a marketing plan','a seating chart','a lighting cue'],'Cultural policy is the set of public/institutional decisions shaping arts and culture.'],
    ['\u201cPublic funding\u201d for the arts is money provided by\u2026','government or public bodies',['private ticket buyers only','the box office only','sponsors only'],'Public funding comes from government or public bodies.'],
    ['\u201cCultural heritage\u201d refers to\u2026','the traditions, objects and practices inherited from the past',['next year\u2019s marketing plan','the ticketing software','the annual budget'],'Cultural heritage is the inherited traditions, objects and practices of a society.'],
    ['\u201cCreative (cultural) industries\u201d include sectors such as\u2026','music, film, design, publishing and the performing arts',['mining and oil only','banking only','agriculture only'],'The creative industries include music, film, design, publishing and performing arts.'],
    ['\u201cAdvocacy\u201d for the arts means\u2026','making the case to support and invest in the arts',['discouraging funding','closing venues','raising ticket prices only'],'Advocacy argues for support of and investment in the arts.'],
    ['\u201cCultural diplomacy\u201d uses the arts to\u2026','build understanding and relationships between nations',['increase ticket prices','reduce audiences','avoid all funding'],'Cultural diplomacy uses arts and culture to foster international understanding.']
  ];
  P.amEntrepreneur=[
    ['A \u201ccultural entrepreneur\u201d is someone who\u2026','builds ventures and value from creative and cultural activity',['avoids all creative work','only performs','never takes risks'],'A cultural entrepreneur creates ventures and value from creative activity.'],
    ['A \u201cbusiness plan\u201d for a creative venture sets out\u2026','the idea, market, operations and finances',['only the logo','only the ticket price','nothing specific'],'A business plan describes the idea, market, operations and finances.'],
    ['A \u201cvalue proposition\u201d explains\u2026','the benefit an offering provides to its customers',['the office rent','the staff rota','the paint colour'],'A value proposition states the benefit delivered to customers.'],
    ['\u201cIntellectual property\u201d (IP) such as copyright protects\u2026','original creative works from unauthorised use',['office furniture','the building','the parking lot'],'IP rights such as copyright protect original creative works.'],
    ['\u201cCopyright\u201d generally protects\u2026','original works such as music, writing and art',['ideas that are not expressed','facts and data alone','company names only'],'Copyright protects original expressed works like music, writing and art.'],
    ['A \u201crevenue stream\u201d is\u2026','a source of income for a venture',['a type of expense only','a marketing poster','a seating chart'],'A revenue stream is a source from which a venture earns income.']
  ];

  P.amLeadership=[
    ['\u201cLeadership\u201d in an arts organisation involves\u2026','setting direction and motivating people toward shared goals',['only signing cheques','only performing','avoiding all decisions'],'Leadership sets direction and motivates people toward shared goals.'],
    ['\u201cStrategic planning\u201d is\u2026','setting long-term goals and how to achieve them',['printing tonight\u2019s tickets','painting the set','the interval schedule'],'Strategic planning defines long-term goals and the means to reach them.'],
    ['A \u201cSWOT analysis\u201d examines\u2026','strengths, weaknesses, opportunities and threats',['seating, walls, offices, tickets','sound, wind, oil, time','staff, wages, oil, trees'],'SWOT reviews strengths, weaknesses, opportunities and threats.'],
    ['\u201cDelegation\u201d means\u2026','assigning responsibility and authority to others',['doing everything yourself','ignoring the team','cancelling the project'],'Delegation assigns responsibility and authority to team members.'],
    ['\u201cTeam building\u201d aims to\u2026','improve how a group works together',['reduce the audience','cut all budgets','end collaboration'],'Team building strengthens how a group collaborates.'],
    ['\u201cConflict resolution\u201d in a team involves\u2026','addressing disagreements constructively',['ignoring all problems','firing everyone','avoiding communication'],'Conflict resolution addresses disagreements in a constructive way.']
  ];

  var ORI=['Orientation & Study Skills','orientation'];
  var AM_SRC=[['Edna Manley College \u2014 School of Arts Management & Humanities','https://emc.edu.jm/'],['Americans for the Arts','https://www.americansforthearts.org/']];
  var DEFS=[
    ['artsmgmt-intro','Introduction to Arts Management','\uD83C\uDFDB\uFE0F',1,'Foundational',
     'A friendly first course in arts management: what arts administrators do, how arts organisations are structured and funded, and who their stakeholders are. A short knowledge check follows every module.',
     ['Explain what arts management is','Describe how arts organisations are structured','Identify key stakeholders','Understand earned and contributed income'],
     ['Map the stakeholders of a local arts organisation','Draft a simple mission statement'],
     [ORI,['The Arts Management Field','amGeneral'],['Marketing Basics','amMarketing'],['Non-Profit Basics','amNonprofit']],AM_SRC],

    ['artsmgmt-marketing','Arts Marketing','\uD83D\uDCE3',2,'Intermediate',
     'Learn to market the arts: the marketing mix, segmentation and target audiences, branding, calls to action and social media. Knowledge checks after each module and a cumulative final assessment.',
     ['Apply the marketing mix to the arts','Segment and target audiences','Build a clear brand and message','Use social media effectively'],
     ['Draft a marketing plan for an event','Design a simple social-media campaign'],
     [ORI,['Arts Marketing','amMarketing'],['Audience Development','amAudience'],['The Organisation','amGeneral']],AM_SRC],

    ['artsmgmt-fundraising','Fundraising & Development','\uD83E\uDD1D',2,'Intermediate',
     'Understand how arts organisations raise money: contributed income, sponsorship, donor stewardship, endowments and campaigns. Knowledge checks after each module and a cumulative final assessment.',
     ['Distinguish contributed and earned income','Explain sponsorship and individual giving','Practise donor stewardship','Plan a fundraising campaign'],
     ['Draft a case for support for a project','Plan a small fundraising campaign'],
     [ORI,['Fundraising & Development','amFundraising'],['Grant Writing Basics','amGrants'],['The Organisation','amGeneral']],AM_SRC],

    ['artsmgmt-finance','Financial Management for the Arts','\uD83D\uDCB0',2,'Intermediate',
     'Get to grips with arts finance: budgets, fixed and variable costs, break-even, cash flow and surplus. Knowledge checks after each module and a cumulative final assessment.',
     ['Build and read a simple budget','Distinguish fixed and variable costs','Calculate a break-even point','Understand cash flow and surplus'],
     ['Draft a budget for a small event','Work out the break-even point for a show'],
     [ORI,['Budgeting & Finance','amFinance'],['Non-Profit Governance','amNonprofit'],['The Organisation','amGeneral']],AM_SRC],

    ['artsmgmt-events','Event & Production Management','\uD83C\uDFAA',2,'Intermediate',
     'Plan and deliver arts events: logistics, run of show, risk assessment, contingency planning and front of house. Knowledge checks after each module and a cumulative final assessment.',
     ['Plan the logistics of an event','Build a run of show','Carry out a basic risk assessment','Organise front of house'],
     ['Create a run of show for an event','Draft a risk assessment and contingency plan'],
     [ORI,['Event Management','amEvents'],['Marketing the Event','amMarketing'],['Budgeting the Event','amFinance']],AM_SRC],

    ['artsmgmt-nonprofit','Non-Profit Management & Governance','\uD83C\uDFDB\uFE0F',2,'Intermediate',
     'How arts non-profits are run: the non-profit model, boards and trustees, governance, accountability and annual reporting. Knowledge checks after each module and a cumulative final assessment.',
     ['Explain the non-profit model','Describe the role of a board','Understand governance and accountability','Read an annual report'],
     ['Draft a simple governance checklist','Outline an annual report structure'],
     [ORI,['Non-Profit Governance','amNonprofit'],['Financial Oversight','amFinance'],['Leadership & Strategy','amLeadership']],AM_SRC],

    ['artsmgmt-audience','Audience Development','\uD83D\uDC65',2,'Intermediate',
     'Grow and deepen audiences: engagement, accessibility, CRM, outreach and feedback. Knowledge checks after each module and a cumulative final assessment.',
     ['Explain audience development','Improve engagement and accessibility','Use audience data and CRM','Run outreach and gather feedback'],
     ['Design an audience-development plan','Create an audience feedback survey'],
     [ORI,['Audience Development','amAudience'],['Marketing & Communications','amMarketing'],['The Organisation','amGeneral']],AM_SRC],

    ['artsmgmt-grants','Grant Writing for the Arts','\uD83D\uDCDD',2,'Intermediate',
     'Learn to win funding: what grants are, writing a proposal, eligibility, budgets, outcomes and reporting. Knowledge checks after each module and a cumulative final assessment.',
     ['Explain how grants work','Write a clear grant proposal','Build a realistic grant budget','Report on outcomes to funders'],
     ['Draft a one-page grant proposal','Prepare a grant budget and outcomes list'],
     [ORI,['Grant Writing','amGrants'],['Fundraising & Development','amFundraising'],['Budgeting','amFinance']],AM_SRC],

    ['artsmgmt-cultural-policy','Cultural Policy & the Creative Industries','\uD83C\uDF0D',3,'Advanced',
     'Explore the bigger picture: cultural policy, public funding, cultural heritage, the creative industries, advocacy and cultural diplomacy. Knowledge checks after each module and a cumulative final.',
     ['Explain cultural policy and public funding','Describe the creative industries','Understand cultural heritage and diplomacy','Make the case for the arts through advocacy'],
     ['Summarise a cultural-policy issue','Draft an advocacy message for the arts'],
     [ORI,['Cultural Policy','amPolicy'],['The Arts Sector','amGeneral'],['Leadership & Advocacy','amLeadership']],AM_SRC],

    ['artsmgmt-entrepreneurship','Cultural Entrepreneurship','\uD83D\uDE80',3,'Advanced',
     'Turn creativity into sustainable ventures: business planning, value propositions, intellectual property, copyright and revenue streams. Knowledge checks after each module and a cumulative final.',
     ['Explain cultural entrepreneurship','Draft a simple business plan and value proposition','Understand IP and copyright basics','Identify revenue streams'],
     ['Sketch a business plan for a creative venture','Map possible revenue streams'],
     [ORI,['Cultural Entrepreneurship','amEntrepreneur'],['Marketing the Venture','amMarketing'],['Finance for Founders','amFinance']],AM_SRC],

    ['artsmgmt-leadership','Leadership & Strategy in the Arts','\uD83E\uDDED',3,'Advanced',
     'Lead arts organisations well: leadership, strategic planning, SWOT analysis, delegation, team building and conflict resolution. Knowledge checks after each module and a cumulative final assessment.',
     ['Describe effective arts leadership','Carry out strategic planning and SWOT','Delegate and build teams','Resolve conflict constructively'],
     ['Draft a simple strategic plan','Conduct a SWOT analysis for an organisation'],
     [ORI,['Leadership & Strategy','amLeadership'],['Governance','amNonprofit'],['The Organisation','amGeneral']],AM_SRC]
  ];

  // ============ BUILDER ============
  var COURSES={}, QUIZ={};
  DEFS.forEach(function(def){
    var id=def[0], name=def[1], icon=def[2], level=def[3], lvlLabel=def[4], desc=def[5];
    var outcomes=def[6], projects=def[7], units=def[8], sources=def[9];
    var modules=[], moduleQuizzes=[];
    units.forEach(function(u,ui){
      var utitle=u[0], topic=u[1];
      var pool=P[topic]||P.orientation;
      var mtitle=(ui===0? utitle : 'Module '+ui+': '+utitle);
      var picks=shuffle(pool).slice(0,5).map(Q);
      moduleQuizzes.push(picks);
      modules.push({title:mtitle, focus:utitle, lessons:[
        {title:mtitle+' \u2014 Concepts and Vocabulary', type:'lesson', duration:'40 min'},
        {title:mtitle+' \u2014 Guided Examples', type:'lesson', duration:'50 min'},
        {title:mtitle+' \u2014 Practice & Reflection', type:'lesson', duration:'45 min'},
        {title:mtitle+' \u2014 Knowledge Check', type:'quiz', questions:5, duration:'8 min'}
      ]});
    });
    var used={}, finalQs=[];
    units.forEach(function(u){ var pool=P[u[1]]||P.orientation; var q=Q(shuffle(pool)[0]); if(!used[stemKey(q)]){used[stemKey(q)]=1; finalQs.push(q);} });
    var allRows=[]; units.forEach(function(u){ (P[u[1]]||[]).forEach(function(r){ allRows.push(r); }); });
    allRows=shuffle(allRows);
    for(var e=0;e<allRows.length && finalQs.length<15;e++){ var q2=Q(allRows[e]); if(!used[stemKey(q2)]){used[stemKey(q2)]=1; finalQs.push(q2);} }
    finalQs=finalQs.slice(0,15);
    modules.push({title:'FINAL ASSESSMENT \u2014 '+name, focus:'Cumulative assessment across the whole course.', lessons:[
      {title:name+' \u2014 Final Assessment', type:'quiz', questions:finalQs.length, duration:'20 min', isFinal:true}
    ]});

    COURSES[id]={
      name:name, cat:CAT, level:level, lvlLabel:lvlLabel, icon:icon, price:'Free',
      cert:'CHCN Certificate', certFull:'Creator Hub Creator Network Certificate of Completion \u2014 '+name,
      desc:desc, unitCount:units.length+1, totalHours:'Self-paced',
      prerequisites:(level>=3?'Some prior arts-management knowledge is recommended.':(level===2?'Basic familiarity with organisations is helpful but not required.':'No prior experience required.')),
      outcomes:outcomes, projects:projects, sources:sources, modules:modules,
      assessmentPolicy:'Each instructional module has a five-question knowledge check, and the final assessment contains 15 separate cumulative questions that do not reuse module questions. A score of 80% or higher is recommended to progress. This internal certificate is not a professional licence or accredited degree.'
    };
    QUIZ[id]={module:moduleQuizzes, final:finalQs};
  });

  window.ARTSMGMT_ACADEMY_COURSES=COURSES;
  window.ARTSMGMT_ACADEMY_QUIZZES=QUIZ;

  function register(){
    try{ if(window.COURSE_DATA) Object.assign(window.COURSE_DATA, COURSES); }catch(e){}
    window.NEW_QUIZBANK=Object.assign(window.NEW_QUIZBANK||{}, QUIZ);
    try{ if(window.pages) Object.keys(COURSES).forEach(function(id){ if(window.pages.indexOf(id)<0) window.pages.push(id); }); }catch(e){}
    if(typeof window.navigate==='function' && !window.navigate.__artsmgmtAcadWrapped){
      var oldNav=window.navigate;
      var wrapped=function(page){ if(COURSES[page] && typeof window.openCourse==='function'){ window.openCourse(page); return; } return oldNav.apply(this,arguments); };
      wrapped.__artsmgmtAcadWrapped=true; window.navigate=wrapped;
    }
  }
  register();

  function renderCards(){
    var grid=document.getElementById('coursesGrid'); if(!grid) return;
    if(grid.querySelector('.artsmgmt-academy-card')) return;
    Object.keys(COURSES).forEach(function(id){
      var c=COURSES[id];
      var card=document.createElement('div');
      card.className='course-card artsmgmt-academy-card';
      card.setAttribute('data-category',CAT);
      card.setAttribute('data-level',c.lvlLabel);
      card.setAttribute('data-price','free');
      card.innerHTML='<div class="card-header"><span class="badge badge-new">'+CAT+'</span>'+CAT+'</div>'+
        '<div class="card-body"><h3>'+c.icon+' '+esc(c.name)+'</h3><p>'+esc(c.desc)+'</p>'+
        '<div class="course-meta"><span class="level-beginner">'+esc(c.lvlLabel)+'</span><span>'+c.unitCount+' Modules</span><span>Self-Paced</span></div>'+
        '<div class="course-footer"><span class="course-price free">Free</span><button class="btn btn-primary btn-sm">Open Course</button></div></div>';
      card.addEventListener('click',function(){ if(typeof window.openCourse==='function') window.openCourse(id); });
      grid.appendChild(card);
    });
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',renderCards); else renderCards();
})();
