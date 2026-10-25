# FIFI FIGHTERS

Jogo de luta 1v1 em pixel art, no estilo dos Street Fighter antigos, estrelado pelos Fifis.
Roda direto no navegador, sem instalar nada: é só abrir o `index.html`.

## Como jogar

| Ação | Jogador 1 | Jogador 2 | Controle |
|---|---|---|---|
| Mover / pular / agachar | W A S D | setas | direcional ou analógico |
| Soco | V | 1 | A |
| Chute | B | 2 | B |
| Poder | N | 3 | X ou LB |
| Super (barra cheia) | V + N | 1 + 3 | Y ou RB |
| Pausa | ESC / ENTER | ESC / ENTER | START |

- **Poder** = especial 1 · **Frente + Poder** = especial 2 · **Baixo + Poder** = especial 3
- **Combo:** acertou soco ou chute? Aperte Poder logo em seguida.
- **Agarrão:** perto + Soco + Chute juntos (pode apertar um logo depois do outro). Para escapar, aperte os dois logo que for agarrado.
- **Dash:** frente frente (avança) ou trás trás (recua com invencibilidade rápida).
- **Defesa:** segure para trás. Agachado defende rasteira; em pé defende golpe aéreo.
- **Tonteira:** quem apanha muito seguido fica tonto. Aperte tudo para acordar mais rápido.
- **Contra-golpe:** acertar o oponente na preparação de um golpe dá 25% a mais de dano.
- `M` liga/desliga o som · `F` tela cheia · a luta pausa sozinha se você trocar de aba.

## Trilha sonora

O jogo toca músicas de AC/DC, CPM 22 e Charlie Brown Jr., sempre sorteadas (a banda e depois a música, sem repetir até tocar todas) de acordo com o momento:

| Momento | Bandas |
|---|---|
| Menus | Charlie Brown Jr. e CPM 22 |
| Escolha de lutador e escada do Arcade | AC/DC |
| Lutas (cada luta sorteia outra música) | AC/DC e CPM 22 |
| Créditos e final | Charlie Brown Jr. |
| Modo História | AC/DC na estrada e na maratona, CPM 22 no parque e no Subway, Charlie Brown Jr. no pôr do sol da Prefeitura, Charlie Brown Jr. e CPM 22 na festa |

A casa vazia, a derrota e a vitória continuam com o chiptune. Em **Opções → Trilha** dá para trocar para **8 bits** (só o chiptune). As músicas são MP3, que todo navegador toca; se algum arquivo faltar, o jogo usa o chiptune naquele momento.
As músicas ficam em `assets/music/` e a lista em `js/musicmeta.js`, gerados por `python3 tools/importar_musicas.py <pasta com os originais>` (o script separa as coletâneas em músicas e iguala o volume).

## Modo História — "O Sumiço da Min"

O Guti volta da China, ouve um grito da Min no celular e sai procurando por ela por Sorocaba, enfrentando os amigos pelo caminho: Pam, Belipe (bravo), Alex, Valeska, PV, Ana e, no fim, a Min numa luta amistosa de aniversário.

- O **P1 é sempre o Guti**. O **P2** joga com quem aparece na história (ou deixe com a CPU no menu do modo).
- Nas cenas: **soco/Enter/clique** avança o texto, **START/ESC** abre o menu (pular cena ou sair).
- Algumas lutas só seguem se o Guti ganhar; se perder, dá para tentar de novo. O progresso fica salvo por capítulo.
- Cada capítulo abre com um cartão ilustrado. A cena depois da luta com a Min muda conforme quem venceu.
- As ilustrações ficam em `assets/story/` e a lista em `js/storymeta.js`. Para adicionar ou trocar imagens: `python3 tools/importar_historia.py <pasta>`.

## Controle Bluetooth (ou USB)

Controles de Xbox, PlayStation, Switch Pro, 8BitDo e outros funcionam direto no navegador (Chrome ou Edge recomendados):

1. Pareie o controle com o notebook nas configurações de Bluetooth do sistema (Xbox: segure o botão de parear · PS4/PS5: segure Share/Create + PS · Switch Pro: segure o botão Sync).
2. Com o jogo aberto, aperte qualquer botão do controle. O primeiro controle vira o **P1** e o segundo vira o **P2**.
3. Em **Controle Bluetooth**, no menu principal, dá para testar os botões e trocar P1 e P2 (Poder + Super juntos, ou `T`).

Botões: **A** soco, **B** chute, **X/LB/LT** poder, **Y/RB/RT** super, **START** pausa e **SELECT** volta nos menus. O controle vibra quando o seu personagem apanha (se o controle e o navegador tiverem suporte). Teclado, controle e celular funcionam juntos.

## Celular como controle

Dá para jogar com o celular no lugar do teclado (o teclado e o controle continuam funcionando juntos):

1. Abra o jogo no notebook pelo site (na Vercel, não pelo arquivo).
2. Na tela inicial aparece um **QR code** no canto, com o código da sala. Ele também fica em **Controle no Celular**, no menu principal.
3. Cada pessoa aponta a câmera do celular para o QR code. O primeiro celular vira o **P1** e o segundo vira o **P2**.
   Quem abrir o site direto no celular cai na tela do controle e pode digitar o código da sala.

O controle é inspirado no do Super Nintendo: direcional, **Y** soco, **B** chute, **A** poder, **X** super, **L** poder, **R** super, **START** pausa e **SELECT** volta nos menus.
Ele vibra quando o seu personagem apanha (no Android) e mostra quem você escolheu.

- Funciona melhor com todo mundo na mesma Wi-Fi. A conexão vai direto do celular para o notebook (WebRTC); o servidor público do PeerJS só apresenta um aparelho ao outro.
- Se a página do notebook recarregar, os celulares reconectam sozinhos no mesmo lugar (P1/P2).
- Se um celular cair no meio da luta, o jogo pausa.
- Para jogar no próprio celular, use `index.html?jogo=1`.

## Modos

- **Arcade:** enfrente os outros 7 Fifis em sequência, com o chefe no final. Tem pontuação, recorde, tela de continuar e um final para cada personagem.
- **Versus CPU** e **Versus 2 jogadores** no mesmo teclado ou com controles.
- **Treino:** vida que regenera, barra de super infinita, histórico de comandos na tela, contador de dano e combo, hitboxes e boneco configurável (parado, agachado, pulando, defendendo, escapando de agarrão ou CPU). `R` reseta a posição.
- **Lista de Golpes:** golpes e atributos de cada personagem. Também aparece na pausa.
- **Opções:** volume da música e dos efeitos, rounds para vencer, tempo do round, dificuldade da CPU, tremor de tela e hitboxes. Ficam salvas no navegador, junto com as vitórias de cada personagem e o recorde do arcade.

No fim de cada luta aparecem as estatísticas (golpes, dano, maior combo, especiais, supers, agarrões e defesas). Se os dois escolherem o mesmo personagem, o segundo usa uma cor alternativa.

## Lutadores

| Lutador | Especiais | Super |
|---|---|---|
| **GUTI** (principal) | Pé de Pato da China · Ataque Drift · Eu Nunca Estou Errado (contra-ataque) | Chuva de Pipoca |
| **MIN** | Dadinho de Tapioca · Amora, Pega! · Catraca de Academia (armadilha) | Raio da Culinária |
| **PV** | Democracia · Culpa do Paulo (devolve projéteis) · Costela de 12h (cura) | Enquete: Democracia |
| **ANA** | Ataque BTS · Checklist · Coração Kpop (cura) | ARMY Stream |
| **BELIPE** | Eu Tô Certo · Meia Maratona · Apagar Mensagem (desfaz o último golpe sofrido) | Abstinência de Fofoca |
| **PAM** | SKZ Fancam · Desculpinha (teleporte) · Monster Rush (buff) | Gatas Gêmeas |
| **ALEX** | Haeee! · Ta-La-Ri-Ca · Febre Zomboid (veneno) | Fiel Torcida |
| **VALESCA** | Cookie de Nutella · Ai que Ódio (voadora pra cima) · Ideia de Rolê (enfraquece) | #ValescaPraVereadora |

Cada um tem as próprias animações, tiradas das folhas de sprites: parado, andando, pulo, guarda, chute, rasteira, voadora, gancho, dano, queda, levantando, um quadro para cada especial, vitória e entrada.
Os projéteis, ajudantes (Amora, as gatas, a Fiel Torcida, a catraca da portaria), feixes, faíscas e o KO também são sprites.

As falas de entrada, vitória e derrota são bordões reais do grupo ("Eu nunca estou errado", "Promete???", "Me odeiam", "Teremos que recorrer a democracia", "Ai que ódio"...). Alguns confrontos têm falas próprias, como Belipe x PV ("A culpa é do pv então?"), Pam x Belipe ("Mentiroso do diabooo!") e Alex x Valesca.

Os tamanhos seguem a altura real de cada um: PV 1,90 · Ana 1,80 · Guti 1,75 · Alex e Valesca 1,70 · Pam, Min e Belipe 1,60.
Na seleção de personagens, os retratos grandes são pixel art feita a partir das fotos.

## Cenários

Subway · Parque das Águas · Prefeitura de Sorocaba (Palácio dos Tropeiros) · Etec Armando Panunzio · Cinema ·
Copa na Casa da Min · Noite do Hambúrguer · Rolê Noturno · Aleatório.
Os Fifis que não estão lutando aparecem torcendo no fundo.

## Estrutura

- `assets/sprites2/`: quadros de animação de cada personagem (`js/sheetmeta2.js` guarda tamanho e âncora de cada um)
- `assets/sprites/`: quadros dos model sheets antigos, usados só por personagens sem os quadros novos
- `assets/fx/atlas.png`: efeitos e ajudantes numa folha só (`js/fxmeta.js`, gerados de `tools/fx_src/` por `python3 tools/empacotar_fx.py`); `assets/stages/`: cenários; `assets/portraits/`: retratos
- `js/sheetsprites.js`: monta as animações a partir dos quadros e desenha os efeitos
- `js/characters.js`: golpes, falas e atributos de cada personagem
- `js/sprites.js` e `js/poses.js`: renderizador antigo por código, usado se alguma imagem não carregar
- `js/fighter.js`: lutadores e golpes; `js/ai.js`: CPU
- `controle.html`, `js/controller.js` e `css/controller.css`: o controle no celular; `js/remote.js`: o lado do notebook (sala, QR code, P1/P2)
- `js/vendor/`: PeerJS e gerador de QR code (licença MIT)
- `js/story.js`: roteiro e cenas do Modo História; `tools/importar_historia.py`: importa as ilustrações
- `js/stages.js`: cenários; `js/game.js`: telas e HUD; `js/audio.js`: sons e chiptune (gerados por código) e a trilha com as bandas (`assets/music/`)
