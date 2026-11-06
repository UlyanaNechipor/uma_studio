/* UMA · project-grid
   Сетка фото проектов под заголовком «Проекты, в которых мы исследуем…» (rec3979597601).
   При наведении мышью фото плавно приближается внутри карточки, размер карточки не меняется.
   Фото остаются те, что загружены в Тильду (слой берёт тот же фон через inherit,
   включая подгрузку Тильды). На телефоне и планшете наведения нет: там фото приближается,
   когда карточка проходит через середину экрана (полоса BAND по центру), и отдаляется обратно.
   Стили — css/project-grid.css. */
(function () {
  /* ================= НАСТРОЙКИ ================= */
  var REC_IDS = ['rec3979597601'];  // блоки, где работает эффект
  var BAND = 0.36;                  // доля высоты экрана по центру: карточка в ней — «в фокусе» (без мыши)
  var STEP = 0.22;                  // с: в ряду из двух фото правое приближается позже левого
  /* ============================================= */

  var canHover = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;

  function setup(atom) {
    if (atom.__umaPj) return;
    atom.__umaPj = true;
    atom.classList.add('uma-pj');
    var html = '<span class="uma-pj__d" aria-hidden="true"></span>';
    atom.insertAdjacentHTML('afterbegin', html);
  }

  var all = [];
  function init() {
    REC_IDS.forEach(function (id) {
      var rec = document.getElementById(id);
      if (!rec) return;
      var atoms = rec.querySelectorAll('.t396__elem[data-elem-type="shape"] .tn-atom[data-original]');
      for (var k = 0; k < atoms.length; k++) {
        if (!atoms[k].__umaPj) all.push(atoms[k]);
        setup(atoms[k]);
      }
    });
    if (!canHover) { document.documentElement.classList.add('uma-pj-touch'); onScroll(); }
  }

  // без мыши: приближаются фото, которые сейчас в полосе посередине экрана
  var ticking = false;
  // порядок слева направо внутри ряда (фото на одной высоте) — задержка приближения
  function order() {
    for (var i = 0; i < all.length; i++) {
      var r = all[i].getBoundingClientRect(), n = 0;
      for (var j = 0; j < all.length; j++) {
        if (j === i) continue;
        var q = all[j].getBoundingClientRect();
        if (Math.abs((q.top + q.height / 2) - (r.top + r.height / 2)) < 12 && q.left < r.left) n++;
      }
      all[i].style.setProperty('--pj-delay', (n * STEP) + 's');
    }
  }

  function update() {
    ticking = false;
    order();
    var vh = window.innerHeight, c0 = vh * (0.5 - BAND / 2), c1 = vh * (0.5 + BAND / 2);
    for (var i = 0; i < all.length; i++) {
      var r = all[i].getBoundingClientRect();
      var mid = r.top + r.height / 2;
      all[i].classList.toggle('is-near', r.height > 0 && mid > c0 && mid < c1);
    }
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
  if (!canHover) {
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    window.addEventListener('uma:reflow', onScroll);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
  window.addEventListener('load', init);
})();
