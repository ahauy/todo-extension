/**
 * Minh họa khung vòm: ô cửa sổ bàn học cho lời chào, và cuộn thư trắng cho
 * trạng thái rỗng. SVG đơn sắc theo biến màu — popup không tải ảnh raster.
 */
import React from 'react';
import type { DayPart } from '../../lib/datetime';

const SKY: Record<DayPart, string> = {
  morning: 'var(--gold-pale)',
  afternoon: 'var(--indigo-wash)',
  evening: 'var(--primary-wash)',
  night: 'var(--indigo-wash)',
};

/** Ô cửa sổ vòm nhìn ra trời, phía trước là bàn học có sách và đèn dầu */
export const StudyWindow: React.FC<{ part: DayPart; className?: string }> = ({
  part,
  className,
}) => (
  <svg
    viewBox="0 0 220 260"
    className={className}
    role="img"
    aria-label="Ô cửa sổ vòm nhìn ra trời, trên bàn có chồng sách và ngọn đèn dầu"
  >
    <rect width="220" height="260" fill="var(--surface-paper)" />
    <path d="M22 232V112a88 88 0 0 1 176 0v120Z" fill={SKY[part]} />

    {part === 'night' ? (
      <>
        <path
          d="M158 62a20 20 0 1 0 18 26 24 24 0 0 1-18-26Z"
          fill="var(--gold-pale)"
        />
        <g fill="var(--surface-lacquer)">
          <circle cx="72" cy="66" r="1.8" />
          <circle cx="96" cy="48" r="1.4" />
          <circle cx="56" cy="94" r="1.5" />
          <circle cx="130" cy="40" r="1.3" />
        </g>
      </>
    ) : (
      <circle cx="152" cy="76" r="21" fill="var(--gold-leaf)" />
    )}

    <g fill="var(--surface-lacquer)" opacity="0.85">
      <path d="M40 104c0-6 5-10 11-9 2-6 10-8 14-3 6-2 11 3 10 9Z" />
      <path d="M126 128c0-5 4-8 9-7 2-5 8-6 11-2 5-1 9 3 8 8Z" />
    </g>
    <path
      d="M22 168c26-16 44-6 62 2s34 10 54-2 34-14 60-4v68H22Z"
      fill="var(--jade-wash)"
    />
    <path
      d="M22 186c30-12 48-2 68 6s36 6 56-4 32-10 52-2v46H22Z"
      fill="var(--jade)"
      opacity="0.35"
    />

    {/* Khung cửa và nan */}
    <g stroke="var(--sepia)" strokeWidth="2.4" fill="none" strokeLinecap="round">
      <path d="M22 232V112a88 88 0 0 1 176 0v120" />
      <path d="M110 26v206" />
      <path d="M22 150h176" />
    </g>
    <path
      d="M14 232h192"
      stroke="var(--brown)"
      strokeWidth="5"
      strokeLinecap="round"
    />

    {/* Chồng sách trên bàn */}
    <g stroke="var(--brown)" strokeWidth="1.6" strokeLinejoin="round">
      <rect x="34" y="212" width="62" height="10" rx="2" fill="var(--primary)" />
      <rect x="38" y="202" width="54" height="10" rx="2" fill="var(--indigo)" />
      <rect x="42" y="192" width="46" height="10" rx="2" fill="var(--jade)" />
      <path d="M46 197h38M42 207h46M38 217h54" stroke="var(--on-primary)" strokeWidth="1" opacity="0.6" />
    </g>

    {/* Đèn dầu đang cháy */}
    <g stroke="var(--brown)" strokeWidth="1.6" strokeLinejoin="round" fill="none">
      <path
        d="M148 196c1.9 2.3 2.9 4 2.9 5.6a2.9 2.9 0 1 1-5.8 0c0-1.6 1-3.3 2.9-5.6Z"
        fill="var(--gold-leaf)"
      />
      <path d="M136 210h30l-3 12a3 3 0 0 1-2.9 2.2h-18.2a3 3 0 0 1-2.9-2.2Z" fill="var(--primary-wash)" />
      <path d="M140 210c2.4-3.4 5.4-5 11-5s8.6 1.6 11 5" />
    </g>

    {/* Lọ mực và bút */}
    <g stroke="var(--brown)" strokeWidth="1.5" fill="none" strokeLinecap="round">
      <path d="M104 214c0-3 3-4.6 7-4.6s7 1.6 7 4.6v6c0 2.6-3 4.2-7 4.2s-7-1.6-7-4.2Z" fill="var(--surface-lacquer)" />
      <ellipse cx="111" cy="209.6" rx="6.4" ry="2.2" fill="var(--ink)" />
      <path d="M114 208 128 178" />
      <path d="M124 186c3-4 6-6 8-8 1 3 0 7-3 10-1.6 1.6-3.6 2-5 2Z" fill="var(--surface-paper)" />
    </g>
  </svg>
);

/** Cuộn thư trắng chưa viết gì — trạng thái rỗng */
export const BlankScroll: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 180 130"
    className={className}
    role="img"
    aria-label="Một cuộn thư còn trắng, chưa viết gì"
  >
    <rect x="26" y="26" width="128" height="78" rx="3" fill="var(--surface-lacquer)" stroke="var(--hairline)" strokeWidth="1.5" />
    <g stroke="var(--hairline-soft)" strokeWidth="1.2" strokeLinecap="round">
      <path d="M44 50h92M44 64h92M44 78h58" />
    </g>
    <g fill="var(--surface-paper)" stroke="var(--sepia)" strokeWidth="1.5">
      <rect x="14" y="18" width="18" height="94" rx="9" />
      <rect x="148" y="18" width="18" height="94" rx="9" />
    </g>
    <g stroke="var(--sepia)" strokeWidth="1" opacity="0.6">
      <path d="M23 24v82M157 24v82" />
    </g>
    {/* Bút nằm chờ cạnh cuộn */}
    <g stroke="var(--brown)" strokeWidth="1.4" fill="none" strokeLinecap="round">
      <path d="M62 118 108 110" />
      <path d="M96 112c6-3 11-3.6 15-3.4-1.6 3.6-5 6.6-10 7.6-2.6.5-4.4-.6-5-4.2Z" fill="var(--surface-paper)" />
      <path d="M60 118.6 64 116.4 65.6 119.6Z" fill="var(--brown)" />
    </g>
  </svg>
);