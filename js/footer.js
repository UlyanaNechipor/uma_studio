/* UMA · footer
   Разметка, поведение и фон футера. Стили — css/footer.css.
   Вставляется в <div id="uma-footer-mount"></div> из блока Тильды.

   Кегли и отступы масштабируются как Zero-блоки Тильды (--ft-z).
   Фон — приглушённое переливающееся поле символов.

   Колонки построены по задачам посетителя, дошедшего до конца страницы:
   1. готов обсудить проект  -> главная кнопка «Написать нам»
   2. хочет связаться иначе  -> Telegram и почта, которая копируется в один клик
   3. хочет ещё раз увидеть работы -> «Все проекты»
   4. хочет узнать студию или вернуться к началу -> «О студии» и «Наверх» */
(function () {
  /* ================= НАСТРОЙКИ ================= */
  var EMAIL    = 'umadigital@gmail.com';
  var TELEGRAM = 'https://t.me/';          // допишите ник: https://t.me/имя
  var PROJECTS = '/#projects';
  var ABOUT    = '/#about';
  var CITY     = 'Санкт-Петербург';
  var TZ       = 'Europe/Moscow';

  var FIELD = {
    WORD:      'UMA DIGITAL  DESIGN  DIRECTION  AI  ',  // слова, которые проступают в поле
    FONT_SIZE: 10,      // размер символа поля, px (на узких экранах 7)
    LINE:      1.5,     // высота строки поля в долях размера символа
    FPS:       24,
    SPEED:     0.8,     // скорость перелива
    MOUSE_R:   150      // радиус влияния курсора, px
  };
  /* ============================================= */


  var HTML =
    '<footer class="uma-ft" id="uma-footer">' +
      '<canvas class="uma-ft__field" aria-hidden="true"></canvas>' +
      '<div class="uma-ft__grid">' +
        '<section class="uma-ft__col" aria-labelledby="uma-ft-l1">' +
          '<h2 class="uma-ft__label" id="uma-ft-l1">Новый проект</h2>' +
          '<p class="uma-ft__text">Расскажите о задаче, ответим в течение рабочего дня.</p>' +
          '<a class="uma-ft__btn uma-ft__btn--primary" href="mailto:' + EMAIL + '?subject=' + encodeURIComponent('Проект для UMA') + '">Обсудить проект</a>' +
        '</section>' +
        '<section class="uma-ft__col" aria-labelledby="uma-ft-l2">' +
          '<h2 class="uma-ft__label" id="uma-ft-l2">Связь</h2>' +
          '<p class="uma-ft__text">Быстрее всего — в Telegram. Почта копируется по клику.</p>' +
          '<a class="uma-ft__btn" href="' + TELEGRAM + '" target="_blank" rel="noopener">Telegram</a>' +
          '<button class="uma-ft__btn uma-ft__copy" type="button" data-copy="' + EMAIL + '">' + EMAIL +
            '<span class="uma-ft__copy-note" role="status" aria-live="polite"></span></button>' +
        '</section>' +
        '<section class="uma-ft__col" aria-labelledby="uma-ft-l3">' +
          '<h2 class="uma-ft__label" id="uma-ft-l3">Работы</h2>' +
          '<p class="uma-ft__text">Интернет-магазины, айдентика и digital-продукты.</p>' +
          '<a class="uma-ft__btn" href="' + PROJECTS + '">Все проекты</a>' +
        '</section>' +
        '<section class="uma-ft__col" aria-labelledby="uma-ft-l4">' +
          '<h2 class="uma-ft__label" id="uma-ft-l4">Студия</h2>' +
          '<p class="uma-ft__text">Кто мы и как работаем: от концепции до запуска.</p>' +
          '<a class="uma-ft__btn" href="' + ABOUT + '">О студии</a>' +
          '<a class="uma-ft__btn" href="#" data-action="top">Наверх</a>' +
        '</section>' +
      '</div>' +
      '<div class="uma-ft__bar"><div class="uma-ft__bar-inner">' +
        '<span>©2026 UMA Digital</span>' +
        '<span>' + CITY + ' · <span class="uma-ft__time"></span></span>' +
      '</div></div>' +
    '</footer>';

  // Тильда растягивает Zero-блоки свойством zoom: ширина экрана / ширина брейкпоинта.
  // Футер получает тот же коэффициент (--ft-z), поэтому кегли и отступы совпадают с блоками.
  function zoomFactor() {
    // берём коэффициент прямо у видимого Zero-элемента; формула — запасной вариант
    var els = document.querySelectorAll('#allrecords .t396__elem[style*="zoom"]');
    for (var i = 0; i < els.length; i++) {
      var z = parseFloat(els[i].style.zoom);
      if (z > 0 && els[i].getClientRects().length) return z;
    }
    var w = window.innerWidth;
    var bp = w >= 1200 ? 1200 : w >= 960 ? 960 : w >= 640 ? 640 : w >= 480 ? 480 : 320;
    return w / bp;
  }
  function applyZoom(host) { host.style.setProperty('--ft-z', zoomFactor().toFixed(4)); }

  function mount() {
    var m = document.getElementById('uma-footer-mount');
    if (!m || document.getElementById('uma-footer')) return null;
    m.innerHTML = HTML;
    return document.getElementById('uma-footer');
  }

  /* ---------- поведение ---------- */
  function wire(host) {
    // наверх
    host.querySelectorAll('[data-action="top"]').forEach(function (b) {
      b.addEventListener('click', function (e) {
        e.preventDefault();
        var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
      });
    });

    // почта копируется; если буфер обмена недоступен — открывается почтовый клиент
    var copy = host.querySelector('[data-copy]');
    var note = copy.querySelector('.uma-ft__copy-note');
    var t;
    copy.addEventListener('click', function () {
      var mail = copy.getAttribute('data-copy');
      var done = function () {
        note.textContent = 'Почта скопирована';
        copy.classList.add('is-copied');
        clearTimeout(t);
        t = setTimeout(function () { copy.classList.remove('is-copied'); }, 1800);
      };
      if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(mail).then(done, function () { location.href = 'mailto:' + mail; });
      else location.href = 'mailto:' + mail;
    });

    // местное время студии: живой сигнал, что за сайтом люди
    var clock = host.querySelector('.uma-ft__time');
    var fmt;
    try { fmt = new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit', timeZone: TZ }); } catch (e) {}
    function tick() { if (fmt) clock.textContent = fmt.format(new Date()); }
    tick(); setInterval(tick, 20000);

    // плашка Тильды
    function killTildaLabel() {
      document.querySelectorAll('.t-tildalаbеl, #tildacоpy, .t-tildalаbеl__wrapper').forEach(function (el) {
        el.style.setProperty('display', 'none', 'important');
      });
    }
    killTildaLabel(); setInterval(killTildaLabel, 1000);
  }

  /* ---------- фон: логотип UMA из поля символов ---------- */
  var perm = new Uint8Array(512);
  (function () {
    var p = [], i, j, t;
    for (i = 0; i < 256; i++) p[i] = i;
    for (i = 255; i > 0; i--) { j = Math.floor(Math.random() * (i + 1)); t = p[i]; p[i] = p[j]; p[j] = t; }
    for (i = 0; i < 512; i++) perm[i] = p[i & 255];
  })();
  function fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function grad(h, x, y) {
    switch (h & 7) {
      case 0: return x + y; case 1: return -x + y; case 2: return x - y; case 3: return -x - y;
      case 4: return x; case 5: return -x; case 6: return y; default: return -y;
    }
  }
  function noise(x, y) {
    var xf = Math.floor(x), yf = Math.floor(y), X = xf & 255, Y = yf & 255;
    x -= xf; y -= yf;
    var u = fade(x), v = fade(y), a = perm[X] + Y, b = perm[X + 1] + Y;
    return lerp(lerp(grad(perm[a], x, y), grad(perm[b], x - 1, y), u),
                lerp(grad(perm[a + 1], x, y - 1), grad(perm[b + 1], x - 1, y - 1), u), v);
  }
  function hash(c, r) { return (((c * 73856093) ^ (r * 19349663)) >>> 0) % 1000 / 1000; }

  function field(host) {
    var canvas = host.querySelector('.uma-ft__field');
    var ctx = canvas.getContext('2d');
    var FONT = 'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace';
    var W = 0, H = 0, cols = 0, rows = 0, cw = 0, ch = 0, dpr = 1, fs = FIELD.FONT_SIZE;
    var ink = '#ffffff';
    var mouse = { x: -9999, y: -9999, k: 0 };
    var running = true, onScreen = false;
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function readInk() {
      var v = getComputedStyle(document.body).getPropertyValue('--txt').trim();
      ink = v || (document.body.classList.contains('light-theme') ? '#1a1a1a' : '#ffffff');
    }

    function resize() {
      var r = host.getBoundingClientRect();
      W = Math.max(1, Math.round(r.width));
      H = Math.max(1, Math.round(r.height));
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // на узких экранах символ мельче: иначе логотип собран из слишком крупных «пикселей»
      fs = W < 640 ? 7 : FIELD.FONT_SIZE;
      ctx.font = fs + 'px ' + FONT;
      ctx.textBaseline = 'top';
      cw = ctx.measureText('M').width;
      ch = fs * FIELD.LINE;
      cols = Math.ceil(W / cw); rows = Math.ceil(H / ch);
      draw(0);
    }

    // приглушённое поле: редкие точки, чуть гуще к низу, в самых плотных местах проступают слова
    var buckets = [[], [], [], []];
    var ALPHA = [0.05, 0.09, 0.14, 0.2];

    function draw(t) {
      ctx.clearRect(0, 0, W, H);
      for (var b = 0; b < 4; b++) buckets[b].length = 0;
      var len = FIELD.WORD.length;
      for (var r = 0; r < rows; r++) {
        var shift = r * 11, yb = r / rows;
        for (var c = 0; c < cols; c++) {
          var n = (noise(c * 0.06 + t * 0.06, r * 0.1 - t * 0.04) + 1) / 2;
          var d = (n - 0.42) * 1.1 + yb * 0.22;
          if (mouse.k > 0.01) {
            var dx = c * cw - mouse.x, dy = r * ch - mouse.y;
            d += mouse.k * 0.3 * Math.exp(-(dx * dx + dy * dy) / (FIELD.MOUSE_R * FIELD.MOUSE_R));
          }
          if (d < 0.1) {
            if (hash(c, r) < 0.03 && n > 0.5) buckets[0].push(c, r, '.');
            continue;
          }
          var lvl, s;
          if (d < 0.28) { lvl = 1; s = n > 0.5 ? ':' : '.'; }
          else if (d < 0.46) { lvl = 2; s = '+'; }
          else { lvl = 3; s = FIELD.WORD.charAt((c + shift) % len); if (s === ' ') s = '+'; }
          buckets[lvl].push(c, r, s);
        }
      }
      ctx.fillStyle = ink;
      for (var k = 0; k < 4; k++) {
        var bk = buckets[k];
        if (!bk.length) continue;
        ctx.globalAlpha = ALPHA[k];
        for (var q = 0; q < bk.length; q += 3) ctx.fillText(bk[q + 2], bk[q] * cw, bk[q + 1] * ch);
      }
      ctx.globalAlpha = 1;
    }

    var last = 0, t0 = performance.now(), step = 1000 / FIELD.FPS;
    function loop(now) {
      requestAnimationFrame(loop);
      if (!running || !onScreen || reduce) return;
      if (now - last < step) return;
      last = now;
      mouse.k *= 0.95;
      draw((now - t0) / 1000 * FIELD.SPEED);
    }

    readInk();
    resize();
    if (window.ResizeObserver) new ResizeObserver(resize).observe(host);
    else window.addEventListener('resize', resize);
    new MutationObserver(function () { readInk(); draw(0); })
      .observe(document.body, { attributes: true, attributeFilter: ['class'] });
    if (window.IntersectionObserver) {
      new IntersectionObserver(function (e) { onScreen = e[0].isIntersecting; }, { rootMargin: '80px' }).observe(host);
    } else onScreen = true;
    document.addEventListener('visibilitychange', function () { running = !document.hidden; });
    if (!reduce) {
      host.addEventListener('mousemove', function (e) {
        var r = host.getBoundingClientRect();
        mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; mouse.k = 1;
      }, { passive: true });
    }
    requestAnimationFrame(loop);
  }

  function boot() {
    var host = mount();
    if (!host) return;
    applyZoom(host);
    window.addEventListener('resize', function () { setTimeout(function () { applyZoom(host); }, 50); });
    // Тильда проставляет zoom Zero-блокам чуть позже загрузки: сверяемся ещё раз
    window.addEventListener('load', function () { applyZoom(host); });
    setTimeout(function () { applyZoom(host); }, 1200);
    wire(host);
    field(host);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
