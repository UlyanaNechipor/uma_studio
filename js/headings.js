/* UMA · headings
   Плотнее набирает заголовки: уменьшает межстрочный интервал и делает
   трекинг отрицательным. Заголовком считается текст Zero-блока с базовым
   (десктопным) размером от HEAD_MIN px, тег h1–h3 или заголовок с заливкой.
   Значения берутся по ступеням размера на текущем экране. Если в Тильде
   у заголовка уже задано плотнее, чем в ступени, остаётся значение из Тильды.
   Шапка сайта не затрагивается. Стили — css/headings.css.
   Отключить для отдельного заголовка: класс uma-no-tight в Зеро-блоке. */
(function () {
  /* ================= НАСТРОЙКИ ================= */
  var HEAD_MIN  = 24;               // px: с этого базового размера текст — заголовок
  var HEADER_ID = 'rec3979597301';  // шапка: её не трогаем
  // ступени по размеру шрифта на экране: межстрочный (в долях кегля) и трекинг (em)
  var STEPS = [
    { from: 60, lh: 1.0,  ls: -0.03  },   // крупные заголовки первого экрана
    { from: 32, lh: 1.1,  ls: -0.02  },   // заголовки разделов
    { from: 0,  lh: 1.2,  ls: -0.01  }    // небольшие заголовки (названия проектов и т.п.)
  ];
  /* ============================================= */

  function baseSize(elem, atom) {
    var v = elem.getAttribute('data-field-fontsize-value') || '';
    var m = v.match(/(\d+(?:\.\d+)?)\s*(px)?\s*\)?\s*$/);
    if (m) return parseFloat(m[1]);
    return parseFloat(getComputedStyle(atom).fontSize) || 16;
  }

  function isHeading(elem, atom) {
    if (elem.classList.contains('uma-no-tight')) return false;
    if (elem.closest('#' + HEADER_ID)) return false;
    if (/(^|\s)uma-stream-(bg|top)-/.test(elem.className)) return true;
    if (/^H[1-3]$/.test(atom.tagName)) return true;
    return baseSize(elem, atom) >= HEAD_MIN;
  }

  function apply() {
    var elems = document.querySelectorAll('#allrecords .t396__elem[data-elem-type="text"]');
    for (var i = 0; i < elems.length; i++) {
      var elem = elems[i], atom = elem.querySelector('.tn-atom');
      if (!atom) continue;
      // меряем исходные значения Тильды: снимаем свои на время замера
      atom.classList.remove('uma-h');
      if (!isHeading(elem, atom)) continue;
      var cs = getComputedStyle(atom);
      var fs = parseFloat(cs.fontSize) || 16;
      var lhPx = parseFloat(cs.lineHeight);
      var lh = isNaN(lhPx) ? 1.2 : lhPx / fs;                      // "normal" ≈ 1.2
      var ls = cs.letterSpacing === 'normal' ? 0 : (parseFloat(cs.letterSpacing) || 0) / fs;
      var step = STEPS[0];
      for (var k = 0; k < STEPS.length; k++) { if (fs >= STEPS[k].from) { step = STEPS[k]; break; } }
      atom.style.setProperty('--uma-hlh', Math.min(lh, step.lh).toFixed(3));
      atom.style.setProperty('--uma-hls', Math.min(ls, step.ls).toFixed(4) + 'em');
      atom.classList.add('uma-h');
    }
  }

  // Подключается в uma.json раньше скриптов заливки: строки заголовков
  // режутся на строки уже с новым интервалом.
  apply();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', apply);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(apply);
  window.addEventListener('load', apply);
  var rt;
  window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(apply, 200); });
})();
