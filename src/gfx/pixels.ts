export type Ctx = CanvasRenderingContext2D;

export function rect(ctx: Ctx, color: string, x: number, y: number, w = 1, h = 1): void {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

/** Desenha linhas de pixels em texto: cada letra é uma cor da paleta, '.' é transparente. */
export function paintRows(ctx: Ctx, rows: readonly string[], palette: Readonly<Record<string, string>>): void {
  rows.forEach((row, y) => {
    [...row].forEach((pixel, x) => {
      const color = palette[pixel];
      if (color) rect(ctx, color, x, y);
    });
  });
}

export interface DomeColors {
  base: string;
  light: string;
  dark: string;
  outline: string;
}

/** Meia elipse (cúpula) com contorno, brilho à esquerda e sombra à direita, sem suavização. */
export function dome(ctx: Ctx, cx: number, baseY: number, rx: number, ry: number, colors: DomeColors): void {
  for (let dy = 0; dy <= ry; dy++) {
    const half = Math.round(rx * Math.sqrt(1 - (dy / ry) ** 2));
    const y = baseY - dy;
    rect(ctx, colors.outline, cx - half - 1, y, half * 2 + 2, 1);
    if (half < 1) continue;
    rect(ctx, colors.base, cx - half, y, half * 2, 1);
    rect(ctx, colors.dark, cx + Math.round(half * 0.55), y, half - Math.round(half * 0.55), 1);
    if (dy > ry * 0.25 && dy < ry * 0.85)
      rect(ctx, colors.light, cx - Math.round(half * 0.7), y, Math.max(1, Math.round(half * 0.3)), 1);
  }
  rect(ctx, colors.outline, cx - 1, baseY - ry - 1, 2, 1);
}
