/**
 * Pixel art dos personagens do mapa, desenhada em texto: cada caractere é um
 * pixel e cada letra é uma cor da paleta do personagem ('.' é transparente).
 * Arte própria do projeto, no espírito dos uniformes da Academia de Duelos.
 */

export const CHARACTER_WIDTH = 16;
export const CHARACTER_HEIGHT = 24;

export type CharacterView = 'down' | 'up' | 'right';

/**
 * K contorno · H cabelo · h mecha clara · S pele · s sombra da pele · E olhos
 * J jaqueta · W gola/detalhe · T camisa · P calça · B sapato
 */
export interface CharacterPalette {
  K: string;
  H: string;
  h: string;
  S: string;
  s: string;
  E: string;
  J: string;
  W: string;
  T: string;
  P: string;
  B: string;
}

const HEAD_FRONT = [
  '................',
  '...KK.KKKK.KK...',
  '..KHHKHHHHKHHK..',
  '..KHHHHHHHHHHK..',
  '..KHhHHHHHHhHK..',
  '..KHHHHHHHHHHK..',
  '..KHHSHSSHSHHK..',
  '..KHSSSSSSSSHK..',
  '..KSSESSSSESSK..',
  '..KSSESSSSESSK..',
  '...KSSSSSSSSK...',
  '....KKSssSKK....',
];

const BODY_FRONT = [
  '...KJJWWWWJJK...',
  '..KJJJWTTWJJJK..',
  '..KJJJWTTWJJJK..',
  '..KJKJWTTWJKJK..',
  '..KSKJJTTJJKSK..',
  '...KKJJJJJJKK...',
];

const HEAD_BACK = [
  '................',
  '...KK.KKKK.KK...',
  '..KHHKHHHHKHHK..',
  '..KHHHHHHHHHHK..',
  '..KHhHHHHHHhHK..',
  '..KHHHHHHHHHHK..',
  '..KHHHHHHHHHHK..',
  '..KHHHHHHHHHHK..',
  '..KHHHHHHHHHHK..',
  '..KSHHHHHHHHSK..',
  '...KSHHHHHHSK...',
  '....KKSSSSKK....',
];

const BODY_BACK = [
  '...KJJJJJJJJK...',
  '..KJJJJJJJJJJK..',
  '..KJJJJJJJJJJK..',
  '..KJKJJJJJJKJK..',
  '..KSKJJJJJJKSK..',
  '...KKJJJJJJKK...',
];

const LEGS_STAND = [
  '....KPPPPPPK....',
  '....KPPKKPPK....',
  '....KPPKKPPK....',
  '....KPPKKPPK....',
  '....KBBKKBBK....',
  '....KKKKKKKK....',
];

/** Uma perna levantada; o outro passo é este frame espelhado. */
const LEGS_STEP = [
  '....KPPPPPPK....',
  '....KPPKKPPK....',
  '....KBBKKPPK....',
  '....KKKKKPPK....',
  '........KBBK....',
  '........KKKK....',
];

const UPPER_SIDE = [
  '................',
  '....KK.KKK.K....',
  '...KHHKHHHKHK...',
  '..KHHHHHHHHHK...',
  '..KHHhHHHHHHHK..',
  '..KHHHHHHHHHHK..',
  '..KHHHHHSSHSSK..',
  '..KHHHHSSSSSSK..',
  '..KHHHSSSSESSK..',
  '...KHHSSSSESSK..',
  '...KKSSSSSSSK...',
  '.....KKSssKK....',
  '....KJJJJWWK....',
  '....KJJJJJWTK...',
  '....KJJSJJWTK...',
  '....KJJSJJWTK...',
  '....KJJKJJJTK...',
  '....KKJJJJJKK...',
];

const LEGS_SIDE_STAND = [
  '.....KPPPPPK....',
  '.....KPPPPPK....',
  '.....KPPPPPK....',
  '.....KPPPPPK....',
  '.....KBBBBBBK...',
  '.....KKKKKKKK...',
];

const LEGS_SIDE_STEP = [
  '....KPPPPPPK....',
  '...KPPPKKPPPK...',
  '...KPPK..KPPK...',
  '..KPPK....KPPK..',
  '..KBBBK...KBBBK.',
  '..KKKKK...KKKKK.',
];

/** Linhas de pixels de um personagem parado (`step` falso) ou no meio do passo. */
export function characterRows(view: CharacterView, step: boolean): string[] {
  if (view === 'right') return [...UPPER_SIDE, ...(step ? LEGS_SIDE_STEP : LEGS_SIDE_STAND)];
  const legs = step ? LEGS_STEP : LEGS_STAND;
  return view === 'down' ? [...HEAD_FRONT, ...BODY_FRONT, ...legs] : [...HEAD_BACK, ...BODY_BACK, ...legs];
}

const SKIN = { S: '#f8d0a0', s: '#d8a070', E: '#282020', K: '#201818' };

export const CHARACTER_PALETTES = {
  /** Calouro do Slifer Vermelho: jaqueta vermelha aberta sobre camisa preta. */
  player: { ...SKIN, H: '#6b3a1e', h: '#c8843c', J: '#d02828', W: '#f8f8f8', T: '#282830', P: '#d8dce8', B: '#a02020' },
  npcRed: { ...SKIN, H: '#68b8e8', h: '#b8e8f8', J: '#d02828', W: '#f8f8f8', T: '#282830', P: '#d8dce8', B: '#a02020' },
  npcBlue: {
    ...SKIN,
    H: '#283048',
    h: '#5868a0',
    J: '#3058c8',
    W: '#f8f8f8',
    T: '#f8f8f8',
    P: '#e8e8f0',
    B: '#2848a0',
  },
  npcYellow: {
    ...SKIN,
    H: '#903828',
    h: '#d07048',
    J: '#f0c830',
    W: '#f8f8f8',
    T: '#404048',
    P: '#505868',
    B: '#383838',
  },
} as const satisfies Record<string, CharacterPalette>;

export type CharacterSprite = keyof typeof CHARACTER_PALETTES;
