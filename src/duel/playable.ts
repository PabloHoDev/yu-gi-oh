import type { AnyCard, MonsterCard } from './cardSchema';

/**
 * Cartas que o motor de duelo já sabe jogar. Hoje: Monstros Normais.
 * Amplie aqui à medida que o motor ganhar efeitos, magias, armadilhas e fusões;
 * os decks só podem conter cartas jogáveis (há teste para isso).
 */
export function isPlayable(card: AnyCard): card is MonsterCard {
  return card.kind === 'monster' && card.frame === 'normal';
}
