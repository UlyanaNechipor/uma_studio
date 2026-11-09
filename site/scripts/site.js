/* Working Title · поведение страницы без зависимостей: тема и галерея в первом экране. */
(function () {
  var KEY = 'uma-theme';
  try { if (localStorage.getItem(KEY) === 'light') document.body.classList.add('light-theme'); } catch (e) {}
  document.querySelectorAll('[data-theme-toggle]').forEach(function (b) {
    b.addEventListener('click', function () {
      var on = document.body.classList.toggle('light-theme');
      try { localStorage.setItem(KEY, on ? 'light' : 'dark'); } catch (e) {}
    });
  });

  var g = document.querySelector('[data-gallery]');
  if (g && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var s = g.children, i = 0;
    setInterval(function () {
      s[i].classList.remove('is-on'); i = (i + 1) % s.length; s[i].classList.add('is-on');
    }, 3500);
  }
})();
