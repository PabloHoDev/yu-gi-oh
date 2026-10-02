import type Phaser from 'phaser';
import { createBuildings } from './buildings';
import { createCardTextures } from './cardArt';
import { createCharacters } from './characters';
import { createTileset } from './tileset';

/**
 * Toda a arte do mapa é pixel art própria desenhada por código, para o jogo
 * rodar sem depender de arquivos de imagem. As ilustrações das cartas são a
 * exceção: vêm do atlas opcional carregado em gfx/cardArt.ts.
 */
export function createTextures(scene: Phaser.Scene): void {
  createTileset(scene);
  createCharacters(scene);
  createBuildings(scene);
  createCardTextures(scene);
}
