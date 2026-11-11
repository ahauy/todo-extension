import type { Settings } from './tasks/types';

/** Áp theme vào document: system = bỏ data-theme, light/dark = set attribute. */
export function applyTheme(theme: Settings['theme']): void {
  if (theme === 'system') {
    document.documentElement.removeAttribute('data-theme');
    return;
  }
  document.documentElement.dataset.theme = theme;
}
