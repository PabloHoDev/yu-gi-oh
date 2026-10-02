import type Phaser from 'phaser';
import {
  CHARACTER_HEIGHT,
  CHARACTER_PALETTES,
  CHARACTER_WIDTH,
  type CharacterSprite,
  type CharacterView,
  characterRows,
} from './characterArt';
import { paintRows } from './pixels';

const VIEWS: readonly CharacterView[] = ['down', 'up', 'right'];
const FRAMES_PER_VIEW = 3;

/** Primeiro frame de cada direção; "left" é o frame "right" espelhado pela cena. */
const VIEW_FRAME = { down: 0, up: 3, right: 6, left: 6 } as const;

/**
 * Frame de um personagem: 0 = parado, 1 e 2 = os dois passos da caminhada.
 * De lado só existe um passo, repetido.
 */
export function characterFrame(direction: keyof typeof VIEW_FRAME, pose: 0 | 1 | 2): number {
  return VIEW_FRAME[direction] + pose;
}

function createCharacter(scene: Phaser.Scene, key: CharacterSprite): void {
  const texture = scene.textures.createCanvas(key, VIEWS.length * FRAMES_PER_VIEW * CHARACTER_WIDTH, CHARACTER_HEIGHT);
  if (!texture) return;
  const ctx = texture.getContext();
  const palette = CHARACTER_PALETTES[key];

  VIEWS.forEach((view, v) => {
    for (let pose = 0; pose < FRAMES_PER_VIEW; pose++) {
      const frame = v * FRAMES_PER_VIEW + pose;
      const x = frame * CHARACTER_WIDTH;
      ctx.save();
      // O segundo passo de frente/costas é o primeiro espelhado (a outra perna).
      if (pose === 2 && view !== 'right') {
        ctx.translate(x + CHARACTER_WIDTH, 0);
        ctx.scale(-1, 1);
      } else {
        ctx.translate(x, 0);
      }
      paintRows(ctx, characterRows(view, pose !== 0), palette);
      ctx.restore();
      texture.add(frame, 0, x, 0, CHARACTER_WIDTH, CHARACTER_HEIGHT);
    }
  });
  texture.refresh();
}

export function createCharacters(scene: Phaser.Scene): void {
  for (const key of Object.keys(CHARACTER_PALETTES) as CharacterSprite[]) createCharacter(scene, key);
}
