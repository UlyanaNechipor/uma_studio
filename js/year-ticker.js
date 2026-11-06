/* UMA · year-ticker
   Год-табло в мобильном списке проектов: когда карточка подсвечивается
   (класс is-focused ставит js/mobile-radar.js), цифры года прокручиваются,
   как на механическом табло, — каждая делает полный оборот и встаёт на место,
   слева направо с небольшой задержкой. Стили — css/year-ticker.css. */
(function () {
  /* ================= НАСТРОЙКИ ================= */
  var STAGGER = 70;      // мс: задержка между соседними цифрами
  /* ============================================= */

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;

  // год карточки: текстовый элемент, в котором ровно четыре цифры
  function yearAtom(card) {
    if (card.__umaYrA) return card.__umaYrA;
    var atoms = card.querySelectorAll('[data-elem-type="text"] .tn-atom');
    for (var i = 0; i < atoms.length; i++) {
      if (/^\s*\d{4}\s*$/.test(atoms[i].textContent)) return (card.__umaYrA = atoms[i]);
    }
    return null;
  }

  function build(atom) {
    if (atom.__umaYr) return atom.__umaYr;
    var year = atom.textContent.trim();
    var strip = '';
    for (var r = 0; r < 2; r++) for (var n = 0; n < 10; n++) strip += '<span>' + n + '</span>';
    var html = '<span class="uma-yr" aria-label="' + year + '">';
    for (var k = 0; k < year.length; k++) {
      html += '<span class="uma-yr__d" aria-hidden="true"><span class="uma-yr__s" data-d="' + year[k] + '"' +
        ' style="transition-delay:' + (k * STAGGER) + 'ms">' + strip + '</span></span>';
    }
    html += '</span>';
    atom.innerHTML = html;
    atom.__umaYr = atom.querySelectorAll('.uma-yr__s');
    place(atom.__umaYr, 10, false);   // стоит на своей цифре (во втором круге)
    return atom.__umaYr;
  }

  // поставить полосы цифр на цифру года в круге round (0 или 1)
  function place(strips, round, animate) {
    for (var i = 0; i < strips.length; i++) {
      var s = strips[i], d = +s.getAttribute('data-d');
      s.classList.toggle('is-instant', !animate);
      s.style.transform = 'translateY(' + (-(d + round) * 10 / 2) + '%)';
    }
  }

  function roll(card) {
    var atom = yearAtom(card);
    if (!atom) return;
    var strips = build(atom);
    // мгновенно на ту же цифру в первом круге, потом с анимацией — во второй: полный оборот
    place(strips, 0, false);
    void atom.offsetHeight;
    place(strips, 10, true);
  }

  function watch() {
    var cards = document.querySelectorAll('.project-group-card');
    if (!cards.length || !window.MutationObserver) return;
    for (var i = 0; i < cards.length; i++) {
      var c = cards[i];
      if (c.__umaYrW) continue;
      c.__umaYrW = true;
      var a = yearAtom(c);
      if (a) build(a);
      (function (card) {
        var was = card.classList.contains('is-focused');
        new MutationObserver(function () {
          var on = card.classList.contains('is-focused');
          if (on && !was) roll(card);
          was = on;
        }).observe(card, { attributes: true, attributeFilter: ['class'] });
      })(c);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', watch);
  else watch();
  window.addEventListener('load', watch);
})();
