/* UMA · hero-snap
   Доводка к заголовкам: страница плавно встаёт так, что низ шапки — в GAP px
   над верхним краем заголовка раздела.
     • С самого верха страницы первый же жест вниз доводит до заголовка первого экрана
       (десктоп: колесо, тачпад, PageDown, пробел, стрелка вниз; телефон: свайп — палец
       ведёт страницу, после отпускания она доезжает).
     • Дальше — мягкая доводка: когда прокрутка остановилась рядом с заголовком
       (ближе NEAR доли экрана), страница доезжает до него. Любой новый жест её прерывает.
   Заголовки — элементы с классом uma-stream-top-* (заголовки с заливкой) и HEADINGS ниже. */
(function () {
  /* ================= НАСТРОЙКИ ================= */
  var FIRST    = '#rec3979597401 [class*="uma-stream-top"]';   // заголовок первого экрана
  var HEADINGS = '[class*="uma-stream-top"]';                   // все заголовки разделов
  var EXTRA    = [{ rec: 'rec4249463601', minFont: 30 }];      // «Есть идея?» — крупный текст блока
  var GAP      = 32;     // px между низом шапки и верхом заголовка
  var DURATION = 900;    // мс: доводка с верха страницы
  var SOFT     = 650;    // мс: мягкая доводка к ближайшему заголовку
  var NEAR     = 0.22;   // доля высоты экрана: насколько близко к заголовку должна остановиться прокрутка
  var BEHIND   = 0.08;   // против направления прокрутки — только если совсем рядом
  var IDLE     = 140;    // мс без прокрутки — считаем, что остановились
  var MIN_W    = 960;    // десктоп уже этого — без доводки
  var TOP_ZONE = 8;      // px: «самый верх»
  /* ============================================= */

  var mouse = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var html = document.documentElement;

  var busy = false;        // доводка с верха: жесты гасятся
  var soft = null;         // мягкая доводка идёт: любой жест её прерывает
  var lastWheel = 0, quietT = 0, idleT = 0, lastY = window.scrollY, dir = 1, touching = false;

  function enabled() { return !mouse || window.innerWidth >= MIN_W; }
  function heroReady() { return !html.classList.contains('uma-hero-hold') || html.classList.contains('uma-hero-in'); }
  function headerH() { return typeof window.umaHeaderHeight === 'function' ? window.umaHeaderHeight() : 0; }

  function posOf(el) {
    var atom = el.querySelector('.tn-atom') || el;
    var r = atom.getBoundingClientRect();
    if (!r.height || r.left > window.innerWidth || r.right < 0) return null;
    return Math.round(r.top + window.scrollY - headerH() - GAP);
  }
  function first() {
    var el = document.querySelector(FIRST);
    var y = el && posOf(el);
    return y != null && y > TOP_ZONE ? y : null;
  }
  function points() {
    var out = [], max = document.documentElement.scrollHeight - window.innerHeight;
    var list = [].slice.call(document.querySelectorAll(HEADINGS));
    EXTRA.forEach(function (x) {
      var rec = document.getElementById(x.rec);
      if (!rec) return;
      var best = null, bf = 0;
      rec.querySelectorAll('.t396__elem[data-elem-type="text"]').forEach(function (e) {
        var a = e.querySelector('.tn-atom'), r = e.getBoundingClientRect();
        if (!a || !r.width || r.left < -20) return;
        var f = parseFloat(getComputedStyle(a).fontSize) * (a.getBoundingClientRect().height / (a.offsetHeight || 1));
        if (f >= x.minFont && f > bf) { bf = f; best = e; }
      });
      if (best) list.push(best);
    });
    list.forEach(function (el) {
      var y = posOf(el);
      if (y != null && y > TOP_ZONE && y <= max + 1) out.push(y);
    });
    out.sort(function (a, b) { return a - b; });
    return out.filter(function (y, i) { return i === 0 || y - out[i - 1] > 4; });   // слои одного заголовка
  }

  function ease(t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

  function glide(to, dur, isSoft) {
    var from = window.scrollY, t0 = performance.now(), D = reduce ? 1 : dur;
    var prev = html.style.scrollBehavior;
    html.style.scrollBehavior = 'auto';
    var job = { stop: false };
    if (isSoft) soft = job; else busy = true;
    function step(now) {
      if (job.stop) { html.style.scrollBehavior = prev; return; }
      var k = Math.min(1, (now - t0) / D);
      window.scrollTo(0, from + (to - from) * ease(k));
      if (k < 1) requestAnimationFrame(step);
      else {
        html.style.scrollBehavior = prev;
        if (isSoft) soft = null; else release();
      }
    }
    requestAnimationFrame(step);
  }
  function cancelSoft() { if (soft) { soft.stop = true; soft = null; } }

  // доводка с верха: отпускаем, когда она закончилась и инерция тачпада стихла
  function release() {
    clearTimeout(quietT);
    var wait = Math.max(0, 200 - (performance.now() - lastWheel));
    quietT = setTimeout(function () {
      if (performance.now() - lastWheel < 190) return release();
      busy = false;
    }, wait);
  }

  function fromTop(e) {
    if (!enabled() || !heroReady() || window.scrollY > TOP_ZONE) return false;
    var y = first();
    if (y == null) return false;
    if (e && e.cancelable) e.preventDefault();
    cancelSoft();
    glide(y, DURATION, false);
    return true;
  }

  // прокрутка остановилась — к ближайшему заголовку, если он рядом
  function settle() {
    if (busy || soft || touching || !enabled() || !heroReady()) return;
    var y = window.scrollY;
    if (y <= TOP_ZONE) return;
    var vh = window.innerHeight, best = null, bd = Infinity;
    points().forEach(function (p) {
      var d = p - y;                                   // > 0 — заголовок ниже
      var ahead = d * dir >= 0;
      var lim = (ahead ? NEAR : BEHIND) * vh;
      if (Math.abs(d) < 2 || Math.abs(d) > lim) return;
      if (Math.abs(d) < bd) { bd = Math.abs(d); best = p; }
    });
    if (best != null) glide(best, Math.min(SOFT, 250 + bd * 2), true);
  }
  function scheduleSettle() { clearTimeout(idleT); idleT = setTimeout(settle, IDLE); }

  /* ---------- колесо, клавиатура ---------- */
  window.addEventListener('wheel', function (e) {
    lastWheel = performance.now();
    if (busy) { if (e.cancelable) e.preventDefault(); return; }
    cancelSoft();
    if (e.deltaY > 0 && fromTop(e)) return;
  }, { passive: false });

  window.addEventListener('keydown', function (e) {
    var t = e.target;
    if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
    var down = e.key === 'PageDown' || e.key === 'ArrowDown' || (e.key === ' ' && !e.shiftKey);
    var nav = down || e.key === 'PageUp' || e.key === 'ArrowUp' || e.key === ' ' || e.key === 'Home' || e.key === 'End';
    if (busy && nav) { e.preventDefault(); return; }
    if (nav) cancelSoft();
    if (down) fromTop(e);
  });

  window.addEventListener('scroll', function () {
    var y = window.scrollY;
    if (Math.abs(y - lastY) > 0.5) dir = y > lastY ? 1 : -1;
    lastY = y;
    if (!busy && !soft) scheduleSettle();
  }, { passive: true });

  /* ---------- касание ---------- */
  // палец у самого верха тянет страницу вверх: до отпускания страница идёт за пальцем,
  // после — плавно доезжает до заголовка первого экрана
  var tStart = null, tFrom = 0, tY = 0, tracking = false;
  window.addEventListener('touchstart', function (e) {
    touching = true;
    cancelSoft();
    clearTimeout(idleT);
    if (busy) { tStart = null; return; }
    tStart = window.scrollY <= TOP_ZONE && enabled() && heroReady() ? e.touches[0].clientY : null;
    tracking = false;
  }, { passive: true });
  window.addEventListener('touchmove', function (e) {
    if (busy) { if (e.cancelable) e.preventDefault(); return; }
    if (tStart == null) return;
    var dy = tStart - e.touches[0].clientY;          // > 0 — страница едет вниз
    if (!tracking) {
      if (dy < 6) { if (dy < -6) tStart = null; return; }
      tY = first();
      if (tY == null) { tStart = null; return; }
      tracking = true; tFrom = window.scrollY;
    }
    if (e.cancelable) e.preventDefault();
    window.scrollTo(0, Math.max(0, Math.min(tY, tFrom + dy)));
  }, { passive: false });
  function touchDone() {
    touching = false;
    if (tracking) {
      tracking = false; tStart = null;
      var left = Math.abs(tY - window.scrollY);
      glide(tY, Math.max(350, DURATION * Math.min(1, left / Math.max(1, tY))), false);
      return;
    }
    tStart = null;
    scheduleSettle();       // после инерции — к ближайшему заголовку
  }
  window.addEventListener('touchend', touchDone, { passive: true });
  window.addEventListener('touchcancel', touchDone, { passive: true });
})();
