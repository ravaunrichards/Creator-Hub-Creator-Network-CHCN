/* Creator Hub — Instrument Course Catalogue */
(function(){
  const instruments = [
    ['🎸','Guitar','Strings','Beginner to Advanced','Acoustic/electric technique, chords, scales, rhythm, fingerstyle, lead playing, accompaniment and performance.'],
    ['🎻','Violin','Strings','Beginner to Advanced','Posture, bowing, intonation, scales, positions, reading, vibrato, ensemble and performance.'],
    ['🎷','Saxophone','Woodwind','Beginner to Advanced','Embouchure, breathing, tone, articulation, scales, improvisation, reading and ensemble playing.'],
    ['🎺','Trumpet','Brass','Beginner to Advanced','Breathing, embouchure, tone, articulation, range, scales, lip flexibility, repertoire and ensemble playing.'],
    ['🥁','Drums & Percussion','Percussion','Beginner to Advanced','Timekeeping, coordination, grooves, fills, rudiments, dynamics, reading, styles and ensemble playing.'],
    ['🎹','Piano & Keyboard','Keyboard','Beginner to Advanced','Keyboard geography, posture, notation, scales, chords, voicings, accompaniment, repertoire and performance.'],
    ['🎤','Voice & Singing','Voice','Beginner to Advanced','Breath management, healthy phonation, pitch, resonance, diction, range, harmony, microphone technique and performance.'],
    ['🪕','Banjo','Strings','Beginner to Advanced','Right-hand patterns, rolls, fretting, rhythm, chord shapes, traditional styles and ensemble playing.'],
    ['🎼','Music Theory & Ear Training','Theory','Beginner to Advanced','Notation, intervals, scales, keys, harmony, rhythm, chord recognition, transcription and analysis.'],
    ['🎸','Bass Guitar','Strings','Beginner to Advanced','Technique, rhythm section skills, scales, grooves, walking bass, fretboard knowledge and ensemble playing.'],
    ['🎵','Ukulele','Strings','Beginner to Intermediate','Strumming, chord shapes, rhythm, melody, fingerstyle, accompaniment and performance.'],
    ['🪈','Flute','Woodwind','Beginner to Advanced','Breath, embouchure, tone, articulation, scales, intonation, reading and repertoire.'],
    ['🎶','Clarinet','Woodwind','Beginner to Advanced','Embouchure, breath, tone, articulation, scales, registers, reading and ensemble playing.'],
    ['🎼','Cello','Strings','Beginner to Advanced','Posture, bowing, intonation, scales, positions, vibrato, reading and ensemble playing.'],
    ['🪘','World Percussion','Percussion','Beginner to Advanced','Hand technique, timing, patterns, dynamics, cultural context, ensemble roles and improvisation.']
  ];
  const units=['Instrument setup, safety & posture','Technique and tone production','Music notation and rhythm','Scales, keys and intervals','Chords, harmony and accompaniment','Ear training and transcription','Repertoire, styles and practice planning','Performance, recording and portfolio'];
  window.instrumentCourses = instruments.map((x,i)=>({id:'instrument-'+i,icon:x[0],name:x[1],family:x[2],level:x[3],summary:x[4],units}));
  function esc(s){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
  window.renderInstrumentCourses=function(){
    const grid=document.getElementById('instrumentCourseGrid'); if(!grid)return;
    grid.innerHTML=instrumentCourses.map(c=>`<article class="instrument-card" data-family="${esc(c.family)}"><div class="instrument-icon" aria-hidden="true">${c.icon}</div><div><span class="instrument-family">${esc(c.family)}</span><h3>${esc(c.name)}</h3><p>${esc(c.summary)}</p><span class="instrument-level">${esc(c.level)}</span><button class="btn btn-primary btn-sm" onclick="openInstrumentCourse('${c.id}')">Open Course</button></div></article>`).join('');
  };
  window.openInstrumentCourse=function(id){
    const c=instrumentCourses.find(v=>v.id===id); const box=document.getElementById('instrumentCourseDetail'); if(!c||!box)return;
    box.hidden=false; box.innerHTML=`<div class="instrument-detail-head"><div class="instrument-icon large">${c.icon}</div><div><span class="instrument-family">${esc(c.family)}</span><h2>${esc(c.name)} Course</h2><p>${esc(c.summary)}</p></div></div><h3>Complete course structure</h3><ol class="instrument-units">${c.units.map((u,n)=>`<li><strong>Unit ${n+1}: ${esc(u)}</strong><span>Lessons, guided practice, knowledge checks, practical task and review.</span></li>`).join('')}</ol><div class="course-scope-note"><strong>Practice note:</strong> use a qualified teacher where physical technique, hearing safety or instrument-specific injury prevention requires hands-on assessment.</div><button class="btn btn-outline" onclick="document.getElementById('instrumentCourseDetail').hidden=true">Close Course</button>`;
    box.scrollIntoView({behavior:'smooth',block:'start'});
  };
  window.renderInstrumentCourseCards=function(){
    const grid=document.getElementById('coursesGrid'); if(!grid)return;
    if(grid.querySelector('.instrument-course-card')) return;
    const frag=document.createDocumentFragment();
    instrumentCourses.forEach(c=>{
      const card=document.createElement('article'); card.className='course-card instrument-course-card'; card.dataset.category='Music & Instruments'; card.dataset.level=c.level.split(' to ')[0]; card.dataset.price='free'; card.dataset.views='0';
      card.innerHTML=`<div class="card-header"><span class="badge badge-new">Music</span>${c.icon} ${c.name}</div><div class="card-body"><h3>${esc(c.name)} Course</h3><p>${esc(c.summary)}</p><div class="course-meta"><span class="level-beginner">${esc(c.level)}</span><span>${c.units.length} Units</span><span>Self-Paced</span></div><div class="course-footer"><span class="course-price free">Free</span><button class="btn btn-primary btn-sm">Open</button></div></div>`;
      card.addEventListener('click',()=>{navigate('music'); setTimeout(()=>openInstrumentCourse(c.id),0);}); frag.appendChild(card);
    });
    grid.appendChild(frag);
  };
  document.addEventListener('DOMContentLoaded',()=>{renderInstrumentCourses();renderInstrumentCourseCards();});
})();
