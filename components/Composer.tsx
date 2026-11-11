/**
 * Khu ghi việc. Mặc định chỉ một dòng bút lông + nút GHI VÀO SỔ — ghi nhanh
 * rồi đi. Mở "Chi tiết" mới bày môn học, hạn, ưu tiên, lặp lại, thẻ, việc nhỏ.
 * Enter trong ô bút lông ghi luôn; đang ghép dấu thì Enter không ghi.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import QuillInput from './ui/QuillInput';
import Button from './ui/Button';
import TaskFields from './TaskFields';
import { ChevronDownIcon, PlusIcon } from './art/Icons';
import { Inkwell } from './art/QuillArt';
import {
  emptyForm,
  formError,
  formToDraft,
  type TaskDraft,
  type TaskForm,
} from '../lib/tasks/form';
import type { Settings, Subject } from '../lib/tasks/types';

interface ComposerProps {
  subjects: Subject[];
  settings: Settings;
  defaultSubjectId: string | null;
  expandSignal?: number;
  large?: boolean;
  onSubmit: (draft: TaskDraft) => void;
}

export default function Composer({
  subjects,
  settings,
  defaultSubjectId,
  expandSignal,
  large = false,
  onSubmit,
}: ComposerProps) {
  const [form, setForm] = useState<TaskForm>(() => emptyForm(defaultSubjectId));
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastSignal = useRef(expandSignal);
  const errorId = React.useId();

  useEffect(() => {
    if (expandSignal !== undefined && expandSignal !== lastSignal.current) {
      lastSignal.current = expandSignal;
      inputRef.current?.focus();
    }
  }, [expandSignal]);

  useEffect(() => {
    setForm((prev) => (prev.subjectId === null ? { ...prev, subjectId: defaultSubjectId } : prev));
  }, [defaultSubjectId]);

  const patch = useCallback((next: Partial<TaskForm>) => {
    setForm((prev) => ({ ...prev, ...next }));
    setError(null);
  }, []);

  const invalid = useMemo(() => formError(form) !== null, [form]);

  const submit = useCallback(() => {
    const problem = formError(form);
    if (problem) {
      setError(problem);
      inputRef.current?.focus();
      return;
    }
    onSubmit(formToDraft({ ...form, subtasks: form.subtasks.map((item) => ({ ...item, done: false })) }));
    setForm(emptyForm(defaultSubjectId));
    setError(null);
    setExpanded(false);
  }, [form, onSubmit, defaultSubjectId]);

  return (
    <section aria-label="Ghi việc vào sổ" className="stack gap-xs">
      <div className="composer-row flex items-start gap-sm">
        <div className="min-w-0 flex-1">
          <QuillInput
            ref={inputRef}
            value={form.title}
            onChange={(value) => patch({ title: value })}
            onSubmit={submit}
            placeholder="Hôm nay con cần làm gì?"
            aria-label="Tên việc cần ghi"
            quillStyle={settings.quillStyle}
            effectEnabled={settings.quillEffect}
            invalid={!!error}
            describedBy={error ? errorId : undefined}
            action={
              <button
                type="button"
                onClick={() => setExpanded((value) => !value)}
                aria-expanded={expanded}
                aria-label={expanded ? 'Thu gọn chi tiết việc' : 'Mở chi tiết việc'}
                title={expanded ? 'Thu gọn' : 'Chi tiết: môn, hạn, ưu tiên, lặp lại'}
                className="btn-icon size-9"
                data-active={expanded}
              >
                <ChevronDownIcon
                  size={16}
                  className={expanded ? 'rotate-180 transition-transform' : 'transition-transform'}
                />
              </button>
            }
          />
        </div>
        <Button variant="primary" onClick={submit} disabled={invalid} className="composer-submit flex-none">
          {large ? 'Ghi vào sổ' : 'Ghi'}
        </Button>
      </div>

      {error && (
        <p id={errorId} role="alert" className="text-body-sm text-critical">
          {error}
        </p>
      )}

      {large && !expanded && (
        <p className="flex items-center gap-xs text-caption text-umber">
          <Inkwell size={20} className="text-sepia" />
          Enter để ghi ngay. Nút mũi tên mở môn học, hạn chót, ưu tiên và việc nhỏ.
        </p>
      )}

      {expanded && (
        <div className="scroll-task mt-xs">
          <TaskFields form={form} subjects={subjects} onChange={patch} />
          <div className="mt-base flex justify-end">
            <Button variant="ghost" size="sm" onClick={() => setExpanded(false)}>
              <PlusIcon size={14} />
              Thu gọn chi tiết
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}