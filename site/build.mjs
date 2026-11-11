// Working Title · сборка статического сайта без Тильды и без зависимостей.
// Запуск: node site/build.mjs  →  папка site/dist (её и заливать на хостинг).
// Тексты берутся из content/*.json, стили — site/styles, картинки — img/ и site/assets/.
import { readFileSync, writeFileSync, mkdirSync, cpSync, rmSync, existsSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';

/* Если на устройстве включено «Уменьшение движения» (айфон: Настройки → Универсальный доступ → Движение):
   'soft' — спокойный режим: прелоадер, проявления, галерея есть, но без смещений и полётов (по умолчанию);
   'full' — настройку не учитывать, анимации как у всех;
   'off'  — движение выключено полностью. */
const MOTION_REDUCED = 'soft';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'site/dist');
const j = (p) => JSON.parse(readFileSync(join(ROOT, p), 'utf8'));
const site = j('content/site.json');
const home = j('content/home.json');

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
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
  const g = src.match(/^img\/gallery\/(.+)-(\d+)\.webp$/);
  const t = src.match(/^site\/assets\/tilda\/(.+)\.(?:jpe?g|png)$/i);
  if (g) { dir = 'img/gallery'; stem = g[1]; } else if (t) { dir = 'img/opt'; stem = t[1]; } else return null;
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
  `<a class="btn btn--${kind}" href="${href(b.href)}">${kind === 'light' ? '<span class="btn__dot" aria-hidden="true"></span>' : ''}${esc(b.label)}</a>`;

const header = `
<header class="hd">
  <canvas class="hd__trail" aria-hidden="true"></canvas>
  <a class="hd__logo" href="./" aria-label="${esc(site.brand)} — на главную"><b>WORKING</b> TITLE</a>
  <nav class="hd__nav" aria-label="Разделы">
    ${site.nav.map((n) => `<a class="hd__link" href="#${n.id}">${esc(n.label)}</a>`).join('\n    ')}
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
  <p class="hero__lead t-small" data-intro>${typo(h.hero.lead)}</p>
  <h1 class="hero__title t-h1" data-intro data-fill="load">${lines(h.hero.title)}</h1>
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
  <p class="projects__label t-small t-grey">${typo(h.projects.label)}</p>
  <h2 class="projects__title t-h2" data-fill>${typo(h.projects.title)}</h2>
  <ul class="projects__list">
    ${h.projects.items.map((p) => `<li class="prow">
      <a class="prow__link" href="/projects/${esc(p.slug)}/" data-cover="${esc(p.cover)}">
        <span class="prow__name t-name">${esc(p.name)}</span>
        <span class="prow__type t-small t-grey">${typo(p.type)}</span>
        <span class="prow__year t-small t-grey">${esc(p.year)}</span>
        <span class="prow__pics">${p.mobile.map((m) => img(m, '')).join('')}</span>
      </a>
    </li>`).join('\n    ')}
  </ul>
</section>`;

const lab = `
<section class="lab grid" aria-labelledby="lab-title">
  <h2 class="lab__title t-h2" id="lab-title" data-fill>${lines(h.lab.title)}</h2>
  <p class="lab__lead t-small t-grey">${typo(h.lab.lead)}</p>
  <div class="lab__grid">
    ${h.lab.images.map((x) => `<figure class="lab__it lab__it--${x.d} lab__it--m-${x.m}">${img(x.src, '', '', false, x.m === 'wide' ? '(min-width: 768px) 25vw, 100vw' : '(min-width: 768px) 25vw, 50vw')}</figure>`).join('\n    ')}
  </div>
</section>`;

const about = `
<section class="about grid" id="${h.about.anchor}">
  <p class="about__label t-small t-grey">${typo(h.about.label)}</p>
  <h2 class="about__title t-h2" data-fill>${lines(h.about.title)}</h2>
  <div class="about__photos">${h.about.photos.map((p) => img(p, '', '', false, '(min-width: 768px) 25vw, 50vw')).join('')}</div>
  <p class="about__lead t-small t-grey">${typo(h.about.lead)}</p>
  <div class="about__act">${btn(h.about.cta)}<a class="t-small mail" href="mailto:${esc(site.contacts.email)}">${esc(site.contacts.email)}</a></div>
</section>`;

const services = `
<section class="services grid" aria-label="Услуги">
  ${h.services.items.map((s) => `<div class="svc">
    <h3 class="svc__title t-small">${typo(s.title)}</h3>
    <p class="svc__text t-small t-grey">${s.text.map(typo).join('<br>')}</p>
  </div>`).join('\n  ')}
</section>`;

const cta = `
<section class="cta grid" id="${h.cta.anchor}">
  ${img(h.cta.image, '', 'cta__img', false, '(min-width: 768px) 24vw, 100vw')}
  <h2 class="cta__title t-h2">${lines(h.cta.title)}</h2>
  <div class="cta__act">${btn(h.cta.primary)}${btn(h.cta.secondary, 'grey')}<a class="t-small mail" href="mailto:${esc(site.contacts.email)}">${esc(site.contacts.email)}</a></div>
</section>`;

const c = site.contacts;
const footer = `
<footer class="ft grid">
  <p class="ft__logo"><b>WORKING</b> TITLE</p>
  <p class="ft__made t-small t-grey">Made by WORKING TITLE ©${esc(site.footer.year)}</p>
  <nav class="ft__col" aria-label="Компания"><h2 class="ft__h">Компания</h2>
    ${site.nav.map((n) => `<a href="#${n.id}">${esc(n.label)}</a>`).join('')}
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
const html = `<!doctype html>
<html lang="${site.lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(site.seo.title || site.brand)}</title>
${site.seo.description ? `<meta name="description" content="${esc(site.seo.description)}">\n` : ''}<meta name="theme-color" content="${site.themes.dark.bg}">
<link rel="preload" href="site/assets/fonts/manrope-var.woff" as="font" type="font/woff" crossorigin>
<link rel="stylesheet" href="styles/tokens.css">
<link rel="stylesheet" href="styles/base.css">
<link rel="stylesheet" href="styles/home.css">
<link rel="stylesheet" href="styles/motion.css">
<script>${diag}</script>
<script>if('scrollRestoration' in history)history.scrollRestoration='manual';try{if(localStorage.getItem('uma-theme')==='light')document.documentElement.classList.add('light-theme')}catch(e){}document.documentElement.classList.add('js');try{if(matchMedia('(prefers-reduced-motion: reduce)').matches&&'${MOTION_REDUCED}'!=='full')document.documentElement.classList.add('${MOTION_REDUCED}'==='off'?'rm-off':'rm')}catch(e){}setTimeout(function(){var h=document.documentElement;if(!window.__umaBoot||!h.classList.contains('is-ready'))h.classList.remove('js')},12000)</script>\n<noscript><style>.pl{display:none!important}</style></noscript>
</head>
<body>
<div class="pl" id="preloader" aria-hidden="true">
  <div class="pl__logo"><span class="pl__base"><b>WORKING</b> TITLE</span><span class="pl__ink"><b>WORKING</b> TITLE</span></div>
</div>
<canvas id="trail" aria-hidden="true"></canvas>
<canvas id="wipe" aria-hidden="true"></canvas>
${header}
<main>
${hero}
${projects}
${lab}
${about}
${services}
${cta}
</main>
${footer}
<script src="scripts/site.js" defer></script>
</body>
</html>`;

if (existsSync(OUT)) rmSync(OUT, { recursive: true });
mkdirSync(OUT, { recursive: true });
cpSync(join(ROOT, 'site/styles'), join(OUT, 'styles'), { recursive: true });
cpSync(join(ROOT, 'site/scripts'), join(OUT, 'scripts'), { recursive: true });
cpSync(join(ROOT, 'img'), join(OUT, 'img'), { recursive: true });
cpSync(join(ROOT, 'site/assets/fonts'), join(OUT, 'site/assets/fonts'), { recursive: true });
// исходные картинки Тильды — только те, у которых нет лёгких версий
for (const m of new Set(html.match(/site\/assets\/tilda\/[^"?\s,]+/g) || [])) { mkdirSync(dirname(join(OUT, m)), { recursive: true }); cpSync(join(ROOT, m), join(OUT, m)); }

// Версия по содержимому: к каждому адресу файла в html дописывается ?v=<хеш>. Файл изменился — адрес новый,
// и браузер (в том числе Safari на iPhone) не может подставить старую копию из кеша к новой странице.
// Файл не менялся — адрес тот же, и он берётся из кеша без запроса.
const hashes = new Map();
const vOf = (p) => {
  if (!hashes.has(p)) hashes.set(p, existsSync(join(OUT, p)) ? createHash('sha1').update(readFileSync(join(OUT, p))).digest('hex').slice(0, 8) : '');
  return hashes.get(p);
};
const versioned = html
  .replace(/\b(src|href|data-cover|data-src)="((?:styles|scripts|img|site\/assets\/tilda)\/[^"?#]+)"/g, (m, a, p) => (vOf(p) ? `${a}="${p}?v=${vOf(p)}"` : m))
  .replace(/srcset="([^"]+)"/g, (m, list) => 'srcset="' + list.split(', ').map((e) => { const [p, w] = e.split(' '); return vOf(p) ? `${p}?v=${vOf(p)} ${w}` : e; }).join(', ') + '"');
writeFileSync(join(OUT, 'index.html'), versioned);

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
console.log('site/dist готов:', versioned.length, 'байт html, версий файлов:', [...hashes.values()].filter(Boolean).length);
