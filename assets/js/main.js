(function(){
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Mobile nav ---------- */
  var toggle = document.getElementById('nav-toggle');
  var nav = document.getElementById('primary-nav');
  if (toggle && nav){
    toggle.addEventListener('click', function(){
      var isOpen = nav.classList.toggle('open');
      toggle.classList.toggle('open', isOpen);
      toggle.setAttribute('aria-expanded', isOpen);
    });
    nav.querySelectorAll('a').forEach(function(a){
      a.addEventListener('click', function(){
        nav.classList.remove('open');
        toggle.classList.remove('open');
        toggle.setAttribute('aria-expanded', false);
      });
    });
  }

  /* ---------- Project filtering ---------- */
  var filterBtns = document.querySelectorAll('.filter-btn');
  var cards = document.querySelectorAll('.project-card');
  var noResults = document.getElementById('no-results');
  if (filterBtns.length){
    filterBtns.forEach(function(btn){
      btn.addEventListener('click', function(){
        filterBtns.forEach(function(b){ b.classList.remove('active'); });
        btn.classList.add('active');
        var filter = btn.getAttribute('data-filter');
        var visibleCount = 0;
        cards.forEach(function(card){
          var match = filter === 'all' || card.getAttribute('data-category') === filter;
          card.classList.toggle('hidden-card', !match);
          if (match) visibleCount++;
        });
        if (noResults) noResults.style.display = visibleCount === 0 ? 'block' : 'none';
      });
    });
  }

  /* ---------- Spidey-sense cursor glow (desktop, hero only) ---------- */
  var hero = document.getElementById('hero');
  var sense = document.getElementById('spidey-sense');
  if (hero && sense && window.matchMedia('(hover: hover)').matches && !reduceMotion){
    hero.addEventListener('mousemove', function(e){
      var rect = hero.getBoundingClientRect();
      var x = ((e.clientX - rect.left) / rect.width) * 100;
      var y = ((e.clientY - rect.top) / rect.height) * 100;
      sense.style.setProperty('--mx', x + '%');
      sense.style.setProperty('--my', y + '%');
    });
  }

  /* ---------- Web-thread wayfinder ----------
     A vertical strand sits in the page's left gutter (wide screens only).
     Nodes are placed at the actual scroll position of each tracked section,
     connected to the strand with a short anchor thread - a mini web-map of
     the page, not just a line. Click a node to jump to that section. */
  var threadEl = document.getElementById('web-thread');
  if (threadEl){
    var svgNS = 'http://www.w3.org/2000/svg';
    var svg = threadEl.querySelector('svg');
    var trackedSections = Array.prototype.slice.call(document.querySelectorAll('[data-thread-label]'));
    var progressPath, spiderMark;

    function clear(el){ while(el.firstChild) el.removeChild(el.firstChild); }

    function build(){
      if (!svg) return;
      clear(svg);
      var vh = window.innerHeight;
      svg.setAttribute('viewBox', '0 0 74 ' + vh);

      var strandX = 45;
      var main = document.createElementNS(svgNS,'path');
      main.setAttribute('class','strand');
      main.setAttribute('d','M'+strandX+',0 L'+strandX+','+vh);
      svg.appendChild(main);

      progressPath = document.createElementNS(svgNS,'path');
      progressPath.setAttribute('class','strand-progress');
      progressPath.setAttribute('d','M'+strandX+',0 L'+strandX+','+vh);
      progressPath.style.strokeDasharray = vh;
      progressPath.style.strokeDashoffset = vh;
      svg.appendChild(progressPath);

      var docHeight = document.documentElement.scrollHeight - window.innerHeight;
      trackedSections.forEach(function(sec){
        if (docHeight <= 0) return;
        var pct = Math.max(0, Math.min(1, sec.offsetTop / docHeight));
        var y = pct * vh;

        var anchor = document.createElementNS(svgNS,'line');
        anchor.setAttribute('class','anchor');
        anchor.setAttribute('x1', strandX); anchor.setAttribute('y1', y);
        anchor.setAttribute('x2', strandX - 20); anchor.setAttribute('y2', y - 9);
        svg.appendChild(anchor);

        var hit = document.createElementNS(svgNS,'circle');
        hit.setAttribute('class','node-hit');
        hit.setAttribute('cx', strandX - 20); hit.setAttribute('cy', y - 9); hit.setAttribute('r', 12);
        hit.addEventListener('click', function(){
          sec.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block:'start' });
        });
        var label = sec.getAttribute('data-thread-label');
        if (label){
          var title = document.createElementNS(svgNS,'title');
          title.textContent = label;
          hit.appendChild(title);
        }
        svg.appendChild(hit);

        var node = document.createElementNS(svgNS,'circle');
        node.setAttribute('class','node');
        node.setAttribute('cx', strandX - 20); node.setAttribute('cy', y - 9); node.setAttribute('r', 6);
        svg.appendChild(node);

        var dot = document.createElementNS(svgNS,'circle');
        dot.setAttribute('class','node-dot');
        dot.setAttribute('cx', strandX - 20); dot.setAttribute('cy', y - 9); dot.setAttribute('r', 2);
        svg.appendChild(dot);
      });

      spiderMark = document.createElementNS(svgNS,'g');
      spiderMark.setAttribute('id','thread-spider');
      var body = document.createElementNS(svgNS,'circle');
      body.setAttribute('cx', strandX); body.setAttribute('cy', 13); body.setAttribute('r', 6);
      body.setAttribute('fill', 'var(--primary)');
      spiderMark.appendChild(body);
      [[-6,-6],[-9,0],[-10,3],[6,-6],[9,0],[10,3]].forEach(function(p){
        var leg = document.createElementNS(svgNS,'line');
        leg.setAttribute('x1', strandX); leg.setAttribute('y1', 13);
        leg.setAttribute('x2', strandX + p[0]); leg.setAttribute('y2', 13 + p[1]);
        leg.setAttribute('stroke', 'var(--bg)'); leg.setAttribute('stroke-width', '1.4');
        spiderMark.appendChild(leg);
      });
      svg.appendChild(spiderMark);

      update();
    }

    function update(){
      if (!progressPath || threadEl.offsetParent === null) return;
      var doc = document.documentElement;
      var scrollTop = doc.scrollTop || document.body.scrollTop;
      var scrollHeight = doc.scrollHeight - doc.clientHeight;
      var pct = scrollHeight > 0 ? scrollTop / scrollHeight : 0;
      var vh = window.innerHeight;
      progressPath.style.strokeDashoffset = vh - (vh * pct);
      if (spiderMark) spiderMark.setAttribute('transform', 'translate(0,' + (pct * (vh - 26)) + ')');
    }

    var resizeTimer;
    window.addEventListener('resize', function(){
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(build, 150);
    });
    window.addEventListener('scroll', update, { passive:true });
    build();
  }

  /* ---------- Back to top ---------- */
  var backBtn = document.getElementById('back-to-top');
  if (backBtn){
    window.addEventListener('scroll', function(){
      backBtn.classList.toggle('show', window.scrollY > 600);
    }, { passive:true });
    backBtn.addEventListener('click', function(){
      window.scrollTo({ top:0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  }

  /* ---------- Footer year ---------- */
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Hero background video graceful fallback ---------- */
  var heroVideo = document.getElementById('hero-video');
  if (heroVideo){
    heroVideo.addEventListener('error', function(){ heroVideo.style.display = 'none'; });
  }

  /* ---------- Demo reel: build from data-yt-id, add minimize toggle ---------- */
  document.querySelectorAll('.demo-reel').forEach(function(reel){
    var ytId = reel.getAttribute('data-yt-id');
    var frame = reel.querySelector('.reel-frame');
    if (ytId){
      var iframe = document.createElement('iframe');
      iframe.src = 'https://www.youtube-nocookie.com/embed/' + ytId +
        '?autoplay=1&mute=1&loop=1&playlist=' + ytId + '&controls=1&rel=0&modestbranding=1';
      iframe.title = reel.getAttribute('data-title') || 'Demo reel';
      iframe.allow = 'autoplay; encrypted-media; picture-in-picture';
      iframe.allowFullscreen = true;
      frame.innerHTML = '';
      frame.appendChild(iframe);
    }
    var toggleBtn = reel.querySelector('.reel-toggle');
    if (toggleBtn){
      toggleBtn.addEventListener('click', function(){
        var collapsed = reel.classList.toggle('collapsed');
        toggleBtn.setAttribute('aria-expanded', !collapsed);
        toggleBtn.querySelector('.reel-toggle-text').textContent = collapsed ? 'Show Reel' : 'Minimize Reel';
      });
    }
  });

  /* ---------- Project-card YouTube lite-embeds (click to play) ---------- */
  document.querySelectorAll('.card-yt').forEach(function(btn){
    btn.addEventListener('click', function(){
      var id = btn.getAttribute('data-yt-id');
      if (!id) return;
      var iframe = document.createElement('iframe');
      iframe.src = 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0&modestbranding=1';
      iframe.title = btn.getAttribute('data-title') || 'Project video';
      iframe.allow = 'autoplay; encrypted-media; picture-in-picture';
      iframe.allowFullscreen = true;
      iframe.style.cssText = 'position:absolute; inset:0; width:100%; height:100%; border:0;';
      btn.replaceWith(iframe);
    });
  });
})();
