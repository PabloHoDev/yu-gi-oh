import type Phaser from 'phaser';
import { BOX_CHARS, BOX_Y, GAME_WIDTH } from '../config';
import type { DuelEvent, MonsterCard, PlayerId } from '../duel/types';
import { CARD_ART_SIZE, CARD_BACK_KEY, setCardArt } from '../gfx/cardArt';
import { characterFrame } from '../gfx/characters';
import { makeText } from './panel';
import { truncate } from './text';

const DEPTH = 500;
const HEIGHT = BOX_Y;
const CENTER_X = GAME_WIDTH / 2;
/** Lado 0 (esquerda) é sempre o jogador; lado 1 (direita), o rival. */
const SIDE_X = [60, 180] as const;
const SUMMON_Y = 46;
const BATTLE_Y = 44;
const HALF = CARD_ART_SIZE / 2;

type Side = 0 | 1;
type Mode = 'hidden' | 'summon' | 'battle';

const THEME: readonly (readonly [number, number, number])[] = [
  [0x101c48, 0x183478, 0x2850b0],
  [0x48101c, 0x781828, 0xb02c3c],
];

/**
 * Palco do duelo: a cena em destaque que cobre o campo enquanto um evento é
 * narrado. Mostra a ilustração grande do monstro quando ele é invocado e o
 * confronto entre atacante e alvo durante uma batalha, como o holograma dos
 * Discos de Duelo.
 */
export class DuelStage {
  private readonly background: Phaser.GameObjects.Graphics;
  private readonly frames: Phaser.GameObjects.Graphics;
  private readonly arts: readonly [Phaser.GameObjects.Image, Phaser.GameObjects.Image];
  private readonly duelist: Phaser.GameObjects.Sprite;
  private readonly flash: Phaser.GameObjects.Graphics;
  private readonly title: Phaser.GameObjects.Text;
  private readonly stats: Phaser.GameObjects.Text;
  private readonly sideStats: readonly [Phaser.GameObjects.Text, Phaser.GameObjects.Text];
  private readonly pop: Phaser.GameObjects.Text;

  private mode: Mode = 'hidden';
  /** Carta mostrada em cada lado durante uma batalha. */
  private shown: [MonsterCard | null, MonsterCard | null] = [null, null];
  private pending: Phaser.Time.TimerEvent | null = null;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly human: PlayerId,
    /** Sprite de mapa de cada duelista, usado quando ele sofre um ataque direto. */
    private readonly duelistSprites: readonly [string, string],
  ) {
    const text = (color: string) => makeText(scene, 0, 0, '', color).setOrigin(0.5, 0);

    this.background = scene.add.graphics().setDepth(DEPTH);
    this.frames = scene.add.graphics().setDepth(DEPTH + 1);
    this.arts = [scene.add.image(0, 0, CARD_BACK_KEY), scene.add.image(0, 0, CARD_BACK_KEY)];
    this.duelist = scene.add.sprite(0, 0, duelistSprites[0]).setOrigin(0.5, 1).setScale(3);
    for (const object of [...this.arts, this.duelist]) object.setDepth(DEPTH + 2);
    this.flash = scene.add.graphics().setDepth(DEPTH + 3);
    this.flash.fillStyle(0xffffff).fillRect(0, 0, GAME_WIDTH, HEIGHT);

    this.title = text('#f8f8f8');
    this.stats = text('#f8d840');
    this.sideStats = [text('#f8f8f8'), text('#f8f8f8')];
    this.pop = text('#f85858');
    for (const object of [this.title, this.stats, ...this.sideStats, this.pop]) object.setDepth(DEPTH + 4);

    this.hide();
  }

  /** Atualiza o palco para o evento que está sendo narrado. */
  present(event: DuelEvent): void {
    switch (event.type) {
      case 'summon':
      case 'flipSummon':
        this.showSummon(event.player, event.card);
        return;
      case 'set':
        this.showSet(event.player, event.card);
        return;
      case 'attack':
        this.showBattle(event);
        return;
      case 'destroy':
        this.showDestroyed(event.player, event.card);
        return;
      case 'damage':
        this.showDamage(event.player, event.amount);
        return;
      default:
        this.hide();
    }
  }

  hide(): void {
    this.reset();
    this.mode = 'hidden';
  }

  private side(player: PlayerId): Side {
    return player === this.human ? 0 : 1;
  }

  private get objects(): (Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.Visible)[] {
    return [
      this.background,
      this.frames,
      ...this.arts,
      this.duelist,
      this.flash,
      this.title,
      this.stats,
      ...this.sideStats,
      this.pop,
    ];
  }

  /** Interrompe animações e esconde tudo, deixando o palco pronto para ser remontado. */
  private reset(): void {
    this.pending?.remove();
    this.pending = null;
    this.scene.tweens.killTweensOf([...this.arts, this.duelist, this.flash, this.pop]);
    for (const object of this.objects) object.setVisible(false);
    for (const art of this.arts) art.setAlpha(1).setScale(1);
    this.background.clear();
    this.frames.clear();
    this.shown = [null, null];
  }

  private showSummon(player: PlayerId, card: MonsterCard): void {
    this.reset();
    this.mode = 'summon';
    this.drawBackdrop(this.side(player));
    this.drawFrame(CENTER_X, SUMMON_Y);
    this.drawStars(card.level);

    const art = this.arts[0];
    setCardArt(art, card);
    art.setPosition(CENTER_X, SUMMON_Y).setVisible(true).setScale(1, 0.05);
    // O holograma se abre a partir de uma linha de luz.
    this.scene.tweens.add({ targets: art, scaleY: 1, duration: 180, ease: 'Back.Out' });
    this.flashOnce(0.85, 260);

    this.title.setPosition(CENTER_X, 86).setText(truncate(card.name, BOX_CHARS)).setVisible(true);
    this.stats.setPosition(CENTER_X, 98).setText(`ATK ${card.atk}  DEF ${card.def}`).setVisible(true);
  }

  private showSet(player: PlayerId, card: MonsterCard): void {
    this.reset();
    this.mode = 'summon';
    const mine = player === this.human;
    this.drawBackdrop(this.side(player));
    this.drawFrame(CENTER_X, SUMMON_Y);

    const art = this.arts[0];
    art.setTexture(CARD_BACK_KEY).setPosition(CENTER_X, SUMMON_Y).setVisible(true).setScale(0.05, 1);
    this.scene.tweens.add({ targets: art, scaleX: 1, duration: 160 });

    this.title
      .setPosition(CENTER_X, 86)
      .setText(mine ? truncate(card.name, BOX_CHARS) : 'Monstro baixado')
      .setVisible(true);
    this.stats
      .setPosition(CENTER_X, 98)
      .setText(mine ? `DEF ${card.def}` : 'DEF ????')
      .setVisible(true);
  }

  private showBattle(event: Extract<DuelEvent, { type: 'attack' }>): void {
    this.reset();
    this.mode = 'battle';
    const attackerSide = this.side(event.player);
    const targetSide: Side = attackerSide === 0 ? 1 : 0;
    const direction = attackerSide === 0 ? 1 : -1;
    this.drawClash();

    const attackerArt = this.arts[attackerSide];
    setCardArt(attackerArt, event.attacker);
    attackerArt.setPosition(SIDE_X[attackerSide], BATTLE_Y).setVisible(true);
    this.drawFrame(SIDE_X[attackerSide], BATTLE_Y);
    this.shown[attackerSide] = event.attacker;
    this.setSideStat(attackerSide, `ATK ${event.attacker.atk}`);

    const target = event.target;
    let hitTarget: Phaser.GameObjects.Image | Phaser.GameObjects.Sprite;
    let revealDelay = 0;
    if (!target) {
      // Ataque direto: o alvo é o próprio duelista.
      const defender: PlayerId = event.player === 0 ? 1 : 0;
      this.duelist
        .setTexture(this.duelistSprites[defender], characterFrame('right', 0))
        .setFlipX(targetSide === 1)
        .setPosition(SIDE_X[targetSide], BATTLE_Y + HALF + 4)
        .setAlpha(1)
        .setVisible(true);
      this.setSideStat(targetSide, 'ATAQUE DIRETO');
      hitTarget = this.duelist;
    } else {
      const targetArt = this.arts[targetSide];
      const stat = event.targetPosition === 'attack' ? `ATK ${target.atk}` : `DEF ${target.def}`;
      targetArt.setPosition(SIDE_X[targetSide], BATTLE_Y).setVisible(true);
      this.drawFrame(SIDE_X[targetSide], BATTLE_Y);
      this.shown[targetSide] = target;
      hitTarget = targetArt;

      if (event.targetWasFaceDown) {
        // A carta baixada vira para cima antes do golpe.
        revealDelay = 550;
        targetArt.setTexture(CARD_BACK_KEY);
        this.setSideStat(targetSide, 'DEF ????');
        this.scene.tweens.add({
          targets: targetArt,
          scaleX: 0,
          duration: 110,
          delay: 250,
          yoyo: true,
          onYoyo: () => {
            setCardArt(targetArt, target);
            this.setSideStat(targetSide, stat);
          },
        });
      } else {
        setCardArt(targetArt, target);
        this.setSideStat(targetSide, stat);
      }
    }

    // O atacante avança; no impacto, clarão e tremor no alvo.
    this.scene.tweens.add({
      targets: attackerArt,
      x: `+=${direction * 30}`,
      duration: 110,
      delay: 300 + revealDelay,
      yoyo: true,
      ease: 'Quad.In',
      onYoyo: () => {
        this.flashOnce(0.6, 180);
        this.scene.tweens.add({ targets: hitTarget, x: `+=${direction * 4}`, duration: 40, yoyo: true, repeat: 2 });
      },
    });
  }

  private showDestroyed(player: PlayerId, card: MonsterCard): void {
    const side = this.side(player);
    if (this.mode !== 'battle' || this.shown[side]?.id !== card.id) {
      this.hide();
      return;
    }
    this.shown[side] = null;
    this.frames.clear();
    for (const other of [0, 1] as const) {
      if (this.shown[other]) this.drawFrame(SIDE_X[other], BATTLE_Y);
    }
    this.setSideStat(side, 'ABATIDO');
    this.sideStats[side].setColor('#f85858');
    this.scene.tweens.add({ targets: this.arts[side], alpha: 0, y: '+=14', duration: 420, ease: 'Quad.In' });
  }

  private showDamage(player: PlayerId, amount: number): void {
    if (player === this.human) this.scene.cameras.main.shake(200, 0.01);
    if (this.mode !== 'battle') {
      this.hide();
      return;
    }
    const side = this.side(player);
    this.pop.setPosition(SIDE_X[side], 97).setText(`-${amount} LP`).setAlpha(1).setVisible(true);
    this.scene.tweens.add({ targets: this.pop, y: 94, duration: 70, yoyo: true, repeat: 2 });
    if (this.duelist.visible) {
      this.scene.tweens.add({ targets: this.duelist, alpha: 0.3, duration: 70, yoyo: true, repeat: 3 });
    }
  }

  private setSideStat(side: Side, value: string): void {
    this.sideStats[side].setPosition(SIDE_X[side], 84).setText(value).setColor('#f8f8f8').setVisible(true);
  }

  private flashOnce(alpha: number, duration: number): void {
    this.flash.setAlpha(alpha).setVisible(true);
    this.scene.tweens.add({ targets: this.flash, alpha: 0, duration });
  }

  /** Fundo da invocação: faixas na cor do duelista e colunas de luz do projetor de hologramas. */
  private drawBackdrop(side: Side): void {
    const [dark, mid, light] = THEME[side] as readonly [number, number, number];
    const g = this.background.setVisible(true);
    g.fillStyle(dark).fillRect(0, 0, GAME_WIDTH, HEIGHT);
    g.fillStyle(mid).fillRect(0, 18, GAME_WIDTH, 60);
    g.fillStyle(light).fillRect(0, 32, GAME_WIDTH, 30);
    g.fillStyle(0xffffff, 0.1);
    for (const x of [14, 44, 180, 212]) g.fillRect(x, 0, 10, HEIGHT);
    g.fillStyle(0xffffff, 0.16).fillRect(CENTER_X - 46, 0, 92, 82);
    g.fillStyle(0x000000, 0.45).fillRect(0, 82, GAME_WIDTH, HEIGHT - 82);
  }

  /** Fundo da batalha: o lado do jogador contra o lado do rival, separados por um raio. */
  private drawClash(): void {
    const g = this.background.setVisible(true);
    for (const side of [0, 1] as const) {
      const [dark, mid, light] = THEME[side] as readonly [number, number, number];
      const x = side * CENTER_X;
      g.fillStyle(dark).fillRect(x, 0, CENTER_X, HEIGHT);
      g.fillStyle(mid).fillRect(x, 14, CENTER_X, 62);
      g.fillStyle(light).fillRect(x, 30, CENTER_X, 28);
    }
    for (let y = 0; y < 80; y += 8) {
      const offset = (y / 8) % 2 === 0 ? -3 : 3;
      g.fillStyle(0xf8f8f8).fillRect(CENTER_X - 2 + offset, y, 4, 8);
      g.fillStyle(0xf8d840).fillRect(CENTER_X - 1 + offset, y, 2, 8);
    }
    g.fillStyle(0x000000, 0.45).fillRect(0, 80, GAME_WIDTH, HEIGHT - 80);
  }

  /** Moldura dourada em volta de uma ilustração centrada em (x, y). */
  private drawFrame(x: number, y: number): void {
    const g = this.frames.setVisible(true);
    g.fillStyle(0x181008).fillRect(x - HALF - 4, y - HALF - 4, CARD_ART_SIZE + 8, CARD_ART_SIZE + 8);
    g.fillStyle(0xf0c040).fillRect(x - HALF - 3, y - HALF - 3, CARD_ART_SIZE + 6, CARD_ART_SIZE + 6);
    g.fillStyle(0xf8ec98).fillRect(x - HALF - 3, y - HALF - 3, CARD_ART_SIZE + 6, 1);
    g.fillStyle(0x181008).fillRect(x - HALF - 1, y - HALF - 1, CARD_ART_SIZE + 2, CARD_ART_SIZE + 2);
  }

  /** Estrelas de nível acima da carta. */
  private drawStars(level: number): void {
    const g = this.frames;
    const spacing = 7;
    const startX = CENTER_X - Math.floor((level * spacing - 2) / 2);
    for (let i = 0; i < level; i++) {
      const x = startX + i * spacing;
      g.fillStyle(0xb06010).fillRect(x, 3, 5, 5);
      g.fillStyle(0xf8d840)
        .fillRect(x + 2, 2, 1, 7)
        .fillRect(x - 1, 5, 7, 1)
        .fillRect(x + 1, 4, 3, 3);
    }
  }
}
