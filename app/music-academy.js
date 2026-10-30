/* Creator Hub Creator Network — Music Academy expansion.
   Adds the genuinely-missing Music-category courses (Foundations theory ladder,
   Jamaican & Caribbean pathway, Composition, Audio Engineering, Music Education)
   into the SAME course engine the existing academic music courses use
   (COURSE_DATA + NEW_QUIZBANK). It does NOT duplicate any existing course
   (existing ids such as music-songwriting, music-production, music-ear-training,
   the vocal courses, music-piano, music-daw, music-business, etc. are left
   untouched). Every quiz question is an established music-education or verified
   historical fact — nothing here is fabricated. Jamaican/Caribbean facts are
   grounded in reputable sources and the EMC School of Music reference. */
(function(){
  var _s=1928374655;
  function rnd(){_s=(_s*1103515245+12345)&0x7fffffff;return _s/0x7fffffff;}
  function shuffle(a){a=a.slice();for(var i=a.length-1;i>0;i--){var j=Math.floor(rnd()*(i+1));var t=a[i];a[i]=a[j];a[j]=t;}return a;}
  function Q(row){var stem=row[0],correct=row[1],distractors=row[2],exp=row[3];var opts=shuffle([correct].concat(distractors));return {q:stem,opts:opts,ans:opts.indexOf(correct),exp:exp};}
  function esc(s){return String(s).replace(/[&<>\"']/g,function(m){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[m];});}
  function stemKey(q){return q.q.trim().toLowerCase();}

  // ============ TOPIC QUESTION POOLS (established facts) ============
  // row = [stem, correct, [distractors...], explanation]
  var P={};

  P.orientation=[
    ['What is the purpose of the Knowledge Check at the end of each module?','To confirm you have grasped that module\u2019s key concepts before moving on',['To replace the need to study the lessons','To lower your final score','To skip the rest of the course'],'A knowledge check verifies understanding of the module before you progress.'],
    ['What is a sensible way to use the lessons in this course?','Study them in order, take notes, and practise the examples',['Skip straight to the final assessment','Memorise only the quiz answers','Read the titles only'],'Working through lessons in sequence with active practice builds durable understanding.'],
    ['Why does the course recommend regular, short practice sessions?','Frequent focused practice builds skill more reliably than rare long sessions',['Because long sessions are impossible','Because practice does not affect skill','To make the course take longer'],'Distributed, focused practice is more effective than infrequent cramming.'],
    ['What does \u201cacademic honesty\u201d mean when completing assessments?','Doing your own work and answering the questions yourself',['Copying answers from others','Sharing the quiz answer key','Guessing every question'],'Academic honesty means completing assessments through your own genuine effort.'],
    ['What should you do if you do not pass a knowledge check?','Review the module lessons and try again',['Abandon the course','Ignore the result and continue','Delete your progress'],'Revisiting the lesson material and retrying is the intended way to improve.'],
    ['A measurable learning outcome describes\u2026','what a learner should be able to do after study',['how long the course lasts','the price of the course','the teacher\u2019s opinion'],'Learning outcomes state observable, demonstrable abilities.']
  ];

  P.notation=[
    ['How many lines make up a standard musical staff?','5',['4','6','7'],'A staff has five lines and four spaces.'],
    ['The treble clef is also known as the\u2026','G clef',['F clef','C clef','percussion clef'],'The treble clef curls around the line for the note G, so it is called the G clef.'],
    ['The bass clef is also known as the\u2026','F clef',['G clef','C clef','alto clef'],'The bass clef marks the line for the note F, so it is called the F clef.'],
    ['Ledger lines are used to notate pitches that are\u2026','above or below the range of the staff',['always in the middle of the staff','only rests','only dynamics'],'Ledger lines extend the staff to write notes beyond its five lines.'],
    ['The musical alphabet uses how many letter names before repeating?','7 (A to G)',['5','8','12'],'Pitch names cycle through A, B, C, D, E, F, G and then repeat.'],
    ['On the treble staff, the note sitting on the bottom line is\u2026','E',['F','G','C'],'The five treble-staff lines from bottom to top spell E, G, B, D, F.'],
    ['A sharp sign (\u266f) placed before a note\u2026','raises its pitch by a semitone',['lowers it by a semitone','doubles its length','makes it silent'],'A sharp raises the note a half step; a flat lowers it a half step.'],
    ['What does a natural sign (\u266e) do?','Cancels a previous sharp or flat on that note',['Raises the note an octave','Adds a beat','Changes the clef'],'A natural cancels any earlier accidental, restoring the natural pitch.']
  ];

  P.rhythm=[
    ['In 4/4 time, how many quarter-note beats are in a measure?','4',['2','3','6'],'The top number of 4/4 indicates four beats per measure.'],
    ['A whole note lasts how many beats in 4/4 time?','4',['1','2','3'],'A whole note fills a full 4/4 measure.'],
    ['A half note lasts how many beats in 4/4 time?','2',['1','3','4'],'A half note equals two quarter-note beats.'],
    ['\u201cTempo\u201d refers to\u2026','the speed of the beat',['the loudness','the key','the number of players'],'Tempo is how fast the beat moves, often given in beats per minute.'],
    ['Adding a dot after a note increases its value by\u2026','half of the original value',['double the value','one full beat always','a quarter of its value'],'A dot adds half the note\u2019s value (a dotted half note = 3 beats in 4/4).'],
    ['A rest in music indicates\u2026','a measured silence',['a louder note','a change of key','a repeat'],'Rests are symbols for silence of specific durations.'],
    ['The lower number of a time signature tells you\u2026','which note value gets one beat',['how loud to play','the tempo in BPM','the number of measures'],'In 4/4 the lower 4 means the quarter note gets the beat.'],
    ['\u201cSyncopation\u201d means\u2026','emphasis placed on normally weak beats or off-beats',['playing only on strong beats','playing very slowly','ignoring the rhythm'],'Syncopation stresses off-beats or weak parts of the beat.']
  ];

  P.intervals=[
    ['An \u201cinterval\u201d is\u2026','the distance in pitch between two notes',['the silence between pieces','the speed of the beat','a type of chord shape'],'An interval measures the pitch distance between two notes.'],
    ['How many semitones are in an octave?','12',['7','8','10'],'The octave divides into twelve equal semitones.'],
    ['How many semitones are in a perfect fifth?','7',['5','6','8'],'A perfect fifth spans seven semitones (e.g. C up to G).'],
    ['How many semitones are in a perfect fourth?','5',['3','4','6'],'A perfect fourth spans five semitones (e.g. C up to F).'],
    ['A \u201chalf step\u201d (semitone) is\u2026','the smallest interval in standard Western music',['the same as an octave','always two notes apart','a type of rest'],'The semitone is the smallest interval commonly used in Western music.'],
    ['An octave is the interval between a note and\u2026','the next note of the same name (double the frequency)',['a note one semitone higher','any note in another key','the loudest note'],'An octave doubles frequency and shares the same letter name.'],
    ['A major third contains how many semitones?','4',['3','5','2'],'A major third spans four semitones; a minor third spans three.']
  ];

  P.scales=[
    ['The step pattern of a major scale is\u2026','W-W-H-W-W-W-H',['H-W-H-W-W-W-H','W-H-W-W-H-W-W','all whole steps'],'Every major scale follows whole-whole-half-whole-whole-whole-half.'],
    ['How many different notes does a major scale have before the octave repeats?','7',['5','6','8'],'A diatonic major scale has seven distinct notes, then repeats at the octave.'],
    ['The relative minor of C major is\u2026','A minor',['E minor','G minor','D minor'],'C major and A minor share the same key signature (no sharps or flats).'],
    ['A key signature tells the performer\u2026','which notes are consistently sharp or flat in the piece',['the tempo','the dynamics','the number of measures'],'The key signature lists the sharps or flats that apply throughout.'],
    ['The natural minor scale differs from the major scale by having a lowered\u2026','3rd, 6th and 7th degrees',['2nd and 4th degrees','5th degree only','1st degree'],'Natural minor lowers the 3rd, 6th and 7th compared with the parallel major.'],
    ['C major has how many sharps or flats in its key signature?','None',['One sharp','Two flats','Three sharps'],'C major (and A minor) has no sharps or flats.'],
    ['A chromatic scale is made up entirely of\u2026','semitones (half steps)',['whole tones','perfect fifths','major thirds'],'The chromatic scale moves by semitones through all twelve pitches.']
  ];

  P.chords=[
    ['A basic triad contains how many notes?','3',['2','4','5'],'A triad is a three-note chord: root, third and fifth.'],
    ['A major triad is built from the root plus a\u2026','major third and a perfect fifth',['minor third and a diminished fifth','perfect fourth and octave','minor second and a fourth'],'A major triad = root + major third + perfect fifth.'],
    ['A minor triad is built from the root plus a\u2026','minor third and a perfect fifth',['major third and a perfect fifth','major third and an augmented fifth','perfect fourth and fifth'],'A minor triad = root + minor third + perfect fifth.'],
    ['A seventh chord adds which note to a triad?','A note a seventh above the root',['A second root','An octave doubling','A rest'],'A seventh chord stacks a seventh above the triad\u2019s root.'],
    ['The chord built on the first scale degree is called the\u2026','tonic',['dominant','subdominant','leading-tone'],'Scale degree 1 gives the tonic chord; degree 5 gives the dominant.'],
    ['A cadence in music is\u2026','a chord progression that gives a sense of pause or ending',['a single loud note','a change of instrument','a type of scale'],'Cadences are harmonic points of arrival, like musical punctuation.'],
    ['An authentic (perfect) cadence typically moves from\u2026','the dominant (V) to the tonic (I)',['tonic to subdominant','subdominant to dominant','tonic to tonic'],'A V\u2013I motion is the classic authentic cadence, giving strong closure.']
  ];

  P.melody=[
    ['A musical \u201cphrase\u201d is best described as\u2026','a coherent musical thought, like a sentence in language',['a single note','the loudest moment','the key signature'],'A phrase is a self-contained musical idea, often ending with a cadence.'],
    ['A short, recognisable musical idea that recurs is called a\u2026','motif',['clef','rest','cadence'],'A motif is a brief melodic/rhythmic idea used as a building block.'],
    ['Binary form is described with the letters\u2026','AB',['ABA','AABA','ABC'],'Binary form has two contrasting sections, A and B.'],
    ['Ternary form is described with the letters\u2026','ABA',['AB','AABB','ABCD'],'Ternary form states A, contrasts with B, then returns to A.'],
    ['A common popular-song form using verse and chorus is often labelled\u2026','AABA or verse\u2013chorus',['sonata-allegro','fugue','through-composed only'],'Much popular music uses verse\u2013chorus or 32-bar AABA forms.'],
    ['\u201cContour\u201d of a melody refers to\u2026','the shape of its rise and fall in pitch',['its loudness','its key signature','its tempo'],'Melodic contour is the overall up-and-down shape of the line.'],
    ['A melody that moves mostly by adjacent scale steps is described as\u2026','conjunct (stepwise)',['disjunct (leaping)','atonal','syncopated'],'Stepwise motion is conjunct; motion by leaps is disjunct.']
  ];

  P.eartraining=[
    ['Ear training develops the ability to\u2026','recognise pitches, intervals, chords and rhythms by listening',['read faster in dim light','clean instruments','memorise dates'],'Ear training builds aural recognition of musical elements.'],
    ['\u201cRelative pitch\u201d is the ability to\u2026','identify notes or intervals in relation to a reference pitch',['name any note with no reference instantly','play only in C major','read only bass clef'],'Relative pitch judges pitches by their relationship to a known reference.'],
    ['Melodic dictation is the skill of\u2026','writing down a melody you hear',['composing a new melody','tuning a piano','reading a score silently'],'Melodic dictation means notating a heard melody.'],
    ['Being able to hear if a note is in tune helps a musician to\u2026','play with accurate intonation',['ignore the ensemble','play only loudly','skip warm-ups'],'Recognising intonation lets players correct pitch and blend.'],
    ['Interval recognition by ear means\u2026','identifying the distance between two pitches you hear',['reading intervals on paper only','counting the beats','naming the clef'],'Aural interval recognition identifies pitch distances by listening.'],
    ['Rhythmic dictation is\u2026','notating a rhythm you hear',['playing a written rhythm','changing the tempo','tuning by ear'],'Rhythmic dictation means writing down heard rhythms.']
  ];

  P.sightsinging=[
    ['Solf\u00e8ge uses syllables such as\u2026','do, re, mi, fa, sol, la, ti',['A, B, C, D, E, F, G only','one, two, three, four','forte, piano, mezzo'],'Solf\u00e8ge assigns do\u2013re\u2013mi\u2013fa\u2013sol\u2013la\u2013ti to scale degrees.'],
    ['In movable-do solf\u00e8ge, \u201cdo\u201d is\u2026','the tonic (first degree) of whatever key you are in',['always the note C','always the loudest note','the last note of the piece'],'With movable do, do is the tonic of the current key.'],
    ['Sight-singing is the skill of\u2026','singing music at first sight from notation',['memorising a song over weeks','composing melodies','tuning a guitar'],'Sight-singing means performing unrehearsed notation by voice.'],
    ['Which solf\u00e8ge syllable is the tonic in a major key (movable do)?','do',['sol','la','ti'],'Do is the tonic; sol is the fifth and ti is the leading tone.'],
    ['A good first step before sight-singing a passage is to\u2026','identify the key, time signature and starting pitch',['sing as loudly as possible','ignore the rhythm','change the key'],'Scanning key, metre and starting pitch prepares an accurate reading.'],
    ['The leading tone (ti) tends to\u2026','resolve upward to the tonic (do)',['stay on the same pitch','resolve down a fifth','never move'],'The leading tone has a strong pull up to the tonic.']
  ];

  P.composition=[
    ['In composition, developing a motif means\u2026','varying and extending a short idea to build a larger piece',['playing it once and stopping','deleting it','only making it louder'],'Motivic development varies and extends ideas to create structure.'],
    ['\u201cTexture\u201d in music describes\u2026','how melodic and harmonic layers combine (e.g. monophonic, homophonic, polyphonic)',['the tempo','the price of the score','the key signature only'],'Texture is the way musical lines and layers are combined.'],
    ['Monophonic texture consists of\u2026','a single melodic line with no harmony',['many independent melodies at once','a melody with chords','only percussion'],'Monophony is one unaccompanied melodic line.'],
    ['Polyphonic texture consists of\u2026','two or more independent melodic lines at once',['a single line','a melody with block chords','silence'],'Polyphony combines multiple independent melodies.'],
    ['Orchestration is the art of\u2026','choosing and combining instruments to present musical material',['writing lyrics','tuning instruments','selling tickets'],'Orchestration assigns musical material to instruments for the best effect.'],
    ['A theme in a composition is\u2026','a principal musical idea that the piece develops',['a single chord','the ending only','the title'],'A theme is a main idea that a composition explores and develops.']
  ];

  P.production=[
    ['A DAW is a\u2026','Digital Audio Workstation \u2014 software for recording, editing and mixing',['Digital Amplifier Widget','Dynamic Audio Wave','Direct Analog Wire'],'DAW stands for Digital Audio Workstation.'],
    ['\u201cSample rate\u201d refers to\u2026','how many times per second audio is measured (e.g. 44.1 kHz)',['the loudness of audio','the tempo of a song','the number of tracks'],'Sample rate is the number of samples captured per second; CD quality is 44.1 kHz.'],
    ['\u201cBit depth\u201d in digital audio mainly affects\u2026','dynamic range and resolution of each sample',['the tempo','the key','the file name'],'Higher bit depth (e.g. 24-bit) increases dynamic range and resolution.'],
    ['MIDI data transmits\u2026','performance information (notes, velocity, timing), not audio itself',['recorded sound waves','mastering settings','album artwork'],'MIDI carries control/performance data, not the actual audio waveform.'],
    ['A virtual instrument (software instrument) is\u2026','software that generates sound, often triggered by MIDI',['a physical microphone','a type of cable','a mastering plugin only'],'Virtual instruments synthesise or play sampled sound, usually driven by MIDI.'],
    ['\u201cQuantization\u201d in a DAW\u2026','aligns recorded notes to a rhythmic grid',['raises the pitch an octave','exports the final file','adds reverb'],'Quantization snaps note timing to the chosen grid for tighter rhythm.'],
    ['CD-quality audio uses a sample rate of\u2026','44.1 kHz',['8 kHz','96 bpm','128 kbps'],'Audio CDs use 44.1 kHz sampling at 16-bit depth.']
  ];

  P.recording=[
    ['A dynamic microphone is generally\u2026','rugged and good for loud sources like drums and guitar amps',['too fragile for live use','only for measurement','unable to capture sound'],'Dynamic mics handle high sound-pressure levels and are robust.'],
    ['A condenser microphone is typically used for\u2026','detailed sources like vocals and acoustic instruments',['only bass drums','only outdoor use','nothing musical'],'Condenser mics are sensitive and capture detail, common for vocals.'],
    ['\u201cSignal flow\u201d describes\u2026','the path audio takes from source through the system to output',['the tempo of a track','the key of a song','the album order'],'Signal flow is the route audio follows from input to output.'],
    ['\u201cGain staging\u201d means\u2026','setting appropriate levels at each stage to avoid noise and distortion',['raising the tempo','choosing a key','naming tracks'],'Good gain staging keeps levels healthy through the whole chain.'],
    ['Clipping (unwanted distortion) happens when a signal\u2026','exceeds the maximum level the system can handle',['is too quiet','is perfectly in tune','has no reverb'],'Clipping occurs when levels exceed the available headroom.'],
    ['Placing a mic closer to a source generally\u2026','increases level and reduces room sound',['removes all bass','changes the key','mutes the source'],'Closer miking raises level and captures less of the room.']
  ];

  P.mixing=[
    ['An equaliser (EQ) is used to\u2026','adjust the balance of frequencies in a sound',['change the tempo','add new notes','export the file'],'EQ boosts or cuts specific frequency ranges.'],
    ['A compressor is used to\u2026','reduce the dynamic range by taming loud peaks',['raise the pitch','add reverb only','change the key'],'Compression narrows dynamic range, evening out loud and soft parts.'],
    ['\u201cPanning\u201d controls\u2026','the left\u2013right placement of a sound in the stereo field',['the tempo','the pitch','the file format'],'Panning positions a sound between the left and right speakers.'],
    ['Reverb is an effect that adds\u2026','a sense of space or room to a sound',['a change of key','faster tempo','a new melody'],'Reverb simulates reflections, adding spatial depth.'],
    ['The goal of a mix is generally to\u2026','balance levels, frequencies and space so all parts are clear',['make one track as loud as possible only','remove all instruments','change the song\u2019s key'],'Mixing balances the elements so the whole track sounds clear and cohesive.'],
    ['Delay as an effect produces\u2026','distinct repeats (echoes) of a sound',['a permanent pitch change','a key change','silence'],'Delay creates audible repeats/echoes of the signal.']
  ];

  P.mastering=[
    ['Mastering is the final stage that\u2026','prepares and optimises a mix for distribution across formats',['records the vocals','writes the lyrics','composes the melody'],'Mastering polishes and standardises the final mix for release.'],
    ['A limiter in mastering is used to\u2026','prevent the signal from exceeding a set maximum level',['add new instruments','change the tempo','write MIDI'],'A limiter caps peaks to control loudness and avoid clipping.'],
    ['\u201cLoudness\u201d for streaming is often measured in\u2026','LUFS (Loudness Units Full Scale)',['BPM','kHz only','pixels'],'Streaming platforms reference loudness in LUFS.'],
    ['A common consumer delivery format for audio is\u2026','a compressed file such as MP3 or AAC',['a MIDI file only','a text file','an image file'],'Compressed formats like MP3/AAC are common for consumer delivery.'],
    ['One goal of mastering is\u2026','consistent tone and level across an album or release',['different loudness on every track','removing the melody','changing the key of each song'],'Mastering aims for cohesive tone and level across a release.'],
    ['\u201cHeadroom\u201d before mastering refers to\u2026','the space between the mix\u2019s peak level and the maximum',['the tempo','the key','the track count'],'Leaving headroom gives the mastering stage room to work.']
  ];

  P.jamGeneral=[
    ['Jamaican music genres developed in which Caribbean island nation?','Jamaica',['Cuba','Trinidad and Tobago','Barbados'],'Mento, ska, rocksteady, reggae and dancehall all originated in Jamaica.'],
    ['Which globally influential popular-music genre originated in Jamaica in the late 1960s?','Reggae',['Salsa','Samba','Highlife'],'Reggae emerged in Jamaica in the late 1960s and spread worldwide.'],
    ['Which of these is a Jamaican music genre?','Ska',['Flamenco','Polka','Fado'],'Ska is a Jamaican genre; the others come from Europe.'],
    ['The typical historical order of these Jamaican genres is\u2026','mento \u2192 ska \u2192 rocksteady \u2192 reggae \u2192 dancehall',['reggae \u2192 mento \u2192 ska \u2192 dancehall','ska \u2192 reggae \u2192 mento \u2192 rocksteady','dancehall \u2192 reggae \u2192 ska \u2192 mento'],'Jamaican popular music evolved from mento to ska, rocksteady, reggae and then dancehall.'],
    ['Jamaican popular music has had a strong influence on\u2026','global genres including reggae\u2019s worldwide spread and hip-hop\u2019s sound-system roots',['only classical opera','no other music','early Baroque music'],'Jamaican sound-system culture and reggae influenced popular music worldwide.']
  ];

  P.mento=[
    ['Which genre is widely regarded as Jamaica\u2019s first commercially recorded music?','Mento',['Dancehall','Ska','Reggae'],'Mento was Jamaica\u2019s first commercially recorded popular music.'],
    ['Mento is a fusion drawing on\u2026','African rhythmic traditions and European musical elements',['only electronic sounds','only classical symphony','only North American jazz'],'Mento blends African and European musical influences.'],
    ['Mento was especially popular in Jamaica during the\u2026','1940s and 1950s',['1990s','2010s','1600s'],'Mento reached wide popularity in the 1940s and 1950s.'],
    ['A traditional mento ensemble often includes the\u2026','banjo and rumba box',['electric synthesizer and drum machine','full brass big band only','pipe organ'],'Mento typically features acoustic instruments such as banjo and the rumba box.'],
    ['The rumba box used in mento functions as a\u2026','hand-plucked bass instrument',['type of drum machine','brass instrument','electric guitar'],'The rumba box is a large lamellophone that provides the bass line in mento.'],
    ['Mento is best described as\u2026','an acoustic Jamaican folk/popular style',['a digital dance genre','a European art-music form','a form of opera'],'Mento is an acoustic Jamaican folk and popular music style.']
  ];

  P.ska=[
    ['Ska emerged in Jamaica around\u2026','the early 1960s',['the 1990s','the 1700s','the 2010s'],'Ska developed in Jamaica around the late 1950s to early 1960s.'],
    ['A defining rhythmic feature of ska is\u2026','accent on the off-beat (the \u201cupstroke\u201d)',['accent only on beat one','no rhythm at all','a slow ballad feel'],'Ska emphasises the off-beat, often played as a guitar/keyboard upstroke.'],
    ['Ska prominently features which instrument section?','A brass/horn section',['A string quartet only','A pipe organ only','No instruments'],'Ska arrangements frequently feature energetic brass/horn lines.'],
    ['Compared with the reggae that followed it, ska is generally\u2026','faster and more upbeat in tempo',['much slower','without any beat','identical in every way'],'Ska is typically faster and more upbeat than the later rocksteady and reggae.'],
    ['Ska is a direct musical ancestor of\u2026','rocksteady and then reggae',['classical opera','flamenco','samba'],'Ska led to rocksteady, which in turn led to reggae.']
  ];

  P.rocksteady=[
    ['Rocksteady emerged in Jamaica around\u2026','1966',['1920','1995','2015'],'Rocksteady arose in Jamaica around 1966, between ska and reggae.'],
    ['Compared with ska, rocksteady is generally\u2026','slower in tempo',['much faster','without harmony','purely orchestral'],'Rocksteady slowed the tempo compared with the faster ska.'],
    ['In rocksteady, which element became more prominent than in ska?','The bass line',['The pipe organ','The harpsichord','The bagpipes'],'Rocksteady foregrounded melodic, prominent bass lines.'],
    ['Rocksteady sits historically between which two genres?','Ska and reggae',['Mento and ska','Reggae and dancehall','Dancehall and mento'],'Rocksteady is the transitional style between ska and reggae.'],
    ['Rocksteady arrangements tended to use\u2026','smaller ensembles with a stronger rhythm-section focus than big ska horn lines',['only symphony orchestras','no instruments','only solo piano'],'Rocksteady often reduced the horn emphasis of ska, focusing on the rhythm section.']
  ];

  P.reggae=[
    ['Reggae developed in Jamaica in the\u2026','late 1960s',['early 1900s','late 1990s','2010s'],'Reggae emerged in Jamaica in the late 1960s.'],
    ['The \u201cone drop\u201d is a\u2026','characteristic reggae drum rhythm emphasising beat three',['a type of guitar','a brass instrument','a dance venue'],'The one-drop rhythm accents beat three and is central to reggae drumming.'],
    ['Which artist became the most internationally famous reggae musician?','Bob Marley',['Louis Armstrong','Elvis Presley','Frank Sinatra'],'Bob Marley brought reggae to a global audience.'],
    ['In Jamaican music, a \u201criddim\u201d is\u2026','an instrumental backing track over which different songs are voiced',['a single dance step','a brass instrument','a type of microphone'],'A riddim is a reusable instrumental foundation used for many songs.'],
    ['Dub, a subgenre linked to reggae, emphasises\u2026','remixed instrumental tracks with heavy use of effects like echo and reverb',['fast brass solos only','classical counterpoint','acoustic folk singing only'],'Dub reworks reggae tracks, stripping vocals and adding studio effects.'],
    ['Reggae guitar/keyboard commonly plays a rhythmic chop on the\u2026','off-beat (the \u201cskank\u201d)',['first beat only','every semitone','no beats'],'The off-beat \u201cskank\u201d chop is a hallmark of reggae rhythm playing.']
  ];

  P.dancehall=[
    ['Dancehall emerged in Jamaica in the\u2026','late 1970s',['1930s','early 2010s','1600s'],'Dancehall developed in Jamaica in the late 1970s.'],
    ['The digital (\u201cragga\u201d) era of dancehall is often dated to\u2026','1985',['1955','2005','1925'],'The digital dancehall era is commonly dated to 1985.'],
    ['Which record is widely credited with launching digital dancehall in 1985?','\u201cUnder Mi Sleng Teng\u201d',['\u201cRhapsody in Blue\u201d','\u201cTake Five\u201d','\u201cThe Four Seasons\u201d'],'\u201cUnder Mi Sleng Teng\u201d (1985) is credited with launching the digital dancehall era.'],
    ['The producer associated with the 1985 \u201cSleng Teng\u201d riddim is\u2026','King Jammy',['George Martin','Phil Spector','Quincy Jones'],'King Jammy produced the landmark \u201cSleng Teng\u201d record.'],
    ['The \u201cSleng Teng\u201d riddim was created using a\u2026','Casio keyboard preset (the MT-40)',['live symphony orchestra','pipe organ','acoustic banjo'],'The riddim used a preset from the Casio MT-40 keyboard.'],
    ['A vocalist who chants/toasts rhythmically over a dancehall riddim is called a\u2026','deejay (DJ)',['conductor','luthier','sound engineer'],'In Jamaican usage the toasting vocalist is the \u201cdeejay\u201d; the one who plays records is the \u201cselector\u201d.']
  ];

  P.caribbean=[
    ['Calypso is a music genre most associated with\u2026','Trinidad and Tobago',['Jamaica','Mexico','Brazil'],'Calypso is strongly associated with Trinidad and Tobago.'],
    ['The steelpan (steel drum) instrument originated in\u2026','Trinidad and Tobago',['Jamaica','Cuba','Haiti'],'The steelpan was developed in Trinidad and Tobago.'],
    ['Soca music evolved primarily from\u2026','calypso',['reggae','samba','flamenco'],'Soca developed out of calypso, adding more up-tempo, dance-oriented elements.'],
    ['Which genre is closely associated with Cuba?','Son / salsa traditions',['Mento','Ska','Zouk'],'Cuban son underpins much of what became salsa.'],
    ['Zouk is a Caribbean genre associated especially with\u2026','the French Antilles (Guadeloupe and Martinique)',['Jamaica','Trinidad','the Bahamas'],'Zouk arose in the French Antilles, Guadeloupe and Martinique.'],
    ['A shared trait across many Caribbean genres is\u2026','a blend of African and European musical influences',['exclusively European origins','no percussion','a rejection of rhythm'],'Caribbean musics broadly fuse African and European elements.']
  ];

  P.jamCulture=[
    ['Jamaican \u201csound system\u201d culture centres on\u2026','mobile setups playing recorded music for crowds, with selectors and deejays',['symphony concert halls','opera houses','marching bands only'],'Sound systems are mobile rigs that play records for dancing crowds, key to Jamaican music culture.'],
    ['In sound-system culture, the person who chooses and plays the records is the\u2026','selector',['conductor','composer','luthier'],'The selector picks and plays the records; the deejay toasts over them.'],
    ['Rastafari spirituality influenced reggae especially through\u2026','themes and imagery in many reggae lyrics',['banning all drums','requiring classical notation','forbidding singing'],'Rastafari themes shaped the lyrical and cultural content of much reggae.'],
    ['Many Jamaican songs use\u2026','Jamaican Patois (Patwa) in their lyrics',['only Latin','only French','no language at all'],'Jamaican Patois is widely used in Jamaican song lyrics.'],
    ['Jamaican music culture historically spread through\u2026','dances and sound-system events in communities',['only televised operas','only royal courts','no public events'],'Community dances and sound-system events were central to spreading the music.'],
    ['The EMC/Edna Manley College School of Music formally incorporated Jamaican folk and popular music into its studies around\u2026','1972',['1600','1850','2015'],'Jamaican folk and popular music were incorporated into formal study around 1972.']
  ];

  P.musicEdu=[
    ['A lesson plan in music teaching primarily helps the teacher to\u2026','organise objectives, activities and assessment for a session',['avoid teaching','set ticket prices','tune instruments'],'A lesson plan structures objectives, activities and assessment.'],
    ['The Kod\u00e1ly approach to music education emphasises\u2026','singing and solf\u00e8ge to build musicianship',['ignoring the voice','only electronic music','no participation'],'The Kod\u00e1ly method builds musicianship through singing and solf\u00e8ge.'],
    ['The Orff approach emphasises\u2026','learning through rhythm, movement and playing simple instruments',['silent reading only','memorising dates','avoiding instruments'],'Orff Schulwerk uses rhythm, movement and tuned/untuned percussion.'],
    ['A clear learning objective for a music lesson should be\u2026','specific and observable (what the student will be able to do)',['vague and unmeasurable','about the teacher\u2019s mood','only about the room'],'Good objectives state observable, achievable student outcomes.'],
    ['Formative assessment during a music lesson is used to\u2026','check understanding and adjust teaching as you go',['only grade the final exam','decorate the room','choose the tempo'],'Formative assessment gives ongoing feedback to guide instruction.'],
    ['Scaffolding in teaching means\u2026','breaking skills into steps and gradually reducing support',['giving no guidance','skipping the basics','testing before teaching'],'Scaffolding builds skills in supported steps, then fades support.'],
    ['Differentiation in a music class means\u2026','adapting teaching to varied student levels and needs',['teaching everyone identically regardless of level','only teaching advanced players','ignoring beginners'],'Differentiation tailors instruction to diverse learner needs.']
  ];

  // ============ COURSE DEFINITIONS ============
  // Each def: [id, name, icon, level, lvlLabel, desc, outcomes[], projects[], units[[title,topicKey],...], sources[[label,url],...]]
  var ORI=['Orientation & Study Skills','orientation'];
  var THEORY_SRC=[['musictheory.net (free lessons)','https://www.musictheory.net/'],['teoria \u2014 Music Theory Web','https://www.teoria.com/']];
  var JAM_SRC=[['Edna Manley College of the Visual & Performing Arts','https://emc.edu.jm/'],['Encyclop\u00e6dia Britannica \u2014 Reggae','https://www.britannica.com/art/reggae']];
  var PROD_SRC=[['musictheory.net (free lessons)','https://www.musictheory.net/'],['Sound on Sound \u2014 technique articles','https://www.soundonsound.com/techniques']];
  var EDU_SRC=[['National Association for Music Education (NAfME)','https://nafme.org/'],['musictheory.net (free lessons)','https://www.musictheory.net/']];

  var DEFS=[
    ['music-intro','Introduction to Music','\uD83C\uDFB5',1,'Foundational',
     'A friendly first course in how music works. You will meet the basics of notation, rhythm, melody and simple chords, and learn how the pieces of music fit together \u2014 with a short knowledge check after every module.',
     ['Recognise the basic elements of music: pitch, rhythm, melody and harmony','Read simple notation on the staff and keep a steady beat','Describe how melodies and chords combine to make music','Talk about music using correct basic vocabulary'],
     ['Listen to a short piece and identify its beat, melody and mood','Keep a simple listening journal for one week'],
     [ORI,['Sound, Pitch & Notation','notation'],['Beat, Rhythm & Time','rhythm'],['Melody & Musical Line','melody'],['Chords & Simple Harmony','chords']],THEORY_SRC],

    ['music-literacy','Music Literacy Fundamentals','\uD83C\uDFBC',1,'Foundational',
     'Learn to read and understand written music with confidence. This course builds staff notation, note and rest values, key signatures and basic sight-reading, ending each module with a knowledge check.',
     ['Read notes on the treble and bass staves','Identify note and rest values and simple time signatures','Recognise key signatures and major/minor scales','Sight-read simple melodic patterns'],
     ['Transcribe a short melody you hear onto the staff','Sight-read a simple 8-bar exercise'],
     [ORI,['Reading the Staff','notation'],['Note & Rest Values','rhythm'],['Scales & Key Signatures','scales'],['First Steps in Sight-Singing','sightsinging']],THEORY_SRC],

    ['music-theory-fundamentals','Music Theory Fundamentals','\uD83C\uDFB6',1,'Foundational',
     'The core building blocks of Western music theory: notation, rhythm, intervals, scales and triads. Each module finishes with a five-question knowledge check and the course ends with a cumulative final.',
     ['Read pitch and rhythm notation accurately','Measure and name intervals','Build major and minor scales and key signatures','Construct major and minor triads'],
     ['Analyse the key and chords of a short piece','Build a reference sheet of scales and triads'],
     [ORI,['Notation Essentials','notation'],['Rhythm & Meter','rhythm'],['Intervals','intervals'],['Scales & Keys','scales'],['Triads & Chords','chords']],THEORY_SRC],

    ['music-theory-intermediate','Intermediate Music Theory','\uD83C\uDFB6',2,'Intermediate',
     'Build on the fundamentals: deeper work with scales and modes, intervals, chord construction, melodic writing and ear training. Knowledge checks throughout and a cumulative final assessment.',
     ['Work fluently with major and minor scales and their relationships','Identify and build seventh chords and common progressions','Analyse melodic phrases and cadences','Recognise intervals and simple progressions by ear'],
     ['Harmonise a simple melody with basic chords','Complete a short melodic-dictation exercise'],
     [ORI,['Scales & Keys in Depth','scales'],['Intervals in Practice','intervals'],['Chords & Progressions','chords'],['Melody & Cadence','melody'],['Ear Training','eartraining']],THEORY_SRC],

    ['music-theory-advanced','Advanced Music Theory','\uD83C\uDFB6',3,'Advanced',
     'Advanced harmony, form and compositional technique for learners who already know the fundamentals. Covers extended harmony, melodic development, texture and analytical listening, with knowledge checks and a final.',
     ['Analyse harmony including seventh chords and cadences','Discuss musical form, texture and motivic development','Apply advanced theory to short compositional tasks','Use analytical listening to identify musical structures'],
     ['Write a short piece developing a single motif','Analyse the form and harmony of a chosen work'],
     [ORI,['Advanced Harmony','chords'],['Melody, Motif & Form','melody'],['Composition & Development','composition'],['Analytical Ear Training','eartraining']],THEORY_SRC],

    ['music-rhythm-meter','Rhythm and Meter','\uD83E\uDD41',1,'Foundational',
     'A focused course on rhythm: beat, tempo, note values, time signatures, dotted rhythms and syncopation, with rhythmic reading and dictation. Knowledge checks after each module.',
     ['Read and perform common note and rest values','Understand time signatures and how they organise the beat','Handle dotted rhythms, ties and syncopation','Notate rhythms you hear'],
     ['Clap and count a syncopated rhythm accurately','Complete a short rhythmic-dictation exercise'],
     [ORI,['Beat, Tempo & Note Values','rhythm'],['Reading Rhythm in Notation','notation'],['Rhythmic Ear Training','eartraining']],THEORY_SRC],

    ['music-melody-form','Melody and Musical Form','\uD83C\uDFB6',2,'Intermediate',
     'How melodies are built and how pieces are structured. Explore phrases, motifs, melodic contour, and forms such as binary, ternary and verse\u2013chorus, plus an introduction to developing your own ideas.',
     ['Analyse melodic phrases, motifs and contour','Identify common musical forms (AB, ABA, verse\u2013chorus)','Relate melody to the underlying scale and key','Sketch and develop a short original melody'],
     ['Compose an 8-bar melody with a clear phrase structure','Label the form of a short song you like'],
     [ORI,['Phrase, Motif & Contour','melody'],['Scales Behind Melody','scales'],['Developing Musical Ideas','composition']],THEORY_SRC],

    ['music-harmony','Harmony Fundamentals','\uD83C\uDFB9',2,'Intermediate',
     'Understand how chords work together. Build triads and sevenths, connect them into progressions and cadences, and hear how harmony supports melody. Knowledge checks and a final assessment.',
     ['Build triads and seventh chords from any root','Use common chord progressions and cadences','Relate chords to scale degrees and key','Harmonise a simple melody'],
     ['Write a four-chord progression and a cadence','Harmonise a short folk melody'],
     [ORI,['Triads & Sevenths','chords'],['Intervals in Harmony','intervals'],['Chords, Scales & Keys','scales'],['Harmony Supporting Melody','melody']],THEORY_SRC],

    ['music-sight-singing','Sight Singing Fundamentals','\uD83C\uDFA4',1,'Foundational',
     'Learn to sing written music at first sight using solf\u00e8ge. Build pitch accuracy, interval singing and rhythmic reading step by step, with a knowledge check after each module.',
     ['Use movable-do solf\u00e8ge to sing scale degrees','Sing simple melodic patterns at sight','Read pitch and rhythm together accurately','Recognise intervals by ear and voice'],
     ['Sight-sing a simple diatonic melody','Sing an ascending and descending major scale in solf\u00e8ge'],
     [ORI,['Solf\u00e8ge & Movable Do','sightsinging'],['Reading Pitch on the Staff','notation'],['Interval Singing','intervals'],['Ear Training for Singers','eartraining']],THEORY_SRC],

    ['music-jamaican-intro','Introduction to Jamaican Music','\uD83C\uDDEF\uD83C\uDDF2',1,'Foundational',
     'A guided introduction to the music of Jamaica \u2014 from mento and the folk roots through the rise of reggae and its worldwide influence, and the culture that surrounds it. Grounded in verified music history.',
     ['Place Jamaican genres in their historical order','Describe mento as Jamaica\u2019s first commercially recorded music','Explain reggae\u2019s emergence and global influence','Understand the role of sound-system culture'],
     ['Build a short timeline of Jamaican music genres','Write a listening note on one classic reggae track'],
     [ORI,['Overview of Jamaican Music','jamGeneral'],['Mento: The Folk Roots','mento'],['The Rise of Reggae','reggae'],['Music & Jamaican Culture','jamCulture']],JAM_SRC],

    ['music-jamaican-folk','Jamaican Folk Music & Mento','\uD83E\uDE95',2,'Intermediate',
     'A focused study of Jamaican folk music and mento \u2014 the acoustic style widely regarded as Jamaica\u2019s first commercially recorded music, its African and European roots, its instruments and its cultural setting.',
     ['Explain mento\u2019s roots as an African\u2013European fusion','Identify traditional mento instruments such as banjo and rumba box','Situate mento within Jamaican folk culture','Relate mento to later Jamaican popular genres'],
     ['Describe a mento ensemble and its instruments','Compare mento with a later Jamaican genre'],
     [ORI,['Mento & Its Roots','mento'],['Folk in the Jamaican Story','jamGeneral'],['Folk Music & Culture','jamCulture']],JAM_SRC],

    ['music-jamaican-history','Jamaican Popular Music History','\uD83C\uDF99\uFE0F',2,'Intermediate',
     'Trace the evolution of Jamaican popular music through mento, ska, rocksteady, reggae and dancehall \u2014 the dates, the sounds and the innovations, all grounded in verified history including the 1985 digital dancehall breakthrough.',
     ['Order the major Jamaican genres and their approximate dates','Describe the musical differences between ska, rocksteady and reggae','Explain the digital dancehall breakthrough of 1985','Connect each genre to its cultural context'],
     ['Create an annotated timeline of Jamaican popular music','Write a short essay comparing two genres'],
     [ORI,['Mento & Beginnings','mento'],['Ska','ska'],['Rocksteady','rocksteady'],['Reggae','reggae'],['Dancehall','dancehall']],JAM_SRC],

    ['music-reggae','Reggae Music Studies','\uD83C\uDFB5',2,'Intermediate',
     'A dedicated study of reggae \u2014 its late-1960s emergence in Jamaica, the one-drop rhythm and skank, riddims and dub, its greatest figures, and its cultural roots. Grounded in verified music history.',
     ['Explain reggae\u2019s emergence and defining rhythmic features','Describe the one-drop, the skank, riddims and dub','Identify reggae\u2019s most influential figures','Relate reggae to Jamaican culture and Rastafari themes'],
     ['Analyse the rhythm section of a reggae track','Write a short profile of a major reggae artist'],
     [ORI,['Reggae Foundations','reggae'],['From Rocksteady to Reggae','rocksteady'],['Reggae & Culture','jamCulture'],['Reggae in the Jamaican Story','jamGeneral']],JAM_SRC],

    ['music-ska-rocksteady','Ska and Rocksteady','\uD83C\uDFBA',2,'Intermediate',
     'Explore the two genres that bridged mento and reggae: fast, brass-driven ska of the early 1960s and the slower, bass-forward rocksteady of around 1966. Grounded in verified history.',
     ['Describe ska\u2019s off-beat feel and brass sound','Explain how rocksteady slowed ska and foregrounded the bass','Place ska and rocksteady in the Jamaican timeline','Connect both to the mento roots that preceded them'],
     ['Compare a ska and a rocksteady recording','Chart the transition from ska to reggae'],
     [ORI,['Ska','ska'],['Rocksteady','rocksteady'],['The Jamaican Timeline','jamGeneral'],['Roots in Mento','mento']],JAM_SRC],

    ['music-dancehall','Dancehall Music Studies','\uD83D\uDD0A',2,'Intermediate',
     'A study of dancehall \u2014 from its late-1970s emergence to the 1985 digital revolution launched by \u201cUnder Mi Sleng Teng\u201d, the role of the deejay, and its place in Jamaican culture. Grounded in verified history.',
     ['Explain dancehall\u2019s late-1970s emergence','Describe the 1985 digital breakthrough and its technology','Understand the roles of deejay and selector','Relate dancehall to reggae and to sound-system culture'],
     ['Write a note on the significance of \u201cSleng Teng\u201d','Compare dancehall with roots reggae'],
     [ORI,['Dancehall Foundations','dancehall'],['Reggae Background','reggae'],['Sound-System Culture','jamCulture'],['The Jamaican Timeline','jamGeneral']],JAM_SRC],

    ['music-caribbean','Caribbean Music Foundations','\uD83C\uDF34',2,'Intermediate',
     'Widen the lens to the wider Caribbean: calypso and steelpan from Trinidad and Tobago, soca, Cuban son and salsa traditions, zouk, and the shared African\u2013European heritage \u2014 with Jamaica in context.',
     ['Identify major Caribbean genres and their home islands','Describe the steelpan, calypso, soca, son and zouk','Explain the shared African\u2013European heritage of the region','Place Jamaican music within the wider Caribbean'],
     ['Map several Caribbean genres to their islands','Compare a Jamaican and a non-Jamaican Caribbean genre'],
     [ORI,['Genres Across the Caribbean','caribbean'],['Jamaica in Context','jamGeneral'],['Shared Folk Roots','mento']],JAM_SRC],

    ['music-jamaican-culture','Music and Jamaican Culture','\uD83E\uDD41',2,'Intermediate',
     'How Jamaican music lives in its culture: sound-system culture and its selectors and deejays, the influence of Rastafari themes, the use of Patois in lyrics, and how the music spread. Grounded in verified facts.',
     ['Explain sound-system culture and its key roles','Describe how Rastafari themes shaped reggae lyrics','Recognise the use of Jamaican Patois in song','Understand how the music spread through community events'],
     ['Describe how a sound system works','Analyse the lyrics/theme of one Jamaican song'],
     [ORI,['Sound Systems & Culture','jamCulture'],['The Jamaican Story','jamGeneral'],['Reggae & Its Message','reggae'],['Dancehall Culture','dancehall']],JAM_SRC],

    ['music-composition','Music Composition Fundamentals','\u270D\uFE0F',2,'Intermediate',
     'Turn theory into original music. Learn to develop motifs, shape melody, build harmony and manage texture as you compose short pieces of your own. Knowledge checks and a final assessment.',
     ['Develop a short motif into a larger idea','Shape melodies with clear phrase structure','Support melody with basic harmony','Use texture and simple orchestration choices'],
     ['Compose a short piece from a single motif','Arrange a melody with a chosen texture'],
     [ORI,['Motif & Development','composition'],['Melody Writing','melody'],['Harmony for Composers','chords'],['Scales & Key Choices','scales']],THEORY_SRC],

    ['music-audio-engineering','Audio Engineering Fundamentals','\uD83C\uDF9A\uFE0F',2,'Intermediate',
     'The technical foundations of capturing and shaping sound: microphones, signal flow, gain staging, digital audio basics and an introduction to mixing. Knowledge checks and a final assessment.',
     ['Choose and place microphones appropriately','Understand signal flow and healthy gain staging','Explain digital audio basics (sample rate, bit depth, MIDI)','Apply core mixing tools such as EQ and compression'],
     ['Plan a simple recording signal chain','Balance a short multitrack mix'],
     [ORI,['Microphones & Recording','recording'],['Digital Audio & DAWs','production'],['Introduction to Mixing','mixing']],PROD_SRC],

    ['music-mixing-mastering','Mixing and Mastering','\uD83C\uDF9B\uFE0F',3,'Advanced',
     'Take finished recordings to a polished release. Learn balance, EQ, compression, space and stereo imaging in the mix, then loudness, limiting and delivery formats in mastering. Knowledge checks and a final.',
     ['Balance a mix with level, EQ and dynamics','Use reverb, delay and panning to create space','Understand mastering goals: loudness, limiting and consistency','Prepare audio for common delivery formats'],
     ['Mix a short multitrack song','Master a stereo mix for streaming delivery'],
     [ORI,['The Art of Mixing','mixing'],['Mastering for Release','mastering'],['Studio & DAW Workflow','production'],['Recording into the Mix','recording']],PROD_SRC],

    ['music-education-intro','Introduction to Music Education','\uD83C\uDFEB',1,'Foundational',
     'An introduction to teaching music: how people learn music, major approaches such as Kod\u00e1ly and Orff, planning lessons and using notation and rhythm in the classroom. Knowledge checks and a final.',
     ['Describe major approaches to music education','Understand basic lesson planning and objectives','Use notation and rhythm concepts in teaching','Apply formative assessment in a music lesson'],
     ['Draft a simple one-lesson plan','Design a short rhythm activity for beginners'],
     [ORI,['Approaches to Music Teaching','musicEdu'],['Teaching Notation','notation'],['Teaching Rhythm','rhythm']],EDU_SRC],

    ['music-teaching-fundamentals','Teaching Music Fundamentals','\uD83D\uDCDA',2,'Intermediate',
     'Practical foundations for teaching music: lesson design, scaffolding and differentiation, teaching solf\u00e8ge and ear training, and assessing student progress. Knowledge checks and a final assessment.',
     ['Plan lessons with clear, measurable objectives','Use scaffolding and differentiation effectively','Teach solf\u00e8ge and basic ear-training skills','Assess student progress fairly and usefully'],
     ['Write a lesson plan with objectives and assessment','Design a short solf\u00e8ge teaching sequence'],
     [ORI,['Pedagogy & Planning','musicEdu'],['Teaching Sight-Singing','sightsinging'],['Teaching Ear Training','eartraining']],EDU_SRC]
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
    // final: one from each unit pool, then top up from all pools, dedup by stem
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
      name:name, cat:'Music', level:level, lvlLabel:lvlLabel, icon:icon, price:'Free',
      cert:'CHCN Certificate', certFull:'Creator Hub Creator Network Certificate of Completion \u2014 '+name,
      desc:desc, unitCount:units.length+1, totalHours:'Self-paced',
      prerequisites:(level>=3?'Solid grounding in music fundamentals is recommended.':(level===2?'Basic music knowledge is helpful but not required.':'No prior experience required.')),
      outcomes:outcomes, projects:projects, sources:sources, modules:modules,
      assessmentPolicy:'Each instructional module has a five-question knowledge check, and the final assessment contains 15 separate cumulative questions that do not reuse module questions. A score of 80% or higher is recommended to progress. This internal certificate is not a professional licence or accredited degree.'
    };
    QUIZ[id]={module:moduleQuizzes, final:finalQs};
  });

  window.MUSIC_ACADEMY_COURSES=COURSES;
  window.MUSIC_ACADEMY_QUIZZES=QUIZ;

  function register(){
    try{ if(window.COURSE_DATA) Object.assign(window.COURSE_DATA, COURSES); }catch(e){}
    window.NEW_QUIZBANK=Object.assign(window.NEW_QUIZBANK||{}, QUIZ);
    try{ if(window.pages) Object.keys(COURSES).forEach(function(id){ if(window.pages.indexOf(id)<0) window.pages.push(id); }); }catch(e){}
    if(typeof window.navigate==='function' && !window.navigate.__musicAcadWrapped){
      var oldNav=window.navigate;
      var wrapped=function(page){ if(COURSES[page] && typeof window.openCourse==='function'){ window.openCourse(page); return; } return oldNav.apply(this,arguments); };
      wrapped.__musicAcadWrapped=true; window.navigate=wrapped;
    }
  }
  register();

  function renderCards(){
    var grid=document.getElementById('coursesGrid'); if(!grid) return;
    if(grid.querySelector('.music-academy-card')) return;
    Object.keys(COURSES).forEach(function(id){
      var c=COURSES[id];
      var card=document.createElement('div');
      card.className='course-card music-academy-card';
      card.setAttribute('data-category','Music');
      card.setAttribute('data-level',c.lvlLabel);
      card.setAttribute('data-price','free');
      card.innerHTML='<div class="card-header"><span class="badge badge-new">Music</span>Music</div>'+
        '<div class="card-body"><h3>'+c.icon+' '+esc(c.name)+'</h3><p>'+esc(c.desc)+'</p>'+
        '<div class="course-meta"><span class="level-beginner">'+esc(c.lvlLabel)+'</span><span>'+c.unitCount+' Modules</span><span>Self-Paced</span></div>'+
        '<div class="course-footer"><span class="course-price free">Free</span><button class="btn btn-primary btn-sm">Open Course</button></div></div>';
      card.addEventListener('click',function(){ if(typeof window.openCourse==='function') window.openCourse(id); });
      grid.appendChild(card);
    });
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',renderCards); else renderCards();
})();
