// Elenco do Fifi Fighters. Visual baseado nas fotos; golpes baseados no grupo "Fifis são padrinhas".
// Controles de golpes especiais:  PODER (N / 3)  |  frente + PODER  |  baixo + PODER  |  SUPER = SOCO + PODER (barra cheia)
window.CHARACTERS = [
  {
    id: 'guti', name: 'GUTI', title: 'O Benzinho do Grupo', realName: 'Fernando',
    desc: 'Engenheiro de humor seco. Voltou da China com comidas suspeitas. Nunca esta errado.',
    look: { skin: '#e0b08a', hair: '#1d1512', hairStyle: 'short', gauge: true, shirt: '#19191d', print: 'tiny', pants: '#34445f', shoes: '#1c1c1c', shoeSole: '#e8e8e8' },
    scale: 1.04, build: 1, idle: 'cool', victory: 'flex',
    stats: { speed: 1.0, jump: 1.0, power: 1.0, defense: 1.0 },
    intro: 'Amanha venham de galocha e carro 4x4.',
    win: ['Eu nunca estou errado.', 'Nada ve.', 'Gente, vcs tao atrasando nosso almoco.', 'N me irrite.'],
    specials: {
      n: { name: 'Pe de Pato da China', type: 'projectile', pose: 'throw', startup: 12, recovery: 22, dmg: 80, speed: 4.2, fx: 'duckfoot', stun: 22, w: 14, h: 10 },
      fwd: { name: 'Kart 10:10', type: 'rush', pose: 'rush', startup: 8, dur: 30, recovery: 18, speed: 5.4, dmg: 32, hits: 3, fx: 'kart' },
      down: { name: 'Eu Nunca Estou Errado', type: 'counter', pose: 'counter', startup: 4, window: 34, recovery: 20, dmg: 130, text: 'EU NUNCA ESTOU ERRADO' },
      super: { name: 'So o Guti Faz Pipoca', type: 'rain', pose: 'summon', startup: 20, recovery: 30, dmg: 45, count: 9, fx: 'popcorn' }
    }
  },
  {
    id: 'min', name: 'MIN', title: 'Diva Babilonica', realName: 'Yasmin',
    desc: 'Anfitria e cozinheira oficial. Protege o Guti de tudo. Ri em "kjjjkjjkk".',
    look: { skin: '#f1c6a6', hair: '#2a1c28', hairStyle: 'long', hairTips: '#2aa0d8', headband: '#2a6fd6', female: true, lashes: true, blush: '#e89a9a',
      shirt: '#2e2a22', sleeve: '#f1c6a6', dress: '#3a2a1e', dressPattern: ['#e8a33d', '#f2e6d0', '#c95b4a'], pants: '#f1c6a6', shoes: '#2a2a2a', tattoo: '#3a4a5a', shorts: true },
    scale: 0.92, build: 0.9, idle: 'bounce', victory: 'jumpjoy',
    stats: { speed: 1.08, jump: 1.05, power: 0.95, defense: 0.95 },
    intro: 'Quem nao tiver com roupinha do Brasil nn passa da minha porta!',
    win: ['Kjjjkjjkk', 'Arrasouu!', 'Nao fala assim do meu homem!', 'Ficou maravilhoso, 0 defeitos.'],
    specials: {
      n: { name: 'Dadinho de Tapioca', type: 'projectile', pose: 'throw', startup: 10, recovery: 20, dmg: 30, speed: 4.6, fx: 'dadinho', count: 3, spread: 8, w: 7, h: 7 },
      fwd: { name: 'Amora, Pega!', type: 'summon', pose: 'summon', startup: 14, recovery: 24, dmg: 45, hits: 2, entity: 'dog', speed: 4.4 },
      down: { name: 'Portaria Facial', type: 'trap', pose: 'push', startup: 12, recovery: 18, dmg: 90, dist: 70, life: 240, stun: 30 },
      super: { name: 'Eu Te Protejo', type: 'beam', pose: 'beam', startup: 22, dur: 50, recovery: 30, dmg: 28, hits: 10, fx: 'rice', color: '#ffffff', text: 'EU TE PROTEJO!' }
    }
  },
  {
    id: 'pv', name: 'PV', title: 'Senhor das Enquetes', realName: 'Paulo Vitor',
    desc: 'Organiza os roles, os churrascos e as enquetes. A culpa e sempre dele.',
    look: { skin: '#c98e64', hair: '#1a120e', hairStyle: 'curly', glasses: '#141414', beard: '#1a120e', shirt: '#6b4632', pants: '#2b2f36', shoes: '#2a2a2a', belly: 1.5 },
    scale: 1.1, build: 1.18, idle: 'selfie', victory: 'phone',
    stats: { speed: 0.9, jump: 0.92, power: 1.12, defense: 1.12 },
    intro: 'Teremos que recorrer a democracia.',
    win: ['A verdade e relativa.', 'Oloco, bora!', 'Amo voces acima de qualquer coisa.', 'Enquete encerrada. Eu venci.'],
    specials: {
      n: { name: 'Enquete Suprema', type: 'projectile', pose: 'push', startup: 14, recovery: 22, dmg: 70, speed: 3.2, fx: 'poll', stun: 28, w: 16, h: 14 },
      fwd: { name: 'Culpa do Paulo', type: 'counter', pose: 'counter', startup: 4, window: 36, recovery: 20, dmg: 120, reflect: true, text: 'A CULPA E DE QUEM?' },
      down: { name: 'Costela de 12h', type: 'heal', pose: 'eat', startup: 18, recovery: 30, amount: 90, prop: 'costela' },
      super: { name: 'Enquete: Democracia', type: 'volley', pose: 'beam', startup: 22, recovery: 34, dmg: 40, count: 7, fx: 'poll', speed: 5, text: 'DEMOCRACIA!' }
    }
  },
  {
    id: 'ana', name: 'ANA', title: 'Fluttershy', realName: 'Ana Beatriz',
    desc: 'Organiza a lista do role e os convites. Doce, ARMY e azarada com o clima.',
    look: { skin: '#c08a62', hair: '#1c120d', hairStyle: 'longCurly', female: true, lashes: true, lipstick: '#9a3a4a', shirt: '#141414', sleeve: '#c08a62', pants: '#4a6fa5', shoes: '#e8e8e8', bracelet: '#222', tattoo: null },
    scale: 1.0, build: 0.88, idle: 'wave', victory: 'heart',
    stats: { speed: 1.05, jump: 1.05, power: 0.95, defense: 0.98 },
    intro: 'Oiiie gente, td bem com vcs??',
    win: ['Amo vcs! ...mas e obrigatorio.', 'Passando pra avisar que eu ganhei.', 'kkskks', 'Ja anotei na lista!'],
    specials: {
      n: { name: 'Passando pra Avisar', type: 'projectile', pose: 'push', startup: 12, recovery: 20, dmg: 60, speed: 3.6, fx: 'bubble', text: 'AVISO!', stun: 30, w: 20, h: 12 },
      fwd: { name: 'Lista do Role', type: 'projectile', pose: 'throw', startup: 12, recovery: 22, dmg: 35, speed: 3.4, fx: 'items', count: 3, arc: true, w: 8, h: 8 },
      down: { name: 'Amo Vcs', type: 'heal', pose: 'taunt', startup: 16, recovery: 26, amount: 80, hearts: true },
      super: { name: 'ARMY Stream', type: 'beam', pose: 'beam', startup: 22, dur: 50, recovery: 30, dmg: 28, hits: 10, fx: 'army', color: '#b06cff', text: 'BORAHAE!' }
    }
  },
  {
    id: 'belipe', name: 'BELIPE', title: 'Dono do Grupo', realName: 'Felipe',
    desc: 'Admin, corredor e viciado em fofoca. Tem razao sempre. Solteiro convicto.',
    look: { skin: '#e8bf9c', hair: '#7a5232', hairStyle: 'short', beard: '#7a5232', shirt: '#f7d417', print: 'brasil', pattern: 'collar', patternColor: '#0a7a3a', sleeveStripe: '#0a7a3a', pants: '#1e2a4a', shoes: '#f2f2f2', shoeSole: '#c0281c' },
    scale: 1.0, build: 0.95, idle: 'jog', victory: 'run',
    stats: { speed: 1.18, jump: 1.08, power: 0.92, defense: 0.92 },
    intro: 'Pessoal... Quais os seus planos para hj???',
    win: ['Eu tenho razao smp.', 'KKKKKKKKK', 'Promete???', 'Estou com abstinencia de fofoca.'],
    specials: {
      n: { name: 'Promete???', type: 'projectile', pose: 'taunt', startup: 10, recovery: 20, dmg: 50, speed: 3.8, fx: 'text', text: '???', stun: 34, w: 18, h: 10 },
      fwd: { name: 'Meia Maratona', type: 'rush', pose: 'rush', startup: 6, dur: 34, recovery: 16, speed: 6.4, dmg: 30, hits: 3, fx: 'dust' },
      down: { name: 'Mensagem Apagada', type: 'undo', pose: 'taunt', startup: 10, recovery: 22, text: 'MENSAGEM APAGADA' },
      super: { name: 'Abstinencia de Fofoca', type: 'rush', pose: 'rush', startup: 18, dur: 46, recovery: 26, speed: 6, dmg: 34, hits: 9, fx: 'kkk', text: 'KKKKKKKKK', super: true }
    }
  },
  {
    id: 'pam', name: 'PAM', title: 'PCC', realName: 'Pamela',
    desc: 'Caotica, sarcastica, fa de Stray Kids, vive de Monster. "Me odeiam."',
    look: { skin: '#e6b896', hair: '#1e1414', hairStyle: 'longCurly', glasses: '#3a2030', female: true, lashes: true, lipstick: '#a03050', shirt: '#1a1a1a', print: 'band', pants: '#e87fa8', shorts: true, skirt: '#e87fa8', shoes: '#1a1a1a', strap: '#5a3a20' },
    scale: 0.95, build: 0.9, idle: 'sip', victory: 'drink',
    stats: { speed: 1.12, jump: 1.0, power: 0.98, defense: 0.9 },
    intro: 'Oi. Desde quando? E ce fala assim 1 dia antes?',
    win: ['Me odeiam.', 'Falsos.', 'KAKAKAKAK', 'Sou muito convicta nas minhas ideologias.'],
    specials: {
      n: { name: 'SKZ Fancam', type: 'projectile', pose: 'throw', startup: 9, recovery: 18, dmg: 70, speed: 5.4, fx: 'lightstick', w: 12, h: 10 },
      fwd: { name: 'Desculpinha', type: 'teleport', pose: 'dodge', startup: 6, recovery: 16, text: 'DESCULPINHA' },
      down: { name: 'Monster Rush', type: 'buff', pose: 'eat', startup: 14, recovery: 20, dur: 360, speedMul: 1.35, dmgMul: 1.25, prop: 'monster', color: '#66ff33' },
      super: { name: 'Gatas Gemeas', type: 'summon', pose: 'summon', startup: 18, recovery: 28, dmg: 40, hits: 6, entity: 'cats', speed: 3.6, super: true }
    }
  },
  {
    id: 'alex', name: 'ALEX', title: 'Ministro da Economia', realName: 'Alek',
    desc: 'Tranquilo e meio enrolado. Corinthiano roxo e jogador de Project Zomboid.',
    look: { skin: '#d9a27a', hair: '#1d1512', hairStyle: 'short', cap: '#e6dccb', glasses: '#1e1e1e', shirt: '#4d5a36', pants: '#2a2a2a', shoes: '#3a3a3a', backpack: '#2f5fa8' },
    scale: 1.0, build: 1.05, idle: 'sway', victory: 'shout',
    stats: { speed: 0.98, jump: 1.0, power: 1.05, defense: 1.02 },
    intro: 'Haeee! Bom dia pra quem?',
    win: ['Oloko!', 'Corinthians e selecao!', 'Eu amo todos vcs.', 'Finalmente todo mundo do grupo.'],
    specials: {
      n: { name: 'Haeee!', type: 'projectile', pose: 'push', startup: 12, recovery: 20, dmg: 75, speed: 4.4, fx: 'wave', text: 'HAEEE', w: 18, h: 18 },
      fwd: { name: 'Ta-La-Ri-Ca', type: 'rush', pose: 'rush', startup: 6, dur: 32, recovery: 18, speed: 3.6, dmg: 28, hits: 4, letters: ['TA', 'LA', 'RI', 'CA'] },
      down: { name: 'Febre Zomboid', type: 'projectile', pose: 'throw', startup: 12, recovery: 20, dmg: 30, speed: 3, fx: 'zombie', poison: 120, w: 12, h: 12 },
      super: { name: 'Fiel Torcida', type: 'summon', pose: 'summon', startup: 20, recovery: 30, dmg: 38, hits: 8, entity: 'crowd', speed: 4, super: true, text: 'VAI CORINTHIANS!' }
    }
  },
  {
    id: 'valesca', name: 'VALESCA', title: 'Pra Vereadora', realName: 'Valesca',
    desc: 'A voz da razao. Faz cookies deliciosos e resolve qualquer treta do grupo.',
    look: { skin: '#f0c9a8', hair: '#a8683a', hairStyle: 'longCurly', female: true, lashes: true, blush: '#e8a0a0', shirt: '#f4f0e8', jacket: '#c0281c', sleeve: '#c0281c', longSleeve: true, pants: '#1a1a1a', shorts: true, shoes: '#1a1a1a' },
    scale: 0.98, build: 0.88, idle: 'calm', victory: 'cookie',
    stats: { speed: 1.0, jump: 1.02, power: 1.0, defense: 1.05 },
    intro: 'Bem, algo tem que ser feito.',
    win: ['Obrigada amigos, voces sao amigos.', 'Hihihi', 'Cookie tradicional: R$ 7,90.', 'Temos que nos desprender de querer brigar.'],
    specials: {
      n: { name: 'Cookie de Nutella', type: 'projectile', pose: 'throw', startup: 11, recovery: 20, dmg: 75, speed: 4.2, fx: 'cookie', w: 10, h: 10 },
      fwd: { name: 'Ai que Odio', type: 'rising', pose: 'rising', startup: 4, recovery: 22, dmg: 110, vy: -7.2, vx: 2, text: 'AI QUE ODIO' },
      down: { name: 'Vistoria do Andre', type: 'debuff', pose: 'push', startup: 12, recovery: 20, dur: 300, speed: 3, fx: 'clipboard', w: 12, h: 12, dmg: 20 },
      super: { name: '#ValescaPraVereadora', type: 'beam', pose: 'beam', startup: 22, dur: 50, recovery: 30, dmg: 28, hits: 10, fx: 'vote', color: '#ffd400', text: 'VOTE VALESCA!' }
    }
  }
];
