/* Creator Hub reliability + truthfulness patch.
   Keeps the site interactive and removes demo/fake claims without rewriting the DOM. */
(function(){
  function zeroStats(){
    document.querySelectorAll('.course-stats .views').forEach(function(e){e.textContent='👁 0 views';});
    document.querySelectorAll('.course-stats .students').forEach(function(e){e.textContent='👨‍🎓 0 students';});
  }
  function addTrustNote(){
    if(document.getElementById('catalogTrustNote')) return;
    var grid=document.getElementById('coursesGrid');
    if(!grid || !grid.parentNode) return;
    var n=document.createElement('div'); n.id='catalogTrustNote'; n.className='academic-note';
    n.innerHTML='<strong>Course accuracy note:</strong> Creator Hub courses are educational programmes. A Creator Hub completion certificate is an internal certificate of completion unless a specific external accrediting body is named on the course page. Academic foundation courses are not represented as degrees or as the official curriculum of every college worldwide.';
    grid.parentNode.insertBefore(n,grid);
  }
  function addFoundationalFilter(){
    var s=document.getElementById('filterLevel');
    if(s && !Array.from(s.options).some(function(o){return o.value==='Foundational';})){
      var o=document.createElement('option'); o.value='Foundational'; o.textContent='Foundational'; s.appendChild(o);
    }
  }
  function removeFakeReviewBlocks(){
    document.querySelectorAll('.test-grid .test-card').forEach(function(card){
      var text=card.textContent||'';
      if(/exact competency units|I could learn at my own pace|Clear, practical and well organised/i.test(text)) card.remove();
    });
  }
  function run(){zeroStats();addTrustNote();addFoundationalFilter();removeFakeReviewBlocks();}
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',run); else run();
  window.addEventListener('load',run);

  // Contact form: actually opens a pre-addressed email instead of claiming a message was sent.
  window.handleContact=function(e){
    if(e) e.preventDefault();
    var name=(document.getElementById('contactName')||{}).value||'';
    var email=(document.getElementById('contactEmail')||{}).value||'';
    var subject=(document.getElementById('contactSubject')||{}).value||'Website enquiry';
    var message=(document.getElementById('contactMessage')||{}).value||'';
    if(!name||!email||!message){showToast('Please complete your name, email and message.',true);return;}
    var body='Name: '+name+'\nEmail: '+email+'\n\n'+message;
    window.location.href='mailto:info.creatorhubcreatornetwork@gmail.com?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(body);
    showToast('Opening your email app to send the enquiry.');
  };

  // Enquiry modal: same truthful delivery method.
  window.submitEnquiry=function(e){
    if(e) e.preventDefault();
    var name=(document.getElementById('enquiry-name')||{}).value||'';
    var email=(document.getElementById('enquiry-email')||{}).value||'';
    var message=(document.getElementById('enquiry-message')||{}).value||'';
    if(!name||!email||!message){showToast('Please complete all enquiry fields.',true);return;}
    window.location.href='mailto:info.creatorhubcreatornetwork@gmail.com?subject='+encodeURIComponent('Creator Hub enquiry from '+name)+'&body='+encodeURIComponent('Name: '+name+'\nEmail: '+email+'\n\n'+message);
    closeModal('contactModal');
    showToast('Opening your email app to send the enquiry.');
  };

  // Local account UI: do not claim that a server email account/reset system exists.
  window.handleSignUp=function(e){
    if(e) e.preventDefault();
    var inputs=e.target.querySelectorAll('input');
    var name=inputs[0].value.trim(), email=inputs[1].value.trim().toLowerCase(), pass=inputs[2].value;
    if(!name||!email||!pass){showToast('Please fill in all fields.',true);return;}
    if(pass.length<6){showToast('Use a password of at least 6 characters.',true);return;}
    var existing=getUser();
    if(existing && existing.email && existing.email.toLowerCase()===email){showToast('An account for this email is already stored on this device. Sign in instead.',true);return;}
    setUser({name:name,email:email,password:pass,localOnly:true});
    var msg=e.target.querySelector('.success-msg');
    if(msg){msg.textContent='✓ Account created on this device. No email confirmation is sent by this offline website.';msg.classList.add('show');}
    setTimeout(function(){closeModal('signupModal');showToast('Local account created. You are signed in.');},900);
  };

  window.handleForgotPassword=function(e){
    if(e) e.preventDefault();
    var email=e.target.querySelector('input[type="email"]').value.trim().toLowerCase();
    var u=getUser();
    if(!u || (u.email||'').toLowerCase()!==email){showToast('No matching local account was found on this device.',true);return;}
    var pass=prompt('Enter a new password (minimum 6 characters):');
    if(!pass || pass.length<6){showToast('Password was not changed. Use at least 6 characters.',true);return;}
    u.password=pass; setUser(u); closeModal('forgotModal'); showToast('Password changed on this device.');
  };

  // Messaging is local history + an explicit email handoff; never claim delivery before the user sends it.
  window.sendMessage=function(){
    var input=document.getElementById('chatInput'); if(!input) return;
    var msg=input.value.trim(); if(!msg) return;
    var body=document.getElementById('chatBody');
    var u=getUser(); var fromName=u&&u.name?u.name:'App User'; var fromEmail=u&&u.email?u.email:'not signed in';
    var time=new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
    body.innerHTML += '<div class="chat-msg sent"><div class="chat-bubble">'+escapeHtml(msg)+'</div><div class="chat-time">'+time+'</div></div>';
    input.value=''; body.scrollTop=body.scrollHeight;
    var mailto='mailto:info.creatorhubcreatornetwork@gmail.com?subject='+encodeURIComponent('Creator Hub message from '+fromName)+'&body='+encodeURIComponent('From: '+fromName+' ('+fromEmail+')\n\n'+msg);
    setTimeout(function(){try{window.location.href=mailto;}catch(err){};showToast('Opening your email app to send the message.');},150);
  };
})();
