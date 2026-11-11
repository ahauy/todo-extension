/**
 * Guard test defect #14: `border-border-control` chỉ set border-color,
 * phải đi kèm utility `border` (width) thì viền mới hiển thị.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const FILES = [
  'components/TaskComposer.tsx',
  'components/TaskDetail.tsx',
  'components/Settings.tsx',
  'components/FilterBar.tsx',
];

describe('border utility (#14)', () => {
  it('không có border-border-control đứng một mình (thiếu border width)', () => {
    for (const file of FILES) {
      const source = readFileSync(resolve(process.cwd(), file), 'utf8');
      const orphan = source.match(/(?<!border )border-border-control/g);
      expect(orphan, `${file} còn border-border-control thiếu border`).toBeNull();
    }
  });

  it('composer và detail có input dùng border width', () => {
    const composer = readFileSync(
      resolve(process.cwd(), 'components/TaskComposer.tsx'),
      'utf8'
    );
    const detail = readFileSync(
      resolve(process.cwd(), 'components/TaskDetail.tsx'),
      'utf8'
    );
    expect(composer).toContain('border border-border-control');
    expect(detail).toContain('border border-border-control');
  });
});
