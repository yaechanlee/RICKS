const menuButton = document.querySelector('.menu-toggle');
const nav = document.querySelector('#primary-nav');
menuButton?.addEventListener('click', () => {
  const expanded = menuButton.getAttribute('aria-expanded') === 'true';
  menuButton.setAttribute('aria-expanded', String(!expanded));
  nav.classList.toggle('open', !expanded);
});
nav?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
  nav.classList.remove('open');
  menuButton?.setAttribute('aria-expanded', 'false');
}));

const carousel = document.querySelector('.hero');
if (carousel) {
  let slides = [...carousel.querySelectorAll('.hero-slide')];
  let dots = [...carousel.querySelectorAll('.carousel-dot')];
  const counter = carousel.querySelector('.carousel-count b');
  const pauseButton = carousel.querySelector('.carousel-pause');
  const featured = document.querySelector('#reviews-list .article-card[data-featured="true"]');
  let activeIndex = 0;
  let timer;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let paused = reduceMotion.matches;

  if (featured) {
    const title = featured.querySelector('.article-copy h3')?.innerText.trim();
    const category = featured.querySelector('.article-type')?.innerText.split('·')[0].trim();
    const byline = featured.querySelector('.byline span')?.innerText.replace(/\s+/g, ' ').trim();
    const link = featured.querySelector('.article-copy h3 a')?.getAttribute('href');
    if (title) carousel.querySelector('.feature-title').textContent = title;
    if (category) carousel.querySelector('.feature-type').textContent = category;
    if (byline) carousel.querySelector('.feature-byline').textContent = byline;
    if (link && link !== '#') carousel.querySelector('.feature-link').setAttribute('href', link);
  }

  function showSlide(index) {
    activeIndex = (index + slides.length) % slides.length;
    slides.forEach((slide, i) => {
      const isActive = i === activeIndex;
      slide.classList.toggle('is-active', isActive);
      slide.setAttribute('aria-hidden', String(!isActive));
      slide.toggleAttribute('inert', !isActive);
    });
    dots.forEach((dot, i) => {
      const isActive = i === activeIndex;
      dot.classList.toggle('is-active', isActive);
      dot.setAttribute('aria-current', String(isActive));
    });
    if (counter) counter.textContent = String(activeIndex + 1).padStart(2, '0');
  }
  function stopTimer() { window.clearInterval(timer); }
  function startTimer() {
    stopTimer();
    carousel.classList.toggle("is-paused", paused || document.hidden);
    if (!paused && !document.hidden) timer = window.setInterval(() => showSlide(activeIndex + 1), 6500);
  }
  function manualMove(index) { showSlide(index); startTimer(); }

  carousel.querySelector('.carousel-prev')?.addEventListener('click', () => manualMove(activeIndex - 1));
  carousel.querySelector('.carousel-next')?.addEventListener('click', () => manualMove(activeIndex + 1));
  carousel.querySelector('.carousel-dots')?.addEventListener('click',e=>{const dot=e.target.closest('.carousel-dot');if(dot)manualMove(dots.indexOf(dot));});
carousel.addEventListener('ricks-slides-updated',()=>{slides=[...carousel.querySelectorAll('.hero-slide')];dots=[...carousel.querySelectorAll('.carousel-dot')];if(counter)counter.parentElement.lastChild.textContent=' / '+String(slides.length).padStart(2,'0');showSlide(Math.min(activeIndex,slides.length-1));startTimer();});
  pauseButton?.addEventListener('click', () => {
    paused = !paused;
    pauseButton.textContent = paused ? '▶' : 'Ⅱ';
    pauseButton.setAttribute('aria-label', paused ? 'Play slideshow' : 'Pause slideshow');
    startTimer();
  });
  document.addEventListener('visibilitychange', startTimer);
  reduceMotion.addEventListener('change', () => { if (reduceMotion.matches) { paused = true; pauseButton.textContent = '▶'; pauseButton.setAttribute('aria-label', 'Play slideshow'); startTimer(); } });
  if (paused && pauseButton) {pauseButton.textContent = '▶';pauseButton.setAttribute('aria-label','Play slideshow');}
  startTimer();
}

// Make post search available on every public page, including pages without a board.
window.addEventListener('load',()=>{if(!window.RicksCMS&&!document.querySelector('script[src*="/cms.js"]')){const script=document.createElement('script');script.src='/cms.js?v=18';document.head.append(script);}});

// Anonymous readership metrics; the analytics dashboard is owner-only.
(()=>{if(/^\/(admin|analytics)(\/|\.|$)/.test(location.pathname))return;const tracker=document.createElement('script');tracker.src='/ricks-tracker.js?v=1';tracker.dataset.endpoint='https://ricks-analytics.yaechanlee491236.chatgpt.site/api/collect';document.head.append(tracker);})();

// Publication and research initiative submenus.
document.querySelectorAll('.nav-submenu-toggle').forEach(button=>{button.addEventListener('click',()=>{const group=button.closest('.nav-group'),open=!group.classList.contains('is-open');document.querySelectorAll('.nav-group').forEach(other=>{other.classList.remove('is-open');other.querySelector('button').setAttribute('aria-expanded','false')});group.classList.toggle('is-open',open);button.setAttribute('aria-expanded',String(open))})});
document.addEventListener('click',event=>{if(!event.target.closest('.nav-group'))document.querySelectorAll('.nav-group').forEach(group=>{group.classList.remove('is-open');group.querySelector('button').setAttribute('aria-expanded','false')})});
document.addEventListener('keydown',event=>{if(event.key==='Escape')document.querySelectorAll('.nav-group').forEach(group=>{group.classList.remove('is-open');group.querySelector('button').setAttribute('aria-expanded','false')})});

// Keep atlas navigation within the current language of RICKS.
document.querySelectorAll('a[href*="koica-research-atlas"]').forEach(a=>{a.href=location.pathname.startsWith('/ko/')?'/ko/research-initiatives/koica-atlas/':'/research-initiatives/koica-atlas/';});

// Mobile menu state cannot carry over into the visible desktop navigation.
const mobileNavigation = window.matchMedia('(max-width:768px)');
function resetNavigation(){nav?.classList.remove('open');menuButton?.setAttribute('aria-expanded','false');document.querySelectorAll('.nav-group').forEach(group=>{group.classList.remove('is-open');group.querySelector('button')?.setAttribute('aria-expanded','false');});}
mobileNavigation.addEventListener('change',resetNavigation);

// Native Where Is Research on Korea Happening—and with Whom? initiative: shared navigation and cards.
(function(){
 const ko=location.pathname.startsWith('/ko/'),prefix=ko?'/ko':'',route=prefix+'/research-initiatives/korea-management-network/',name=ko?'한국에 관한 연구는 어디에서, 누구와 이루어지고 있을까?':'Where Is Research on Korea Happening—and with Whom?',description=ko?'한국 관련 경영 연구의 출판과 국가 간 공동연구를 탐색합니다.':'Explore where research on Korean business and management is published and how countries collaborate.',action=ko?'네트워크 탐색 →':'Explore the network →';
 function ensureNetworkNavigation(){document.querySelectorAll('.nav-submenu').forEach(menu=>{if(menu.querySelector('a[href="'+prefix+'/research-initiatives/koica-atlas/"]')&&!menu.querySelector('a[href="'+route+'"]')){const a=document.createElement('a');a.href=route;a.textContent=name;menu.append(a)}});}
 ensureNetworkNavigation();const header=document.querySelector('.site-header');if(header)new MutationObserver(ensureNetworkNavigation).observe(header,{childList:true,subtree:true});
 const art='<img src="/korea-management-network.svg?v=20261006-1" alt="Country collaboration network" loading="lazy">';
 const grid=document.querySelector('.initiative-card-grid');if(grid&&!grid.querySelector('a[href="'+route+'"]')){const card=document.createElement('a');card.className='initiative-card';card.href=route;card.innerHTML='<div class="initiative-card-art">'+art+'</div><div class="initiative-card-copy"><p class="eyebrow">KOREA RESEARCH NETWORK · MANAGEMENT</p><h2>'+name+'</h2><p>'+description+'</p><p class="initiative-card-stats">9,039 '+(ko?'편 · 2000–2025년 · 잠정 선별':'articles and reviews · 2000–2025 · provisional screening')+'</p><span class="text-link">'+action+'</span></div>';grid.append(card)}
 const home=document.querySelector('.home-research-initiatives>.wrap');if(home&&!home.querySelector('a[href="'+route+'"]')){const card=document.createElement('a');card.className='atlas-feature';card.href=route;card.style.marginTop='24px';card.innerHTML='<div class="atlas-art">'+art+'</div><div class="atlas-feature-copy"><p class="eyebrow">KOREA RESEARCH NETWORK · MANAGEMENT</p><h3>'+name+'</h3><p>'+description+'</p><div class="atlas-facts"><span><b>9,039</b> '+(ko?'논문':'articles / reviews')+'</span><span><b>2000–2025</b></span></div><span class="text-link">'+action+'</span></div>';home.append(card)}
})();
