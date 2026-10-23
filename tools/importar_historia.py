"""Importa as imagens do Modo História.

Uso: python3 tools/importar_historia.py <pasta com os PNGs>

- reduz cada imagem para 1280x720 (JPG, qualidade 86) em assets/story/
- reconhece variações (..._A, ..._B / H07A_..., -a, (1) etc.) e monta js/storymeta.js
- avisa quais frames do roteiro (js/story.js) ainda estão faltando
"""
import os, re, sys, json
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'assets', 'story')
src = sys.argv[1]
os.makedirs(OUT, exist_ok=True)

story = open(os.path.join(ROOT, 'js', 'story.js'), encoding='utf-8').read()
wanted = sorted(set(re.findall(r"'(H\d{2,3}_[a-z0-9_]+)'", story)), key=lambda c: int(re.match(r'H(\d+)', c).group(1)))
by_num = {re.match(r'H(\d+)', c).group(1).lstrip('0'): c for c in wanted}

meta, extras = {}, []
for fn in sorted(os.listdir(src)):
    if not fn.lower().endswith(('.png', '.jpg', '.jpeg', '.webp')):
        continue
    base = os.path.splitext(fn)[0]
    m = re.match(r'(?i)H0*(\d+)([A-Z])?[_\- ]', base + '_')
    if not m:
        extras.append(fn); continue
    code = by_num.get(m.group(1))
    if not code:
        extras.append(fn); continue
    var = m.group(2) or ''
    mv = re.search(r'(?i)[_\- ]\(?([A-C])\)?$', base)  # ..._A, ...-b, ... (C)
    if mv: var = mv.group(1)
    out = code + (('_' + var.upper()) if var else '') + '.jpg'
    im = Image.open(os.path.join(src, fn)).convert('RGB')
    k = max(1280 / im.width, 720 / im.height)
    im = im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS)
    l, t = (im.width - 1280) // 2, (im.height - 720) // 2
    im.crop((l, t, l + 1280, t + 720)).save(os.path.join(OUT, out), quality=86, optimize=True, progressive=True)
    meta.setdefault(code, []).append(out)

meta = {c: (sorted(v) if len(v) > 1 else v[0]) for c, v in meta.items()}
open(os.path.join(ROOT, 'js', 'storymeta.js'), 'w', encoding='utf-8').write('window.STORY_META = ' + json.dumps(meta, indent=1, ensure_ascii=False) + ';\n')
missing = [c for c in wanted if c not in meta]
print(f'{len(meta)} frames importados, {sum(len(v) if isinstance(v, list) else 1 for v in meta.values())} arquivos')
print('faltando:', ', '.join(missing) or 'nenhum')
print('extras (não usados no roteiro):', ', '.join(extras) or 'nenhum')
