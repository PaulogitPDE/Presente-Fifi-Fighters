"""Junta os efeitos (tools/fx_src/*.png) numa folha só: assets/fx/atlas.png + js/fxmeta.js.

Uso: python3 tools/empacotar_fx.py

Uma imagem só carrega mais rápido que dezenas de arquivos pequenos. O jogo desenha cada efeito
recortando a folha nas coordenadas de js/fxmeta.js (x, y, w, h).
"""
import os, json
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'tools', 'fx_src')
OUT = os.path.join(ROOT, 'assets', 'fx')
os.makedirs(OUT, exist_ok=True)

ims = {os.path.splitext(f)[0]: Image.open(os.path.join(SRC, f)).convert('RGBA') for f in sorted(os.listdir(SRC)) if f.endswith('.png')}
# prateleiras: do mais alto para o mais baixo, 2 px de folga entre os efeitos
W, PAD = 256, 2
x = y = shelf = 0
meta = {}
for n in sorted(ims, key=lambda k: (-ims[k].height, k)):
    w, h = ims[n].size
    if x + w > W: x, y, shelf = 0, y + shelf + PAD, 0
    meta[n] = {'x': x, 'y': y, 'w': w, 'h': h}
    x += w + PAD; shelf = max(shelf, h)
atlas = Image.new('RGBA', (W, y + shelf), (0, 0, 0, 0))
for n, m in meta.items(): atlas.paste(ims[n], (m['x'], m['y']))
atlas.save(os.path.join(OUT, 'atlas.png'), optimize=True)
open(os.path.join(ROOT, 'js', 'fxmeta.js'), 'w', encoding='utf-8').write('window.FX_META = ' + json.dumps(meta, separators=(',', ':')) + ';\n')
print(f'{len(meta)} efeitos -> atlas {W}x{y + shelf}')
