/**
 * R-22 Phase 1 — hợp đồng settings + plan alarm + cờ mở sheet.
 * Không snapshot: assert dữ liệu storage/alarms thật qua chrome stub.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createChromeStub, type ChromeStub } from './helpers/chrome-stub';
import {
  DEFAULT_SETTINGS,
  PLAN_ALARM_NAME,
  PLAN_SHEET_KEY,
} from '../../lib/tasks/types';

let stub: ChromeStub;

beforeEach(() => {
  vi.resetModules();
  stub = createChromeStub();
  stub.install();
});

afterEach(() => {
  document.body.innerHTML = '';
});

describe('R-22 — normalizeSettings planReminder', () => {
  it('settings cũ thiếu planReminder → mặc định 21:00, bật sẵn', async () => {
    const { normalizeSettings } = await import('../../lib/storage/adapter');
    const old = { ...DEFAULT_SETTINGS } as Record<string, unknown>;
    delete old.planReminder;
    const next = normalizeSettings(old);
    expect(next.planReminder).toEqual({ enabled: true, at: '21:00' });
  });

  it('giá trị hợp lệ được giữ; giá trị sai (giờ/enabled) rơi về mặc định', async () => {
    const { normalizeSettings } = await import('../../lib/storage/adapter');
    const kept = normalizeSettings({
      ...DEFAULT_SETTINGS,
      planReminder: { enabled: false, at: '06:30' },
    });
    expect(kept.planReminder).toEqual({ enabled: false, at: '06:30' });

    const bad = normalizeSettings({
      ...DEFAULT_SETTINGS,
      planReminder: { enabled: 'yes', at: '9:00' },
    });
    expect(bad.planReminder).toEqual({ enabled: true, at: '21:00' });
  });
});

describe('R-22 — plan alarm', () => {
  it('nextPlanReminderAt: hôm nay nếu chưa tới, ngày mai nếu đã qua', async () => {
    const { nextPlanReminderAt } = await import('../../lib/alarms/scheduler');
    const now = new Date(2026, 10, 18, 10, 0, 0);
    expect(nextPlanReminderAt('21:00', now).getDate()).toBe(18);
    expect(nextPlanReminderAt('09:00', now).getDate()).toBe(19);
  });

  it('enabled → đúng 1 alarm; disabled → clear; đổi giờ → clear rồi tạo mới', async () => {
    const { syncPlanReminder } = await import('../../lib/alarms/scheduler');
    const now = new Date(2026, 10, 18, 10, 0, 0);

    syncPlanReminder({ enabled: true, at: '21:00' }, now);
    expect([...stub.alarms.keys()]).toEqual([PLAN_ALARM_NAME]);
    expect(stub.alarms.get(PLAN_ALARM_NAME)?.when).toBe(new Date(2026, 10, 18, 21, 0).getTime());
    expect(stub.alarms.get(PLAN_ALARM_NAME)?.periodInMinutes).toBeUndefined();

    syncPlanReminder({ enabled: false, at: '21:00' }, now);
    expect(stub.alarms.size).toBe(0);

    syncPlanReminder({ enabled: true, at: '06:30' }, now);
    expect([...stub.alarms.keys()]).toEqual([PLAN_ALARM_NAME]);
    expect(stub.alarms.get(PLAN_ALARM_NAME)?.when).toBe(new Date(2026, 10, 19, 6, 30).getTime());
  });
});

describe('R-22 — cờ mở sheet từ notification', () => {
  it('requestPlanSheet → consume đúng 1 lần rồi xoá cờ', async () => {
    const { requestPlanSheet, consumePlanSheet } = await import('../../lib/storage/local');
    expect(await consumePlanSheet()).toBe(false);

    await requestPlanSheet();
    expect(stub.localStore.get(PLAN_SHEET_KEY)).toBe(true);
    expect(await consumePlanSheet()).toBe(true);
    expect(stub.localStore.has(PLAN_SHEET_KEY)).toBe(false);
    expect(await consumePlanSheet()).toBe(false);
  });
});
