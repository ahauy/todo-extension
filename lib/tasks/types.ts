/**
 * Domain types cho todo-extension (L2-T04).
 * Đây là hợp đồng dữ liệu duy nhất của extension — dùng bởi adapter, recurrence, query, UI.
 * Không logic nghiệp vụ, chỉ kiểu dữ liệu.
 *
 * Storage layout (chrome.storage.sync):
 *   - `t:<uuid>` → Task (1 key/task, atomic per key)
 *   - `settings` → Settings
 */

export type Priority = "low" | "medium" | "high";

export type RecurrenceKind = "none" | "daily" | "weekly" | "monthly";

export interface WeeklyRule {
  /** 0=CN … 6=T7, phải có ≥1 phần tử (validation ở L4-T11) */
  weekdays: number[];
}

export interface MonthlyRule {
  /** 1..31, nếu ngày không tồn tại trong tháng → clamp về ngày cuối tháng */
  day: number;
}

export type RecurrenceRule =
  | { kind: "none" }
  | { kind: "daily" }
  | { kind: "weekly"; rule: WeeklyRule }
  | { kind: "monthly"; rule: MonthlyRule };

export interface Subtask {
  id: string;
  title: string;
  done: boolean;
}

export interface Task {
  id: string;           // uuid
  title: string;
  note: string;         // tối đa 1000 ký tự
  priority: Priority;
  dueAt: string | null; // ISO 8601, local time thiết bị (không UTC)
  recurrence: RecurrenceRule;
  tags: string[];       // ≤ 5 chip
  subtasks: Subtask[];  // ≤ 50
  done: boolean;
  createdAt: string;    // ISO 8601
  updatedAt: string;    // ISO 8601
}

export interface Settings {
  theme: "system" | "light" | "dark";
  notificationsEnabled: boolean;
}

/** Storage key prefix cho task (1 key/task) */
export const TASK_KEY_PREFIX = "t:";

/** Storage key cho settings (1 key duy nhất) */
export const SETTINGS_KEY = "settings";

/** Tạo storage key từ task id */
export function taskKey(id: string): string {
  return `${TASK_KEY_PREFIX}${id}`;
}
