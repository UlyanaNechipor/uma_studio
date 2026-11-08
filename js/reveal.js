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
  var STEP = 140;       // мс: шаг между элементами, вошедшими вместе — подлетают по очереди
  var EDGE_K = 0.12;    // элемент «вошёл», когда его верх поднялся над нижними 12% экрана
  // «подлёт» из Тильды (fadeinup / left / right / down): направление и задержки из настроек
  // элемента в Zero-блоке сохраняются, но в общем ритме — сдвиг не больше FLY_MAX px,
  // задержка не больше DELAY_MAX с, движение — общая кривая сайта
  // блоки, где подлёт из Тильды не берём — появление как в подвале: проявляются и поднимаются
  // на --m-shift, один за другим слева направо (услуги Digital / Design / Direction / Ai)
  var FT_LEAD = 300;   // мс: колонки подвала стартуют, когда его линии уже пошли
  var PLAIN_RECS = ['rec4283359601', 'rec3979597501', 'rec3979597701'];   // + «Избранные проекты», «О нас»
  var FLY_MIN = 40, FLY_MAX = 100, DELAY_MAX = 0;   // задержки Тильды не берём: всё — одна очередь «бам-бам-бам» с шагом STEP
  /* ============================================= */

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;
  var html = document.documentElement;

  function skip(el) {
    if (el.querySelector('.uma-row, .uma-card') || el.classList.contains('uma-row') || el.classList.contains('uma-card')) return true;   // список проектов
    if (el.closest('.uma-row')) return true;
    return false;
  }
  function isText(el) {
    return el.getAttribute('data-elem-type') === 'text' ||
      (!el.querySelector('[data-elem-type="image"], [data-elem-type="shape"] .tn-atom[data-original], .uma-mc, .uma-pj') &&
       !!el.querySelector('[data-elem-type="text"]'));
  }

  // группа из нескольких колонок (например, четыре услуги, собранные в Тильде в одну группу)
  // появляется не целиком, а по колонкам: каждая колонка — свой элемент очереди.
  // Колонки — прямые части группы, стоящие рядом по горизонтали.
  function split(el) {
    if (!el.classList.contains('t396__group') || skip(el)) return null;
    var mol = el.querySelector(':scope > .tn-molecule') || el;
    var kids = [].slice.call(mol.children).filter(function (c) {
      var r = c.getBoundingClientRect();
      return r.width > 2 && r.height > 2 && (c.classList.contains('t396__group') || c.classList.contains('t396__elem'));
    });
    if (kids.length < 2) return null;
    var lefts = {};
    kids.forEach(function (c) { lefts[Math.round(c.getBoundingClientRect().left / 8)] = 1; });
    if (Object.keys(lefts).length < 2) return null;     // всё в одну колонку — оставляем группу целой
    // анимация из Тильды у самой группы — переносим на колонки
    var st = el.getAttribute('data-animate-style');
    if (st) kids.forEach(function (c) {
      ['data-animate-style', 'data-animate-distance'].forEach(function (a) { if (el.hasAttribute(a) && !c.hasAttribute(a)) c.setAttribute(a, el.getAttribute(a)); });
    });
    el.classList.add('uma-rv-split');
    // в общей очереди колонки стоят по верху самой группы (фото в «О нас» — сразу после
    // заголовка рядом, а не раньше него), между собой — слева направо
    var gt = Math.round(el.getBoundingClientRect().top + window.scrollY);
    kids.forEach(function (c) { c.setAttribute('data-uma-order', gt); });
    return kids;
  }

  function fly(el) {
    var rec = el.closest('.t-rec');
    if (rec && PLAIN_RECS.indexOf(rec.id) > -1) return;
    var st = el.getAttribute('data-animate-style') || '';
    var m = st.match(/^fadein(up|down|left|right)$/);
    if (!m) return;
    var dist = parseFloat(el.getAttribute('data-animate-distance')) || 100;
    dist = Math.max(FLY_MIN, Math.min(FLY_MAX, dist));
    var x = m[1] === 'left' ? dist : m[1] === 'right' ? -dist : 0;
    var y = m[1] === 'up' ? dist : m[1] === 'down' ? -dist : 0;
    el.style.setProperty('--rv-x', x + 'px');
    el.style.setProperty('--rv-y', y + 'px');
    el.classList.add('uma-rv--fly');
    var dl = Math.min(DELAY_MAX, parseFloat(el.getAttribute('data-animate-delay')) || 0);
    el.__umaDelay = dl * 1000;
  }

  var io = false, queue = [];
  function flush() {
    queue.sort(function (a, b) {
      var ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
      var oa = a.getAttribute('data-uma-order'), ob = b.getAttribute('data-uma-order');
      var ta = oa != null ? +oa - window.scrollY : ra.top;
      var tb = ob != null ? +ob - window.scrollY : rb.top;
      return Math.abs(ta - tb) > 8 ? ta - tb : ra.left - rb.left;
    });
    var k = 0, prev = null, prevD = 0;
    // задержки из Тильды — относительно самого раннего из вошедших вместе:
    // элемент, вошедший в экран один, не ждёт
    var base = Infinity;
    queue.forEach(function (el) { if (el.__umaDelay != null && el.getBoundingClientRect().bottom >= 0) base = Math.min(base, el.__umaDelay); });
    queue.forEach(function (el) {
      // уже выше экрана (проскочили) — показываем сразу, без очереди: их не видно,
      // а задержка досталась бы тем, что на экране
      var r = el.getBoundingClientRect();
      var above = r.top < 0;   // уже частично проскочил вверх — сразу, не занимая место в очереди
      var d;
      if (above) d = 0;
      // слои одного заголовка (серый и заливка) лежат друг на друге — появляются вместе
      else if (prev && Math.abs(prev.top - r.top) < 3 && Math.abs(prev.left - r.left) < 3) d = prevD;
      else d = (k++) * STEP;
      if (!above && el.__umaDelay != null) d = Math.max(d, el.__umaDelay - base);
      prev = r; prevD = d;
      // подвал: сначала прочерчиваются его линии (сверху и снизу), колонки — следом
      var ft = el.closest && el.closest('.uma-ft');
      if (ft) {
        if (!ft.classList.contains('is-lines')) ft.classList.add('is-lines');
        if (!above) d += FT_LEAD;
      }
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
      var tops = [];
      ab.querySelectorAll(':scope > .t396__elem, :scope > .t396__group').forEach(function (el) {
        var parts = split(el);
        if (parts) tops = tops.concat(parts); else tops.push(el);
      });
      tops.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (!r.width || !r.height || r.right < 0 || r.left > window.innerWidth) return;   // спрятан в этой раскладке
        if (skip(el)) return;
        el.classList.add('uma-rv');
        if (isText(el)) el.classList.add('uma-rv--text');
        fly(el);
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
