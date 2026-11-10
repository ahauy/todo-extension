import tseslint from 'typescript-eslint';

const recommended = tseslint.configs.recommended;
const tsRecommended = recommended.find(
  (c) => c.files && Array.isArray(c.files) && c.files.includes('**/*.ts')
);

export default [
  {
    ...tsRecommended,
    files: ['entrypoints/**/*.{ts,tsx}', 'src/**/*.{ts,tsx}'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        jsx: true,
        ...(tsRecommended.languageOptions?.parserOptions || {}),
      },
    },
  },
];
