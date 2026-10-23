// Sprites dos personagens a partir das folhas de animação.
// v2: assets/sprites2/<id>_<quadro>.png (parado, andando, golpes, reações, especiais e vitória)
// v1: assets/sprites/<id>_<pose>.png (model sheets antigos, só para personagens sem as folhas v2)
// Também carrega os efeitos de assets/fx/ (projéteis, faíscas, ajudantes).
(function () {
  const META = window.SHEET_META || {};
  const META2 = window.SHEET_META2 || {};
  const FXM = window.FX_META || {};
  const imgs = {}, imgs2 = {}, fx = {};
  const FRAMES = ['front', 'stance', 'side', 'back', 'action'];
  const ok = im => !!im && im.complete && im.naturalWidth > 0;

  function load(list) {
    list.forEach(ch => {
      if (META[ch.id] && !META2[ch.id]) { // só quem ainda não tem as folhas novas
        imgs[ch.id] = {};
        FRAMES.forEach(f => { const im = new Image(); im.src = 'assets/sprites/' + ch.id + '_' + f + '.png'; imgs[ch.id][f] = im; });
      }
      const M = META2[ch.id];
      if (M) {
        imgs2[ch.id] = {};
        Object.keys(M).forEach(n => { if (n[0] === '_') return; const im = new Image(); im.src = 'assets/sprites2/' + ch.id + '_' + n + '.png'; imgs2[ch.id][n] = im; });
      }
    });
    Object.keys(FXM).forEach(n => { if (fx[n]) return; const im = new Image(); im.src = 'assets/fx/' + n + '.png'; fx[n] = im; });
    // variações (ex.: belipe_bravo) também são carregadas
    list.forEach(ch => Object.keys(META2).forEach(id => { if (id.startsWith(ch.id + '_') && !imgs2[id]) load([variant(ch, id.slice(ch.id.length + 1))]); }));
  }
  // versão alternativa de um personagem (mesmos dados, outros quadros): ex. variant(belipe, 'bravo')
  const variants = {};
  function variant(ch, name) {
    const id = ch.id + '_' + name;
    if (!META2[id]) return null;
    return variants[id] || (variants[id] = Object.assign({}, ch, { id, base: ch.id }));
  }
  function ready1(ch) { const s = imgs[ch.id]; return !!s && FRAMES.every(f => ok(s[f])); }
  function ready2(ch) { const s = imgs2[ch.id]; return !!s && Object.keys(s).every(n => ok(s[n])); }
  function ready(ch) { return ready2(ch) || ready1(ch); }

  const buf = document.createElement('canvas'); buf.width = 220; buf.height = 200;
  const bx = buf.getContext('2d'); bx.imageSmoothingEnabled = false;
  const BX = 110, BY = 186; // pés no buffer

  // desenha um quadro no buffer (coordenadas com pés em 0,0, olhando para a direita)
  function frameTo(c, im, m, o) {
    const w = m.w, h = m.h, ax = m.ax;
    c.save();
    c.translate(o.dx || 0, o.dy || 0);
    if (o.rot) c.rotate(o.rot * Math.PI / 180);
    if (o.crouch) {
      const k = o.crouch, split = Math.round(h * 0.5);
      const low = Math.max(4, Math.round((h - split) * k));
      c.drawImage(im, 0, split, w, h - split, -ax, -low, w, low);
      c.drawImage(im, 0, 0, w, split, -ax, -low - split + 1, w, split);
    } else if (o.leg !== undefined) {
      // chute: recorta a perna da frente e gira em torno do quadril
      const hipY = Math.round(h * 0.52), cutX = ax - 2;
      c.save(); c.beginPath(); c.rect(-ax, -h, w, h); c.rect(cutX - ax, -h + hipY, w - cutX, h - hipY); c.clip('evenodd');
      c.drawImage(im, -ax, -h); c.restore();
      c.save();
      c.translate(cutX - ax, -h + hipY); c.rotate(o.leg * Math.PI / 180);
      c.drawImage(im, cutX, hipY, w - cutX, h - hipY, 0, 0, w - cutX, h - hipY);
      c.restore();
    } else {
      const sy = o.sy || 1;
      c.drawImage(im, -ax, -Math.round(h * sy), w, Math.round(h * sy));
    }
    c.restore();
  }

  // ---------- v1: model sheets ----------
  function spec1(ch, st, t) {
    const S = META[ch.id];
    const k = st.kind;
    const bob = Math.sin(t / 9);
    switch (k) {
      case 'idle': {
        const style = ch.idle;
        if (style === 'jog') return { f: 'stance', dy: -Math.abs(Math.sin(t / 4)) * 2 };
        if (style === 'bounce') return { f: 'stance', dy: -Math.abs(Math.sin(t / 7)) * 2 };
        if (style === 'sway') return { f: 'stance', rot: Math.sin(t / 14) * 2 };
        if (style === 'cool') return { f: 'stance', sy: 1 + Math.sin(t / 16) * 0.012, rot: Math.sin(t / 30) };
        return { f: 'stance', sy: 1 + bob * 0.015 };
      }
      case 'walk': return { f: 'stance', dy: -Math.abs(Math.sin(t / 5)) * 2.5, rot: Math.sin(t / 5) * 2.5 * st.dir };
      case 'crouch': return { f: 'stance', crouch: 0.45 };
      case 'getup': return { f: 'stance', crouch: 0.45 + st.k * 0.55 };
      case 'jump': return st.up ? { f: 'stance', crouch: 0.8, rot: -4 } : { f: 'stance', crouch: 0.62, rot: 6 };
      case 'block': return st.crouch ? { f: 'stance', crouch: 0.45, dx: -2 } : { f: 'side', rot: -5, dx: -3 };
      case 'hit': return st.crouch ? { f: 'stance', crouch: 0.45, rot: -8, dx: -3 } : { f: 'stance', rot: -12 * st.k, dx: -4 * st.k };
      case 'thrown': return { f: 'stance', rot: -12, dx: -4 };
      case 'airhit': return { f: 'side', rot: -40 };
      case 'dizzy': return { f: 'stance', rot: Math.sin(t / 8) * 7 - 4, dx: Math.sin(t / 8) * 2 };
      case 'dash': return { f: 'stance', rot: 10, dy: -2 };
      case 'backdash': return { f: 'stance', crouch: 0.85, rot: -10, dy: -4 };
      case 'lying': return { f: 'side', rot: -90, dx: Math.round(S.side.h * 0.5), dy: -S.side.ax };
      case 'throw': return st.phase === 1 ? { f: 'action', dx: 2 } : { f: 'side', rot: -6 };
      case 'punch': return st.phase === 0 ? { f: 'stance', dx: -2, rot: -3 } : (st.phase === 1 || st.k < 0.5 ? { f: 'action', dx: 4 } : { f: 'stance' });
      case 'cpunch': return st.phase === 0 ? { f: 'stance', crouch: 0.45 } : { f: 'action', crouch: 0.5, dx: 4 };
      case 'jpunch': return { f: 'action', crouch: 0.7, rot: 12 };
      case 'kick': return st.phase === 0 ? { f: 'stance', rot: -4 } : { f: 'stance', leg: st.phase === 1 ? -72 : -72 * (1 - st.k), rot: -8, dx: 2 };
      case 'ckick': return { f: 'stance', crouch: 0.45, rot: 4, dx: st.phase === 1 ? 10 : 4 };
      case 'jkick': return { f: 'stance', leg: -55, rot: 10, crouch: 0 };
      case 'special': {
        const p = st.pose;
        if (st.phase === 0) return { f: 'stance', dx: -3, rot: -5 };
        if (p === 'rising') return { f: 'action', rot: -62, dx: 4 };
        if (p === 'counter' || p === 'taunt' || p === 'eat' || p === 'summon') return { f: 'front', dy: p === 'summon' ? -2 : 0 };
        if (p === 'dodge') return { f: 'stance', crouch: 0.4, rot: 20 };
        if (p === 'spin') return { f: 'stance', leg: -80 + Math.sin(t) * 20, rot: -6 };
        if (p === 'rush') return { f: 'action', dx: 2, dy: -Math.abs(Math.sin(t / 2)) * 2, rot: 6 };
        return { f: 'action', dx: 4 };
      }
      case 'win': {
        const v = ch.victory;
        if (v === 'jumpjoy') return { f: 'front', dy: -Math.abs(Math.sin(t / 7)) * 10 };
        if (v === 'run') return { f: 'stance', dy: -Math.abs(Math.sin(t / 3)) * 3 };
        return { f: 'front', sy: 1 + Math.sin(t / 8) * 0.02 };
      }
      case 'intro': return { f: 'front' };
    }
    return { f: 'stance' };
  }

  // ---------- v2: folhas de animação ----------
  // quadro de cada especial (n = parado, fwd = frente, down = baixo, super)
  const SPECIAL = {
    guti: { n: 'sp0', fwd: 'sp1', down: 'intro', super: 'victory' },
    min: { n: 'punch', fwd: 'sp1', down: 'intro', super: 'sp0' },
    pv: { n: 'sp0', fwd: 'intro', down: 'sp1', super: 'sp0' },
    ana: { n: 'sp0', fwd: 'punch', down: 'sp1', super: 'sp0' },
    belipe: { n: 'sp1', fwd: 'sp0', down: 'sp1', super: 'sp0' },
    belipe_bravo: { n: 'sp1', fwd: 'sp0', down: 'sp1', super: 'sp0' },
    pam: { n: 'sp0', fwd: 'sp1', down: 'victory', super: 'intro' },
    alex: { n: 'sp0', fwd: 'sp1', down: 'punch', super: 'victory' },
    valesca: { n: 'sp0', fwd: 'uppercut', down: 'sp1', super: 'sp0' }
  };
  // quando o personagem não tem um quadro próprio para a pose do especial
  const BY_POSE = { throw: 'punch', push: 'punch', beam: 'punch', rush: 'walk0', rising: 'uppercut', counter: 'block', taunt: 'victory', eat: 'victory', summon: 'victory', dodge: 'jump', spin: 'kick' };
  // quadros que já trazem o próprio objeto (o jogo não desenha o objeto por cima)
  const OWN_PROP = { guti: { sp1: 'kart' }, min: { sp0: 'ricecooker' }, pv: { sp1: 'costela' }, pam: { victory: 'monster' } };

  // folha de parado/andando desenhada de perfil e bem mais fina que as outras: usa a guarda
  const THIN = {};
  function idleFrame(M, t) {
    const n = M._counts.idle, len = n > 1 ? n * 2 - 2 : 1;
    let i = Math.floor(t / 9) % len; if (i >= n) i = len - i;
    return 'idle' + i;
  }
  function walkFrame(M, t, dir) {
    const n = M._counts.walk, i = Math.floor(t / 6) % n;
    return 'walk' + (dir < 0 ? n - 1 - i : i);
  }
  function specialFrame(ch, st) {
    const M = META2[ch.id], map = SPECIAL[ch.id] || {};
    let f = st.slot && map[st.slot];
    if (!f || !M[f]) f = BY_POSE[st.pose] || 'punch';
    if (!M[f]) f = M.punch ? 'punch' : (M.punch2 ? 'punch2' : 'guard');
    return f;
  }
  function spec2(ch, st, t) {
    const M = META2[ch.id];
    const P = (...ns) => ns.find(n => M[n]) || 'idle0';
    const crouchH = 36 * (ch.scale || 1) + 8;
    const fit = f => ({ f, sy: Math.min(1, crouchH / M[f].h) });
    const punch = P('punch', 'punch2', 'guard');
    switch (st.kind) {
      case 'idle': return THIN[ch.id] ? { f: 'guard', dy: (t >> 4) % 2 } : { f: idleFrame(M, t) };
      case 'walk': return THIN[ch.id] ? { f: 'guard', dy: -Math.round(Math.abs(Math.sin(t / 5)) * 2), rot: Math.sin(t / 5) * 2 * st.dir } : { f: walkFrame(M, t, st.dir) };
      case 'crouch': return fit(P('getup'));
      case 'getup': return st.k < 0.6 ? fit(P('getup')) : { f: P('getup') };
      case 'jump': return { f: P('jump'), rot: st.up ? -3 : 5 };
      case 'block': return st.crouch ? { f: P('block', 'guard'), crouch: 0.55 } : { f: P('block', 'guard'), dx: -1 };
      case 'hit': return st.crouch ? Object.assign(fit(P('getup')), { rot: -6, dx: -3 }) : { f: P('hit'), dx: -Math.round(3 * st.k) };
      case 'thrown': return { f: P('hit'), rot: -10 };
      case 'airhit': return { f: P('air') };
      case 'dizzy': return { f: P('hit'), rot: Math.sin(t / 8) * 5 + 2, dx: Math.round(Math.sin(t / 8) * 2) };
      case 'dash': return THIN[ch.id] ? { f: 'guard', rot: 6, dy: -1 } : { f: walkFrame(M, t * 2, 1), rot: 5, dy: -1 };
      case 'backdash': return { f: P('jump'), rot: -8, dy: -2 };
      case 'lying': return { f: P('lying') };
      case 'throw': return st.phase === 1 ? { f: punch } : { f: P('guard') };
      case 'punch': return st.phase === 1 || (st.phase === 2 && st.k < 0.6) ? { f: punch, dx: st.phase === 1 ? 2 : 0 } : { f: P('guard') };
      case 'cpunch': return st.phase === 0 ? fit(P('getup')) : { f: punch, crouch: 0.5, dx: 2 };
      case 'jpunch': return { f: punch, crouch: 0.65, rot: 8 };
      case 'kick': return st.phase === 1 || (st.phase === 2 && st.k < 0.6) ? { f: P('kick') } : { f: P('guard') };
      case 'ckick': return st.phase === 0 ? fit(P('getup')) : { f: P('sweep') };
      case 'jkick': return { f: P('jkick') };
      case 'special': {
        const f = specialFrame(ch, st);
        const instant = st.pose === 'rush' || st.pose === 'rising' || st.pose === 'dodge' || st.pose === 'counter';
        if (st.phase === 0 && !instant) return { f: P('guard') };
        const o = { f };
        if (st.pose === 'rush' && f !== 'sp1') o.dy = -Math.abs(Math.sin(t / 2)) * 2;
        if (st.pose === 'rush' && f === 'walk0') return { f: walkFrame(M, t * 2, 1), rot: 8 };
        return o;
      }
      case 'win': {
        const f = P('victory', 'uppercut');
        return ch.victory === 'jumpjoy' || f === 'uppercut' ? { f, dy: -Math.round(Math.abs(Math.sin(t / 7)) * 8) } : { f };
      }
      case 'intro': return { f: P('intro', 'guard') };
    }
    return { f: 'idle0' };
  }

  // desenha no contexto final; tint = [r,g,b,a]
  function draw(ctx, ch, st, t, x, y, facing, scale, tint, alt) {
    let im, m, sp;
    if (ready2(ch)) { sp = spec2(ch, st, t); im = imgs2[ch.id][sp.f]; m = META2[ch.id][sp.f]; }
    else if (ready1(ch)) { sp = spec1(ch, st, t); im = imgs[ch.id][sp.f]; m = META[ch.id][sp.f]; }
    else return false;
    bx.clearRect(0, 0, buf.width, buf.height);
    bx.save(); bx.translate(BX, BY);
    if (alt) bx.filter = 'hue-rotate(160deg) saturate(1.15)';
    frameTo(bx, im, m, sp); bx.restore();
    bx.filter = 'none';
    if (tint) {
      bx.save(); bx.globalCompositeOperation = 'source-atop'; bx.globalAlpha = tint[3];
      bx.fillStyle = 'rgb(' + tint[0] + ',' + tint[1] + ',' + tint[2] + ')'; bx.fillRect(0, 0, buf.width, buf.height); bx.restore();
    }
    scale = scale || 1;
    ctx.save(); ctx.translate(Math.round(x), Math.round(y));
    if (facing < 0) ctx.scale(-1, 1);
    ctx.drawImage(buf, -BX * scale, -BY * scale, buf.width * scale, buf.height * scale);
    ctx.restore();
    return true;
  }

  // o quadro atual já mostra o objeto do especial? (kart, panela de arroz, costela, Monster)
  function hasProp(ch, st, prop) {
    if (!ready2(ch) || !st || st.kind !== 'special') return false;
    const own = OWN_PROP[ch.id];
    return !!own && own[specialFrame(ch, st)] === prop;
  }

  // ---------- efeitos ----------
  // o: { flip, scale, sx, sy, alpha, rot, ax, ay } — ax/ay de 0 a 1 (0.5 = centro)
  function fxReady(n) { return ok(fx[n]); }
  function drawFX(ctx, n, x, y, o) {
    const im = fx[n]; if (!ok(im)) return false;
    o = o || {};
    const sx = (o.sx || o.scale || 1), sy = (o.sy || o.scale || 1);
    const w = im.width, h = im.height, ax = o.ax === undefined ? 0.5 : o.ax, ay = o.ay === undefined ? 0.5 : o.ay;
    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));
    if (o.rot) ctx.rotate(o.rot);
    if (o.flip) ctx.scale(-1, 1);
    if (o.alpha !== undefined) ctx.globalAlpha *= Math.max(0, Math.min(1, o.alpha));
    ctx.drawImage(im, Math.round(-w * ax * sx), Math.round(-h * ay * sy), Math.round(w * sx), Math.round(h * sy));
    ctx.restore();
    return true;
  }
  // feixe: corpo esticado a partir de uma fatia do sprite + esfera na ponta (ou na origem)
  const BEAMS = { beamPurple: { body: [30, 52], orb: [0, 27], orbAt: 'start' }, beamWhite: { body: [30, 52], orb: [0, 27], orbAt: 'start' }, beamGold: { body: [6, 30], orb: [33, 60], orbAt: 'end' } };
  function drawBeam(ctx, n, x0, y, len, f, t, sy) {
    const im = fx[n], B = BEAMS[n]; if (!ok(im) || !B) return false;
    sy = sy || 1;
    const h = im.height, hh = Math.round(h * sy), top = Math.round(y - hh / 2);
    const wob = (t >> 1) % 2;
    ctx.save(); ctx.translate(Math.round(x0), 0); if (f < 0) ctx.scale(-1, 1);
    ctx.drawImage(im, B.body[0], 0, B.body[1] - B.body[0], h, 0, top - wob, Math.round(len), hh + wob * 2);
    const ow = B.orb[1] - B.orb[0], ox = B.orbAt === 'end' ? Math.round(len) - Math.round(ow * sy * 0.6) : -Math.round(ow * sy * 0.4);
    ctx.drawImage(im, B.orb[0], 0, ow, h, ox, top, Math.round(ow * sy), hh);
    ctx.restore();
    return true;
  }

  window.SheetSprites = { load, ready, ready2, draw, hasProp, variant, META, META2 };
  window.FX = { ready: fxReady, draw: drawFX, beam: drawBeam, META: FXM };
})();
