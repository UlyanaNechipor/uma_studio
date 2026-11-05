/* UMA · site-header
   Шапка сайта кодом (вместо Zero-блока rec3979597301).
   Вставляется в <div id="uma-header-mount"></div>; если такого блока нет — в начало страницы.
   • Слева логотип WORKING TITLE (WORKING плотнее, TITLE тоньше) тем же кеглем, что пункты меню.
   • Пункты «Проекты», «О нас», «Контакты» — плавная прокрутка к якорям Тильды с учётом высоты шапки.
   • Справа переключатель темы (создаёт js/theme-toggle.js): рамка 24 px, луна/солнце чуть меньше.
   • Прелоадер из вставки Тильды улетает точно на место логотипа шапки, после чего логотип
     шапки показывается, а летевший прячется — шапка дальше живёт как обычный элемент страницы.
   Размеры масштабируются как Zero-блоки: от ширины 1200 на компьютере и 320 на телефоне.
   Стили — css/site-header.css. */
(function () {
  /* ================= НАСТРОЙКИ ================= */
  var LINKS = [
    ['projects', 'Проекты'],
    ['about',    'О нас'],
    ['contacts', 'Контакты']
  ];
  var WORDS = ['WORKING', 'TITLE'];
  var BP    = 768;      // px: уже — мобильная раскладка
  var FLY   = 1500;     // мс: длительность вылета логотипа из прелоадера (во вставке 1.4 с)
  /* ============================================= */

  var root = document.documentElement;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hd = null, logo = null;

  function build() {
    if (document.getElementById('uma-header')) return;
    hd = document.createElement('header');
    hd.className = 'uma-hd';
    hd.id = 'uma-header';
    hd.innerHTML =
      '<a class="uma-hd__logo" href="#top" aria-label="Working Title — наверх">' +
        '<b>' + WORDS[0] + '</b> ' + WORDS[1] + '</a>' +
      '<nav class="uma-hd__nav" aria-label="Меню">' +
        LINKS.map(function (l, i) {
          return '<a class="uma-hd__link uma-hd__link--' + (i + 1) + '" href="#' + l[0] + '">' + l[1] + '</a>';
        }).join('') +
      '</nav>' +
      '<div class="uma-hd__toggle"></div>';
    var mount = document.getElementById('uma-header-mount');
    if (mount) mount.appendChild(hd); else document.body.insertBefore(hd, document.body.firstChild);
    logo = hd.querySelector('.uma-hd__logo');
    root.classList.add('uma-hd-on');

    hd.addEventListener('click', function (e) {
      var a = e.target.closest('a');
      if (!a) return;
      var id = a.getAttribute('href').slice(1);
      e.preventDefault();
      if (id === 'top') return go(0);
      var t = document.querySelector('a[name="' + id + '"], #' + id);
      if (t) go(t.getBoundingClientRect().top + window.pageYOffset - hd.getBoundingClientRect().height);
      else location.hash = id;
    });
    moveToggle();
  }

  function go(y) { window.scrollTo({ top: Math.max(0, y), behavior: reduce ? 'auto' : 'smooth' }); }

  // переключатель темы — в шапку (если он уже создан; иначе его положит туда js/theme-toggle.js)
  function moveToggle() {
    var slot = hd && hd.querySelector('.uma-hd__toggle');
    var btn = document.querySelector('.theme-toggle-btn');
    if (slot && btn && btn.parentNode !== slot) slot.appendChild(btn);
  }

  /* ---------- прелоадер: вылет точно на логотип шапки ---------- */
  function baseline(el) {
    var probe = document.createElement('span');
    probe.style.cssText = 'display:inline-block;width:0;height:0;vertical-align:baseline;';
    el.appendChild(probe);
    var y = probe.getBoundingClientRect().top;
    el.removeChild(probe);
    return y;
  }
  function aim() {
    var wrap = document.getElementById('uma-logo-wrap');
    if (!wrap || !logo) return;
    var svg = wrap.querySelector('svg');
    var vb = svg ? (svg.getAttribute('viewBox') || '').split(/\s+/).map(Number) : [];
    var w = vb[2], h = vb[3] || 100;
    if (!w) return;
    var PAD = 10, BASE_Y = 0.9;               // как во вставке: запас рамки и базовая линия (90 из 100)
    var r = document.createRange();
    r.selectNodeContents(logo);
    var rr = r.getBoundingClientRect();
    if (!rr.width) return;
    var cw = rr.width * w / (w - 2 * PAD);    // ширина рамки, при которой буквы = логотипу шапки
    var ch = cw * h / w;
    var left = rr.left - PAD * cw / w;
    var cy = baseline(logo) - (BASE_Y - 0.5) * ch;
    root.style.setProperty('--hd-pl-x', left.toFixed(1) + 'px');
    root.style.setProperty('--hd-pl-y', cy.toFixed(1) + 'px');
    root.style.setProperty('--hd-pl-w', cw.toFixed(1) + 'px');
    root.classList.add('uma-hd-fly');
  }

  function handoff() { root.classList.add('uma-hd-logo-on'); }

  function watchPreloader() {
    var pre = document.getElementById('custom-preloader');
    if (!pre) return handoff();
    if (pre.classList.contains('completed')) { aim(); return handoff(); }
    aim();
    var done = false;
    new MutationObserver(function () {
      if (done || !pre.classList.contains('completed')) return;
      done = true;
      aim();
      setTimeout(handoff, FLY);
    }).observe(pre, { attributes: true, attributeFilter: ['class'] });
    setTimeout(function () { if (!done) handoff(); }, 12000);   // страховка
  }

  function boot() {
    build();
    watchPreloader();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(aim);
    // переключатель может появиться позже нас
    if (window.MutationObserver) {
      var mo = new MutationObserver(moveToggle);
      mo.observe(document.body, { childList: true, subtree: true });
      setTimeout(function () { mo.disconnect(); }, 8000);
    }
    var tm = 0, lw = window.innerWidth;
    window.addEventListener('resize', function () {
      if (window.innerWidth === lw) return;
      lw = window.innerWidth; clearTimeout(tm); tm = setTimeout(aim, 200);
    });
  }

  window.umaHeaderHeight = function () {
    var el = document.getElementById('uma-header');
    return el ? el.getBoundingClientRect().height : 0;
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
