// Elenco do Fifi Fighters. Visual baseado nas fotos; golpes baseados no grupo "Fifis são padrinhas".
// Controles de golpes especiais:  PODER (N / 3)  |  frente + PODER  |  baixo + PODER  |  SUPER = SOCO + PODER (barra cheia)
window.CHARACTERS = [
  {
    id: 'guti', name: 'GUTI', title: 'O Benzinho do Grupo', realName: 'Fernando',
    desc: 'Engenheiro de humor seco. Voltou da China com comidas suspeitas. Nunca esta errado.',
    look: { skin: '#e2b48e', hair: '#221814', hairDark: true, hairStyle: 'short', gauge: true, smirk: true, shirt: '#1e1e26', shirtDark: true, print: 'tiny', pants: '#3a4a6a', shoes: '#202020', shoeSole: '#e8e8e8' },
    height: 1.75, scale: 1.468, build: 1.0, idle: 'cool', victory: 'flex',
    stats: { speed: 1.0, jump: 1.0, power: 1.0, defense: 1.0 },
    intro: 'Amanha venham de galocha e carro 4x4.',
    win: ['Eu nunca estou errado.', 'Nada ve.', 'Gente, vcs tao atrasando nosso almoco.', 'N me irrite.'],
    home: 'casa', ending: "Guti provou que nunca esta errado. Comemorou o titulo com uma corrida de kart as 10:10 e pipoca feita em casa, porque so ele faz pipoca nessa casa.",
    specials: {
      n: { desc: "Arremessa um pe de pato frito da China. Deixa o oponente atordoado.", name: 'Pe de Pato da China', type: 'projectile', pose: 'throw', startup: 12, recovery: 22, dmg: 80, speed: 4.2, fx: 'duckfoot', stun: 22, w: 14, h: 10 },
      fwd: { desc: "Avanca de kart acertando 3 vezes. Atravessa a tela rapido.", name: 'Kart 10:10', type: 'rush', pose: 'rush', startup: 8, dur: 30, recovery: 18, speed: 5.4, dmg: 32, hits: 3, fx: 'kart' },
      down: { desc: "Postura de contra-ataque. Se for atacado, revida na hora.", name: 'Eu Nunca Estou Errado', type: 'counter', pose: 'counter', startup: 4, window: 34, recovery: 20, dmg: 130, text: 'EU NUNCA ESTOU ERRADO' },
      super: { desc: "Chuva de pipoca cai em cima do oponente.", name: 'So o Guti Faz Pipoca', type: 'rain', pose: 'summon', startup: 20, recovery: 30, dmg: 45, count: 9, fx: 'popcorn' }
    }
  },
  {
    id: 'min', name: 'MIN', title: 'Diva Babilonica', realName: 'Yasmin',
    desc: 'Anfitria e cozinheira oficial. Protege o Guti de tudo. Ri em "kjjjkjjkk".',
    look: { skin: '#f0c6a8', hair: '#2a2838', dye: '#3a6ad8', dyeFrom: 6, hairStyle: 'long', female: true, lashes: true, blush: '#e89090', lips: '#d07a80', choker: true, shirt: '#f2f0ec', sleeve: '#9aaed0', raglan: true, print: 'emblem', pants: '#1c1c22', pantsDark: true, shorts: true, shoes: '#1a1a1a', tattoo: '#2a3a4a' },
    height: 1.60, scale: 1.342, build: 0.95, idle: 'bounce', victory: 'jumpjoy',
    stats: { speed: 1.08, jump: 1.05, power: 0.95, defense: 0.95 },
    intro: 'Quem nao tiver com roupinha do Brasil nn passa da minha porta!',
    win: ['Kjjjkjjkk', 'Arrasouu!', 'Nao fala assim do meu homem!', 'Ficou maravilhoso, 0 defeitos.'],
    home: 'casa', ending: "Min venceu todos e liberou a entrada da sua casa so para quem estava de roupinha do Brasil. A Amora ganhou um petisco e o Guti ganhou paz.",
    specials: {
      n: { desc: "Joga tres dadinhos de tapioca em leque.", name: 'Dadinho de Tapioca', type: 'projectile', pose: 'throw', startup: 10, recovery: 20, dmg: 30, speed: 4.6, fx: 'dadinho', count: 3, spread: 8, w: 7, h: 7 },
      fwd: { desc: "Chama a Amora, que corre e morde duas vezes.", name: 'Amora, Pega!', type: 'summon', pose: 'summon', startup: 14, recovery: 24, dmg: 45, hits: 2, entity: 'dog', speed: 4.4 },
      down: { desc: "Instala o portao com reconhecimento facial. Quem passar leva choque.", name: 'Portaria Facial', type: 'trap', pose: 'push', startup: 12, recovery: 18, dmg: 90, dist: 70, life: 240, stun: 30 },
      super: { desc: "Raio de arroz saido da panela. Acerta 10 vezes.", name: 'Eu Te Protejo', type: 'beam', pose: 'beam', startup: 22, dur: 50, recovery: 30, dmg: 28, hits: 10, fx: 'rice', color: '#ffffff', text: 'EU TE PROTEJO!' }
    }
  },
  {
    id: 'pv', name: 'PV', title: 'Senhor das Enquetes', realName: 'Paulo Vitor',
    desc: 'Organiza os roles, os churrascos e as enquetes. A culpa e sempre dele.',
    look: { skin: '#c8906a', hair: '#1a1210', hairDark: true, hairStyle: 'curly', glasses: '#161616', beard: '#1a1210', beardType: 'goatee', brow: 2, shirt: '#5e3f30', pants: '#2b2f38', pantsDark: true, shoes: '#2a2a2a', belly: 1.6 },
    height: 1.90, scale: 1.594, build: 1.12, idle: 'selfie', victory: 'phone',
    stats: { speed: 0.9, jump: 0.92, power: 1.12, defense: 1.12 },
    intro: 'Teremos que recorrer a democracia.',
    win: ['A verdade e relativa.', 'Oloco, bora!', 'Amo voces acima de qualquer coisa.', 'Enquete encerrada. Eu venci.'],
    home: 'cozinha', ending: "PV venceu e marcou o proximo role com uma enquete unanime. Pela primeira vez, a culpa nao foi dele.",
    specials: {
      n: { desc: "Lanca uma enquete que atordoa por bastante tempo.", name: 'Enquete Suprema', type: 'projectile', pose: 'push', startup: 14, recovery: 22, dmg: 70, speed: 3.2, fx: 'poll', stun: 28, w: 16, h: 14 },
      fwd: { desc: "Contra-ataque que devolve projeteis. A culpa volta para quem jogou.", name: 'Culpa do Paulo', type: 'counter', pose: 'counter', startup: 4, window: 36, recovery: 20, dmg: 120, reflect: true, text: 'A CULPA E DE QUEM?' },
      down: { desc: "Come uma costela de 12h e recupera vida. Tem recarga.", name: 'Costela de 12h', type: 'heal', pose: 'eat', startup: 18, recovery: 30, amount: 90, prop: 'costela' },
      super: { desc: "Rajada de 7 enquetes. Democracia em estado puro.", name: 'Enquete: Democracia', type: 'volley', pose: 'beam', startup: 22, recovery: 34, dmg: 40, count: 7, fx: 'poll', speed: 5, text: 'DEMOCRACIA!' }
    }
  },
  {
    id: 'ana', name: 'ANA', title: 'Fluttershy', realName: 'Ana Beatriz',
    desc: 'Organiza a lista do role e os convites. Doce, ARMY e azarada com o clima.',
    look: { skin: '#c48e66', hair: '#1e140f', hairDark: true, hairStyle: 'longCurly', female: true, lashes: true, lips: '#a0505a', shirt: '#17171c', shirtDark: true, sleeveless: true, neckline: true, pants: '#4a6fa8', ripped: true, shoes: '#1a1a1a', boots: true },
    height: 1.80, scale: 1.51, build: 0.92, idle: 'wave', victory: 'heart',
    stats: { speed: 1.05, jump: 1.05, power: 0.95, defense: 0.98 },
    intro: 'Oiiie gente, td bem com vcs??',
    win: ['Amo vcs! ...mas e obrigatorio.', 'Passando pra avisar que eu ganhei.', 'kkskks', 'Ja anotei na lista!'],
    home: 'parque', ending: "Ana venceu, organizou a lista de quem leva o que e finalmente conseguiu ingresso para o show do BTS. Amo vcs, mas e obrigatorio.",
    specials: {
      n: { desc: "Balao de aviso que atordoa e cancela o ataque do oponente.", name: 'Passando pra Avisar', type: 'projectile', pose: 'push', startup: 12, recovery: 20, dmg: 60, speed: 3.6, fx: 'bubble', text: 'AVISO!', stun: 30, w: 20, h: 12 },
      fwd: { desc: "Joga tres itens da lista do role em arco.", name: 'Lista do Role', type: 'projectile', pose: 'throw', startup: 12, recovery: 22, dmg: 35, speed: 3.4, fx: 'items', count: 3, arc: true, w: 8, h: 8 },
      down: { desc: "Recupera vida mandando amor para todos. Tem recarga.", name: 'Amo Vcs', type: 'heal', pose: 'taunt', startup: 16, recovery: 26, amount: 80, hearts: true },
      super: { desc: "Feixe roxo de ARMY. Acerta 10 vezes.", name: 'ARMY Stream', type: 'beam', pose: 'beam', startup: 22, dur: 50, recovery: 30, dmg: 28, hits: 10, fx: 'army', color: '#b06cff', text: 'BORAHAE!' }
    }
  },
  {
    id: 'belipe', name: 'BELIPE', title: 'Dono do Grupo', realName: 'Felipe',
    desc: 'Admin, corredor e viciado em fofoca. Tem razao sempre. Solteiro convicto.',
    look: { skin: '#ecc2a0', hair: '#8a4e2a', hairStyle: 'quiff', beard: '#8a4a26', beardType: 'full', shirt: '#f6d21a', print: 'brasil', sleeve: '#f6d21a', pants: '#1e2a4a', shoes: '#f2f2f2', shoeSole: '#c0281c', socks: '#ffffff' },
    height: 1.60, scale: 1.342, build: 1.0, idle: 'jog', victory: 'run',
    stats: { speed: 1.18, jump: 1.08, power: 0.92, defense: 0.92 },
    intro: 'Pessoal... Quais os seus planos para hj???',
    win: ['Eu tenho razao smp.', 'KKKKKKKKK', 'Promete???', 'Estou com abstinencia de fofoca.'],
    home: 'subway', ending: "Belipe venceu e, como sempre, teve razao. Saiu correndo para mais uma meia maratona e ainda trouxe fofoca fresca para o grupo.",
    specials: {
      n: { desc: "Lanca um \"???\" que atordoa por um bom tempo.", name: 'Promete???', type: 'projectile', pose: 'taunt', startup: 10, recovery: 20, dmg: 50, speed: 3.8, fx: 'text', text: '???', stun: 34, w: 18, h: 10 },
      fwd: { desc: "Corrida de meia maratona acertando 3 vezes.", name: 'Meia Maratona', type: 'rush', pose: 'rush', startup: 6, dur: 34, recovery: 16, speed: 6.4, dmg: 30, hits: 3, fx: 'dust' },
      down: { desc: "Apaga a mensagem e recupera o ultimo dano recebido.", name: 'Mensagem Apagada', type: 'undo', pose: 'taunt', startup: 10, recovery: 22, text: 'MENSAGEM APAGADA' },
      super: { desc: "Investida de fofoca com 9 golpes de KKKKKKK.", name: 'Abstinencia de Fofoca', type: 'rush', pose: 'rush', startup: 18, dur: 46, recovery: 26, speed: 6, dmg: 34, hits: 9, fx: 'kkk', text: 'KKKKKKKKK', super: true }
    }
  },
  {
    id: 'pam', name: 'PAM', title: 'PCC', realName: 'Pamela',
    desc: 'Caotica, sarcastica, fa de Stray Kids, vive de Monster. "Me odeiam."',
    look: { skin: '#e8b898', hair: '#1a1212', hairDark: true, hairStyle: 'curlyMid', female: true, lashes: true, lips: '#c01830', shirt: '#141418', shirtDark: true, sleeveless: true, print: null, pants: '#e87fa8', shorts: true, shortsLen: 0.45, skirt: '#e87fa8', shoes: '#1a1a1a' },
    height: 1.60, scale: 1.342, build: 0.92, idle: 'sip', victory: 'drink',
    stats: { speed: 1.12, jump: 1.0, power: 0.98, defense: 0.9 },
    intro: 'Oi. Desde quando? E ce fala assim 1 dia antes?',
    win: ['Me odeiam.', 'Falsos.', 'KAKAKAKAK', 'Sou muito convicta nas minhas ideologias.'],
    home: 'cinema', ending: "Pam venceu todos e mesmo assim disse que todo mundo odeia ela. Comemorou com um Monster e uma fancam do Stray Kids.",
    specials: {
      n: { desc: "Arremessa um lightstick K-pop muito rapido.", name: 'SKZ Fancam', type: 'projectile', pose: 'throw', startup: 9, recovery: 18, dmg: 70, speed: 5.4, fx: 'lightstick', w: 12, h: 10 },
      fwd: { desc: "Teleporta para as costas do oponente. Desculpinha.", name: 'Desculpinha', type: 'teleport', pose: 'dodge', startup: 6, recovery: 16, text: 'DESCULPINHA' },
      down: { desc: "Toma um Monster: mais velocidade e dano por um tempo.", name: 'Monster Rush', type: 'buff', pose: 'eat', startup: 14, recovery: 20, dur: 360, speedMul: 1.35, dmgMul: 1.25, prop: 'monster', color: '#66ff33' },
      super: { desc: "Invoca as duas gatas identicas, 6 golpes ao todo.", name: 'Gatas Gemeas', type: 'summon', pose: 'summon', startup: 18, recovery: 28, dmg: 40, hits: 6, entity: 'cats', speed: 3.6, super: true }
    }
  },
  {
    id: 'alex', name: 'ALEX', title: 'Ministro da Economia', realName: 'Alek',
    desc: 'Tranquilo e meio enrolado. Corinthiano roxo e jogador de Project Zomboid.',
    look: { skin: '#d4a07a', hair: '#1d1512', hairDark: true, hairStyle: 'curlyBig', glasses: '#a8b0b8', beard: '#2a1a12', beardType: 'mustache', shirt: '#3a3a42', shirtDark: true, print: 'chain', pants: '#2a2a2e', pantsDark: true, shoes: '#3a3a3a', belly: 0.8 },
    height: 1.70, scale: 1.426, build: 1.1, idle: 'sway', victory: 'shout',
    stats: { speed: 0.98, jump: 1.0, power: 1.05, defense: 1.02 },
    intro: 'Haeee! Bom dia pra quem?',
    win: ['Oloko!', 'Corinthians e selecao!', 'Eu amo todos vcs.', 'Finalmente todo mundo do grupo.'],
    home: 'etec', ending: "Alex venceu e virou oficialmente o ministro da economia dos Fifis. Comemorou com uma partida de Project Zomboid sem morrer de febre.",
    specials: {
      n: { desc: "Grito \"HAEEE\" que vira onda de choque.", name: 'Haeee!', type: 'projectile', pose: 'push', startup: 12, recovery: 20, dmg: 75, speed: 4.4, fx: 'wave', text: 'HAEEE', w: 18, h: 18 },
      fwd: { desc: "Combo de 4 golpes: TA, LA, RI, CA.", name: 'Ta-La-Ri-Ca', type: 'rush', pose: 'rush', startup: 6, dur: 32, recovery: 18, speed: 3.6, dmg: 28, hits: 4, letters: ['TA', 'LA', 'RI', 'CA'] },
      down: { desc: "Germe zumbi que envenena e tira vida aos poucos.", name: 'Febre Zomboid', type: 'projectile', pose: 'throw', startup: 12, recovery: 20, dmg: 30, speed: 3, fx: 'zombie', poison: 120, w: 12, h: 12 },
      super: { desc: "A Fiel Torcida invade a tela, 8 golpes.", name: 'Fiel Torcida', type: 'summon', pose: 'summon', startup: 20, recovery: 30, dmg: 38, hits: 8, entity: 'crowd', speed: 4, super: true, text: 'VAI CORINTHIANS!' }
    }
  },
  {
    id: 'valesca', name: 'VALESCA', title: 'Pra Vereadora', realName: 'Valesca',
    desc: 'A voz da razao. Faz cookies deliciosos e resolve qualquer treta do grupo.',
    look: { skin: '#f0cbb0', hair: '#9a6a40', hairStyle: 'wavy', hairTips: '#c8945a', female: true, lashes: true, blush: '#e8a0a0', lips: '#c07070', shirt: '#f2eee6', jacket: '#c0281c', sleeve: '#c0281c', longSleeve: true, pattern: 'plaid', pants: '#1c1c22', pantsDark: true, shorts: true, shoes: '#1a1a1a' },
    height: 1.70, scale: 1.426, build: 0.9, idle: 'calm', victory: 'cookie',
    stats: { speed: 1.0, jump: 1.02, power: 1.0, defense: 1.05 },
    intro: 'Bem, algo tem que ser feito.',
    win: ['Obrigada amigos, voces sao amigos.', 'Hihihi', 'Cookie tradicional: R$ 7,90.', 'Temos que nos desprender de querer brigar.'],
    home: 'prefeitura', ending: "Valesca venceu, resolveu todas as tretas do grupo e foi eleita vereadora com 100% dos votos dos Fifis. Cookies para todos.",
    specials: {
      n: { desc: "Cookie de Nutella arremessado como frisbee.", name: 'Cookie de Nutella', type: 'projectile', pose: 'throw', startup: 11, recovery: 20, dmg: 75, speed: 4.2, fx: 'cookie', w: 10, h: 10 },
      fwd: { desc: "Voadora para cima: AI QUE ODIO. Otima contra pulos.", name: 'Ai que Odio', type: 'rising', pose: 'rising', startup: 4, recovery: 22, dmg: 110, vy: -7.2, vx: 2, text: 'AI QUE ODIO' },
      down: { desc: "Vistoria do Andre: o oponente atingido recebe mais dano por um tempo.", name: 'Vistoria do Andre', type: 'debuff', pose: 'push', startup: 12, recovery: 20, dur: 300, speed: 3, fx: 'clipboard', w: 12, h: 12, dmg: 20 },
      super: { desc: "Campanha #ValescaPraVereadora, feixe dourado com 10 golpes.", name: '#ValescaPraVereadora', type: 'beam', pose: 'beam', startup: 22, dur: 50, recovery: 30, dmg: 28, hits: 10, fx: 'vote', color: '#ffd400', text: 'VOTE VALESCA!' }
    }
  }
];
