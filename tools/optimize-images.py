#!/usr/bin/env python3
"""Лёгкие версии больших картинок из Тильды (site/assets/tilda) → img/opt/<имя>-<ширина>.webp.
Запуск: python3 tools/optimize-images.py   (нужен Pillow). Сборка сайта сама подставляет srcset.
Исходники остаются на месте и в dist не попадают."""
import os, sys
from PIL import Image
SRC = os.path.join(os.path.dirname(__file__), '..', 'site/assets/tilda')
OUT = os.path.join(os.path.dirname(__file__), '..', 'img/opt')
WIDTHS = [480, 960, 1440, 1920, 2400]
os.makedirs(OUT, exist_ok=True)
USED = open(os.path.join(os.path.dirname(__file__), '..', 'content/home.json'), encoding='utf8').read()   # только то, что есть на сайте
tot_in = tot_out = 0
for f in sorted(os.listdir(SRC)):
    stem, ext = os.path.splitext(f)
    if stem not in USED: continue
    if ext.lower() not in ('.jpg', '.jpeg', '.png'): continue
    im = Image.open(os.path.join(SRC, f)); im.load()
    if im.mode not in ('RGB', 'RGBA'): im = im.convert('RGB')
    w, h = im.size; tot_in += os.path.getsize(os.path.join(SRC, f))
    ws = [x for x in WIDTHS if x < w] + [w if w <= 2400 else 2400]
    for x in sorted(set(ws)):
        o = os.path.join(OUT, f'{stem}-{x}.webp')
        r = im if x == w else im.resize((x, round(h * x / w)), Image.LANCZOS)
        r.save(o, 'WEBP', quality=80, method=6)
        tot_out += os.path.getsize(o)
        print(f'{stem[:34]:34} {x:5}w {os.path.getsize(o)//1024:5} КБ')
print(f'исходники {tot_in//1024} КБ → все варианты {tot_out//1024} КБ')
