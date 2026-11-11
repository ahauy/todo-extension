/**
 * Guard test sau cải tạo "Sơn mài Học Đường" (thay guard cũ thời PriorityGlyph):
 * - PriorityBadge (components/ui/Chips.tsx) dùng class TĨNH cho cả 3 mức ưu
 *   tiên (badge-high/badge-mid/badge-low), không ghép class động `badge-${...}`
 *   — class động khiến Tailwind không scan ra và badge mất màu.
 * - Không còn utility không tồn tại `z-sticky` trong components/ lẫn entrypoints/.
 * - Token/class thật phải được khai trong styles/components.css
 *   (.badge-high/.badge-mid/.badge-low) — style giờ nằm ở styles/*.css chứ
 *   không còn trong entrypoints/popup/style.css.
 */
import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = process.cwd();

function listTsx(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(join(root, dir), { withFileTypes: true })) {
    const rel = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listTsx(rel));
    else if (entry.name.endsWith('.tsx')) out.push(rel);
  }
  return out;
}

describe('class ưu tiên tĩnh + token thật (sau cải tạo sơn mài)', () => {
  it('Chips.tsx dùng class tĩnh badge-high/badge-mid/badge-low, không ghép template động', () => {
    const source = readFileSync(
      resolve(root, 'components/ui/Chips.tsx'),
      'utf8'
    );
    expect(source).toContain('badge-high');
    expect(source).toContain('badge-mid');
    expect(source).toContain('badge-low');
    expect(source).not.toContain('badge-${');
  });

  it('không còn utility z-sticky (không tồn tại) trong components/ và entrypoints/', () => {
    const files = [...listTsx('components'), ...listTsx('entrypoints')];
    for (const file of files) {
      const source = readFileSync(resolve(root, file), 'utf8');
      expect(source, file).not.toContain('z-sticky');
    }
  });

  it('styles/components.css khai thật .badge-high/.badge-mid/.badge-low', () => {
    const css = readFileSync(resolve(root, 'styles/components.css'), 'utf8');
    for (const selector of ['.badge-high', '.badge-mid', '.badge-low']) {
      expect(css, `styles/components.css thiếu selector ${selector}`).toContain(
        selector
      );
    }
  });
});
