(function(){
  'use strict';
  const LANGS=[['en','English'],['es','Spanish'],['fr','French'],['de','German'],['it','Italian'],['pt','Portuguese'],['nl','Dutch'],['ar','Arabic'],['zh','Chinese'],['ja','Japanese'],['ko','Korean'],['hi','Hindi'],['bn','Bengali'],['ru','Russian'],['uk','Ukrainian'],['pl','Polish'],['tr','Turkish'],['sw','Swahili'],['ht','Haitian Creole'],['id','Indonesian'],['ms','Malay'],['th','Thai'],['vi','Vietnamese'],['ta','Tamil'],['te','Telugu'],['ur','Urdu'],['he','Hebrew'],['el','Greek'],['sv','Swedish'],['da','Danish'],['no','Norwegian'],['fi','Finnish'],['cs','Czech'],['ro','Romanian'],['hu','Hungarian'],['af','Afrikaans'],['ga','Irish'],['cy','Welsh'],['fa','Persian']];
  let readOn=false, voices=[], recognition=null;
  const native=()=>window.CreatorHubNative||null;
  function el(id){return document.getElementById(id)}
  window.openVoiceHub=function(){const h=el('voiceHub'); if(!h)return; h.classList.add('open'); h.setAttribute('aria-hidden','false'); populateVoices(); populateLangs();};
  window.closeVoiceHub=function(){const h=el('voiceHub'); if(!h)return; h.classList.remove('open'); h.setAttribute('aria-hidden','true'); stopReadAloud();};
  function populateLangs(){['translateFrom','translateTo'].forEach((id)=>{const s=el(id);if(!s||s.options.length)return; LANGS.forEach(([c,n])=>{const o=document.createElement('option');o.value=c;o.textContent=n;s.appendChild(o)});}); if(el('translateFrom'))el('translateFrom').value=(navigator.language||'en').slice(0,2); if(el('translateTo'))el('translateTo').value='es';}
  function loadVoices(){voices=(window.speechSynthesis&&window.speechSynthesis.getVoices)?window.speechSynthesis.getVoices():[];const s=el('voiceSelect');if(!s)return;s.innerHTML='';voices.forEach((v,i)=>{const o=document.createElement('option');o.value=String(i);o.textContent=v.name+' — '+v.lang;s.appendChild(o)});if(!voices.length){const o=document.createElement('option');o.textContent='Use the device default voice';o.value='';s.appendChild(o)}}
  function populateVoices(){if(native()&&native().getVoicesJson){try{const arr=JSON.parse(native().getVoicesJson());voices=arr.map(v=>({name:v.name,lang:v.locale,native:true,id:v.id}));}catch(e){}} if(!voices.length&&window.speechSynthesis){loadVoices();window.speechSynthesis.onvoiceschanged=loadVoices;}}
  function speak(text){if(!text)return;const rate=parseFloat(el('voiceRate')?.value||1),pitch=parseFloat(el('voicePitch')?.value||1),idx=el('voiceSelect')?.value; if(native()&&native().speak){try{native().speak(text, idx && voices[Number(idx)]?.id || '', rate, pitch);return}catch(e){}} if(!window.speechSynthesis){showVoiceStatus('Speech output is not available on this device/browser.');return;}window.speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);if(idx!==''&&voices[Number(idx)])u.voice=voices[Number(idx)];u.rate=rate;u.pitch=pitch;u.onend=()=>{};window.speechSynthesis.speak(u);}
  window.toggleReadAloud=function(){readOn=!readOn;const b=el('voiceToggleBtn');if(b)b.textContent=readOn?'🔊 Read Aloud: On':'🔊 Turn On Read Aloud'; if(readOn){speak(document.querySelector('main')?.innerText||document.body.innerText)} else stopReadAloud(); localStorage.setItem('chcn_read_aloud',readOn?'1':'0'); if(window.CHCN&&window.CHCN.Settings)window.CHCN.Settings.set('readAloud',readOn);};
  window.stopReadAloud=function(){if(native()&&native().stopSpeaking)try{native().stopSpeaking()}catch(e){} if(window.speechSynthesis)window.speechSynthesis.cancel();};
  function showVoiceStatus(t){const s=el('voiceCommandStatus');if(s)s.textContent=t;}
  function command(text){const t=(text||'').toLowerCase().trim(); if(/turn on voice|activate voice|enable voice/.test(t)){readOn=true;const b=el('voiceToggleBtn');if(b)b.textContent='🔊 Read Aloud: On';speak('Voice is now on.');return true;} if(/turn off voice|disable voice|stop speaking|stop voice/.test(t)){readOn=false;stopReadAloud();const b=el('voiceToggleBtn');if(b)b.textContent='🔊 Turn On Read Aloud';showVoiceStatus('Voice is off.');return true;} const routes=[['courses',['open courses','show courses','courses']],['jobs',['open jobs','show jobs','jobs','career']],['map',['open map','show map','map']],['payment',['open payment','payment','donation','donations']],['about',['open about','about us']],['contact',['open contact','contact us']]];for(const [page,phrases] of routes){if(phrases.some(p=>t===p||t.includes(p))){if(typeof navigate==='function')navigate(page);speak('Opening '+page+'.');return true;}} if(/read this page|read page|read aloud/.test(t)){speak(document.body.innerText);return true;} return false;}
  // MICROPHONE now flows through the single global state machine (CHCN.Mic),
  // which correctly distinguishes a deliberate user stop from an unexpected
  // recognition end and never re-arms itself after the user turns it off.
  window.turnOffAllMicrophones=function(){
    if(window.CHCN&&window.CHCN.Mic){window.CHCN.Mic.stop('USER_STOPPED');}
    if(window.CHCN&&window.CHCN.Settings){window.CHCN.Settings.set('voiceCommands',false);}
    try{ if(recognition){recognition.onend=null;recognition.stop();} }catch(e){}
    recognition=null;
    if(typeof window.stopAllVoiceInput==='function'){try{window.stopAllVoiceInput()}catch(e){}}
    document.querySelectorAll('.listening').forEach(x=>x.classList.remove('listening'));
    showVoiceStatus('Microphone is off. Voice commands are off.');
    const b=el('voiceCommandBtn'); if(b)b.textContent='🎤 Activate Voice Commands';
    const a=el('assistantMicBtn'); if(a)a.textContent='🎤';
  };
  window.toggleVoiceCommands=function(){
    if(window.CHCN&&typeof window.chcnToggleVoiceCommands==='function'){
      window.chcnToggleVoiceCommands();
      const on=window.CHCN.Settings.get('voiceCommands');
      const b=el('voiceCommandBtn'); if(b)b.textContent=on?'🎤 Voice Commands: On (tap to stop)':'🎤 Activate Voice Commands';
      showVoiceStatus(on?'Listening for commands…':'Voice commands are off.');
      return;
    }
    // Fallback (services unavailable): single-session, no silent auto-restart.
    if(recognition){recognition.onend=null;recognition.stop();recognition=null;showVoiceStatus('Voice commands are off.');return;}const SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SR){showVoiceStatus('Voice commands require a supported speech-recognition service on this device.');return;} recognition=new SR();recognition.lang=navigator.language||'en-US';recognition.continuous=true;recognition.interimResults=false;let userStopped=false;recognition.onresult=e=>{for(let i=e.resultIndex;i<e.results.length;i++)if(e.results[i].isFinal){const txt=e.results[i][0].transcript;showVoiceStatus('Heard: '+txt);if(!command(txt))speak('I heard '+txt+'. That command is not available yet.');}};recognition.onerror=e=>showVoiceStatus('Voice recognition error: '+e.error);recognition.onend=()=>{recognition=null;const b=el('voiceCommandBtn'); if(b)b.textContent='🎤 Activate Voice Commands';showVoiceStatus('Voice commands are off.');};recognition.start();showVoiceStatus('Listening for commands…');};
  window.__creatorHubHandleNativeTranscript=function(text){showVoiceStatus('Heard: '+text);if(window.CHCN&&window.CHCN.Mic){window.CHCN.Mic.pushNativeTranscript(text);return;}if(!command(text))speak('I heard '+text+'. That command is not available yet.');};
  window.translateTextInApp=async function(){const input=el('translateInput')?.value.trim(),from=el('translateFrom')?.value,to=el('translateTo')?.value,out=el('translateOutput');if(!input||!out)return;out.textContent='Translating…';try{if(native()&&native().translate){window.__creatorHubTranslationTarget=out; native().translate(input,from,to); return;}const url='https://api.mymemory.translated.net/get?q='+encodeURIComponent(input)+'&langpair='+encodeURIComponent(from+'|'+to);const res=await fetch(url);if(!res.ok)throw new Error('HTTP '+res.status);const data=await res.json();const translated=data?.responseData?.translatedText;if(!translated)throw new Error('No translation returned');out.textContent=translated;speak(translated);}catch(e){out.textContent='Translation could not be completed. Check your internet connection or use a supported translation service.';}};
  function localAnswer(q){const t=q.toLowerCase();if(/course|learn|study/.test(t))return'Creator Hub provides structured courses with lessons, knowledge checks, projects and final assessments. Open Courses to browse by category and level.';if(/job|career|employment/.test(t))return'Open Jobs to search employers by industry, region and keyword. Employer links lead to official career pages where current vacancies and exact requirements should be checked.';if(/donat/.test(t))return'Open Payment to find the donation section. Donors can provide their name, email, amount, category and receipt.';if(/map|location/.test(t))return'Open Map to use GPS location, search and saved places. Location access must be allowed by your device.';if(/access|blind|voice|read/.test(t))return'The Voice panel provides read-aloud controls, voice commands, translation and speech input. Available voices depend on the device speech engine.';return'I can answer questions about Creator Hub and guide you through its features. For unrestricted general reasoning across any topic, a secure server-side AI service must be connected.';}
  window.__creatorHubNativeTranslation=function(result){const out=el('translateOutput');if(!out)return;if(result){out.textContent=result;speak(result);}else out.textContent='Translation could not be completed on this device. Check the language model/network connection.';};
  window.sendAssistantMessage=function(){const input=el('assistantInput'),box=el('assistantMessages');if(!input||!box)return;const q=input.value.trim();if(!q)return;const u=document.createElement('div');u.className='assistant-msg user';u.textContent=q;box.appendChild(u);input.value='';const a=localAnswer(q);const r=document.createElement('div');r.className='assistant-msg assistant';r.textContent=a;box.appendChild(r);box.scrollTop=box.scrollHeight;speak(a);};
  window.startAssistantVoice=function(){const SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(native()&&native().startListening){try{native().startListening();return}catch(e){}}if(!SR){showVoiceStatus('Speech recognition is unavailable.');return;}const r=new SR();r.lang=navigator.language||'en-US';r.interimResults=false;r.maxAlternatives=1;r.onresult=e=>{const t=e.results[0][0].transcript;el('assistantInput').value=t;sendAssistantMessage();};r.start();};

  const OFFLINE_PHRASES={
    en:{hello:'Hello',thank:'Thank you',help:'Help',yes:'Yes',no:'No',welcome:'Welcome',goodbye:'Goodbye'},
    es:{hello:'Hola',thank:'Gracias',help:'Ayuda',yes:'Sí',no:'No',welcome:'Bienvenido',goodbye:'Adiós'},
    fr:{hello:'Bonjour',thank:'Merci',help:'Aide',yes:'Oui',no:'Non',welcome:'Bienvenue',goodbye:'Au revoir'},
    de:{hello:'Hallo',thank:'Danke',help:'Hilfe',yes:'Ja',no:'Nein',welcome:'Willkommen',goodbye:'Auf Wiedersehen'},
    it:{hello:'Ciao',thank:'Grazie',help:'Aiuto',yes:'Sì',no:'No',welcome:'Benvenuto',goodbye:'Arrivederci'},
    pt:{hello:'Olá',thank:'Obrigado',help:'Ajuda',yes:'Sim',no:'Não',welcome:'Bem-vindo',goodbye:'Adeus'},
    sw:{hello:'Habari',thank:'Asante',help:'Msaada',yes:'Ndiyo',no:'Hapana',welcome:'Karibu',goodbye:'Kwaheri'},
    ht:{hello:'Bonjou',thank:'Mèsi',help:'Ede',yes:'Wi',no:'Non',welcome:'Byenveni',goodbye:'Orevwa'},
    ar:{hello:'مرحبا',thank:'شكرا',help:'مساعدة',yes:'نعم',no:'لا',welcome:'مرحبا بك',goodbye:'مع السلامة'},
    zh:{hello:'你好',thank:'谢谢',help:'帮助',yes:'是',no:'不',welcome:'欢迎',goodbye:'再见'},
    ja:{hello:'こんにちは',thank:'ありがとう',help:'助けて',yes:'はい',no:'いいえ',welcome:'ようこそ',goodbye:'さようなら'},
    ko:{hello:'안녕하세요',thank:'감사합니다',help:'도와주세요',yes:'예',no:'아니요',welcome:'환영합니다',goodbye:'안녕히 가세요'},
    hi:{hello:'नमस्ते',thank:'धन्यवाद',help:'मदद',yes:'हाँ',no:'नहीं',welcome:'स्वागत है',goodbye:'अलविदा'},
    ru:{hello:'Здравствуйте',thank:'Спасибо',help:'Помощь',yes:'Да',no:'Нет',welcome:'Добро пожаловать',goodbye:'До свидания'},
    tr:{hello:'Merhaba',thank:'Teşekkür ederim',help:'Yardım',yes:'Evet',no:'Hayır',welcome:'Hoş geldiniz',goodbye:'Hoşça kal'}
  };
  window.copyTranslationInput=async function(){const v=el('translateInput')?.value||'';if(native()&&native().copyText){native().copyText(v);showVoiceStatus('Input copied.');return;}try{await navigator.clipboard.writeText(v);showVoiceStatus('Input copied.');}catch(e){const t=document.createElement('textarea');t.value=v;document.body.appendChild(t);t.select();document.execCommand('copy');t.remove();showVoiceStatus('Input copied.');}};
  window.copyTranslationOutput=async function(){const v=el('translateOutput')?.textContent||'';if(native()&&native().copyText){native().copyText(v);showVoiceStatus('Translation copied.');return;}try{await navigator.clipboard.writeText(v);showVoiceStatus('Translation copied.');}catch(e){showVoiceStatus('Copy is unavailable on this device.');}};
  window.pasteIntoTranslation=async function(){if(native()&&native().pasteText){const v=native().pasteText();el('translateInput').value=v||'';showVoiceStatus('Text pasted.');return;}try{const v=await navigator.clipboard.readText();el('translateInput').value=v;showVoiceStatus('Text pasted.');}catch(e){showVoiceStatus('Paste permission is controlled by Android/browser. Long-press the field and choose Paste.');}};
  window.speakTranslation=function(){const v=el('translateOutput')?.textContent||'';if(v)speak(v);};
  window.openOfflineLanguagePack=function(){
    const from=el('translateFrom')?.value||'en', data=OFFLINE_PHRASES[from]||OFFLINE_PHRASES.en;
    const lines=Object.entries(data).map(([k,v])=>k+': '+v).join('\n');
    alert('Offline phrasebook — '+from+'\n\n'+lines+'\n\nThese built-in phrases work without internet. General offline translation requires the corresponding on-device language model to have been downloaded first.');
  };

  document.addEventListener('DOMContentLoaded',()=>{populateLangs();populateVoices();
    const St=window.CHCN&&window.CHCN.Settings;
    // Restore persisted read-aloud (new global store, with legacy fallback).
    const persistedRead=St?St.get('readAloud'):(localStorage.getItem('chcn_read_aloud')==='1');
    if(persistedRead){readOn=true;const b=el('voiceToggleBtn');if(b)b.textContent='🔊 Read Aloud: On';}
    // Bind speed/pitch/voice controls to the persistent settings store so they
    // survive navigation, reloads and app restarts.
    if(St){
      const r=el('voiceRate'),p=el('voicePitch'),v=el('voiceSelect');
      if(r){r.value=St.get('speechRate');r.addEventListener('input',()=>St.set('speechRate',parseFloat(r.value)));}
      if(p){p.value=St.get('speechPitch');p.addEventListener('input',()=>St.set('speechPitch',parseFloat(p.value)));}
      if(v){v.addEventListener('change',()=>St.set('selectedVoiceId',v.value));}
    }
  });
})();
