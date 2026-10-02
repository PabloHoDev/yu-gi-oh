import { describe, expect, it } from 'vitest';
import { runAiStep } from './ai';
import { buildDeck } from './cards';
import { Duel, DuelError, type DuelOptions, tributesRequired } from './engine';
import { mulberry32 } from './rng';
import type { MonsterCard } from './types';

function monster(name: string, level: number, atk: number, def: number): MonsterCard {
  return {
    id: name.toLowerCase(),
    passcode: 1,
    name,
    nameEn: name,
    text: '',
    kind: 'monster',
    frame: 'normal',
    level,
    atk,
    def,
    attribute: 'EARTH',
    type: 'Warrior',
    abilities: [],
  };
}

const FILLER = monster('Filler', 4, 500, 500);

/** Duelo sem mão inicial em que cada jogador compra exatamente as cartas dadas, na ordem. */
function duelWith(draws0: MonsterCard[], draws1: MonsterCard[], options: DuelOptions = {}): Duel {
  const deck = (draws: MonsterCard[]) => [...draws, FILLER, FILLER, FILLER, FILLER, FILLER].reverse();
  const duel = new Duel(
    [
      { name: 'P0', deck: deck(draws0) },
      { name: 'P1', deck: deck(draws1) },
    ],
    { startingHand: 0, shuffleDecks: false, ...options },
  );
  duel.start();
  return duel;
}

describe('início do duelo', () => {
  it('distribui a mão inicial e o primeiro jogador compra uma carta', () => {
    const duel = new Duel(
      [
        { name: 'P0', deck: buildDeck('starter') },
        { name: 'P1', deck: buildDeck('obeliskStudent') },
      ],
      { rng: mulberry32(1) },
    );
    const events = duel.start();

    expect(duel.turn).toBe(1);
    expect(duel.players[0].hand).toHaveLength(6);
    expect(duel.players[1].hand).toHaveLength(5);
    expect(duel.players[0].deck).toHaveLength(34);
    expect(events.map((event) => event.type)).toEqual(['turnStart', 'draw']);
  });

  it('proíbe a Fase de Batalha no primeiro turno', () => {
    const duel = duelWith([FILLER], [FILLER]);
    expect(() => duel.enterBattlePhase()).toThrow(DuelError);
  });
});

describe('invocação', () => {
  it('permite só uma Invocação-Normal por turno', () => {
    const duel = duelWith([FILLER, FILLER], [FILLER]);
    duel.normalSummon(0, 'attack');
    duel.endTurn();
    duel.endTurn();
    duel.normalSummon(0, 'attack');
    expect(duel.players[0].hand).toHaveLength(0);
    expect(duel.zonesWhere(0, () => true)).toEqual([0, 1]);

    const again = duelWith([FILLER], [FILLER], { startingHand: 2 });
    again.normalSummon(0, 'attack');
    expect(() => again.normalSummon(0, 'attack')).toThrow('já invocou');
  });

  it('exige tributos conforme o nível', () => {
    expect(tributesRequired(monster('L4', 4, 0, 0))).toBe(0);
    expect(tributesRequired(monster('L5', 5, 0, 0))).toBe(1);
    expect(tributesRequired(monster('L6', 6, 0, 0))).toBe(1);
    expect(tributesRequired(monster('L7', 7, 0, 0))).toBe(2);

    const skull = monster('Skull', 6, 2500, 1200);
    const duel = duelWith([FILLER, skull], [FILLER]);
    duel.normalSummon(0, 'attack');
    duel.endTurn();
    duel.endTurn();

    expect(() => duel.normalSummon(0, 'attack')).toThrow('1 tributo');
    duel.normalSummon(0, 'attack', [0]);
    expect(duel.players[0].monsters[0]?.card).toBe(skull);
    expect(duel.players[0].graveyard).toEqual([FILLER]);
  });

  it('baixa o monstro virado para baixo em defesa', () => {
    const duel = duelWith([FILLER], [FILLER]);
    duel.normalSummon(0, 'set');
    expect(duel.players[0].monsters[0]).toMatchObject({ faceDown: true, position: 'defense' });
  });
});

describe('posição de batalha', () => {
  it('não muda no turno em que o monstro entrou, e vira o baixado para cima depois', () => {
    const duel = duelWith([FILLER], [FILLER]);
    duel.normalSummon(0, 'set');
    expect(() => duel.changePosition(0)).toThrow(DuelError);
    duel.endTurn();
    duel.endTurn();

    const events = duel.changePosition(0);
    expect(events[0]?.type).toBe('flipSummon');
    expect(duel.players[0].monsters[0]).toMatchObject({ faceDown: false, position: 'attack' });
    expect(() => duel.changePosition(0)).toThrow('já mudou');
  });
});

describe('batalha', () => {
  const strong = monster('Strong', 4, 1800, 1000);
  const weak = monster('Weak', 4, 1500, 2000);

  /** P0 tem `mine` em ataque; P1 tem `theirs` no modo dado; é a Fase de Batalha de P0 no turno 3. */
  function battle(mine: MonsterCard, theirs: MonsterCard, mode: 'attack' | 'set'): Duel {
    const duel = duelWith([mine], [theirs]);
    duel.normalSummon(0, 'attack');
    duel.endTurn();
    duel.normalSummon(0, mode);
    duel.endTurn();
    duel.enterBattlePhase();
    return duel;
  }

  it('ataque contra ataque: o mais fraco é destruído e o dono leva a diferença', () => {
    const duel = battle(strong, weak, 'attack');
    duel.attack(0, 0);
    expect(duel.players[1].monsters[0]).toBeNull();
    expect(duel.players[1].lp).toBe(7700);
    expect(duel.players[0].monsters[0]).not.toBeNull();
    expect(duel.players[0].lp).toBe(8000);
  });

  it('atacar um monstro mais forte destrói o atacante', () => {
    const duel = battle(weak, strong, 'attack');
    duel.attack(0, 0);
    expect(duel.players[0].monsters[0]).toBeNull();
    expect(duel.players[0].lp).toBe(7700);
    expect(duel.players[1].monsters[0]).not.toBeNull();
  });

  it('empate em ataque destrói os dois sem dano', () => {
    const duel = battle(strong, strong, 'attack');
    duel.attack(0, 0);
    expect(duel.players[0].monsters[0]).toBeNull();
    expect(duel.players[1].monsters[0]).toBeNull();
    expect(duel.players.map((player) => player.lp)).toEqual([8000, 8000]);
  });

  it('ataque contra defesa maior: ninguém é destruído, o atacante leva o dano e a carta é revelada', () => {
    const duel = battle(strong, weak, 'set');
    const events = duel.attack(0, 0);
    expect(events[0]).toMatchObject({ type: 'attack', targetWasFaceDown: true });
    expect(duel.players[0].lp).toBe(7800);
    expect(duel.players[0].monsters[0]).not.toBeNull();
    expect(duel.players[1].monsters[0]).toMatchObject({ faceDown: false, position: 'defense' });
  });

  it('ataque contra defesa menor destrói sem causar dano', () => {
    const duel = battle(strong, strong, 'set');
    duel.attack(0, 0);
    expect(duel.players[1].monsters[0]).toBeNull();
    expect(duel.players[1].lp).toBe(8000);
  });

  it('cada monstro ataca uma vez por turno e não ataca direto se há monstros', () => {
    const duel = battle(strong, weak, 'set');
    expect(() => duel.attack(0, null)).toThrow('diretamente');
    duel.attack(0, 0);
    expect(() => duel.attack(0, 0)).toThrow('já atacou');
  });

  it('ataque direto zera os LP e encerra o duelo', () => {
    const duel = duelWith([strong], [FILLER], { startingLP: 1800 });
    duel.normalSummon(0, 'attack');
    duel.endTurn();
    duel.endTurn();
    duel.enterBattlePhase();
    const events = duel.attack(0, null);

    expect(duel.players[1].lp).toBe(0);
    expect(duel.winner).toBe(0);
    expect(events.at(-1)).toEqual({ type: 'win', player: 0, reason: 'lp' });
    expect(() => duel.endTurn()).toThrow('já terminou');
  });
});

describe('fim por falta de cartas', () => {
  it('perde quem precisa comprar com o deck vazio', () => {
    const duel = new Duel(
      [
        { name: 'P0', deck: [FILLER] },
        { name: 'P1', deck: [FILLER] },
      ],
      { startingHand: 0, shuffleDecks: false },
    );
    duel.start();
    duel.endTurn();
    const events = duel.endTurn();
    expect(duel.winner).toBe(1);
    expect(events.at(-1)).toEqual({ type: 'win', player: 1, reason: 'deckout' });
  });
});

describe('IA', () => {
  it('joga um duelo inteiro contra si mesma sem jogadas ilegais', () => {
    for (let seed = 1; seed <= 25; seed++) {
      const duel = new Duel(
        [
          { name: 'P0', deck: buildDeck('starter') },
          { name: 'P1', deck: buildDeck('obeliskStudent') },
        ],
        { rng: mulberry32(seed), startingLP: 4000 },
      );
      duel.start();

      let steps = 0;
      while (duel.winner === null) {
        runAiStep(duel);
        expect(++steps).toBeLessThan(2000);
      }
      expect(duel.players[duel.winner === 0 ? 1 : 0].lp === 0 || duel.players.some((p) => p.deck.length === 0)).toBe(
        true,
      );
    }
  });
});
