/**
 * Baixa a ilustração de cada carta do banco e converte para o estilo do jogo:
 * 64 x 64 px, paleta reduzida e cores de 15 bits, como os sprites de GBA.
 * Gera um único atlas em public/assets/generated/ (card-art.png + card-art.json).
 *
 * Uso: npm run art:import
 *
 * As ilustrações são material oficial de Yu-Gi-Oh! e por isso NÃO são
 * versionadas: a pasta generated/ está no .gitignore. Sem o atlas o jogo usa
 * uma arte provisória por atributo (ver src/gfx/cardArt.ts).
 */
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import sharp from 'sharp';
import { cardListSchema } from '../src/duel/cardSchema.ts';

const IMAGE_URL = 'https://images.ygoprodeck.com/images/cards_cropped';
const CARDS_FILE = new URL('../data/cards/cards.json', import.meta.url);
const CACHE_DIR = new URL('../.cache/card-art/', import.meta.url);
const OUTPUT_DIR = new URL('../public/assets/generated/', import.meta.url);

const SIZE = 64;
const COLUMNS = 16;
const COLOURS = 32;
const REQUEST_GAP_MS = 120;

async function download(passcode: number): Promise<Buffer> {
  const cached = new URL(`${passcode}.jpg`, CACHE_DIR);
  if (existsSync(cached)) return readFile(cached);

  await new Promise((resolve) => setTimeout(resolve, REQUEST_GAP_MS));
  const response = await fetch(`${IMAGE_URL}/${passcode}.jpg`);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const image = Buffer.from(await response.arrayBuffer());
  await writeFile(cached, image);
  return image;
}

/** Reduz para 64 x 64 com poucas cores e arredonda cada canal para 5 bits (a cor de 15 bits do GBA). */
async function pixelate(image: Buffer): Promise<Buffer> {
  const quantized = await sharp(image)
    .resize(SIZE, SIZE, { kernel: 'lanczos3', fit: 'cover' })
    .modulate({ saturation: 1.3 })
    .sharpen({ sigma: 0.8 })
    .png({ palette: true, colours: COLOURS, dither: 0.4 })
    .toBuffer();
  const { data, info } = await sharp(quantized).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 4) {
    for (let channel = 0; channel < 3; channel++) {
      data[i + channel] = Math.min(255, Math.round((data[i + channel] as number) / 8) * 8);
    }
  }
  return sharp(data, { raw: info }).png().toBuffer();
}

async function main(): Promise<void> {
  const cards = cardListSchema.parse(JSON.parse(await readFile(CARDS_FILE, 'utf8')));
  await mkdir(CACHE_DIR, { recursive: true });
  await mkdir(OUTPUT_DIR, { recursive: true });

  const sprites: { id: string; image: Buffer }[] = [];
  const failed: string[] = [];
  for (const card of cards) {
    try {
      sprites.push({ id: card.id, image: await pixelate(await download(card.passcode)) });
    } catch (error) {
      failed.push(`${card.nameEn} (${(error as Error).message})`);
    }
    if (sprites.length % 25 === 0) console.log(`${sprites.length}/${cards.length}`);
  }

  const rows = Math.ceil(sprites.length / COLUMNS);
  const frames: Record<string, unknown> = {};
  const layers = sprites.map(({ id, image }, index) => {
    const x = (index % COLUMNS) * SIZE;
    const y = Math.floor(index / COLUMNS) * SIZE;
    frames[id] = {
      frame: { x, y, w: SIZE, h: SIZE },
      rotated: false,
      trimmed: false,
      spriteSourceSize: { x: 0, y: 0, w: SIZE, h: SIZE },
      sourceSize: { w: SIZE, h: SIZE },
    };
    return { input: image, left: x, top: y };
  });

  await sharp({ create: { width: COLUMNS * SIZE, height: rows * SIZE, channels: 4, background: '#00000000' } })
    .composite(layers)
    .png({ compressionLevel: 9 })
    .toFile(new URL('card-art.png', OUTPUT_DIR).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
  await writeFile(new URL('card-art.json', OUTPUT_DIR), `${JSON.stringify({ frames })}\n`);

  console.log(`\n${sprites.length} ilustrações gravadas em public/assets/generated/card-art.png.`);
  if (failed.length > 0) console.warn(`Sem ilustração (o jogo usa a arte provisória): ${failed.join(', ')}`);
}

await main();
