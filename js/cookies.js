/* UMA · cookies
   Минималистичный баннер согласия на cookie и подключение Яндекс Метрики.
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

  var box = null;
  function hide() {
    if (!box) return;
    box.classList.remove('is-in');
    var b = box; box = null;
    setTimeout(function () { if (b.parentNode) b.parentNode.removeChild(b); }, 500);
  }
  function choose(v) {
    set(v);
    if (v === 'yes') loadMetrika();
    hide();
  }

  function show() {
    if (box) return;
    var policy = POLICY ? '<a class="uma-ck__link" href="' + POLICY + '">политике конфиденциальности</a>' : 'политике конфиденциальности';
    box = document.createElement('div');
    box.className = 'uma-ck';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-label', 'Согласие на cookie');
    box.innerHTML =
      '<p class="uma-ck__text">Используем cookie и Яндекс Метрику, чтобы понимать, как работает сайт. Подробнее —&nbsp;в&nbsp;' + policy + '.</p>' +
      '<div class="uma-ck__actions">' +
        '<button type="button" class="uma-ck__btn uma-ck__btn--primary" data-v="yes">Принять</button>' +
        '<button type="button" class="uma-ck__btn" data-v="no">Отказаться</button>' +
      '</div>';
    box.addEventListener('click', function (e) {
      var b = e.target.closest('[data-v]');
      if (b) choose(b.getAttribute('data-v'));
    });
    document.body.appendChild(box);
    requestAnimationFrame(function () { requestAnimationFrame(function () { if (box) box.classList.add('is-in'); }); });
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
