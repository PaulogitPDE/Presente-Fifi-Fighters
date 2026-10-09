// Fifi Fighters - cenas, HUD e laço principal
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

  // ---------- Escala da tela ----------
  function resize() {
    const s = Math.max(1, Math.min(window.innerWidth / W, window.innerHeight / H));
    const si = s >= 2 ? Math.floor(s) : s;
    canvas.style.width = Math.floor(W * si) + 'px';
    canvas.style.height = Math.floor(H * si) + 'px';
  }
  window.addEventListener('resize', resize); resize();

  const confirmKey = () => Input.key('Enter') || Input.key('Space') || Input.menuPressed(0, 'punch') || Input.menuPressed(1, 'punch');
  const backKey = () => Input.key('Escape') || Input.key('Backspace') || Input.menuPressed(0, 'kick') || Input.menuPressed(1, 'kick');
  const navUp = () => Input.menuPressed(0, 'up') || Input.menuPressed(1, 'up');
  const navDown = () => Input.menuPressed(0, 'down') || Input.menuPressed(1, 'down');
  const navLeft = () => Input.menuPressed(0, 'left') || Input.menuPressed(1, 'left');
  const navRight = () => Input.menuPressed(0, 'right') || Input.menuPressed(1, 'right');

  const G = {
    scene: 'title', t: 0, mode: '2p', difficulty: 2,
    picks: [null, null], stageIdx: 0,
    fighters: [], entities: [], particles: [], time: 0,
    menuIdx: 0
  };
  window.G = G;

  function go(scene) {
    G.scene = scene; G.t = 0; G.menuIdx = 0;
    if (scene === 'title') Sound.playMusic('title');
    if (scene === 'select' || scene === 'stage') Sound.playMusic('select');
  }

  // ---------- Fundo animado genérico ----------
  function starBg(col1, col2) {
    R(0, 0, W, H, col1);
    for (let i = 0; i < 40; i++) {
      const x = (i * 97 + G.t * (0.3 + (i % 3) * 0.3)) % W, y = (i * 53) % H;
      R(x, y, 2, 1, col2);
    }
  }
  const previewCanvases = {};
  function drawCharAt(ch, x, y, pose, scale, key, flip) {
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

  // ---------- TÍTULO ----------
  const TITLE_MENU = ['1 JOGADOR (VS CPU)', '2 JOGADORES', 'DIFICULDADE CPU', 'COMO JOGAR'];
  function title() {
    starBg('#140a24', '#3a2a6a');
    // faixa
    for (let i = 0; i < 8; i++) R(0, 196 + i * 2, W, 2, i % 2 ? '#22104a' : '#2a1458');
    // desfile de personagens
    CH.forEach((ch, i) => {
      const x = 30 + i * 46;
      drawCharAt(ch, x, 214, Poses.idle(ch, G.t + i * 40), 1, 'title' + ch.id, i >= 4);
    });
    logo(W / 2, 10, 4);
    T('O JOGO DE LUTA DOS FIFIS', W / 2, 80, '#9ff0ff', { align: 'center', shadow: '#000' });
    TITLE_MENU.forEach((m, i) => {
      let label = m;
      if (i === 2) label = 'CPU: ' + ['', 'FACIL', 'NORMAL', 'DIFICIL'][G.difficulty];
      const sel = G.menuIdx === i;
      T((sel ? '> ' : '  ') + label, W / 2 - 60, 94 + i * 10, sel ? '#ffd400' : '#cccccc', { shadow: '#000' });
    });
    if ((G.t >> 5) % 2) T('ENTER / V / 1 PARA ESCOLHER', W / 2, 136, '#ffffff', { align: 'center' });
    T('M: SOM  F: TELA CHEIA', W - 4, 4, '#6a5a9a', { align: 'right' });
    if (navUp()) { G.menuIdx = (G.menuIdx + TITLE_MENU.length - 1) % TITLE_MENU.length; Sound.play('move'); }
    if (navDown()) { G.menuIdx = (G.menuIdx + 1) % TITLE_MENU.length; Sound.play('move'); }
    if (G.menuIdx === 2 && (navLeft() || navRight())) { G.difficulty = navLeft() ? Math.max(1, G.difficulty - 1) : Math.min(3, G.difficulty + 1); Sound.play('move'); }
    if (confirmKey()) {
      Sound.play('confirm');
      if (G.menuIdx === 0) { G.mode = '1p'; startSelect(); }
      else if (G.menuIdx === 1) { G.mode = '2p'; startSelect(); }
      else if (G.menuIdx === 2) { G.difficulty = G.difficulty % 3 + 1; }
      else go('howto');
    }
  }

  // ---------- COMO JOGAR ----------
  function howto() {
    starBg('#0e1428', '#2a3a6a');
    T('COMO JOGAR', W / 2, 8, '#ffd400', { scale: 2, align: 'center', shadow: '#000' });
    const L = [
      ['', 'JOGADOR 1', 'JOGADOR 2'],
      ['ANDAR', 'A / D', 'SETAS < >'],
      ['PULAR', 'W', 'SETA CIMA'],
      ['AGACHAR', 'S', 'SETA BAIXO'],
      ['SOCO', 'V', '1'],
      ['CHUTE', 'B', '2'],
      ['PODER', 'N', '3'],
      ['DEFENDER', 'TRAS', 'TRAS']
    ];
    L.forEach((r, i) => {
      const c = i === 0 ? '#9ff0ff' : '#ffffff';
      T(r[0], 40, 34 + i * 11, '#ffd400'); T(r[1], 170, 34 + i * 11, c, { align: 'center' }); T(r[2], 300, 34 + i * 11, c, { align: 'center' });
    });
    const S = [
      'PODER             = ESPECIAL 1',
      'FRENTE + PODER    = ESPECIAL 2',
      'BAIXO + PODER     = ESPECIAL 3',
      'SOCO + PODER      = SUPER (BARRA CHEIA)',
      'ACERTE SOCO/CHUTE E APERTE PODER = COMBO!',
      'AGACHADO + CHUTE  = RASTEIRA'
    ];
    S.forEach((s, i) => T(s, 40, 128 + i * 11, i === 3 ? '#ffd400' : '#cccccc'));
    if ((G.t >> 5) % 2) T('APERTE ENTER PARA VOLTAR', W / 2, 202, '#ffffff', { align: 'center' });
    if (confirmKey() || backKey()) { Sound.play('select'); go('title'); }
  }

  // ---------- SELEÇÃO DE PERSONAGENS ----------
  const GRID_X = 104, GRID_Y = 20, BOX_W = 44, BOX_H = 46;
  function startSelect() {
    G.cursor = [0, 1]; G.locked = [false, false]; G.lastHover = 0; G.selPhase = 0;
    go('select');
  }
  function select() {
    starBg('#1a0a14', '#4a1a2a');
    T('ESCOLHA SEU FIFI', W / 2, 4, '#ffd400', { align: 'center', shadow: '#000' });
    // grade
    CH.forEach((ch, i) => {
      const gx = GRID_X + (i % 4) * BOX_W, gy = GRID_Y + Math.floor(i / 4) * BOX_H;
      R(gx, gy, BOX_W - 2, BOX_H - 2, '#2a1a3a'); R(gx + 1, gy + 1, BOX_W - 4, BOX_H - 4, i % 2 ? '#3a2a5a' : '#45305f');
      const sel = G.cursor.map((c, p) => c === i && (p === 0 || G.mode === '2p' || G.selPhase === 1));
      const hurt = (sel[0] && G.locked[0]) || (sel[1] && G.locked[1]);
      ctx.drawImage(Sprites.portrait(ch, hurt ? 'happy' : (G.t % 150 < 6 ? 'blink' : 'normal')), gx + 1, gy - 1, 40, 44);
      R(gx + 1, gy + BOX_H - 12, BOX_W - 4, 9, 'rgba(0,0,0,0.6)');
      T(ch.name, gx + BOX_W / 2 - 1, gy + BOX_H - 11, '#ffffff', { align: 'center' });
    });
    // cursores
    const cursorCol = ['#ff3a3a', '#3a8aff'];
    [0, 1].forEach(p => {
      if (p === 1 && G.mode === '1p' && G.selPhase === 0) return;
      const i = G.cursor[p];
      const gx = GRID_X + (i % 4) * BOX_W, gy = GRID_Y + Math.floor(i / 4) * BOX_H;
      const blink = G.locked[p] || (G.t >> 3) % 2;
      if (blink) {
        ctx.strokeStyle = cursorCol[p]; ctx.lineWidth = 2;
        ctx.strokeRect(gx + 0.5 + p, gy + 0.5 + p, BOX_W - 3 - p * 2, BOX_H - 3 - p * 2);
      }
      const label = p === 0 ? '1P' : (G.mode === '1p' ? 'CPU' : '2P');
      T(label, p === 0 ? gx + 2 : gx + BOX_W - 4, gy + 2, cursorCol[p], { align: p === 0 ? 'left' : 'right', outline: '#000' });
    });
    // prévias laterais
    [0, 1].forEach(p => {
      if (p === 1 && G.mode === '1p' && G.selPhase === 0) { T('CPU', 340, 90, '#555', { scale: 2, align: 'center' }); return; }
      const ch = CH[G.cursor[p]];
      const x = p === 0 ? 50 : 334;
      const pose = G.locked[p] ? Poses.victory(ch, G.t - G.lockT[p]) : Poses.idle(ch, G.t);
      drawCharAt(ch, x, 212, pose, 2, 'sel' + p, p === 1);
      T(ch.name, x, 22, cursorCol[p] === '#ff3a3a' ? '#ff7a7a' : '#7ab0ff', { scale: 2, align: 'center', outline: '#000' });
      T(ch.title, x, 40, '#ffffff', { align: 'center', outline: '#000' });
      if (G.locked[p]) T('OK!', x, 52, '#ffd400', { align: 'center', outline: '#000' });
    });
    // info do personagem
    const ch = CH[G.cursor[G.lastHover]];
    R(GRID_X - 2, 116, 180, 98, 'rgba(10,5,20,0.85)');
    T(ch.name + ' - ' + ch.title, GRID_X + 2, 119, '#ffd400');
    Font.wrap(ch.desc, 29).slice(0, 3).forEach((l, i) => T(l, GRID_X + 2, 129 + i * 8, '#cccccc'));
    const sp = ch.specials;
    [sp.n, sp.fwd, sp.down, sp.super].forEach((d, i) => {
      const key = ['P', 'FRT+P', 'BX+P', 'S+P'][i];
      T(key, GRID_X + 2, 154 + i * 10, i === 3 ? '#ffd400' : '#9ff0ff');
      T(d.name.slice(0, 23), GRID_X + 36, 154 + i * 10, i === 3 ? '#ffd400' : '#ffffff');
    });
    T('P=PODER  S=SOCO  CHUTE: VOLTA', GRID_X + 2, 200, '#777');

    // controles
    const players = G.mode === '2p' ? [0, 1] : [0];
    players.forEach(p => {
      if (G.locked[p] && !(G.mode === '1p' && G.selPhase === 1)) {
        if (Input.menuPressed(p, 'kick')) { G.locked[p] = false; Sound.play('move'); }
        return;
      }
      const cp = (G.mode === '1p' && G.selPhase === 1) ? 1 : p;
      if (G.mode === '1p' && G.selPhase === 1 && Input.menuPressed(0, 'kick')) { G.selPhase = 0; G.locked[0] = false; Sound.play('move'); return; }
      let c = G.cursor[cp];
      if (Input.menuPressed(p, 'left')) c = (c % 4 === 0) ? c + 3 : c - 1;
      if (Input.menuPressed(p, 'right')) c = (c % 4 === 3) ? c - 3 : c + 1;
      if (Input.menuPressed(p, 'up') || Input.menuPressed(p, 'down')) c = (c + 4) % 8;
      if (c !== G.cursor[cp]) { G.cursor[cp] = c; G.lastHover = cp; Sound.play('move'); }
      const ok = Input.menuPressed(p, 'punch') || Input.menuPressed(p, 'power') || (p === 0 && (Input.key('Enter') || Input.key('Space')));
      if (ok) {
        G.locked[cp] = true; G.lockT = G.lockT || [0, 0]; G.lockT[cp] = G.t; Sound.play('confirm');
        if (G.mode === '1p' && G.selPhase === 0) { G.selPhase = 1; G.lastHover = 1; }
      }
    });
    if (G.mode === '2p' && Input.key('Enter') && !G.locked[1] && G.locked[0]) { /* enter só confirma P1 */ }
    if (Input.key('Escape')) { go('title'); return; }
    if (G.locked[0] && G.locked[1]) {
      G.readyT = (G.readyT || 0) + 1;
      if (G.readyT > 40) { G.readyT = 0; G.picks = [CH[G.cursor[0]].id, CH[G.cursor[1]].id]; G.stageIdx = 0; go('stage'); }
    }
  }

  // ---------- SELEÇÃO DE CENÁRIO ----------
  function stageSel() {
    const n = Stages.list.length;
    const idx = G.stageIdx;
    if (idx < n) {
      const st = Stages.list[idx];
      ctx.drawImage(Stages.bg(st), 96, 0, W, H, 0, 0, W, H);
      ctx.save(); ctx.translate(-96, 0); st.anim(ctx, G.t); ctx.restore();
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
      go('vs');
    }
    if (Input.key('Escape') || Input.menuPressed(0, 'kick') || Input.menuPressed(1, 'kick')) { startSelect(); }
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
    ctx.drawImage(Sprites.portrait(a, 'normal'), -100 + k * 130, 30, 80, 88);
    ctx.save(); ctx.translate(W + 100 - k * 130, 30); ctx.scale(-1, 1); ctx.drawImage(Sprites.portrait(b, 'normal'), 0, 0, 80, 88); ctx.restore();
    T(a.name, 70, 124, '#ffffff', { scale: 2, align: 'center', outline: '#000' });
    T(b.name, W - 70, 124, '#ffffff', { scale: 2, align: 'center', outline: '#000' });
    if (G.t > 20) T('VS', W / 2, 60, (G.t >> 2) % 2 ? '#ffd400' : '#ff7a1a', { scale: 5, align: 'center', outline: '#000' });
    if (G.t > 35) {
      Font.wrap('"' + a.intro + '"', 26).forEach((l, i) => T(l, 8, 146 + i * 9, '#ffe0e0', { shadow: '#000' }));
      Font.wrap('"' + b.intro + '"', 26).forEach((l, i) => T(l, W - 8, 170 + i * 9, '#e0e8ff', { shadow: '#000', align: 'right' }));
    }
    T(G.stage.name, W / 2, 206, '#aaaaaa', { align: 'center' });
    if (G.t === 1) Sound.play('announcer', 'round');
    if (G.t > 200 || (G.t > 30 && confirmKey())) startMatch();
  }

  // ---------- LUTA ----------
  function startMatch() {
    const a = byId(G.picks[0]), b = byId(G.picks[1]);
    const c2 = G.mode === '1p' ? new AICtrl(G.difficulty) : new HumanCtrl(1);
    G.fighters = [new Fighter(a, 0, new HumanCtrl(0)), new Fighter(b, 1, c2)];
    G.fighters.forEach(f => f.meter = 0);
    G.wins = [0, 0]; G.round = 1;
    G.spectators = CH.filter(c => c.id !== a.id && c.id !== b.id);
    G.specCanvas = G.spectators.map(() => Sprites.newCanvas());
    go('fight');
    Sound.playMusic(G.stage.music);
    startRound();
  }
  function startRound() {
    G.fighters.forEach((f, i) => { const m = f.meter; f.reset(i); f.meter = m; f.state = G.round === 1 ? 'intro' : 'idle'; f.st = 0; });
    G.entities = []; G.particles = []; G.timer = 99; G.timerF = 0;
    G.phase = 'intro'; G.phaseT = 0; G.fighting = false; G.freezeT = 0; G.shakeT = 0; G.superT = 0; G.flashT = 0;
    G.cam = 288 - W / 2; G.koSlow = 0; G.combos = [null, null]; G.winner = null; G.paused = false;
  }
  G.other = f => G.fighters[0] === f ? G.fighters[1] : G.fighters[0];
  G.spawn = e => G.entities.push(e);
  G.freeze = n => { G.freezeT = Math.max(G.freezeT, n); };
  G.shake = n => { G.shakeT = Math.max(G.shakeT, n * 3); G.shakeAmt = n; };
  G.flash = c => { G.flashT = 6; G.flashCol = c; };
  G.superFlash = (f, def) => { G.superT = 36; G.superOwner = f; G.superDef = def; };
  G.comboText = (f, n) => { G.combos[G.fighters.indexOf(f)] = { n, t: 0 }; };
  G.particle = (x, y, type) => {
    const n = { hit: 6, hitBig: 10, block: 5, dust: 1, pop: 5, heal: 8, heart: 1, poof: 8, trash: 1 }[type] || 3;
    for (let i = 0; i < n; i++) G.particles.push({ x, y, type, t: 0, vx: (Math.random() - 0.5) * (type === 'dust' ? 0.5 : 4), vy: (Math.random() - 0.7) * (type === 'heart' ? 1 : 4), life: type === 'heart' || type === 'trash' ? 50 : 18 });
  };
  G.onKO = (loser, winner) => {
    G.fighting = false; G.phase = 'ko'; G.phaseT = 0; G.koSlow = 50;
    G.winner = winner; Sound.play('ko'); G.flash('#ffffff'); G.shake(6);
    G.perfect = winner.hp >= MAX_HP;
  };

  function fight() {
    const [a, b] = G.fighters;
    // pausa
    if (Input.key('Escape') || (Input.key('Enter') && G.fighting)) { G.paused = !G.paused; G.menuIdx = 0; Sound.play('select'); }
    if (G.paused) { drawFight(); drawPause(); return; }

    G.phaseT++;
    let steps = 1;
    if (G.koSlow > 0) { G.koSlow--; steps = G.koSlow % 3 === 0 ? 1 : 0; }

    for (let s = 0; s < steps; s++) {
      G.time++;
      if (G.superT > 0) {
        G.superT--;
        G.superOwner.update(G);
      } else if (G.freezeT > 0) {
        G.freezeT--;
      } else {
        a.update(G); b.update(G);
        // colisões de golpes
        [a, b].forEach(f => {
          const hb = f.activeHitbox();
          if (!hb) return;
          const o = G.other(f);
          if (overlap(hb, o.hurtbox())) {
            const m = f.move;
            const r = o.takeHit(G, f, hb);
            if (m && f.move === m) {
              if (m.normal || m.def.type === 'rising') m.hit = true;
              else { m.hits++; m.lastHitF = m.f - m.def.startup; }
            }
          }
        });
        // empurrar corpos
        const dx = b.x - a.x;
        if (Math.abs(dx) < 22 && Math.abs(a.y - b.y) < 40 && a.state !== 'ko' && b.state !== 'ko') {
          const push = (22 - Math.abs(dx)) / 2 * (dx >= 0 ? 1 : -1);
          a.x -= push; b.x += push;
          if (a.x < 16) { b.x += 16 - a.x; a.x = 16; } if (b.x < 16) { a.x += 16 - b.x; b.x = 16; }
          if (a.x > Stages.WIDTH - 16) { b.x -= a.x - Stages.WIDTH + 16; a.x = Stages.WIDTH - 16; }
          if (b.x > Stages.WIDTH - 16) { a.x -= b.x - Stages.WIDTH + 16; b.x = Stages.WIDTH - 16; }
        }
        // distância máxima (tela)
        const maxD = W - 40;
        if (Math.abs(b.x - a.x) > maxD) {
          const mid = (a.x + b.x) / 2, sgn = b.x > a.x ? 1 : -1;
          a.x = mid - sgn * maxD / 2; b.x = mid + sgn * maxD / 2;
        }
        // entidades
        G.entities.forEach(e => e.update(G));
        // choque de projéteis
        const projs = G.entities.filter(e => e.kind === 'proj' && !e.dead && e.vx);
        for (let i = 0; i < projs.length; i++) for (let j = i + 1; j < projs.length; j++) {
          const p = projs[i], q = projs[j];
          if (p.owner !== q.owner && Math.abs(p.x - q.x) < 12 && Math.abs(p.y - q.y) < 14) { p.dead = q.dead = true; G.particle(p.x, p.y, 'poof'); Sound.play('block'); }
        }
        G.entities = G.entities.filter(e => !e.dead);
        // tempo
        if (G.fighting && ++G.timerF >= 60) {
          G.timerF = 0; G.timer--;
          if (G.timer <= 0) timeOver();
        }
      }
    }
    // partículas
    G.particles.forEach(p => { p.t++; p.x += p.vx; p.y += p.vy; if (p.type !== 'heart' && p.type !== 'trash') p.vy += 0.2; else p.vy = -0.6; });
    G.particles = G.particles.filter(p => p.t < p.life);
    G.combos.forEach((c, i) => { if (c && ++c.t > 70) G.combos[i] = null; });
    // câmera
    const mid = (a.x + b.x) / 2;
    const target = Math.max(0, Math.min(Stages.WIDTH - W, mid - W / 2));
    G.cam += (target - G.cam) * 0.15;

    phaseLogic();
    drawFight();
  }

  function timeOver() {
    G.fighting = false; G.phase = 'timeover'; G.phaseT = 0;
    const [a, b] = G.fighters;
    G.winner = a.hp > b.hp ? a : (b.hp > a.hp ? b : null);
  }

  function phaseLogic() {
    const [a, b] = G.fighters;
    if (G.phase === 'intro') {
      if (G.round === 1 && G.phaseT < 90) return;
      G.fighters.forEach(f => { if (f.state === 'intro') { f.state = 'idle'; } });
      G.phase = 'ready'; G.phaseT = 0; Sound.play('announcer', 'round');
    } else if (G.phase === 'ready') {
      if (G.phaseT === 70) Sound.play('announcer', 'fight');
      if (G.phaseT > 100) { G.phase = 'fight'; G.fighting = true; }
    } else if (G.phase === 'ko' || G.phase === 'timeover') {
      if (G.phaseT === 80 && G.winner) { G.winner.state = 'win'; G.winner.st = 0; G.winner.move = null; G.winner.vx = 0; }
      if (G.phaseT === 80) {
        if (G.winner) G.wins[G.fighters.indexOf(G.winner)]++;
      }
      if (G.phaseT > 200) {
        if (G.wins[0] >= 2 || G.wins[1] >= 2 || G.round >= 5) {
          G.matchWinner = G.wins[0] > G.wins[1] ? 0 : (G.wins[1] > G.wins[0] ? 1 : -1);
          go('result'); Sound.playMusic('victory');
          G.winQuote = G.matchWinner >= 0 ? pick(G.fighters[G.matchWinner].ch.win) : 'Empate! Vamos culpar o PV.';
        } else { G.round++; startRound(); }
      }
    }
  }
  const pick = arr => arr[Math.random() * arr.length | 0];

  function drawFight() {
    const [a, b] = G.fighters;
    let sx = 0, sy = 0;
    if (G.shakeT > 0) { G.shakeT--; sx = (Math.random() - 0.5) * G.shakeAmt; sy = (Math.random() - 0.5) * G.shakeAmt; }
    ctx.save(); ctx.translate(Math.round(sx), Math.round(sy));
    const cam = Math.round(G.cam);
    ctx.drawImage(Stages.bg(G.stage), cam, 0, W, H, 0, 0, W, H);
    ctx.save(); ctx.translate(-cam, 0); G.stage.anim(ctx, G.time);
    // torcida (amigos que não estão lutando)
    (G.stage.spectators || []).forEach((sp, i) => {
      const ch = G.spectators[i % G.spectators.length]; if (!ch) return;
      const cv = G.specCanvas[i % G.specCanvas.length];
      const cheer = G.phase === 'ko' || (G.combos[0] && G.combos[0].n > 2) || (G.combos[1] && G.combos[1].n > 2);
      if (G.time % 2 === 0) Sprites.render(cv, ch, cheer ? Poses.victory(ch, G.time) : Poses.idle(ch, G.time + i * 60), G.time, [40, 40, 60]);
      const s = sp.s;
      ctx.save(); ctx.translate(sp.x, sp.y); if (sp.x > 288) ctx.scale(-1, 1);
      ctx.drawImage(cv, -Sprites.OX * s, -Sprites.OY * s, Sprites.SW * s, Sprites.SH * s); ctx.restore();
    });
    ctx.restore();
    if (G.superT > 0) { R(0, 0, W, H, 'rgba(0,0,30,' + Math.min(0.6, G.superT / 20) + ')'); }
    // lutadores (quem ataca fica na frente)
    const order = (a.state === 'attack' || a.state === 'special') ? [b, a] : [a, b];
    order.forEach(f => f.draw(ctx, cam));
    G.entities.forEach(e => e.draw(ctx, cam));
    drawParticles(cam);
    ctx.restore();
    if (G.superT > 0) drawSuperCutin();
    if (G.flashT > 0) { G.flashT--; R(0, 0, W, H, 'rgba(255,255,255,' + G.flashT / 8 + ')'); }
    drawHUD();
    drawAnnouncements();
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
    ctx.drawImage(Sprites.portrait(f.ch, 'shout'), px, y + 3, 40, 44);
    T(G.superDef.name, left ? 80 : W - 80, y + 14, '#ffd400', { scale: 2, align: left ? 'left' : 'right', outline: '#000' });
    T('SUPER!', left ? 80 : W - 80, y + 34, '#ffffff', { align: left ? 'left' : 'right' });
  }

  function drawHUD() {
    const [a, b] = G.fighters;
    const BW = 140;
    [a, b].forEach((f, i) => {
      const x = i === 0 ? 30 : W - 30 - BW, y = 8;
      R(x - 1, y - 1, BW + 2, 10, '#000');
      R(x, y, BW, 8, '#5a0a0a');
      const lag = Math.max(0, f.dispHp / MAX_HP), cur = Math.max(0, f.hp / MAX_HP);
      if (i === 0) { R(x + BW * (1 - lag), y, BW * lag, 8, '#ff3a3a'); R(x + BW * (1 - cur), y, BW * cur, 8, cur < 0.25 && (G.time >> 3) % 2 ? '#ff9a1a' : '#ffd400'); }
      else { R(x, y, BW * lag, 8, '#ff3a3a'); R(x, y, BW * cur, 8, cur < 0.25 && (G.time >> 3) % 2 ? '#ff9a1a' : '#ffd400'); }
      R(x, y, BW, 2, 'rgba(255,255,255,0.35)');
      // retrato
      const pxx = i === 0 ? 2 : W - 26;
      R(pxx - 1, 3, 26, 26, '#000'); R(pxx, 4, 24, 24, i === 0 ? '#5a1a2a' : '#1a2a5a');
      const hurt = f.state === 'hit' || f.state === 'airhit' || f.state === 'ko';
      ctx.save(); ctx.translate(pxx + (i === 0 ? 2 : 22), 4); if (i === 1) ctx.scale(-1, 1);
      ctx.drawImage(Sprites.portrait(f.ch, hurt ? 'hurt' : (f.state === 'win' ? 'happy' : 'normal')), 0, 0, 20, 22); ctx.restore();
      T(f.ch.name, i === 0 ? x : x + BW, y + 11, '#ffffff', { align: i === 0 ? 'left' : 'right', shadow: '#000' });
      // vitórias
      for (let w = 0; w < 2; w++) {
        const wx = i === 0 ? x + BW - 8 - w * 9 : x + w * 9;
        R(wx, y + 11, 7, 7, '#000'); R(wx + 1, y + 12, 5, 5, G.wins[i] > w ? '#ffd400' : '#333');
      }
      // barra de super
      const my = H - 12, mw = 90, mx = i === 0 ? 8 : W - 8 - mw;
      R(mx - 1, my - 1, mw + 2, 7, '#000'); R(mx, my, mw, 5, '#1a1a3a');
      const full = f.meter >= 100;
      R(i === 0 ? mx : mx + mw * (1 - f.meter / 100), my, mw * f.meter / 100, 5, full ? ((G.time >> 2) % 2 ? '#ffffff' : '#3af0ff') : '#2a8aff');
      T(full ? 'SUPER!' : 'SUPER', i === 0 ? mx + mw + 4 : mx - 4, my - 1, full ? '#ffd400' : '#888', { align: i === 0 ? 'left' : 'right', shadow: '#000' });
      // combo
      const c = G.combos[i];
      if (c && c.n >= 2) {
        const cx = i === 0 ? 12 : W - 12;
        T(c.n + ' HITS', cx, 60, (c.t >> 2) % 2 ? '#ffd400' : '#ff7a1a', { scale: 2, align: i === 0 ? 'left' : 'right', outline: '#000' });
        if (c.n >= 4) T(['', '', '', '', 'COMBO!', 'INCRIVEL!', 'FIFI COMBO!', 'LENDARIO!'][Math.min(7, c.n)], cx, 78, '#ffffff', { align: i === 0 ? 'left' : 'right', outline: '#000' });
      }
    });
    // timer
    R(W / 2 - 13, 4, 26, 18, '#000');
    T(String(Math.max(0, G.timer)).padStart(2, '0'), W / 2, 6, G.timer <= 10 ? '#ff4a4a' : '#ffd400', { scale: 2, align: 'center' });
  }

  function drawAnnouncements() {
    const t = G.phaseT;
    const big = (s, col, sc) => T(s, W / 2, 80, col, { scale: sc || 4, align: 'center', outline: '#000', shadow: '#5a0a0a' });
    if (G.phase === 'intro' && G.round === 1) {
      T(G.stage.name, W / 2, 50, '#ffffff', { align: 'center', outline: '#000' });
    }
    if (G.phase === 'ready') {
      if (t < 70) big('ROUND ' + G.round, '#ffd400');
      else big('LUTEM!', (t >> 2) % 2 ? '#ff4a1a' : '#ffd400', 5);
    }
    if (G.phase === 'ko' && t < 140) big(G.perfect && t > 60 ? 'PERFEITO!' : 'K.O.', (t >> 2) % 2 ? '#ff2a2a' : '#ffffff', 5);
    if (G.phase === 'timeover' && t < 80) big('TEMPO!', '#ffd400');
    if ((G.phase === 'ko' || G.phase === 'timeover') && t > 100) {
      const s = G.winner ? G.winner.ch.name + ' VENCEU!' : 'EMPATE!';
      T(s, W / 2, 110, '#ffffff', { scale: 2, align: 'center', outline: '#000' });
    }
  }

  function drawPause() {
    R(0, 0, W, H, 'rgba(0,0,0,0.6)');
    T('PAUSA', W / 2, 60, '#ffd400', { scale: 3, align: 'center', outline: '#000' });
    const items = ['CONTINUAR', 'SAIR PARA O MENU'];
    items.forEach((s, i) => T((G.menuIdx === i ? '> ' : '  ') + s, W / 2 - 50, 100 + i * 12, G.menuIdx === i ? '#ffd400' : '#ccc'));
    if (navUp() || navDown()) { G.menuIdx = 1 - G.menuIdx; Sound.play('move'); }
    if (Input.menuPressed(0, 'punch') || Input.menuPressed(1, 'punch') || Input.key('Space')) {
      Sound.play('select');
      if (G.menuIdx === 0) G.paused = false; else { G.paused = false; go('title'); }
    }
  }

  // ---------- RESULTADO ----------
  const RESULT_MENU = ['REVANCHE', 'TROCAR PERSONAGENS', 'TROCAR CENARIO', 'MENU PRINCIPAL'];
  function result() {
    starBg('#140a24', '#3a2a6a');
    const wi = G.matchWinner;
    if (wi >= 0) {
      const f = G.fighters[wi], l = G.fighters[1 - wi];
      drawCharAt(f.ch, 100, 196, Poses.victory(f.ch, G.t), 2, 'res');
      drawCharAt(l.ch, 300, 200, Poses.lying(), 1, 'resL');
      T(f.ch.name + ' VENCEU!', W / 2 + 40, 16, '#ffd400', { scale: 2, align: 'center', outline: '#000' });
      // balão
      R(176, 40, 200, 50, '#ffffff'); R(170, 56, 8, 6, '#ffffff'); R(178, 42, 196, 46, '#ffffff');
      Font.wrap('"' + G.winQuote + '"', 31).slice(0, 4).forEach((l2, i) => T(l2, 182, 46 + i * 10, '#1a1a2a'));
    } else {
      T('EMPATE!', W / 2, 30, '#ffd400', { scale: 3, align: 'center', outline: '#000' });
      T(G.winQuote, W / 2, 60, '#ffffff', { align: 'center' });
    }
    RESULT_MENU.forEach((m, i) => T((G.menuIdx === i ? '> ' : '  ') + m, 196, 120 + i * 12, G.menuIdx === i ? '#ffd400' : '#cccccc', { shadow: '#000' }));
    if (navUp()) { G.menuIdx = (G.menuIdx + RESULT_MENU.length - 1) % RESULT_MENU.length; Sound.play('move'); }
    if (navDown()) { G.menuIdx = (G.menuIdx + 1) % RESULT_MENU.length; Sound.play('move'); }
    if (G.t > 30 && confirmKey()) {
      Sound.play('confirm');
      if (G.menuIdx === 0) go('vs');
      else if (G.menuIdx === 1) startSelect();
      else if (G.menuIdx === 2) go('stage');
      else go('title');
    }
  }

  // ---------- Laço principal ----------
  const SCENES = { title, howto, select, stage: stageSel, vs, fight, result };
  let last = performance.now(), acc = 0;
  const STEP = 1000 / 60;
  let started = false;
  function frame(now) {
    acc += Math.min(100, now - last); last = now;
    while (acc >= STEP) {
      acc -= STEP;
      if (!started) { splash(); }
      else {
        if (Input.key('KeyM')) Sound.toggleMute();
        if (Input.key('KeyF')) toggleFull();
        G.t++;
        SCENES[G.scene]();
      }
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
    if (Input.anyKey()) { started = true; Sound.init(); go('title'); }
  }
  canvas.addEventListener('click', () => { if (!started) { started = true; Sound.init(); go('title'); } });
  function toggleFull() {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen && document.documentElement.requestFullscreen();
    else document.exitFullscreen && document.exitFullscreen();
  }
  requestAnimationFrame(frame);
})();
