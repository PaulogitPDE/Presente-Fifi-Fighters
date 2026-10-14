// Cenários em pixel art desenhados proceduralmente.
(function () {
  const SW = 576, H = 216, GROUND = 196;
  const R = (c, x, y, w, h, col) => { c.fillStyle = col; c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
  function grad(c, y0, y1, cols) { // gradiente em faixas (pixelado)
    const n = cols.length, h = (y1 - y0) / n;
    cols.forEach((col, i) => R(c, 0, y0 + i * h, SW, Math.ceil(h) + 1, col));
  }
  function dither(c, x, y, w, h, col, step) {
    c.fillStyle = col; step = step || 2;
    for (let j = 0; j < h; j++) for (let i = (j % 2); i < w; i += step) c.fillRect(x + i, y + j, 1, 1);
  }
  function rng(seed) { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; }
  function tree(c, x, y, s, cols) {
    R(c, x - 2 * s, y - 14 * s, 4 * s, 14 * s, '#5a3a22');
    const r = rng(x * 7 + 3);
    for (let i = 0; i < 14; i++) {
      const dx = (r() - 0.5) * 22 * s, dy = -14 * s - r() * 20 * s, rr = (5 + r() * 6) * s;
      R(c, x + dx - rr, y + dy - rr * 0.8, rr * 2, rr * 1.6, cols[i % cols.length]);
    }
  }
  function txt(c, s, x, y, col, sc, sh) { Font.text(c, s, x, y, col, { scale: sc || 1, align: 'center', shadow: sh }); }
  function floorTiles(c, a, b, size) {
    for (let y = GROUND; y < H; y += size / 2) for (let x = 0; x < SW; x += size) {
      R(c, x + ((y / (size / 2)) % 2 ? size / 2 : 0), y, size / 2, size / 2, a);
      R(c, x + ((y / (size / 2)) % 2 ? 0 : size / 2), y, size / 2, size / 2, b);
    }
  }

  // ---- utilitários de pixel art ----
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  function hx(h) { h = h.replace('#', ''); return [parseInt(h.substr(0, 2), 16), parseInt(h.substr(2, 2), 16), parseInt(h.substr(4, 2), 16)]; }
  function rgb(c) { return 'rgb(' + c.map(Math.round).join(',') + ')'; }
  function lerpC(a, b, t) { a = hx(a); b = hx(b); return rgb([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]); }
  // gradiente vertical com pontilhado ordenado entre várias cores
  function vgrad(c, x, y, w, h, cols) {
    const n = cols.length - 1;
    for (let j = 0; j < h; j++) {
      const t = j / Math.max(1, h - 1) * n, k = Math.min(n - 1, Math.floor(t)), f = t - k;
      for (let i = 0; i < w; i++) {
        const th = (BAYER[((y + j) % 4) * 4 + ((x + i) % 4)] + 0.5) / 16;
        c.fillStyle = f > th ? cols[k + 1] : cols[k];
        c.fillRect(x + i, y + j, 1, 1);
      }
    }
  }
  function hgradRow(c, x, y, w, h, cols) { // gradiente horizontal pontilhado
    const n = cols.length - 1;
    for (let i = 0; i < w; i++) {
      const t = i / Math.max(1, w - 1) * n, k = Math.min(n - 1, Math.floor(t)), f = t - k;
      for (let j = 0; j < h; j++) {
        const th = (BAYER[((y + j) % 4) * 4 + ((x + i) % 4)] + 0.5) / 16;
        c.fillStyle = f > th ? cols[k + 1] : cols[k]; c.fillRect(x + i, y + j, 1, 1);
      }
    }
  }
  function cloud(c, x, y, s, cols) {
    const r = rng(x * 13 + y);
    for (let i = 0; i < 9; i++) {
      const dx = (r() - 0.5) * 40 * s, dy = (r() - 0.6) * 10 * s, rr = (6 + r() * 7) * s;
      disc(c, x + dx, y + dy, rr, cols[2]);
    }
    for (let i = 0; i < 9; i++) {
      const dx = (r() - 0.5) * 36 * s, dy = (r() - 0.8) * 10 * s, rr = (5 + r() * 6) * s;
      disc(c, x + dx - 1, y + dy - 2, rr, cols[1]);
    }
    for (let i = 0; i < 6; i++) { const dx = (r() - 0.6) * 26 * s, dy = (r() - 1) * 8 * s, rr = (3 + r() * 4) * s; disc(c, x + dx - 2, y + dy - 4, rr, cols[0]); }
  }
  function disc(c, cx, cy, r, col) {
    c.fillStyle = col;
    for (let y = Math.floor(cy - r); y <= cy + r; y++) { const w = Math.sqrt(Math.max(0, r * r - (y + 0.5 - cy) ** 2)); c.fillRect(Math.round(cx - w), y, Math.round(w * 2), 1); }
  }
  // folhagem: muitas bolinhas sombreadas
  function foliage(c, cx, cy, rx, ry, cols, seed, n) {
    const r = rng(seed || 7);
    n = n || Math.floor(rx * ry / 6);
    for (let i = 0; i < n; i++) {
      const a = r() * Math.PI * 2, d = Math.sqrt(r());
      const x = cx + Math.cos(a) * rx * d, y = cy + Math.sin(a) * ry * d;
      const light = (cx - x) / rx * 0.5 + (cy - y) / ry * 0.6 + (r() - 0.5) * 0.6;
      const k = light > 0.5 ? 0 : light > 0.05 ? 1 : light > -0.4 ? 2 : 3;
      disc(c, x, y, 2 + r() * 3, cols[k]);
    }
  }
  function cylinderV(c, x, y, w, h, cols) { // coluna/torre cilíndrica
    for (let i = 0; i < w; i++) {
      const s = (i + 0.5) / w * 2 - 1, b = 0.55 - s * 0.55 + Math.sqrt(1 - s * s) * 0.4;
      const k = b > 0.85 ? 0 : b > 0.55 ? 1 : b > 0.3 ? 2 : 3;
      c.fillStyle = cols[k]; c.fillRect(x + i, y, 1, h);
    }
  }
  function concrete(c, x, y, w, h, cols, seed) { // bloco de concreto com manchas
    R(c, x, y, w, h, cols[1]);
    const r = rng(seed || 3);
    for (let i = 0; i < w * h / 18; i++) { c.fillStyle = r() > 0.5 ? cols[2] : cols[0]; c.fillRect(x + (r() * w | 0), y + (r() * h | 0), 1 + (r() * 2 | 0), 1); }
    for (let i = 0; i < w / 6; i++) { const sx = x + (r() * w | 0); c.fillStyle = cols[2]; c.fillRect(sx, y + h - (r() * h * 0.6 | 0), 1, (r() * h * 0.5 | 0)); } // escorridos
    R(c, x, y, w, 1, cols[0]); R(c, x, y + h - 1, w, 1, cols[3]);
  }
  function palm(c, x, y, h, cols) {
    for (let i = 0; i < h; i++) { const bx = x + Math.sin(i / h * 2) * 3; R(c, bx, y - i, 3, 1, i % 3 ? '#8a7258' : '#6a5440'); R(c, bx + 2, y - i, 1, 1, '#4a3a2a'); }
    const tx = x + Math.sin(2) * 3 + 1, ty = y - h;
    for (let k = 0; k < 9; k++) {
      const a = -Math.PI / 2 + (k - 4) * 0.42, len = 16 + (k % 3) * 3;
      for (let j = 0; j < len; j++) {
        const t = j / len, px = tx + Math.cos(a) * j, py = ty + Math.sin(a) * j + t * t * 10;
        c.fillStyle = cols[(k + (j > len * 0.6 ? 1 : 0)) % 3 === 0 ? 0 : (j > len * 0.6 ? 2 : 1)];
        c.fillRect(Math.round(px), Math.round(py), 2, 1);
        if (j % 2 === 0) { c.fillStyle = cols[2]; c.fillRect(Math.round(px), Math.round(py) + 1, 1, 2); }
      }
    }
  }
  const hashS = (x, y) => { let h = (x * 374761393 + y * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967295; };

  const STAGES = [
    {
      id: 'subway', name: 'SUBWAY', sub: 'Sanduiche de 30cm de porrada', music: 'subway',
      draw(c) {
        vgrad(c, 0, 0, SW, 70, ['#7cb4e8', '#9ccaf0', '#c4e0f4']);
        cloud(c, 90, 22, 1, ['#ffffff', '#eef4fb', '#c8d8ea']); cloud(c, 470, 16, 0.8, ['#ffffff', '#eef4fb', '#c8d8ea']);
        // árvores grandes atrás do prédio
        const G4 = ['#5fa04a', '#3f8a3a', '#2c6a2e', '#1c4a22'];
        for (let x = -20; x < SW + 40; x += 46) foliage(c, x, 52 + Math.sin(x) * 6, 34, 26, G4, x + 11, 70);
        // telhado e fachada de siding bege
        R(c, 0, 46, SW, 6, '#6a6458'); R(c, 0, 46, SW, 1, '#8a8478'); R(c, 0, 52, SW, 2, '#3a362e');
        vgrad(c, 0, 54, SW, 110, ['#e4dcc4', '#d8cfb4', '#c8bea2']);
        for (let x = 0; x < SW; x += 4) { R(c, x, 54, 1, 110, '#b8ae92'); R(c, x + 1, 54, 1, 110, '#ece6d2'); }
        R(c, 0, 54, SW, 3, '#a89e84');
        // luminárias
        [214, 362].forEach(x => { R(c, x, 58, 2, 6, '#3a3a3a'); R(c, x - 4, 56, 10, 2, '#4a4a4a'); R(c, x - 3, 58, 8, 2, '#2a2a2a'); });
        // logo SUBWAY
        R(c, 216, 62, 144, 30, '#0d4a22'); R(c, 218, 64, 140, 26, '#126030'); R(c, 218, 64, 140, 2, '#2a8a4a');
        Font.text(c, 'SUB', 228, 69, '#ffffff', { scale: 3, outline: '#0a3a1a' });
        Font.text(c, 'WAY', 282, 69, '#ffd21f', { scale: 3, outline: '#0a3a1a' });
        R(c, 224, 86, 18, 2, '#ffffff'); R(c, 336, 66, 2, 6, '#ffd21f'); // setinhas do logo
        // vitrines
        for (let i = 0; i < 6; i++) {
          const x = 150 + i * 46; if (i === 2) continue;
          R(c, x, 102, 40, 62, '#2a2a2e'); vgrad(c, x + 2, 104, 36, 58, ['#4a5a70', '#2a3448', '#1a2030']);
          for (let k = 0; k < 4; k++) R(c, x + 6 + k * 3 + (i * 5) % 8, 106 + k * 2, 2, 50 - k * 6, 'rgba(255,255,255,0.13)');
          R(c, x, 132, 40, 2, '#2a2a2e');
        }
        // porta com placa OPEN
        R(c, 242, 98, 42, 66, '#1e1e22'); vgrad(c, 245, 101, 36, 63, ['#5a6a80', '#30384a', '#202430']);
        R(c, 262, 101, 2, 63, '#1e1e22'); R(c, 276, 128, 2, 8, '#c8c8c8');
        R(c, 248, 110, 12, 8, '#101010'); Font.text(c, 'OPEN', 248, 111, '#ff3a3a', {}); R(c, 248, 119, 12, 1, '#2a6aff');
        R(c, 266, 112, 12, 16, '#e8d080'); R(c, 268, 114, 8, 4, '#c03020'); R(c, 268, 120, 8, 6, '#6a9a3a');
        // árvore de folhas roxas à esquerda
        R(c, 54, 110, 6, 80, '#4a3020'); R(c, 56, 110, 2, 80, '#6a4630');
        foliage(c, 58, 74, 58, 46, ['#9a4a5a', '#7a2a3e', '#5a1a2e', '#3a0e1e'], 5, 220);
        // pinheiros (tuias)
        [[404, 70, 54], [442, 60, 66], [130, 92, 40]].forEach(([x, y, h]) => {
          for (let j = 0; j < h + 40; j++) {
            const w = Math.min(14, 2 + j * 0.24) * (1 - Math.max(0, j - h) / 60);
            for (let i = -w; i <= w; i++) { const k = i < -w * 0.3 ? 2 : i > w * 0.5 ? 0 : 1; c.fillStyle = (hashS(x + i, y + j) > 0.8) ? G4[k + 1] : G4[k]; c.fillRect(Math.round(x + i), y + j, 1, 1); }
          }
        });
        // guarda-sóis vermelhos e mesas
        [[492, 104], [556, 98]].forEach(([x, y]) => {
          R(c, x, y, 2, 82, '#d8d8d8');
          for (let j = 0; j < 16; j++) { const w = 6 + j * 2.4; R(c, x + 1 - w, y - 6 + j, w * 2, 1, j > 12 ? '#9a1018' : (j < 4 ? '#ff4a4a' : '#e0202a')); }
          for (let k = -3; k <= 3; k++) R(c, x + 1 + k * 7, y + 10, 1, 4, '#9a1018');
          R(c, x - 16, 160, 34, 3, '#3a3a3a'); R(c, x - 14, 163, 2, 16, '#2a2a2a'); R(c, x + 14, 163, 2, 16, '#2a2a2a');
        });
        // canteiros: arbustos e flores
        R(c, 0, 168, SW, 14, '#7a4a32');
        for (let x = -10; x < SW + 10; x += 30) foliage(c, x, 160, 18, 13, G4, x * 3 + 1, 34);
        for (let i = 0; i < 40; i++) { const x = (i * 37) % 140, y = 166 + (i * 13) % 10; R(c, x, y, 2, 2, i % 3 ? '#ff6aa0' : '#ffd0e0'); }
        // calçada
        vgrad(c, 0, 182, SW, 34, ['#b8b4ac', '#a8a49c', '#98948c']);
        for (let x = 0; x < SW; x += 48) R(c, x, 182, 1, 34, '#86827a');
        R(c, 0, 182, SW, 2, '#d8d4cc'); R(c, 0, GROUND + 6, SW, 1, '#8e8a82');
        const r = rng(9); for (let i = 0; i < 300; i++) R(c, r() * SW, 184 + r() * 32, 1, 1, r() > 0.5 ? '#c8c4bc' : '#8a867e');
      },
      anim(c, t) {
        // placa OPEN piscando, guarda-sol balançando ao vento
        if ((t >> 5) % 4 === 0) R(c, 248, 110, 24, 8, 'rgba(255,60,60,0.25)');
        for (let i = 0; i < 4; i++) { const x = (t * 0.7 + i * 150) % (SW + 20) - 10, y = 30 + Math.sin(t / 9 + i) * 5 + i * 6; R(c, x, y, 2, 1, '#333'); R(c, x + 2, y + ((t >> 3) % 2), 2, 1, '#333'); R(c, x + 4, y, 2, 1, '#333'); }
      },
      spectators: [{ x: 120, y: 184, s: 0.7 }, { x: 470, y: 184, s: 0.7 }]
    },
    {
      id: 'parque', name: 'PARQUE DAS AGUAS', sub: 'Sorocaba - fim de tarde', music: 'parque',
      draw(c) {
        vgrad(c, 0, 0, SW, 112, ['#3a5ab0', '#6a7ac8', '#c88ab0', '#f0a880', '#f8d090']);
        disc(c, 430, 86, 16, '#fff0b0'); disc(c, 430, 86, 12, '#fffadc');
        cloud(c, 120, 40, 1.2, ['#ffd8c0', '#e8a8b0', '#a87aa8']); cloud(c, 330, 30, 0.9, ['#ffd8c0', '#e8a8b0', '#a87aa8']); cloud(c, 520, 50, 1, ['#ffd8c0', '#e8a8b0', '#a87aa8']);
        // linha de árvores ao longe
        for (let x = -10; x < SW + 20; x += 22) foliage(c, x, 104, 16, 10, ['#6a7a5a', '#4a6a4a', '#3a5a40', '#2a4a34'], x + 3, 26);
        // lago com reflexo do pôr do sol
        vgrad(c, 0, 112, SW, 50, ['#e0a080', '#8a8ab0', '#4a6aa0', '#2a4a80']);
        for (let y = 114; y < 162; y += 3) for (let x = (y * 11) % 30; x < SW; x += 34) R(c, x, y, 10 - (y - 112) / 8, 1, 'rgba(255,240,200,0.35)');
        for (let y = 114; y < 150; y += 2) R(c, 418 + Math.sin(y) * 4, y, 24 - (y - 114) / 2, 1, 'rgba(255,240,180,0.5)');
        // deque de madeira com guarda-corpo
        R(c, 0, 158, SW, 8, '#7a5030'); R(c, 0, 158, SW, 1, '#a07048');
        for (let x = 0; x < SW; x += 30) { R(c, x, 140, 3, 20, '#5a3820'); R(c, x + 1, 140, 1, 20, '#8a5a34'); }
        R(c, 0, 140, SW, 3, '#8a5a34'); R(c, 0, 148, SW, 2, '#6a4428');
        // gramado
        vgrad(c, 0, 166, SW, 20, ['#5a9a3a', '#4a8a32', '#3a7a2a']);
        for (let i = 0; i < 500; i++) R(c, (i * 37) % SW, 166 + (i * 13) % 20, 1, 2, i % 3 ? '#6aaa44' : '#2a6a24');
        // árvores grandes
        const G4 = ['#7ab84a', '#4a9a3a', '#2f7a30', '#1c5224'];
        [[20, 150, 1.1], [180, 156, 0.9], [560, 152, 1.2]].forEach(([x, y, s]) => {
          R(c, x - 3, y - 50 * s, 7, 52 * s, '#5a3a22'); R(c, x - 1, y - 50 * s, 2, 52 * s, '#7a5232');
          foliage(c, x, y - 70 * s, 34 * s, 28 * s, G4, x, 110);
        });
        // postes
        [110, 470].forEach(x => { R(c, x, 120, 3, 66, '#2a2a30'); R(c, x - 5, 116, 13, 6, '#3a3a40'); R(c, x - 3, 122, 9, 3, '#fff2b0'); });
        // caminho de lajotas
        vgrad(c, 0, 186, SW, 30, ['#c8a878', '#b89868', '#a08058']);
        for (let y = 186; y < H; y += 6) for (let x = (y / 6 % 2) * 9; x < SW; x += 18) { R(c, x, y, 17, 1, '#8a6a44'); R(c, x, y, 1, 6, '#8a6a44'); R(c, x + 1, y + 1, 15, 1, '#dcc094'); }
      },
      anim(c, t) {
        for (let i = 0; i < 3; i++) {
          const x = (t * 0.2 + i * 190) % (SW + 40) - 20, y = 128 + i * 9;
          R(c, x, y, 8, 4, '#ffffff'); R(c, x, y + 3, 8, 1, '#c8c8d8'); R(c, x + 6, y - 3, 3, 3, '#ffffff'); R(c, x + 9, y - 2, 2, 1, '#f0a020');
          R(c, x - 3, y + 4, 14, 1, 'rgba(255,255,255,0.3)');
        }
        for (let i = 0; i < 5; i++) { const x = (t * 0.6 + i * 120) % SW, y = 30 + Math.sin(t / 10 + i) * 6 + i * 8; R(c, x, y, 2, 1, '#3a2a3a'); R(c, x + 2, y + ((t >> 3) % 2), 2, 1, '#3a2a3a'); R(c, x + 4, y, 2, 1, '#3a2a3a'); }
      },
      spectators: [{ x: 80, y: 186, s: 0.7 }, { x: 510, y: 186, s: 0.7 }]
    },
    {
      id: 'prefeitura', name: 'PREFEITURA DE SOROCABA', sub: 'Palacio dos Tropeiros', music: 'prefeitura',
      draw(c) {
        vgrad(c, 0, 0, SW, 130, ['#0a2a8a', '#1a46b0', '#2a62c8', '#4a86da', '#7aaee6']);
        cloud(c, 470, 52, 1.6, ['#ffffff', '#e6eef8', '#b8c8e0']); cloud(c, 540, 78, 1.2, ['#ffffff', '#e6eef8', '#b8c8e0']); cloud(c, 60, 96, 0.9, ['#f4f8ff', '#d8e4f4', '#a8bcd8']);
        const CC = ['#c8c4b8', '#a8a498', '#86827a', '#5a5852'];
        const glass = (x, y, w, h) => { vgrad(c, x, y, w, h, ['#3a4a58', '#1e2a34', '#121a22']); for (let i = x + 3; i < x + w; i += 9) R(c, i, y, 1, h, '#5a6a78'); };
        // bloco baixo comprido
        concrete(c, 40, 118, 470, 40, CC, 1); glass(48, 128, 452, 20); R(c, 40, 148, 470, 4, CC[0]);
        // pavimentos escalonados com lajes salientes
        concrete(c, 120, 96, 260, 24, CC, 2); glass(126, 102, 248, 12); R(c, 112, 96, 276, 3, CC[0]); R(c, 112, 99, 276, 1, CC[3]);
        concrete(c, 170, 74, 200, 24, CC, 3); glass(176, 80, 188, 12); R(c, 160, 74, 216, 3, CC[0]); R(c, 160, 77, 216, 1, CC[3]);
        concrete(c, 236, 56, 120, 20, CC, 4); glass(242, 62, 108, 9); R(c, 228, 56, 136, 3, CC[0]);
        // torres cilíndricas
        cylinderV(c, 70, 84, 26, 74, CC); R(c, 70, 84, 26, 2, CC[0]);
        cylinderV(c, 256, 40, 24, 118, CC); R(c, 256, 40, 24, 2, CC[0]);
        // torre alta com bloco em balanço e bandeira
        concrete(c, 402, 18, 22, 140, CC, 5); R(c, 420, 18, 4, 140, CC[2]);
        concrete(c, 376, 36, 58, 18, CC, 6); glass(380, 40, 50, 8);
        concrete(c, 360, 70, 30, 10, CC, 7);
        R(c, 412, 0, 1, 18, '#dddddd');
        // palmeiras
        const PC = ['#7ac04a', '#3f8a32', '#1f5a24'];
        [[30, 160, 40], [140, 162, 46], [200, 158, 36], [330, 162, 44], [470, 160, 40], [540, 162, 34]].forEach(([x, y, h]) => palm(c, x, y, h, PC));
        // canteiros verdes e lago
        R(c, 0, 156, SW, 6, '#4a8a3a'); dither(c, 0, 156, SW, 6, '#2f6a2a', 3);
        vgrad(c, 0, 162, SW, 22, ['#7a8a3a', '#6a7a32', '#55642a']);
        for (let y = 164; y < 184; y += 3) for (let x = (y * 7) % 20; x < SW; x += 26) R(c, x, y, 9, 1, '#9aa850');
        // reflexo do prédio na água
        for (let y = 164; y < 182; y += 2) R(c, 60 + (y % 4), y, 360, 1, 'rgba(200,200,180,0.12)');
        // passarela escura com corrimãos azuis
        vgrad(c, 0, 184, SW, 32, ['#3a3a40', '#2c2c32', '#222228']);
        for (let x = 0; x < SW; x += 3) for (let y = 186; y < H; y += 3) if (hashS(x, y) > 0.6) R(c, x, y, 1, 1, '#46464e');
        R(c, 0, 184, SW, 1, '#5a5a62');
        R(c, 0, 168, SW, 2, '#6aa8b0'); R(c, 0, 170, SW, 1, '#3a6a74'); R(c, 0, 177, SW, 1, '#5a98a0');
        for (let x = 4; x < SW; x += 24) { R(c, x, 168, 2, 17, '#5a98a0'); R(c, x + 2, 168, 1, 17, '#2a5a64'); }
      },
      anim(c, t) {
        // bandeira do Brasil tremulando
        for (let i = 0; i < 22; i++) {
          const y = 2 + Math.sin(t / 6 + i / 3) * 1.5;
          R(c, 413 + i, y, 1, 14, '#0a9a3a');
          if (i > 4 && i < 18) R(c, 413 + i, y + 7 - (7 - Math.abs(i - 11)) * 0.8, 1, (7 - Math.abs(i - 11)) * 1.6, '#ffd400');
          if (i > 7 && i < 15) R(c, 413 + i, y + 5, 1, 4, '#1b3a8f');
        }
        // brilho na água
        for (let i = 0; i < 8; i++) if (((t >> 3) + i) % 3 === 0) R(c, (i * 71 + t) % SW, 165 + (i * 5) % 16, 4, 1, '#d8e090');
      },
      spectators: [{ x: 96, y: 184, s: 0.75 }, { x: 490, y: 184, s: 0.75 }]
    },
    {
      id: 'etec', name: 'ETEC ARMANDO PANUNZIO', sub: 'Patio na hora do intervalo', music: 'etec',
      draw(c) {
        vgrad(c, 0, 0, SW, 60, ['#4a8ae0', '#6aa4ea', '#9ac4f2']);
        cloud(c, 80, 18, 0.9, ['#ffffff', '#eef4fb', '#c8d8ea']); cloud(c, 500, 24, 1, ['#ffffff', '#eef4fb', '#c8d8ea']);
        // prédio: parede creme com sombra do beiral e base de tijolinhos
        R(c, 0, 34, SW, 8, '#8a2a20'); R(c, 0, 34, SW, 2, '#b84a38'); R(c, 0, 42, SW, 3, '#3a1a14');
        vgrad(c, 0, 45, SW, 105, ['#c8b898', '#e8dcc0', '#ecdfc4', '#e0d2b4']);
        for (let y = 128; y < 172; y += 4) for (let x = (y / 4 % 2) * 6; x < SW; x += 12) { R(c, x, y, 11, 3, ['#a8503a', '#b85e44', '#984632'][(hashS(x, y) * 3) | 0]); }
        R(c, 0, 126, SW, 2, '#8a8070');
        for (let i = 0; i < 12; i++) {
          const x = 10 + i * 48;
          [56, 92].forEach(y => {
            R(c, x - 1, y - 1, 34, 26, '#7a7060'); vgrad(c, x, y, 32, 24, ['#6a90b8', '#3a5a80', '#2a4060']);
            R(c, x + 15, y, 2, 24, '#d8d0c0'); R(c, x, y + 11, 32, 2, '#d8d0c0');
            R(c, x + 3, y + 2, 3, 8, 'rgba(255,255,255,0.3)'); R(c, x - 2, y + 24, 36, 2, '#f4ecd8');
            for (let k = 0; k < 32; k += 4) R(c, x + k, y, 1, 24, 'rgba(30,30,40,0.25)'); // grade
          });
        }
        // placa
        R(c, 186, 48, 204, 30, '#0e2a5a'); R(c, 188, 50, 200, 26, '#1a4a8f'); R(c, 188, 50, 200, 2, '#3a6abf');
        Font.text(c, 'ETEC', 296, 53, '#ffffff', { scale: 1, align: 'center' });
        Font.text(c, 'ARMANDO PANUNZIO', 296, 64, '#ffd400', { scale: 1, align: 'center' });
        R(c, 194, 54, 14, 18, '#c0281c'); R(c, 197, 57, 8, 12, '#ffffff'); // logo
        // portão de entrada
        R(c, 262, 120, 52, 52, '#3a2a1a'); R(c, 264, 122, 48, 50, '#6a4a2a'); R(c, 287, 122, 2, 50, '#3a2a1a');
        for (let y = 126; y < 170; y += 6) { R(c, 266, y, 20, 1, '#5a3a20'); R(c, 290, y, 20, 1, '#5a3a20'); }
        // mural do TCC e bebedouro
        R(c, 60, 132, 70, 34, '#3a2a1a'); R(c, 62, 134, 66, 30, '#2f5a3a'); Font.text(c, 'TCC', 95, 138, '#ffffff', { align: 'center' });
        R(c, 68, 150, 20, 10, '#ffffff'); R(c, 92, 148, 14, 12, '#ffe88a'); R(c, 110, 150, 14, 10, '#ffb0c0');
        R(c, 448, 140, 20, 30, '#c8c8c8'); R(c, 448, 140, 20, 2, '#e8e8e8'); R(c, 452, 144, 12, 4, '#7ad0f0');
        // árvores em canteiros
        const G4 = ['#7ab84a', '#4a9a3a', '#2f7a30', '#1c5224'];
        [[200, 168], [380, 168], [540, 168]].forEach(([x, y]) => { R(c, x - 14, y - 4, 28, 8, '#8a8a80'); R(c, x - 2, y - 40, 5, 40, '#5a3a22'); foliage(c, x, y - 52, 22, 18, G4, x, 60); });
        // pátio (quadra)
        vgrad(c, 0, 172, SW, 24, ['#b86a40', '#c87a4a', '#b86a40']);
        R(c, 0, GROUND, SW, H - GROUND, '#3a7a5a'); dither(c, 0, GROUND, SW, H - GROUND, '#2f6a4e', 3);
        R(c, 0, GROUND, SW, 2, '#ffffff'); R(c, SW / 2 - 1, GROUND, 2, H - GROUND, '#ffffff');
        for (let a = 0; a < 60; a++) R(c, SW / 2 + Math.cos(a / 60 * Math.PI) * 34, GROUND + 2 + Math.sin(a / 60 * Math.PI) * 16, 2, 1, '#ffffff');
        [[16], [556]].forEach(([x]) => { R(c, x, 110, 4, 86, '#666'); R(c, x + 1, 110, 1, 86, '#999'); R(c, x - 10, 102, 24, 16, '#ffffff'); R(c, x - 10, 102, 24, 1, '#c0281c'); R(c, x - 2, 116, 10, 2, '#e05a1a'); for (let k = 0; k < 6; k++) R(c, x - 1 + k * 2, 118, 1, 6, '#dddddd'); });
      },
      anim(c, t) {
        const x = 500 - (t * 0.5) % 120, y = 186 - Math.abs(Math.sin(t / 10)) * 22;
        R(c, x, y, 7, 7, '#e07a2a'); R(c, x + 3, y, 1, 7, '#5a2a0a'); R(c, x, y + 3, 7, 1, '#5a2a0a'); R(c, x + 1, y + 1, 2, 2, '#f8a060');
      },
      spectators: [{ x: 60, y: 172, s: 0.68 }, { x: 140, y: 172, s: 0.68 }, { x: 500, y: 172, s: 0.68 }]
    },
    {
      id: 'cinema', name: 'CINEMA', sub: 'Sessao de Carros - fila do meio', music: 'cinema',
      draw(c) {
        R(c, 0, 0, SW, H, '#140a12');
        // paredes com painéis acústicos
        for (let x = 0; x < SW; x += 24) { vgrad(c, x, 0, 22, 150, ['#3a1424', '#2a0e1a', '#1a0810']); R(c, x + 22, 0, 2, 150, '#0a0408'); }
        // cortinas vermelhas com dobras
        for (let x = 0; x < 92; x++) { const k = (Math.sin(x / 3) + 1) / 2; c.fillStyle = k > 0.75 ? '#c02a3a' : k > 0.4 ? '#8a1424' : '#5a0a18'; c.fillRect(x, 0, 1, 140); c.fillRect(SW - 1 - x, 0, 1, 140); }
        R(c, 0, 0, SW, 10, '#5a0a18'); for (let x = 0; x < SW; x += 6) R(c, x, 10, 4, 3, '#c8a040');
        // tela
        R(c, 92, 14, 392, 114, '#050505'); R(c, 96, 18, 384, 106, '#e8e8f0');
        // feixe do projetor
        c.globalAlpha = 0.06; for (let i = 0; i < 14; i++) { c.fillStyle = '#ffffff'; c.beginPath(); c.moveTo(288, 0); c.lineTo(96 + i * 4, 124); c.lineTo(480 - i * 4, 124); c.fill(); } c.globalAlpha = 1;
        // poltronas sombreadas
        for (let row = 0; row < 3; row++) {
          const y = 128 + row * 20;
          for (let x = -14 + row * 11; x < SW; x += 24) {
            vgrad(c, x, y, 20, 18, ['#c83040', '#9a1c2c', '#6a0e1a']);
            R(c, x, y, 20, 2, '#e05060'); R(c, x - 2, y + 8, 3, 10, '#4a0a14'); R(c, x + 19, y + 8, 3, 10, '#4a0a14');
            R(c, x + 3, y + 3, 1, 12, 'rgba(255,255,255,0.12)');
          }
        }
        // corredor com luzes
        vgrad(c, 0, GROUND - 6, SW, 6, ['#2a1018', '#3a1a24']);
        R(c, 0, GROUND, SW, H - GROUND, '#3a1a26'); dither(c, 0, GROUND, SW, H - GROUND, '#2a1018', 3);
        R(c, 0, GROUND, SW, 2, '#ffcc33'); for (let x = 6; x < SW; x += 24) { R(c, x, GROUND + 5, 4, 2, '#ffe080'); R(c, x - 1, GROUND + 7, 6, 1, '#7a5a20'); }
      },
      anim(c, t) {
        R(c, 96, 18, 384, 70, '#7ac0f0'); vgrad(c, 96, 60, 384, 28, ['#7ac0f0', '#e8b070', '#c88850']);
        R(c, 96, 88, 384, 36, '#6a6a72'); for (let x = 0; x < 384; x += 30) R(c, 96 + (x - t * 3 % 30 + 30) % 384, 104, 14, 2, '#ffffff');
        const cx = 200 + Math.sin(t / 30) * 60;
        R(c, cx, 88, 54, 14, '#d8201a'); R(c, cx, 88, 54, 3, '#ff5a40'); R(c, cx + 10, 79, 28, 11, '#d8201a'); R(c, cx + 14, 81, 20, 7, '#bfe6ff'); R(c, cx + 15, 82, 5, 5, '#ffffff');
        R(c, cx + 5, 99, 12, 12, '#1a1a1a'); R(c, cx + 37, 99, 12, 12, '#1a1a1a'); R(c, cx + 9, 103, 4, 4, '#888'); R(c, cx + 41, 103, 4, 4, '#888');
        Font.text(c, '95', cx + 27, 91, '#ffd400', { align: 'center' });
        R(c, cx + 50, 90, 4, 3, '#fff6a0');
        for (let i = 0; i < 10; i++) { const x = 30 + i * 56, b = Math.sin(t / 15 + i) > 0.9 ? 1 : 0; R(c, x, 116 - b, 12, 14, '#0a0508'); R(c, x + 2, 112 - b, 8, 5, '#0a0508'); }
      },
      spectators: []
    },
    {
      id: 'casa', name: 'COPA NA CASA DA MIN', sub: 'Ninguem entra sem roupinha do Brasil', music: 'casa',
      draw(c) {
        vgrad(c, 0, 0, SW, GROUND, ['#f4f3ee', '#ecebe6', '#dedcd4']);
        for (let x = 0; x < SW; x += 2) if (x % 6 === 0) R(c, x, 0, 1, GROUND, '#e2e1dc');
        R(c, 0, 0, SW, 8, '#d8d6d0'); R(c, 0, 8, SW, 2, '#c8c6c0');
        // luz no teto
        R(c, 110, 10, 30, 4, '#fffbe0');
        // bandeirinhas
        for (let x = 0; x < SW; x += 12) { const y = 20 + Math.sin(x / 30) * 4; R(c, x, y, 8, 6, (x / 12) % 2 ? '#0a9a3a' : '#ffd400'); R(c, x + 2, y + 6, 4, 2, (x / 12) % 2 ? '#0a9a3a' : '#ffd400'); }
        // porta
        R(c, 40, 50, 50, 146, '#e8e2d4'); R(c, 44, 54, 42, 142, '#f2ede2'); R(c, 80, 120, 4, 4, '#999');
        // TV
        R(c, 230, 60, 120, 70, '#111'); R(c, 234, 64, 112, 62, '#2a8a3a');
        R(c, 240, 94, 100, 1, '#ffffff'); R(c, 288, 64, 1, 62, '#ffffff');
        R(c, 280, 130, 20, 6, '#222'); R(c, 220, 136, 140, 22, '#6a4a32'); R(c, 220, 136, 140, 3, '#8a6a4a');
        // sofá
        vgrad(c, 420, 128, 120, 40, ['#5a6a8a', '#4a5a7a', '#34405a']); vgrad(c, 420, 112, 120, 18, ['#7a8aaa', '#5a6a8a']); for (let x = 424; x < 540; x += 30) R(c, x, 128, 1, 30, '#2a3448'); R(c, 414, 124, 10, 44, '#3a4a6a'); R(c, 536, 124, 10, 44, '#3a4a6a');
        // espelho
        R(c, 140, 50, 50, 70, '#c8d8e0'); R(c, 140, 50, 50, 2, '#888'); R(c, 146, 60, 10, 30, '#e0ecf2');
        // piso
        R(c, 0, GROUND, SW, H - GROUND, '#cfc6b4');
        for (let x = 0; x < SW; x += 32) R(c, x, GROUND, 1, H - GROUND, '#b8ae9a');
        R(c, 0, GROUND, SW, 2, '#bab09c');
      },
      anim(c, t) {
        // jogo na TV: bola
        const bx = 240 + (Math.sin(t / 20) * 0.5 + 0.5) * 96, by = 70 + (Math.cos(t / 13) * 0.5 + 0.5) * 50;
        R(c, bx, by, 3, 3, '#ffffff');
        for (let i = 0; i < 6; i++) R(c, 244 + i * 16 + Math.sin(t / 12 + i) * 4, 80 + (i % 3) * 14, 3, 5, i % 2 ? '#ffd400' : '#2a3a9a');
        // Amora dormindo no sofá (cachorro branco/preto/caramelo)
        const b = Math.sin(t / 20) > 0 ? 1 : 0;
        R(c, 450, 112 - b, 26, 10, '#f4f0ea'); R(c, 456, 112 - b, 12, 6, '#2a2220'); R(c, 470, 110 - b, 10, 8, '#f4f0ea');
        R(c, 472, 108 - b, 6, 4, '#a8682a'); R(c, 478, 113 - b, 3, 2, '#2a2220'); R(c, 446, 116, 5, 2, '#a8682a');
        R(c, 470, 112 - b, 6, 2, '#0a9a3a'); // bandeirinha da Amora
        if ((t >> 5) % 3 === 0) Font.text(c, 'Z', 484, 98 - (t % 32) / 4, '#6a6a8a');
      },
      spectators: [{ x: 160, y: 196, s: 0.72 }]
    },
    {
      id: 'cozinha', name: 'NOITE DO HAMBURGUER', sub: 'Quem fez o pao? Briga na cozinha', music: 'casa',
      draw(c) {
        // azulejos brancos
        R(c, 0, 0, SW, GROUND, '#eef0ee');
        for (let y = 0; y < GROUND; y += 10) R(c, 0, y, SW, 1, '#d4d8d6');
        for (let y = 0; y < GROUND; y += 10) for (let x = (y / 10 % 2) * 7; x < SW; x += 14) R(c, x, y, 1, 10, '#d8dcda');
        // janela com cortina de renda
        R(c, 0, 20, 120, 100, '#1a1a22'); for (let i = 0; i < 8; i++) R(c, 6 + i * 14, 50, 8, 60, '#3a3020');
        for (let x = 0; x < 120; x++) for (let y = 14; y < 124; y++) {
          if (x > 46 && x < 74) continue;
          const lace = ((x + y) % 7 === 0) || ((x - y) % 9 === 0) || (y > 96 && (x % 4 === 0));
          c.fillStyle = lace ? '#d8d8dc' : (y > 96 ? '#f2f2f4' : 'rgba(250,250,252,0.86)'); c.fillRect(x, y, 1, 1);
        }
        R(c, 0, 12, 124, 3, '#888');
        // coluna de pastilhas bege
        for (let y = 0; y < 150; y += 3) for (let x = 330; x < 372; x += 3) R(c, x, y, 2, 2, ['#d8c4a0', '#c8b088', '#e4d4b4', '#bca078'][(hashS(x, y) * 4) | 0]);
        // armários brancos
        R(c, 372, 0, 204, 64, '#f8f8f8'); for (let x = 372; x < SW; x += 51) { R(c, x, 0, 1, 64, '#c8c8c8'); R(c, x + 44, 50, 2, 8, '#a0a0a0'); }
        R(c, 372, 64, 204, 3, '#d0d0d0');
        // micro-ondas e prateleira
        R(c, 380, 70, 70, 38, '#2a2a2e'); R(c, 384, 74, 44, 30, '#141418'); R(c, 434, 78, 10, 3, '#5aff7a');
        // geladeira com imãs
        R(c, 468, 78, 108, 118, '#f4f4f4'); R(c, 468, 78, 4, 118, '#d8d8d8'); R(c, 468, 120, 108, 2, '#d0d0d0'); R(c, 560, 90, 3, 26, '#bbbbbb');
        [[480, 88, '#ffd400'], [500, 84, '#d02a2a'], [526, 90, '#2a7ad0'], [488, 104, '#2aa04a']].forEach(([x, y, col]) => { R(c, x, y, 10, 12, col); R(c, x + 2, y + 2, 6, 6, '#ffffff'); });
        // fogão e bancada
        R(c, 150, 120, 180, 76, '#f0f0f0'); R(c, 150, 116, 180, 6, '#2a2a2e');
        R(c, 230, 122, 70, 74, '#e8e8ea'); R(c, 236, 140, 58, 40, '#1a1a1e'); R(c, 238, 128, 54, 4, '#b8b8b8');
        [240, 256, 272, 288].forEach(x => R(c, x, 113, 8, 3, '#111'));
        R(c, 160, 100, 22, 16, '#c06a3a'); R(c, 158, 98, 26, 3, '#8a4a2a'); // panela
        R(c, 200, 92, 10, 24, '#e8e8e0'); R(c, 212, 96, 8, 20, '#c8b040'); // garrafas
        // mesa com hambúrgueres
        R(c, 0, 150, 120, 8, '#b8e0a0'); R(c, 0, 158, 120, 38, '#8ac070');
        [[16, 146], [52, 144], [88, 146]].forEach(([x, y]) => { R(c, x - 2, y + 3, 24, 3, '#ffffff'); R(c, x, y - 6, 20, 6, '#e0a040'); R(c, x + 2, y - 7, 16, 2, '#f0c060'); R(c, x, y, 20, 3, '#5a2a14'); R(c, x + 1, y - 1, 18, 1, '#6ac040'); });
        R(c, 104, 132, 8, 16, '#f0c020'); R(c, 104, 132, 8, 2, '#ffffff'); // copo
        // piso
        R(c, 0, GROUND, SW, H - GROUND, '#e8e8e6');
        for (let x = 0; x < SW; x += 40) R(c, x, GROUND, 1, H - GROUND, '#c8c8c6');
        R(c, 0, GROUND + 9, SW, 1, '#d0d0ce'); R(c, 0, GROUND, SW, 2, '#d4d4d2');
      },
      anim(c, t) {
        // shih-tzu abanando o rabo
        const x = 196, y = 194, w = Math.sin(t / 4) * 2;
        R(c, x, y - 12, 18, 10, '#f4ece0'); R(c, x + 2, y - 6, 4, 6, '#f4ece0'); R(c, x + 12, y - 6, 4, 6, '#f4ece0');
        R(c, x + 14, y - 20, 10, 10, '#f4ece0'); R(c, x + 13, y - 18, 3, 8, '#c8a070'); R(c, x + 22, y - 18, 3, 8, '#c8a070');
        R(c, x + 18, y - 15, 2, 2, '#1a1a1a'); R(c, x + 20, y - 12, 2, 1, '#1a1a1a'); R(c, x + 6, y - 12, 6, 4, '#d8b890');
        R(c, x - 3 + w, y - 15, 4, 4, '#f4ece0');
        // vapor da panela
        for (let i = 0; i < 4; i++) { const k = (t * 0.5 + i * 10) % 40; c.globalAlpha = 1 - k / 40; R(c, 166 + Math.sin(k / 5 + i) * 3, 96 - k, 3, 2, '#ffffff'); }
        c.globalAlpha = 1;
      },
      spectators: [{ x: 300, y: 194, s: 0.7 }, { x: 430, y: 194, s: 0.7 }]
    },
    {
      id: 'rua', name: 'ROLE NOTURNO', sub: 'Volta pra casa com a panela de arroz', music: 'rua',
      draw(c) {
        grad(c, 0, 110, ['#0a0e22', '#10163a', '#18204a', '#22305a']);
        const r = rng(42);
        for (let i = 0; i < 60; i++) R(c, r() * SW, r() * 80, 1, 1, r() > 0.7 ? '#ffffcc' : '#8890c0');
        // prédios
        for (let x = 0; x < SW; x += 48) {
          const h = 50 + r() * 50; R(c, x, 140 - h, 44, h, '#1a2034');
          for (let wy = 140 - h + 6; wy < 134; wy += 10) for (let wx = x + 5; wx < x + 40; wx += 9) if (r() > 0.5) R(c, wx, wy, 4, 5, r() > 0.5 ? '#f2d27a' : '#6a7aa0');
        }
        // muro verde com grade
        R(c, 0, 140, SW, 40, '#2a6a3a');
        for (let x = 0; x < SW; x += 6) R(c, x, 96, 2, 50, '#8a9aa0');
        R(c, 0, 96, SW, 2, '#9aaab0'); R(c, 0, 120, SW, 2, '#9aaab0');
        for (let x = 0; x < SW; x += 90) tree(c, x + 30, 140, 0.9, ['#123a1a', '#1a4a24', '#22582a']);
        // poste
        [[130], [430]].forEach(([x]) => { R(c, x, 60, 3, 136, '#3a3a40'); R(c, x - 8, 58, 16, 4, '#4a4a50'); });
        // calçada
        R(c, 0, 180, SW, 16, '#5a5a62'); for (let x = 0; x < SW; x += 20) R(c, x, 180, 1, 16, '#4a4a52');
        R(c, 0, GROUND, SW, H - GROUND, '#3a3a42'); dither(c, 0, GROUND, SW, H - GROUND, '#32323a', 3);
      },
      anim(c, t) {
        [[130], [430]].forEach(([x]) => {
          const f = Math.sin(t / 3 + x) > 0.97 ? 0.4 : 1;
          c.globalAlpha = 0.18 * f; c.fillStyle = '#ffe9a0';
          for (let i = 0; i < 40; i++) c.fillRect(x - i * 0.7 + 1, 62 + i * 3.2, i * 1.4 + 2, 3.2);
          c.globalAlpha = 1; R(c, x - 6, 62, 12, 2, '#fff6c0');
        });
        // vaga-lumes
        for (let i = 0; i < 6; i++) if (((t >> 3) + i) % 4) R(c, (i * 97 + Math.sin(t / 30 + i) * 20) % SW, 120 + Math.cos(t / 25 + i) * 12, 1, 1, '#d0ff80');
      },
      spectators: [{ x: 70, y: 184, s: 0.7 }, { x: 520, y: 184, s: 0.7 }]
    }
  ];

  // Cenários desenhados (imagens em assets/stages). Se a imagem não carregar, usa o cenário procedural.
  const ART = {
    subway: { w: 452, spec: [{ x: 40, y: 160, s: 0.68 }, { x: 430, y: 160, s: 0.68 }] },
    parque: { w: 452, spec: [{ x: 26, y: 158, s: 0.66 }, { x: 430, y: 158, s: 0.66 }] },
    prefeitura: { w: 387, spec: [] },
    etec: { w: 452, spec: [{ x: 50, y: 158, s: 0.64 }, { x: 140, y: 158, s: 0.64 }, { x: 420, y: 158, s: 0.64 }] },
    cinema: { w: 452, spec: [] },
    casa: { w: 430, spec: [{ x: 30, y: 178, s: 0.7 }] },
    cozinha: { w: 452, spec: [] },
    rua: { w: 452, spec: [{ x: 24, y: 172, s: 0.68 }, { x: 432, y: 172, s: 0.68 }] }
  };
  STAGES.forEach(st => {
    const a = ART[st.id]; if (!a) return;
    st.width = a.w; st.spectatorsArt = a.spec;
    st.img = new Image(); st.img.src = 'assets/stages/' + st.id + '.png';
  });
  const hasArt = st => !!(st.img && st.img.complete && st.img.naturalWidth);

  const cache = {};
  // a decisão arte/procedural fica fixa durante a luta (Stages.use), mesmo se a imagem terminar de carregar no meio
  let locked = null;
  const art = st => locked && locked.st === st ? locked.art : hasArt(st);
  function bg(st) {
    if (art(st)) return st.img;
    if (!cache[st.id]) {
      const cv = document.createElement('canvas'); cv.width = SW; cv.height = H;
      st.draw(cv.getContext('2d'));
      cache[st.id] = cv;
    }
    return cache[st.id];
  }
  const Stages = {
    list: STAGES, bg, GROUND, WIDTH: SW,
    width: st => art(st) ? st.width : SW,
    // ativa um cenário para a luta (largura, animações e torcida)
    use(st) { locked = { st, art: hasArt(st) }; Stages.WIDTH = Stages.width(st); },
    anim(st, ctx, t) { if (!art(st)) st.anim(ctx, t); },
    spectators: st => art(st) ? st.spectatorsArt : (st.spectators || [])
  };
  window.Stages = Stages;
})();
