/* Creator Hub — Music Studio: songbook + safe local audio analysis */
(function(){
  const songs=[
    {title:'Amazing Grace',artist:'Traditional hymn',country:'United States / traditional',genre:'Hymn / Gospel',key:'G major (common teaching key)',chords:'G–C–G–D–G–C–G–D–G',status:'Public-domain/traditional text in many jurisdictions',lyrics:'Amazing grace! How sweet the sound\nThat saved a wretch like me!\nI once was lost, but now am found;\nWas blind, but now I see.'},
    {title:'Auld Lang Syne',artist:'Traditional / Robert Burns text',country:'Scotland',genre:'Traditional',key:'F major (common teaching key)',chords:'F–C–F–Bb–F–C–F',status:'Traditional/public-domain material',lyrics:'Should auld acquaintance be forgot,\nAnd never brought to mind?\nShould auld acquaintance be forgot,\nAnd auld lang syne?'} ,
    {title:'Greensleeves',artist:'Traditional',country:'England / traditional',genre:'Folk',key:'A minor (common teaching key)',chords:'Am–G–F–E',status:'Traditional/public-domain melody',lyrics:'Alas, my love, you do me wrong,\nTo cast me off discourteously;\nFor I have loved you well and long,\nDelighting in your company.'},
    {title:'Scarborough Fair',artist:'Traditional',country:'England / traditional',genre:'Folk',key:'Dorian/modal arrangements vary',chords:'Dm–C–Dm–Am–Dm',status:'Traditional/public-domain folk song',lyrics:'Are you going to Scarborough Fair?\nParsley, sage, rosemary and thyme;\nRemember me to one who lives there,\nShe once was a true love of mine.'},
    {title:'When the Saints Go Marching In',artist:'Traditional',country:'United States / New Orleans tradition',genre:'Gospel / Jazz',key:'C major (common teaching key)',chords:'C–F–C–G–C',status:'Traditional/public-domain material',lyrics:'Oh, when the saints go marching in,\nOh, when the saints go marching in,\nOh, how I want to be in that number,\nWhen the saints go marching in.'},
    {title:'Oh! Susanna',artist:'Stephen Foster',country:'United States',genre:'Folk / Minstrel-era song',key:'C major (common teaching key)',chords:'C–G–C–G–C–F–C–G–C',status:'Public-domain',lyrics:'I come from Alabama with a banjo on my knee;\nI’m going to Louisiana, my true love for to see.'},
    {title:'House of the Rising Sun',artist:'Traditional',country:'United States / traditional',genre:'Folk / Blues',key:'A minor (common arrangement)',chords:'Am–C–D–F–Am–C–E',status:'Traditional; arrangements differ',lyrics:'There is a house in New Orleans,\nThey call the Rising Sun.'}
  ];
  window.creatorHubSongbook=songs;
  function esc(s){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
  function fillSelect(id,values){const el=document.getElementById(id);if(!el)return; const first=el.options[0]?.outerHTML||''; el.innerHTML=first+values.sort().map(v=>`<option value="${esc(v)}">${esc(v)}</option>`).join('');}
  window.renderSongbook=function(){
    const q=(document.getElementById('songSearch')?.value||'').toLowerCase(); const g=document.getElementById('songGenre')?.value||''; const c=document.getElementById('songCountry')?.value||''; const list=document.getElementById('songbookList'); if(!list)return;
    const rows=songs.filter(s=>(!q||[s.title,s.artist,s.country,s.genre,s.key].join(' ').toLowerCase().includes(q))&&(!g||s.genre===g)&&(!c||s.country===c));
    list.innerHTML=rows.map((s,i)=>`<article class="song-card"><div class="song-card-head"><div><span class="instrument-family">${esc(s.genre)}</span><h3>🎵 ${esc(s.title)}</h3><p>${esc(s.artist)} · ${esc(s.country)}</p></div><span class="song-key">Key: ${esc(s.key)}</span></div><div class="song-meta"><span><strong>Chords:</strong> ${esc(s.chords)}</span><span><strong>Status:</strong> ${esc(s.status)}</span></div>${s.lyrics?`<details><summary>Lyrics / teaching text</summary><pre>${esc(s.lyrics)}</pre></details>`:''}</article>`).join('')||'<div class="voice-status">No matching songs found.</div>';
  };
  window.filterSongbook=window.renderSongbook;
  window.showMusicTab=function(id,btn){document.querySelectorAll('.music-panel').forEach(p=>p.hidden=p.id!==id);document.querySelectorAll('.music-tab').forEach(b=>b.classList.remove('active'));if(btn)btn.classList.add('active');if(id==='songbook')renderSongbook();};
  document.addEventListener('DOMContentLoaded',()=>{fillSelect('songGenre',[...new Set(songs.map(s=>s.genre))]);fillSelect('songCountry',[...new Set(songs.map(s=>s.country))]);renderSongbook();});

  let audioCtx=null, source=null, analyser=null, raf=null, audioEl=null;
  window.stopMusicAnalysis=function(){if(raf)cancelAnimationFrame(raf);raf=null;if(source){try{source.disconnect()}catch(e){}}source=null;if(audioCtx){try{audioCtx.close()}catch(e){}audioCtx=null;} if(audioEl){audioEl.pause();audioEl.currentTime=0;} const st=document.getElementById('musicAnalysisStatus');if(st)st.textContent='Analysis stopped.';};
  window.analyzeMusicFile=async function(){
    const file=document.getElementById('musicFile')?.files?.[0]; const st=document.getElementById('musicAnalysisStatus'), out=document.getElementById('musicAnalysisResults'); if(!file){if(st)st.textContent='Choose an audio file first.';return;}
    stopMusicAnalysis(); if(!window.AudioContext&&!window.webkitAudioContext){st.textContent='This device/browser does not expose Web Audio analysis.';return;}
    st.textContent='Analyzing audio locally…'; out.innerHTML='';
    try{
      audioEl=new Audio(URL.createObjectURL(file)); audioEl.crossOrigin='anonymous'; await audioEl.play(); audioCtx=new (window.AudioContext||window.webkitAudioContext)(); source=audioCtx.createMediaElementSource(audioEl); analyser=audioCtx.createAnalyser(); analyser.fftSize=2048; source.connect(analyser); analyser.connect(audioCtx.destination);
      const duration=isFinite(audioEl.duration)?audioEl.duration:0; let last=0, peaks=[], sum=0, n=0;
      const time=new Float32Array(analyser.fftSize); const freq=new Uint8Array(analyser.frequencyBinCount);
      const tick=()=>{if(!analyser||audioEl.paused){render(duration,peaks);return;} analyser.getFloatTimeDomainData(time); analyser.getByteFrequencyData(freq); let rms=0,zc=0;for(let i=0;i<time.length;i++){rms+=time[i]*time[i];if(i&&time[i-1]*time[i]<0)zc++;}rms=Math.sqrt(rms/time.length);sum+=rms;n++;const now=performance.now();if(rms>0.12&&now-last>180){peaks.push(now);last=now;}if(n%8===0)st.textContent=`Listening locally… ${Math.round(audioEl.currentTime)}s`;raf=requestAnimationFrame(tick);};
      const render=(dur,ps)=>{const intervals=[];for(let i=1;i<ps.length;i++)intervals.push(ps[i]-ps[i-1]);const avg=intervals.length?intervals.reduce((a,b)=>a+b,0)/intervals.length:0;const bpm=avg?Math.round(60000/avg):null;out.innerHTML=`<div class="analysis-grid"><div><b>File</b><span>${esc(file.name)}</span></div><div><b>Duration</b><span>${dur?dur.toFixed(1)+' seconds':'Unknown'}</span></div><div><b>Estimated tempo</b><span>${bpm&&bpm>=45&&bpm<=220?bpm+' BPM':'Not reliable'}</span></div><div><b>Average loudness</b><span>${n?(20*Math.log10(Math.max(sum/n,1e-6))).toFixed(1)+' dBFS':'—'}</span></div></div><p class="voice-note">Tempo is an estimate from onset-like peaks; it is not a guaranteed beat-grid. Key, chords and song identity need a dedicated music-analysis model/service for dependable results.</p>`;st.textContent='Analysis complete.';};
      tick();
      audioEl.onended=()=>render(duration,peaks);
    }catch(e){console.error(e);st.textContent='Audio analysis could not start: '+(e.message||'unknown error');stopMusicAnalysis();}
  };
})();
