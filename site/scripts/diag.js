/* Диагностика на странице (вставляется в <head> встроенным скриптом — работает, даже если site.js не загрузился).
   Показать: пять быстрых нажатий на строку «Made by …» в подвале, либо ?debug / #debug в адресе.
   Выводит то, что нужно, чтобы понять, почему на устройстве нет анимаций: настройки, возможности браузера, ошибки. */
(function () {
  var errs = window.__umaErr = [];
  function add(m) { if (errs.length < 8) errs.push(String(m).slice(0, 160)); }
  addEventListener('error', function (e) { add((e.message || 'error') + (e.filename ? ' @' + String(e.filename).split('/').pop().split('?')[0] + ':' + e.lineno : '')); }, true);
  addEventListener('unhandledrejection', function (e) { add('promise: ' + (e.reason && e.reason.message || e.reason)); });
  var warn = console.error; console.error = function () { add([].slice.call(arguments).join(' ')); try { warn.apply(console, arguments); } catch (_) {} };
  function mm(q) { try { return matchMedia(q).matches ? 'ДА' : 'нет'; } catch (e) { return 'ошибка'; } }
  function sup(a, b) { try { return CSS.supports(a, b) ? 'да' : 'НЕТ'; } catch (e) { return '?'; } }
  function ls() { try { localStorage.setItem('_t', 1); localStorage.removeItem('_t'); return 'да'; } catch (e) { return 'НЕТ (' + e.name + ')'; } }
  function gl() { try { var c = document.createElement('canvas'); return c.getContext('webgl2') ? 'WebGL2' : c.getContext('webgl') ? 'только WebGL1' : 'НЕТ'; } catch (e) { return 'ошибка'; } }
  function show() {
    var h = document.documentElement, d = document.getElementById('uma-diag') || document.createElement('pre');
    d.id = 'uma-diag';
    d.style.cssText = 'position:fixed;left:8px;right:8px;bottom:8px;z-index:2147483647;margin:0;background:rgba(0,0,0,.92);color:#fff;font:12px/1.5 ui-monospace,Menlo,monospace;padding:12px 14px;border-radius:10px;white-space:pre-wrap;max-height:70vh;overflow:auto;-webkit-user-select:text;user-select:text';
    var L = [
      'УМЕНЬШЕНИЕ ДВИЖЕНИЯ: ' + mm('(prefers-reduced-motion: reduce)') + '   ← «ДА» отключает все анимации сайта',
      'скрипт сайта запустился: ' + (window.__umaBoot ? 'да' : 'НЕТ'),
      'классы html: ' + h.className,
      'экран: ' + innerWidth + '×' + innerHeight + ', DPR ' + devicePixelRatio + ', hover ' + mm('(hover: hover)') + ', pointer fine ' + mm('(pointer: fine)'),
      'WebGL: ' + gl() + ' · IntersectionObserver: ' + ('IntersectionObserver' in window ? 'да' : 'НЕТ') + ' · localStorage: ' + ls(),
      'CSS: subgrid ' + sup('grid-template-columns', 'subgrid') + ', inset ' + sup('inset', '0') + ', lh ' + sup('height', '1lh') + ', clip-path ' + sup('clip-path', 'inset(0)') + ', translate ' + sup('translate', '0 1px'),
      'в iframe: ' + (top !== window ? 'да' : 'нет') + ' · картинок загружено: ' + [].filter.call(document.images, function (i) { return i.complete && i.naturalWidth; }).length + ' из ' + document.images.length,
      'ошибки: ' + (errs.length ? '\n  ' + errs.join('\n  ') : 'нет'),
      navigator.userAgent, '', '(нажмите на это окно, чтобы закрыть)'
    ];
    d.textContent = L.join('\n');
    d.onclick = function () { d.remove(); };
    (document.body || h).appendChild(d);
  }
  var n = 0, t = 0;
  document.addEventListener('click', function (e) {
    if (!e.target.closest || !e.target.closest('.ft__made')) return;
    n = (Date.now() - t < 700) ? n + 1 : 1; t = Date.now();
    if (n >= 5) { n = 0; show(); }
  });
  if (/[?&#]debug/.test(location.search + location.hash)) addEventListener('load', function () { setTimeout(show, 500); });
})();
