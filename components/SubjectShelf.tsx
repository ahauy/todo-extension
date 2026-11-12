/**
 * Giá sách: mỗi môn là một gáy sách viền trái 8px đổi màu theo thứ tự.
 * Dưới 1024px cả giá nằm ngang thành dải cuộn. Thêm môn ngay tại chỗ, đổi
 * tên và bỏ môn có xác nhận ở component cha.
 */
import React, { useState } from 'react';
import Button from './ui/Button';
import { BookIcon, CloseIcon, PlusIcon } from './art/Icons';
import { MAX_SUBJECTS, MAX_SUBJECT_NAME, spineColor } from '../lib/subjects';
import type { Subject, Task } from '../lib/tasks/types';

interface SubjectShelfProps {
  subjects: Subject[];
  tasks: Task[];
  value: string;
  onChange: (subjectId: string) => void;
  onCreate: (name: string) => Promise<unknown>;
  onRemove: (subject: Subject) => void;
  horizontal?: boolean;
}

export default function SubjectShelf({
  subjects,
  tasks,
  value,
  onChange,
  onCreate,
  onRemove,
  horizontal = false,
}: SubjectShelfProps) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);

  const remaining = (id: string) =>
    tasks.filter((task) => !task.done && (id === 'all' ? true : id === 'none' ? !task.subjectId : task.subjectId === id))
      .length;

  const commit = async () => {
    const name = draft.trim();
    if (!name) return;
    if (subjects.some((subject) => subject.name.toLowerCase() === name.toLowerCase())) {
      setError('Môn này đã có trên giá.');
      return;
    }
    const created = await onCreate(name);
    if (!created) {
      setError(`Giá sách giữ tối đa ${MAX_SUBJECTS} môn.`);
      return;
    }
    setDraft('');
    setAdding(false);
    setError(null);
  };

  return (
    <section aria-label="Giá sách môn học" className="stack gap-sm">
      {!horizontal && (
        <h2 className="region-title mb-xs flex items-center gap-sm">
          <BookIcon size={18} />
          Giá sách
        </h2>
      )}

      <div className={horizontal ? 'ribbon' : 'stack gap-xs'}>
        <button
          type="button"
          className={horizontal ? 'ribbon-tab' : 'spine'}
          style={horizontal ? undefined : { ['--spine-color' as string]: 'var(--primary-deep)' }}
          aria-pressed={horizontal ? undefined : value === 'all'}
          aria-selected={horizontal ? value === 'all' : undefined}
          role={horizontal ? 'tab' : undefined}
          onClick={() => onChange('all')}
        >
          Cả giá sách
          <span className={horizontal ? 'tnum ml-xs text-umber' : 'spine-count tnum'}>
            {remaining('all')}
          </span>
        </button>

        {subjects.map((subject) => (
          <div key={subject.id} className={horizontal ? 'flex flex-none' : 'group relative'}>
            <button
              type="button"
              className={horizontal ? 'ribbon-tab' : 'spine'}
              style={{ ['--spine-color' as string]: spineColor(subject.order) }}
              data-spine={horizontal ? '' : undefined}
              aria-pressed={horizontal ? undefined : value === subject.id}
              aria-selected={horizontal ? value === subject.id : undefined}
              role={horizontal ? 'tab' : undefined}
              onClick={() => onChange(subject.id)}
            >
              <span className="truncate">{subject.name}</span>
              <span className={horizontal ? 'tnum ml-xs text-umber' : 'spine-count tnum'}>
                {remaining(subject.id)}
              </span>
            </button>
            {!horizontal && (
              <button
                type="button"
                aria-label={`Bỏ môn ${subject.name}`}
                title={`Bỏ môn ${subject.name}`}
                onClick={() => onRemove(subject)}
                className="absolute right-xxs top-1/2 hidden size-7 -translate-y-1/2 place-items-center rounded-full text-umber group-hover:grid group-focus-within:grid"
              >
                <CloseIcon size={13} />
              </button>
            )}
          </div>
        ))}

        <button
          type="button"
          className={horizontal ? 'ribbon-tab' : 'spine'}
          style={horizontal ? undefined : { ['--spine-color' as string]: 'var(--sepia)' }}
          aria-pressed={horizontal ? undefined : value === 'none'}
          aria-selected={horizontal ? value === 'none' : undefined}
          role={horizontal ? 'tab' : undefined}
          onClick={() => onChange('none')}
        >
          Chưa xếp môn
          <span className={horizontal ? 'tnum ml-xs text-umber' : 'spine-count tnum'}>
            {remaining('none')}
          </span>
        </button>
      </div>

      {adding ? (
        <div className="stack gap-xs">
          <input
            type="text"
            className="text-input"
            value={draft}
            autoFocus
            maxLength={MAX_SUBJECT_NAME}
            aria-label="Tên môn học mới"
            placeholder="Ví dụ: Giải tích 2"
            onChange={(event) => {
              setDraft(event.target.value);
              setError(null);
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                void commit();
              }
              if (event.key === 'Escape') {
                setAdding(false);
                setDraft('');
              }
            }}
          />
          {error && <p className="text-caption text-critical" role="alert">{error}</p>}
          <div className="flex gap-xs">
            <Button variant="primary" size="sm" onClick={() => void commit()} disabled={!draft.trim()}>
              Thêm môn
            </Button>
            <Button variant="ghost" size="sm" onClick={() => { setAdding(false); setDraft(''); }}>
              Thôi
            </Button>
          </div>
        </div>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setAdding(true)}
          disabled={subjects.length >= MAX_SUBJECTS}
          className="self-start"
        >
          <PlusIcon size={15} />
          Thêm môn
        </Button>
      )}
    </section>
  );
}