/**
 * Dải tab như dải đánh dấu trang: góc trên bo 8px, tab đang chọn có gờ vàng
 * kim 3px ở đáy và nền sơn bóng. Cuộn ngang khi chật, ẩn thanh cuộn.
 */
import React, { useCallback, useRef } from 'react';

export interface RibbonTab {
  value: string;
  label: string;
  count?: number;
}

interface RibbonTabsProps {
  tabs: RibbonTab[];
  value: string;
  onChange: (value: string) => void;
  'aria-label': string;
  className?: string;
}

export default function RibbonTabs({
  tabs,
  value,
  onChange,
  'aria-label': ariaLabel,
  className,
}: RibbonTabsProps) {
  const ref = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
      event.preventDefault();
      const index = tabs.findIndex((tab) => tab.value === value);
      const step = event.key === 'ArrowRight' ? 1 : -1;
      const next = (index + step + tabs.length) % tabs.length;
      onChange(tabs[next].value);
      const nodes = ref.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]');
      nodes?.[next]?.focus();
    },
    [tabs, value, onChange]
  );

  return (
    <div
      ref={ref}
      role="tablist"
      aria-label={ariaLabel}
      onKeyDown={handleKeyDown}
      className={['ribbon', className].filter(Boolean).join(' ')}
    >
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          role="tab"
          aria-selected={tab.value === value}
          tabIndex={tab.value === value ? 0 : -1}
          onClick={() => onChange(tab.value)}
          className="ribbon-tab"
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className="tnum ml-xs font-normal text-umber">{tab.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}