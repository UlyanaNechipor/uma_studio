/* UMA · footer
   Перенесено из блока Тильды rec5227328501. */

// разметка футера: вставляется в <div id="uma-footer-mount"></div> из блока Тильды
(function () {
  var HTML = `
<footer class="uma-footer" id="uma-footer">
    <canvas class="uma-footer__field" aria-hidden="true"></canvas>
    <nav class="uma-footer__actions" aria-label="Контакты и навигация">
        <a class="uma-footer__btn" href="mailto:umadigital@gmail.com" data-word="HELLO">
            Написать нам <svg class="uma-footer__btn-icon" viewBox="0 0 12 12" aria-hidden="true"><path d="M3 9 9 3M4 3h5v5"/></svg>
        </a>
        <a class="uma-footer__btn" href="https://t.me/" target="_blank" rel="noopener" data-word="TELEGRAM">
            Telegram <svg class="uma-footer__btn-icon" viewBox="0 0 12 12" aria-hidden="true"><path d="M3 9 9 3M4 3h5v5"/></svg>
        </a>
        <a class="uma-footer__btn" href="#projects" data-word="PROJECTS">
            Проекты <svg class="uma-footer__btn-icon" viewBox="0 0 12 12" aria-hidden="true"><path d="M3 9 9 3M4 3h5v5"/></svg>
        </a>
        <a class="uma-footer__btn" href="#" data-action="top" data-word="UP">
            Наверх <svg class="uma-footer__btn-icon" viewBox="0 0 12 12" aria-hidden="true"><path d="M6 10V2M2.5 5.5 6 2l3.5 3.5"/></svg>
        </a>
    </nav>
    <div class="uma-footer__bar">
        <span>©2026 UMA DIGITAL</span>
        <a href="mailto:umadigital@gmail.com">umadigital@gmail.com</a>
    </div>
</footer>
`;
  function mount() {
    var m = document.getElementById('uma-footer-mount');
    if (!m || document.getElementById('uma-footer')) return;
    m.innerHTML = HTML;
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();

document.addEventListener("DOMContentLoaded", function () {
  // плашка Тильды (как в прежнем футере)
  function killTildaLabel() {
    document.querySelectorAll('.t-tildalаbеl, #tildacоpy, .t-tildalаbеl__wrapper').forEach(function (el) {
      el.style.setProperty('display', 'none', 'important');
    });
  }
  killTildaLabel(); setInterval(killTildaLabel, 1000);

  // кнопка «Наверх»
  document.querySelectorAll('.uma-footer__btn[data-action="top"]').forEach(function (b) {
    b.addEventListener('click', function (e) { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); });
  });
});

(function () {
  /* ================= НАСТРОЙКИ ПОЛЯ ================= */
  var CFG = {
    WORD:      'UMA DIGITAL  DESIGN  DIRECTION  AI  ', // фоновые слова вдали от кнопок
    FONT_SIZE: 11,      // размер символа, px
    LINE:      1.55,    // высота строки сетки в долях размера символа
    FPS:       30,
    SPEED:     1,       // скорость течения
    SCALE:     0.06,    // масштаб «облаков» (меньше = крупнее пятна)
    AURA:      0.42,    // сила общей ауры вдоль ряда кнопок (больше = гуще)
    BAND:      0.32,    // высота ауры в долях высоты футера
    PAD:       34,      // на каком расстоянии от кнопки символы плавно сходят на нет, px
    RING:      90,      // радиус мягкой подсветки при наведении, px
    MOUSE_R:   120      // радиус влияния курсора, px
  };
  /* ================================================== */

  var FONT  = 'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace';
  var RAMP  = ['.', '.', ':', '+'];
  var ALPHA = [0.12, 0.2, 0.3, 0.42, 0.62];   // тише, чем раньше: поле фоновое

  /* ---------- шум Перлина ---------- */
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
      case 0: return  x + y; case 1: return -x + y; case 2: return  x - y; case 3: return -x - y;
      case 4: return  x;     case 5: return -x;     case 6: return  y;     default: return -y;
    }
  }
  function noise(x, y) {
    var xf = Math.floor(x), yf = Math.floor(y), X = xf & 255, Y = yf & 255;
    x -= xf; y -= yf;
    var u = fade(x), v = fade(y), a = perm[X] + Y, b = perm[X + 1] + Y;
    return lerp(lerp(grad(perm[a], x, y), grad(perm[b], x - 1, y), u),
                lerp(grad(perm[a + 1], x, y - 1), grad(perm[b + 1], x - 1, y - 1), u), v);
  }
  function fbm(x, y) { return noise(x, y) * 0.7 + noise(x * 2.1 + 17.3, y * 2.1 - 9.1) * 0.3; }
  function smooth(a, b, x) { var t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); }
  function hash(c, r) { return (((c * 73856093) ^ (r * 19349663)) >>> 0) % 1000 / 1000; }

  function start(host) {
    var canvas = host.querySelector('.uma-footer__field');
    var ctx = canvas.getContext('2d');
    var btnEls = [].slice.call(host.querySelectorAll('.uma-footer__btn'));
    var btns = [];   // { x0, y0, x1, y1, word, hover, k }
    var rowY = 0;    // центр ряда кнопок по вертикали

    var W = 0, H = 0, cols = 0, rows = 0, cw = 0, ch = 0, dpr = 1;
    var ink = '#ffffff';
    var mouse = { x: -9999, y: -9999, k: 0 };
    var running = true, onScreen = true;
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function readInk() {
      var v = getComputedStyle(document.body).getPropertyValue('--txt').trim();
      ink = v || (document.body.classList.contains('light-theme') ? '#1a1a1a' : '#ffffff');
    }

    // где стоят кнопки внутри футера
    function measureButtons() {
      var hr = host.getBoundingClientRect();
      btns = btnEls.map(function (el, i) {
        var r = el.getBoundingClientRect();
        var old = btns[i] || {};
        return {
          x0: r.left - hr.left, y0: r.top - hr.top, x1: r.right - hr.left, y1: r.bottom - hr.top,
          word: (el.getAttribute('data-word') || 'UMA').toUpperCase() + '  ',
          hover: old.hover || false, k: old.k || 0
        };
      });
      rowY = btns.length
        ? btns.reduce(function (s, b) { return s + (b.y0 + b.y1) / 2; }, 0) / btns.length
        : 0;
    }

    function resize() {
      var r = host.getBoundingClientRect();
      W = Math.max(1, Math.round(r.width));
      H = Math.max(1, Math.round(r.height));
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.font = CFG.FONT_SIZE + 'px ' + FONT;
      ctx.textBaseline = 'top';
      cw = ctx.measureText('M').width;
      ch = CFG.FONT_SIZE * CFG.LINE;
      cols = Math.ceil(W / cw);
      rows = Math.ceil(H / ch);
      measureButtons();
      if (reduce) draw(0);
    }

    // расстояние от точки до прямоугольника кнопки (0 внутри)
    function distRect(px, py, b) {
      var dx = Math.max(b.x0 - px, 0, px - b.x1);
      var dy = Math.max(b.y0 - py, 0, py - b.y1);
      return Math.sqrt(dx * dx + dy * dy);
    }

    var nearWord = null; // слово ближайшей кнопки для текущей клетки

    function density(c, r, t) {
      var px = c * cw + cw / 2, py = r * ch + ch / 2;
      var x = c / cols, y = r / rows;

      // фон: лёгкие облака, чуть гуще к низу и краям
      var n = (fbm(c * CFG.SCALE + t * 0.05, r * CFG.SCALE * 1.7 - t * 0.03) + 1) / 2;
      var edge = Math.max(smooth(0.5, 1.0, y) * 0.35, smooth(0.7, 1.0, Math.abs(x - 0.5) * 2) * 0.5);
      var d = (n - 0.5) * 0.9 + edge + 0.02;

      // одна общая аура: мягкая полоса вдоль ряда кнопок, рваная шумом
      if (btns.length) {
        var band = Math.exp(-Math.pow((py - rowY) / (CFG.BAND * H), 2));
        d += band * CFG.AURA * (0.55 + n * 0.9);
      }

      // у самих кнопок символы плавно редеют до нуля, без чёткого контура;
      // наведённая кнопка мягко подсвечивает своё облако и своё слово
      var minDist = Infinity, glow = 0;
      nearWord = null;
      for (var i = 0; i < btns.length; i++) {
        var b = btns[i];
        var dist = distRect(px, py, b);
        if (dist < minDist) minDist = dist;
        if (b.k > 0.02) {
          var g = b.k * 0.4 * Math.exp(-Math.pow(dist / CFG.RING, 2)) * (0.6 + n * 0.8);
          if (g > glow) { glow = g; if (g > 0.12) nearWord = b.word; }
        }
      }
      d += glow;
      if (minDist < Infinity) d *= smooth(0, CFG.PAD, minDist);

      if (mouse.k > 0.01) {
        var mx = px - mouse.x, my = py - mouse.y;
        d += mouse.k * 0.5 * Math.exp(-(mx * mx + my * my) / (CFG.MOUSE_R * CFG.MOUSE_R));
      }
      return d;
    }

    var buckets = [[], [], [], [], []];

    function draw(t) {
      ctx.clearRect(0, 0, W, H);
      var i, c, r, d, lvl, s, word;
      for (i = 0; i < 5; i++) buckets[i].length = 0;

      for (r = 0; r < rows; r++) {
        var shift = r * 13;
        for (c = 0; c < cols; c++) {
          d = density(c, r, t);
          if (d < 0.12) {
            if (d > 0.02 && hash(c, r) < 0.10) buckets[0].push(c, r, '.');
            continue;
          }
          if (d < 0.32)      lvl = 1;
          else if (d < 0.48) lvl = 2;
          else if (d < 0.72) lvl = 3;
          else               lvl = 4;

          if (lvl < 4) s = RAMP[lvl];
          else {
            word = nearWord || CFG.WORD;
            s = word.charAt((c + shift) % word.length);
          }
          if (s === ' ') continue;
          buckets[lvl].push(c, r, s);
        }
      }

      ctx.fillStyle = ink;
      for (i = 0; i < 5; i++) {
        var bk = buckets[i];
        if (!bk.length) continue;
        ctx.globalAlpha = ALPHA[i];
        for (var k = 0; k < bk.length; k += 3) ctx.fillText(bk[k + 2], bk[k] * cw, bk[k + 1] * ch);
      }
      ctx.globalAlpha = 1;
    }

    /* ---------- цикл ---------- */
    var last = 0, t0 = performance.now(), step = 1000 / CFG.FPS;
    function loop(now) {
      requestAnimationFrame(loop);
      if (!running || !onScreen || reduce) return;
      if (now - last < step) return;
      last = now;
      mouse.k *= 0.96;
      btns.forEach(function (b) { b.k += ((b.hover ? 1 : 0) - b.k) * 0.12; }); // плавное разгорание
      draw((now - t0) / 1000 * CFG.SPEED);
    }

    /* ---------- события ---------- */
    readInk();
    resize();

    if (window.ResizeObserver) new ResizeObserver(resize).observe(host);
    window.addEventListener('resize', resize);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measureButtons);

    new MutationObserver(function () { readInk(); if (reduce) draw(0); })
      .observe(document.body, { attributes: true, attributeFilter: ['class'] });

    if (window.IntersectionObserver) {
      new IntersectionObserver(function (e) { onScreen = e[0].isIntersecting; if (onScreen) measureButtons(); }, { rootMargin: '100px' })
        .observe(host);
    }
    document.addEventListener('visibilitychange', function () { running = !document.hidden; });

    btnEls.forEach(function (el, i) {
      el.addEventListener('mouseenter', function () { if (btns[i]) btns[i].hover = true; });
      el.addEventListener('mouseleave', function () { if (btns[i]) btns[i].hover = false; });
      el.addEventListener('focus',      function () { if (btns[i]) btns[i].hover = true; });
      el.addEventListener('blur',       function () { if (btns[i]) btns[i].hover = false; });
    });

    if (!reduce) {
      host.addEventListener('mousemove', function (e) {
        var r = host.getBoundingClientRect();
        mouse.x = e.clientX - r.left;
        mouse.y = e.clientY - r.top;
        mouse.k = 1;
      }, { passive: true });
    }

    requestAnimationFrame(loop);
  }

  function boot() {
    var host = document.getElementById('uma-footer');
    if (host) start(host);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
