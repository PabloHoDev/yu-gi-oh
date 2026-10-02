import type Phaser from 'phaser';
import type { AnyCard } from '../duel/cardSchema';
import { rect } from './pixels';

export const CARD_ART_SIZE = 64;
export const CARD_BACK_KEY = 'cardBack';

/** Atlas gerado por `npm run art:import`. Pode não existir: nesse caso entra a arte provisória. */
const ATLAS_KEY = 'cardArt';
const ATLAS_PATH = 'assets/generated/card-art';

const FALLBACK_COLORS: Readonly<Record<string, readonly [string, string, string]>> = {
  DARK: ['#30204c', '#7048a8', '#b890e0'],
  DIVINE: ['#584010', '#d8a030', '#f8e088'],
  EARTH: ['#3c2c18', '#987848', '#d8b888'],
  FIRE: ['#581810', '#e05030', '#f8a070'],
  LIGHT: ['#585020', '#e8d048', '#f8f4b0'],
  WATER: ['#102c58', '#4088e0', '#98c8f8'],
  WIND: ['#104028', '#48b070', '#a0e8b8'],
  spell: ['#083c30', '#209070', '#70d8b0'],
  trap: ['#480c30', '#b03880', '#f088c0'],
};

function fallbackKey(card: AnyCard): string {
  return `cardArtFallback:${card.kind === 'monster' ? card.attribute : card.kind}`;
}

export function preloadCardArt(scene: Phaser.Scene): void {
  scene.load.atlas(ATLAS_KEY, `${ATLAS_PATH}.png`, `${ATLAS_PATH}.json`);
}

/** Aplica em `image` a ilustração da carta: a do atlas quando existe, senão um emblema na cor do atributo. */
export function setCardArt(image: Phaser.GameObjects.Image, card: AnyCard): void {
  const textures = image.scene.textures;
  if (textures.exists(ATLAS_KEY) && textures.get(ATLAS_KEY).has(card.id)) image.setTexture(ATLAS_KEY, card.id);
  else image.setTexture(fallbackKey(card));
}

export function createCardTextures(scene: Phaser.Scene): void {
  const size = CARD_ART_SIZE;
  const half = size / 2;

  for (const [name, [dark, base, light]] of Object.entries(FALLBACK_COLORS)) {
    const texture = scene.textures.createCanvas(`cardArtFallback:${name}`, size, size);
    if (!texture) continue;
    const ctx = texture.getContext();
    rect(ctx, dark, 0, 0, size, size);
    // Losango em degraus, com miolo claro
    for (let dy = -24; dy <= 24; dy++) {
      const width = 24 - Math.abs(dy);
      rect(ctx, base, half - width, half + dy, width * 2, 1);
      if (Math.abs(dy) < 10) rect(ctx, light, half - (10 - Math.abs(dy)), half + dy, (10 - Math.abs(dy)) * 2, 1);
    }
    texture.refresh();
  }

  // Verso da carta: marrom com o oval escuro e o miolo alaranjado
  const back = scene.textures.createCanvas(CARD_BACK_KEY, size, size);
  if (!back) return;
  const ctx = back.getContext();
  rect(ctx, '#3a1c08', 0, 0, size, size);
  rect(ctx, '#985828', 2, 2, size - 4, size - 4);
  rect(ctx, '#b87038', 4, 4, size - 8, size - 8);
  for (let dy = -24; dy <= 24; dy++) {
    const outer = Math.round(20 * Math.sqrt(1 - (dy / 24) ** 2));
    rect(ctx, '#3a1c08', half - outer, half + dy, outer * 2, 1);
    if (Math.abs(dy) <= 13) {
      const inner = Math.round(9 * Math.sqrt(1 - (dy / 13) ** 2));
      rect(ctx, '#e09040', half - inner, half + dy, inner * 2, 1);
    }
  }
  back.refresh();
}
