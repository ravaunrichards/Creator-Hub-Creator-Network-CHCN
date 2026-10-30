/* Creator Hub Creator Network — Instrument course quizzes + registration.
   Adds real, curriculum-grounded knowledge-check and final-assessment quizzes to
   every instrument course and registers those courses in the standard course
   engine (COURSE_DATA + NEW_QUIZBANK) so the existing lesson / quiz / progress /
   certificate flow works unchanged. Every question is an established
   music-education fact — nothing here is fabricated. */
(function(){
  var _s=987654321;
  function rnd(){_s=(_s*1103515245+12345)&0x7fffffff;return _s/0x7fffffff;}
  function shuffle(a){a=a.slice();for(var i=a.length-1;i>0;i--){var j=Math.floor(rnd()*(i+1));var t=a[i];a[i]=a[j];a[j]=t;}return a;}
  function Q(row){var stem=row[0],correct=row[1],distractors=row[2],exp=row[3];var opts=shuffle([correct].concat(distractors));return {q:stem,opts:opts,ans:opts.indexOf(correct),exp:exp};}

  // ----- unit knowledge pools (established music facts) -----
  // row = [stem, correct, [distractors...], explanation]
  var UNITS=[
    { title:'Instrument setup, safety & posture', focus:'Instrument setup, safety and posture', pool:[
      ['Why is good posture important when playing an instrument?','It supports efficient technique and helps prevent strain or injury',['It makes the instrument louder','It changes the instrument\u2019s tuning','It is only relevant during concerts'],'Balanced, relaxed posture lets the body move efficiently and reduces repetitive-strain injury.'],
      ['What is a sensible first step at the start of a practice session?','A gentle warm-up to prepare the muscles and focus',['Playing your hardest piece at full speed','Jumping straight to performance tempo','Loosening every screw on the instrument'],'Warming up prepares the muscles and attention before harder work.'],
      ['When is hearing protection most important for a musician?','When practising or performing at high volume for long periods',['Only when reading sheet music','Only when tuning the instrument','Never, because music cannot harm hearing'],'Sustained high sound levels can damage hearing, so protection matters during loud, long sessions.'],
      ['What does \u201ctuning\u201d an instrument mean?','Adjusting it so its pitches match a correct reference',['Cleaning the outside of the instrument','Writing the notes on a page','Increasing the playing tempo'],'Tuning sets pitches to a standard reference such as A=440 Hz.'],
      ['Why is regular maintenance and cleaning of an instrument recommended?','It keeps the instrument in good, reliable playing condition',['It permanently raises the instrument\u2019s pitch','It removes the need to ever practise','It changes the time signature of a piece'],'Routine care keeps an instrument responsive and extends its life.'],
      ['A stable, comfortable playing position mainly helps a musician to\u2026','control the instrument and breathe or move freely',['avoid ever needing to read music','play only in one key','skip warm-ups safely'],'A stable set-up frees the body for controlled technique and breathing.']
    ]},
    { title:'Technique and tone production', focus:'Technique and tone production', pool:[
      ['In music, \u201cdynamics\u201d refers to\u2026','how loud or soft the music is played',['the speed of the music','the key of the piece','the number of performers'],'Dynamics describe volume, e.g. piano (soft) and forte (loud).'],
      ['The Italian term \u201clegato\u201d instructs the player to\u2026','play the notes smoothly and connected',['play the notes short and detached','play as loudly as possible','stop after every note'],'Legato means smooth, connected notes with no audible gaps.'],
      ['Notes marked \u201cstaccato\u201d should be played\u2026','short and detached',['smoothly joined together','only very quietly','at half the written pitch'],'Staccato notes are shortened and separated from one another.'],
      ['\u201cTone\u201d (tone quality / timbre) describes\u2026','the character or colour of the sound produced',['the printed key signature','the number of beats in a bar','the price of the instrument'],'Tone (timbre) is the characteristic colour of a sound.'],
      ['\u201cArticulation\u201d in playing refers to\u2026','how notes are started, connected and separated',['how many sharps are in the key','the brand of the instrument','the title of the piece'],'Articulation covers how each note is attacked and released.'],
      ['Steady, focused practice of the basics mainly builds\u2026','reliable, consistent technique',['a louder instrument','a faster metronome','more sheet music'],'Consistent fundamentals practice makes technique dependable.']
    ]},
    { title:'Music notation and rhythm', focus:'Music notation and rhythm', pool:[
      ['In 4/4 time, how many quarter-note beats are in one measure?','4',['2','3','6'],'The top number of 4/4 shows four beats per measure.'],
      ['In 4/4 time, how many beats does a whole note last?','4',['1','2','3'],'A whole note fills a complete 4/4 measure \u2014 four beats.'],
      ['A sharp sign (\u266f) raises a note by\u2026','one semitone (half step)',['one whole tone','one octave','two octaves'],'A sharp raises pitch by one semitone; a flat lowers it by one semitone.'],
      ['A flat sign (\u266d) lowers a note by\u2026','one semitone (half step)',['one whole tone','one octave','a perfect fifth'],'A flat lowers pitch by a single semitone.'],
      ['Adding a dot after a note increases its duration by\u2026','half of the note\u2019s original value',['double the original value','one full beat always','a quarter of its value'],'A dot adds half the note\u2019s value (a dotted half note = three beats in 4/4).'],
      ['\u201cTempo\u201d in music means\u2026','the speed of the beat (often given in BPM)',['the loudness of the music','the key of the piece','the number of players'],'Tempo is how fast the beat goes, measured in beats per minute.']
    ]}
  ];
  UNITS.push(
    { title:'Scales, keys and intervals', focus:'Scales, keys and intervals', pool:[
      ['How many semitones are there in one octave?','12',['7','8','10'],'An octave is divided into twelve equal semitones.'],
      ['What is the step pattern of a major scale?','Whole-Whole-Half-Whole-Whole-Whole-Half',['Half-Half-Whole-Half-Whole-Whole-Whole','Whole-Half-Whole-Whole-Half-Whole-Whole','All whole steps'],'Every major scale follows W-W-H-W-W-W-H.'],
      ['How many semitones are in a perfect fifth (e.g. C up to G)?','7',['5','6','8'],'A perfect fifth spans seven semitones.'],
      ['What is the relative minor of C major?','A minor',['E minor','D minor','G minor'],'C major and A minor share the same key signature (no sharps or flats).'],
      ['How many different notes does a major scale contain before repeating at the octave?','7',['5','6','8'],'A diatonic major scale has seven distinct notes, then the octave repeats.'],
      ['An \u201coctave\u201d is the interval between a note and\u2026','the next note with the same name (double the frequency)',['the note one semitone higher','any note in a different key','the loudest note available'],'An octave doubles frequency and shares the same note name.']
    ]},
    { title:'Chords, harmony and accompaniment', focus:'Chords, harmony and accompaniment', pool:[
      ['A major triad is built from the root plus\u2026','a major third and a perfect fifth',['two perfect fifths','a minor second and a fourth','three octaves'],'A major triad = root, major third, perfect fifth.'],
      ['How many notes are in a basic triad?','3',['2','4','5'],'A triad is a three-note chord (root, third, fifth).'],
      ['The chord built on the first degree of a scale is called the\u2026','tonic',['dominant','subdominant','leading tone'],'The chord on scale degree 1 is the tonic; degree 5 is the dominant.'],
      ['\u201cHarmony\u201d refers to\u2026','notes sounded together to support a melody',['the speed of a piece','a single unaccompanied line','the loudness of a note'],'Harmony is the combination of simultaneous pitches supporting melody.'],
      ['An \u201carpeggio\u201d is\u2026','the notes of a chord played one after another',['three notes played at exactly the same instant','a very fast scale run only','a change of time signature'],'An arpeggio spreads a chord\u2019s notes out in sequence.'],
      ['Playing chords to support a singer or soloist is called\u2026','accompaniment',['transposition','syncopation','improvisation'],'Accompaniment provides harmonic and rhythmic support for a lead part.']
    ]},
    { title:'Ear training and transcription', focus:'Ear training and transcription', pool:[
      ['Ear training mainly develops the ability to\u2026','recognise pitches, intervals and rhythms by listening',['read faster in bright light','clean the instrument','memorise composer birthdays'],'Ear training builds aural recognition of musical elements.'],
      ['\u201cTranscription\u201d in music means\u2026','writing music down by listening to it',['printing a poster for a concert','tuning the instrument','buying new sheet music'],'Transcription is notating music from what you hear.'],
      ['\u201cRelative pitch\u201d is the ability to\u2026','identify a note or interval in relation to a reference pitch',['play only in the key of C','name a note with no reference at all instantly','read bass clef only'],'Relative pitch identifies pitches by their relationship to a known reference.'],
      ['An \u201cinterval\u201d is\u2026','the distance in pitch between two notes',['the silence at the end of a piece','the speed of the beat','the name of a chord shape'],'An interval measures how far apart two pitches are.'],
      ['Being able to hear whether a note is in tune helps a musician to\u2026','adjust and play with accurate intonation',['ignore the rest of the ensemble','play only loud notes','avoid ever practising scales'],'Recognising intonation lets a player correct pitch and blend with others.']
    ]},
    { title:'Repertoire, styles and practice planning', focus:'Repertoire, styles and practice planning', pool:[
      ['Which practice approach is generally most effective?','Short, focused, regular sessions with clear goals',['One very long session once a week','Only playing pieces you already know','Never using a metronome or plan'],'Frequent, goal-directed practice produces steadier progress than rare marathon sessions.'],
      ['A musician\u2019s \u201crepertoire\u201d is\u2026','the collection of pieces they can perform',['the case that holds the instrument','the list of scales only','the audience at a concert'],'Repertoire is the body of works a performer has prepared.'],
      ['Practising a passage slowly and then gradually increasing the tempo helps to\u2026','build accuracy before speed',['skip learning the notes','make the piece shorter','change the key signature'],'Slow, accurate practice builds control before tempo is raised.'],
      ['\u201cSight-reading\u201d is\u2026','playing a piece of music at first sight',['memorising a piece over many weeks','writing your own composition','tuning by ear'],'Sight-reading is performing notation you have not rehearsed.'],
      ['Using a metronome during practice mainly helps develop\u2026','steady, accurate timing',['a brighter tone colour','a wider dynamic range','perfect pitch instantly'],'A metronome trains reliable internal timing.']
    ]},
    { title:'Performance, recording and portfolio', focus:'Performance, recording and portfolio', pool:[
      ['A useful way to prepare for a performance is to\u2026','rehearse the programme and plan how to manage nerves',['avoid all practice the week before','change instruments on stage','never tune beforehand'],'Rehearsal plus a plan for nerves supports a confident performance.'],
      ['A performance portfolio is used to\u2026','document and showcase your work and progress',['store spare strings only','replace the need to practise','tune the instrument automatically'],'A portfolio collects evidence of your playing and development.'],
      ['When making a recording, clean audio is helped by\u2026','controlling background noise and setting appropriate levels',['playing as loudly as possible always','recording next to a busy road','ignoring the microphone position'],'Managing noise and levels yields a clearer recording.'],
      ['\u201cExpressive\u201d performance means\u2026','shaping dynamics and phrasing, not just playing correct notes',['playing every note at the same volume','playing as fast as possible','ignoring the written articulation'],'Expression uses dynamics, phrasing and articulation to communicate musically.'],
      ['Reflecting on a recording of your own playing helps you to\u2026','identify strengths and areas to improve',['make the instrument louder','change the composer\u2019s intentions','avoid ever performing live'],'Self-review of recordings is a proven way to guide improvement.']
    ]}
  );

  // ----- family-specific verified facts -----
  var FAMILY={
    Strings:[
      ['On a string instrument, sound is produced when\u2026','the strings vibrate and the body amplifies the sound',['air is blown across a reed','the lips buzz into a mouthpiece','a hammer strikes a bar'],'String instruments sound by vibrating strings, amplified by the resonating body.'],
      ['On a fretted or fingered string instrument, pressing a string at a higher point (shorter vibrating length) produces\u2026','a higher pitch',['a lower pitch','no change in pitch','a change only in volume'],'Shortening the vibrating length raises the pitch.']
    ],
    Woodwind:[
      ['The clarinet and saxophone produce sound using\u2026','a single vibrating reed',['buzzing lips','a struck membrane','a bowed string'],'Clarinet and saxophone are single-reed woodwind instruments.'],
      ['On most woodwind instruments, pitch is changed mainly by\u2026','opening and closing tone holes or keys',['tightening the drum head','moving a slide only','changing the bow speed'],'Covering or uncovering holes changes the effective tube length and pitch.']
    ],
    Brass:[
      ['A standard trumpet has how many valves?','3',['2','4','6'],'The common trumpet uses three piston valves.'],
      ['Brass players change pitch mainly by\u2026','adjusting lip tension (embouchure) together with valves or a slide',['covering tone holes','striking a membrane','bowing a string'],'Brass pitch comes from lip buzzing plus valves/slide altering tube length.']
    ],
    Percussion:[
      ['In drumming, \u201crudiments\u201d are\u2026','fundamental sticking patterns that build technique',['the names of cymbals only','types of sheet music','tuning pegs'],'Rudiments are basic stroke/sticking patterns underpinning drumming technique.'],
      ['A percussionist\u2019s core role in an ensemble is often to\u2026','keep steady time and support the groove',['play the main melody only','tune the string section','conduct the choir'],'Percussion typically anchors tempo and rhythmic feel.']
    ],
    Keyboard:[
      ['How many keys does a standard full-size piano have?','88',['66','72','96'],'A standard modern piano has 88 keys.'],
      ['On a piano, two adjacent keys (including black keys) are\u2026','one semitone apart',['one octave apart','a perfect fifth apart','always a whole tone apart'],'Neighbouring keys, black or white, are one semitone apart.']
    ],
    Voice:[
      ['Healthy singing relies most on\u2026','efficient breath support and relaxed phonation',['shouting from the throat','holding the breath as long as possible','avoiding all warm-ups'],'Good breath support with relaxed vocal production protects and powers the voice.'],
      ['Vocal warm-ups before singing help to\u2026','prepare the voice and reduce strain',['permanently raise the singer\u2019s range','replace the need to breathe','tune the piano'],'Warm-ups ready the voice and lower the risk of strain.']
    ],
    Theory:[
      ['Music theory studies\u2026','how music is organised: notation, rhythm, scales, intervals and harmony',['only the history of instruments','only concert ticket sales','only stage lighting'],'Theory explains the structures and language musicians use.']
    ]
  };

  // instrument-specific verified facts (used only for the matching course)
  var INST={
    'Guitar':['In standard tuning, the six guitar strings from lowest to highest are\u2026','E A D G B E',['C G D A E B','G C E A D G','E A D G C F'],'Standard guitar tuning is E A D G B E (low to high).'],
    'Violin':['The four violin strings are tuned in perfect fifths as\u2026','G D A E',['E A D G','C G D A','G C E A'],'Violin strings are G, D, A, E, a fifth apart.'],
    'Cello':['The four cello strings, lowest to highest, are\u2026','C G D A',['G D A E','E A D G','G C E A'],'Cello is tuned C, G, D, A.'],
    'Bass Guitar':['A standard four-string bass guitar is tuned (low to high)\u2026','E A D G',['E A D G B E','G D A E','G C E A'],'The four-string bass uses E A D G, like the lowest four guitar strings an octave down.'],
    'Ukulele':['A standard (soprano) ukulele is commonly tuned\u2026','G C E A',['E A D G','E A D G B E','C G D A'],'Standard ukulele tuning is G C E A.']
  };

  // ----- instrument catalogue (icon, name, family) -----
  var INSTRUMENTS=[
    ['\uD83C\uDFB8','Guitar','Strings'],['\uD83C\uDFBB','Violin','Strings'],['\uD83C\uDFB7','Saxophone','Woodwind'],
    ['\uD83C\uDFBA','Trumpet','Brass'],['\uD83E\uDD41','Drums & Percussion','Percussion'],['\uD83C\uDFB9','Piano & Keyboard','Keyboard'],
    ['\uD83C\uDFA4','Voice & Singing','Voice'],['\uD83E\uDE95','Banjo','Strings'],['\uD83C\uDFBC','Music Theory & Ear Training','Theory'],
    ['\uD83C\uDFB8','Bass Guitar','Strings'],['\uD83C\uDFB5','Ukulele','Strings'],['\uD83E\uDE88','Flute','Woodwind'],
    ['\uD83C\uDFB6','Clarinet','Woodwind'],['\uD83C\uDFBC','Cello','Strings'],['\uD83E\uDE98','World Percussion','Percussion']
  ];

  function esc(s){return String(s).replace(/[&<>"']/g,function(m){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m];});}
  function stemKey(q){return q.q.trim().toLowerCase();}

  var COURSES={}, QUIZ={};
  INSTRUMENTS.forEach(function(row,idx){
    var icon=row[0], name=row[1], family=row[2];
    var id='instrument-'+idx;
    var modules=[]; var moduleQuizzes=[];
    UNITS.forEach(function(u,ui){
      var mtitle='Module '+(ui+1)+': '+u.title;
      var picks=shuffle(u.pool).slice(0,5).map(Q);
      moduleQuizzes.push(picks);
      modules.push({title:mtitle, focus:u.focus, lessons:[
        {title:mtitle+' \u2014 Concepts and Vocabulary', type:'lesson', duration:'40 min'},
        {title:mtitle+' \u2014 Guided Practice', type:'lesson', duration:'50 min'},
        {title:mtitle+' \u2014 Applied Task / Reflection', type:'lesson', duration:'45 min'},
        {title:mtitle+' \u2014 Knowledge Check', type:'quiz', questions:5, duration:'8 min'}
      ]});
    });
    var finalRows=[]; var used={};
    UNITS.forEach(function(u){ var r=shuffle(u.pool)[0]; finalRows.push(r); });
    (FAMILY[family]||[]).forEach(function(r){ finalRows.push(r); });
    if(INST[name]) finalRows.push(INST[name]);
    var extra=[]; UNITS.forEach(function(u){ u.pool.forEach(function(r){ extra.push(r); }); });
    extra=shuffle(extra);
    var finalQs=[];
    finalRows.forEach(function(r){ var q=Q(r); if(!used[stemKey(q)]){used[stemKey(q)]=1; finalQs.push(q);} });
    for(var e=0;e<extra.length && finalQs.length<15;e++){ var q2=Q(extra[e]); if(!used[stemKey(q2)]){used[stemKey(q2)]=1; finalQs.push(q2);} }
    finalQs=finalQs.slice(0,15);
    modules.push({title:'FINAL ASSESSMENT \u2014 '+name, lessons:[
      {title:name+' \u2014 Final Assessment', type:'quiz', questions:finalQs.length, duration:'20 min', isFinal:true}
    ]});

    COURSES[id]={
      name:name+' (Music Course)', cat:'Music & Instruments', level:1, lvlLabel:'Foundational',
      icon:icon, price:'Free', cert:'CHCN Certificate',
      certFull:'Creator Hub Creator Network Certificate of Completion \u2014 '+name,
      desc:'A structured, self-paced foundation course in '+name+'. You will build safe setup and posture, sound and technique, music notation and rhythm, scales and intervals, chords and harmony, ear training, repertoire and practice planning, and performance and recording skills \u2014 each unit ending with a knowledge check and a final assessment.',
      unitCount:8, totalHours:'Self-paced',
      prerequisites:'No prior experience required; access to the instrument (or voice) is recommended.',
      outcomes:[
        'Set up and play the instrument with safe, sustainable posture',
        'Read basic music notation and keep steady rhythm',
        'Understand scales, keys, intervals, chords and simple harmony',
        'Practise effectively and prepare and reflect on a performance'
      ],
      projects:['Record a short piece and review your own playing','Prepare a small repertoire list and a weekly practice plan'],
      sources:[['musictheory.net (free lessons)','https://www.musictheory.net/'],['teoria \u2014 Music Theory Web','https://www.teoria.com/']],
      modules:modules,
      assessmentPolicy:'Complete each module knowledge check and the final assessment. A score of 80% or higher is recommended to progress.'
    };
    QUIZ[id]={module:moduleQuizzes, final:finalQs};
  });

  window.INSTRUMENT_MUSIC_COURSES=COURSES;
  window.INSTRUMENT_MUSIC_QUIZZES=QUIZ;

  function register(){
    try{ if(window.COURSE_DATA) Object.assign(window.COURSE_DATA, COURSES); }catch(e){}
    window.NEW_QUIZBANK=Object.assign(window.NEW_QUIZBANK||{}, QUIZ);
    try{ if(window.pages) Object.keys(COURSES).forEach(function(id){ if(window.pages.indexOf(id)<0) window.pages.push(id); }); }catch(e){}
    if(typeof window.navigate==='function' && !window.navigate.__instrWrapped){
      var oldNav=window.navigate;
      var wrapped=function(page){ if(COURSES[page] && typeof window.openCourse==='function'){ window.openCourse(page); return; } return oldNav.apply(this,arguments); };
      wrapped.__instrWrapped=true; window.navigate=wrapped;
    }
  }
  register();

  function renderCards(){
    var grid=document.getElementById('coursesGrid'); if(!grid) return;
    if(grid.querySelector('.instrument-music-card')) return;
    Object.keys(COURSES).forEach(function(id){
      var c=COURSES[id];
      var card=document.createElement('div');
      card.className='course-card instrument-music-card';
      card.setAttribute('data-category','Music & Instruments');
      card.setAttribute('data-level','Foundational');
      card.setAttribute('data-price','free');
      card.innerHTML='<div class="card-header"><span class="badge badge-new">Music</span>Music &amp; Instruments</div>'+
        '<div class="card-body"><h3>'+c.icon+' '+esc(c.name)+'</h3><p>'+esc(c.desc)+'</p>'+
        '<div class="course-meta"><span class="level-beginner">Foundational</span><span>'+c.unitCount+' Modules</span><span>Self-Paced</span></div>'+
        '<div class="course-footer"><span class="course-price free">Free</span><button class="btn btn-primary btn-sm">Open Course</button></div></div>';
      card.addEventListener('click',function(){ if(typeof window.openCourse==='function') window.openCourse(id); });
      grid.appendChild(card);
    });
    var sel=document.getElementById('filterCategory');
    if(sel){ var have=false; Array.prototype.forEach.call(sel.options,function(o){ if(o.value==='Music & Instruments') have=true; }); if(!have){ var o=document.createElement('option'); o.value='Music & Instruments'; o.textContent='Music & Instruments'; sel.appendChild(o); } }
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',renderCards); else renderCards();
})();
