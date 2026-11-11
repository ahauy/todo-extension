/**
 * Guard test defect #14: input phải có viền THẬT (border width), không chỉ
 * border-color — viền chỉ có màu thì không hiển thị.
 *
 * Sau cải tạo "Sơn mài Học Đường" các component cũ (TaskComposer/TaskDetail/
 * Settings/FilterBar) đã bị xoá, style chuyển từ utility Tailwind sang file
 * CSS riêng: `.text-input`/`.text-area` khai `border: 1px solid var(--sepia)`
 * trong styles/components.css, còn `.quill` (ô bút lông signature) khai tương
 * tự trong styles/signature.css. Guard đọc trực tiếp CSS từ đĩa + kiểm tra
 * source component render input thật sự gắn class trên.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();

const read = (file: string) => readFileSync(resolve(root, file), 'utf8');

describe('border width cho input (#14)', () => {
  it('styles/components.css: rule .text-input/.text-area khai border 1px solid var(--sepia)', () => {
    const css = read('styles/components.css');
    const block = css.match(/\.text-input[\s\S]*?\{[^}]*\}/);
    expect(block?.[0] ?? '', 'styles/components.css phải còn rule .text-input').toMatch(
      /border:\s*1px solid var\(--sepia\)/
    );
  });

  it('styles/signature.css: block .quill cũng khai border 1px solid var(--sepia)', () => {
    const css = read('styles/signature.css');
    const block = css.match(/\.quill\s*\{[^}]*\}/);
    expect(block?.[0] ?? '', 'styles/signature.css phải còn block .quill').toMatch(
      /border:\s*1px solid var\(--sepia\)/
    );
  });

  it('component render input thật sự dùng class text-input', () => {
    const files = [
      'components/TaskParchment.tsx',
      'components/TaskFields.tsx',
      'components/FilterRow.tsx',
    ];
    for (const file of files) {
      expect(read(file), `${file} phải dùng class text-input cho ô nhập`).toContain(
        'text-input'
      );
    }
  });
});
