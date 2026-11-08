/* UMA · hero-gallery
   Галерея первого экрана (Zero-элемент «Галерея» в блоке rec3979597401) —
   на телефоне и на десктопе. Слайдер Тильды прячется, на его месте — своя галерея
   в том же языке, что превью проектов:
     • вертикальная лента: кадр уезжает вверх, следующее фото «дотягивается» из приближения;
     • появление после прелоадера — раскрытие шторкой снизу, фото оседает из увеличения;
     • в правом нижнем углу — только кнопка паузы (две полоски ↔ треугольник); вне экрана — пауза.
   Только телефон: свайп влево/вправо, параллакс при прокрутке.
   Только с мышью: стрелки клавиатуры, когда галерея в фокусе.
   Фото берутся из галереи Тильды (добавляйте их там). Если фото меньше MIN_SLIDES,
   добавляются обложки проектов из репозитория (img/gallery, 1200 и 2400 px).
   Стили — css/hero-gallery.css. */
(function () {
  /* ================= НАСТРОЙКИ ================= */
  var REC_ID     = 'rec3979597401';
  var INTERVAL   = 2800;  // мс: сколько стоит каждый кадр
  var MIN_SLIDES = 5;     // если в Тильде фото меньше — добавляем обложки (Arine — мокапом из FIRST)
  var EXTRA = [           // Rosi и Black Sable уже есть в галерее Тильды
    { name: 'sure',          title: 'Sure' },
    { name: 'kara-fox-mockup', title: 'Kara Fox' }
  ];
  // фото из галереи Тильды, которые подменяются файлами из репозитория (img/gallery)
  var REPLACE = [
    { match: /rosi/i, name: 'rosi', title: 'Rosi', big: 1536 }
  ];
  // первыми в очереди — эти кадры из репозитория (img/gallery/<name>-1200.webp и -2400.webp)
  var FIRST = [
    { name: 'arine-mockup', title: 'Arine Atelier' }
  ];
  var PARALLAX     = 0;     // телефон: параллакс при прокрутке (0 — без него). Выключен: сдвиг фото при прокрутке
                            // шёл через ту же плавную анимацию, что и смена кадра, и перелистывание
                            // на телефоне выглядело иначе, чем на десктопе
  var REVEAL_DELAY = 1250;   // мс после ухода прелоадера до раскрытия
  /* ============================================= */

  var REPO = 'UlyanaNechipor/uma_studio';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var mouse  = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  function esc(s) { return String(s || '').replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }

  // картинка Тильды через её CDN-оптимизатор: WebP вместо исходного PNG
  function tilda(url) {
    var m = String(url).match(/^https?:\/\/static\.tildacdn\.[a-z]+\/(tild[\w-]+)\/(.+)$/);
    if (!m) return { src: url, srcset: '' };
    var base = 'https://optim.tildacdn.com/' + m[1];
    return {
      src: base + '/-/resize/1200x/-/format/webp/' + m[2] + '.webp',
      srcset: base + '/-/resize/1200x/-/format/webp/' + m[2] + '.webp 1200w, ' +
              base + '/-/format/webp/' + m[2] + '.webp 2000w'
    };
  }
  // название проекта из имени файла Тильды: «__Black_Sable.png» → «Black Sable»
  function titleFromFile(url) {
    var f = decodeURIComponent(String(url).split('/').pop() || '').replace(/\.[a-z0-9]+$/i, '');
    return f.replace(/[_-]+/g, ' ').replace(/\s\d+$/, '').trim();
  }
  function repo(path) {
    var U = window.UMA || {};
    // загрузчик взял код по точному коммиту (jsDelivr @sha) — картинки оттуда же: по имени ветки
    // jsDelivr может часами отдавать старый коммит, где новых файлов ещё нет
    var m = String(U.base || '').match(/@([0-9a-f]{40})\//);
    var ref = m ? m[1] : (U.ref || 'main'), v = U.version && !m ? '?v=' + encodeURIComponent(U.version) : '';
    return 'https://cdn.jsdelivr.net/gh/' + REPO + '@' + ref + '/' + path + v;
  }
  function repoRaw(path) {
    var U = window.UMA || {};
    return 'https://raw.githubusercontent.com/' + REPO + '/' + (U.ref || 'main') + '/' + path;
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
        if (!it.li_img) return;
        var title = it.li_imgtitle || titleFromFile(it.li_img);
        var rep = null;
        for (var r = 0; r < REPLACE.length; r++) {
          if (REPLACE[r].match.test(title) || REPLACE[r].match.test(it.li_img)) rep = REPLACE[r];
        }
        if (rep) {
          var rp = 'img/gallery/' + rep.name;
          list.push({ src: repo(rp + '-1200.webp'),
                      srcset: repo(rp + '-1200.webp') + ' 1200w, ' + repo(rp + '-' + rep.big + '.webp') + ' ' + rep.big + 'w',
                      raw: repoRaw(rp + '-1200.webp'), title: rep.title, alt: it.li_imgalt || rep.title });
          return;
        }
        var t = tilda(it.li_img);
        list.push({ src: t.src, srcset: t.srcset, raw: it.li_img, title: title, alt: it.li_imgalt || '' });
      });
    } catch (e) {}
    for (var f = FIRST.length - 1; f >= 0; f--) {
      var fp = 'img/gallery/' + FIRST[f].name;
      list.unshift({ src: repo(fp + '-1200.webp'),
                     srcset: repo(fp + '-1200.webp') + ' 1200w, ' + repo(fp + '-2400.webp') + ' 2400w',
                     raw: repoRaw(fp + '-1200.webp'), title: FIRST[f].title, alt: FIRST[f].title });
    }
    for (var k = 0; list.length < MIN_SLIDES && k < EXTRA.length; k++) {
      var p = 'img/gallery/' + EXTRA[k].name;
      list.push({ src: repo(p + '-1200.webp'),
                  srcset: repo(p + '-1200.webp') + ' 1200w, ' + repo(p + '-2400.webp') + ' 2400w',
                  raw: repoRaw(p + '-1200.webp'), title: EXTRA[k].title, alt: EXTRA[k].title });
    }
    return list;
  }

  function build(host) {
    if (host.__umaHg) return;
    var slides = slidesFor(host);
    if (slides.length < 2) return;
    host.__umaHg = true;
    host.classList.add('uma-hg-host');

    var w = Math.round(host.getBoundingClientRect().width) || 1200;
    // последняя ячейка — копия первой: из конца в начало лента едет дальше, а не назад
    var cells = slides.concat([slides[0]]).map(function (s, i) {
      return '<div class="uma-hg__slide">' +
        '<img alt="' + esc(s.alt || s.title) + '" decoding="async"' + (i < 2 ? '' : ' loading="lazy"') +
        ' src="' + esc(s.src) + '"' + (s.srcset ? ' srcset="' + esc(s.srcset) + '" sizes="' + w + 'px"' : '') +
        ' data-raw="' + esc(s.raw) + '"' + (i === slides.length ? ' aria-hidden="true"' : '') + '>' +
        '</div>';
    }).join('');

    var box = document.createElement('div');
    box.className = 'uma-hg' + (reduce ? ' is-reduced' : '') + (mouse ? ' is-mouse' : ' is-touch');
    box.setAttribute('role', 'region');
    box.setAttribute('aria-roledescription', 'галерея');
    box.setAttribute('aria-label', 'Работы студии');
    if (mouse) box.tabIndex = 0;
    box.innerHTML =
      '<div class="uma-hg__frame"><div class="uma-hg__strip">' + cells + '</div></div>' +
      '<button type="button" class="uma-hg__pause" aria-label="Пауза" aria-pressed="false">' +
        '<svg class="uma-hg__ic uma-hg__ic--pause" viewBox="0 0 16 16" aria-hidden="true"><rect x="4" y="3" width="2" height="10" rx=".5"/><rect x="10" y="3" width="2" height="10" rx=".5"/></svg>' +
        '<svg class="uma-hg__ic uma-hg__ic--play" viewBox="0 0 16 16" aria-hidden="true"><path d="M5 3.2v9.6L12.6 8z"/></svg>' +
      '</button>' +
      '<p class="uma-hg__live" aria-live="polite"></p>';
    host.appendChild(box);

    var strip = box.querySelector('.uma-hg__strip');
    var cellsEl = box.querySelectorAll('.uma-hg__slide');
    var pauseBtn = box.querySelector('.uma-hg__pause');
    var live = box.querySelector('.uma-hg__live');
    var n = slides.length, i = 0, timer = null, visible = true, shown = false, busy = false, paused = false;

    // запасной адрес картинки, если CDN не ответил
    box.querySelectorAll('img').forEach(function (img) {
      img.addEventListener('error', function () {
        var raw = img.getAttribute('data-raw');
        if (raw && img.src !== raw) { img.removeAttribute('srcset'); img.src = raw; }
      });
    });

    function mark(k) {
      for (var c = 0; c < cellsEl.length; c++) cellsEl[c].classList.toggle('is-active', c === k);
    }
    var settleT = null;
    function go(k, jump) {
      if (busy && !jump) return;
      i = k;
      strip.style.transition = jump ? 'none' : '';
      strip.style.transform = 'translate3d(0,' + (-100 * i) + '%,0)';
      mark(i);
      if (!jump) {
        busy = true;
        live.textContent = slides[i % n].title || '';
        // страховка: если transitionend не придёт (фоновая вкладка), лента не застрянет
        clearTimeout(settleT);
        settleT = setTimeout(settle, 1400);
      }
    }
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

    function next() { if (busy) return; if (i < n) go(i + 1); }
    function prev() {
      if (busy) return;
      if (i === 0) { go(n, true); strip.offsetHeight; strip.style.transition = ''; }
      go(i - 1);
    }
    function schedule() {
      clearTimeout(timer);
      if (!shown || !visible || paused || document.hidden) return;
      timer = setTimeout(function () { next(); schedule(); }, INTERVAL);
    }

    /* ---------- пауза ---------- */
    pauseBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      paused = !paused;
      box.classList.toggle('is-paused', paused);
      pauseBtn.setAttribute('aria-pressed', paused ? 'true' : 'false');
      pauseBtn.setAttribute('aria-label', paused ? 'Продолжить' : 'Пауза');
      if (!paused) { next(); }
      schedule();
    });

    /* ---------- телефон: свайп ---------- */
    if (!mouse) {
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
    }

    /* ---------- клавиатура ---------- */
    if (mouse) {
      box.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight') { e.preventDefault(); next(); schedule(); }
        else if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); schedule(); }
      });
    }

    // пауза вне экрана и в фоновой вкладке
    if (window.IntersectionObserver) {
      new IntersectionObserver(function (es) { visible = es[0].isIntersecting; schedule(); }, { threshold: 0.15 }).observe(box);
    }
    document.addEventListener('visibilitychange', schedule);

    // телефон: фото внутри кадра чуть отстаёт от прокрутки
    if (!mouse && PARALLAX && !reduce) {
      var pending = false;
      var onScroll = function () {
        if (pending) return;
        pending = true;
        requestAnimationFrame(function () {
          pending = false;
          var r = box.getBoundingClientRect(), vh = window.innerHeight;
          if (r.bottom < 0 || r.top > vh) return;
          var p = ((r.top + r.height / 2) - vh / 2) / vh;
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
