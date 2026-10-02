import type { MonsterCard } from './cardSchema';

export type { AnyCard, Attribute, MonsterCard, SpellCard, TrapCard } from './cardSchema';

export type PlayerId = 0 | 1;

export type Position = 'attack' | 'defense';

export type Phase = 'main1' | 'battle' | 'main2';

/**
 * Carta que pode estar em um deck durante o duelo. Hoje só monstros; vira
 * AnyCard quando o motor ganhar magias e armadilhas.
 */
export type Card = MonsterCard;

export interface FieldMonster {
  card: MonsterCard;
  position: Position;
  faceDown: boolean;
  summonedOnTurn: number;
  hasAttacked: boolean;
  positionChanged: boolean;
}

export interface PlayerState {
  name: string;
  lp: number;
  deck: Card[];
  hand: Card[];
  monsters: (FieldMonster | null)[];
  graveyard: Card[];
  normalSummonUsed: boolean;
}

export type WinReason = 'lp' | 'deckout';

/** Tudo o que acontece no duelo vira evento; a interface só narra e anima eventos. */
export type DuelEvent =
  | { type: 'turnStart'; player: PlayerId; turn: number }
  | { type: 'draw'; player: PlayerId; card: Card }
  | { type: 'phase'; player: PlayerId; phase: Phase }
  | { type: 'summon'; player: PlayerId; zone: number; card: MonsterCard; tributes: MonsterCard[] }
  | { type: 'set'; player: PlayerId; zone: number; card: MonsterCard; tributes: MonsterCard[] }
  | { type: 'positionChange'; player: PlayerId; zone: number; card: MonsterCard; position: Position }
  | { type: 'flipSummon'; player: PlayerId; zone: number; card: MonsterCard }
  | {
      type: 'attack';
      player: PlayerId;
      attacker: MonsterCard;
      /** Nulo em ataque direto. */
      target: MonsterCard | null;
      targetPosition: Position | null;
      targetWasFaceDown: boolean;
    }
  | { type: 'destroy'; player: PlayerId; card: MonsterCard }
  | { type: 'damage'; player: PlayerId; amount: number }
  | { type: 'win'; player: PlayerId; reason: WinReason };
