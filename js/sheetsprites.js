// Sprites a partir dos model sheets (assets/sprites/<id>_<pose>.png).
// As animações são montadas com as poses disponíveis: base (3/4), soco (action), frente, lado e costas.
(function () {
  const META = window.SHEET_META || {};
  const imgs = {};
  const FRAMES = ['front', 'stance', 'side', 'back', 'action'];
  function load(list) {
    list.forEach(ch => {
      if (!META[ch.id]) return;
      imgs[ch.id] = {};
      FRAMES.forEach(f => { const im = new Image(); im.src = 'assets/sprites/' + ch.id + '_' + f + '.png'; imgs[ch.id][f] = im; });
    });
  }
  function ready(ch) {
    const s = imgs[ch.id];
    return !!s && FRAMES.every(f => s[f].complete && s[f].naturalWidth);
  }

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
      c.drawImage(im, -ax, -h * sy, w, h * sy);
    }
    c.restore();
  }

  // estados -> quadro + transformação
  function spec(ch, st, t) {
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
      case 'airhit': return { f: 'side', rot: -40 };
      case 'dizzy': return { f: 'stance', rot: Math.sin(t / 8) * 7 - 4, dx: Math.sin(t / 8) * 2 };
      case 'dash': return { f: 'stance', rot: 10, dy: -2 };
      case 'backdash': return { f: 'stance', crouch: 0.85, rot: -10, dy: -4 };
      case 'lying': return { f: 'side', rot: -90, dx: Math.round(S.side.h * 0.5), dy: -S.side.ax };
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

  // desenha no contexto final; tint = [r,g,b,a]
  function draw(ctx, ch, st, t, x, y, facing, scale, tint, alt) {
    if (!ready(ch)) return false;
    const sp = spec(ch, st, t);
    const im = imgs[ch.id][sp.f], m = META[ch.id][sp.f];
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
  window.SheetSprites = { load, ready, draw, META };
})();
