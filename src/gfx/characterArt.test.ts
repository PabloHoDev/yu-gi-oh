import { describe, expect, it } from 'vitest';
import { CHARACTER_HEIGHT, CHARACTER_PALETTES, CHARACTER_WIDTH, characterRows } from './characterArt';

describe('pixel art dos personagens', () => {
  const views = ['down', 'up', 'right'] as const;
  const letters = new Set(Object.keys(CHARACTER_PALETTES.player));

  it.each(views.flatMap((view) => [false, true].map((step) => ({ view, step }))))(
    'frame $view (passo: $step) tem o tamanho certo e só usa cores da paleta',
    ({ view, step }) => {
      const rows = characterRows(view, step);
      expect(rows).toHaveLength(CHARACTER_HEIGHT);
      expect(rows.filter((row) => row.length !== CHARACTER_WIDTH)).toEqual([]);
      const unknown = [...new Set(rows.join(''))].filter((pixel) => pixel !== '.' && !letters.has(pixel));
      expect(unknown).toEqual([]);
    },
  );
});
