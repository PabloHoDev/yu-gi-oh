export type PlayerId = 0 | 1;

export type Attribute = 'DARK' | 'EARTH' | 'FIRE' | 'LIGHT' | 'WATER' | 'WIND';

export type Position = 'attack' | 'defense';

export type Phase = 'main1' | 'battle' | 'main2';

export interface MonsterCard {
  id: string;
  kind: 'monster';
  name: string;
  level: number;
  atk: number;
  def: number;
  attribute: Attribute;
  type: string;
}

/** Magias e armadilhas entram nesta união quando o sistema de efeitos existir. */
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
  | { type: 'attack'; player: PlayerId; attacker: MonsterCard; target: MonsterCard | null; targetWasFaceDown: boolean }
  | { type: 'destroy'; player: PlayerId; card: MonsterCard }
  | { type: 'damage'; player: PlayerId; amount: number }
  | { type: 'win'; player: PlayerId; reason: WinReason };
