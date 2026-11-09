/* Working Title · поведение страницы. Без библиотек.
   Порядок при загрузке:
     прелоадер (логотип заливается и улетает в шапку) → меню в шапке →
     тексты первого экрана → галерея и фигура справа раскрываются шторкой → заливка заголовка.
   Дальше при прокрутке: блоки появляются по очереди, заголовки разделов заливаются за прокруткой.
   Плюс: смена темы (круг от кнопки), фон за курсором, галерея, фигура справа (WebGL). */
(function () {
  'use strict';
  var html = document.documentElement;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var mouse = matchMedia('(hover: hover) and (pointer: fine)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var ready = [];   // что запустить, когда прелоадер ушёл

  /* ================= НАСТРОЙКИ ================= */
  var PL = { fillDelay: 1000, fill: 1800, flight: 1400 };      // мс: прелоадер
  var HERO_DELAY = 850;      // мс после вылета логотипа: тексты первого экрана
  var GALLERY_DELAY = 1250;  // мс после вылета: раскрытие галереи
  var TITLE_DELAY = 1450;    // мс после вылета: заливка главного заголовка
  var TITLE_FILL = 1800;     // мс: заливка главного заголовка
  var FEATHER = 0.9;         // мягкий край заливки, в долях кегля
  var LEAD_FILL = 0.12;      // доля заливки заголовка раздела в момент его появления
  var STEP = 140;            // мс: шаг между элементами, появившимися вместе
  var GALLERY_INTERVAL = 2800;
  /* ============================================= */

  /* ---------------- прелоадер ---------------- */
  function preloader() {
    var pl = $('#preloader'), logo = $('.pl__logo'), ink = $('.pl__ink'), target = $('.hd__logo');
    function release() {
      html.classList.add('is-ready');
      ready.forEach(function (f) { f(); });
      ready = [];
    }
    if (!pl || reduce) { if (pl) pl.classList.add('is-gone'); html.classList.add('is-docked', 'hero-in'); release(); return; }
    // логотип по центру экрана, шириной экран минус поля
    function place() {
      var vw = innerWidth, m = vw >= 960 ? 64 : 32, w = logo.offsetWidth;
      var k = (vw - m) / w;
      logo.style.transform = 'translate(' + (-w * k / 2) + 'px,' + (-logo.offsetHeight * k / 2) + 'px) scale(' + k + ')';
    }
    function start() {
      place();
      pl.classList.add('is-ready');
      var t0 = performance.now() + PL.fillDelay;
      (function fill(now) {
        var p = clamp((now - t0) / PL.fill, 0, 1);
        var e = 1 - Math.pow(1 - p, 3);                       // мягкое торможение
        var a = e * 110 - 10;                                   // окно с мягким краем 10%
        ink.style.setProperty('--a', a + '%'); ink.style.setProperty('--b', (a + 10) + '%');
        if (p < 0.72) return requestAnimationFrame(fill);       // выглядит залитым — вылетаем
        ink.style.setProperty('--a', '100%'); ink.style.setProperty('--b', '110%');
        fly();
      })(performance.now());
    }
    function fly() {
      // долетаем ровно в логотип шапки
      place();                                                  // окно могло смениться за время заливки
      var t = target.getBoundingClientRect(), w = logo.offsetWidth, h = logo.offsetHeight;
      var k = t.width / w;
      pl.classList.add('is-fly', 'is-done');
      logo.style.transform = 'translate(' + (t.left - innerWidth / 2) + 'px,' + (t.top + t.height / 2 - h * k / 2 - innerHeight / 2) + 'px) scale(' + k + ')';
      setTimeout(function () { html.classList.add('is-docked'); pl.classList.add('is-gone'); }, PL.flight);
      setTimeout(function () { html.classList.add('hero-in'); }, HERO_DELAY);
      release();
    }
    var go = function () { start(); go = function () {}; };
    if (document.fonts && document.fonts.load) {
      Promise.all([document.fonts.load('700 100px Manrope'), document.fonts.load('300 100px Manrope')]).then(function () { go(); }, function () { go(); });
    }
    setTimeout(function () { go(); }, 1500);
    setTimeout(function () { if (!html.classList.contains('is-ready')) { pl.classList.add('is-gone'); html.classList.add('is-docked', 'hero-in'); release(); } }, 8000);
  }

  /* ---------------- заливка заголовков ---------------- */
  var fills = [];
  function colors() {
    var cs = getComputedStyle(html);
    function rgb(v) {
      var d = document.createElement('i'); d.style.color = v; document.body.appendChild(d);
      var c = getComputedStyle(d).color.match(/\d+/g).slice(0, 3).map(Number); d.remove(); return c;
    }
    var base = rgb(cs.getPropertyValue('--fill-base').trim()), ink = rgb(cs.getPropertyValue('--fill-ink').trim());
    // ступени мягкого края: 100% → 84% → 50% → 16% → 0%
    return [1, 0.84, 0.5, 0.16, 0].map(function (k) {
      return 'rgb(' + [0, 1, 2].map(function (i) { return Math.round(base[i] + (ink[i] - base[i]) * k); }).join(',') + ')';
    });
  }
  var C = null;
  function paint(line) {
    var p = line._p, f = line._f, c = C;
    line.style.backgroundImage = 'linear-gradient(90deg,' + c[0] + ' 0px,' + c[0] + ' ' + (p - f) + 'px,' + c[1] + ' ' + (p - f * .75) + 'px,' +
      c[2] + ' ' + (p - f * .5) + 'px,' + c[3] + ' ' + (p - f * .25) + 'px,' + c[4] + ' ' + p + 'px,' + c[4] + ' 100%)';
  }
  // разбивка текста на строки по фактическим переносам
  function split(el) {
    if (!el._src) el._src = el.innerHTML;
    el.innerHTML = el._src;
    var words = [];
    (function walk(n) {
      [].slice.call(n.childNodes).forEach(function (c) {
        if (c.nodeType === 3) {
          var frag = document.createDocumentFragment();
          c.nodeValue.split(/(\s+)/).forEach(function (w) {
            if (!w) return;
            if (/^\s+$/.test(w)) frag.appendChild(document.createTextNode(w));
            else { var s = document.createElement('span'); s.textContent = w; words.push(s); frag.appendChild(s); }
          });
          c.replaceWith(frag);
        } else if (c.nodeName !== 'BR') walk(c);
      });
    })(el);
    var rows = [], last = null;
    words.forEach(function (w) {
      var top = Math.round(w.offsetTop);
      if (top !== last) { rows.push([]); last = top; }
      rows[rows.length - 1].push(w.textContent);
    });
    el.innerHTML = rows.map(function (r) { return '<span class="fl-line">' + r.join(' ') + '</span>'; }).join('');
    return $$('.fl-line', el);
  }
  function build(it) {
    var fs = parseFloat(getComputedStyle(it.el).fontSize) || 16;
    it.lines = split(it.el);
    it.f = fs * FEATHER;
    it.w = it.lines.map(function (l) { return l.getBoundingClientRect().width; });
    it.total = it.w.reduce(function (a, b) { return a + b; }, 0) || 1;
    render(it, it.shown || 0, true);
  }
  // прогресс 0..1 → строки по очереди, каждая пропорционально своей ширине
  function render(it, e, force) {
    if (!force && Math.abs(e - (it.shown || 0)) < 0.0005) return;
    it.shown = e;
    var acc = 0;
    it.lines.forEach(function (line, k) {
      var a = acc / it.total, b = (acc + it.w[k]) / it.total; acc += it.w[k];
      var t = e <= a ? 0 : e >= b ? 1 : (e - a) / (b - a);
      line._p = Math.round(t * (it.w[k] + it.f) * 2) / 2; line._f = it.f; paint(line);
    });
  }
  function fillInit() {
    C = colors();
    $$('[data-fill]').forEach(function (el) {
      var it = { el: el, mode: el.getAttribute('data-fill') || 'scroll', target: 0, floor: 0, shown: 0 };
      fills.push(it); build(it);
    });
    if (reduce) { fills.forEach(function (it) { render(it, 1, true); }); return; }
    // главный заголовок — по времени после прелоадера
    ready.push(function () {
      fills.filter(function (it) { return it.mode === 'load'; }).forEach(function (it) {
        setTimeout(function () {
          var t0 = performance.now();
          (function step(now) { var p = clamp((now - t0) / TITLE_FILL, 0, 1); it.target = p; render(it, p); if (p < 1) requestAnimationFrame(step); })(t0);
        }, TITLE_DELAY);
      });
    });
    // заголовки разделов — за прокруткой: от «верх на 85% экрана» до «низ на 65%», с плавным догонянием
    var last = performance.now();
    (function tick(now) {
      var dt = Math.min(0.1, (now - last) / 1000); last = now;
      var vh = innerHeight;
      fills.forEach(function (it) {
        if (it.mode !== 'scroll') return;
        var r = it.el.getBoundingClientRect();
        var s0 = vh * 0.85 - r.top, s1 = vh * 0.65 - r.bottom;     // >0 — точка пройдена
        var p = clamp(s0 / (s0 - s1 || 1), 0, 1);
        it.target = Math.max(p, it.floor);
        var cur = it.shown + (it.target - it.shown) * (1 - Math.exp(-dt / 0.17));
        render(it, Math.abs(it.target - cur) < 0.001 ? it.target : cur);
      });
      requestAnimationFrame(tick);
    })(last);
  }
  // заголовок появился (класс is-in) — заливка сама проходит первые 12%
  function leadFill(el) {
    var it = fills.filter(function (x) { return x.el === el || el.contains(x.el); })[0];
    if (!it || it.mode !== 'scroll' || it.lead) return;
    it.lead = true;
    setTimeout(function () {
      var t0 = performance.now();
      (function step(now) { var p = clamp((now - t0) / 1100, 0, 1); it.floor = LEAD_FILL * (1 - Math.pow(1 - p, 2)); if (p < 1) requestAnimationFrame(step); })(t0);
    }, 250);
  }

  /* ---------------- появление при прокрутке ---------------- */
  function reveal() {
    // что появляется: прямые части каждого блока (кроме первого экрана), колонки подвала
    var items = $$('main > section:not(.hero) > *, .projects .prow, .about__photos > img, .lab__it, .svc, .cta__act > *, .about__act > *, .ft > *')
      .filter(function (el) { return !el.matches('.projects__list, .lab__grid, .about__photos, .about__act, .cta__act'); });
    items.forEach(function (el) { el.classList.add('rv'); });
    // мобилка, услуги: выезжают слева, по очереди
    if (innerWidth < 960) $$('.svc').forEach(function (el) { el.style.setProperty('--rv-x', '-56px'); el.style.setProperty('--rv-y', '0px'); });
    if (reduce || !window.IntersectionObserver) { items.forEach(function (el) { el.classList.add('is-in'); }); return; }
    var queue = [], timer = 0;
    function flush() {
      timer = 0;
      queue.sort(function (a, b) { var ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect(); return (ra.top - rb.top) || (ra.left - rb.left); });
      queue.forEach(function (el, i) {
        el.style.setProperty('--rv-d', (i * STEP / 1000) + 's');
        el.classList.add('is-in');
        if (el.hasAttribute('data-fill')) leadFill(el);
      });
      queue = [];
    }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        io.unobserve(e.target); queue.push(e.target);
      });
      if (queue.length && !timer) timer = setTimeout(flush, 30);
    }, { rootMargin: '0px 0px -12% 0px' });
    // до ухода прелоадера ничего не появляется
    ready.push(function () { setTimeout(function () { items.forEach(function (el) { io.observe(el); }); }, reduce ? 0 : HERO_DELAY + 300); });
  }

  /* ---------------- тема ---------------- */
  function theme() {
    var KEY = 'uma-theme', btn = $('[data-theme-toggle]'), cv = $('#wipe'), ctx = cv.getContext('2d'), busy = false;
    function label() { btn.setAttribute('aria-label', html.classList.contains('light-theme') ? 'Тёмная тема' : 'Светлая тема'); }
    function set(light) {
      html.classList.toggle('light-theme', light);
      try { localStorage.setItem(KEY, light ? 'light' : 'dark'); } catch (e) {}
      C = colors(); fills.forEach(function (it) { render(it, it.shown, true); });
      label();
    }
    label();
    btn.addEventListener('click', function () {
      if (busy) return;
      var light = !html.classList.contains('light-theme');
      if (reduce) return set(light);
      // круг цвета новой темы расходится от кнопки
      busy = true; html.classList.add('is-wiping');
      cv.width = innerWidth; cv.height = innerHeight;
      var b = btn.getBoundingClientRect(), x = b.left + b.width / 2, y = b.top + b.height / 2;
      var max = Math.hypot(innerWidth, innerHeight) * 1.1, r = 0, switched = false;
      var col = light ? '#f0f0f0' : '#111211';
      (function step() {
        r += (max - r) * 0.12 + 15;
        ctx.clearRect(0, 0, cv.width, cv.height);
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = col; ctx.fill();
        if (!switched && r >= max * 0.45) { switched = true; set(light); }
        if (r >= max) { ctx.clearRect(0, 0, cv.width, cv.height); busy = false; html.classList.remove('is-wiping'); return; }
        requestAnimationFrame(step);
      })();
    });
  }

  /* ---------------- фон за курсором ---------------- */
  function trail() {
    if (reduce) return;
    var cv = $('#trail'), ctx = cv.getContext('2d'), RES = 0.5;
    // шапка непрозрачная и лежит поверх общего холста — в неё копируется верхняя полоса следа
    var hc = $('.hd__trail'), hctx = hc && hc.getContext('2d'), hd = $('.hd');
    function size() {
      cv.width = Math.ceil(innerWidth * RES); cv.height = Math.ceil(innerHeight * RES); ctx.setTransform(RES, 0, 0, RES, 0, 0);
      if (hc) { hc.width = cv.width; hc.height = Math.ceil((hd.offsetHeight + 120) * RES); }
    }
    function copyHeader() {
      if (!hc) return;
      hctx.clearRect(0, 0, hc.width, hc.height);
      hctx.drawImage(cv, 0, 0, cv.width, hc.height, 0, 0, hc.width, hc.height);
    }
    size(); addEventListener('resize', size);
    var mx = -1000, my = -1000, sx = -1000, sy = -1000, pts = [], MAX = 55, running = false;
    function input(x, y) { mx = x; my = y; if (sx === -1000) { sx = x; sy = y; } wake(); }
    addEventListener('mousemove', function (e) { input(e.clientX, e.clientY); });
    addEventListener('touchstart', function (e) { if (e.touches[0]) input(e.touches[0].clientX, e.touches[0].clientY); }, { passive: true });
    addEventListener('touchmove', function (e) { if (e.touches[0]) input(e.touches[0].clientX, e.touches[0].clientY); }, { passive: true });
    function off() { mx = my = -1000; }
    addEventListener('touchend', off); addEventListener('touchcancel', off); document.addEventListener('mouseleave', off);
    function wake() { if (running) return; running = true; cv.style.visibility = 'visible'; if (hc) hc.style.visibility = 'visible'; requestAnimationFrame(frame); }
    function frame() {
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      if (mx !== -1000) {
        sx += (mx - sx) * 0.08; sy += (my - sy) * 0.08;
        var p0 = pts[0] || { x: 0, y: 0 };
        if (Math.hypot(sx - p0.x, sy - p0.y) > 1) { pts.unshift({ x: sx, y: sy, a: 1 }); if (pts.length > MAX) pts.pop(); }
      } else { sx = sy = -1000; }
      pts.forEach(function (p) { p.a -= 0.022; });
      pts = pts.filter(function (p) { return p.a > 0; });
      for (var i = 0; i < pts.length - 1; i++) {
        var p1 = pts[i], p2 = pts[i + 1], pr = (MAX - i) / MAX;
        ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.quadraticCurveTo(p1.x, p1.y, (p1.x + p2.x) / 2, (p1.y + p2.y) / 2);
        ctx.lineWidth = 85 * Math.pow(pr, 1.4); ctx.lineCap = ctx.lineJoin = 'round';
        var al = Math.max(0, p1.a * pr), g = ctx.createRadialGradient(p1.x, p1.y, 0, p1.x, p1.y, ctx.lineWidth);
        g.addColorStop(0, 'rgba(255,240,215,' + 0.85 * al + ')');
        g.addColorStop(0.25, 'rgba(217,79,48,' + 0.55 * al + ')');
        g.addColorStop(0.65, 'rgba(170,55,30,' + 0.12 * al + ')');
        g.addColorStop(1, 'rgba(17,18,17,0)');
        ctx.strokeStyle = g; ctx.stroke();
      }
      copyHeader();
      if (!pts.length && (mx === -1000 || (Math.abs(mx - sx) < 1 && Math.abs(my - sy) < 1))) { running = false; cv.style.visibility = 'hidden'; if (hc) hc.style.visibility = 'hidden'; return; }
      requestAnimationFrame(frame);
    }
  }

  /* ---------------- галерея первого экрана ---------------- */
  function gallery() {
    var box = $('[data-gallery]'); if (!box) return;
    var strip = $('.hg__strip', box), btn = $('.hg__pause', box);
    var slides = $$('.hg__slide', box), n = slides.length;
    // копия первого кадра в конце — бесконечная лента без рывка
    var clone = slides[0].cloneNode(true); clone.classList.remove('is-active'); clone.setAttribute('aria-hidden', 'true'); strip.appendChild(clone);
    slides.push(clone);
    slides.forEach(function (s) { var im = $('img', s); if (im) im.loading = 'eager'; });
    var i = 0, timer = 0, paused = false, visible = true, shown = false;
    function go(k, jump) {
      i = k;
      strip.style.transition = jump ? 'none' : '';
      strip.style.transform = 'translate3d(0,' + (-100 * i) + '%,0)';
      slides.forEach(function (s, j) { s.classList.toggle('is-active', j === i); });
      if (jump) { strip.offsetHeight; strip.style.transition = ''; }
    }
    strip.addEventListener('transitionend', function (e) {
      if (e.target === strip && i === n) { slides[0].classList.add('is-active'); slides[n].classList.remove('is-active'); go(0, true); }
    });
    function next() { if (i === n) go(0, true); go(i + 1); }
    function prev() { if (i === 0) go(n, true); go(i - 1); }
    function schedule() {
      clearTimeout(timer);
      if (!shown || paused || !visible || document.hidden || reduce) return;
      timer = setTimeout(function () { next(); schedule(); }, GALLERY_INTERVAL);
    }
    btn.addEventListener('click', function () {
      paused = !paused;
      box.classList.toggle('is-paused', paused);
      btn.setAttribute('aria-pressed', paused); btn.setAttribute('aria-label', paused ? 'Продолжить' : 'Пауза');
      if (!paused) next();
      schedule();
    });
    // свайп на телефоне
    var x0 = null;
    box.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    box.addEventListener('touchend', function (e) {
      if (x0 === null) return; var dx = e.changedTouches[0].clientX - x0; x0 = null;
      if (Math.abs(dx) > 40) { dx < 0 ? next() : prev(); schedule(); }
    });
    if (mouse) { box.tabIndex = 0; box.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { next(); schedule(); } if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { prev(); schedule(); } }); }
    if (window.IntersectionObserver) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; schedule(); }).observe(box);
    document.addEventListener('visibilitychange', schedule);
    ready.push(function () {
      setTimeout(function () {
        box.classList.add('is-in');
        var aside = $('.hero__aside'); if (aside) aside.classList.add('is-in');
        shown = true; setTimeout(schedule, 600);
      }, reduce ? 0 : GALLERY_DELAY);
    });
  }

  /* ---------------- фигура справа (WebGL) ---------------- */
  function aside() {
    var el = $('.hero__aside'), cv = $('.hero__cv');
    if (!el || !cv || getComputedStyle(el).display === 'none') return;
    var gl = cv.getContext('webgl2', { antialias: false, alpha: false });
    if (!gl) return;
    var VS = '#version 300 es\nin vec2 p;out vec2 vUv;void main(){vUv=p*.5+.5;gl_Position=vec4(p,0.,1.);}';
    var FS = ['#version 300 es', 'precision highp float;', 'in vec2 vUv;out vec4 frag;',
      'uniform vec2 uRes;uniform float uTime;uniform vec2 uMouse;uniform float uWake;uniform float uFrame;',
      'const vec3 cInk=vec3(.047,.047,.051),cDeep=vec3(.227,.071,.031),cEmber=vec3(.851,.31,.188),cGlow=vec3(1.,.706,.537),cCore=vec3(1.,.957,.918);',
      'float hash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}',
      'float noise(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),u.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x),u.y);}',
      'float fbm(vec2 p){float v=0.,a=.5;mat2 m=mat2(1.6,1.2,-1.2,1.6);for(int i=0;i<4;i++){v+=a*noise(p);p=m*p;a*=.5;}return v;}',
      'void main(){float asp=uRes.x/uRes.y;vec2 uv=vUv;vec2 p=vec2((uv.x-.5)*asp,uv.y-.5);',
      'vec2 m=vec2((uMouse.x-.5)*asp,uMouse.y-.5);vec2 dm=p-m;float fall=exp(-dot(dm,dm)*14.);p+=dm*fall*.9*uWake;float t=uTime;',
      'vec2 q=vec2(fbm(p*1.1+vec2(0.,t*.03)),fbm(p*1.1+vec2(5.2,-t*.025)));vec2 w=p+(q-.5)*.32;',
      'vec2 c=vec2(.55*asp,-.95);float R=1.12+.04*sin(t*.1);float d=length(w-c)-R;float n=fbm(w*1.8-t*.04);',
      'float band=exp(-pow(d/(.13+.08*n),2.));float rim=exp(-pow((d+.015*(n-.5))/.022,2.));float haze=exp(-abs(d)*5.5)*.38;float cool=exp(-pow((d-.16)/.12,2.))*.35;',
      'vec3 col=cInk;col=mix(col,cDeep,clamp(haze,0.,1.));col=mix(col,vec3(.16,.2,.32),clamp(cool*(.6+.8*n),0.,1.));',
      'col=mix(col,cEmber,clamp(band*.95,0.,1.));col=mix(col,cGlow,clamp(band*band*.55+rim*.6,0.,1.));col=mix(col,cCore,clamp(rim*rim*.85,0.,1.));',
      'col*=mix(1.,.55,smoothstep(0.,-.45,d));float lum=dot(col,vec3(.299,.587,.114));col=mix(vec3(lum),col,1.+.6*fall*uWake);col+=cGlow*fall*uWake*.06;',
      'col*=1.-.35*pow(length(uv-.5)*1.2,2.);float g=hash(uv*uRes+fract(uFrame*.618)*71.)-.5;col+=g*.045;frag=vec4(clamp(col,0.,1.),1.);}'].join('\n');
    function sh(t, s) { var o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); return o; }
    var pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return;
    gl.useProgram(pr);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    var U = {}; ['uRes', 'uTime', 'uMouse', 'uWake', 'uFrame'].forEach(function (k) { U[k] = gl.getUniformLocation(pr, k); });
    var W = 0, H = 0, RES = 0.6, FPS = 30;
    function size() {
      var b = cv.getBoundingClientRect(), w = Math.max(1, Math.round(b.width * RES)), h = Math.max(1, Math.round(b.height * RES));
      if (w === W && h === H) return; W = cv.width = w; H = cv.height = h; gl.viewport(0, 0, w, h); gl.uniform2f(U.uRes, w, h);
    }
    var mx = .3, my = .6, tx = mx, ty = my, wake = 0, wakeT = 0;
    if (mouse && !reduce) {
      el.addEventListener('pointermove', function (e) { var b = cv.getBoundingClientRect(); tx = (e.clientX - b.left) / b.width; ty = 1 - (e.clientY - b.top) / b.height; wakeT = 1; });
      el.addEventListener('pointerleave', function () { wakeT = 0; });
    }
    var visible = true, raf = 0, t0 = performance.now(), last = t0, lastDraw = 0, frame = 0;
    function draw(now) {
      raf = 0;
      if (!reduce && now - lastDraw < 1000 / FPS - 2 && el.classList.contains('is-ready')) return loop();
      lastDraw = now; size();
      var dt = Math.min(.05, (now - last) / 1000); last = now;
      var k = 1 - Math.pow(.0015, dt); mx += (tx - mx) * k; my += (ty - my) * k;
      wake += (wakeT - wake) * (1 - Math.pow(.02, dt));
      gl.uniform1f(U.uTime, reduce ? 12 : (now - t0) / 1000 + 12); gl.uniform2f(U.uMouse, mx, my);
      gl.uniform1f(U.uWake, wake); gl.uniform1f(U.uFrame, reduce ? 0 : frame++);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      el.classList.add('is-ready');
      if (!reduce) loop();
    }
    function loop() { if (!raf && visible && !document.hidden) raf = requestAnimationFrame(draw); }
    if (window.IntersectionObserver) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; loop(); }).observe(el);
    document.addEventListener('visibilitychange', function () { last = performance.now(); loop(); });
    addEventListener('resize', function () { W = 0; loop(); });
    raf = requestAnimationFrame(draw);
  }

  /* ---------------- запуск ---------------- */
  function init() {
    theme(); trail(); gallery(); aside(); reveal();
    var go = function () { fillInit(); preloader(); };
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(go, go); else go();
    // пересборка строк заголовков при смене ширины
    var lw = innerWidth, rt = 0;
    addEventListener('resize', function () {
      if (innerWidth === lw) return; lw = innerWidth;
      clearTimeout(rt); rt = setTimeout(function () { fills.forEach(build); }, 200);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
