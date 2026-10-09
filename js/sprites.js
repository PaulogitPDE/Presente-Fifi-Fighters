// Renderizador procedural de sprites em pixel art.
// Cada personagem é desenhado a partir de uma "pose" (posições de quadril, mãos e pés)
// com cinemática inversa de 2 ossos, num canvas pequeno, depois recebe contorno escuro.
(function () {
  const SW = 112, SH = 104;      // tamanho do canvas do sprite
  const OX = 56, OY = 96;        // origem (pés) dentro do canvas
  const OUTLINE = '#120a14';

  function shade(hex, amt) {
    let c = hex.replace('#', '');
    if (c.length === 3) c = c.split('').map(x => x + x).join('');
    let r = parseInt(c.substr(0, 2), 16), g = parseInt(c.substr(2, 2), 16), b = parseInt(c.substr(4, 2), 16);
    if (amt < 0) { r *= 1 + amt; g *= 1 + amt; b *= 1 + amt; }
    else { r += (255 - r) * amt; g += (255 - g) * amt; b += (255 - b) * amt; }
    const h = v => ('0' + Math.max(0, Math.min(255, Math.round(v))).toString(16)).slice(-2);
    return '#' + h(r) + h(g) + h(b);
  }

  // ---------- Cabeça (grade de pixels) ----------
  const HW = 20, HH = 22;
  function makeGrid() { const g = []; for (let y = 0; y < HH; y++) g.push(new Array(HW).fill(null)); return g; }
  function px(g, x, y, c) { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < HW && y < HH) g[y][x] = c; }
  function ellipse(g, cx, cy, rx, ry, c, cond) {
    for (let y = 0; y < HH; y++) for (let x = 0; x < HW; x++) {
      const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
      if (dx * dx + dy * dy <= 1 && (!cond || cond(x, y))) g[y][x] = c;
    }
  }
  function rect(g, x, y, w, h, c) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) px(g, x + i, y + j, c); }

  // expr: 'normal' | 'blink' | 'shout' | 'hurt' | 'happy'
  function buildHead(look, expr) {
    const g = makeGrid();
    const skin = look.skin, skinD = shade(skin, -0.18), hair = look.hair, hairD = shade(hair, -0.3);
    const cx = 10.5, cy = 12;
    // cabelo de trás (volume)
    const hs = look.hairStyle;
    if (hs === 'curly' || hs === 'longCurly' || hs === 'curlyShort') {
      ellipse(g, cx - 0.5, cy - 2.5, 7.2, 6.5, hair);
      for (let i = 0; i < 9; i++) { const a = Math.PI * (0.9 + i * 0.16); px(g, cx - 0.5 + Math.cos(a) * 7.5, cy - 2.5 + Math.sin(a) * 6.8, hairD); }
    } else if (hs === 'long' || hs === 'bob') {
      ellipse(g, cx - 0.5, cy - 1.5, 6.6, 7, hair);
    } else {
      ellipse(g, cx - 0.3, cy - 2.2, 6.2, 5.8, hair);
    }
    // rosto
    ellipse(g, cx + 0.6, cy + 0.6, 5.2, 6.2, skin);
    // sombra lado de trás do rosto
    for (let y = 0; y < HH; y++) for (let x = 0; x < HW; x++) if (g[y][x] === skin && x < cx - 3) g[y][x] = skinD;
    // orelha
    rect(g, 6, 11, 2, 3, skinD); px(g, 7, 12, shade(skin, -0.32));
    if (look.gauge) { rect(g, 6, 13, 2, 2, '#111111'); px(g, 6, 13, '#444444'); }
    if (look.earring) px(g, 6, 14, look.earring);
    // franja / topo do cabelo
    if (hs === 'short' || hs === 'curlyShort') {
      rect(g, 6, 4, 10, 3, hair); rect(g, 7, 3, 7, 1, hair); rect(g, 13, 6, 4, 1, hair); px(g, 15, 7, hair);
      rect(g, 6, 7, 2, 4, hair);
      px(g, 9, 4, hairD); px(g, 12, 5, hairD);
    }
    if (hs === 'curly' || hs === 'curlyShort') {
      rect(g, 6, 3, 11, 3, hair); for (let x = 5; x < 17; x += 2) px(g, x, 2 + (x % 4 === 1 ? 0 : 1), hair);
      rect(g, 12, 6, 5, 1, hair); px(g, 16, 7, hair);
      for (let x = 6; x < 16; x += 3) px(g, x, 4, hairD);
      rect(g, 5, 6, 2, 6, hair);
    }
    if (hs === 'long' || hs === 'longCurly' || hs === 'bob') {
      rect(g, 6, 3, 10, 3, hair); rect(g, 12, 6, 5, 2, hair); px(g, 16, 8, hair);
      rect(g, 4, 6, 4, 10, hair); px(g, 9, 4, hairD); px(g, 13, 4, hairD);
      if (look.hairTips) { rect(g, 4, 13, 3, 3, look.hairTips); rect(g, 12, 6, 3, 1, look.hairTips); }
    }
    if (hs === 'longCurly') { for (let y = 7; y < 18; y += 2) { px(g, 3, y, hair); px(g, 4, y + 1, hairD); } }
    if (look.headband) { rect(g, 6, 6, 11, 1, look.headband); px(g, 16, 7, look.headband); rect(g, 5, 7, 2, 2, look.headband); }
    if (look.cap) { // boné virado para trás
      rect(g, 5, 2, 11, 4, look.cap); rect(g, 6, 1, 8, 1, look.cap); rect(g, 2, 5, 4, 2, shade(look.cap, -0.25));
      rect(g, 7, 5, 9, 1, shade(look.cap, 0.25));
      rect(g, 13, 6, 3, 1, hair);
    }
    // sobrancelhas
    const browY = expr === 'shout' || expr === 'hurt' ? 8 : 8;
    rect(g, 11, browY, 2, 1, hairD); rect(g, 14, browY, 2, 1, hairD);
    if (expr === 'shout') { px(g, 11, browY - 0, hairD); px(g, 12, browY + 1, hairD); px(g, 15, browY + 1, hairD); }
    // olhos
    const eye = '#1a1020';
    if (expr === 'blink' || expr === 'happy') { rect(g, 11, 10, 2, 1, eye); rect(g, 14, 10, 2, 1, eye); }
    else if (expr === 'hurt') { px(g, 11, 9, eye); px(g, 12, 10, eye); px(g, 11, 11, eye); px(g, 15, 9, eye); px(g, 14, 10, eye); px(g, 15, 11, eye); }
    else { rect(g, 12, 10, 1, 2, eye); rect(g, 15, 10, 1, 2, eye); px(g, 11, 10, '#ffffff'); px(g, 14, 10, '#ffffff'); }
    if (look.lashes && expr !== 'hurt') { px(g, 13, 9, eye); px(g, 16, 9, eye); }
    // óculos
    if (look.glasses) {
      const fc = look.glasses;
      rect(g, 10, 9, 4, 1, fc); rect(g, 10, 12, 4, 1, fc); px(g, 10, 10, fc); px(g, 10, 11, fc); px(g, 13, 10, fc); px(g, 13, 11, fc);
      rect(g, 14, 9, 3, 1, fc); rect(g, 14, 12, 3, 1, fc); px(g, 16, 10, fc); px(g, 16, 11, fc);
      rect(g, 7, 10, 3, 1, fc);
      px(g, 11, 10, '#cfe8ff');
    }
    // nariz
    px(g, 17, 12, skin); px(g, 17, 13, skinD); px(g, 16, 13, skinD);
    // barba
    if (look.beard) {
      const bc = look.beard;
      for (let y = 13; y < 19; y++) for (let x = 7; x < 18; x++) {
        if (g[y][x] === skin || g[y][x] === skinD) {
          if (y >= 15 || x < 10) g[y][x] = (x + y) % 3 === 0 ? shade(bc, -0.2) : bc;
        }
      }
      rect(g, 13, 14, 4, 1, bc); // bigode
      if (look.beard && ellipseHas(g, 11, 19)) px(g, 11, 19, bc);
    }
    // boca
    const mouth = '#7a2232';
    if (expr === 'shout') { rect(g, 13, 15, 3, 2, '#3a0d18'); px(g, 14, 15, '#ffffff'); }
    else if (expr === 'hurt') { rect(g, 13, 16, 3, 1, mouth); }
    else if (expr === 'happy') { rect(g, 13, 15, 3, 1, mouth); px(g, 16, 14, mouth); px(g, 14, 16, '#ffffff'); }
    else { rect(g, 14, 16, 2, 1, look.beard ? shade(look.beard, -0.4) : mouth); }
    if (look.blush) { px(g, 11, 13, look.blush); px(g, 16, 14, look.blush); }
    if (look.lipstick && expr !== 'shout') rect(g, 14, 16, 2, 1, look.lipstick);
    return outlineGrid(g);
  }
  function ellipseHas(g, x, y) { return g[y - 1] && g[y - 1][x]; }

  function outlineGrid(g) {
    const out = makeGrid();
    for (let y = 0; y < HH; y++) for (let x = 0; x < HW; x++) {
      if (g[y][x]) { out[y][x] = g[y][x]; continue; }
      if ((g[y - 1] && g[y - 1][x]) || (g[y + 1] && g[y + 1][x]) || g[y][x - 1] || g[y][x + 1]) out[y][x] = OUTLINE;
    }
    const c = document.createElement('canvas'); c.width = HW; c.height = HH;
    const x = c.getContext('2d');
    for (let j = 0; j < HH; j++) for (let i = 0; i < HW; i++) if (out[j][i]) { x.fillStyle = out[j][i]; x.fillRect(i, j, 1, 1); }
    return c;
  }

  // ---------- Corpo ----------
  function stamp(ctx, x, y, s, c) { ctx.fillStyle = c; ctx.fillRect(Math.round(x - s / 2), Math.round(y - s / 2), s, s); }
  function seg(ctx, ax, ay, bx, by, s, c) {
    const d = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay)));
    for (let i = 0; i <= d; i++) { const t = i / d; stamp(ctx, ax + (bx - ax) * t, ay + (by - ay) * t, s, c); }
  }
  function ik(sx, sy, tx, ty, a, b, sign) {
    let dx = tx - sx, dy = ty - sy;
    let d = Math.hypot(dx, dy);
    const maxD = a + b - 0.01;
    if (d > maxD) { dx *= maxD / d; dy *= maxD / d; d = maxD; }
    d = Math.max(d, Math.abs(a - b) + 0.5);
    const base = Math.atan2(dy, dx);
    const cosA = (a * a + d * d - b * b) / (2 * a * d);
    const off = Math.acos(Math.max(-1, Math.min(1, cosA)));
    const ang = base + sign * off;
    return { jx: sx + Math.cos(ang) * a, jy: sy + Math.sin(ang) * a, ex: sx + dx, ey: sy + dy };
  }

  // Desenha uma pose num contexto (coordenadas relativas aos pés, olhando para a direita)
  function drawBody(ctx, ch, pose, heads, t) {
    const L = ch.look, sc = ch.scale || 1;
    const P = (v) => v * sc;
    const hip = { x: OX + P(pose.hip[0]), y: OY + P(pose.hip[1]) };
    const lean = (pose.lean || 0) * Math.PI / 180;
    const torsoLen = P(19);
    const neck = { x: hip.x + Math.sin(lean) * torsoLen, y: hip.y - Math.cos(lean) * torsoLen };
    const sh = { x: neck.x, y: neck.y + 2 };
    const thigh = P(15), shin = P(14), upper = P(11), fore = P(11);
    const W = ch.build || 1;
    const shirt = L.shirt, shirtD = shade(shirt, -0.28);
    const pants = L.pants, pantsD = shade(pants, -0.28);
    const skin = L.skin, skinD = shade(skin, -0.22);
    const shoes = L.shoes || '#222222';
    const limbW = Math.max(3, Math.round(4 * W));
    const legW = Math.max(4, Math.round(5 * W));
    const tgt = (p) => ({ x: OX + P(p[0]), y: OY + P(p[1]) });

    const bShoulder = { x: sh.x - 2, y: sh.y };
    const fShoulder = { x: sh.x + 2, y: sh.y + 1 };
    const bHip = { x: hip.x - 2, y: hip.y }, fHip = { x: hip.x + 2, y: hip.y };

    // cabelo longo atrás do corpo
    if (L.hairStyle === 'long' || L.hairStyle === 'longCurly') {
      const hc = shade(L.hair, -0.12);
      const len = L.hairStyle === 'longCurly' ? 16 : 13;
      const sway = Math.sin(t / 9) * 1.2 + (pose.hairSwing || 0);
      for (let i = 0; i < len; i++) {
        const w = L.hairStyle === 'longCurly' ? 9 + ((i % 3) === 0 ? 1 : 0) : 8;
        stamp(ctx, neck.x - 4 - i * 0.15 - sway * i / len, neck.y - 8 + i, w, hc);
      }
      if (L.hairTips) for (let i = len - 4; i < len; i++) stamp(ctx, neck.x - 4 - i * 0.15 - sway * i / len, neck.y - 8 + i, 7, L.hairTips);
    }

    function arm(shoulder, hand, front) {
      const r = ik(shoulder.x, shoulder.y, hand.x, hand.y, upper, fore, 1);
      const sleeve = front ? (L.sleeve || shirt) : shade(L.sleeve || shirt, -0.28);
      const sk = front ? skin : skinD;
      seg(ctx, shoulder.x, shoulder.y, r.jx, r.jy, limbW + 1, sleeve);
      seg(ctx, r.jx, r.jy, r.ex, r.ey, limbW, L.longSleeve ? sleeve : sk);
      if (L.tattoo && front) { stamp(ctx, (r.jx + r.ex) / 2, (r.jy + r.ey) / 2, 2, L.tattoo); stamp(ctx, r.jx * 0.3 + r.ex * 0.7, r.jy * 0.3 + r.ey * 0.7 + 1, 1, L.tattoo); }
      if (L.sleeveStripe) stamp(ctx, (shoulder.x + r.jx) / 2, (shoulder.y + r.jy) / 2 + 1, limbW, L.sleeveStripe);
      stamp(ctx, r.ex, r.ey, limbW + 1, sk); // punho
      if (L.bracelet && front) stamp(ctx, r.ex * 0.8 + r.jx * 0.2, r.ey * 0.8 + r.jy * 0.2, limbW, L.bracelet);
      return r;
    }
    function leg(h, foot, front) {
      const r = ik(h.x, h.y, foot.x, foot.y, thigh, shin, -1);
      const pc = front ? pants : pantsD;
      const lower = L.shorts ? (front ? skin : skinD) : pc;
      seg(ctx, h.x, h.y, r.jx, r.jy, legW, pc);
      seg(ctx, r.jx, r.jy, r.ex, r.ey, legW - 1, lower);
      if (L.stockings) seg(ctx, r.jx, r.jy, r.ex, r.ey, legW - 1, front ? L.stockings : shade(L.stockings, -0.3));
      // pé (aponta para frente)
      const sc2 = front ? shoes : shade(shoes, -0.2);
      ctx.fillStyle = sc2;
      const fx = Math.round(r.ex - 2), fy = Math.round(r.ey - 1);
      ctx.fillRect(fx, fy, 6, 3);
      if (L.shoeSole) { ctx.fillStyle = L.shoeSole; ctx.fillRect(fx, fy + 2, 6, 1); }
      return r;
    }

    // ordem: braço de trás, perna de trás, tronco, perna da frente, cabeça, braço da frente
    const bHand = tgt(pose.bHand), fHand = tgt(pose.fHand);
    const bFoot = tgt(pose.bFoot), fFoot = tgt(pose.fFoot);
    if (pose.backProp) drawProp(ctx, pose.backProp, bHand.x, bHand.y, t);
    arm(bShoulder, bHand, false);
    if (L.backpack) { // mochila
      ctx.fillStyle = L.backpack;
      ctx.fillRect(Math.round(sh.x - 10 + Math.sin(lean) * -4), Math.round(sh.y + 1), 6, 12);
      ctx.fillStyle = shade(L.backpack, -0.3); ctx.fillRect(Math.round(sh.x - 10 + Math.sin(lean) * -4), Math.round(sh.y + 9), 6, 2);
    }
    leg(bHip, bFoot, false);

    // tronco
    const shW = 13 * W * (L.female ? 0.85 : 1), hpW = 11 * W * (L.female ? 0.95 : 1), waist = L.female ? 8 * W : 10.5 * W;
    const belly = L.belly || 0;
    for (let i = 0; i <= torsoLen + 1; i++) {
      const tt = i / torsoLen;
      const cx = hip.x + Math.sin(lean) * i, cy = hip.y - Math.cos(lean) * i;
      let w;
      if (tt < 0.45) w = hpW + (waist - hpW) * (tt / 0.45);
      else w = waist + (shW - waist) * ((tt - 0.45) / 0.55);
      const bulge = belly * Math.sin(Math.min(1, tt * 1.6) * Math.PI) ;
      const x0 = Math.round(cx - w / 2), x1 = Math.round(cx + w / 2 + bulge);
      const midX = Math.round(cx - w / 2 + w * 0.35);
      ctx.fillStyle = shirtD; ctx.fillRect(x0, Math.round(cy), midX - x0, 2);
      ctx.fillStyle = shirt; ctx.fillRect(midX, Math.round(cy), x1 - midX, 2);
      if (L.pattern) patternRow(ctx, L, x0, x1, Math.round(cy), i);
    }
    // calça/cintura
    ctx.fillStyle = L.dress ? L.dress : pants;
    ctx.fillRect(Math.round(hip.x - hpW / 2), Math.round(hip.y - 2), Math.round(hpW), 4);
    if (L.belt) { ctx.fillStyle = L.belt; ctx.fillRect(Math.round(hip.x - hpW / 2), Math.round(hip.y - 2), Math.round(hpW), 1); }
    // estampa no peito
    if (L.print) drawPrint(ctx, L.print, hip.x + Math.sin(lean) * torsoLen * 0.6 + 1, hip.y - Math.cos(lean) * torsoLen * 0.6);
    if (L.jacket) { // camisa aberta por cima
      for (let i = 0; i <= torsoLen; i++) {
        const cx = hip.x + Math.sin(lean) * i, cy = hip.y - Math.cos(lean) * i;
        ctx.fillStyle = (i % 3 === 0) ? shade(L.jacket, -0.35) : L.jacket;
        ctx.fillRect(Math.round(cx - 6 * W), Math.round(cy), 3, 2);
        ctx.fillRect(Math.round(cx + 3 * W), Math.round(cy), 2, 2);
      }
    }
    if (L.strap) { ctx.fillStyle = L.strap; seg(ctx, sh.x - 3, sh.y, hip.x + 4, hip.y - 4, 1, L.strap); }

    // vestido/saia
    if (L.dress || L.skirt) {
      const dc = L.dress || L.skirt;
      const len = L.dress ? 15 : 9;
      const flare = (fFoot.x - bFoot.x) * 0.25;
      for (let i = 0; i < len; i++) {
        const w = hpW + i * 0.55 + Math.abs(flare) * i / len;
        const cy = Math.round(hip.y + i);
        const cx = hip.x + flare * i / len * 0.5;
        ctx.fillStyle = i % 4 === 3 ? shade(dc, -0.2) : dc;
        ctx.fillRect(Math.round(cx - w / 2), cy, Math.round(w), 1);
        if (L.dressPattern && i % 3 === 1) {
          for (let k = 0; k < w; k += 3) { ctx.fillStyle = L.dressPattern[(k + i) % L.dressPattern.length]; ctx.fillRect(Math.round(cx - w / 2 + k + (i % 2)), cy, 1, 1); }
        }
      }
    }

    leg(fHip, fFoot, true);

    // cabeça
    const expr = pose.expr || 'normal';
    const head = heads[expr] || heads.normal;
    const hx = Math.round(neck.x - 10 + Math.sin(lean) * 2 + (pose.headX || 0));
    const hy = Math.round(neck.y - 19 + (pose.headY || 0));
    ctx.fillStyle = skinD; ctx.fillRect(Math.round(neck.x - 1), Math.round(neck.y - 3), 3, 4);
    if (pose.lying) {
      ctx.save(); ctx.translate(Math.round(neck.x - 9), Math.round(neck.y - 3)); ctx.rotate(-Math.PI / 2); ctx.drawImage(head, -10, -11); ctx.restore();
    } else if (pose.headTilt) {
      ctx.save(); ctx.translate(hx + 10, hy + 14); ctx.rotate(pose.headTilt * Math.PI / 180); ctx.drawImage(head, -10, -14); ctx.restore();
    } else ctx.drawImage(head, hx, hy);

    if (pose.prop) drawProp(ctx, pose.prop, fHand.x, fHand.y, t);
    arm(fShoulder, fHand, true);
    if (pose.propFront) drawProp(ctx, pose.propFront, fHand.x, fHand.y, t);
  }

  function patternRow(ctx, L, x0, x1, y, i) {
    if (L.pattern === 'plaid') {
      for (let x = x0; x < x1; x++) {
        if ((x - x0) % 4 === 0 || i % 4 === 0) { ctx.fillStyle = shade(L.shirt, -0.45); ctx.fillRect(x, y, 1, 1); }
      }
    } else if (L.pattern === 'stripes' && i % 4 === 0) {
      ctx.fillStyle = L.patternColor || '#ffffff'; ctx.fillRect(x0, y, x1 - x0, 1);
    } else if (L.pattern === 'collar' && i > 16) {
      ctx.fillStyle = L.patternColor; ctx.fillRect(Math.round((x0 + x1) / 2) - 2, y, 4, 1);
    }
  }

  function drawPrint(ctx, p, x, y) {
    x = Math.round(x); y = Math.round(y);
    if (p === 'brasil') { // camisa da seleção: gola verde + número
      ctx.fillStyle = '#0a7a3a'; ctx.fillRect(x - 3, y - 7, 6, 1);
      ctx.fillStyle = '#0a7a3a'; ctx.fillRect(x - 2, y + 1, 4, 5); ctx.fillStyle = '#ffd400'; ctx.fillRect(x - 1, y + 2, 2, 3);
      ctx.fillStyle = '#1b3a8f'; ctx.fillRect(x - 2, y - 4, 2, 2);
    } else if (p === 'pizza') { // triângulo laranja
      ctx.fillStyle = '#f07a1a'; for (let i = 0; i < 5; i++) ctx.fillRect(x - 3 + i * 0.5, y - 3 + i, 7 - i, 1);
      ctx.fillStyle = '#c0281c'; ctx.fillRect(x - 1, y - 2, 1, 1); ctx.fillRect(x + 1, y, 1, 1);
    } else if (p === 'planets') {
      ctx.fillStyle = '#e8a33d'; ctx.fillRect(x - 4, y - 3, 3, 3);
      ctx.fillStyle = '#6a7fdb'; ctx.fillRect(x, y - 4, 2, 2);
      ctx.fillStyle = '#c95b4a'; ctx.fillRect(x + 1, y, 3, 3);
    } else if (p === 'band') {
      ctx.fillStyle = '#d9c8b0'; ctx.fillRect(x - 3, y - 4, 6, 6); ctx.fillStyle = '#5a4a3a'; ctx.fillRect(x - 2, y - 3, 2, 2); ctx.fillRect(x + 1, y - 1, 1, 2);
    } else if (p === 'tiny') {
      ctx.fillStyle = '#dddddd'; ctx.fillRect(x - 2, y - 2, 4, 1);
    } else if (p === 'heart') {
      ctx.fillStyle = '#b24bd6'; ctx.fillRect(x - 2, y - 3, 2, 2); ctx.fillRect(x + 1, y - 3, 2, 2); ctx.fillRect(x - 2, y - 2, 5, 2); ctx.fillRect(x - 1, y, 3, 1); ctx.fillRect(x, y + 1, 1, 1);
    } else if (p === 'butterfly') {
      ctx.fillStyle = '#f7c6e0'; ctx.fillRect(x - 3, y - 3, 3, 3); ctx.fillRect(x + 1, y - 3, 3, 3); ctx.fillRect(x - 2, y, 2, 2); ctx.fillRect(x + 1, y, 2, 2);
      ctx.fillStyle = '#ffeb7a'; ctx.fillRect(x, y - 3, 1, 5);
    }
  }

  // ---------- Objetos nas mãos ----------
  function drawProp(ctx, name, x, y, t) {
    x = Math.round(x); y = Math.round(y);
    switch (name) {
      case 'phone': ctx.fillStyle = '#b9a3e3'; ctx.fillRect(x - 2, y - 7, 5, 8); ctx.fillStyle = '#8e78c4'; ctx.fillRect(x - 1, y - 6, 2, 2); break;
      case 'phoneDark': ctx.fillStyle = '#222'; ctx.fillRect(x - 2, y - 7, 5, 8); ctx.fillStyle = '#7fd3ff'; ctx.fillRect(x - 1, y - 6, 3, 5); break;
      case 'monster': ctx.fillStyle = '#111'; ctx.fillRect(x - 2, y - 8, 5, 9); ctx.fillStyle = '#66ff33'; ctx.fillRect(x - 1, y - 6, 1, 5); ctx.fillRect(x + 1, y - 6, 1, 5); ctx.fillStyle = '#aaa'; ctx.fillRect(x - 2, y - 9, 5, 1); break;
      case 'cookie': ctx.fillStyle = '#c98b4a'; ctx.fillRect(x - 3, y - 3, 6, 6); ctx.fillStyle = '#4a2a14'; ctx.fillRect(x - 1, y - 2, 1, 1); ctx.fillRect(x + 1, y, 1, 1); ctx.fillRect(x - 2, y + 1, 1, 1); break;
      case 'costela': ctx.fillStyle = '#8a3d1e'; ctx.fillRect(x - 5, y - 3, 10, 5); ctx.fillStyle = '#f2e6d0'; ctx.fillRect(x - 6, y - 2, 2, 1); ctx.fillRect(x + 4, y - 2, 3, 1); ctx.fillStyle = '#b5552a'; ctx.fillRect(x - 4, y - 2, 8, 1); break;
      case 'ricecooker': ctx.fillStyle = '#f2f2f2'; ctx.fillRect(x - 6, y - 10, 12, 11); ctx.fillStyle = '#cfcfcf'; ctx.fillRect(x - 6, y - 4, 12, 1); ctx.fillStyle = '#ff6b6b'; ctx.fillRect(x + 2, y - 2, 2, 1); ctx.fillStyle = '#d0d0d0'; ctx.fillRect(x - 4, y - 12, 8, 2); break;
      case 'ereader': ctx.fillStyle = '#333'; ctx.fillRect(x - 3, y - 8, 7, 9); ctx.fillStyle = '#d8d4c8'; ctx.fillRect(x - 2, y - 7, 5, 6); break;
      case 'clipboard': ctx.fillStyle = '#9c6b3a'; ctx.fillRect(x - 3, y - 8, 7, 9); ctx.fillStyle = '#fff'; ctx.fillRect(x - 2, y - 6, 5, 6); ctx.fillStyle = '#888'; ctx.fillRect(x - 1, y - 9, 3, 2); break;
      case 'lightstick': ctx.fillStyle = '#ddd'; ctx.fillRect(x, y - 3, 1, 6); ctx.fillStyle = (t >> 3) % 2 ? '#c38cff' : '#ffffff'; ctx.fillRect(x - 2, y - 8, 5, 5); break;
      case 'mic': ctx.fillStyle = '#333'; ctx.fillRect(x, y - 2, 2, 5); ctx.fillStyle = '#999'; ctx.fillRect(x - 1, y - 5, 4, 3); break;
      case 'popcorn': ctx.fillStyle = '#e63a3a'; ctx.fillRect(x - 3, y - 4, 7, 7); ctx.fillStyle = '#fff'; ctx.fillRect(x - 2, y - 4, 1, 7); ctx.fillRect(x + 1, y - 4, 1, 7); ctx.fillStyle = '#fff3b0'; ctx.fillRect(x - 3, y - 7, 7, 3); break;
    }
  }

  // ---------- Cache e API ----------
  const headCache = {};
  function getHeads(ch) {
    if (!headCache[ch.id]) {
      headCache[ch.id] = {};
      ['normal', 'blink', 'shout', 'hurt', 'happy'].forEach(e => headCache[ch.id][e] = buildHead(ch.look, e));
    }
    return headCache[ch.id];
  }

  // Renderiza a pose num canvas próprio do lutador, com contorno
  function render(target, ch, pose, t, tint) {
    const ctx = target.getContext('2d');
    ctx.clearRect(0, 0, SW, SH);
    drawBody(ctx, ch, pose, getHeads(ch), t);
    // contorno
    const img = ctx.getImageData(0, 0, SW, SH), d = img.data;
    const a = new Uint8Array(SW * SH);
    for (let i = 0; i < SW * SH; i++) a[i] = d[i * 4 + 3] > 0 ? 1 : 0;
    for (let y = 1; y < SH - 1; y++) for (let x = 1; x < SW - 1; x++) {
      const i = y * SW + x;
      if (!a[i] && (a[i - 1] || a[i + 1] || a[i - SW] || a[i + SW])) {
        d[i * 4] = 18; d[i * 4 + 1] = 10; d[i * 4 + 2] = 20; d[i * 4 + 3] = 255;
      }
    }
    if (tint) {
      for (let i = 0; i < SW * SH; i++) if (d[i * 4 + 3]) {
        d[i * 4] = (d[i * 4] + tint[0]) / 2; d[i * 4 + 1] = (d[i * 4 + 1] + tint[1]) / 2; d[i * 4 + 2] = (d[i * 4 + 2] + tint[2]) / 2;
      }
    }
    ctx.putImageData(img, 0, 0);
  }

  function newCanvas() { const c = document.createElement('canvas'); c.width = SW; c.height = SH; return c; }

  // Retrato (cabeça ampliada) para menus e HUD
  const portraitCache = {};
  function portrait(ch, expr) {
    const k = ch.id + (expr || 'normal');
    if (!portraitCache[k]) portraitCache[k] = getHeads(ch)[expr || 'normal'];
    return portraitCache[k];
  }

  window.Sprites = { render, newCanvas, portrait, shade, drawProp, SW, SH, OX, OY };
})();
