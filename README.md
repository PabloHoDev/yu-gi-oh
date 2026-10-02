# Duel Academy

Fan game de Yu-Gi-Oh! GX no estilo dos RPGs de Game Boy Advance: você é um calouro da Academia de Duelos, explora a ilha em visão superior e duela com os outros alunos.

Projeto de fã, sem fins comerciais e sem vínculo com os detentores de Yu-Gi-Oh!.

## Rodar

Requer Node.js 22 ou mais recente (desenvolvido no 24).

```bash
npm install
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

- [Tecnologias, arquitetura e etapas](docs/TECNOLOGIAS.md)
- [Referência de estilo visual](pokemon_firered_leafgreen_estilo_completo.md)

## Outros comandos

```bash
npm test           # testes
npm run typecheck  # tipos
npm run build      # versão de produção em dist/
```
