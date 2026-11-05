/* UMA · fluid
   Адаптив для любых ширин экрана между раскладками Тильды.
   В Zero-блоках настроены только компьютерная (1200) и телефонная (320) раскладки,
   а промежуточные 480 / 640 / 960 наследуют компьютерные размеры без уменьшения,
   и блоки вылезают за экран. Здесь Тильде подменяется выбор раскладки:
     • уже MOBILE_MAX px (планшет вертикально, телефон горизонтально) — телефонная раскладка,
       растянутая на всю ширину экрана;
     • от MOBILE_MAX до 1199 px (планшет горизонтально, небольшой ноутбук) — компьютерная,
       уменьшенная до ширины экрана;
     • телефоны уже 480 px и экраны от 1200 px — как настроено в Тильде, без изменений.
   Стили телефонной раскладки (отступы, автолэйаут групп) Тильда пишет только для экранов
   уже 480 px — они копируются и на промежуточные ширины.
   Кегль текстов на промежуточных ширинах плавно растёт от телефонного к компьютерному
   (линейно по ширине экрана), а не растягивается вместе с раскладкой:
   иначе на планшете текст телефонной раскладки получался бы огромным.
   Подключается в uma.json первым из скриптов. */
(function () {
  /* ================= НАСТРОЙКИ ================= */
  var MOBILE_MAX = 960;   // px: уже этого — телефонная раскладка на всю ширину
  var MIN_FLUID  = 480;   // px: уже этого — всё как в Тильде
  var DESK = 1200, PHONE = 320;
  var SKIP = ['rec3979597301'];  // старая шапка (скрыта)
  /* ============================================= */

  if (window.__umaFluid) return;
  window.__umaFluid = true;

  function width() {
    return document.documentElement.clientWidth || window.innerWidth;
  }
  // какая раскладка Тильды сейчас используется
  window.umaRes = function () {
    var w = width();
    if (w >= DESK) return DESK;
    if (w < MIN_FLUID) return PHONE;
    return w < MOBILE_MAX ? PHONE : DESK;
  };
  function inFluid() { var w = width(); return w >= MIN_FLUID && w < DESK; }

  /* ---------- 1. выбор раскладки ---------- */
  var patched = false;
  function patch() {
    if (patched || typeof window.t396_detectResolution !== 'function') return patched;
    var orig = window.t396_detectResolution;
    window.t396_detectResolution = function (recid) {
      var r = orig.apply(this, arguments);
      if (r == null || !inFluid()) return r;
      var ab = window.tn && window.tn['ab' + recid];
      var screens = (ab && ab.screens) || [];
      var want = window.umaRes();
      return screens.indexOf(want) > -1 ? want : r;
    };
    patched = true;
    return true;
  }

  function recs() {
    var out = [];
    var list = document.querySelectorAll('.t396__artboard[data-artboard-recid]');
    for (var i = 0; i < list.length; i++) {
      var id = list[i].getAttribute('data-artboard-recid');
      if (SKIP.indexOf('rec' + id) < 0) out.push(id);
    }
    return out;
  }

  function relayout() {
    if (typeof window.t396_doResize !== 'function') return;
    recs().forEach(function (id) {
      if (window.tn && window.tn['ab' + id]) {
        try { window.t396_doResize(id); } catch (e) {}
      }
    });
  }

  /* ---------- 2. стили телефонной раскладки на промежуточных ширинах ---------- */
  function mediaMax(rule) {
    var t = (rule.conditionText || (rule.media && rule.media.mediaText) || '');
    var m = t.match(/max-width:\s*(\d+)px/);
    return m && !/min-width/.test(t) ? +m[1] : 0;
  }

  /* ---------- 3. кегль: плавно от телефонного к компьютерному ---------- */
  function num(v) {
    if (v == null || v === '') return NaN;
    var m = String(v).match(/(-?\d+(?:\.\d+)?)\s*(px)?\s*\)?\s*$/);
    return m ? parseFloat(m[1]) : NaN;
  }
  // значение поля для раскладки res с наследованием как у Тильды (от меньшей к большей)
  function field(el, name, res) {
    var order = [320, 480, 640, 960, 1200];
    for (var i = order.indexOf(res); i < order.length; i++) {
      var r = order[i];
      var v = el.getAttribute(r === 1200 ? 'data-field-' + name + '-value' : 'data-field-' + name + '-res-' + r + '-value');
      if (v != null && v !== '') return v;
    }
    return null;
  }

  var built = false;
  function build() {
    if (built) return;
    var ids = recs();
    if (!ids.length) return;
    built = true;
    var mob = [], fonts = [];

    ids.forEach(function (id) {
      var rec = document.getElementById('rec' + id);
      if (!rec) return;
      // а) правила Тильды для экранов уже 640 и 480 px — по порядку, как они действуют на телефоне
      var styles = rec.querySelectorAll('style');
      var by = { 639: [], 479: [] };
      for (var s = 0; s < styles.length; s++) {
        var sheet = styles[s].sheet, rules;
        try { rules = sheet && sheet.cssRules; } catch (e) { rules = null; }
        if (!rules) continue;
        for (var k = 0; k < rules.length; k++) {
          var mx = mediaMax(rules[k]);
          if (by[mx]) {
            var inner = rules[k].cssRules;
            for (var q = 0; q < inner.length; q++) by[mx].push(inner[q].cssText);
          }
        }
      }
      mob.push(by[639].join(''), by[479].join(''));

      // б) кегль текстов
      var texts = rec.querySelectorAll('.t396__elem[data-elem-type="text"], .t396__elem[data-elem-type="button"]');
      for (var t = 0; t < texts.length; t++) {
        var el = texts[t], eid = el.getAttribute('data-elem-id');
        var fp = num(field(el, 'fontsize', 320)), fd = num(field(el, 'fontsize', 1200));
        if (isNaN(fp) && isNaN(fd)) continue;
        if (isNaN(fp)) fp = fd;
        if (isNaN(fd)) fd = fp;
        var k2 = (fd - fp) / (DESK - PHONE);
        var size = 'calc((' + fp + 'px + ' + k2.toFixed(5) + ' * (100vw - ' + PHONE + 'px)) / var(--zoom, 1))';
        fonts.push('#rec' + id + ' .tn-elem[data-elem-id="' + eid + '"] .tn-atom{font-size:' + size + ' !important}');
      }
    });

    var css =
      '@media screen and (min-width:' + MIN_FLUID + 'px) and (max-width:' + (MOBILE_MAX - 1) + 'px){' + mob.join('') + '}' +
      '@media screen and (min-width:' + MIN_FLUID + 'px) and (max-width:' + (DESK - 1) + 'px){' + fonts.join('') + '}';
    var tag = document.createElement('style');
    tag.id = 'uma-fluid-css';
    tag.textContent = css;
    // после всех стилей Тильды
    (document.body || document.documentElement).appendChild(tag);
  }

  function mark() {
    var h = document.documentElement;
    h.classList.toggle('uma-fluid', inFluid());
    h.classList.toggle('uma-fluid-m', inFluid() && window.umaRes() === PHONE);
    h.classList.toggle('uma-fluid-d', inFluid() && window.umaRes() === DESK);
  }

  function run() {
    patch();
    build();
    mark();
    if (inFluid()) relayout();
  }

  // как можно раньше: если Тильда ещё не рисовала блоки, она сразу возьмёт нужную раскладку
  patch();
  mark();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();
  window.addEventListener('load', function () { patch(); mark(); if (inFluid()) relayout(); });

  // при смене ширины Тильда сама перерисует блоки (через подменённый выбор раскладки)
  var lw = width(), rt;
  window.addEventListener('resize', function () {
    if (width() === lw) return;
    lw = width();
    clearTimeout(rt);
    rt = setTimeout(mark, 50);
  });
})();
