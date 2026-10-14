// Entrada: teclado e controles (gamepad).
// P1: WASD + V/B/N   |   P2: setas + 1/2/3 (linha de cima ou teclado numérico)
// Controle: direcional/analógico, A = soco, B = chute, X ou Y = poder, RB = super, START = pausa
// Celular (js/remote.js): botões virtuais Rem<p><botão>, somados ao teclado e ao controle
(function () {
  const BTNS = ['up', 'down', 'left', 'right', 'punch', 'kick', 'power', 'super', 'start'];
  const MAP = [
    { up: ['KeyW', 'Pad0Up'], down: ['KeyS', 'Pad0Down'], left: ['KeyA', 'Pad0Left'], right: ['KeyD', 'Pad0Right'], punch: ['KeyV', 'Pad0A'], kick: ['KeyB', 'Pad0B'], power: ['KeyN', 'Pad0X', 'Pad0Y'], start: ['Pad0Start'], super: ['Pad0RB'] },
    { up: ['ArrowUp', 'Pad1Up'], down: ['ArrowDown', 'Pad1Down'], left: ['ArrowLeft', 'Pad1Left'], right: ['ArrowRight', 'Pad1Right'], punch: ['Digit1', 'Numpad1', 'Pad1A'], kick: ['Digit2', 'Numpad2', 'Pad1B'], power: ['Digit3', 'Numpad3', 'Pad1X', 'Pad1Y'], start: ['Pad1Start'], super: ['Pad1RB'] }
  ];
  MAP.forEach((m, p) => BTNS.forEach(b => m[b].push('Rem' + p + b)));
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

  // ---- gamepads ----
  const PAD_BTNS = { A: 0, B: 1, X: 2, Y: 3, RB: 5, Start: 9, Up: 12, Down: 13, Left: 14, Right: 15 };
  let padsSeen = 0;
  function pollPads() {
    let pads = [];
    try { pads = navigator.getGamepads ? Array.from(navigator.getGamepads()) : []; } catch (e) { pads = []; }
    padsSeen = pads.filter(Boolean).length;
    for (let p = 0; p < 2; p++) {
      const gp = pads[p];
      for (const name in PAD_BTNS) {
        const code = 'Pad' + p + name;
        let on = false;
        if (gp) {
          const b = gp.buttons[PAD_BTNS[name]];
          on = !!(b && (b.pressed || b.value > 0.5));
          const ax = gp.axes[0] || 0, ay = gp.axes[1] || 0;
          if (name === 'Left' && ax < -0.5) on = true;
          if (name === 'Right' && ax > 0.5) on = true;
          if (name === 'Up' && ay < -0.6) on = true;
          if (name === 'Down' && ay > 0.6) on = true;
        }
        if (on) press(code); else if (down[code]) release(code);
      }
    }
  }

  const Input = {
    poll() { pollPads(); },
    tick() { frame++; anyPressed.length = 0; },
    frame: () => frame,
    pads: () => padsSeen,
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
