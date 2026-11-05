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

  // старая вставка Тильды (с «UMA» и прежним оранжевым) — обновляем на лету
  wrap.querySelectorAll('text').forEach(function (t) { if (t.textContent.trim() !== TEXT) t.textContent = TEXT; });
  var fill = wrap.querySelector('.logo-fill-text');
  if (fill && /224,\s*130,\s*68/.test(getComputedStyle(fill).fill)) {
    wrap.querySelectorAll('.logo-fill-text').forEach(function (t) { t.style.setProperty('fill', '#d94f30', 'important'); });
  }
  if (!getComputedStyle(document.documentElement).getPropertyValue('--uma-accent').trim()) {
    document.documentElement.style.setProperty('--uma-accent', '#d94f30');
  }

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
  link.onerror = function () { requestAnimationFrame(fit); };   // не загрузился — остаётся Manrope
  fit();
})();
