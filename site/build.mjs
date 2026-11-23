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
// главная из админки: многострочные поля — одной строкой с переносами, якоря разделов — постоянные
{
  const L = (v) => (Array.isArray(v) ? v : String(v || '').split('\n'));
  home.hero.title = L(home.hero.title);
  home.hero.lead = Array.isArray(home.hero.lead) ? home.hero.lead : String(home.hero.lead || '').split(/\n\s*\n/).map(L);
  for (const k of ['lab', 'about', 'cta']) home[k].title = L(home[k].title);
  for (const s of home.services.items) s.text = L(s.text);
  for (const it of home.projects.items) if (!it.mobile) it.mobile = [it.mobile1, it.mobile2].filter(Boolean);
  Object.assign(home.projects, { anchor: 'projects' }); Object.assign(home.about, { anchor: 'about' }); Object.assign(home.cta, { anchor: 'contacts' });
}

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
  t = t.replace(/ (—|–)/g, '&nbsp;$1');   // тире не начинает строку — остаётся в конце предыдущей
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
  const g = src.match(/^(img\/[\w\/.-]+)\/(.+)-(\d+)\.webp$/);
  const t = src.match(/^site\/assets\/tilda\/(.+)\.(?:jpe?g|png)$/i);
  const u = src.match(/^(img\/[\w\/.-]+)\/([^\/]+?)\.(?:jpe?g|png|webp|avif|gif|tiff?)$/i);   // загруженный исходник: версии лежат рядом
  if (g) { dir = g[1]; stem = g[2]; } else if (t) { dir = 'img/opt'; stem = t[1]; } else if (u) { dir = u[1]; stem = u[2]; } else return null;
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

const soon = j('content/soon.json');
const projects = `
<section class="projects grid" id="${h.projects.anchor}">
  <p class="projects__label ty-small ty-grey">${typo(h.projects.label)}</p>
  <h2 class="projects__title ty-h2" data-fill>${typo(h.projects.title)}</h2>
  <ul class="projects__list">
    ${h.projects.items.map((p) => `<li class="prow">
      <a class="prow__link" href="${esc(p.url || soon.url)}" data-cover="${esc(p.cover)}">
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

  <!-- телефон: ведомость в две колонки и знак SHAPE (of Sense) во всю ширину -->
  <div class="ftm">
    <p class="ftm__lock" aria-label="${esc(site.brand)}"><span class="ftm__shape" data-fit-w>SHAPE</span><span class="ftm__sense" data-fit-w="0.79">(of Sense)</span></p>
    <div class="ftm__row"><span class="ftm__k">Разделы</span><span class="ftm__v">${site.nav.map((n) => `<a href="${home}#${n.id}">${esc(n.label)}</a>`).join('')}</span></div>
    <div class="ftm__row is-group"><div class="ftm__pair"><span class="ftm__k">Почта</span><span class="ftm__v"><a href="mailto:${esc(c.email)}">${esc(c.email).replace('@', '@<wbr>')}</a></span></div><div class="ftm__pair"><span class="ftm__k">Телефон</span><span class="ftm__v"><a href="tel:${esc(c.phone.replace(/[^\d+]/g, ''))}">${esc(c.phone)}</a></span></div><div class="ftm__pair"><span class="ftm__k">Телеграм</span><span class="ftm__v">${c.telegram ? `<a href="${esc(c.telegram)}">Написать</a>` : '<span>Написать</span>'}</span></div></div>
    <div class="ftm__row"><span class="ftm__k">Город</span><span class="ftm__v">${typo(c.city)}</span></div>
    <div class="ftm__row"><span class="ftm__k">Документы</span><span class="ftm__v">${c.privacy ? `<a href="${esc(c.privacy)}">Политика конфиденциальности</a>` : '<span>Политика конфиденциальности</span>'}</span></div>
    <p class="ftm__meta"><span>Made by ${esc(site.brand)}</span><span>©${esc(site.footer.year)}</span></p>
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
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Lora:ital@1&display=swap">
${fonts ? `<link rel="stylesheet" href="${esc(fonts)}">\n` : ''}<link rel="stylesheet" href="styles/tokens.css">
<link rel="stylesheet" href="styles/base.css">
${css.map((f) => `<link rel="stylesheet" href="styles/${f}.css">`).join('\n')}
<link rel="stylesheet" href="styles/motion.css">
<script>${diag}</script>
<script>if('scrollRestoration' in history)history.scrollRestoration='manual';try{if(localStorage.getItem('uma-theme')==='light')document.documentElement.classList.add('light-theme')}catch(e){}document.documentElement.classList.add('js');try{var pt=sessionStorage.getItem('sos-pt');if(pt)document.documentElement.classList.add(pt==='case'?'pt-case':'pt-in')}catch(e){}try{if(matchMedia('(prefers-reduced-motion: reduce)').matches&&'${MOTION_REDUCED}'!=='full')document.documentElement.classList.add('${MOTION_REDUCED}'==='off'?'rm-off':'rm')}catch(e){}setTimeout(function(){var h=document.documentElement;if(!window.__umaBoot||!h.classList.contains('is-ready'))h.classList.remove('js')},12000)</script>\n<noscript><style>.pl{display:none!important}</style></noscript>
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
const arrowSvg = '<svg viewBox="0 0 10 8" aria-hidden="true"><path d="M5 1.1 8.9 6.9H1.1Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>';   // маленький треугольник со скруглёнными углами
function projectFigure(slug, im, cls = '') {
  if (!im) return '';
  // clear — картинка с прозрачным фоном: на телефоне лежит на плашке; mscroll — на телефоне картинка шире экрана в N раз и листается вбок
  const c = 'uma-project__figure' + (cls ? ' ' + cls : '') + (im.clear ? ' is-clear' : '') + (im.mscroll ? ' is-scroll' : '') + (im.panel ? ' is-panel' + (im.panel === 'top' ? ' is-panel-top' : '') : '');   // panel — плашка и на десктопе (top — картинка уходит под нижний край)
  let src = im.src, w = im.w, hh = im.h;
  if (!src) {
    const base = `img/projects/${slug}/${im.name}`;
    if (existsSync(join(ROOT, base + '-1200.webp'))) src = base + '-1200.webp';
  }
  // своя картинка для телефона (m: {name, w, h}) — другая раскладка, тот же смысл
  const m = im.m && (im.m.src || existsSync(join(ROOT, `img/projects/${slug}/${im.m.name}-1200.webp`))) ? im.m : null;
  const vars = [];
  if (w && hh) vars.push(`--ar:${w} / ${hh}`);
  const mw = m ? m.w : w, mh = m ? m.h : hh;
  if (im.mscroll && mw && mh) vars.push(`--ar-m:${+(mw / im.mscroll).toFixed(2)} / ${mh}`, `--ms:${im.mscroll}`, `--ar-s:${mw} / ${mh}`);
  else if (m) vars.push(`--ar-m:${m.w} / ${m.h}`);
  const ratio = vars.length ? ` style="${vars.join(';')}"` : '';
  if (!src) return `<figure class="${c} is-empty"${ratio} data-label="${esc(im.alt)}"></figure>`;
  let pic = img(src, im.alt, '', /uma-project__cover/.test(c), '(max-width: 1920px) 97vw, 1856px');
  if (m) {
    const v = variants(m.src || `img/projects/${slug}/${m.name}-1200.webp`) || [{ path: m.src, w: m.w }];
    pic = `<picture><source media="(max-width: 767px)" srcset="${v.map((x) => `${esc(x.path)} ${x.w}w`).join(', ')}" sizes="100vw">${pic}</picture>`;
  }
  return `<figure class="${c}"${ratio}>${pic}</figure>`;
}
// «Подробнее»: на телефоне длинный текст свёрнут, кнопка раскрывает его (на десктопе кнопки нет, текст целиком)
const moreBtn = (label) => `<button class="uma-project__more" type="button" aria-expanded="false"><span>${esc(label)}</span><i aria-hidden="true"></i></button>`;
const turnAttr = (x, label) => (x.url && x.url !== '#' && x.url !== soon.url ? `data-turn-title="${esc(x.title)}" data-turn-label="${esc(label)}" data-turn-page="${esc(x.title.toLowerCase().replace(/\s+/g, '-'))}"` : '');
function projectPage(d) {
  const s = d.slug;
  let m = '<article class="uma-project" aria-labelledby="uma-project-title">';
  m += `<header class="uma-project__top"><div class="uma-project__left"><h1 class="uma-project__title" id="uma-project-title">${esc(d.title)}</h1>` +
    (d.back ? `<a class="uma-project__back" href="${esc(d.back.url)}">${esc(d.back.label)}</a>` : '') + '</div><div class="uma-project__meta">' +
    (d.meta || []).map((g) => `<dl class="uma-project__meta-group"><dt>${esc(g.title)}</dt>${g.items.map((i) => `<dd>${typo(i)}</dd>`).join('')}</dl>`).join('') +
    '</div></header>';
  if (d.cover) m += projectFigure(s, { src: d.cover.src, name: d.cover.image, w: d.cover.w, h: d.cover.h, alt: d.cover.alt }, 'uma-project__cover');
  if (d.intro) m += `<section class="uma-project__intro"><div class="uma-project__lead">${d.intro.lead.map(para).join('')}</div><div class="uma-project__cols">` +
    // одна колонка текста во вступлении (вторая пустая) — встаёт по правилу одиночного текста: с 10-й или 11-й колонки
    (d.intro.columns.filter((c) => c.length).length === 1
      ? d.intro.columns.filter((c) => c.length).map((col) => `<div class="uma-project__col is-single at-${d.intro.at || 10}">${col.map(para).join('')}</div>`).join('')
      : d.intro.columns.map((col) => `<div class="uma-project__col">${col.map(para).join('')}</div>`).join('')) + '</div>' +
    moreBtn('Подробнее о проекте') + '</section>';
  const total = (d.sections || []).filter((x) => x.title).length; let num = 0;
  for (const sec of d.sections || []) {
    // две картинки рядом, без заголовка и текста
    if (sec.layout === 'pair') { m += `<section class="uma-project__pair${sec.gap ? ' is-gap' : ''}">${(sec.images || []).map((im) => projectFigure(s, im)).join('')}</section>`; continue; }
    const gap = sec.gap ? ` style="--up-pgap:${sec.gap}px"` : '';
    num++;
    // на телефоне: у шрифтов описания собраны под образцами в один текст (вместе с текстом раздела) и свёрнуты под «Подробнее»;
    // mobileText — подпись, которая есть только на телефоне
    const fontsM = sec.fonts && sec.fonts.some((f) => !f.sample);
    const mText = fontsM ? [].concat(...(sec.columns || []), ...sec.fonts.filter((f) => !f.sample).map((f) => [{ h: f.label || f.name, t: f.text || '' }]))
      : (!sec.columns && sec.mobileText ? sec.mobileText : null);
    const cls = 'uma-project__section' + (sec.palette ? ' is-palette' : '') + (fontsM ? ' is-fonts' : '');
    m += `<section class="${cls}"><div class="uma-project__head"><h2 class="uma-project__h2">${typo(sec.title)}</h2>` +
      (!sec.columns ? '' : sec.layout === 'split'
        ? `<div class="uma-project__cols${fontsM ? ' is-d-only' : ''}"${gap}>${sec.columns.map((col) => `<div class="uma-project__col">${col.map(para).join('')}</div>`).join('')}</div>`
        : `<div class="uma-project__aside at-${sec.at || 10}${fontsM ? ' is-d-only' : ''}"${gap}>${sec.columns[0].map(para).join('')}</div>`) +   // at: 10 — средний текст, 11 — мало текста
      (mText ? `<div class="uma-project__aside is-m-only">${mText.map(para).join('')}</div>` : '') +
      ((sec.columns || mText) && !sec.palette ? moreBtn('Подробнее') : '') + '</div>';
    // палитра: плашки с HEX и «Aa»
    // палитра: у цветов с названием — квадрат в рамке: (01), название, HEX (рамка держит светлые цвета на светлой теме)
    if (sec.palette && sec.palette.some((c) => c.name)) m += `<ul class="uma-project__palette is-framed" style="--n:${sec.palette.length}${sec.paletteFont ? `;font-family:'${esc(sec.paletteFont)}',var(--f-sans)` : ''}">` +
      sec.palette.map((c, i) => `<li><span class="uma-project__sw" style="background:${esc(c.hex)};color:${esc(c.ink || inkFor(c.hex))}"><span>(${pad2(i + 1)})</span><b>${esc(c.name)}</b><span>HEX ${esc(c.hex.toUpperCase())}</span></span></li>`).join('') + '</ul>';
    else if (sec.palette) m += `<ul class="uma-project__palette${sec.palette.length === 3 ? ' is-3' : ''}" style="--n:${sec.palette.length}${sec.paletteFont ? `;font-family:'${esc(sec.paletteFont)}',var(--f-sans)` : ''}">` + sec.palette.map((c) => { const hex = c.hex || c;
      return `<li style="background:${esc(hex)};color:${esc(c.ink || inkFor(hex))}"><span class="uma-project__hex"><b>HEX</b> ${esc(hex.toUpperCase())}</span><span class="uma-project__aa" aria-hidden="true">Aa</span></li>`; }).join('') + '</ul>';
    // шрифты: название крупно самим шрифтом, справа — роль и описание
    // образец «Aa Bb Cc» во всю ширину своим шрифтом и цветом, над ним — название
    if (sec.fonts) m += '<div class="uma-project__fonts">' + sec.fonts.map((f) => f.sample
      ? `<div class="uma-project__font is-sample"><p class="uma-project__font-name">${esc(f.name)}</p><p class="uma-project__sample" aria-hidden="true" style="font-family:'${esc(f.family || f.name)}',${f.serif ? 'Georgia,serif' : 'Arial,sans-serif'};font-weight:${+f.weight || 400}${f.color ? ';color:' + esc(f.color) : ''}">${f.sample.split(' ').map((x) => `<span>${esc(x)}</span>`).join('')}</p></div>`
      : `<div class="uma-project__font"><p class="uma-project__font-name is-m-only">${esc(f.name)}</p><p class="uma-project__sample-m is-m-only" aria-hidden="true" style="font-family:'${esc(f.family || f.name)}',${f.serif ? 'Georgia,serif' : 'Arial,sans-serif'}${f.weight ? ';font-weight:' + +f.weight : ''}${f.color ? ';color:' + esc(f.color) : ''}">Aa Bb Cc</p><p class="uma-project__specimen" style="font-family:'${esc(f.family || f.name)}',${f.serif ? 'Georgia,serif' : 'Arial,sans-serif'}${f.weight ? ';font-weight:' + +f.weight : ''}${f.color ? ';color:' + esc(f.color) : ''}${f.size ? ';--fs:' + +f.size : ''}">${esc(f.name)}</p>` +
      `<div class="uma-project__font-info"><p class="uma-project__sub">${typo(f.label || '')}</p><p>${typo(f.text || '')}</p></div></div>`).join('') + '</div>';
    m += projectFigure(s, sec.image) + projectFigure(s, sec.after) + '</section>';
  }
  const p = d.pagination;
  for (const x of p ? [p.prev, p.next] : []) if (x && (!x.url || x.url === '#')) x.url = soon.url;   // кейса ещё нет — «Скоро здесь»
  if (p) m += '<nav class="uma-project__pager" aria-label="Другие проекты">' +
    (p.prev ? `<a class="is-prev" href="${esc(p.prev.url)}" rel="prev" ${turnAttr(p.prev, 'Предыдущий проект')}>${arrowSvg}${esc(p.prev.title)}</a>` : '<span></span>') +
    `<div class="uma-project__count" aria-label="Проект ${p.index} из ${p.total}">${pad2(p.index)}/<span>${pad2(p.total)}</span></div>` +
    (p.next ? `<a class="is-next" href="${esc(p.next.url)}" rel="next" ${turnAttr(p.next, 'Следующий проект')}>${esc(p.next.title)}${arrowSvg}</a>` : '<span></span>') + '</nav>';
  return m + '</article>';
}
/* ---------------- кейс, версия 2: «Индекс» + наезжающий лист (как у Locomotive) ----------------
   Первый экран кейса закреплён; лист с обложкой и содержимым наезжает на него при прокрутке.
   Всё стоит на сетке главной: поле | 568 | 190 | 186 | остаток — линии A «Проекты», B «О нас», C «Контакты». */

/* ---------------- кейс из админки → внутренняя структура ----------------
   Файл кейса (projects/<slug>.json) хранит только содержание: тексты одним полем, картинки путями,
   раскладку — выбором из дизайн-системы. Пропорции и прозрачность картинок берутся из img/meta.json
   (его пишет tools/images.py), соседние кейсы и «назад к проектам» — из порядка проектов на главной.
   Текст в поле: строка — абзац, пустая строка — пустая строка, «## Подзаголовок» — пункт с подзаголовком. */
const META = existsSync(join(ROOT, 'img/meta.json')) ? j('img/meta.json') : {};
const clean = (p) => String(p || '').replace(/^\/+/, '');
function textCol(str) {
  const out = []; let item = null;
  for (const line of String(str || '').replace(/\r/g, '').split('\n')) {
    if (/^##\s+/.test(line)) { item = { h: line.replace(/^##\s+/, ''), t: '' }; out.push(item); continue; }
    if (item && line.trim()) { item.t += (item.t ? '\n' : '') + line; continue; }
    item = null; out.push(line.trim() ? line : '');
  }
  while (out.length && out[out.length - 1] === '') out.pop();
  while (out.length && out[0] === '') out.shift();
  return out;
}
function imgOf(o) {
  if (!o || !o.image) return null;
  const src = clean(o.image), mt = META[src] || {};
  const r = { src, w: mt.w, h: mt.h, alt: o.alt || '', clear: !!mt.alpha };
  if (o.mobile) { const ms = clean(o.mobile), mm = META[ms] || {}; r.m = { src: ms, w: mm.w, h: mm.h }; }
  if (o.plate && o.plate !== 'none') r.panel = o.plate;
  if (+o.scroll) r.mscroll = +o.scroll;
  return r;
}
function loadProject(file) {
  const v = j('projects/' + file), slug = file.replace(/\.json$/, '');
  if (v.slug) return v;                                    // старый формат
  const lines = (t) => String(t || '').split('\n').map((x) => x.trim()).filter(Boolean);
  const d = { slug, title: v.title, fonts: v.fonts || '', back: { label: 'Назад к проектам', url: '/#projects' } };
  d.meta = [{ title: 'Проект', items: lines(v.project) }, { title: 'Задачи', items: lines(v.tasks) }].filter((g) => g.items.length);
  if (v.cover && v.cover.image) { const c = imgOf(v.cover); d.cover = { src: c.src, w: c.w, h: c.h, alt: c.alt }; }
  const it = v.intro || {};
  d.intro = { lead: lines(v.lead), columns: [textCol(it.text), textCol(it.text2)], at: +it.at || undefined };
  d.sections = (v.sections || []).map((x) => {
    if (x.type === 'pair') return { layout: 'pair', gap: !!x.gap, images: [imgOf(x.left), imgOf(x.right)].filter(Boolean) };
    const cols = [x.text, x.text2].filter((t) => String(t || '').trim()).map(textCol);
    const sec = { title: x.title };
    if (cols.length) { sec.columns = cols; sec.layout = cols.length > 1 ? 'split' : 'side'; sec.at = +x.at || 10; }
    if (+x.para_gap) sec.gap = +x.para_gap;
    if (String(x.mobile_text || '').trim()) sec.mobileText = textCol(x.mobile_text);
    if (x.type === 'palette') { sec.palette = x.colors || []; if (x.font) sec.paletteFont = x.font; }
    if (x.type === 'fonts') sec.fonts = x.fonts || [];
    sec.image = imgOf(x.image); sec.after = imgOf(x.image_after);
    return sec;
  });
  // соседние кейсы — по порядку проектов на главной (по кругу)
  const list = home.projects.items, i = list.findIndex((p) => p.slug === slug || String(p.url || '').endsWith(slug.replace(/-/g, '_')));
  if (i >= 0) {
    const at = (k) => { const p = list[(k + list.length) % list.length]; return { title: p.name, url: p.url || '#' }; };
    d.pagination = { index: i + 1, total: list.length, prev: at(i - 1), next: at(i + 1) };
  }
  return d;
}
const allProjects = () => readdirSync(join(ROOT, 'projects')).filter((f) => f.endsWith('.json')).map(loadProject);
function csFig(slug, im, cls = '') {
  if (!im) return '';
  let src = im.src;
  if (!src) { const b = `img/projects/${slug}/${im.name || im.image}`; if (existsSync(join(ROOT, b + '-1200.webp'))) src = b + '-1200.webp'; }
  const ratio = im.w && im.h ? ` style="aspect-ratio:${im.w} / ${im.h}"` : '';
  if (!src) return `<figure class="cs-fig is-empty ${cls}"${ratio} data-label="${esc(im.alt)}"></figure>`;
  return `<figure class="cs-fig ${cls}"${ratio}>${img(src, im.alt, '', cls.includes('cs-cover'), '(max-width: 1920px) 97vw, 1856px')}</figure>`;
}
function caseV2(d) {
  const s = d.slug, p = d.pagination || {};
  const kv = (str) => { const m = String(str).match(/^([^:]{2,20}):\s*(.+)$/); return m ? [m[1], m[2]] : [null, str]; };
  const proj = (d.meta || []).find((g) => /проект/i.test(g.title)) || { items: [] };
  const tasks = (d.meta || []).find((g) => /задач/i.test(g.title)) || { items: [] };
  const facts = proj.items.map(kv);
  const client = facts.find((f) => /клиент/i.test(f[0] || '')), year = facts.find((f) => /год/i.test(f[0] || ''));
  const field = facts.find((f) => !f[0]);
  const cell = (label, val) => `<div class="cs-cell"><p class="cs-k">${esc(label)}</p><p class="cs-v">${val}</p></div>`;
  let m = `<article class="cs" aria-labelledby="cs-title">`;
  // первый экран кейса
  m += `<header class="cs-intro"><div class="cs-intro__in">` +
    `<div class="cs-intro__meta">` +
      `<div class="cs-cell cs-cell--back"><a class="cs-back" href="${esc((d.back && d.back.url) || '/#projects')}">Все проекты</a>` +
        (p.index ? `<p class="cs-k cs-count">${pad2(p.index)} / ${pad2(p.total)}</p>` : '') + `</div>` +
      cell('Клиент', esc(client ? client[1] : d.title)) +
      cell('Год', esc(year ? year[1] : '')) +
      cell('Сфера', esc(field ? field[1] : '')) +
      `<div class="cs-cell cs-cell--tasks"><p class="cs-k">Задачи</p><ul class="cs-tasks">${tasks.items.map((t) => `<li>${typo(t)}</li>`).join('')}</ul></div>` +
    `</div>` +
    `<h1 class="cs-title" id="cs-title">${esc(d.title)}</h1>` +
  `</div></header>`;
  // лист
  m += `<div class="cs-sheet">`;
  if (d.cover) m += csFig(s, { src: d.cover.src, name: d.cover.image, w: d.cover.w, h: d.cover.h, alt: d.cover.alt }, 'cs-cover');
  if (d.intro) m += `<section class="cs-about"><p class="cs-statement">${d.intro.lead.map(typo).join(' ')}</p>` +
    d.intro.columns.map((col, i) => `<div class="cs-text cs-text--${i ? 'c' : 'a'}">${col.map(para).join('')}</div>`).join('') + `</section>`;
  let n = 0;
  const titled = (d.sections || []).filter((x) => x.title).length;
  for (const sec of d.sections || []) {
    if (sec.layout === 'pair') { m += `<section class="cs-pair">${(sec.images || []).map((im) => csFig(s, im)).join('')}</section>`; continue; }
    n++;
    const cols = sec.columns || [];
    const text = !cols.length ? '' : sec.layout === 'split'
      ? cols.map((col, i) => `<div class="cs-text cs-text--${i ? 'c' : 'a'}">${col.map(para).join('')}</div>`).join('')
      : `<div class="cs-text cs-text--b">${cols[0].map(para).join('')}</div>`;
    m += `<section class="cs-sec"><div class="cs-sec__head"><p class="cs-num">${pad2(n)} / ${pad2(titled)}</p><h2 class="cs-h2">${typo(sec.title)}</h2>${text}</div>`;
    if (sec.palette) m += '<ul class="cs-palette">' + sec.palette.map((c) => { const hex = c.hex || c;
      return `<li style="background:${esc(hex)};color:${esc(c.ink || inkFor(hex))}"><span><b>HEX</b> ${esc(hex.toUpperCase())}</span><span class="cs-aa" aria-hidden="true">Aa</span></li>`; }).join('') + '</ul>';
    if (sec.fonts) m += '<div class="cs-fonts">' + sec.fonts.map((f) =>
      `<div class="cs-font"><p class="cs-specimen" style="font-family:'${esc(f.family || f.name)}',${f.serif ? 'Georgia,serif' : 'Arial,sans-serif'}">${esc(f.name)}</p>` +
      `<div class="cs-text cs-text--c"><p class="uma-project__item"><span class="uma-project__sub">${typo(f.label || '')}</span>${typo(f.text || '')}</p></div></div>`).join('') + '</div>';
    m += csFig(s, sec.image) + csFig(s, sec.after) + `</section>`;
  }
  // следующий проект
  if (p.next) {
    const nd = allProjects().find((x) => p.next.url && p.next.url.endsWith(x.slug));
    const thumb = nd && nd.cover ? csFig(nd.slug, { src: nd.cover.src, name: nd.cover.image, w: nd.cover.w, h: nd.cover.h, alt: nd.cover.alt }, 'cs-next__img') : '';
    m += `<a class="cs-next" href="${esc(p.next.url)}" ${turnAttr(p.next, 'Следующий проект')}><p class="cs-k">Следующий проект${p.index ? ` · ${pad2(p.index % p.total + 1)} / ${pad2(p.total)}` : ''}</p>` +
      `<p class="cs-next__name">${esc(p.next.title)}<span class="cs-next__arr" aria-hidden="true">→</span></p>${thumb}</a>`;
  }
  return m + `</div></article>`;
}

const pages = { 'index.html': html };
for (const f of readdirSync(join(ROOT, 'projects')).filter((f) => f.endsWith('.json'))) {
  const d = loadProject(f);
  pages[d.slug + '.html'] = page({ title: d.title.toUpperCase() + ' — ' + site.brand, css: ['project'], main: projectPage(d), home: '/', fonts: d.fonts || '' });
  // предпросмотр новой раскладки кейса: <slug>-v2.html
  pages[d.slug + '-v2.html'] = page({ title: d.title.toUpperCase() + ' — ' + site.brand, css: ['case'], main: caseV2(d), home: '/', fonts: d.fonts || '' });
}

/* ---------------- «Скоро здесь»: для проектов, у которых ещё нет страницы ---------------- */
pages['soon.html'] = page({ title: soon.title + ' — ' + site.brand, css: ['soon'], home: '/',
  fonts: 'https://fonts.googleapis.com/css2?family=PT+Serif:ital,wght@1,700&display=swap',
  main: `<section class="soon">
  <div class="soon__head">
    <h1 class="soon__title">${typo(soon.title)}</h1>
    <p class="soon__text">${[].concat(Array.isArray(soon.text) ? soon.text : String(soon.text).split("\n")).map(typo).join('<br class="soon__lb"> ')}</p>
    <a class="soon__back" href="/#projects" data-back>${esc(soon.back)}</a>
  </div>
  <p class="soon__mark" aria-hidden="true"><span class="soon__shape">SHAPE</span> <span class="soon__of">(of&nbsp;Sense)</span></p>
</section>` });

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
