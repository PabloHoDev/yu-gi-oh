import { z } from 'zod';

/**
 * Formato de uma carta em data/cards/cards.json. É a fonte da verdade dos tipos
 * de carta: o script de importação grava neste formato e os testes validam o
 * arquivo contra ele.
 *
 * O jogo importa daqui apenas tipos (`import type`), para o Zod não entrar no
 * pacote final enquanto não for necessário em tempo de execução.
 */

export const ATTRIBUTES = ['DARK', 'DIVINE', 'EARTH', 'FIRE', 'LIGHT', 'WATER', 'WIND'] as const;
export const MONSTER_FRAMES = ['normal', 'effect', 'fusion', 'ritual'] as const;
export const SPELL_TYPES = ['normal', 'quick-play', 'continuous', 'equip', 'field', 'ritual'] as const;
export const TRAP_TYPES = ['normal', 'continuous', 'counter'] as const;

const base = {
  /** Identificador estável usado em decks e saves: o nome em inglês em minúsculas com hifens. */
  id: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
  /** Código de 8 dígitos impresso na carta. */
  passcode: z.number().int().positive(),
  /** Nome exibido no jogo (português quando existe tradução oficial). */
  name: z.string().min(1),
  nameEn: z.string().min(1),
  text: z.string(),
  archetype: z.string().min(1).optional(),
};

export const monsterCardSchema = z.strictObject({
  ...base,
  kind: z.literal('monster'),
  frame: z.enum(MONSTER_FRAMES),
  level: z.number().int().min(1).max(12),
  /** Cartas com ATK ou DEF "?" guardam 0 aqui e marcam variableAtk/variableDef. */
  atk: z.number().int().min(0),
  def: z.number().int().min(0),
  variableAtk: z.literal(true).optional(),
  variableDef: z.literal(true).optional(),
  attribute: z.enum(ATTRIBUTES),
  /** Tipo do monstro como impresso na carta (Warrior, Dragon, Machine...). */
  type: z.string().min(1),
  /** Habilidades da linha de tipo além de Normal/Efeito/Fusão: Flip, Union, Toon, Spirit... */
  abilities: z.array(z.string().min(1)),
});

export const spellCardSchema = z.strictObject({
  ...base,
  kind: z.literal('spell'),
  spellType: z.enum(SPELL_TYPES),
});

export const trapCardSchema = z.strictObject({
  ...base,
  kind: z.literal('trap'),
  trapType: z.enum(TRAP_TYPES),
});

export const cardSchema = z.discriminatedUnion('kind', [monsterCardSchema, spellCardSchema, trapCardSchema]);
export const cardListSchema = z.array(cardSchema);

export type Attribute = (typeof ATTRIBUTES)[number];
export type MonsterCard = z.infer<typeof monsterCardSchema>;
export type SpellCard = z.infer<typeof spellCardSchema>;
export type TrapCard = z.infer<typeof trapCardSchema>;
export type AnyCard = z.infer<typeof cardSchema>;
