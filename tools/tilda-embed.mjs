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
import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'site/dist');
const out = join(root, 'site/dist-tilda');
const [mode, base] = process.argv.slice(2);

/* ---------- приставка к селекторам ---------- */
const PRE = '#allrecords';
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
    'html #allrecords *{font-family:inherit}\n');
  console.log('site/dist-tilda готова');
} else if (mode === 'snippets') {
  if (!base || !/\/$/.test(base)) { console.error('нужен BASE, оканчивающийся на /'); process.exit(1); }
  const html = readFileSync(join(dist, 'index.html'), 'utf8');
  const abs = (u) => /^(https?:|data:|mailto:|tel:|#|\/\/)/.test(u) || u === './' ? u : base + u;
  const fix = (s) => s
    .replace(/\b(src|href|data-src|data-cover|poster)="([^"]+)"/g, (m, a, u) => `${a}="${abs(u)}"`)
    .replace(/\bsrcset="([^"]+)"/g, (m, v) => 'srcset="' + v.split(',').map((x) => { const [u, ...r] = x.trim().split(/\s+/); return [abs(u), ...r].join(' '); }).join(', ') + '"');
  const head = html.slice(html.indexOf('<head>') + 6, html.indexOf('</head>'));
  const keep = head
    .replace(/<meta charset[^>]*>\s*/, '').replace(/<meta name="viewport"[^>]*>\s*/, '').replace(/<title>[^<]*<\/title>\s*/, '')
    .replace(/(<link rel="stylesheet" href="styles\/motion\.css[^>]*>)/, '$1\n<link rel="stylesheet" href="styles/tilda.css">');
  const body = html.slice(html.indexOf('<body>') + 6, html.indexOf('</body>'));
  const stamp = `<!-- Working Title · статичный сайт в Тильде. Собрано tools/tilda-embed.mjs ${new Date().toISOString().slice(0, 10)}, файлы: ${base} -->\n`;
  mkdirSync(join(root, 'tilda'), { recursive: true });
  writeFileSync(join(root, 'tilda/static-head.html'), stamp + fix(keep).trim() + '\n');
  writeFileSync(join(root, 'tilda/static-body.html'), stamp + fix(body).trim() + '\n');
  console.log('tilda/static-head.html', statSync(join(root, 'tilda/static-head.html')).size, 'байт');
  console.log('tilda/static-body.html', statSync(join(root, 'tilda/static-body.html')).size, 'байт');
} else {
  console.error('режим: assets | snippets <BASE>');
  process.exit(1);
}
