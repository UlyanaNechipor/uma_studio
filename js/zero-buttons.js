/* UMA · zero-buttons
   Кнопки из Zero-блоков ведут себя так же, как кнопки футера.
   В Тильде кнопки собраны группами без ссылки, поэтому действие задаётся здесь:
     «Написать нам» (группы .uma-btn-dark-view / .uma-btn-light-view) — письмо с темой
     «О нас»        (группа .uma-blur-btn)                              — плавно к блоку «О нас»
     почта          (текст umadigital@gmail.com)                        — копируется по клику
   Кнопки становятся доступны с клавиатуры (Tab, Enter, пробел).
   Стили — css/zero-buttons.css. */
(function () {
  /* ================= НАСТРОЙКИ ================= */
  var EMAIL    = 'umadigital@gmail.com';
  var SUBJECT  = 'Проект для UMA';
  var ABOUT_ID = 'rec3979597701';   // блок «О нас»: сюда ведёт кнопка, если нет якоря #about
  /* ============================================= */

  var ARROW = '<svg class="uma-zb__arrow" viewBox="0 0 12 12" aria-hidden="true"><path d="M3 9 9 3M4 3h5v5"/></svg>';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function scrollToAbout() {
    var t = document.querySelector('a[name="about"], #about') || document.getElementById(ABOUT_ID);
    if (!t) { location.hash = 'about'; return; }
    var header = document.getElementById('rec3979597301');
    var offset = header ? header.getBoundingClientRect().height : 0;
    var y = t.getBoundingClientRect().top + window.pageYOffset - offset;
    window.scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' });
  }

  function writeUs() {
    location.href = 'mailto:' + EMAIL + '?subject=' + encodeURIComponent(SUBJECT);
  }

  // общая часть: класс, стрелка, клик и клавиатура
  function make(el, label, action, opts) {
    if (el.__umaZb) return;
    el.__umaZb = true;
    el.classList.add('uma-zb');
    // стрелке и подсказке нужен позиционированный родитель; позицию Тильды не меняем, если она уже задана
    if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
    if (opts && opts.kind) el.classList.add('uma-zb--' + opts.kind);
    el.setAttribute('role', opts && opts.role || 'link');
    el.setAttribute('aria-label', label);
    if (!opts || opts.arrow !== false) el.insertAdjacentHTML('beforeend', ARROW);
    el.addEventListener('click', function (e) { e.preventDefault(); action(el); });
    el.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); action(el); }
    });
  }

  // почта копируется; если буфер обмена недоступен — открывается письмо
  function copyMail(el) {
    var note = el.querySelector('.uma-zb__note');
    var done = function () {
      note.textContent = 'Почта скопирована';
      el.classList.add('is-copied');
      clearTimeout(el.__umaT);
      el.__umaT = setTimeout(function () { el.classList.remove('is-copied'); }, 1800);
    };
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(EMAIL).then(done, writeUs);
    else writeUs();
  }

  // у «Написать нам» две версии под тёмную и светлую тему; в фокус попадает только видимая
  function syncFocus() {
    document.querySelectorAll('.uma-zb').forEach(function (el) {
      var hidden = getComputedStyle(el).opacity === '0' || getComputedStyle(el).pointerEvents === 'none';
      el.setAttribute('tabindex', hidden ? '-1' : '0');
      if (hidden) el.setAttribute('aria-hidden', 'true'); else el.removeAttribute('aria-hidden');
    });
  }

  function init() {
    var root = document.getElementById('allrecords');
    if (!root) return;

    root.querySelectorAll('.uma-btn-dark-view, .uma-btn-light-view').forEach(function (g) {
      make(g, 'Написать нам: письмо на ' + EMAIL, writeUs, { kind: 'primary' });
    });

    root.querySelectorAll('.uma-blur-btn').forEach(function (g) {
      make(g, 'О нас: перейти к блоку о студии', scrollToAbout, { kind: 'ghost' });
    });

    // почта: текстовый элемент с адресом (кроме шапки и футера)
    root.querySelectorAll('.t396__elem[data-elem-type="text"]').forEach(function (e) {
      var atom = e.querySelector('.tn-atom');
      if (!atom || atom.textContent.trim() !== EMAIL || e.closest('#rec3979597301')) return;
      make(e, 'Скопировать почту ' + EMAIL, copyMail, { kind: 'mail', role: 'button', arrow: false });
      e.insertAdjacentHTML('beforeend', '<span class="uma-zb__note" role="status" aria-live="polite"></span>');
    });

    syncFocus();
    // тема переключает видимую версию кнопки
    new MutationObserver(function () { setTimeout(syncFocus, 50); })
      .observe(document.body, { attributes: true, attributeFilter: ['class'] });
  }

  // Zero-блоки Тильда дорисовывает не сразу: запускаемся после загрузки и ещё раз чуть позже
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
  window.addEventListener('load', init);
  setTimeout(init, 1500);
})();
