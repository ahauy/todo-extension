/**
 * Ô nhập bút lông — thành phần chữ ký của Học Đường.
 *
 * Ô nhập THẬT vẫn là một <input> chuẩn để IME, dán, hoàn tác và đọc màn hình
 * hoạt động bình thường; lớp mực và cây bút chỉ là trang trí aria-hidden phủ
 * lên trên. Chữ trong input để trong suốt, caret vẫn là caret thật.
 *
 * Mực: mỗi ký tự đã chốt thấm vào trong 180ms rồi khô từ nâu sang mực trong
 * 800ms. Đang ghép dấu tiếng Việt (compositionstart → compositionend) thì
 * KHÔNG chạy hiệu ứng — chữ đang ghép chỉ gạch chân mảnh, tránh nhấp nháy.
 * Ngừng gõ 600ms thì bút nhấc lên và nằm yên cạnh lọ mực.
 */
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { QuillHand, QuillPen } from '../art/QuillArt';
import type { QuillStyle } from '../../lib/tasks/types';

const MAX_LENGTH = 200;
const IDLE_MS = 600;

interface QuillInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder: string;
  'aria-label': string;
  quillStyle: QuillStyle;
  effectEnabled: boolean;
  invalid?: boolean;
  describedBy?: string;
  action?: React.ReactNode;
  id?: string;
}

interface InkRange {
  from: number;
  to: number;
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

const QuillInput = React.forwardRef<HTMLInputElement, QuillInputProps>(function QuillInput(
  {
    value,
    onChange,
    onSubmit,
    placeholder,
    'aria-label': ariaLabel,
    quillStyle,
    effectEnabled,
    invalid = false,
    describedBy,
    action,
    id,
  },
  forwardedRef
) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const mirrorRef = useRef<HTMLSpanElement>(null);
  const nibRef = useRef<HTMLSpanElement>(null);
  const previous = useRef(value);
  const composing = useRef(false);
  const idleTimer = useRef<number | null>(null);
  const tapAnimation = useRef<Animation | null>(null);

  const [focused, setFocused] = useState(false);
  const [isComposing, setIsComposing] = useState(false);
  const [range, setRange] = useState<InkRange | null>(null);
  const [caret, setCaret] = useState(0);
  const [nibX, setNibX] = useState(16);
  const [resting, setResting] = useState(true);

  const animate = effectEnabled && !prefersReducedMotion();

  const setRefs = useCallback(
    (node: HTMLInputElement | null) => {
      inputRef.current = node;
      if (typeof forwardedRef === 'function') forwardedRef(node);
      else if (forwardedRef) forwardedRef.current = node;
    },
    [forwardedRef]
  );

  const tapNib = useCallback(() => {
    const node = nibRef.current;
    if (!animate || !node || typeof node.animate !== 'function') return;
    tapAnimation.current?.cancel();
    tapAnimation.current = node.animate(
      [{ translate: '0 0' }, { translate: '0 2px' }, { translate: '0 0' }],
      { duration: 120, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' }
    );
  }, [animate]);

  const scheduleRest = useCallback(() => {
    if (idleTimer.current !== null) window.clearTimeout(idleTimer.current);
    idleTimer.current = window.setTimeout(() => setResting(true), IDLE_MS);
  }, []);

  const accept = useCallback(
    (next: string, inComposition: boolean) => {
      const before = previous.current;
      if (!inComposition && animate && next.length > before.length && next.length <= MAX_LENGTH) {
        let shared = 0;
        while (shared < before.length && before[shared] === next[shared]) shared += 1;
        setRange({ from: shared, to: next.length });
        setResting(false);
        tapNib();
        scheduleRest();
      } else if (!inComposition) {
        setRange(null);
        if (next.length === 0) setResting(true);
      }
      previous.current = next;
      onChange(next);
    },
    [animate, onChange, scheduleRest, tapNib]
  );

  // Đặt ngòi đúng chỗ con trỏ: đo bằng một bản sao ẩn của lớp mực
  useLayoutEffect(() => {
    const mirror = mirrorRef.current;
    const input = inputRef.current;
    if (!mirror || !input) return;
    mirror.textContent = value.slice(0, caret);
    // Ngòi nằm ở (2, 26) trong khung 28px → lùi 2px cho đầu ngòi trúng caret
    setNibX(14 + mirror.offsetWidth - input.scrollLeft);
  }, [value, caret]);

  useEffect(() => () => {
    if (idleTimer.current !== null) window.clearTimeout(idleTimer.current);
    tapAnimation.current?.cancel();
  }, []);

  const syncCaret = useCallback(() => {
    setCaret(inputRef.current?.selectionStart ?? 0);
  }, []);

  const Pen = quillStyle === 'hand' ? QuillHand : QuillPen;
  const chars = Array.from(value);

  return (
    <div
      className="quill"
      data-focused={focused}
      data-invalid={invalid}
      data-plain={!animate}
    >
      <div className="quill-field">
        <div className="quill-ink" data-composing={isComposing} aria-hidden="true">
          {isComposing || !animate
            ? value
            : chars.map((char, index) => (
                <span
                  key={index}
                  className={range && index >= range.from && index < range.to ? 'ink-char' : undefined}
                >
                  {char}
                </span>
              ))}
        </div>
        <span
          ref={mirrorRef}
          aria-hidden="true"
          className="quill-ink"
          style={{
            visibility: 'hidden',
            inset: 'auto',
            left: 0,
            top: 0,
            width: 'auto',
            height: 'auto',
            padding: 0,
          }}
        />
        <input
          id={id}
          ref={setRefs}
          className="quill-input"
          type="text"
          value={value}
          maxLength={MAX_LENGTH}
          placeholder={placeholder}
          aria-label={ariaLabel}
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          autoComplete="off"
          onChange={(event) => accept(event.target.value, composing.current)}
          onCompositionStart={() => {
            composing.current = true;
            setIsComposing(true);
          }}
          onCompositionEnd={(event) => {
            composing.current = false;
            setIsComposing(false);
            accept(event.currentTarget.value, false);
          }}
          onSelect={syncCaret}
          onKeyUp={syncCaret}
          onClick={syncCaret}
          onFocus={() => {
            setFocused(true);
            setResting(false);
            syncCaret();
            scheduleRest();
          }}
          onBlur={() => {
            setFocused(false);
            setResting(true);
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !composing.current) {
              event.preventDefault();
              setRange(null);
              setResting(true);
              onSubmit();
            }
          }}
        />
        {animate && value.length > 0 && (
          <span
            ref={nibRef}
            className="quill-nib"
            data-resting={resting}
            aria-hidden="true"
            style={{
              transform: resting
                ? `translate(${nibX}px, -6px) rotate(-18deg)`
                : `translate(${nibX}px, 8px) rotate(0deg)`,
            }}
          >
            <Pen size={28} />
          </span>
        )}
      </div>
      {action && <div className="flex flex-none items-center pr-xs">{action}</div>}
    </div>
  );
});

export default QuillInput;