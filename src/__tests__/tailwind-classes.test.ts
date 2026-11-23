/**
 * Guard test sau cải tạo "Sơn mài Học Đường" (thay guard cũ thời PriorityGlyph):
 * - PriorityBadge (components/ui/Chips.tsx) dùng class TĨNH cho cả 4 mức ưu
 *   tiên (badge-q1..badge-q4), không ghép class động `badge-${...}`
 *   — class động khiến Tailwind không scan ra và badge mất màu.
 * - Không còn utility không tồn tại `z-sticky` trong components/ lẫn entrypoints/.
 * - Token/class thật phải được khai trong styles/components.css
 *   (.badge-q1..badge-q4) — style giờ nằm ở styles/*.css chứ
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
  it('Chips.tsx dùng class tĩnh badge-q1..badge-q4, không ghép template động', () => {
    const source = readFileSync(
      resolve(root, 'components/ui/Chips.tsx'),
      'utf8'
    );
    for (const cls of ['badge-q1', 'badge-q2', 'badge-q3', 'badge-q4']) {
      expect(source, `Chips.tsx thiếu class ${cls}`).toContain(cls);
    }
    expect(source).not.toContain('badge-${');
  });

  it('không còn utility z-sticky (không tồn tại) trong components/ và entrypoints/', () => {
    const files = [...listTsx('components'), ...listTsx('entrypoints')];
    for (const file of files) {
      const source = readFileSync(resolve(root, file), 'utf8');
      expect(source, file).not.toContain('z-sticky');
    }
  });

  it('styles/components.css khai thật .badge-q1..badge-q4', () => {
    const css = readFileSync(resolve(root, 'styles/components.css'), 'utf8');
    for (const selector of ['.badge-q1', '.badge-q2', '.badge-q3', '.badge-q4']) {
      expect(css, `styles/components.css thiếu selector ${selector}`).toContain(
        selector
      );
    }
  });
});
