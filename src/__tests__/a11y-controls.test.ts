/** D-13/D-21 — guard CSS: vùng bấm ≥44px và focus ring sáng trên nền mực. */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const read = (file: string) => readFileSync(resolve(root, file), 'utf8');
const escape = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function blocks(css: string, selector: string): string[] {
  return Array.from(
    css.matchAll(new RegExp(`${escape(selector)}\\s*\\{[^}]*\\}`, 'g')),
    (match) => match[0]
  );
}

describe('D-13 vùng bấm tối thiểu 44px', () => {
  it.each([
    ['styles/components.css', '.btn-icon'],
    ['styles/components.css', '.filter-subject'],
    ['styles/components.css', '.ribbon-tab'],
    ['styles/components.css', '.segmented-option'],
    ['styles/components.css', '.search-field'],
    ['styles/components.css', '.menu-item'],
    ['styles/board.css', '.timer-compact-button'],
    ['styles/board.css', '.keystone-chip'],
  ])('%s: %s có min-height 44px', (file, selector) => {
    const found = blocks(read(file), selector).some((block) =>
      /min-height:\s*44px/.test(block)
    );
    expect(found, `${file} ${selector} thiếu min-height: 44px`).toBe(true);
  });

  it.each([
    ['styles/components.css', '.btn-icon'],
    ['styles/components.css', '.ribbon-tab'],
    ['styles/components.css', '.segmented-option'],
    ['styles/board.css', '.timer-compact-button'],
    ['styles/board.css', '.keystone-chip'],
  ])('%s: %s có min-width 44px', (file, selector) => {
    const found = blocks(read(file), selector).some((block) =>
      /min-width:\s*44px/.test(block)
    );
    expect(found, `${file} ${selector} thiếu min-width: 44px`).toBe(true);
  });
});

describe('D-21 focus ring trên nền mực đậm', () => {
  it('segmented-option đang chọn dùng quầng vàng sáng thay vì --primary đỏ', () => {
    const base = read('styles/base.css');
    expect(base).toMatch(
      /\.segmented-option\[aria-checked='true'\]:focus-visible[\s\S]*?outline:\s*2px solid var\(--gold-pale\)/
    );
  });

  it('btn-icon đang pressed/active cũng có quầng vàng sáng', () => {
    const base = read('styles/base.css');
    expect(base).toMatch(
      /\.btn-icon\[aria-pressed='true'\]:focus-visible[\s\S]*?outline:\s*2px solid var\(--gold-pale\)/
    );
  });
});
