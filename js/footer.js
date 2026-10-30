/* UMA · footer
   Разметка, поведение и фон футера. Стили — css/footer.css.
   Вставляется в <div id="uma-footer-mount"></div> из блока Тильды.

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
    WORD:      'UMA DIGITAL  DESIGN  DIRECTION  AI  ',  // из этих букв собран логотип
    LOGO:      'UMA',
    FONT_SIZE: 10,      // размер символа поля, px
    LINE:      1.5,     // высота строки поля в долях размера символа
    FPS:       24,
    SPEED:     0.8,     // скорость перелива
    MOUSE_R:   150      // радиус влияния курсора, px
  };
  /* ============================================= */

  var ARROW = '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M3 9 9 3M4 3h5v5"/></svg>';
  var UP    = '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M6 10V2M2.5 5.5 6 2l3.5 3.5"/></svg>';

  var HTML =
    '<footer class="uma-ft" id="uma-footer">' +
      '<canvas class="uma-ft__field" aria-hidden="true"></canvas>' +
      '<div class="uma-ft__grid">' +
        '<section class="uma-ft__col" aria-labelledby="uma-ft-l1">' +
          '<h2 class="uma-ft__label" id="uma-ft-l1">Новый проект</h2>' +
          '<p class="uma-ft__text">Расскажите о задаче, ответим в течение рабочего дня.</p>' +
          '<a class="uma-ft__btn uma-ft__btn--primary" href="mailto:' + EMAIL + '?subject=' + encodeURIComponent('Проект для UMA') + '">Обсудить проект' + ARROW + '</a>' +
        '</section>' +
        '<section class="uma-ft__col" aria-labelledby="uma-ft-l2">' +
          '<h2 class="uma-ft__label" id="uma-ft-l2">Связь</h2>' +
          '<p class="uma-ft__text">Быстрее всего — в Telegram. Почта копируется по клику.</p>' +
          '<a class="uma-ft__btn" href="' + TELEGRAM + '" target="_blank" rel="noopener">Telegram' + ARROW + '</a>' +
          '<button class="uma-ft__btn uma-ft__copy" type="button" data-copy="' + EMAIL + '">' + EMAIL +
            '<span class="uma-ft__copy-note" role="status" aria-live="polite"></span></button>' +
        '</section>' +
        '<section class="uma-ft__col" aria-labelledby="uma-ft-l3">' +
          '<h2 class="uma-ft__label" id="uma-ft-l3">Работы</h2>' +
          '<p class="uma-ft__text">Интернет-магазины, айдентика и digital-продукты.</p>' +
          '<a class="uma-ft__btn" href="' + PROJECTS + '">Все проекты' + ARROW + '</a>' +
        '</section>' +
        '<section class="uma-ft__col" aria-labelledby="uma-ft-l4">' +
          '<h2 class="uma-ft__label" id="uma-ft-l4">Студия</h2>' +
          '<p class="uma-ft__text">Кто мы и как работаем: от концепции до запуска.</p>' +
          '<a class="uma-ft__btn" href="' + ABOUT + '">О студии' + ARROW + '</a>' +
          '<a class="uma-ft__btn" href="#" data-action="top">Наверх' + UP + '</a>' +
        '</section>' +
      '</div>' +
      '<div class="uma-ft__bar"><div class="uma-ft__bar-inner">' +
        '<span>©2026 UMA Digital</span>' +
        '<span>' + CITY + ' · <span class="uma-ft__time"></span></span>' +
      '</div></div>' +
    '</footer>';

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
    var mask = null;                       // насколько клетка внутри букв логотипа: 0..1
    var ink = '#ffffff';
    var mouse = { x: -9999, y: -9999, k: 0 };
    var running = true, onScreen = false;
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function readInk() {
      var v = getComputedStyle(document.body).getPropertyValue('--txt').trim();
      ink = v || (document.body.classList.contains('light-theme') ? '#1a1a1a' : '#ffffff');
    }

    // логотип рисуется во вспомогательный холст, по нему считается маска клеток.
    // Он занимает всю ширину, но только ниже колонок; низ букв уходит за край футера.
    function buildMask() {
      var off = document.createElement('canvas');
      off.width = cols; off.height = rows;
      var o = off.getContext('2d');
      // логотип начинается под колонками, а на телефоне — под нижней строкой
      var anchor = host.querySelector(window.innerWidth < 640 ? '.uma-ft__bar-inner' : '.uma-ft__grid');
      var hr = host.getBoundingClientRect(), gr = anchor.getBoundingClientRect();
      var top = Math.ceil((gr.bottom - hr.top + 28) / ch);       // первая строка под ними
      var avail = Math.max(4, rows - top);                        // строк под логотип
      var sx = ch / cw;                                           // клетки не квадратные
      var font = function (px) { return '800 ' + px + 'px Manrope, "Arial Black", sans-serif'; };
      o.font = font(100);
      var m = o.measureText(FIELD.LOGO);
      var capH = (m.actualBoundingBoxAscent || 72) / 100;         // высота букв в долях кегля
      // кегль: по ширине (96% футера) и по высоте (видимая часть букв + 22% под край)
      var byW = 100 * (cols * 0.96) / (m.width * sx);
      var byH = avail / (capH * 0.78);
      var size = Math.min(byW, byH);
      o.font = font(size);
      var w = o.measureText(FIELD.LOGO).width;
      o.save();
      o.scale(sx, 1);
      o.textBaseline = 'alphabetic';
      o.fillStyle = '#000';
      o.fillText(FIELD.LOGO, (cols / sx - w) / 2, rows + size * capH * 0.22);
      o.restore();
      var data = o.getImageData(0, 0, cols, rows).data;
      mask = new Float32Array(cols * rows);
      for (var i = 0; i < cols * rows; i++) mask[i] = data[i * 4 + 3] / 255;
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
      buildMask();
      draw(0);
    }

    var buckets = [[], [], [], []];
    var ALPHA = [0.10, 0.18, 0.30, 0.46];

    function draw(t) {
      if (!mask) return;
      ctx.clearRect(0, 0, W, H);
      for (var b = 0; b < 4; b++) buckets[b].length = 0;
      var len = FIELD.WORD.length;
      for (var r = 0; r < rows; r++) {
        var shift = r * 11;
        for (var c = 0; c < cols; c++) {
          var m = mask[r * cols + c];
          var n = (noise(c * 0.07 + t * 0.06, r * 0.11 - t * 0.04) + 1) / 2;   // перелив
          var d = m * (0.55 + n * 0.6);
          if (mouse.k > 0.01) {
            var dx = c * cw - mouse.x, dy = r * ch - mouse.y;
            d += mouse.k * 0.35 * Math.exp(-(dx * dx + dy * dy) / (FIELD.MOUSE_R * FIELD.MOUSE_R)) * (0.4 + m);
          }
          if (d < 0.08) {
            // редкая пыль вне букв
            if (hash(c, r) < 0.035 && n > 0.55) buckets[0].push(c, r, '.');
            continue;
          }
          var lvl, s;
          if (d < 0.3) { lvl = 1; s = n > 0.5 ? ':' : '.'; }
          else if (d < 0.62) { lvl = 2; s = '+'; }
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
    // логотип рисуется шрифтом Manrope: пересчитать маску, когда он загрузится
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(resize);
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
    wire(host);
    field(host);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
