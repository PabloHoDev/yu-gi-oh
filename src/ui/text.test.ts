import { describe, expect, it } from 'vitest';
import { paginate, truncate, wrapText } from './text';

describe('wrapText', () => {
  it('quebra em palavras sem passar do limite', () => {
    expect(wrapText('Bem-vindo à Academia de Duelos!', 12)).toEqual(['Bem-vindo à', 'Academia de', 'Duelos!']);
  });

  it('respeita quebras de linha explícitas', () => {
    expect(wrapText('um\ndois', 10)).toEqual(['um', 'dois']);
  });

  it('corta palavras maiores que a linha', () => {
    expect(wrapText('ab abcdefgh', 4)).toEqual(['ab', 'abcd', 'efgh']);
  });
});

describe('paginate', () => {
  it('agrupa as linhas em páginas', () => {
    expect(paginate('a b c d e', 1, 2)).toEqual(['a\nb', 'c\nd', 'e']);
  });
});

describe('truncate', () => {
  it('encurta nomes longos', () => {
    expect(truncate('Elemental HERO Sparkman', 10)).toBe('Elemental.');
    expect(truncate('Neos', 10)).toBe('Neos');
  });
});
