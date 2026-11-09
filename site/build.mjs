// Working Title · сборка статического сайта без Тильды и без зависимостей.
// Запуск: node site/build.mjs  →  папка site/dist (её и заливать на хостинг).
// Тексты берутся из content/*.json, стили — site/styles, картинки — img/ и site/assets/.
import { readFileSync, writeFileSync, mkdirSync, cpSync, rmSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'site/dist');
const j = (p) => JSON.parse(readFileSync(join(ROOT, p), 'utf8'));
const site = j('content/site.json');
const home = j('content/home.json');

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const lines = (a) => (Array.isArray(a) ? a : [a]).map(esc).join('<br>');
const href = (h) => esc(String(h).replace('{email}', site.contacts.email));
const img = (src, alt = '', cls = '', eager = false) =>
  `<img class="${cls}" src="/${esc(src)}" alt="${esc(alt)}"${eager ? ' fetchpriority="high"' : ' loading="lazy"'} decoding="async">`;
const btn = (b, kind = 'light') =>
  `<a class="btn btn--${kind}" href="${href(b.href)}">${kind === 'light' ? '<span class="btn__dot" aria-hidden="true"></span>' : ''}${esc(b.label)}</a>`;

const header = `
<header class="hd">
  <a class="hd__logo" href="/" aria-label="${esc(site.brand)} — на главную"><b>WORKING</b> TITLE</a>
  <nav class="hd__nav" aria-label="Разделы">
    ${site.nav.map((n) => `<a class="hd__link" href="#${n.id}">${esc(n.label)}</a>`).join('\n    ')}
  </nav>
  <button class="hd__theme" type="button" aria-label="Сменить тему" data-theme-toggle>
    <svg viewBox="0 0 16 16" width="10" height="10" aria-hidden="true"><path d="M8 1a7 7 0 1 0 7 7A5.5 5.5 0 0 1 8 1z" fill="currentColor"/></svg>
  </button>
</header>`;

const h = home;
const hero = `
<section class="hero grid" aria-label="О студии">
  <p class="hero__lead t-small">${esc(h.hero.lead)}</p>
  <h1 class="hero__title t-h1">${lines(h.hero.title)}</h1>
  <div class="hero__gallery" data-gallery>
    ${h.hero.gallery.map((g, i) => `<figure class="hero__slide${i ? '' : ' is-on'}">${img(g.src, g.title, '', i === 0)}</figure>`).join('\n    ')}
  </div>
  <div class="hero__aside" aria-hidden="true"></div>
</section>`;

const projects = `
<section class="projects grid" id="${h.projects.anchor}">
  <p class="projects__label t-small t-grey">${esc(h.projects.label)}</p>
  <h2 class="projects__title t-h2">${esc(h.projects.title)}</h2>
  <ul class="projects__list">
    ${h.projects.items.map((p) => `<li class="prow">
      <a class="prow__link" href="/projects/${esc(p.slug)}/">
        <span class="prow__name t-name">${esc(p.name)}</span>
        <span class="prow__type t-small t-grey">${esc(p.type)}</span>
        <span class="prow__year t-small t-grey">${esc(p.year)}</span>
        <span class="prow__pics">${p.mobile.map((m) => img(m, '')).join('')}</span>
      </a>
    </li>`).join('\n    ')}
  </ul>
</section>`;

const lab = `
<section class="lab grid" aria-labelledby="lab-title">
  <h2 class="lab__title t-h2" id="lab-title">${lines(h.lab.title)}</h2>
  <p class="lab__lead t-small t-grey">${esc(h.lab.lead)}</p>
  <div class="lab__grid">
    ${h.lab.images.map((x) => `<figure class="lab__it lab__it--${x.d} lab__it--m-${x.m}">${img(x.src, '')}</figure>`).join('\n    ')}
  </div>
</section>`;

const about = `
<section class="about grid" id="${h.about.anchor}">
  <p class="about__label t-small t-grey">${esc(h.about.label)}</p>
  <h2 class="about__title t-h2">${lines(h.about.title)}</h2>
  <div class="about__photos">${h.about.photos.map((p) => img(p, '')).join('')}</div>
  <p class="about__lead t-small t-grey">${esc(h.about.lead)}</p>
  <div class="about__act">${btn(h.about.cta)}<a class="t-small mail" href="mailto:${esc(site.contacts.email)}">${esc(site.contacts.email)}</a></div>
</section>`;

const services = `
<section class="services grid" aria-label="Услуги">
  ${h.services.items.map((s) => `<div class="svc">
    <h3 class="svc__title t-small">${esc(s.title)}</h3>
    <p class="svc__text t-small t-grey">${s.text.map(esc).join('<br>')}</p>
  </div>`).join('\n  ')}
</section>`;

const cta = `
<section class="cta grid" id="${h.cta.anchor}">
  ${img(h.cta.image, '', 'cta__img')}
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
    <span>${esc(c.city)}</span>
    <a href="mailto:${esc(c.email)}">Почта</a>
    ${c.telegram ? `<a href="${esc(c.telegram)}">Телеграм</a>` : '<span>Телеграм</span>'}
    <a href="tel:${esc(c.phone.replace(/[^\d+]/g, ''))}">${esc(c.phone)}</a>
  </div>
</footer>`;

const html = `<!doctype html>
<html lang="${site.lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(site.seo.title || site.brand)}</title>
${site.seo.description ? `<meta name="description" content="${esc(site.seo.description)}">\n` : ''}<meta name="theme-color" content="${site.themes.dark.bg}">
<link rel="preload" href="/site/assets/fonts/manrope-var.woff" as="font" type="font/woff" crossorigin>
<link rel="stylesheet" href="/styles/tokens.css">
<link rel="stylesheet" href="/styles/base.css">
<link rel="stylesheet" href="/styles/home.css">
</head>
<body>
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
<script src="/scripts/site.js" defer></script>
</body>
</html>`;

if (existsSync(OUT)) rmSync(OUT, { recursive: true });
mkdirSync(OUT, { recursive: true });
writeFileSync(join(OUT, 'index.html'), html);
cpSync(join(ROOT, 'site/styles'), join(OUT, 'styles'), { recursive: true });
cpSync(join(ROOT, 'site/scripts'), join(OUT, 'scripts'), { recursive: true });
cpSync(join(ROOT, 'img'), join(OUT, 'img'), { recursive: true });
cpSync(join(ROOT, 'site/assets'), join(OUT, 'site/assets'), { recursive: true });
console.log('site/dist готов:', html.length, 'байт html');
