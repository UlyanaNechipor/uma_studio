/* UMA · project-page
   Страница кейса. В Тильде на странице проекта стоит ядро (tilda/core.html)
   и блок с одной строкой:  <div id="uma-project" data-project="rosi"></div>
   Скрипт берёт projects/<data-project>.json из репозитория и собирает страницу.
   Картинки: projects/<slug>/<name>-1200.webp и <name>-2400.webp.
   Стили — css/project-page.css. */
(function () {
  var REPO = 'UlyanaNechipor/uma_studio';

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  // абзац: пустая строка — отбивка, \n — перенос строки
  function para(t) {
    if (t === '') return '<p class="uma-project__spacer" aria-hidden="true"></p>';
    return '<p>' + esc(t).replace(/\n/g, '<br>') + '</p>';
  }

  /* ---------- картинки ----------
     Основной адрес — jsDelivr (CDN), запасной — raw.githubusercontent. */
  function imgSources(slug, name) {
    var ref = (window.UMA && window.UMA.ref) || 'main';
    var path = 'projects/' + slug + '/' + name;
    return {
      cdn: 'https://cdn.jsdelivr.net/gh/' + REPO + '@' + ref + '/' + path,
      raw: 'https://raw.githubusercontent.com/' + REPO + '/' + ref + '/' + path
    };
  }
  function figure(slug, img, extraClass) {
    if (!img) return '';
    var s = imgSources(slug, img.name || img.image);
    var ratio = img.w && img.h ? ' style="aspect-ratio:' + img.w + ' / ' + img.h + '"' : '';
    return '<figure class="uma-project__figure' + (extraClass ? ' ' + extraClass : '') + '"' + ratio +
      ' data-label="' + esc(img.alt) + '">' +
      '<img loading="lazy" decoding="async" alt="' + esc(img.alt) + '"' +
      (img.w && img.h ? ' width="' + img.w + '" height="' + img.h + '"' : '') +
      ' src="' + s.cdn + '-1200.webp"' +
      ' srcset="' + s.cdn + '-1200.webp 1200w, ' + s.cdn + '-2400.webp 2400w"' +
      ' sizes="(max-width: 1920px) 97vw, 1856px"' +
      ' data-raw="' + s.raw + '">' +
      '</figure>';
  }

  function arrow() {
    // треугольник (lucide «triangle»), повёрнут стилями
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13.73 4a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/></svg>';
  }
  function pad2(n) { n = String(n); return n.length < 2 ? '0' + n : n; }

  function render(mount, d) {
    var slug = d.slug;
    var h = '';

    h += '<article class="uma-project" aria-labelledby="uma-project-title">';

    // шапка кейса
    h += '<header class="uma-project__top"><div class="uma-project__left">' +
      '<h1 class="uma-project__title" id="uma-project-title">' + esc(d.title) + '</h1>' +
      (d.back ? '<a class="uma-project__back" href="' + esc(d.back.url) + '">' + esc(d.back.label) + '</a>' : '') +
      '</div><div class="uma-project__meta">';
    (d.meta || []).forEach(function (g) {
      h += '<dl class="uma-project__meta-group"><dt>' + esc(g.title) + '</dt>' +
        g.items.map(function (i) { return '<dd>' + esc(i) + '</dd>'; }).join('') + '</dl>';
    });
    h += '</div></header>';

    h += figure(slug, d.cover && { name: d.cover.image, w: d.cover.w, h: d.cover.h, alt: d.cover.alt }, 'uma-project__cover');

    // вступление
    if (d.intro) {
      h += '<section class="uma-project__intro"><div class="uma-project__lead">' +
        d.intro.lead.map(para).join('') + '</div><div class="uma-project__cols">' +
        d.intro.columns.map(function (c) { return '<div class="uma-project__col">' + c.map(para).join('') + '</div>'; }).join('') +
        '</div></section>';
    }

    // разделы
    (d.sections || []).forEach(function (s) {
      var gap = s.gap ? ' style="--up-pgap:' + s.gap + 'px"' : '';
      h += '<section class="uma-project__section"><div class="uma-project__head">' +
        '<h2 class="uma-project__h2">' + esc(s.title) + '</h2>';
      if (s.layout === 'split') {
        h += '<div class="uma-project__cols"' + gap + '>' + s.columns.map(function (c) {
          return '<div class="uma-project__col">' + c.map(para).join('') + '</div>';
        }).join('') + '</div>';
      } else {
        h += '<div class="uma-project__aside"' + gap + '>' + s.columns[0].map(para).join('') + '</div>';
      }
      h += '</div>' + figure(slug, s.image) + figure(slug, s.after) + '</section>';
    });

    // пагинация
    var p = d.pagination;
    if (p) {
      h += '<nav class="uma-project__pager" aria-label="Другие проекты">' +
        (p.prev ? '<a class="is-prev" href="' + esc(p.prev.url) + '" rel="prev">' + arrow() + esc(p.prev.title) + '</a>' : '<span></span>') +
        '<div class="uma-project__count" aria-label="Проект ' + p.index + ' из ' + p.total + '">' +
          pad2(p.index) + '/<span>' + pad2(p.total) + '</span></div>' +
        (p.next ? '<a class="is-next" href="' + esc(p.next.url) + '" rel="next">' + esc(p.next.title) + arrow() + '</a>' : '<span></span>') +
        '</nav>';
    }

    h += '</article>';
    mount.innerHTML = h;
    if (d.title) document.title = d.title.toUpperCase() + ' — UMA';

    // картинки: плавное появление и запасной адрес, если CDN не ответил
    mount.querySelectorAll('.uma-project__figure img').forEach(function (img) {
      function done() { img.classList.add('is-loaded'); }
      if (img.complete && img.naturalWidth) done();
      img.addEventListener('load', done);
      img.addEventListener('error', function onErr() {
        var raw = img.getAttribute('data-raw');
        // ни CDN, ни запасной адрес не ответили: оставляем пустую подложку
        if (!raw || img.dataset.fallback) {
          img.classList.add('is-missing');
          img.parentNode.classList.add('is-empty');   // на плашке видна подпись: что здесь будет
          return;
        }
        img.dataset.fallback = '1';
        img.removeAttribute('srcset');
        img.src = raw + '-1200.webp';
      });
    });
  }

  function start() {
    var mount = document.getElementById('uma-project');
    if (!mount) return;
    var slug = (mount.getAttribute('data-project') || '').replace(/[^\w-]/g, '');
    if (!slug) return;
    var U = window.UMA || {};
    var base = U.base || ('https://raw.githubusercontent.com/' + REPO + '/main/');
    fetch(base + 'projects/' + slug + '.json?v=' + encodeURIComponent(U.version || Date.now()), { cache: 'no-cache' })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (d) { render(mount, d); })
      .catch(function (e) { console.warn('UMA project: не загрузился проект ' + slug, e); });
  }

  // window.UMA (адрес источника и версия) появляется сразу после выполнения файлов
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(start, 0); });
  else setTimeout(start, 0);
})();
