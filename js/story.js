// Modo História: "O Sumiço da Min". O P1 é sempre o Guti; o P2 (outra pessoa ou a CPU) joga com quem aparece na história.
// As cenas são ilustrações em alta resolução (assets/story/<código>.jpg, listadas em js/storymeta.js),
// desenhadas numa tela por cima do jogo, com caixa de diálogo. Sem a imagem, aparece um quadro provisório.
(function () {
  const META = window.STORY_META || {}; // código do frame -> arquivo (ou lista de arquivos, para animação)
  const SAVE_KEY = 'fifi-story';

  // ---------- roteiro ----------
  // Passos: { f: frame, who: quem fala, t: texto, think: pensamento, auto: ms (avança sozinho), anim: ms por quadro,
  //           shake: tremer, sfx: som, music: música, place: legenda de lugar, ifLost: frame usado se o P2 venceu a luta anterior }
  //         { fight: { p2, stage, mustWin, rage, cutOnKO, label } }  |  { credits: true }  |  { chapter: 'nome', card: frame de fundo }
  const S = [];
  const add = (...a) => a.forEach(x => S.push(x));
  const say = (f, who, t, o) => Object.assign({ f, who, t }, o || {});
  const think = (f, who, t, o) => Object.assign({ f, who, t, think: true }, o || {});
  const show = (f, ms, o) => Object.assign({ f, auto: ms || 1600 }, o || {});

  add({ chapter: 'A volta da China', card: 'CAP01_a_volta_da_china', music: 'select' },
    show('H110_capa_modo_historia', 2600, { title: true }),
    say('H01_carro_guti_celular', 'GUTI', 'Oi, amor! Já estou na estrada. Logo, logo eu chego aí.', { anim: 260 }),
    say('H01_carro_guti_celular', 'MIN', 'Aaah, finalmente! Estou morrendo de saudade!', { phone: true }),
    say('H01_carro_guti_celular', 'GUTI', 'Eu também. Muita saudade de você e da Amora.', { anim: 260 }),
    say('H02_carro_guti_conta_china', 'GUTI', 'A China foi incrível... Vi a Muralha, comi pé de pato frito e trouxe um monte de comidas suspeitas pra vocês.'),
    say('H02_carro_guti_conta_china', 'MIN', 'Comidas suspeitas? Kjjjkkkjk', { phone: true }),
    say('H02_carro_guti_conta_china', 'GUTI', 'E tenho uma surpresa pra você também. Você vai...'),
    say('H03_guti_ouve_grito', 'MIN', 'AAAAAAAHHHH!', { phone: true, shake: true, sfx: 'ko' }),
    say('H04_guti_grita_amor', 'GUTI', 'Amor?? AMOR??', { shake: true }),
    say('H05_guti_sem_resposta', 'GUTI', 'Alô? Min? ...A ligação caiu.'),
    think('H06_guti_acelera', 'GUTI', 'Aguenta firme, Min. Estou chegando.'),
    show('H07_velocimetro', 2400, { anim: 700, once: true, sfx: 'dash' }),
    show('H08_carro_estrada_rapido', 1800, { shake: true }),
    show('H09_chegada_sorocaba', 2200, { place: 'SOROCABA' }));

  add({ chapter: 'A casa vazia', card: 'CAP02_a_casa_vazia', music: 'gameover' },
    say('H10_predio_guti', 'GUTI', 'Min!'),
    say('H11_guti_entra_casa', 'GUTI', 'Amor, cheguei! Min?'),
    say('H12_guti_procura_min', 'GUTI', 'Min? Cadê você?'),
    say('H13_guti_chama_amora', 'GUTI', 'Amora? Amora, vem cá, menina!'),
    say('H14_guti_chorando', 'GUTI', 'Não... Cadê vocês duas...'),
    show('H15_monster_no_chao', 1800),
    show('H16_guti_olhos_cerrados', 1400),
    think('H17_pensamento_pam', 'GUTI', 'Pamela...'));

  add({ chapter: 'Parque das Águas', card: 'CAP03_parque_das_aguas', music: 'parque' },
    show('H18_parque_chegada', 1800, { place: 'PARQUE DAS ÁGUAS' }),
    say('H19_guti_pergunta_pam', 'GUTI', 'Pamela! Onde ela está??'),
    say('H20_pam_nunca_vou_entregar', 'PAM', 'EU NUNCA VOU ENTREGAR ELA PRA VOCÊ, SEU MACHISTAAA!', { shake: true }),
    show('H21_guti_vs_pam', 1600, { vs: true }),
    { fight: { p2: 'pam', stage: 'parque', mustWin: true } },
    say('H22_pam_chorando', 'PAM', 'Tá bom, tá bom! Você pode levar ela!'),
    say('H23_amora_aparece', 'AMORA', 'Au! Au!'),
    say('H24_guti_abraca_amora', 'GUTI', 'Amora! Que saudade, menina!', { anim: 650 }),
    say('H25_guti_cade_min', 'GUTI', 'E a Min, cadê ela?'),
    say('H26_pam_confusa', 'PAM', 'Não sei, achei que estava com você. Ela só disse que precisava que alguém cuidasse da Amora pra ela ir correndo fazer alguma coisa...'),
    say('H26B_pam_da_de_ombros', 'PAM', 'Não entendi direito. Ela parecia tensa.'),
    think('H27_guti_pensa_correr', 'GUTI', 'Correr, é...'),
    show('H28_pensamento_belipe', 1500),
    say('H29_app_localizacao', 'GUTI', 'O aplicativo de localização... O Belipe está aqui perto!'),
    say('H30_guti_deixa_amora', 'GUTI', 'Pam, cuida da Amora pra mim? Eu já volto!'),
    say('H30B_pam_vai_logo', 'PAM', 'Vai logo, seu machista!'));

  add({ chapter: 'A meia maratona', card: 'CAP04_a_meia_maratona', music: 'rua' },
    show('H31_maratona_chegada', 1900, { place: 'MEIA MARATONA DE SOROCABA' }),
    say('H32_belipe_cruza_chegada', 'BELIPE', '#$%*! Que tempo horrível! #$%!', { shake: true, face: 'belipe_bravo' }),
    say('H33_guti_acusa_belipe', 'GUTI', 'Belipe! Me diz onde ela está!!'),
    say('H34_belipe_agora_nao', 'BELIPE', 'Guti, agora não. Eu não estou no clima de brincadeiras. Depois que eu me acalmar, eu devolvo ela pra você.', { face: 'belipe_bravo' }),
    say('H35_guti_sem_escolha', 'GUTI', 'Você não me dá escolha.'),
    show('H36_guti_vs_belipe', 1600, { vs: true }),
    { fight: { p2: 'belipe', stage: 'rua', rage: true, label: 'BELIPE BRAVO' } },
    say('H37_dois_no_chao', 'BELIPE', 'Bom... agora eu estou mais calmo...'),
    say('H38_belipe_ajuda_levantar', 'BELIPE', 'Vem, levanta.'),
    say('H39_belipe_camiseta', 'BELIPE', 'Toma. Eu nem usei, ia te devolver depois no Subway.'),
    say('H40_guti_confuso_camiseta', 'GUTI', 'Uma camisa? Eu pensei que você sabia onde a Min estava...'),
    say('H41_belipe_explica', 'BELIPE', 'A Min? Ela só veio ver o começo da corrida. Parecia meio preocupada... Assim que eu comecei a correr, ela saiu falando algo sobre comprar ração para a Amora.'),
    say('H41B_guti_pensa_alek', 'GUTI', 'Entendi... Vou ver se o Alek sabe de alguma coisa, então.'),
    say('H41C_belipe_aponta', 'BELIPE', 'Acho que ele e a Va estão na Prefeitura.'),
    say('H42_guti_sai_prefeitura', 'GUTI', 'Tá bem, obrigado! Depois a gente se fala!'));

  add({ chapter: 'Pôr do sol na Prefeitura', card: 'CAP05_por_do_sol_na_prefeitura', music: 'prefeitura' },
    say('H43_alex_va_passeio', 'VALESKA', 'Esse sorvete está perfeito...', { place: 'PREFEITURA DE SOROCABA' }),
    say('H43B_alex_galanteador', 'ALEX', 'Perfeita é você.'),
    say('H44_alex_va_patos', 'VALESKA', 'Olha os patinhos! Eu te amo, sabia?'),
    say('H44B_va_cabeca_ombro', 'ALEX', 'Eu te amo mais, bombom.'),
    say('H45_va_vai_banheiro', 'VALESKA', 'Vou no banheiro e já volto!'),
    say('H45_va_vai_banheiro', 'ALEX', 'Tô te esperando no banco da praça.'),
    show('H46_alex_banco', 2600, { anim: 900 }),
    show('H47_alex_alianca', 1800),
    think('H48_alex_sonhador', 'ALEX', 'Hoje vai ser um lindo dia...'),
    think('H49_guti_correndo', 'GUTI', 'Eu tenho que encontrá-la, eu tenho que encontrá-la...'),
    say('H50_guti_avista_alex', 'GUTI', 'ALEXXXXX!'),
    say('H51_alex_vira', 'ALEX', 'Hm?'),
    say('H52_guti_tropeca', 'GUTI', 'Opa, opa, opaaa...'),
    show('H53_trombada', 1100, { shake: true, sfx: 'hitHeavy' }),
    show('H54_anel_no_lago', 1900),
    say('H55_alex_desacreditado', 'ALEX', '...'),
    say('H56_alex_empurra', 'ALEX', 'VOCÊ TEM NOÇÃO DO QUE VOCÊ ACABOU DE FAZER?!', { shake: true }),
    think('H57_guti_ferrou', 'GUTI', 'Ferrou.'),
    show('H58_guti_vs_alex', 1600, { vs: true }),
    { fight: { p2: 'alex', stage: 'prefeitura', mustWin: true } },
    say('H59_alex_chorando', 'GUTI', 'Alex... Foi mal, cara. Deixa eu te ajudar...'),
    say('H60_va_voadora', 'VALESKA', 'SE AFASTA DO MEU BOMBOM!', { shake: true, sfx: 'hitHeavy' }),
    say('H61_va_brava', 'VALESKA', 'Nem adianta tentar se explicar, que eu vi você batendo nele!'),
    show('H62_guti_vs_va', 1600, { vs: true }),
    { fight: { p2: 'valesca', stage: 'prefeitura', mustWin: true, cutOnKO: true } },
    show('H63_va_arremessada', 1300),
    show('H64_va_splash', 1500, { shake: true }),
    say('H65_va_molhada_anel', 'VALESKA', 'Amooor, olha o que eu achei ali no lago!!!'),
    say('H66_alex_sem_jeito', 'ALEX', 'Ahh... que bom que você gostou...'),
    say('H67_va_percebe', 'VALESKA', 'Ué, foi você que comprou pra mim? Isso quer dizer que...'),
    show('H68_guti_foge', 2200),
    think('H69_guti_pensa_pv', 'GUTI', 'Tá, eles não deviam saber de nada... Só me resta uma opção...'),
    show('H70_celular_contato_pv', 1600));

  add({ chapter: 'Duelo no Subway', card: 'CAP06_duelo_no_subway', music: 'subway' },
    say('H71_guti_liga_pv', 'GUTI', 'PV? Onde você está?'),
    say('H72_pv_atende_subway', 'PV', 'Ah, estou no Subway, esperando a Ana. Sim, claro, pode vir.'),
    say('H73_guti_desliga', 'GUTI', 'Só pode ter sido ele...'),
    say('H74_pv_ana_lanchando', 'ANA', 'Esse lanche está muito bom!', { place: 'SUBWAY' }),
    say('H74B_pv_se_gaba', 'PV', 'O meu está melhor.'),
    say('H75_lanche_doritos', 'PV', 'O segredo é colocar Doritos no meio. Sempre.'),
    say('H75B_ana_rindo', 'ANA', 'Kkskks'),
    show('H76_porta_faroeste', 2000, { sfx: 'select' }),
    say('H77_guti_na_mesa', 'GUTI', 'Aqui ou lá fora?...'),
    say('H78_pv_serio', 'PV', 'LÁ FORA!!!!', { shake: true }),
    show('H79_pv_chute', 900, { shake: true, sfx: 'hitHeavy' }),
    show('H80_guti_voa_porta_fora', 1300),
    show('H81_guti_vs_pv', 1600, { vs: true }),
    { fight: { p2: 'pv', stage: 'subway', mustWin: true } },
    say('H82_ana_aparece', 'ANA', 'Isso não vai ficar assim!'),
    show('H83_guti_vs_ana', 1600, { vs: true }),
    { fight: { p2: 'ana', stage: 'subway' } },
    say('H84_pv_impede_soco', 'PV', 'PARA, PARA, PARA!', { shake: true }),
    say('H85_pv_pergunta', 'PV', 'Por que a gente está fazendo isso, Guti?'),
    say('H86_guti_envergonhado', 'GUTI', 'Ué... Eu não expliquei??'),
    show('H87_guti_explica', 2600),
    say('H88_pv_ahhh', 'PV', 'Ahhh, por que você não falou antes?'),
    say('H89_guti_ansioso', 'GUTI', 'Você sabe onde ela está????'),
    say('H90_pv_mostra_celular', 'PV', 'Sei sim, ela está com a localização ativa no aplicativo.'),
    show('H91_guti_sem_olhos', 2000),
    say('H92_guti_despede', 'GUTI', 'Valeu, PV! Desculpa, Ana!'));

  add({ chapter: 'A surpresa', card: 'CAP07_a_surpresa', music: 'casa' },
    show('H93_guti_corre_mapa', 1500),
    think('H93B_mapa_em_casa', 'GUTI', 'Ela está... em casa?'),
    say('H94_guti_aliviado', 'GUTI', 'Ela voltou pra casa, ainda bem...'),
    show('H95_elevador', 1700),
    show('H96_porta_apartamento', 1500),
    say('H97_festa_surpresa', 'TODOS', 'SURPRESAAA! FELIZ ANIVERSÁRIO, GUTI!', { shake: true, sfx: 'super' }),
    say('H98_guti_confuso', 'GUTI', 'Mas... como... quando... onde?'),
    say('H99_min_corre', 'MIN', 'Amooor!'),
    show('H100_beijo', 2200),
    say('H101_guti_corado', 'GUTI', 'Ah, quer saber? Está tudo bem agora...'));

  add({ chapter: 'O desafio de aniversário', card: 'CAP08_o_desafio_de_aniversario', music: 'casa' },
    say('H112_min_desafio', 'MIN', 'Mas o presente só vem depois do desafio de aniversário!'),
    show('H113_guti_vs_min', 1600, { vs: true }),
    { fight: { p2: 'min', stage: 'casa', label: 'LUTA AMISTOSA' } },
    show('H114_pos_luta_min', 2000, { ifLost: 'H114B_min_vence' }),
    say('H115_guti_pergunta_grito', 'GUTI', 'Mas e aquele grito no telefone?'),
    say('H116_revelacao_grito', 'MIN', 'É que... a Amora pulou na mesa e derrubou o bolo inteiro.', { flashback: true }),
    say('H117_min_corre_bolo', 'MIN', 'Deixei ela com a Pam e saí correndo pra comprar outro antes de você chegar!', { flashback: true }),
    say('H118_min_envergonhada', 'MIN', 'Kjjjkkkjk... Surpresa?'),
    say('H118B_guti_abraca_min', 'GUTI', 'Hahaha! Eu te amo, sabia?'));

  add({ chapter: 'Créditos', card: 'CAP09_creditos', music: 'ending' }, { credits: true }, show('H111_fim', 5000, { end: true }));

  // frames dos créditos e a lista de cargos (só aparecem dois nomes, alternados)
  const CREDIT_FRAMES = ['H102_creditos_bolo', 'H103_creditos_selfie', 'H104_creditos_amora', 'H105_creditos_pv_belipe', 'H106_creditos_pam_kpop', 'H107_creditos_alex_va', 'H108_creditos_guti_camiseta', 'H109_creditos_final'];
  const ROLES = ['Direção', 'Roteiro', 'Programação', 'Direção de Arte', 'Pixel Art', 'Design de Personagens', 'Animação', 'Cenários', 'Diálogos', 'Trilha Sonora', 'Efeitos Sonoros', 'Lutas e Golpes', 'Inteligência da CPU', 'Controle no Celular', 'Testes', 'Produção Executiva', 'Bufê do Café da Tarde das Cores', 'Coordenação de Fofocas', 'Cuidados com a Amora', 'Agradecimentos Especiais'];
  const NAMES = ['Paulo Vitor Lemes', 'Claude'];
  // fundos da tela de derrota e do menu do modo
  const SCREENS = { retry: 'R01_guti_derrotado', menu: 'M01_menu_historia' };

  const COLORS = { GUTI: '#ff6a5a', MIN: '#6aa8ff', PAM: '#c38cff', BELIPE: '#ff9a3a', ALEX: '#9a9aa6', VALESKA: '#e05a6a', PV: '#7ad07a', ANA: '#3ad0b0', AMORA: '#e8b060', TODOS: '#ffd400' };
  const CHAPTERS = S.map((s, i) => s.chapter ? i : -1).filter(i => i >= 0);

  // ---------- tela em alta resolução por cima do jogo ----------
  const CW = 1280, CH = 720;
  const cv = document.createElement('canvas'); cv.width = CW; cv.height = CH; cv.id = 'story';
  Object.assign(cv.style, { position: 'fixed', zIndex: 5, display: 'none', imageRendering: 'auto', cursor: 'pointer' });
  const cx = cv.getContext('2d');
  document.body.appendChild(cv);
  function place() {
    const s = document.getElementById('screen'); if (!s) return;
    const r = s.getBoundingClientRect();
    Object.assign(cv.style, { left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px' });
  }
  let clicked = false;
  cv.addEventListener('pointerdown', () => { clicked = true; });

  // ---------- imagens (carregadas sob demanda, alguns passos à frente) ----------
  const cache = {};
  const files = f => { const m = META[f]; return !m ? [] : (Array.isArray(m) ? m : [m]); };
  function img(src) {
    if (!cache[src]) { const im = new Image(); im.decoding = 'async'; im.src = 'assets/story/' + src; cache[src] = im; }
    return cache[src];
  }
  const ok = im => im && im.complete && im.naturalWidth > 0;
  // retratos da caixa de diálogo (assets/story/portraits/<id>.png)
  const FACES = { GUTI: 'guti', MIN: 'min', PAM: 'pam', BELIPE: 'belipe', ALEX: 'alex', VALESKA: 'valeska', PV: 'pv', ANA: 'ana', AMORA: 'amora' };
  const faceCache = {};
  function face(s) {
    const id = s.face || FACES[s.who]; if (!id) return null;
    if (!faceCache[id]) { const im = new Image(); im.src = 'assets/story/portraits/' + id + '.png'; faceCache[id] = im; }
    return ok(faceCache[id]) ? faceCache[id] : null;
  }
  Object.values(FACES).concat(['belipe_bravo']).forEach(id => face({ face: id }));
  function preload(from) {
    for (let i = from; i < Math.min(S.length, from + 6); i++) [S[i].f, S[i].ifLost, S[i].card].forEach(f => f && files(f).forEach(img));
    if (S[from] && S[from].credits) CREDIT_FRAMES.forEach(f => files(f).forEach(img));
  }

  // ---------- estado ----------
  const st = { i: 0, t: 0, chars: 0, prevF: null, fadeT: 0, twoPlayer: true, retry: false, menu: null, fightIdx: -1, music: null };
  // avançar: soco/confirmar/clique (START abre o menu, então não conta)
  const advKey = () => (Game.confirmKey() && !Game.anyStart()) || clicked;
  const save = {
    get() { try { return JSON.parse(localStorage.getItem(SAVE_KEY) || '{}'); } catch (e) { return {}; } },
    set(v) { try { localStorage.setItem(SAVE_KEY, JSON.stringify(Object.assign(save.get(), v))); } catch (e) { /* sem armazenamento */ } }
  };
  const step = () => S[st.i] || {};
  // frame do passo (alguns mudam conforme quem venceu a última luta)
  const frameOf = s => (s.ifLost && st.lastWinner === 1 ? s.ifLost : s.f);

  function begin(fromIdx) {
    files(SCREENS.retry).forEach(img);
    st.i = fromIdx || 0; st.t = 0; st.chars = 0; st.retry = false; st.menu = null; st.prevF = null;
    enterStep();
    Game.go('story');
  }
  function enterStep() {
    const s = step();
    st.t = 0; st.chars = 0;
    if (s.chapter) save.set({ chapter: st.i });
    if (s.music) { st.music = s.music; Sound.playMusic(s.music); }
    if (s.sfx) Sound.play(s.sfx);
    preload(st.i);
  }
  function next() {
    const cur = step();
    st.prevF = frameOf(cur) || st.prevF;
    st.i++;
    if (st.i >= S.length) { save.set({ done: true, chapter: 0 }); hide(); Game.go('title'); return; }
    const s = step();
    if (s.chapter) { st.chapterT = 0; }
    enterStep();
    if (s.f && frameOf(s) !== st.prevF) st.fadeT = 14;
    if (s.fight) startFight(s.fight);
  }
  function startFight(fd) {
    st.fightIdx = st.i;
    G.mode = 'story'; G.picks = ['guti', fd.p2];
    G.stage = Stages.list.find(x => x.id === fd.stage) || Stages.list[0];
    hide();
    Game.startMatch();
  }

  // ---------- integração com a luta ----------
  const Story = {
    get twoPlayer() { return st.twoPlayer; },
    current: () => (step().fight || {}),
    // chamado pelo startMatch quando G.mode === 'story'
    onMatchStart(g) {
      const fd = Story.current();
      g.spectators = [];
      const b = g.fighters[1];
      if (fd.rage) { b.rage = true; b.rageT = 0; }
      b.storyLabel = fd.label || null;
    },
    // a cada quadro da luta: o Belipe Bravo xinga e vai se acalmando
    fightTick(g) {
      const b = g.fighters[1]; if (!b || !b.rage) return;
      b.rageT = (b.rageT || 0) + 1;
      if (b.rageT % 150 === 40 && g.fighting) b.say(['#$%!', '%$#*!', 'SAI DA FRENTE!', '#$%*!!', 'QUE TEMPO HORRIVEL!'][(b.rageT / 150 | 0) % 5], '#ff5a3a');
      const L = window.FighterLib || {};
      if (b.rageT % 24 === 0) g.particle(b.x + (Math.random() - 0.5) * 16, (L.GROUND || 182) + b.y - 62 * (b.ch.scale || 1), 'poof');
      if (b.hp < (L.MAX_HP || 1000) * 0.55) { b.rage = false; b.say('...TA BOM, TA BOM.', '#ffffff'); }
    },
    // nocaute da Valeska: corta direto para a cena, sem a animação de queda
    cutOnKO: loser => G.mode === 'story' && !!Story.current().cutOnKO && loser === G.fighters[1] && G.wins[0] + 1 >= G.opts.rounds,
    // fim da luta
    onMatchEnd(winner) {
      const fd = Story.current();
      st.lastWinner = winner;
      Sound.stopMusic && Sound.stopMusic();
      if (fd.mustWin && winner !== 0) { st.retry = true; st.menu = { i: 0 }; Game.go('story'); Sound.playMusic('gameover'); return; }
      Game.go('story');
      next();
      if (st.music && !step().fight) Sound.playMusic(st.music);
    },
    start: begin
  };

  // ---------- desenho ----------
  function wrap(text, maxW, font) {
    cx.font = font;
    const words = text.split(' '), lines = []; let cur = '';
    for (const w of words) { const t = cur ? cur + ' ' + w : w; if (cx.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t; }
    if (cur) lines.push(cur);
    return lines;
  }
  function rr(x, y, w, h, r) { cx.beginPath(); cx.moveTo(x + r, y); cx.arcTo(x + w, y, x + w, y + h, r); cx.arcTo(x + w, y + h, x, y + h, r); cx.arcTo(x, y + h, x, y, r); cx.arcTo(x, y, x + w, y, r); cx.closePath(); }
  function frameImage(f, s, t) {
    const list = files(f);
    if (!list.length) return null;
    let k = 0;
    if (list.length > 1 && s && s.anim) { k = Math.floor(t * 16.67 / s.anim); k = s.once ? Math.min(list.length - 1, k) : k % list.length; }
    const im = img(list[k]);
    return ok(im) ? im : (ok(img(list[0])) ? img(list[0]) : null);
  }
  function placeholder(f) {
    const g = cx.createLinearGradient(0, 0, CW, CH); g.addColorStop(0, '#2a1450'); g.addColorStop(1, '#0a1428');
    cx.fillStyle = g; cx.fillRect(0, 0, CW, CH);
    cx.strokeStyle = 'rgba(255,212,0,.35)'; cx.lineWidth = 4; cx.setLineDash([18, 12]); cx.strokeRect(40, 40, CW - 80, CH - 80); cx.setLineDash([]);
    cx.fillStyle = '#ffd400'; cx.font = 'bold 54px "Trebuchet MS", Arial, sans-serif'; cx.textAlign = 'center';
    cx.fillText(f.split('_')[0], CW / 2, 250);
    cx.fillStyle = '#cfc8e8'; cx.font = '30px "Trebuchet MS", Arial, sans-serif';
    cx.fillText(f.split('_').slice(1).join(' '), CW / 2, 300);
    cx.fillStyle = '#8a80a8'; cx.font = '22px "Trebuchet MS", Arial, sans-serif';
    cx.fillText('(imagem ainda não adicionada)', CW / 2, 345);
    cx.textAlign = 'left';
  }
  function drawFrame(f, s, t, alpha) {
    cx.globalAlpha = alpha;
    const im = f && frameImage(f, s, t);
    if (im) {
      const k = Math.max(CW / im.naturalWidth, CH / im.naturalHeight), w = im.naturalWidth * k, h = im.naturalHeight * k;
      cx.drawImage(im, (CW - w) / 2, (CH - h) / 2, w, h);
    } else if (f) placeholder(f);
    else { cx.fillStyle = '#000'; cx.fillRect(0, 0, CW, CH); }
    cx.globalAlpha = 1;
  }
  function drawBox(s) {
    const txt = s.t || '', shown = txt.slice(0, st.chars);
    const font = (s.think ? 'italic ' : '') + 'bold 31px "Trebuchet MS", Verdana, Arial, sans-serif';
    const fc = face(s), pad = fc ? 250 : 0;
    const lines = wrap(txt, CW - 200 - pad, font).slice(0, 3);
    const bx = 60, bw = CW - 120, bh = Math.max(fc ? 150 : 0, 70 + lines.length * 40), by = CH - bh - 30;
    cx.fillStyle = s.think ? 'rgba(20,30,60,.82)' : 'rgba(12,8,24,.86)';
    rr(bx, by, bw, bh, 18); cx.fill();
    cx.strokeStyle = s.think ? '#9ff0ff' : '#ffd400'; cx.lineWidth = 4; cx.stroke();
    if (fc) { // retrato saindo por cima da caixa
      cx.save(); rr(bx, by - 120, 250, bh + 120, 18); cx.clip();
      cx.drawImage(fc, bx + 5, by + bh - 245, 240, 240); cx.restore();
    }
    if (s.who) {
      const name = s.who + (s.think ? ' (pensando)' : '') + (s.phone ? ' (no celular)' : '');
      cx.font = 'bold 26px "Trebuchet MS", Verdana, Arial, sans-serif';
      const nw = cx.measureText(name).width + 36;
      cx.fillStyle = COLORS[s.who] || '#ffd400'; rr(bx + 26 + pad, by - 22, nw, 44, 12); cx.fill();
      cx.fillStyle = '#140a24'; cx.fillText(name, bx + 44 + pad, by + 9);
    }
    cx.font = font; cx.fillStyle = '#ffffff';
    let left = shown.length;
    lines.forEach((l, i) => { const part = l.slice(0, Math.max(0, left)); left -= l.length + 1; cx.fillText(part, bx + 46 + pad, by + 64 + i * 40); });
    if (st.chars >= txt.length && (st.t >> 4) % 2) { cx.fillStyle = '#ffd400'; cx.beginPath(); cx.moveTo(bx + bw - 50, by + bh - 34); cx.lineTo(bx + bw - 30, by + bh - 34); cx.lineTo(bx + bw - 40, by + bh - 22); cx.fill(); }
  }
  function drawPlace(txt, t) {
    const a = Math.min(1, t / 20, Math.max(0, (150 - t) / 30));
    if (a <= 0) return;
    cx.globalAlpha = a;
    cx.font = 'bold 40px "Trebuchet MS", Arial, sans-serif';
    const w = cx.measureText(txt).width + 60;
    cx.fillStyle = 'rgba(0,0,0,.6)'; cx.fillRect(0, 60, w, 64);
    cx.fillStyle = '#ffd400'; cx.fillRect(0, 60, 10, 64);
    cx.fillStyle = '#fff'; cx.fillText(txt, 34, 106);
    cx.globalAlpha = 1;
  }
  const CHAPTER_T = 180; // 3 s por cartão
  function drawChapter(s, t) {
    const name = s.chapter, a = Math.min(1, t / 15, Math.max(0, (CHAPTER_T - 10 - t) / 20));
    cx.fillStyle = '#000'; cx.fillRect(0, 0, CW, CH);
    const im = s.card && frameImage(s.card);
    if (im) { // arte do lugar, com um zoom lento
      const z = 1 + t / CHAPTER_T * 0.05;
      cx.globalAlpha = a; cx.save(); cx.translate(CW / 2, CH / 2); cx.scale(z, z);
      cx.drawImage(im, -CW / 2, -CH / 2, CW, CH); cx.restore();
      const g = cx.createLinearGradient(0, CH / 2 - 130, 0, CH / 2 + 110);
      g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.3, 'rgba(0,0,0,.55)'); g.addColorStop(0.7, 'rgba(0,0,0,.55)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      cx.fillStyle = g; cx.fillRect(0, CH / 2 - 130, CW, 240);
    }
    cx.globalAlpha = a; cx.textAlign = 'center';
    cx.shadowColor = '#000'; cx.shadowBlur = 12;
    cx.fillStyle = im ? '#e8e0ff' : '#8a80a8'; cx.font = 'bold 28px "Trebuchet MS", Arial, sans-serif';
    const n = CHAPTERS.indexOf(st.i) + 1;
    cx.fillText(name === 'Créditos' ? '' : 'CAPÍTULO ' + n, CW / 2, CH / 2 - 40);
    cx.fillStyle = '#ffd400'; cx.font = 'bold 60px "Trebuchet MS", Arial, sans-serif';
    cx.fillText(name.toUpperCase(), CW / 2, CH / 2 + 30);
    cx.shadowBlur = 0; cx.textAlign = 'left'; cx.globalAlpha = 1;
  }

  // ---------- créditos ----------
  function credits(t) {
    const per = 300; // 5 s por imagem
    const k = Math.floor(t / per), f = CREDIT_FRAMES[k % CREDIT_FRAMES.length];
    drawFrame(f, null, t, 1);
    const tt = t % per;
    if (tt < 20 && k > 0) drawFrame(CREDIT_FRAMES[(k - 1) % CREDIT_FRAMES.length], null, t, 1 - tt / 20);
    // dois cargos por imagem, alternando os cantos
    [0, 1].forEach(j => {
      const r = k * 2 + j; if (r >= ROLES.length) return;
      const a = Math.min(1, Math.max(0, (tt - 30 - j * 100) / 25), Math.max(0, (per - 10 - tt) / 25));
      if (a <= 0) return;
      const corner = (k + j) % 4, x = corner % 2 ? CW - 60 : 60, y = corner < 2 ? 90 : CH - 110;
      cx.globalAlpha = a; cx.textAlign = corner % 2 ? 'right' : 'left';
      cx.font = 'bold 24px "Trebuchet MS", Arial, sans-serif'; cx.fillStyle = 'rgba(0,0,0,.55)';
      const w = Math.max(cx.measureText(ROLES[r]).width, 330) + 40;
      cx.fillRect(corner % 2 ? x - w + 20 : x - 20, y - 34, w, 84);
      cx.fillStyle = '#ffd400'; cx.fillText(ROLES[r].toUpperCase(), x, y);
      cx.fillStyle = '#ffffff'; cx.font = 'bold 34px "Trebuchet MS", Arial, sans-serif'; cx.fillText(NAMES[r % 2], x, y + 38);
      cx.textAlign = 'left'; cx.globalAlpha = 1;
    });
    return k >= Math.max(CREDIT_FRAMES.length, Math.ceil(ROLES.length / 2));
  }

  // ---------- cena "story" (chamada pelo laço do jogo) ----------
  Story.scene = function () {
    place(); cv.style.display = 'block';
    const s = step();
    st.t++;
    const adv = advKey(); clicked = false;
    if (st.retry) return retryScreen();
    if (Game.anyStart() || Input.key('Escape')) { st.menu = st.menu ? null : { i: 0 }; Sound.play('select'); }
    if (st.menu) return pauseMenu();

    if (s.chapter) { drawChapter(s, st.t); if (st.t > CHAPTER_T || (adv && st.t > 20)) next(); return; }
    if (s.credits) { if (credits(st.t)) next(); return; }
    if (s.fight) return; // a luta está rodando em outra cena

    // imagem (com transição e tremida)
    cx.save();
    if (s.shake && st.t < 18) cx.translate((Math.random() - 0.5) * 22, (Math.random() - 0.5) * 22);
    const f = frameOf(s);
    drawFrame(f, s, st.t, 1);
    if (st.fadeT > 0 && st.prevF && st.prevF !== f) { drawFrame(st.prevF, null, 0, st.fadeT / 14); st.fadeT--; }
    cx.restore();
    if (s.flashback) { cx.fillStyle = 'rgba(255,240,210,.16)'; cx.fillRect(0, 0, CW, CH); const v = cx.createRadialGradient(CW / 2, CH / 2, CH * 0.35, CW / 2, CH / 2, CH * 0.85); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(60,40,20,.55)'); cx.fillStyle = v; cx.fillRect(0, 0, CW, CH); }
    if (s.place) drawPlace(s.place, st.t);
    if (s.vs) { cx.font = 'bold 120px "Arial Black", Arial, sans-serif'; cx.textAlign = 'center'; cx.lineWidth = 10; cx.strokeStyle = '#000'; const pulse = 1 + Math.sin(st.t / 5) * 0.03; cx.save(); cx.translate(CW / 2, CH / 2 + 40); cx.scale(pulse, pulse); cx.strokeText('VS', 0, 0); cx.fillStyle = '#ffd400'; cx.fillText('VS', 0, 0); cx.restore(); cx.textAlign = 'left'; }
    if (s.t) {
      st.chars = Math.min(s.t.length, st.chars + 1.2);
      drawBox(s);
      if (adv) { if (st.chars < s.t.length) st.chars = s.t.length; else { Sound.play('move'); next(); } }
    } else if (st.t * 16.67 > (s.auto || 1500) || (adv && st.t > 8)) next();
    // dica de controles (só no começo)
    if (st.i < 8) cx.font = '18px "Trebuchet MS", Arial, sans-serif'; cx.fillStyle = 'rgba(255,255,255,.45)'; cx.textAlign = 'right';
    if (st.i < 8) cx.fillText('SOCO / CLIQUE: avançar    START / ESC: menu', CW - 24, 30); cx.textAlign = 'left';
  };
  function overlayPanel(title, items, P, sub, o) {
    o = o || {};
    const y0 = o.y || 220, dim = o.dim === undefined ? 0.72 : o.dim;
    cx.fillStyle = 'rgba(0,0,0,' + dim + ')'; cx.fillRect(0, 0, CW, CH);
    cx.textAlign = 'center'; cx.shadowColor = '#000'; cx.shadowBlur = o.dim !== undefined ? 10 : 0;
    cx.fillStyle = '#ffd400'; cx.font = 'bold 54px "Trebuchet MS", Arial, sans-serif'; cx.fillText(title, CW / 2, y0);
    if (sub) { cx.fillStyle = '#cfc8e8'; cx.font = '26px "Trebuchet MS", Arial, sans-serif'; cx.fillText(sub, CW / 2, y0 + 50); }
    if (Game.navDown()) { P.i = (P.i + 1) % items.length; Sound.play('move'); }
    if (Game.navUp()) { P.i = (P.i + items.length - 1) % items.length; Sound.play('move'); }
    items.forEach((it, i) => {
      cx.fillStyle = i === P.i ? '#ffd400' : '#ffffff'; cx.font = 'bold 34px "Trebuchet MS", Arial, sans-serif';
      cx.fillText((i === P.i ? '> ' : '') + it.label + (i === P.i ? ' <' : ''), CW / 2, y0 + 140 + i * 56);
    });
    cx.shadowBlur = 0; cx.textAlign = 'left';
    if (P.t === undefined) P.t = 0;
    if (++P.t > 6 && advKey()) { clicked = false; Sound.play('confirm'); items[P.i].act(); }
  }
  function pauseMenu() {
    const s = step();
    if (s.f || s.card) drawFrame(frameOf(s) || s.card, s, st.t, 1); else { cx.fillStyle = '#000'; cx.fillRect(0, 0, CW, CH); }
    overlayPanel('HISTÓRIA', [
      { label: 'CONTINUAR', act: () => { st.menu = null; } },
      { label: 'PULAR CENA', act: () => { st.menu = null; skipToNextFight(); } },
      { label: 'SAIR PARA O MENU', act: () => { st.menu = null; hide(); Game.go('title'); } }
    ], st.menu);
  }
  function retryScreen() {
    if (files(SCREENS.retry).length) drawFrame(SCREENS.retry, null, 0, 1); else { cx.fillStyle = '#000'; cx.fillRect(0, 0, CW, CH); }
    if (!st.menu) st.menu = { i: 0 };
    overlayPanel('O GUTI PERDEU...', [
      { label: 'TENTAR DE NOVO', act: () => { st.retry = false; st.menu = null; startFight(step().fight); } },
      { label: 'SAIR PARA O MENU', act: () => { st.retry = false; st.menu = null; hide(); Game.go('title'); } }
    ], st.menu, 'A Min ainda está desaparecida!', files(SCREENS.retry).length ? { y: 440, dim: 0.15 } : null);
  }
  function skipToNextFight() {
    if (step().credits) { next(); return; }
    let j = st.i + 1;
    while (j < S.length && !S[j].fight && !S[j].credits) j++;
    if (j >= S.length) j = S.length - 1;
    // para na imagem "VS" antes da luta, se houver
    st.i = S[j - 1] && S[j - 1].vs && j - 1 > st.i ? j - 1 : j;
    st.prevF = null; enterStep();
    if (step().fight) startFight(step().fight);
  }
  function hide() { cv.style.display = 'none'; }

  // ---------- menu do modo ----------
  Story.menuScene = function () {
    hide();
    const sv = save.get(), canCont = sv.chapter > 0;
    const items = [
      { label: 'COMECAR DO INICIO', act: () => begin(0) },
      { label: 'CONTINUAR DO CAPITULO ' + (CHAPTERS.indexOf(sv.chapter) + 1), act: () => begin(sv.chapter), hidden: !canCont },
      { label: 'ADVERSARIOS: ' + (st.twoPlayer ? 'JOGADOR 2' : 'CPU'), act: () => { st.twoPlayer = !st.twoPlayer; }, change: () => { st.twoPlayer = !st.twoPlayer; } },
      { label: 'VOLTAR', act: () => Game.go('title') }
    ];
    Game.storyMenu(items, frameImage(SCREENS.menu));
  };
  Story.hide = hide;
  Story.steps = S;
  window.Story = Story;
  window.addEventListener('resize', place);
})();
