/* UMA · headings
   Плотнее набирает заголовки: уменьшает межстрочный интервал и делает
   трекинг отрицательным. Заголовком считается текст Zero-блока с базовым
   (десктопным) размером от HEAD_MIN px, тег h1–h3 или заголовок с заливкой.
   Значения берутся по ступеням размера на текущем экране. Если в Тильде
   у заголовка уже задано плотнее, чем в ступени, остаётся значение из Тильды.
   Шапка сайта не затрагивается. Стили — css/headings.css.
   Отключить для отдельного заголовка: класс uma-no-tight в Зеро-блоке.
   На телефонах (уже PHONE_MAX px) трекинг остаётся как в макете Тильды, иначе
   заголовки на узком экране выглядят мельче. Но если строка подходит к краю
   экрана ближе SAFE px, трекинг уменьшается ровно настолько, чтобы край букв
   встал на отступ (не плотнее, чем в ступени). */
(function () {
  /* ================= НАСТРОЙКИ ================= */
  var HEAD_MIN  = 24;               // px: с этого базового размера текст — заголовок
  var HEADER_ID = 'rec3979597301';  // шапка: её не трогаем
  var PHONE_MAX = 480;              // px: на экранах уже этого трекинг из Тильды
  var SAFE      = 16;               // px: минимальный отступ букв от краёв экрана на телефоне
  var PHONE_BIG = 36;               // px на экране: с этого кегля заголовок на телефоне — «крупный»
  var PHONE_BIG_LS = -0.02;         // em: трекинг крупного заголовка на телефоне (не больше)
  // ступени по размеру шрифта на экране: межстрочный (в долях кегля) и трекинг (em)
  var STEPS = [
    { from: 60, lh: 0.96, ls: -0.04  },   // крупные заголовки первого экрана (в Тильде было 1.0 и −0.024em)
    { from: 32, lh: 1.02, ls: -0.03  },   // заголовки разделов (было 1.15 и 0)
    { from: 0,  lh: 1.0,  ls: -0.02  }    // небольшие заголовки, названия проектов (было 1.0 и +0.042em)
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
      atom.style.removeProperty('min-height');
      if (!isHeading(elem, atom)) continue;
      var h0 = atom.offsetHeight;                                    // высота рамки с интервалом Тильды (до нашего)
      var cs = getComputedStyle(atom);
      var fs = parseFloat(cs.fontSize) || 16;
      // межстрочный из стилей макета, без строчного значения в px, которое ставит сама Тильда:
      // она считает его по текущему кеглю, и после смены раскладки (поворот экрана, js/fluid.js)
      // оно остаётся от прежнего кегля — отсюда слипшиеся строки заголовков
      var inl = atom.style.getPropertyValue('line-height');
      if (inl) atom.style.removeProperty('line-height');
      var lhPx = parseFloat(getComputedStyle(atom).lineHeight);
      if (inl) atom.style.setProperty('line-height', inl);
      var lh = isNaN(lhPx) ? 1.2 : lhPx / fs;                        // "normal" ≈ 1.2
      lh = Math.max(lh, 0.8);
      var ls = cs.letterSpacing === 'normal' ? 0 : (parseFloat(cs.letterSpacing) || 0) / fs;
      // ступень — по размеру на экране (блок Тильды может быть масштабирован)
      var zoom = atom.offsetHeight ? atom.getBoundingClientRect().height / atom.offsetHeight : 1;
      var fsScreen = fs * (zoom > 0.2 && zoom < 5 ? zoom : 1);
      var step = STEPS[0];
      for (var k = 0; k < STEPS.length; k++) { if (fsScreen >= STEPS[k].from) { step = STEPS[k]; break; } }
      atom.style.setProperty('--uma-hlh', Math.min(lh, step.lh).toFixed(3));
      var phone = window.innerWidth < PHONE_MAX;
      // телефон: трекинг из Тильды, но не разреженный у крупных заголовков (главный был +0.5 px —
      // выглядел рыхлее остальных); не плотнее ступени
      var pls = phone ? (fsScreen >= PHONE_BIG ? Math.min(ls, PHONE_BIG_LS) : ls) : Math.min(ls, step.ls);
      atom.style.setProperty('--uma-hls', pls.toFixed(4) + 'em');
      atom.classList.add('uma-h');
      // Плотный интервал делает строки ниже. Если высота заголовка «по тексту» (hug), Тильда ставит под ним
      // элементы по его высоте, и они уезжали вверх: кнопки «Есть идеи?» стояли выше низа картинки.
      // Рамка остаётся той же высоты, что в макете, текст внутри — плотнее.
      if (h0 > 0) atom.style.setProperty('min-height', h0 + 'px');
      if (phone) fitPhone(atom, fs, ls, step.ls);
    }
  }

  // строки текста: правый край и число символов в каждой (по прямоугольникам букв)
  function lines(atom) {
    var out = {}, walker = document.createTreeWalker(atom, NodeFilter.SHOW_TEXT), n, r = document.createRange();
    while ((n = walker.nextNode())) {
      for (var i = 0; i < n.length; i++) {
        if (/\s/.test(n.data[i])) continue;
        r.setStart(n, i); r.setEnd(n, i + 1);
        var b = r.getBoundingClientRect();
        if (!b.width) continue;
        var key = Math.round(b.top / 4);
        var L = out[key] || (out[key] = { left: b.left, right: b.right, count: 0, h: b.height });
        L.left = Math.min(L.left, b.left); L.right = Math.max(L.right, b.right); L.count++;
      }
    }
    return Object.keys(out).map(function (k) { return out[k]; });
  }

  function fitPhone(atom, fs, ls, minLs) {
    var vw = document.documentElement.clientWidth || window.innerWidth;
    for (var t = 0; t < 3; t++) {
      var over = 0, perChar = 0;
      lines(atom).forEach(function (L) {
        var o = Math.max(L.right - (vw - SAFE), SAFE - L.left);
        if (o > over && L.count > 1) { over = o; perChar = over / (L.count - 1); }
      });
      if (over <= 0.5) return;
      // сколько em убрать: перерасход на символ, переведённый в размер шрифта на экране
      var scale = atom.getBoundingClientRect().height / (atom.offsetHeight || 1) || 1;
      ls -= perChar / (fs * scale) + 0.0005;
      if (ls <= minLs) { ls = minLs; atom.style.setProperty('--uma-hls', ls.toFixed(4) + 'em'); return; }
      atom.style.setProperty('--uma-hls', ls.toFixed(4) + 'em');
    }
  }

  // Подключается в uma.json раньше скриптов заливки: строки заголовков
  // режутся на строки уже с новым интервалом.
  apply();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', apply);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(apply);
  window.addEventListener('load', apply);
  var rt;
  window.addEventListener('uma:relayout', apply);
  window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(apply, 200); });
})();
