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

  const STAGES = [
    {
      id: 'subway', name: 'SUBWAY', sub: 'Sanduiche de 30cm de porrada', music: 'subway',
      draw(c) {
        grad(c, 0, GROUND, ['#2f6b3a', '#327040', '#367746', '#3a7e4b']);
        // faixas de parede
        R(c, 0, 120, SW, 4, '#ffd21f'); R(c, 0, 124, SW, 72, '#e9e2c8');
        for (let x = 0; x < SW; x += 12) R(c, x, 124, 1, 72, '#d5cdb0');
        // letreiro
        R(c, 188, 10, 200, 34, '#0e4d24'); R(c, 190, 12, 196, 30, '#13612d');
        txt(c, 'SUBWAY', 288, 18, '#ffd21f', 3, '#0a3318');
        // menus
        for (let i = 0; i < 4; i++) {
          const x = 40 + i * 140; R(c, x, 52, 100, 54, '#1a1a1a'); R(c, x + 2, 54, 96, 50, '#262626');
          for (let j = 0; j < 5; j++) { R(c, x + 6, 58 + j * 9, 50, 3, '#e9e2c8'); R(c, x + 74, 58 + j * 9, 18, 3, '#ffd21f'); }
          R(c, x + 60, 58, 10, 8, ['#c94a2a', '#ffd21f', '#68a83a', '#e9e2c8'][i]);
        }
        // balcão com vitrine de ingredientes
        R(c, 0, 150, SW, 46, '#5a3a22'); R(c, 0, 150, SW, 4, '#8a5a32');
        R(c, 30, 134, 516, 16, '#bfe6f0'); R(c, 30, 134, 516, 2, '#ffffff');
        const ing = ['#68a83a', '#c94a2a', '#ffd21f', '#e9e2c8', '#7a3a1a', '#f08a2a', '#2a2a2a'];
        for (let x = 36; x < 540; x += 18) R(c, x, 140, 14, 8, ing[(x / 18 | 0) % ing.length]);
        for (let x = 20; x < SW; x += 60) { R(c, x, 160, 30, 3, '#3a2414'); }
        floorTiles(c, '#c9c1a0', '#a8a080', 16);
      },
      anim(c, t) { // pão saindo do forno / luz piscando
        if ((t >> 4) % 2) R(c, 380, 30, 4, 4, '#ff3a3a');
      },
      spectators: [{ x: 120, y: 152, s: 0.8 }, { x: 460, y: 152, s: 0.8 }]
    },
    {
      id: 'parque', name: 'PARQUE DAS AGUAS', sub: 'Sorocaba - fim de tarde', music: 'parque',
      draw(c) {
        grad(c, 0, 120, ['#5fa8e8', '#72b6ee', '#88c4f0', '#a2d2f2', '#bfe0f2', '#f2d6b0']);
        // nuvens
        [[60, 30], [200, 18], [380, 36], [500, 22]].forEach(([x, y]) => { R(c, x, y, 40, 8, '#ffffff'); R(c, x + 8, y - 6, 22, 8, '#ffffff'); R(c, x + 4, y + 6, 32, 2, '#dfefff'); });
        // morros
        for (let x = 0; x < SW; x++) { const h = 20 + Math.sin(x / 40) * 10 + Math.sin(x / 13) * 3; R(c, x, 120 - h, 1, h, '#5e9a4a'); }
        // lago
        R(c, 0, 120, SW, 40, '#3f86c4');
        for (let y = 122; y < 160; y += 4) for (let x = (y % 8) * 3; x < SW; x += 24) R(c, x, y, 8, 1, '#7ab8e8');
        // margem e árvores
        R(c, 0, 156, SW, 40, '#4f8f3a');
        for (let x = 10; x < SW; x += 70) tree(c, x, 160, 1, ['#2f6b2a', '#3d7f32', '#4f9a3c', '#2a5a24']);
        // caminho
        R(c, 0, GROUND, SW, H - GROUND, '#c9a66a');
        dither(c, 0, GROUND, SW, H - GROUND, '#b08a50', 3);
        for (let x = 0; x < SW; x += 40) R(c, x, GROUND, 20, 2, '#e0c088');
        // bancos
        [[140, 182], [420, 182]].forEach(([x, y]) => { R(c, x, y, 30, 3, '#8a5a32'); R(c, x, y - 8, 30, 3, '#8a5a32'); R(c, x + 2, y, 2, 10, '#3a3a3a'); R(c, x + 26, y, 2, 10, '#3a3a3a'); });
      },
      anim(c, t) {
        // patos no lago
        for (let i = 0; i < 3; i++) {
          const x = (t * 0.2 + i * 190) % (SW + 40) - 20, y = 136 + i * 6;
          R(c, x, y, 7, 4, '#ffffff'); R(c, x + 5, y - 3, 3, 3, '#ffffff'); R(c, x + 8, y - 2, 2, 1, '#f0a020');
        }
        // pássaros
        for (let i = 0; i < 4; i++) { const x = (t * 0.6 + i * 140) % SW, y = 40 + Math.sin(t / 10 + i) * 6 + i * 8; R(c, x, y, 2, 1, '#333'); R(c, x + 2, y + ((t >> 3) % 2), 2, 1, '#333'); R(c, x + 4, y, 2, 1, '#333'); }
      },
      spectators: [{ x: 90, y: 182, s: 0.75 }, { x: 500, y: 182, s: 0.75 }]
    },
    {
      id: 'prefeitura', name: 'PREFEITURA DE SOROCABA', sub: 'Palacio dos Tropeiros', music: 'prefeitura',
      draw(c) {
        grad(c, 0, GROUND, ['#3f8fd8', '#5aa2e0', '#78b6e8', '#96c8ee', '#b4daf2']);
        // prédio moderno
        R(c, 98, 40, 380, 120, '#e8e4dc'); R(c, 98, 40, 380, 6, '#c8c0b0');
        for (let r = 0; r < 4; r++) for (let i = 0; i < 16; i++) { R(c, 110 + i * 23, 54 + r * 24, 16, 16, '#4a6f8f'); R(c, 110 + i * 23, 54 + r * 24, 16, 3, '#7a9fbf'); }
        // colunas/entrada
        R(c, 200, 120, 176, 40, '#d0c8b8');
        for (let i = 0; i < 8; i++) R(c, 206 + i * 22, 120, 8, 40, '#f4f0e8');
        txt(c, 'PREFEITURA DE SOROCABA', 288, 108, '#1a3a6a', 1);
        // bandeiras
        [[140, '#0a7a3a'], [176, '#ffffff'], [400, '#c0281c']].forEach(([x, col], i) => {
          R(c, x, 20, 2, 140, '#9a9a9a');
          R(c, x + 2, 22, 22, 14, col);
          if (i === 0) { R(c, x + 8, 25, 10, 8, '#ffd400'); R(c, x + 11, 27, 4, 4, '#1b3a8f'); }
          if (i === 1) { R(c, x + 2, 26, 22, 2, '#1a3a8a'); R(c, x + 2, 31, 22, 2, '#c0281c'); }
        });
        // praça
        R(c, 0, 160, SW, 36, '#9aa28a');
        for (let x = 0; x < SW; x += 50) { R(c, x + 10, 150, 26, 12, '#3d7f32'); R(c, x + 14, 146, 18, 6, '#4f9a3c'); }
        // chafariz
        R(c, 30, 170, 60, 10, '#b8b0a0'); R(c, 34, 166, 52, 6, '#5aa2e0');
        R(c, 0, GROUND, SW, H - GROUND, '#b8b0a0');
        for (let x = 0; x < SW; x += 24) for (let y = GROUND; y < H; y += 8) R(c, x + ((y / 8) % 2) * 12, y, 23, 7, '#a8a090');
      },
      anim(c, t) {
        for (let i = 0; i < 6; i++) { const h = (t * 1.5 + i * 7) % 18; R(c, 52 + i * 3, 164 - h, 1, 2, '#cfe8ff'); }
        // tremular das bandeiras
        [[140], [176], [400]].forEach(([x]) => R(c, x + 24, 22 + ((t >> 3) % 3), 2, 10, '#00000022'));
      },
      spectators: [{ x: 470, y: 176, s: 0.8 }]
    },
    {
      id: 'etec', name: 'ETEC ARMANDO PANUNZIO', sub: 'Patio na hora do intervalo', music: 'etec',
      draw(c) {
        grad(c, 0, 90, ['#6ab0f0', '#80bef2', '#98ccf4']);
        // prédio escolar
        R(c, 0, 40, SW, 130, '#e2d6b8'); R(c, 0, 40, SW, 8, '#c0281c'); R(c, 0, 48, SW, 2, '#8a1c14');
        for (let i = 0; i < 12; i++) {
          const x = 14 + i * 47;
          R(c, x, 62, 30, 26, '#5a7fa0'); R(c, x + 14, 62, 2, 26, '#e2d6b8'); R(c, x, 74, 30, 2, '#e2d6b8');
          R(c, x, 104, 30, 26, '#5a7fa0'); R(c, x + 14, 104, 2, 26, '#e2d6b8');
        }
        R(c, 168, 18, 240, 30, '#1a3a6a'); R(c, 170, 20, 236, 26, '#22508f');
        txt(c, 'ETEC', 288, 22, '#ffffff', 1);
        txt(c, 'ARMANDO PANUNZIO', 288, 33, '#ffd400', 1);
        // porta
        R(c, 266, 136, 44, 34, '#6a4a2a'); R(c, 287, 136, 2, 34, '#3a2a1a');
        // quadro/mural e bebedouro
        R(c, 60, 140, 60, 26, '#2f5a3a'); txt(c, 'TCC', 90, 146, '#ffffff', 1); R(c, 66, 158, 48, 1, '#cfcfcf');
        R(c, 450, 146, 18, 24, '#c8c8c8'); R(c, 452, 146, 14, 4, '#9ad0f0');
        // quadra
        R(c, 0, 170, SW, 26, '#c26a3a');
        R(c, 0, GROUND, SW, H - GROUND, '#3a7a5a'); R(c, 0, GROUND, SW, 2, '#ffffff');
        R(c, SW / 2 - 1, GROUND, 2, H - GROUND, '#ffffff');
        for (let a = 0; a < 40; a++) R(c, SW / 2 + Math.cos(a / 40 * Math.PI) * 30, GROUND + 2 + Math.sin(a / 40 * Math.PI) * 16, 2, 1, '#ffffff');
        // tabelas de basquete
        [[20], [540]].forEach(([x]) => { R(c, x, 120, 4, 76, '#666'); R(c, x - 8, 114, 20, 14, '#fff'); R(c, x - 2, 126, 8, 2, '#e05a1a'); });
      },
      anim(c, t) { // bola quicando
        const x = 500 - (t * 0.5) % 120, y = 186 - Math.abs(Math.sin(t / 10)) * 22;
        R(c, x, y, 6, 6, '#e07a2a'); R(c, x + 2, y, 1, 6, '#5a2a0a');
      },
      spectators: [{ x: 230, y: 168, s: 0.75 }, { x: 350, y: 168, s: 0.75 }, { x: 130, y: 168, s: 0.75 }]
    },
    {
      id: 'cinema', name: 'CINEMA', sub: 'Sessao de Carros - fila do meio', music: 'cinema',
      draw(c) {
        R(c, 0, 0, SW, H, '#1a0e16');
        // cortinas
        for (let x = 0; x < SW; x += 8) { R(c, x, 0, 4, 150, '#7a1424'); R(c, x + 4, 0, 4, 150, '#5a0e1a'); }
        // tela
        R(c, 96, 16, 384, 110, '#0e0e0e'); R(c, 100, 20, 376, 102, '#e8e8f0');
        // assentos
        for (let row = 0; row < 3; row++) {
          const y = 128 + row * 18;
          for (let x = -10 + row * 9; x < SW; x += 22) { R(c, x, y, 18, 16, '#8a1c28'); R(c, x, y, 18, 3, '#b0283a'); }
        }
        R(c, 0, GROUND, SW, H - GROUND, '#3a1a26');
        dither(c, 0, GROUND, SW, H - GROUND, '#2a1018', 3);
        R(c, 0, GROUND, SW, 2, '#ffcc33');
        for (let x = 6; x < SW; x += 24) R(c, x, GROUND + 4, 3, 2, '#ffcc33');
      },
      anim(c, t) { // filme na tela: carro vermelho correndo
        R(c, 100, 90, 376, 32, '#7a7a7a'); for (let x = 0; x < 376; x += 30) R(c, 100 + (x - t * 3 % 30 + 30) % 376, 104, 14, 2, '#ffffff');
        R(c, 100, 20, 376, 70, '#7ac0f0'); R(c, 100, 70, 376, 20, '#d8a060');
        const cx = 200 + Math.sin(t / 30) * 60;
        R(c, cx, 88, 50, 14, '#d8201a'); R(c, cx + 10, 80, 26, 10, '#d8201a'); R(c, cx + 14, 82, 18, 6, '#bfe6ff');
        R(c, cx + 6, 100, 10, 10, '#1a1a1a'); R(c, cx + 34, 100, 10, 10, '#1a1a1a');
        txt(c, '95', cx + 24, 91, '#ffd400', 1);
        // cabeças da plateia
        for (let i = 0; i < 10; i++) { const x = 30 + i * 56, b = Math.sin(t / 15 + i) > 0.9 ? 1 : 0; R(c, x, 120 - b, 10, 12, '#0a0508'); }
      },
      spectators: []
    },
    {
      id: 'casa', name: 'COPA NA CASA DA MIN', sub: 'Ninguem entra sem roupinha do Brasil', music: 'casa',
      draw(c) {
        R(c, 0, 0, SW, GROUND, '#ecebe6');
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
        R(c, 420, 128, 120, 40, '#4a5a7a'); R(c, 420, 118, 120, 16, '#5a6a8a'); R(c, 414, 124, 10, 44, '#3a4a6a'); R(c, 536, 124, 10, 44, '#3a4a6a');
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
      spectators: [{ x: 160, y: 196, s: 0.85 }]
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
      spectators: [{ x: 70, y: 184, s: 0.8 }, { x: 520, y: 184, s: 0.8 }]
    }
  ];

  const cache = {};
  function bg(st) {
    if (!cache[st.id]) {
      const cv = document.createElement('canvas'); cv.width = SW; cv.height = H;
      st.draw(cv.getContext('2d'));
      cache[st.id] = cv;
    }
    return cache[st.id];
  }
  window.Stages = { list: STAGES, bg, WIDTH: SW, GROUND };
})();
