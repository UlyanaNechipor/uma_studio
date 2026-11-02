/* UMA · hero-fill
   Перенесено из блока Тильды rec4221096501. */

(function () {
  /* ================= НАСТРОЙКИ ================= */
  var REC_ID     = 'rec3979597401';
  var MIN_TIME   = 2600;  // мс: минимум до вылета логотипа
  var INNER_MIN_TIME = 1400; // мс: то же на страницах без главного экрана (страницы проектов)
  var MAX_WAIT   = 7000;  // мс: предохранитель, дольше этого прелоадер не держим
  var TEXT_DELAY = 900;   // мс после вылета логотипа до старта заливки (2600 + 900 = 3.5 с)

  // GSAP грузится через общий загрузчик с запасными CDN (см. ниже)

  /* Тексты идут строго по очереди: следующий стартует, когда предыдущий залит целиком.
     el:      класс элемента текста в Зеро-блоке (тот, что раньше был серым слоем)
     animate: false -> без анимации, текст сразу залит целиком (в очередь не входит)
     total:   сколько секунд занимает заливка всего текста
     feather: ширина мягкого края заливки в долях размера шрифта (меньше = уже и чётче)
     gap:     пауза в секундах после окончания предыдущего текста
  */
  var PAIRS = [
    { el: '.uma-stream-bg-cyr', animate: false },
    { el: '.uma-stream-bg-lat', animate: true, total: 1.8, feather: 0.9, gap: 0 }
  ];
  /* ============================================= */

  var preloader = document.getElementById('custom-preloader');

  var items = [];
  var master = null;
  var textStarted = false;

  // состояние контроллера
  var minDone = false, textReady = false, pageLoaded = false, fontsReady = false, released = false;

  function log() {
    console.log.apply(console, ['UMA:'].concat([].slice.call(arguments)));
  }

  /* ===================== КОНТРОЛЛЕР: прелоадер + текст ===================== */

  function tryRelease(force) {
    if (released || !preloader) return;
    if (!force && !(minDone && textReady && pageLoaded && fontsReady)) return;
    released = true;
    preloader.classList.add('completed');   // логотип улетает в шапку
    log('прелоадер улетел', force ? '(по предохранителю)' : '');
    setTimeout(playText, TEXT_DELAY);       // заливка заголовка после вылета
  }

  function startController() {
    if (!preloader) { textReady = true; return; }

    setTimeout(function () { minDone = true; tryRelease(); }, MIN_TIME);

    if (document.readyState === 'complete') pageLoaded = true;
    else window.addEventListener('load', function () { pageLoaded = true; tryRelease(); });

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { fontsReady = true; tryRelease(); });
    } else { fontsReady = true; }

    // предохранитель: если что-то грузится слишком долго, всё равно отпускаем
    setTimeout(function () { tryRelease(true); }, MAX_WAIT);
  }

  /* ===================== ТЕКСТ: заливка одним слоем ===================== */

  var FULL = 100000; // «залито до конца»

  /* ---------- раскраска строки ----------
     Градиент пишем готовой строкой с конкретными цветами, без var()/calc()/color-mix():
     Safari на iPhone не перерисовывает такие градиенты под background-clip:text. */
  var COLORS = { s: [] };
  function parseColor(v, fb) {
    v = (v || '').trim();
    var m;
    if ((m = v.match(/^#([0-9a-f]{3})$/i))) return m[1].split('').map(function (h) { return parseInt(h + h, 16); });
    if ((m = v.match(/^#([0-9a-f]{6})/i))) return [0, 2, 4].map(function (i) { return parseInt(m[1].substr(i, 2), 16); });
    if ((m = v.match(/rgba?\(([^)]+)\)/i))) return m[1].split(/[\s,\/]+/).slice(0, 3).map(Number);
    return fb;
  }
  function readColors() {
    var cs = getComputedStyle(document.body);
    var ink  = parseColor(cs.getPropertyValue('--uma-ink'),  [255, 255, 255]);
    var base = parseColor(cs.getPropertyValue('--uma-base'), [42, 43, 42]);
    // ступени мягкого края как у логотипа в прелоадере: 100% -> 84% -> 50% -> 16% -> 0%
    COLORS.s = [1, 0.84, 0.5, 0.16, 0].map(function (k) {
      return 'rgb(' + [0, 1, 2].map(function (i) { return Math.round(base[i] + (ink[i] - base[i]) * k); }).join(',') + ')';
    });
  }
  function paint(line) {
    if (!COLORS.s.length) readColors();
    var c = COLORS.s, p = line._umaP || 0, f = line._umaF || 0;
    line.style.backgroundImage = 'linear-gradient(90deg,' +
      c[0] + ' 0px,' + c[0] + ' ' + (p - f) + 'px,' +
      c[1] + ' ' + (p - f * 0.75) + 'px,' +
      c[2] + ' ' + (p - f * 0.5) + 'px,' +
      c[3] + ' ' + (p - f * 0.25) + 'px,' +
      c[4] + ' ' + p + 'px,' + c[4] + ' 100%)';
  }
  // где сейчас граница заливки в строке (px от левого края строки)
  function setP(line, px) { line._umaP = px; paint(line); }
  // ширина мягкого края (px)
  function setF(line, px) { line._umaF = px; }

  // смена темы: пересчитываем цвета и перекрашиваем все строки на текущем месте заливки
  function repaintAll() {
    readColors();
    document.querySelectorAll('.uma-line.uma-fill').forEach(paint);
  }
  function watchTheme() {
    if (!document.body) return;
    var mo = new MutationObserver(repaintAll);
    mo.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  }

  // склейка предлогов и союзов со следующим словом неразрывным пробелом.
  // Делаем это прямо перед нарезкой: под прелоадером строки фиксируются
  // раньше, чем отработает общий скрипт предлогов (он ждёт 400 мс).
  var GLUE_WORDS = [
    'в', 'во', 'с', 'со', 'из', 'изо', 'к', 'ко', 'о', 'об', 'обо', 'от', 'ото', 'до',
    'по', 'под', 'подо', 'про', 'на', 'за', 'над', 'надо', 'через', 'сквозь', 'у', 'при',
    'пред', 'предо', 'перед', 'передо', 'а', 'и', 'но', 'да', 'или', 'не', 'ни', 'бы', 'же',
    'вы', 'мы', 'ты', 'он', 'она', 'они', 'оно', 'я', 'то', 'все', 'что', 'кто', 'мой', 'свой',
    'для', 'без', 'безо', 'ради', 'около', 'возле', 'вокруг', 'после', 'кроме', 'среди', 'между',
    'как', 'чем', 'ли', 'это', 'их', 'его', 'её', 'ее', 'наш', 'ваш',
    '&'
  ];
  var GLUE_RE = new RegExp('(^|[\\s(«"„])(' + GLUE_WORDS.join('|') + ')[ \\t\\n\\r]+', 'gi');
  function glue(el) {
    var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null, false);
    var node;
    while ((node = walker.nextNode())) {
      var text = node.nodeValue, prev;
      // повторяем, пока есть что склеить: так ловятся цепочки вроде «и в»
      do { prev = text; text = text.replace(GLUE_RE, '$1$2 '); } while (text !== prev);
      if (text !== node.nodeValue) node.nodeValue = text;
    }
  }

  // нарезка текста на строки + выравнивание строк по центру/справа
  function splitLines(el) {
    glue(el);
    var split = SplitText.create(el, { type: 'lines', linesClass: 'uma-line' });
    var align = getComputedStyle(el).textAlign;
    split.lines.forEach(function (l) {
      l.classList.add('uma-fill');
      if (align === 'center') { l.style.marginLeft = 'auto'; l.style.marginRight = 'auto'; }
      else if (align === 'right' || align === 'end') { l.style.marginLeft = 'auto'; }
    });
    return split;
  }

  // подготовка одного текста: нарезка на строки и таймлайн заливки
  function build(it) {
    if (it.tl) { it.tl.kill(); it.tl = null; }
    if (it.split) { it.split.revert(); it.split = null; }
    it.lines = null;

    try {
      var split = splitLines(it.el);
      var lines = split.lines;
      it.split = split;
      it.lines = lines;

      // текст без анимации: сразу залит целиком
      if (it.p.animate === false) {
        lines.forEach(function (l) { setP(l, FULL); });
        return;
      }

      var fs = parseFloat(getComputedStyle(it.el).fontSize) || 16;
      var feather = fs * it.p.feather;
      var widths = lines.map(function (l) { return l.getBoundingClientRect().width; });
      var totalW = widths.reduce(function (s, w) { return s + w; }, 0) || 1;

      lines.forEach(function (l) {
        setF(l, feather);
        setP(l, 0);
      });

      // дочерний таймлайн без paused, иначе родитель не будет его проигрывать
      var tl = gsap.timeline();
      lines.forEach(function (line, k) {
        var st = { v: 0 };
        tl.to(st, {
          v: widths[k] + feather,
          duration: it.p.total * widths[k] / totalW,
          ease: 'none',
          onUpdate: function () { setP(line, st.v); }
        });
      });
      it.tl = tl;
    } catch (e) {
      // при сбое текст остаётся обычным залитым текстом (см. CSS)
      console.warn('UMA: ошибка сборки текста', it.p.el, e);
    }
  }

  // общий таймлайн: тексты строго друг за другом
  function buildAll() {
    if (master) { master.kill(); master = null; }
    items.forEach(build);

    master = gsap.timeline({ paused: true });
    var first = true;
    items.forEach(function (it) {
      if (!it.tl) return;
      master.add(it.tl, first ? 0 : '>' + (it.p.gap || 0));
      first = false;
    });

    // если заливка уже была запущена (ресайз), показываем состояние по скроллу
    // Пересборка после старта (ресайз, поздно догрузились шрифты): новая заливка
    // сразу связывается со скроллом, иначе она остаётся статичной.
    if (textStarted) {
      master.pause();
      if (!linked) { master.progress(1); linkToScroll(); }
      fillTarget = fillNow = targetFromScroll();
      master.progress(fillNow);
    }
  }

  function playText() {
    if (textStarted) return;
    textStarted = true;
    if (master) {
      master.eventCallback('onComplete', linkToScroll);
      master.play(0);
    } else linkToScroll();
    log('заливка запущена');
  }

  /* ---------- после первой заливки: связь со скроллом ----------
     Пока заголовок уходит под шапку при прокрутке вниз, заливка убывает;
     при прокрутке вверх возвращается. Прокрутку отслеживает ScrollTrigger —
     тот же механизм, что у остальных заголовков: он учитывает особенности
     Safari на iPhone (инерционная прокрутка, панель адреса, обновление
     размеров после прелоадера). Значение сглажено, как scrub у остальных. */
  var linked = false, fillNow = 1, fillTarget = 1, running = false, st = null;

  function heading() {
    for (var i = 0; i < items.length; i++) if (items[i].tl) return items[i].el;
    return null;
  }
  function headerHeight() {
    var h = document.getElementById('rec3979597301');
    var b = h && (h.querySelector('.t396__artboard') || h);
    return b ? b.getBoundingClientRect().height : 0;
  }
  // сколько пикселей прокрутки от верха страницы до момента, когда заголовок целиком под шапкой
  function drainDistance() {
    var el = heading();
    if (!el) return 1;
    var r = el.getBoundingClientRect();
    var y = window.pageYOffset || document.documentElement.scrollTop || 0;
    return Math.max(1, r.top + y + r.height - headerHeight());
  }
  function targetFromScroll() {
    if (st) return 1 - st.progress;
    var y = window.pageYOffset || document.documentElement.scrollTop || 0;
    return Math.max(0, Math.min(1, 1 - y / drainDistance()));
  }
  // плавное приближение к цели на тикере GSAP (работает и при инерции прокрутки на iOS)
  function tick() {
    if (!master) return;
    fillNow += (fillTarget - fillNow) * 0.18;
    if (Math.abs(fillTarget - fillNow) < 0.002) fillNow = fillTarget;
    master.progress(fillNow);
    if (fillNow === fillTarget) { gsap.ticker.remove(tick); running = false; }
  }
  function kick() {
    if (!running) { running = true; gsap.ticker.add(tick); }
  }
  function onScroll() {
    if (!linked || !master) return;
    fillTarget = targetFromScroll();
    kick();
  }
  function linkToScroll() {
    if (linked) return;
    linked = true;
    if (master) master.pause();
    fillNow = master ? master.progress() : 1;
    if (window.ScrollTrigger) {
      gsap.registerPlugin(ScrollTrigger);
      st = ScrollTrigger.create({
        start: 0,
        end: drainDistance,
        invalidateOnRefresh: true,
        onUpdate: onScroll,
        onRefresh: onScroll
      });
    } else {
      window.addEventListener('scroll', onScroll, { passive: true });
    }
    onScroll();
  }

  function initText(root) {
    gsap.registerPlugin(SplitText);

    PAIRS.forEach(function (p) {
      var els = root.querySelectorAll(p.el);
      log('текст', p.el, '-> найдено:', els.length);
      if (!els.length) {
        console.warn('UMA: не найден текст', p.el, '- проверьте класс в Зеро-блоке');
        return;
      }
      els.forEach(function (w) {
        items.push({ p: p, el: w.querySelector('.tn-atom') || w, split: null, tl: null, lines: null });
      });
    });

    var finish = function () {
      buildAll();
      log('текст собран, элементов:', items.length);
      textReady = true;
      tryRelease();
    };

    // строки считаем только после загрузки шрифтов (всё это под прелоадером, экран закрыт)
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(finish);
    else finish();

    // при смене ширины окна (брейкпоинты Зеро, autoscale) пересобираем строки
    var lastW = window.innerWidth, rt;
    window.addEventListener('resize', function () {
      clearTimeout(rt);
      rt = setTimeout(function () {
        if (window.innerWidth === lastW) return;
        lastW = window.innerWidth;
        buildAll();
      }, 250);
    });
  }

  // ждём, пока Тильда отрисует Зеро-блок и загрузятся GSAP + SplitText
  function waitForRec() {
    // Страница без главного экрана (например, страница проекта): ждать заголовок
    // незачем, прелоадер уходит, как только загрузились страница и шрифты.
    if (document.readyState !== 'loading' && !document.getElementById(REC_ID)) {
      textReady = true;
      setTimeout(function () { minDone = true; tryRelease(); }, INNER_MIN_TIME);
      tryRelease();
      return;
    }
    var tries = 0;
    var timer = setInterval(function () {
      var root = document.getElementById(REC_ID);
      var ready = root && root.querySelector('.tn-atom') && window.gsap && window.SplitText;
      if (ready) {
        clearInterval(timer);
        initText(root);
      } else if (++tries > 120) {   // ~12 секунд
        clearInterval(timer);
        console.warn('UMA: блок #' + REC_ID + ' или GSAP/SplitText не найдены, текст показан без анимации');
        textReady = true;
        tryRelease();
      }
    }, 100);
  }

  /* ===================== ЗАГРУЗКА БИБЛИОТЕК (асинхронно, не блокирует страницу) ===================== */

  /* ---------- загрузка GSAP с запасными CDN ----------
     jsDelivr в России иногда блокируется или тормозит (особенно в мобильных сетях).
     Если файл не загрузился за 6 секунд, пробуем следующий CDN. Загрузчик общий
     для всех блоков страницы: библиотеки грузятся один раз. */
  if (!window.umaLoadGsap) window.umaLoadGsap = (function () {
    var CDNS = [
      'https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/',
      'https://unpkg.com/gsap@3.13.0/dist/',
      'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.13.0/'
    ];
    var FILES = ['gsap.min.js', 'ScrollTrigger.min.js', 'SplitText.min.js'];
    var promise = null;
    function has(f) {
      return f === 'gsap.min.js' ? !!window.gsap : f === 'ScrollTrigger.min.js' ? !!window.ScrollTrigger : !!window.SplitText;
    }
    function inject(src) {
      return new Promise(function (ok, fail) {
        var s = document.createElement('script'), done = false;
        var t = setTimeout(function () { if (!done) { done = true; fail(new Error('timeout ' + src)); } }, 6000);
        s.src = src;
        s.onload  = function () { if (!done) { done = true; clearTimeout(t); ok(); } };
        s.onerror = function () { if (!done) { done = true; clearTimeout(t); fail(new Error('error ' + src)); } };
        document.head.appendChild(s);
      });
    }
    function loadFile(f) {
      if (has(f)) return Promise.resolve();
      var i = 0;
      return new Promise(function (ok, fail) {
        (function next() {
          if (has(f)) return ok();
          if (i >= CDNS.length) return fail(new Error('UMA: не удалось загрузить ' + f));
          var src = CDNS[i++] + f;
          inject(src).then(function () { has(f) ? ok() : next(); }, function (e) {
            console.warn('UMA: ' + e.message + ', пробую следующий CDN');
            next();
          });
        })();
      });
    }
    return function () {
      if (!promise) promise = FILES.reduce(function (p, f) { return p.then(function () { return loadFile(f); }); }, Promise.resolve());
      return promise;
    };
  })();

  function loadLibs() {
    window.umaLoadGsap().then(waitForRec, function (e) {
      console.warn(e.message + ', текст показан без анимации');
      textReady = true;
      tryRelease();
    });
  }

  /* ===================== СТАРТ ===================== */

  function boot() {
    watchTheme();
    startController();
    loadLibs();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
