/* Creator Hub — TikTok Creator: Beginner to Expert course
   Curriculum based on TikTok's public creator/help/Creative Center materials and
   current platform concepts. It is educational guidance, not a TikTok certification. */
(function(){
  const qs = [
    ['What is the purpose of Creator Search Insights?',['To show topics people are searching for and help creators develop relevant content','To guarantee viral views','To replace video editing','To create a private account'],0,'TikTok describes Creator Search Insights as a tool for discovering searched topics and content gaps.'],
    ['Which practice is most useful before publishing a TikTok?',['Check the hook, clarity, audio, framing and intended audience','Hide the topic from the audience','Use unrelated hashtags only','Remove all captions'],0,'A pre-publish quality check improves clarity and accessibility without guaranteeing performance.'],
    ['What does a strong opening hook do?',['Gives viewers a clear reason to keep watching','Guarantees a specific number of views','Automatically adds music','Changes the account privacy setting'],0,'A hook establishes relevance quickly; it does not guarantee distribution.'],
    ['Why should creators review analytics?',['To understand audience response and improve future content decisions','To guarantee monetization','To make every video identical','To avoid following platform rules'],0,'Analytics are feedback for learning and iteration.'],
    ['What can TikTok Creative Center help creators discover?',['Trends, creative examples, keywords and creative resources','Private messages from viewers','Other users passwords','Guaranteed sponsorships'],0,'TikTok says Creative Center provides inspiration, trends and creative tools.'],
    ['What is an appropriate approach to hashtags?',['Use relevant tags that accurately describe the content and audience','Add every trending tag regardless of topic','Use only one permanent tag forever','Use misleading tags for unrelated traffic'],0,'Relevant metadata helps describe content; unrelated tags do not guarantee reach.'],
    ['Before using music in commercial content, a creator should:',['Check the applicable music/licensing rules and use permitted sounds','Assume every sound is commercially cleared','Remove the creator credit','Download any song from another site'],0,'Music rights and commercial-use rules depend on the use case and current TikTok policies.'],
    ['What is a useful LIVE preparation step?',['Test the camera, microphone, lighting, connection and planned interaction flow','Start without checking audio','Ignore community rules','Disable all moderation'],0,'TikTok LIVE guidance emphasizes setup, interaction and performance monitoring.'],
    ['What should a creator do when platform features differ by country or account?',['Check the current in-app availability and official TikTok guidance','Assume every account has identical features','Copy an old tutorial without checking','Use a third-party workaround'],0,'TikTok features, eligibility and programs can vary by region and account.'],
    ['Which is a sound growth mindset?',['Test ideas, study results, improve the next video and keep content authentic','Buy guaranteed views','Copy another creator exactly','Promise viewers outcomes you cannot provide'],0,'Sustainable creator practice uses experimentation, feedback and authentic audience connection.'],
    ['What should creators do with comments and community feedback?',['Use useful feedback to improve content while moderating abuse and following rules','Share private information publicly','Respond to every abusive comment','Ignore all audience signals'],0,'Community interaction should be constructive and safe.'],
    ['What does retention data help a creator investigate?',['Where viewers continue watching or leave a video','A viewer password','The creator’s legal identity','Whether a camera is charged'],0,'Retention patterns can reveal where content loses or holds attention.'],
    ['What is a practical way to improve a weak video concept?',['Clarify the audience problem, hook, payoff and structure before reshooting','Add random effects','Make the video longer regardless of purpose','Remove the main idea'],0,'Clear audience value and structure are useful creative fundamentals.'],
    ['What should a creator do if a trend does not fit their niche?',['Adapt the underlying format only when it genuinely fits the creator’s audience and message','Post it unchanged every day','Use misleading captions','Pretend the trend is original research'],0,'Trends are optional creative inputs; relevance and authenticity matter.'],
    ['For advanced creator work, why is a content system useful?',['It helps plan ideas, production, publishing, measurement and iteration consistently','It guarantees viral content','It eliminates the need for creativity','It bypasses platform policies'],0,'A repeatable workflow supports consistent experimentation and learning.']
  ];
  const modules=[
    ['Module 1 — TikTok Foundations',['Account setup, profile positioning and creator goals','TikTok interface, posting workflow and privacy basics','Audience, niche and content pillars','Community Guidelines and responsible creator behavior']],
    ['Module 2 — Content Planning',['Idea generation and content pillars','Hooks, story structure and viewer value','Series, formats and repeatable concepts','Content calendar and production checklist']],
    ['Module 3 — Recording & Editing',['Camera framing, lighting and clean audio','Text, captions, transitions and pacing','Vertical composition and visual clarity','Draft review and accessibility checks']],
    ['Module 4 — Discovery & Search',['TikTok search and topic discovery','Creator Search Insights and content gaps','Relevant captions, keywords and hashtags','Trend research using Creative Center']],
    ['Module 5 — Analytics & Optimization',['Views, watch behavior and engagement signals','Retention and audience response','Testing hooks and formats','Using analytics to plan the next experiment']],
    ['Module 6 — Community & LIVE',['Comments and community management','LIVE setup and technical checks','Audience interaction and moderation','LIVE performance review']],
    ['Module 7 — Monetization & Professional Practice',['Eligibility varies by region and program','Creator monetization concepts and disclosures','Brand collaborations and professional communication','Music/licensing and commercial-use awareness']],
    ['Module 8 — Growth Systems',['Content batching and workflow','Series development and repurposing responsibly','Collaboration and creator networking','Maintaining quality while increasing output']],
    ['Module 9 — Advanced Creator Strategy',['Creative testing framework','Search-led content planning','Trend adaptation without losing identity','Performance review and iteration']],
    ['Module 10 — Expert Capstone',['Build a complete creator strategy','Produce a multi-video content plan','Define measurable learning goals','Capstone portfolio and final assessment']]
  ];
  const lessons=modules.map((m,i)=>({title:m[0],lessons:m[1].map(x=>({title:x,type:'lesson',duration:'25 min'})).concat([{title:m[0]+' Quiz',type:'quiz',questions:i===9?15:5,duration:i===9?'15 min':'5 min'}])}));
  lessons.push({title:'FINAL ASSESSMENT',lessons:[{title:'TikTok Creator — Beginner to Expert Final Assessment',type:'quiz',questions:15,duration:'20 min',isFinal:true}]});
  window.NEW_COURSES=window.NEW_COURSES||{};
  window.NEW_COURSES['tiktok-creator-beginner-to-expert']={
    name:'TikTok Creator — Beginner to Expert',cat:'Digital Media & Creator Skills',level:1,lvlLabel:'Beginner → Expert',icon:'🎬',price:'Free',cert:'CHCN-TT',certFull:'Creator Hub Certificate — TikTok Creator: Beginner to Expert',
    desc:'A practical creator programme covering TikTok account foundations, content planning, filming, editing, search discovery, analytics, community, LIVE, professional practice, monetization concepts and advanced creator strategy. Platform features and eligibility can change by region and account.',unitCount:40,totalHours:120,modules:lessons,
    meta:{cat:'Digital Media & Creator Skills',lvlLabel:'Beginner → Expert'}
  };
  window.NEW_QUIZBANK=window.NEW_QUIZBANK||{};
  window.NEW_QUIZBANK['tiktok-creator-beginner-to-expert']=qs.map(q=>({q:q[0],opts:q[1],ans:q[2],exp:q[3]}));
})();
