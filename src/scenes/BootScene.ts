import Phaser from 'phaser';
import { FONT_FAMILY, FONT_SIZE } from '../config';
import { createPlaceholderTextures } from '../gfx/placeholders';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create(): void {
    createPlaceholderTextures(this);
    // O texto do Phaser é desenhado em canvas: a fonte precisa estar carregada antes do primeiro uso.
    const start = () => this.scene.start('Title');
    document.fonts.load(`${FONT_SIZE}px ${FONT_FAMILY}`, 'Aá').then(start, start);
  }
}
