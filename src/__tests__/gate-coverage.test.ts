import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Gate coverage guard cho defect #3 (`tasks/bug-popup-blank-black/scan.md`).
 *
 * Bug blocker #1 (`useRef()` ở module scope trong `hooks/useTasks.ts`) ship được vì
 * `tsconfig.json` `include` và `eslint.config.mjs` `files` không phủ `hooks/**` +
 * `components/**` → `tsc --noEmit` và `eslint .` đều PASS mà không hề kiểm file popup.
 *
 * Test này đọc config THẬT trên đĩa (không hardcode chuỗi config) và chứng minh từng file
 * source của popup thật sự khớp glob của cả 2 gate.
 */

const repoRoot = resolve(process.cwd());

const POPUP_SOURCE_DIRS = ['components', 'hooks'];

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Chuyển glob của tsconfig/eslint (`**`, `*`, `?`, `{a,b}`) sang RegExp neo 2 đầu. */
function globToRegExp(pattern: string): RegExp {
  const cleaned = pattern.replace(/^\.\//, '');
  let body = '';
  let index = 0;
  while (index < cleaned.length) {
    const rest = cleaned.slice(index);
    if (rest.startsWith('**/')) {
      body += '(?:[^/]+/)*';
      index += 3;
      continue;
    }
    if (rest.startsWith('**')) {
      body += '.*';
      index += 2;
      continue;
    }
    const char = cleaned[index];
    if (char === '*') {
      body += '[^/]*';
      index += 1;
      continue;
    }
    if (char === '?') {
      body += '[^/]';
      index += 1;
      continue;
    }
    if (char === '{') {
      const closing = cleaned.indexOf('}', index);
      const alternatives = cleaned.slice(index + 1, closing).split(',');
      body += `(?:${alternatives.map(escapeRegExp).join('|')})`;
      index = closing + 1;
      continue;
    }
    body += escapeRegExp(char);
    index += 1;
  }
  return new RegExp(`^${body}$`);
}

function matchesAnyPattern(filePath: string, patterns: string[]): boolean {
  for (const pattern of patterns) {
    if (globToRegExp(pattern).test(filePath)) return true;
  }
  return false;
}

function listSourceFiles(relativeDir: string): string[] {
  const pending = [join(repoRoot, relativeDir)];
  const found: string[] = [];
  while (pending.length > 0) {
    const currentDir = pending.pop();
    if (currentDir === undefined) continue;
    for (const entry of readdirSync(currentDir, { withFileTypes: true })) {
      const absolutePath = join(currentDir, entry.name);
      if (entry.isDirectory()) {
        pending.push(absolutePath);
        continue;
      }
      if (/\.(ts|tsx)$/.test(entry.name)) found.push(relative(repoRoot, absolutePath));
    }
  }
  return found.sort();
}

function readStringArray(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;
  const strings: string[] = [];
  for (const item of value) {
    if (typeof item !== 'string') return null;
    strings.push(item);
  }
  return strings;
}

/**
 * tsconfig.json hiện là JSON thuần; chỉ strip comment/trailing comma khi parse thẳng thất bại.
 * Comment phải neo theo dòng — strip kiểu regex toàn cục sẽ ăn mất `/**\/` bên trong glob như
 * `components/**\/*`.
 */
function withoutJsonComments(source: string): string {
  return source
    .replace(/^\s*\/\/[^\n]*$/gm, '')
    .replace(/^\s*\/\*[\s\S]*?\*\/\s*$/gm, '')
    .replace(/,(\s*[}\]])/g, '$1');
}

function parseJsonLoose(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return JSON.parse(withoutJsonComments(raw));
  }
}

function readTsconfigInclude(): string[] {
  const raw = readFileSync(join(repoRoot, 'tsconfig.json'), 'utf8');
  const parsed: unknown = parseJsonLoose(raw);
  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('tsconfig.json không phải JSON object');
  }
  if (!('include' in parsed)) throw new Error('tsconfig.json thiếu field "include"');
  const include = readStringArray(parsed.include);
  if (include === null) throw new Error('tsconfig.json "include" không phải string[]');
  return include;
}

async function readEslintFilePatterns(): Promise<string[]> {
  const eslintConfig = await import('../../eslint.config.mjs');
  const configs: unknown = eslintConfig.default;
  if (!Array.isArray(configs)) throw new Error('eslint.config.mjs phải export default một array');

  const patterns: string[] = [];
  for (const configEntry of configs) {
    if (typeof configEntry !== 'object' || configEntry === null) continue;
    if (!('files' in configEntry)) continue;
    const files = readStringArray(configEntry.files);
    if (files === null) continue;
    for (const pattern of files) patterns.push(pattern);
  }
  return patterns;
}

const tsconfigInclude = readTsconfigInclude();
const eslintFilePatterns = await readEslintFilePatterns();
const popupSourceFiles = POPUP_SOURCE_DIRS.flatMap((dir) => listSourceFiles(dir));

describe('gate coverage — tsconfig include', () => {
  it('include has an entry covering components/**', () => {
    const covering = tsconfigInclude.filter((pattern) => /^components\//.test(pattern));
    expect(covering.length).toBeGreaterThan(0);
    expect(matchesAnyPattern('components/Header.tsx', covering)).toBe(true);
    expect(matchesAnyPattern('components/ui/Button.tsx', covering)).toBe(true);
  });

  it('include has an entry covering hooks/**', () => {
    const covering = tsconfigInclude.filter((pattern) => /^hooks\//.test(pattern));
    expect(covering.length).toBeGreaterThan(0);
    expect(matchesAnyPattern('hooks/useTasks.ts', covering)).toBe(true);
  });

  it('typechecks hooks/useTasks.ts (file of bug #1)', () => {
    expect(popupSourceFiles).toContain('hooks/useTasks.ts');
    expect(matchesAnyPattern('hooks/useTasks.ts', tsconfigInclude)).toBe(true);
  });

  it('typechecks every popup source file', () => {
    expect(popupSourceFiles.length).toBeGreaterThan(0);
    const uncovered = popupSourceFiles.filter(
      (filePath) => !matchesAnyPattern(filePath, tsconfigInclude)
    );
    expect(uncovered).toEqual([]);
  });
});

describe('gate coverage — eslint files', () => {
  it('eslint config declares components/**, hooks/** and lib/** globs', () => {
    const raw = readFileSync(join(repoRoot, 'eslint.config.mjs'), 'utf8');
    expect(raw).toContain('components/**');
    expect(raw).toContain('hooks/**');
    expect(raw).toContain('lib/**');
  });

  it('lints hooks/useTasks.ts (file of bug #1)', () => {
    expect(eslintFilePatterns.length).toBeGreaterThan(0);
    expect(matchesAnyPattern('hooks/useTasks.ts', eslintFilePatterns)).toBe(true);
  });

  it('lints component files including nested components/ui/**', () => {
    expect(matchesAnyPattern('components/Header.tsx', eslintFilePatterns)).toBe(true);
    expect(matchesAnyPattern('components/ui/Button.tsx', eslintFilePatterns)).toBe(true);
  });

  it('lints every popup source file', () => {
    expect(popupSourceFiles.length).toBeGreaterThan(0);
    const notLinted = popupSourceFiles.filter(
      (filePath) => !matchesAnyPattern(filePath, eslintFilePatterns)
    );
    expect(notLinted).toEqual([]);
  });
});
