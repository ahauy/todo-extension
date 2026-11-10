import { defineConfig } from 'wxt';

export default defineConfig({
  // Chromium Manifest V3
  manifestVersion: 3,
  // Phần quyền tối thiểu theo R-17: storage, alarms, notifications
  manifest: {
    permissions: ['storage', 'alarms', 'notifications'],
  },
  srcDir: '.',
});
