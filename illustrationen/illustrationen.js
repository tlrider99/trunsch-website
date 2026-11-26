/* Animierte Illustrationen: Jedes Element mit data-illu="pfad.svg" laedt sein SVG erst kurz bevor
   es ins Bild scrollt (inline, damit CSS-Animation und Schrift greifen) und spielt den
   Strich-fuer-Strich-Aufbau ab, sobald es sichtbar ist. Bei prefers-reduced-motion zeigt das
   SVG selbst sofort das fertige Bild. Ohne JavaScript bleibt das <noscript>-Bild. */
(function () {
  var boxen = document.querySelectorAll('[data-illu]');
  if (!boxen.length || !('fetch' in window)) return;
  var io = 'IntersectionObserver' in window;

  var abspielen = io ? new IntersectionObserver(function (eintraege) {
    eintraege.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.remove('f2p-wartet'); abspielen.unobserve(e.target); }
    });
  }, { threshold: 0.35 }) : null;

  function laden(box) {
    var pfad = box.getAttribute('data-illu');
    fetch(pfad).then(function (r) {
      if (!r.ok) throw new Error(r.status);
      return r.text();
    }).then(function (text) {
      box.innerHTML = text;
      var svg = box.querySelector('svg');
      if (!svg) return;
      if (abspielen) { svg.classList.add('f2p-wartet'); abspielen.observe(svg); }
    }).catch(function () {
      var img = document.createElement('img');
      img.src = pfad; img.alt = box.getAttribute('aria-label') || ''; img.loading = 'lazy';
      box.innerHTML = ''; box.appendChild(img);
    });
  }

  if (!io) { boxen.forEach(laden); return; }
  var vorladen = new IntersectionObserver(function (eintraege) {
    eintraege.forEach(function (e) {
      if (e.isIntersecting) { vorladen.unobserve(e.target); laden(e.target); }
    });
  }, { rootMargin: '400px 0px' });
  boxen.forEach(function (box) { vorladen.observe(box); });
})();
