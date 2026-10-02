import type Phaser from 'phaser';
import { TILE_SIZE } from '../config';
import { TILE_COUNT, Tile } from '../world/tiles';
import { type Ctx, rect } from './pixels';

export const TILESET_KEY = 'tiles';

const T = TILE_SIZE;

function dots(ctx: Ctx, color: string, points: readonly (readonly [number, number, number?])[]): void {
  for (const [x, y, w = 1] of points) rect(ctx, color, x, y, w, 1);
}

function grass(ctx: Ctx): void {
  rect(ctx, '#70c860', 0, 0, T, T);
  dots(ctx, '#88d870', [
    [2, 2, 2],
    [10, 5, 2],
    [5, 10, 2],
    [13, 13, 2],
  ]);
  dots(ctx, '#58b050', [
    [7, 3],
    [13, 8],
    [1, 7],
    [9, 14],
  ]);
}

function grassTuft(ctx: Ctx): void {
  grass(ctx);
  for (const [x, y] of [
    [3, 5],
    [10, 10],
  ] as const) {
    dots(ctx, '#409040', [
      [x, y + 2, 5],
      [x + 1, y + 1],
      [x + 3, y + 1],
    ]);
    dots(ctx, '#58b050', [
      [x, y + 1],
      [x + 2, y],
      [x + 4, y + 1],
    ]);
  }
}

function water(ctx: Ctx, shift: number): void {
  rect(ctx, '#3888e0', 0, 0, T, T);
  for (const [x, y] of [
    [1, 3],
    [9, 7],
    [4, 12],
  ] as const) {
    const wx = (x + shift) % T;
    rect(ctx, '#78b8f8', wx, y, 5, 1);
    rect(ctx, '#b8dcf8', wx + 1, y - 1, 2, 1);
  }
  dots(ctx, '#2870c8', [
    [(11 + shift) % T, 2, 3],
    [(2 + shift) % T, 9, 3],
    [(12 + shift) % T, 14, 3],
  ]);
}

const PAINTERS: Record<Tile, (ctx: Ctx) => void> = {
  [Tile.Grass]: grass,
  [Tile.GrassTuft]: grassTuft,
  [Tile.Path]: (ctx) => {
    rect(ctx, '#e8d8a0', 0, 0, T, T);
    dots(ctx, '#d0b878', [
      [3, 2, 2],
      [11, 5, 2],
      [6, 10, 2],
      [13, 13, 2],
      [1, 12],
    ]);
    dots(ctx, '#f8ecc0', [
      [8, 3],
      [2, 7],
      [12, 9],
      [5, 14],
    ]);
  },
  [Tile.Water]: (ctx) => water(ctx, 0),
  [Tile.WaterAlt]: (ctx) => water(ctx, 4),
  [Tile.Tree]: (ctx) => {
    grass(ctx);
    // Tronco e sombra no chão
    rect(ctx, '#409040', 3, 13, 10, 2);
    rect(ctx, '#583018', 6, 10, 4, 5);
    rect(ctx, '#805028', 7, 10, 2, 4);
    // Copa: contorno, massa, luz no alto à esquerda
    rect(ctx, '#184828', 3, 0, 10, 12);
    rect(ctx, '#184828', 1, 2, 14, 8);
    rect(ctx, '#287840', 3, 1, 10, 10);
    rect(ctx, '#287840', 2, 3, 12, 6);
    rect(ctx, '#40a050', 4, 2, 6, 5);
    rect(ctx, '#40a050', 3, 4, 3, 3);
    rect(ctx, '#70c868', 5, 3, 3, 2);
    dots(ctx, '#184828', [
      [9, 8, 2],
      [5, 9, 2],
      [11, 5],
    ]);
  },
  [Tile.Flower]: (ctx) => {
    grass(ctx);
    for (const [x, y, color] of [
      [3, 3, '#f05858'],
      [10, 5, '#f8f8f8'],
      [6, 11, '#f8d038'],
    ] as const) {
      rect(ctx, color, x, y + 1, 3, 1);
      rect(ctx, color, x + 1, y, 1, 3);
      rect(ctx, '#f8a020', x + 1, y + 1);
      rect(ctx, '#409040', x + 1, y + 3);
    }
  },
  [Tile.Pier]: (ctx) => {
    rect(ctx, '#c09058', 0, 0, T, T);
    for (let y = 3; y < T; y += 4) rect(ctx, '#805830', 0, y, T, 1);
    for (let y = 0; y < T; y += 4) rect(ctx, '#d8b078', 0, y, T, 1);
    dots(ctx, '#805830', [
      [7, 1],
      [7, 2],
      [3, 9],
      [3, 10],
      [12, 5],
      [12, 6],
      [9, 13],
      [9, 14],
    ]);
  },
  [Tile.Foundation]: grass,
};

export function createTileset(scene: Phaser.Scene): void {
  const texture = scene.textures.createCanvas(TILESET_KEY, TILE_COUNT * T, T);
  if (!texture) return;
  const ctx = texture.getContext();
  for (let tile = 0; tile < TILE_COUNT; tile++) {
    ctx.save();
    ctx.translate(tile * T, 0);
    PAINTERS[tile as Tile](ctx);
    ctx.restore();
  }
  texture.refresh();
}
