/* Animierte Illustration: Jedes Element mit data-illu="pfad.svg" laedt sein SVG erst kurz bevor
   es ins Bild scrollt (inline, damit CSS-Animation und Schrift greifen). Abgespielt wird nur,
   solange es sichtbar ist; nach dem Ende (Animation "f2p-uhr") beginnt es von vorn.
   Ein Knopf haelt den Film an und setzt ihn fort (WCAG 2.2.2). Der Film laeuft auch bei
   "Animationen aus" im System, weil Kliniksysteme (Terminalserver) das oft pauschal abschalten;
   die Animation ist ein ruhiger Strichaufbau ohne Zoom oder Parallaxe. Ohne JavaScript bleibt das <noscript>-Bild. */
(function () {
  var boxen = document.querySelectorAll('[data-illu]');
  if (!boxen.length || !('fetch' in window)) return;
  var io = 'IntersectionObserver' in window;

  var sichtbar = io ? new IntersectionObserver(function (eintraege) {
    eintraege.forEach(function (e) {
      e.target.dataset.sichtbar = e.isIntersecting ? '1' : '';
      zustand(e.target);
    });
  }, { threshold: 0.35 }) : null;

  function zustand(box) {
    var svg = box.querySelector('svg');
    if (svg) svg.classList.toggle('f2p-wartet', box.dataset.pause === '1' || (io && box.dataset.sichtbar !== '1'));
  }

  function knopf(box) {
    var k = document.createElement('button');
    k.type = 'button'; k.className = 'illu-knopf';
    function text() {
      var p = box.dataset.pause === '1';
      k.textContent = p ? 'Abspielen' : 'Pause';
      k.setAttribute('aria-label', p ? 'Animation abspielen' : 'Animation anhalten');
    }
    k.addEventListener('click', function () {
      box.dataset.pause = box.dataset.pause === '1' ? '' : '1';
      text(); zustand(box);
    });
    text();
    box.parentNode.appendChild(k);
  }

  function schleife(box) {
    box.addEventListener('animationend', function (e) {
      if (e.animationName !== 'f2p-uhr') return;
      var alt = box.querySelector('svg');
      var neu = alt.cloneNode(true);   // Klon startet alle CSS-Animationen neu
      alt.parentNode.replaceChild(neu, alt);
      zustand(box);
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
      zustand(box);
      if (sichtbar) sichtbar.observe(box);
      schleife(box);
      knopf(box);
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
