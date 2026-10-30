/* Creator Hub Creator Network — Drama Academy expansion.
   Adds genuinely-missing Drama-category courses grounded in the EMC School of
   Drama handbook (real programmes: BA Drama-in-Education, BFA Devised Theatre &
   Performance, Certificate/Diploma in Drama) and in established, verifiable
   theatre-education facts. Registered into the SAME engine as the other
   courses (COURSE_DATA + NEW_QUIZBANK). No duplicates, no fabrication. */
(function(){
  var _s=553928117;
  function rnd(){_s=(_s*1103515245+12345)&0x7fffffff;return _s/0x7fffffff;}
  function shuffle(a){a=a.slice();for(var i=a.length-1;i>0;i--){var j=Math.floor(rnd()*(i+1));var t=a[i];a[i]=a[j];a[j]=t;}return a;}
  function Q(row){var stem=row[0],correct=row[1],distractors=row[2],exp=row[3];var opts=shuffle([correct].concat(distractors));return {q:stem,opts:opts,ans:opts.indexOf(correct),exp:exp};}
  function esc(s){return String(s).replace(/[&<>\"']/g,function(m){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[m];});}
  function stemKey(q){return q.q.trim().toLowerCase();}
  var CAT='Drama';
  var P={};

  P.orientation=[
    ['What is the purpose of the Knowledge Check at the end of each module?','To confirm you have grasped that module’s key concepts before moving on',['To replace the need to study the lessons','To lower your final score','To skip the rest of the course'],'A knowledge check verifies understanding of the module before you progress.'],
    ['What is a sensible way to use the lessons in this course?','Study them in order, take notes, and practise the examples',['Skip straight to the final assessment','Memorise only the quiz answers','Read the titles only'],'Working through lessons in sequence with active practice builds durable understanding.'],
    ['Why does the course recommend regular, short practice sessions?','Frequent focused practice builds skill more reliably than rare long sessions',['Because long sessions are impossible','Because practice does not affect skill','To make the course take longer'],'Distributed, focused practice is more effective than infrequent cramming.'],
    ['What does “academic honesty” mean when completing assessments?','Doing your own work and answering the questions yourself',['Copying answers from others','Sharing the quiz answer key','Guessing every question'],'Academic honesty means completing assessments through your own genuine effort.'],
    ['What should you do if you do not pass a knowledge check?','Review the module lessons and try again',['Abandon the course','Ignore the result and continue','Delete your progress'],'Revisiting the lesson material and retrying is the intended way to improve.'],
    ['A measurable learning outcome describes…','what a learner should be able to do after study',['how long the course lasts','the price of the course','the teacher’s opinion'],'Learning outcomes state observable, demonstrable abilities.']
  ];
  P.dramaActing=[
    ['In acting, a \u201cvery well understood objective\u201d (the character\u2019s goal) is important because it\u2026','drives the character\u2019s actions in a scene',['sets the ticket price','chooses the lighting','decides the interval length'],'A clear objective \u2014 what the character wants \u2014 motivates their actions.'],
    ['\u201cGiven circumstances\u201d in acting refers to\u2026','the situation, setting and facts the character is in',['the actor\u2019s salary','the size of the theatre','the number of tickets sold'],'Given circumstances are the who/what/where/when facts that frame a scene.'],
    ['\u201cStatus\u201d in a scene refers to\u2026','the relative power or standing between characters',['the play\u2019s running time','the colour of the set','the actor\u2019s fame'],'Status is the shifting balance of power between characters.'],
    ['\u201cSubtext\u201d is\u2026','the meaning beneath the spoken lines',['the printed programme','the stage directions only','the interval'],'Subtext is what a character really means or feels beneath the words.'],
    ['\u201cBlocking\u201d in rehearsal means\u2026','planning the actors\u2019 movements and positions on stage',['blocking the exits','censoring the script','stopping the show'],'Blocking is the arrangement of actors\u2019 movement and positioning.'],
    ['An acting \u201caction\u201d or \u201ctactic\u201d is\u2026','what a character does to pursue their objective',['a stagehand\u2019s job','a lighting cue','a curtain call'],'A tactic is the active means a character uses to get what they want.']
  ];

  P.dramaStanislavski=[
    ['Constantin Stanislavski is best known for developing\u2026','an influential system of realistic actor training',['modern dance','opera staging','set painting'],'Stanislavski created a foundational system for truthful, realistic acting.'],
    ['The \u201cmagic if\u201d asks the actor to consider\u2026','how they would behave IF they were in the character\u2019s situation',['if the show will sell out','if the lights work','if it will rain'],'The \u201cmagic if\u201d prompts the actor to imagine acting truthfully in the given situation.'],
    ['\u201cEmotional (affective) memory\u201d asks the actor to\u2026','draw on personal remembered experience to fuel a feeling',['memorise the whole script overnight','forget the lines','copy another actor exactly'],'Emotional memory uses the actor\u2019s own recalled experience to access emotion.'],
    ['For Stanislavski, \u201cconcentration/attention\u201d on stage means\u2026','focusing fully within the world of the play',['watching the audience','reading the reviews','checking the time'],'The actor concentrates on the imaginary world rather than the auditorium.'],
    ['\u201cGiven circumstances\u201d and the \u201cthrough-line of action\u201d help the actor\u2026','build a coherent, believable character',['sell more tickets','design the poster','tune the piano'],'These tools help unify a truthful, consistent performance.'],
    ['Later teachers such as Lee Strasberg developed Stanislavski\u2019s ideas into\u2026','\u201cMethod\u201d acting',['classical ballet','the sonata form','commedia masks'],'Strasberg\u2019s \u201cMethod\u201d extended Stanislavski\u2019s system in the United States.']
  ];

  P.dramaHistory=[
    ['Western theatre is generally traced back to\u2026','ancient Greece',['medieval England','ancient Egypt','19th-century France'],'Theatre as a formal art is traditionally traced to ancient Greece.'],
    ['The three classical Greek tragedians are Aeschylus, Sophocles and\u2026','Euripides',['Aristophanes','Homer','Plato'],'Aeschylus, Sophocles and Euripides are the great Greek tragedians (Aristophanes wrote comedy).'],
    ['Aristotle\u2019s \u201cPoetics\u201d is an early work of\u2026','dramatic theory and criticism',['stage lighting design','ticket pricing','costume sewing'],'The Poetics is a foundational text of dramatic theory.'],
    ['\u201cCommedia dell\u2019arte\u201d was a form of\u2026','improvised masked comedy from Renaissance Italy',['Greek tragedy','Japanese noh','English opera'],'Commedia dell\u2019arte was Italian improvised comedy using stock masked characters.'],
    ['William Shakespeare wrote and performed mainly during which era?','the Elizabethan/Jacobean period',['ancient Rome','the 20th century','the Middle Ages'],'Shakespeare worked in the Elizabethan and Jacobean period around 1600.'],
    ['Bertolt Brecht is associated with\u2026','epic theatre and the \u201calienation effect\u201d',['classical ballet','Method acting','commedia dell\u2019arte'],'Brecht developed epic theatre and the Verfremdungseffekt (alienation effect).']
  ];
  P.dramaImprov=[
    ['A core rule of improvisation is often summarised as\u2026','\u201cyes, and\u201d \u2014 accept and build on your partner\u2019s offer',['\u201cno, but\u201d \u2014 always block ideas','say nothing at all','ignore your scene partner'],'\u201cYes, and\u201d means accepting an offer and adding to it.'],
    ['In improv, an \u201coffer\u201d is\u2026','anything a performer introduces for others to build on',['a discount ticket','a lighting cue','a printed script'],'An offer is any idea, action or line introduced into the scene.'],
    ['\u201cBlocking\u201d an offer in improv means\u2026','rejecting or shutting down your partner\u2019s idea',['moving the furniture','planning stage movement','dimming the lights'],'To block is to refuse an offer, which usually stalls the scene.'],
    ['Improvisation is performed\u2026','without a pre-written script, created in the moment',['from a fully memorised text','only in silence','only with masks'],'Improvised theatre is created spontaneously without a set script.'],
    ['A useful improv skill is\u2026','active listening and responding to your partner',['ignoring others to plan your own joke','memorising lines in advance','facing away from the audience'],'Good improvisers listen closely and respond truthfully.'],
    ['\u201cEstablishing the platform\u201d early in an improv scene means\u2026','quickly setting who, where and what',['selling tickets','building the physical set','writing a script'],'The platform establishes the scene\u2019s who/where/what so it can develop.']
  ];

  P.dramaVoice=[
    ['\u201cProjection\u201d for the stage means\u2026','producing a strong, clear voice that carries to the audience',['shouting until hoarse','whispering always','speaking very fast'],'Projection fills the space with clear sound without straining.'],
    ['\u201cDiction\u201d (articulation) refers to\u2026','the clarity with which words are pronounced',['the loudness of the voice','the pitch of the voice','the speed of the curtain'],'Diction is the clarity and precision of speech.'],
    ['Effective stage breathing is generally\u2026','supported from the diaphragm',['shallow and high in the chest','holding the breath','only through the nose'],'Diaphragmatic breath supports a strong, sustainable voice.'],
    ['\u201cPace\u201d in vocal delivery refers to\u2026','the speed at which lines are spoken',['the loudness','the pitch','the lighting'],'Pace is the speed and rhythm of speech.'],
    ['A vocal \u201cwarm-up\u201d before performing helps to\u2026','prepare and protect the voice',['tune the orchestra','sell tickets','build the set'],'Warming up readies the voice and reduces strain.'],
    ['\u201cInflection\u201d in speech refers to\u2026','variation in pitch to convey meaning',['standing still','the interval length','the ticket price'],'Inflection is the rise and fall of pitch that shapes meaning.']
  ];

  P.dramaMovement=[
    ['\u201cMime\u201d is a performance form based on\u2026','expression through movement and gesture without speech',['loud singing','rapid speech','playing drums'],'Mime communicates through silent, stylised movement and gesture.'],
    ['\u201cStage presence\u201d refers to\u2026','a performer\u2019s ability to command attention on stage',['the ticket price','the size of the stage','the number of props'],'Stage presence is the commanding, engaging quality of a performer.'],
    ['\u201cNeutral mask\u201d work is used to train\u2026','clear, expressive physicality and body awareness',['singing in tune','set construction','ticket sales'],'Neutral-mask work focuses the actor on physical expression and economy.'],
    ['\u201cGesture\u201d in physical theatre is\u2026','a movement of the body that carries meaning',['a lighting cue','a line of dialogue','a stage exit only'],'A gesture is an expressive bodily movement conveying meaning.'],
    ['Physical warm-ups for actors help to\u2026','prepare the body and prevent injury',['memorise lines','print programmes','tune instruments'],'Physical warm-ups ready the body and reduce injury risk.'],
    ['\u201cTableau\u201d (a \u201cstill image\u201d) is\u2026','a frozen picture made with the actors\u2019 bodies',['a spoken monologue','a set of props','a lighting board'],'A tableau is a held, frozen image created by the performers\u2019 bodies.']
  ];
  P.dramaPlaywriting=[
    ['A traditional dramatic structure moves from exposition through rising action to\u2026','climax, then falling action and resolution',['interval and encore only','curtain call then overture','review and refund'],'Classic dramatic structure builds to a climax before resolving.'],
    ['\u201cDialogue\u201d in a play is\u2026','the spoken exchange between characters',['the printed ticket','the stage lighting','the interval music'],'Dialogue is the spoken interaction between characters.'],
    ['\u201cStage directions\u201d in a script tell the reader\u2026','actions, settings and movement (not spoken by characters)',['the ticket prices','the reviews','the theatre address'],'Stage directions describe action and staging rather than spoken lines.'],
    ['Dramatic \u201cconflict\u201d is important because it\u2026','drives the story and engages the audience',['fills the interval','pays the actors','lights the stage'],'Conflict is the engine of drama, creating tension and momentum.'],
    ['A \u201cmonologue\u201d is\u2026','an extended speech by a single character',['a duet','a lighting cue','a scene change'],'A monologue is a long speech delivered by one character.'],
    ['\u201cCharacter arc\u201d refers to\u2026','how a character changes across the play',['the shape of the stage','the theatre\u2019s roof','the price of tickets'],'A character arc is the transformation a character undergoes.']
  ];

  P.dramaScript=[
    ['\u201cThemes\u201d in a play are\u2026','its central ideas or underlying messages',['the ticket prices','the stage dimensions','the lighting colours'],'Themes are the central ideas a play explores.'],
    ['\u201cProtagonist\u201d refers to\u2026','the central character driving the story',['the villain always','the stage manager','the audience'],'The protagonist is the main character at the centre of the action.'],
    ['\u201cAntagonist\u201d refers to\u2026','the character or force opposing the protagonist',['the lighting designer','the narrator only','the ticket seller'],'The antagonist opposes the protagonist, generating conflict.'],
    ['\u201cGenre\u201d in drama distinguishes, for example,\u2026','tragedy from comedy',['seats from tickets','lamps from cables','doors from windows'],'Genre categorises works such as tragedy, comedy and farce.'],
    ['To analyse a play\u2019s \u201cstructure\u201d you would look at\u2026','how its acts and scenes are organised',['the box-office takings','the car park','the cloakroom'],'Structure concerns the organisation of acts, scenes and beats.'],
    ['\u201cDramatic irony\u201d occurs when\u2026','the audience knows something a character does not',['the actor forgets a line','the lights fail','the show sells out'],'Dramatic irony is created when the audience knows more than a character.']
  ];

  P.dramaTech=[
    ['\u201cUpstage\u201d is the part of the stage\u2026','farthest from the audience',['closest to the audience','in the lobby','above the roof'],'Upstage is farthest from the audience.'],
    ['The person who coordinates backstage and calls the cues is the\u2026','stage manager',['lead actor','usher','critic'],'The stage manager runs the show backstage and calls cues.'],
    ['\u201cProps\u201d are\u2026','objects handled or used by actors on stage',['the stage lights','the seats','the printed tickets'],'Props are the movable objects actors use in performance.'],
    ['A \u201cgel\u201d in stage lighting is\u2026','a coloured filter placed over a light',['a type of makeup','a sound effect','a stage exit'],'A lighting gel is a coloured filter that tints a lamp\u2019s beam.'],
    ['A \u201ccue\u201d is\u2026','a signal to trigger a lighting, sound or action change',['a refund','a curtain','a ticket'],'A cue is a signal that triggers a technical or performance change.'],
    ['To \u201cstrike\u201d a set means to\u2026','dismantle and clear it after the run',['build more scenery','repaint the seats','sell the props'],'Striking a set means taking it down and clearing the stage.']
  ];

  P.dramaDirecting=[
    ['A director\u2019s main role is to\u2026','shape and unify the overall production',['sell the tickets','sew the costumes alone','play every role'],'The director shapes the interpretation and unifies the production.'],
    ['A director\u2019s \u201cconcept\u201d is\u2026','the guiding interpretation of the play',['the ticket price','the theatre\u2019s address','the interval snacks'],'A concept is the director\u2019s unifying vision for the production.'],
    ['\u201cBlocking\u201d from the director\u2019s view is\u2026','planning where and how actors move on stage',['budgeting the show','printing the programme','tuning the piano'],'Directors plan blocking \u2014 the staging of actors\u2019 movement.'],
    ['During rehearsals a director gives \u201cnotes\u201d, which are\u2026','feedback to help actors refine their work',['the printed script','the seating plan','the refunds'],'Notes are the director\u2019s targeted feedback to performers.'],
    ['A director collaborates with designers to unify\u2026','set, lighting, sound and costume with the vision',['the ticket booth','the car park','the box office'],'The director coordinates the design elements around a shared vision.'],
    ['The director usually works most closely in rehearsal with\u2026','the actors',['the ticket buyers','the critics','the ushers'],'Directors work chiefly with the actors to realise the production.']
  ];
  P.dramaCaribbean=[
    ['The Jamaican \u201cLittle Theatre Movement\u201d (LTM) is famous for its annual\u2026','National Pantomime',['opera season','ballet gala','symphony concert'],'The LTM has staged Jamaica\u2019s National Pantomime for decades.'],
    ['Louise Bennett-Coverley (\u201cMiss Lou\u201d) is celebrated for championing\u2026','Jamaican Patois in performance and poetry',['Italian opera','classical ballet','Greek tragedy'],'Miss Lou championed Jamaican Creole (Patois) in performance and verse.'],
    ['Trevor Rhone was a major Jamaican\u2026','playwright (co-writer of \u201cThe Harder They Come\u201d)',['ballet dancer','opera composer','painter'],'Trevor Rhone was a leading Jamaican playwright and screenwriter.'],
    ['Caribbean theatre often draws on\u2026','local language, folklore and oral tradition',['only ancient Greek myths','only European opera','no cultural sources'],'Caribbean theatre frequently uses local language, folklore and oral tradition.'],
    ['The use of Jamaican Patois on stage helps to\u2026','reflect authentic local voice and identity',['confuse the audience deliberately','raise ticket prices','replace all movement'],'Performing in Patois expresses authentic Jamaican voice and identity.'],
    ['Jamaican pantomime blends storytelling with\u2026','music, dance, comedy and topical commentary',['silent mime only','opera only','ballet only'],'Jamaican pantomime mixes song, dance, comedy and social commentary.']
  ];

  P.dramaEducation=[
    ['\u201cDrama-in-education\u201d uses drama primarily to\u2026','support learning and personal development',['train professional actors only','sell theatre tickets','build stage sets'],'Drama-in-education uses dramatic activity as a tool for learning.'],
    ['\u201cRole-play\u201d in the classroom helps students to\u2026','explore situations and perspectives actively',['memorise long scripts only','avoid participation','sit silently'],'Role-play lets learners explore ideas and viewpoints through action.'],
    ['\u201cProcess drama\u201d emphasises\u2026','the experience of the participants over a polished product',['ticket sales','a flawless final show only','stage lighting design'],'Process drama values the participants\u2019 experience over performance product.'],
    ['\u201cTeacher-in-role\u201d means the teacher\u2026','takes on a character to guide the drama from within',['leaves the room','only marks tests','runs the box office'],'In teacher-in-role, the educator adopts a role to shape the drama.'],
    ['A key benefit of drama for young learners is developing\u2026','confidence, empathy and communication',['only handwriting','only arithmetic','ticket-selling skills'],'Drama builds confidence, empathy and communication skills.'],
    ['A drama lesson should begin with\u2026','a warm-up to prepare body, voice and focus',['the final assessment','striking the set','a curtain call'],'Warm-ups prepare learners physically and mentally for drama work.']
  ];

  var ORI=['Orientation & Study Skills','orientation'];
  var DR_SRC=[['Edna Manley College \u2014 School of Drama','https://emc.edu.jm/'],['Encyclop\u00e6dia Britannica \u2014 Theatre','https://www.britannica.com/art/theatre']];

  var DEFS=[
    ['drama-intro','Introduction to Drama & Theatre','\uD83C\uDFAD',1,'Foundational',
     'A welcoming first course in theatre: what drama is, the basics of acting, key moments in theatre history and how a play is put together. A short knowledge check follows every module.',
     ['Explain what drama and theatre are','Recognise basic acting concepts','Place major periods of theatre history','Identify the parts of a play'],
     ['Watch a short scene and describe its conflict','Keep a one-week theatre-observation journal'],
     [ORI,['Acting Basics','dramaActing'],['Theatre Through History','dramaHistory'],['How Plays Are Built','dramaPlaywriting']],DR_SRC],

    ['drama-acting','Acting Fundamentals','\uD83C\uDFAC',2,'Intermediate',
     'Core acting craft: objectives and given circumstances, actions and tactics, status and subtext, and truthful presence in a scene. Knowledge checks after each module and a cumulative final.',
     ['Play clear objectives and actions','Work with given circumstances and status','Reveal subtext truthfully','Stay present and responsive in a scene'],
     ['Prepare and perform a short scene with a clear objective','Analyse a character\u2019s tactics in a monologue'],
     [ORI,['The Actor\u2019s Toolkit','dramaActing'],['Truthful Acting','dramaStanislavski'],['Voice for the Actor','dramaVoice']],DR_SRC],

    ['drama-stanislavski','The Stanislavski System','\uD83C\uDFAB',3,'Advanced',
     'Explore Stanislavski\u2019s influential approach to truthful acting \u2014 the \u201cmagic if\u201d, given circumstances, emotional memory and the through-line of action \u2014 and how it evolved into Method acting. Knowledge checks and a final.',
     ['Explain the core ideas of the Stanislavski system','Apply the \u201cmagic if\u201d and given circumstances','Use concentration and the through-line of action','Trace the system\u2019s influence on Method acting'],
     ['Prepare a role using the \u201cmagic if\u201d','Map the through-line of action for a scene'],
     [ORI,['Stanislavski\u2019s System','dramaStanislavski'],['Applying the Craft','dramaActing'],['Theatre History Context','dramaHistory']],DR_SRC],

    ['drama-improv','Theatrical Improvisation','\u26A1',1,'Foundational',
     'Learn to create theatre in the moment: \u201cyes, and\u201d, offers and acceptance, establishing the platform and building scenes collaboratively. Knowledge checks after each module and a cumulative final.',
     ['Apply the \u201cyes, and\u201d principle','Make and accept offers','Establish who, where and what quickly','Build scenes through active listening'],
     ['Play a short improvised two-person scene','Reflect on offers you accepted and blocked'],
     [ORI,['Improv Foundations','dramaImprov'],['Presence & Play','dramaActing'],['Physical Play','dramaMovement']],DR_SRC],

    ['drama-voice','Voice & Speech for Performance','\uD83D\uDDE3\uFE0F',2,'Intermediate',
     'Develop the performer\u2019s voice: breath support, projection, diction, pace and inflection \u2014 practised safely. Knowledge checks after each module and a cumulative final assessment.',
     ['Support the voice with efficient breathing','Project clearly without strain','Improve diction and articulation','Use pace and inflection expressively'],
     ['Record and refine a spoken monologue','Design a personal vocal warm-up'],
     [ORI,['Voice & Speech','dramaVoice'],['Applying Voice in Acting','dramaActing'],['Body & Voice Together','dramaMovement']],DR_SRC],

    ['drama-movement','Movement & Physical Theatre','\uD83E\uDD38',2,'Intermediate',
     'Train the expressive body: mime and gesture, stage presence, neutral-mask principles and tableau. Knowledge checks after each module and a cumulative final assessment.',
     ['Use gesture and mime expressively','Develop stage presence and body awareness','Apply neutral-mask principles','Create meaning through tableau'],
     ['Devise a short piece of physical storytelling','Build a series of tableaux telling a story'],
     [ORI,['Physical Theatre','dramaMovement'],['Play & Improvisation','dramaImprov'],['Embodied Acting','dramaActing']],DR_SRC],
    ['drama-playwriting','Playwriting Fundamentals','\u270D\uFE0F',2,'Intermediate',
     'Learn to write for the stage: dramatic structure, dialogue, conflict, character arc, monologue and stage directions. Knowledge checks after each module and a cumulative final.',
     ['Shape a play with dramatic structure','Write purposeful dialogue and stage directions','Build conflict and character arcs','Craft an effective monologue'],
     ['Write a short two-character scene with clear conflict','Draft a one-minute monologue'],
     [ORI,['Writing for the Stage','dramaPlaywriting'],['Reading Plays Closely','dramaScript'],['Structure in Theatre History','dramaHistory']],DR_SRC],

    ['drama-script-analysis','Script & Text Analysis','\uD83D\uDCD6',2,'Intermediate',
     'Read plays like a theatre-maker: themes, protagonist and antagonist, genre, structure and dramatic irony. Knowledge checks after each module and a cumulative final assessment.',
     ['Identify themes and central ideas','Distinguish protagonist, antagonist and genre','Analyse dramatic structure','Recognise devices such as dramatic irony'],
     ['Write a short analysis of a scene\u2019s structure','Chart the themes of a chosen play'],
     [ORI,['Analysing the Text','dramaScript'],['How Plays Are Built','dramaPlaywriting'],['Plays in History','dramaHistory']],DR_SRC],

    ['drama-directing','Directing for the Stage','\uD83C\uDFAF',3,'Advanced',
     'An introduction to directing: developing a concept, blocking, giving notes and collaborating with designers to unify a production. Knowledge checks after each module and a cumulative final.',
     ['Develop a directorial concept','Plan effective blocking','Give constructive notes to actors','Collaborate with designers to unify a production'],
     ['Draft a directorial concept for a short scene','Create a blocking plan for a two-person scene'],
     [ORI,['The Director\u2019s Role','dramaDirecting'],['Working with Actors','dramaActing'],['Staging & Stagecraft','dramaTech']],DR_SRC],

    ['drama-stagecraft','Stagecraft & Technical Theatre','\uD83D\uDD27',2,'Intermediate',
     'The world behind the curtain: stage geography, props, lighting, sound, cues and the stage manager\u2019s role. Knowledge checks after each module and a cumulative final assessment.',
     ['Use correct stage terminology','Understand props, lighting and sound basics','Follow and call cues','Describe the stage manager\u2019s responsibilities'],
     ['Prepare a basic cue sheet for a short scene','Draft a simple props and lighting list'],
     [ORI,['Technical Theatre','dramaTech'],['Directing & Staging','dramaDirecting']],DR_SRC],

    ['drama-caribbean','Caribbean & Jamaican Theatre','\uD83C\uDDEF\uD83C\uDDF2',2,'Intermediate',
     'Explore Jamaica\u2019s vibrant theatre heritage \u2014 the Little Theatre Movement and National Pantomime, Miss Lou and Patois on stage, Trevor Rhone and the region\u2019s storytelling traditions. Grounded in verified history.',
     ['Describe the Little Theatre Movement and National Pantomime','Explain the role of Patois and Miss Lou','Identify key Jamaican theatre figures','Relate Caribbean theatre to local culture'],
     ['Write a short profile of a Jamaican theatre figure','Describe how Patois shapes a Jamaican play'],
     [ORI,['Jamaican & Caribbean Theatre','dramaCaribbean'],['Theatre in Its Culture','dramaHistory'],['Local Voice on Stage','dramaScript']],DR_SRC],

    ['drama-education','Drama in Education','\uD83C\uDFEB',2,'Intermediate',
     'Use drama as a tool for teaching and learning: role-play, process drama, teacher-in-role and building confidence, empathy and communication. Grounded in established practice. Knowledge checks and a final.',
     ['Explain the aims of drama-in-education','Use role-play and process drama','Apply the teacher-in-role technique','Plan a simple drama lesson'],
     ['Draft a short drama-in-education lesson plan','Design a role-play activity for a class'],
     [ORI,['Drama for Learning','dramaEducation'],['Facilitating Through Play','dramaImprov'],['Voice & Presence for Teachers','dramaVoice']],DR_SRC]
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
      prerequisites:(level>=3?'Solid grounding in acting/theatre fundamentals is recommended.':(level===2?'Basic theatre knowledge is helpful but not required.':'No prior experience required.')),
      outcomes:outcomes, projects:projects, sources:sources, modules:modules,
      assessmentPolicy:'Each instructional module has a five-question knowledge check, and the final assessment contains 15 separate cumulative questions that do not reuse module questions. A score of 80% or higher is recommended to progress. This internal certificate is not a professional licence or accredited degree.'
    };
    QUIZ[id]={module:moduleQuizzes, final:finalQs};
  });

  window.DRAMA_ACADEMY_COURSES=COURSES;
  window.DRAMA_ACADEMY_QUIZZES=QUIZ;

  function register(){
    try{ if(window.COURSE_DATA) Object.assign(window.COURSE_DATA, COURSES); }catch(e){}
    window.NEW_QUIZBANK=Object.assign(window.NEW_QUIZBANK||{}, QUIZ);
    try{ if(window.pages) Object.keys(COURSES).forEach(function(id){ if(window.pages.indexOf(id)<0) window.pages.push(id); }); }catch(e){}
    if(typeof window.navigate==='function' && !window.navigate.__dramaAcadWrapped){
      var oldNav=window.navigate;
      var wrapped=function(page){ if(COURSES[page] && typeof window.openCourse==='function'){ window.openCourse(page); return; } return oldNav.apply(this,arguments); };
      wrapped.__dramaAcadWrapped=true; window.navigate=wrapped;
    }
  }
  register();

  function renderCards(){
    var grid=document.getElementById('coursesGrid'); if(!grid) return;
    if(grid.querySelector('.drama-academy-card')) return;
    Object.keys(COURSES).forEach(function(id){
      var c=COURSES[id];
      var card=document.createElement('div');
      card.className='course-card drama-academy-card';
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
