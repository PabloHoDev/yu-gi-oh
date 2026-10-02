import { describe, expect, it } from 'vitest';
import { DECKS } from '../duel/cards';
import { ACADEMY_ISLAND } from './academyIsland';
import { isSolid, type MapDef, mapSize, tileData } from './maps';

const MAPS: MapDef[] = [ACADEMY_ISLAND];

describe.each(MAPS)('mapa $id', (map) => {
  const { width, height } = mapSize(map);

  it('é retangular e só usa símbolos conhecidos', () => {
    expect(map.rows.every((row) => row.length === width)).toBe(true);
    expect(tileData(map)).toHaveLength(height);
  });

  it('começa o jogador em um tile livre', () => {
    expect(isSolid(map, map.start.x, map.start.y)).toBe(false);
  });

  it('coloca NPCs em tiles livres, sem sobreposição, com decks válidos', () => {
    const seen = new Set<string>();
    for (const npc of map.npcs) {
      expect(isSolid(map, npc.x, npc.y), npc.id).toBe(false);
      const key = `${npc.x},${npc.y}`;
      expect(seen.has(key), npc.id).toBe(false);
      seen.add(key);
      if (npc.duel) expect(DECKS[npc.duel.deck], npc.id).toBeDefined();
    }
  });

  it('coloca placas em tiles sólidos dentro do mapa', () => {
    for (const sign of map.signs) {
      expect(sign.x).toBeLessThan(width);
      expect(sign.y).toBeLessThan(height);
      expect(isSolid(map, sign.x, sign.y)).toBe(true);
    }
  });

  it('trata fora do mapa como sólido', () => {
    expect(isSolid(map, -1, 0)).toBe(true);
    expect(isSolid(map, 0, height)).toBe(true);
  });
});
