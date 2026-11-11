import { defineConfig } from 'wxt';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  // Chromium Manifest V3
  manifestVersion: 3,
  // Phần quyền tối thiểu theo R-17: storage, alarms, notifications.
  // Không thêm quyền `tabs`: bảng lớn tự nhớ id tab của nó qua storage.session.
  manifest: {
    name: 'Học Đường — sổ tay của người đi học',
    description:
      'Sổ tay nhắc việc cho người đi học: mỗi việc là một cuộn thư, xong việc là đóng một dấu son.',
    permissions: ['storage', 'alarms', 'notifications'],
    icons: {
      16: 'icon/16.png',
      32: 'icon/32.png',
      48: 'icon/48.png',
      128: 'icon/128.png',
    },
    action: {
      default_title: 'Học Đường',
      default_popup: 'popup.html',
      default_icon: {
        16: 'icon/16.png',
        32: 'icon/32.png',
        48: 'icon/48.png',
        128: 'icon/128.png',
      },
    },
    chrome_url_overrides: {
      newtab: 'newtab.html',
    },
  },
  srcDir: '.',
  vite: () => ({
    plugins: [tailwindcss()],
  }),
});
