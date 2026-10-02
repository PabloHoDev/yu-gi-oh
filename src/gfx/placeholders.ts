import type Phaser from 'phaser';
import { TILE_SIZE } from '../config';
import { TILE_COUNT, Tile } from '../world/tiles';

/**
 * Arte provisória desenhada por código, para o protótipo rodar sem nenhum
 * arquivo de imagem. Tudo aqui será trocado por pixel art original
 * (tilesets e spritesheets em public/assets) na etapa de arte.
 */
export function createPlaceholderTextures(scene: Phaser.Scene): void {
  createTileset(scene);
  createCharacter(scene, 'player', { hair: '#5a3418', jacket: '#d83830', pants: '#e8e8f0' });
  createCharacter(scene, 'npcRed', { hair: '#78c8e8', jacket: '#d83830', pants: '#e8e8f0' });
  createCharacter(scene, 'npcBlue', { hair: '#282830', jacket: '#3058c8', pants: '#e8e8f0' });
  createCharacter(scene, 'npcYellow', { hair: '#903838', jacket: '#e8c030', pants: '#505868' });
}

/** Frames do spritesheet de personagem; "left" é o frame "right" espelhado. */
export const CHARACTER_FRAME = { down: 0, up: 2, right: 4, left: 4 } as const;

type Ctx = CanvasRenderingContext2D;

function rect(ctx: Ctx, color: string, x: number, y: number, w = 1, h = 1): void {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

function fill(ctx: Ctx, color: string): void {
  rect(ctx, color, 0, 0, TILE_SIZE, TILE_SIZE);
}

function grass(ctx: Ctx): void {
  fill(ctx, '#68c070');
  for (const [x, y] of [
    [2, 3],
    [10, 2],
    [6, 8],
    [13, 10],
    [3, 13],
  ] as const)
    rect(ctx, '#88d888', x, y, 2, 1);
  for (const [x, y] of [
    [7, 4],
    [12, 6],
    [1, 9],
    [9, 13],
  ] as const)
    rect(ctx, '#50a060', x, y);
}

function roof(ctx: Ctx, base: string, shade: string): void {
  fill(ctx, base);
  for (let y = 3; y < TILE_SIZE; y += 4) rect(ctx, shade, 0, y, TILE_SIZE, 1);
}

function wall(ctx: Ctx, base: string, trim: string): void {
  fill(ctx, base);
  rect(ctx, '#405880', 4, 3, 8, 8);
  rect(ctx, '#78b8e8', 5, 4, 6, 6);
  rect(ctx, '#c8e8f8', 5, 4, 2, 2);
  rect(ctx, trim, 0, 14, TILE_SIZE, 2);
}

const TILE_PAINTERS: Record<Tile, (ctx: Ctx) => void> = {
  [Tile.Grass]: grass,
  [Tile.Path]: (ctx) => {
    fill(ctx, '#e0c890');
    for (const [x, y] of [
      [3, 2],
      [11, 5],
      [6, 10],
      [13, 13],
      [1, 12],
    ] as const)
      rect(ctx, '#c8ac70', x, y, 2, 1);
  },
  [Tile.Water]: (ctx) => {
    fill(ctx, '#4090e8');
    rect(ctx, '#80bcf8', 1, 3, 5, 1);
    rect(ctx, '#80bcf8', 9, 7, 5, 1);
    rect(ctx, '#80bcf8', 3, 12, 5, 1);
    rect(ctx, '#3078d0', 10, 2, 4, 1);
    rect(ctx, '#3078d0', 0, 9, 4, 1);
  },
  [Tile.Tree]: (ctx) => {
    grass(ctx);
    rect(ctx, '#805028', 6, 11, 4, 5);
    rect(ctx, '#286838', 2, 0, 12, 12);
    rect(ctx, '#286838', 1, 2, 14, 8);
    rect(ctx, '#409850', 3, 1, 8, 7);
    rect(ctx, '#60b868', 4, 2, 4, 3);
  },
  [Tile.Flower]: (ctx) => {
    grass(ctx);
    for (const [x, y, color] of [
      [3, 4, '#f05050'],
      [10, 6, '#f8f8f8'],
      [6, 11, '#f8d030'],
    ] as const) {
      rect(ctx, color, x, y, 3, 3);
      rect(ctx, '#f8e8a0', x + 1, y + 1);
    }
  },
  [Tile.AcademyRoof]: (ctx) => roof(ctx, '#d8dce8', '#a8b0c8'),
  [Tile.AcademyWall]: (ctx) => wall(ctx, '#f0e8d0', '#b0a078'),
  [Tile.Door]: (ctx) => {
    fill(ctx, '#f0e8d0');
    rect(ctx, '#503018', 2, 1, 12, 15);
    rect(ctx, '#885830', 3, 2, 10, 14);
    rect(ctx, '#503018', 8, 2, 1, 14);
    rect(ctx, '#f8d840', 6, 9);
    rect(ctx, '#f8d840', 10, 9);
  },
  [Tile.RedRoof]: (ctx) => roof(ctx, '#d04038', '#982828'),
  [Tile.RedWall]: (ctx) => wall(ctx, '#e8d8b8', '#a08860'),
  [Tile.BlueRoof]: (ctx) => roof(ctx, '#3860c8', '#2040a0'),
  [Tile.BlueWall]: (ctx) => wall(ctx, '#e8ecf8', '#98a0c0'),
  [Tile.Pier]: (ctx) => {
    fill(ctx, '#b88850');
    for (let y = 3; y < TILE_SIZE; y += 4) rect(ctx, '#805830', 0, y, TILE_SIZE, 1);
    rect(ctx, '#805830', 7, 0, 1, 3);
    rect(ctx, '#805830', 3, 8, 1, 3);
  },
};

function createTileset(scene: Phaser.Scene): void {
  const texture = scene.textures.createCanvas('tiles', TILE_COUNT * TILE_SIZE, TILE_SIZE);
  if (!texture) return;
  const ctx = texture.getContext();
  for (let tile = 0; tile < TILE_COUNT; tile++) {
    ctx.save();
    ctx.translate(tile * TILE_SIZE, 0);
    TILE_PAINTERS[tile as Tile](ctx);
    ctx.restore();
  }
  texture.refresh();
}

interface CharacterPalette {
  hair: string;
  jacket: string;
  pants: string;
}

const SKIN = '#f8d0a0';
const DARK = '#282828';

function paintCharacter(ctx: Ctx, palette: CharacterPalette, view: 'down' | 'up' | 'right', step: boolean): void {
  const { hair, jacket, pants } = palette;

  // Cabeça
  rect(ctx, SKIN, 4, 1, 8, 7);
  if (view === 'down') {
    rect(ctx, hair, 4, 0, 8, 3);
    rect(ctx, hair, 3, 1, 1, 4);
    rect(ctx, hair, 12, 1, 1, 4);
    rect(ctx, DARK, 6, 4, 1, 2);
    rect(ctx, DARK, 9, 4, 1, 2);
  } else if (view === 'up') {
    rect(ctx, hair, 3, 0, 10, 7);
  } else {
    rect(ctx, hair, 4, 0, 8, 3);
    rect(ctx, hair, 3, 1, 3, 6);
    rect(ctx, DARK, 10, 4, 1, 2);
  }

  // Tronco
  if (view === 'right') {
    rect(ctx, jacket, 5, 8, 6, 5);
    rect(ctx, SKIN, 8, 11, 2, 2);
  } else {
    rect(ctx, jacket, 3, 8, 10, 5);
    rect(ctx, SKIN, 3, 12);
    rect(ctx, SKIN, 12, 12);
    if (view === 'down') rect(ctx, '#f8f8f8', 7, 8, 2, 5);
  }

  // Pernas: no frame de passo uma perna sobe.
  const legs = view === 'right' ? ([5, 9] as const) : ([4, 9] as const);
  const width = view === 'right' ? 2 : 3;
  legs.forEach((x, i) => {
    const lifted = step && i === 0;
    rect(ctx, pants, x, 13, width, lifted ? 1 : 2);
    rect(ctx, DARK, x, lifted ? 14 : 15, width, 1);
  });
}

function createCharacter(scene: Phaser.Scene, key: string, palette: CharacterPalette): void {
  const views = ['down', 'up', 'right'] as const;
  const texture = scene.textures.createCanvas(key, views.length * 2 * TILE_SIZE, TILE_SIZE);
  if (!texture) return;
  const ctx = texture.getContext();
  views.forEach((view, v) => {
    for (const step of [0, 1]) {
      const frame = v * 2 + step;
      ctx.save();
      ctx.translate(frame * TILE_SIZE, 0);
      paintCharacter(ctx, palette, view, step === 1);
      ctx.restore();
      texture.add(frame, 0, frame * TILE_SIZE, 0, TILE_SIZE, TILE_SIZE);
    }
  });
  texture.refresh();
}
