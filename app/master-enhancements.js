/* Creator Hub master quality layer: typography, academic course depth, non-repeating quizzes and catalogue usability. */
(function(){
  'use strict';
  function esc(s){var d=document.createElement('div');d.textContent=s==null?'':String(s);return d.innerHTML;}
  function boot(){
    // Add the Foundational level used by the expanded academic/music catalogue.
    var level=document.getElementById('filterLevel');
    if(level && !Array.prototype.some.call(level.options,function(o){return o.value==='Foundational';})){
      var o=document.createElement('option');o.value='Foundational';o.textContent='Foundational';level.appendChild(o);
    }
    // Improve course search so it searches the visible course description and metadata as well as the title.
    window.filterCourses=function(){
      var search=(document.getElementById('filterSearch')?.value||'').trim().toLowerCase();
      var cat=document.getElementById('filterCategory')?.value||'';
      var levelVal=document.getElementById('filterLevel')?.value||'';
      var price=document.getElementById('filterPrice')?.value||'';
      var cards=document.querySelectorAll('#coursesGrid .course-card'); var visible=0;
      cards.forEach(function(c){
        var text=(c.textContent||'').toLowerCase();
        var cCat=c.getAttribute('data-category')||'', cLevel=c.getAttribute('data-level')||'', cPrice=c.getAttribute('data-price')||'';
        var show=(!search||text.indexOf(search)>=0)&&(!cat||cCat===cat)&&(!levelVal||cLevel===levelVal)&&(!price||cPrice===price);
        c.style.display=show?'':'none'; if(show)visible++;
      });
      var grid=document.getElementById('coursesGrid'); if(grid){var old=grid.querySelector('[data-course-empty]');if(old)old.remove();if(!visible){var e=document.createElement('div');e.setAttribute('data-course-empty','1');e.style.cssText='grid-column:1/-1;padding:30px;text-align:center;color:#667085;';e.innerHTML='<strong>No courses match these filters.</strong><br>Try another keyword, category, level or price.';grid.appendChild(e);}}
    };

    // Improve course detail pages with complete programme information and authoritative references.
    var originalRender=window.renderCourseView;
    if(typeof originalRender==='function' && !originalRender.__masterWrapped){
      var wrapped=function(id){
        originalRender(id);
        var data=window.COURSE_DATA&&window.COURSE_DATA[id]; if(!data||!data.outcomes)return;
        var desc=document.querySelector('#page-course-view .course-detail-main .course-desc'); if(!desc||desc.querySelector('[data-course-essentials]'))return;
        var box=document.createElement('section');box.setAttribute('data-course-essentials','1');box.className='course-essentials';
        var html='<h3>Complete Course Package</h3>';
        html+='<div class="course-info-grid"><div><h4>Prerequisites</h4><p>'+esc(data.prerequisites||'No formal prerequisite is stated for this foundation course.')+'</p></div>';
        html+='<div><h4>Learning Outcomes</h4><ul>';(data.outcomes||[]).forEach(function(x){html+='<li>'+esc(x)+'</li>';});html+='</ul></div></div>';
        html+='<h4>Applied Projects</h4><ul>';(data.projects||[]).forEach(function(x){html+='<li>'+esc(x)+'</li>';});html+='</ul>';
        html+='<div class="highlight-box"><strong>Assessment:</strong> '+esc(data.assessmentPolicy||'Module knowledge checks plus a cumulative final assessment.')+'</div>';
        if(Array.isArray(data.sources)&&data.sources.length){html+='<h4>Reference Sources</h4><ul class="source-list">';data.sources.forEach(function(s){html+='<li><a href="'+esc(s[1])+'" target="_blank" rel="noopener noreferrer">'+esc(s[0])+'</a></li>';});html+='</ul>';}
        html+='<h4>Career Exploration</h4><p>Use the course skills as a starting point for career research. Current occupation requirements vary by employer and country.</p><p><a href="https://www.onetonline.org/find/quick" target="_blank" rel="noopener noreferrer">Search O*NET occupations</a> · <a href="https://www.bls.gov/ooh/occupation-finder.htm" target="_blank" rel="noopener noreferrer">Browse the U.S. BLS Occupation Finder</a></p>';
        html+='<p class="course-scope-note"><strong>Scope note:</strong> This is structured Creator Hub educational material. It does not claim to be the official curriculum of every college, and completion does not by itself grant a degree, regulated licence or employment.</p>';
        box.innerHTML=html; desc.appendChild(box);
      };
      wrapped.__masterWrapped=true; window.renderCourseView=wrapped;
    }

    // Use the correct, separate question pool for every academic/music module and final assessment.
    var originalStart=window.startQuiz;
    if(typeof originalStart==='function' && !originalStart.__masterWrapped){
      var start=function(courseId,moduleIdx,lessonIdx){
        var data=window.COURSE_DATA&&window.COURSE_DATA[courseId];
        var bankObj=window.NEW_QUIZBANK&&window.NEW_QUIZBANK[courseId];
        if(!data||!bankObj||!bankObj.module)return originalStart(courseId,moduleIdx,lessonIdx);
        var lesson=data.modules[moduleIdx]&&data.modules[moduleIdx].lessons[lessonIdx]; if(!lesson)return;
        var qs=lesson.isFinal?(bankObj.final||[]):((bankObj.module||[])[moduleIdx]||[]);
        if(!qs.length)return;
        if(typeof navigate==='function')navigate('quiz');
        var title=document.getElementById('quiz-page-title'),sub=document.getElementById('quiz-page-subtitle');
        if(title)title.textContent=lesson.title;if(sub)sub.textContent=data.name+' — '+qs.length+' Questions';
        window.quizState={questions:qs.slice(),current:0,answers:new Array(qs.length).fill(-1),timer:null,timeLeft:typeof parseDuration==='function'?parseDuration(lesson.duration):600,courseId:courseId,moduleIdx:moduleIdx,lessonIdx:lessonIdx,isFinal:!!lesson.isFinal};
        if(typeof renderQuizQuestion==='function')renderQuizQuestion();if(typeof startQuizTimer==='function')startQuizTimer();
      };
      start.__masterWrapped=true; window.startQuiz=start;
    }

    // Academic lessons: show a real course-specific study page instead of repeating a generic paragraph.
    var oldLesson=window.getLessonContent;
    if(typeof oldLesson==='function' && !oldLesson.__masterWrapped){
      var getLesson=function(courseId,moduleIdx,lessonIdx){
        var data=window.COURSE_DATA&&window.COURSE_DATA[courseId];
        if(!data||!data.prerequisites)return oldLesson(courseId,moduleIdx,lessonIdx);
        var mod=data.modules[moduleIdx], lesson=mod&&mod.lessons[lessonIdx]; if(!mod||!lesson)return oldLesson(courseId,moduleIdx,lessonIdx);
        if(lesson.type==='quiz')return oldLesson(courseId,moduleIdx,lessonIdx);
        var focus=mod.focus||mod.title;
        var content='<h2>'+esc(lesson.title)+'</h2>';
        content+='<p><strong>Course:</strong> '+esc(data.name)+'</p><p><strong>Module focus:</strong> '+esc(focus)+'</p>';
        content+='<h3>Study Objectives</h3><ul><li>Understand the terminology and core ideas for this module.</li><li>Connect the concepts to the course learning outcomes.</li><li>Apply the material through the guided practice and project work.</li></ul>';
        content+='<h3>Study Method</h3><p>Read the lesson carefully, make notes in your own words, work through the examples or practice task, then complete the module knowledge check. Use the listed reference sources when you need deeper or current information.</p>';
        if(moduleIdx>0 && moduleIdx<=5)content+='<div class="highlight-box"><strong>Core topic:</strong> '+esc(focus)+'. Keep the definitions, methods and practical implications together in your notes so the final assessment can test integrated understanding.</div>';
        if(mod.title.indexOf('Applied Practice')>=0){content+='<h3>Applied Work</h3><ul>';(data.projects||[]).forEach(function(x){content+='<li>'+esc(x)+'</li>';});content+='</ul>'}
        if(mod.title.indexOf('Capstone')>=0){content+='<h3>Capstone Preparation</h3><p>Use the capstone to demonstrate your own work. State your objective, method, evidence, result and limitations. Do not claim professional licensing or expertise beyond the evidence you can demonstrate.</p>';}
        content+='<p class="course-scope-note"><strong>Important:</strong> This course is an educational foundation. Where a profession is regulated, follow the current requirements of the responsible authority in your jurisdiction.</p>';
        return {title:lesson.title,content:content};
      };
      getLesson.__masterWrapped=true; window.getLessonContent=getLesson;
    }

    // Fix grammar and capitalization in recurring UI labels without changing embedded logo artwork.
    document.querySelectorAll('.course-meta,.course-card,.steps-section,.hero-section').forEach(function(el){
      el.innerHTML=el.innerHTML.replace(/Self Paced/g,'Self-Paced').replace(/self paced/g,'self-paced');
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
  window.addEventListener('load',boot);
})();
