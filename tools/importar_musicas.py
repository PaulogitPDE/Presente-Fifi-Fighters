"""Separa e converte as músicas da trilha sonora: assets/music/*.mp4 (só áudio, AAC) + js/musicmeta.js.

Uso: python3 tools/importar_musicas.py <pasta com os arquivos originais>

Os originais são 4 arquivos: duas músicas soltas (Charlie Brown Jr.) e duas coletâneas (AC/DC e CPM 22)
com várias músicas na mesma faixa. Os cortes abaixo foram achados pelos silêncios (AC/DC) e pelas
quedas de volume e mudanças de ritmo (CPM 22, que não tem silêncio entre as músicas).
Cada música recebe um ganho para todas tocarem no mesmo volume (alvo de -16 LUFS).
"""
import os, re, sys, json, glob, subprocess

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'assets', 'music')
src = sys.argv[1]
os.makedirs(OUT, exist_ok=True)

def find(pattern):
    hits = glob.glob(os.path.join(src, '*' + pattern + '*'))
    if not hits: sys.exit('não achei o arquivo com "' + pattern + '" em ' + src)
    return hits[0]

ACDC = [(16.5, 307.5), (309.7, 562.4), (565.1, 752.9), (755.4, 962.7), (964.6, 1176.9), (1181.3, 1396.5),
        (1399.1, 1647.2), (1652.4, 1974.3), (1978.2, 2144.6), (2149.6, 2408.3), (2410.5, 2619.4), (2621.3, 2793.2),
        (2795.2, 3105.9), (3108.0, 3376.0), (3378.9, 3580.1), (3583.3, 3926.8), (3926.9, 4151.2), (4153.8, 4395.9)]
CPM = [(0, 195.3), (195.3, 440.5), (440.5, 654.2), (654.2, 972.4)]

# (arquivo de saída, artista, título, original, início, fim, copiar o áudio sem recodificar?)
jobs = []
for i, (a, b) in enumerate(ACDC, 1):
    jobs.append(('acdc%02d' % i, 'AC/DC', '', find('AC_DC'), a, b, True))
for i, (a, b) in enumerate(CPM, 1):
    jobs.append(('cpm%02d' % i, 'CPM 22', '', find('CPM_22'), a, b, False))
jobs.append(('cbjr_quente', 'CHARLIE BROWN JR.', 'QUENTE', find('Quente'), 0, None, True))
jobs.append(('cbjr_tudo_que_ela_gosta', 'CHARLIE BROWN JR.', 'TUDO QUE ELA GOSTA DE ESCUTAR', find('Tudo_Que_Ela'), 0, None, True))

def loudness(path):
    r = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', path, '-af', 'ebur128', '-f', 'null', '-'], capture_output=True, text=True)
    m = re.findall(r'I:\s+(-?[\d.]+) LUFS', r.stderr)
    return float(m[-1]) if m else -16.0

def duration(path):
    r = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', path], capture_output=True, text=True)
    return float(r.stdout.strip())

tracks = []
for name, artist, title, path, a, b, copy in jobs:
    out = os.path.join(OUT, name + '.mp4')
    cmd = ['ffmpeg', '-v', 'error', '-y', '-ss', str(a)] + (['-to', str(b)] if b else []) + ['-i', path, '-vn', '-map_metadata', '-1']
    cmd += (['-c:a', 'copy'] if copy else ['-c:a', 'aac', '-b:a', '128k']) + ['-movflags', '+faststart', out]
    # com -ss antes do -i, o -to conta a partir do corte: converte para duração
    if b: cmd[cmd.index('-to')] = '-t'; cmd[cmd.index('-t') + 1] = str(round(b - a, 2))
    subprocess.run(cmd, check=True)
    lufs = loudness(out)
    gain = round(min(1.8, max(0.4, 10 ** ((-16 - lufs) / 20))), 2)
    tracks.append({'id': name, 'file': name + '.mp4', 'artist': artist, 'title': title, 'dur': round(duration(out), 1), 'gain': gain})
    print(f'{name:28s} {tracks[-1]["dur"]:6.1f}s  {lufs:6.1f} LUFS  ganho {gain}')

open(os.path.join(ROOT, 'js', 'musicmeta.js'), 'w', encoding='utf-8').write(
    '// gerado por tools/importar_musicas.py\nwindow.MUSIC_META = ' + json.dumps(tracks, indent=1, ensure_ascii=False) + ';\n')
print(len(tracks), 'músicas')
