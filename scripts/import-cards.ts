/**
 * Importa as cartas listadas em data/cards/selection.json da API do YGOPRODeck
 * e grava data/cards/cards.json no formato de src/duel/cardSchema.ts.
 *
 * Uso: npm run cards:import
 *
 * O jogo nunca consulta a API: ele lê apenas o JSON gerado aqui, que fica
 * versionado no repositório. Rode de novo só quando mudar a seleção.
 */
import { readFile, writeFile } from 'node:fs/promises';
import {
  type AnyCard,
  type Attribute,
  cardListSchema,
  MONSTER_FRAMES,
  SPELL_TYPES,
  TRAP_TYPES,
} from '../src/duel/cardSchema.ts';
import { writeCardReport } from './cards-report.ts';

const API = 'https://db.ygoprodeck.com/api/v7/cardinfo.php';
const SELECTION_FILE = new URL('../data/cards/selection.json', import.meta.url);
const TRANSLATIONS_FILE = new URL('../data/cards/translations.pt.json', import.meta.url);
const OUTPUT_FILE = new URL('../data/cards/cards.json', import.meta.url);
/** A API aceita até 20 requisições por segundo; ficamos bem abaixo disso. */
const REQUEST_GAP_MS = 250;
const CHUNK = 40;

interface Selection {
  sets: string[];
  cards: string[];
}

interface Translations {
  cards: Record<string, { name: string; text: string }>;
}

type Translation = Pick<ApiCard, 'name' | 'desc'>;

interface ApiCard {
  id: number;
  name: string;
  name_en?: string;
  desc: string;
  frameType: string;
  race: string;
  typeline?: string[];
  atk?: number;
  def?: number;
  level?: number;
  attribute?: string;
  archetype?: string;
}

async function query(params: Record<string, string>): Promise<ApiCard[]> {
  await new Promise((resolve) => setTimeout(resolve, REQUEST_GAP_MS));
  const response = await fetch(`${API}?${new URLSearchParams(params)}`);
  const body = (await response.json()) as { data?: ApiCard[]; error?: string };
  if (!response.ok || !body.data) {
    throw new Error(`API respondeu ${response.status} para ${JSON.stringify(params)}: ${body.error ?? 'sem dados'}`);
  }
  return body.data;
}

function chunks<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

function slug(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function cleanText(text: string): string {
  return text.replace(/\r\n?/g, '\n').trim();
}

/** Converte uma carta da API para o formato do jogo, ou explica por que ela não é suportada. */
function convert(english: ApiCard, portuguese: Translation | undefined): AnyCard | string {
  const base = {
    id: slug(english.name),
    passcode: english.id,
    name: portuguese?.name ?? english.name,
    nameEn: english.name,
    text: cleanText(portuguese?.desc ?? english.desc),
    ...(english.archetype ? { archetype: english.archetype } : {}),
  };
  const subtype = english.race.toLowerCase();

  if (english.frameType === 'spell') {
    const spellType = SPELL_TYPES.find((type) => type === subtype);
    return spellType ? { ...base, kind: 'spell', spellType } : `tipo de magia desconhecido: ${english.race}`;
  }
  if (english.frameType === 'trap') {
    const trapType = TRAP_TYPES.find((type) => type === subtype);
    return trapType ? { ...base, kind: 'trap', trapType } : `tipo de armadilha desconhecido: ${english.race}`;
  }

  const frame = MONSTER_FRAMES.find((candidate) => candidate === english.frameType);
  if (!frame) return `tipo de carta fora da era GX: ${english.frameType}`;
  const { atk = 0, def = 0, level = 0 } = english;
  return {
    ...base,
    kind: 'monster',
    frame,
    level,
    atk: Math.max(0, atk),
    def: Math.max(0, def),
    ...(atk < 0 ? { variableAtk: true as const } : {}),
    ...(def < 0 ? { variableDef: true as const } : {}),
    attribute: english.attribute as Attribute,
    type: english.race,
    abilities: (english.typeline ?? []).filter(
      (entry) => entry !== english.race && !['Normal', 'Effect', 'Fusion', 'Ritual'].includes(entry),
    ),
  };
}

async function main(): Promise<void> {
  const selection = JSON.parse(await readFile(SELECTION_FILE, 'utf8')) as Selection;
  const byName = new Map<string, ApiCard>();
  const add = (cards: ApiCard[]) => {
    // Artes alternativas têm passcode próprio; fica a de menor número (a original).
    for (const card of cards) {
      const known = byName.get(card.name);
      if (!known || card.id < known.id) byName.set(card.name, card);
    }
  };

  for (const set of selection.sets) {
    const cards = await query({ cardset: set });
    console.log(`${String(cards.length).padStart(4)}  ${set}`);
    add(cards);
  }
  for (const names of chunks(selection.cards, CHUNK)) add(await query({ name: names.join('|') }));

  const missing = selection.cards.filter((name) => !byName.has(name));
  if (missing.length > 0) throw new Error(`Cartas da seleção não encontradas na API: ${missing.join(', ')}`);

  const english = [...byName.values()];
  const portuguese = new Map<number, ApiCard>();
  for (const batch of chunks(english, CHUNK)) {
    try {
      for (const card of await query({ id: batch.map((card) => card.id).join(','), language: 'pt' })) {
        portuguese.set(card.id, card);
      }
    } catch (error) {
      console.warn(`Sem tradução para um lote (${(error as Error).message}); essas cartas ficam em inglês.`);
    }
  }

  // Traduções do projeto cobrem o que a API não tem em português.
  const overrides = (JSON.parse(await readFile(TRANSLATIONS_FILE, 'utf8')) as Translations).cards;
  const unused = new Set(Object.keys(overrides));
  const untranslated: string[] = [];

  const cards: AnyCard[] = [];
  for (const card of english) {
    const id = slug(card.name);
    const override = overrides[id];
    let translation: Translation | undefined = portuguese.get(card.id);
    if (translation) {
      if (override) console.warn(`A API já traduz "${card.name}": remova ${id} de translations.pt.json.`);
    } else if (override) {
      translation = { name: override.name, desc: override.text };
    } else {
      untranslated.push(card.name);
    }
    unused.delete(id);

    const converted = convert(card, translation);
    if (typeof converted === 'string') console.warn(`Ignorada: ${card.name} (${converted})`);
    else cards.push(converted);
  }
  for (const id of unused) console.warn(`translations.pt.json tem "${id}", que não está na seleção.`);
  cards.sort((a, b) => a.id.localeCompare(b.id));

  const ids = new Set(cards.map((card) => card.id));
  if (ids.size !== cards.length) throw new Error('Duas cartas geraram o mesmo id.');
  const validated = cardListSchema.parse(cards);

  await writeFile(OUTPUT_FILE, `${JSON.stringify(validated, null, 2)}\n`);
  console.log(`\n${validated.length} cartas gravadas em data/cards/cards.json.`);
  if (untranslated.length > 0) {
    console.warn(`Sem tradução (ficaram em inglês; adicione em translations.pt.json): ${untranslated.join(', ')}`);
  }
  await writeCardReport(validated);
}

await main();
