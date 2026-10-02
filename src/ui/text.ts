/** Quebra o texto em linhas de até `maxChars` (a fonte do jogo é monoespaçada). */
export function wrapText(text: string, maxChars: number): string[] {
  const lines: string[] = [];
  for (const paragraph of text.split('\n')) {
    let line = '';
    for (const word of paragraph.split(' ')) {
      let rest = word;
      // Palavra maior que a linha: corta no limite.
      while (rest.length > maxChars) {
        if (line) {
          lines.push(line);
          line = '';
        }
        lines.push(rest.slice(0, maxChars));
        rest = rest.slice(maxChars);
      }
      if (!line) {
        line = rest;
      } else if (line.length + 1 + rest.length <= maxChars) {
        line += ` ${rest}`;
      } else {
        lines.push(line);
        line = rest;
      }
    }
    lines.push(line);
  }
  return lines;
}

/** Divide o texto em páginas de caixa de diálogo, cada uma com até `linesPerPage` linhas. */
export function paginate(text: string, maxChars: number, linesPerPage: number): string[] {
  const lines = wrapText(text, maxChars);
  const pages: string[] = [];
  for (let i = 0; i < lines.length; i += linesPerPage) {
    pages.push(lines.slice(i, i + linesPerPage).join('\n'));
  }
  return pages;
}

export function truncate(text: string, maxChars: number): string {
  return text.length <= maxChars ? text : `${text.slice(0, maxChars - 1)}.`;
}
