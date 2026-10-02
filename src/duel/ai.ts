import { type Duel, type SummonMode, tributesRequired } from './engine';
import type { DuelEvent, FieldMonster, PlayerId } from './types';

/** Ataque mínimo para a IA arriscar atacar uma carta baixada. */
const BLIND_ATTACK_MIN_ATK = 1500;

export interface AiStep {
  events: DuelEvent[];
  /** Verdadeiro quando a IA encerrou o turno (ou o duelo acabou). */
  done: boolean;
}

/** Zonas dos `count` monstros mais fracos do jogador, ou null se ele não tem monstros suficientes. */
export function pickTributes(duel: Duel, player: PlayerId, count: number): number[] | null {
  const zones = duel
    .zonesWhere(player, () => true)
    .sort((a, b) => monsterAt(duel, player, a).card.atk - monsterAt(duel, player, b).card.atk);
  return zones.length >= count ? zones.slice(0, count) : null;
}

/**
 * IA gulosa: executa UMA jogada do jogador da vez por chamada, para a
 * interface poder narrar cada passo. Chame até `done` ser verdadeiro.
 */
export function runAiStep(duel: Duel): AiStep {
  if (duel.winner !== null) return { events: [], done: true };

  if (duel.phase === 'main1') {
    const summon = pickSummon(duel);
    if (summon) return { events: duel.normalSummon(summon.handIndex, summon.mode, summon.tributes), done: false };

    const reposition = pickReposition(duel);
    if (reposition !== null) return { events: duel.changePosition(reposition), done: false };

    if (duel.turn > 1 && pickAttack(duel)) return { events: duel.enterBattlePhase(), done: false };
    return { events: duel.endTurn(), done: true };
  }

  if (duel.phase === 'battle') {
    const attack = pickAttack(duel);
    if (attack) return { events: duel.attack(attack.attacker, attack.target), done: false };
  }
  return { events: duel.endTurn(), done: true };
}

function monsterAt(duel: Duel, player: PlayerId, zone: number): FieldMonster {
  return duel.players[player].monsters[zone] as FieldMonster;
}

/** Maior ATK entre os monstros virados para cima em ataque do oponente (0 se não houver). */
function strongestThreat(duel: Duel): number {
  const zones = duel.zonesWhere(duel.opponent, (m) => !m.faceDown && m.position === 'attack');
  return Math.max(0, ...zones.map((zone) => monsterAt(duel, duel.opponent, zone).card.atk));
}

function pickSummon(duel: Duel): { handIndex: number; mode: SummonMode; tributes: number[] } | null {
  const me = duel.players[duel.active];
  if (me.normalSummonUsed) return null;
  const threat = strongestThreat(duel);

  const byAtk = me.hand.map((card, handIndex) => ({ card, handIndex })).sort((a, b) => b.card.atk - a.card.atk);
  for (const { card, handIndex } of byAtk) {
    const required = tributesRequired(card);
    const tributes = pickTributes(duel, duel.active, required);
    if (!tributes) continue;
    if (required === 0 && !me.monsters.includes(null)) continue;
    // Tributar só vale a pena se o monstro novo for mais forte que os sacrificados.
    if (tributes.some((zone) => monsterAt(duel, duel.active, zone).card.atk >= card.atk)) continue;

    const mode: SummonMode = card.atk >= threat ? 'attack' : 'set';
    return { handIndex, mode, tributes };
  }
  return null;
}

/** Passa para ataque um monstro em defesa que já supera a maior ameaça do oponente. */
function pickReposition(duel: Duel): number | null {
  const threat = strongestThreat(duel);
  const zones = duel.repositionZones().filter((zone) => {
    const monster = monsterAt(duel, duel.active, zone);
    return monster.position === 'defense' && monster.card.atk > threat && monster.card.atk > 0;
  });
  return zones[0] ?? null;
}

function pickAttack(duel: Duel): { attacker: number; target: number | null } | null {
  const targets = duel.targetZones();
  for (const attacker of duel.attackerZones()) {
    if (targets.length === 0) return { attacker, target: null };
    const atk = monsterAt(duel, duel.active, attacker).card.atk;

    let best: { zone: number; score: number } | null = null;
    for (const zone of targets) {
      const target = monsterAt(duel, duel.opponent, zone);
      let score: number;
      if (target.faceDown) {
        if (atk < BLIND_ATTACK_MIN_ATK) continue;
        score = 0;
      } else if (target.position === 'attack') {
        if (target.card.atk >= atk) continue;
        // Destruir em ataque também causa dano: prioridade máxima.
        score = 10000 + target.card.atk;
      } else {
        if (target.card.def >= atk) continue;
        score = 1 + target.card.def;
      }
      if (!best || score > best.score) best = { zone, score };
    }
    if (best) return { attacker, target: best.zone };
  }
  return null;
}
