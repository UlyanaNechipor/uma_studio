/* UMA · project-rows
   Появление списка проектов (блок «Избранные проекты»), как список услуг у Oera Studio:
   каждая строка целиком — линия вместе с названием, типом и годом — проявляется
   и въезжает на место сбоку, строки по очереди сверху вниз. Без размытия.
   Срабатывает один раз, когда список доходит до экрана.
   Строка — группа Тильды с линией сверху или снизу.
   Телефон (карточки .project-group-card): каждая карточка — когда доходит до экрана:
   линия-разделитель над ней прочерчивается слева направо, следом
   по очереди всплывают название, тип и обложки. Год — табло (js/year-ticker.js).
   Стили — css/project-rows.css. */
(function () {
  /* ================= НАСТРОЙКИ ================= */
  var REC_ID = 'rec3979597501';
  var ROW    = 0.16;   // с: задержка между строками
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
      g.style.setProperty('--row-d', (i * ROW).toFixed(2) + 's');
      g.classList.add('uma-row');
    });
    rec.__umaRows = rows;
    html.classList.add('uma-rows-wait');
    return rows;
  }

  function play(rec) {
    rec.classList.add('uma-rows-in');
    // после анимации снимаем задержки, чтобы наведение/смена темы не ждали их
    var last = (rec.__umaRows.length * ROW + 1.7) * 1000;
    setTimeout(function () { rec.classList.add('uma-rows-done'); }, last);
  }

  /* ---------- телефон: карточки ---------- */
  var CARD_STEP = 0.08;   // с: между элементами внутри карточки
  function cardsMode(rec) {
    if (window.innerWidth >= 960) return false;   // десктоп — строки (prepare/run)
    var cards = [].slice.call(rec.querySelectorAll('.project-group-card')).filter(function (c) {
      var r = c.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && r.left < window.innerWidth && r.right > 0;
    });
    if (!cards.length) return false;
    cards.forEach(function (c) {
      var m = c.querySelector(':scope > .tn-molecule');
      if (!m) return;
      var cs = getComputedStyle(m);
      c.classList.add('uma-card');
      c.style.setProperty('--row-line', cs.borderTopColor);
      c.style.setProperty('--row-w', cs.borderTopWidth);
      // содержимое: строки карточки сверху вниз, внутри строки — слева направо
      var parts = [].slice.call(m.querySelectorAll(':scope > .t396__elem, :scope > .t396__group'));
      parts.sort(function (a, b) {
        var ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
        return Math.abs(ra.top - rb.top) > 6 ? ra.top - rb.top : ra.left - rb.left;
      });
      parts.forEach(function (el, k) {
        el.classList.add('uma-card__it');
        el.style.setProperty('--it-d', (0.18 + k * CARD_STEP).toFixed(2) + 's');
      });
    });
    var left = cards.slice(), ticking = false;
    function check() {
      ticking = false;
      var lim = window.innerHeight * START;
      left = left.filter(function (c) {
        var r = c.getBoundingClientRect();
        if (r.top < lim) {
          c.classList.add('is-in');
          setTimeout(function () { c.classList.add('is-done'); }, 2000);
          return false;
        }
        return true;
      });
      if (!left.length) window.removeEventListener('scroll', onScroll);
    }
    function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(check); } }
    window.addEventListener('scroll', onScroll, { passive: true });
    check();
    return true;
  }

  function init() {
    var rec = document.getElementById(REC_ID);
    if (!rec || rec.__umaRowsInit) return;
    if (cardsMode(rec)) { rec.__umaRowsInit = true; return; }
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
