import cardsJson from '../../data/cards/cards.json';
import decksJson from '../../data/decks.json';
import type { AnyCard } from './cardSchema';
import { isPlayable } from './playable';
import type { Card } from './types';

/**
 * Banco de cartas do jogo, gerado por `npm run cards:import` (ver scripts/import-cards.ts).
 * O formato é validado contra cardSchema nos testes, por isso a conversão de tipo aqui é segura.
 */
export const ALL_CARDS = cardsJson as readonly AnyCard[];

export const CARDS: ReadonlyMap<string, AnyCard> = new Map(ALL_CARDS.map((card) => [card.id, card]));

export function getCard(id: string): AnyCard {
  const card = CARDS.get(id);
  if (!card) throw new Error(`Carta desconhecida: ${id}`);
  return card;
}

export interface DeckDef {
  name: string;
  /** id da carta → número de cópias. */
  cards: Readonly<Record<string, number>>;
}

export type DeckId = keyof typeof decksJson;

export const DECKS: Readonly<Record<DeckId, DeckDef>> = decksJson;

export const DECK_MIN_SIZE = 40;
export const DECK_MAX_SIZE = 60;
export const MAX_COPIES = 3;

export function buildDeck(id: DeckId): Card[] {
  return Object.entries(DECKS[id].cards).flatMap(([cardId, copies]) => {
    const card = getCard(cardId);
    if (!isPlayable(card)) throw new Error(`O motor de duelo ainda não sabe jogar ${card.nameEn} (deck ${id}).`);
    return Array.from({ length: copies }, () => card);
  });
}
