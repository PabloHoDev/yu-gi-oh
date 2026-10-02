import Phaser from 'phaser';
import { FONT_FAMILY, FONT_SIZE, TEXT_COLOR } from '../config';

/** Caixa branca com borda dupla, no estilo das caixas de texto de RPG de GBA. */
export function drawPanel(graphics: Phaser.GameObjects.Graphics, x: number, y: number, width: number, height: number): void {
  graphics.fillStyle(0x303850).fillRect(x, y, width, height);
  graphics.fillStyle(0x6888c0).fillRect(x + 1, y + 1, width - 2, height - 2);
  graphics.fillStyle(0xf8f8f8).fillRect(x + 3, y + 3, width - 6, height - 6);
}

export function makeText(scene: Phaser.Scene, x: number, y: number, text = '', color = TEXT_COLOR): Phaser.GameObjects.Text {
  return scene.add.text(x, y, text, {
    fontFamily: FONT_FAMILY,
    fontSize: `${FONT_SIZE}px`,
    color,
    lineSpacing: 4,
  });
}
