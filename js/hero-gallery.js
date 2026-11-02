/* UMA · hero-gallery
   Галерея первого экрана на телефоне (Zero-элемент «Галерея» в блоке rec3979597401).
   Слайдер Тильды прячется, на его месте — своя галерея в том же языке, что превью
   проектов на десктопе:
     • вертикальная лента: кадр уезжает вверх, следующее фото «дотягивается» из приближения;
     • появление после прелоадера — раскрытие шторкой снизу, фото оседает из увеличения;
     • полоса прогресса и счётчик, свайп влево/вправо, лёгкий параллакс при прокрутке;
     • вне экрана и в фоновой вкладке — пауза.
   Фото берутся из галереи Тильды (добавляйте их там). Если фото меньше MIN_SLIDES,
   добавляются обложки проектов из репозитория.
   Стили — css/hero-gallery.css. */
(function () {
  /* ================= НАСТРОЙКИ ================= */
  var REC_ID    = 'rec3979597401';
  var INTERVAL  = 3200;   // мс: сколько стоит каждый кадр
  var MIN_SLIDES = 4;     // если в Тильде фото меньше — добавляем обложки
  var EXTRA = [           // обложки из репозитория (Rosi и Black Sable уже есть в Тильде)
    { file: 'img/covers/sure.webp',          alt: 'Sure' },
    { file: 'img/covers/kara-fox.webp',      alt: 'Kara Fox' },
    { file: 'img/covers/arine-atelier.webp', alt: 'Arine Atelier' }
  ];
  var PARALLAX  = 0.12;   // сила параллакса при прокрутке (0 — без него)
  var REVEAL_DELAY = 700; // мс после ухода прелоадера до раскрытия
  /* ============================================= */

  var REPO = 'UlyanaNechipor/uma_studio';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function esc(s) { return String(s || '').replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }

  // картинка Тильды через её CDN-оптимизатор: WebP шириной 1200 вместо исходного PNG
  function tildaSrc(url) {
    var m = String(url).match(/^https?:\/\/static\.tildacdn\.[a-z]+\/(tild[\w-]+)\/(.+)$/);
    return m ? 'https://optim.tildacdn.com/' + m[1] + '/-/resize/1200x/-/format/webp/' + m[2] + '.webp' : url;
  }
  function repoSrc(path) {
    var U = window.UMA || {};
    var ref = U.ref || 'main', v = U.version ? '?v=' + encodeURIComponent(U.version) : '';
    return { src: 'https://cdn.jsdelivr.net/gh/' + REPO + '@' + ref + '/' + path + v,
             raw: 'https://raw.githubusercontent.com/' + REPO + '/' + ref + '/' + path + v };
  }

  function findHost() {
    var rec = document.getElementById(REC_ID);
    if (!rec) return null;
    var els = rec.querySelectorAll('.t396__elem[data-elem-type="gallery"]');
    for (var i = 0; i < els.length; i++) {
      var r = els[i].getBoundingClientRect();
      if (r.width > 0 && r.height > 0) return els[i];
    }
    return null;
  }

  function slidesFor(host) {
    var list = [];
    try {
      JSON.parse(host.getAttribute('data-field-imgs-value') || '[]').forEach(function (it) {
        if (it.li_img) list.push({ src: tildaSrc(it.li_img), raw: it.li_img, alt: it.li_imgalt || '' });
      });
    } catch (e) {}
    for (var k = 0; list.length < MIN_SLIDES && k < EXTRA.length; k++) {
      var s = repoSrc(EXTRA[k].file);
      list.push({ src: s.src, raw: s.raw, alt: EXTRA[k].alt });
    }
    return list;
  }

  function build(host) {
    if (host.__umaHg) return;
    var slides = slidesFor(host);
    if (slides.length < 2) return;
    host.__umaHg = true;
    host.classList.add('uma-hg-host');

    // последняя ячейка — копия первой: из конца в начало лента едет дальше, а не назад
    var cells = slides.concat([slides[0]]).map(function (s, i) {
      return '<div class="uma-hg__slide">' +
        '<img alt="' + esc(s.alt) + '" decoding="async"' + (i < 2 ? '' : ' loading="lazy"') +
        ' src="' + esc(s.src) + '" data-raw="' + esc(s.raw) + '"' + (i === slides.length ? ' aria-hidden="true"' : '') + '>' +
        '</div>';
    }).join('');

    var box = document.createElement('div');
    box.className = 'uma-hg' + (reduce ? ' is-reduced' : '');
    box.setAttribute('role', 'region');
    box.setAttribute('aria-roledescription', 'галерея');
    box.setAttribute('aria-label', 'Работы студии');
    box.innerHTML =
      '<div class="uma-hg__frame"><div class="uma-hg__strip">' + cells + '</div></div>' +
      '<div class="uma-hg__ui" aria-hidden="true">' +
        '<span class="uma-hg__count"><b>01</b>/' + pad(slides.length) + '</span>' +
        '<span class="uma-hg__bar"><i></i></span>' +
      '</div>';
    host.appendChild(box);

    var strip = box.querySelector('.uma-hg__strip');
    var cellsEl = box.querySelectorAll('.uma-hg__slide');
    var countEl = box.querySelector('.uma-hg__count b');
    var bar = box.querySelector('.uma-hg__bar i');
    var n = slides.length, i = 0, timer = null, visible = true, shown = false, busy = false;

    // запасной адрес картинки, если CDN не ответил
    box.querySelectorAll('img').forEach(function (img) {
      img.addEventListener('error', function () {
        var raw = img.getAttribute('data-raw');
        if (raw && img.src !== raw) img.src = raw;
      });
    });

    function mark(k) {
      for (var c = 0; c < cellsEl.length; c++) cellsEl[c].classList.toggle('is-active', c === k);
    }
    function restartBar() {
      bar.style.animation = 'none';
      bar.offsetWidth;                      // перезапуск полосы прогресса
      bar.style.animation = '';
      bar.style.animationDuration = INTERVAL + 'ms';
    }
    function go(k, jump) {
      if (busy && !jump) return;
      i = k;
      strip.style.transition = jump ? 'none' : '';
      strip.style.transform = 'translate3d(0,' + (-100 * i) + '%,0)';
      mark(i);
      countEl.textContent = pad((i % n) + 1);
      if (!jump) {
        busy = true;
        restartBar();
        // страховка: если transitionend не придёт (фоновая вкладка), лента не застрянет
        clearTimeout(settleT);
        settleT = setTimeout(settle, 1400);
      }
    }
    // после прокрутки до копии первого кадра — незаметно возвращаемся в начало
    var settleT = null;
    function settle() {
      clearTimeout(settleT);
      if (!busy) return;
      busy = false;
      if (i === n) {
        go(0, true);
        strip.offsetHeight;
        strip.style.transition = '';
      }
    }
    strip.addEventListener('transitionend', function (e) { if (e.target === strip) settle(); });
    function next() { if (i < n) go(i + 1); }
    function prev() {
      if (i === 0) { go(n, true); strip.offsetHeight; strip.style.transition = ''; }
      go(i - 1);
    }
    function schedule() {
      clearTimeout(timer);
      if (!shown || !visible || document.hidden) return;
      timer = setTimeout(function () { next(); schedule(); }, INTERVAL);
    }

    // свайп влево/вправо
    var sx = 0, sy = 0, t0 = 0;
    box.addEventListener('touchstart', function (e) {
      var t = e.touches[0]; sx = t.clientX; sy = t.clientY; t0 = Date.now();
    }, { passive: true });
    box.addEventListener('touchend', function (e) {
      var t = e.changedTouches[0], dx = t.clientX - sx, dy = t.clientY - sy;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.3 && Date.now() - t0 < 800) {
        if (dx < 0) next(); else prev();
        schedule();
      }
    }, { passive: true });

    // пауза вне экрана и в фоновой вкладке
    if (window.IntersectionObserver) {
      new IntersectionObserver(function (es) {
        visible = es[0].isIntersecting;
        box.classList.toggle('is-paused', !visible);
        schedule();
      }, { threshold: 0.15 }).observe(box);
    }
    document.addEventListener('visibilitychange', schedule);

    // параллакс: фото внутри кадра чуть отстаёт от прокрутки
    if (PARALLAX && !reduce) {
      var pending = false;
      var onScroll = function () {
        if (pending) return;
        pending = true;
        requestAnimationFrame(function () {
          pending = false;
          var r = box.getBoundingClientRect(), vh = window.innerHeight;
          if (r.bottom < 0 || r.top > vh) return;
          var p = ((r.top + r.height / 2) - vh / 2) / vh;          // -0.5 … 0.5
          box.style.setProperty('--hg-par', (p * PARALLAX * r.height).toFixed(1) + 'px');
        });
      };
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
    }

    go(0, true);
    strip.offsetHeight;
    strip.style.transition = '';

    // раскрытие: после прелоадера (или сразу, если его нет)
    function reveal() {
      if (shown) return;
      shown = true;
      setTimeout(function () {
        box.classList.add('is-in');
        restartBar();
        schedule();
      }, REVEAL_DELAY);
    }
    var pre = document.getElementById('custom-preloader');
    if (!pre || pre.classList.contains('completed')) reveal();
    else {
      new MutationObserver(function (_, mo) {
        if (pre.classList.contains('completed')) { mo.disconnect(); reveal(); }
      }).observe(pre, { attributes: true, attributeFilter: ['class'] });
      setTimeout(reveal, 9000);   // страховка
    }
  }

  function init() {
    var host = findHost();
    if (host) build(host);
  }

  // Zero-блоки Тильда раскладывает не сразу; на смене ширины галерея может появиться
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(init, 0); });
  else setTimeout(init, 0);
  window.addEventListener('load', init);
  var rt;
  window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(init, 250); });
})();
