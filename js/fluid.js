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
  var GAP = 0.5;          // как быстро растут отступы между элементами относительно раскладки (0…1)
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

  // перерисовать блоки, которые Тильда уже нарисовала в другой раскладке;
  // остальным скриптам сообщается событием uma:relayout (пересобрать строки, выровнять шапку)
  function relayout() {
    if (typeof window.t396_doResize !== 'function') return;
    var changed = false;
    recs().forEach(function (id) {
      var ab = window.tn && window.tn['ab' + id];
      if (!ab) return;
      var want = window.t396_detectResolution(id);
      if (ab.curResolution === want) return;
      changed = true;
      try { window.t396_doResize(id); } catch (e) {}
    });
    if (changed) { relW = 0; reflowAll(); }
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

    function add(id, css) {
      var tag = document.createElement('style');
      tag.id = id;
      tag.textContent = css;
      // после всех стилей Тильды
      (document.body || document.documentElement).appendChild(tag);
    }
    add('uma-fluid-layout', '@media screen and (min-width:' + MIN_FLUID + 'px) and (max-width:' + (MOBILE_MAX - 1) + 'px){' + mob.join('') + '}');
    add('uma-fluid-css', '@media screen and (min-width:' + MIN_FLUID + 'px) and (max-width:' + (DESK - 1) + 'px){' + fonts.join('') + '}');
  }

  /* ---------- 4. по вертикали: элементы подтягиваются за изменившимся по высоте текстом ----------
     Тильда ставит элементы по координатам из макета. Когда кегль меньше растянутого,
     текст становится ниже, и под ним остаётся дыра (а когда больше — наезжает на следующий).
     Каждый элемент блока сдвигается так, чтобы до ближайшего элемента над ним
     (по той же вертикальной полосе) остался тот же отступ, что в макете. */
  var fluidTag = null;
  function fontsOff(off) {
    if (!fluidTag) fluidTag = document.getElementById('uma-fluid-css');
    if (fluidTag) fluidTag.media = off ? 'not all' : '';
  }

  function items(ab) {
    var list = ab.querySelectorAll(':scope > .t396__elem, :scope > .t396__group');
    var out = [];
    for (var i = 0; i < list.length; i++) out.push(list[i]);
    return out;
  }

  function clearShift(ab) {
    items(ab).forEach(function (el) { el.style.translate = ''; });
    var atoms = ab.querySelectorAll('.tn-atom[data-uma-ls]');
    for (var i = 0; i < atoms.length; i++) { atoms[i].style.removeProperty('letter-spacing'); atoms[i].removeAttribute('data-uma-ls'); }
    // своя высота снимается, только если Тильда с тех пор не поставила новую
    if (ab.__umaH != null) {
      if (ab.style.height === ab.__umaH) { ab.style.removeProperty('height'); if (ab.__umaOrigH) ab.style.height = ab.__umaOrigH; }
      ab.__umaH = null;
    }
  }

  function rect(el) {
    var r = el.getBoundingClientRect();
    return { top: r.top, bottom: r.bottom, left: r.left, right: r.right, h: r.height, w: r.width };
  }

  function reflow(ab) {
    clearShift(ab);
    if (!inFluid()) return;
    var all = items(ab);
    var base = ab.getBoundingClientRect();
    var vw = width();

    // трекинг обычных текстов — в долях кегля, как в макете (иначе он растягивается вместе с раскладкой)
    fontsOff(true);
    var atoms = ab.querySelectorAll('.t396__elem[data-elem-type="text"] .tn-atom');
    var ls = [];
    for (var a = 0; a < atoms.length; a++) {
      var cs = getComputedStyle(atoms[a]);
      var f = parseFloat(cs.fontSize) || 0, l = parseFloat(cs.letterSpacing);
      ls.push(f && !isNaN(l) && !atoms[a].classList.contains('uma-h') ? l / f : null);
    }
    // размеры по макету
    var design = all.map(rect);
    fontsOff(false);
    for (var b = 0; b < atoms.length; b++) {
      if (ls[b] == null || Math.abs(ls[b]) < 0.001) continue;
      atoms[b].style.setProperty('letter-spacing', ls[b].toFixed(4) + 'em', 'important');
      atoms[b].setAttribute('data-uma-ls', '');
    }
    var now = all.map(rect);

    // только видимые элементы раскладки (спрятанные за краем — пропускаем)
    var idx = [];
    for (var i = 0; i < all.length; i++) {
      var d = design[i];
      if (!d.h || !d.w) continue;
      if (d.top - base.top < -5 || d.right < -5 || d.left > vw + 5) continue;
      idx.push(i);
    }
    idx.sort(function (p, q) { return design[p].top - design[q].top; });

    // отступы между элементами растут медленнее раскладки: при растяжении в z раз — в 1 + (z − 1)·GAP раз
    var z = parseFloat(getComputedStyle(ab.closest('.t-rec') || ab).getPropertyValue('--zoom')) || 1;
    var k = (1 + (z - 1) * GAP) / z;

    var shift = {}, nb = {}, maxOld = 0, maxNew = 0;
    idx.forEach(function (j) {
      var dj = design[j];
      // элементы над ним в той же полосе; держимся за ближайшие (самый низкий край)
      var low = -Infinity, lowNew = -Infinity;
      idx.forEach(function (i) {
        if (i === j || nb[i] == null) return;
        var di = design[i];
        if (di.bottom > dj.top + 1) return;                                            // не над ним
        if (Math.min(di.right, dj.right) - Math.max(di.left, dj.left) <= 1) return;     // другая полоса
        if (di.bottom > low + 2) { low = di.bottom; lowNew = nb[i]; }
        else if (di.bottom >= low - 2) lowNew = Math.max(lowNew, nb[i]);
      });
      var top;
      if (low === -Infinity) top = base.top + (dj.top - base.top) * k;                 // от верха блока
      else top = lowNew + (dj.top - low) * k;
      shift[j] = top - dj.top;
      nb[j] = top + now[j].h;
      maxOld = Math.max(maxOld, dj.bottom - base.top);
      maxNew = Math.max(maxNew, nb[j] - base.top);
    });
    var padOld = base.height - maxOld;

    idx.forEach(function (j) {
      var s = shift[j];
      if (Math.abs(s) < 0.5) return;
      var z = parseFloat(all[j].style.zoom) || 1;
      all[j].style.translate = '0 ' + (s / z).toFixed(2) + 'px';
    });

    // высота блока — на ту же разницу
    if (maxOld) {
      var h = Math.round(maxNew + Math.max(0, padOld) * k) + 'px';
      ab.__umaOrigH = ab.style.height;
      ab.style.setProperty('height', h, 'important');
      ab.__umaH = ab.style.height;
    }
  }

  var sig = '', relW = 0;
  function reflowAll() {
    var parts = [];
    recs().forEach(function (id) {
      var rec = document.getElementById('rec' + id);
      var ab = rec && rec.querySelector('.t396__artboard');
      if (!ab) return;
      if (!ab.__umaFluidL) {
        ab.__umaFluidL = true;
        ab.addEventListener('artBoardResized', later);
      }
      try { reflow(ab); } catch (e) {}
      parts.push(ab.style.height);
    });
    // элементы сдвинулись — позиции анимаций по скроллу надо пересчитать
    var s = parts.join(',');
    // Тильда перерисовала блоки под новую ширину (сама, по resize) — строки заголовков пересобрать
    if (inFluid() && relW !== width()) {
      relW = width();
      try { window.dispatchEvent(new Event('uma:relayout')); } catch (e) {}
    }
    if (s !== sig) {
      sig = s;
      try { if (window.ScrollTrigger) window.ScrollTrigger.refresh(); } catch (e) {}
      try { window.dispatchEvent(new Event('uma:reflow')); } catch (e) {}
    }
  }

  function mark() {
    var h = document.documentElement;
    h.classList.toggle('uma-fluid', inFluid());
    h.classList.toggle('uma-fluid-m', inFluid() && window.umaRes() === PHONE);
    h.classList.toggle('uma-fluid-d', inFluid() && window.umaRes() === DESK);
  }

  var rf;
  function later() { clearTimeout(rf); rf = setTimeout(reflowAll, 120); }

  function run() {
    patch();
    build();
    mark();
    if (inFluid()) relayout();
    reflowAll();
    later();
  }

  // как можно раньше: если Тильда ещё не рисовала блоки, она сразу возьмёт нужную раскладку
  if (!patch()) {
    // скрипт Тильды ещё не загрузился — ждём его, чтобы подменить выбор раскладки до первой отрисовки
    var tries = 0, poll = setInterval(function () {
      if (patch() || ++tries > 400) { clearInterval(poll); if (patched && inFluid()) relayout(); }
    }, 15);
  }
  mark();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();
  window.addEventListener('load', function () { patch(); mark(); if (inFluid()) relayout(); reflowAll(); later(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { reflowAll(); });

  // при смене ширины Тильда сама перерисует блоки (через подменённый выбор раскладки)
  var lw = width(), rt;
  window.addEventListener('resize', function () {
    if (width() === lw) return;
    lw = width();
    clearTimeout(rt);
    rt = setTimeout(mark, 50);   // сдвиги пересчитаются, когда Тильда перерисует блоки (artBoardResized)
  });
})();
