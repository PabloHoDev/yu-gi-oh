# Como evoluir o jogo

Receitas para as mudanças mais comuns. Em todas, o último passo é o mesmo:

```bash
npm run check
```

Ele roda lint, tipos, testes e build. Se passar, a mudança não quebrou nada do que já existe. O mesmo comando roda no GitHub a cada push (`.github/workflows/ci.yml`).

---

## Adicionar cartas ao banco

1. Edite [data/cards/selection.json](../data/cards/selection.json):
   - `sets`: nome de uma coleção inteira, exatamente como aparece no YGOPRODeck (ex.: `"Duelist Pack: Aster Phoenix"`).
   - `cards`: nomes avulsos em inglês (ex.: `"Dark Magician Girl"`).
2. Rode `npm run cards:import`. Ele baixa os dados, grava `data/cards/cards.json` e atualiza [CARTAS.md](CARTAS.md).
3. Se o importador avisar que alguma carta ficou **sem tradução**, escreva o nome e o texto em português em [data/cards/translations.pt.json](../data/cards/translations.pt.json) e rode de novo.

Não edite `cards.json` à mão: a próxima importação sobrescreve.

O `id` de cada carta é o nome em inglês em minúsculas com hifens (`elemental-hero-sparkman`). É ele que decks e saves usam; a lista completa está em [CARTAS.md](CARTAS.md).

## Tornar um tipo de carta jogável

Uma carta só pode entrar em deck se o motor souber jogá-la.

1. Implemente a regra em `src/duel/` com testes.
2. Amplie `isPlayable` em [src/duel/playable.ts](../src/duel/playable.ts).
3. Rode `npm run cards:report` para atualizar a contagem de cartas jogáveis.

## Criar ou alterar um deck

Edite [data/decks.json](../data/decks.json): `id da carta → número de cópias`.

Os testes garantem que todo deck tem de 40 a 60 cartas, no máximo 3 cópias de cada, e só cartas jogáveis. Para um NPC usar o deck, coloque a chave do deck no campo `duel.deck` dele.

## Adicionar um NPC ou uma placa

Edite a lista `npcs` ou `signs` do mapa (hoje [src/world/academyIsland.ts](../src/world/academyIsland.ts)).

- NPC sem duelo: `id`, posição, direção, `sprite` e `dialog`.
- NPC duelista: acrescente `duel` com nome curto, deck, LP iniciais e as falas de vitória e derrota.

Os testes acusam NPC em tile sólido, dois NPCs no mesmo lugar e deck inexistente.

## Adicionar um mapa

1. Crie um arquivo em `src/world/` exportando um `MapDef` (copie `academyIsland.ts` como modelo).
2. Inclua o mapa na lista `MAPS` de [src/world/maps.test.ts](../src/world/maps.test.ts) para ele ser validado.
3. Novos tipos de tile entram em [src/world/tiles.ts](../src/world/tiles.ts) (símbolo e se é sólido) e ganham desenho em [src/gfx/placeholders.ts](../src/gfx/placeholders.ts).

Quando os mapas migrarem para o Tiled (etapa 1), esta receita muda.

## Adicionar uma cena

1. Acrescente o nome em [src/scenes/keys.ts](../src/scenes/keys.ts).
2. Crie a classe em `src/scenes/` e registre-a na lista `scene` de [src/main.ts](../src/main.ts).
3. Troque de cena sempre com `SceneKey`, nunca com texto solto.

## Adicionar uma regra ao duelo

1. Escreva primeiro o teste em `src/duel/engine.test.ts` descrevendo a regra.
2. Implemente em [src/duel/engine.ts](../src/duel/engine.ts). Jogada ilegal lança `DuelError` com mensagem em português.
3. Se a regra produz algo que o jogador precisa ver, crie um evento novo em `DuelEvent` ([src/duel/types.ts](../src/duel/types.ts)) e a frase dele em [src/duel/describe.ts](../src/duel/describe.ts). O compilador aponta todo lugar que precisa tratar o evento novo.
4. Ensine a IA a usar a regra em [src/duel/ai.ts](../src/duel/ai.ts). O teste em que a IA joga duelos inteiros contra si mesma pega jogadas ilegais.
5. Só então ligue a regra à tela em `src/scenes/DuelScene.ts`.

`src/duel` e `src/world` não podem importar Phaser nem código de tela; há um teste que falha se isso acontecer.

## Fechar uma entrega

1. `npm run check` passando.
2. Item marcado no [ROADMAP](ROADMAP.md).
3. Linha nova no [CHANGELOG](../CHANGELOG.md) e, se for uma entrega relevante, versão nova em `package.json` (ela aparece na tela de título).
