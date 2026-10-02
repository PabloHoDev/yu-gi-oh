import type { Attribute, Card, MonsterCard } from './types';

function normal(
  id: string,
  name: string,
  attribute: Attribute,
  type: string,
  level: number,
  atk: number,
  def: number,
): MonsterCard {
  return { id, kind: 'monster', name, attribute, type, level, atk, def };
}

/**
 * Banco de cartas do protótipo: só Monstros Normais, digitados à mão.
 * Vai ser substituído por JSON gerado em data/cards (ver docs/TECNOLOGIAS.md).
 */
const CARD_LIST: MonsterCard[] = [
  normal('ehero-avian', 'Elemental HERO Avian', 'WIND', 'Warrior', 3, 1000, 1000),
  normal('ehero-burstinatrix', 'Elemental HERO Burstinatrix', 'FIRE', 'Warrior', 3, 1200, 800),
  normal('ehero-clayman', 'Elemental HERO Clayman', 'EARTH', 'Warrior', 4, 800, 2000),
  normal('ehero-sparkman', 'Elemental HERO Sparkman', 'LIGHT', 'Warrior', 4, 1600, 1400),
  normal('ehero-neos', 'Elemental HERO Neos', 'LIGHT', 'Warrior', 7, 2500, 2000),
  normal('warrior-dai-grepher', 'Warrior Dai Grepher', 'EARTH', 'Warrior', 4, 1700, 1600),
  normal('celtic-guardian', 'Celtic Guardian', 'EARTH', 'Warrior', 4, 1400, 1200),
  normal('dark-blade', 'Dark Blade', 'DARK', 'Warrior', 4, 1800, 1500),
  normal('giant-soldier-of-stone', 'Giant Soldier of Stone', 'EARTH', 'Rock', 3, 1300, 2000),
  normal('mystical-elf', 'Mystical Elf', 'LIGHT', 'Spellcaster', 4, 800, 2000),
  normal('summoned-skull', 'Summoned Skull', 'DARK', 'Fiend', 6, 2500, 1200),
  normal('luster-dragon', 'Luster Dragon', 'WIND', 'Dragon', 4, 1900, 1600),
  normal('gemini-elf', 'Gemini Elf', 'EARTH', 'Spellcaster', 4, 1900, 900),
  normal('vorse-raider', 'Vorse Raider', 'DARK', 'Beast-Warrior', 4, 1900, 1200),
  normal('battle-ox', 'Battle Ox', 'EARTH', 'Beast-Warrior', 4, 1700, 1000),
  normal('la-jinn', 'La Jinn the Mystical Genie of the Lamp', 'DARK', 'Fiend', 4, 1800, 1000),
  normal('x-head-cannon', 'X-Head Cannon', 'LIGHT', 'Machine', 4, 1800, 1500),
  normal('archfiend-soldier', 'Archfiend Soldier', 'DARK', 'Fiend', 4, 1900, 1500),
  normal('cyber-tech-alligator', 'Cyber-Tech Alligator', 'WIND', 'Machine', 5, 2500, 1600),
  normal('blue-eyes-white-dragon', 'Blue-Eyes White Dragon', 'LIGHT', 'Dragon', 8, 3000, 2500),
];

export const CARDS: ReadonlyMap<string, Card> = new Map(CARD_LIST.map((card) => [card.id, card]));

export function getCard(id: string): Card {
  const card = CARDS.get(id);
  if (!card) throw new Error(`Carta desconhecida: ${id}`);
  return card;
}

/** Lista de deck como pares [id, cópias]. */
export type DeckList = readonly (readonly [string, number])[];

export function buildDeck(list: DeckList): Card[] {
  return list.flatMap(([id, copies]) => Array.from({ length: copies }, () => getCard(id)));
}

// Decks de 20 cartas para duelos curtos no protótipo; o jogo final usa 40 a 60.
export const STARTER_DECK: DeckList = [
  ['ehero-avian', 2],
  ['ehero-burstinatrix', 2],
  ['ehero-clayman', 2],
  ['ehero-sparkman', 3],
  ['warrior-dai-grepher', 2],
  ['celtic-guardian', 2],
  ['dark-blade', 2],
  ['giant-soldier-of-stone', 2],
  ['mystical-elf', 1],
  ['ehero-neos', 1],
  ['summoned-skull', 1],
];

export const OBELISK_STUDENT_DECK: DeckList = [
  ['luster-dragon', 2],
  ['gemini-elf', 2],
  ['vorse-raider', 2],
  ['battle-ox', 2],
  ['la-jinn', 2],
  ['x-head-cannon', 2],
  ['archfiend-soldier', 2],
  ['mystical-elf', 2],
  ['giant-soldier-of-stone', 1],
  ['cyber-tech-alligator', 2],
  ['blue-eyes-white-dragon', 1],
];

export const DECKS = {
  starter: STARTER_DECK,
  obeliskStudent: OBELISK_STUDENT_DECK,
} as const;

export type DeckId = keyof typeof DECKS;
