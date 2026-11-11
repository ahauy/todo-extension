/**
 * Ngày giờ và chữ hiển thị hạn chót. Mọi mốc so sánh dùng giờ địa phương của
 * thiết bị — dueAt trong storage là ISO local, không quy về UTC.
 */
export type DayPart = 'morning' | 'afternoon' | 'evening' | 'night';

const WEEKDAYS = [
  'Chủ nhật',
  'Thứ Hai',
  'Thứ Ba',
  'Thứ Tư',
  'Thứ Năm',
  'Thứ Sáu',
  'Thứ Bảy',
];

/** Khoá ngày địa phương YYYY-MM-DD cho nhật ký học */
export function dayKey(date: Date): string {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, '0');
  const d = `${date.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

export function clockText(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = `${Math.floor(total / 60)}`.padStart(2, '0');
  const s = `${total % 60}`.padStart(2, '0');
  return `${m}:${s}`;
}

function hourMinute(date: Date): string {
  return `${`${date.getHours()}`.padStart(2, '0')}:${`${date.getMinutes()}`.padStart(2, '0')}`;
}

export type DeadlineTone = 'plain' | 'soon' | 'overdue';

export interface DeadlineText {
  label: string;
  tone: DeadlineTone;
}

/** "Hôm nay 18:00" · "Ngày mai 07:30" · "Quá hạn · Thứ Ba 09:00" */
export function deadlineText(dueAt: string, now: Date, done: boolean): DeadlineText {
  const due = new Date(dueAt);
  if (Number.isNaN(due.getTime())) return { label: 'Hạn không hợp lệ', tone: 'plain' };

  const days = Math.round((startOfDay(due) - startOfDay(now)) / 86_400_000);
  const time = hourMinute(due);

  if (!done && due.getTime() < now.getTime()) {
    const when = days === 0 ? 'hôm nay' : days === -1 ? 'hôm qua' : `${-days} ngày trước`;
    return { label: `Quá hạn · ${when} ${time}`, tone: 'overdue' };
  }
  if (days === 0) return { label: `Hôm nay ${time}`, tone: done ? 'plain' : 'soon' };
  if (days === 1) return { label: `Ngày mai ${time}`, tone: done ? 'plain' : 'soon' };
  if (days > 1 && days <= 6) {
    return { label: `${WEEKDAYS[due.getDay()]} ${time}`, tone: 'plain' };
  }
  return {
    label: `${due.getDate()} thg ${due.getMonth() + 1} · ${time}`,
    tone: 'plain',
  };
}

/** "Thứ Tư, ngày 11 tháng 11 năm 2026" */
export function longDate(date: Date): string {
  return `${WEEKDAYS[date.getDay()]}, ngày ${date.getDate()} tháng ${date.getMonth() + 1} năm ${date.getFullYear()}`;
}

export interface Greeting {
  title: string;
  part: DayPart;
}

export function greetingFor(date: Date): Greeting {
  const h = date.getHours();
  if (h >= 5 && h < 11) return { title: 'Chào buổi sáng', part: 'morning' };
  if (h >= 11 && h < 14) return { title: 'Chào buổi trưa', part: 'afternoon' };
  if (h >= 14 && h < 18) return { title: 'Chào buổi chiều', part: 'afternoon' };
  if (h >= 18 && h < 22) return { title: 'Chào buổi tối', part: 'evening' };
  return { title: 'Đêm đã khuya', part: 'night' };
}

/** dueAt lưu local, không có hậu tố Z — cắt chuỗi cho input datetime-local */
export function toLocalInput(iso: string | null): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return `${dayKey(date)}T${hourMinute(date)}`;
}

export function fromLocalInput(value: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  // Giữ dạng local không hậu tố Z — cùng định dạng dữ liệu đã lưu từ trước.
  return Number.isNaN(date.getTime()) ? null : value;
}