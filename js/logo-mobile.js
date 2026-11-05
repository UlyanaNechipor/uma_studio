/* UMA · logo-mobile (тест)
   Телефон: переключатель темы 24 × 24, логотип выверен по нему:
   высота заглавных букв = высоте кнопки, середина букв — на середине кнопки,
   левый край букв — по полю сетки Тильды. Пока это проверка до переноса во вставку. */
(function () {
  var BP = 768;
  var CAP = 0.806;   // высота заглавных Manrope в долях высоты рамки логотипа (0.72 × 112 / 100)
  var PAD = 10;      // запас рамки слева, в единицах viewBox
  var wrap = document.getElementById('uma-logo-wrap');
  if (!wrap) return;

  function apply() {
    var on = window.innerWidth < BP;
    document.documentElement.classList.toggle('uma-logo24', on);
    if (!on) return;
    var btn = document.querySelector('.theme-toggle-btn');
    if (!btn) return;
    var b = btn.getBoundingClientRect();
    if (!b.height) return;
    var svg = wrap.querySelector('svg');
    var vb = svg ? (svg.getAttribute('viewBox') || '').split(/\s+/).map(Number) : [];
    var w = vb[2], h = vb[3] || 100;
    if (!w) return;
    // рамка такой высоты, чтобы заглавные были ровно как кнопка; её ширина
    var frameH = b.height / CAP, width = frameH * w / h;
    var rec = document.getElementById('rec3979597301');
    var any = rec && rec.querySelector('.t396__elem[data-elem-type="button"]');
    var zoom = any ? any.getBoundingClientRect().width / (any.offsetWidth || 1) : 1;
    wrap.style.setProperty('--pl-mw', width.toFixed(1) + 'px');
    // середина заглавных букв ≈ середина рамки → центр рамки на центр кнопки
    wrap.style.setProperty('--pl-my', (b.top + b.height / 2).toFixed(1) + 'px');
    wrap.style.setProperty('--pl-mx', (16 * (zoom || 1) - PAD * width / w).toFixed(1) + 'px');
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
