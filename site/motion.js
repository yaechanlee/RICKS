(() => {
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const hero = document.querySelector('.hero');
  const progress = document.querySelector('.reading-progress');
  const nodes = document.querySelectorAll('.home-intro, .home-gateway, .home-section-heading, .home-director, .home-community, .home-section-deck, .home-purpose > div, .home-contribute > .wrap');
  if ('IntersectionObserver' in window && !reduced.matches) {
    root.classList.add('motion-ready');
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) {entry.target.classList.add('is-visible'); observer.unobserve(entry.target);}
    }), {threshold: .08, rootMargin:'0px 0px -25px 0px'});
    nodes.forEach((node,i) => {node.classList.add('reveal'); if(node.matches('.home-gateway')) node.style.setProperty('--reveal-delay', (i % 3) * 100 + 'ms'); observer.observe(node);});
    document.querySelectorAll('#latest-publications, #notices-list').forEach(container => {
      const watch = new MutationObserver(() => container.querySelectorAll('.cms-card:not(.reveal)').forEach((card,i) => {card.classList.add('reveal');card.style.setProperty('--reveal-delay',i*90+'ms');observer.observe(card);}));
      watch.observe(container,{childList:true});
    });
  }
  // Reserve the actual masthead height, including wrapped branding and zoom.
  const masthead = document.querySelector('.home-page .site-header');
  function measureMasthead() {
    if (masthead) document.body.style.setProperty('--masthead-height', masthead.offsetHeight + 'px');
  }
  if (masthead && 'ResizeObserver' in window) new ResizeObserver(measureMasthead).observe(masthead);
  addEventListener('resize', measureMasthead);
  measureMasthead();
  let scheduled = false;
  function update() {
    scheduled = false;
    const y = window.scrollY;
    const range = document.documentElement.scrollHeight - window.innerHeight;
    if(progress) progress.style.transform = 'scaleX(' + (range > 0 ? y/range : 0) + ')';
    document.body.classList.toggle('has-scrolled', y > 30);
  }
  addEventListener('scroll', () => {if(!scheduled){scheduled=true;requestAnimationFrame(update);}}, {passive:true});
  addEventListener('resize',update);update();
  // Keep each campus photograph synchronized with the selected carousel slide.
  const photoFrames = [...(hero?.querySelectorAll('.hero-scene-frame') || [])];
  const slideHost = hero?.querySelector('.hero-slides');
  function syncCampusPhoto() {
    const slides = [...(slideHost?.querySelectorAll('.hero-slide') || [])];
    const index = Math.max(0, slides.findIndex(slide => slide.classList.contains('is-active')));
    photoFrames.forEach((frame, i) => frame.classList.toggle('is-active', i === index % photoFrames.length));
  }
  if (slideHost && photoFrames.length) {
    new MutationObserver(syncCampusPhoto).observe(slideHost, {attributes:true,attributeFilter:['class'],childList:true,subtree:true});
    syncCampusPhoto();
  }
  // Touch swipes use the existing accessible carousel controls.
  let touchX;
  hero?.addEventListener('touchstart',e=>{touchX=e.touches[0].clientX;},{passive:true});
  hero?.addEventListener('touchend',e=>{if(touchX===undefined)return;const dx=e.changedTouches[0].clientX-touchX;if(Math.abs(dx)>65)hero.querySelector(dx<0?'.carousel-next':'.carousel-prev')?.click();touchX=undefined;},{passive:true});
})();