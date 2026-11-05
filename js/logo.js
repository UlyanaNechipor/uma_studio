/* UMA · logo
   Страховка на время, пока в Тильде стоит старая вставка (логотип «UMA» в оранжевом).
   Новая вставка (tilda/core.html, data-uma-core="2") сама рисует WORKING TITLE шрифтом
   Rubik с контрастом начертаний и подгоняет размер — тогда этот файл ничего не делает. */
(function () {
  var wrap = document.getElementById('uma-logo-wrap');
  if (!wrap || wrap.getAttribute('data-uma-core')) return;
  var TEXT = 'WORKING TITLE';
  wrap.querySelectorAll('text').forEach(function (t) { if (t.textContent.trim() !== TEXT) t.textContent = TEXT; });
  document.documentElement.classList.add('uma-old-core');
  function fit() {
    var t = wrap.querySelector('.logo-bg-text'), len = 0;
    try { len = t.getComputedTextLength(); } catch (e) {}
    if (!len) return;
    var w = Math.ceil(len + 12);
    wrap.querySelectorAll('svg').forEach(function (s) { s.setAttribute('viewBox', '0 0 ' + w + ' 100'); });
    wrap.style.setProperty('--pl-k', (w / 255).toFixed(4));
  }
  fit();
  window.addEventListener('load', fit);
})();
