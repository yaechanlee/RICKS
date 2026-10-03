(() => {
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (preference.matches || !('IntersectionObserver' in window)) return;
  const root = document.documentElement;
  const seen = new WeakSet();
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-revealed');
        observer.unobserve(entry.target);
      }
    });
  }, {threshold: .06, rootMargin: '0px 0px -18px 0px'});
  const selector = '.page-intro, .focus-row, .page-card, .director-message, .faculty-section > .section-heading, .faculty-card, .graduate-section, .people-cta, .submit-intro, .form-panel, .submit-note, .cms-card, .cms-empty, .notice-empty, .reading-article > header, .reading-body, .editor-heading, .editor-login';
  function scan() {
    document.querySelectorAll(selector).forEach(element => {
      if (seen.has(element)) return;
      seen.add(element);
      const rect = element.getBoundingClientRect();
      // Never hide content already on screen, including asynchronously loaded articles.
      if (rect.top < window.innerHeight && rect.bottom > 0) return;
      element.classList.add('page-reveal');
      if (element.matches('.faculty-card, .page-card, .cms-card')) {
        const peers = Array.from(element.parentElement.children);
        element.style.setProperty('--page-delay', (peers.indexOf(element) % 4) * 75 + 'ms');
      }
      observer.observe(element);
    });
  }
  scan();
  root.classList.add('page-motion-ready');
  new MutationObserver(scan).observe(document.querySelector('main') || document.body, {childList:true, subtree:true});
  preference.addEventListener('change', event => {
    if (event.matches) {
      root.classList.remove('page-motion-ready');
      observer.disconnect();
    }
  });
})();