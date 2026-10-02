# Changelog

Registro das entregas do projeto, da mais recente para a mais antiga.

## 0.2.0 — 2026-10-02

### Cartas

- Banco com 200 cartas da era GX em português (`data/cards/cards.json`), importadas da API do YGOPRODeck: 114 monstros, 55 magias e 31 armadilhas. 43 já são jogáveis (Monstros Normais).
- Importador (`npm run cards:import`) com seleção por coleção ou por nome e traduções próprias para as 16 cartas que a API não tem em português.
- Lista de todas as cartas e do que já é jogável em `docs/CARTAS.md`, gerada automaticamente.
- Decks definidos em dados (`data/decks.json`), agora com 40 cartas; os nomes das cartas no duelo passam a ser os oficiais em português.

### Base para evolução

- Lint e formatação com Biome; `npm run check` roda lint, tipos, testes e build.
- CI no GitHub Actions.
- Testes novos: formato do banco de cartas, validade dos decks e separação entre regras e tela.
- Guias: `docs/ROADMAP.md`, `docs/COMO-EVOLUIR.md` e `CLAUDE.md`.
- Nomes de cena centralizados e versão do jogo exibida na tela de título.

## 0.1.0 — 2026-10-02

- Projeto criado: Phaser 4, TypeScript 7, Vite 8, Vitest 5.
- Tela de título, pátio da Academia com movimento em grade, NPCs, placas e diálogo.
- Motor de duelo com Monstros Normais, tributos, mudança de posição e batalha; IA simples.
- Documento de tecnologias.
