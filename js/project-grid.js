/* UMA · project-grid
   Сетка фото проектов под заголовком «Проекты, в которых мы исследуем…» (rec3979597601).
   При наведении мышью фото плавно приближается внутри карточки, размер карточки не меняется.
   Фото остаются те, что загружены в Тильду (слой берёт тот же фон через inherit,
   включая подгрузку Тильды). На телефоне эффекта нет — там нет наведения.
   Стили — css/project-grid.css. */
(function () {
  /* ================= НАСТРОЙКИ ================= */
  var REC_IDS = ['rec3979597601'];  // блоки, где работает эффект
  /* ============================================= */

  var canHover = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!canHover || reduce) return;

  function setup(atom) {
    if (atom.__umaPj) return;
    atom.__umaPj = true;
    atom.classList.add('uma-pj');
    var html = '<span class="uma-pj__d" aria-hidden="true"></span>';
    atom.insertAdjacentHTML('afterbegin', html);
  }

  function init() {
    REC_IDS.forEach(function (id) {
      var rec = document.getElementById(id);
      if (!rec) return;
      var atoms = rec.querySelectorAll('.t396__elem[data-elem-type="shape"] .tn-atom[data-original]');
      for (var k = 0; k < atoms.length; k++) setup(atoms[k]);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
  window.addEventListener('load', init);
})();
