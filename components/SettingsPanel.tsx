/**
 * Cài đặt. Hệ màu chỉ có tông sáng nên không còn chọn Sáng/Tối; thay vào đó
 * là chế độ hiển thị Popup · New Tab · Tự động, kiểu bút, các công tắc họa
 * tiết, độ dài phiên học, tiếng chuông và thông báo của trình duyệt.
 */
import React, { useCallback, useEffect, useState } from 'react';
import Field from './ui/Field';
import Segmented from './ui/Segmented';
import Toggle from './ui/Toggle';
import Button from './ui/Button';
import { useSettings } from '../hooks/useSettings';
import { unlockAudio, playBell } from '../lib/sound';
import type { DisplayMode, PomodoroPreset, QuillStyle } from '../lib/tasks/types';

const MODE_HINT: Record<DisplayMode, string> = {
  popup: 'Bấm biểu tượng mở sổ nhỏ 360×560. Trang tab mới chỉ hiện lời chào.',
  newtab: 'Bấm biểu tượng mở hoặc quay lại bảng Học Đường toàn màn hình.',
  auto: 'Bấm biểu tượng thì mở sổ nhỏ; mở tab mới thì thấy cả bảng.',
};

export default function SettingsPanel() {
  const { settings, update } = useSettings();
  const [permission, setPermission] = useState<'granted' | 'denied' | 'unknown'>('unknown');
  const [copied, setCopied] = useState(false);
  const [usage, setUsage] = useState<{ used: number; total: number } | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    chrome.notifications?.getPermissionLevel?.((level) => {
      setPermission(level === 'granted' ? 'granted' : 'denied');
    });
    void (async () => {
      try {
        const bytes = await chrome.storage.sync.getBytesInUse?.();
        setUsage({ used: bytes ?? 0, total: 100 * 1024 });
      } catch {
        setUsage(null);
      }
    })();
  }, []);

  const change = useCallback(
    (patch: Parameters<typeof update>[0]) => {
      void update(patch).catch((error: Error) => setSaveError(error.message));
    },
    [update]
  );

  const copyAddress = useCallback(() => {
    void navigator.clipboard.writeText('chrome://settings/content/notifications');
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }, []);

  return (
    <div className="stack gap-lg">
      {saveError && (
        <p role="alert" className="text-body-sm text-critical">
          {saveError}
        </p>
      )}

      <Field label="Chế độ hiển thị" helper={MODE_HINT[settings.displayMode]}>
        <Segmented
          aria-label="Chế độ hiển thị"
          options={[
            { value: 'popup', label: 'Popup' },
            { value: 'newtab', label: 'New Tab' },
            { value: 'auto', label: 'Tự động' },
          ]}
          value={settings.displayMode}
          onChange={(value) => change({ displayMode: value as DisplayMode })}
        />
      </Field>

      <Field label="Cây bút trong ô ghi việc" helper="Cùng một đầu ngòi, chỉ khác hình dáng">
        <Segmented
          aria-label="Kiểu bút"
          options={[
            { value: 'pen', label: 'Bút lông' },
            { value: 'hand', label: 'Bàn tay cầm bút' },
          ]}
          value={settings.quillStyle}
          onChange={(value) => change({ quillStyle: value as QuillStyle })}
        />
      </Field>

      <div className="stack gap-md">
        <span className="text-caption font-bold tracking-[0.4px] text-brown">Hiệu ứng</span>
        <Toggle
          label="Hiệu ứng bút và mực thấm"
          checked={settings.quillEffect}
          onChange={(value) => change({ quillEffect: value })}
        />
        <Toggle
          label="Họa tiết góc và hạt khảm vỏ trứng"
          checked={settings.ornaments}
          onChange={(value) => change({ ornaments: value })}
        />
        <Toggle
          label="Vệt sáng sơn mài trên thẻ"
          checked={settings.lacquerSheen}
          onChange={(value) => change({ lacquerSheen: value })}
        />
        <p className="text-caption text-umber">
          Tắt bớt nếu máy chạy chậm hoặc con muốn trang giấy tĩnh hơn.
        </p>
      </div>

      <Field label="Độ dài giờ học" helper="Học rồi nghỉ, hết phiên có chuông nếu bật tiếng">
        <Segmented
          aria-label="Độ dài giờ học"
          options={[
            { value: '25/5', label: '25 / 5' },
            { value: '50/10', label: '50 / 10' },
          ]}
          value={settings.pomodoroPreset}
          onChange={(value) => change({ pomodoroPreset: value as PomodoroPreset })}
        />
      </Field>

      <div className="stack gap-md">
        <span className="text-caption font-bold tracking-[0.4px] text-brown">Âm thanh</span>
        <Toggle
          label="Chuông đồng và tiếng giấy"
          checked={settings.soundEnabled}
          onChange={(value) => {
            change({ soundEnabled: value });
            if (value) {
              unlockAudio();
              playBell();
            }
          }}
        />
      </div>

      <div className="stack gap-md">
        <span className="text-caption font-bold tracking-[0.4px] text-brown">
          Thông báo của trình duyệt
        </span>
        <Toggle
          label="Bật nhắc việc"
          checked={settings.notificationsEnabled}
          onChange={(value) => change({ notificationsEnabled: value })}
        />
        {permission === 'denied' && (
          <div className="stack gap-xs">
            <p className="text-body-sm text-umber">
              Trình duyệt đang chặn thông báo. Sao chép địa chỉ dưới đây rồi dán vào thanh địa chỉ
              để cho phép lại.
            </p>
            <div className="flex items-center gap-sm">
              <Button variant="ghost" size="sm" onClick={copyAddress}>
                Sao chép địa chỉ
              </Button>
              {copied && <span className="text-caption text-jade">Đã sao chép</span>}
            </div>
          </div>
        )}
      </div>

      {usage && (
        <Field label="Dung lượng đồng bộ" helper="Sổ mang theo giữa các máy qua chrome.storage.sync">
          <div className="flex items-center gap-md">
            <span className="progress-ink flex-1">
              <span style={{ width: `${Math.min((usage.used / usage.total) * 100, 100)}%` }} />
            </span>
            <span className="tnum text-caption text-umber">
              {(usage.used / 1024).toFixed(1)} KB / 100 KB
            </span>
          </div>
        </Field>
      )}
    </div>
  );
}