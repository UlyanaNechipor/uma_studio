/* UMA · logo-mobile (тест)
   Телефон: переключатель темы 24 × 24, логотип выровнен по нему —
   середина букв логотипа на середине кнопки. Размер логотипа прежний (кеглем меню,
   его задаёт вставка Тильды). Пока это проверка до переноса во вставку. */
(function () {
  var BP = 768;
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
    // середина заглавных букв в рамке логотипа ≈ середина рамки → центр рамки на центр кнопки
    wrap.style.setProperty('--pl-my', (b.top + b.height / 2).toFixed(1) + 'px');
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
