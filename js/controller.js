// Controle no celular: lê os toques e manda o estado dos botões para o notebook (WebRTC via PeerJS).
(function () {
  const PREFIX = 'fifi-fighters-v1-';
  const BTNS = ['up', 'down', 'left', 'right', 'punch', 'kick', 'power', 'super', 'start']; // mesma ordem do Input.remote
  const $ = id => document.getElementById(id);
  const ls = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* sem armazenamento */ } }
  };
  const myId = ls.get('fifi-ctrl-id') || (Math.random().toString(36).slice(2) + Date.now().toString(36));
  ls.set('fifi-ctrl-id', myId);

  const params = new URLSearchParams(location.search);
  let code = (params.get('c') || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4);

  // ---------- telas ----------
  function showJoin() {
    document.body.classList.add('joining');
    $('join').hidden = false; $('pad').hidden = true;
    $('codeIn').value = code || ls.get('fifi-last-code') || '';
    $('joinForm').onsubmit = e => {
      e.preventDefault();
      const c = $('codeIn').value.toUpperCase().replace(/[^A-Z0-9]/g, '');
      if (c.length !== 4) { $('codeIn').focus(); return; }
      code = c; history.replaceState(null, '', '?c=' + c); showPad();
    };
  }
  function showPad() {
    document.body.classList.remove('joining');
    $('join').hidden = true; $('pad').hidden = false;
    ls.set('fifi-last-code', code);
    connect();
  }
  function status(txt, cls) {
    $('statusTxt').textContent = txt;
    $('status').className = 'status ' + (cls || '');
  }
  function message(html, ms) {
    const m = $('msg'); m.innerHTML = html; m.hidden = false;
    clearTimeout(message.t); if (ms) message.t = setTimeout(() => { m.hidden = true; }, ms);
  }
  const hideMessage = () => { $('msg').hidden = true; };

  // ---------- conexão ----------
  let peer = null, conn = null, slot = null, retryT = null, bits = 0, lastSent = -1;
  const slotKey = () => 'fifi-slot-' + code;
  function connect() {
    clearTimeout(retryT);
    if (!window.Peer) { status('SEM CONEXAO', 'warn'); message('Este navegador não suporta o controle.<br>Tente o Chrome ou o Safari atualizados.'); return; }
    status('CONECTANDO...', 'warn');
    if (!peer || peer.destroyed) {
      peer = new window.Peer({ debug: 0 });
      peer.on('open', openConn);
      peer.on('disconnected', () => { setTimeout(() => { try { peer && !peer.destroyed && peer.reconnect(); } catch (e) { /* tenta de novo */ } }, 1500); });
      peer.on('error', e => {
        if (e && e.type === 'peer-unavailable') { status('SALA ' + code + ' NAO ENCONTRADA', 'warn'); message('Não achei a sala <b>' + code + '</b>.<br>Confira o código na tela do notebook.<br><button id="chg">TROCAR CÓDIGO</button>'); bindChange(); }
        else status('SEM INTERNET - TENTANDO', 'warn');
        retry(3000);
      });
    } else if (peer.open) openConn();
  }
  function bindChange() { const b = $('chg'); if (b) b.onclick = () => { hideMessage(); try { conn && conn.close(); } catch (e) { /* já fechado */ } showJoin(); }; }
  function openConn() {
    try { conn && conn.close(); } catch (e) { /* já fechado */ }
    const prev = ls.get(slotKey());
    conn = peer.connect(PREFIX + code, { reliable: true, metadata: { id: myId, slot: prev === null ? null : +prev } });
    const c = conn;
    c.on('open', () => { if (c !== conn) return; status('CONECTADO', 'ok'); lastSent = -1; send(true); });
    c.on('data', d => {
      if (c !== conn || !d) return;
      if (d.t === 'slot') {
        slot = d.p; ls.set(slotKey(), String(slot)); hideMessage();
        status('JOGADOR ' + (slot + 1), 'ok' + (slot ? ' p2' : ''));
        buzz([30, 40, 30]);
        maybePrompt();
      } else if (d.t === 'full') { status('SALA CHEIA', 'warn'); message('Já tem 2 celulares conectados nessa sala.'); }
      else if (d.t === 'vib') buzz(d.ms | 0);
      else if (d.t === 'info') $('info').textContent = d.txt || '';
    });
    c.on('close', () => { if (c !== conn) return; status('RECONECTANDO...', 'warn'); retry(1500); });
    c.on('error', () => { if (c !== conn) return; retry(2000); });
  }
  function retry(ms) { clearTimeout(retryT); retryT = setTimeout(connect, ms); }
  function send(force) {
    if (!conn || !conn.open) return;
    if (!force && bits === lastSent) return;
    lastSent = bits;
    try { conn.send({ t: 'b', b: bits }); } catch (e) { /* conexão caindo */ }
  }
  setInterval(() => send(true), 300); // sinal de vida (o notebook solta os botões se parar)

  // ---------- toques ----------
  const ptrs = new Map(); // pointerId -> { dpad: bool, btn: nome }
  const dpadEl = () => $('dpad');
  function dirBits(x, y) {
    const r = dpadEl().getBoundingClientRect();
    const dx = x - (r.left + r.width / 2), dy = y - (r.top + r.height / 2);
    const dead = r.width * 0.12, k = 0.414; // setores de 45°
    let b = 0;
    if (dy < -dead && -dy > k * Math.abs(dx)) b |= 1;
    if (dy > dead && dy > k * Math.abs(dx)) b |= 2;
    if (dx < -dead && -dx > k * Math.abs(dy)) b |= 4;
    if (dx > dead && dx > k * Math.abs(dy)) b |= 8;
    return b;
  }
  function inDpadZone(x, y) {
    const r = dpadEl().getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    return Math.hypot(x - cx, y - cy) < r.width * 0.85; // área de toque maior que o desenho
  }
  function btnAt(x, y) {
    const el = document.elementFromPoint(x, y);
    const b = el && el.closest('[data-b]');
    return b ? b.dataset.b : null;
  }
  function update() {
    let nb = 0;
    ptrs.forEach(p => {
      if (p.dpad) nb |= p.dir;
      else if (p.btn) nb |= 1 << BTNS.indexOf(p.btn);
    });
    const newly = nb & ~bits & ~15;
    bits = nb;
    if (newly) buzz(12);
    paint();
    send();
  }
  function paint() {
    document.querySelectorAll('.dpad .arm').forEach(a => {
      const i = ['up', 'down', 'left', 'right'].findIndex(n => a.classList.contains(n));
      a.classList.toggle('on', !!(bits & (1 << i)));
    });
    document.querySelectorAll('[data-b]').forEach(el => el.classList.toggle('on', !!(bits & (1 << BTNS.indexOf(el.dataset.b)))));
  }
  function down(e) {
    if ($('pad').hidden) return;
    if (e.target.closest && e.target.closest('#fs, #msg, #fsBtn')) return; // botões de tela cheia/avisos não contam como jogo
    e.preventDefault();
    wake();
    const x = e.clientX, y = e.clientY;
    if (inDpadZone(x, y)) ptrs.set(e.pointerId, { dpad: true, dir: dirBits(x, y) });
    else ptrs.set(e.pointerId, { dpad: false, btn: btnAt(x, y) });
    update();
  }
  function move(e) {
    const p = ptrs.get(e.pointerId); if (!p) return;
    e.preventDefault();
    if (p.dpad) p.dir = dirBits(e.clientX, e.clientY);
    else p.btn = btnAt(e.clientX, e.clientY); // dá para "rolar" o dedo entre os botões
    update();
  }
  function up(e) { if (ptrs.delete(e.pointerId)) update(); }
  addEventListener('pointerdown', down, { passive: false });
  addEventListener('pointermove', move, { passive: false });
  addEventListener('pointerup', up);
  addEventListener('pointercancel', up);
  addEventListener('touchstart', e => { if (!$('pad').hidden) e.preventDefault(); }, { passive: false });
  addEventListener('touchmove', e => e.preventDefault(), { passive: false });
  addEventListener('contextmenu', e => e.preventDefault());
  // ao sair do app, solta tudo
  const releaseAll = () => { ptrs.clear(); update(); };
  addEventListener('blur', releaseAll);
  document.addEventListener('visibilitychange', () => { if (document.hidden) releaseAll(); else { lock = null; wake(); if (conn && !conn.open) connect(); } });

  // ---------- vibração, tela ligada, tela cheia ----------
  function buzz(p) { try { navigator.vibrate && navigator.vibrate(p); } catch (e) { /* sem vibração */ } }
  let lock = null;
  function wake() {
    if (!lock && navigator.wakeLock) navigator.wakeLock.request('screen').then(l => { lock = l; l.addEventListener('release', () => { lock = null; }); }).catch(() => {});
  }

  // ---------- tela cheia ----------
  // Android/Chrome: API de tela cheia. iPhone: o Safari não deixa sites ficarem em tela cheia,
  // mas aberto pelo ícone da Tela de Início o controle roda sem a barra do navegador.
  const docEl = document.documentElement;
  const canFull = !!(docEl.requestFullscreen || docEl.webkitRequestFullscreen);
  const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const standalone = () => navigator.standalone === true || (window.matchMedia && matchMedia('(display-mode: standalone), (display-mode: fullscreen)').matches);
  const isFull = () => !!(document.fullscreenElement || document.webkitFullscreenElement) || standalone();
  function enterFull() {
    try {
      const r = docEl.requestFullscreen ? docEl.requestFullscreen({ navigationUI: 'hide' }) : docEl.webkitRequestFullscreen();
      const lockLand = () => { try { screen.orientation && screen.orientation.lock && screen.orientation.lock('landscape').catch(() => {}); } catch (e) { /* sem trava */ } };
      if (r && r.then) r.then(lockLand).catch(() => {}); else lockLand();
    } catch (e) { /* bloqueado pelo navegador */ }
  }
  function exitFull() { try { (document.exitFullscreen || document.webkitExitFullscreen).call(document); } catch (e) { /* já saiu */ } }
  // full = botão de tela cheia | ios = ensinar a Tela de Início | other = só dica
  const fsMode = canFull ? 'full' : (isIOS ? 'ios' : 'other');
  function showFullPrompt() {
    if (isFull()) { $('fs').hidden = true; return; }
    ['full', 'ios', 'other'].forEach(m => { $('fs-' + m).hidden = m !== fsMode; });
    $('fs').hidden = false;
  }
  let prompted = false;
  function maybePrompt() { if (!prompted && !isFull()) { prompted = true; showFullPrompt(); } }
  $('fsGo').addEventListener('click', () => { $('fs').hidden = true; enterFull(); });
  document.querySelectorAll('.fs-close').forEach(b => b.addEventListener('click', () => { $('fs').hidden = true; }));
  // botão pequeno no canto do controle
  $('fsBtn').addEventListener('click', () => { if (isFull() && !standalone()) exitFull(); else if (fsMode === 'full') enterFull(); else showFullPrompt(); });
  const syncFsBtn = () => { $('fsBtn').hidden = standalone(); $('fsBtn').classList.toggle('on', isFull()); };
  document.addEventListener('fullscreenchange', syncFsBtn); document.addEventListener('webkitfullscreenchange', syncFsBtn);
  syncFsBtn();

  if (code.length === 4) showPad(); else showJoin();
})();
