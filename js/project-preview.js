/* UMA · project-preview
   Превью обложки при наведении на строку проекта в списке на главной.
   Одно окошко следует за курсором с инерцией. Внутри лежит вертикальная лента
   из всех обложек: при переходе на соседний проект окошко не закрывается,
   лента плавно прокручивается к нужной обложке. Открывается окошко при входе
   в список, закрывается при выходе из него.
   Работает только там, где есть мышь (на телефонах и планшетах наведения нет).
   Стили — css/project-preview.css. */
(function () {
  /* ================= НАСТРОЙКИ ================= */
  // Строки списка (группы в Зеро-блоке с классами pr-1, pr-2…) и их обложки.
  // img: адрес картинки. Пусто — вместо обложки карточка с названием проекта.
  var PROJECTS = [
    { sel: '.pr-1', name: 'Rosi',          img: 'https://optim.tildacdn.com/tild6666-6631-4862-b134-313063336533/-/format/webp/Frame_758532524_1.jpg.webp' },
    { sel: '.pr-2', name: 'Sure',          img: '' },
    { sel: '.pr-3', name: 'Kara Fox',      img: '' },
    { sel: '.pr-4', name: 'Black Sable',   img: '' },
    { sel: '.pr-5', name: 'Arine Atelier', img: '' }
  ];
  var FOLLOW    = 0.12;  // насколько быстро окошко догоняет курсор (меньше = ленивее)
  var TILT_MAX  = 5;     // наклон окошка от скорости движения мыши, градусы (0 = без наклона)
  var HIDE_WAIT = 140;   // мс: пауза перед закрытием, чтобы не мигать в зазоре между строками
  var MIN_WIDTH = 1024;  // px: на экранах уже эффект выключен
  /* ============================================= */

  var canHover = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (!canHover) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  function build() {
    var root = document.createElement('div');
    root.className = 'uma-pv' + (reduce ? ' is-reduced' : '');
    root.setAttribute('aria-hidden', 'true');
    var slides = PROJECTS.map(function (p, i) {
      var inner = p.img
        ? '<img alt="" decoding="async" data-src="' + esc(p.img) + '">'
        : '<div class="uma-pv__card"><span>' + esc(p.name) + '</span><small>' + String(i + 1).padStart(2, '0') + '</small></div>';
      return '<div class="uma-pv__slide">' + inner + '</div>';
    }).join('');
    root.innerHTML = '<div class="uma-pv__frame"><div class="uma-pv__strip">' + slides + '</div></div>';
    document.body.appendChild(root);
    return root;
  }

  function init() {
    // строки проектов: у каждой свой индекс в ленте (одна и та же строка может быть в нескольких списках)
    var rows = [];
    PROJECTS.forEach(function (p, i) {
      document.querySelectorAll(p.sel).forEach(function (el) { rows.push({ el: el, i: i }); });
    });
    if (!rows.length) return;

    var root = build();
    var strip = root.querySelector('.uma-pv__strip');
    var slides = root.querySelectorAll('.uma-pv__slide');
    var loaded = false;

    // картинки грузим при первом наведении, чтобы не тормозить загрузку страницы
    function loadImages() {
      if (loaded) return;
      loaded = true;
      root.querySelectorAll('img[data-src]').forEach(function (img) { img.src = img.getAttribute('data-src'); });
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
      if (window.innerWidth < MIN_WIDTH) return;
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
      clearTimeout(hideTimer);
      hideTimer = setTimeout(function () {
        open = false;
        root.classList.remove('is-open');
      }, HIDE_WAIT);
    }

    function loop() {
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

    window.addEventListener('mousemove', function (e) { tx = e.clientX; ty = e.clientY; }, { passive: true });

    rows.forEach(function (r) {
      r.el.addEventListener('mouseenter', function (e) { show(r.i, e); });
      r.el.addEventListener('mouseleave', hide);
    });

    // при прокрутке колесом курсор может уехать со строки без mouseleave
    window.addEventListener('scroll', function () {
      if (!open) return;
      var el = document.elementFromPoint(tx, ty);
      var inside = el && rows.some(function (r) { return r.el.contains(el); });
      if (!inside) hide();
    }, { passive: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
