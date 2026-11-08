/* UMA · project-preview
   Превью обложки при наведении на строку проекта в списке на главной.
   Одно окошко следует за курсором с инерцией. Внутри лежит вертикальная лента
   из всех обложек: при переходе на соседний проект окошко не закрывается,
   лента плавно прокручивается к нужной обложке. Открывается окошко при входе
   в список, закрывается при выходе из него.

   Строки находятся сами, по названиям проектов: строка — это полоса во всю
   ширину списка вокруг названия. Классы в Зеро-блоке и группировка элементов
   не нужны. Элементы, которые на текущем экране спрятаны (лежат за пределами
   своего блока), не учитываются, поэтому работает на любом брейкпоинте.

   Сейчас работает только с мышью. Заготовка для телефонов (выключена, см. touchMode):
   на телефонах и планшетах (без мыши) окошко открывается по положению на экране:
   активна карточка проекта (.project-group-card), которая пересекает середину
   экрана. Окошко ложится на место картинок в этой карточке и при прокрутке
   плавно переезжает к следующей, лента обложек переключается так же, как на десктопе.
   Стили — css/project-preview.css. */
(function () {
  /* ================= НАСТРОЙКИ ================= */
  // Проекты в том порядке, в каком они идут в списке, и их обложки.
  // name: название, как оно написано в строке списка (регистр не важен).
  // file: картинка из репозитория (img/covers/…), img: любой внешний адрес.
  // Без картинки — вместо обложки карточка с названием проекта.
  var LIST_REC = 'rec3979597501';   // Зеро-блок со списком проектов
  var PROJECTS = [
    { name: 'Rosi',          file: 'img/covers/rosi.webp' },
    { name: 'Sure',          file: 'img/covers/sure.webp' },
    { name: 'Kara Fox',      file: 'img/covers/kara-fox.webp' },
    { name: 'Black Sable',   file: 'img/covers/black-sable.webp' },
    { name: 'Arine Atelier', file: 'img/covers/arine-atelier-mockup.webp' }
  ];
  var FOLLOW    = 0.12;  // насколько быстро окошко догоняет курсор (меньше = ленивее)
  var TILT_MAX  = 5;     // наклон окошка от скорости движения мыши, градусы (0 = без наклона)
  var HIDE_WAIT = 140;   // мс: пауза перед закрытием, чтобы не мигать в зазоре между строками
  var MIN_WIDTH = 1024;  // px: с мышью на экранах уже эффект выключен
  var FOCUS_Y   = 0.5;   // без мыши: линия фокуса в долях высоты экрана (0.5 — середина)
  var GLIDE     = 0.2;   // без мыши: скорость переезда окошка к следующей карточке
  /* ============================================= */

  var canHover = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  // Без мыши превью выключено. Режим по положению на экране оставлен в коде:
  // чтобы включить его снова, замените строку ниже на  var touchMode = !canHover;
  if (!canHover) return;
  var touchMode = false;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  // файл из репозитория: основной адрес — jsDelivr, запасной — raw.githubusercontent
  var REPO = 'UlyanaNechipor/uma_studio';
  function fromRepo(path) {
    var ref = (window.UMA && window.UMA.ref) || 'main';
    var v = (window.UMA && window.UMA.version) ? '?v=' + encodeURIComponent(window.UMA.version) : '';
    return {
      cdn: 'https://cdn.jsdelivr.net/gh/' + REPO + '@' + ref + '/' + path + v,
      raw: 'https://raw.githubusercontent.com/' + REPO + '/' + ref + '/' + path + v
    };
  }

  function build() {
    var root = document.createElement('div');
    root.className = 'uma-pv' + (reduce ? ' is-reduced' : '');
    root.setAttribute('aria-hidden', 'true');
    var slides = PROJECTS.map(function (p, i) {
      var src = p.file ? fromRepo(p.file) : (p.img ? { cdn: p.img } : null);
      var inner = src
        ? '<img alt="" decoding="async" data-src="' + esc(src.cdn) + '"' + (src.raw ? ' data-raw="' + esc(src.raw) + '"' : '') + '>'
        : '<div class="uma-pv__card"><span>' + esc(p.name) + '</span><small>' + String(i + 1).padStart(2, '0') + '</small></div>';
      return '<div class="uma-pv__slide">' + inner + '</div>';
    }).join('');
    root.innerHTML = '<div class="uma-pv__frame"><div class="uma-pv__strip">' + slides + '</div></div>';
    document.body.appendChild(root);
    return root;
  }

  /* ---------- строки списка ----------
     Для каждого проекта ищем текстовый элемент с его названием внутри блока списка,
     который на текущем экране действительно лежит внутри блока. По центрам названий
     строим полосы: граница между строками — середина между соседними названиями. */
  function norm(t) { return String(t || '').replace(/\s+/g, ' ').trim().toLowerCase(); }

  function findBands() {
    var rec = document.getElementById(LIST_REC);
    if (!rec) return null;
    var rb = rec.getBoundingClientRect();
    if (!rb.height) return null;
    var atoms = rec.querySelectorAll('.t396__elem[data-elem-type="text"] .tn-atom');
    var found = [];
    PROJECTS.forEach(function (p, i) {
      var want = norm(p.name);
      for (var k = 0; k < atoms.length; k++) {
        var a = atoms[k];
        if (norm(a.textContent) !== want) continue;
        var r = a.getBoundingClientRect();
        if (!r.width || !r.height) continue;
        // спрятанные раскладки других брейкпоинтов лежат за пределами блока:
        // учитываем название, только если его центр внутри блока
        var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        if (cy < rb.top || cy > rb.bottom || cx < rb.left || cx > rb.right) continue;
        if (getComputedStyle(a).visibility === 'hidden') continue;
        found.push({ i: i, cy: r.top + r.height / 2, left: r.left });
        break;
      }
    });
    if (!found.length) return null;
    found.sort(function (p, q) { return p.cy - q.cy; });
    var step = found.length > 1 ? (found[found.length - 1].cy - found[0].cy) / (found.length - 1) : 80;
    var left = Math.min.apply(null, found.map(function (f) { return f.left; }));
    var pad = left - rb.left;                       // поля списка слева = поля справа
    return {
      x0: left - 16,
      x1: rb.right - pad + 16,
      rows: found.map(function (f, k) {
        return {
          i: f.i,
          y0: k ? (found[k - 1].cy + f.cy) / 2 : f.cy - step / 2,
          y1: k < found.length - 1 ? (f.cy + found[k + 1].cy) / 2 : f.cy + step / 2
        };
      })
    };
  }

  // какой проект под курсором (координаты окна); -1 — курсор вне списка
  function hit(b, cx, cy) {
    if (!b || cx < b.x0 || cx > b.x1) return -1;
    for (var k = 0; k < b.rows.length; k++) {
      if (cy >= b.rows[k].y0 && cy < b.rows[k].y1) return b.rows[k].i;
    }
    return -1;
  }

  function init() {
    if (!document.getElementById(LIST_REC)) return;

    var root = build();
    if (touchMode) root.classList.add('is-touch');
    var strip = root.querySelector('.uma-pv__strip');
    var slides = root.querySelectorAll('.uma-pv__slide');
    var loaded = false;

    // картинки грузим при первом наведении, чтобы не тормозить загрузку страницы
    function loadImages() {
      if (loaded) return;
      loaded = true;
      root.querySelectorAll('img[data-src]').forEach(function (img) {
        img.addEventListener('error', function () {
          var raw = img.getAttribute('data-raw');
          if (raw && img.src !== raw) img.src = raw;
        });
        img.src = img.getAttribute('data-src');
      });
    }

    var x = 0, y = 0, tx = 0, ty = 0, vx = 0, tilt = 0;
    var open = false, current = -1, hideTimer = null, raf = null;

    function setIndex(i) {
      if (i === current) return;
      current = i;
      strip.style.transform = 'translate3d(0,' + (-100 * i) + '%,0)';
      for (var k = 0; k < slides.length; k++) slides[k].classList.toggle('is-active', k === i);
    }

    function show(i, e) {
      clearTimeout(hideTimer);
      hideTimer = null;
      if (!touchMode && window.innerWidth < MIN_WIDTH) return;
      loadImages();
      if (!open) {
        // при открытии окошко появляется сразу под курсором, без «прилёта» из угла
        x = tx = e.clientX; y = ty = e.clientY;
        // лента встаёт на нужную обложку без прокрутки
        strip.style.transition = 'none';
        setIndex(i);
        strip.offsetHeight;  // применить без анимации
        strip.style.transition = '';
        open = true;
        root.classList.add('is-open');
        loop();
      } else {
        setIndex(i);
      }
    }

    function hide() {
      if (hideTimer) return;           // уже закрываемся: таймер не перезапускаем
      hideTimer = setTimeout(function () {
        hideTimer = null;
        open = false;
        root.classList.remove('is-open');
      }, HIDE_WAIT);
    }

    function loop() {
      if (touchMode) return;
      cancelAnimationFrame(raf);
      (function step() {
        var dx = (tx - x) * (reduce ? 1 : FOLLOW);
        x += dx;
        y += (ty - y) * (reduce ? 1 : FOLLOW);
        vx += (dx - vx) * 0.2;
        tilt = reduce ? 0 : Math.max(-TILT_MAX, Math.min(TILT_MAX, vx * 0.35));
        root.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0) rotate(' + tilt.toFixed(2) + 'deg)';
        // крутимся, пока окошко открыто или ещё не догнало курсор
        if (open || Math.abs(tx - x) > 0.5 || Math.abs(ty - y) > 0.5) raf = requestAnimationFrame(step);
      })();
    }

    /* ---------- без мыши: по положению карточки на экране ---------- */
    if (touchMode) {
      // карточки проектов в блоке списка и их индекс в ленте (по названию в карточке)
      function cards() {
        var rec = document.getElementById(LIST_REC);
        if (!rec) return [];
        var out = [];
        rec.querySelectorAll('.project-group-card').forEach(function (c) {
          if (!c.getClientRects().length) return;
          var idx = -1;
          c.querySelectorAll('.t396__elem[data-elem-type="text"] .tn-atom').forEach(function (a) {
            if (idx >= 0) return;
            var t = norm(a.textContent);
            for (var k = 0; k < PROJECTS.length; k++) if (norm(PROJECTS[k].name) === t) { idx = k; break; }
          });
          if (idx >= 0) out.push({ el: c, i: idx });
        });
        return out;
      }
      // место под картинки в карточке: общий прямоугольник её фигур и изображений
      function zone(c) {
        var r = null;
        c.querySelectorAll('.t396__elem[data-elem-type="shape"], .t396__elem[data-elem-type="image"]').forEach(function (e) {
          var q = e.getBoundingClientRect();
          if (!q.width || !q.height) return;
          r = r ? { l: Math.min(r.l, q.left), t: Math.min(r.t, q.top), r: Math.max(r.r, q.right), b: Math.max(r.b, q.bottom) }
                : { l: q.left, t: q.top, r: q.right, b: q.bottom };
        });
        if (!r) { var q = c.getBoundingClientRect(); r = { l: q.left, t: q.top, r: q.right, b: q.bottom }; }
        return r;
      }

      var list = [], px = 0, py = 0, pw = 0, ph = 0, tpx = 0, tpy = 0, tpw = 0, tph = 0, traf = null;
      function placeNow() {
        var sy = window.pageYOffset;
        root.style.transform = 'translate3d(' + px.toFixed(1) + 'px,' + (py - sy).toFixed(1) + 'px,0)';
        root.style.setProperty('--pv-w', pw.toFixed(1) + 'px');
        root.style.setProperty('--pv-h', ph.toFixed(1) + 'px');
      }
      // координаты окошка считаются в координатах страницы: при прокрутке оно
      // едет вместе с карточкой без отставания, а к новой карточке — плавно
      function glide() {
        traf = null;
        var k = reduce ? 1 : GLIDE;
        px += (tpx - px) * k; py += (tpy - py) * k; pw += (tpw - pw) * k; ph += (tph - ph) * k;
        placeNow();
        if (Math.abs(tpx - px) + Math.abs(tpy - py) + Math.abs(tpw - pw) + Math.abs(tph - ph) > 0.5) traf = requestAnimationFrame(glide);
      }
      function update() {
        if (!list.length) list = cards();
        if (!list.length) { if (open) hide(); return; }
        var line = window.innerHeight * FOCUS_Y, act = null;
        for (var n = 0; n < list.length; n++) {
          var r = list[n].el.getBoundingClientRect();
          if (r.top <= line && r.bottom >= line) { act = list[n]; break; }
        }
        if (!act) { if (open) hide(); return; }
        var z = zone(act.el), sy = window.pageYOffset;
        tpx = (z.l + z.r) / 2; tpy = (z.t + z.b) / 2 + sy; tpw = z.r - z.l; tph = z.b - z.t;
        if (!open) { px = tpx; py = tpy; pw = tpw; ph = tph; }
        show(act.i, { clientX: tpx, clientY: tpy - sy });
        placeNow();
        if (!traf) traf = requestAnimationFrame(glide);
      }
      var tpending = false;
      function tschedule() { if (!tpending) { tpending = true; requestAnimationFrame(function () { tpending = false; update(); }); } }
      window.addEventListener('scroll', tschedule, { passive: true });
      window.addEventListener('resize', function () { list = []; tschedule(); });
      window.addEventListener('load', function () { list = []; tschedule(); });
      tschedule();
      return;
    }

    // проверяем строку под курсором при движении мыши и при прокрутке страницы
    var pending = false;
    function check() {
      pending = false;
      if (window.innerWidth < MIN_WIDTH) { if (open) hide(); return; }
      var i = hit(findBands(), tx, ty);
      if (i >= 0) show(i, { clientX: tx, clientY: ty });
      else if (open) hide();
    }
    function schedule() { if (!pending) { pending = true; requestAnimationFrame(check); } }

    window.addEventListener('mousemove', function (e) { tx = e.clientX; ty = e.clientY; schedule(); }, { passive: true });
    window.addEventListener('scroll', schedule, { passive: true });
    document.addEventListener('mouseleave', function () { if (open) hide(); });
  }

  // на один такт позже: к этому моменту загрузчик уже записал в window.UMA ветку и версию
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(init, 0); });
  else setTimeout(init, 0);
})();
