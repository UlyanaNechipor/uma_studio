/* UMA · tablet
   Планшеты (iPad и т. п.): в Тильде настроены только раскладки Zero-блоков для компьютера (1200)
   и телефона (320); промежуточные 960 / 640 / 480 наследуют компьютерные размеры без
   масштабирования, и на планшете блоки вылезают за экран.
   Здесь на планшете страница рисуется как на экране шириной WIDTH (компьютерная раскладка)
   и браузер целиком уменьшает её до ширины планшета — композиция как на компьютере.
   Срабатывает только на сенсорных устройствах с короткой стороной экрана от MIN_SIDE
   (телефоны не трогает) и пока ширина экрана меньше WIDTH. На компьютерах браузер
   эту настройку игнорирует. */
(function () {
  var WIDTH = 1200, MIN_SIDE = 700;
  var touch = (navigator.maxTouchPoints || 0) > 0 || 'ontouchstart' in window;
  if (!touch || !window.screen) return;
  if (Math.min(screen.width, screen.height) < MIN_SIDE) return;   // телефон

  var meta = document.querySelector('meta[name="viewport"]');
  if (!meta) { meta = document.createElement('meta'); meta.name = 'viewport'; document.head.appendChild(meta); }
  var original = meta.getAttribute('content') || 'width=device-width, initial-scale=1.0';

  function apply() {
    // ширина экрана в текущей ориентации
    var landscape = window.matchMedia && window.matchMedia('(orientation: landscape)').matches;
    var w = landscape ? Math.max(screen.width, screen.height) : Math.min(screen.width, screen.height);
    var want = w < WIDTH ? 'width=' + WIDTH : original;
    if (meta.getAttribute('content') !== want) meta.setAttribute('content', want);
    document.documentElement.classList.toggle('uma-tablet', w < WIDTH);
  }
  apply();
  window.addEventListener('orientationchange', function () { setTimeout(apply, 50); });
  if (window.matchMedia) {
    var mq = window.matchMedia('(orientation: landscape)');
    if (mq.addEventListener) mq.addEventListener('change', apply);
  }
})();
