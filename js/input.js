// Entrada de teclado. P1: WASD + V/B/N   |   P2: setas + 1/2/3 (linha de cima ou teclado numérico)
(function () {
  const MAP = [
    { up: ['KeyW'], down: ['KeyS'], left: ['KeyA'], right: ['KeyD'], punch: ['KeyV'], kick: ['KeyB'], power: ['KeyN'] },
    { up: ['ArrowUp'], down: ['ArrowDown'], left: ['ArrowLeft'], right: ['ArrowRight'], punch: ['Digit1', 'Numpad1'], kick: ['Digit2', 'Numpad2'], power: ['Digit3', 'Numpad3'] }
  ];
  const down = {};
  const pressedAt = {}; // code -> frame
  let frame = 0;
  const anyPressed = [];
  window.addEventListener('keydown', e => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
    if (!down[e.code]) { pressedAt[e.code] = frame; anyPressed.push(e.code); }
    down[e.code] = true;
  });
  window.addEventListener('keyup', e => { down[e.code] = false; });
  window.addEventListener('blur', () => { for (const k in down) down[k] = false; });

  const Input = {
    tick() { frame++; anyPressed.length = 0; },
    frame: () => frame,
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
    menuPressed(p, btn) { // para menus: setas/confirm
      return MAP[p][btn].some(c => pressedAt[c] === frame);
    },
    anyKey() { return anyPressed.length > 0 && pressedAt[anyPressed[0]] === frame; },
    // controle virtual (IA)
    virtual: [null, null]
  };
  window.Input = Input;
})();
