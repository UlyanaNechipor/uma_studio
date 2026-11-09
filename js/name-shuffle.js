/* UMA · name-shuffle
   Названия проектов в «Избранных проектах» перетасовываются, как на nonameburo.com:
   буквы названия на короткое время перемешиваются между собой и встают на место
   слева направо (ширина слова почти не меняется — это те же самые буквы).
   Десктоп: при наведении на строку проекта (строка — полоса вокруг названия во всю ширину).
   Мобилка: когда карточка появляется (вместе со своей строкой) и когда она
   подсвечивается (класс is-focused ставит js/mobile-radar.js).
   Заменяет прокрутку цифр года (js/year-ticker.js больше не подключается). */
(function () {
  /* ================= НАСТРОЙКИ ================= */
  var LIST_REC = 'rec3979597501';
  var NAMES    = ['Rosi', 'Sure', 'Kara Fox', 'Black Sable', 'Arine Atelier'];
  var DURATION = 520;    // мс на всё слово
  var FPS_STEP = 34;     // мс между кадрами перемешивания
  /* ============================================= */

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;
  var hover = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  function norm(s) { return String(s || '').replace(/\s+/g, ' ').trim().toLowerCase(); }
  var LOW = NAMES.map(norm);

  // текстовый узел с названием внутри атома (структура атома не трогается)
  function textNode(atom) {
    if (atom.__umaNsT && atom.contains(atom.__umaNsT)) return atom.__umaNsT;
    var w = document.createTreeWalker(atom, NodeFilter.SHOW_TEXT, null), n, best = null;
    while ((n = w.nextNode())) if (n.nodeValue.trim() && (!best || n.nodeValue.length > best.nodeValue.length)) best = n;
    return (atom.__umaNsT = best);
  }
  function isName(atom) { return LOW.indexOf(norm(atom.textContent)) > -1; }

  function shuffle(atom) {
    var node = textNode(atom);
    if (!node) return;
    if (atom.__umaNsRun) return;                 // не перезапускать посреди анимации
    var orig = atom.__umaNsO || (atom.__umaNsO = node.nodeValue);
    var chars = orig.split('');
    var idx = [];                                 // позиции букв (пробелы остаются на месте)
    for (var i = 0; i < chars.length; i++) if (/\S/.test(chars[i])) idx.push(i);
    if (idx.length < 2) return;
    atom.__umaNsRun = true;
    var t0 = performance.now();
    (function frame() {
      var p = Math.min(1, (performance.now() - t0) / DURATION);
      var fixed = Math.floor(p * idx.length);     // сколько букв слева уже встали на место
      if (p >= 1) { node.nodeValue = orig; atom.__umaNsRun = false; return; }
      // оставшиеся буквы перемешиваем между собой
      var pool = idx.slice(fixed).map(function (k) { return chars[k]; });
      for (var j = pool.length - 1; j > 0; j--) {
        var r = Math.floor(Math.random() * (j + 1)), tmp = pool[j]; pool[j] = pool[r]; pool[r] = tmp;
      }
      var out = chars.slice();
      idx.slice(fixed).forEach(function (k, m) { out[k] = pool[m]; });
      node.nodeValue = out.join('');
      setTimeout(frame, FPS_STEP);
    })();
  }

  /* ---------- мобилка: карточки ---------- */
  function nameIn(card) {
    if (card.__umaNsA) return card.__umaNsA;
    var atoms = card.querySelectorAll('[data-elem-type="text"] .tn-atom');
    for (var i = 0; i < atoms.length; i++) if (isName(atoms[i])) return (card.__umaNsA = atoms[i]);
    return null;
  }
  function watchCards() {
    var cards = document.querySelectorAll('.project-group-card');
    if (!window.MutationObserver) return;
    for (var i = 0; i < cards.length; i++) {
      var c = cards[i];
      if (c.__umaNsW) continue;
      c.__umaNsW = true;
      (function (card) {
        var was = card.classList.contains('is-focused'), shown = card.classList.contains('is-in') || window.innerWidth >= 960;
        new MutationObserver(function () {
          if (window.innerWidth >= 960) return;
          var on = card.classList.contains('is-focused');
          if (on && !was && shown) { var a0 = nameIn(card); if (a0) shuffle(a0); }
          was = on;
          // карточка появилась (js/project-rows.js): название тасуется вместе с появлением своей строки
          if (!shown && card.classList.contains('is-in')) {
            shown = true;
            var a = nameIn(card), it = a && a.closest('.uma-card__it');
            var d = it ? parseFloat(getComputedStyle(it).getPropertyValue('--it-d')) || 0 : 0;
            if (a) setTimeout(function () { shuffle(a); }, d * 1000 + 80);
          }
        }).observe(card, { attributes: true, attributeFilter: ['class'] });
      })(c);
    }
  }

  /* ---------- десктоп: наведение на строку ---------- */
  function hoverRows() {
    var rec = document.getElementById(LIST_REC);
    if (!rec || rec.__umaNsH || !hover) return;
    rec.__umaNsH = true;
    var cur = null;
    function names() {
      var out = [];
      rec.querySelectorAll('[data-elem-type="text"] .tn-atom').forEach(function (a) {
        if (a.closest('.project-group-card') || !(a.__umaNsO || isName(a))) return;
        var r = a.getBoundingClientRect();
        if (r.width && r.height && r.right > 0 && r.left < window.innerWidth) out.push({ a: a, y: r.top + r.height / 2 });
      });
      return out.sort(function (p, q) { return p.y - q.y; });
    }
    rec.addEventListener('mousemove', function (e) {
      if (window.innerWidth < 960) return;
      var ys = names(), hit = null;
      for (var i = 0; i < ys.length; i++) {
        var up = i ? (ys[i - 1].y + ys[i].y) / 2 : ys[i].y - (ys[1] ? (ys[1].y - ys[0].y) / 2 : 60);
        var dn = i < ys.length - 1 ? (ys[i].y + ys[i + 1].y) / 2 : ys[i].y + (ys[i - 1] ? (ys[i].y - ys[i - 1].y) / 2 : 60);
        if (e.clientY >= up && e.clientY < dn) { hit = ys[i].a; break; }
      }
      if (hit === cur) return;
      cur = hit;
      if (hit) shuffle(hit);
    });
    rec.addEventListener('mouseleave', function () { cur = null; });
  }

  function init() { watchCards(); hoverRows(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
  window.addEventListener('load', init);
})();
