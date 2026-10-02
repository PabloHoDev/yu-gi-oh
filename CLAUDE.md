# Duel Academy

Fan game de Yu-Gi-Oh! GX no estilo dos RPGs de GBA. Phaser 4 + TypeScript 7 + Vite 8.

Idioma: respostas, documentação, comentários e textos do jogo em português do Brasil. Identificadores de código em inglês.

## Comandos

```bash
npm run dev           # jogo em http://localhost:5173
npm run check         # lint + tipos + testes + build. Rode antes de dar qualquer trabalho por concluído.
npm run format        # corrige formatação e lint automaticamente (Biome)
npm test              # só os testes
npm run cards:import  # baixa as cartas de data/cards/selection.json e regenera cards.json e docs/CARTAS.md
npm run cards:report  # só regenera docs/CARTAS.md
```

## Regras de arquitetura

- `src/duel` (regras) e `src/world` (mapas) são TypeScript puro: **não importam Phaser nem `scenes/`, `ui/`, `gfx/`, `input/`**. `src/architecture.test.ts` falha se isso for quebrado.
- O motor de duelo valida a jogada, muda o estado e devolve eventos (`DuelEvent`). As cenas só desenham o estado e narram eventos; nenhuma regra de jogo mora em cena.
- Jogada ilegal lança `DuelError` com mensagem em português, que a tela mostra ao jogador.
- Toda regra nova do motor entra com teste em `src/duel/*.test.ts`.
- Conteúdo é dado, não código: cartas em `data/cards/cards.json` (gerado), decks em `data/decks.json`, seleção de cartas em `data/cards/selection.json`.
- `data/cards/cards.json` e `docs/CARTAS.md` são gerados: não editar à mão.
- Uma carta só pode ir para um deck se `isPlayable` (`src/duel/playable.ts`) a aceitar. Ao implementar um tipo novo de carta no motor, amplie `isPlayable` e rode `npm run cards:report`.
- Nomes de cena vêm de `SceneKey` (`src/scenes/keys.ts`).
- O jogo importa de `cardSchema.ts` só tipos (`import type`), para o Zod não entrar no pacote.

## Onde está cada coisa

- `docs/TECNOLOGIAS.md`: stack, arquitetura e decisões.
- `docs/ROADMAP.md`: etapas e o que falta. Atualize ao concluir um item.
- `docs/COMO-EVOLUIR.md`: passo a passo para adicionar carta, deck, NPC, mapa, cena e regra.
- `CHANGELOG.md`: registre cada entrega.

## Limites

- Arte, música e ilustrações oficiais de Yu-Gi-Oh! não entram no repositório; a arte é própria (hoje provisória, gerada em `src/gfx/placeholders.ts`).
- Não fazer commit nem push sem o usuário pedir.
