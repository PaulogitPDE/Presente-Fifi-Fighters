// Poses-chave e animações (procedurais) dos lutadores.
(function () {
  const STANCE = { hip: [0, -27], lean: 6, fHand: [11, -41], bHand: [5, -43], bFoot: [-7, 0], fFoot: [8, 0] };
  const lerp = (a, b, t) => a + (b - a) * t;
  function lp(a, b, t) {
    const o = {};
    for (const k in a) {
      if (Array.isArray(a[k]) && b[k]) o[k] = [lerp(a[k][0], b[k][0], t), lerp(a[k][1], b[k][1], t)];
      else if (typeof a[k] === 'number' && typeof b[k] === 'number') o[k] = lerp(a[k], b[k], t);
      else o[k] = t < 0.5 ? a[k] : (b[k] !== undefined ? b[k] : a[k]);
    }
    for (const k in b) if (o[k] === undefined) o[k] = b[k];
    return o;
  }
  const P = (o) => Object.assign({}, STANCE, o);
  const ease = t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  const off = (p, dx, dy) => [p[0] + dx, p[1] + dy];

  // ---------- Parado: animação única para cada personagem ----------
  function idle(ch, t) {
    const s = Math.sin(t / 8), s2 = Math.sin(t / 5);
    const blink = (t % 170) < 6;
    const cyc = t % 360; // floreio periódico
    let p;
    switch (ch.idle) {
      case 'cool': { // Guti: postura relaxada, ajusta o alargador e dá de ombros
        p = P({ hip: [0, -27 + s * 0.8], lean: 2, fHand: [10, -40 + s], bHand: [4, -42 + s], bFoot: [-6, 0], fFoot: [7, 0] });
        if (cyc > 250 && cyc < 300) { const k = Math.sin((cyc - 250) / 50 * Math.PI); p.bHand = [lerp(4, -3, k), lerp(-42, -53, k)]; p.headTilt = -6 * k; }
        if (cyc > 310 && cyc < 345) { const k = Math.sin((cyc - 310) / 35 * Math.PI); p.fHand = [lerp(10, 14, k), lerp(-40, -48, k)]; p.bHand = [lerp(4, -6, k), lerp(-42, -48, k)]; p.expr = 'happy'; }
        break;
      }
      case 'selfie': { // PV: tira selfie com o celular lilás
        p = P({ hip: [0, -27 + Math.abs(s) * 1.2], lean: 4, fHand: [11, -41 + s], bHand: [5, -43 + s], bFoot: [-8, 0], fFoot: [8, 0] });
        if (cyc > 200 && cyc < 320) {
          const k = Math.min(1, Math.min(cyc - 200, 320 - cyc) / 15);
          p.fHand = [lerp(11, 18, k), lerp(-41, -58, k)]; p.prop = 'phone'; p.headTilt = -8 * k; p.expr = 'happy';
          if (cyc > 255 && cyc < 262) p.flash = true;
        }
        break;
      }
      case 'jog': { // Belipe: corredor, trota sem sair do lugar
        const j = Math.sin(t / 4);
        p = P({ hip: [0, -27 - Math.abs(j) * 2], lean: 8, fHand: [10 + j * 3, -40], bHand: [4 - j * 3, -42], bFoot: [-7 + j * 2, j > 0 ? -3 * j : 0], fFoot: [8 - j * 2, j < 0 ? 3 * j : 0] });
        if (cyc > 280 && cyc < 330) { p.fHand = [6, -52]; p.headTilt = 5; p.expr = 'happy'; } // olha o relógio
        break;
      }
      case 'bounce': { // Min: quica alegre e ri "kjjjkjjkk"
        const b = Math.abs(Math.sin(t / 7));
        p = P({ hip: [0, -26 - b * 2], lean: 5, fHand: [12, -42 - b], bHand: [6, -44 - b], bFoot: [-7, 0], fFoot: [8, 0] });
        if (cyc > 240 && cyc < 300) { const k = Math.sin((cyc - 240) / 60 * Math.PI); p.fHand = [lerp(12, 8, k), lerp(-42, -50, k)]; p.lean = 6 + Math.sin(t) * 3 * k; p.expr = 'happy'; }
        break;
      }
      case 'wave': { // Ana: "Oiiie gente!" acena
        p = P({ hip: [0, -27 + s], lean: 4, fHand: [10, -40 + s], bHand: [5, -42 + s], bFoot: [-6, 0], fFoot: [7, 0], hairSwing: s });
        if (cyc > 220 && cyc < 300) { const k = Math.min(1, Math.min(cyc - 220, 300 - cyc) / 12); p.fHand = [lerp(10, 12 + Math.sin(t / 2) * 3, k), lerp(-40, -60, k)]; p.expr = 'happy'; }
        break;
      }
      case 'sip': { // Pam: toma Monster
        p = P({ hip: [0, -27 + s * 0.8], lean: 3, fHand: [11, -40 + s], bHand: [3, -36 + s], bFoot: [-7, 0], fFoot: [8, 0], backProp: 'monster' });
        if (cyc > 230 && cyc < 300) { const k = Math.min(1, Math.min(cyc - 230, 300 - cyc) / 12); p.bHand = [lerp(3, 9, k), lerp(-36, -50, k)]; p.headTilt = -10 * k; }
        break;
      }
      case 'sway': { // Alex: balança tranquilo, "Haeee"
        p = P({ hip: [s * 1.5, -27], lean: 4 + s * 3, fHand: [11, -40], bHand: [5, -42], bFoot: [-7, 0], fFoot: [8, 0] });
        if (cyc > 260 && cyc < 320) { const k = Math.sin((cyc - 260) / 60 * Math.PI); p.fHand = [lerp(11, 16, k), lerp(-40, -56, k)]; p.bHand = [lerp(5, -4, k), lerp(-42, -56, k)]; p.expr = 'shout'; }
        break;
      }
      case 'calm': { // Valesca: mão na cintura, respira fundo
        p = P({ hip: [0, -27 + s * 0.6], lean: 3, fHand: [11, -41 + s * 0.6], bHand: [-6, -30], bFoot: [-6, 0], fFoot: [7, 0] });
        if (cyc > 230 && cyc < 320) { const k = Math.sin((cyc - 230) / 90 * Math.PI); p.hip = [0, -27 + k]; p.fHand = [lerp(11, 6, k), lerp(-41, -45, k)]; p.expr = k > 0.5 ? 'blink' : 'normal'; }
        break;
      }
      default:
        p = P({ hip: [0, -27 + s], fHand: [11, -41 + s], bHand: [5, -43 + s] });
    }
    if (blink && !p.expr) p.expr = 'blink';
    return p;
  }

  function walk(ch, t, dir) {
    const w = Math.sin(t / 5 * dir), c = Math.cos(t / 5 * dir);
    return P({ hip: [0, -27 - Math.abs(c) * 1.5], lean: 8, fHand: [10 - w * 2, -41], bHand: [5 + w * 2, -43],
      bFoot: [-2 - w * 8, Math.min(0, c * 4)], fFoot: [3 + w * 8, Math.min(0, -c * 4)] });
  }
  function crouch(ch, t) {
    const s = Math.sin(t / 8);
    return { hip: [0, -16 + s * 0.5], lean: 18, fHand: [12, -28 + s * 0.5], bHand: [6, -30 + s * 0.5], bFoot: [-9, 0], fFoot: [10, 0] };
  }
  function jump(ch, vy) {
    if (vy < -1) return P({ hip: [0, -27], lean: 4, fHand: [10, -48], bHand: [3, -50], bFoot: [-5, -6], fFoot: [7, -3] });
    return P({ hip: [0, -27], lean: 10, fHand: [12, -42], bHand: [5, -45], bFoot: [-5, -12], fFoot: [8, -10] });
  }
  function block(ch, crouching) {
    if (crouching) return { hip: [-1, -16], lean: 10, fHand: [8, -34], bHand: [9, -30], bFoot: [-9, 0], fFoot: [9, 0], expr: 'hurt' };
    return P({ hip: [-2, -27], lean: -4, fHand: [8, -52], bHand: [9, -46], expr: 'hurt' });
  }
  function hit(ch, k, crouching) { // k: 0..1 intensidade
    if (crouching) return { hip: [-3, -16], lean: -6, fHand: [6, -26], bHand: [0, -28], bFoot: [-9, 0], fFoot: [9, 0], expr: 'hurt' };
    return P({ hip: [-3 * k, -26], lean: -18 * k, fHand: [4, -36], bHand: [-6, -40], headTilt: -12 * k, expr: 'hurt' });
  }
  function airHit() { return P({ hip: [0, -27], lean: -30, fHand: [6, -54], bHand: [-8, -50], bFoot: [-10, -4], fFoot: [4, -6], expr: 'hurt' }); }
  function lying() { return { hip: [0, -4], lean: -86, fHand: [-30, -6], bHand: [-28, -2], bFoot: [14, 0], fFoot: [17, -2], expr: 'hurt', lying: true }; }
  function getUp(k) { return lp(lying(), crouch(), k); }

  // Ataques normais: retornam pose dado progresso do golpe
  // phase: 0 = preparação, 1 = ativo, 2 = recuperação ; k = 0..1 dentro da fase
  const STRIKES = {
    punch: { wind: P({ fHand: [6, -42], lean: 2 }), hit: P({ fHand: [27, -44], bHand: [3, -40], lean: 14, hip: [3, -27], expr: 'shout' }) },
    kick: { wind: P({ fFoot: [4, -10], lean: -4 }), hit: P({ hip: [-3, -28], lean: -14, fFoot: [27, -32], bFoot: [-6, 0], fHand: [4, -44], bHand: [-4, -40], expr: 'shout' }) },
    cpunch: { wind: { hip: [0, -16], lean: 18, fHand: [8, -28], bHand: [6, -30], bFoot: [-9, 0], fFoot: [10, 0] }, hit: { hip: [3, -16], lean: 22, fHand: [27, -26], bHand: [5, -28], bFoot: [-9, 0], fFoot: [10, 0], expr: 'shout' } },
    ckick: { wind: { hip: [0, -14], lean: 20, fHand: [8, -26], bHand: [6, -28], bFoot: [-9, 0], fFoot: [8, 0] }, hit: { hip: [-3, -12], lean: 26, fHand: [6, -22], bHand: [-4, -18], bFoot: [-8, 0], fFoot: [30, -1], expr: 'shout' } },
    jpunch: { wind: P({ hip: [0, -27], fHand: [6, -48], bFoot: [-5, -10], fFoot: [7, -8] }), hit: P({ hip: [0, -27], lean: 16, fHand: [24, -32], bHand: [2, -44], bFoot: [-5, -12], fFoot: [7, -10], expr: 'shout' }) },
    jkick: { wind: P({ hip: [0, -27], bFoot: [-5, -12], fFoot: [4, -14] }), hit: P({ hip: [-2, -27], lean: -8, fHand: [4, -46], bHand: [-4, -44], bFoot: [-6, -14], fFoot: [24, -12], expr: 'shout' }) }
  };
  function strike(ch, kind, phase, k) {
    const s = STRIKES[kind];
    const base = kind[0] === 'c' ? crouch(ch, 0) : (kind[0] === 'j' ? jump(ch, 1) : P({}));
    if (phase === 0) return lp(base, s.wind, ease(k));
    if (phase === 1) return lp(s.wind, s.hit, Math.min(1, k * 3));
    return lp(s.hit, base, ease(k));
  }

  // Poses de golpes especiais
  const SPECIAL = {
    throw: { wind: P({ fHand: [-8, -50], bHand: [8, -42], lean: -8, expr: 'shout' }), hit: P({ fHand: [26, -46], bHand: [-4, -38], lean: 16, hip: [3, -27], expr: 'shout' }) },
    push: { wind: P({ fHand: [-2, -38], bHand: [-4, -36], lean: -4 }), hit: P({ fHand: [26, -42], bHand: [24, -38], lean: 12, hip: [3, -27], expr: 'shout' }) },
    rush: { wind: P({ lean: 20, hip: [-2, -24] }), hit: P({ hip: [4, -25], lean: 28, fHand: [27, -38], bHand: [-6, -36], bFoot: [-14, -2], fFoot: [12, 0], expr: 'shout' }) },
    rising: { wind: { hip: [0, -18], lean: 14, fHand: [6, -24], bHand: [4, -28], bFoot: [-9, 0], fFoot: [9, 0] }, hit: P({ hip: [2, -28], lean: 6, fHand: [12, -66], bHand: [2, -44], bFoot: [-4, -8], fFoot: [6, 0], expr: 'shout' }) },
    counter: { wind: P({ hip: [-2, -27], lean: -6, fHand: [6, -52], bHand: [10, -48], expr: 'blink' }), hit: P({ hip: [-2, -27], lean: -6, fHand: [6, -52], bHand: [10, -48], expr: 'blink' }) },
    taunt: { wind: P({ fHand: [16, -54], bHand: [-6, -32], lean: 0, expr: 'happy' }), hit: P({ fHand: [18, -56], bHand: [-6, -32], lean: -2, expr: 'shout' }) },
    eat: { wind: P({ fHand: [12, -44], expr: 'happy' }), hit: P({ fHand: [12, -50], lean: -4, headTilt: -10, expr: 'happy' }) },
    summon: { wind: P({ fHand: [14, -58], bHand: [-4, -56], lean: -6, expr: 'shout' }), hit: P({ fHand: [24, -40], bHand: [-4, -56], lean: 10, expr: 'shout' }) },
    spin: { wind: P({ hip: [0, -27], lean: -6 }), hit: P({ hip: [0, -30], lean: 0, fHand: [16, -46], bHand: [-16, -46], fFoot: [22, -24], bFoot: [-8, -6], expr: 'shout' }) },
    beam: { wind: P({ fHand: [-2, -38], bHand: [-4, -36], lean: -10, hip: [-3, -25], expr: 'shout' }), hit: P({ fHand: [28, -42], bHand: [26, -38], lean: 14, hip: [4, -25], bFoot: [-12, 0], fFoot: [10, 0], expr: 'shout' }) },
    dodge: { wind: { hip: [0, -16], lean: 30, fHand: [10, -20], bHand: [0, -22], bFoot: [-9, 0], fFoot: [9, 0] }, hit: { hip: [0, -12], lean: 40, fHand: [12, -14], bHand: [2, -16], bFoot: [-10, 0], fFoot: [9, 0], expr: 'happy' } }
  };
  function special(ch, kind, phase, k) {
    const s = SPECIAL[kind] || SPECIAL.throw;
    const base = P({});
    if (phase === 0) return lp(base, s.wind, ease(k));
    if (phase === 1) {
      const p = lp(s.wind, s.hit, Math.min(1, k * 3));
      if (kind === 'spin') { const a = k * Math.PI * 4; p.fFoot = [Math.cos(a) * 24, -24 + Math.sin(a) * 4]; p.flipSpin = Math.cos(a) < 0; }
      if (kind === 'rush') { const r = Math.sin(k * Math.PI * 6); p.fHand = [20 + r * 8, -40]; p.bHand = [14 - r * 8, -38]; p.bFoot = [-10 + r * 6, r > 0 ? -3 : 0]; p.fFoot = [10 - r * 6, r < 0 ? -3 : 0]; }
      return p;
    }
    return lp(s.hit, base, ease(k));
  }

  function victory(ch, t) {
    const k = Math.min(1, t / 20);
    const s = Math.sin(t / 6);
    let p;
    switch (ch.victory) {
      case 'flex': p = P({ fHand: [8, -60 + s], bHand: [-8, -60 - s], lean: 0, expr: 'happy' }); break;
      case 'phone': p = P({ fHand: [18, -58], prop: 'phone', headTilt: -8, expr: 'happy', flash: (t % 40) < 3 }); break;
      case 'run': { const j = Math.sin(t / 3); p = P({ fHand: [12, -62], bHand: [-4, -40], bFoot: [-6 + j * 3, j > 0 ? -4 : 0], fFoot: [8 - j * 3, j < 0 ? -4 : 0], expr: 'happy' }); break; }
      case 'jumpjoy': { const b = Math.abs(Math.sin(t / 7)) * 8; p = P({ hip: [0, -27 - b], fHand: [10, -62 - b], bHand: [-6, -62 - b], bFoot: [-6, -b], fFoot: [7, -b], expr: 'happy' }); break; }
      case 'heart': p = P({ fHand: [10, -50], bHand: [6, -50], lean: 0, expr: 'happy', heart: true }); break;
      case 'drink': p = P({ bHand: [8, -52], backProp: 'monster', headTilt: -14, fHand: [-6, -30], expr: 'blink' }); break;
      case 'shout': p = P({ fHand: [14, -64 + s * 2], bHand: [-10, -62 - s * 2], lean: -6, expr: 'shout' }); break;
      case 'cookie': p = P({ fHand: [14, -46], prop: 'cookie', bHand: [-6, -30], expr: 'happy' }); break;
      default: p = P({ fHand: [10, -62], expr: 'happy' });
    }
    return lp(P({}), p, k);
  }
  function defeat() { return lying(); }
  function intro(ch, t) {
    const k = Math.min(1, t / 30);
    const p = victory(ch, 40);
    return lp(p, idle(ch, t), k > 0.7 ? (k - 0.7) / 0.3 : 0);
  }

  window.Poses = { STANCE, idle, walk, crouch, jump, block, hit, airHit, lying, getUp, strike, special, victory, defeat, intro, lp };
})();
