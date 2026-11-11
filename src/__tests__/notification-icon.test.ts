/**
 * Guard test cho defect #8: notification thiếu icon.
 * `chrome.notifications.create` fail nếu iconUrl không trỏ file tồn tại;
 * manifest cũng phải khai icons để Chrome/Web Store nhận diện extension.
 */
import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

const ICON_SIZES = [16, 48, 128];
const root = process.cwd();

describe('notification icon (#8)', () => {
  it('có đủ icon 16/48/128 và file không rỗng', () => {
    for (const size of ICON_SIZES) {
      const file = resolve(root, `public/icon/${size}.png`);
      expect(existsSync(file)).toBe(true);
      expect(statSync(file).size).toBeGreaterThan(100);
    }
  });

  it('background dùng getURL tới icon tồn tại', () => {
    const background = readFileSync(
      resolve(root, 'entrypoints/background.ts'),
      'utf8'
    );
    expect(background).toContain("chrome.runtime.getURL('icon/48.png')");
    expect(existsSync(resolve(root, 'public/icon/48.png'))).toBe(true);
  });

  it('manifest khai icons 16/48/128', () => {
    const config = readFileSync(resolve(root, 'wxt.config.ts'), 'utf8');
    for (const size of ICON_SIZES) {
      const pattern = new RegExp(
        `${size}\\s*:\\s*['"]icon/${size}\\.png['"]`
      );
      expect(config).toMatch(pattern);
    }
  });
});
