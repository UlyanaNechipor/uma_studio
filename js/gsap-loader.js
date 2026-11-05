/* UMA · gsap-loader
   Общий загрузчик GSAP (gsap, ScrollTrigger, SplitText) для всех скриптов сайта.
   Подключается первым в uma.json и сразу начинает загрузку, не дожидаясь,
   пока до него дойдут скрипты заливки.
   Все три файла качаются ОДНОВРЕМЕННО и выполняются по порядку (async = false):
   раньше они грузились друг за другом, и каждая задержка CDN складывалась.
   Если CDN не ответил за TIMEOUT, недостающие файлы берутся со следующего. */
(function () {
  // сообщения в консоли — только с ?umadebug в адресе
  var DEBUG = /[?&]umadebug/.test(location.search);
  function umaWarn() { if (DEBUG) try { console.warn.apply(console, arguments); } catch (e) {} }

  if (window.umaLoadGsap) return;

  var CDNS = [
    'https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/',
    'https://unpkg.com/gsap@3.13.0/dist/',
    'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.13.0/'
  ];
  var FILES = ['gsap.min.js', 'ScrollTrigger.min.js', 'SplitText.min.js'];
  var TIMEOUT = 5000;

  function has(f) {
    return f === 'gsap.min.js' ? !!window.gsap : f === 'ScrollTrigger.min.js' ? !!window.ScrollTrigger : !!window.SplitText;
  }
  function inject(src) {
    return new Promise(function (ok) {
      var s = document.createElement('script'), done = false;
      function fin() { if (!done) { done = true; clearTimeout(t); ok(); } }
      var t = setTimeout(fin, TIMEOUT);
      s.src = src;
      s.async = false;              // качаются параллельно, выполняются по порядку
      s.onload = fin;
      s.onerror = fin;
      document.head.appendChild(s);
    });
  }

  var promise = null;
  window.umaLoadGsap = function () {
    if (promise) return promise;
    promise = new Promise(function (ok, fail) {
      var i = 0;
      (function next() {
        var missing = FILES.filter(function (f) { return !has(f); });
        if (!missing.length) return ok();
        if (i >= CDNS.length) return fail(new Error('UMA: не удалось загрузить ' + missing.join(', ')));
        var base = CDNS[i++];
        Promise.all(missing.map(function (f) { return inject(base + f); })).then(function () {
          if (FILES.some(function (f) { return !has(f); })) umaWarn('UMA: GSAP не загрузился с ' + base + ', пробую следующий CDN');
          next();
        });
      })();
    });
    return promise;
  };

  window.umaLoadGsap();
})();
