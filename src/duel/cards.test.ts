import { describe, expect, it } from 'vitest';
import cardsJson from '../../data/cards/cards.json';
import { cardListSchema } from './cardSchema';
import { ALL_CARDS, buildDeck, CARDS, DECK_MAX_SIZE, DECK_MIN_SIZE, DECKS, type DeckId, MAX_COPIES } from './cards';
import { isPlayable } from './playable';

describe('banco de cartas', () => {
  it('segue o formato de cardSchema', () => {
    const result = cardListSchema.safeParse(cardsJson);
    expect(result.error?.issues ?? []).toEqual([]);
  });

  it('não repete id nem passcode', () => {
    expect(new Set(ALL_CARDS.map((card) => card.id)).size).toBe(ALL_CARDS.length);
    expect(new Set(ALL_CARDS.map((card) => card.passcode)).size).toBe(ALL_CARDS.length);
  });

  it('tem todas as cartas com nome e texto', () => {
    const empty = ALL_CARDS.filter((card) => !card.name.trim() || !card.text.trim()).map((card) => card.id);
    expect(empty).toEqual([]);
  });

  it('tem cartas jogáveis suficientes para montar decks', () => {
    expect(ALL_CARDS.filter(isPlayable).length).toBeGreaterThanOrEqual(DECK_MIN_SIZE / MAX_COPIES);
  });
});

describe.each(Object.keys(DECKS) as DeckId[])('deck %s', (id) => {
  const entries = Object.entries(DECKS[id].cards);

  it('só usa cartas que existem e que o motor sabe jogar', () => {
    const unknown = entries.filter(([cardId]) => !CARDS.has(cardId)).map(([cardId]) => cardId);
    expect(unknown).toEqual([]);
    expect(() => buildDeck(id)).not.toThrow();
  });

  it('respeita o tamanho do deck e o limite de cópias', () => {
    const size = entries.reduce((total, [, copies]) => total + copies, 0);
    expect(size).toBeGreaterThanOrEqual(DECK_MIN_SIZE);
    expect(size).toBeLessThanOrEqual(DECK_MAX_SIZE);
    const invalid = entries.filter(([, copies]) => copies < 1 || copies > MAX_COPIES).map(([cardId]) => cardId);
    expect(invalid).toEqual([]);
  });
});
