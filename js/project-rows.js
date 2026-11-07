/* UMA · project-rows
   Появление списка проектов (блок «Избранные проекты»): строки по очереди сверху вниз
   вылетают слева направо — линия-разделитель прочерчивается, следом выезжают название,
   тип и год (каждый со своей небольшой задержкой). Срабатывает один раз, когда список
   доходит до экрана. Строка — группа Тильды с линией сверху или снизу.
   Стили — css/project-rows.css. */
(function () {
  /* ================= НАСТРОЙКИ ================= */
  var REC_ID = 'rec3979597501';
  var ROW    = 0.09;   // с: задержка между строками
  var ITEM   = 0.06;   // с: задержка между элементами внутри строки
  var START  = 0.82;   // доля высоты экрана: верх списка дошёл до этой линии — запуск
  /* ============================================= */

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;
  var html = document.documentElement;

  function visibleRows(rec) {
    var out = [];
    rec.querySelectorAll('.t396__group').forEach(function (g) {
      var m = g.querySelector(':scope > .tn-molecule');
      if (!m) return;
      var cs = getComputedStyle(m);
      var top = parseFloat(cs.borderTopWidth) > 0 && cs.borderTopStyle !== 'none';
      var bot = parseFloat(cs.borderBottomWidth) > 0 && cs.borderBottomStyle !== 'none';
      if (!top && !bot) return;
      var r = g.getBoundingClientRect();
      if (!r.width || !r.height || r.left > window.innerWidth || r.right < 0) return;
      out.push({ g: g, m: m, lt: top, lb: bot, top: r.top,
                 color: top ? cs.borderTopColor : cs.borderBottomColor,
                 w: top ? cs.borderTopWidth : cs.borderBottomWidth,
                 wb: cs.borderBottomWidth, cb: cs.borderBottomColor });
    });
    // вложенные группы с линией не считаем отдельно, если их строка уже в списке
    out = out.filter(function (a) { return !out.some(function (b) { return b !== a && b.g.contains(a.g); }); });
    out.sort(function (a, b) { return a.top - b.top; });
    return out;
  }

  function prepare(rec) {
    if (rec.__umaRows) return rec.__umaRows;
    var rows = visibleRows(rec);
    if (!rows.length) return null;
    rows.forEach(function (row, i) {
      var g = row.g;
      g.classList.add('uma-row');
      if (row.lt) g.classList.add('uma-row--top');
      if (row.lb) { g.classList.add('uma-row--bottom'); g.style.setProperty('--row-wb', row.wb); g.style.setProperty('--row-lb', row.cb); }
      g.style.setProperty('--row-d', (i * ROW).toFixed(2) + 's');
      g.style.setProperty('--row-line', row.color);
      g.style.setProperty('--row-w', row.w);
      // содержимое строки слева направо
      var items = [].slice.call(row.m.querySelectorAll(':scope > .t396__elem, :scope > .t396__group'));
      items.sort(function (a, b) { return a.getBoundingClientRect().left - b.getBoundingClientRect().left; });
      items.forEach(function (it, k) {
        it.classList.add('uma-row__it');
        it.style.setProperty('--it-d', (i * ROW + 0.12 + k * ITEM).toFixed(2) + 's');
      });
    });
    rec.__umaRows = rows;
    html.classList.add('uma-rows-wait');
    return rows;
  }

  function play(rec) {
    rec.classList.add('uma-rows-in');
    // после анимации снимаем задержки, чтобы наведение/смена темы не ждали их
    var last = (rec.__umaRows.length * ROW + 1.6) * 1000;
    setTimeout(function () { rec.classList.add('uma-rows-done'); }, last);
  }

  function init() {
    var rec = document.getElementById(REC_ID);
    if (!rec || rec.__umaRowsInit) return;
    var rows = prepare(rec);
    if (!rows) return;
    rec.__umaRowsInit = true;
    var check = function () {
      if (rec.classList.contains('uma-rows-in')) return;
      var top = rows[0].g.getBoundingClientRect().top;
      if (top < window.innerHeight * START) { play(rec); window.removeEventListener('scroll', check); }
    };
    window.addEventListener('scroll', check, { passive: true });
    check();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(init, 0); });
  else setTimeout(init, 0);
  window.addEventListener('load', init);
})();
