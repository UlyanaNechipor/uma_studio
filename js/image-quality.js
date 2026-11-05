/* UMA · image-quality
   Чёткие картинки из Тильды на всём сайте.
   Тильда подгружает каждую картинку пережатой точно под размер блока (×2 на ретине)
   с заметным сжатием, поэтому фото выглядят мыльно. Здесь вместо этого берётся
   та же картинка в полном разрешении загруженного файла, в WebP
   (optim.tildacdn.com/<id>/-/format/webp/<файл>.webp), а уменьшает её уже браузер.
   Сами картинки не меняются — только качество, в котором они приходят.
   • фоны Zero-блоков (.t-bgimg, фото проектов, обложки) — через CSS-переменную
     --uma-hq: правило в css/image-quality.css перекрывает фон Тильды;
   • картинки-элементы (<img>) — подменяется src, повторно, если Тильда вернёт свой.
   Грузится заранее, за MARGIN до появления на экране. SVG и GIF не трогаются.
   Отключить для элемента: класс uma-no-hq в Зеро-блоке. */
(function () {
  /* ================= НАСТРОЙКИ ================= */
  var MARGIN = '800px 0px';      // за сколько до экрана подгружать
  var MIN_W  = 40;               // px: мельче — иконки, не трогаем
  var SKIP   = ['rec3979597301']; // шапка
  /* ============================================= */

  function hq(url) {
    var m = String(url || '').match(/^https?:\/\/(?:static|optim|thb)\.tildacdn\.[a-z]+\/(til[a-z0-9]{1,2}[\w-]*)\/(?:-\/[^/]+\/(?:[^/]+\/)*)?([^/?#]+)$/i);
    if (!m) return null;
    var file = m[2];
    if (/\.(svg|gif)$/i.test(file)) return null;
    file = file.replace(/\.webp$/i, '');
    return 'https://optim.tildacdn.com/' + m[1] + '/-/format/webp/' + file + '.webp';
  }

  function skip(el) {
    // uma-hg-host — слайдер Тильды, который заменён своей галереей: его не грузим
    if (el.closest('.uma-no-hq, .uma-hg-host') || el.classList.contains('uma-mc')) return true;
    var rec = el.closest('.r');
    return rec && SKIP.indexOf(rec.id) !== -1;
  }

  function applyBg(el, url) {
    el.style.setProperty('--uma-hq', 'url("' + url + '")');
    el.classList.add('uma-hq');
  }
  function applyImg(img, url) {
    img.__umaHq = url;
    if (img.getAttribute('src') !== url) {
      img.removeAttribute('srcset');
      img.setAttribute('src', url);
    }
  }

  // предзагрузка: фон меняем только когда картинка уже скачана — без мигания
  function upgrade(el) {
    if (el.__umaHqDone) return;
    el.__umaHqDone = true;
    var url = hq(el.getAttribute('data-original'));
    if (!url) return;
    var pre = new Image();
    pre.decoding = 'async';
    pre.onload = function () {
      if (el.tagName === 'IMG') applyImg(el, url); else applyBg(el, url);
    };
    pre.src = url;
  }

  var io = window.IntersectionObserver ? new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { io.unobserve(e.target); upgrade(e.target); } });
  }, { rootMargin: MARGIN }) : null;

  // Тильда может позже снова поставить свою уменьшенную картинку в src — возвращаем
  var mo = window.MutationObserver ? new MutationObserver(function (list) {
    list.forEach(function (m) {
      var img = m.target;
      if (img.__umaHq && img.getAttribute('src') !== img.__umaHq) applyImg(img, img.__umaHq);
    });
  }) : null;

  // страховка, если IntersectionObserver не сработал: проверка при прокрутке
  var pending = [];
  var ticking = false;
  function check() {
    ticking = false;
    var vh = window.innerHeight, left = [];
    for (var i = 0; i < pending.length; i++) {
      var el = pending[i];
      if (el.__umaHqDone) continue;
      var r = el.getBoundingClientRect();
      if (r.width && r.bottom > -800 && r.top < vh + 800) upgrade(el); else left.push(el);
    }
    pending = left;
  }
  window.addEventListener('scroll', function () {
    if (!ticking && pending.length) { ticking = true; requestAnimationFrame(check); }
  }, { passive: true });

  function scan() {
    var els = document.querySelectorAll('#allrecords [data-original]');
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      if (el.__umaHqSeen || skip(el)) continue;
      var r = el.getBoundingClientRect();
      if (r.width && r.width < MIN_W) continue;
      el.__umaHqSeen = true;
      if (el.tagName === 'IMG' && mo) mo.observe(el, { attributes: true, attributeFilter: ['src'] });
      pending.push(el);
      if (io) io.observe(el); else upgrade(el);
    }
    check();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', scan);
  else scan();
  window.addEventListener('load', scan);
  // на смену ширины Тильда перестраивает Zero-блоки и может показать другие элементы
  var t = 0;
  window.addEventListener('resize', function () { clearTimeout(t); t = setTimeout(scan, 300); });
})();
