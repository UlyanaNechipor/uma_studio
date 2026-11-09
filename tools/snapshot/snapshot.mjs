// UMA · слепок сайта с Тильды перед переездом.
// Запускается в GitHub Actions (.github/workflows/snapshot.yml), результат — в ветке export, папка export/.
//
// Что сохраняется:
//   export/page.html                — исходный HTML главной, как его отдаёт Тильда
//   export/meta.json                — title, description, OG, favicon, язык, счётчики, шрифты
//   export/elements.json            — каждый элемент каждого Зеро-блока: тип, классы, тексты, ссылки, картинки
//                                     и ВСЕ data-field-* настройки Тильды (позиции и размеры на всех её брейкпоинтах)
//   export/layout/<ширина>.json     — как элементы реально легли на этой ширине: координаты, шрифт, цвета
//                                     (сайт без нашего кода — чистая вёрстка Тильды)
//   export/shots/<ширина>-tilda.png — скриншот всей страницы без нашего кода
//   export/shots/<ширина>-live.png  — скриншот как на сайте сейчас
//   export/images/…                 — оригиналы всех картинок с tildacdn
//   export/images.json              — откуда взялась каждая картинка и где она на странице
import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const URL = process.env.SITE_URL || 'https://umastudio.tilda.ws/';
const OUT = process.env.OUT || 'export';
const WIDTHS = [360, 390, 768, 1024, 1280, 1440, 1920];
const OUR_CODE = /(raw\.githubusercontent\.com|jsdelivr\.net|api\.github\.com)\/.*uma_studio|api\.github\.com\/repos\/UlyanaNechipor/;

await fs.mkdir(path.join(OUT, 'layout'), { recursive: true });
await fs.mkdir(path.join(OUT, 'shots'), { recursive: true });
await fs.mkdir(path.join(OUT, 'images'), { recursive: true });

const browser = await chromium.launch();

// ---------- 1. исходный HTML ----------
const html = await (await fetch(URL)).text();
await fs.writeFile(path.join(OUT, 'page.html'), html);

async function openPage(width, withOurCode) {
  const ctx = await browser.newContext({
    viewport: { width, height: 900 },
    deviceScaleFactor: 1,
    isMobile: width < 768,
    hasTouch: width < 768,
  });
  const page = await ctx.newPage();
  if (!withOurCode) await page.route(OUR_CODE, r => r.abort());
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 90000 }).catch(() => {});
  // прелоадер без нашего кода уходит по таймеру — ждём, плюс прокрутка до низа, чтобы догрузились картинки
  await page.waitForTimeout(withOurCode ? 9000 : 22000);
  await page.evaluate(async () => {
    document.documentElement.style.overflow = 'visible';
    document.body.style.overflow = 'visible';
    for (let y = 0; y < document.body.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 120)); }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(2500);
  return { ctx, page };
}

// ---------- 2. элементы и настройки Тильды (один раз, на 1440 без нашего кода) ----------
{
  const { ctx, page } = await openPage(1440, false);
  const data = await page.evaluate(() => {
    const clean = h => h.replace(/\s+/g, ' ').trim();
    const recs = [...document.querySelectorAll('#allrecords > .t-rec, .t-records > .t-rec')].map(rec => {
      const ab = rec.querySelector('.t396__artboard');
      const abFields = {};
      if (ab) for (const a of ab.attributes) if (a.name.startsWith('data-artboard')) abFields[a.name] = a.value;
      const elems = [...rec.querySelectorAll('.t396__elem')].map(el => {
        const fields = {};
        for (const a of el.attributes) if (a.name.startsWith('data-field-')) fields[a.name.slice(11)] = a.value;
        const atom = el.querySelector('.tn-atom');
        const img = el.querySelector('img');
        const link = el.querySelector('a[href]') || (atom && atom.closest('a[href]'));
        const group = el.closest('.t396__group');
        return {
          id: el.getAttribute('data-elem-id'),
          type: el.getAttribute('data-elem-type'),
          classes: [...el.classList].filter(c => !/^(t396__elem|tn-elem|tn-elem__\d+)$/.test(c)),
          group: group ? [...group.classList].filter(c => /^tn-group__|^uma-|^project-/.test(c)) : null,
          text: atom && el.getAttribute('data-elem-type') === 'text' ? atom.innerText : undefined,
          html: atom && el.getAttribute('data-elem-type') === 'text' ? clean(atom.innerHTML) : undefined,
          image: img ? (img.getAttribute('data-original') || img.getAttribute('src')) : (atom && atom.getAttribute('data-original')) || undefined,
          alt: img ? img.getAttribute('alt') || '' : undefined,
          link: link ? link.getAttribute('href') : undefined,
          fields,
        };
      });
      return {
        id: rec.id,
        type: rec.getAttribute('data-record-type'),
        artboard: abFields,
        elements: elems,
        // не-Зеро блоки: их HTML целиком
        html: ab ? undefined : clean(rec.innerHTML).slice(0, 200000),
      };
    });
    return recs;
  });
  await fs.writeFile(path.join(OUT, 'elements.json'), JSON.stringify(data, null, 1));

  const meta = await page.evaluate(() => {
    const m = n => (document.querySelector(`meta[name="${n}"]`) || {}).content;
    const p = n => (document.querySelector(`meta[property="${n}"]`) || {}).content;
    return {
      title: document.title,
      description: m('description'),
      keywords: m('keywords'),
      robots: m('robots'),
      lang: document.documentElement.lang,
      canonical: (document.querySelector('link[rel=canonical]') || {}).href,
      og: { title: p('og:title'), description: p('og:description'), image: p('og:image'), url: p('og:url'), type: p('og:type') },
      icons: [...document.querySelectorAll('link[rel*=icon]')].map(l => ({ rel: l.rel, href: l.href, sizes: l.getAttribute('sizes') })),
      fonts: [...document.querySelectorAll('link[rel=stylesheet]')].map(l => l.href).filter(h => /font/i.test(h)),
      counters: [...document.scripts].map(s => (s.src || s.text.slice(0, 400))).filter(t => /mc\.yandex|ym\(|gtag|googletagmanager|metrika/i.test(t)),
      tildaPage: document.getElementById('allrecords') && document.getElementById('allrecords').dataset,
    };
  });
  await fs.writeFile(path.join(OUT, 'meta.json'), JSON.stringify(meta, null, 1));
  await ctx.close();
}

// ---------- 3. раскладка на каждой ширине + скриншоты ----------
const images = new Map();   // url -> [{width, rec, elem}]
for (const W of WIDTHS) {
  for (const mode of ['tilda', 'live']) {
    const { ctx, page } = await openPage(W, mode === 'live');
    if (mode === 'tilda') {
      const lay = await page.evaluate(() => {
        const px = v => Math.round(parseFloat(v) * 100) / 100;
        return [...document.querySelectorAll('.t-rec')].map(rec => {
          const rr = rec.getBoundingClientRect();
          const recTop = rr.top + scrollY;
          return {
            id: rec.id,
            top: px(recTop),
            height: px(rr.height),
            bg: getComputedStyle(rec).backgroundColor,
            elements: [...rec.querySelectorAll('.t396__elem')].map(el => {
              const r = el.getBoundingClientRect();
              const atom = el.querySelector('.tn-atom') || el;
              const cs = getComputedStyle(atom);
              const visible = r.width > 0 && r.height > 0 && getComputedStyle(el).display !== 'none';
              const o = {
                id: el.getAttribute('data-elem-id'),
                type: el.getAttribute('data-elem-type'),
                visible,
                x: px(r.left), y: px(r.top + scrollY - recTop), w: px(r.width), h: px(r.height),
              };
              if (visible && o.type === 'text') Object.assign(o, {
                font: cs.fontFamily, size: px(cs.fontSize), weight: cs.fontWeight, lh: cs.lineHeight,
                ls: cs.letterSpacing, color: cs.color, align: cs.textAlign, transform: cs.textTransform,
              });
              if (visible && o.type === 'shape') Object.assign(o, {
                bg: cs.backgroundColor, border: cs.borderTopWidth + ' ' + cs.borderTopStyle + ' ' + cs.borderTopColor, radius: cs.borderRadius,
              });
              if (visible && o.type === 'image') { const i = el.querySelector('img'); o.src = i && (i.getAttribute('data-original') || i.currentSrc); o.fit = i && getComputedStyle(i).objectFit; }
              return o;
            }),
          };
        });
      });
      await fs.writeFile(path.join(OUT, 'layout', W + '.json'), JSON.stringify(lay, null, 1));
      // все адреса картинок на странице
      const urls = await page.evaluate(() => {
        const out = [];
        const add = (u, where) => { if (u && /tildacdn|tildaapi/.test(u)) out.push([u, where]); };
        document.querySelectorAll('img').forEach(i => { add(i.getAttribute('data-original'), i.closest('.t-rec')?.id); add(i.getAttribute('src'), i.closest('.t-rec')?.id); });
        document.querySelectorAll('[data-original]').forEach(e => add(e.getAttribute('data-original'), e.closest('.t-rec')?.id));
        document.querySelectorAll('*').forEach(e => { const b = getComputedStyle(e).backgroundImage; const m = b && b.match(/url\("?([^")]+)"?\)/); if (m) add(m[1], e.closest('.t-rec')?.id); });
        // галерея Тильды хранит список в атрибуте
        document.querySelectorAll('[data-field-imgs-value]').forEach(e => { try { JSON.parse(e.getAttribute('data-field-imgs-value')).forEach(x => add(x.li_img, e.closest('.t-rec')?.id)); } catch (er) {} });
        return out;
      });
      for (const [u, rec] of urls) {
        // оригинал: static.tildacdn.com/<tild-id>/<имя файла>, без /-/resize/…/-/format/… преобразований
        const mm = u.match(/tildacdn\.(?:com|net)\/(tild[\w-]+)\/(?:-\/[^/]+\/[^/]+\/)*([^/?#]+)/);
        if (!mm) continue;
        let fname = mm[2];
        if (/\.(jpe?g|png|gif)\.webp$/i.test(fname)) fname = fname.replace(/\.webp$/i, '');
        const orig = 'https://static.tildacdn.com/' + mm[1] + '/' + fname;
        if (!images.has(orig)) images.set(orig, new Set());
        images.get(orig).add(rec || '?');
      }
    }
    await page.screenshot({ path: path.join(OUT, 'shots', `${W}-${mode}.png`), fullPage: true }).catch(e => console.log('shot', W, mode, e.message));
    await ctx.close();
    console.log('ok', W, mode);
  }
}

// ---------- 4. оригиналы картинок ----------
const list = [];
for (const [u, recs] of images) {
  const m = u.match(/tildacdn\.com\/(tild[\w-]+)\/(.+)$/);
  const name = m ? `${m[1]}__${decodeURIComponent(m[2]).replace(/[^\w.\-]+/g, '_')}` : u.replace(/[^\w.\-]+/g, '_').slice(-120);
  let ok = false, bytes = 0;
  try {
    const r = await fetch(u);
    if (r.ok) { const b = Buffer.from(await r.arrayBuffer()); bytes = b.length; await fs.writeFile(path.join(OUT, 'images', name), b); ok = true; }
  } catch (e) {}
  list.push({ url: u, file: ok ? 'images/' + name : null, bytes, recs: [...recs] });
}
await fs.writeFile(path.join(OUT, 'images.json'), JSON.stringify(list, null, 1));
console.log('images', list.length, 'saved', list.filter(x => x.file).length);
await browser.close();
