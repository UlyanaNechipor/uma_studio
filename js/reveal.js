/* UMA · reveal
   Единое появление элементов во всех блоках, кроме первого экрана
   (у него своё — js/hero-fill.js, css/hero-intro.css) и шапки; подвал — тоже.
   Ничего не стоит «кирпичом»: то, что видно сразу после загрузки (страница открыта
   не с начала), проявляется так же — после того как ушёл прелоадер.
   Элемент проявляется и чуть поднимается, текст — ещё и из лёгкого размытия
   (css/motion.css). Что вошло в экран одновременно — идёт по очереди: сверху вниз,
   слева направо, с шагом --m-step. Каждый элемент — один раз.
   Заголовки с заливкой проявляются так же (оба слоя вместе), заливка идёт своим чередом.
   Не трогает: список проектов
   (js/project-rows.js) и спрятанные за краем элементы раскладки. */
(function () {
  /* ================= НАСТРОЙКИ ================= */
  var SKIP_RECS = ['rec3979597401', 'rec3979597301', 'rec3979597201'];   // первый экран, старая шапка, подвал
  var STEP = 80;        // мс: шаг между элементами, вошедшими вместе
  var EDGE_K = 0.12;    // элемент «вошёл», когда его верх поднялся над нижними 12% экрана
  /* ============================================= */

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;
  var html = document.documentElement;

  function skip(el) {
    if (el.querySelector('.uma-row') || el.classList.contains('uma-row')) return true;   // список проектов
    if (el.closest('.uma-row')) return true;
    return false;
  }
  function isText(el) {
    return el.getAttribute('data-elem-type') === 'text' ||
      (!el.querySelector('[data-elem-type="image"], [data-elem-type="shape"] .tn-atom[data-original], .uma-mc, .uma-pj') &&
       !!el.querySelector('[data-elem-type="text"]'));
  }

  var io = false, queue = [];
  function flush() {
    queue.sort(function (a, b) {
      var ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
      return Math.abs(ra.top - rb.top) > 8 ? ra.top - rb.top : ra.left - rb.left;
    });
    var k = 0, prev = null, prevD = 0;
    queue.forEach(function (el) {
      // уже выше экрана (проскочили) — показываем сразу, без очереди: их не видно,
      // а задержка досталась бы тем, что на экране
      var r = el.getBoundingClientRect();
      var above = r.bottom < 0;
      var d;
      if (above) d = 0;
      // слои одного заголовка (серый и заливка) лежат друг на друге — появляются вместе
      else if (prev && Math.abs(prev.top - r.top) < 3 && Math.abs(prev.left - r.left) < 3) d = prevD;
      else d = (k++) * STEP;
      prev = r; prevD = d;
      el.style.setProperty('--rv-d', (d / 1000).toFixed(2) + 's');
      el.classList.add('is-in');
      setTimeout(function () { el.classList.add('is-done'); el.style.removeProperty('--rv-d'); }, 1400 + d);
    });
    queue = [];
  }

  function init() {
    if (io) return;
    var list = [];
    document.querySelectorAll('.t396__artboard').forEach(function (ab) {
      var rec = ab.closest('.t-rec');
      if (!rec || SKIP_RECS.indexOf(rec.id) > -1) return;
      ab.querySelectorAll(':scope > .t396__elem, :scope > .t396__group').forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (!r.width || !r.height || r.right < 0 || r.left > window.innerWidth) return;   // спрятан в этой раскладке
        if (skip(el)) return;
        el.classList.add('uma-rv');
        if (isText(el)) el.classList.add('uma-rv--text');
        list.push(el);
      });
    });
    // подвал (собран кодом, js/footer.js): логотип, колонки, подпись
    document.querySelectorAll('.uma-ft__logo, .uma-ft__col, .uma-ft__made').forEach(function (el) {
      el.classList.add('uma-rv', 'uma-rv--text');
      list.push(el);
    });
    if (!list.length) return;
    html.classList.add('uma-rv-on');
    // проверка при прокрутке: вошёл в экран или уже проскочил выше (быстрая прокрутка, якорь)
    var left = list.slice(), ticking = false;
    function check() {
      ticking = false;
      var lim = window.innerHeight * (1 - EDGE_K);
      // докрутили до самого низа — показываем всё, что осталось (подпись в подвале и т. п.)
      var bottom = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 4;
      left = left.filter(function (el) {
        if (bottom || el.getBoundingClientRect().top < lim) { queue.push(el); return false; }
        return true;
      });
      if (queue.length) flush();
      if (!left.length) { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); }
    }
    function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(check); } }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    io = true;
    // первая проверка — когда ушёл прелоадер и проявился первый экран
    whenHeroIn(check);
  }

  function whenHeroIn(fn) {
    var ok = function () { return !html.classList.contains('uma-hero-hold') || html.classList.contains('uma-hero-in'); };
    if (ok()) return fn();
    var mo = new MutationObserver(function () { if (ok()) { mo.disconnect(); setTimeout(fn, 250); } });
    mo.observe(html, { attributes: true, attributeFilter: ['class'] });
  }

  // после того как Тильда разложила блоки (и js/fluid.js выбрал раскладку)
  if (document.readyState === 'complete') setTimeout(init, 300);
  else window.addEventListener('load', function () { setTimeout(init, 300); });
})();
