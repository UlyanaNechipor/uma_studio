/* UMA · mobile-covers
   Список проектов (rec3979597501), мобильная версия: в каждой карточке два
   квадрата-заглушки с градиентом. Здесь они заливаются картинками:
     слева — обложка проекта, как в превью на десктопе (img/covers),
     справа — второе фото в настроении проекта (img/mobile/<проект>-2.webp,
     пока сгенерированы в Figma — замените файлы, когда будут настоящие).
   Заглушки находятся по id элементов Тильды (data-elem-id).
   Стили — css/mobile-covers.css. */
(function () {
  /* ================= НАСТРОЙКИ ================= */
  var REC_ID = 'rec3979597501';
  var MAP = {
    // id левой заглушки: id правой заглушки, проект
    '1790190980231000016': ['img/covers/rosi.webp',          'Rosi'],
    '1790190980231000015': ['img/mobile/rosi-2.webp',        'Rosi'],
    '1790337067370000010': ['img/covers/sure.webp',          'Sure'],
    '1790337067370000009': ['img/mobile/sure-2.webp',        'Sure'],
    '1790337087864000019': ['img/mobile/kara-fox-mockup.webp', 'Kara Fox'],
    '1790337087864000018': ['img/mobile/kara-fox-2.webp',    'Kara Fox'],
    '1790337091915000027': ['img/mobile/black-sable-mockup.webp', 'Black Sable'],
    '1790337091915000026': ['img/mobile/black-sable-2.webp', 'Black Sable'],
    '1790337100774000035': ['img/mobile/arine-atelier-mockup.webp', 'Arine Atelier'],
    '1790337100774000034': ['img/mobile/arine-atelier-2.webp','Arine Atelier']
  };
  /* ============================================= */

  var REPO = 'UlyanaNechipor/uma_studio';
  function repo(path) {
    var U = window.UMA || {};
    var v = U.version ? '?v=' + encodeURIComponent(U.version) : '';
    // raw.githubusercontent обновляется за ~5 минут; jsDelivr по ветке держит старые файлы до 12 часов
    return (U.base || ('https://raw.githubusercontent.com/' + REPO + '/' + (U.ref || 'main') + '/')) + path + v;
  }

  function init() {
    var rec = document.getElementById(REC_ID);
    if (!rec) return;
    Object.keys(MAP).forEach(function (id) {
      var el = rec.querySelector('.t396__elem[data-elem-id="' + id + '"]');
      var atom = el && el.querySelector('.tn-atom');
      if (!atom || atom.__umaMc) return;
      atom.__umaMc = true;
      atom.classList.add('uma-mc');
      atom.setAttribute('role', 'img');
      atom.setAttribute('aria-label', MAP[id][1]);
      atom.style.setProperty('background-image', 'url("' + repo(MAP[id][0]) + '")', 'important');
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
  window.addEventListener('load', init);
})();
