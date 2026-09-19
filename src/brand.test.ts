import * as fs from 'fs';
import * as path from 'path';

const BRAND_NAME = 'KUHAK';
const BRAND_FILE = path.resolve(__dirname, 'brand.ts');

function getSourceFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== '.expo') {
      results.push(...getSourceFiles(full));
    } else if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name) && !entry.name.endsWith('.test.ts')) {
      results.push(full);
    }
  }
  return results;
}

describe('brand leak check', () => {
  it(`no source file outside brand.ts contains the literal "${BRAND_NAME}"`, () => {
    const root = path.resolve(__dirname, '..');
    const files = getSourceFiles(root).filter((f) => f !== BRAND_FILE);
    const leaks: string[] = [];

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      if (content.includes(BRAND_NAME)) {
        leaks.push(path.relative(root, file));
      }
    }

    expect(leaks).toEqual([]);
  });
});
