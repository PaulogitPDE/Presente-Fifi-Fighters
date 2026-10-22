// Celulares como controle (lado do notebook).
// O notebook abre uma "sala" no servidor público do PeerJS (só serve para os aparelhos se encontrarem);
// depois os botões vão direto do celular para cá por WebRTC. Até 2 celulares: o 1º vira P1, o 2º vira P2.
(function () {
  const PREFIX = 'fifi-fighters-v1-';
  const ALPHA = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const ss = {
    get(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { sessionStorage.setItem(k, v); } catch (e) { /* sem armazenamento */ } }
  };
  // o código da sala fica salvo no notebook: o mesmo link/ícone do celular continua valendo na próxima vez
  const keep = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* sem armazenamento */ } }
  };
  const genCode = () => Array.from({ length: 4 }, () => ALPHA[Math.random() * ALPHA.length | 0]).join('');

  const R = {
    status: 'off',      // off | connecting | ready | error | nolib
    code: null,
    slots: [null, null], // { conn, id, last }
    toasts: [],
    url: null
  };
  let peer = null, retryT = null, idTries = 0, qr = null, qrFor = null;

  function controllerURL() {
    const base = location.href.split('#')[0].split('?')[0].replace(/[^/]*$/, '');
    return base + 'controle.html?c=' + R.code;
  }
  R.canShare = () => location.protocol === 'http:' || location.protocol === 'https:';

  function toast(s, col) { R.toasts.push({ s, col: col || '#9ff0ff', t: 0 }); if (R.toasts.length > 3) R.toasts.shift(); }

  function start() {
    if (!window.Peer) { R.status = 'nolib'; return; }
    if (!R.code) R.code = keep.get('fifi-room') || genCode();
    keep.set('fifi-room', R.code);
    R.url = controllerURL();
    R.status = 'connecting';
    try { peer = new window.Peer(PREFIX + R.code, { debug: 0 }); } catch (e) { R.status = 'error'; schedule(5000); return; }
    peer.on('open', () => { R.status = 'ready'; idTries = 0; });
    peer.on('connection', handle);
    peer.on('disconnected', () => { if (R.status !== 'off') { R.status = 'connecting'; setTimeout(() => { try { peer && !peer.destroyed && peer.reconnect(); } catch (e) { /* tenta de novo */ } }, 2000); } });
    peer.on('error', e => {
      if (e && e.type === 'unavailable-id') {
        // a sala ainda está presa à aba anterior: espera um pouco, depois troca de código
        if (++idTries > 3) { R.code = genCode(); keep.set('fifi-room', R.code); idTries = 0; }
        restart(3000);
      } else if (e && (e.type === 'network' || e.type === 'server-error' || e.type === 'socket-error' || e.type === 'socket-closed' || e.type === 'browser-incompatible')) {
        R.status = e.type === 'browser-incompatible' ? 'nolib' : 'error';
        if (R.status === 'error') restart(5000);
      }
    });
  }
  function schedule(ms) { clearTimeout(retryT); retryT = setTimeout(start, ms); }
  function restart(ms) { try { peer && peer.destroy(); } catch (e) { /* já fechado */ } peer = null; R.status = 'connecting'; schedule(ms); }

  function handle(conn) {
    const meta = conn.metadata || {};
    let p = -1;
    const free = i => !R.slots[i] || R.slots[i].id === meta.id || !R.slots[i].conn.open;
    conn.on('open', () => {
      // o notebook lembra quem era P1/P2 (sobrevive a recarregar a página); senão usa o que o celular lembra
      let mem = {}; try { mem = JSON.parse(ss.get('fifi-slots') || '{}'); } catch (e) { /* vazio */ }
      const want = meta.id in mem ? mem[meta.id] : meta.slot;
      if ((want === 0 || want === 1) && free(want)) p = want;
      else p = free(0) ? 0 : (free(1) ? 1 : -1);
      if (p < 0) { conn.send({ t: 'full' }); setTimeout(() => conn.close(), 800); return; }
      const old = R.slots[p];
      if (old && old.conn !== conn) { try { old.conn.close(); } catch (e) { /* já fechado */ } }
      R.slots[p] = { conn, id: meta.id, last: performance.now() };
      for (const k in mem) if (mem[k] === p) delete mem[k];
      mem[meta.id] = p; ss.set('fifi-slots', JSON.stringify(mem));
      conn.send({ t: 'slot', p });
      if (R.info[p]) conn.send({ t: 'info', txt: R.info[p] });
      toast('P' + (p + 1) + ': CELULAR CONECTADO', p ? '#8ab8ff' : '#ff8a8a');
      if (window.Sound) Sound.play('select');
    });
    conn.on('data', d => {
      if (p < 0 || !R.slots[p] || R.slots[p].conn !== conn || !d) return;
      R.slots[p].last = performance.now();
      if (d.t === 'b') window.Input && Input.remote(p, d.b | 0);
    });
    const gone = () => {
      if (p < 0 || !R.slots[p] || R.slots[p].conn !== conn) return;
      window.Input && Input.remote(p, 0);
      R.slots[p] = null;
      toast('P' + (p + 1) + ': CELULAR DESCONECTOU', '#ffb04a');
      if (R.onDrop) R.onDrop(p);
    };
    conn.on('close', gone);
    conn.on('error', gone);
  }

  // se um celular parar de mandar sinal, solta os botões dele (evita personagem andando sozinho)
  setInterval(() => {
    const now = performance.now();
    R.slots.forEach((s, p) => { if (s && now - s.last > 1500) window.Input && Input.remote(p, 0); });
  }, 250);

  R.info = ['', ''];
  // texto que aparece no topo do controle (ex.: personagem escolhido)
  R.setInfo = (p, txt) => { R.info[p] = txt; const s = R.slots[p]; if (s && s.conn.open) s.conn.send({ t: 'info', txt }); };
  // vibra o celular do jogador (quando apanha)
  R.vibrate = (p, ms) => { const s = R.slots[p]; if (s && s.conn.open) { try { s.conn.send({ t: 'vib', ms }); } catch (e) { /* conexão caindo */ } } };
  R.connected = p => !!(R.slots[p] && R.slots[p].conn.open);

  // QR code do link do controle (canvas pequeno, 1 px por módulo; o jogo amplia)
  R.qr = () => {
    if (!window.qrcode || R.status === 'nolib' || !R.code) return null;
    if (qr && qrFor === R.url) return qr;
    const q = window.qrcode(0, 'M'); q.addData(R.url); q.make();
    const n = q.getModuleCount(), m = 2;
    const c = document.createElement('canvas'); c.width = c.height = n + m * 2;
    const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.fillStyle = '#000';
    for (let r = 0; r < n; r++) for (let k = 0; k < n; k++) if (q.isDark(r, k)) x.fillRect(k + m, r + m, 1, 1);
    qr = c; qrFor = R.url;
    return qr;
  };
  R.statusText = () => ({ off: 'DESLIGADO', connecting: 'ABRINDO SALA...', ready: 'SALA ' + R.code, error: 'SEM INTERNET - TENTANDO DE NOVO', nolib: 'NAVEGADOR SEM SUPORTE' }[R.status]);

  window.Remote = R;
  if (R.canShare()) start(); else R.status = 'off';
})();
