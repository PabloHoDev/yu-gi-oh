import type Phaser from 'phaser';
import type { BuildingDef } from '../world/maps';
import { type Ctx, type DomeColors, dome, rect } from './pixels';

type BuildingSprite = BuildingDef['sprite'];

const OUTLINE = '#383c58';
const GOLD = '#f8d038';
const GLASS = '#70b0f0';
const GLASS_LIGHT = '#c8e4f8';
const GLASS_FRAME = '#304878';

const RED_DOME: DomeColors = { base: '#d83830', light: '#f88070', dark: '#a02028', outline: OUTLINE };
const YELLOW_DOME: DomeColors = { base: '#f0c830', light: '#f8ec90', dark: '#c09018', outline: OUTLINE };
const BLUE_DOME: DomeColors = { base: '#3868d8', light: '#80b0f8', dark: '#2040a0', outline: OUTLINE };

function window(ctx: Ctx, x: number, y: number, w: number, h: number): void {
  rect(ctx, GLASS_FRAME, x, y, w, h);
  rect(ctx, GLASS, x + 1, y + 1, w - 2, h - 2);
  rect(ctx, GLASS_LIGHT, x + 1, y + 1, 3, 3);
  rect(ctx, GLASS_FRAME, x + Math.floor(w / 2), y + 1, 1, h - 2);
}

/**
 * Prédio principal da Academia de Duelos: fachada clara, obeliscos nas pontas e
 * três cúpulas nas cores dos dormitórios (vermelho, azul e amarelo).
 */
function academy(ctx: Ctx): void {
  for (const x of [5, 147]) {
    rect(ctx, OUTLINE, x - 1, 12, 10, 52);
    rect(ctx, '#e8ecf4', x, 13, 8, 51);
    rect(ctx, '#b8c0d4', x + 5, 13, 3, 51);
    rect(ctx, OUTLINE, x + 1, 7, 6, 5);
    rect(ctx, GOLD, x + 2, 8, 4, 4);
  }

  dome(ctx, 42, 34, 18, 16, RED_DOME);
  dome(ctx, 118, 34, 18, 16, YELLOW_DOME);
  dome(ctx, 80, 34, 27, 26, BLUE_DOME);
  rect(ctx, OUTLINE, 78, 3, 4, 6);
  rect(ctx, GOLD, 79, 4, 2, 4);

  // Beiral e fachada
  rect(ctx, OUTLINE, 14, 34, 132, 5);
  rect(ctx, '#a8b0c8', 15, 35, 130, 3);
  rect(ctx, OUTLINE, 15, 39, 130, 25);
  rect(ctx, '#f4f0e4', 16, 39, 128, 25);
  rect(ctx, '#d0c8b0', 16, 60, 128, 4);

  for (let bay = 0; bay < 8; bay++) {
    const x = 16 + bay * 16;
    rect(ctx, '#d8d0b8', x, 39, 2, 21);
    if (bay !== 3 && bay !== 4) window(ctx, x + 4, 43, 10, 12);
  }

  // Entrada central com portas de vidro
  rect(ctx, OUTLINE, 66, 40, 28, 24);
  rect(ctx, GOLD, 67, 41, 26, 2);
  rect(ctx, '#284078', 68, 44, 24, 20);
  for (const x of [69, 81]) {
    rect(ctx, '#5890d8', x, 45, 10, 18);
    rect(ctx, '#a8d0f8', x, 45, 3, 6);
  }
  rect(ctx, GOLD, 78, 54);
  rect(ctx, GOLD, 81, 54);
  rect(ctx, '#c8c0a8', 62, 62, 36, 2);
}

interface DormStyle {
  roof: string;
  roofLight: string;
  roofDark: string;
  wall: string;
  wallDark: string;
  door: string;
  /** Em qual dos 4 tiles da base fica a porta. */
  doorTile: number;
  /** Tábuas de madeira (Slifer) ou colunas com friso dourado (Obelisk). */
  noble: boolean;
}

function dorm(ctx: Ctx, style: DormStyle): void {
  // Telhado
  rect(ctx, OUTLINE, 3, 2, 58, 5);
  rect(ctx, style.roofLight, 4, 3, 56, 4);
  rect(ctx, OUTLINE, 0, 6, 64, 23);
  rect(ctx, style.roof, 1, 7, 62, 21);
  for (let y = 11; y < 26; y += 5) rect(ctx, style.roofDark, 1, y, 62, 1);
  rect(ctx, style.roofDark, 1, 26, 62, 2);

  // Parede
  rect(ctx, OUTLINE, 2, 29, 60, 27);
  rect(ctx, style.wall, 3, 29, 58, 26);
  rect(ctx, style.wallDark, 3, 52, 58, 3);
  if (style.noble) {
    rect(ctx, GOLD, 3, 30, 58, 1);
    for (const x of [3, 57]) rect(ctx, '#f8f8f8', x, 31, 4, 21);
  } else {
    for (let y = 34; y < 52; y += 6) rect(ctx, style.wallDark, 3, y, 58, 1);
  }

  for (let tile = 0; tile < 4; tile++) {
    const x = tile * 16;
    if (tile !== style.doorTile) {
      window(ctx, x + 3, 36, 10, 10);
      continue;
    }
    rect(ctx, OUTLINE, x + 2, 35, 12, 21);
    rect(ctx, style.door, x + 3, 36, 10, 20);
    rect(ctx, style.roofDark, x + 3, 36, 10, 2);
    rect(ctx, OUTLINE, x + 8, 38, 1, 18);
    rect(ctx, GOLD, x + 6, 46);
    rect(ctx, GOLD, x + 10, 46);
  }
}

const BUILDINGS: Record<BuildingSprite, { width: number; height: number; paint: (ctx: Ctx) => void }> = {
  academy: { width: 160, height: 64, paint: academy },
  sliferDorm: {
    width: 64,
    height: 56,
    paint: (ctx) =>
      dorm(ctx, {
        roof: '#d03830',
        roofLight: '#f07060',
        roofDark: '#982028',
        wall: '#d0a060',
        wallDark: '#a07840',
        door: '#885830',
        doorTile: 2,
        noble: false,
      }),
  },
  obeliskDorm: {
    width: 64,
    height: 56,
    paint: (ctx) =>
      dorm(ctx, {
        roof: '#3058c8',
        roofLight: '#6890f0',
        roofDark: '#203c98',
        wall: '#e8ecf8',
        wallDark: '#a8b0d0',
        door: '#284078',
        doorTile: 1,
        noble: true,
      }),
  },
};

export function createBuildings(scene: Phaser.Scene): void {
  for (const [key, { width, height, paint }] of Object.entries(BUILDINGS)) {
    const texture = scene.textures.createCanvas(key, width, height);
    if (!texture) continue;
    paint(texture.getContext());
    texture.refresh();
  }
}
