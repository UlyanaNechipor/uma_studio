/* UMA · mobile-header
   Мобильная шапка (уже BP px): по центру сверху логотип WORKING TITLE шириной ~70% экрана,
   строкой ниже — четыре равные колонки по сетке сайта: Проекты, О нас, Контакты и переключатель темы.
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
  var GAP    = 8;      // px: между колонками
  var LOGO_W = 0.7;    // доля ширины экрана под логотип
  var TOP    = 14;     // px: от верха экрана до логотипа
  var ROW_GAP= 10;     // px: между логотипом и строкой меню
  var ROW_H  = 32;     // px: высота строки меню
  var BOTTOM = 10;     // px: под строкой меню
  var BASE_H = 60;     // px: высота прежней шапки Тильды (её отступ уже заложен в первый блок)
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

  function apply() {
    if (!isMobile()) { root.classList.remove('uma-mh-on'); if (wrap) wrap.classList.remove('is-mcenter'); return; }
    var vw = document.documentElement.clientWidth || window.innerWidth;
    var k = singleLine() || 0.12;
    var logoW = vw * LOGO_W, logoH = logoW * k;
    var rowY = TOP + logoH + ROW_GAP;
    var h = Math.round(rowY + ROW_H + BOTTOM);
    var col = (vw - 2 * M - 3 * GAP) / 4;
    var s = root.style;
    s.setProperty('--mh-h', h + 'px');
    s.setProperty('--mh-pad', Math.max(0, h - BASE_H) + 'px');
    s.setProperty('--mh-logo-y', (TOP + logoH / 2).toFixed(1) + 'px');
    s.setProperty('--mh-logo-h', logoH.toFixed(1) + 'px');
    s.setProperty('--mh-top', TOP + 'px');
    s.setProperty('--mh-row-y', rowY.toFixed(1) + 'px');
    s.setProperty('--mh-row-h', ROW_H + 'px');
    s.setProperty('--mh-m', M + 'px');
    s.setProperty('--mh-gap', GAP + 'px');
    s.setProperty('--mh-col', col.toFixed(2) + 'px');
    root.classList.add('uma-mh-on');
    build();
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
