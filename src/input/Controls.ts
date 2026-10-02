import Phaser from 'phaser';
import type { Direction } from '../world/maps';

type Key = Phaser.Input.Keyboard.Key;

const { KeyCodes } = Phaser.Input.Keyboard;

const DIRECTIONS: readonly Direction[] = ['up', 'down', 'left', 'right'];

/** Botões lógicos do jogo (direcional, A = confirmar, B = cancelar) mapeados no teclado. */
export class Controls {
  private readonly directions: Record<Direction, Key[]>;
  private readonly confirm: Key[];
  private readonly cancel: Key[];

  constructor(scene: Phaser.Scene) {
    const keyboard = scene.input.keyboard;
    if (!keyboard) throw new Error('Teclado indisponível.');
    const keys = (...codes: number[]) => codes.map((code) => keyboard.addKey(code));

    this.directions = {
      up: keys(KeyCodes.UP, KeyCodes.W),
      down: keys(KeyCodes.DOWN, KeyCodes.S),
      left: keys(KeyCodes.LEFT, KeyCodes.A),
      right: keys(KeyCodes.RIGHT, KeyCodes.D),
    };
    this.confirm = keys(KeyCodes.Z, KeyCodes.ENTER, KeyCodes.SPACE);
    this.cancel = keys(KeyCodes.X, KeyCodes.ESC, KeyCodes.BACKSPACE);
  }

  heldDirection(): Direction | null {
    return DIRECTIONS.find((direction) => this.directions[direction].some((key) => key.isDown)) ?? null;
  }

  justDirection(): Direction | null {
    // Consulta todas as direções: JustDown consome o estado da tecla.
    const pressed = DIRECTIONS.filter((direction) => justDown(this.directions[direction]));
    return pressed[0] ?? null;
  }

  justConfirm(): boolean {
    return justDown(this.confirm);
  }

  justCancel(): boolean {
    return justDown(this.cancel);
  }
}

function justDown(keys: readonly Key[]): boolean {
  return keys.map((key) => Phaser.Input.Keyboard.JustDown(key)).some(Boolean);
}
