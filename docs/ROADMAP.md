# Roadmap

Etapas do projeto, em ordem. Marque o item ao concluir e registre a entrega no [CHANGELOG](../CHANGELOG.md).

## Etapa 0 — Fundação ✅

- [x] Projeto configurado (Phaser, TypeScript, Vite, testes)
- [x] Mapa andável com colisão, NPCs, placas e caixa de diálogo
- [x] Duelo básico contra IA (Monstros Normais, tributos, batalha)
- [x] Banco com 200 cartas da era GX em português
- [x] Decks de 40 cartas definidos em dados
- [x] Lint, formatação, checagem única (`npm run check`) e CI
- [x] Teste que protege a separação entre regras e tela
- [x] Arte do mapa no clima do anime: Academia com as três cúpulas, dormitórios, uniformes
- [x] Ilustração do monstro em destaque na invocação e cena de batalha entre os monstros

## Etapa 1 — Mundo

- [ ] Mapas feitos no Tiled (camadas de chão, objetos, sobreposição, colisão, eventos)
- [ ] Interiores e portas (troca de mapa)
- [ ] NPCs que andam e olham para o jogador
- [ ] Menu de pausa (deck, cartas, salvar)
- [ ] Save em `localStorage` com versão e validação
- [ ] Biblioteca de cartas: tela para ver as 200 cartas e seus textos

## Etapa 2 — Duelo completo sem efeitos

- [ ] Mão visível no campo e tela de detalhes da carta
- [ ] Escolha manual dos tributos
- [ ] Cemitério visível; limite de 6 cartas na mão
- [ ] Zonas de Magia e Armadilha (baixar cartas)
- [x] Animações de invocação, ataque e dano
- [ ] Retratos dos duelistas na tela de duelo

## Etapa 3 — Efeitos

- [ ] Sistema de efeitos: corrente, gatilhos, custos, alvos
- [ ] Magias (normal, equipamento, campo, contínua, rápida)
- [ ] Armadilhas (normal, contínua, resposta)
- [ ] Monstros de Efeito, Flip e Union
- [ ] Invocação-Fusão, Deck Adicional e Polimerização
- [ ] IA que usa magias e armadilhas

Cada grupo concluído amplia `isPlayable` e aumenta o número de cartas jogáveis em [CARTAS.md](CARTAS.md).

## Etapa 4 — Coleção

- [ ] Boosters e loja de cartas
- [ ] Editor de deck
- [ ] DP (dinheiro) ganho em duelos
- [ ] Mais cartas: ampliar `data/cards/selection.json` por arquétipo

## Etapa 5 — Academia

- [ ] História e calendário escolar
- [ ] Aulas e provas (teórica e prática)
- [ ] Promoção de dormitório: Slifer → Ra → Obelisk
- [ ] Rivais com decks temáticos e torneios

## Etapa 6 — Arte e áudio finais

- [ ] Tilesets e sprites em pixel art própria
- [ ] Decidir as ilustrações das cartas para a versão publicada (hoje: oficiais, só locais)
- [ ] Fonte bitmap própria, mais estreita
- [ ] Trilha sonora e efeitos

## Etapa 7 — Publicação

- [ ] Controle (gamepad) e toque
- [ ] PWA e página no itch.io ou GitHub Pages
- [ ] Desktop (Tauri) e celular (Capacitor)
