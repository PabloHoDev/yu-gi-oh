import Phaser from 'phaser';
import { FONT_SIZE, GAME_WIDTH, TILE_SIZE } from '../config';
import { characterFrame } from '../gfx/characters';
import { TILESET_KEY } from '../gfx/tileset';
import { Controls } from '../input/Controls';
import { DialogBox } from '../ui/DialogBox';
import { drawPanel, makeText } from '../ui/panel';
import { ACADEMY_ISLAND } from '../world/academyIsland';
import {
  DIRECTION_DELTA,
  type Direction,
  isSolid,
  type MapDef,
  mapSize,
  type NpcDef,
  OPPOSITE,
  tileData,
} from '../world/maps';
import { Tile } from '../world/tiles';
import type { DuelSceneData, DuelSceneResult } from './DuelScene';
import { SceneKey } from './keys';

const STEP_MS = 180;
const WATER_FRAME_MS = 600;

interface Npc {
  def: NpcDef;
  sprite: Phaser.GameObjects.Sprite;
  defeated: boolean;
}

/** Exploração em visão superior: movimento em grade, colisão por tile, NPCs e placas. */
export class OverworldScene extends Phaser.Scene {
  private readonly map: MapDef = ACADEMY_ISLAND;
  private controls!: Controls;
  private dialog!: DialogBox;
  private player!: Phaser.GameObjects.Sprite;
  private npcs: Npc[] = [];
  private tileX = 0;
  private tileY = 0;
  private facing: Direction = 'down';
  private moving = false;
  /** Alterna a perna a cada passo. */
  private stride: 1 | 2 = 1;
  /** Verdadeiro durante transições de cena: ignora o jogador. */
  private busy = false;

  constructor() {
    super(SceneKey.Overworld);
  }

  create(): void {
    const { width, height } = mapSize(this.map);
    const tilemap = this.make.tilemap({ data: tileData(this.map), tileWidth: TILE_SIZE, tileHeight: TILE_SIZE });
    const tileset = tilemap.addTilesetImage(TILESET_KEY, TILESET_KEY, TILE_SIZE, TILE_SIZE, 0, 0);
    if (!tileset) throw new Error('O tileset não foi gerado.');
    const ground = tilemap.createLayer(0, tileset, 0, 0);
    this.time.addEvent({
      delay: WATER_FRAME_MS,
      loop: true,
      callback: () => ground?.swapByIndex(Tile.Water, Tile.WaterAlt),
    });

    // Prédios e personagens são mais altos que um tile: ficam apoiados na base do tile
    // e a profundidade segue a linha, para quem está mais ao sul cobrir quem está ao norte.
    for (const building of this.map.buildings) {
      this.add
        .image(building.x * TILE_SIZE, (building.baseY + 1) * TILE_SIZE, building.sprite)
        .setOrigin(0, 1)
        .setDepth(building.baseY);
    }

    this.npcs = this.map.npcs.map((def) => {
      const sprite = this.addCharacter(def.sprite, def.x, def.y);
      setPose(sprite, def.facing, 0);
      return { def, sprite, defeated: false };
    });

    const { x, y, facing } = this.map.start;
    this.tileX = x;
    this.tileY = y;
    this.facing = facing;
    this.moving = false;
    this.busy = false;
    this.player = this.addCharacter('player', x, y);
    setPose(this.player, facing, 0);

    const camera = this.cameras.main;
    camera.setBounds(0, 0, width * TILE_SIZE, height * TILE_SIZE);
    // O sprite é ancorado no canto inferior esquerdo; a câmera mira o centro do tile.
    camera.startFollow(this.player, true, 1, 1, -TILE_SIZE / 2, TILE_SIZE / 2);
    camera.fadeIn(300);

    this.controls = new Controls(this);
    this.dialog = new DialogBox(this);
    this.showLocationBanner(this.map.name);

    this.events.on(Phaser.Scenes.Events.WAKE, this.onWake, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () =>
      this.events.off(Phaser.Scenes.Events.WAKE, this.onWake, this),
    );
  }

  update(): void {
    // Lidos todo frame para que um toque durante uma transição não fique "guardado".
    const confirm = this.controls.justConfirm();
    if (this.busy) return;

    if (this.dialog.isOpen) {
      if (confirm) this.dialog.advance();
      return;
    }
    if (this.moving) return;

    if (confirm) {
      this.interact();
      return;
    }
    const direction = this.controls.heldDirection();
    if (direction) this.tryMove(direction);
  }

  private addCharacter(key: string, tileX: number, tileY: number): Phaser.GameObjects.Sprite {
    return this.add
      .sprite(tileX * TILE_SIZE, (tileY + 1) * TILE_SIZE, key)
      .setOrigin(0, 1)
      .setDepth(tileY);
  }

  private tryMove(direction: Direction): void {
    this.facing = direction;
    const { dx, dy } = DIRECTION_DELTA[direction];
    const x = this.tileX + dx;
    const y = this.tileY + dy;
    if (this.isBlocked(x, y)) {
      setPose(this.player, direction, 0);
      return;
    }

    this.moving = true;
    this.tileX = x;
    this.tileY = y;
    this.stride = this.stride === 1 ? 2 : 1;
    this.player.setDepth(Math.max(y, y - dy));
    setPose(this.player, direction, this.stride);
    this.tweens.add({
      targets: this.player,
      x: x * TILE_SIZE,
      y: (y + 1) * TILE_SIZE,
      duration: STEP_MS,
      onComplete: () => {
        this.player.setDepth(y);
        setPose(this.player, direction, 0);
        this.moving = false;
      },
    });
  }

  private isBlocked(x: number, y: number): boolean {
    return isSolid(this.map, x, y) || this.npcs.some((npc) => npc.def.x === x && npc.def.y === y);
  }

  private interact(): void {
    const { dx, dy } = DIRECTION_DELTA[this.facing];
    const x = this.tileX + dx;
    const y = this.tileY + dy;

    const npc = this.npcs.find((candidate) => candidate.def.x === x && candidate.def.y === y);
    if (npc) {
      setPose(npc.sprite, OPPOSITE[this.facing], 0);
      const duel = npc.def.duel;
      if (!duel) this.dialog.show(npc.def.dialog);
      else if (npc.defeated) this.dialog.show(duel.winText);
      else this.dialog.show(npc.def.dialog, () => this.startDuel(npc));
      return;
    }

    const sign = this.map.signs.find((candidate) => candidate.x === x && candidate.y === y);
    if (sign) this.dialog.show(sign.text);
  }

  private startDuel(npc: Npc): void {
    const duel = npc.def.duel;
    if (!duel) return;
    this.busy = true;
    const camera = this.cameras.main;
    camera.flash(250);
    camera.once(Phaser.Cameras.Scene2D.Events.FLASH_COMPLETE, () => camera.fadeOut(350));
    camera.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      const data: DuelSceneData = { npcId: npc.def.id, opponent: duel, opponentSprite: npc.def.sprite };
      this.scene.sleep();
      this.scene.run(SceneKey.Duel, data);
    });
  }

  private onWake(_systems: Phaser.Scenes.Systems, result?: DuelSceneResult): void {
    this.busy = false;
    this.cameras.main.fadeIn(300);
    const npc = this.npcs.find((candidate) => candidate.def.id === result?.npcId);
    if (!npc?.def.duel || !result) return;
    if (result.won) npc.defeated = true;
    this.dialog.show(result.won ? npc.def.duel.winText : npc.def.duel.loseText);
  }

  private showLocationBanner(name: string): void {
    const width = Math.min(GAME_WIDTH - 8, name.length * FONT_SIZE + 16);
    const panel = this.add.graphics().setPosition(4, -24);
    drawPanel(panel, 0, 0, width, 20);
    const label = makeText(this, 12, -18, name);
    const banner = [panel, label];
    for (const object of banner) object.setScrollFactor(0).setDepth(900);

    // Desce do topo, espera e sobe de volta.
    this.tweens.add({
      targets: banner,
      y: '+=28',
      duration: 300,
      hold: 1800,
      yoyo: true,
      onComplete: () => {
        for (const object of banner) object.destroy();
      },
    });
  }
}

function setPose(sprite: Phaser.GameObjects.Sprite, direction: Direction, pose: 0 | 1 | 2): void {
  sprite.setFrame(characterFrame(direction, pose));
  sprite.setFlipX(direction === 'left');
}
