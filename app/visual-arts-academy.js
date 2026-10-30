/* Creator Hub Creator Network — Visual Arts Academy expansion.
   Adds genuinely-missing Visual Arts-category courses grounded in the EMC
   School of Visual Arts handbook (real programmes: BFA Painting, Sculpture,
   Ceramics, Textile & Fibre Arts, Photography, Jewellery, Art Education) and
   in established, verifiable art facts. Registered into the SAME engine as the
   other courses (COURSE_DATA + NEW_QUIZBANK). No duplicates, no fabrication. */
(function(){
  var _s=918273645;
  function rnd(){_s=(_s*1103515245+12345)&0x7fffffff;return _s/0x7fffffff;}
  function shuffle(a){a=a.slice();for(var i=a.length-1;i>0;i--){var j=Math.floor(rnd()*(i+1));var t=a[i];a[i]=a[j];a[j]=t;}return a;}
  function Q(row){var stem=row[0],correct=row[1],distractors=row[2],exp=row[3];var opts=shuffle([correct].concat(distractors));return {q:stem,opts:opts,ans:opts.indexOf(correct),exp:exp};}
  function esc(s){return String(s).replace(/[&<>\"']/g,function(m){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[m];});}
  function stemKey(q){return q.q.trim().toLowerCase();}
  var CAT='Visual Arts';
  var P={};

  P.orientation=[
    ['What is the purpose of the Knowledge Check at the end of each module?','To confirm you have grasped that module’s key concepts before moving on',['To replace the need to study the lessons','To lower your final score','To skip the rest of the course'],'A knowledge check verifies understanding of the module before you progress.'],
    ['What is a sensible way to use the lessons in this course?','Study them in order, take notes, and practise the examples',['Skip straight to the final assessment','Memorise only the quiz answers','Read the titles only'],'Working through lessons in sequence with active practice builds durable understanding.'],
    ['Why does the course recommend regular, short practice sessions?','Frequent focused practice builds skill more reliably than rare long sessions',['Because long sessions are impossible','Because practice does not affect skill','To make the course take longer'],'Distributed, focused practice is more effective than infrequent cramming.'],
    ['What does “academic honesty” mean when completing assessments?','Doing your own work and answering the questions yourself',['Copying answers from others','Sharing the quiz answer key','Guessing every question'],'Academic honesty means completing assessments through your own genuine effort.'],
    ['What should you do if you do not pass a knowledge check?','Review the module lessons and try again',['Abandon the course','Ignore the result and continue','Delete your progress'],'Revisiting the lesson material and retrying is the intended way to improve.'],
    ['A measurable learning outcome describes…','what a learner should be able to do after study',['how long the course lasts','the price of the course','the teacher’s opinion'],'Learning outcomes state observable, demonstrable abilities.']
  ];
  P.vaComposition=[
    ['The commonly cited \u201celements of art\u201d include line, shape, form, space, texture, value and\u2026','colour',['price','frame','signature'],'Colour is one of the core elements of art alongside line, shape, form, space, texture and value.'],
    ['\u201cValue\u201d in art refers to\u2026','the lightness or darkness of a tone',['the price of the artwork','the size of the canvas','the artist\u2019s fame'],'Value describes how light or dark a tone is.'],
    ['The \u201crule of thirds\u201d is a guideline for\u2026','placing key elements off-centre for a balanced composition',['mixing three colours only','using three brushes','painting for three hours'],'The rule of thirds divides the frame into thirds to place focal points effectively.'],
    ['\u201cBalance\u201d as a principle of design refers to\u2026','the distribution of visual weight in a composition',['the price of materials','the artist\u2019s posture','the drying time'],'Balance is how visual weight is distributed across the work.'],
    ['\u201cContrast\u201d in a composition\u2026','emphasises differences to create visual interest',['makes everything look identical','refers only to price','means using one colour'],'Contrast highlights differences (light/dark, large/small) to draw attention.'],
    ['A \u201cfocal point\u201d in a work of art is\u2026','the area that draws the viewer\u2019s attention first',['the frame','the signature','the price tag'],'A focal point is the primary centre of interest in a composition.']
  ];

  P.vaColor=[
    ['The three primary colours in traditional pigment theory are\u2026','red, yellow and blue',['red, green and blue','orange, green and purple','black, white and grey'],'In traditional pigment (subtractive) theory the primaries are red, yellow and blue.'],
    ['Mixing two primary colours produces a\u2026','secondary colour',['primary colour','neutral grey always','tertiary colour'],'Mixing two primaries yields a secondary colour (e.g. red + yellow = orange).'],
    ['Colours opposite each other on the colour wheel are called\u2026','complementary colours',['analogous colours','primary colours','monochrome'],'Complementary colours sit opposite one another on the wheel.'],
    ['\u201cHue\u201d refers to\u2026','the name of a colour (e.g. red, blue)',['its lightness','its price','its texture'],'Hue is the attribute we name as a colour, such as red or blue.'],
    ['\u201cSaturation\u201d (chroma) describes\u2026','the intensity or purity of a colour',['its darkness','its size','its cost'],'Saturation is how vivid or intense a colour is.'],
    ['\u201cAnalogous\u201d colours are\u2026','colours next to each other on the colour wheel',['colours opposite on the wheel','only black and white','only primaries'],'Analogous colours are neighbours on the colour wheel.']
  ];

  P.vaDrawing=[
    ['\u201cContour drawing\u201d focuses on\u2026','drawing the outlines and edges of a subject',['filling in solid colour','only shading','only measuring'],'Contour drawing captures the outlines and edges of forms.'],
    ['\u201cGesture drawing\u201d is used to\u2026','quickly capture the movement and pose of a subject',['render fine detail slowly','mix paint','stretch canvas'],'Gesture drawing rapidly captures the energy and pose of a subject.'],
    ['In drawing, \u201cshading\u201d creates the illusion of\u2026','three-dimensional form and volume',['a signature','a frame','a price'],'Shading uses value to suggest form and volume.'],
    ['\u201cHatching\u201d and \u201ccross-hatching\u201d are techniques for\u2026','building tone with sets of lines',['stretching canvas','mixing clay','glazing pottery'],'Hatching and cross-hatching build tone using layered lines.'],
    ['\u201cLinear perspective\u201d helps an artist to\u2026','create the illusion of depth on a flat surface',['mix colours','fire clay','frame a photo'],'Linear perspective uses vanishing points to depict depth.'],
    ['In one-point perspective, receding lines meet at\u2026','a single vanishing point',['two vanishing points','no point','the signature'],'One-point perspective has a single vanishing point on the horizon.']
  ];
  P.vaPainting=[
    ['Acrylic paint is generally characterised by\u2026','fast drying and clean-up with water',['very slow drying','being water-repellent when wet','needing turpentine to thin'],'Acrylics dry quickly and can be thinned and cleaned with water.'],
    ['Oil paint is traditionally thinned and cleaned with\u2026','solvents such as turpentine or a medium',['plain water only','clay slip','glaze'],'Oil paints use solvents/mediums rather than water.'],
    ['Watercolour is typically applied\u2026','in transparent, water-based washes',['as thick opaque slabs','with a palette knife only','by firing in a kiln'],'Watercolour is known for transparent, water-based washes.'],
    ['\u201cUnderpainting\u201d is\u2026','an initial layer that establishes tones before further paint',['the final varnish','the frame','the signature'],'An underpainting sets out values/composition before later layers.'],
    ['\u201cImpasto\u201d refers to\u2026','paint applied thickly so texture is visible',['very thin transparent washes','drawing with pencil','digital editing'],'Impasto is thickly applied paint with visible texture.'],
    ['\u201cAlla prima\u201d painting means\u2026','completing a painting in one wet session',['painting only in black','waiting weeks between layers','printing the image'],'Alla prima (\u201cwet-on-wet\u201d) finishes a work in a single session.']
  ];

  P.vaSculpture=[
    ['Sculpture made by removing material (e.g. carving stone) is\u2026','subtractive',['additive','cast','fired'],'Carving away material is a subtractive process.'],
    ['Sculpture made by building up material (e.g. modelling clay) is\u2026','additive',['subtractive','engraved','etched'],'Adding material, as in modelling, is an additive process.'],
    ['\u201cCasting\u201d a sculpture involves\u2026','pouring a material into a mould to take its shape',['carving directly into marble','sketching on paper','glazing pottery'],'Casting pours material (e.g. bronze) into a mould.'],
    ['A \u201crelief\u201d sculpture is\u2026','one that projects from a flat background',['fully free-standing in the round','a flat drawing','a photograph'],'Relief sculpture projects from, but stays attached to, a background.'],
    ['\u201cSculpture in the round\u201d means\u2026','a free-standing work viewable from all sides',['attached to a wall only','a two-dimensional print','a digital render'],'In-the-round sculpture is free-standing and viewable from every side.'],
    ['An \u201carmature\u201d in sculpture is\u2026','an internal framework that supports the material',['a type of glaze','a paintbrush','a photographic filter'],'An armature is the internal skeleton that supports modelling material.']
  ];

  P.vaCeramics=[
    ['\u201cGreenware\u201d refers to clay that is\u2026','shaped but not yet fired',['already glazed and fired','molten glass','fired twice'],'Greenware is unfired, shaped clay.'],
    ['The first firing of pottery is commonly called the\u2026','bisque firing',['glaze firing','raku only','saggar firing'],'The initial firing that hardens greenware is the bisque firing.'],
    ['A \u201ckiln\u201d is used to\u2026','fire clay at high temperature',['mix paint','stretch canvas','develop photographs'],'A kiln fires ceramics at high temperatures.'],
    ['\u201cGlaze\u201d on pottery provides\u2026','a glassy, often decorative and waterproof surface',['an internal armature','a photographic negative','a canvas ground'],'Glaze forms a glassy surface that can seal and decorate ceramics.'],
    ['Pottery shaped on a spinning \u201cwheel\u201d is made by\u2026','throwing',['carving','casting bronze','etching'],'Forming pots on the potter\u2019s wheel is called throwing.'],
    ['\u201cSlip\u201d in ceramics is\u2026','a liquid mixture of clay and water',['a type of kiln','a glaze firing','a carving tool'],'Slip is liquefied clay used for joining or decorating.']
  ];
  P.vaPrintmaking=[
    ['In \u201crelief\u201d printmaking (e.g. woodcut), ink is carried by\u2026','the raised surface that remains after carving',['the recessed lines only','the whole block equally','a photographic plate'],'In relief printing the raised, uncarved surface holds the ink.'],
    ['In \u201cintaglio\u201d printmaking (e.g. etching), ink sits in\u2026','the incised lines below the surface',['the raised areas only','a silk screen','a lithographic stone only'],'Intaglio holds ink in incised lines beneath the plate surface.'],
    ['\u201cLithography\u201d is based on the principle that\u2026','grease and water repel each other',['heat hardens clay','light exposes film','magnets attract iron'],'Lithography relies on the mutual repulsion of grease and water.'],
    ['\u201cScreen printing\u201d pushes ink through\u2026','a stencil on a fine mesh screen',['an engraved copper plate','a carved wood block','a kiln'],'Screen printing forces ink through a mesh stencil.'],
    ['An \u201cedition\u201d in printmaking is\u2026','a set of identical prints from one image, often numbered',['a single unique painting','a photographic negative','a sculpture mould'],'An edition is the group of prints pulled from the same matrix.'],
    ['A \u201cmatrix\u201d in printmaking is\u2026','the surface (block, plate or screen) that carries the image',['the paper only','the frame','the ink pot'],'The matrix is the prepared surface from which prints are taken.']
  ];

  P.vaPhotography=[
    ['In photography, \u201caperture\u201d controls\u2026','the amount of light entering and the depth of field',['the shutter speed only','the paper type','the frame colour'],'Aperture governs light intake and depth of field.'],
    ['A faster \u201cshutter speed\u201d tends to\u2026','freeze motion',['blur all motion','change the hue','increase the print size'],'Faster shutter speeds freeze movement.'],
    ['\u201cISO\u201d in photography refers to\u2026','the sensor/film sensitivity to light',['the lens length','the paper size','the frame material'],'ISO measures sensitivity to light; higher ISO is more sensitive.'],
    ['\u201cDepth of field\u201d describes\u2026','how much of the image is in acceptable focus',['the number of photos taken','the colour temperature','the print price'],'Depth of field is the zone of acceptable sharpness in an image.'],
    ['The \u201crule of thirds\u201d in photography helps with\u2026','composing a balanced, engaging frame',['setting the ISO','charging the battery','printing the photo'],'The rule of thirds guides balanced placement of subjects.'],
    ['\u201cExposure\u201d in photography is determined by aperture, shutter speed and\u2026','ISO',['the frame','the tripod','the lens cap'],'Exposure is set by the triangle of aperture, shutter speed and ISO.']
  ];

  P.vaArtHistory=[
    ['The \u201cRenaissance\u201d was a period of renewed interest in classical art centred in\u2026','Italy from about the 14th\u201316th centuries',['20th-century America','ancient Egypt','medieval Scandinavia'],'The Renaissance flourished in Italy roughly from the 14th to 16th centuries.'],
    ['Leonardo da Vinci painted the\u2026','Mona Lisa',['Starry Night','Guernica','The Scream'],'Leonardo da Vinci painted the Mona Lisa.'],
    ['\u201cImpressionism\u201d is known for\u2026','capturing light and momentary effects with visible brushwork',['photorealistic detail','purely geometric abstraction','ancient religious icons'],'Impressionism sought to capture light and fleeting moments with loose brushwork.'],
    ['Pablo Picasso is closely associated with\u2026','Cubism',['Impressionism','the High Renaissance','Byzantine mosaics'],'Picasso co-founded Cubism with Georges Braque.'],
    ['\u201cAbstract\u201d art is characterised by\u2026','forms that do not aim to represent things realistically',['perfect photographic realism','only religious portraits','only landscape drawing'],'Abstract art uses form and colour without realistic representation.'],
    ['Vincent van Gogh is best known as a\u2026','Post-Impressionist painter',['Renaissance sculptor','Cubist','Baroque architect'],'Van Gogh was a leading Post-Impressionist painter.']
  ];

  P.vaArtEducation=[
    ['A key aim of art education is to develop\u2026','creativity and visual literacy',['only handwriting speed','only arithmetic','ticket sales'],'Art education fosters creativity and the ability to read and make images.'],
    ['A \u201ccritique\u201d in an art class is\u2026','a structured discussion evaluating artwork',['a sale of paintings','a type of paint','a kiln setting'],'A critique is a structured review and discussion of artwork.'],
    ['\u201cVisual literacy\u201d means the ability to\u2026','interpret and create meaning from images',['read only text','mix glaze','fire clay'],'Visual literacy is interpreting and constructing meaning through images.'],
    ['A \u201csketchbook\u201d supports learning by\u2026','encouraging regular practice and idea development',['storing finished frames','replacing all instruction','selling artwork'],'Sketchbooks support ongoing practice and the development of ideas.'],
    ['\u201cProcess over product\u201d in art education emphasises\u2026','the learning experience of making, not just the finished piece',['only the final sale price','only perfect results','ignoring the student'],'This approach values the making process, not only the finished work.'],
    ['Displaying student work in an exhibition helps to\u2026','build confidence and share learning',['lower grades','hide progress','end the course'],'Exhibiting student work builds pride, confidence and shared learning.']
  ];

  var ORI=['Orientation & Study Skills','orientation'];
  var VA_SRC=[['Edna Manley College \u2014 School of Visual Arts','https://emc.edu.jm/'],['The Metropolitan Museum of Art \u2014 Learn','https://www.metmuseum.org/']];
  var DEFS=[
    ['va-intro','Introduction to Visual Arts','\uD83C\uDFA8',1,'Foundational',
     'A friendly first course in visual art: the elements and principles that shape every artwork, plus a tour through art history. A short knowledge check follows every module.',
     ['Name the elements and principles of art','Talk about artworks using correct vocabulary','Recognise major periods and movements','Look at art with an informed eye'],
     ['Analyse an artwork using the elements of art','Keep a one-week visual-observation journal'],
     [ORI,['Elements & Principles','vaComposition'],['Colour Basics','vaColor'],['Art Through History','vaArtHistory']],VA_SRC],

    ['va-drawing','Drawing Fundamentals','\u270F\uFE0F',1,'Foundational',
     'Build core drawing skills: contour and gesture, shading, hatching and linear perspective. Knowledge checks after each module and a cumulative final assessment.',
     ['Draw with contour and gesture','Use value and shading to suggest form','Apply hatching and cross-hatching','Create depth with linear perspective'],
     ['Complete a shaded still-life study','Draw a simple scene in one-point perspective'],
     [ORI,['Drawing Skills','vaDrawing'],['Composition Basics','vaComposition'],['Seeing Value & Form','vaPainting']],VA_SRC],

    ['va-painting','Painting Fundamentals','\uD83D\uDD8C\uFE0F',2,'Intermediate',
     'Learn to paint: the differences between acrylic, oil and watercolour, plus techniques such as underpainting, impasto and alla prima. Knowledge checks after each module and a cumulative final.',
     ['Distinguish acrylic, oil and watercolour','Apply underpainting and layering','Use techniques such as impasto and alla prima','Compose and balance a painting'],
     ['Complete a small painting in your chosen medium','Experiment with one new painting technique'],
     [ORI,['Painting Media & Techniques','vaPainting'],['Colour for Painters','vaColor'],['Composing a Painting','vaComposition']],VA_SRC],

    ['va-color-theory','Colour Theory','\uD83C\uDF08',1,'Foundational',
     'Understand how colour works: primaries and secondaries, the colour wheel, hue, saturation and value, and complementary and analogous schemes. Knowledge checks and a cumulative final.',
     ['Explain primary, secondary and tertiary colours','Use the colour wheel to build schemes','Distinguish hue, saturation and value','Apply complementary and analogous palettes'],
     ['Create a colour wheel','Design two contrasting colour palettes'],
     [ORI,['Colour Theory','vaColor'],['Colour in Composition','vaComposition'],['Colour in Painting','vaPainting']],VA_SRC],

    ['va-composition','Composition & Design Principles','\uD83D\uDCD0',2,'Intermediate',
     'Master how artworks are organised: the elements of art and principles of design \u2014 balance, contrast, focal point and the rule of thirds. Knowledge checks after each module and a cumulative final.',
     ['Apply the elements and principles of design','Use balance and contrast deliberately','Create clear focal points','Arrange strong compositions'],
     ['Analyse the composition of a famous artwork','Create a composition using the rule of thirds'],
     [ORI,['Elements & Principles','vaComposition'],['Colour & Composition','vaColor'],['Composition in History','vaArtHistory']],VA_SRC],

    ['va-sculpture','Sculpture Fundamentals','\uD83D\uDDFF',2,'Intermediate',
     'Explore three-dimensional art: additive and subtractive processes, casting, relief and in-the-round work, and the role of the armature. Knowledge checks after each module and a cumulative final.',
     ['Distinguish additive and subtractive processes','Explain casting, relief and in-the-round','Understand the role of an armature','Think about form in three dimensions'],
     ['Model a small form using an additive process','Design a simple relief composition'],
     [ORI,['Sculptural Processes','vaSculpture'],['Form & Space','vaComposition'],['Sculpture in History','vaArtHistory']],VA_SRC],

    ['va-ceramics','Ceramics & Pottery','\uD83C\uDFFA',2,'Intermediate',
     'An introduction to working with clay: greenware, bisque and glaze firing, the kiln, throwing on the wheel and using slip. Knowledge checks after each module and a cumulative final assessment.',
     ['Explain the stages from greenware to glazed ware','Describe bisque and glaze firing','Understand throwing and hand-building','Use slip and glaze appropriately'],
     ['Design a simple hand-built vessel','Plan the firing stages for a pot'],
     [ORI,['Working with Clay','vaCeramics'],['Form & Design','vaSculpture'],['Surface & Colour','vaColor']],VA_SRC],

    ['va-printmaking','Printmaking Fundamentals','\uD83D\uDDBC\uFE0F',2,'Intermediate',
     'Discover the major printmaking families: relief, intaglio, lithography and screen printing, plus editions and the matrix. Knowledge checks after each module and a cumulative final assessment.',
     ['Distinguish relief, intaglio, litho and screen printing','Explain the idea of a matrix','Understand editions and numbering','Choose a process to suit an image'],
     ['Design a simple relief print','Plan a small edition of a print'],
     [ORI,['Printmaking Processes','vaPrintmaking'],['Composition for Prints','vaComposition'],['Prints in History','vaArtHistory']],VA_SRC],

    ['va-photography','Photography Fundamentals','\uD83D\uDCF7',1,'Foundational',
     'Learn the language of the camera: aperture, shutter speed and ISO, depth of field, exposure and composition. Knowledge checks after each module and a cumulative final assessment.',
     ['Explain aperture, shutter speed and ISO','Control depth of field and motion','Achieve correct exposure','Compose engaging photographs'],
     ['Shoot a set of photos varying depth of field','Compose a photo using the rule of thirds'],
     [ORI,['Camera & Exposure','vaPhotography'],['Composition for Photographers','vaComposition'],['Light & Colour','vaColor']],VA_SRC],

    ['va-art-history','Art History & Appreciation','\uD83C\uDFDB\uFE0F',2,'Intermediate',
     'Journey through the history of art \u2014 from the Renaissance and Impressionism to modern movements such as Cubism and abstraction \u2014 and learn to appreciate what you see. Grounded in verified history.',
     ['Place major art movements in order','Identify landmark artists and works','Describe the features of key movements','Discuss art using informed context'],
     ['Build a timeline of major art movements','Write a short appreciation of a chosen artwork'],
     [ORI,['Movements & Masters','vaArtHistory'],['Looking Closely','vaComposition'],['Colour Through History','vaColor']],VA_SRC],

    ['va-art-education','Art Education Foundations','\uD83C\uDFEB',2,'Intermediate',
     'An introduction to teaching art: fostering creativity and visual literacy, running critiques, using sketchbooks and valuing process over product. Grounded in established practice. Knowledge checks and a final.',
     ['Explain the aims of art education','Facilitate a constructive critique','Use sketchbooks to support learning','Plan a simple art lesson'],
     ['Draft a short art lesson plan','Design a critique format for a class'],
     [ORI,['Teaching Art','vaArtEducation'],['Elements & Principles for Teachers','vaComposition'],['Colour for the Classroom','vaColor']],VA_SRC]
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
      prerequisites:(level>=3?'Solid grounding in visual-art fundamentals is recommended.':(level===2?'Basic art knowledge is helpful but not required.':'No prior experience required.')),
      outcomes:outcomes, projects:projects, sources:sources, modules:modules,
      assessmentPolicy:'Each instructional module has a five-question knowledge check, and the final assessment contains 15 separate cumulative questions that do not reuse module questions. A score of 80% or higher is recommended to progress. This internal certificate is not a professional licence or accredited degree.'
    };
    QUIZ[id]={module:moduleQuizzes, final:finalQs};
  });

  window.VA_ACADEMY_COURSES=COURSES;
  window.VA_ACADEMY_QUIZZES=QUIZ;

  function register(){
    try{ if(window.COURSE_DATA) Object.assign(window.COURSE_DATA, COURSES); }catch(e){}
    window.NEW_QUIZBANK=Object.assign(window.NEW_QUIZBANK||{}, QUIZ);
    try{ if(window.pages) Object.keys(COURSES).forEach(function(id){ if(window.pages.indexOf(id)<0) window.pages.push(id); }); }catch(e){}
    if(typeof window.navigate==='function' && !window.navigate.__vaAcadWrapped){
      var oldNav=window.navigate;
      var wrapped=function(page){ if(COURSES[page] && typeof window.openCourse==='function'){ window.openCourse(page); return; } return oldNav.apply(this,arguments); };
      wrapped.__vaAcadWrapped=true; window.navigate=wrapped;
    }
  }
  register();

  function renderCards(){
    var grid=document.getElementById('coursesGrid'); if(!grid) return;
    if(grid.querySelector('.va-academy-card')) return;
    Object.keys(COURSES).forEach(function(id){
      var c=COURSES[id];
      var card=document.createElement('div');
      card.className='course-card va-academy-card';
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
