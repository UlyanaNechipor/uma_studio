// Shape of Sense · сборка статического сайта без Тильды и без зависимостей.
// Запуск: node site/build.mjs  →  папка site/dist (её и заливать на хостинг).
// Тексты берутся из content/*.json, стили — site/styles, картинки — img/ и site/assets/.
import { readFileSync, writeFileSync, mkdirSync, cpSync, rmSync, existsSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';

/* Если на устройстве включено «Уменьшение движения» (айфон: Настройки → Универсальный доступ → Движение):
   'soft' — спокойный режим: прелоадер, проявления, галерея есть, но без смещений и полётов (по умолчанию);
   'full' — настройку не учитывать, анимации как у всех;
   'off'  — движение выключено полностью. */
const MOTION_REDUCED = 'full';   // решение 2026-11-11: анимации одинаковые на всех устройствах

import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'site/dist');
const j = (p) => JSON.parse(readFileSync(join(ROOT, p), 'utf8'));
const site = j('content/site.json');
const home = j('content/home.json');

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
// логотип: название капсом, все слова одной плотности
const logo = '<b>' + esc(site.brand.toUpperCase()) + '</b>';
// типографика: короткие предлоги, союзы и местоимения не остаются в конце строки (неразрывный пробел
// после них), слова через дефис не рвутся. Применяется ко всем текстам при сборке — без скрипта на странице.
const GLUE = ['в','во','с','со','из','изо','к','ко','о','об','обо','от','ото','до','по','под','подо','про','на','за','над','надо',
  'через','сквозь','у','при','пред','предо','перед','передо','а','и','но','да','или','не','ни','бы','же','вы','мы','ты','он','она',
  'они','оно','я','то','все','что','кто','мой','свой','для','без','безо','ради','около','возле','вокруг','после','кроме','среди',
  'между','как','чем','ли','это','их','его','её','ее','наш','ваш','&amp;'];
const GLUE_RE = new RegExp('(^|[\\s(«"„>]|&nbsp;)(' + GLUE.join('|') + ') ', 'giu');
const typo = (s) => {
  let t = esc(s), prev;
  do { prev = t; t = t.replace(GLUE_RE, '$1$2&nbsp;'); } while (t !== prev);       // цепочки вроде «и в»
  t = t.replace(/([\p{L}\d]+(?:-[\p{L}\d]+)+)/gu, '<span class="nw">$1</span>');   // интернет-магазин, Санкт-Петербург
  return t;
};
const lines = (a) => (Array.isArray(a) ? a : [a]).map(typo).join('<br>');
const href = (h) => esc(String(h).replace('{email}', site.contacts.email));
// Адаптивные картинки: к каждому большому фото есть несколько ширин (tools/optimize-images.py делает их в img/opt,
// у картинок галереи — готовые -1200/-2400 в img/gallery). Браузер сам берёт ту, что нужна экрану, —
// телефон не качает 2400-пиксельный кадр.
const OPT = readdirSync(join(ROOT, 'img/opt'));
const variants = (src) => {
  let dir, stem;
  const g = src.match(/^(img\/gallery|img\/projects\/[\w-]+)\/(.+)-(\d+)\.webp$/);
  const t = src.match(/^site\/assets\/tilda\/(.+)\.(?:jpe?g|png)$/i);
  if (g) { dir = g[1]; stem = g[2]; } else if (t) { dir = 'img/opt'; stem = t[1]; } else return null;
  const list = (dir === 'img/opt' ? OPT : readdirSync(join(ROOT, dir)))
    .map((f) => f.match(new RegExp('^' + stem.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '-(\\d+)\\.webp$')))
    .filter(Boolean).map((m) => ({ w: +m[1], path: `${dir}/${m[0]}` })).sort((a, b) => a.w - b.w);
  return list.length > 1 ? list : null;
};
const img = (src, alt = '', cls = '', eager = false, sizes = '100vw') => {
  const v = variants(src);
  const set = v ? ` srcset="${v.map((x) => `${esc(x.path)} ${x.w}w`).join(', ')}" sizes="${sizes}"` : '';
  const main = v ? (v.find((x) => x.w >= 960) || v[v.length - 1]).path : src;
  return `<img class="${cls}" src="${esc(main)}"${set} alt="${esc(alt)}"${eager ? ' fetchpriority="high"' : ' loading="lazy"'} decoding="async">`;
};
const btn = (b, kind = 'light') =>
  `<a class="btn btn--${kind}" href="${href(b.href)}">${esc(b.label)}</a>`;

// home — адрес главной: '' на самой главной (ссылки #раздел), '/' на страницах кейсов (ссылки /#раздел)
const headerHtml = (home = '') => `
<header class="hd">
  <canvas class="hd__trail" aria-hidden="true"></canvas>
  <a class="hd__logo" href="${home || './'}" aria-label="${esc(site.brand)} — на главную">${logo}</a>
  <nav class="hd__nav" aria-label="Разделы">
    ${site.nav.map((n) => `<a class="hd__link" href="${home}#${n.id}">${esc(n.label)}</a>`).join('\n    ')}
  </nav>
  <button class="hd__theme" type="button" aria-label="Светлая тема" data-theme-toggle>
    <span class="hd__ic" aria-hidden="true">
      <svg class="hd__moon" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
      <svg class="hd__sun" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
    </span>
  </button>
</header>`;

const h = home;
const hero = `
<section class="hero grid" aria-label="О студии">
  <p class="hero__lead ty-small" data-intro>${[].concat(h.hero.lead).map((sn) => [].concat(sn).map(typo).join(' <br class="hero__lb">')).join(' <br>')}</p>
  <h1 class="hero__title ty-h1" data-intro data-fill="load">${[].concat(h.hero.title).map(typo).join(' <br class="hero__br">')}</h1>
  <div class="hero__gallery hg" data-gallery aria-roledescription="галерея" aria-label="Проекты студии">
    <div class="hg__frame"><div class="hg__strip">
      ${h.hero.gallery.map((g, i) => `<figure class="hg__slide${i ? '' : ' is-active'}">${img(g.src, g.title, '', i === 0, '(min-width: 768px) 64vw, 100vw')}</figure>`).join('\n      ')}
    </div></div>
    <button type="button" class="hg__pause" aria-label="Пауза" aria-pressed="false">
      <svg class="hg__ic hg__ic--pause" viewBox="0 0 16 16" aria-hidden="true"><rect x="4" y="3" width="2" height="10" rx=".5"/><rect x="10" y="3" width="2" height="10" rx=".5"/></svg>
      <svg class="hg__ic hg__ic--play" viewBox="0 0 16 16" aria-hidden="true"><path d="M5 3.2v9.6c0 .4.4.6.7.4l7.4-4.8a.5.5 0 0 0 0-.8L5.7 2.8c-.3-.2-.7 0-.7.4z"/></svg>
    </button>
  </div>
  <div class="hero__aside" aria-hidden="true"><canvas class="hero__cv"></canvas></div>
</section>`;

const projects = `
<section class="projects grid" id="${h.projects.anchor}">
  <p class="projects__label ty-small ty-grey">${typo(h.projects.label)}</p>
  <h2 class="projects__title ty-h2" data-fill>${typo(h.projects.title)}</h2>
  <ul class="projects__list">
    ${h.projects.items.map((p) => `<li class="prow">
      <a class="prow__link" href="${esc(p.url || '/' + p.slug)}" data-cover="${esc(p.cover)}">
        <span class="prow__name ty-name">${esc(p.name)}</span>
        <span class="prow__type ty-small ty-grey">${typo(p.type)}</span>
        <span class="prow__year ty-small ty-grey">${esc(p.year)}</span>
        <span class="prow__pics">${p.mobile.map((m) => img(m, '')).join('')}</span>
      </a>
    </li>`).join('\n    ')}
  </ul>
</section>`;

const lab = `
<section class="lab grid" aria-labelledby="lab-title">
  <h2 class="lab__title ty-h2" id="lab-title" data-fill>${lines(h.lab.title)}</h2>
  <p class="lab__lead ty-small ty-grey">${typo(h.lab.lead)}</p>
  <div class="lab__grid">
    ${[['a1', 'a2'], ['b'], ['c2', 'c1'], ['d1', 'd2']].map((col) => `<div class="lab__col">${col.map((k) => h.lab.images.find((x) => x.d === k)).map((x) => `
      <figure class="lab__it lab__it--${x.d} lab__it--m-${x.m}" style="--h:${x.h}">
        <div class="lab__ph">${img(x.src, '', '', false, x.m === 'wide' ? '(min-width: 768px) 25vw, 100vw' : '(min-width: 768px) 25vw, 50vw')}</div>
        <figcaption class="lab__cap ty-small ty-grey">${typo(x.cap)}</figcaption>
      </figure>`).join('')}
    </div>`).join('\n    ')}
  </div>
</section>`;

const about = `
<section class="about grid" id="${h.about.anchor}">
  <p class="about__label ty-small ty-grey">${typo(h.about.label)}</p>
  <h2 class="about__title ty-h2" data-fill>${lines(h.about.title)}</h2>
  <div class="about__photos">${h.about.photos.map((p) => img(p, '', '', false, '(min-width: 768px) 25vw, 50vw')).join('')}</div>
  <p class="about__lead ty-small ty-grey">${typo(h.about.lead)}</p>
  <div class="about__act">${btn(h.about.cta)}<a class="ty-small mail" href="mailto:${esc(site.contacts.email)}">${esc(site.contacts.email)}</a></div>
</section>`;

const services = `
<section class="services grid" aria-label="Услуги">
  ${h.services.items.map((s) => `<div class="svc">
    <h3 class="svc__title ty-small">${typo(s.title)}</h3>
    <p class="svc__text ty-small ty-grey">${s.text.map(typo).join('<br>')}</p>
  </div>`).join('\n  ')}
</section>`;

const cta = `
<section class="cta grid" id="${h.cta.anchor}">
  ${img(h.cta.image, '', 'cta__img', false, '(min-width: 768px) 24vw, 100vw')}
  <h2 class="cta__title ty-h2">${lines(h.cta.title)}</h2>
  <div class="cta__act">${btn(h.cta.primary)}${btn(h.cta.secondary, 'grey')}<a class="ty-small mail" href="mailto:${esc(site.contacts.email)}">${esc(site.contacts.email)}</a></div>
</section>`;

const c = site.contacts;
const footerHtml = (home = '') => `
<footer class="ft grid">
  <p class="ft__logo">${logo}</p>
  <p class="ft__made ty-small ty-grey">Made by ${esc(site.brand.toUpperCase())} ©${esc(site.footer.year)}</p>
  <nav class="ft__col" aria-label="Компания"><h2 class="ft__h">Компания</h2>
    ${site.nav.map((n) => `<a href="${home}#${n.id}">${esc(n.label)}</a>`).join('')}
    ${c.privacy ? `<a href="${esc(c.privacy)}">Политика конфиденциальности</a>` : '<span>Политика конфиденциальности</span>'}
  </nav>
  <div class="ft__col"><h2 class="ft__h">Контакты</h2>
    <span>${typo(c.city)}</span>
    <a href="mailto:${esc(c.email)}">Почта</a>
    ${c.telegram ? `<a href="${esc(c.telegram)}">Телеграм</a>` : '<span>Телеграм</span>'}
    <a href="tel:${esc(c.phone.replace(/[^\d+]/g, ''))}">${esc(c.phone)}</a>
  </div>
</footer>`;

const diag = readFileSync(join(ROOT, 'site/scripts/diag.js'), 'utf8');
// каркас страницы: общий для главной и кейсов
const page = ({ title, css = [], main, home = '', fonts = '' }) => `<!doctype html>
<html lang="${site.lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
${site.seo.description ? `<meta name="description" content="${esc(site.seo.description)}">\n` : ''}<meta name="theme-color" content="${site.themes.dark.bg}">
<link rel="preload" href="site/assets/fonts/manrope-var.woff" as="font" type="font/woff" crossorigin>
${fonts ? `<link rel="stylesheet" href="${esc(fonts)}">\n` : ''}<link rel="stylesheet" href="styles/tokens.css">
<link rel="stylesheet" href="styles/base.css">
${css.map((f) => `<link rel="stylesheet" href="styles/${f}.css">`).join('\n')}
<link rel="stylesheet" href="styles/motion.css">
<script>${diag}</script>
<script>if('scrollRestoration' in history)history.scrollRestoration='manual';try{if(localStorage.getItem('uma-theme')==='light')document.documentElement.classList.add('light-theme')}catch(e){}document.documentElement.classList.add('js');try{if(sessionStorage.getItem('sos-pt'))document.documentElement.classList.add('pt-in')}catch(e){}try{if(matchMedia('(prefers-reduced-motion: reduce)').matches&&'${MOTION_REDUCED}'!=='full')document.documentElement.classList.add('${MOTION_REDUCED}'==='off'?'rm-off':'rm')}catch(e){}setTimeout(function(){var h=document.documentElement;if(!window.__umaBoot||!h.classList.contains('is-ready'))h.classList.remove('js')},12000)</script>\n<noscript><style>.pl{display:none!important}</style></noscript>
</head>
<body>
${home ? '' : `<div class="pl" id="preloader" aria-hidden="true">
  <div class="pl__logo"><span class="pl__base">${logo}</span><span class="pl__ink">${logo}</span></div>
</div>`}
<canvas id="trail" aria-hidden="true"></canvas>
<canvas id="wipe" aria-hidden="true"></canvas>
${headerHtml(home)}
<main>
${main}
</main>
${footerHtml(home)}
<script src="scripts/site.js" defer></script>
</body>
</html>`;

const html = page({ title: site.seo.title || site.brand, css: ['home'], main: [hero, projects, lab, about, services, cta].join('\n') });

/* ---------------- страницы кейсов: projects/<slug>.json → <slug>.html ----------------
   Та же вёрстка, что собирает js/project-page.js в версии на Зеро-блоках, только готовым HTML.
   Картинка раздела: src (готовый файл из img/) или name → img/projects/<slug>/<name>-1200|2400.webp.
   Пока файла нет — плашка с подписью, что здесь будет. */
// абзац: строка; "" — пустая строка; { "h": "подзаголовок", "t": "текст" } — пункт с подзаголовком
const para = (t) => (t === '' ? '<p class="uma-project__spacer" aria-hidden="true"></p>'
  : typeof t === 'object' ? `<p class="uma-project__item"><span class="uma-project__sub">${typo(t.h)}</span>${String(t.t || '').split('\n').map(typo).join('<br>')}</p>`
  : `<p>${String(t).split('\n').map(typo).join('<br>')}</p>`);
// цвет текста на плашке палитры: тёмный на светлом, светлый на тёмном
const inkFor = (hex) => { const n = parseInt(hex.replace('#', ''), 16), r = n >> 16 & 255, g = n >> 8 & 255, b = n & 255;
  return (0.299 * r + 0.587 * g + 0.114 * b) > 150 ? '#1a1514' : '#f2efea'; };
const pad2 = (n) => String(n).padStart(2, '0');
const arrowSvg = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13.73 4a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/></svg>';
function projectFigure(slug, im, cls = '') {
  if (!im) return '';
  const c = 'uma-project__figure' + (cls ? ' ' + cls : '');
  let src = im.src, w = im.w, hh = im.h;
  if (!src) {
    const base = `img/projects/${slug}/${im.name}`;
    if (existsSync(join(ROOT, base + '-1200.webp'))) src = base + '-1200.webp';
  }
  const ratio = w && hh ? ` style="aspect-ratio:${w} / ${hh}"` : '';
  if (!src) return `<figure class="${c} is-empty"${ratio} data-label="${esc(im.alt)}"></figure>`;
  return `<figure class="${c}"${ratio}>${img(src, im.alt, '', false, '(max-width: 1920px) 97vw, 1856px')}</figure>`;
}
function projectPage(d) {
  const s = d.slug;
  let m = '<article class="uma-project" aria-labelledby="uma-project-title">';
  m += `<header class="uma-project__top"><div class="uma-project__left"><h1 class="uma-project__title" id="uma-project-title">${esc(d.title)}</h1>` +
    (d.back ? `<a class="uma-project__back" href="${esc(d.back.url)}">${esc(d.back.label)}</a>` : '') + '</div><div class="uma-project__meta">' +
    (d.meta || []).map((g) => `<dl class="uma-project__meta-group"><dt>${esc(g.title)}</dt>${g.items.map((i) => `<dd>${typo(i)}</dd>`).join('')}</dl>`).join('') +
    '</div></header>';
  if (d.cover) m += projectFigure(s, { src: d.cover.src, name: d.cover.image, w: d.cover.w, h: d.cover.h, alt: d.cover.alt }, 'uma-project__cover');
  if (d.intro) m += `<section class="uma-project__intro"><div class="uma-project__lead">${d.intro.lead.map(para).join('')}</div><div class="uma-project__cols">` +
    d.intro.columns.map((col) => `<div class="uma-project__col">${col.map(para).join('')}</div>`).join('') + '</div></section>';
  for (const sec of d.sections || []) {
    // две картинки рядом, без заголовка и текста
    if (sec.layout === 'pair') { m += `<section class="uma-project__pair">${(sec.images || []).map((im) => projectFigure(s, im)).join('')}</section>`; continue; }
    const gap = sec.gap ? ` style="--up-pgap:${sec.gap}px"` : '';
    m += `<section class="uma-project__section"><div class="uma-project__head"><h2 class="uma-project__h2">${typo(sec.title)}</h2>` +
      (!sec.columns ? '' : sec.layout === 'split'
        ? `<div class="uma-project__cols"${gap}>${sec.columns.map((col) => `<div class="uma-project__col">${col.map(para).join('')}</div>`).join('')}</div>`
        : `<div class="uma-project__aside${sec.layout === 'wide' ? ' is-wide' : sec.layout === 'side' ? ' is-side' : ''}"${gap}>${sec.columns[0].map(para).join('')}</div>`) +
      '</div>';
    // палитра: плашки с HEX и «Aa»
    if (sec.palette) m += '<ul class="uma-project__palette">' + sec.palette.map((c) => { const hex = c.hex || c;
      return `<li style="background:${esc(hex)};color:${esc(c.ink || inkFor(hex))}"><span class="uma-project__hex"><b>HEX</b> ${esc(hex.toUpperCase())}</span><span class="uma-project__aa" aria-hidden="true">Aa</span></li>`; }).join('') + '</ul>';
    // шрифты: название крупно самим шрифтом, справа — роль и описание
    if (sec.fonts) m += '<div class="uma-project__fonts">' + sec.fonts.map((f) =>
      `<div class="uma-project__font"><p class="uma-project__specimen" style="font-family:'${esc(f.family || f.name)}',${f.serif ? 'Georgia,serif' : 'Arial,sans-serif'}">${esc(f.name)}</p>` +
      `<div class="uma-project__font-info"><p class="uma-project__sub">${typo(f.label || '')}</p><p>${typo(f.text || '')}</p></div></div>`).join('') + '</div>';
    m += projectFigure(s, sec.image) + projectFigure(s, sec.after) + '</section>';
  }
  const p = d.pagination;
  if (p) m += '<nav class="uma-project__pager" aria-label="Другие проекты">' +
    (p.prev ? `<a class="is-prev" href="${esc(p.prev.url)}" rel="prev">${arrowSvg}${esc(p.prev.title)}</a>` : '<span></span>') +
    `<div class="uma-project__count" aria-label="Проект ${p.index} из ${p.total}">${pad2(p.index)}/<span>${pad2(p.total)}</span></div>` +
    (p.next ? `<a class="is-next" href="${esc(p.next.url)}" rel="next">${esc(p.next.title)}${arrowSvg}</a>` : '<span></span>') + '</nav>';
  return m + '</article>';
}
const pages = { 'index.html': html };
for (const f of readdirSync(join(ROOT, 'projects')).filter((f) => f.endsWith('.json'))) {
  const d = j('projects/' + f);
  pages[d.slug + '.html'] = page({ title: d.title.toUpperCase() + ' — ' + site.brand, css: ['project'], main: projectPage(d), home: '/', fonts: d.fonts || '' });
}

if (existsSync(OUT)) rmSync(OUT, { recursive: true });
mkdirSync(OUT, { recursive: true });
cpSync(join(ROOT, 'site/styles'), join(OUT, 'styles'), { recursive: true });
// стили кейса — общий файл с версией на Зеро-блоках (css/project-page.css) + поправки статичной версии
writeFileSync(join(OUT, 'styles/project.css'), readFileSync(join(ROOT, 'css/project-page.css'), 'utf8') + '\n' + readFileSync(join(ROOT, 'site/styles/project-static.css'), 'utf8'));
rmSync(join(OUT, 'styles/project-static.css'));
cpSync(join(ROOT, 'site/scripts'), join(OUT, 'scripts'), { recursive: true });
cpSync(join(ROOT, 'img'), join(OUT, 'img'), { recursive: true });
cpSync(join(ROOT, 'site/assets/fonts'), join(OUT, 'site/assets/fonts'), { recursive: true });
// исходные картинки Тильды — только те, у которых нет лёгких версий
for (const m of new Set(Object.values(pages).join('').match(/site\/assets\/tilda\/[^"?\s,]+/g) || [])) { mkdirSync(dirname(join(OUT, m)), { recursive: true }); cpSync(join(ROOT, m), join(OUT, m)); }

// Версия по содержимому: к каждому адресу файла в html дописывается ?v=<хеш>. Файл изменился — адрес новый,
// и браузер (в том числе Safari на iPhone) не может подставить старую копию из кеша к новой странице.
// Файл не менялся — адрес тот же, и он берётся из кеша без запроса.
const hashes = new Map();
const vOf = (p) => {
  if (!hashes.has(p)) hashes.set(p, existsSync(join(OUT, p)) ? createHash('sha1').update(readFileSync(join(OUT, p))).digest('hex').slice(0, 8) : '');
  return hashes.get(p);
};
const version = (html) => html
  .replace(/\b(src|href|data-cover|data-src)="((?:styles|scripts|img|site\/assets\/tilda)\/[^"?#]+)"/g, (m, a, p) => (vOf(p) ? `${a}="${p}?v=${vOf(p)}"` : m))
  .replace(/srcset="([^"]+)"/g, (m, list) => 'srcset="' + list.split(', ').map((e) => { const [p, w] = e.split(' '); return vOf(p) ? `${p}?v=${vOf(p)} ${w}` : e; }).join(', ') + '"');
for (const [f, h] of Object.entries(pages)) writeFileSync(join(OUT, f), version(h));
const versioned = version(html);

// Заголовки кеша для хостинга (Netlify / Cloudflare Pages читают этот файл сами; для других — см. README):
// страница не кешируется, файлы с ?v= — на год.
writeFileSync(join(OUT, '_headers'), `/
  Cache-Control: no-cache
/index.html
  Cache-Control: no-cache
/styles/*
  Cache-Control: public, max-age=31536000, immutable
/scripts/*
  Cache-Control: public, max-age=31536000, immutable
/img/*
  Cache-Control: public, max-age=31536000, immutable
/site/assets/tilda/*
  Cache-Control: public, max-age=31536000, immutable
/site/assets/fonts/*
  Cache-Control: public, max-age=604800
`);
console.log('site/dist готов:', Object.keys(pages).join(', '), '·', versioned.length, 'байт главной, версий файлов:', [...hashes.values()].filter(Boolean).length);
