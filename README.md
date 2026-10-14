# FIFI FIGHTERS

Jogo de luta 1v1 em pixel art, no estilo dos Street Fighter antigos, estrelado pelos Fifis.
Roda direto no navegador, sem instalar nada: é só abrir o `index.html`.

## Como jogar

| Ação | Jogador 1 | Jogador 2 | Controle |
|---|---|---|---|
| Mover / pular / agachar | W A S D | setas | direcional ou analógico |
| Soco | V | 1 | A |
| Chute | B | 2 | B |
| Poder | N | 3 | X ou Y |
| Super (barra cheia) | V + N | 1 + 3 | RB |
| Pausa | ESC / ENTER | ESC / ENTER | START |

- **Poder** = especial 1 · **Frente + Poder** = especial 2 · **Baixo + Poder** = especial 3
- **Combo:** acertou soco ou chute? Aperte Poder logo em seguida.
- **Agarrão:** perto + Soco + Chute juntos (pode apertar um logo depois do outro). Para escapar, aperte os dois logo que for agarrado.
- **Dash:** frente frente (avança) ou trás trás (recua com invencibilidade rápida).
- **Defesa:** segure para trás. Agachado defende rasteira; em pé defende golpe aéreo.
- **Tonteira:** quem apanha muito seguido fica tonto. Aperte tudo para acordar mais rápido.
- **Contra-golpe:** acertar o oponente na preparação de um golpe dá 25% a mais de dano.
- `M` liga/desliga o som · `F` tela cheia · a luta pausa sozinha se você trocar de aba.

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
| **GUTI** (principal) | Pé de Pato da China · Kart 10:10 · Eu Nunca Estou Errado (contra-ataque) | Só o Guti Faz Pipoca |
| **MIN** | Dadinho de Tapioca · Amora, Pega! · Portaria Facial (armadilha) | Eu Te Protejo |
| **PV** | Enquete Suprema · Culpa do Paulo (devolve projéteis) · Costela de 12h (cura) | Enquete: Democracia |
| **ANA** | Passando pra Avisar · Lista do Rolê · Amo Vcs (cura) | ARMY Stream |
| **BELIPE** | Promete??? · Meia Maratona · Mensagem Apagada (desfaz o último golpe sofrido) | Abstinência de Fofoca |
| **PAM** | SKZ Fancam · Desculpinha (teleporte) · Monster Rush (buff) | Gatas Gêmeas |
| **ALEX** | Haeee! · Ta-La-Ri-Ca · Febre Zomboid (veneno) | Fiel Torcida |
| **VALESCA** | Cookie de Nutella · Ai que Ódio (voadora pra cima) · Vistoria do André (enfraquece) | #ValescaPraVereadora |

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
- `assets/sprites/`: quadros dos model sheets antigos, usados quando falta algum quadro
- `assets/fx/`: efeitos e ajudantes (`js/fxmeta.js`); `assets/stages/`: cenários; `assets/portraits/`: retratos
- `js/sheetsprites.js`: monta as animações a partir dos quadros e desenha os efeitos
- `js/characters.js`: golpes, falas e atributos de cada personagem
- `js/sprites.js` e `js/poses.js`: renderizador antigo por código, usado se alguma imagem não carregar
- `js/fighter.js`: lutadores e golpes; `js/ai.js`: CPU
- `js/stages.js`: cenários; `js/game.js`: telas e HUD; `js/audio.js`: sons e música chiptune (gerados por código)
