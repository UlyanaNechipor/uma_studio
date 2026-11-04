/* UMA · scroll-fill
   Перенесено из блока Тильды rec4582271701. */

(function () {
  /* ================= НАСТРОЙКИ ================= */
  var DEBUG = false;   // true: на странице видны маркеры start/end ScrollTrigger
  var SCRUB = 0.5;     // сглаживание заливки за скроллом, с (было 1: заливка заметно отставала)

  /* Для каждого текста:
     el:    класс элемента текста в Зеро-блоке (тот, что раньше был серым слоем)
     mode:  'scroll' - заливка идёт по скроллу
            'load'   - заливка запускается по времени при загрузке
     start: строка, например 'top 60%'  -> заливка стартует, когда верх текста дошёл до 60% высоты окна
            (меньше процент = старт позже по скроллу, когда текст поднялся выше; больше = старт раньше, у нижнего края)
            число 0                     -> для первого экрана: заливка идёт по первым dist пикселям скролла
     end:   строка, например 'bottom 45%' (используется, когда start - строка)
     dist:  длина заливки в пикселях скролла (используется, когда start = 0)
     duration: длительность в секундах для mode: 'load'
     feather:  ширина мягкого края заливки в долях размера шрифта (0 = резкая граница)
  */
  var PAIRS = [
    { el: '.uma-stream-bg-cyr', mode: 'scroll', start: 'top 85%', end: 'bottom 65%', dist: 500, duration: 1.5, feather: 0.9 },
    { el: '.uma-stream-bg-lat', mode: 'scroll', start: 'top 85%', end: 'bottom 65%', dist: 900, duration: 1.5, feather: 0.9 }
  ];

  /* Блоки: у каждого можно задать свои тексты (pairs). Если pairs не указан, берётся общий PAIRS выше.
     Пример своих настроек для блока:
       { id: 'rec3979597601', pairs: [ { el: '.uma-stream-bg-lat', mode: 'scroll', start: 'top 50%', end: 'bottom 30%' } ] }
  */
  var BLOCKS = [
    { id: 'rec3979597501' },
    { id: 'rec3979597601' },
    { id: 'rec3979597701' }
  ];
  /* ============================================= */

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

  var items = [];
  var started = {};      // какие блоки уже запущены
  var globalsBound = false;

  function log() {
    try { console.log.apply(console, ['UMA stream:'].concat([].slice.call(arguments))); } catch (e) {}
  }

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
  function setP(line, px) {
    px = Math.round(px * 2) / 2;            // полпикселя: глазу не видно, а перерисовок меньше
    if (line._umaP === px && line.style.backgroundImage) return;
    line._umaP = px; paint(line);
  }
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
  // Делаем это прямо перед нарезкой, иначе строки могут зафиксироваться
  // раньше, чем отработает общий скрипт предлогов.
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
    var s = SplitText.create(el, { type: 'lines', linesClass: 'uma-line' });
    var align = getComputedStyle(el).textAlign;
    s.lines.forEach(function (l) {
      l.classList.add('uma-fill');
      if (align === 'center') { l.style.marginLeft = 'auto'; l.style.marginRight = 'auto'; }
      else if (align === 'right' || align === 'end') { l.style.marginLeft = 'auto'; }
    });
    return s;
  }

  // (пере)сборка одного текста: разбивка на строки, таймлайн заливки
  function build(it) {
    var p = it.p, el = it.el;

    // очистка прошлой сборки
    if (it.tl) {
      if (it.tl.scrollTrigger) it.tl.scrollTrigger.kill();
      it.tl.kill();
      it.tl = null;
    }
    if (it.split) { it.split.revert(); it.split = null; }

    try {
      var split = splitLines(el);
      var lines = split.lines;
      it.split = split;

      var fs = parseFloat(getComputedStyle(el).fontSize) || 16;
      var feather = fs * (p.feather || 0);

      // длительность каждой строки пропорциональна её ширине
      var widths = lines.map(function (l) { return l.getBoundingClientRect().width; });
      var total = widths.reduce(function (s, w) { return s + w; }, 0) || 1;

      lines.forEach(function (l) {
        setF(l, feather);
        setP(l, 0);
      });

      var tlVars = {};
      if (p.mode === 'scroll') {
        var firstScreen = (typeof p.start === 'number');
        tlVars.scrollTrigger = {
          trigger: el,
          start: p.start,
          end: firstScreen
            ? function () {
                // конец не дальше, чем страница вообще может проскроллиться
                var max = ScrollTrigger.maxScroll(window);
                return '+=' + Math.max(50, Math.min(p.dist, max - 5));
              }
            : p.end,
          scrub: SCRUB,
          invalidateOnRefresh: true,
          markers: DEBUG
        };
      }
      var tl = gsap.timeline(tlVars);

      // строго по очереди: строка закончилась, началась следующая
      lines.forEach(function (line, k) {
        var st = { v: 0 };
        tl.to(st, {
          v: widths[k] + feather,
          ease: 'none',
          duration: widths[k] / total,
          onUpdate: function () { setP(line, st.v); }
        });
      });

      // режим по времени: растягиваем таймлайн на заданную длительность
      if (p.mode === 'load') tl.duration(p.duration);

      it.tl = tl;
    } catch (e) {
      // при сбое текст остаётся обычным залитым текстом (см. CSS)
      console.warn('UMA stream: ошибка сборки текста', p.el, e);
    }
  }

  function rebuildAll() {
    items.forEach(function (it) {
      try { build(it); } catch (e) { console.warn('UMA stream: ошибка пересборки', e); }
    });
    ScrollTrigger.refresh();
  }

  // общие обработчики: один раз на все блоки
  function bindGlobals() {
    if (globalsBound) return;
    globalsBound = true;

    // при смене ширины окна (брейкпоинты Зеро) пересобираем строки
    var lastW = window.innerWidth, rt;
    window.addEventListener('resize', function () {
      clearTimeout(rt);
      rt = setTimeout(function () {
        if (window.innerWidth === lastW) return;
        lastW = window.innerWidth;
        rebuildAll();
      }, 250);
    });

    // после загрузки шрифтов строки могут перенестись иначе
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(rebuildAll);
    }

    // Пересчёт позиций заливки. На iPhone ScrollTrigger сам не пересчитывается после того,
    // как прелоадер снял блокировку скролла, и считает заголовки уже пройденными.
    function refresh() { try { ScrollTrigger.refresh(); } catch (e) {} }

    // 1) в момент снятия блокировки скролла (класс uma-scroll-locked у <html>)
    var wasLocked = document.documentElement.classList.contains('uma-scroll-locked');
    new MutationObserver(function () {
      var locked = document.documentElement.classList.contains('uma-scroll-locked');
      if (wasLocked && !locked) setTimeout(refresh, 60);
      wasLocked = locked;
    }).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    // 2) после полной загрузки страницы: Тильда к этому моменту точно расставила
    //    и отмасштабировала элементы, поэтому пересобираем строки целиком
    if (document.readyState !== 'complete') {
      window.addEventListener('load', function () { setTimeout(rebuildAll, 60); });
    }

    // 3) страховка: через 3 и 6 секунд после старта
    setTimeout(refresh, 3000);
    setTimeout(refresh, 6000);
  }

  // запуск одного блока
  function runBlock(block, root) {
    var pairs = block.pairs || PAIRS;
    var count = 0;

    pairs.forEach(function (p) {
      var els = root.querySelectorAll(p.el);
      log('#' + block.id, 'текст', p.el, '-> найдено:', els.length);

      els.forEach(function (w) {
        var it = { p: p, el: w.querySelector('.tn-atom') || w, split: null, tl: null };
        items.push(it);
        try { build(it); count++; } catch (e) { console.warn('UMA stream: ошибка сборки', e); }
      });
    });

    log('#' + block.id, 'собрано текстов:', count);
    started[block.id] = true;
  }

  // ждём, пока Тильда отрисует Зеро-блоки и загрузятся библиотеки (до ~12 секунд)
  function waitForBlocks() {
    var tries = 0;
    var timer = setInterval(function () {
      var libs = window.gsap && window.ScrollTrigger && window.SplitText;

      if (libs) {
        gsap.registerPlugin(ScrollTrigger, SplitText);
        // на телефонах панель адреса меняет высоту окна при каждой прокрутке:
        // не пересчитываем из-за этого все заливки (это давало рывки)
        ScrollTrigger.config({ ignoreMobileResize: true });
        BLOCKS.forEach(function (block) {
          if (started[block.id]) return;
          var root = document.getElementById(block.id);
          if (root && root.querySelector('.tn-atom')) {
            try { runBlock(block, root); } catch (e) { console.warn('UMA stream: ошибка блока #' + block.id, e); }
          }
        });
        bindGlobals();
      }

      var allDone = BLOCKS.every(function (b) { return started[b.id]; });
      if (allDone) {
        clearInterval(timer);
      } else if (++tries > 120) {
        clearInterval(timer);
        BLOCKS.forEach(function (b) {
          if (!started[b.id]) console.warn('UMA stream: блок #' + b.id + ' или библиотеки GSAP/SplitText не найдены, текст показан без анимации');
        });
      }
    }, 100);
  }

  if (document.body) watchTheme();
  else document.addEventListener('DOMContentLoaded', watchTheme);

  /* ---------- диагностика: откройте страницу с ?umadebug в адресе ---------- */
  var DIAG = /[?&]umadebug/.test(location.search);
  var diagState = { libs: 'жду', error: '' };
  function startDiag() {
    if (!DIAG || !document.body) return;
    var box = document.createElement('pre');
    box.style.cssText = 'position:fixed;left:6px;bottom:6px;right:6px;z-index:2147483647;margin:0;padding:8px;' +
      'background:rgba(0,0,0,.85);color:#7CFC9A;font:10px/1.35 ui-monospace,Menlo,monospace;white-space:pre-wrap;' +
      'max-height:45vh;overflow:auto;pointer-events:none;border-radius:4px';
    document.body.appendChild(box);
    setInterval(function () {
      var lines = [
        'UMA stream debug',
        'GSAP: ' + diagState.libs + (diagState.error ? ' | ' + diagState.error : ''),
        'scrollY: ' + Math.round(window.scrollY) + ' | высота окна: ' + window.innerHeight +
          ' | locked: ' + document.documentElement.classList.contains('uma-scroll-locked') +
          ' | load: ' + document.readyState,
        'блоков запущено: ' + Object.keys(started).length + '/' + BLOCKS.length + ' | текстов: ' + items.length
      ];
      items.forEach(function (it, i) {
        var st = it.tl && it.tl.scrollTrigger;
        var n = it.split ? it.split.lines.length : 0;
        var txt = (it.el.textContent || '').replace(/\s+/g, ' ').slice(0, 18);
        lines.push((i + 1) + ') «' + txt + '» строк:' + n +
          (st ? ' start:' + Math.round(st.start) + ' end:' + Math.round(st.end) + ' прогресс:' + st.progress.toFixed(2)
              : ' нет триггера'));
      });
      box.textContent = lines.join('\n');
    }, 400);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', startDiag);
  else startDiag();

  // стартуем так же, как первый экран: как только готов HTML, не дожидаясь всех картинок
  function go() {
    window.umaLoadGsap().then(function () {
      diagState.libs = 'загружен ' + (window.gsap && gsap.version);
      waitForBlocks();
    }, function (e) {
      diagState.libs = 'ОШИБКА';
      diagState.error = e.message;
      console.warn(e.message + ', текст показан без анимации');
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go);
  else go();
})();
