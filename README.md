# FIFI FIGHTERS

Jogo de luta 1v1 em pixel art, no estilo dos Street Fighter antigos, estrelado pelos Fifis.
Roda direto no navegador, sem instalar nada: é só abrir o `index.html`.

## Como jogar

| Ação | Jogador 1 | Jogador 2 |
|---|---|---|
| Andar | A / D | ← / → |
| Pular | W | ↑ |
| Agachar | S | ↓ |
| Soco | V | 1 |
| Chute | B | 2 |
| Poder | N | 3 |
| Defender | segurar para trás | segurar para trás |

- **Poder** = especial 1 · **Frente + Poder** = especial 2 · **Baixo + Poder** = especial 3
- **Soco + Poder** com a barra SUPER cheia = **SUPER**
- Acertou soco/chute? Aperte Poder logo em seguida para fazer combo.
- `ESC` pausa · `M` liga/desliga o som · `F` tela cheia

Modos: 1 jogador (contra a CPU, em 3 dificuldades) e 2 jogadores no mesmo teclado. Melhor de 3 rounds.

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

Cada um tem a própria animação parada, de vitória e frases de entrada e de vitória.

## Cenários

Subway · Parque das Águas · Prefeitura de Sorocaba · Etec Armando Panunzio · Cinema ·
Copa na Casa da Min · Rolê Noturno · Aleatório.
Os Fifis que não estão lutando aparecem torcendo no fundo.

## Estrutura

Tudo é desenhado por código (sprites, cenários, fonte e música chiptune), então não há imagens nem áudio externos.

- `js/characters.js`: visual, golpes e falas de cada personagem (fácil de ajustar cores, cabelo, óculos etc.)
- `js/sprites.js`: renderizador de pixel art; `js/poses.js`: animações
- `js/fighter.js`: lutadores e golpes; `js/ai.js`: CPU
- `js/stages.js`: cenários; `js/game.js`: telas e HUD; `js/audio.js`: sons e música
