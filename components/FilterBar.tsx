/**
 * FilterBar (L4-T13). Segmented 3 tab, search row, sort menu, tag filter.
 */
import React, { useCallback, useState } from 'react';
import Segmented from './ui/Segmented';
import Menu from './ui/Menu';
import IconButton from './ui/IconButton';
import TagChip from './ui/TagChip';

interface FilterBarProps {
  tab: 'all' | 'active' | 'done';
  searchQuery: string;
  sortCriterion: string;
  selectedTags: string[];
  availableTags?: string[];
  searchOpen?: boolean;
  onSearchOpenChange?: (open: boolean) => void;
  onTabChange?: (tab: 'all' | 'active' | 'done') => void;
  onSearchChange?: (query: string) => void;
  onSortChange?: (criterion: string) => void;
  onTagToggle?: (tag: string) => void;
}

export default function FilterBar({
  tab,
  searchQuery,
  sortCriterion,
  selectedTags,
  availableTags = [],
  searchOpen,
  onSearchOpenChange,
  onTabChange,
  onSearchChange,
  onSortChange,
  onTagToggle,
}: FilterBarProps) {
  const [internalSearchOpen, setInternalSearchOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [tagMenuOpen, setTagMenuOpen] = useState(false);

  const isSearchOpen = searchOpen ?? internalSearchOpen;
  const setSearchOpen = useCallback(
    (open: boolean) => {
      onSearchOpenChange?.(open);
      if (searchOpen === undefined) setInternalSearchOpen(open);
    },
    [searchOpen, onSearchOpenChange]
  );

  const handleSearchKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSearchOpen(false);
      }
    },
    []
  );

  return (
    <div className="px-3 py-2 flex flex-col gap-2">
      {/* Tabs */}
      <Segmented
        options={[
          { value: 'all', label: 'Tất cả' },
          { value: 'active', label: 'Đang làm' },
          { value: 'done', label: 'Đã xong' },
        ]}
        value={tab}
        onChange={(v) => onTabChange?.(v as 'all' | 'active' | 'done')}
      />

      {/* Search row */}
      {isSearchOpen && (
        <div className="flex items-center gap-2 bg-surface-sunken rounded-control p-1 border border-border-control">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange?.(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            className="flex-1 h-8 px-2.5 rounded-control border-none bg-transparent text-body focus:outline-none"
            placeholder="Tìm việc…"
            autoFocus
          />
          <IconButton
            aria-label="Đóng tìm kiếm"
            title="Đóng tìm kiếm"
            icon="✕"
            onClick={() => setSearchOpen(false)}
          />
        </div>
      )}

      {/* Action buttons: search, sort, tags */}
      <div className="flex items-center gap-2">
        <IconButton
          aria-label={isSearchOpen ? 'Đóng tìm kiếm' : 'Tìm việc'}
          title={isSearchOpen ? 'Đóng tìm kiếm' : 'Tìm việc'}
          icon="🔍"
          active={isSearchOpen}
          onClick={() => setSearchOpen(!isSearchOpen)}
        />
        <IconButton
          aria-label="Sắp xếp"
          title="Sắp xếp"
          icon="↕"
          onClick={() => setSortOpen(!sortOpen)}
        />
        <Menu
          items={[
            { value: 'default', label: 'Hạn chót' },
            { value: 'priority', label: 'Ưu tiên' },
            { value: 'created', label: 'Mới nhất' },
          ]}
          value={sortCriterion}
          onSelect={(v) => {
            onSortChange?.(v);
            setSortOpen(false);
          }}
          open={sortOpen}
          onClose={() => setSortOpen(false)}
        />
        {selectedTags.length > 0 && (
          <div className="flex items-center gap-1">
            {selectedTags.map((tag) => (
              <TagChip
                key={tag}
                label={`#${tag}`}
                selected
                onPress={() => onTagToggle?.(tag)}
              />
            ))}
            <IconButton
              aria-label="Xóa tất cả thẻ lọc"
              title="Xóa tất cả thẻ lọc"
              icon="✕"
              onClick={() => {
                selectedTags.forEach((t) => onTagToggle?.(t));
              }}
            />
          </div>
        )}
        <IconButton
          aria-label="Lọc theo thẻ"
          title="Lọc theo thẻ"
          icon="🏷"
          onClick={() => setTagMenuOpen(!tagMenuOpen)}
        />
        <Menu
          items={availableTags.map((tag) => ({ value: tag, label: `#${tag}` }))}
          value=""
          onSelect={(tag) => onTagToggle?.(tag)}
          open={tagMenuOpen && availableTags.length > 0}
          onClose={() => setTagMenuOpen(false)}
        />
      </div>
    </div>
  );
}
