import Phaser from 'phaser';
import { BOX_CHARS, BOX_HEIGHT, BOX_LINES, BOX_PADDING, BOX_Y, GAME_WIDTH } from '../config';
import { pickTributes, runAiStep } from '../duel/ai';
import { buildDeck, DECKS } from '../duel/cards';
import { describeEvents } from '../duel/describe';
import { Duel, DuelError, MONSTER_ZONES, tributesRequired, type SummonMode } from '../duel/engine';
import type { Attribute, DuelEvent, FieldMonster, Phase, PlayerId } from '../duel/types';
import { Controls } from '../input/Controls';
import { drawPanel, makeText } from '../ui/panel';
import { paginate, truncate } from '../ui/text';
import type { Direction, NpcDuel } from '../world/maps';

export interface DuelSceneData {
  npcId: string;
  opponent: NpcDuel;
}

export interface DuelSceneResult {
  npcId: string;
  won: boolean;
}

const HUMAN: PlayerId = 0;
const RIVAL: PlayerId = 1;

const ZONE_SPACING = 34;
const ZONE_FIRST_X = GAME_WIDTH / 2 - ZONE_SPACING * 2;
/** Centro vertical da fileira de monstros de cada jogador (humano embaixo, rival em cima). */
const ROW_Y: Readonly<Record<PlayerId, number>> = { 0: 67, 1: 25 };
const INFO_Y: Readonly<Record<PlayerId, number>> = { 0: 98, 1: 2 };

const ATTRIBUTE_COLOR: Readonly<Record<Attribute, number>> = {
  DARK: 0x7048a8,
  EARTH: 0x987848,
  FIRE: 0xe05030,
  LIGHT: 0xf8e870,
  WATER: 0x4088e0,
  WIND: 0x58c078,
};

const PHASE_LABEL: Readonly<Record<Phase, string>> = {
  main1: 'FASE PRINCIPAL 1',
  battle: 'FASE DE BATALHA',
  main2: 'FASE PRINCIPAL 2',
};

const MENU = ['INVOCAR', 'ATACAR', 'POSIÇÃO', 'ENCERRAR'] as const;

type UiState =
  | { kind: 'messages'; pages: string[]; index: number; then: () => void }
  | { kind: 'menu'; index: number }
  | { kind: 'hand'; index: number }
  | { kind: 'summonMode'; handIndex: number; tributes: number[]; index: number }
  | { kind: 'pickAttacker'; zones: number[]; index: number }
  | { kind: 'pickTarget'; attacker: number; zones: number[]; index: number }
  | { kind: 'pickPosition'; zones: number[]; index: number }
  | { kind: 'closing' };

/**
 * Tela de duelo. Só desenha o estado de `Duel` e traduz botões em jogadas;
 * nenhuma regra do jogo mora aqui.
 */
export class DuelScene extends Phaser.Scene {
  private controls!: Controls;
  private duel!: Duel;
  private names!: readonly [string, string];
  private npcId = '';
  private state: UiState = { kind: 'closing' };

  private field!: Phaser.GameObjects.Graphics;
  private boxText!: Phaser.GameObjects.Text;
  private infoTexts!: Record<PlayerId, Phaser.GameObjects.Text>;
  private valueTexts!: Record<PlayerId, Phaser.GameObjects.Text[]>;

  constructor() {
    super('Duel');
  }

  create(data: DuelSceneData): void {
    this.npcId = data.npcId;
    this.names = ['VOCÊ', data.opponent.name];
    this.duel = new Duel(
      [
        { name: this.names[0], deck: buildDeck(DECKS.starter) },
        { name: this.names[1], deck: buildDeck(DECKS[data.opponent.deck]) },
      ],
      { startingLP: data.opponent.startingLP },
    );
    this.controls = new Controls(this);

    this.field = this.add.graphics();
    const box = this.add.graphics();
    drawPanel(box, 0, BOX_Y, GAME_WIDTH, BOX_HEIGHT);
    this.boxText = makeText(this, BOX_PADDING, BOX_Y + BOX_PADDING);

    const zoneTexts = (player: PlayerId) =>
      Array.from({ length: MONSTER_ZONES }, (_, zone) =>
        makeText(this, zoneX(zone), ROW_Y[player] + 15, '', '#f8f8f8').setOrigin(0.5, 0),
      );
    this.infoTexts = {
      0: makeText(this, 4, INFO_Y[0], '', '#f8f8f8'),
      1: makeText(this, 4, INFO_Y[1], '', '#f8f8f8'),
    };
    this.valueTexts = { 0: zoneTexts(HUMAN), 1: zoneTexts(RIVAL) };

    const opening = this.duel.start();
    this.say(['Duelo!', ...this.describe(opening)], () => this.openMenu());
    this.cameras.main.fadeIn(300);
  }

  update(): void {
    const confirm = this.controls.justConfirm();
    const cancel = this.controls.justCancel();
    const direction = this.controls.justDirection();
    const state = this.state;

    switch (state.kind) {
      case 'messages':
        if (!confirm) return;
        state.index += 1;
        if (state.index >= state.pages.length) state.then();
        else this.render();
        return;

      case 'menu':
        if (direction) {
          // Menu 2x2: esquerda/direita troca de coluna, cima/baixo troca de linha.
          state.index ^= direction === 'left' || direction === 'right' ? 1 : 2;
          this.render();
        } else if (confirm) {
          this.chooseMenu(state.index);
        }
        return;

      case 'hand': {
        const hand = this.duel.players[HUMAN].hand;
        if (cancel) this.openMenu(0);
        else if (confirm) this.chooseHandCard(state.index);
        else if (this.cycle(state, direction, hand.length)) this.render();
        return;
      }

      case 'summonMode':
        if (cancel) this.setState({ kind: 'hand', index: state.handIndex });
        else if (confirm) this.summon(state.handIndex, state.index === 0 ? 'attack' : 'set', state.tributes);
        else if (this.cycle(state, direction, 2)) this.render();
        return;

      case 'pickAttacker':
        if (cancel) this.openMenu(1);
        else if (confirm) this.chooseAttacker(state.zones[state.index] as number);
        else if (this.cycle(state, direction, state.zones.length)) this.render();
        return;

      case 'pickTarget':
        if (cancel) this.chooseMenu(1);
        else if (confirm) this.attack(state.attacker, state.zones[state.index] as number);
        else if (this.cycle(state, direction, state.zones.length)) this.render();
        return;

      case 'pickPosition':
        if (cancel) this.openMenu(2);
        else if (confirm) this.changePosition(state.zones[state.index] as number);
        else if (this.cycle(state, direction, state.zones.length)) this.render();
        return;

      case 'closing':
        return;
    }
  }

  // ---------------------------------------------------------------- jogadas

  private chooseMenu(index: number): void {
    const duel = this.duel;
    const back = () => this.openMenu(index);

    switch (MENU[index]) {
      case 'INVOCAR':
        if (duel.players[HUMAN].normalSummonUsed) this.say(['Você já invocou neste turno.'], back);
        else if (duel.players[HUMAN].hand.length === 0) this.say(['Sua mão está vazia.'], back);
        else this.setState({ kind: 'hand', index: 0 });
        return;

      case 'ATACAR': {
        if (duel.turn === 1) return this.say(['Não se pode atacar no primeiro turno do duelo.'], back);
        if (duel.phase === 'main2') return this.say(['A Fase de Batalha deste turno já acabou.'], back);
        const zones = duel.attackerZones();
        if (zones.length === 0) return this.say(['Nenhum monstro seu pode atacar agora.'], back);
        this.setState({ kind: 'pickAttacker', zones, index: 0 });
        return;
      }

      case 'POSIÇÃO': {
        const zones = duel.repositionZones();
        if (zones.length === 0) return this.say(['Nenhum monstro seu pode mudar de posição agora.'], back);
        this.setState({ kind: 'pickPosition', zones, index: 0 });
        return;
      }

      case 'ENCERRAR':
        this.perform(() => duel.endTurn());
        return;
    }
  }

  private chooseHandCard(handIndex: number): void {
    const card = this.duel.players[HUMAN].hand[handIndex];
    if (!card) return;
    const required = tributesRequired(card);
    // Protótipo: os tributos são sempre os monstros mais fracos do jogador.
    const tributes = pickTributes(this.duel, HUMAN, required);
    if (!tributes) {
      this.say([`${card.name} é nível ${card.level}: precisa de ${required} tributo(s).`], () =>
        this.setState({ kind: 'hand', index: handIndex }),
      );
      return;
    }
    this.setState({ kind: 'summonMode', handIndex, tributes, index: 0 });
  }

  private summon(handIndex: number, mode: SummonMode, tributes: number[]): void {
    this.perform(() => [...this.leaveBattlePhase(), ...this.duel.normalSummon(handIndex, mode, tributes)]);
  }

  private changePosition(zone: number): void {
    this.perform(() => [...this.leaveBattlePhase(), ...this.duel.changePosition(zone)]);
  }

  private chooseAttacker(attacker: number): void {
    const zones = this.duel.targetZones();
    if (zones.length === 0) this.attack(attacker, null);
    else this.setState({ kind: 'pickTarget', attacker, zones, index: 0 });
  }

  private attack(attacker: number, target: number | null): void {
    this.perform(() => {
      const entering = this.duel.phase === 'main1' ? this.duel.enterBattlePhase() : [];
      return [...entering, ...this.duel.attack(attacker, target)];
    });
  }

  /** Invocar ou mudar posição depois de atacar leva o turno para a Fase Principal 2. */
  private leaveBattlePhase(): DuelEvent[] {
    return this.duel.phase === 'battle' ? this.duel.enterMainPhase2() : [];
  }

  /** Executa uma jogada do jogador, narra o resultado e decide quem age em seguida. */
  private perform(action: () => DuelEvent[]): void {
    let events: DuelEvent[];
    try {
      events = action();
    } catch (error) {
      if (!(error instanceof DuelError)) throw error;
      this.say([error.message], () => this.openMenu());
      return;
    }
    this.narrate(events);
  }

  private runAi(): void {
    this.narrate(runAiStep(this.duel).events);
  }

  private narrate(events: DuelEvent[]): void {
    if (events.some((event) => event.type === 'damage' && event.player === HUMAN)) {
      this.cameras.main.shake(200, 0.01);
    }
    this.say(this.describe(events), () => {
      if (this.duel.winner !== null) this.finish();
      else if (this.duel.active === HUMAN) this.openMenu();
      else this.runAi();
    });
  }

  private finish(): void {
    this.setState({ kind: 'closing' });
    const camera = this.cameras.main;
    camera.fadeOut(400);
    camera.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      const result: DuelSceneResult = { npcId: this.npcId, won: this.duel.winner === HUMAN };
      this.scene.wake('Overworld', result);
      this.scene.stop();
    });
  }

  // ------------------------------------------------------------- interface

  private describe(events: DuelEvent[]): string[] {
    return describeEvents(events, HUMAN, this.names);
  }

  private say(messages: string[], then: () => void): void {
    const pages = messages.flatMap((message) => paginate(message, BOX_CHARS, BOX_LINES));
    if (pages.length === 0) {
      this.render();
      then();
      return;
    }
    this.setState({ kind: 'messages', pages, index: 0, then });
  }

  private openMenu(index = 0): void {
    this.setState({ kind: 'menu', index });
  }

  private setState(state: UiState): void {
    this.state = state;
    this.render();
  }

  /** Move o cursor de uma lista com esquerda/direita (ou cima/baixo). Devolve se mudou. */
  private cycle(state: { index: number }, direction: Direction | null, length: number): boolean {
    if (!direction || length < 2) return false;
    const step = direction === 'right' || direction === 'down' ? 1 : -1;
    state.index = (state.index + step + length) % length;
    return true;
  }

  private render(): void {
    this.drawField();
    this.boxText.setText(this.boxContent());
  }

  private boxContent(): string {
    const state = this.state;
    const duel = this.duel;
    const cursor = (selected: boolean) => (selected ? '>' : ' ');
    const stats = (monster: FieldMonster) => `ATK${monster.card.atk} DEF${monster.card.def}`;

    switch (state.kind) {
      case 'messages':
        return state.pages[state.index] ?? '';

      case 'menu': {
        const option = (i: number) => `${cursor(state.index === i)}${(MENU[i] as string).padEnd(11)}`;
        return `${option(0)}${option(1)}\n${option(2)}${option(3)}\n TURNO ${duel.turn} ${PHASE_LABEL[duel.phase]}`;
      }

      case 'hand': {
        const hand = duel.players[HUMAN].hand;
        const card = hand[state.index];
        if (!card) return '';
        return [
          truncate(card.name, BOX_CHARS),
          `N${card.level} ATK${card.atk} DEF${card.def}`,
          `< ${state.index + 1}/${hand.length} >  Z:OK  X:VOLTA`,
        ].join('\n');
      }

      case 'summonMode': {
        const card = duel.players[HUMAN].hand[state.handIndex];
        const count = state.tributes.length;
        return [
          truncate(card?.name ?? '', BOX_CHARS),
          `${cursor(state.index === 0)}ATAQUE     ${cursor(state.index === 1)}BAIXAR`,
          count > 0 ? `Tributa ${count} monstro(s)` : '',
        ].join('\n');
      }

      case 'pickAttacker': {
        const monster = duel.players[HUMAN].monsters[state.zones[state.index] as number];
        return monster ? `${truncate(monster.card.name, BOX_CHARS)}\n${stats(monster)}\nQuem vai atacar?` : '';
      }

      case 'pickTarget': {
        const monster = duel.players[RIVAL].monsters[state.zones[state.index] as number];
        if (!monster) return '';
        if (monster.faceDown) return 'Carta baixada\n???\nAtacar qual monstro?';
        return `${truncate(monster.card.name, BOX_CHARS)}\n${stats(monster)}\nAtacar qual monstro?`;
      }

      case 'pickPosition': {
        const monster = duel.players[HUMAN].monsters[state.zones[state.index] as number];
        if (!monster) return '';
        const target = monster.faceDown || monster.position === 'defense' ? 'ATAQUE' : 'DEFESA';
        return `${truncate(monster.card.name, BOX_CHARS)}\n${stats(monster)}\nMudar para ${target}?`;
      }

      case 'closing':
        return '';
    }
  }

  /** Zona destacada pelo cursor no estado atual, se houver. */
  private selectedZone(): { player: PlayerId; zone: number } | null {
    const state = this.state;
    switch (state.kind) {
      case 'pickAttacker':
      case 'pickPosition':
        return { player: HUMAN, zone: state.zones[state.index] as number };
      case 'pickTarget':
        return { player: RIVAL, zone: state.zones[state.index] as number };
      default:
        return null;
    }
  }

  private drawField(): void {
    const g = this.field;
    g.clear();
    g.fillStyle(0x205040).fillRect(0, 0, GAME_WIDTH, BOX_Y);
    g.fillStyle(0x183830).fillRect(0, 0, GAME_WIDTH, 11);
    g.fillStyle(0x183830).fillRect(0, 96, GAME_WIDTH, BOX_Y - 96);
    g.fillStyle(0x70a888).fillRect(0, 50, GAME_WIDTH, 1);

    const selected = this.selectedZone();
    for (const player of [HUMAN, RIVAL]) {
      const state = this.duel.players[player];
      this.infoTexts[player].setText(`${state.name} LP${state.lp} MÃO${state.hand.length} DK${state.deck.length}`);

      state.monsters.forEach((monster, zone) => {
        const x = zoneX(zone);
        const y = ROW_Y[player];
        g.fillStyle(0x184030).fillRect(x - 14, y - 14, 28, 28);
        if (selected?.player === player && selected.zone === zone) {
          g.lineStyle(2, 0xf8d840).strokeRect(x - 15, y - 15, 30, 30);
        }

        const label = this.valueTexts[player][zone] as Phaser.GameObjects.Text;
        if (!monster) {
          label.setText('');
          return;
        }
        drawCard(g, x, y, monster);
        if (monster.faceDown) {
          // O valor da própria carta baixada continua visível para o dono.
          label.setText(player === HUMAN ? `${monster.card.def}` : '????').setColor('#a8c0b8');
        } else if (monster.position === 'attack') {
          label.setText(`${monster.card.atk}`).setColor('#f8f8f8');
        } else {
          label.setText(`${monster.card.def}`).setColor('#88c8f8');
        }
      });
    }
  }
}

function zoneX(zone: number): number {
  return ZONE_FIRST_X + zone * ZONE_SPACING;
}

/** Carta em pé = ataque; deitada = defesa; verso marrom = virada para baixo. */
function drawCard(g: Phaser.GameObjects.Graphics, x: number, y: number, monster: FieldMonster): void {
  const upright = monster.position === 'attack';
  const width = upright ? 20 : 26;
  const height = upright ? 26 : 20;
  const left = x - width / 2;
  const top = y - height / 2;

  g.fillStyle(0x281808).fillRect(left, top, width, height);
  if (monster.faceDown) {
    g.fillStyle(0x985828).fillRect(left + 1, top + 1, width - 2, height - 2);
    g.fillStyle(0x603010).fillRect(left + 4, top + 4, width - 8, height - 8);
    g.fillStyle(0xd89040).fillRect(x - 3, y - 3, 6, 6);
    return;
  }
  // Moldura amarela de Monstro Normal, com a "ilustração" na cor do atributo.
  g.fillStyle(0xd8b050).fillRect(left + 1, top + 1, width - 2, height - 2);
  g.fillStyle(ATTRIBUTE_COLOR[monster.card.attribute]);
  if (upright) {
    g.fillRect(left + 3, top + 4, width - 6, 12);
    g.fillStyle(0xf0e0b0).fillRect(left + 3, top + 18, width - 6, 5);
  } else {
    g.fillRect(left + 4, top + 3, 12, height - 6);
    g.fillStyle(0xf0e0b0).fillRect(left + 18, top + 3, 5, height - 6);
  }
}
