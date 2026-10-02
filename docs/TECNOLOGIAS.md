# Duel Academy — Tecnologias do projeto

Fan game de **Yu-Gi-Oh! GX**: um RPG 2D de exploração em pixel art, no estilo de Pokémon FireRed/LeafGreen, em que o jogador é um calouro da Academia de Duelos. No lugar das batalhas de Pokémon, duelos de cartas.

A referência visual completa está em [pokemon_firered_leafgreen_estilo_completo.md](../pokemon_firered_leafgreen_estilo_completo.md). Este documento lista **tudo o que usamos e vamos usar para construir o jogo**, e por quê.

Legenda da coluna **Status**: ✅ já instalado e em uso no repositório · 🔜 planejado, ainda não instalado.

---

## 1. Resumo da stack

| Camada | Tecnologia | Status | Para quê |
|---|---|---|---|
| Linguagem | TypeScript 7 (modo `strict`) | ✅ | Todo o código do jogo |
| Engine | Phaser 4 | ✅ | Renderização 2D, cenas, tilemaps, sprites, câmera, input, áudio |
| Build e servidor de desenvolvimento | Vite 8 | ✅ | Recarregamento instantâneo e build de produção |
| Runtime de ferramentas | Node.js 24 + npm | ✅ | Rodar Vite, testes e scripts |
| Testes | Vitest 5 | ✅ | Testes do motor de duelo, dos mapas e dos textos |
| Fonte | Press Start 2P (via `@fontsource`) | ✅ | Tipografia pixelada, embutida no build |
| Conversão de imagens | sharp | ✅ | Transforma as ilustrações das cartas em sprites de 64 × 64 no estilo GBA |
| Controle de versão | Git + GitHub | ✅ | Histórico e colaboração |
| Mapas | Tiled | 🔜 | Editor de mapas em tiles; exporta JSON que o Phaser carrega |
| Pixel art | Aseprite (ou LibreSprite / Piskel, gratuitos) | 🔜 | Tilesets, sprites, animações, retratos, cartas |
| Música | Furnace ou BeepBox | 🔜 | Trilha em estilo chiptune/GBA |
| Efeitos sonoros | jsfxr + Audacity | 🔜 | Sons de menu, passos, ataques |
| Dados de cartas | JSON local, importado da API do YGOPRODeck | ✅ | Nomes, atributos, ATK/DEF e textos de 200 cartas em português |
| Validação de dados | Zod 4 | ✅ | Garante o formato do banco de cartas (e, depois, do save) |
| Save | `localStorage` com JSON versionado | 🔜 | Progresso, coleção e decks |
| Lint e formatação | Biome 2 | ✅ | Padrão de código e formatação automática |
| Integração contínua | GitHub Actions | ✅ | Rodar `npm run check` a cada push (passa a valer quando o repositório subir para o GitHub) |
| Publicação web | GitHub Pages ou itch.io | 🔜 | Jogar pelo navegador |
| Instalável / offline | PWA (`vite-plugin-pwa`) | 🔜 | Jogar offline, ícone na tela inicial |
| Desktop | Tauri | 🔜 | Executável para Windows, macOS e Linux |
| Celular | Capacitor + controles de toque | 🔜 | App Android/iOS |

---

## 2. Por que essa base

**Phaser + TypeScript + Vite** foi escolhido porque:

- O jogo é 2D, em tiles, com sprites e menus: exatamente o que o Phaser faz bem. Ele carrega mapas do Tiled nativamente e tem modo `pixelArt` para manter os pixels nítidos.
- Roda no navegador sem instalar nada. O mesmo build vira PWA, desktop (Tauri) e celular (Capacitor).
- TypeScript dá segurança num projeto que vai ter muitas regras: o compilador acusa quando uma carta, um evento ou um estado do duelo é usado errado.
- Um jogo de cartas é mais lógica do que gráfico. Em TypeScript as regras ficam em código puro, testável sem abrir o jogo.

Alternativas consideradas e descartadas:

| Alternativa | Por que não |
|---|---|
| Godot | Ótima engine, mas exige outra linguagem (GDScript) e o editor próprio; o ganho em relação ao Phaser é pequeno para um jogo 2D em tiles. |
| RPG Maker | Rápido para o mapa, mas inviável para um motor de duelo com efeitos de cartas. |
| ROM hack de GBA (decomp do FireRed) | Daria o visual exato, mas programar regras de Yu-Gi-Oh em C para GBA é muito mais difícil, e distribuir ROM modificada é juridicamente pior. |

---

## 3. Especificações técnicas do jogo

| Item | Valor | Motivo |
|---|---|---|
| Resolução interna | 240 × 160 px | A mesma do Game Boy Advance |
| Tile | 16 × 16 px | Tela de 15 × 10 tiles, como em FireRed/LeafGreen |
| Escala | Múltiplos inteiros (2×, 3×, 4×…) | Pixel nunca fica borrado |
| Movimento | Em grade, um tile por passo (180 ms) | Sensação de RPG portátil |
| Texto | Fonte de 8 px, 28 caracteres por linha, 3 linhas por caixa | Legível na resolução do GBA |
| Controles | Setas ou WASD; **Z**/Enter = confirmar; **X**/Esc = cancelar | Equivalentes ao direcional, A e B |
| Idioma | Português (Brasil) | Idioma do projeto; textos centralizados depois para permitir tradução |
| Regras do duelo | Era GX | Quem começa compra no 1º turno e não ataca nele; sem Synchro/Xyz/Pendulum/Link |

Controle (Gamepad API, que o Phaser já expõe) e toque na tela entram junto com a versão de celular.

---

## 4. Arquitetura

A regra mais importante do projeto: **o motor de duelo não conhece o Phaser**.

```text
┌────────────────────────────────────────────────────────────┐
│ Cenas (Phaser)                                             │
│   Boot → Title → Overworld ⇄ Duel                          │
│   desenham o estado e traduzem botões em jogadas           │
└───────────────┬────────────────────────────┬───────────────┘
                │ jogadas                    │ dados do mapa
                ▼                            ▼
┌───────────────────────────────┐  ┌─────────────────────────┐
│ src/duel — motor de regras    │  │ src/world — mapas, NPCs │
│ TypeScript puro, sem Phaser   │  │ colisão, placas         │
│ devolve eventos               │  │ TypeScript puro         │
└───────────────────────────────┘  └─────────────────────────┘
```

- A cena de duelo chama o motor (`normalSummon`, `attack`, `endTurn`…). O motor valida, muda o estado e devolve uma lista de **eventos** (`summon`, `attack`, `destroy`, `damage`, `win`…). A tela só narra e anima esses eventos.
- Como o motor é puro, ele é testado sozinho e a IA joga contra si mesma nos testes. O mesmo motor serve depois para replays e multiplayer online.
- O embaralhamento usa um gerador de números com semente, então qualquer duelo pode ser reproduzido exatamente.

### Estrutura de pastas

```text
docs/                 documentação do projeto
data/
  cards/              seleção, traduções e o banco de cartas gerado
  decks.json          decks (id da carta → cópias)
scripts/              importador de cartas e gerador de docs/CARTAS.md
.github/workflows/    integração contínua
src/
  main.ts             configuração do Phaser e escala inteira
  config.ts           resolução, tile, fonte, medidas da caixa de texto
  scenes/             BootScene, TitleScene, OverworldScene, DuelScene
  duel/               motor de regras, IA, banco de cartas, narração (sem Phaser)
  world/              definição de mapas, tiles, NPCs (sem Phaser)
  ui/                 caixa de diálogo, painéis, quebra de texto
  input/              mapeamento dos botões
  gfx/                arte provisória gerada por código
public/assets/        (futuro) tilesets, sprites, mapas, áudio
```

---

## 5. Motor de duelo

### O que já funciona

- Deck, mão, compra, embaralhamento com semente.
- Invocação-Normal e Baixar monstro; tributos (1 para nível 5–6, 2 para nível 7+).
- Mudança de posição e Invocação-Virar.
- Fases: Principal 1, Batalha, Principal 2.
- Batalha completa: ataque × ataque, ataque × defesa, carta baixada revelada, ataque direto.
- Vitória por LP zerado ou por falta de cartas no deck.
- IA simples que invoca, posiciona e ataca quando vale a pena.

### O que falta (em ordem)

1. Limite de 6 cartas na mão, cemitério visível, escolha manual dos tributos.
2. Zonas de Magia e Armadilha; baixar e ativar cartas.
3. **Sistema de efeitos** (corrente, gatilhos, custos, alvos).
4. Invocação-Fusão e Polimerização — o coração do deck de HERÓIs do GX.
5. Invocação-Especial, Invocação-Ritual, Campo.
6. IA por arquétipo, com níveis de dificuldade.

### O maior risco do projeto: os efeitos das cartas

A era GX tem milhares de cartas, e cada efeito é uma regra nova. A estratégia:

- **Efeitos como dados sempre que possível.** Efeitos comuns ("destrua 1 monstro", "compre 2 cartas", "+500 ATK") viram blocos reutilizáveis combinados no JSON da carta. Só os efeitos realmente únicos ganham código próprio.
- **Começar pequeno.** Primeiro o conjunto fechado de 200 cartas que já está no banco e cobre os decks dos personagens principais; depois expandir por arquétipo.
- **Uma carta só entra no jogo com teste automatizado do seu efeito.**

Alternativa a avaliar quando chegarmos lá: usar o **ocgcore**, o núcleo de regras do EDOPro/YGOPro (C++ com scripts Lua para cada carta), compilado para WebAssembly. Ele já traz praticamente todas as cartas prontas. O custo é integrar um núcleo grande em C++ e aceitar a licença dele (copyleft, da família AGPL), que obrigaria a abrir o código do nosso jogo — precisa ser conferida antes de decidir.

---

## 6. Dados de cartas

- **Fonte:** API pública do YGOPRODeck (`https://db.ygoprodeck.com/api/v7/cardinfo.php`), que tem nome, tipo, atributo, nível, ATK/DEF e texto, inclusive em português.
- **Seleção:** [data/cards/selection.json](../data/cards/selection.json) lista coleções inteiras e cartas avulsas. As 200 primeiras vêm de seis produtos da era GX (Starter Deck 2006, Starter Decks do Jaden e do Syrus, Duelist Packs do Jaden, do Chazz e do Zane), mais cartas avulsas dos decks de Crowler e Alexis e Monstros Normais clássicos.
- **Importação:** `npm run cards:import` baixa os dados e grava [data/cards/cards.json](../data/cards/cards.json). O jogo nunca consulta a API enquanto roda; ele lê só esse arquivo, que fica versionado.
- **Tradução:** nomes e textos oficiais em português vêm da API. Para as 16 cartas que ela não tem em português, a tradução é do projeto e fica em [data/cards/translations.pt.json](../data/cards/translations.pt.json).
- **Formato:** definido em [src/duel/cardSchema.ts](../src/duel/cardSchema.ts) e conferido pelos testes.
- **O que já é jogável:** [CARTAS.md](CARTAS.md) lista todas as cartas e marca as que o motor sabe jogar. Hoje são 43, os Monstros Normais. As outras 157 (efeito, fusão, magias e armadilhas) já estão no banco, esperando o sistema de efeitos.
- **Decks:** [data/decks.json](../data/decks.json), com 40 cartas cada.
- **Ilustrações das cartas:** `npm run art:import` baixa a ilustração oficial de cada carta (YGOPRODeck), converte para 64 × 64 px com paleta reduzida, no estilo dos sprites de GBA, e junta tudo em um atlas em `public/assets/generated/`. Essa pasta **não é versionada** (está no `.gitignore`): cada pessoa gera o atlas na própria máquina. Sem ele o jogo funciona com um emblema na cor do atributo. Ver a seção 14 antes de publicar o jogo com essas imagens.

---

## 7. Mapas

- **Tiled** para desenhar os mapas, com camadas separadas: chão, objetos, sobreposição (copas de árvore, telhados que cobrem o jogador), colisão e eventos (portas, NPCs, placas).
- Exportação em JSON (`.tmj`), carregado pelo Phaser.
- Hoje o mapa do pátio é um texto dentro do código ([src/world/academyIsland.ts](../src/world/academyIsland.ts)), o que basta para o protótipo. A migração para o Tiled é a primeira tarefa da etapa de mundo.

Locais previstos: pátio e píer, prédio principal (salas de aula, arena de duelo, loja de cartas, sala do chanceler), dormitórios Slifer Vermelho, Ra Amarelo e Obelisk Azul, floresta, farol, vulcão e o dormitório abandonado.

---

## 8. Arte

- **Aseprite** é o padrão para pixel art e animação e exporta spritesheets com JSON que o Phaser lê. É pago; **LibreSprite** e **Piskel** são alternativas gratuitas.
- Padrões: tiles de 16 × 16, personagens de 16 × 16 ou 16 × 24 no mapa, 4 direções, 3 a 4 frames de caminhada, paleta limitada e contornos escuros, como descrito no documento de estilo.
- No duelo: campo, cartas pequenas e retratos maiores dos duelistas e monstros.
- **A arte do mapa é pixel art própria desenhada por código** em [src/gfx/](../src/gfx/): tiles, personagens de 16 × 24 com os uniformes dos três dormitórios, o prédio da Academia com as três cúpulas e os dormitórios. Assim o jogo roda sem arquivos de imagem; quando houver arte feita no Aseprite, ela substitui esses módulos.
- **No duelo**, o palco ([src/ui/DuelStage.ts](../src/ui/DuelStage.ts)) mostra a ilustração grande do monstro quando ele é invocado e o confronto entre atacante e alvo na batalha, como os hologramas do anime.
- A fonte Press Start 2P é larga (8 px por letra). Mais adiante vale desenhar uma **fonte bitmap própria**, mais estreita, como as dos jogos de GBA.

---

## 9. Áudio

- Reprodução pelo sistema de som do Phaser (Web Audio).
- Formato **OGG**, com **M4A** como alternativa para o Safari.
- Música em tracker (**Furnace**) ou no **BeepBox**, buscando o timbre do GBA; efeitos com **jsfxr**; edição no **Audacity**.
- Uma música por ambiente (pátio, dormitório, aula, duelo comum, duelo de chefe), como em FireRed/LeafGreen.

---

## 10. Save

- Primeira versão: `localStorage`, um JSON com número de versão para permitir migrações.
- Conteúdo: posição no mapa, progresso da história, coleção de cartas, decks, dinheiro (DP), duelistas derrotados.
- Validação com **Zod** ao carregar (o mesmo usado no banco de cartas), para um save corrompido não quebrar o jogo.
- Exportar e importar o save como arquivo. Save na nuvem só se um dia houver contas de usuário.

---

## 11. Qualidade

- **TypeScript `strict`** com `noUncheckedIndexedAccess`: erros de índice e de tipo aparecem na compilação.
- **Vitest** para o motor de duelo (cada regra tem teste), os mapas (retangulares, NPCs em tiles livres), o banco de cartas (formato, ids únicos) e os decks (40 a 60 cartas, até 3 cópias, só cartas jogáveis).
- A IA joga 25 duelos completos contra si mesma nos testes, o que pega jogadas ilegais e travamentos.
- Um teste de arquitetura falha se `src/duel` ou `src/world` importarem Phaser ou código de tela.
- **Biome** faz lint e formatação. Foi escolhido no lugar de ESLint + Prettier porque o `typescript-eslint` ainda não suporta o TypeScript 7.
- **`npm run check`** roda tudo (lint, tipos, testes, build) e é o mesmo comando do **GitHub Actions**.
- 🔜 Testes de navegador com Playwright.

---

## 12. Comandos

```bash
npm install           # instala as dependências
npm run dev           # abre o jogo em http://localhost:5173 com recarregamento automático
npm run check         # lint + tipos + testes + build (rode antes de concluir qualquer mudança)
npm run format        # corrige formatação e lint automaticamente
npm test              # só os testes
npm run build         # gera a versão de produção em dist/
npm run preview       # serve a versão de produção localmente
npm run cards:import  # baixa as cartas da seleção e regenera o banco
npm run cards:report  # regenera docs/CARTAS.md
npm run art:import    # baixa as ilustrações das cartas e gera o atlas local (não versionado)
```

---

## 13. Etapas e guias

- [ROADMAP.md](ROADMAP.md): as etapas do projeto e o que falta em cada uma.
- [COMO-EVOLUIR.md](COMO-EVOLUIR.md): passo a passo para adicionar cartas, decks, NPCs, mapas, cenas e regras.
- [CARTAS.md](CARTAS.md): todas as cartas do banco e quais já são jogáveis.
- [CHANGELOG.md](../CHANGELOG.md): o que foi entregue em cada versão.

---

## 14. Propriedade intelectual

Yu-Gi-Oh! e Yu-Gi-Oh! GX pertencem a seus detentores (Konami, Shueisha e o espólio de Kazuki Takahashi). Este é um projeto de fã. Para reduzir o risco:

- **Sem fins comerciais**: nada de venda, anúncios ou doações atreladas ao jogo.
- **Arte do mapa, música e sons próprios.** Não copiar sprites nem trilhas dos jogos e do anime oficiais.
- **Ilustrações das cartas: são as oficiais**, convertidas para pixel art e mantidas só na máquina de quem roda o jogo, fora do repositório. É o ponto de maior exposição do projeto: publicar o jogo (site, itch.io, app) com essas imagens é distribuir arte protegida. Antes de publicar, a decisão é entre assumir esse risco ou trocar por ilustrações próprias — o jogo já funciona sem o atlas.
- Aviso claro, na tela de título e no repositório, de que não é um produto oficial.

Mesmo com esses cuidados, um projeto de fã pode receber pedido de remoção do detentor dos direitos. Se um dia a ideia for vender o jogo, o caminho é trocar nomes, cartas e personagens por um universo original e manter o motor.
