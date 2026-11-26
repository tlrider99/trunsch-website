/* Animierte Illustration: Jedes Element mit data-illu="pfad.svg" laedt sein SVG erst kurz bevor
   es ins Bild scrollt (inline, damit CSS-Animation und Schrift greifen). Abgespielt wird nur,
   solange es sichtbar ist; nach dem Ende (Animation "f2p-uhr") beginnt es von vorn.
   Bei prefers-reduced-motion zeigt das SVG selbst ein ruhendes Bild. Ohne JavaScript bleibt das <noscript>-Bild. */
(function () {
  var boxen = document.querySelectorAll('[data-illu]');
  if (!boxen.length || !('fetch' in window)) return;
  var io = 'IntersectionObserver' in window;

  var sichtbar = io ? new IntersectionObserver(function (eintraege) {
    eintraege.forEach(function (e) {
      var svg = e.target.querySelector('svg');
      if (svg) svg.classList.toggle('f2p-wartet', !e.isIntersecting);
    });
  }, { threshold: 0.35 }) : null;

  function schleife(box) {
    box.addEventListener('animationend', function (e) {
      if (e.animationName !== 'f2p-uhr') return;
      var alt = box.querySelector('svg');
      var neu = alt.cloneNode(true);   // Klon startet alle CSS-Animationen neu
      alt.parentNode.replaceChild(neu, alt);
    });
  }

  function laden(box) {
    var pfad = box.getAttribute('data-illu');
    fetch(pfad).then(function (r) {
      if (!r.ok) throw new Error(r.status);
      return r.text();
    }).then(function (text) {
      box.innerHTML = text;
      var svg = box.querySelector('svg');
      if (!svg) return;
      if (sichtbar) { svg.classList.add('f2p-wartet'); sichtbar.observe(box); }
      schleife(box);
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
