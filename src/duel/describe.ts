import type { DuelEvent, PlayerId } from './types';

/**
 * Narra um evento do duelo do ponto de vista de `viewer`.
 * Devolve null para eventos que não merecem uma caixa de texto.
 */
export function describeEvent(event: DuelEvent, viewer: PlayerId, names: readonly [string, string]): string | null {
  const mine = event.player === viewer;
  const who = mine ? 'Você' : names[event.player];

  switch (event.type) {
    case 'turnStart':
      return mine ? `Turno ${event.turn}: sua vez!` : `Turno ${event.turn}: vez de ${who}.`;
    case 'draw':
      return mine ? `Você comprou ${event.card.name}.` : `${who} comprou uma carta.`;
    case 'phase':
      return event.phase === 'battle' ? `${who} ${mine ? 'entrou' : 'entra'} na Fase de Batalha!` : null;
    case 'summon':
      return `${who} ${tributeText(event.tributes.length)}invocou ${event.card.name} em ataque!`;
    case 'set':
      return mine
        ? `Você ${tributeText(event.tributes.length)}baixou ${event.card.name} em defesa.`
        : `${who} ${tributeText(event.tributes.length)}baixou um monstro.`;
    case 'positionChange':
      return `${event.card.name} passou para ${event.position === 'attack' ? 'ataque' : 'defesa'}.`;
    case 'flipSummon':
      return `${who} virou ${event.card.name} para cima em ataque!`;
    case 'attack':
      if (!event.target) return `${event.attacker.name} ataca diretamente!`;
      return event.targetWasFaceDown
        ? `${event.attacker.name} ataca a carta baixada! Era ${event.target.name}.`
        : `${event.attacker.name} ataca ${event.target.name}!`;
    case 'destroy':
      return `${event.card.name} foi destruído.`;
    case 'damage':
      return mine ? `Você perdeu ${event.amount} LP.` : `${who} perdeu ${event.amount} LP.`;
    case 'win':
      if (event.reason === 'deckout') {
        return mine ? 'O deck do oponente acabou. Você venceu o duelo!' : 'Seu deck acabou. Você perdeu o duelo...';
      }
      return mine ? 'Você venceu o duelo!' : 'Você perdeu o duelo...';
  }
}

function tributeText(count: number): string {
  if (count === 0) return '';
  return count === 1 ? 'tributou 1 monstro e ' : `tributou ${count} monstros e `;
}

export function describeEvents(
  events: readonly DuelEvent[],
  viewer: PlayerId,
  names: readonly [string, string],
): string[] {
  return events.map((event) => describeEvent(event, viewer, names)).filter((text): text is string => text !== null);
}
