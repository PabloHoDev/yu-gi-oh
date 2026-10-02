import Phaser from 'phaser';
import { FONT_FAMILY, FONT_SIZE } from '../config';
import { preloadCardArt } from '../gfx/cardArt';
import { createTextures } from '../gfx/textures';
import { SceneKey } from './keys';

export class BootScene extends Phaser.Scene {
  constructor() {
    super(SceneKey.Boot);
  }

  preload(): void {
    // O atlas de ilustrações é opcional (npm run art:import): se faltar, o jogo usa a arte provisória.
    this.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR, (file: Phaser.Loader.File) => {
      console.warn(`Arquivo opcional não carregado: ${file.key}`);
    });
    preloadCardArt(this);
  }

  create(): void {
    createTextures(this);
    // O texto do Phaser é desenhado em canvas: a fonte precisa estar carregada antes do primeiro uso.
    const start = () => this.scene.start(SceneKey.Title);
    document.fonts.load(`${FONT_SIZE}px ${FONT_FAMILY}`, 'Aá').then(start, start);
  }
}
