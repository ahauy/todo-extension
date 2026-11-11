import tseslint from 'typescript-eslint';

// Toàn bộ source runtime + test phải được lint (defect #3) và rule recommended
// phải thật sự active (defect #23) — trước đây .find() khớp nhầm entry chỉ tắt rule.
const includeFiles = [
  'entrypoints/**/*.{ts,tsx}',
  'src/**/*.{ts,tsx}',
  'components/**/*.{ts,tsx}',
  'hooks/**/*.ts',
  'lib/**/*.ts',
];

export default [
  ...tseslint.configs.recommended.map((entry) => ({
    ...entry,
    files: includeFiles,
  })),
  {
    files: includeFiles,
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: { jsx: true },
    },
  },
];
