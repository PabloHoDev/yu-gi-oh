# Duel Academy

Fan game de Yu-Gi-Oh! GX no estilo dos RPGs de Game Boy Advance: você é um calouro da Academia de Duelos, explora a ilha em visão superior e duela com os outros alunos.

Projeto de fã, sem fins comerciais e sem vínculo com os detentores de Yu-Gi-Oh!.

## Rodar

Requer Node.js 22 ou mais recente (desenvolvido no 24).

```bash
npm install
npm run art:import   # opcional: baixa as ilustrações das cartas (não ficam no repositório)
npm run dev
```

Abra http://localhost:5173.

## Controles

| Tecla | Ação |
|---|---|
| Setas ou WASD | Andar / mover o cursor |
| Z, Enter ou Espaço | Falar, confirmar |
| X ou Esc | Cancelar, voltar |

## O que já dá para fazer

- Andar pelo pátio da Academia, falar com alunos e ler as portas.
- Duelar com o aluno do Obelisk Azul perto do dormitório azul: invocar, baixar, tributar, mudar posição e atacar, contra uma IA.

## Documentação

- [Tecnologias e arquitetura](docs/TECNOLOGIAS.md)
- [Roadmap](docs/ROADMAP.md)
- [Como evoluir o jogo](docs/COMO-EVOLUIR.md): adicionar cartas, decks, NPCs, mapas e regras
- [Cartas do jogo](docs/CARTAS.md): as 200 cartas e quais já são jogáveis
- [Changelog](CHANGELOG.md)
- [Referência de estilo visual](pokemon_firered_leafgreen_estilo_completo.md)

## Outros comandos

```bash
npm run check         # lint + tipos + testes + build
npm run format        # corrige formatação e lint
npm test              # só os testes
npm run cards:import  # baixa as cartas da seleção e regenera o banco
```
