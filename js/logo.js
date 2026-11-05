/* UMA · logo
   Примерка шрифта логотипа Working Title (прелоадер и шапка — один элемент из вставки Тильды).
   Manrope ExtraBold выглядел рублено; здесь Rubik — тот же геометрический характер,
   но углы букв чуть скруглены. Шрифт качается только для букв названия (параметр text=),
   включается, когда загружен, после чего рамка логотипа заново подгоняется под длину текста.
   Если шрифт понравится, его стоит перенести во вставку Тильды, чтобы не было подмены на лету.
   Стили — css/logo.css. */
(function () {
  /* ================= НАСТРОЙКИ ================= */
  var FAMILY = 'Rubik';
  var WEIGHT = 600;
  var TEXT   = 'WORKING TITLE';
  /* ============================================= */

  var wrap = document.getElementById('uma-logo-wrap');
  if (!wrap) return;

  var link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?family=' + FAMILY + ':wght@' + WEIGHT +
              '&display=block&text=' + encodeURIComponent(TEXT);
  document.head.appendChild(link);

  function fit() {
    var t = wrap.querySelector('.logo-bg-text');
    var len = 0;
    try { len = t.getComputedTextLength(); } catch (e) {}
    if (!len) return;
    var w = Math.ceil(len + 12);
    wrap.querySelectorAll('svg').forEach(function (s) { s.setAttribute('viewBox', '0 0 ' + w + ' 100'); });
    wrap.style.setProperty('--pl-k', (w / 255).toFixed(4));
  }

  function on() {
    document.documentElement.classList.add('uma-logo-font');
    requestAnimationFrame(fit);
  }

  link.onload = function () {
    if (!document.fonts || !document.fonts.load) return on();
    document.fonts.load(WEIGHT + ' 112px "' + FAMILY + '"', TEXT).then(on, on);
  };
  link.onerror = function () {};   // не загрузился — остаётся Manrope
})();
