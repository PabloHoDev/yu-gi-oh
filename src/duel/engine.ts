import { type Rng, shuffle } from './rng';
import type { Card, DuelEvent, FieldMonster, MonsterCard, Phase, PlayerId, PlayerState } from './types';

export const MONSTER_ZONES = 5;

export interface DuelistSetup {
  name: string;
  /** O topo do deck é o fim do array. */
  deck: Card[];
}

export interface DuelOptions {
  startingLP?: number;
  startingHand?: number;
  firstPlayer?: PlayerId;
  rng?: Rng;
  shuffleDecks?: boolean;
}

export type SummonMode = 'attack' | 'set';

/** Jogada ilegal. A mensagem é mostrada ao jogador. */
export class DuelError extends Error {}

export function other(player: PlayerId): PlayerId {
  return player === 0 ? 1 : 0;
}

export function tributesRequired(card: MonsterCard): number {
  if (card.level >= 7) return 2;
  if (card.level >= 5) return 1;
  return 0;
}

/**
 * Motor de regras do duelo. Não conhece Phaser nem tela: recebe jogadas,
 * valida, altera o estado e devolve os eventos que aconteceram.
 *
 * Regras da era GX: quem começa compra no primeiro turno e não ataca nele.
 * Por enquanto só existem Monstros Normais (sem magias, armadilhas ou efeitos).
 */
export class Duel {
  readonly players: [PlayerState, PlayerState];
  turn = 0;
  active: PlayerId;
  phase: Phase = 'main1';
  winner: PlayerId | null = null;

  private readonly startingHand: number;

  constructor(duelists: readonly [DuelistSetup, DuelistSetup], options: DuelOptions = {}) {
    const { startingLP = 8000, startingHand = 5, firstPlayer = 0, rng = Math.random, shuffleDecks = true } = options;
    const setup = (duelist: DuelistSetup): PlayerState => ({
      name: duelist.name,
      lp: startingLP,
      deck: shuffleDecks ? shuffle(duelist.deck, rng) : [...duelist.deck],
      hand: [],
      monsters: Array.from({ length: MONSTER_ZONES }, () => null),
      graveyard: [],
      normalSummonUsed: false,
    });
    this.players = [setup(duelists[0]), setup(duelists[1])];
    this.active = firstPlayer;
    this.startingHand = startingHand;
  }

  get opponent(): PlayerId {
    return other(this.active);
  }

  /** Compra as mãos iniciais e abre o primeiro turno. */
  start(): DuelEvent[] {
    if (this.turn !== 0) throw new DuelError('O duelo já começou.');
    for (const player of this.players) {
      // splice(-0) removeria o deck inteiro.
      if (this.startingHand > 0) player.hand.push(...player.deck.splice(-this.startingHand).reverse());
    }
    return this.beginTurn();
  }

  normalSummon(handIndex: number, mode: SummonMode, tributeZones: readonly number[] = []): DuelEvent[] {
    this.assertMainPhase();
    const player = this.players[this.active];
    if (player.normalSummonUsed) throw new DuelError('Você já invocou neste turno.');
    const card = player.hand[handIndex];
    if (!card) throw new DuelError('Essa carta não está na mão.');

    const required = tributesRequired(card);
    if (new Set(tributeZones).size !== tributeZones.length || tributeZones.length !== required) {
      throw new DuelError(`${card.name} precisa de ${required} tributo(s).`);
    }
    if (tributeZones.some((zone) => !player.monsters[zone])) {
      throw new DuelError('Não há monstro para tributar nessa zona.');
    }
    if (required === 0 && !player.monsters.includes(null)) {
      throw new DuelError('Não há zona de monstro livre.');
    }

    const tributes: MonsterCard[] = [];
    for (const zone of tributeZones) {
      const tribute = player.monsters[zone] as FieldMonster;
      tributes.push(tribute.card);
      player.graveyard.push(tribute.card);
      player.monsters[zone] = null;
    }

    const zone = player.monsters.indexOf(null);
    player.hand.splice(handIndex, 1);
    player.monsters[zone] = {
      card,
      position: mode === 'attack' ? 'attack' : 'defense',
      faceDown: mode === 'set',
      summonedOnTurn: this.turn,
      hasAttacked: false,
      positionChanged: false,
    };
    player.normalSummonUsed = true;
    return [{ type: mode === 'attack' ? 'summon' : 'set', player: this.active, zone, card, tributes }];
  }

  /** Troca ataque/defesa; um monstro baixado é virado para cima em ataque (Invocação-Virar). */
  changePosition(zone: number): DuelEvent[] {
    this.assertMainPhase();
    const monster = this.players[this.active].monsters[zone];
    if (!monster) throw new DuelError('Não há monstro nessa zona.');
    if (monster.summonedOnTurn === this.turn) {
      throw new DuelError('Um monstro não muda de posição no turno em que entrou em campo.');
    }
    if (monster.positionChanged) throw new DuelError('Esse monstro já mudou de posição neste turno.');
    if (monster.hasAttacked) throw new DuelError('Esse monstro já atacou neste turno.');

    monster.positionChanged = true;
    if (monster.faceDown) {
      monster.faceDown = false;
      monster.position = 'attack';
      return [{ type: 'flipSummon', player: this.active, zone, card: monster.card }];
    }
    monster.position = monster.position === 'attack' ? 'defense' : 'attack';
    return [{ type: 'positionChange', player: this.active, zone, card: monster.card, position: monster.position }];
  }

  enterBattlePhase(): DuelEvent[] {
    this.assertRunning();
    if (this.phase !== 'main1') throw new DuelError('A Fase de Batalha só começa a partir da Fase Principal 1.');
    if (this.turn === 1) throw new DuelError('Não se pode atacar no primeiro turno do duelo.');
    this.phase = 'battle';
    return [{ type: 'phase', player: this.active, phase: 'battle' }];
  }

  enterMainPhase2(): DuelEvent[] {
    this.assertRunning();
    if (this.phase !== 'battle') throw new DuelError('A Fase Principal 2 vem depois da Fase de Batalha.');
    this.phase = 'main2';
    return [{ type: 'phase', player: this.active, phase: 'main2' }];
  }

  /** `targetZone` nulo é ataque direto, permitido só com o campo adversário vazio. */
  attack(attackerZone: number, targetZone: number | null): DuelEvent[] {
    this.assertRunning();
    if (this.phase !== 'battle') throw new DuelError('Só se ataca na Fase de Batalha.');
    const me = this.players[this.active];
    const opp = this.players[this.opponent];
    const attacker = me.monsters[attackerZone];
    if (!attacker) throw new DuelError('Não há monstro nessa zona.');
    if (attacker.faceDown || attacker.position !== 'attack') {
      throw new DuelError('Só monstros em Posição de Ataque podem atacar.');
    }
    if (attacker.hasAttacked) throw new DuelError('Esse monstro já atacou neste turno.');

    const events: DuelEvent[] = [];
    const atk = attacker.card.atk;

    if (targetZone === null) {
      if (opp.monsters.some((monster) => monster !== null)) {
        throw new DuelError('Não se ataca diretamente enquanto o oponente tem monstros.');
      }
      attacker.hasAttacked = true;
      events.push({
        type: 'attack',
        player: this.active,
        attacker: attacker.card,
        target: null,
        targetPosition: null,
        targetWasFaceDown: false,
      });
      this.damage(this.opponent, atk, events);
      return events;
    }

    const target = opp.monsters[targetZone];
    if (!target) throw new DuelError('Não há monstro para atacar nessa zona.');
    attacker.hasAttacked = true;
    const targetWasFaceDown = target.faceDown;
    target.faceDown = false;
    events.push({
      type: 'attack',
      player: this.active,
      attacker: attacker.card,
      target: target.card,
      targetPosition: target.position,
      targetWasFaceDown,
    });

    if (target.position === 'attack') {
      const diff = atk - target.card.atk;
      if (diff >= 0) this.destroy(this.opponent, targetZone, events);
      if (diff <= 0) this.destroy(this.active, attackerZone, events);
      if (diff > 0) this.damage(this.opponent, diff, events);
      if (diff < 0) this.damage(this.active, -diff, events);
    } else {
      const diff = atk - target.card.def;
      if (diff > 0) this.destroy(this.opponent, targetZone, events);
      if (diff < 0) this.damage(this.active, -diff, events);
    }
    return events;
  }

  endTurn(): DuelEvent[] {
    this.assertRunning();
    this.active = this.opponent;
    return this.beginTurn();
  }

  /** Zonas do jogador da vez com monstros que ainda podem atacar. */
  attackerZones(): number[] {
    return this.zonesWhere(this.active, (m) => !m.faceDown && m.position === 'attack' && !m.hasAttacked);
  }

  /** Zonas do oponente que podem ser alvo de ataque. */
  targetZones(): number[] {
    return this.zonesWhere(this.opponent, () => true);
  }

  /** Zonas do jogador da vez com monstros que ainda podem mudar de posição. */
  repositionZones(): number[] {
    return this.zonesWhere(this.active, (m) => m.summonedOnTurn !== this.turn && !m.positionChanged && !m.hasAttacked);
  }

  zonesWhere(player: PlayerId, predicate: (monster: FieldMonster) => boolean): number[] {
    const zones: number[] = [];
    this.players[player].monsters.forEach((monster, zone) => {
      if (monster && predicate(monster)) zones.push(zone);
    });
    return zones;
  }

  private beginTurn(): DuelEvent[] {
    this.turn += 1;
    this.phase = 'main1';
    const player = this.players[this.active];
    player.normalSummonUsed = false;
    for (const monster of player.monsters) {
      if (!monster) continue;
      monster.hasAttacked = false;
      monster.positionChanged = false;
    }

    const events: DuelEvent[] = [{ type: 'turnStart', player: this.active, turn: this.turn }];
    const card = player.deck.pop();
    if (!card) {
      this.winner = this.opponent;
      events.push({ type: 'win', player: this.winner, reason: 'deckout' });
      return events;
    }
    player.hand.push(card);
    events.push({ type: 'draw', player: this.active, card });
    return events;
  }

  private destroy(owner: PlayerId, zone: number, events: DuelEvent[]): void {
    const player = this.players[owner];
    const monster = player.monsters[zone];
    if (!monster) return;
    player.monsters[zone] = null;
    player.graveyard.push(monster.card);
    events.push({ type: 'destroy', player: owner, card: monster.card });
  }

  private damage(target: PlayerId, amount: number, events: DuelEvent[]): void {
    const player = this.players[target];
    player.lp = Math.max(0, player.lp - amount);
    events.push({ type: 'damage', player: target, amount });
    if (player.lp === 0 && this.winner === null) {
      this.winner = other(target);
      events.push({ type: 'win', player: this.winner, reason: 'lp' });
    }
  }

  private assertRunning(): void {
    if (this.turn === 0) throw new DuelError('O duelo ainda não começou.');
    if (this.winner !== null) throw new DuelError('O duelo já terminou.');
  }

  private assertMainPhase(): void {
    this.assertRunning();
    if (this.phase === 'battle') throw new DuelError('Isso só pode ser feito em uma Fase Principal.');
  }
}
