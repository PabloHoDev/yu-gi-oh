import Phaser from 'phaser';
import { BOX_CHARS, BOX_HEIGHT, BOX_LINES, BOX_PADDING, BOX_Y, GAME_WIDTH } from '../config';
import { drawPanel, makeText } from './panel';
import { paginate } from './text';

const CHAR_DELAY_MS = 22;
const UI_DEPTH = 1000;

/** Caixa de diálogo do rodapé: texto letra a letra, dividido em páginas. */
export class DialogBox {
  private readonly panel: Phaser.GameObjects.Graphics;
  private readonly text: Phaser.GameObjects.Text;
  private readonly arrow: Phaser.GameObjects.Graphics;
  private pages: string[] = [];
  private page = 0;
  private shown = 0;
  private timer: Phaser.Time.TimerEvent | null = null;
  private onDone: (() => void) | null = null;

  constructor(private readonly scene: Phaser.Scene) {
    this.panel = scene.add.graphics();
    drawPanel(this.panel, 0, BOX_Y, GAME_WIDTH, BOX_HEIGHT);
    this.text = makeText(scene, BOX_PADDING, BOX_Y + BOX_PADDING);
    this.arrow = scene.add.graphics();
    this.arrow.fillStyle(0xd83830).fillTriangle(0, 0, 6, 0, 3, 4);
    this.arrow.setPosition(GAME_WIDTH - 14, BOX_Y + BOX_HEIGHT - 10);

    for (const object of [this.panel, this.text, this.arrow]) {
      object.setScrollFactor(0).setDepth(UI_DEPTH).setVisible(false);
    }
  }

  get isOpen(): boolean {
    return this.pages.length > 0;
  }

  show(text: string, onDone?: () => void): void {
    this.pages = paginate(text, BOX_CHARS, BOX_LINES);
    this.page = 0;
    this.onDone = onDone ?? null;
    this.panel.setVisible(true);
    this.text.setVisible(true);
    this.startPage();
  }

  /** Botão de confirmar: completa a página em andamento, ou passa para a próxima. */
  advance(): void {
    if (!this.isOpen) return;
    const current = this.pages[this.page] ?? '';
    if (this.shown < current.length) {
      this.reveal(current.length);
      return;
    }
    if (this.page < this.pages.length - 1) {
      this.page += 1;
      this.startPage();
      return;
    }
    this.close();
  }

  private startPage(): void {
    this.reveal(0);
    this.timer?.remove();
    this.timer = this.scene.time.addEvent({
      delay: CHAR_DELAY_MS,
      loop: true,
      callback: () => this.reveal(this.shown + 1),
    });
  }

  private reveal(count: number): void {
    const current = this.pages[this.page] ?? '';
    this.shown = Math.min(count, current.length);
    this.text.setText(current.slice(0, this.shown));
    const complete = this.shown >= current.length;
    this.arrow.setVisible(complete);
    if (complete) {
      this.timer?.remove();
      this.timer = null;
    }
  }

  private close(): void {
    this.pages = [];
    for (const object of [this.panel, this.text, this.arrow]) object.setVisible(false);
    const done = this.onDone;
    this.onDone = null;
    done?.();
  }
}
