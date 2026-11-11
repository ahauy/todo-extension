/** Cho phép import config .mjs (eslint.config.mjs) trong test mà không cần allowJs. */
declare module '*.mjs' {
  const value: unknown;
  export default value;
}
