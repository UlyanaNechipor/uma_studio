/* UMA · mobile-header
   Мобильная шапка (уже BP px), одна строка высотой прежней шапки:
   слева логотип WORKING TITLE кеглем пунктов меню, справа кнопки Проекты, О нас,
   Контакты и переключатель темы с отступом NAV_GAP между ними.
   • Прелоадер на телефоне: логотип в одну строку во всю ширину; после загрузки он
     прилетает в шапку по центру.
   • Пункты меню Тильды скрыты; новые ссылки нажимают исходные кнопки Тильды,
     поэтому прокрутка к блокам работает как раньше.
   • Переключатель темы — тот же (из js/theme-toggle.js), переставлен в четвёртую колонку.
   Стили — css/mobile-header.css. */
(function () {
  /* ================= НАСТРОЙКИ ================= */
  var BP     = 768;    // px: уже — мобильная шапка
  var M      = 16;     // px: поля сайта слева и справа
  var FONT   = 12;     // px: кегль пунктов меню; логотип в шапке — того же кегля
  var NAV_GAP= 4;      // px: между кнопками меню
  var BTN_H  = 24;     // px: высота кнопок меню и переключателя
  var BASE_H = 60;     // px: высота прежней шапки Тильды — шапка остаётся такой же
  /* ============================================= */

  var HEADER = 'rec3979597301';
  var root = document.documentElement;
  var wrap = document.getElementById('uma-logo-wrap');
  var row = null, home = null;

  function isMobile() { return window.innerWidth < BP; }

  // логотип в одну строку и рамка по границам текста
  function singleLine() {
    if (!wrap) return 0;
    var words = ['WORKING', 'TITLE'];
    var ratio = 0;
    wrap.querySelectorAll('svg').forEach(function (svg) {
      var t = svg.querySelector('text');
      if (!t) return;
      if (t.getAttribute('data-mh') !== '1') {
        t.setAttribute('x', '50%'); t.setAttribute('y', '50%');
        t.setAttribute('text-anchor', 'middle'); t.setAttribute('dominant-baseline', 'central');
        t.innerHTML = '<tspan class="logo-w1">' + words[0] + '</tspan><tspan class="logo-w2" dx="26">' + words[1] + '</tspan>';
        t.setAttribute('data-mh', '1');
      }
    });
    var t0 = wrap.querySelector('.logo-bg-text'), bb = null;
    try { bb = t0.getBBox(); } catch (e) {}
    if (!bb || !bb.width) return 0;
    var x0 = Math.floor(bb.x - 10), w = Math.ceil(bb.width + 20);
    wrap.querySelectorAll('svg').forEach(function (s) { s.setAttribute('viewBox', x0 + ' 0 ' + w + ' 100'); });
    wrap.classList.remove('is-stacked');
    wrap.classList.add('is-mcenter');
    return 100 / w;   // высота к ширине
  }

  function navButtons() {
    var rec = document.getElementById(HEADER);
    if (!rec) return {};
    var out = {};
    rec.querySelectorAll('.t396__elem[data-elem-type="button"] a[href]').forEach(function (a) {
      out[a.getAttribute('href')] = a;
    });
    out.logo = rec.querySelector('a[href="#logo"]');
    return out;
  }

  function build() {
    var rec = document.getElementById(HEADER);
    var ab = rec && rec.querySelector('.t396__artboard');
    if (!ab || row) return;
    var nav = navButtons();
    row = document.createElement('nav');
    row.className = 'uma-mh';
    row.setAttribute('aria-label', 'Меню');
    [['#projects', 'Проекты'], ['#about', 'О нас'], ['#contacts', 'Контакты']].forEach(function (it) {
      var a = document.createElement('a');
      a.className = 'uma-mh__link';
      a.href = it[0];
      a.textContent = it[1];
      a.addEventListener('click', function (e) {
        var orig = navButtons()[it[0]];
        if (orig) { e.preventDefault(); orig.click(); }
      });
      row.appendChild(a);
    });
    ab.appendChild(row);
    placeToggle();
    // логотип — ссылка «наверх», как прежняя область логотипа в Тильде
    home = document.createElement('a');
    home.className = 'uma-mh__home';
    home.href = '#logo';
    home.setAttribute('aria-label', 'Working Title — наверх');
    home.addEventListener('click', function (e) {
      var orig = navButtons().logo;
      e.preventDefault();
      if (orig) orig.click(); else window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    ab.appendChild(home);
  }

  // переключатель темы (создаёт js/theme-toggle.js) — последним элементом строки меню
  function placeToggle() {
    var btn = document.querySelector('.theme-toggle-btn');
    if (!btn || !row) return;
    if (btn.parentNode !== row) row.appendChild(btn);
  }
  function restoreToggle() {
    var btn = document.querySelector('.theme-toggle-btn');
    var ab = document.querySelector('#' + HEADER + ' .t396__artboard');
    if (btn && ab && row && btn.parentNode === row) ab.appendChild(btn);
  }

  function apply() {
    if (!isMobile()) { root.classList.remove('uma-mh-on'); if (wrap) wrap.classList.remove('is-mcenter'); restoreToggle(); return; }
    var vw = document.documentElement.clientWidth || window.innerWidth;
    var k = singleLine() || 0.12;
    var ab = document.querySelector('#' + HEADER + ' .t396__artboard');
    var h = (ab && ab.getBoundingClientRect().height) || BASE_H;   // высота шапки Тильды как есть
    var s = root.style;
    function set(font, padX) {
      // рамка логотипа 100 единиц по высоте при кегле 112 → размер при кегле font
      var logoH = font * 100 / 112, logoW = logoH / k;
      s.setProperty('--mh-h', h.toFixed(1) + 'px');
      s.setProperty('--mh-logo-y', (h / 2).toFixed(1) + 'px');
      s.setProperty('--mh-logo-h', logoH.toFixed(1) + 'px');
      s.setProperty('--mh-logo-w', logoW.toFixed(1) + 'px');
      s.setProperty('--mh-font', font + 'px');
      s.setProperty('--mh-pad-x', padX + 'px');
      s.setProperty('--mh-gap', NAV_GAP + 'px');
      s.setProperty('--mh-btn-h', BTN_H + 'px');
      s.setProperty('--mh-m', M + 'px');
      return logoW;
    }
    var logoW = set(FONT, 8);
    root.classList.add('uma-mh-on');
    build();
    placeToggle();
    // узкий экран: если кнопки подходят к логотипу ближе 12 px — кегль 11 и поля кнопок меньше
    var rr = row && row.getBoundingClientRect();
    if (rr && rr.left < M + logoW + 12) {
      logoW = set(FONT - 1, 6);
      rr = row.getBoundingClientRect();
      if (rr.left < M + logoW + 12) set(FONT - 1, 4);
    }
  }

  apply();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(apply);
  window.addEventListener('load', apply);
  // вставка Тильды пересчитывает логотип при вылете и на смену размера — пересчитываем после неё
  var pre = document.getElementById('custom-preloader');
  if (pre && window.MutationObserver) {
    new MutationObserver(function () { if (pre.classList.contains('completed')) apply(); })
      .observe(pre, { attributes: true, attributeFilter: ['class'] });
  }
  var tm = 0;
  window.addEventListener('resize', function () { clearTimeout(tm); tm = setTimeout(apply, 260); });
})();
