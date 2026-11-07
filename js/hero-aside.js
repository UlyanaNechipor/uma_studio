/* UMA · hero-aside
   Абстрактная заливка в квадрате справа от галереи на первом экране (десктоп).
   Квадрат — Zero-фигура в Тильде (ELEM_ID), заливку рисует WebGL прямо в ней:
     • медленно текущая дуга света на тёмном фоне, с зерном, как отпечаток на плёнке;
     • под курсором поле «расступается»: изгибается, и цвет в следе становится ярче;
     • вне экрана и в фоновой вкладке не рисуется; при «уменьшении движения» — один кадр.
   Без WebGL остаётся мягкий градиент из CSS (css/hero-aside.css).
   Цвета — PALETTE ниже. */
(function () {
  /* ================= НАСТРОЙКИ ================= */
  var REC_ID  = 'rec3979597401';
  var ELEM_ID = '1794087491311000003';   // фигура-квадрат в Тильде
  var PALETTE = {
    ink:   '#0c0c0d',   // фон
    deep:  '#3a1208',   // тень дуги
    ember: '#d94f30',   // основной цвет дуги (акцент сайта)
    glow:  '#ffb489',   // светлая кромка
    core:  '#fff4ea'    // самая яркая нить
  };
  var SPEED = 1.0;      // скорость течения
  var WAKE  = 1.0;      // сила следа от курсора
  var MAX_DPR = 1.5;    // предел плотности пикселей (экономит видеокарту)
  /* ============================================= */

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var mouse  = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  function rgb(h) {
    var n = parseInt(h.replace('#', ''), 16);
    return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255];
  }

  var VS = '#version 300 es\nin vec2 p;out vec2 vUv;void main(){vUv=p*.5+.5;gl_Position=vec4(p,0.,1.);}';
  var FS = [
    '#version 300 es',
    'precision highp float;',
    'in vec2 vUv;out vec4 frag;',
    'uniform vec2 uRes;uniform float uTime;uniform vec2 uMouse;uniform float uWake;uniform float uFrame;',
    'uniform vec3 cInk,cDeep,cEmber,cGlow,cCore;',
    'float hash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}',
    'float noise(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.-2.*f);',
    ' return mix(mix(hash(i),hash(i+vec2(1,0)),u.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x),u.y);}',
    'float fbm(vec2 p){float v=0.,a=.5;mat2 m=mat2(1.6,1.2,-1.2,1.6);for(int i=0;i<5;i++){v+=a*noise(p);p=m*p;a*=.5;}return v;}',
    'void main(){',
    ' float asp=uRes.x/uRes.y;',
    ' vec2 uv=vUv;vec2 p=vec2((uv.x-.5)*asp,uv.y-.5);',
    // след курсора: поле расступается от точки
    ' vec2 m=vec2((uMouse.x-.5)*asp,uMouse.y-.5);vec2 dm=p-m;float fall=exp(-dot(dm,dm)*14.);',
    ' p+=dm*fall*.9*uWake;',
    ' float t=uTime;',
    ' vec2 q=vec2(fbm(p*1.1+vec2(0.,t*.03)),fbm(p*1.1+vec2(5.2,-t*.025)));',
    ' vec2 w=p+(q-.5)*.32;',
    // большая дуга: расстояние до окружности за правым нижним углом
    ' vec2 c=vec2(.55*asp,-.95);float R=1.12+.04*sin(t*.1);',
    ' float d=length(w-c)-R;',
    ' float n=fbm(w*1.8-t*.04);',
    ' float band=exp(-pow(d/(.13+.08*n),2.));',
    ' float rim=exp(-pow((d+.015*(n-.5))/.022,2.));',
    ' float haze=exp(-abs(d)*5.5)*.38;',
    // холодный отсвет с внешней стороны дуги
    ' float cool=exp(-pow((d-.16)/.12,2.))*.35;',
    ' vec3 col=cInk;',
    ' col=mix(col,cDeep,clamp(haze,0.,1.));',
    ' col=mix(col,vec3(.16,.2,.32),clamp(cool*(.6+.8*n),0.,1.));',
    ' col=mix(col,cEmber,clamp(band*.95,0.,1.));',
    ' col=mix(col,cGlow,clamp(band*band*.55+rim*.6,0.,1.));',
    ' col=mix(col,cCore,clamp(rim*rim*.85,0.,1.));',
    // за дугой (внутри круга) — тише
    ' col*=mix(1.,.55,smoothstep(0.,-.45,d));',
    // в следе курсора — ярче и насыщеннее
    ' float lum=dot(col,vec3(.299,.587,.114));col=mix(vec3(lum),col,1.+.6*fall*uWake);col+=cGlow*fall*uWake*.06;',
    // виньетка и зерно
    ' col*=1.-.35*pow(length(uv-.5)*1.2,2.);',
    ' float g=hash(uv*uRes+fract(uFrame*.618)*71.)-.5;col+=g*.045;',
    ' frag=vec4(clamp(col,0.,1.),1.);',
    '}'
  ].join('\n');

  function setup(el) {
    if (el.__umaAside) return;
    var atom = el.querySelector('.tn-atom') || el;
    var r = el.getBoundingClientRect();
    if (r.width < 40 || r.height < 40 || r.top + window.scrollY < -100) return;   // спрятан в этой раскладке
    el.__umaAside = true;
    el.classList.add('uma-aside');

    var cv = document.createElement('canvas');
    cv.className = 'uma-aside__cv';
    cv.setAttribute('aria-hidden', 'true');
    atom.appendChild(cv);

    var gl = cv.getContext('webgl2', { antialias: false, alpha: false, premultipliedAlpha: false });
    if (!gl) { el.classList.add('is-fallback'); return; }

    function sh(type, src) { var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; }
    var pr = gl.createProgram();
    gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS));
    gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) { el.classList.add('is-fallback'); return; }
    gl.useProgram(pr);
    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(pr, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    var U = {};
    ['uRes', 'uTime', 'uMouse', 'uWake', 'uFrame', 'cInk', 'cDeep', 'cEmber', 'cGlow', 'cCore'].forEach(function (n) { U[n] = gl.getUniformLocation(pr, n); });
    gl.uniform3fv(U.cInk, rgb(PALETTE.ink));
    gl.uniform3fv(U.cDeep, rgb(PALETTE.deep));
    gl.uniform3fv(U.cEmber, rgb(PALETTE.ember));
    gl.uniform3fv(U.cGlow, rgb(PALETTE.glow));
    gl.uniform3fv(U.cCore, rgb(PALETTE.core));

    var W = 0, H = 0;
    function size() {
      var b = cv.getBoundingClientRect();
      var dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      var w = Math.max(1, Math.round(b.width * dpr)), h = Math.max(1, Math.round(b.height * dpr));
      if (w === W && h === H) return;
      W = w; H = h; cv.width = w; cv.height = h;
      gl.viewport(0, 0, w, h);
      gl.uniform2f(U.uRes, w, h);
    }

    // курсор: цель и сглаженное положение, сила следа затухает
    var mx = 0.3, my = 0.6, tx = mx, ty = my, wake = 0, wakeT = 0;
    if (mouse && !reduce) {
      el.addEventListener('pointermove', function (e) {
        var b = cv.getBoundingClientRect();
        tx = (e.clientX - b.left) / b.width;
        ty = 1 - (e.clientY - b.top) / b.height;
        wakeT = WAKE;
      });
      el.addEventListener('pointerleave', function () { wakeT = 0; });
    }

    var visible = true, raf = 0, t0 = performance.now(), frame = 0, last = t0;
    function draw(now) {
      raf = 0;
      size();
      var dt = Math.min(0.05, (now - last) / 1000); last = now;
      var k = 1 - Math.pow(0.0015, dt);            // плавное догоняние курсора
      mx += (tx - mx) * k; my += (ty - my) * k;
      wake += (wakeT - wake) * (1 - Math.pow(0.02, dt));
      gl.uniform1f(U.uTime, reduce ? 12.0 : (now - t0) / 1000 * SPEED + 12.0);
      gl.uniform2f(U.uMouse, mx, my);
      gl.uniform1f(U.uWake, wake);
      gl.uniform1f(U.uFrame, reduce ? 0 : frame++);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      if (!el.classList.contains('is-ready')) el.classList.add('is-ready');
      if (!reduce) loop();
    }
    function loop() { if (!raf && visible && !document.hidden) raf = requestAnimationFrame(draw); }

    if (window.IntersectionObserver) {
      new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible) loop(); }, { threshold: 0 }).observe(el);
    }
    document.addEventListener('visibilitychange', function () { if (!document.hidden) { last = performance.now(); loop(); } });
    window.addEventListener('resize', function () { W = 0; loop(); });
    raf = requestAnimationFrame(draw);
  }

  function init() {
    var rec = document.getElementById(REC_ID);
    if (!rec) return;
    var el = rec.querySelector('.t396__elem[data-elem-id="' + ELEM_ID + '"]');
    if (el) setup(el);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(init, 0); });
  else setTimeout(init, 0);
  window.addEventListener('load', init);
  window.addEventListener('uma:relayout', init);
  var rt;
  window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(init, 300); });
})();
