import type { DeckId } from '../duel/cards';
import { LEGEND, Tile } from './tiles';

export type Direction = 'down' | 'up' | 'left' | 'right';

export const DIRECTION_DELTA: Readonly<Record<Direction, { dx: number; dy: number }>> = {
  down: { dx: 0, dy: 1 },
  up: { dx: 0, dy: -1 },
  left: { dx: -1, dy: 0 },
  right: { dx: 1, dy: 0 },
};

export const OPPOSITE: Readonly<Record<Direction, Direction>> = {
  down: 'up',
  up: 'down',
  left: 'right',
  right: 'left',
};

export interface NpcDuel {
  /** Nome curto mostrado na tela de duelo. */
  name: string;
  deck: DeckId;
  startingLP: number;
  winText: string;
  loseText: string;
}

export interface NpcDef {
  id: string;
  x: number;
  y: number;
  facing: Direction;
  sprite: 'npcBlue' | 'npcRed' | 'npcYellow';
  dialog: string;
  duel?: NpcDuel;
}

export interface SignDef {
  x: number;
  y: number;
  text: string;
}

/** Prédio desenhado como uma imagem única por cima dos tiles sólidos que ele ocupa. */
export interface BuildingDef {
  sprite: 'academy' | 'sliferDorm' | 'obeliskDorm';
  /** Coluna do tile mais à esquerda e linha do tile da base (a imagem cresce para cima). */
  x: number;
  baseY: number;
}

export interface MapDef {
  id: string;
  name: string;
  /** Uma string por linha de tiles; cada caractere é um símbolo de LEGEND. */
  rows: readonly string[];
  start: { x: number; y: number; facing: Direction };
  npcs: readonly NpcDef[];
  signs: readonly SignDef[];
  buildings: readonly BuildingDef[];
}

export function mapSize(map: MapDef): { width: number; height: number } {
  return { width: map.rows[0]?.length ?? 0, height: map.rows.length };
}

export function tileData(map: MapDef): Tile[][] {
  return map.rows.map((row, y) =>
    [...row].map((symbol, x) => {
      const info = LEGEND[symbol];
      if (!info) throw new Error(`Símbolo de mapa desconhecido: "${symbol}"`);
      // Espalha tufos pela grama para o gramado não parecer uma grade repetida.
      if (info.tile === Tile.Grass && (x * 7 + y * 13) % 5 === 0) return Tile.GrassTuft;
      return info.tile;
    }),
  );
}

/** Fora do mapa conta como sólido. NPCs são tratados à parte pela cena. */
export function isSolid(map: MapDef, x: number, y: number): boolean {
  const symbol = map.rows[y]?.[x];
  return symbol === undefined || (LEGEND[symbol]?.solid ?? true);
}
