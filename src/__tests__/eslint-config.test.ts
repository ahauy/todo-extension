/**
 * Guard test defect #23: config ESLint phải nạp entry rule thật (recommended),
 * không phải entry override toàn 'off' như bản cũ.
 */
import { describe, expect, it } from 'vitest';
import config from '../../eslint.config.mjs';

type RuleValue = unknown;

describe('eslint config (#23)', () => {
  it('files phủ entrypoints/src/components/hooks/lib', async () => {
    const entries = (await config) as Array<{ files?: string[] }>;
    const patterns = entries.flatMap((entry) => entry.files ?? []);
    for (const expected of [
      'components/**/*.{ts,tsx}',
      'hooks/**/*.ts',
      'lib/**/*.ts',
      'src/**/*.{ts,tsx}',
      'entrypoints/**/*.{ts,tsx}',
    ]) {
      expect(patterns).toContain(expected);
    }
  });

  it('rule recommended active và scope đúng 5 nhóm files', async () => {
    const entries = (await config) as Array<{
      rules?: Record<string, RuleValue>;
      files?: string[];
    }>;
    const ruleEntries = entries.filter((entry) => entry.rules);
    expect(ruleEntries.length).toBeGreaterThan(0);

    const expectedFiles = [
      'entrypoints/**/*.{ts,tsx}',
      'src/**/*.{ts,tsx}',
      'components/**/*.{ts,tsx}',
      'hooks/**/*.ts',
      'lib/**/*.ts',
    ];
    for (const entry of ruleEntries) {
      expect(entry.files).toEqual(expect.arrayContaining(expectedFiles));
    }

    const rules = Object.assign({}, ...ruleEntries.map((entry) => entry.rules ?? {}));
    expect(rules['@typescript-eslint/no-unused-vars']).toBe('error');
    expect(rules['@typescript-eslint/no-explicit-any']).toBe('error');
    expect(rules['@typescript-eslint/no-empty-object-type']).toBe('error');
  });
});
