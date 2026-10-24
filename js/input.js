// Entrada: teclado e controles (gamepad).
// P1: WASD + V/B/N   |   P2: setas + 1/2/3 (linha de cima ou teclado numérico)
// Controle (USB ou Bluetooth): direcional/analógico, A = soco, B = chute, X/LB/LT = poder, Y/RB/RT = super,
// START = pausa, SELECT = chute (volta nos menus). O primeiro controle que apertar um botão vira o P1, o segundo o P2.
// Celular (js/remote.js): botões virtuais Rem<p><botão>, somados ao teclado e ao controle
(function () {
  const BTNS = ['up', 'down', 'left', 'right', 'punch', 'kick', 'power', 'super', 'start'];
  const MAP = [
    { up: ['KeyW'], down: ['KeyS'], left: ['KeyA'], right: ['KeyD'], punch: ['KeyV'], kick: ['KeyB'], power: ['KeyN'], start: [], super: [] },
    { up: ['ArrowUp'], down: ['ArrowDown'], left: ['ArrowLeft'], right: ['ArrowRight'], punch: ['Digit1', 'Numpad1'], kick: ['Digit2', 'Numpad2'], power: ['Digit3', 'Numpad3'], start: [], super: [] }
  ];
  // controle físico (Pad<p><botão>) e celular (Rem<p><botão>) em cada jogador
  MAP.forEach((m, p) => BTNS.forEach(b => m[b].push('Pad' + p + b, 'Rem' + p + b)));
  const down = {};
  const pressedAt = {}; // code -> frame
  let frame = 0;
  const anyPressed = [];
  function press(code) { if (!down[code]) { pressedAt[code] = frame; anyPressed.push(code); } down[code] = true; }
  function release(code) { down[code] = false; }
  window.addEventListener('keydown', e => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
    press(e.code);
  });
  window.addEventListener('keyup', e => release(e.code));
  window.addEventListener('blur', () => { for (const k in down) down[k] = false; });

  // ---- controles (USB ou Bluetooth) ----
  // Botões no layout padrão (Xbox/PlayStation/Switch Pro no Chrome, Edge e Safari).
  const STD = { punch: [0], kick: [1, 8], power: [2, 4, 6], super: [3, 5, 7], start: [9], up: [12], down: [13], left: [14], right: [15] };
  const slots = [null, null]; // gamepad.index de cada jogador
  const names = [null, null];
  const rests = [[], []]; // posição de repouso dos eixos (gatilhos de alguns controles ficam em -1 parados)
  const padEvents = []; // { p, on, name } para os avisos na tela
  let padsSeen = 0;
  const pressedBtn = b => !!(b && (b.pressed || b.value > 0.5));
  // eixo usável: existe e fica no centro quando solto
  const axis = (gp, rest, i) => (gp.axes[i] !== undefined && Math.abs(rest[i] || 0) < 0.5 ? gp.axes[i] : 0);
  // direcional de controles sem o layout padrão: "hat" num eixo só (8 posições entre -1 e 1; solto fica fora disso) ou eixos 6/7
  function hatDir(gp, rest) {
    const d = { up: false, down: false, left: false, right: false };
    if (gp.mapping === 'standard') return d;
    const h = gp.axes[9], k = h === undefined ? -1 : Math.round((h + 1) / (2 / 7));
    const restsOff = !(rest[9] >= -1.05 && rest[9] <= 1.05); // quando solto, o hat fica fora de -1..1
    if (gp.axes.length >= 10 && restsOff && k >= 0 && k <= 7 && Math.abs(h - (-1 + k * 2 / 7)) < 0.06) {
      // 0 cima, 1 cima-dir, 2 dir, 3 baixo-dir, 4 baixo, 5 baixo-esq, 6 esq, 7 cima-esq
      d.up = k === 7 || k === 0 || k === 1; d.right = k >= 1 && k <= 3; d.down = k >= 3 && k <= 5; d.left = k >= 5 && k <= 7;
    } else if (gp.axes.length >= 8) {
      const x = axis(gp, rest, 6), y = axis(gp, rest, 7);
      d.left = x < -0.5; d.right = x > 0.5; d.up = y < -0.5; d.down = y > 0.5;
    }
    return d;
  }
  function readPad(gp, rest) {
    const st = {};
    for (const b in STD) st[b] = STD[b].some(i => pressedBtn(gp.buttons[i]));
    const ax = axis(gp, rest, 0), ay = axis(gp, rest, 1), h = hatDir(gp, rest);
    st.left = st.left || ax < -0.5 || h.left; st.right = st.right || ax > 0.5 || h.right;
    st.up = st.up || ay < -0.6 || h.up; st.down = st.down || ay > 0.6 || h.down;
    return st;
  }
  const anyActive = gp => gp.buttons.some(pressedBtn);
  // nome curto para a tela: pela marca (código do fabricante no id) ou pelo próprio nome do controle
  const VENDORS = { '045e': 'XBOX', '054c': 'PLAYSTATION', '057e': 'NINTENDO', '2dc8': '8BITDO', '046d': 'LOGITECH' };
  function shortName(id) {
    id = id || '';
    const v = (id.match(/vendor:\s*([0-9a-f]{4})/i) || id.match(/^([0-9a-f]{4})-[0-9a-f]{4}-/i) || [])[1];
    if (v && VENDORS[v.toLowerCase()]) return VENDORS[v.toLowerCase()];
    if (/xbox|xinput/i.test(id)) return 'XBOX';
    if (/dualsense|dualshock|playstation|wireless controller/i.test(id)) return 'PLAYSTATION';
    return id.replace(/\(.*?\)/g, '').replace(/^[0-9a-f]{4}-[0-9a-f]{4}-/i, '').replace(/[^A-Za-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim().toUpperCase().slice(0, 19) || 'CONTROLE';
  }
  function pollPads() {
    let pads = [];
    try { pads = navigator.getGamepads ? Array.from(navigator.getGamepads()).filter(g => g && g.connected !== false) : []; } catch (e) { pads = []; }
    padsSeen = pads.length;
    // controle que desligou libera o lugar
    for (let p = 0; p < 2; p++) if (slots[p] !== null && !pads.some(g => g.index === slots[p])) { padEvents.push({ p, on: false, name: names[p] }); slots[p] = names[p] = null; }
    // controle novo entra no primeiro lugar livre quando apertar um botão (evita "controles fantasmas")
    pads.forEach(g => {
      if (slots.includes(g.index) || !anyActive(g)) return;
      const p = slots.indexOf(null); if (p < 0) return;
      slots[p] = g.index; names[p] = shortName(g.id); rests[p] = Array.from(g.axes); padEvents.push({ p, on: true, name: names[p] });
      // o botão que conectou não vale como golpe (fica "segurado" até soltar)
      const st = readPad(g, rests[p]);
      BTNS.forEach(b => { if (st[b]) { down['Pad' + p + b] = true; pressedAt['Pad' + p + b] = -999; } });
    });
    for (let p = 0; p < 2; p++) {
      const gp = slots[p] === null ? null : pads.find(g => g.index === slots[p]);
      const st = gp ? readPad(gp, rests[p]) : null;
      BTNS.forEach(b => { const c = 'Pad' + p + b; if (st && st[b]) { if (!down[c]) press(c); } else if (down[c]) release(c); });
    }
  }
  function vibratePad(p, ms) {
    try {
      const gp = slots[p] === null ? null : navigator.getGamepads()[slots[p]];
      const a = gp && gp.vibrationActuator;
      if (a && a.playEffect) a.playEffect('dual-rumble', { duration: ms, strongMagnitude: 0.6, weakMagnitude: 0.4 }).catch(() => {});
    } catch (e) { /* sem vibração */ }
  }

  const Input = {
    poll() { pollPads(); },
    tick() { frame++; anyPressed.length = 0; },
    frame: () => frame,
    pads: () => padsSeen,
    // controles físicos: quem está em cada jogador, avisos de conexão, trocar P1/P2, vibrar
    padSlot: p => (slots[p] === null ? null : { name: names[p] }),
    padEvents: () => padEvents.splice(0),
    swapPads() { // troca também o estado dos botões, para o botão que pediu a troca não "apertar de novo"
      slots.reverse(); names.reverse(); rests.reverse();
      BTNS.forEach(b => { const c0 = 'Pad0' + b, c1 = 'Pad1' + b; [down[c0], down[c1]] = [down[c1], down[c0]]; [pressedAt[c0], pressedAt[c1]] = [pressedAt[c1], pressedAt[c0]]; });
    },
    vibratePad,
    // estado do jogador (p = 0|1)
    held(p, btn) { return MAP[p][btn].some(c => down[c]); },
    // apertado neste frame (com buffer de n frames)
    pressed(p, btn, buf) {
      buf = buf || 0;
      return MAP[p][btn].some(c => down[c] !== undefined && pressedAt[c] !== undefined && frame - pressedAt[c] <= buf && (buf > 0 || down[c]));
    },
    consume(p, btn) { MAP[p][btn].forEach(c => { pressedAt[c] = -999; }); },
    key(code) { return pressedAt[code] === frame; },
    keyHeld(code) { return !!down[code]; },
    menuPressed(p, btn) { // para menus
      return MAP[p][btn].some(c => pressedAt[c] === frame);
    },
    anyKey() { return anyPressed.length > 0 && pressedAt[anyPressed[0]] === frame; },
    lastKey() { return anyPressed.length ? anyPressed[anyPressed.length - 1] : null; },
    // celular: bits na ordem de BTNS (cima, baixo, esq, dir, soco, chute, poder, super, start)
    BTNS,
    remote(p, bits) { BTNS.forEach((b, i) => { const c = 'Rem' + p + b; if (bits & (1 << i)) press(c); else if (down[c]) release(c); }); }
  };
  window.Input = Input;
})();
