/**
 * Settings panel (L5-T16). Header "Cài đặt" + back.
 * 3 radio theme (hệ thống/sáng/tối), đổi áp ngay, lưu settings (1 write).
 * Thông báo: trạng thái + hint sao chép khi bị chặn.
 * Dung lượng đồng bộ (nếu adapter expose getBytesInUse).
 */
import React, { useCallback, useEffect, useState } from 'react';
import Button from './ui/Button';
import Checkbox from './ui/Checkbox';
import Field from './ui/Field';
import IconButton from './ui/IconButton';
import { loadSettings, putSettings } from '../lib/storage/adapter';
import { applyTheme } from '../lib/theme';
import type { Settings } from '../lib/tasks/types';

interface SettingsProps {
  onBack: () => void;
}

export default function Settings({ onBack }: SettingsProps) {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [copyToast, setCopyToast] = useState(false);
  const [storageUsage, setStorageUsage] = useState<{ used: number; total: number } | null>(null);
  const [storageError, setStorageError] = useState(false);
  const [permissionLevel, setPermissionLevel] = useState<'granted' | 'denied' | 'unknown'>(
    'unknown'
  );

  useEffect(() => {
    chrome.notifications.getPermissionLevel?.((level) => {
      setPermissionLevel(level === 'granted' ? 'granted' : 'denied');
    });
  }, []);

  useEffect(() => {
    (async () => {
      const s = await loadSettings();
      setSettings(s ?? { theme: 'system', notificationsEnabled: true });
    })();
  }, []);

  const handleThemeChange = useCallback(
    async (theme: Settings['theme']) => {
      if (!settings) return;
      const next = { ...settings, theme };
      setSettings(next);
      applyTheme(theme);
      try {
        await putSettings(next);
      } catch (err) {
        // Lưu thất bại không chặn UI (đã áp ngay)
      }
    },
    [settings]
  );

  const handleNotificationsToggle = useCallback(
    async (enabled: boolean) => {
      if (!settings) return;
      const next = { ...settings, notificationsEnabled: enabled };
      setSettings(next);
      try {
        await putSettings(next);
      } catch {
        setSettings(settings);
      }
    },
    [settings]
  );

  const handleCopyNotifications = useCallback(() => {
    navigator.clipboard.writeText('chrome://settings/content/notifications');
    setCopyToast(true);
    setTimeout(() => setCopyToast(false), 2000);
  }, []);

  const handleLoadStorageUsage = useCallback(async () => {
    try {
      const bytes = await chrome.storage.sync.getBytesInUse?.();
      const total = 100 * 1024; // 100 KB
      setStorageUsage({ used: bytes ?? 0, total });
    } catch {
      setStorageError(true);
    }
  }, []);

  useEffect(() => {
    void handleLoadStorageUsage();
  }, [handleLoadStorageUsage]);

  if (!settings) return null;

  const themeOptions = [
    { value: 'system', label: 'Theo hệ thống' },
    { value: 'light', label: 'Sáng' },
    { value: 'dark', label: 'Tối' },
  ] as const;

  return (
    <div className="h-[600px] flex flex-col bg-bg">
      <header className="h-[52px] px-3 flex items-center justify-between bg-bg border-b border-border-subtle">
        <button type="button" onClick={onBack} className="text-fg-secondary hover:text-fg">
          Quay lại
        </button>
        <div className="text-title font-medium text-fg">Cài đặt</div>
        <div className="w-9" />
      </header>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Theme */}
        <Field label="Giao diện" helper="Chọn chế độ hiển thị">
          <div className="flex items-center gap-3">
            {themeOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                role="radio"
                aria-checked={settings.theme === opt.value}
                onClick={() => handleThemeChange(opt.value)}
                className={`flex-1 py-2 rounded-control border border-border-control transition-colors ${
                  settings.theme === opt.value
                    ? 'bg-accent-soft text-accent-text border-accent-border font-medium'
                    : 'text-fg-secondary bg-surface hover:bg-surface-hover'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <p className="text-meta text-fg-muted mt-1">
            {settings.theme === 'system'
              ? 'Theo chế độ hệ thống (tự động sáng/tối).'
              : settings.theme === 'light'
                ? 'Chế độ sáng.'
                : 'Chế độ tối.'}
          </p>
        </Field>

        {/* Thông báo */}
        <Field label="Thông báo" helper="Nhắc việc khi đến hạn">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-body text-fg">
              <Checkbox
                checked={settings.notificationsEnabled}
                onChange={handleNotificationsToggle}
                aria-label="Bật nhắc việc"
              />
              {settings.notificationsEnabled ? 'Đang bật' : 'Đang tắt'}
            </label>
            {permissionLevel === 'denied' && (
              <Button
                variant="ghost"
                onClick={handleCopyNotifications}
                className="text-xs px-2"
              >
                Sao chép địa chỉ
              </Button>
            )}
            {copyToast && (
              <span className="text-meta text-success text-xs">Đã sao chép</span>
            )}
          </div>
          {permissionLevel === 'denied' && (
            <p className="text-meta text-fg-muted mt-1">
              Trình duyệt đang chặn thông báo. Sao chép địa chỉ trên vào trình duyệt để mở cài đặt
              thông báo của Chrome.
            </p>
          )}
        </Field>

        {/* Dung lượng đồng bộ */}
        {storageError === false && storageUsage !== null && (
          <Field label="Dung lượng đồng bộ" helper="Dung lượng đang sử dụng trên chrome.storage.sync">
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1 bg-surface-sunken rounded-bar">
                <div
                  className="h-full bg-accent rounded-bar"
                  style={{ width: `${Math.min((storageUsage.used / storageUsage.total) * 100, 100)}%` }}
                />
              </div>
              <span className="text-meta text-fg-muted tabular-nums">
                {(storageUsage.used / 1024).toFixed(1)} KB / 100 KB
              </span>
            </div>
          </Field>
        )}
      </div>

      <footer className="sticky bottom-0 px-3 py-2 border-t border-border-subtle bg-bg z-10">
        <Button variant="ghost" onClick={onBack}>
          Đóng
        </Button>
      </footer>
    </div>
  );
}
