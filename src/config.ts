/** Resolução interna: a mesma do Game Boy Advance (15 x 10 tiles de 16 px). */
export const GAME_WIDTH = 240;
export const GAME_HEIGHT = 160;
export const TILE_SIZE = 16;

export const FONT_FAMILY = '"Press Start 2P"';
export const FONT_SIZE = 8;
export const TEXT_COLOR = '#303840';

/** Caixa de texto no rodapé, usada pelos diálogos e pelo menu de duelo. */
export const BOX_HEIGHT = 48;
export const BOX_Y = GAME_HEIGHT - BOX_HEIGHT;
export const BOX_PADDING = 8;
export const BOX_CHARS = (GAME_WIDTH - BOX_PADDING * 2) / FONT_SIZE;
export const BOX_LINES = 3;
