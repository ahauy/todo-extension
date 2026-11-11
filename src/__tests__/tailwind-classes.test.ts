/**
 * Guard test nhóm B (#13/#17): class Tailwind phải tĩnh và tồn tại.
 * - PriorityGlyph không được dùng template động `bg-priority-${...}`
 * - Không còn utility không tồn tại `z-sticky`
 * - style.css khai đủ token màu priority
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

describe('Tailwind classes (#13/#17)', () => {
  it('PriorityGlyph dùng class tĩnh cho cả 3 priority', () => {
    const source = readFileSync(
      resolve(root, 'components/ui/PriorityGlyph.tsx'),
      'utf8'
    );
    expect(source).not.toContain('bg-priority-${');
    expect(source).toContain("'bg-priority-low'");
    expect(source).toContain("'bg-priority-medium'");
    expect(source).toContain("'bg-priority-high'");
  });

  it('không còn utility z-sticky (không tồn tại)', () => {
    for (const file of listTsx('components')) {
      const source = readFileSync(resolve(root, file), 'utf8');
      expect(source, file).not.toContain('z-sticky');
    }
  });

  it('style.css khai token --color-priority-*', () => {
    const css = readFileSync(
      resolve(root, 'entrypoints/popup/style.css'),
      'utf8'
    );
    for (const token of ['low', 'medium', 'high']) {
      expect(css).toContain(`--color-priority-${token}:`);
    }
  });
});
