/* UMA · footer
   Разметка и поведение футера. Стили — css/footer.css.
   Вставляется в <div id="uma-footer-mount"></div> из блока Тильды.
   Макет: Figma «Landing Arine», узел 2316:24734 (кадр 1600 × 240).
   Слева название студии (BRAND) и подпись «Made by … ©2026»,
   справа две колонки ссылок: «Компания» и «Контакты».
   Кегли и отступы масштабируются как Zero-блоки Тильды (--ft-z). */
(function () {
  /* ================= НАСТРОЙКИ ================= */
  var EMAIL    = 'umadigital@gmail.com';
  var TELEGRAM = 'https://t.me/';          // допишите ник: https://t.me/имя
  var PHONE    = '+7 (911) 973-66-93';
  var CITY     = 'Санкт-Петербург';
  var PROJECTS = '/#projects';
  var CONTACTS = 'mailto:' + EMAIL;        // «Контакты» в колонке «Компания»
  var ABOUT    = '/#about';
  var PRIVACY  = '';                       // ссылка на страницу политики (например /privacy); пусто — строка без ссылки
  var YEAR     = '2026';
  var BRAND    = 'Working Title';         // название студии (в футере пишется капсом)
  /* ============================================= */

  function link(href, text, ext) {
    if (!href) return '<li><span class="uma-ft__link is-static">' + text + '</span></li>';
    return '<li><a class="uma-ft__link" href="' + href + '"' + (ext ? ' target="_blank" rel="noopener"' : '') + '>' + text + '</a></li>';
  }

  var HTML =
    '<footer class="uma-ft" id="uma-footer">' +
      '<div class="uma-ft__brand">' +
        '<p class="uma-ft__logo">' + BRAND + '</p>' +
        '<p class="uma-ft__made">Made by <span>' + BRAND + '</span> ©' + YEAR + '</p>' +
      '</div>' +
      '<nav class="uma-ft__col" aria-labelledby="uma-ft-company">' +
        '<h2 class="uma-ft__title" id="uma-ft-company">Компания</h2>' +
        '<ul class="uma-ft__list">' +
          link(PROJECTS, 'Проекты') +
          link(CONTACTS, 'Контакты') +
          link(ABOUT, 'О нас') +
          link(PRIVACY, 'Политика конфиденциальности') +
        '</ul>' +
      '</nav>' +
      '<section class="uma-ft__col" aria-labelledby="uma-ft-contacts">' +
        '<h2 class="uma-ft__title" id="uma-ft-contacts">Контакты</h2>' +
        '<ul class="uma-ft__list">' +
          link('', CITY) +
          '<li><a class="uma-ft__link" href="mailto:' + EMAIL + '" title="' + EMAIL + '">Почта</a></li>' +
          link(TELEGRAM, 'Телеграм', true) +
          link('tel:' + PHONE.replace(/[^\d+]/g, ''), PHONE) +
        '</ul>' +
      '</section>' +
    '</footer>';

  // Тильда растягивает Zero-блоки свойством zoom: ширина экрана / ширина брейкпоинта.
  // Футер получает тот же коэффициент (--ft-z), поэтому кегли и отступы совпадают с блоками.
  function zoomFactor() {
    // берём коэффициент прямо у видимого Zero-элемента; формула — запасной вариант
    var els = document.querySelectorAll('#allrecords .t396__elem[style*="zoom"]');
    for (var i = 0; i < els.length; i++) {
      var z = parseFloat(els[i].style.zoom);
      if (z > 0 && els[i].getClientRects().length) return z;
    }
    var w = window.innerWidth;
    var bp = w >= 1200 ? 1200 : w >= 960 ? 960 : w >= 640 ? 640 : w >= 480 ? 480 : 320;
    return w / bp;
  }
  function applyZoom(host) { host.style.setProperty('--ft-z', zoomFactor().toFixed(4)); }

  function mount() {
    var m = document.getElementById('uma-footer-mount');
    if (!m || document.getElementById('uma-footer')) return null;
    m.innerHTML = HTML;
    return document.getElementById('uma-footer');
  }

  /* ---------- плашка Тильды ---------- */
  function killTildaLabel() {
    document.querySelectorAll('.t-tildalаbеl, #tildacоpy, .t-tildalаbеl__wrapper').forEach(function (el) {
      el.style.setProperty('display', 'none', 'important');
    });
  }

  function boot() {
    var host = mount();
    if (!host) return;
    applyZoom(host);
    window.addEventListener('resize', function () { setTimeout(function () { applyZoom(host); }, 50); });
    // Тильда проставляет zoom Zero-блокам чуть позже загрузки: сверяемся ещё раз
    window.addEventListener('load', function () { applyZoom(host); });
    setTimeout(function () { applyZoom(host); }, 1200);
    killTildaLabel(); setInterval(killTildaLabel, 1000);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
