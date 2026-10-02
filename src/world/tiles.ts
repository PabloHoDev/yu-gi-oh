/** Índices no tileset. A ordem aqui é a ordem em que os tiles são desenhados em gfx/placeholders.ts. */
export enum Tile {
  Grass,
  Path,
  Water,
  Tree,
  Flower,
  AcademyRoof,
  AcademyWall,
  Door,
  RedRoof,
  RedWall,
  BlueRoof,
  BlueWall,
  Pier,
}

export const TILE_COUNT = Tile.Pier + 1;

interface TileInfo {
  tile: Tile;
  solid: boolean;
}

/** Símbolos usados para desenhar mapas em texto (formato provisório, até a migração para o Tiled). */
export const LEGEND: Readonly<Record<string, TileInfo>> = {
  '.': { tile: Tile.Grass, solid: false },
  ':': { tile: Tile.Path, solid: false },
  '~': { tile: Tile.Water, solid: true },
  T: { tile: Tile.Tree, solid: true },
  F: { tile: Tile.Flower, solid: false },
  A: { tile: Tile.AcademyRoof, solid: true },
  W: { tile: Tile.AcademyWall, solid: true },
  D: { tile: Tile.Door, solid: true },
  R: { tile: Tile.RedRoof, solid: true },
  S: { tile: Tile.RedWall, solid: true },
  B: { tile: Tile.BlueRoof, solid: true },
  O: { tile: Tile.BlueWall, solid: true },
  P: { tile: Tile.Pier, solid: false },
};
