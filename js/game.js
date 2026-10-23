// Fifi Fighters - cenas, menus, HUD e laço principal
(function () {
  const W = 384, H = 216, GROUND = 196;
  const canvas = document.getElementById('screen');
  const ctx = canvas.getContext('2d');
  canvas.width = W; canvas.height = H;
  ctx.imageSmoothingEnabled = false;
  const { Fighter, HumanCtrl, overlap, MAX_HP, heart } = FighterLib;
  const T = (s, x, y, c, o) => Font.text(ctx, s, x, y, c, o);
  const R = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
  const CH = window.CHARACTERS;
  const byId = id => CH.find(c => c.id === id);
  const pick = arr => Array.isArray(arr) ? arr[Math.random() * arr.length | 0] : arr;
  // falas: as de rivalidade (ch.vs[oponente]) aparecem na maioria das vezes
  const line = (ch, opp, kind) => { const v = ch.vs && ch.vs[opp.id] && ch.vs[opp.id][kind]; return v && Math.random() < 0.7 ? v : pick(ch[kind] || ['...']); };
  Sprites.loadPortraits(CH.concat([{ id: 'belipe_bravo' }]));
  if (window.SheetSprites) SheetSprites.load(CH);

  // ---------- Escala da tela ----------
  function resize() {
    const s = Math.max(1, Math.min(window.innerWidth / W, window.innerHeight / H));
    const si = s >= 2 ? Math.floor(s) : s;
    canvas.style.width = Math.floor(W * si) + 'px';
    canvas.style.height = Math.floor(H * si) + 'px';
  }
  window.addEventListener('resize', resize); resize();

  // ---------- Entrada para menus ----------
  const anyStart = () => Input.menuPressed(0, 'start') || Input.menuPressed(1, 'start');
  const confirmKey = () => Input.key('Enter') || Input.key('Space') || Input.menuPressed(0, 'punch') || Input.menuPressed(1, 'punch') || anyStart();
  const backKey = () => Input.key('Escape') || Input.key('Backspace') || Input.menuPressed(0, 'kick') || Input.menuPressed(1, 'kick');
  const navUp = () => Input.menuPressed(0, 'up') || Input.menuPressed(1, 'up');
  const navDown = () => Input.menuPressed(0, 'down') || Input.menuPressed(1, 'down');
  const navLeft = () => Input.menuPressed(0, 'left') || Input.menuPressed(1, 'left');
  const navRight = () => Input.menuPressed(0, 'right') || Input.menuPressed(1, 'right');

  // ---------- Opções e recordes (salvos no navegador) ----------
  const DEFAULT_OPTS = { music: 7, sfx: 8, rounds: 2, time: 99, difficulty: 2, shake: true, hitboxes: false };
  const store = {
    load(k, d) { try { const v = localStorage.getItem(k); return v ? Object.assign({}, d, JSON.parse(v)) : Object.assign({}, d); } catch (e) { return Object.assign({}, d); } },
    save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* armazenamento indisponível */ } }
  };
  const G = {
    scene: 'title', t: 0, mode: '2p',
    picks: [null, null], stageIdx: 0,
    fighters: [], entities: [], particles: [], time: 0,
    menu: { i: 0 },
    opts: store.load('fifi-opts', DEFAULT_OPTS),
    save: store.load('fifi-save', { wins: {}, arcadeHigh: 0, clears: {} })
  };
  window.G = G;
  function saveOpts() { store.save('fifi-opts', G.opts); Sound.setVolumes(G.opts.music / 10, G.opts.sfx / 10); }
  function saveGame() { store.save('fifi-save', G.save); }
  Sound.setVolumes(G.opts.music / 10, G.opts.sfx / 10);

  function go(scene) {
    G.scene = scene; G.t = 0; G.menu = { i: 0 };
    if (scene === 'title' || scene === 'options' || scene === 'credits' || scene === 'howto' || scene === 'moves') Sound.playMusic('title');
    if (scene === 'select' || scene === 'stage') Sound.playMusic('select');
    if (scene === 'ladder') Sound.playMusic('ladder');
  }

  // ---------- Desenho genérico ----------
  function starBg(col1, col2) {
    R(0, 0, W, H, col1);
    for (let i = 0; i < 40; i++) {
      const x = (i * 97 + G.t * (0.3 + (i % 3) * 0.3)) % W, y = (i * 53) % H;
      R(x, y, 2, 1, col2);
    }
  }
  const previewCanvases = {};
  function drawCharAt(ch, x, y, pose, scale, key, flip, st, alt) {
    if (st && window.SheetSprites && SheetSprites.draw(ctx, ch, st, G.t, x, y, flip ? -1 : 1, scale, null, alt)) return;
    key = key || ch.id;
    if (!previewCanvases[key]) previewCanvases[key] = Sprites.newCanvas();
    const cv = previewCanvases[key];
    Sprites.render(cv, ch, pose, G.t);
    scale = scale || 1;
    ctx.save(); ctx.translate(Math.round(x), Math.round(y));
    if (flip) ctx.scale(-1, 1);
    ctx.drawImage(cv, -Sprites.OX * scale, -Sprites.OY * scale, Sprites.SW * scale, Sprites.SH * scale);
    ctx.restore();
  }
  function logo(x, y, s) {
    const wob = Math.sin(G.t / 20) * 1;
    T('FIFI', x, y + wob, '#ffd400', { scale: s, align: 'center', outline: '#2a0a3a', shadow: '#c0281c' });
    T('FIGHTERS', x, y + 8 * s + 2 + wob, '#ffffff', { scale: s, align: 'center', outline: '#2a0a3a', shadow: '#0a7a3a' });
  }
  function photoOr(ch, size, x, y, w, h, flip) {
    const im = Sprites.photo(ch, size);
    ctx.save(); ctx.translate(Math.round(x), Math.round(y)); if (flip) { ctx.translate(w, 0); ctx.scale(-1, 1); }
    if (im) ctx.drawImage(im, 0, 0, w, h); else ctx.drawImage(Sprites.portrait(ch, 'normal'), 0, 0, w, h);
    ctx.restore();
  }
  function vgradPanel(x, y, a, b) { for (let i = 0; i < 124; i++) R(x, y + i, 112, 1, (i / 124) > (i % 2 ? 0.45 : 0.55) ? b : a); }
  function panel(x, y, w, h, title) {
    R(x - 1, y - 1, w + 2, h + 2, '#000'); R(x, y, w, h, 'rgba(14,8,30,0.94)');
    R(x, y, w, 1, '#ffd400'); R(x, y + h - 1, w, 1, '#5a3a8a');
    if (title) { R(x, y, w, 12, '#2a1450'); T(title, x + w / 2, y + 3, '#ffd400', { align: 'center' }); }
  }
  // ---------- api para o Modo História (js/story.js) ----------
  function storyMenu(items, bg) {
    if (bg) { // arte de fundo (js/story.js), escurecida para o texto aparecer
      ctx.imageSmoothingEnabled = true; ctx.drawImage(bg, 0, 0, W, H); ctx.imageSmoothingEnabled = false;
      R(0, 0, W, H, 'rgba(10,6,24,0.35)');
    } else starBg('#140a24', '#3a2a6a');
    logo(W / 2, 2, 2);
    T('MODO HISTORIA', W / 2, 42, '#ffd400', { scale: 2, align: 'center', outline: '#000' });
    T('O SUMICO DA MIN', W / 2, 64, '#9ff0ff', { align: 'center', shadow: '#000' });
    panel(W / 2 - 100, 80, 200, items.filter(i => !i.hidden).length * 13 + 12);
    runMenu(items, G.menu, W / 2, 87, { w: 186, lh: 13 });
    T('P1 E SEMPRE O GUTI. O P2 JOGA COM QUEM', W / 2, 164, '#cfc8e8', { align: 'center', shadow: '#000' });
    T('APARECER NO CAMINHO (OU DEIXE COM A CPU).', W / 2, 174, '#cfc8e8', { align: 'center', shadow: '#000' });
    T('NA HISTORIA: SOCO AVANCA  START ABRE O MENU', W / 2, 196, '#6a6088', { align: 'center' });
    if (backKey()) { Sound.play('select'); go('title'); }
  }
  window.Game = { startMatch: () => startMatch(), go: s => go(s), confirmKey, backKey, anyStart, navUp, navDown, storyMenu };

  // ---------- celular como controle ----------
  const RM = () => window.Remote;
  function slotDots(x, y, align) {
    const r = RM(); if (!r) return;
    const parts = [0, 1].map(p => ['P' + (p + 1) + (r.connected(p) ? ' OK' : ' --'), r.connected(p) ? (p ? '#6aa8ff' : '#ff6a6a') : '#7a7090']);
    const total = Font.width(parts[0][0] + '  ' + parts[1][0]);
    let cx = align === 'right' ? x - total : (align === 'center' ? x - total / 2 : x);
    parts.forEach(([txt, col]) => { T(txt, cx, y, col, { shadow: '#000' }); cx += Font.width(txt + '  ') + 1; });
  }
  // QR do controle no canto (scale = tamanho do módulo em pixels)
  function drawPhoneQR(right, bottom, scale) {
    const r = RM();
    if (!r || !r.canShare()) { T('CELULAR: ABRA O JOGO PELO SITE', right, bottom - 7, '#6a5a9a', { align: 'right' }); return; }
    const q = r.qr();
    if (!q || r.status !== 'ready') { T('CELULAR: ' + r.statusText(), right, bottom - 7, '#6a5a9a', { align: 'right' }); return; }
    const w = q.width * scale, x = right - w, y = bottom - w;
    R(x - 1, y - 1, w + 2, w + 2, '#5a3a8a');
    ctx.drawImage(q, x, y, w, w);
    T('CONTROLE NO CELULAR', right, y - 20, '#ffd400', { align: 'right', shadow: '#000' });
    T('SALA ' + r.code, right, y - 10, '#9ff0ff', { align: 'right', shadow: '#000' });
    slotDots(right, y - 31, 'right');
  }
  function phone() {
    starBg('#0a1424', '#2a3a6a');
    T('CONTROLE NO CELULAR', W / 2, 8, '#ffd400', { scale: 2, align: 'center', outline: '#000' });
    const r = RM();
    const lines = ['1. CELULAR NA MESMA WI-FI', '2. APONTE A CAMERA PRO QR CODE', '3. O PRIMEIRO QUE ENTRAR E O P1,', '   O SEGUNDO E O P2', '', 'O TECLADO CONTINUA FUNCIONANDO.', 'NO CELULAR: Y SOCO  B CHUTE', 'A PODER  X/R SUPER  START PAUSA'];
    lines.forEach((l, i) => T(l, 14, 40 + i * 11, i < 4 ? '#ffffff' : '#9ff0ff', { shadow: '#000' }));
    if (r && r.canShare() && r.qr() && r.status === 'ready') {
      const q = r.qr(), sc = Math.max(2, Math.floor(132 / q.width)), w = q.width * sc;
      R(W - 18 - w - 2, 34, w + 4, w + 4, '#000'); ctx.drawImage(q, W - 16 - w, 36, w, w);
      T('SALA ' + r.code, W - 16 - w / 2, 40 + w + 4, '#ffd400', { align: 'center', shadow: '#000' });
      T('OU DIGITE O CODIGO EM', 14, 140, '#8a80a8'); T((r.url || '').replace(/^https?:\/\//, '').replace(/controle\.html.*$/, 'controle.html'), 14, 150, '#8a80a8');
    } else T(r ? (r.canShare() ? r.statusText() : 'ABRA O JOGO PELO SITE (NAO PELO ARQUIVO)') : 'INDISPONIVEL', W - 100, 90, '#ff8a8a', { align: 'center', shadow: '#000' });
    slotDots(14, 176, 'left');
    T('CHUTE OU ESC VOLTA', W / 2, 202, '#6a6088', { align: 'center' });
    if (backKey() || (G.t > 10 && confirmKey())) { Sound.play('select'); go('title'); }
  }
  function drawToasts() {
    const r = RM(); if (!r || !r.toasts.length) return;
    r.toasts.forEach((t, i) => {
      t.t++;
      const y = G.scene === 'fight' ? 46 + i * 12 : H - 16 - i * 12, w = Font.width(t.s) + 10;
      R(W / 2 - w / 2, y - 2, w, 11, 'rgba(0,0,0,0.75)');
      T(t.s, W / 2, y, t.col, { align: 'center' });
    });
    r.toasts = r.toasts.filter(t => t.t < 150);
  }

  // seta de direção em pixel (para o histórico de comandos)
  function arrow(x, y, dx, dy, col) {
    ctx.fillStyle = col;
    const cx = x + 3, cy = y + 3;
    for (let i = -3; i <= 3; i++) ctx.fillRect(Math.round(cx + dx * i * (dy ? 0.7 : 1)), Math.round(cy + dy * i * (dx ? 0.7 : 1)), 1, 1);
    const hx = cx + dx * 3, hy = cy + dy * 3;
    ctx.fillRect(Math.round(hx - dx - (dy ? 1 : 0)), Math.round(hy - dy - (dx ? 1 : 0)), 1, 1);
    ctx.fillRect(Math.round(hx - dx + (dy ? 1 : 0)), Math.round(hy - dy + (dx ? 1 : 0)), 1, 1);
    ctx.fillRect(Math.round(hx - dx * 2 - (dy ? 2 : 0)), Math.round(hy - dy * 2 - (dx ? 2 : 0)), 1, 1);
    ctx.fillRect(Math.round(hx - dx * 2 + (dy ? 2 : 0)), Math.round(hy - dy * 2 + (dx ? 2 : 0)), 1, 1);
  }

  // ---------- Menu genérico ----------
  // item: { label, value?: () => texto | {bar:n}, change?: dir => void, act?: () => void, hidden? }
  function runMenu(items, st, x, y, o) {
    o = o || {};
    const vis = items.filter(it => !it.hidden);
    if (st.i >= vis.length) st.i = 0;
    if (navUp()) { st.i = (st.i + vis.length - 1) % vis.length; Sound.play('move'); }
    if (navDown()) { st.i = (st.i + 1) % vis.length; Sound.play('move'); }
    const cur = vis[st.i];
    if (cur && cur.change && (navLeft() || navRight())) { cur.change(navLeft() ? -1 : 1); Sound.play('move'); }
    const lh = o.lh || 11, w = o.w || 200;
    vis.forEach((it, i) => {
      const yy = y + i * lh, sel = i === st.i;
      const label = typeof it.label === 'function' ? it.label() : it.label;
      const col = sel ? '#ffd400' : (o.dim || '#c8c0dc');
      if (sel) { R(x - w / 2 - 4, yy - 2, w + 8, lh - 1, 'rgba(255,212,0,0.12)'); if ((G.t >> 3) % 2) T('>', x - w / 2 - 2, yy, '#ffd400'); }
      if (it.value) {
        T(label, x - w / 2 + 6, yy, col);
        const v = it.value();
        if (v && v.bar !== undefined) {
          for (let k = 0; k < 10; k++) R(x + w / 2 - 62 + k * 6, yy, 5, 7, k < v.bar ? (sel ? '#ffd400' : '#9ff0ff') : '#3a3050');
        } else T((sel && it.change ? '< ' : '') + v + (sel && it.change ? ' >' : ''), x + w / 2 - 2, yy, sel ? '#ffffff' : '#9ff0ff', { align: 'right' });
      } else T(label, o.left ? x - w / 2 + 6 : x, yy, col, { align: o.left ? 'left' : 'center' });
    });
    if (cur && cur.act && confirmKey()) { Sound.play('confirm'); cur.act(); }
    return cur;
  }
  const cycle = (arr, v, d) => arr[(arr.indexOf(v) + d + arr.length) % arr.length];
  const yesNo = v => v ? 'SIM' : 'NAO';
  function optionItems(onBack) {
    const O = G.opts;
    return [
      { label: 'MUSICA', value: () => ({ bar: O.music }), change: d => { O.music = Math.max(0, Math.min(10, O.music + d)); saveOpts(); } },
      { label: 'EFEITOS SONOROS', value: () => ({ bar: O.sfx }), change: d => { O.sfx = Math.max(0, Math.min(10, O.sfx + d)); saveOpts(); Sound.play('hitLight'); } },
      { label: 'ROUNDS PARA VENCER', value: () => String(O.rounds), change: d => { O.rounds = cycle([1, 2, 3], O.rounds, d); saveOpts(); } },
      { label: 'TEMPO DO ROUND', value: () => O.time ? String(O.time) : 'INFINITO', change: d => { O.time = cycle([30, 60, 99, 0], O.time, d); saveOpts(); } },
      { label: 'DIFICULDADE CPU', value: () => ['', 'FACIL', 'NORMAL', 'DIFICIL'][O.difficulty], change: d => { O.difficulty = cycle([1, 2, 3], O.difficulty, d); saveOpts(); } },
      { label: 'TREMOR DE TELA', value: () => yesNo(O.shake), change: () => { O.shake = !O.shake; saveOpts(); } },
      { label: 'MOSTRAR HITBOXES', value: () => yesNo(O.hitboxes), change: () => { O.hitboxes = !O.hitboxes; saveOpts(); } },
      { label: 'RESTAURAR PADROES', act: () => { Object.assign(O, DEFAULT_OPTS); saveOpts(); } },
      { label: 'VOLTAR', act: onBack }
    ];
  }

  // ---------- TÍTULO / MENU PRINCIPAL ----------
  const MODE_NAMES = { arcade: 'ARCADE', cpu: 'VERSUS CPU', '2p': 'VERSUS', training: 'TREINO', story: 'MODO HISTORIA' };
  function title() {
    starBg('#140a24', '#3a2a6a');
    for (let i = 0; i < 8; i++) R(0, 196 + i * 2, W, 2, i % 2 ? '#22104a' : '#2a1458');
    CH.forEach((ch, i) => drawCharAt(ch, 30 + i * 46, 214, Poses.idle(ch, G.t + i * 40), 1, 'title' + ch.id, i >= 4, { kind: 'idle' }));
    logo(W / 2, 4, 3);
    T('O JOGO DE LUTA DOS FIFIS', W / 2, 54, '#9ff0ff', { align: 'center', shadow: '#000' });
    panel(W / 2 - 84, 64, 168, 98);
    runMenu([
      { label: 'MODO HISTORIA', act: () => go('storymenu') },
      { label: 'ARCADE', act: () => startSelect('arcade') },
      { label: 'VERSUS CPU', act: () => startSelect('cpu') },
      { label: 'VERSUS 2 JOGADORES', act: () => startSelect('2p') },
      { label: 'TREINO', act: () => startSelect('training') },
      { label: 'LISTA DE GOLPES', act: () => { G.moveTab = 0; go('moves'); } },
      { label: 'COMO JOGAR', act: () => go('howto') },
      { label: 'CONTROLE NO CELULAR', act: () => go('phone') },
      { label: 'OPCOES', act: () => go('options') },
      { label: 'CREDITOS', act: () => go('credits') }
    ], G.menu, W / 2, 68, { w: 150, lh: 9.4 });
    T('M: SOM  F: TELA CHEIA', W - 4, 4, '#6a5a9a', { align: 'right' });
    if (Input.pads()) T('CONTROLE CONECTADO: ' + Input.pads(), 4, 4, '#7ad07a');
    if (RM() && (RM().connected(0) || RM().connected(1))) slotDots(4, Input.pads() ? 14 : 4, 'left');
    if (G.save.arcadeHigh) T('RECORDE ARCADE ' + G.save.arcadeHigh, W / 2, 166, '#ffd400', { align: 'center', shadow: '#000' });
  }

  // ---------- OPÇÕES ----------
  function options() {
    starBg('#0e1428', '#2a3a6a');
    T('OPCOES', W / 2, 10, '#ffd400', { scale: 2, align: 'center', shadow: '#000' });
    panel(52, 34, 280, 120);
    runMenu(optionItems(() => go('title')), G.menu, W / 2, 42, { w: 256, lh: 12 });
    T('ESQUERDA/DIREITA MUDA   CHUTE OU ESC VOLTA', W / 2, 172, '#8a80a8', { align: 'center' });
    T('AS OPCOES FICAM SALVAS NESTE NAVEGADOR', W / 2, 184, '#6a6088', { align: 'center' });
    if (backKey()) { Sound.play('select'); go('title'); }
  }

  // ---------- COMO JOGAR ----------
  function howto() {
    starBg('#0e1428', '#2a3a6a');
    T('COMO JOGAR', W / 2, 6, '#ffd400', { scale: 2, align: 'center', shadow: '#000' });
    const L = [
      ['', 'JOGADOR 1', 'JOGADOR 2', 'CONTROLE'],
      ['MOVER', 'W A S D', 'SETAS', 'DIRECIONAL'],
      ['SOCO', 'V', '1', 'A'],
      ['CHUTE', 'B', '2', 'B'],
      ['PODER', 'N', '3', 'X / Y'],
      ['SUPER', 'V + N', '1 + 3', 'RB'],
      ['PAUSA', 'ESC / ENTER', 'ESC / ENTER', 'START']
    ];
    L.forEach((r, i) => {
      const c = i === 0 ? '#9ff0ff' : '#ffffff';
      T(r[0], 22, 28 + i * 10, '#ffd400'); T(r[1], 150, 28 + i * 10, c, { align: 'center' }); T(r[2], 250, 28 + i * 10, c, { align: 'center' }); T(r[3], 334, 28 + i * 10, c, { align: 'center' });
    });
    const S = [
      ['PODER / FRENTE+PODER / BAIXO+PODER', '3 ESPECIAIS DIFERENTES'],
      ['SOCO + PODER (BARRA CHEIA)', 'SUPER'],
      ['ACERTOU SOCO OU CHUTE? APERTE PODER', 'COMBO'],
      ['PERTO + SOCO + CHUTE', 'AGARRAO (APERTE OS 2 PARA ESCAPAR)'],
      ['FRENTE FRENTE / TRAS TRAS', 'DASH'],
      ['SEGURAR PARA TRAS', 'DEFESA (AGACHADO DEFENDE RASTEIRA)'],
      ['BAIXO + CHUTE', 'RASTEIRA (DERRUBA)'],
      ['APANHOU MUITO? FICA TONTO', 'APERTE TUDO PARA ACORDAR']
    ];
    S.forEach(([a, b], i) => { T(a, 22, 104 + i * 11, '#ffffff'); T(b, W - 22, 104 + i * 11, '#9ff0ff', { align: 'right' }); });
    if ((G.t >> 5) % 2) T('APERTE ENTER PARA VOLTAR', W / 2, 204, '#ffffff', { align: 'center' });
    if (confirmKey() || backKey()) { Sound.play('select'); go('title'); }
  }

  // ---------- LISTA DE GOLPES ----------
  const INPUTS = ['PODER', 'FRENTE + PODER', 'BAIXO + PODER', 'SOCO + PODER'];
  function statBar(x, y, label, v) {
    T(label, x, y, '#9ff0ff');
    const n = Math.max(1, Math.min(10, Math.round((v - 0.8) / 0.04)));
    for (let k = 0; k < 10; k++) R(x + 48 + k * 6, y, 5, 6, k < n ? '#ffd400' : '#3a3050');
  }
  function drawMoveList(ch, header) {
    R(0, 0, W, H, 'rgba(6,3,14,0.94)');
    R(3, 7, 114, 126, '#000'); vgradPanel(4, 8, '#3a1a5a', '#120a24'); photoOr(ch, 'big', 4, 8, 112, 124);
    statBar(6, 140, 'FORCA', ch.stats.power);
    statBar(6, 150, 'VELOC.', ch.stats.speed);
    statBar(6, 160, 'DEFESA', ch.stats.defense);
    statBar(6, 170, 'PULO', ch.stats.jump);
    T('ALTURA ' + ch.height.toFixed(2).replace('.', ',') + 'M', 6, 182, '#ffd400');
    const wins = G.save.wins[ch.id] || 0;
    T('VITORIAS ' + wins + (G.save.clears[ch.id] ? '  ARCADE OK' : ''), 6, 192, '#c8c0dc');
    T(ch.name, 124, 6, '#ffd400', { scale: 2, outline: '#000' });
    T(ch.title + (header ? '   ' + header : ''), 124, 24, '#ffffff');
    const sp = ch.specials;
    let y = 36;
    [sp.n, sp.fwd, sp.down, sp.super].forEach((d, i) => {
      T(INPUTS[i], 124, y, i === 3 ? '#ffd400' : '#9ff0ff');
      T(d.name, 124 + Font.width(INPUTS[i]) + 8, y, '#ffffff');
      const lines = Font.wrap(d.desc || '', 42).slice(0, 2);
      lines.forEach((l, k) => T(l, 128, y + 9 + k * 8, '#a8a0c0'));
      y += 11 + lines.length * 8 + 3;
    });
    T('* O SUPER PRECISA DA BARRA CHEIA', 124, y, '#776f90'); y += 12;
    T('BASICOS', 124, y, '#9ff0ff'); y += 10;
    T('PERTO + SOCO + CHUTE: AGARRAO', 128, y, '#c8c0dc'); y += 8;
    T('FRENTE FRENTE: DASH   TRAS TRAS: RECUO', 128, y, '#c8c0dc'); y += 8;
    T('BAIXO + CHUTE: RASTEIRA   TRAS: DEFESA', 128, y, '#c8c0dc');
    R(0, 203, W, 13, '#120a24');
    T('P1: V SOCO B CHUTE N PODER   P2: 1 2 3   CONTROLE: A B X', W / 2, 206, '#8a80a8', { align: 'center' });
  }
  function moves() {
    const ch = CH[G.moveTab || 0];
    drawMoveList(ch, '< ' + ((G.moveTab || 0) + 1) + '/' + CH.length + ' >');
    if (navLeft()) { G.moveTab = ((G.moveTab || 0) + CH.length - 1) % CH.length; Sound.play('move'); }
    if (navRight()) { G.moveTab = ((G.moveTab || 0) + 1) % CH.length; Sound.play('move'); }
    if (backKey() || confirmKey()) { Sound.play('select'); go('title'); }
  }

  // ---------- CRÉDITOS ----------
  const CREDITS = [
    ['FIFI FIGHTERS', '#ffd400', 2], ['', ''], ['UM PRESENTE PARA OS FIFIS', '#9ff0ff'], ['', ''],
    ['IDEIA, DIRECAO E ARTE', '#ffd400'], ['PV', '#ffffff'], ['', ''],
    ['PROGRAMACAO', '#ffd400'], ['CLAUDE', '#ffffff'], ['', ''],
    ['ELENCO', '#ffd400'],
    ...CH.map(c => [c.name + ' - ' + c.realName.toUpperCase(), '#ffffff']),
    ['AMORA, A CACHORRA', '#ffffff'], ['AS GATAS GEMEAS', '#ffffff'], ['', ''],
    ['CENARIOS', '#ffd400'], ...Stages.list.map(s => [s.name, '#c8c0dc']), ['', ''],
    ['FIFIS SAO PADRINHAS', '#ff8ab0'], ['', ''], ['OBRIGADO POR JOGAR!', '#ffd400', 2]
  ];
  function credits() {
    starBg('#0a0618', '#2a1a4a');
    const y0 = H - G.t * 0.45;
    let y = y0;
    CREDITS.forEach(([s, c, sc]) => { if (s && y > -20 && y < H + 10) T(s, W / 2, y, c, { align: 'center', scale: sc || 1, shadow: '#000' }); y += (sc || 1) * 12; });
    if (y < 0 || backKey() || confirmKey()) { Sound.play('select'); go(G.afterCredits || 'title'); G.afterCredits = null; }
  }

  // ---------- SELEÇÃO DE PERSONAGENS ----------
  const GRID_X = 116, GRID_Y = 15, BOX_W = 38, BOX_H = 42;
  const solo = () => G.mode === 'cpu' || G.mode === 'training';
  function startSelect(mode) {
    if (mode) G.mode = mode;
    G.cursor = [0, 1]; G.locked = [false, false]; G.lastHover = 0; G.selPhase = 0; G.lockT = [0, 0]; G.readyT = 0;
    go('select');
  }
  function p2Visible() { return G.mode === '2p' || (solo() && G.selPhase === 1); }
  function select() {
    starBg('#1a0a14', '#4a1a2a');
    for (let i = 0; i < 10; i++) R(((i * 50 + G.t) % (W + 60)) - 40, 0, 14, H, 'rgba(255,255,255,0.025)');
    const head = G.mode === 'training' ? (G.selPhase ? 'ESCOLHA O BONECO DE TREINO' : 'TREINO - ESCOLHA SEU FIFI')
      : G.mode === 'cpu' && G.selPhase ? 'ESCOLHA O OPONENTE (CPU)' : MODE_NAMES[G.mode] + ' - ESCOLHA SEU FIFI';
    T(head, W / 2, 3, '#ffd400', { align: 'center', shadow: '#000' });
    const cursorCol = ['#ff3a3a', '#3a8aff'];
    [0, 1].forEach(p => {
      const px = p === 0 ? 2 : W - 114;
      R(px - 1, 13, 114, 202, '#000'); R(px, 14, 112, 200, p === 0 ? '#3a0e1a' : '#0e1a3a');
      for (let y = 14; y < 214; y += 3) R(px, y, 112, 1, p === 0 ? 'rgba(255,60,80,0.10)' : 'rgba(60,120,255,0.10)');
      if (p === 1 && !p2Visible()) { T(G.mode === 'arcade' ? '???' : 'CPU', px + 56, 100, '#556', { scale: 3, align: 'center' }); return; }
      const ch = CH[G.cursor[p]];
      const alt = p === 1 && G.cursor[0] === G.cursor[1];
      photoOr(ch, 'big', px, 22, 112, 124, false);
      for (let i = 0; i < 70; i++) R(px, 144 + i, 112, 1, 'rgba(0,0,0,' + Math.min(0.85, i / 50) + ')');
      drawCharAt(ch, px + 56, 212, Poses.idle(ch, G.t), 1, 'sel' + p, p === 1, { kind: G.locked[p] ? 'win' : 'idle' }, alt);
      T(ch.name, px + 4, 16, p === 0 ? '#ff8a8a' : '#8ab8ff', { scale: 2, outline: '#000' });
      T(ch.title, px + 4, 33, '#ffffff', { outline: '#000' });
      T('ALTURA ' + ch.height.toFixed(2).replace('.', ',') + 'M', px + 4, 43, '#ffd400', { outline: '#000' });
      if (alt) T('COR ALTERNATIVA', px + 4, 53, '#9ff0ff', { outline: '#000' });
      if (G.locked[p]) T('OK!', px + 56, 130, (G.t >> 2) % 2 ? '#ffd400' : '#ffffff', { scale: 2, align: 'center', outline: '#000' });
    });
    CH.forEach((ch, i) => {
      const gx = GRID_X + (i % 4) * BOX_W, gy = GRID_Y + Math.floor(i / 4) * BOX_H;
      R(gx, gy, BOX_W, BOX_H, '#120a1c'); R(gx + 1, gy + 1, BOX_W - 2, BOX_H - 2, i % 2 ? '#3a2a5a' : '#45305f');
      photoOr(ch, 'grid', gx + 1, gy + 1, 36, 40);
      R(gx + 1, gy + BOX_H - 9, BOX_W - 2, 8, 'rgba(0,0,0,0.65)');
      T(ch.name, gx + BOX_W / 2, gy + BOX_H - 8, '#ffffff', { align: 'center' });
    });
    [0, 1].forEach(p => {
      if (p === 1 && !p2Visible()) return;
      const i = G.cursor[p];
      const gx = GRID_X + (i % 4) * BOX_W, gy = GRID_Y + Math.floor(i / 4) * BOX_H;
      if (G.locked[p] || (G.t >> 3) % 2) { ctx.strokeStyle = cursorCol[p]; ctx.lineWidth = 2; ctx.strokeRect(gx + 1 + p, gy + 1 + p, BOX_W - 2 - p * 2, BOX_H - 2 - p * 2); }
      const label = p === 0 ? '1P' : (G.mode === '2p' ? '2P' : 'CPU');
      T(label, p === 0 ? gx + 3 : gx + BOX_W - 3, gy + 3, cursorCol[p], { align: p === 0 ? 'left' : 'right', outline: '#000' });
    });
    const ch = CH[G.cursor[G.lastHover]];
    const IX = GRID_X + 1;
    R(GRID_X, 101, 152, 114, 'rgba(10,5,20,0.88)'); R(GRID_X, 101, 152, 1, '#ffd400');
    T(ch.realName.toUpperCase(), IX + 2, 104, '#ffd400');
    const wins = G.save.wins[ch.id] || 0;
    if (wins) T(wins + ' VIT.', IX + 148, 104, '#9ff0ff', { align: 'right' });
    Font.wrap(ch.desc, 24).slice(0, 4).forEach((l, i) => T(l, IX + 2, 114 + i * 8, '#cccccc'));
    const sp = ch.specials;
    [sp.n, sp.fwd, sp.down, sp.super].forEach((d, i) => {
      T(['P', 'FR+P', 'BX+P', 'S+P'][i], IX + 2, 150 + i * 10, i === 3 ? '#ffd400' : '#9ff0ff');
      T(d.name.slice(0, 20), IX + 30, 150 + i * 10, i === 3 ? '#ffd400' : '#ffffff');
    });
    T('SOCO OK  PODER ALEATORIO', IX + 2, 194, '#777');
    T('CHUTE DESFAZ  ESC MENU', IX + 2, 204, '#777');

    const players = G.mode === '2p' ? [0, 1] : [0];
    players.forEach(p => {
      const cp = solo() && G.selPhase === 1 ? 1 : p;
      if (G.locked[cp]) {
        if (Input.menuPressed(p, 'kick')) { G.locked[cp] = false; Sound.play('move'); }
        return;
      }
      if (solo() && G.selPhase === 1 && Input.menuPressed(0, 'kick')) { G.selPhase = 0; G.locked[0] = false; G.readyT = 0; Sound.play('move'); return; }
      let c = G.cursor[cp];
      if (Input.menuPressed(p, 'left')) c = (c % 4 === 0) ? c + 3 : c - 1;
      if (Input.menuPressed(p, 'right')) c = (c % 4 === 3) ? c - 3 : c + 1;
      if (Input.menuPressed(p, 'up') || Input.menuPressed(p, 'down')) c = (c + 4) % 8;
      const rnd = Input.menuPressed(p, 'power');
      if (rnd) c = Math.random() * CH.length | 0;
      if (c !== G.cursor[cp]) { G.cursor[cp] = c; G.lastHover = cp; Sound.play('move'); }
      const ok = rnd || Input.menuPressed(p, 'punch') || Input.menuPressed(p, 'start') || (p === 0 && (Input.key('Enter') || Input.key('Space')));
      if (ok) {
        G.locked[cp] = true; G.lockT[cp] = G.t; Sound.play('confirm');
        if (solo() && G.selPhase === 0) { G.selPhase = 1; G.lastHover = 1; }
      }
    });
    if (Input.key('Escape')) { go('title'); return; }
    const done = G.mode === 'arcade' ? G.locked[0] : (G.locked[0] && G.locked[1]);
    if (done) {
      G.readyT++;
      if (G.readyT > 40) {
        G.readyT = 0;
        if (G.mode === 'arcade') { setupArcade(CH[G.cursor[0]].id); go('ladder'); }
        else { G.picks = [CH[G.cursor[0]].id, CH[G.cursor[1]].id]; G.stageIdx = 0; go('stage'); }
      }
    }
  }

  // ---------- SELEÇÃO DE CENÁRIO ----------
  function stageSel() {
    const n = Stages.list.length;
    const idx = G.stageIdx;
    if (idx < n) {
      const st = Stages.list[idx];
      const ox = Math.max(0, Math.round((Stages.width(st) - W) / 2));
      R(0, 0, W, H, '#000');
      ctx.drawImage(Stages.bg(st), ox, 0, Math.min(W, Stages.width(st)), H, Math.max(0, (W - Stages.width(st)) / 2), 0, Math.min(W, Stages.width(st)), H);
      ctx.save(); ctx.translate(-ox, 0); Stages.anim(st, ctx, G.t); ctx.restore();
    } else {
      starBg('#101010', '#444');
      T('?', W / 2, 70, '#ffd400', { scale: 8, align: 'center', outline: '#000' });
    }
    R(0, 0, W, 22, 'rgba(0,0,0,0.7)');
    T('ESCOLHA O CENARIO', W / 2, 7, '#ffd400', { align: 'center' });
    R(0, 164, W, 52, 'rgba(0,0,0,0.75)');
    const name = idx < n ? Stages.list[idx].name : 'ALEATORIO';
    const sub = idx < n ? Stages.list[idx].sub : 'Deixa o destino escolher';
    T('<', 12, 176, (G.t >> 4) % 2 ? '#ffffff' : '#888', { scale: 2 });
    T('>', W - 22, 176, (G.t >> 4) % 2 ? '#ffffff' : '#888', { scale: 2 });
    T(name, W / 2, 172, '#ffffff', { scale: 2, align: 'center', outline: '#000' });
    T(sub, W / 2, 192, '#9ff0ff', { align: 'center' });
    for (let i = 0; i <= n; i++) R(W / 2 - (n + 1) * 5 + i * 10, 205, 6, 4, i === idx ? '#ffd400' : '#555');
    if (navLeft()) { G.stageIdx = (idx + n) % (n + 1); Sound.play('move'); }
    if (navRight()) { G.stageIdx = (idx + 1) % (n + 1); Sound.play('move'); }
    if (confirmKey()) {
      Sound.play('confirm');
      G.stage = idx < n ? Stages.list[idx] : Stages.list[Math.random() * n | 0];
      if (G.mode === 'training') startMatch(); else go('vs');
    }
    if (backKey()) { startSelect(); }
  }

  // ---------- ARCADE ----------
  function setupArcade(me) {
    const others = CH.map(c => c.id).filter(id => id !== me);
    const boss = me === 'guti' ? 'pv' : 'guti';
    const rest = others.filter(id => id !== boss).sort(() => Math.random() - 0.5);
    G.arcade = { me, order: rest.concat([boss]), idx: 0, score: 0, continues: 0 };
  }
  function arcadeLevel() {
    const a = G.arcade, base = G.opts.difficulty;
    let lv = base + (a.idx >= 3 ? 1 : 0) + (a.idx === a.order.length - 1 ? 1 : 0) - (a.idx === 0 ? 1 : 0);
    return Math.max(1, Math.min(3, lv));
  }
  function ladder() {
    starBg('#140a24', '#3a2a6a');
    const a = G.arcade, me = byId(a.me);
    T('ARCADE', W / 2, 6, '#ffd400', { scale: 2, align: 'center', shadow: '#000' });
    T('PONTOS ' + a.score, 8, 8, '#ffffff'); T('RECORDE ' + Math.max(G.save.arcadeHigh, a.score), W - 8, 8, '#9ff0ff', { align: 'right' });
    const n = a.order.length, bw = 44, x0 = (W - n * bw) / 2 + 2;
    a.order.forEach((id, i) => {
      const ch = byId(id), x = x0 + i * bw, y = 40 - (i === a.idx ? 4 + Math.abs(Math.sin(G.t / 10)) * 3 : 0);
      R(x - 1, y - 1, 40, 46, i === a.idx ? '#ffd400' : '#000');
      R(x, y, 38, 44, '#2a1a3a');
      photoOr(ch, 'grid', x + 1, y + 2, 36, 40);
      if (i < a.idx) { R(x, y, 38, 44, 'rgba(0,0,0,0.6)'); T('X', x + 19, y + 14, '#ff3a3a', { scale: 2, align: 'center', outline: '#000' }); }
      if (i === n - 1) T('CHEFE', x + 19, y + 48, '#ff6a6a', { align: 'center' });
    });
    const opp = byId(a.order[a.idx]);
    drawCharAt(me, 110, 196, Poses.idle(me, G.t), 1, 'lad0', false, { kind: 'idle' });
    drawCharAt(opp, 274, 196, Poses.idle(opp, G.t), 1, 'lad1', true, { kind: 'idle' }, opp.id === me.id);
    T('LUTA ' + (a.idx + 1) + ' DE ' + n, W / 2, 112, '#ffffff', { scale: 2, align: 'center', outline: '#000' });
    T('VS', W / 2, 136, (G.t >> 3) % 2 ? '#ffd400' : '#ff7a1a', { scale: 3, align: 'center', outline: '#000' });
    T(opp.name, W / 2, 164, '#ff8a8a', { scale: 2, align: 'center', outline: '#000' });
    const st = Stages.list.find(s => s.id === opp.home) || Stages.list[0];
    T(st.name, W / 2, 182, '#9ff0ff', { align: 'center' });
    if ((G.t >> 5) % 2) T('APERTE SOCO PARA LUTAR', W / 2, 200, '#ffffff', { align: 'center' });
    if (G.t > 20 && confirmKey()) {
      Sound.play('confirm');
      G.picks = [a.me, opp.id]; G.stage = st;
      go('vs');
    }
    if (Input.key('Escape')) go('title');
  }
  function arcadeContinue() {
    starBg('#0a0408', '#2a0a14');
    const sec = 9 - Math.floor(G.t / 60);
    const me = byId(G.arcade.me);
    photoOr(me, 'big', W / 2 - 56, 20, 112, 124);
    R(W / 2 - 56, 20, 112, 124, 'rgba(40,0,0,' + (0.3 + (1 - sec / 9) * 0.5) + ')');
    T('CONTINUAR?', W / 2, 150, '#ffd400', { scale: 3, align: 'center', outline: '#000' });
    T(String(Math.max(0, sec)), W / 2, 176, sec <= 3 ? '#ff3a3a' : '#ffffff', { scale: 3, align: 'center', outline: '#000' });
    T('SOCO CONTINUA   CHUTE ACELERA', W / 2, 204, '#8a80a8', { align: 'center' });
    if (Input.menuPressed(0, 'kick') || Input.menuPressed(1, 'kick')) G.t += 30;
    if (confirmKey()) { Sound.play('confirm'); G.arcade.continues++; G.arcade.score = Math.floor(G.arcade.score / 2); go('vs'); return; }
    if (sec < 0) { go('gameover'); Sound.playMusic('gameover'); }
  }
  function gameover() {
    R(0, 0, W, H, '#000');
    T('FIM DE JOGO', W / 2, 80, '#ff3a3a', { scale: 3, align: 'center', outline: '#2a0000' });
    T('PONTOS ' + G.arcade.score, W / 2, 120, '#ffffff', { align: 'center' });
    T('A CULPA E DO PV.', W / 2, 140, '#8a80a8', { align: 'center' });
    if (G.t > 240 || (G.t > 40 && confirmKey())) { recordHigh(); go('title'); }
  }
  function recordHigh() { if (G.arcade && G.arcade.score > (G.save.arcadeHigh || 0)) { G.save.arcadeHigh = G.arcade.score; saveGame(); } }
  function ending() {
    const me = byId(G.arcade.me);
    starBg('#0a1424', '#2a4a6a');
    R(7, 23, 114, 126, '#000'); vgradPanel(8, 24, '#2a4a8a', '#0a1424'); photoOr(me, 'big', 8, 24, 112, 124);
    drawCharAt(me, 64, 210, Poses.victory(me, G.t), 1, 'end', false, { kind: 'win' });
    T('PARABENS!', 250, 10, '#ffd400', { scale: 2, align: 'center', outline: '#000' });
    T(me.name + ' E O CAMPEAO DOS FIFIS', 250, 30, '#ffffff', { align: 'center' });
    const text = me.ending || '';
    const shown = text.slice(0, Math.floor(G.t / 2));
    Font.wrap(shown, 34).forEach((l, i) => T(l, 134, 50 + i * 10, '#e0e8ff'));
    T('PONTOS ' + G.arcade.score + (G.arcade.continues ? '   CONTINUES ' + G.arcade.continues : '   SEM CONTINUES!'), 250, 168, '#ffd400', { align: 'center' });
    if (G.t > text.length * 2 + 30 && (G.t >> 5) % 2) T('APERTE SOCO', 250, 196, '#ffffff', { align: 'center' });
    if (G.t > 60 && confirmKey()) {
      if (shown.length < text.length) { G.t = text.length * 2 + 30; return; }
      recordHigh(); G.afterCredits = 'title'; go('credits'); Sound.playMusic('ending');
    }
  }

  // ---------- TELA VS ----------
  function vs() {
    const a = byId(G.picks[0]), b = byId(G.picks[1]);
    const k = Math.min(1, G.t / 20);
    R(0, 0, W, H, '#000');
    ctx.save();
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(W / 2 + 20, 0); ctx.lineTo(W / 2 - 20, H); ctx.lineTo(0, H); ctx.closePath();
    ctx.fillStyle = '#8a1020'; ctx.fill(); ctx.restore();
    ctx.save();
    ctx.beginPath(); ctx.moveTo(W, 0); ctx.lineTo(W / 2 + 24, 0); ctx.lineTo(W / 2 - 16, H); ctx.lineTo(W, H); ctx.closePath();
    ctx.fillStyle = '#10308a'; ctx.fill(); ctx.restore();
    for (let i = 0; i < 20; i++) R((i * 41 + G.t * 6) % W, (i * 23) % H, 18, 1, 'rgba(255,255,255,0.2)');
    const ax = -120 + k * 128, bx = W + 4 - k * 128;
    R(ax - 1, 17, 114, 126, '#000'); vgradPanel(ax, 18, '#5a1424', '#1a0408'); photoOr(a, 'big', ax, 18, 112, 124);
    R(bx - 1, 17, 114, 126, '#000'); vgradPanel(bx, 18, '#14245a', '#04081a'); photoOr(b, 'big', bx, 18, 112, 124);
    T(a.name, 60, 148, '#ffffff', { scale: 2, align: 'center', outline: '#000' });
    T(b.name, W - 60, 148, '#ffffff', { scale: 2, align: 'center', outline: '#000' });
    if (G.t > 20) T('VS', W / 2, 64, (G.t >> 2) % 2 ? '#ffd400' : '#ff7a1a', { scale: 5, align: 'center', outline: '#000' });
    if (G.mode === 'arcade') T('LUTA ' + (G.arcade.idx + 1), W / 2, 34, '#ffffff', { align: 'center', outline: '#000' });
    if (G.t <= 1 || !G.vsLines) G.vsLines = [line(a, b, 'intro'), line(b, a, 'intro')];
    if (G.t > 35) {
      Font.wrap('"' + G.vsLines[0] + '"', 30).forEach((l, i) => T(l, 6, 166 + i * 9, '#ffe0e0', { shadow: '#000' }));
      Font.wrap('"' + G.vsLines[1] + '"', 30).forEach((l, i) => T(l, W - 6, 184 + i * 9, '#e0e8ff', { shadow: '#000', align: 'right' }));
    }
    T(G.stage.name, W / 2, 206, '#aaaaaa', { align: 'center' });
    if (G.t === 1) Sound.play('announcer', 'round');
    if (G.t > 200 || (G.t > 30 && confirmKey())) startMatch();
  }

  // ---------- LUTA ----------
  function startMatch() {
    Stages.use(G.stage);
    const a = byId(G.picks[0]), b = byId(G.picks[1]);
    let c2;
    if (G.mode === '2p' || (G.mode === 'story' && window.Story && Story.twoPlayer)) c2 = new HumanCtrl(1);
    else if (G.mode === 'arcade') c2 = new AICtrl(arcadeLevel());
    else c2 = new AICtrl(G.opts.difficulty);
    G.fighters = [new Fighter(a, 0, new HumanCtrl(0)), new Fighter(b, 1, c2)];
    G.fighters.forEach(f => { f.meter = 0; f.perfects = 0; });
    if (RM()) { RM().setInfo(0, a.name); RM().setInfo(1, G.mode === '2p' || (G.mode === 'story' && Story.twoPlayer) ? b.name : 'CPU JOGANDO'); }
    if (a.id === b.id) G.fighters[1].alt = true;
    G.training = G.mode === 'training' ? (G.training || { dummy: 'stand', meter: 'inf', regen: true, hitboxes: false, inputs: true }) : null;
    if (G.training) { G.training.noKO = true; G.training.lastDmg = 0; G.training.comboDmg = 0; G.training.combo = 0; G.training.maxCombo = 0; G.inputLog = []; applyDummy(); }
    G.wins = [0, 0]; G.round = 1;
    G.spectators = CH.filter(c => c.id !== a.id && c.id !== b.id);
    if (G.mode === 'story' && window.Story) Story.onMatchStart(G);
    G.specCanvas = G.spectators.map(() => Sprites.newCanvas());
    go('fight');
    Sound.playMusic(G.stage.music);
    startRound();
  }
  function applyDummy() {
    const c = G.fighters[1].ctrl;
    c.dummy = G.training.dummy === 'cpu' ? null : G.training.dummy;
  }
  function startRound() {
    G.fighters.forEach((f, i) => { const m = f.meter; f.reset(i); f.meter = m; f.state = G.round === 1 && !G.training ? 'intro' : 'idle'; f.st = 0; });
    G.entities = []; G.particles = []; G.timer = G.training || !G.opts.time ? Infinity : G.opts.time; G.timerF = 0;
    G.phase = 'intro'; G.phaseT = 0; G.fighting = false; G.freezeT = 0; G.shakeT = 0; G.superT = 0; G.flashT = 0;
    G.cam = Stages.WIDTH / 2 - W / 2; G.koSlow = 0; G.combos = [null, null]; G.winner = null; G.paused = false; G.firstAttack = null;
    if (G.training) { G.phase = 'fight'; G.fighting = true; }
  }
  G.other = f => G.fighters[0] === f ? G.fighters[1] : G.fighters[0];
  G.spawn = e => G.entities.push(e);
  G.freeze = n => { G.freezeT = Math.max(G.freezeT, n); };
  G.shake = n => { if (!G.opts.shake) return; G.shakeT = Math.max(G.shakeT, n * 3); G.shakeAmt = n; };
  G.flash = c => { G.flashT = 6; G.flashCol = c; };
  G.superFlash = (f, def) => { G.superT = 36; G.superOwner = f; G.superDef = def; };
  G.comboText = (f, n, dmg) => { G.combos[G.fighters.indexOf(f)] = { n, dmg, t: 0 }; };
  G.onHit = (att, def, dmg) => {
    if (!G.training) return;
    const tr = G.training;
    tr.lastDmg = dmg; tr.combo = att.combo; tr.comboDmg = att.comboDmg; tr.maxCombo = Math.max(tr.maxCombo, att.combo);
  };
  const FX_PART = { hit: 'spark', hitBig: 'spark', block: 'blockspark', poof: 'dust', dust: 'dust' };
  G.particle = (x, y, type) => {
    const spr = FX_PART[type], useSpr = spr && window.FX && FX.ready(spr);
    if (useSpr) G.particles.push({ x, y: type === 'dust' ? y - 4 : y, type: 'fx', name: spr, t: 0, vx: 0, vy: type === 'dust' ? -0.3 : 0, still: true, flip: Math.random() < 0.5,
      life: { hit: 12, hitBig: 14, block: 10, poof: 22, dust: 20 }[type], sc: { hit: 1.2, hitBig: 1.8, block: 1.2, poof: 1.5, dust: 0.6 }[type] });
    if (useSpr && type === 'dust') return;
    const n = useSpr ? { hit: 3, hitBig: 6, block: 2, poof: 3 }[type] : ({ hit: 6, hitBig: 10, block: 5, dust: 1, pop: 5, heal: 8, heart: 1, poof: 8, trash: 1 }[type] || 3);
    for (let i = 0; i < n; i++) G.particles.push({ x, y, type, t: 0, vx: (Math.random() - 0.5) * (type === 'dust' ? 0.5 : 4), vy: (Math.random() - 0.7) * (type === 'heart' ? 1 : 4), life: type === 'heart' || type === 'trash' ? 50 : 18 });
  };
  G.onKO = (loser, winner) => {
    if (G.phase === 'ko') return;
    G.storyCut = !!(window.Story && Story.cutOnKO(loser));
    G.fighting = false; G.phase = 'ko'; G.phaseT = 0; G.koSlow = 50;
    G.winner = winner; Sound.play('ko'); G.flash('#ffffff'); G.shake(6);
    G.perfect = winner.hp >= MAX_HP;
    if (G.perfect) winner.perfects++;
  };

  function fight() {
    const [a, b] = G.fighters;
    // pausa
    const pauseKey = Input.key('Escape') || anyStart() || (!G.paused && Input.key('Enter'));
    if (!G.paused && pauseKey && G.phase !== 'ko' && G.phase !== 'timeover') { G.paused = true; G.pause = { view: 'main', i: 0, tab: 0 }; Sound.play('select'); drawFight(); return; }
    if (G.paused) { drawFight(); drawPause(pauseKey); return; }
    if (G.training && Input.key('KeyR')) resetTrainingPos();

    G.phaseT++;
    let steps = 1;
    if (G.koSlow > 0) { G.koSlow--; steps = G.koSlow % 3 === 0 ? 1 : 0; }

    for (let s = 0; s < steps; s++) {
      G.time++;
      if (G.superT > 0) {
        G.superT--; // congela tudo, inclusive quem soltou o super (o golpe começa depois do corte)
        G.superOwner.anim++;
      } else if (G.freezeT > 0) {
        G.freezeT--;
      } else {
        a.update(G); b.update(G);
        if (G.mode === 'story' && window.Story) Story.fightTick(G);
        // os dois golpes são lidos antes de aplicar, para trocarem golpe no mesmo quadro
        const hits = [a, b].map(f => { const hb = f.activeHitbox(); return hb && overlap(hb, G.other(f).hurtbox()) ? [f, hb, f.move] : null; });
        hits.forEach(h => {
          if (!h) return;
          const [f, hb, m] = h, o = G.other(f);
          if (o.takeHit(G, f, hb) === 'miss') return;
          if (m && f.move === m) {
            if (m.normal || m.def.type === 'rising') m.hit = true;
            else { m.hits++; m.lastHitF = m.f - m.def.startup; }
          }
        });
        // empurrar corpos
        const dx = b.x - a.x;
        const solid = f => f.state !== 'ko' && f.state !== 'thrown' && f.state !== 'throw';
        if (Math.abs(dx) < 30 && Math.abs(a.y - b.y) < 50 && solid(a) && solid(b)) {
          const push = (30 - Math.abs(dx)) / 2 * (dx >= 0 ? 1 : -1);
          a.x -= push; b.x += push;
          if (a.x < 16) { b.x += 16 - a.x; a.x = 16; } if (b.x < 16) { a.x += 16 - b.x; b.x = 16; }
          if (a.x > Stages.WIDTH - 16) { b.x -= a.x - Stages.WIDTH + 16; a.x = Stages.WIDTH - 16; }
          if (b.x > Stages.WIDTH - 16) { a.x -= b.x - Stages.WIDTH + 16; b.x = Stages.WIDTH - 16; }
        }
        const maxD = W - 40;
        if (Math.abs(b.x - a.x) > maxD) {
          const mid = (a.x + b.x) / 2, sgn = b.x > a.x ? 1 : -1;
          a.x = mid - sgn * maxD / 2; b.x = mid + sgn * maxD / 2;
        }
        G.entities.forEach(e => e.update(G));
        const projs = G.entities.filter(e => e.kind === 'proj' && !e.dead && e.vx);
        for (let i = 0; i < projs.length; i++) for (let j = i + 1; j < projs.length; j++) {
          const p = projs[i], q = projs[j];
          if (p.owner !== q.owner && Math.abs(p.x - q.x) < 12 && Math.abs(p.y - q.y) < 14) { p.dead = q.dead = true; G.particle(p.x, p.y, 'poof'); Sound.play('block'); }
        }
        G.entities = G.entities.filter(e => !e.dead);
        if (G.fighting && isFinite(G.timer) && ++G.timerF >= 60) {
          G.timerF = 0; G.timer--;
          if (G.timer <= 0) timeOver();
        }
        if (G.training) trainingTick();
      }
    }
    G.particles.forEach(p => { p.t++; p.x += p.vx; p.y += p.vy; if (p.still) return; if (p.type !== 'heart' && p.type !== 'trash') p.vy += 0.2; else p.vy = -0.6; });
    G.particles = G.particles.filter(p => p.t < p.life);
    G.combos.forEach((c, i) => { if (c && ++c.t > 70) G.combos[i] = null; });
    const mid = (a.x + b.x) / 2;
    const target = Math.max(0, Math.min(Math.max(0, Stages.WIDTH - W), mid - W / 2));
    G.cam += (target - G.cam) * 0.15;

    phaseLogic();
    drawFight();
  }

  // ---------- TREINO ----------
  function trainingTick() {
    const tr = G.training;
    G.fighters.forEach(f => {
      if (tr.meter === 'inf') f.meter = 100;
      const busy = ['hit', 'airhit', 'knockdown', 'dizzy', 'thrown', 'getup'].includes(f.state);
      if (tr.regen && !busy && G.time - f.lastDmgT > 70 && f.hp < MAX_HP) f.hp = Math.min(MAX_HP, f.hp + 25);
    });
    // histórico de comandos do P1
    const c = G.fighters[0].ctrl;
    const dx = (c.held('right') ? 1 : 0) - (c.held('left') ? 1 : 0), dy = (c.held('down') ? 1 : 0) - (c.held('up') ? 1 : 0);
    const btn = ['punch', 'kick', 'power'].filter(b => c.pressed(b, 0)).map(b => ({ punch: 'S', kick: 'C', power: 'P' })[b]).join('');
    const key = dx + ',' + dy + btn;
    const log = G.inputLog, last = log[0];
    if (!last || last.key !== key || btn) log.unshift({ key, dx, dy, btn, n: 1 });
    else last.n++;
    if (log.length > 14) log.length = 14;
  }
  function resetTrainingPos() {
    G.fighters.forEach((f, i) => { const m = f.meter; f.reset(i); f.meter = m; });
    G.entities = []; G.cam = Stages.WIDTH / 2 - W / 2; Sound.play('select');
  }
  function drawTrainingHUD() {
    const tr = G.training;
    R(W / 2 - 92, 25, 184, 20, 'rgba(0,0,0,0.6)');
    T('DANO ' + tr.lastDmg + '   COMBO ' + tr.combo + ' (' + tr.comboDmg + ')   MAX ' + tr.maxCombo, W / 2, 28, '#ffffff', { align: 'center' });
    T('BONECO: ' + DUMMY_NAMES[tr.dummy] + '   R: RESETAR', W / 2, 37, '#9ff0ff', { align: 'center' });
    if (tr.inputs) {
      G.inputLog.forEach((e, i) => {
        const y = 48 + i * 9, a = 1 - i / 16;
        ctx.globalAlpha = a;
        R(4, y - 1, 46, 9, 'rgba(0,0,0,0.5)');
        T(String(Math.min(99, e.n)), 8, y, '#888');
        if (e.dx || e.dy) arrow(22, y - 0.5, e.dx, e.dy, '#ffffff'); else R(24, y + 2, 3, 3, '#666');
        if (e.btn) T(e.btn, 32, y, '#ffd400');
        ctx.globalAlpha = 1;
      });
    }
  }
  const DUMMY_NAMES = { stand: 'PARADO', crouch: 'AGACHADO', jump: 'PULANDO', block: 'DEFENDE TUDO', blockAfter: 'DEFENDE DEPOIS DO 1o', tech: 'ESCAPA DE AGARRAO', cpu: 'CPU' };

  function timeOver() {
    G.fighting = false; G.phase = 'timeover'; G.phaseT = 0;
    const [a, b] = G.fighters;
    G.winner = a.hp > b.hp ? a : (b.hp > a.hp ? b : null);
  }

  function phaseLogic() {
    if (G.training) return;
    const need = G.opts.rounds;
    if (G.phase === 'intro') {
      if (G.round === 1 && G.phaseT < 90) return;
      G.fighters.forEach(f => { if (f.state === 'intro') f.state = 'idle'; });
      G.phase = 'ready'; G.phaseT = 0; Sound.play('announcer', 'round');
    } else if (G.phase === 'ready') {
      if (G.phaseT === 70) Sound.play('announcer', 'fight');
      if (G.phaseT > 100) { G.phase = 'fight'; G.fighting = true; }
    } else if (G.phase === 'ko' || G.phase === 'timeover') {
      if (G.storyCut && G.phaseT > 34) { G.storyCut = false; G.wins[0] = need; endMatch(); return; }
      if (G.phaseT === 80 && G.winner) { G.winner.state = 'win'; G.winner.st = 0; G.winner.move = null; G.winner.vx = 0; }
      if (G.phaseT === 80 && G.winner) G.wins[G.fighters.indexOf(G.winner)]++;
      if (G.phaseT > 200) {
        if (G.wins[0] >= need || G.wins[1] >= need || G.round >= need * 2 + 1) endMatch();
        else { G.round++; startRound(); }
      }
    }
  }
  function endMatch() {
    G.matchWinner = G.wins[0] > G.wins[1] ? 0 : (G.wins[1] > G.wins[0] ? 1 : -1);
    if (G.mode === 'story' && window.Story) { Story.onMatchEnd(G.matchWinner); return; }
    if (G.matchWinner >= 0) {
      const wid = G.fighters[G.matchWinner].ch.id;
      if (G.mode !== 'arcade' || G.matchWinner === 0) { G.save.wins[wid] = (G.save.wins[wid] || 0) + 1; saveGame(); }
    }
    if (G.matchWinner >= 0) {
      const w = G.fighters[G.matchWinner].ch, l = G.fighters[1 - G.matchWinner].ch;
      G.winQuote = line(w, l, 'win'); G.loseQuote = line(l, w, 'lose');
    } else { G.winQuote = 'Empate! Vamos culpar o PV.'; G.loseQuote = null; }
    if (G.mode === 'arcade' && G.matchWinner === 0) {
      const f = G.fighters[0];
      G.lastBonus = 10000 + f.hp * 10 + (isFinite(G.timer) ? G.timer * 100 : 0) + f.perfects * 20000 + f.rec.maxCombo * 500;
      G.arcade.score += G.lastBonus;
    }
    go('result'); Sound.playMusic('victory');
  }

  function drawFight() {
    const [a, b] = G.fighters;
    let sx = 0, sy = 0;
    if (G.shakeT > 0) { G.shakeT--; sx = (Math.random() - 0.5) * G.shakeAmt; sy = (Math.random() - 0.5) * G.shakeAmt; }
    ctx.save(); ctx.translate(Math.round(sx), Math.round(sy));
    const cam = Math.round(G.cam);
    R(0, 0, W, H, '#000');
    ctx.drawImage(Stages.bg(G.stage), cam, 0, Math.min(W, Stages.WIDTH), H, 0, 0, Math.min(W, Stages.WIDTH), H);
    ctx.save(); ctx.translate(-cam, 0); Stages.anim(G.stage, ctx, G.time);
    Stages.spectators(G.stage).forEach((sp, i) => {
      const ch = G.spectators[i % G.spectators.length]; if (!ch) return;
      const cv = G.specCanvas[i % G.specCanvas.length];
      const cheer = G.phase === 'ko' || (G.combos[0] && G.combos[0].n > 2) || (G.combos[1] && G.combos[1].n > 2);
      if (window.SheetSprites && SheetSprites.draw(ctx, ch, { kind: cheer ? 'win' : 'idle' }, G.time + i * 60, sp.x, sp.y, sp.x > Stages.WIDTH / 2 ? -1 : 1, sp.s, [24, 20, 44, 0.5])) return;
      if (G.time % 2 === 0) Sprites.render(cv, ch, cheer ? Poses.victory(ch, G.time) : Poses.idle(ch, G.time + i * 60), G.time, [24, 20, 44, 0.55]);
      const s = sp.s;
      ctx.save(); ctx.translate(sp.x, sp.y); if (sp.x > Stages.WIDTH / 2) ctx.scale(-1, 1);
      ctx.drawImage(cv, -Sprites.OX * s, -Sprites.OY * s, Sprites.SW * s, Sprites.SH * s); ctx.restore();
    });
    ctx.restore();
    if (G.superT > 0) R(0, 0, W, H, 'rgba(0,0,30,' + Math.min(0.6, G.superT / 20) + ')');
    const order = (a.state === 'attack' || a.state === 'special' || a.state === 'throw') ? [b, a] : [a, b];
    order.forEach(f => f.draw(ctx, cam));
    G.entities.forEach(e => {
      if (e.kind === 'beam' || (e.spriteReady && e.spriteReady())) { e.draw(ctx, cam); return; } // sprites já no tamanho final
      const px = Math.round(e.x - cam), py = Math.round(e.kind === 'summon' || e.kind === 'trap' ? GROUND : e.y);
      ctx.save(); ctx.translate(px, py); ctx.scale(1.4, 1.4); ctx.translate(-px, -py); e.draw(ctx, cam); ctx.restore();
    });
    drawParticles(cam);
    if (G.opts.hitboxes || (G.training && G.training.hitboxes)) drawHitboxes(cam);
    ctx.restore();
    if (G.superT > 0) drawSuperCutin();
    if (G.flashT > 0) { G.flashT--; R(0, 0, W, H, 'rgba(255,255,255,' + G.flashT / 8 + ')'); }
    drawHUD();
    if (G.training) drawTrainingHUD();
    drawAnnouncements();
  }
  function drawHitboxes(cam) {
    const box = (b, col) => { ctx.strokeStyle = col; ctx.lineWidth = 1; ctx.strokeRect(Math.round(b.x - cam) + 0.5, Math.round(b.y) + 0.5, Math.round(b.w), Math.round(b.h)); };
    G.fighters.forEach(f => {
      box(f.hurtbox(), f.inv > 0 ? '#ffffff' : '#3a9aff');
      const hb = f.activeHitbox(); if (hb) box(hb, '#ff3a3a');
    });
    G.entities.forEach(e => { if (e.kind === 'proj') box({ x: e.x - (e.w || 12) / 2, y: e.y - (e.h || 12) / 2, w: e.w || 12, h: e.h || 12 }, '#ff9a3a'); });
  }

  function drawParticles(cam) {
    G.particles.forEach(p => {
      const x = Math.round(p.x - cam), y = Math.round(p.y), k = 1 - p.t / p.life;
      switch (p.type) {
        case 'hit': case 'hitBig': {
          const s = p.type === 'hitBig' ? 3 : 2;
          R(x, y, s, s, k > 0.5 ? '#ffffff' : '#ffd400');
          if (p.t < 4) { R(x - 6, y, 12, 1, '#ffffff'); R(x, y - 6, 1, 12, '#ffffff'); }
          break;
        }
        case 'block': R(x, y, 2, 2, '#7ad0ff'); break;
        case 'dust': R(x, y - p.t / 3, 4 * k + 1, 3 * k + 1, 'rgba(200,180,140,' + k + ')'); break;
        case 'pop': R(x, y, 2, 2, '#ffffff'); break;
        case 'heal': R(x, y, 2, 2, '#66ff88'); R(x - 1, y + 1, 4, 0.5, '#66ff88'); break;
        case 'heart': heart(ctx, x, y); break;
        case 'poof': R(x - 2, y - 2, 4 + p.t / 3, 4 + p.t / 3, 'rgba(230,230,240,' + k + ')'); break;
        case 'trash': Font.text(ctx, 'X', x, y, '#ff6a6a', { outline: '#000' }); break;
        case 'fx': FX.draw(ctx, p.name, x, y, { scale: p.sc * (1 + 0.35 * p.t / p.life), alpha: Math.min(1, k * 2), flip: p.flip }); break;
      }
    });
  }

  function drawSuperCutin() {
    const f = G.superOwner, k = Math.min(1, (36 - G.superT) / 8);
    const y = 70;
    R(0, y, W, 50, 'rgba(0,0,0,0.75)');
    R(0, y, W, 2, '#ffd400'); R(0, y + 48, W, 2, '#ffd400');
    for (let i = 0; i < 12; i++) R((i * 37 + G.time * 10) % W, y + 6 + (i * 7) % 38, 20, 1, 'rgba(255,212,0,0.4)');
    const left = G.fighters.indexOf(f) === 0;
    const px = left ? -60 + k * 80 : W + 60 - k * 80 - 40;
    photoOr(f.ch, 'grid', px, y + 5, 36, 40);
    T(G.superDef.name, left ? 80 : W - 80, y + 14, '#ffd400', { scale: 2, align: left ? 'left' : 'right', outline: '#000' });
    T('SUPER!', left ? 80 : W - 80, y + 34, '#ffffff', { align: left ? 'left' : 'right' });
  }

  function drawHUD() {
    const [a, b] = G.fighters;
    const BW = 140, need = G.opts.rounds;
    [a, b].forEach((f, i) => {
      const x = i === 0 ? 33 : W - 33 - BW, y = 8;
      R(x - 1, y - 1, BW + 2, 10, '#000');
      R(x, y, BW, 8, '#5a0a0a');
      const lag = Math.max(0, f.dispHp / MAX_HP), cur = Math.max(0, f.hp / MAX_HP);
      const col = cur < 0.25 && (G.time >> 3) % 2 ? '#ff9a1a' : '#ffd400';
      if (i === 0) { R(x + BW * (1 - lag), y, BW * lag, 8, '#ff3a3a'); R(x + BW * (1 - cur), y, BW * cur, 8, col); }
      else { R(x, y, BW * lag, 8, '#ff3a3a'); R(x, y, BW * cur, 8, col); }
      R(x, y, BW, 2, 'rgba(255,255,255,0.35)');
      // barra de tontura
      if (f.stunMeter > 0) { const sw = BW * 0.5 * Math.min(1, f.stunMeter / 100); R(i === 0 ? x + BW - sw : x, y + 8, sw, 1, '#ff6aff'); }
      const pxx = i === 0 ? 2 : W - 29;
      R(pxx - 1, 1, 29, 32, '#000'); R(pxx, 2, 27, 30, i === 0 ? '#5a1a2a' : '#1a2a5a');
      const hurt = f.state === 'hit' || f.state === 'airhit' || f.state === 'ko' || f.state === 'dizzy';
      photoOr(f.rage && f.ch.id === 'belipe' ? Object.assign({}, f.ch, { id: 'belipe_bravo' }) : f.ch, 's', pxx, 2, 27, 30);
      if (hurt && (G.time >> 2) % 2) R(pxx, 2, 27, 30, 'rgba(255,40,40,0.35)');
      const tag = i === 0 ? '' : (G.mode === '2p' || (G.mode === 'story' && Story.twoPlayer) ? '' : (G.training ? ' (BONECO)' : ' (CPU)'));
      T((f.rage && f.storyLabel ? f.storyLabel : f.ch.name) + tag, i === 0 ? x : x + BW, y + 11, '#ffffff', { align: i === 0 ? 'left' : 'right', shadow: '#000' });
      if (!G.training) for (let w = 0; w < need; w++) {
        const wx = i === 0 ? x + BW - 8 - w * 9 : x + w * 9;
        R(wx, y + 11, 7, 7, '#000'); R(wx + 1, y + 12, 5, 5, G.wins[i] > w ? '#ffd400' : '#333');
      }
      const my = H - 12, mw = 90, mx = i === 0 ? 8 : W - 8 - mw;
      R(mx - 1, my - 1, mw + 2, 7, '#000'); R(mx, my, mw, 5, '#1a1a3a');
      const full = f.meter >= 100;
      R(i === 0 ? mx : mx + mw * (1 - f.meter / 100), my, mw * f.meter / 100, 5, full ? ((G.time >> 2) % 2 ? '#ffffff' : '#3af0ff') : '#2a8aff');
      T(full ? 'SUPER!' : 'SUPER', i === 0 ? mx + mw + 4 : mx - 4, my - 1, full ? '#ffd400' : '#888', { align: i === 0 ? 'left' : 'right', shadow: '#000' });
      const c = G.combos[i];
      if (c && c.n >= 2) {
        const cx = i === 0 ? 12 : W - 12, cy = G.training ? 160 : 60;
        T(c.n + ' HITS', cx, cy, (c.t >> 2) % 2 ? '#ffd400' : '#ff7a1a', { scale: 2, align: i === 0 ? 'left' : 'right', outline: '#000' });
        T((c.dmg || 0) + ' DE DANO', cx, cy + 17, '#ffffff', { align: i === 0 ? 'left' : 'right', outline: '#000' });
        if (c.n >= 4) T(['', '', '', '', 'COMBO!', 'INCRIVEL!', 'FIFI COMBO!', 'LENDARIO!'][Math.min(7, c.n)], cx, cy + 27, '#9ff0ff', { align: i === 0 ? 'left' : 'right', outline: '#000' });
      }
    });
    R(W / 2 - 13, 4, 26, 18, '#000');
    T(isFinite(G.timer) ? String(Math.max(0, G.timer)).padStart(2, '0') : '--', W / 2, 6, G.timer <= 10 ? '#ff4a4a' : '#ffd400', { scale: 2, align: 'center' });
    if (G.mode === 'arcade') T(String(G.arcade.score).padStart(7, '0'), W / 2, 24, '#ffffff', { align: 'center', shadow: '#000' });
  }

  function drawAnnouncements() {
    const t = G.phaseT;
    const big = (s, col, sc) => T(s, W / 2, 80, col, { scale: sc || 4, align: 'center', outline: '#000', shadow: '#5a0a0a' });
    if (G.phase === 'intro' && G.round === 1) T(G.stage.name, W / 2, 50, '#ffffff', { align: 'center', outline: '#000' });
    if (G.phase === 'ready') {
      const need = G.opts.rounds;
      const final = need > 1 && G.wins[0] === need - 1 && G.wins[1] === need - 1;
      if (t < 70) big(final ? 'ROUND FINAL' : 'ROUND ' + G.round, '#ffd400', final ? 3 : 4);
      else big('LUTEM!', (t >> 2) % 2 ? '#ff4a1a' : '#ffd400', 5);
    }
    if (G.phase === 'ko' && t < 140) {
      if (G.perfect && t > 60) big('PERFEITO!', (t >> 2) % 2 ? '#ff2a2a' : '#ffffff', 5);
      else if (!(window.FX && FX.draw(ctx, 'ko', W / 2, 92, { scale: t < 8 ? 1.7 - t * 0.0875 : 1 }))) big('K.O.', (t >> 2) % 2 ? '#ff2a2a' : '#ffffff', 5);
    }
    if (G.phase === 'timeover' && t < 80) big('TEMPO!', '#ffd400');
    if ((G.phase === 'ko' || G.phase === 'timeover') && t > 100) {
      const s = G.winner ? G.winner.ch.name + ' VENCEU!' : 'EMPATE!';
      T(s, W / 2, 110, '#ffffff', { scale: 2, align: 'center', outline: '#000' });
    }
  }

  // ---------- PAUSA ----------
  function drawPause(pauseKey) {
    const P = G.pause;
    const back = () => { P.view = 'main'; P.i = 0; };
    const resume = () => { G.paused = false; };
    if (P.view === 'moves') {
      const f = G.fighters[P.tab];
      drawMoveList(f.ch, '< ' + (P.tab === 0 ? 'P1' : 'P2') + ' >');
      if (navLeft() || navRight()) { P.tab = 1 - P.tab; Sound.play('move'); }
      if (backKey() || confirmKey() || pauseKey) { Sound.play('select'); back(); }
      return;
    }
    R(0, 0, W, H, 'rgba(0,0,0,0.55)');
    if (P.view === 'options') {
      panel(52, 30, 280, 132, 'OPCOES');
      runMenu(optionItems(back), P, W / 2, 46, { w: 256, lh: 12 });
      if (backKey() || pauseKey) { Sound.play('select'); back(); }
      return;
    }
    if (P.view === 'training') {
      const tr = G.training;
      panel(72, 40, 240, 110, 'AJUSTES DO TREINO');
      runMenu([
        { label: 'BONECO', value: () => DUMMY_NAMES[tr.dummy], change: d => { tr.dummy = cycle(Object.keys(DUMMY_NAMES), tr.dummy, d); applyDummy(); } },
        { label: 'BARRA SUPER', value: () => tr.meter === 'inf' ? 'INFINITA' : 'NORMAL', change: () => { tr.meter = tr.meter === 'inf' ? 'normal' : 'inf'; } },
        { label: 'VIDA REGENERA', value: () => yesNo(tr.regen), change: () => { tr.regen = !tr.regen; } },
        { label: 'HITBOXES', value: () => yesNo(tr.hitboxes), change: () => { tr.hitboxes = !tr.hitboxes; } },
        { label: 'COMANDOS NA TELA', value: () => yesNo(tr.inputs), change: () => { tr.inputs = !tr.inputs; } },
        { label: 'VOLTAR', act: back }
      ], P, W / 2, 56, { w: 216, lh: 13 });
      if (backKey() || pauseKey) { Sound.play('select'); back(); }
      return;
    }
    if (P.view === 'confirm') {
      panel(102, 70, 180, 60, 'SAIR PARA O MENU?');
      runMenu([
        { label: 'NAO, CONTINUAR', act: back },
        { label: 'SIM, SAIR', act: () => { G.paused = false; if (G.mode === 'arcade') recordHigh(); go('title'); } }
      ], P, W / 2, 92, { w: 140, lh: 13 });
      if (backKey()) { Sound.play('select'); back(); }
      return;
    }
    // menu principal da pausa
    const items = [
      { label: 'CONTINUAR', act: resume },
      { label: 'AJUSTES DO TREINO', act: () => { P.view = 'training'; P.i = 0; }, hidden: !G.training },
      { label: 'LISTA DE GOLPES', act: () => { P.view = 'moves'; P.tab = 0; } },
      { label: 'RESETAR POSICAO', act: () => { resetTrainingPos(); resume(); }, hidden: !G.training },
      { label: 'REINICIAR LUTA', act: () => { G.paused = false; startMatch(); }, hidden: !!G.training },
      { label: 'OPCOES', act: () => { P.view = 'options'; P.i = 0; } },
      { label: 'TROCAR PERSONAGENS', act: () => { G.paused = false; startSelect(); }, hidden: G.mode === 'arcade' || G.mode === 'story' },
      { label: 'SAIR PARA O MENU', act: () => { P.view = 'confirm'; P.i = 0; } }
    ];
    const n = items.filter(i => !i.hidden).length;
    panel(W / 2 - 90, 44, 180, n * 13 + 26, 'PAUSA');
    if (pauseKey) { Sound.play('select'); resume(); return; }
    runMenu(items, P, W / 2, 62, { w: 160, lh: 13 });
    T(MODE_NAMES[G.mode] + (G.mode === 'arcade' ? ' - LUTA ' + (G.arcade.idx + 1) : ''), W / 2, 44 + n * 13 + 30, '#8a80a8', { align: 'center', shadow: '#000' });
    if (pauseKey) { Sound.play('select'); resume(); }
  }

  // ---------- RESULTADO ----------
  function result() {
    starBg('#140a24', '#3a2a6a');
    const wi = G.matchWinner;
    if (wi >= 0) {
      const f = G.fighters[wi];
      R(7, 31, 114, 126, '#000'); vgradPanel(8, 32, '#4a2a6a', '#140a24'); photoOr(f.ch, 'big', 8, 32, 112, 124);
      drawCharAt(f.ch, 120, 208, Poses.victory(f.ch, G.t), 1, 'res', false, { kind: 'win' }, f.alt);
      const who = G.mode === 'arcade' ? (wi === 0 ? 'VOCE VENCEU!' : 'CPU VENCEU!') : f.ch.name + ' VENCEU!';
      T(who, W / 2 + 40, 8, '#ffd400', { scale: 2, align: 'center', outline: '#000' });
      R(140, 26, 236, 40, '#ffffff'); R(134, 40, 8, 6, '#ffffff');
      Font.wrap('"' + G.winQuote + '"', 37).slice(0, 3).forEach((l2, i) => T(l2, 146, 31 + i * 10, '#1a1a2a'));
      // o perdedor também fala
      const lo = G.fighters[1 - wi];
      if (G.loseQuote && G.t > 20) {
        photoOr(lo.ch, 's', 140, 146, 27, 30, false);
        Font.wrap(lo.ch.name + ': "' + G.loseQuote + '"', 33).slice(0, 2).forEach((l2, i) => T(l2, 172, 149 + i * 9, '#b8b0d0', { shadow: '#000' }));
      }
    } else {
      T('EMPATE!', W / 2, 20, '#ffd400', { scale: 3, align: 'center', outline: '#000' });
      T(G.winQuote, W / 2, 50, '#ffffff', { align: 'center' });
    }
    // estatísticas
    const [a, b] = G.fighters;
    const rows = [['GOLPES', 'hits'], ['DANO', 'dmg'], ['MAIOR COMBO', 'maxCombo'], ['ESPECIAIS', 'specials'], ['SUPERS', 'supers'], ['AGARROES', 'throws'], ['DEFESAS', 'blocks']];
    const sx = 140, sy = 72;
    R(sx, sy - 2, 236, rows.length * 9 + 12, 'rgba(0,0,0,0.5)');
    T(a.ch.name, sx + 150, sy, '#ff8a8a', { align: 'right' }); T(b.ch.name, sx + 230, sy, '#8ab8ff', { align: 'right' });
    rows.forEach(([l, k], i) => {
      const y = sy + 10 + i * 9, va = a.rec[k], vb = b.rec[k];
      T(l, sx + 4, y, '#c8c0dc');
      T(String(va), sx + 150, y, va > vb ? '#ffd400' : '#ffffff', { align: 'right' });
      T(String(vb), sx + 230, y, vb > va ? '#ffd400' : '#ffffff', { align: 'right' });
    });
    let items;
    if (G.mode === 'arcade') {
      if (wi === 0) {
        T('BONUS +' + G.lastBonus + '   TOTAL ' + G.arcade.score, W / 2 + 70, 180, '#ffd400', { align: 'center', shadow: '#000' });
        items = [{ label: 'CONTINUAR', act: () => { G.arcade.idx++; if (G.arcade.idx >= G.arcade.order.length) { const id = G.arcade.me; G.save.clears[id] = true; saveGame(); go('ending'); Sound.playMusic('ending'); } else go('ladder'); } }];
      } else items = [{ label: 'CONTINUAR', act: () => go('continue') }];
    } else {
      items = [
        { label: 'REVANCHE', act: () => go('vs') },
        { label: 'TROCAR PERSONAGENS', act: () => startSelect() },
        { label: 'TROCAR CENARIO', act: () => go('stage') },
        { label: 'MENU PRINCIPAL', act: () => go('title') }
      ];
    }
    if (G.t > 30) runMenu(items, G.menu, W / 2 + 70, G.mode === 'arcade' ? 194 : 168, { w: 150, lh: 12 });
  }

  // ---------- Laço principal ----------
  const SCENES = { story: () => { R(0, 0, W, H, '#000'); Story.scene(); }, storymenu: () => Story.menuScene(), phone, title, options, howto, moves, credits, select, stage: stageSel, ladder, continue: arcadeContinue, gameover, ending, vs, fight, result };
  let last = performance.now(), acc = 0;
  const STEP = 1000 / 60;
  let started = false;
  function frame(now) {
    acc += Math.min(100, now - last); last = now;
    while (acc >= STEP) {
      acc -= STEP;
      Input.poll();
      if (!started) splash();
      else {
        if (Input.key('KeyM')) Sound.toggleMute();
        if (Input.key('KeyF')) toggleFull();
        G.t++;
        SCENES[G.scene]();
        if (G.scene !== 'story' && window.Story) Story.hide();
      }
      drawToasts();
      Input.tick();
    }
    requestAnimationFrame(frame);
  }
  function splash() {
    G.t++;
    R(0, 0, W, H, '#000');
    logo(W / 2, 50, 4);
    if ((G.t >> 5) % 2) T('APERTE QUALQUER TECLA', W / 2, 140, '#ffffff', { align: 'center' });
    T('UM PRESENTE PARA OS FIFIS', W / 2, 196, '#555', { align: 'center' });
    drawPhoneQR(W - 6, H - 6, 2);
    if (Input.anyKey()) begin();
  }
  function begin() { if (started) return; started = true; Sound.init(); Sound.setVolumes(G.opts.music / 10, G.opts.sfx / 10); go('title'); }
  canvas.addEventListener('click', begin);
  // o áudio só pode começar num gesto do usuário (controle e ESC não contam)
  ['keydown', 'pointerdown', 'touchend'].forEach(ev => addEventListener(ev, () => { if (started) Sound.init(); }));
  // pausa automática ao trocar de aba ou janela
  const autoPause = () => { if (G.scene === 'fight' && !G.paused && G.phase !== 'ko' && G.phase !== 'timeover') { G.paused = true; G.pause = { view: 'main', i: 0, tab: 0 }; } };
  window.addEventListener('blur', autoPause);
  // celular caiu no meio da luta: pausa até ele voltar
  if (RM()) RM().onDrop = p => { if (p === 0 || G.mode === '2p') autoPause(); };
  function toggleFull() {
    try {
      if (!document.fullscreenElement) document.documentElement.requestFullscreen && document.documentElement.requestFullscreen().catch(() => {});
      else document.exitFullscreen && document.exitFullscreen();
    } catch (e) { /* tela cheia indisponível */ }
  }
  requestAnimationFrame(frame);
})();
