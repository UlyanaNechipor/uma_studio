/* UMA · project-grid
   Сетка фото проектов под заголовком «Проекты, в которых мы исследуем…» (rec3979597601).
   1. Качество: Тильда подгружает фоновые картинки пережатыми под размер блока
      (WebP низкого качества, на ретине — мыльно). Здесь каждая картинка берётся
      из исходного файла, который вы загрузили в Тильду, без пережатия.
      Грузится заранее, за ~500 px до появления на экране.
   2. Анимация в духе khasiyev.com:
      • появление: карточка проявляется из размытия и чуть поднимается,
        фото «оседает» из небольшого приближения; соседние — с задержкой;
      • при прокрутке фото внутри карточки слегка смещается (параллакс);
      • с мышью: при наведении фото плавно приближается.
   Стили — css/project-grid.css. */
(function () {
  /* ================= НАСТРОЙКИ ================= */
  var REC_IDS  = ['rec3979597601'];  // блоки, где работает эффект
  var PARALLAX = 0.06;               // доля высоты карточки, на которую смещается фото (0 — без него)
  var STAGGER  = 90;                 // мс между соседними карточками при появлении
  /* ============================================= */

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var cards = [];
  var loadIO = null, showIO = null;

  function setup(atom) {
    if (atom.__umaPj) return;
    var src = atom.getAttribute('data-original');
    if (!src) return;
    atom.__umaPj = true;

    // Тильда больше не подменяет фон своей пережатой версией
    atom.classList.remove('t-bgimg');
    atom.classList.add('uma-pj');
    if (reduce) atom.classList.add('is-reduced');

    var cs = getComputedStyle(atom);
    var par = document.createElement('span');
    par.className = 'uma-pj__par';
    par.setAttribute('aria-hidden', 'true');
    var img = document.createElement('span');
    img.className = 'uma-pj__img';
    // кадрирование — как настроено в Тильде (обычно cover по центру)
    img.style.backgroundSize = (cs.backgroundSize || 'cover').split(',')[0];
    img.style.backgroundPosition = (cs.backgroundPosition || 'center').split(',')[0];
    par.appendChild(img);
    atom.insertBefore(par, atom.firstChild);

    var card = { atom: atom, par: par, img: img, src: src, loaded: false, seen: false, shown: false };
    atom.__umaPjCard = card;
    cards.push(card);

    if (loadIO) loadIO.observe(atom); else load(card);
    if (showIO) showIO.observe(atom); else { card.seen = true; show(card, 0); }
  }

  function load(card) {
    if (card.loading) return;
    card.loading = true;
    var pre = new Image();
    pre.decoding = 'async';
    var done = function () {
      if (card.loaded) return;
      card.loaded = true;
      card.img.style.backgroundImage = 'url("' + card.src.replace(/"/g, '%22') + '")';
      card.atom.classList.add('is-loaded');
      if (card.seen) show(card, card.pendingDelay || 0);
    };
    pre.onload = function () { (pre.decode ? pre.decode() : Promise.resolve()).then(done, done); };
    pre.onerror = done;
    pre.src = card.src;
    setTimeout(done, 6000);   // страховка: медленная сеть — показываем как есть
  }

  function show(card, delay) {
    if (card.shown || !card.loaded) return;
    card.shown = true;
    card.atom.style.setProperty('--pj-delay', (reduce ? 0 : delay) + 'ms');
    card.atom.classList.add('is-in');
  }

  // на каждом кадре прокрутки: параллакс и страховка появления
  // (если IntersectionObserver не сработал, карточка всё равно появится)
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      var vh = window.innerHeight, par = PARALLAX && !reduce;
      for (var k = 0; k < cards.length; k++) {
        var c = cards[k], r = c.atom.getBoundingClientRect();
        if (!r.height) continue;
        if (!c.loaded && r.top < vh + 500 && r.bottom > -500) load(c);
        if (!c.seen && r.top < vh * 0.94 && r.bottom > 0) { c.seen = true; show(c, 0); }
        if (!par || r.bottom < -100 || r.top > vh + 100) continue;
        var p = ((r.top + r.height / 2) - vh / 2) / (vh / 2 + r.height / 2);   // −1…1
        p = Math.max(-1, Math.min(1, p));
        c.par.style.transform = 'translate3d(0,' + (p * PARALLAX * r.height).toFixed(1) + 'px,0)';
      }
    });
  }

  function init() {
    if (window.IntersectionObserver && !loadIO) {
      loadIO = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (e.isIntersecting) { loadIO.unobserve(e.target); load(e.target.__umaPjCard); }
        });
      }, { rootMargin: '500px 0px' });
      showIO = new IntersectionObserver(function (es) {
        // карточки, вошедшие вместе, появляются слева направо и сверху вниз
        var list = es.filter(function (e) { return e.isIntersecting; }).map(function (e) {
          showIO.unobserve(e.target);
          return { c: e.target.__umaPjCard, r: e.boundingClientRect };
        }).sort(function (a, b) { return (a.r.top - b.r.top) * 0.3 + (a.r.left - b.r.left); });
        list.forEach(function (it, n) {
          if (it.c.seen) return;
          it.c.seen = true;
          var d = n * STAGGER;
          if (it.c.loaded) show(it.c, d);
          else it.c.pendingDelay = d;
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    }
    REC_IDS.forEach(function (id) {
      var rec = document.getElementById(id);
      if (!rec) return;
      var atoms = rec.querySelectorAll('.t396__elem[data-elem-type="shape"] .tn-atom[data-original]');
      for (var k = 0; k < atoms.length; k++) setup(atoms[k]);
    });
    onScroll();
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
  window.addEventListener('load', init);
})();
