/**
 * Domain types cho todo-extension "Học Đường".
 * Đây là hợp đồng dữ liệu duy nhất của extension — dùng bởi adapter, recurrence, query, UI.
 *
 * Storage layout (chrome.storage.sync):
 *   - `t:<uuid>`  → Task (1 key/task, atomic per key)
 *   - `settings`  → Settings
 *   - `subjects`  → Subject[] (danh sách nhỏ, 1 key)
 *   - `studyLog`  → StudyLog (nhật ký 60 ngày gần nhất để tính chuỗi)
 * chrome.storage.local:
 *   - `pomodoro`  → PomodoroState (đồng hồ đang chạy, không đồng bộ giữa máy)
 */

export type Priority = "low" | "medium" | "high";

export type RecurrenceKind = "none" | "daily" | "weekly" | "monthly";

export interface WeeklyRule {
  /** 0=CN … 6=T7, phải có ≥1 phần tử */
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

/**
 * R-23 — Sổ theo dõi thói quen, nhúng ngay trong key `t:<id>` (KHÔNG tạo key
 * storage mới). Opt-in: task cũ/thiếu field coi như không theo dõi.
 */
export interface Habit {
  /** Instant ISO 8601 UTC (có `Z`) lúc bật theo dõi. */
  startedAt: string;
  /** Tập `YYYY-MM-DD` theo giờ local: unique, tăng dần, tối đa 31 phần tử. */
  doneDays: string[];
}

/** R-23 — trần số ngày lưu trong `doneDays` (cửa sổ streak tối đa). */
export const HABIT_MAX_DAYS = 31;

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
  /**
   * Hạn chót — **wall-clock local** `YYYY-MM-DDTHH:mm`, KHÔNG có hậu tố `Z`/offset
   * ("8 giờ sáng mai" vẫn là 8 giờ địa phương khi đổi múi giờ/DST).
   * Hai nhóm field thời gian, đừng trộn: wall-clock local = `dueAt`, `prevDueAt`;
   * instant thật ISO UTC có `Z` = `createdAt`, `updatedAt`, `lastDoneAt`.
   */
  dueAt: string | null;
  recurrence: RecurrenceRule;
  tags: string[];       // ≤ 5 chip
  subtasks: Subtask[];  // ≤ 50
  /** Môn học (gáy sách). Task cũ chưa có trường này → coi như null. */
  subjectId?: string | null;
  done: boolean;
  /** ISO 8601 (UTC) lần đóng dấu gần nhất. Việc lặp dùng để hiện trạng thái
   *  "đã làm hôm nay · hẹn ngày kế tiếp" (done-today) cho tới khi sang ngày.
   *  Task cũ chưa có trường này → undefined (coi như chưa đóng dấu hôm nay). */
  lastDoneAt?: string | null;
  /** R-21 — Việc then chốt ("20%"). Mặc định `false` khi thiếu. Bật tự gán
   *  `priority='high'`; TẮT KHÔNG tự hạ priority. Chỉ là nhãn lọc, không đổi enum. */
  keystone?: boolean;
  /** R-21 — Việc bị cắt bỏ. Mặc định `false` khi thiếu. Luôn bị loại khỏi mọi
   *  tab/filter/search/bộ đếm/danh sách môn nhưng VẪN nằm trong storage để phục hồi. */
  archived?: boolean;
  /**
   * R-22 — ngày dự định **LÀM** (`YYYY-MM-DD` local), tách khỏi `dueAt` (hạn chót).
   * Không tự tạo alarm, không đổi overdue/sort; task cũ thiếu field coi như chưa có kế hoạch.
   */
  plannedFor?: string | null;
  /** Bản sao **wall-clock local** `YYYY-MM-DDTHH:mm` (không `Z`) của hạn vừa
   *  hoàn thành — Hoàn tác hôm nay gán thẳng `dueAt = prevDueAt`, 0 quy đổi. */
  prevDueAt?: string | null;
  /**
   * R-23 — sổ thói quen opt-in, nằm trong cùng key `t:<id>`. Task cũ thiếu field
   * vẫn load bình thường. Tắt toggle / `recurrence.kind='none'` / `archived` chỉ
   * ẩn ở lớp hiển thị — data layer KHÔNG xoá field này.
   */
  habit?: Habit;
  /**
   * R-24 — giờ bắt đầu **wall-clock local** `"HH:mm"` (00:00–23:59), nhúng ngay
   * trong key `t:<id>` (không key storage mới). Chỉ là giờ TRONG NGÀY: không đổi
   * nghĩa `plannedFor`/`dueAt`, không tạo/xoá alarm `due:<id>`, không đổi sort R-15.
   * Task cũ thiếu field → coi như chưa xếp giờ.
   */
  startAt?: string;
  /** R-24/R-25 — độ dài block dự kiến (phút), hợp lệ 15–240. Trống = 30 khi có `startAt`. */
  estimateMin?: number;
  /**
   * R-25 — giờ **kết thúc** wall-clock local `"HH:mm"` (00:00–23:59), nhúng trong
   * cùng key `t:<id>`. Là NGUỒN THẬT của khoảng thời gian: khi có giá trị,
   * `estimateMin` được suy ra (`end − start`, qua nửa đêm +1440′). Task cũ thiếu
   * field vẫn load bình thường và tiếp tục dùng `estimateMin` đã lưu.
   */
  endAt?: string;
  createdAt: string;    // ISO 8601 UTC có `Z` (instant) — khác nhóm với dueAt
  updatedAt: string;    // ISO 8601 UTC có `Z` (instant)
}

/** Môn học — một gáy sách trên Giá sách */
export interface Subject {
  id: string;
  name: string;
  /** Thứ tự nhận màu gáy sách; môn thứ 6 trở đi dùng nâu bạc. */
  order: number;
  createdAt: string;
}

export type DisplayMode = "popup" | "newtab" | "auto";
export type QuillStyle = "pen" | "hand";
export type PomodoroPreset = "25/5" | "50/10";

export interface Settings {
  notificationsEnabled: boolean;
  /** Popup · New Tab · Tự động — xem docs/DESIGN.md § Display Modes */
  displayMode: DisplayMode;
  quillStyle: QuillStyle;
  quillEffect: boolean;
  ornaments: boolean;
  lacquerSheen: boolean;
  pomodoroPreset: PomodoroPreset;
  soundEnabled: boolean;
  /** R-22 — nhắc lập kế hoạch ngày mai; mặc định bật sẵn lúc 21:00 giờ local. */
  planReminder: { enabled: boolean; at: string };
}

export const DEFAULT_SETTINGS: Settings = {
  notificationsEnabled: true,
  displayMode: "auto",
  quillStyle: "pen",
  quillEffect: true,
  ornaments: true,
  lacquerSheen: true,
  pomodoroPreset: "25/5",
  soundEnabled: false,
  planReminder: { enabled: true, at: "21:00" },
};

/** Một ngày trong nhật ký học: số việc đóng dấu + số phiên tập trung trọn vẹn */
export interface StudyDay {
  tasks: number;
  focus: number;
}
export type StudyLog = Record<string, StudyDay>;

export interface PomodoroState {
  phase: "focus" | "break";
  running: boolean;
  /** epoch ms lúc hết phiên khi đang chạy; null khi tạm dừng */
  endsAt: number | null;
  /** ms còn lại khi tạm dừng */
  remaining: number;
  /** Việc đang học cùng, nếu có */
  taskId: string | null;
  /**
   * R-20 — LOCAL-ONLY: số lần đổi việc/tick việc khác trong phiên focus hiện tại.
   * Chỉ sống trong phiên: khởi tạo 0 khi bắt đầu focus, +1 qua noteInterruption(),
   * xoá khi reset/skip/kết thúc phiên. KHÔNG ghi vào StudyLog, KHÔNG sync.
   * Field optional để state cũ (chưa có R-20) vẫn load được — consumer dùng `?? 0`.
   */
  interruptions?: number;
  /**
   * G10 — LOCAL-ONLY: định danh phiên focus, sinh mới mỗi lần `start()` ở phase focus.
   * Làm idempotency key để popup + New Tab cùng nhận 1 natural completion nhưng
   * chỉ ghi `studyLog.focus` đúng 1 lần. Optional để state cũ vẫn load được —
   * consumer fallback theo `endsAt` của phiên đó.
   */
  focusSessionId?: string;
}

/** Storage key prefix cho task (1 key/task) */
export const TASK_KEY_PREFIX = "t:";
export const SETTINGS_KEY = "settings";
export const SUBJECTS_KEY = "subjects";
export const STUDY_LOG_KEY = "studyLog";
export const POMODORO_KEY = "pomodoro";
/** G10 — marker tiêu thụ completion, nằm riêng để state cũ không bị ghi đè */
export const FOCUS_CLAIM_KEY = "focusCompletionClaim";
/** R-21 — 1 key duy nhất cho "con ếch hôm nay" (KHÔNG tạo key theo ngày). */
export const DAY_PLAN_KEY = "dayPlan";
/** R-22 — alarm nhắc lập kế hoạch (1 cái/ngày) + cờ local yêu cầu mở sheet. */
export const PLAN_ALARM_NAME = "plan:tomorrow";
export const PLAN_SHEET_KEY = "planSheetRequest";

/**
 * R-21 — Kế hoạch ngày, lưu trong 1 key `dayPlan`.
 * `dayKey = YYYY-MM-DD` local; prune còn 14 ngày gần nhất mỗi lần ghi.
 * Shape additive: Gói B sẽ mở rộng cùng key này (không đưa `plannedIds` vào Gói A).
 */
export interface DayPlan {
  [dayKey: string]: { frogTaskId: string | null };
}

/** Tạo storage key từ task id */
export function taskKey(id: string): string {
  return `${TASK_KEY_PREFIX}${id}`;
}