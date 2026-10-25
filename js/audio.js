// Áudio: efeitos e músicas chiptune sintetizados com WebAudio, e a trilha com músicas de verdade
// (assets/music, lista em js/musicmeta.js), sorteadas de acordo com o momento do jogo.
(function () {
  let ctx = null, master = null, musicGain = null, sfxGain = null;
  let musicTimer = null, musicStep = 0, currentSong = null, nextTime = 0;
  let muted = false;
  let volMusic = 0.7, volSfx = 0.8; // 0..1

  function init() {
    if (track && track.el._pending) tryPlay(track);
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) { return; }
    master = ctx.createGain(); master.gain.value = 0.5; master.connect(ctx.destination);
    musicGain = ctx.createGain(); musicGain.gain.value = 0.32 * volMusic; musicGain.connect(master);
    sfxGain = ctx.createGain(); sfxGain.gain.value = 0.75 * volSfx; sfxGain.connect(master);
  }

  function tone(freq, dur, type, vol, dest, when, slideTo) {
    if (!ctx) return;
    const t = when || ctx.currentTime;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type || 'square';
    o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t + dur);
    g.gain.setValueAtTime(vol || 0.3, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(dest || sfxGain);
    o.start(t); o.stop(t + dur + 0.02);
  }

  let noiseBuf = null;
  function noise(dur, vol, filterFreq, when, type) {
    if (!ctx) return;
    if (!noiseBuf) {
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    const t = when || ctx.currentTime;
    const s = ctx.createBufferSource(); s.buffer = noiseBuf;
    const f = ctx.createBiquadFilter(); f.type = type || 'lowpass'; f.frequency.value = filterFreq || 2000;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol || 0.3, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    s.connect(f); f.connect(g); g.connect(sfxGain);
    s.start(t); s.stop(t + dur + 0.02);
  }

  const SFX = {
    select() { tone(880, 0.08, 'square', 0.2); tone(1320, 0.1, 'square', 0.15, null, ctx && ctx.currentTime + 0.06); },
    move() { tone(440, 0.05, 'square', 0.12); },
    confirm() { [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.12, 'square', 0.18, null, ctx && ctx.currentTime + i * 0.06)); },
    whoosh() { noise(0.12, 0.15, 1200, null, 'bandpass'); },
    hitLight() { noise(0.08, 0.35, 3000); tone(180, 0.08, 'square', 0.2, null, null, 80); },
    hitHeavy() { noise(0.18, 0.5, 1800); tone(120, 0.2, 'sawtooth', 0.3, null, null, 40); },
    block() { tone(1200, 0.05, 'square', 0.15); noise(0.05, 0.2, 5000, null, 'highpass'); },
    jump() { tone(300, 0.1, 'square', 0.1, null, null, 600); },
    land() { noise(0.05, 0.15, 400); },
    special() { tone(220, 0.3, 'sawtooth', 0.2, null, null, 880); noise(0.25, 0.12, 2500, null, 'bandpass'); },
    fireball() { tone(150, 0.4, 'sawtooth', 0.25, null, null, 60); noise(0.35, 0.2, 900); },
    super() {
      if (!ctx) return;
      const t = ctx.currentTime;
      [262, 330, 392, 523, 659, 784].forEach((f, i) => tone(f, 0.15, 'square', 0.2, null, t + i * 0.05));
      tone(80, 0.8, 'sawtooth', 0.3, null, t + 0.3, 40);
    },
    ko() {
      if (!ctx) return;
      const t = ctx.currentTime;
      tone(600, 0.9, 'sawtooth', 0.3, null, t, 60);
      noise(0.8, 0.4, 600, t);
    },
    bark() { tone(500, 0.06, 'square', 0.25, null, null, 350); tone(520, 0.08, 'square', 0.25, null, ctx && ctx.currentTime + 0.12, 300); },
    heal() { [784, 988, 1175, 1568].forEach((f, i) => tone(f, 0.12, 'triangle', 0.2, null, ctx && ctx.currentTime + i * 0.05)); },
    announcer(word) { // "voz" robótica arcade
      if (!ctx) return;
      const t = ctx.currentTime;
      const base = { round: 180, fight: 220, ko: 140, perfect: 200, win: 260 }[word] || 200;
      tone(base, 0.18, 'sawtooth', 0.25, null, t, base * 0.9);
      tone(base * 1.5, 0.25, 'sawtooth', 0.2, null, t + 0.16, base * 1.2);
    }
  };

  // ---- Música: sequenciador simples ----
  const N = (n) => 440 * Math.pow(2, (n - 69) / 12);
  // Cada música: tempo, baixo (notas midi por passo), melodia
  const SONGS = {
    ending: { bpm: 112, bass: [48, 0, 55, 0, 52, 0, 55, 0, 45, 0, 52, 0, 53, 0, 55, 0], lead: [72, 0, 76, 79, 77, 0, 76, 74, 72, 0, 69, 0, 71, 72, 74, 0, 76, 0, 79, 84, 83, 0, 81, 79, 77, 76, 74, 0, 72, 0, 0, 0] },
    gameover: { bpm: 90, bass: [45, 0, 0, 0, 44, 0, 0, 0, 43, 0, 0, 0, 42, 0, 0, 0], lead: [69, 0, 68, 0, 67, 0, 66, 0, 65, 0, 0, 0, 64, 0, 0, 0] },
    ladder: { bpm: 150, bass: [43, 0, 43, 55, 41, 0, 41, 53, 40, 0, 40, 52, 38, 0, 43, 0], lead: [67, 71, 74, 0, 72, 69, 65, 0, 64, 67, 71, 0, 74, 0, 0, 0] },
    title: { bpm: 140, bass: [45, 0, 45, 0, 48, 0, 50, 0, 45, 0, 45, 0, 43, 0, 43, 0], lead: [69, 0, 72, 74, 76, 0, 74, 72, 69, 0, 67, 0, 64, 0, 67, 0, 69, 0, 72, 74, 76, 0, 79, 77, 76, 74, 72, 0, 74, 0, 0, 0] },
    select: { bpm: 150, bass: [40, 0, 52, 0, 40, 0, 52, 0, 43, 0, 55, 0, 45, 0, 57, 0], lead: [64, 67, 71, 0, 72, 71, 67, 0, 64, 67, 71, 74, 72, 0, 0, 0] },
    subway: { bpm: 156, bass: [41, 41, 53, 41, 41, 53, 41, 53, 43, 43, 55, 43, 46, 46, 58, 46], lead: [65, 0, 69, 72, 0, 69, 72, 74, 72, 0, 69, 0, 67, 69, 65, 0] },
    parque: { bpm: 132, bass: [48, 0, 55, 0, 52, 0, 55, 0, 45, 0, 52, 0, 50, 0, 55, 0], lead: [72, 74, 76, 0, 79, 0, 76, 74, 72, 0, 69, 0, 71, 72, 74, 0] },
    prefeitura: { bpm: 144, bass: [38, 38, 50, 38, 41, 41, 53, 41, 43, 43, 55, 43, 45, 45, 57, 45], lead: [74, 0, 74, 77, 79, 0, 77, 74, 72, 0, 74, 0, 69, 0, 0, 0] },
    etec: { bpm: 160, bass: [40, 52, 40, 52, 43, 55, 43, 55, 45, 57, 45, 57, 47, 59, 47, 59], lead: [76, 0, 79, 0, 81, 79, 76, 0, 74, 0, 76, 79, 76, 74, 71, 0] },
    cinema: { bpm: 120, bass: [36, 0, 0, 36, 43, 0, 0, 43, 39, 0, 0, 39, 41, 0, 43, 0], lead: [60, 0, 63, 0, 67, 0, 70, 68, 67, 0, 63, 0, 65, 0, 62, 0] },
    casa: { bpm: 150, bass: [43, 0, 43, 50, 0, 50, 43, 0, 48, 0, 48, 55, 0, 55, 50, 0], lead: [79, 0, 79, 81, 79, 0, 76, 0, 74, 76, 79, 0, 76, 74, 72, 0] },
    rua: { bpm: 138, bass: [45, 45, 0, 45, 48, 0, 50, 0, 41, 41, 0, 41, 43, 0, 44, 0], lead: [69, 72, 76, 0, 74, 72, 69, 0, 65, 69, 72, 0, 71, 0, 68, 0] },
    victory: { bpm: 170, bass: [48, 0, 52, 0, 55, 0, 60, 0], lead: [72, 76, 79, 84, 0, 79, 84, 0] }
  };

  function scheduler() {
    if (!ctx || !currentSong) return;
    const song = SONGS[currentSong];
    const stepDur = 60 / song.bpm / 2;
    while (nextTime < ctx.currentTime + 0.15) {
      const b = song.bass[musicStep % song.bass.length];
      const l = song.lead[musicStep % song.lead.length];
      if (b) tone(N(b), stepDur * 0.9, 'triangle', 0.5, musicGain, nextTime);
      if (l) tone(N(l), stepDur * 0.8, 'square', 0.18, musicGain, nextTime);
      if (musicStep % 4 === 0) noiseAt(nextTime, 0.06, 300);
      if (musicStep % 4 === 2) noiseAt(nextTime, 0.04, 6000);
      musicStep++;
      nextTime += stepDur;
      if (song.once && musicStep >= song.lead.length) { currentSong = null; break; }
    }
  }
  function noiseAt(t, vol, f) {
    if (!noiseBuf) noise(0.001, 0.0001);
    const s = ctx.createBufferSource(); s.buffer = noiseBuf;
    const fl = ctx.createBiquadFilter(); fl.type = f > 1000 ? 'highpass' : 'lowpass'; fl.frequency.value = f;
    const g = ctx.createGain(); g.gain.setValueAtTime(vol * 3, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    s.connect(fl); fl.connect(g); g.connect(musicGain); s.start(t); s.stop(t + 0.1);
  }

  // ---- Trilha com bandas ----
  // Cada momento do jogo sorteia uma música das bandas da lista (sem repetir até tocar todas);
  // quando a música acaba, sorteia outra do mesmo momento. Sem a música (ou com a trilha "8 BITS"),
  // toca o chiptune de sempre.
  const TRACKS = window.MUSIC_META || [];
  const AC = 'AC/DC', CPM = 'CPM 22', CBJ = 'CHARLIE BROWN JR.';
  const POOLS = {
    title: [CBJ, CPM],            // menus: clima de rolê
    select: [AC], ladder: [AC],   // escolha de lutador e escada do arcade: aquecimento
    fight: [AC, CPM],             // lutas
    ending: [CBJ],                // créditos e final
    hist_estrada: [AC],           // história: o Guti voando na estrada
    hist_parque: [CPM], hist_maratona: [AC], hist_subway: [CPM],
    hist_romance: [CBJ],          // Alex e Valeska na Prefeitura
    hist_festa: [CBJ, CPM]        // a surpresa e o desafio de aniversário
  };
  // músicas de cenário (lutas) e o chiptune usado no lugar de cada momento da história
  const STAGE_SONGS = ['parque', 'rua', 'prefeitura', 'subway', 'casa', 'etec', 'cinema'];
  const CHIP = { hist_estrada: 'select', hist_parque: 'parque', hist_maratona: 'rua', hist_romance: 'prefeitura', hist_subway: 'subway', hist_festa: 'casa' };
  let useBands = true, current = null, track = null, onTrack = null;
  const bags = {};
  let canAAC = null; // navegadores sem AAC (ex.: Chromium de código aberto) ficam com o chiptune
  const playable = () => (canAAC === null ? (canAAC = (() => { try { return !!new Audio().canPlayType('audio/mp4; codecs="mp4a.40.2"'); } catch (e) { return false; } })()) : canAAC);
  const poolOf = name => (playable() ? POOLS[name] || (STAGE_SONGS.includes(name) ? POOLS.fight : null) : null);
  // sorteia a banda (todas com a mesma chance) e depois a música dela, sem repetir até tocar todas
  function pick(name) {
    const artists = (poolOf(name) || []).filter(a => TRACKS.some(t => t.artist === a));
    if (!artists.length) return null;
    const artist = artists[Math.floor(Math.random() * artists.length)];
    const list = TRACKS.filter(t => t.artist === artist);
    const bag = bags[artist] = bags[artist] || [];
    if (!bag.length) { // embaralha de novo, sem começar pela última que tocou
      const ids = list.map(t => t.id).sort(() => Math.random() - 0.5);
      if (ids.length > 1 && ids[0] === bags[artist + ':last']) ids.push(ids.shift());
      bag.push(...ids);
    }
    const id = bag.shift(); bags[artist + ':last'] = id;
    return list.find(t => t.id === id);
  }
  // abaixo dos golpes: as gravações são bem mais altas que o chiptune
  const trackVol = t => Math.min(1, (t.gain || 1) * volMusic * 0.6);
  function fade(a, to, ms, done) {
    clearInterval(a._fade);
    const from = a.volume, t0 = performance.now();
    a._fade = setInterval(() => {
      const k = Math.min(1, (performance.now() - t0) / ms);
      try { a.volume = from + (to - from) * k; } catch (e) { /* volume fixo (iPhone) */ }
      if (k >= 1) { clearInterval(a._fade); if (done) done(); }
    }, 40);
  }
  function stopTrack(ms) {
    if (!track) return;
    const a = track.el; track = null;
    a.onended = a.onerror = null;
    fade(a, 0, ms || 600, () => { a.pause(); a.removeAttribute('src'); a.load(); });
  }
  function startTrack(name) {
    const t = pick(name); if (!t) return false;
    const a = new Audio('assets/music/' + t.file);
    a.preload = 'auto'; a.muted = muted; a.volume = 0;
    const me = { el: a, t, name };
    track = me;
    a.onended = () => { if (track === me) { stopTrack(50); startTrack(name); } };
    a.onerror = () => { if (track === me) { track = null; startChip(name); } }; // sem o arquivo: chiptune
    a._pending = true;
    tryPlay(me);
    if (onTrack) onTrack(t);
    return true;
  }
  // o navegador só deixa tocar depois de um clique/tecla: se recusar, tenta de novo no próximo gesto (init)
  function tryPlay(me) {
    const p = me.el.play();
    const ok = () => { me.el._pending = false; fade(me.el, trackVol(me.t), 800); };
    if (p && p.then) p.then(ok).catch(() => { me.el._pending = true; }); else ok();
  }
  function startChip(name) {
    const song = SONGS[name] ? name : CHIP[name];
    if (!song) { currentSong = null; return; }
    currentSong = song; musicStep = 0; nextTime = ctx.currentTime + 0.05;
    if (!musicTimer) musicTimer = setInterval(scheduler, 50);
  }
  // fresh: começa outra música mesmo que o momento seja o mesmo (ex.: revanche)
  function playMusic(name, fresh) {
    if (!ctx || (current === name && !fresh)) return;
    current = name;
    stopTrack(); currentSong = null;
    if (useBands && poolOf(name) && startTrack(name)) return;
    startChip(name);
  }
  function stopMusic() { current = null; currentSong = null; stopTrack(); }
  function setVolumes(m, s) {
    volMusic = m; volSfx = s;
    if (musicGain) musicGain.gain.value = 0.32 * volMusic;
    if (sfxGain) sfxGain.gain.value = 0.75 * volSfx;
    if (track && !track.el._pending) { clearInterval(track.el._fade); try { track.el.volume = trackVol(track.t); } catch (e) { /* volume fixo */ } }
  }
  function toggleMute() {
    muted = !muted;
    if (master) master.gain.value = muted ? 0 : 0.5;
    if (track) track.el.muted = muted;
    return muted;
  }
  // trilha: true = bandas, false = só chiptune (8 bits)
  function setBands(on) {
    if (useBands === !!on) return;
    useBands = !!on;
    const name = current; current = null;
    if (name) playMusic(name);
  }

  window.Sound = {
    init, playMusic, stopMusic, toggleMute, setVolumes, setBands, isMuted: () => muted,
    nowPlaying: () => (track ? track.t : null),
    set onTrack(f) { onTrack = f; },
    play(name, arg) { if (ctx && SFX[name]) SFX[name](arg); }
  };
})();
