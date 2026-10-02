import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { Controls } from '../input/Controls';
import { makeText } from '../ui/panel';
import { SceneKey } from './keys';

export class TitleScene extends Phaser.Scene {
  private controls!: Controls;
  private starting = false;

  constructor() {
    super(SceneKey.Title);
  }

  create(): void {
    this.controls = new Controls(this);
    this.starting = false;
    const center = GAME_WIDTH / 2;

    // A ilha da Academia vista do mar: céu, o prédio principal e o oceano.
    const scenery = this.add.graphics();
    scenery.fillStyle(0x58a8f0).fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    scenery.fillStyle(0x88c8f8).fillRect(0, 44, GAME_WIDTH, 30);
    scenery.fillStyle(0xc0e4f8).fillRect(0, 66, GAME_WIDTH, 12);
    scenery.fillStyle(0xf8f8f8);
    for (const [x, y, w] of [
      [18, 16, 34],
      [26, 12, 18],
      [176, 26, 40],
      [188, 21, 20],
    ] as const) {
      scenery.fillRect(x, y, w, 6);
    }
    scenery.fillStyle(0x287840).fillRect(8, 74, GAME_WIDTH - 16, 8);
    scenery.fillStyle(0x70c860).fillRect(0, 80, GAME_WIDTH, 14);
    scenery.fillStyle(0xe8d8a0).fillRect(0, 92, GAME_WIDTH, 4);
    scenery.fillStyle(0x2860c0).fillRect(0, 96, GAME_WIDTH, GAME_HEIGHT - 96);
    scenery.fillStyle(0x3888e0).fillRect(0, 96, GAME_WIDTH, 3);
    scenery.fillStyle(0x183c88).fillRect(0, 132, GAME_WIDTH, GAME_HEIGHT - 132);
    this.add.image(center, 90, 'academy').setOrigin(0.5, 1);

    makeText(this, center, 102, 'DUEL ACADEMY', '#f8d840').setFontSize(16).setStroke('#101840', 4).setOrigin(0.5, 0);
    makeText(this, center, 123, 'Fan game de Yu-Gi-Oh! GX', '#f8f8f8').setOrigin(0.5, 0);
    makeText(this, center, 149, `v${__APP_VERSION__} - protótipo`, '#88a8e0').setOrigin(0.5, 0);

    const prompt = makeText(this, center, 137, 'APERTE Z', '#f8f8f8').setOrigin(0.5, 0);
    this.time.addEvent({ delay: 450, loop: true, callback: () => prompt.setVisible(!prompt.visible) });

    this.cameras.main.fadeIn(300);
  }

  update(): void {
    if (this.starting || !this.controls.justConfirm()) return;
    this.starting = true;
    this.cameras.main.fadeOut(300);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start(SceneKey.Overworld));
  }
}
