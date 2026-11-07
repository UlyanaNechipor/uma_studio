/* UMA · reveal
   Единое появление элементов при прокрутке во всех блоках, кроме первого экрана
   (у него своё — js/hero-fill.js, css/hero-intro.css) и шапки/подвала.
   Элемент проявляется и чуть поднимается, текст — ещё и из лёгкого размытия
   (css/motion.css). Что вошло в экран одновременно — идёт по очереди: сверху вниз,
   слева направо, с шагом --m-step. Каждый элемент — один раз.
   Не трогает: заголовки с заливкой (у них заливка по скроллу), список проектов
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
    if (/uma-stream-/.test(el.className)) return true;                   // заголовки с заливкой
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
    queue.forEach(function (el, k) {
      el.style.setProperty('--rv-d', (k * STEP / 1000).toFixed(2) + 's');
      el.classList.add('is-in');
      setTimeout(function () { el.classList.add('is-done'); el.style.removeProperty('--rv-d'); }, 1400 + k * STEP);
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
        // уже на экране при загрузке (страница открыта не с начала) — не прячем
        if (r.top < window.innerHeight * (1 - EDGE_K)) return;
        el.classList.add('uma-rv');
        if (isText(el)) el.classList.add('uma-rv--text');
        list.push(el);
      });
    });
    if (!list.length) return;
    html.classList.add('uma-rv-on');
    // проверка при прокрутке: вошёл в экран или уже проскочил выше (быстрая прокрутка, якорь)
    var left = list.slice(), ticking = false;
    function check() {
      ticking = false;
      var lim = window.innerHeight * (1 - EDGE_K);
      left = left.filter(function (el) {
        if (el.getBoundingClientRect().top < lim) { queue.push(el); return false; }
        return true;
      });
      if (queue.length) flush();
      if (!left.length) { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); }
    }
    function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(check); } }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    io = true;
    check();
  }

  // после того как Тильда разложила блоки (и js/fluid.js выбрал раскладку)
  if (document.readyState === 'complete') setTimeout(init, 300);
  else window.addEventListener('load', function () { setTimeout(init, 300); });
})();
