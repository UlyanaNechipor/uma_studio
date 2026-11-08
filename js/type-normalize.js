/* UMA · type-normalize
   Один стиль основного текста по всему сайту. В Zero-блоках у одинакового по смыслу
   мелкого текста (12 px) разошлись настройки: где-то разрядка 0.45 px, где-то нет,
   начертание 300 или 400, межстрочный 1.55 или 1.58. Всем текстам Zero-блоков с базовым
   кеглем до BODY_MAX px (кроме заголовков, кнопок и шапки) ставится класс uma-body —
   стиль в css/type-normalize.css.
   Ещё: названия проектов пишутся одинаково во всех раскладках (в мобильной было
   «sure», «KARA FOX», «black sable»…) — берётся написание из десктопной раскладки.
   Отключить для элемента: класс uma-no-norm в Zero-блоке. */
(function () {
  /* ================= НАСТРОЙКИ ================= */
  var BODY_MAX  = 16;               // px: базовый кегль Тильды, до которого текст — основной
  var HEADER_ID = 'rec3979597301';  // старая шапка Тильды
  var NAMES_REC = 'rec3979597501';  // список проектов: выравниваем написание названий
  /* ============================================= */

  function baseSize(elem, atom) {
    var v = elem.getAttribute('data-field-fontsize-value') || '';
    var m = v.match(/(\d+(?:\.\d+)?)\s*(px)?\s*\)?\s*$/);
    if (m) return parseFloat(m[1]);
    return parseFloat(getComputedStyle(atom).fontSize) || 16;
  }

  function body() {
    var elems = document.querySelectorAll('#allrecords .t396__elem[data-elem-type="text"]');
    for (var i = 0; i < elems.length; i++) {
      var e = elems[i], a = e.querySelector('.tn-atom');
      if (!a || a.classList.contains('uma-body')) continue;
      if (e.classList.contains('uma-no-norm') || e.closest('#' + HEADER_ID)) continue;
      if (/(^|\s)uma-stream-(bg|top)-/.test(e.className) || a.classList.contains('uma-h')) continue;
      if (/^\s*\d{4}\s*$/.test(a.textContent) || a.querySelector('.uma-yr')) continue;   // год-табло
      if (baseSize(e, a) > BODY_MAX) continue;
      a.classList.add('uma-body');
    }
  }

  // «Kara Fox» — есть и строчные, и прописные; «KARA FOX», «sure» — нет
  function mixed(t) { return /[a-zа-яё]/.test(t) && /[A-ZА-ЯЁ]/.test(t); }
  function names() {
    var rec = document.getElementById(NAMES_REC);
    if (!rec) return;
    var atoms = rec.querySelectorAll('.t396__elem[data-elem-type="text"] .tn-atom');
    // текст лежит прямо в атоме или в единственной ссылке внутри него
    function leaf(a) {
      if (!a.children.length) return a;
      if (a.children.length === 1 && !a.firstElementChild.children.length) return a.firstElementChild;
      return null;
    }
    var canon = {};
    atoms.forEach(function (a) {
      var l = leaf(a); if (!l) return;
      var t = l.textContent.trim();
      if (t && t.length < 40 && mixed(t)) canon[t.toLowerCase()] = t;
    });
    atoms.forEach(function (a) {
      var l = leaf(a); if (!l) return;
      var t = l.textContent.trim(), c = canon[t.toLowerCase()];
      if (c && c !== t) l.textContent = c;
    });
  }

  function run() { body(); names(); }
  run();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  window.addEventListener('load', run);
  window.addEventListener('uma:relayout', run);
})();
