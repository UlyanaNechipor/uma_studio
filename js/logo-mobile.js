/* UMA · logo-mobile (тест)
   Телефон: переключатель темы стандартного размера 16 × 16, логотип выверен по нему —
   высота заглавных букв логотипа = высоте кнопки (16 px), середина букв — на середине кнопки.
   Если при такой высоте логотип наезжает на меню, он уменьшается ровно до отступа GAP.
   Левый край букв — по полю сетки Тильды. Пока это проверка до переноса во вставку Тильды. */
(function () {
  var BP = 768, BTN = 16, GAP = 12, CAP = 0.72;   // CAP — высота заглавных Manrope в долях кегля
  var wrap = document.getElementById('uma-logo-wrap');
  if (!wrap) return;

  function navLeft(rec) {
    var left = Infinity;
    rec.querySelectorAll('.t396__elem[data-elem-type="button"]').forEach(function (e) {
      var r = e.getBoundingClientRect();
      if (r.width && r.left > 40) left = Math.min(left, r.left);
    });
    return left;
  }

  function apply() {
    var on = window.innerWidth < BP;
    document.documentElement.classList.toggle('uma-logo16', on);
    if (!on) return;
    var rec = document.getElementById('rec3979597301');
    var btn = document.querySelector('.theme-toggle-btn');
    var svg = wrap.querySelector('svg');
    if (!rec || !btn || !svg) return;
    var vb = (svg.getAttribute('viewBox') || '').split(/\s+/).map(Number);
    var w = vb[2], h = vb[3] || 100;
    if (!w) return;
    var b = btn.getBoundingClientRect();
    // zoom Тильды по элементу шапки
    var any = rec.querySelector('.t396__elem[data-elem-type="button"]');
    var zoom = any ? any.getBoundingClientRect().width / (any.offsetWidth || 1) : 1;
    var grid = 16 * (zoom || 1);
    // кегль, при котором заглавные = BTN px; ширина рамки логотипа при этом кегле
    var font = BTN / CAP;
    var width = font * w / 112;
    var room = navLeft(rec) - grid - GAP;
    if (room < Infinity && width > room) width = room;
    var PAD = 10;
    wrap.style.setProperty('--pl-mw', width.toFixed(1) + 'px');
    wrap.style.setProperty('--pl-my', (b.top + b.height / 2).toFixed(1) + 'px');
    wrap.style.setProperty('--pl-mx', (grid - PAD * width / w).toFixed(1) + 'px');
    // середина заглавных: базовая линия 90, заглавные 0.72 × 112 ≈ 81 → середина ≈ 49.7 из 100
    wrap.setAttribute('data-l16', [Math.round(width), Math.round(font * width / (BTN / CAP * w / 112) * CAP)].join('/'));
  }

  apply();
  window.addEventListener('load', apply);
  var pre = document.getElementById('custom-preloader');
  if (pre && window.MutationObserver) {
    new MutationObserver(function () { if (pre.classList.contains('completed')) apply(); })
      .observe(pre, { attributes: true, attributeFilter: ['class'] });
  }
  var tm = 0, lw = window.innerWidth;
  window.addEventListener('resize', function () {
    if (window.innerWidth === lw) return;
    lw = window.innerWidth; clearTimeout(tm); tm = setTimeout(apply, 300);
  });
})();
