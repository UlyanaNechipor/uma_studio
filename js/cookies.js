/* UMA · cookies
   Плашка согласия на cookie и подключение Яндекс Метрики.
   Одна строка на стеклянной подложке (как кнопка «О нас»). Появляется шторкой,
   текст проявляется из символов поля (+ : . *), звёздочка медленно вращается,
   надписи кнопок перекатываются при наведении, с мышью плашка слегка тянется
   к курсору, после выбора — короткий ответ «Принято ✳».
   Метрика загружается ТОЛЬКО после «Принять» — до согласия сайт ничего не собирает.
   Выбор запоминается в браузере посетителя (localStorage, ключ uma_cookies),
   баннер больше не показывается. Изменить выбор: window.umaCookieSettings()
   (например, из ссылки «Настройки cookie»).
   Стили — css/cookies.css. */
(function () {
  /* ================= НАСТРОЙКИ ================= */
  var METRIKA_ID = '';            // номер счётчика Яндекс Метрики, например '12345678'; пусто — Метрика не грузится
  var WEBVISOR   = false;         // запись действий посетителя (вебвизор)
  var POLICY     = '';            // ссылка на политику, например '/privacy'; пусто — без ссылки
  var KEY        = 'uma_cookies'; // 'yes' | 'no'
  var DELAY      = 3200;          // мс после загрузки: баннер появляется, когда прелоадер уже ушёл
  /* ============================================= */

  function get() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function set(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }

  var metrikaOn = false;
  function loadMetrika() {
    if (metrikaOn || !METRIKA_ID) return;
    metrikaOn = true;
    (function (m, e, t, r, i, k, a) {
      m[i] = m[i] || function () { (m[i].a = m[i].a || []).push(arguments); };
      m[i].l = 1 * new Date();
      k = e.createElement(t); a = e.getElementsByTagName(t)[0];
      k.async = 1; k.src = r; a.parentNode.insertBefore(k, a);
    })(window, document, 'script', 'https://mc.yandex.ru/metrika/tag.js', 'ym');
    window.ym(METRIKA_ID, 'init', { clickmap: true, trackLinks: true, accurateTrackBounce: true, webvisor: WEBVISOR });
  }

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var GLYPHS = '+:.*/#=-';   // те же символы, что в поле символов сайта

  // «расшифровка»: текст проявляется из символов слева направо
  function scramble(el, text, ms, done) {
    if (reduce) { el.textContent = text; if (done) done(); return; }
    var t0 = performance.now();
    (function frame(now) {
      var k = Math.min(1, (now - t0) / ms), out = '';
      var edge = k * (text.length + 6);
      for (var i = 0; i < text.length; i++) {
        var c = text[i];
        if (c === ' ' || i < edge - 6) out += c;
        else if (i < edge) out += GLYPHS[(Math.random() * GLYPHS.length) | 0];
        else out += ' ';
      }
      el.textContent = out;
      if (k < 1) requestAnimationFrame(frame);
      else { el.textContent = text; if (done) done(); }
    })(t0);
  }

  // кнопка с «перекатом» текста при наведении: две копии надписи, верхняя уезжает вверх
  function btn(cls, v, label) {
    return '<button type="button" class="uma-ck__btn ' + cls + '" data-v="' + v + '" aria-label="' + label + '">' +
      '<span class="uma-ck__roll" aria-hidden="true"><span>' + label + '</span><span>' + label + '</span></span></button>';
  }

  var box = null;
  function hide(delay) {
    if (!box) return;
    var b = box; box = null;
    setTimeout(function () {
      b.classList.remove('is-in');
      b.classList.add('is-out');
      setTimeout(function () { if (b.parentNode) b.parentNode.removeChild(b); }, 900);
    }, delay || 0);
  }
  function choose(v) {
    set(v);
    if (v === 'yes') loadMetrika();
    var b = box;
    if (!b) return;
    b.style.width = b.getBoundingClientRect().width + 'px';   // плашка не меняет размер на ответе
    b.classList.add('is-done');
    // короткий ответ на выбор, тем же эффектом символов
    var reply = v === 'yes' ? 'Принято ✳' : 'Хорошо ✳';
    b.querySelector('.uma-ck__ghost').textContent = reply;
    scramble(b.querySelector('.uma-ck__live'), reply, 520);
    hide(1100);
  }

  // магнит: с мышью плашка слегка тянется к курсору, когда он рядом (до MAG px)
  var MAG = 8, MAG_R = 140;
  function magnet(el) {
    if (reduce || !(window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches)) return;
    var tx = 0, ty = 0, x = 0, y = 0, raf = 0;
    function loop() {
      x += (tx - x) * 0.15; y += (ty - y) * 0.15;
      el.style.translate = x.toFixed(2) + 'px ' + y.toFixed(2) + 'px';
      if (Math.abs(tx - x) > 0.05 || Math.abs(ty - y) > 0.05) raf = requestAnimationFrame(loop);
      else raf = 0;
    }
    function onMove(e) {
      if (!el.isConnected) { window.removeEventListener('mousemove', onMove); return; }
      var r = el.getBoundingClientRect();
      var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      var dx = e.clientX - cx, dy = e.clientY - cy;
      // расстояние до края плашки, а не до центра: широкая плашка тянется по всей длине
      var ex = Math.max(0, Math.abs(dx) - r.width / 2), ey = Math.max(0, Math.abs(dy) - r.height / 2);
      var d = Math.sqrt(ex * ex + ey * ey);
      var k = d > MAG_R ? 0 : 1 - d / MAG_R;
      tx = Math.max(-1, Math.min(1, dx / (r.width / 2 + MAG_R))) * MAG * k * 1.6;
      ty = Math.max(-1, Math.min(1, dy / (r.height / 2 + MAG_R))) * MAG * k * 1.6;
      if (!raf) raf = requestAnimationFrame(loop);
    }
    window.addEventListener('mousemove', onMove, { passive: true });
  }

  var MSG = 'Используем Яндекс Метрику, чтобы улучшать сайт.';

  function show() {
    if (box) return;
    var more = POLICY ? '<a class="uma-ck__link" href="' + POLICY + '">Подробнее</a>' : '';
    box = document.createElement('div');
    box.className = 'uma-ck';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-label', 'Согласие на cookie');
    box.innerHTML =
      '<span class="uma-ck__mark" aria-hidden="true">✳</span>' +
      '<p class="uma-ck__text"><span class="uma-ck__label">Cookie</span>' +
        // невидимая копия текста задаёт размер, поверх неё проявляется видимый текст
        '<span class="uma-ck__msg"><span class="uma-ck__ghost">' + MSG + '</span>' +
        '<span class="uma-ck__live" aria-hidden="true"></span></span>' + more + '</p>' +
      '<div class="uma-ck__actions">' +
        btn('uma-ck__btn--primary', 'yes', 'Принять') +
        btn('', 'no', 'Нет') +
      '</div>';
    box.addEventListener('click', function (e) {
      var b = e.target.closest('[data-v]');
      if (b && !box.classList.contains('is-done')) choose(b.getAttribute('data-v'));
    });
    document.body.appendChild(box);
    magnet(box);
    var msg = box.querySelector('.uma-ck__live');
    requestAnimationFrame(function () { requestAnimationFrame(function () {
      if (!box) return;
      box.classList.add('is-in');
      setTimeout(function () { scramble(msg, MSG, 900); }, 350);
    }); });
  }

  // открыть баннер снова, чтобы изменить выбор
  window.umaCookieSettings = function () {
    try { localStorage.removeItem(KEY); } catch (e) {}
    show();
  };

  function boot() {
    var v = get();
    if (v === 'yes') { loadMetrika(); return; }
    if (v === 'no') return;
    setTimeout(show, DELAY);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
