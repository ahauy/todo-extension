/**
 * FEAT-003 Gói A — phase 1: data contract + pure logic only (no UI).
 * Phủ: archived bị loại ở mọi cổng, filterByKeystone, sort deterministic,
 * dayPlan prune/quota, summary suy từ lastDoneAt/updatedAt, frog hết hạn theo ngày.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createChromeStub, type ChromeStub } from './helpers/chrome-stub';
import {
  DAY_PLAN_DAYS,
  StorageQuotaError,
  loadDayPlan,
  putDayPlan,
} from '../../lib/storage/adapter';
import { startOfWeekLocal, weekKey } from '../../lib/datetime';
import {
  activeCount,
  dueTodayCount,
  filterByBoard,
  filterByKeystone,
  filterBySubject,
  overdueCount,
  searchTasks,
  sortBoard,
  todayKeystoneSummary,
  weeklySummary,
} from '../../lib/tasks/query';
import { DAY_PLAN_KEY, type DayPlan, type Task } from '../../lib/tasks/types';

const NOW = new Date(2035, 0, 17, 15, 0); // Thứ Năm 17/01/2035 (local)
const MON = new Date(2035, 0, 15, 0, 0); // Thứ Hai đầu tuần

function localISO(y: number, m: number, d: number, h = 10): string {
  return new Date(y, m - 1, d, h).toISOString();
}

function makeTask(overrides: Partial<Task> & Pick<Task, 'id'>): Task {
  const { id, ...rest } = overrides;
  return {
    id,
    title: id,
    note: '',
    priority: 'medium',
    dueAt: null,
    recurrence: { kind: 'none' },
    tags: [],
    subtasks: [],
    done: false,
    createdAt: localISO(2035, 1, 1),
    updatedAt: localISO(2035, 1, 1),
    ...rest,
  };
}

const ids = (tasks: Task[]) => tasks.map((task) => task.id);

/* ── archived bị loại ở MỌI cổng vào ─────────────────────────────────────── */
describe('archived — không task ma ở filter/count', () => {
  const tasks: Task[] = [
    makeTask({ id: 'open-today', dueAt: '2035-01-17T18:00', subjectId: 's1', keystone: true }),
    makeTask({ id: 'open-tomorrow', dueAt: '2035-01-18T18:00', subjectId: 's2' }),
    makeTask({ id: 'open-no-subject' }),
    makeTask({ id: 'done-today', done: true, lastDoneAt: localISO(2035, 1, 17, 9), keystone: true, subjectId: 's3' }),
    makeTask({ id: 'arch-open', archived: true, dueAt: '2035-01-17T18:00', subjectId: 's1', keystone: true }),
    makeTask({ id: 'arch-overdue', archived: true, dueAt: '2035-01-01T18:00' }),
    makeTask({ id: 'arch-done', archived: true, done: true, lastDoneAt: localISO(2035, 1, 17, 9), keystone: true }),
  ];
  const visible = ['open-today', 'open-tomorrow', 'open-no-subject', 'done-today'];

  it('searchTasks (rỗng và có query) loại archived', () => {
    expect(ids(searchTasks(tasks, ''))).toEqual(visible);
    expect(ids(searchTasks(tasks, 'arch'))).toEqual([]);
  });

  it('filterByBoard loại archived ở cả 4 tab', () => {
    expect(ids(filterByBoard(tasks, 'all', NOW))).toEqual(visible);
    expect(ids(filterByBoard(tasks, 'today', NOW))).toEqual(['open-today']);
    expect(ids(filterByBoard(tasks, 'upcoming', NOW))).toEqual(['open-tomorrow']);
    expect(ids(filterByBoard(tasks, 'done', NOW))).toEqual(['done-today']);
  });

  it('filterBySubject loại archived (all/none/có subject)', () => {
    expect(ids(filterBySubject(tasks, 'all'))).toEqual(visible);
    expect(ids(filterBySubject(tasks, 'none'))).toEqual(['open-no-subject']);
    expect(ids(filterBySubject(tasks, 's1'))).toEqual(['open-today']);
  });

  it('mọi count đều loại archived', () => {
    expect(dueTodayCount(tasks, NOW)).toBe(1);
    expect(overdueCount(tasks, NOW)).toBe(0);
    expect(activeCount(tasks)).toBe(3);
  });

  it('filterByKeystone = keystone && !archived', () => {
    expect(ids(filterByKeystone(tasks))).toEqual(['open-today', 'done-today']);
  });
});

/* ── sort giữ nguyên R-15 ─────────────────────────────────────────────────── */
describe('filterByKeystone + sortBoard — deterministic 2 lần (R-15)', () => {
  const tied = [
    makeTask({ id: 'b', keystone: true, priority: 'high', dueAt: '2035-01-20T09:00' }),
    makeTask({ id: 'a', keystone: true, priority: 'high', dueAt: '2035-01-20T09:00' }),
    makeTask({ id: 'c', archived: true, keystone: true, priority: 'high', dueAt: '2035-01-20T09:00' }),
    makeTask({ id: 'd', dueAt: null }),
  ];

  it('chạy 2 lần và đảo input cho cùng thứ tự, trước và sau khi lọc chip', () => {
    const raw = ids(sortBoard(tied, 'deadline', NOW));
    expect(ids(sortBoard(tied, 'deadline', NOW))).toEqual(raw);
    expect(ids(sortBoard([...tied].reverse(), 'deadline', NOW))).toEqual(raw);

    const filtered = filterByKeystone(tied);
    const sorted = ids(sortBoard(filtered, 'deadline', NOW));
    expect(sorted).toEqual(ids(sortBoard(filtered, 'deadline', NOW)));
    expect(sorted).toEqual(ids(sortBoard([...filtered].reverse(), 'deadline', NOW)));
    expect(sorted).toEqual(['a', 'b']); // tie-breaker id giữ nguyên
  });
});

/* ── dayPlan storage ──────────────────────────────────────────────────────── */
let stub: ChromeStub;

beforeEach(() => {
  stub = createChromeStub();
  stub.install();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('putDayPlan — 1 key, prune 14, quota guard', () => {
  it('chỉ ghi đúng 1 key dayPlan, không tạo key theo ngày', async () => {
    stub.seed({ 't:keep': makeTask({ id: 'keep' }) });
    const plan: DayPlan = { '2035-01-17': { frogTaskId: 'frog' } };

    await putDayPlan(plan);

    expect(DAY_PLAN_KEY).toBe('dayPlan');
    expect([...stub.store.keys()].sort()).toEqual(['dayPlan', 't:keep']);
    expect(await loadDayPlan()).toEqual(plan);
    expect(stub.store.has('2035-01-17')).toBe(false);
  });

  it('giữ 14 dayKey mới nhất (sort từ điển = sort thời gian)', async () => {
    const plan: DayPlan = {};
    for (let day = 1; day <= 20; day += 1) {
      const key = `2035-01-${`${day}`.padStart(2, '0')}`;
      plan[key] = { frogTaskId: `frog-${day}` };
    }

    await putDayPlan(plan);
    const saved = await loadDayPlan();
    const keys = Object.keys(saved).sort();

    expect(keys).toHaveLength(DAY_PLAN_DAYS);
    expect(keys[0]).toBe('2035-01-07');
    expect(keys[keys.length - 1]).toBe('2035-01-20');
  });

  it('lỗi quota vẫn là StorageQuotaError', async () => {
    vi.spyOn(chrome.storage.sync, 'set').mockImplementation((_items, callback) => {
      chrome.runtime.lastError = { message: 'QUOTA_BYTES quota exceeded' };
      callback?.();
    });

    await expect(putDayPlan({ '2035-01-17': { frogTaskId: 'frog' } })).rejects.toBeInstanceOf(
      StorageQuotaError
    );
  });
});

/* ── frog hết hạn theo ngày local ─────────────────────────────────────────── */
describe('frog — đổi ngày tự hết hiệu lực', () => {
  async function selectFrog(dayKey: string, taskId: string | null): Promise<void> {
    const plan = await loadDayPlan();
    await putDayPlan({ ...plan, [dayKey]: { frogTaskId: taskId } });
  }
  const frogFor = (plan: DayPlan, dayKey: string): string | null =>
    plan[dayKey]?.frogTaskId ?? null;

  it('cùng ngày thay thế; sang ngày khác trả null; bỏ chọn trả null', async () => {
    await selectFrog('2035-01-17', 'frog-a');
    let plan = await loadDayPlan();
    expect(frogFor(plan, '2035-01-17')).toBe('frog-a');
    expect(frogFor(plan, '2035-01-18')).toBe(null); // tự hết hiệu lực sang ngày khác

    await selectFrog('2035-01-17', 'frog-b');
    plan = await loadDayPlan();
    expect(frogFor(plan, '2035-01-17')).toBe('frog-b'); // thay thế cùng ngày

    await selectFrog('2035-01-18', 'frog-c');
    plan = await loadDayPlan();
    expect(frogFor(plan, '2035-01-17')).toBe('frog-b');
    expect(frogFor(plan, '2035-01-18')).toBe('frog-c');

    await selectFrog('2035-01-18', null);
    expect(frogFor(await loadDayPlan(), '2035-01-18')).toBe(null);
  });
});

/* ── summary suy từ task, KHÔNG đọc studyLog aggregate ────────────────────── */
describe('todayKeystoneSummary / weeklySummary', () => {
  const summaryTasks: Task[] = [
    makeTask({ id: 'k-open', keystone: true }),
    makeTask({ id: 'k-done-mon', keystone: true, done: true, lastDoneAt: localISO(2035, 1, 15, 10) }),
    makeTask({ id: 'k-done-today', keystone: true, lastDoneAt: localISO(2035, 1, 17, 9) }),
    makeTask({ id: 'k-done-before', keystone: true, done: true, updatedAt: localISO(2035, 1, 14, 10) }),
    makeTask({ id: 'plain-done-tue', done: true, updatedAt: localISO(2035, 1, 16, 12) }),
    makeTask({ id: 'plain-done-before', done: true, updatedAt: localISO(2035, 1, 14, 12) }),
    makeTask({ id: 'arch-done-today', archived: true, keystone: true, done: true, lastDoneAt: localISO(2035, 1, 17, 8) }),
  ];

  it('startOfWeekLocal / weekKey dùng Thứ 2 local (kể cả khi now là CN)', () => {
    expect(weekKey(NOW)).toBe('2035-01-15');
    expect(startOfWeekLocal(NOW).getTime()).toBe(MON.getTime());
    expect(weekKey(new Date(2035, 0, 14, 12))).toBe('2035-01-08'); // CN ← tuần trước
  });

  it('today: done lấy lastDoneAt, bỏ qua task xong ngày khác/archived', () => {
    stub.seed({ studyLog: { '2035-01-17': { tasks: 999, focus: 999 } } });
    expect(todayKeystoneSummary(summaryTasks, NOW)).toEqual({ done: 1, total: 2 });
  });

  it('week: Thứ 2 → hiện tại, keystone a/b + tasksDone đúng dữ liệu thật', () => {
    stub.seed({ studyLog: { '2035-01-17': { tasks: 999, focus: 999 } } });
    const plan: DayPlan = { '2035-01-17': { frogTaskId: 'k-open' } };

    expect(weeklySummary(summaryTasks, plan, NOW)).toEqual({
      keystoneDone: 2,
      keystoneTotal: 3,
      tasksDone: 3,
    });
    // dayPlan/studyLog không đổi kết quả — số liệu suy từ task.
    expect(weeklySummary(summaryTasks, {}, NOW)).toEqual({
      keystoneDone: 2,
      keystoneTotal: 3,
      tasksDone: 3,
    });
  });
});
