/**
 * Gera docs/CARTAS.md: a lista de todas as cartas do banco e quais o motor
 * de duelo já sabe jogar.
 *
 * Uso: npm run cards:report (o cards:import também chama isto ao terminar).
 */
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { cardListSchema, isPlayable, type AnyCard } from '../src/duel/cardSchema.ts';

const CARDS_FILE = new URL('../data/cards/cards.json', import.meta.url);
const REPORT_FILE = new URL('../docs/CARTAS.md', import.meta.url);

const FRAME_LABEL = { normal: 'Normal', effect: 'Efeito', fusion: 'Fusão', ritual: 'Ritual' } as const;
const SPELL_LABEL = {
  normal: 'Normal',
  'quick-play': 'Rápida',
  continuous: 'Contínua',
  equip: 'Equipamento',
  field: 'Campo',
  ritual: 'Ritual',
} as const;
const TRAP_LABEL = { normal: 'Normal', continuous: 'Contínua', counter: 'Resposta' } as const;

function details(card: AnyCard): string {
  if (card.kind === 'spell') return `Magia ${SPELL_LABEL[card.spellType]}`;
  if (card.kind === 'trap') return `Armadilha ${TRAP_LABEL[card.trapType]}`;
  const atk = card.variableAtk ? '?' : card.atk;
  const def = card.variableDef ? '?' : card.def;
  const abilities = card.abilities.length > 0 ? ` (${card.abilities.join(', ')})` : '';
  return `${FRAME_LABEL[card.frame]}${abilities} · ${card.attribute} · ${card.type} · N${card.level} · ${atk}/${def}`;
}

function table(cards: AnyCard[]): string {
  const rows = cards.map(
    (card) => `| ${isPlayable(card) ? '✅' : '—'} | ${card.name} | ${card.nameEn} | ${details(card)} | \`${card.id}\` |`,
  );
  return ['| Jogável | Nome | Nome em inglês | Detalhes | id |', '|:-:|---|---|---|---|', ...rows].join('\n');
}

export async function writeCardReport(cards: AnyCard[]): Promise<void> {
  const playable = cards.filter(isPlayable).length;
  const section = (title: string, kind: AnyCard['kind']) => {
    const list = cards.filter((card) => card.kind === kind).sort((a, b) => a.name.localeCompare(b.name, 'pt'));
    return `## ${title} (${list.length})\n\n${table(list)}`;
  };

  const report = [
    '# Cartas do jogo',
    '',
    '> Arquivo gerado por `npm run cards:report`. Não edite à mão: as mudanças se perdem na próxima geração.',
    '',
    `O banco tem **${cards.length} cartas**; o motor de duelo já sabe jogar **${playable}**.`,
    'Uma carta vira "jogável" quando o motor implementa o que ela precisa (ver `isPlayable` em `src/duel/cardSchema.ts`).',
    '',
    section('Monstros', 'monster'),
    '',
    section('Magias', 'spell'),
    '',
    section('Armadilhas', 'trap'),
    '',
  ].join('\n');

  await writeFile(REPORT_FILE, report);
  console.log(`docs/CARTAS.md atualizado: ${playable} de ${cards.length} cartas jogáveis.`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await writeCardReport(cardListSchema.parse(JSON.parse(await readFile(CARDS_FILE, 'utf8'))));
}
