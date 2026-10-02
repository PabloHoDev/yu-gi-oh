import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { Controls } from '../input/Controls';
import { makeText } from '../ui/panel';

export class TitleScene extends Phaser.Scene {
  private controls!: Controls;
  private starting = false;

  constructor() {
    super('Title');
  }

  create(): void {
    this.controls = new Controls(this);
    this.starting = false;

    const background = this.add.graphics();
    background.fillStyle(0x182048).fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    background.fillStyle(0x283878).fillRect(0, 40, GAME_WIDTH, 50);
    background.fillStyle(0xd83830).fillRect(0, 38, GAME_WIDTH, 2);
    background.fillStyle(0xe8c030).fillRect(0, 90, GAME_WIDTH, 2);

    const center = GAME_WIDTH / 2;
    makeText(this, center, 50, 'DUEL ACADEMY', '#f8f8f8').setFontSize(16).setOrigin(0.5, 0);
    makeText(this, center, 74, 'Fan game de Yu-Gi-Oh! GX', '#f8d840').setOrigin(0.5, 0);
    makeText(this, center, 148, 'v0.1 - protótipo', '#8090c0').setOrigin(0.5, 0);

    const prompt = makeText(this, center, 116, 'APERTE Z', '#f8f8f8').setOrigin(0.5, 0);
    this.time.addEvent({ delay: 450, loop: true, callback: () => prompt.setVisible(!prompt.visible) });

    this.cameras.main.fadeIn(300);
  }

  update(): void {
    if (this.starting || !this.controls.justConfirm()) return;
    this.starting = true;
    this.cameras.main.fadeOut(300);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start('Overworld'));
  }
}
