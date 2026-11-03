/* UMA · project-grid
   Сетка фото проектов под заголовком «Проекты, в которых мы исследуем…» (rec3979597601).
   При наведении мышью фото «проваливается в глубину самого себя»: внутри карточки
   появляются уменьшенные копии того же фото, одна в другой, как тоннель.
   Фото остаются те, что загружены в Тильду (копии берут тот же фон через inherit,
   включая подгрузку Тильды). На телефоне эффекта нет — там нет наведения.
   Стили — css/project-grid.css. */
(function () {
  /* ================= НАСТРОЙКИ ================= */
  var REC_IDS = ['rec3979597601'];  // блоки, где работает эффект
  var DEPTH   = 5;                  // сколько слоёв (фото + вложенные копии)
  var STEP    = 0.8;                // во сколько раз каждая следующая копия меньше
  /* ============================================= */

  var canHover = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!canHover || reduce) return;

  function setup(atom) {
    if (atom.__umaPj) return;
    atom.__umaPj = true;
    atom.classList.add('uma-pj');
    var html = '';
    for (var k = 0; k < DEPTH; k++) html += '<span class="uma-pj__d' + (k ? '' : ' uma-pj__d--base') + '" style="--k:' + k +
        ';--s:' + Math.pow(STEP, k).toFixed(4) + '" aria-hidden="true"></span>';
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
