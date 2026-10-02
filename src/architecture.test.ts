import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * Guarda a regra central da arquitetura: as camadas de lógica (regras do duelo
 * e dados do mundo) não conhecem o Phaser nem as camadas de tela. É isso que
 * permite testá-las sozinhas e reaproveitá-las em replays e multiplayer.
 */
const SRC = fileURLToPath(new URL('.', import.meta.url));
const PURE_LAYERS = ['duel', 'world'];
const FORBIDDEN = ['phaser', '/scenes/', '/ui/', '/gfx/', '/input/'];
/** Módulos sem Phaser que as camadas puras podem usar apesar de morarem em pasta de tela. */
const ALLOWED = ['/ui/text'];

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return entry.name.endsWith('.ts') ? [path] : [];
  });
}

function imports(file: string): string[] {
  const source = readFileSync(file, 'utf8');
  return [...source.matchAll(/\bfrom\s+['"]([^'"]+)['"]|\bimport\s*\(?\s*['"]([^'"]+)['"]/g)].map(
    (match) => (match[1] ?? match[2]) as string,
  );
}

describe.each(PURE_LAYERS)('camada src/%s', (layer) => {
  it('não importa o Phaser nem código de tela', () => {
    const violations = sourceFiles(join(SRC, layer)).flatMap((file) =>
      imports(file)
        .filter((specifier) => FORBIDDEN.some((part) => specifier === part || specifier.includes(part)))
        .filter((specifier) => !ALLOWED.some((part) => specifier.endsWith(part)))
        .map((specifier) => `${relative(SRC, file)} importa ${specifier}`),
    );
    expect(violations).toEqual([]);
  });
});
