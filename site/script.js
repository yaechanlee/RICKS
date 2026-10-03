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
  const slides = [...carousel.querySelectorAll('.hero-slide')];
  const dots = [...carousel.querySelectorAll('.carousel-dot')];
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
  dots.forEach((dot, i) => dot.addEventListener('click', () => manualMove(i)));
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
