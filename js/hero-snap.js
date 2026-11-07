/* UMA · hero-snap
   Десктоп: с самого верха страницы первый же жест прокрутки вниз (колесо, тачпад,
   PageDown, пробел, стрелка вниз) плавно доводит страницу до положения, где низ шапки
   стоит в GAP px над верхним краем заголовка первого экрана. Дальше прокрутка обычная.
   Вернулся к самому верху — доводка срабатывает снова.
   На телефонах и планшетах (без мыши) не работает. */
(function () {
  /* ================= НАСТРОЙКИ ================= */
  var REC_ID   = 'rec3979597401';
  var HEADING  = '.uma-stream-top-lat';  // заголовок первого экрана
  var GAP      = 32;                     // px между низом шапки и верхом заголовка
  var DURATION = 900;                    // мс: длительность доводки
  var MIN_W    = 960;                    // уже этого — не работает
  var TOP_ZONE = 8;                      // px: «самый верх», где доводка снова взводится
  /* ============================================= */

  var mouse = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (!mouse) return;

  var busy = false, lastWheel = 0, quietT = 0;

  function enabled() { return window.innerWidth >= MIN_W; }

  function target() {
    var rec = document.getElementById(REC_ID);
    var h = rec && rec.querySelector(HEADING);
    if (!h) return null;
    var atom = h.querySelector('.tn-atom') || h;
    var top = atom.getBoundingClientRect().top + window.scrollY;
    var hd = typeof window.umaHeaderHeight === 'function' ? window.umaHeaderHeight() : 0;
    var y = Math.round(top - hd - GAP);
    return y > TOP_ZONE ? y : null;
  }

  function ease(t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

  function glide(to) {
    busy = true;
    var from = window.scrollY, t0 = performance.now();
    var html = document.documentElement, prev = html.style.scrollBehavior;
    html.style.scrollBehavior = 'auto';
    function step(now) {
      var k = Math.min(1, (now - t0) / DURATION);
      window.scrollTo(0, from + (to - from) * ease(k));
      if (k < 1) requestAnimationFrame(step);
      else { html.style.scrollBehavior = prev; release(); }
    }
    requestAnimationFrame(step);
  }
  // отпускаем, когда доводка закончилась и инерция тачпада стихла
  function release() {
    clearTimeout(quietT);
    var wait = Math.max(0, 200 - (performance.now() - lastWheel));
    quietT = setTimeout(function () {
      if (performance.now() - lastWheel < 190) return release();
      busy = false;
    }, wait);
  }

  function tryStart(e) {
    if (!enabled()) return false;
    if (window.scrollY > TOP_ZONE) return false;
    if (document.documentElement.classList.contains('uma-hero-hold') &&
        !document.documentElement.classList.contains('uma-hero-in')) return false;   // ещё прелоадер
    var y = target();
    if (y == null) return false;
    if (e && e.cancelable) e.preventDefault();
    glide(y);
    return true;
  }

  window.addEventListener('wheel', function (e) {
    lastWheel = performance.now();
    if (busy) { if (e.cancelable) e.preventDefault(); return; }
    if (e.deltaY > 0) tryStart(e);
  }, { passive: false });

  window.addEventListener('keydown', function (e) {
    var t = e.target;
    if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
    var down = e.key === 'PageDown' || e.key === 'ArrowDown' || (e.key === ' ' && !e.shiftKey);
    if (busy && (down || e.key === 'PageUp' || e.key === 'ArrowUp' || e.key === ' ')) { e.preventDefault(); return; }
    if (down) tryStart(e);
  });

})();
