/* UMA · mobile-radar
   Мобильный список проектов (до 1024 px): карточка, которая проходит через середину
   экрана, подсвечивается — под ней проявляется светлая плашка (тёмная в светлой теме),
   тексты внутри инвертируются (css/mobile-radar.css).
   Плашка — отдельный слой под карточкой с полями как в макете: по ширине линии-разделителя
   над карточкой, по высоте от этой линии до низа группы с картинками (её нижний отступ входит).
   У каждой карточки своя плашка: карточка просто «загорается» и гаснет на месте. */
(function () {
  var BAND = 0.1;     // доля высоты экрана: полоса по центру, в которой карточка «в фокусе»

  function boot() {
    if (window.innerWidth > 1024) return;
    var cards = [].slice.call(document.querySelectorAll('.project-group-card'));
    if (!cards.length) return;

    // своя плашка для каждой карточки, первой в артборде — под всеми элементами
    function panelFor(card) {
      if (card.__umaPanel) return card.__umaPanel;
      var ab = card.closest('.t396__artboard');
      if (!ab) return null;
      var p = document.createElement('div');
      p.className = 'uma-radar-panel';
      p.setAttribute('aria-hidden', 'true');
      var first = ab.querySelector(':scope > .t396__elem, :scope > .t396__group');
      ab.insertBefore(p, first || null);
      card.__umaPanel = p;
      return p;
    }

    // границы карточки по её содержимому (у самой группы Тильды размеров может не быть)
    function box(card) {
      var parts = card.querySelectorAll('.t396__group, .t396__elem');
      var top = Infinity, bottom = -Infinity, left = Infinity, right = -Infinity, line = null;
      for (var i = 0; i < parts.length; i++) {
        var r = parts[i].getBoundingClientRect();
        if (!r.width || !r.height) continue;
        top = Math.min(top, r.top); bottom = Math.max(bottom, r.bottom);
        left = Math.min(left, r.left); right = Math.max(right, r.right);
        if (!line && parts[i].classList.contains('t396__group')) {
          var m = parts[i].querySelector(':scope > .tn-molecule');
          if (m && parseFloat(getComputedStyle(m).borderTopWidth) > 0) line = r;
        }
      }
      if (top === Infinity) return null;
      // по ширине — как линия-разделитель (поля из макета), иначе по содержимому
      if (line) { left = line.left; right = line.right; top = Math.min(top, line.top); }
      return { top: top, bottom: bottom, left: left, right: right };
    }

    var ticking = false;
    function update() {
      ticking = false;
      var vh = window.innerHeight, c0 = vh * (0.5 - BAND / 2), c1 = vh * (0.5 + BAND / 2);
      var found = false;
      for (var i = 0; i < cards.length; i++) {
        var card = cards[i], b = box(card);
        var near = b && b.bottom > -vh && b.top < vh * 2;
        var on = !!(b && !found && b.top < c1 && b.bottom > c0);
        if (on) found = true;
        card.classList.toggle('is-focused', on);
        if (!near && !card.__umaPanel) continue;
        var p = panelFor(card);
        if (!p) continue;
        if (b) {
          var ab = card.closest('.t396__artboard').getBoundingClientRect();
          p.style.left = (b.left - ab.left) + 'px';
          p.style.top = (b.top - ab.top) + 'px';
          p.style.width = (b.right - b.left) + 'px';
          p.style.height = (b.bottom - b.top) + 'px';
        }
        p.classList.toggle('is-on', on);
      }
    }
    function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    window.addEventListener('uma:reflow', onScroll);
    window.addEventListener('load', onScroll);
    update();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
