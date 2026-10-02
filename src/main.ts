import '@fontsource/press-start-2p';
import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from './config';
import { BootScene } from './scenes/BootScene';
import { DuelScene } from './scenes/DuelScene';
import { OverworldScene } from './scenes/OverworldScene';
import { TitleScene } from './scenes/TitleScene';
import './style.css';

/** Maior múltiplo inteiro da resolução interna que cabe na janela: pixels sempre nítidos. */
function integerZoom(): number {
  return Math.max(1, Math.floor(Math.min(window.innerWidth / GAME_WIDTH, window.innerHeight / GAME_HEIGHT)));
}

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#000000',
  pixelArt: true,
  roundPixels: true,
  scale: {
    mode: Phaser.Scale.NONE,
    zoom: integerZoom(),
  },
  scene: [BootScene, TitleScene, OverworldScene, DuelScene],
});

window.addEventListener('resize', () => game.scale.setZoom(integerZoom()));

// Só em desenvolvimento: acesso ao jogo pelo console e por testes automatizados de navegador.
if (import.meta.env.DEV) {
  (window as unknown as { __game: Phaser.Game }).__game = game;
}
