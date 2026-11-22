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
  // переход с другой страницы сайта: лист уже закрывает экран, прелоадера не будет
  try { var pt = sessionStorage.getItem('sos-pt'); if (pt) html.classList.add(pt === 'case' ? 'pt-case' : 'pt-in');
    // переход между кейсами: лист с названием следующего проекта стоит на экране с первой отрисовки (body::after в motion.css)
    if (pt === 'case') {
      var tt = sessionStorage.getItem('sos-pt-title'), tk = sessionStorage.getItem('sos-pt-label');
      if (tt) html.style.setProperty('--turn-title', JSON.stringify(tt));
      if (tk) html.style.setProperty('--turn-k', JSON.stringify(tk));
    }
    if (pt === 'case') {
      // стили листа — здесь, а не в стилях сайта: они должны действовать до того, как страница скачана
      var st = d.createElement('style'); st.id = 'sos-turn';
      st.textContent =
        'html.pt-case{--tu:1px;--tp:16px;--tb:#111211;--tc:#fff;--tg:#767575}' +
        'html.pt-case.light-theme{--tb:#fbfbfb;--tc:#111111;--tg:#555555}' +
        'html.pt-case body::after,html.pt-case body::before{position:fixed;left:0;right:0;pointer-events:none;box-sizing:border-box;transition:transform .9s cubic-bezier(.76,0,.24,1);font-family:Manrope,system-ui,-apple-system,"Segoe UI",sans-serif}' +
        'html.pt-case body::after{content:var(--turn-title,"");top:0;bottom:0;z-index:25;background:var(--tb);color:var(--tc);display:flex;align-items:flex-end;padding:0 var(--tp) 24px;white-space:nowrap;overflow:hidden;font-size:clamp(56px,19vw,120px);line-height:.9;letter-spacing:-.045em;font-weight:400}' +
        'html.pt-case body::before{content:var(--turn-k,"");top:0;z-index:26;color:var(--tg);padding:calc(max(44px,48px) + 32px) var(--tp) 0;font-size:12px;line-height:1.55;letter-spacing:.45px}' +
        '@media (min-width:768px){html.pt-case{--tu:clamp(.64px,calc(100vw / 1200),1.6px);--tp:max(calc(20 * var(--tu)),calc((100% - 1160 * var(--tu)) / 2))}' +
        'html.pt-case body::after{padding:0 var(--tp) calc(160 * var(--tu));font-size:min(calc(220 * var(--tu)),15vw);line-height:.86;text-indent:-.04em}' +
        'html.pt-case body::before{padding:calc(108 * var(--tu)) var(--tp) 0;font-size:max(12px,calc(12 * var(--tu)))}}' +
        'html.light-theme.pt-case body::after{font-weight:470}' +
        'html.pt-case.pt-go body::after{transform:translate3d(0,-100%,0)}html.pt-case.pt-go body::before{transform:translate3d(0,-100vh,0)}';
      d.head.appendChild(st);
    }
  } catch (e) {}
  try { if ('scrollRestoration' in history) history.scrollRestoration = 'manual'; } catch (e) {}
  // страховка: если за 12 с сайт не поднялся — показываем как есть
  setTimeout(function () { if (!window.__umaBoot || !html.classList.contains('is-ready')) html.classList.remove('js', 'sos-wait'); }, 12000);

  function timeout(p, ms) { return Promise.race([p, new Promise(function (_, no) { setTimeout(function () { no(new Error('timeout')); }, ms); })]); }
  function getJSON(u) { return timeout(fetch(u, { cache: 'no-store' }), 3000).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }); }

  // номер свежего коммита ветки static: GitHub API → файл-указатель в main → последний известный → сама ветка
  // номер свежей версии: tilda/static.json в main (без лимитов GitHub API). Если версия уже открывалась раньше,
  // ждём ответа до 2 с (обычно приходит за 0,2–0,5 с), иначе открываем ту, что в браузере, — страница не висит на сети.
  function latest() {
    var m = location.search.match(/[?&]sosref=([\w.\-]+)/);
    if (m) return Promise.resolve(m[1]);
    var cached = null; try { cached = localStorage.getItem(KEY + '_ok') || localStorage.getItem(KEY); } catch (e) {}
    var fresh = timeout(fetch('https://raw.githubusercontent.com/' + REPO + '/main/tilda/static.json?t=' + Math.floor(Date.now() / 30000), { cache: 'no-store' }), 2500)
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (j) { try { if (/^[0-9a-f]{40}$/.test(j.sha)) localStorage.setItem(KEY, j.sha); } catch (e) {} return j.sha; });
    if (!cached) return fresh.catch(function () { return BRANCH; });
    return Promise.race([fresh, new Promise(function (ok) { setTimeout(function () { ok(cached); }, 2000); })]).catch(function () { return cached; });
  }

  function start() {
    var mount = d.getElementById('sos-page');
    if (!mount) { html.classList.remove('js', 'sos-wait'); return; }
    var page = (mount.getAttribute('data-page') || 'index').replace(/[^\w-]/g, '');
    // страница по номеру версии; не ответила — ещё раз, потом последняя версия, что уже открывалась, потом ветка целиком
    // страница целиком (со стилями и скриптом внутри) — с raw.githubusercontent.com: свежая версия там доступна сразу;
    // jsDelivr — запасной путь
    function load(sha) {
      var base = 'https://cdn.jsdelivr.net/gh/' + REPO + '@' + sha + '/';
      var get = function (u, ms) { return timeout(fetch(u), ms).then(function (r) { if (!r.ok) throw new Error(r.status); return r.text(); }); };
      return get('https://raw.githubusercontent.com/' + REPO + '/' + sha + '/pages/' + page + '.html', 6000)
        .catch(function () { return get(base + 'pages/' + page + '.html', 8000); })
        .then(function (t) { return { t: t, base: base, sha: sha }; });
    }
    function wait(ms) { return new Promise(function (ok) { setTimeout(ok, ms); }); }
    var good = null; try { good = localStorage.getItem(KEY + '_ok'); } catch (e) {}
    // страница, заранее скачанная предыдущей (переход между кейсами), — сразу, без сети
    var pre = null; try { pre = JSON.parse(sessionStorage.getItem('sos-pre:' + page) || 'null'); sessionStorage.removeItem('sos-pre:' + page); } catch (e) {}
    (pre && pre.t && pre.sha ? Promise.resolve({ t: pre.t, sha: pre.sha, base: 'https://cdn.jsdelivr.net/gh/' + REPO + '@' + pre.sha + '/' }) : latest().then(function (sha) {
      return load(sha)
        .catch(function () { return wait(1500).then(function () { return load(sha); }); })
        .catch(function (e) { if (good && good !== sha) return load(good); throw e; })
        .catch(function (e) { if (sha !== BRANCH) return load(BRANCH); throw e; });
    })).then(function (res) {
      window.__sosSha = res.sha; window.__sosRepo = REPO;
      mountPage(mount, res.t, res.base);
      try { if (/^[0-9a-f]{40}$/.test(res.sha)) localStorage.setItem(KEY + '_ok', res.sha); } catch (e) {}
    }).catch(function (e) {
      try { console.error('Shape of Sense: страница не загрузилась', e); } catch (_) {}
      html.classList.remove('js', 'sos-wait');
    });
  }

  // относительные адреса фрагмента → адреса на jsDelivr; ссылки от корня сайта (/rosi, /#projects) — как есть
  function abs(base, u) { if (u === './' || u === '.' || u === 'index.html') return '/'; return /^(https?:|data:|mailto:|tel:|#|\/)/.test(u) ? u : base + u; }   // ссылка на главную — всегда главная сайта
  // адреса правим только в разметке: стили и скрипт страницы встроены в неё, их текст не трогаем
  function fix(s, base) {
    return s.split(/(<script\b[\s\S]*?<\/script>|<style\b[\s\S]*?<\/style>)/).map(function (part, i) { return i % 2 ? part : fixHtml(part, base); }).join('');
  }
  function fixHtml(s, base) {
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
      if (n.nodeName === 'STYLE') { d.head.appendChild(n); }
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
