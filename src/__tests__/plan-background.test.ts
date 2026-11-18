/**
 * R-22 — background wiring: plan alarm → notification, notification click →
 * cờ mở sheet + mở bảng, đổi/tắt settings → resync alarm. Dùng defineBackground
 * bị mock để chạy callback init với chrome stub thật (không extension thật).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createChromeStub, type ChromeStub } from './helpers/chrome-stub';
import {
  DEFAULT_SETTINGS,
  PLAN_ALARM_NAME,
  PLAN_SHEET_KEY,
  TASK_KEY_PREFIX,
  type Task,
} from '../../lib/tasks/types';

vi.mock('wxt/utils/define-background', () => ({
  defineBackground: (init: () => void) => init,
}));

const flush = () => new Promise<void>((resolve) => setTimeout(resolve, 0));
const settle = async () => { await flush(); await flush(); };

function taskFixture(): Task {
  return {
    id: 't1',
    title: 'Việc có hạn',
    note: '',
    priority: 'medium',
    dueAt: '2035-01-01T18:00',
    recurrence: { kind: 'none' },
    tags: [],
    subtasks: [],
    done: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

let stub: ChromeStub;
let initBackground: () => void;

beforeEach(async () => {
  vi.resetModules();
  stub = createChromeStub();
  stub.seed({ settings: { ...DEFAULT_SETTINGS } });
  stub.install();
  const { default: init } = await import('../../entrypoints/background');
  initBackground = init as unknown as () => void;
  initBackground();
});

afterEach(() => {
  document.body.innerHTML = '';
});

describe('R-22 — background plan reminder', () => {
  it('onInstalled / onStartup tạo đúng 1 plan alarm', async () => {
    stub.emitInstalled();
    await settle();
    expect([...stub.alarms.keys()]).toEqual([PLAN_ALARM_NAME]);

    stub.alarms.delete(PLAN_ALARM_NAME);
    stub.emitStartup();
    await settle();
    expect([...stub.alarms.keys()]).toEqual([PLAN_ALARM_NAME]);
  });

  it('tắt nhắc → onInstalled/onStartup không tạo plan alarm', async () => {
    stub.seed({
      settings: { ...DEFAULT_SETTINGS, planReminder: { enabled: false, at: '21:00' } },
    });
    stub.emitInstalled();
    stub.emitStartup();
    await settle();
    expect(stub.alarms.size).toBe(0);
  });

  it('onAlarm plan → notification riêng, alarm được ép lại cho ngày kế', async () => {
    stub.alarms.set(PLAN_ALARM_NAME, { when: Date.now() - 1000 });
    stub.emitAlarm(PLAN_ALARM_NAME);
    await settle();

    expect(stub.notificationsCreated.filter((n) => n.id.startsWith('plan:'))).toHaveLength(1);
    expect([...stub.alarms.keys()]).toEqual([PLAN_ALARM_NAME]);
    expect(stub.alarms.get(PLAN_ALARM_NAME)?.when).toBeGreaterThan(Date.now());
  });

  it('notificationsEnabled=false → không gửi notification kế hoạch', async () => {
    stub.seed({ settings: { ...DEFAULT_SETTINGS, notificationsEnabled: false } });
    stub.emitAlarm(PLAN_ALARM_NAME);
    await settle();
    expect(stub.notificationsCreated).toHaveLength(0);
  });

  it('planReminder.enabled=false → onAlarm vẫn không gửi notification (defense-in-depth)', async () => {
    stub.seed({
      settings: { ...DEFAULT_SETTINGS, planReminder: { enabled: false, at: '21:00' } },
    });
    stub.emitAlarm(PLAN_ALARM_NAME);
    await settle();
    expect(stub.notificationsCreated).toHaveLength(0);
  });

  it('bấm notification việc đến hạn → không mở sheet kế hoạch', async () => {
    const before = stub.tabsCreated.length;
    stub.emitNotificationClick('due:t1');
    await settle();
    expect(stub.localStore.has(PLAN_SHEET_KEY)).toBe(false);
    expect(stub.tabsCreated).toHaveLength(before);
  });

  it('bấm notification plan → ghi cờ mở sheet + mở bảng Học Đường', async () => {
    stub.emitNotificationClick('plan:123');
    await settle();
    expect(stub.localStore.get(PLAN_SHEET_KEY)).toBe(true);
    expect(stub.tabsCreated).toHaveLength(1);
    expect(String(stub.tabsCreated[0]?.url)).toContain('newtab.html');
  });

  it('đổi settings tắt nhắc → clear alarm; bật lại → alarm mới', async () => {
    stub.seed({
      settings: {
        ...DEFAULT_SETTINGS,
        planReminder: { enabled: false, at: '21:00' },
      },
    });
    stub.emitChange(['settings'], 'sync');
    await settle();
    expect(stub.alarms.size).toBe(0);

    stub.seed({
      settings: {
        ...DEFAULT_SETTINGS,
        planReminder: { enabled: true, at: '22:30' },
      },
    });
    stub.emitChange(['settings'], 'sync');
    await settle();
    expect([...stub.alarms.keys()]).toEqual([PLAN_ALARM_NAME]);
    const when = new Date(stub.alarms.get(PLAN_ALARM_NAME)?.when ?? 0);
    expect(when.getHours()).toBe(22);
    expect(when.getMinutes()).toBe(30);
  });

  it('notification việc đến hạn vẫn đi luồng cũ, không mở sheet kế hoạch', async () => {
    stub.seed({ [`${TASK_KEY_PREFIX}t1`]: taskFixture() });
    stub.emitAlarm('due:t1');
    await settle();
    expect(stub.notificationsCreated.map((n) => n.id)).toContain('due:t1');
    expect(stub.localStore.has(PLAN_SHEET_KEY)).toBe(false);
  });
});
