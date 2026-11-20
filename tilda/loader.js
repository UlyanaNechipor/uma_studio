/* Shape of Sense · загрузчик статичного сайта в Тильде.
   Вставляется один раз в «Настройки сайта → Ещё → HTML-код для вставки внутрь head» (собирает tools/tilda-embed.mjs
   в tilda/sos-head.html). На каждой странице Тильды — один блок T123 с одной строкой:
     <div id="sos-page" data-page="index"></div>     (главная; для кейса — data-page="rosi")
   Код сайта лежит в GitHub, ветка static (её собирает tools/tilda-static.sh). Загрузчик узнаёт номер свежего
   коммита этой ветки и берёт страницу и файлы с jsDelivr по этому номеру — после каждой правки сайт обновляется
   сам, вставки в Тильде менять не нужно.
   Для проверки: ?sosref=<номер коммита или ветка> — открыть конкретную версию. */
(function () {
  var REPO = 'UlyanaNechipor/uma_studio', BRANCH = 'static', KEY = 'sos_sha';
  var d = document, html = d.documentElement;

  // тема и признак «скрипты работают» — до отрисовки, чтобы не мигнуло
  try { if (localStorage.getItem('uma-theme') === 'light') html.classList.add('light-theme'); } catch (e) {}
  html.classList.add('js', 'sos-wait');
  try { if ('scrollRestoration' in history) history.scrollRestoration = 'manual'; } catch (e) {}
  // страховка: если за 12 с сайт не поднялся — показываем как есть
  setTimeout(function () { if (!window.__umaBoot || !html.classList.contains('is-ready')) html.classList.remove('js', 'sos-wait'); }, 12000);

  function timeout(p, ms) { return Promise.race([p, new Promise(function (_, no) { setTimeout(function () { no(new Error('timeout')); }, ms); })]); }
  function getJSON(u) { return timeout(fetch(u, { cache: 'no-store' }), 3000).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }); }

  // номер свежего коммита ветки static: GitHub API → файл-указатель в main → последний известный → сама ветка
  function latest() {
    var m = location.search.match(/[?&]sosref=([\w.\-]+)/);
    if (m) return Promise.resolve(m[1]);
    return getJSON('https://api.github.com/repos/' + REPO + '/commits/' + BRANCH)
      .then(function (c) { return c.sha; })
      .catch(function () { return getJSON('https://raw.githubusercontent.com/' + REPO + '/main/tilda/static.json?t=' + Date.now()).then(function (j) { return j.sha; }); })
      .catch(function () { var s = null; try { s = localStorage.getItem(KEY); } catch (e) {} return s || BRANCH; })
      .then(function (sha) { try { if (/^[0-9a-f]{40}$/.test(sha)) localStorage.setItem(KEY, sha); } catch (e) {} return sha; });
  }

  function start() {
    var mount = d.getElementById('sos-page');
    if (!mount) { html.classList.remove('js', 'sos-wait'); return; }
    var page = (mount.getAttribute('data-page') || 'index').replace(/[^\w-]/g, '');
    latest().then(function (sha) {
      var base = 'https://cdn.jsdelivr.net/gh/' + REPO + '@' + sha + '/';
      return fetch(base + 'pages/' + page + '.html').then(function (r) { if (!r.ok) throw new Error(r.status); return r.text(); })
        .then(function (t) { mountPage(mount, t, base); });
    }).catch(function (e) {
      try { console.error('Shape of Sense: страница не загрузилась', e); } catch (_) {}
      html.classList.remove('js', 'sos-wait');
    });
  }

  // относительные адреса фрагмента → адреса на jsDelivr; ссылки от корня сайта (/rosi, /#projects) — как есть
  function abs(base, u) { return /^(https?:|data:|mailto:|tel:|#|\/)/.test(u) ? u : base + u; }
  function fix(s, base) {
    return s.replace(/\b(src|href|data-src|data-cover|poster)="([^"]+)"/g, function (m, a, u) { return a + '="' + abs(base, u) + '"'; })
      .replace(/\bsrcset="([^"]+)"/g, function (m, v) {
        return 'srcset="' + v.split(',').map(function (x) { var p = x.trim().split(/\s+/); p[0] = abs(base, p[0]); return p.join(' '); }).join(', ') + '"';
      });
  }

  function mountPage(mount, text, base) {
    var parts = text.split('<!--sos:body-->');
    var head = d.createElement('template'); head.innerHTML = fix(parts[0], base);
    var body = d.createElement('template'); body.innerHTML = fix(parts[1] || '', base);
    var waits = [];
    Array.prototype.slice.call(head.content.childNodes).forEach(function (n) {
      if (n.nodeName === 'TITLE') { d.title = n.textContent; return; }
      if (n.nodeName === 'LINK' || n.nodeName === 'META') {
        if (n.rel === 'stylesheet') waits.push(new Promise(function (ok) { n.onload = n.onerror = ok; }));
        d.head.appendChild(n); return;
      }
      if (n.nodeName === 'SCRIPT') { var s = d.createElement('script'); s.textContent = n.textContent; d.head.appendChild(s); }
    });
    // стили загрузились (не дольше 4 с) — вставляем страницу и запускаем её скрипты
    timeout(Promise.all(waits), 4000).catch(function () {}).then(function () {
      var scripts = [];
      Array.prototype.slice.call(body.content.querySelectorAll('script')).forEach(function (s) { scripts.push(s); s.parentNode.removeChild(s); });
      mount.appendChild(body.content);
      html.classList.remove('sos-wait');
      scripts.forEach(function (o) {
        var s = d.createElement('script');
        if (o.src) { s.src = o.src; s.async = false; } else s.textContent = o.textContent;
        d.body.appendChild(s);
      });
    });
  }

  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', start); else start();
})();
