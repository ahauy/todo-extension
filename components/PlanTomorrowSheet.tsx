/**
 * R-22 — Sheet "Kế hoạch mai": chọn tối đa 5 việc từ Sắp tới/Chưa hẹn, gán
 * `plannedFor = mai` và chọn 1 làm ếch cho ngày mai (dùng chung dayPlan R-21).
 * Không lưu aggregate, không thêm tab/navigation mới.
 */
import React, { useCallback, useState } from 'react';
import Modal from './ui/Modal';
import Button from './ui/Button';
import type { Task } from '../lib/tasks/types';

const MAX_PLANNED = 5;

interface PlanTomorrowSheetProps {
  open: boolean;
  tasks: Task[];
  dayLabel: string;
  onClose: () => void;
  onSave: (taskIds: string[], frogTaskId: string | null) => void;
}

export default function PlanTomorrowSheet({
  open,
  tasks,
  dayLabel,
  onClose,
  onSave,
}: PlanTomorrowSheetProps) {
  const [selected, setSelected] = useState<string[]>([]);
  const [frogId, setFrogId] = useState<string | null>(null);

  const toggle = useCallback((id: string, checked: boolean) => {
    setSelected((previous) => {
      if (checked) {
        if (previous.includes(id) || previous.length >= MAX_PLANNED) return previous;
        return [...previous, id];
      }
      const next = previous.filter((item) => item !== id);
      setFrogId((current) => (current === id ? null : current));
      return next;
    });
  }, []);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Kế hoạch mai"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} data-autofocus>
            Để mai tính
          </Button>
          <Button
            variant="primary"
            disabled={selected.length === 0}
            onClick={() => onSave(selected, frogId)}
          >
            Lưu kế hoạch
          </Button>
        </>
      }
    >
      <p className="text-body-sm text-umber mb-base">
        Chọn tối đa {MAX_PLANNED} việc cho {dayLabel}. Việc đã hẹn không đổi hạn chót.
      </p>
      <div className="stack gap-xs" role="group" aria-label="Việc cho ngày mai">
        {tasks.length === 0 && (
          <p className="text-body-sm text-umber">Sổ đang hết việc để hẹn. Cứ ghi thêm trước đã.</p>
        )}
        {tasks.map((task) => {
          const checked = selected.includes(task.id);
          return (
            <div key={task.id} className="stack gap-xs">
              <label className="flex items-center gap-sm text-body-sm text-brown">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(event) => toggle(task.id, event.target.checked)}
                  aria-label={`Chọn ${task.title} cho ngày mai`}
                />
                {task.title}
              </label>
              {checked && (
                <label className="flex items-center gap-sm text-caption text-umber">
                  <input
                    type="radio"
                    name="frog-tomorrow"
                    checked={frogId === task.id}
                    onChange={() => setFrogId(task.id)}
                  />
                  Làm đầu tiên (ếch cho mai)
                </label>
              )}
            </div>
          );
        })}
      </div>
      {selected.length >= MAX_PLANNED && (
        <p className="text-caption text-umber mt-base">
          Đã đủ {MAX_PLANNED} việc — bỏ chọn một việc nếu muốn đổi.
        </p>
      )}
    </Modal>
  );
}
