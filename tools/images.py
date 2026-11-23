#!/usr/bin/env python3
"""Картинки для контента: размеры, прозрачность и лёгкие версии.

Запускается перед сборкой (локально и на GitHub). Ищет во всех файлах контента пути к картинкам
(content/*.json, projects/*.json) и для каждой:
  • если это загруженный исходник (img/uploads/фото.jpg и т. п.) — делает рядом лёгкие версии
    фото-1200.webp, фото-2400.webp, фото-3600.webp (не шире исходника); у картинок с прозрачным фоном
    обрезает пустые поля сверху и снизу (правило дизайн-системы: прозрачные картинки — без пустоты по вертикали);
  • записывает в img/meta.json ширину, высоту и есть ли прозрачность — сборка берёт пропорции отсюда,
    поэтому место под картинку резервируется заранее и вёрстка не прыгает.
Готовые версии (…-1200.webp) повторно не пересчитываются: обрабатывается только новое.
Запуск: python3 tools/images.py   (нужен Pillow)
"""
import json, os, re, glob
from PIL import Image

ROOT = os.path.normpath(os.path.join(os.path.dirname(__file__), '..'))
META = os.path.join(ROOT, 'img/meta.json')
WIDTHS = (1200, 2400, 3600)
VARIANT = re.compile(r'^(.*)-(\d+)\.webp$')
IMG_EXT = ('.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif', '.tif', '.tiff')


def paths_in(o, out):
    if isinstance(o, dict):
        for v in o.values(): paths_in(v, out)
    elif isinstance(o, list):
        for v in o: paths_in(v, out)
    elif isinstance(o, str):
        s = o.lstrip('/')
        if s.startswith('img/') and s.lower().endswith(IMG_EXT): out.add(s)


def has_alpha(im):
    if im.mode in ('RGBA', 'LA') or (im.mode == 'P' and 'transparency' in im.info):
        a = im.convert('RGBA').getchannel('A')
        return a.getextrema()[0] < 250
    return False


def process_upload(rel):
    """Исходник → лёгкие версии рядом. Возвращает путь к самой большой версии."""
    src = os.path.join(ROOT, rel)
    stem = os.path.splitext(rel)[0]
    done = sorted(glob.glob(os.path.join(ROOT, stem + '-[0-9]*.webp')))
    if done and all(os.path.getmtime(d) >= os.path.getmtime(src) for d in done):
        return
    im = Image.open(src); im.load()
    im = im.convert('RGBA') if has_alpha(im) else im.convert('RGB')
    if im.mode == 'RGBA':                       # прозрачные поля сверху и снизу — прочь
        bb = im.getchannel('A').point(lambda v: 255 if v > 8 else 0).getbbox()
        if bb: im = im.crop((0, bb[1], im.size[0], bb[3]))
    w, h = im.size
    for x in sorted({x for x in WIDTHS if x < w} | {min(w, WIDTHS[-1])}):
        r = im if x == w else im.resize((x, round(h * x / w)), Image.LANCZOS)
        r.save(os.path.join(ROOT, f'{stem}-{x}.webp'), 'WEBP', quality=84, method=6)
    print('  новые версии:', rel)


def main():
    used = set()
    for f in glob.glob(os.path.join(ROOT, 'content/*.json')) + glob.glob(os.path.join(ROOT, 'projects/*.json')):
        paths_in(json.load(open(f, encoding='utf8')), used)
    meta = {}
    for rel in sorted(used):
        full = os.path.join(ROOT, rel)
        if not os.path.exists(full):
            print('  нет файла:', rel); continue
        m = VARIANT.match(rel)
        if m:                                   # уже лёгкая версия: размер — по самой большой из семейства
            fam = [f for f in glob.glob(os.path.join(ROOT, m.group(1) + '-[0-9]*.webp')) if VARIANT.match(f)]
            big = max(fam, key=lambda f: int(VARIANT.match(f).group(2)))
        elif rel.startswith('img/uploads/'):    # загруженный через админку исходник
            process_upload(rel)
            fam = glob.glob(os.path.join(ROOT, os.path.splitext(rel)[0] + '-[0-9]*.webp'))
            big = max(fam, key=lambda f: int(VARIANT.match(f).group(2))) if fam else full
        else:                                   # прочие картинки сайта — как есть
            big = full
        im = Image.open(big)
        meta[rel] = {'w': im.size[0], 'h': im.size[1], 'alpha': has_alpha(im)}
    old = open(META, encoding='utf8').read() if os.path.exists(META) else ''
    new = json.dumps(meta, ensure_ascii=False, indent=1, sort_keys=True) + '\n'
    if new != old:
        open(META, 'w', encoding='utf8').write(new)
        print('img/meta.json обновлён:', len(meta), 'картинок')


if __name__ == '__main__':
    main()
