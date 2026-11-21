// Статичный сайт внутри Тильды, без Zero-блоков.
// Из site/dist собирается:
//   1) site/dist-tilda/ — те же файлы, но стили с приставкой «html #allrecords»: так правила
//      сайта сильнее общих стилей Тильды (#allrecords a { color: … } и т. п.) и не задевают её
//      служебные элементы. Эта папка выкладывается в ветку static и раздаётся через jsDelivr.
//   2) по адресу BASE — две вставки для Тильды:
//      tilda/static-head.html — «Настройки страницы → Дополнительно → HTML-код для вставки внутрь head»
//      tilda/static-body.html — содержимое единственного блока T123 «HTML-код» на странице.
// Использование:
//   node tools/tilda-embed.mjs assets            → site/dist-tilda/
//   node tools/tilda-embed.mjs snippets <BASE>   → tilda/static-*.html (BASE оканчивается на /)
import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'site/dist');
const out = join(root, 'site/dist-tilda');
const [mode, base] = process.argv.slice(2);

/* ---------- приставка к селекторам ---------- */
const PRE = '#sos-page';   // стили сайта действуют только внутри его блока — Зеро-блоки Тильды рядом они не задевают
function splitTop(s, ch) {           // разбить по символу вне скобок
  const res = []; let depth = 0, cur = '';
  for (const c of s) {
    if (c === '(' || c === '[') depth++;
    else if (c === ')' || c === ']') depth--;
    if (c === ch && depth === 0) { res.push(cur); cur = ''; } else cur += c;
  }
  res.push(cur);
  return res;
}
function prefixSel(sel) {
  sel = sel.trim();
  if (!sel) return sel;
  // составные части через пробел (комбинаторы > + ~ остаются отдельными токенами)
  const parts = splitTop(sel.replace(/\s*([>+~])\s*/g, ' $1 '), ' ').filter(Boolean);
  const head = [];
  if (/^(html|:root)\b/.test(parts[0])) head.push(parts.shift());
  else head.push('html');
  if (parts[0] && /^body\b/.test(parts[0])) {
    head.push(parts.shift().replace(/^body/, 'body.t-body'));
    if (!parts.length) return head.join(' ');
  }
  if (!parts.length) return head.join(' ');           // правило для самого html / :root
  if (/^:root$/.test(head[0]) && parts.length) head[0] = 'html';
  return head.concat(PRE, parts).join(' ');
}
function prefixCss(css) {
  let i = 0, res = '';
  const src = css.replace(/\/\*[\s\S]*?\*\//g, '');
  function block(stopAtBrace) {
    let o = '';
    while (i < src.length) {
      const open = src.indexOf('{', i), close = src.indexOf('}', i);
      if (close !== -1 && (open === -1 || close < open)) { o += src.slice(i, close); i = close + 1; if (stopAtBrace) return o + '}'; o += '}'; continue; }
      if (open === -1) { o += src.slice(i); i = src.length; break; }
      const pre = src.slice(i, open);
      const semi = pre.lastIndexOf(';');                          // @import/@charset перед блоком
      const lead = semi >= 0 ? pre.slice(0, semi + 1) : '';
      const sel = (semi >= 0 ? pre.slice(semi + 1) : pre).trim();
      i = open + 1;
      if (/^@(media|supports|layer|container)/.test(sel)) { o += lead + sel + '{' + block(true); continue; }
      if (/^@/.test(sel)) {                                       // @font-face, @keyframes — как есть
        let depth = 1, j = i;
        while (depth && j < src.length) { if (src[j] === '{') depth++; else if (src[j] === '}') depth--; j++; }
        o += lead + sel + '{' + src.slice(i, j); i = j; continue;
      }
      if (/^(from|to|\d+%)/.test(sel)) { o += lead + sel + '{'; continue; }
      o += lead + splitTop(sel, ',').map(prefixSel).join(',') + '{';
      const end = src.indexOf('}', i);
      o += src.slice(i, end + 1); i = end + 1;
    }
    return o;
  }
  res = block(false);
  return res;
}

if (mode === 'assets') {
  rmSync(out, { recursive: true, force: true });
  cpSync(dist, out, { recursive: true });
  for (const f of ['index.html', 'preview.html', '_headers']) rmSync(join(out, f), { force: true });
  for (const f of readdirSync(join(out, 'styles'))) {
    const p = join(out, 'styles', f);
    writeFileSync(p, prefixCss(readFileSync(p, 'utf8')));
  }
  // общие стили Тильды на этой странице не нужны, но мешают: прокрутка и фон блока
  writeFileSync(join(out, 'styles/tilda.css'),
    '#allrecords{overflow:visible!important;background:none!important}\n' +
    '#allrecords .t123,#allrecords .t-container_100,#allrecords .t-width_100{max-width:none!important;padding:0!important;margin:0!important}\n' +
    // шрифт задан на body и наследуется; общие стили Тильды могут задать его заголовкам и кнопкам напрямую
    // классы оформления Тильды (.t-name, .t-title, .t-descr…) получают шрифт из её настроек — у нас свой везде
    'html #allrecords{font-family:var(--f-sans)}\n' +
    'html #allrecords *{font-family:inherit}\n' +
    readFileSync(join(root, 'tools/tilda-zero.css'), 'utf8'));
  // картинки и шрифт — по постоянным адресам: коммит main, в котором файл менялся последний раз.
  // Такой адрес не меняется от выкладки к выкладке, поэтому браузер и jsDelivr не скачивают картинки заново.
  const shaCache = new Map();
  const fileSha = (path) => {
    if (!shaCache.has(path)) {
      let sha = '';
      try { sha = execSync(`git log -1 --format=%H -- "${path}"`, { cwd: root }).toString().trim(); } catch (e) {}
      shaCache.set(path, sha);
    }
    return shaCache.get(path);
  };
  const stable = (u) => {
    const path = u.split('?')[0].replace(/^(\.\.\/)+/, '');
    if (!/^(img|site\/assets)\//.test(path) || !existsSync(join(root, path))) return u;
    const sha = fileSha(path);
    return sha ? `https://cdn.jsdelivr.net/gh/UlyanaNechipor/uma_studio@${sha}/${path}` : u;
  };
  const stableHtml = (h) => h
    .replace(/\b(src|href|data-src|data-cover|poster)="([^"]+)"/g, (m, a, u) => `${a}="${stable(u)}"`)
    .replace(/\bsrcset="([^"]+)"/g, (m, v) => 'srcset="' + v.split(',').map((x) => { const [u, ...r] = x.trim().split(/\s+/); return [stable(u), ...r].join(' '); }).join(', ') + '"');
  for (const f of readdirSync(join(out, 'styles'))) {
    const p = join(out, 'styles', f);
    writeFileSync(p, readFileSync(p, 'utf8').replace(/url\((['"]?)([^'")]+)\1\)/g, (m, q, u) => `url(${q}${stable(u)}${q})`));
  }
  // страницы целиком (часть head и body через <!--sos:body-->) — их по адресу берёт загрузчик tilda/loader.js
  mkdirSync(join(out, 'pages'), { recursive: true });
  for (const f of readdirSync(dist).filter((f) => f.endsWith('.html'))) {
    const html = readFileSync(join(dist, f), 'utf8');
    const head = html.slice(html.indexOf('<head>') + 6, html.indexOf('</head>'))
      .replace(/<meta charset[^>]*>\s*/, '').replace(/<meta name="viewport"[^>]*>\s*/, '')
      .replace(/<script>if\('scrollRestoration'[\s\S]*?<\/script>\s*/, '')          // это делает сам загрузчик
      .replace(/<noscript>[\s\S]*?<\/noscript>\s*/, '')
      .replace(/(<link rel="stylesheet" href="styles\/motion\.css[^>]*>)/, '$1\n<link rel="stylesheet" href="styles/tilda.css">');
    const body = html.slice(html.indexOf('<body>') + 6, html.indexOf('</body>'));
    writeFileSync(join(out, 'pages', f), stableHtml(head.trim() + '\n<!--sos:body-->\n' + body.trim()) + '\n');
  }
  console.log('site/dist-tilda готова');
} else if (mode === 'snippets') {
  // Постоянные вставки: в них нет номера версии, после правок их менять не нужно.
  mkdirSync(join(root, 'tilda'), { recursive: true });
  const tok = readFileSync(join(root, 'site/styles/tokens.css'), 'utf8');
  const col = (n) => tok.match(new RegExp('--' + n + ':\\s*(#[0-9a-fA-F]{3,8})'))[1];
  const bg = { dark: { bg: col('c-ink') }, light: { bg: col('c-paper') } };   // фон до загрузки — как у сайта
  // Сам загрузчик (tilda/loader.js) берётся из GitHub при каждом открытии — вставку не придётся менять никогда.
  // Не ответил GitHub — последняя сохранённая в браузере копия, нет и её — копия с jsDelivr.
  const boot = `(function(){var d=document,h=d.documentElement,K='sos_loader',R='UlyanaNechipor/uma_studio';
try{if(localStorage.getItem('uma-theme')==='light')h.classList.add('light-theme')}catch(e){}
h.classList.add('js','sos-wait');setTimeout(function(){if(!window.__umaBoot)h.classList.remove('js','sos-wait')},12000);
function run(t){try{(new Function(t))()}catch(e){try{console.error('Shape of Sense: загрузчик',e)}catch(_){}}}
function cdn(){var s=d.createElement('script');s.src='https://cdn.jsdelivr.net/gh/'+R+'@main/tilda/loader.js';d.head.appendChild(s)}
var done=0,t0=setTimeout(fail,4000);
function fail(){if(done)return;done=1;var t=null;try{t=localStorage.getItem(K)}catch(e){}t?run(t):cdn()}
fetch('https://raw.githubusercontent.com/'+R+'/main/tilda/loader.js',{cache:'no-store'})
.then(function(r){if(!r.ok)throw r.status;return r.text()})
.then(function(t){if(done)return;done=1;clearTimeout(t0);try{localStorage.setItem(K,t)}catch(e){}run(t)},function(){clearTimeout(t0);fail()})})();`;
  writeFileSync(join(root, 'tilda/sos-head.html'),
    '<!-- Shape of Sense · загрузчик сайта. Вставить один раз: Настройки сайта → Ещё → HTML-код для вставки внутрь head.\n' +
    '     Код сайта и самого загрузчика берётся из github.com/UlyanaNechipor/uma_studio — эту вставку менять не нужно. -->\n' +
    `<style>html.sos-wait,html.sos-wait body{background:${bg.dark.bg}!important}html.sos-wait.light-theme,html.sos-wait.light-theme body{background:${bg.light.bg}!important}html.sos-wait #allrecords{visibility:hidden}</style>\n` +
    '<script>' + boot + '</script>\n');
  for (const f of readdirSync(dist).filter((f) => f.endsWith('.html'))) {
    const name = f.replace(/\.html$/, '');
    writeFileSync(join(root, `tilda/sos-page-${name}.html`), `<div id="sos-page" data-page="${name}"></div>\n`);
  }
  console.log('tilda/sos-head.html и tilda/sos-page-*.html готовы');
} else {
  console.error('режим: assets | snippets <BASE>');
  process.exit(1);
}
