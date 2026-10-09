// Renderizador de pixel art (v2): partes do corpo em "cápsulas" com sombreado em 4 tons,
// contorno colorido estilo Street Fighter II, rostos detalhados e alturas reais.
(function () {
  const SW = 200, SH = 178, OX = 100, OY = 170;
  const L = (() => { const v = [0.5, -0.58, 0.64], l = Math.hypot(...v); return v.map(x => x / l); })();

  // ---------- Cores ----------
  function hexRgb(h) {
    h = h.replace('#', ''); if (h.length === 3) h = h.split('').map(x => x + x).join('');
    return [parseInt(h.substr(0, 2), 16), parseInt(h.substr(2, 2), 16), parseInt(h.substr(4, 2), 16)];
  }
  const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
  const fix = c => c.map(v => Math.max(0, Math.min(255, Math.round(v))));
  const rampCache = {};
  // [realce, base, sombra, sombra profunda, linha]
  function ramp(hex, kind) {
    const k = hex + (kind || '');
    if (rampCache[k]) return rampCache[k];
    const b = hexRgb(hex);
    let hi = mix(b, [255, 246, 226], 0.34), sh = mix(mul(b, 0.76), [70, 40, 120], 0.16), dp = mix(mul(b, 0.54), [36, 16, 64], 0.32);
    if (kind === 'skin') { hi = mix(b, [255, 238, 214], 0.36); sh = mix(mul(b, 0.84), [170, 70, 70], 0.12); dp = mix(mul(b, 0.66), [110, 40, 70], 0.22); }
    if (kind === 'dark') { hi = mix(b, [150, 150, 190], 0.45); sh = mix(mul(b, 0.7), [20, 10, 40], 0.2); dp = mix(mul(b, 0.45), [10, 5, 20], 0.3); }
    const ln = mix(mul(b, 0.3), [16, 8, 24], 0.55);
    return (rampCache[k] = [hi, b, sh, dp, ln].map(fix));
  }
  function shade(hex, amt) {
    const c = hexRgb(hex);
    const r = amt < 0 ? mul(c, 1 + amt) : mix(c, [255, 255, 255], amt);
    return '#' + fix(r).map(v => ('0' + v.toString(16)).slice(-2)).join('');
  }
  const toneOf = b => b > 0.8 ? 0 : b > 0.48 ? 1 : b > 0.16 ? 2 : 3;
  const hash = (x, y) => { let h = (x * 374761393 + y * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967295; };

  // ---------- Buffer de pintura ----------
  const buf = new Uint8ClampedArray(SW * SH * 4);
  const ids = new Uint8Array(SW * SH);
  function clear() { buf.fill(0); ids.fill(0); }
  function put(x, y, c, pid) {
    if (x < 0 || y < 0 || x >= SW || y >= SH) return;
    const i = y * SW + x;
    buf[i * 4] = c[0]; buf[i * 4 + 1] = c[1]; buf[i * 4 + 2] = c[2]; buf[i * 4 + 3] = 255; ids[i] = pid;
  }

  // Cápsula sombreada (membros)
  function capsule(ax, ay, bx, by, ra, rb, R, pid, opt) {
    opt = opt || {};
    const x0 = Math.max(0, Math.floor(Math.min(ax - ra, bx - rb)) - 1), x1 = Math.min(SW - 1, Math.ceil(Math.max(ax + ra, bx + rb)) + 1);
    const y0 = Math.max(0, Math.floor(Math.min(ay - ra, by - rb)) - 1), y1 = Math.min(SH - 1, Math.ceil(Math.max(ay + ra, by + rb)) + 1);
    const dx = bx - ax, dy = by - ay, len2 = dx * dx + dy * dy || 0.0001, len = Math.sqrt(len2);
    const ux = dx / len, uy = dy / len;
    const t0 = opt.from || 0, t1 = opt.to === undefined ? 1 : opt.to;
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const px = x + 0.5 - ax, py = y + 0.5 - ay;
      let t = (px * dx + py * dy) / len2;
      if (t < t0 - (t0 > 0 ? 0 : 1) || t > t1 + (t1 < 1 ? 0 : 1)) continue;
      t = Math.max(t0, Math.min(t1, t));
      const cx = ax + dx * t, cy = ay + dy * t, r = ra + (rb - ra) * t;
      const ox = x + 0.5 - cx, oy = y + 0.5 - cy, d = Math.hypot(ox, oy);
      if (d > r) continue;
      const nx = ox / r, ny = oy / r, nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
      let tone = toneOf((nx * L[0] + ny * L[1] + nz * L[2]) * 0.92 + 0.12);
      const i = y * SW + x;
      let col = null;
      if (opt.pattern) { const p = opt.pattern(t * len, ux * oy - uy * ox, tone, r, x, y); if (Array.isArray(p)) col = p; else tone = p; }
      if (!col) {
        if (d > r - 1.05 && ids[i] && ids[i] !== pid && opt.sep !== false) col = R[4];
        else col = R[Math.max(0, Math.min(3, tone))];
      }
      put(x, y, col, pid);
    }
  }
  function blob(cx, cy, r, R, pid, toneShift) {
    for (let y = Math.floor(cy - r); y <= cy + r; y++) for (let x = Math.floor(cx - r); x <= cx + r; x++) {
      const ox = x + 0.5 - cx, oy = y + 0.5 - cy, d = Math.hypot(ox, oy);
      if (d > r) continue;
      const nx = ox / r, ny = oy / r, nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
      const tone = Math.min(3, toneOf((nx * L[0] + ny * L[1] + nz * L[2]) * 0.92 + 0.12) + (toneShift || 0));
      put(x, y, d > r - 1 && ids[y * SW + x] && ids[y * SW + x] !== pid ? R[3] : R[tone], pid);
    }
  }

  // Tronco: perfil [costas, frente] por altura normalizada
  function torso(hip, lean, len, prof, R, pid, pattern) {
    const sx = Math.sin(lean), cy = Math.cos(lean);
    const dux = sx, duy = -cy;      // para cima ao longo da coluna
    const nfx = cy, nfy = sx;       // para frente
    const ext = len + 8;
    const x0 = Math.max(0, Math.floor(hip.x - ext - 12)), x1 = Math.min(SW - 1, Math.ceil(hip.x + ext + 12));
    const y0 = Math.max(0, Math.floor(hip.y - ext - 4)), y1 = Math.min(SH - 1, Math.ceil(hip.y + 8));
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const px = x + 0.5 - hip.x, py = y + 0.5 - hip.y;
      const v = px * dux + py * duy, u = px * nfx + py * nfy;
      const vn = v / len;
      if (vn < -0.08 || vn > 1.05) continue;
      let [bk, fr] = prof(Math.max(0, Math.min(1, vn)));
      if (vn > 0.86) { const k = Math.sqrt(Math.max(0, 1 - Math.pow((vn - 0.86) / 0.2, 2))); bk *= k; fr *= k; }
      if (u < -bk || u > fr) continue;
      const half = (bk + fr) / 2, c = (fr - bk) / 2;
      const s = (u - c) / half;
      const kv = vn > 0.8 ? (vn - 0.8) / 0.25 : (vn < 0.06 ? -0.3 : 0);
      let nx = s * nfx * 0.95 + kv * dux * 0.7, ny = s * nfy * 0.95 + kv * duy * 0.7;
      const m = Math.hypot(nx, ny); if (m > 0.98) { nx *= 0.98 / m; ny *= 0.98 / m; }
      const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
      let tone = toneOf((nx * L[0] + ny * L[1] + nz * L[2]) * 0.92 + 0.12);
      let col = null;
      if (pattern) { const p = pattern(u, v, vn, tone, s, x, y); if (Array.isArray(p)) col = p; else if (p !== undefined && p !== null) tone = p; }
      if (!col) col = (Math.abs(s) > 0.94 && ids[y * SW + x] && ids[y * SW + x] !== pid) ? R[4] : R[Math.max(0, Math.min(3, tone))];
      put(x, y, col, pid);
    }
  }

  // ---------- IK de 2 ossos ----------
  function ik(sx, sy, tx, ty, a, b, sign) {
    let dx = tx - sx, dy = ty - sy, d = Math.hypot(dx, dy);
    const maxD = a + b - 0.05;
    if (d > maxD) { dx *= maxD / d; dy *= maxD / d; d = maxD; }
    d = Math.max(d, Math.abs(a - b) + 0.5);
    const base = Math.atan2(dy, dx);
    const off = Math.acos(Math.max(-1, Math.min(1, (a * a + d * d - b * b) / (2 * a * d))));
    const ang = base + sign * off;
    return { jx: sx + Math.cos(ang) * a, jy: sy + Math.sin(ang) * a, ex: sx + dx, ey: sy + dy };
  }

  // ---------- Cabeça (grade 32x38, perfil 3/4 olhando para a direita) ----------
  const HW = 32, HH = 38, NECK_X = 15, NECK_Y = 33;
  function buildHead(look, expr) {
    const g = new Array(HW * HH).fill(null);
    const set = (x, y, c) => { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < HW && y < HH) g[y * HW + x] = c; };
    const get = (x, y) => (x >= 0 && y >= 0 && x < HW && y < HH) ? g[y * HW + x] : null;
    const sk = ramp(look.skin, 'skin');
    const hr = ramp(look.hair, look.hairDark ? 'dark' : '');
    const dye = look.dye ? ramp(look.dye) : null;
    const lit = (nx, ny) => { const m = Math.hypot(nx, ny); if (m > 0.99) { nx *= 0.99 / m; ny *= 0.99 / m; } return (nx * L[0] + ny * L[1] + Math.sqrt(1 - nx * nx - ny * ny) * L[2]) * 0.92 + 0.12; };
    const hs = look.hairStyle;
    const longHair = ['long', 'longCurly', 'wavy', 'curlyMid'].includes(hs);
    const curly = ['curly', 'curlyBig', 'longCurly', 'curlyMid'].includes(hs);
    const hairCol = (x, y, tone) => {
      let R = hr;
      if (dye && y > (look.dyeFrom || 7)) R = dye;
      if (look.hairTips && y > 26) R = ramp(look.hairTips);
      return R[Math.max(0, Math.min(3, tone))];
    };
    const hairTone = (x, y, cx, cy, rx, ry) => {
      let t = toneOf(lit((x + 0.5 - cx) / rx, (y + 0.5 - cy) / ry));
      if (curly) { // cachos: grade hexagonal de pequenas esferas
        const cs = hs === 'curlyBig' ? 3.6 : 3.1;
        const row = Math.floor(y / cs * 1.15), ox = (row % 2) * cs / 2;
        const lx = ((x + 0.5 + ox) % cs) / cs - 0.5, ly = ((y + 0.5) * 1.15 % cs) / cs - 0.5;
        const d = Math.hypot(lx, ly);
        if (d < 0.22 && lx < 0.05 && ly < 0.05) t = Math.max(0, t - 1);
        else if (d > 0.47) t = Math.min(3, t + 1);
      } else { // fios
        if (hash(x, (y / 5) | 0) > 0.78) t = Math.min(3, t + 1);
        if (hash(x + 7, (y / 3) | 0) > 0.92 && t > 0) t--;
      }
      return t;
    };

    // 1) volume de cabelo atrás (cabelo longo cai atrás do pescoço)
    if (longHair) {
      const len = hs === 'curlyMid' ? 31 : 37;
      for (let y = 8; y <= len; y++) for (let x = 2; x <= 15; x++) {
        const w = (curly ? 6.2 : 5.2) + (y - 8) * 0.09 + (curly ? Math.sin(y * 1.3) * 0.8 : 0);
        if (Math.abs(x + 0.5 - 8.5 - (y - 8) * 0.05) > w) continue;
        set(x, y, hairCol(x, y, hairTone(x, y, 9, 18, 7, 16)));
      }
    }
    // 2) crânio/cabelo de trás
    const sc = { short: [9.4, 8.6], quiff: [9.6, 8.8], curly: [10.8, 10], curlyBig: [12.6, 11.4], long: [9.6, 9], longCurly: [11.2, 10], wavy: [10, 9.4], curlyMid: [11, 9.8] }[hs] || [9.5, 9];
    const SCX = 15.6, SCY = 13.2;
    for (let y = 0; y < HH; y++) for (let x = 0; x < HW; x++) {
      const a = Math.atan2(y - SCY, x - SCX);
      const bump = curly ? 1 + 0.07 * Math.sin(a * 9 + 1) + 0.04 * Math.sin(a * 17) : 1;
      const ex = (x + 0.5 - SCX) / (sc[0] * bump), ey = (y + 0.5 - SCY) / (sc[1] * bump);
      if (ex * ex + ey * ey <= 1) set(x, y, hairCol(x, y, hairTone(x, y, SCX, SCY - 2, sc[0], sc[1])));
    }
    if (hs === 'quiff') for (let y = 2; y < 7; y++) for (let x = 15; x < 25; x++) if ((x - 15) * 0.6 + (6 - y) < 6 && y > 6 - (x - 14) * 0.7) set(x, y, hairCol(x, y, hairTone(x, y, 19, 6, 6, 4)));

    // 3) rosto
    const FX = 17.4, FY = 18.6;
    const inFace = (x, y) => {
      const ex = (x + 0.5 - FX) / 8.1, ey = (y + 0.5 - FY) / 10.4;
      if (ex * ex + ey * ey > 1) return false;
      if (y > 21 && x + 0.5 < 10.4 + (y - 21) * 1.0) return false;
      if (y > 24 && x + 0.5 > 25.6 - (y - 24) * 0.62) return false;
      return y <= 29;
    };
    for (let y = 24; y <= 34; y++) for (let x = 12; x <= 18; x++) set(x, y, sk[y < 30 ? 3 : 2]);
    for (let y = 0; y < HH; y++) for (let x = 0; x < HW; x++) if (inFace(x, y)) {
      let t = toneOf(lit((x + 0.5 - 16) / 8.5, (y + 0.5 - 17) / 11.5));
      if (y >= 15 && y <= 16 && x >= 19 && x <= 23 && t < 2) t++; // sombra do olho
      if (y >= 27 && t < 3) t++;
      set(x, y, sk[t]);
    }
    // nariz e pescoço
    [[24, 18], [24, 19], [25, 19], [24, 20], [25, 20], [25, 21], [24, 21], [24, 22]].forEach(([x, y]) => set(x, y, sk[x === 25 && y < 21 ? 0 : 1]));
    set(25, 22, sk[2]); set(23, 23, sk[2]); set(24, 22, sk[3]);
    for (let y = 22; y < 31; y++) for (let x = 12; x < 25; x++) if (inFace(x, y) && !inFace(x, y + 1) && get(x, y + 1)) set(x, y + 1, sk[4]);
    // orelha
    for (let y = 17; y <= 23; y++) for (let x = 9; x <= 12; x++) {
      const e = ((x + 0.5 - 10.8) / 1.9) ** 2 + ((y + 0.5 - 20.2) / 3.3) ** 2;
      if (e <= 1) set(x, y, sk[e < 0.35 ? 3 : (x > 10 ? 1 : 2)]);
    }
    set(10, 19, sk[3]); set(11, 20, sk[2]);
    if (look.gauge) { set(10, 23, [20, 20, 22]); set(11, 23, [20, 20, 22]); set(10, 24, [20, 20, 22]); set(11, 24, [60, 60, 70]); }
    if (look.earring) { set(11, 24, hexRgb(look.earring)); }

    // 4) olhos, sobrancelhas, boca
    const line = sk[4], eye = [34, 22, 20], white = [246, 240, 232];
    const iris = look.iris ? hexRgb(look.iris) : [70, 40, 26];
    const brow = mix(hr[3], [0, 0, 0], 0.2);
    const bw = look.brow || 1;
    if (expr === 'shout') { [[19, 13], [20, 13], [21, 14], [22, 14], [23, 15]].forEach(([x, y]) => { set(x, y, brow); if (bw > 1) set(x, y - 1, brow); }); set(13, 14, brow); set(14, 14, brow); set(15, 15, brow); }
    else { for (let x = 19; x <= 23; x++) { set(x, 14 - (x === 21 ? 1 : 0), brow); if (bw > 1) set(x, 13 - (x === 21 ? 1 : 0), brow); } set(13, 14, brow); set(14, 14, brow); set(15, 14, brow); }
    if (expr === 'blink') { for (let x = 19; x <= 23; x++) set(x, 18, line); set(13, 18, line); set(14, 18, line); set(15, 18, line); }
    else if (expr === 'happy') { set(19, 18, line); set(20, 17, line); set(21, 16, line); set(22, 17, line); set(23, 18, line); set(13, 18, line); set(14, 17, line); set(15, 18, line); }
    else if (expr === 'hurt') { set(19, 16, line); set(20, 17, line); set(21, 18, line); set(22, 17, line); set(23, 18, line); set(13, 17, line); set(14, 18, line); set(15, 17, line); }
    else {
      for (let x = 19; x <= 23; x++) set(x, 16, line);
      set(20, 17, white); set(21, 17, white); set(20, 18, white); set(21, 18, mix(white, sk[1], 0.3));
      set(22, 17, iris); set(22, 18, eye); set(23, 17, eye); set(23, 18, mix(white, sk[2], 0.4));
      set(13, 16, line); set(14, 16, line); set(15, 16, line);
      set(14, 17, white); set(15, 17, iris); set(15, 18, eye); set(14, 18, mix(white, sk[2], 0.4));
      if (look.lashes) { set(24, 16, line); set(24, 15, line); set(12, 16, line); }
    }
    const lip = look.lips ? ramp(look.lips) : null;
    const mline = lip ? lip[2] : mix(line, [150, 40, 50], 0.35);
    if (expr === 'shout') { for (let y = 24; y <= 27; y++) for (let x = 19; x <= 22; x++) set(x, y, [58, 12, 24]); set(19, 24, white); set(20, 24, white); set(21, 24, white); set(20, 27, [190, 70, 80]); set(21, 27, [190, 70, 80]); }
    else if (expr === 'happy') { set(18, 24, mline); set(23, 24, mline); for (let x = 19; x <= 22; x++) set(x, 25, white); set(19, 26, mline); set(20, 26, mline); set(21, 26, mline); }
    else if (expr === 'hurt') { for (let x = 18; x <= 22; x++) set(x, 25, x % 2 ? white : mline); }
    else {
      for (let x = 19; x <= 22; x++) set(x, 25, mline);
      if (look.smirk) set(22, 24, mline);
      if (lip) { set(19, 26, lip[1]); set(20, 26, lip[0]); set(21, 26, lip[1]); set(19, 25, lip[2]); set(20, 25, lip[3]); set(21, 25, lip[2]); set(22, 25, lip[3]); set(20, 24, lip[1]); set(21, 24, lip[1]); }
      else set(20, 26, sk[0]);
    }
    if (look.blush && expr !== 'hurt') { const bl = hexRgb(look.blush); set(20, 21, mix(sk[1], bl, 0.5)); set(21, 21, mix(sk[1], bl, 0.6)); set(14, 21, mix(sk[2], bl, 0.4)); }

    // 5) barba
    if (look.beard) {
      const br = ramp(look.beard);
      const mouthRow = expr === 'shout' ? [24, 27] : (expr === 'happy' ? [25, 25] : [25, 25]);
      for (let y = 15; y < 31; y++) for (let x = 9; x < 26; x++) {
        const c = get(x, y); if (!c) continue;
        const isSkin = sk.some(s => s[0] === c[0] && s[1] === c[1] && s[2] === c[2]);
        if (!isSkin) continue;
        let on = false;
        const type = look.beard ? look.beardType || 'full' : null;
        if (type === 'full') on = (y >= 22 && x <= 24) || (x <= 14 && y >= 17 && x >= 12) || (y >= 21 && x <= 16);
        if (type === 'goatee') on = (y >= 23 && y <= 24 && x >= 18 && x <= 24) || (y >= 26 && x >= 17 && x <= 23) || (y >= 27 && x >= 14);
        if (type === 'mustache') on = (y === 23 && x >= 18 && x <= 24) || (y === 24 && (x === 18 || x === 23));
        if (type === 'stubble') on = y >= 22 && hash(x, y) > 0.55;
        if (on && !(y >= mouthRow[0] && y <= mouthRow[1] && x >= 19 && x <= 22)) {
          let t = toneOf(lit((x + 0.5 - 16) / 8.5, (y + 0.5 - 17) / 11.5));
          if (hash(x * 3, y * 5) > 0.7) t = Math.min(3, t + 1);
          if (y >= 28) t = Math.min(3, t + 1);
          set(x, y, br[t]);
        }
      }
      if ((look.beardType || 'full') === 'full') { for (let x = 18; x <= 24; x++) set(x, 23, br[x > 22 ? 1 : 2]); for (let y = 29; y <= 31; y++) for (let x = 14; x <= 20; x++) if (hash(x, y) > 0.3) set(x, y, br[3]); }
    }

    // 6) cabelo da frente (franja, costeletas)
    for (let y = 0; y < HH; y++) for (let x = 0; x < HW; x++) {
      const ex = (x + 0.5 - SCX) / sc[0], ey = (y + 0.5 - SCY) / sc[1];
      if (ex * ex + ey * ey > 1.05) continue;
      let lineY;
      if (x >= 15) lineY = 10.5 + (hs === 'short' ? (x > 18 && x < 24 ? 1.6 : 0.5) : 0) + (hs === 'long' || hs === 'wavy' ? (x > 19 ? 1.5 : 0) : 0) + (curly ? -0.5 + Math.sin(x * 1.7) * 0.6 : 0) + (hs === 'curlyBig' ? -1 : 0);
      else if (x >= 12) lineY = hs === 'short' || hs === 'quiff' ? 17 : 19;
      else lineY = 30;
      if (y < lineY) {
        let t = hairTone(x, y, SCX, SCY - 2, sc[0], sc[1]);
        if ((hs === 'short') && x >= 11 && x <= 13 && y > 13) t = Math.min(3, t + 1); // degradê
        set(x, y, hairCol(x, y, t));
      }
    }
    if (longHair) { // mecha na frente do ombro
      for (let y = 12; y < (hs === 'curlyMid' ? 30 : 36); y++) {
        const x0 = 7 + Math.sin(y * 0.6) * (curly ? 0.8 : 0.3);
        for (let x = Math.floor(x0); x < x0 + 3; x++) if (!get(x, y) || y > 21) set(x, y, hairCol(x, y, hairTone(x, y, 9, 18, 7, 16)));
      }
    }
    if (look.headband) { const hb = ramp(look.headband); for (let x = 7; x < 24; x++) { const y = Math.round(9.5 - (x - 15) * 0.15 + Math.pow((x - 15) / 9, 2) * 3); set(x, y, hb[x > 18 ? 0 : 1]); set(x, y + 1, hb[2]); } }
    if (look.cap) { const cp = ramp(look.cap); for (let y = 3; y < 10; y++) for (let x = 6; x < 25; x++) { const e = ((x - 15.5) / 9.6) ** 2 + ((y - 10) / 7) ** 2; if (e < 1) set(x, y, cp[e < 0.4 ? 0 : (x < 12 ? 2 : 1)]); } for (let x = 2; x < 8; x++) { set(x, 8, cp[2]); set(x, 9, cp[3]); } }

    // 7) óculos
    if (look.glasses) {
      const fc = hexRgb(look.glasses);
      const lens = (x0, x1) => {
        for (let x = x0; x <= x1; x++) { set(x, 15, fc); set(x, 19, fc); }
        for (let y = 15; y <= 19; y++) { set(x0, y, fc); set(x1, y, fc); }
        for (let y = 16; y <= 18; y++) for (let x = x0 + 1; x < x1; x++) { const c = get(x, y); if (c) set(x, y, mix(c, [210, 230, 255], 0.22)); }
        set(x0 + 1, 16, [235, 245, 255]);
      };
      lens(19, 24); lens(12, 16);
      set(17, 16, fc); set(18, 16, fc);
      for (let x = 9; x < 12; x++) set(x, 16, fc);
    }

    // 8) contorno
    const out = g.slice();
    for (let y = 0; y < HH; y++) for (let x = 0; x < HW; x++) {
      if (g[y * HW + x] || y >= 31) continue;
      const n = get(x - 1, y) || get(x + 1, y) || get(x, y - 1) || get(x, y + 1);
      if (n) out[y * HW + x] = fix(mix(mul(n, 0.25), [20, 10, 24], 0.6));
    }
    return { w: HW, h: HH, px: out };
  }

  function blitHead(head, nx, ny, mode) {
    // mode: 0 normal, 1 deitado (gira -90)
    for (let y = 0; y < head.h; y++) for (let x = 0; x < head.w; x++) {
      const c = head.px[y * head.w + x]; if (!c) continue;
      let X, Y;
      if (mode === 1) { X = nx + (y - NECK_Y); Y = ny - (x - NECK_X); }
      else { X = nx + x - NECK_X; Y = ny + y - NECK_Y; }
      put(Math.round(X), Math.round(Y), c, 20);
    }
  }

  // ---------- Corpo ----------
  function drawBody(ch, pose, heads, t) {
    const Lk = ch.look, S = ch.scale || 1, B = ch.build || 1;
    const P = v => v * S;
    const hip = { x: OX + P(pose.hip[0]), y: OY + P(pose.hip[1]) };
    const lean = (pose.lean || 0) * Math.PI / 180;
    const tl = P(19);
    const neck = { x: hip.x + Math.sin(lean) * tl, y: hip.y - Math.cos(lean) * tl };
    const shY = neck.y + P(2.6);
    const thigh = P(15), shin = P(13.2), upper = P(11), fore = P(10.5);
    const tgt = p => ({ x: OX + P(p[0]), y: OY + P(p[1]) });
    const skin = ramp(Lk.skin, 'skin');
    const shirt = ramp(Lk.shirt, Lk.shirtDark ? 'dark' : '');
    const sleeve = ramp(Lk.sleeve || Lk.shirt, Lk.shirtDark && !Lk.sleeve ? 'dark' : '');
    const pants = ramp(Lk.pants, Lk.pantsDark ? 'dark' : '');
    const shoes = ramp(Lk.shoes || '#2a2a2a', 'dark');
    const sole = ramp(Lk.shoeSole || '#d8d8d8');
    const fem = !!Lk.female;
    const bShoulder = { x: neck.x - P(2.6), y: shY }, fShoulder = { x: neck.x + P(2.4), y: shY + 1 };
    const bHipP = { x: hip.x - P(1.8), y: hip.y + 1 }, fHipP = { x: hip.x + P(1.8), y: hip.y + 1 };
    const dark = (R) => [R[2], R[2], R[3], R[3], R[4]]; // versão para membros de trás

    // cabelo longo atrás do corpo
    if (['long', 'longCurly', 'wavy', 'curlyMid'].includes(Lk.hairStyle)) {
      const hr = ramp(Lk.hairTips && false ? Lk.hairTips : (Lk.dye || Lk.hair));
      const len = Lk.hairStyle === 'curlyMid' ? P(9) : P(16);
      const sway = Math.sin(t / 10) * 1.5 + (pose.hairSwing || 0);
      const top = { x: neck.x - P(4.2), y: neck.y - P(6) };
      if (pose.lying) {
        for (let i = 0; i < 6; i++) blob(neck.x - P(8) - i * 2, neck.y + 2 + i * 0.5, P(3.2), hr, 2, 1);
      } else {
        const curly = Lk.hairStyle !== 'long' && Lk.hairStyle !== 'wavy';
        for (let i = 0; i <= len; i += curly ? 2 : 1.5) {
          const k = i / len;
          const x = top.x - Math.sin(lean) * i * 0.4 - sway * k - k * P(1.5);
          const y = top.y + i;
          const r = P(curly ? 4.2 : 3.6) * (1 + k * 0.15) + (curly ? Math.sin(i * 1.7) * 0.8 : 0);
          blob(x, y, r, Lk.hairTips && k > 0.6 ? ramp(Lk.hairTips) : hr, 2, curly && (i % 4 === 0) ? 1 : 0);
        }
      }
    }

    function arm(sh, hand, front) {
      const r = ik(sh.x, sh.y, hand.x, hand.y, upper, fore, 1);
      const pid = front ? 30 : 3;
      const sk = front ? skin : dark(skin);
      const slv = front ? sleeve : dark(sleeve);
      const ua = P(2.85) * B, fa = P(2.4) * B;
      const longS = Lk.longSleeve;
      // braço
      capsule(sh.x, sh.y, r.jx, r.jy, ua, ua * 0.86, Lk.sleeveless ? sk : (longS ? slv : sk), pid);
      capsule(r.jx, r.jy, r.ex, r.ey, fa, fa * 0.8, longS ? slv : sk, pid + 1, longS ? { pattern: Lk.pattern === 'plaid' ? plaid(slv) : null } : (Lk.tattoo && front ? { pattern: tattoo(Lk.tattoo) } : null));
      if (!Lk.sleeveless && !longS) capsule(sh.x, sh.y, r.jx, r.jy, ua + 0.9, ua * 0.95, slv, pid, { to: Lk.raglan ? 0.75 : 0.55, pattern: Lk.sleeveStripe ? stripeAt(0.5, ramp(Lk.sleeveStripe)) : null });
      if (longS) capsule(sh.x, sh.y, r.jx, r.jy, ua + 0.7, ua, slv, pid, { pattern: Lk.pattern === 'plaid' ? plaid(slv) : null });
      if (Lk.bracelet && front) capsule(r.jx + (r.ex - r.jx) * 0.82, r.jy + (r.ey - r.jy) * 0.82, r.jx + (r.ex - r.jx) * 0.9, r.jy + (r.ey - r.jy) * 0.9, fa * 0.9, fa * 0.85, ramp(Lk.bracelet, 'dark'), pid + 1);
      // mão (punho)
      const hx = r.ex + (r.ex - r.jx) / fore * P(1.6), hy = r.ey + (r.ey - r.jy) / fore * P(1.6);
      blob(hx, hy, P(2.7), sk, pid + 2);
      if (front) { put(Math.round(hx + 1), Math.round(hy - 1), sk[0], pid + 2); put(Math.round(hx), Math.round(hy + 1), sk[3], pid + 2); }
      return { r, hx, hy };
    }
    function leg(h, foot, front) {
      const ankle = { x: foot.x, y: foot.y - P(1.9) };
      const r = ik(h.x, h.y, ankle.x, ankle.y, thigh, shin, -1);
      const pid = front ? 25 : 5;
      const pc = front ? pants : dark(pants);
      const sk = front ? skin : dark(skin);
      const tA = P(3.5) * B, tB = P(2.7) * B, sA = P(2.6) * B, sB = P(1.85) * B;
      const shortLen = Lk.shorts ? (Lk.shortsLen || 0.55) : 1;
      // coxa
      capsule(h.x, h.y, r.jx, r.jy, tA, tB, Lk.shorts ? sk : pc, pid, { pattern: folds(pc) });
      if (Lk.shorts) capsule(h.x, h.y, r.jx, r.jy, tA + 0.8, tB + 0.6, pc, pid, { to: shortLen, pattern: folds(pc) });
      // canela
      const shinR = Lk.shorts || Lk.stockingsSkin ? sk : pc;
      capsule(r.jx, r.jy, r.ex, r.ey, sA, sB, Lk.stockings ? (front ? ramp(Lk.stockings, 'dark') : dark(ramp(Lk.stockings, 'dark'))) : shinR, pid + 1, { pattern: Lk.shorts ? null : (Lk.ripped && front ? ripped(pc, sk) : folds(pc)) });
      if (Lk.socks && !Lk.boots) capsule(r.jx + (r.ex - r.jx) * 0.75, r.jy + (r.ey - r.jy) * 0.75, r.ex, r.ey, sB + 0.6, sB + 0.4, ramp(Lk.socks), pid + 1);
      if (Lk.boots) capsule(r.jx + (r.ex - r.jx) * 0.55, r.jy + (r.ey - r.jy) * 0.55, r.ex, r.ey, sA * 0.95 + 0.6, sB + 0.6, front ? shoes : dark(shoes), pid + 1);
      // pé / tênis
      const dx = r.ex - r.jx, dy = r.ey - r.jy, dl = Math.hypot(dx, dy) || 1;
      let fx = -dy / dl, fy = dx / dl; if (fx < 0) { fx = -fx; fy = -fy; }
      const toeX = ankle.x + fx * P(5.4) + P(0.6), toeY = Math.min(foot.y, ankle.y + fy * P(5.4) + P(1.3));
      capsule(ankle.x - P(0.6), ankle.y + P(1.0), toeX, toeY + 0.4, P(1.75), P(1.5), front ? sole : dark(sole), pid + 2, { sep: false });
      capsule(ankle.x - P(0.4), ankle.y + P(0.1), toeX - 0.5, toeY - 0.8, P(1.8), P(1.35), front ? shoes : dark(shoes), pid + 2);
      return r;
    }

    // ----- padrões -----
    function folds(R) { return (along, perp, tone, rad) => { const k = Math.floor(along); if (tone === 1 && (k % 6 === 3) && perp > rad * 0.1) return 2; if (tone === 2 && (k % 6 === 3) && perp > 0) return 3; return tone; }; }
    function ripped(R, sk) { return (along, perp, tone, rad, x, y) => { if (along < P(5) && along > P(1) && Math.abs(perp) < rad * 0.6 && hash(x, y) > 0.35) return hash(x + 1, y) > 0.5 ? sk[1] : [235, 235, 240]; return folds(R)(along, perp, tone, rad); }; }
    function stripeAt(pos, SR) { return (along, perp, tone, rad) => { return null; }; }
    function tattoo(col) { const c = hexRgb(col); return (along, perp, tone, rad, x, y) => (hash(x, y * 2) > 0.8 && along > 2 && along < fore - 2) ? fix(mix(skin[tone], c, 0.7)) : tone; }
    function plaid(R) { return (along, perp, tone, rad, x, y) => { const a = Math.floor(along / 3), b = Math.floor((perp + 10) / 3); if ((a + b) % 2 === 0) return Math.min(3, tone + 1); if (a % 3 === 0) return [235, 220, 210]; return tone; }; }

    const bHand = tgt(pose.bHand), fHand = tgt(pose.fHand);
    const bFoot = tgt(pose.bFoot), fFoot = tgt(pose.fFoot);
    if (pose.backProp) drawPropBuf(pose.backProp, bHand.x, bHand.y, t);
    arm(bShoulder, bHand, false);
    if (Lk.backpack) { const bp = ramp(Lk.backpack); capsule(neck.x - P(6.5) - Math.sin(lean) * P(4), shY + P(2), neck.x - P(6.5) - Math.sin(lean) * P(10), shY + P(11), P(3.6), P(3.8), bp, 4); }
    leg(bHipP, bFoot, false);

    // ----- tronco -----
    const sz = P(1);
    const belly = (Lk.belly || 0) * sz;
    const prof = fem
      ? vn => { const hipW = 6.2, waist = 4.4, chest = 5.6, sh = 5.8; let w = vn < 0.4 ? hipW + (waist - hipW) * vn / 0.4 : vn < 0.7 ? waist + (chest - waist) * (vn - 0.4) / 0.3 : chest + (sh - chest) * (vn - 0.7) / 0.3; const bust = vn > 0.55 && vn < 0.82 ? Math.sin((vn - 0.55) / 0.27 * Math.PI) * 1.4 : 0; return [w * sz * B, (w + bust) * sz * B]; }
      : vn => { const hipW = 5.6, waist = 5.4, chest = 6.6, sh = 7.4; let w = vn < 0.4 ? hipW + (waist - hipW) * vn / 0.4 : vn < 0.75 ? waist + (chest - waist) * (vn - 0.4) / 0.35 : chest + (sh - chest) * (vn - 0.75) / 0.25; const bl = vn > 0.08 && vn < 0.6 ? Math.sin((vn - 0.08) / 0.52 * Math.PI) * belly : 0; return [w * sz * B, (w * sz + bl) * B]; };
    const waistband = 0.1;
    const torsoPattern = (u, v, vn, tone, s, x, y) => {
      if (vn < waistband && !Lk.dress && !Lk.cropTop) { const pr = pants; return Lk.belt && vn > waistband - 0.04 ? ramp(Lk.belt, 'dark')[Math.min(3, tone)] : pr[tone]; }
      if (Lk.cropTop && vn < 0.3) return vn < 0.08 ? pants[tone] : skin[tone];
      if (Lk.jacket && Math.abs(s) > 0.42) { const jr = ramp(Lk.jacket); const a = Math.floor((u + 20) / 3), b = Math.floor(v / 3); if ((a + b) % 2 === 0) return jr[Math.min(3, tone + 1)]; if (b % 3 === 0) return [235, 220, 210]; return jr[tone]; }
      if (Lk.neckline && vn > 0.86 && u > -1 && u < 3.5 * sz && vn > 1.02 - (2.5 - Math.abs(u / sz - 1)) * 0.06) return skin[tone];
      if (Lk.sleeveless && vn > 0.9 && s < -0.2) return skin[tone];
      if (Lk.print) { const p = printAt(Lk.print, u / sz, (v / sz), vn, tone, x, y); if (p) return p; }
      if (vn > waistband && vn < waistband + 0.04) return Math.min(3, tone + 1); // barra da camiseta
      if (tone === 1 && hash(x >> 1, y >> 2) > 0.93) return 2; // dobras
      return tone;
    };
    torso(hip, lean, tl, prof, shirt, 10, torsoPattern);
    function printAt(name, u, v, vn, tone, x, y) {
      const cu = u - 1.2; // centro do peito
      if (name === 'brasil') {
        if (vn > 0.9 && Math.abs(cu) < 3) return ramp('#0a7a3a')[tone];
        if (vn > 0.55 && vn < 0.78 && cu > -2.5 && cu < 2.5) { const dg = (cu > -2 && cu < -0.5) || (cu > 0.5 && cu < 2); return dg ? ramp('#0a7a3a')[Math.min(3, tone)] : null; }
        if (vn > 0.7 && vn < 0.8 && cu > 3 && cu < 5) return ramp('#2a4ab0')[tone];
      }
      if (name === 'navy01') { // camiseta azul com "01" e ondas
        if (vn > 0.5 && vn < 0.72) { const ring = Math.abs(Math.hypot(cu + 1.2, (vn - 0.61) * 19 / 1) - 2.2) < 0.7; if (ring) return ramp(hash(0, 1) > 0 ? '#e8c020' : '#fff')[tone]; if (cu > 1.8 && cu < 2.6) return ramp('#e8c020')[tone]; }
        if (vn > 0.3 && vn < 0.45 && Math.abs(Math.sin(cu * 1.3 + vn * 30)) < 0.15) return ramp('#5a8ae0')[tone];
      }
      if (name === 'tiny') { if (vn > 0.62 && vn < 0.68 && cu > -1.5 && cu < 3 && hash(x, y) > 0.4) return [220, 220, 220]; if (vn > 0.7 && vn < 0.75 && cu > 0 && cu < 1.2) return [200, 200, 200]; }
      if (name === 'emblem') { const d = Math.hypot(cu - 0.5, (vn - 0.7) * 19); if (d < 1.4) return ramp('#7a8aa0')[tone]; }
      if (name === 'band') { if (vn > 0.48 && vn < 0.78 && cu > -2.6 && cu < 3) { const w = ramp('#d8c8b0'); return (hash(x, y) > 0.55) ? w[Math.min(3, tone + 1)] : w[tone]; } }
      if (name === 'chain') { if (Math.abs(vn - 0.88 + Math.pow(cu / 6, 2) * 0.4) < 0.025 && Math.abs(cu) < 4) return [220, 200, 120]; }
      return null;
    }

    // vestido / saia
    if (Lk.dress || Lk.skirt) {
      const dr = ramp(Lk.dress || Lk.skirt);
      const len = P(Lk.dress ? 14 : 8);
      const spread = (fFoot.x - bFoot.x) * 0.28;
      for (let i = 0; i < len; i++) {
        const w = P(6.4) + i * 0.55 + Math.abs(spread) * i / len;
        const cy = Math.round(hip.y - 1 + i), cx = hip.x + spread * i / len * 0.4;
        for (let x = Math.round(cx - w); x <= Math.round(cx + w); x++) {
          const s = (x + 0.5 - cx) / w;
          let tone = toneOf((s * L[0] + Math.sqrt(Math.max(0, 1 - s * s)) * L[2]) * 0.92 + 0.12 - i / len * 0.15);
          if (Math.floor(x / 4 + i * 0.1) % 3 === 0 && tone < 3) tone++;
          let col = dr[tone];
          if (Lk.dressPattern && hash(x, cy) > 0.78) col = hexRgb(Lk.dressPattern[Math.floor(hash(cy, x) * Lk.dressPattern.length)]);
          if (i === len - 1) col = dr[3];
          put(x, cy, col, 12);
        }
      }
    }

    leg(fHipP, fFoot, true);
    if (Lk.skirt && !Lk.dress) { /* saia por cima da perna da frente */
      const dr = ramp(Lk.skirt); const len = P(7);
      for (let i = 0; i < len; i++) { const w = P(6.2) + i * 0.5, cy = Math.round(hip.y - 1 + i); for (let x = Math.round(hip.x - w); x <= Math.round(hip.x + w); x++) { const s = (x + 0.5 - hip.x) / w; put(x, cy, dr[toneOf(s * 0.5 + 0.55) + (i === len - 1 ? 1 : 0)], 26); } }
    }

    // pescoço
    const nr = ramp(Lk.skin, 'skin');
    capsule(neck.x - P(0.3), neck.y + P(3), neck.x + P(0.4), neck.y - P(2.2), P(2.1), P(2.0), [nr[2], nr[2], nr[3], nr[3], nr[4]], 18, { sep: false });
    if (Lk.choker) capsule(neck.x - P(2), neck.y - P(0.6), neck.x + P(2.2), neck.y - P(0.8), 1, 1, ramp('#1a1a1a', 'dark'), 18, { sep: false });

    // cabeça
    const expr = pose.expr || 'normal';
    const head = heads[expr] || heads.normal;
    const tilt = pose.headTilt || 0;
    if (pose.lying) blitHead(head, Math.round(neck.x + P(1)), Math.round(neck.y + 2), 1);
    else blitHead(head, Math.round(neck.x + Math.sin(lean) * P(1.5) + (pose.headX || 0) + tilt * 0.12), Math.round(neck.y - P(0.8) + (pose.headY || 0) + Math.abs(tilt) * 0.05), 0);

    if (pose.prop) drawPropBuf(pose.prop, fHand.x, fHand.y, t);
    arm(fShoulder, fHand, true);
    if (pose.propFront) drawPropBuf(pose.propFront, fHand.x, fHand.y, t);
  }

  // ---------- Objetos nas mãos (desenhados no buffer) ----------
  function rectB(x, y, w, h, hex, pid) { const c = hexRgb(hex); for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) put(Math.round(x + i), Math.round(y + j), c, pid || 40); }
  function drawPropBuf(name, x, y, t) {
    x = Math.round(x); y = Math.round(y);
    const R = (a, b, w, h, c) => rectB(x + a, y + b, w, h, c);
    switch (name) {
      case 'phone': R(-3, -11, 7, 12, '#b9a3e3'); R(-2, -10, 5, 10, '#a08ad0'); R(-1, -9, 3, 3, '#7a64b0'); R(0, -8, 1, 1, '#dcd0f4'); break;
      case 'monster': R(-3, -12, 7, 13, '#141414'); R(-2, -10, 1, 8, '#7aff3a'); R(0, -11, 1, 9, '#7aff3a'); R(2, -10, 1, 8, '#7aff3a'); R(-3, -13, 7, 1, '#b0b0b0'); R(2, -12, 1, 11, '#2a2a2a'); break;
      case 'cookie': R(-4, -4, 9, 8, '#c08040'); R(-3, -4, 7, 2, '#dca060'); R(-2, -1, 2, 2, '#3a1a0a'); R(2, 0, 2, 2, '#3a1a0a'); R(0, 2, 2, 1, '#3a1a0a'); break;
      case 'costela': R(-8, -5, 16, 8, '#8a3d1e'); R(-7, -4, 14, 2, '#b5552a'); R(-10, -3, 3, 2, '#f2e6d0'); R(7, -3, 4, 2, '#f2e6d0'); R(-6, 1, 12, 2, '#5a2410'); break;
      case 'ricecooker': R(-9, -15, 18, 16, '#f2f2f2'); R(-9, -15, 4, 16, '#d0d0d8'); R(-9, -6, 18, 2, '#c8c8cc'); R(3, -3, 3, 2, '#ff6b6b'); R(-6, -18, 12, 3, '#d8d8dc'); R(-2, -20, 4, 2, '#888'); break;
      case 'clipboard': R(-5, -12, 10, 13, '#9c6b3a'); R(-4, -10, 8, 10, '#ffffff'); R(-3, -8, 6, 1, '#888'); R(-3, -6, 6, 1, '#888'); R(-3, -4, 4, 1, '#888'); R(-2, -13, 4, 2, '#777'); break;
      case 'lightstick': R(0, -4, 2, 8, '#ddd'); R(-3, -11, 8, 8, (t >> 3) % 2 ? '#c38cff' : '#ffffff'); R(-2, -10, 3, 3, '#ffffff'); break;
      case 'popcorn': R(-5, -6, 10, 9, '#e63a3a'); R(-3, -6, 2, 9, '#fff'); R(1, -6, 2, 9, '#fff'); R(-5, -10, 10, 4, '#fff3b0'); R(-3, -12, 3, 2, '#fff8d0'); break;
    }
  }
  function drawProp(ctx, name, x, y, t) { // versão para canvas (projéteis)
    x = Math.round(x); y = Math.round(y);
    const R = (a, b, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x + a, y + b, w, h); };
    switch (name) {
      case 'ricecooker': R(-9, -15, 18, 16, '#f2f2f2'); R(-9, -15, 4, 16, '#d0d0d8'); R(-9, -6, 18, 2, '#c8c8cc'); R(3, -3, 3, 2, '#ff6b6b'); R(-6, -18, 12, 3, '#d8d8dc'); break;
      case 'clipboard': R(-5, -12, 10, 13, '#9c6b3a'); R(-4, -10, 8, 10, '#ffffff'); R(-3, -8, 6, 1, '#888'); R(-3, -6, 6, 1, '#888'); break;
      case 'popcorn': R(-5, -6, 10, 9, '#e63a3a'); R(-3, -6, 2, 9, '#fff'); R(1, -6, 2, 9, '#fff'); R(-5, -10, 10, 4, '#fff3b0'); break;
      case 'cookie': R(-4, -4, 9, 8, '#c08040'); R(-2, -1, 2, 2, '#3a1a0a'); R(2, 0, 2, 2, '#3a1a0a'); break;
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

  let img = null, imgCtx = null;
  function render(target, ch, pose, t, tint) {
    const ctx = target.getContext('2d');
    clear();
    drawBody(ch, pose, getHeads(ch), t);
    // contorno externo colorido
    const out = new Uint8ClampedArray(buf);
    for (let y = 1; y < SH - 1; y++) for (let x = 1; x < SW - 1; x++) {
      const i = y * SW + x;
      if (buf[i * 4 + 3]) continue;
      let n = -1;
      if (buf[(i - 1) * 4 + 3]) n = i - 1; else if (buf[(i + 1) * 4 + 3]) n = i + 1; else if (buf[(i - SW) * 4 + 3]) n = i - SW; else if (buf[(i + SW) * 4 + 3]) n = i + SW;
      if (n >= 0) {
        out[i * 4] = buf[n * 4] * 0.22 + 14; out[i * 4 + 1] = buf[n * 4 + 1] * 0.18 + 7; out[i * 4 + 2] = buf[n * 4 + 2] * 0.22 + 18; out[i * 4 + 3] = 255;
      }
    }
    if (tint) for (let i = 0; i < SW * SH; i++) if (out[i * 4 + 3]) {
      out[i * 4] = (out[i * 4] * (1 - tint[3]) + tint[0] * tint[3]); out[i * 4 + 1] = (out[i * 4 + 1] * (1 - tint[3]) + tint[1] * tint[3]); out[i * 4 + 2] = (out[i * 4 + 2] * (1 - tint[3]) + tint[2] * tint[3]);
    }
    if (!img) img = new ImageData(SW, SH);
    img.data.set(out);
    ctx.putImageData(img, 0, 0);
  }

  function newCanvas() { const c = document.createElement('canvas'); c.width = SW; c.height = SH; return c; }

  // Retratos feitos a partir das fotos (assets/portraits)
  const photos = {};
  function loadPortraits(list) {
    list.forEach(ch => {
      photos[ch.id] = {};
      ['big', 'grid', 's'].forEach(k => {
        const im = new Image();
        im.src = 'assets/portraits/' + ch.id + (k === 'big' ? '_big' : k === 's' ? '_s' : '') + '.png';
        photos[ch.id][k] = im;
      });
    });
  }
  function photo(ch, size) { const p = photos[ch.id]; const im = p && p[size]; return im && im.complete && im.naturalWidth ? im : null; }
  // cabeça em pixel art como canvas (fallback)
  const headCanvasCache = {};
  function portrait(ch, expr) {
    const k = ch.id + (expr || 'normal');
    if (!headCanvasCache[k]) {
      const h = getHeads(ch)[expr || 'normal'];
      const c = document.createElement('canvas'); c.width = h.w; c.height = h.h;
      const x = c.getContext('2d');
      h.px.forEach((p, i) => { if (p) { x.fillStyle = 'rgb(' + p.join(',') + ')'; x.fillRect(i % h.w, (i / h.w) | 0, 1, 1); } });
      headCanvasCache[k] = c;
    }
    return headCanvasCache[k];
  }

  window.Sprites = { render, newCanvas, portrait, photo, loadPortraits, shade, drawProp, SW, SH, OX, OY };
})();
