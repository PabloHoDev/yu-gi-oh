/** Índices no tileset. A ordem aqui é a ordem em que os tiles são desenhados em gfx/tileset.ts. */
export enum Tile {
  Grass,
  GrassTuft,
  Path,
  Water,
  WaterAlt,
  Tree,
  Flower,
  Pier,
  /** Chão sob os prédios: é grama, e fica quase todo escondido pela imagem do prédio. */
  Foundation,
}

export const TILE_COUNT = Tile.Foundation + 1;

interface TileInfo {
  tile: Tile;
  solid: boolean;
}

/**
 * Símbolos usados para desenhar mapas em texto (formato provisório, até a migração para o Tiled).
 * Os símbolos de prédio marcam só a área sólida: a aparência vem de `MapDef.buildings`.
 */
export const LEGEND: Readonly<Record<string, TileInfo>> = {
  '.': { tile: Tile.Grass, solid: false },
  ':': { tile: Tile.Path, solid: false },
  '~': { tile: Tile.Water, solid: true },
  T: { tile: Tile.Tree, solid: true },
  F: { tile: Tile.Flower, solid: false },
  P: { tile: Tile.Pier, solid: false },
  A: { tile: Tile.Foundation, solid: true },
  W: { tile: Tile.Foundation, solid: true },
  D: { tile: Tile.Foundation, solid: true },
  R: { tile: Tile.Foundation, solid: true },
  S: { tile: Tile.Foundation, solid: true },
  B: { tile: Tile.Foundation, solid: true },
  O: { tile: Tile.Foundation, solid: true },
};
