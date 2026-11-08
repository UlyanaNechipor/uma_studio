/* UMA · year-ticker
   Год-табло в мобильном списке проектов: при появлении карточки (вместе со своей строкой)
   и когда карточка подсвечивается (класс is-focused ставит js/mobile-radar.js), цифры года прокручиваются,
   как на табло: каждая коротко докручивается на своё место с нескольких цифр раньше,
   слева направо с небольшой задержкой. Стили — css/year-ticker.css. */
(function () {
  /* ================= НАСТРОЙКИ ================= */
  var STAGGER = 45;      // мс: задержка между соседними цифрами
  var STEPS   = 3;       // на сколько цифр назад откатывается каждая цифра перед тем, как встать на место
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
    place(atom.__umaYr, 0, false);    // стоит на своей цифре
    return atom.__umaYr;
  }

  // поставить полосы цифр на цифру года, сдвинутую на back назад (полоса 0–9 дважды: 20 строк)
  function place(strips, back, animate) {
    for (var i = 0; i < strips.length; i++) {
      var s = strips[i], d = +s.getAttribute('data-d');
      s.classList.toggle('is-instant', !animate);
      s.style.transform = 'translateY(' + (-(d + 10 - back) * 5) + '%)';
    }
  }

  function roll(card) {
    var atom = yearAtom(card);
    if (!atom) return;
    var strips = build(atom);
    // мгновенно на несколько цифр раньше, потом плавно — на свою
    place(strips, STEPS, false);
    void atom.offsetHeight;
    place(strips, 0, true);
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
        var was = card.classList.contains('is-focused'), shown = card.classList.contains('is-in') || window.innerWidth >= 960;
        new MutationObserver(function () {
          var on = card.classList.contains('is-focused');
          if (on && !was && shown) roll(card);
          was = on;
          // карточка появилась (js/project-rows.js): год докручивается вместе с появлением
          // своей строки — с её задержкой, и встаёт на место вместе с ней
          if (!shown && card.classList.contains('is-in')) {
            shown = true;
            var a = yearAtom(card), it = a && a.closest('.uma-card__it');
            var d = it ? parseFloat(getComputedStyle(it).getPropertyValue('--it-d')) || 0 : 0;
            if (a) { place(build(a), STEPS, false); }
            setTimeout(function () { roll(card); }, d * 1000 + 120);
          }
        }).observe(card, { attributes: true, attributeFilter: ['class'] });
      })(c);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', watch);
  else watch();
  window.addEventListener('load', watch);
})();
