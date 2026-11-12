/**
 * Hàng lọc: dải tab đánh dấu trang, ô tìm việc, menu sắp xếp. Trong Popup có
 * thêm ô chọn môn vì Giá sách nằm ở bảng lớn; hai chiều lọc độc lập nên mỗi
 * chiều chỉ có một lựa chọn đang sáng.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import RibbonTabs, { type RibbonTab } from './ui/RibbonTabs';
import Menu from './ui/Menu';
import IconButton from './ui/IconButton';
import { CloseIcon, SearchIcon, SortIcon } from './art/Icons';
import { spineColor } from '../lib/subjects';
import type { BoardTab, SortKey } from '../lib/tasks/query';
import type { Subject } from '../lib/tasks/types';

export const SORT_LABEL: Record<SortKey, string> = {
  deadline: 'Hạn chót',
  priority: 'Ưu tiên',
  created: 'Mới ghi',
};

interface FilterRowProps {
  tab: BoardTab;
  counts: Record<BoardTab, number>;
  onTabChange: (tab: BoardTab) => void;
  searchQuery: string;
  searchOpen: boolean;
  onSearchOpenChange: (open: boolean) => void;
  onSearchChange: (query: string) => void;
  sortKey: SortKey;
  onSortChange: (key: SortKey) => void;
  subjects?: Subject[];
  subjectId?: string;
  onSubjectChange?: (id: string) => void;
}

export default function FilterRow({
  tab,
  counts,
  onTabChange,
  searchQuery,
  searchOpen,
  onSearchOpenChange,
  onSearchChange,
  sortKey,
  onSortChange,
  subjects,
  subjectId = 'all',
  onSubjectChange,
}: FilterRowProps) {
  const [sortOpen, setSortOpen] = useState(false);
  const rowRef = useRef<HTMLDivElement>(null);
  const restoreTriggerFocus = useRef(false);

  const tabs: RibbonTab[] = [
    { value: 'all', label: 'Tất cả', count: counts.all },
    { value: 'today', label: 'Hôm nay', count: counts.today },
    { value: 'upcoming', label: 'Sắp tới', count: counts.upcoming },
    { value: 'done', label: 'Đã xong', count: counts.done },
  ];

  const closeSearch = useCallback(() => {
    restoreTriggerFocus.current = true;
    onSearchOpenChange(false);
  }, [onSearchOpenChange]);

  // Input tìm kiếm unmount khi đóng → trả focus về nút "Tìm việc", không để rơi về body
  useEffect(() => {
    if (searchOpen || !restoreTriggerFocus.current) return;
    restoreTriggerFocus.current = false;
    rowRef.current?.querySelector<HTMLButtonElement>('button[aria-label="Tìm việc"]')?.focus();
  }, [searchOpen]);

  return (
    <div ref={rowRef} className="stack gap-sm">
      <div className="filter-line">
        <RibbonTabs
          aria-label="Lọc việc theo thời hạn"
          tabs={tabs}
          value={tab}
          onChange={(value) => onTabChange(value as BoardTab)}
          className="min-w-0 flex-1"
        />

        <div id="sort-menu" className="relative flex-none">
          <IconButton
            aria-label="Sắp xếp"
            title={`Sắp xếp: ${SORT_LABEL[sortKey]}`}
            aria-haspopup="menu"
            aria-expanded={sortOpen}
            aria-controls="sort-menu"
            data-active={sortOpen ? 'true' : undefined}
            icon={<SortIcon size={17} />}
            onClick={() => setSortOpen((open) => !open)}
          />
          <Menu
            aria-label="Sắp xếp"
            align="right"
            items={(Object.keys(SORT_LABEL) as SortKey[]).map((key) => ({
              value: key,
              label: SORT_LABEL[key],
            }))}
            value={sortKey}
            open={sortOpen}
            onClose={() => setSortOpen(false)}
            onSelect={(value) => onSortChange(value as SortKey)}
          />
        </div>

        {!searchOpen && (
          <IconButton
            aria-label="Tìm việc"
            title="Tìm việc (phím /)"
            icon={<SearchIcon size={17} />}
            onClick={() => onSearchOpenChange(true)}
          />
        )}
      </div>

      {(searchOpen || (subjects && onSubjectChange)) && (
        <div className="flex items-center gap-sm">
          {subjects && onSubjectChange && (
            <select
              aria-label="Lọc theo môn học"
              className="text-input h-10 min-w-0 flex-1 py-xs text-body-sm"
              style={{
                borderLeft: `6px solid ${
                  subjectId === 'all'
                    ? 'var(--sepia)'
                    : spineColor(subjects.find((item) => item.id === subjectId)?.order ?? 99)
                }`,
              }}
              value={subjectId}
              onChange={(event) => onSubjectChange(event.target.value)}
            >
              <option value="all">Cả giá sách</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
              <option value="none">Chưa xếp môn</option>
            </select>
          )}

          {searchOpen && (
            <div className="search-field min-w-0 flex-1">
              <SearchIcon size={16} />
              <input
                type="text"
                value={searchQuery}
                autoFocus
                placeholder="Tìm việc…"
                aria-label="Tìm việc"
                onChange={(event) => onSearchChange(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Escape') closeSearch();
                }}
              />
              <button type="button" aria-label="Đóng tìm kiếm" onClick={closeSearch} className="grid size-6 place-items-center text-umber">
                <CloseIcon size={14} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}