/* Creator Hub Creator Network — Dance Academy expansion.
   Adds genuinely-missing Dance-category courses grounded in the EMC School of
   Dance handbook (real programmes: BA Dance Education, BFA Performance &
   Choreography, BFA Traditional & Folk Dance Studies, Certificate in
   Fundamentals of Dance Technique, AA Dance Performance) and in established,
   verifiable dance-education facts. Registered into the SAME engine as the
   other courses (COURSE_DATA + NEW_QUIZBANK). No duplicates, no fabrication. */
(function(){
  var _s=774411229;
  function rnd(){_s=(_s*1103515245+12345)&0x7fffffff;return _s/0x7fffffff;}
  function shuffle(a){a=a.slice();for(var i=a.length-1;i>0;i--){var j=Math.floor(rnd()*(i+1));var t=a[i];a[i]=a[j];a[j]=t;}return a;}
  function Q(row){var stem=row[0],correct=row[1],distractors=row[2],exp=row[3];var opts=shuffle([correct].concat(distractors));return {q:stem,opts:opts,ans:opts.indexOf(correct),exp:exp};}
  function esc(s){return String(s).replace(/[&<>\"']/g,function(m){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[m];});}
  function stemKey(q){return q.q.trim().toLowerCase();}
  var CAT='Dance';
  var P={};

  P.orientation=[
    ['What is the purpose of the Knowledge Check at the end of each module?','To confirm you have grasped that module\u2019s key concepts before moving on',['To replace the need to study the lessons','To lower your final score','To skip the rest of the course'],'A knowledge check verifies understanding of the module before you progress.'],
    ['What is a sensible way to use the lessons in this course?','Study them in order, take notes, and practise the examples',['Skip straight to the final assessment','Memorise only the quiz answers','Read the titles only'],'Working through lessons in sequence with active practice builds durable understanding.'],
    ['Why does the course recommend regular, short practice sessions?','Frequent focused practice builds skill more reliably than rare long sessions',['Because long sessions are impossible','Because practice does not affect skill','To make the course take longer'],'Distributed, focused practice is more effective than infrequent cramming.'],
    ['What does \u201cacademic honesty\u201d mean when completing assessments?','Doing your own work and answering the questions yourself',['Copying answers from others','Sharing the quiz answer key','Guessing every question'],'Academic honesty means completing assessments through your own genuine effort.'],
    ['What should you do if you do not pass a knowledge check?','Review the module lessons and try again',['Abandon the course','Ignore the result and continue','Delete your progress'],'Revisiting the lesson material and retrying is the intended way to improve.'],
    ['A measurable learning outcome describes\u2026','what a learner should be able to do after study',['how long the course lasts','the price of the course','the teacher\u2019s opinion'],'Learning outcomes state observable, demonstrable abilities.']
  ];
  P.danceModern=[
    ['Modern dance developed in the early 20th century largely as a reaction against\u2026','the strict rules and conventions of classical ballet',['jazz music','folk dancing','opera'],'Modern dance arose as an expressive alternative to the formality of classical ballet.'],
    ['Martha Graham is regarded as a pioneer of\u2026','American modern dance',['classical ballet','ballroom dance','tap dance'],'Martha Graham was a foundational figure in American modern dance.'],
    ['The Graham technique is built around the principles of\u2026','contraction and release',['turnout and pointe work','tap and shuffle','ballroom hold'],'Graham technique centres on the contraction and release of the torso.'],
    ['The Horton technique of modern dance was developed by\u2026','Lester Horton',['George Balanchine','Marius Petipa','Bob Fosse'],'Lester Horton created the Horton technique used widely in modern dance training.'],
    ['Modern and contemporary dancers most often perform\u2026','barefoot',['in pointe shoes','in tap shoes','in ballroom heels'],'Modern dance is characteristically performed barefoot.'],
    ['\u201cFloorwork\u201d in modern dance refers to\u2026','movement performed on or close to the floor',['dancing only on pointe','marching in formation','dancing on a raised platform only'],'Floorwork uses the floor as a surface for movement rather than staying upright.'],
    ['\u201cRelease technique\u201d emphasises\u2026','using minimal effort, breath and the natural flow of the body',['maximum muscular tension at all times','strict balletic turnout','fixed, rigid posture'],'Release technique works with gravity, breath and ease of movement.']
  ];

  P.danceBallet=[
    ['How many basic positions of the feet are there in classical ballet?','Five',['Three','Seven','Ten'],'Classical ballet is built on five basic positions of the feet.'],
    ['Ballet terminology is traditionally given in which language?','French',['Italian','Latin','Russian'],'The vocabulary of classical ballet is traditionally French.'],
    ['In ballet, \u201cpli\u00e9\u201d means\u2026','to bend (the knees)',['to jump','to turn','to point the foot'],'Pli\u00e9 means to bend, a fundamental bending of the knees.'],
    ['\u201cTurnout\u201d in ballet refers to\u2026','rotation of the legs outward from the hips',['bending forward at the waist','turning the head only','pointing the toes down'],'Turnout is the outward rotation of the legs originating at the hip joint.'],
    ['A \u201cpirouette\u201d is\u2026','a turn of the body on one leg',['a small jump','a stretch of the foot','a bow'],'A pirouette is a rotation performed on a single supporting leg.'],
    ['\u201cTendu\u201d means\u2026','stretched \u2014 sliding the foot along the floor until fully extended',['bent at the knee','jumped in the air','turned inward'],'Battement tendu stretches the foot along the floor to a pointed position.'],
    ['The \u201cbarre\u201d is used at the start of a ballet class to\u2026','warm up and build technique while providing support for balance',['store costumes','mark the audience line','measure the stage'],'Barre work warms the body and develops technique with support for balance.']
  ];

  P.danceImprov=[
    ['Dance improvisation is best described as\u2026','spontaneous movement created in the moment',['fully choreographed and rehearsed movement','reading dance notation aloud','stretching before class'],'Improvisation is movement invented spontaneously rather than pre-set.'],
    ['A key benefit of improvisation for dancers is that it\u2026','develops creativity and a personal movement vocabulary',['removes the need to ever rehearse','guarantees identical performances','replaces technique training'],'Improvisation builds creativity and each dancer\u2019s own movement language.'],
    ['\u201cContact improvisation\u201d is based on\u2026','movement created through points of physical contact between dancers',['dancing without touching at all','following written choreography','copying a video exactly'],'Contact improvisation generates movement from shared weight and points of contact.'],
    ['Contact improvisation is generally credited to the work of\u2026','Steve Paxton (from 1972)',['Marius Petipa','Louis XIV','Igor Stravinsky'],'Steve Paxton originated contact improvisation in the early 1970s.'],
    ['A movement \u201cscore\u201d in improvisation is\u2026','a set of tasks or guidelines that structure the improvisation',['a printed music sheet','a final grade','a costume plan'],'A score gives structure or prompts to guide an improvisation.'],
    ['Improvisation exercises often help an ensemble to\u2026','build trust, listening and responsiveness between dancers',['avoid ever working together','ignore the other dancers','stop moving'],'Improvisation develops ensemble awareness, trust and responsiveness.']
  ];
  P.danceKinesiology=[
    ['Kinesiology is the study of\u2026','human movement',['musical harmony','stage lighting','costume history'],'Kinesiology is the scientific study of human movement.'],
    ['\u201cAlignment\u201d in dance refers to\u2026','the proper positioning of the body\u2019s segments',['the order of dancers on stage','the colour of costumes','the tempo of the music'],'Good alignment stacks the body\u2019s segments for efficient, safe movement.'],
    ['One of the most effective ways to reduce dance injuries is\u2026','a proper warm-up and ongoing conditioning',['skipping rest days','forcing turnout from the knees','never drinking water'],'Warming up and conditioning the body helps prevent dance injuries.'],
    ['For an acute injury, the RICE guideline stands for\u2026','Rest, Ice, Compression, Elevation',['Run, Ice, Continue, Exercise','Rest, Improvise, Cool, Eat','Rotate, Ice, Compress, Extend'],'RICE \u2014 Rest, Ice, Compression, Elevation \u2014 is standard first care for acute injuries.'],
    ['Forcing turnout from the knees or feet rather than the hips can\u2026','lead to injury',['increase flexibility safely','improve alignment','strengthen the ankles'],'Turnout should come from the hips; forcing it lower risks knee and ankle injury.'],
    ['Core strength is important for dancers mainly because it provides\u2026','stability and control of movement',['louder footwork','brighter costumes','faster music'],'A strong core supports balance, stability and controlled movement.'],
    ['Adequate rest and hydration matter for dancers because they\u2026','aid recovery and help prevent fatigue-related injury',['make dancers taller','change the choreography','replace warming up'],'Rest and hydration support recovery and reduce injury from fatigue.']
  ];

  P.danceCaribbean=[
    ['Kumina is a traditional\u2026','Jamaican ancestral religious dance-and-drumming form',['European court dance','ballet variation','ballroom style'],'Kumina is a Jamaican tradition of ancestral worship expressed through dance and drumming.'],
    ['The Jamaica National Dance Theatre Company (NDTC) was co-founded in 1962 by\u2026','Rex Nettleford',['Martha Graham','Marius Petipa','Alvin Ailey'],'The NDTC was co-founded in 1962 by Rex Nettleford (with Eddy Thomas).'],
    ['Jonkonnu (John Canoe) is a Jamaican\u2026','masquerade parade tradition performed especially around Christmas',['ballet company','type of drum','pointe technique'],'Jonkonnu is a masked Jamaican street-parade tradition linked to the Christmas season.'],
    ['Bruckins is a Jamaican traditional dance associated especially with\u2026','Emancipation celebrations',['Christmas pantomime','ballet recitals','carnival in Brazil'],'Bruckins is performed in connection with the celebration of Emancipation.'],
    ['Caribbean folk dance is most characteristically accompanied by\u2026','drumming',['a symphony orchestra','a pipe organ','no sound at all'],'Drumming is central to the accompaniment of Caribbean folk dance.'],
    ['Dinki Mini is a Jamaican folk form traditionally performed at\u2026','\u201cnine-night\u201d wakes to cheer the bereaved',['royal coronations','ballet examinations','tennis matches'],'Dinki Mini is performed at nine-night wakes to lift the spirits of mourners.']
  ];

  P.danceHistory=[
    ['Isadora Duncan is regarded as a pioneer of\u2026','modern dance',['classical ballet','tap dance','ballroom dance'],'Isadora Duncan was an early pioneer of modern, expressive dance.'],
    ['The score for the ballet \u201cThe Rite of Spring\u201d (1913) was composed by\u2026','Igor Stravinsky',['Pyotr Tchaikovsky','Ludwig van Beethoven','Wolfgang Amadeus Mozart'],'Igor Stravinsky composed The Rite of Spring, premiered in 1913.'],
    ['Marius Petipa is best known as a major choreographer of\u2026','classical (Russian) ballet',['modern dance','hip-hop','flamenco'],'Petipa choreographed classics of Russian ballet such as The Sleeping Beauty.'],
    ['Alvin Ailey founded a celebrated American company known for modern dance rooted in\u2026','the African-American cultural experience',['Renaissance court dance','Japanese noh theatre','Viennese waltz'],'Alvin Ailey American Dance Theater is renowned for celebrating African-American heritage.'],
    ['Rudolf Laban is known for developing\u2026','a system of movement analysis and notation (Labanotation)',['the five ballet positions','the potter\u2019s wheel','the sonata form'],'Laban created influential systems of movement analysis and notation.'],
    ['\u201cChoreography\u201d is\u2026','the art of composing and arranging dance movement',['the study of stage lighting','a type of drum','the box office system'],'Choreography is the composition and arrangement of dance.']
  ];
  P.danceComposition=[
    ['The basic elements of dance are commonly described as\u2026','body, action, space, time and energy',['red, yellow and blue','verse and chorus','treble and bass'],'Dance is often analysed through body, action, space, time and energy.'],
    ['\u201cLevels\u201d in choreography refer to\u2026','high, medium and low positions in space',['loud, medium and soft sounds','the number of dancers','the ticket prices'],'Levels describe the height at which movement happens in space.'],
    ['\u201cUnison\u201d in a group dance means\u2026','dancers performing the same movement at the same time',['each dancer improvising alone','starting at different times','standing still'],'Unison is when dancers execute the same movement simultaneously.'],
    ['\u201cCanon\u201d in choreography means\u2026','the same movement performed by dancers starting at different times',['everyone moving together','moving only backwards','dancing in silence'],'A canon staggers the same movement so dancers begin at different moments.'],
    ['\u201cDynamics\u201d in dance refers to\u2026','the quality or energy of movement (e.g. sharp versus sustained)',['the number of counts','the stage dimensions','the lighting colour'],'Dynamics describe how movement is performed \u2014 its energy and quality.'],
    ['A \u201cmotif\u201d in choreography is\u2026','a movement idea that can be repeated and developed',['a costume accessory','a lighting cue','a type of stage'],'A motif is a short movement idea used as a building block and developed.'],
    ['\u201cNegative space\u201d in choreography refers to\u2026','the empty space around and between dancers\u2019 bodies',['the darkened part of the theatre','a mistake in the dance','the offstage wings only'],'Negative space is the space shaped around and between the dancers.']
  ];

  P.danceJazz=[
    ['Jazz dance in the 20th century drew heavily on\u2026','African-American vernacular dance and jazz music',['European court ballet only','Gregorian chant','Baroque opera'],'Jazz dance grew from African-American social dance and jazz music.'],
    ['\u201cIsolations\u201d in jazz dance are\u2026','moving one body part independently of the others',['jumping as high as possible','holding perfectly still','spinning continuously'],'Isolations move a single body part (e.g. the ribcage) on its own.'],
    ['Bob Fosse is a choreographer famous for\u2026','a distinctive jazz and musical-theatre dance style',['classical Russian ballet','flamenco','Kumina drumming'],'Bob Fosse created an iconic, stylised jazz/theatre dance vocabulary.'],
    ['A rhythmic feature often found in jazz dance is\u2026','syncopation (accents on off-beats)',['no rhythm at all','only slow, even beats','silence'],'Syncopation \u2014 stressing off-beats \u2014 is characteristic of jazz dance.'],
    ['Jazz dance is frequently seen in\u2026','musical theatre',['classical string quartets','still-life painting','pottery'],'Jazz dance is a staple of musical-theatre performance.']
  ];

  P.danceMusic=[
    ['Dancers commonly count music in sets of\u2026','eight (\u201c8 counts\u201d)',['three','five','eleven'],'Dancers typically count movement in groups of eight beats.'],
    ['\u201cTempo\u201d in music means\u2026','the speed of the beat',['the loudness','the key','the costume colour'],'Tempo is how fast the beat moves.'],
    ['In much Caribbean folk dance, the leading instrument is the\u2026','drum',['violin','piano','flute'],'Drumming leads and drives many Caribbean folk dances.'],
    ['The relationship between dance and its accompaniment matters because\u2026','the rhythm guides and shapes the movement',['the music must always be ignored','dancers set the ticket price','it changes the lighting'],'Rhythm and music guide timing, phrasing and energy of the dance.'],
    ['\u201cPhrasing\u201d in dance refers to\u2026','grouping movements into coherent musical/rhythmic units',['the price of a class','the shape of the stage','the number of dancers'],'Phrasing groups movement into sequences that relate to the music.']
  ];

  P.danceProduction=[
    ['\u201cUpstage\u201d refers to the part of the stage\u2026','farthest from the audience',['closest to the audience','to the left of the audience','above the lighting rig'],'Upstage is the area farthest from the audience.'],
    ['\u201cDownstage\u201d refers to the part of the stage\u2026','closest to the audience',['farthest from the audience','behind the backdrop','in the lobby'],'Downstage is the area nearest the audience.'],
    ['The person who coordinates a production backstage and calls cues is the\u2026','stage manager',['lead dancer','ticket seller','composer'],'The stage manager coordinates backstage operations and calls the cues.'],
    ['A technical rehearsal focuses primarily on\u2026','lighting, sound and staging cues',['selling tickets','choosing costumes\u2019 fabric','writing the programme notes'],'Tech rehearsals integrate and refine lighting, sound and staging cues.'],
    ['\u201cBlocking\u201d a dance work means\u2026','planning the performers\u2019 positions and paths on stage',['tearing down the set','printing the tickets','tuning the drums'],'Blocking sets where performers stand and travel on stage.'],
    ['At the end of a run, to \u201cstrike\u201d the set means to\u2026','dismantle and clear it away',['add more scenery','repaint the stage','rehearse again'],'To strike a set is to take it down and clear the stage.']
  ];
  var ORI=['Orientation & Study Skills','orientation'];
  var DSRC=[['Edna Manley College \u2014 School of Dance','https://emc.edu.jm/'],['Encyclop\u00e6dia Britannica \u2014 Dance','https://www.britannica.com/art/dance']];

  var DEFS=[
    ['dance-intro','Introduction to Dance','\uD83D\uDC83',1,'Foundational',
     'A friendly first course in how dance works: the elements of movement, an introduction to modern and ballet technique, and a look at dance history. A short knowledge check follows every module.',
     ['Describe the basic elements of dance (body, action, space, time, energy)','Recognise foundational modern and ballet vocabulary','Place major dance figures and forms in context','Talk about dance using correct basic vocabulary'],
     ['Watch a short dance work and describe its use of space and energy','Keep a one-week movement/observation journal'],
     [ORI,['Modern Dance Basics','danceModern'],['Ballet Basics','danceBallet'],['Dance in History','danceHistory']],DSRC],

    ['dance-modern-technique','Modern Dance Technique','\uD83E\uDD38',2,'Intermediate',
     'Build the foundations of modern dance technique \u2014 contraction and release, floorwork and alignment \u2014 alongside the body awareness needed to move safely and expressively. Knowledge checks and a final.',
     ['Apply core modern-technique principles such as contraction and release','Move with sound alignment and body awareness','Use floorwork and level changes expressively','Connect technique to composition'],
     ['Perform a short modern phrase using contraction and release','Reflect on your alignment in a movement journal'],
     [ORI,['Modern Technique','danceModern'],['Alignment & Safe Practice','danceKinesiology'],['Shaping Movement','danceComposition']],DSRC],

    ['dance-ballet','Ballet Technique Foundations','\uD83E\uDE70',1,'Foundational',
     'The building blocks of classical ballet: the five positions, French vocabulary, turnout, barre work and musicality \u2014 all approached safely. Knowledge checks after each module and a cumulative final.',
     ['Identify the five positions and core ballet vocabulary','Understand turnout, pli\u00e9 and tendu','Work safely at the barre with good alignment','Dance in time with the music'],
     ['Demonstrate the five positions of the feet','Perform a simple barre sequence in time with the music'],
     [ORI,['Ballet Fundamentals','danceBallet'],['Alignment & Injury Prevention','danceKinesiology'],['Musicality for Dancers','danceMusic']],DSRC],

    ['dance-caribbean-folk','Caribbean & Jamaican Folk Dance','\uD83E\uDD41',2,'Intermediate',
     'Explore Jamaica\u2019s and the wider Caribbean\u2019s traditional dance heritage \u2014 Kumina, Jonkonnu, Bruckins and more \u2014 their cultural roots and the drumming that drives them. Grounded in verified history.',
     ['Identify major Jamaican and Caribbean folk forms','Explain the cultural context of these traditions','Describe the role of drumming in folk dance','Relate folk dance to Jamaica\u2019s cultural story'],
     ['Create an annotated map or timeline of Caribbean folk forms','Write a short profile of one traditional Jamaican dance'],
     [ORI,['Jamaican & Caribbean Folk Forms','danceCaribbean'],['Roots & History','danceHistory'],['Drum & Movement','danceMusic']],DSRC],

    ['dance-choreography','Choreography and Composition','\u270D\uFE0F',2,'Intermediate',
     'Learn to make dances. Work with the elements of composition \u2014 space, time, energy, motif, unison and canon \u2014 and use improvisation to generate original material. Knowledge checks and a final assessment.',
     ['Use the elements of dance composition deliberately','Develop movement motifs into longer phrases','Apply devices such as unison and canon','Generate material through improvisation'],
     ['Choreograph a short study built from a single motif','Create a group phrase using canon'],
     [ORI,['Elements of Composition','danceComposition'],['Generating Material','danceImprov'],['Movement Vocabulary','danceModern']],DSRC],

    ['dance-improvisation','Dance Improvisation','\uD83C\uDF00',1,'Foundational',
     'Discover spontaneous movement-making: solo and contact improvisation, working with scores and prompts, and building ensemble trust. Knowledge checks after each module and a cumulative final.',
     ['Improvise movement from prompts and scores','Understand contact-improvisation principles','Build a personal movement vocabulary','Work responsively within an ensemble'],
     ['Improvise a one-minute solo from a given score','Explore a simple contact-improvisation exercise with a partner'],
     [ORI,['Improvisation Basics','danceImprov'],['From Improvisation to Composition','danceComposition'],['Moving Freely','danceModern']],DSRC],

    ['dance-kinesiology','Dance Kinesiology & Injury Prevention','\uD83E\uDDB5',2,'Intermediate',
     'Understand the moving body: alignment, conditioning, warm-up and the prevention and basic care of dance injuries. Grounded in established practice. Knowledge checks and a final assessment.',
     ['Explain alignment and its role in safe movement','Design an effective warm-up and conditioning routine','Recognise common dance-injury risks and how to reduce them','Apply basic acute-injury care principles'],
     ['Build a personal warm-up and conditioning plan','Assess and correct alignment in a simple position'],
     [ORI,['Kinesiology & Alignment','danceKinesiology'],['Technique & the Body','danceModern']],DSRC],

    ['dance-history','Dance Histories & Perspectives','\uD83D\uDCDC',2,'Intermediate',
     'Trace the development of concert dance and its Caribbean context \u2014 from the pioneers of ballet and modern dance to Jamaica\u2019s NDTC. Grounded in verified history. Knowledge checks and a final.',
     ['Identify key figures and movements in dance history','Distinguish ballet and modern-dance traditions','Place Jamaican dance within the wider story','Discuss dance works using informed context'],
     ['Build a timeline of major dance developments','Write a short essay comparing two dance traditions'],
     [ORI,['Pioneers & Movements','danceHistory'],['Caribbean Dance Heritage','danceCaribbean'],['Ballet & Modern Traditions','danceBallet']],DSRC],

    ['dance-jazz','Jazz Dance Foundations','\uD83C\uDFB7',2,'Intermediate',
     'The roots and vocabulary of jazz dance: its African-American origins, isolations, syncopation and its life on the musical-theatre stage. Knowledge checks and a cumulative final.',
     ['Explain the origins of jazz dance','Perform isolations and syncopated movement','Relate jazz dance to jazz music','Connect jazz dance to musical theatre'],
     ['Perform a short jazz phrase using isolations','Analyse the rhythm of a jazz-dance sequence'],
     [ORI,['Jazz Dance','danceJazz'],['Technique Foundations','danceModern'],['Music & Rhythm','danceMusic']],DSRC],

    ['dance-production','Dance Production & Stage Management','\uD83C\uDFAD',2,'Intermediate',
     'Take dance from the studio to the stage: stage geography, blocking, technical rehearsal, cues and the role of the stage manager. Knowledge checks after each module and a final assessment.',
     ['Use correct stage terminology and geography','Plan blocking and spacing for the stage','Understand the technical-rehearsal process','Describe the stage manager\u2019s responsibilities'],
     ['Draft a simple blocking/spacing plan for a short work','Prepare a basic cue list for a performance'],
     [ORI,['Staging & Production','danceProduction'],['Composing for the Stage','danceComposition']],DSRC]
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
      prerequisites:(level>=3?'Solid grounding in dance fundamentals is recommended.':(level===2?'Basic dance knowledge is helpful but not required.':'No prior experience required.')),
      outcomes:outcomes, projects:projects, sources:sources, modules:modules,
      assessmentPolicy:'Each instructional module has a five-question knowledge check, and the final assessment contains 15 separate cumulative questions that do not reuse module questions. A score of 80% or higher is recommended to progress. This internal certificate is not a professional licence or accredited degree.'
    };
    QUIZ[id]={module:moduleQuizzes, final:finalQs};
  });

  window.DANCE_ACADEMY_COURSES=COURSES;
  window.DANCE_ACADEMY_QUIZZES=QUIZ;

  function register(){
    try{ if(window.COURSE_DATA) Object.assign(window.COURSE_DATA, COURSES); }catch(e){}
    window.NEW_QUIZBANK=Object.assign(window.NEW_QUIZBANK||{}, QUIZ);
    try{ if(window.pages) Object.keys(COURSES).forEach(function(id){ if(window.pages.indexOf(id)<0) window.pages.push(id); }); }catch(e){}
    if(typeof window.navigate==='function' && !window.navigate.__danceAcadWrapped){
      var oldNav=window.navigate;
      var wrapped=function(page){ if(COURSES[page] && typeof window.openCourse==='function'){ window.openCourse(page); return; } return oldNav.apply(this,arguments); };
      wrapped.__danceAcadWrapped=true; window.navigate=wrapped;
    }
  }
  register();

  function renderCards(){
    var grid=document.getElementById('coursesGrid'); if(!grid) return;
    if(grid.querySelector('.dance-academy-card')) return;
    Object.keys(COURSES).forEach(function(id){
      var c=COURSES[id];
      var card=document.createElement('div');
      card.className='course-card dance-academy-card';
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
