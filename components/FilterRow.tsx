/**
 * Hàng lọc: dải tab đánh dấu trang, ô tìm việc, menu sắp xếp. Trong Popup có
 * thêm ô chọn môn vì Giá sách nằm ở bảng lớn; hai chiều lọc độc lập nên mỗi
 * chiều chỉ có một lựa chọn đang sáng.
 *
 * Bố cục co giãn: khi có ô chọn môn (Popup), dải tab chiếm trọn một hàng để
 * đủ bốn tab, còn môn + sắp xếp + tìm xuống hàng dưới. Khi không có ô chọn
 * môn (bảng lớn), tab + sắp xếp + tìm vẫn nằm chung một hàng cho gọn.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import RibbonTabs, { type RibbonTab } from './ui/RibbonTabs';
import Menu from './ui/Menu';
import IconButton from './ui/IconButton';
import { ChevronDownIcon, CloseIcon, SearchIcon, SortIcon } from './art/Icons';
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
  const [subjectOpen, setSubjectOpen] = useState(false);
  const rowRef = useRef<HTMLDivElement>(null);
  const restoreTriggerFocus = useRef(false);

  // Popup truyền subjects + onSubjectChange → có thêm ô chọn môn ở hàng dưới.
  const hasSubject = !!(subjects && onSubjectChange);
  const currentSubject = subjects?.find((item) => item.id === subjectId);
  const subjectLabel =
    subjectId === 'all'
      ? 'Cả giá sách'
      : subjectId === 'none'
        ? 'Chưa xếp môn'
        : (currentSubject?.name ?? 'Cả giá sách');
  const subjectSpine =
    subjectId === 'all' || subjectId === 'none'
      ? 'var(--sepia)'
      : spineColor(currentSubject?.order ?? 99);

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

  // Sắp xếp: hiện rõ tiêu chí đang dùng (data-active khi khác mặc định).
  const sortControl = (
    <div className="relative flex-none">
      <IconButton
        aria-label={`Sắp xếp theo: ${SORT_LABEL[sortKey]}`}
        title={`Sắp xếp: ${SORT_LABEL[sortKey]}`}
        aria-haspopup="menu"
        aria-expanded={sortOpen}
        data-active={sortOpen || sortKey !== 'deadline' ? 'true' : undefined}
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
  );

  const searchButton = (
    <IconButton
      aria-label="Tìm việc"
      title="Tìm việc (phím /)"
      icon={<SearchIcon size={17} />}
      onClick={() => onSearchOpenChange(true)}
    />
  );

  const searchField = searchOpen ? (
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
      <button
        type="button"
        aria-label="Đóng tìm kiếm"
        onClick={closeSearch}
        className="grid size-6 place-items-center text-umber"
      >
        <CloseIcon size={14} />
      </button>
    </div>
  ) : null;

  const subjectControl =
    hasSubject && !searchOpen ? (
      <div className="relative min-w-0 flex-1">
        <button
          type="button"
          className="filter-subject"
          aria-label={`Lọc theo môn học: ${subjectLabel}`}
          title="Lọc theo môn học"
          aria-haspopup="menu"
          aria-expanded={subjectOpen}
          onClick={() => setSubjectOpen((open) => !open)}
        >
          <span className="filter-subject-dot" style={{ background: subjectSpine }} />
          <span className="min-w-0 flex-1 truncate text-left">{subjectLabel}</span>
          <ChevronDownIcon size={14} className="filter-subject-caret" />
        </button>
        <Menu
          aria-label="Lọc theo môn học"
          items={[
            { value: 'all', label: 'Cả giá sách' },
            ...(subjects ?? []).map((subject) => ({ value: subject.id, label: subject.name })),
            { value: 'none', label: 'Chưa xếp môn' },
          ]}
          value={subjectId}
          open={subjectOpen}
          onClose={() => setSubjectOpen(false)}
          onSelect={(value) => onSubjectChange?.(value)}
        />
      </div>
    ) : null;

  // Bảng lớn (không có ô chọn môn): tab + sắp xếp + tìm chung một hàng.
  const inlineControls = !hasSubject && !searchOpen;

  // Hai nút lọc đi cùng nhau: cùng hàng với tab khi đủ chỗ, tự xuống hàng
  // dưới (canh phải) khi cột hẹp — xem `.filter-line` trong components.css.
  const actions = (
    <div className="filter-actions">
      {sortControl}
      {!searchOpen && searchButton}
    </div>
  );

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
        {inlineControls && actions}
      </div>

      {(hasSubject || searchOpen) && (
        <div className="flex items-center gap-sm">
          {searchOpen ? searchField : subjectControl}
          {actions}
        </div>
      )}
    </div>
  );
}
