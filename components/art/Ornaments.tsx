/**
 * Họa tiết trang trí: hoa sen ở góc khung, dải mây phân cách, đài sen cho
 * ô chuỗi ngày. Mỗi họa tiết đều nhắc về việc học — sen (bền chí), mây
 * (đường viền bản thảo), không có họa tiết chỉ để cho đẹp.
 */
import React from 'react';

interface ArtProps {
  size?: number;
  className?: string;
}

/** Góc khung: mây cuộn ôm một búp sen, nét vàng kim */
export const CornerFlourish: React.FC<ArtProps & { at: 'tl' | 'tr' | 'bl' | 'br' }> = ({
  size = 24,
  className,
  at,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.1"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`ornament frame-corner ${className ?? ''}`}
    data-at={at}
    aria-hidden="true"
    focusable="false"
  >
    <path d="M1.5 22.5C1.5 12 8 3.4 21 1.5" />
    <path d="M4 22c3.6-1.4 6.2-4.6 7.2-9.2.6-2.8 3-4.6 5.8-4.2 2.2.4 3.2 2.4 2.2 3.9-.9 1.3-3 1-3.4-.5" />
    <path d="M8.6 17.4c1.6.5 3.1.2 4.4-.9" opacity="0.7" />
    <circle cx="18.4" cy="16.6" r="0.9" fill="currentColor" stroke="none" />
    <circle cx="14.6" cy="20.2" r="0.7" fill="currentColor" stroke="none" opacity="0.7" />
  </svg>
);

/** Đài sen năm cánh cho ô ngày trong chuỗi học */
export const Lotus: React.FC<ArtProps> = ({ size = 16, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    className={className}
    aria-hidden="true"
    focusable="false"
  >
    <path
      d="M8 2.2c1.9 2.2 2.5 4.3 0 7.2-2.5-2.9-1.9-5 0-7.2Z"
      fill="currentColor"
      fillOpacity="0.9"
    />
    <path
      d="M3.5 4.4c2.5.5 3.9 1.9 4.2 5-3.1-.2-4.4-1.9-4.2-5Z"
      fill="currentColor"
      fillOpacity="0.62"
    />
    <path
      d="M12.5 4.4c.2 3.1-1.1 4.8-4.2 5 .3-3.1 1.7-4.5 4.2-5Z"
      fill="currentColor"
      fillOpacity="0.62"
    />
    <path
      d="M1.9 8.6c2.3 3.4 9.9 3.4 12.2 0"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
    />
  </svg>
);

/** Dải mây lặp — phân cách các khu lớn của bảng New Tab */
export const CloudRule: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    width="100%"
    height="12"
    viewBox="0 0 48 12"
    preserveAspectRatio="xMidYMid"
    className={className}
    aria-hidden="true"
    focusable="false"
  >
    <defs>
      <pattern id="hd-cloud" width="48" height="12" patternUnits="userSpaceOnUse">
        <path
          d="M0 9h8c0-3 2.4-5 5.2-4.4C14.6 2 17.6 1.4 19.4 3.4c2.6-1.2 5.2.6 5 3.2 2.4-.4 4.2 1 4.2 2.4h19.4"
          fill="none"
          stroke="var(--hairline)"
          strokeWidth="1.1"
          strokeLinecap="round"
        />
        <circle cx="24" cy="9.6" r="0.9" fill="var(--gold)" />
      </pattern>
    </defs>
    <rect width="100%" height="12" fill="url(#hd-cloud)" />
  </svg>
);

/** Con dấu triện vuông — dùng cho thành tích lớn (ĐẠT, BỀN CHÍ) */
export const SealFrame: React.FC<{ label: string; size?: 'sm' | 'md' | 'lg'; striking?: boolean }> = ({
  label,
  size = 'md',
  striking = false,
}) => (
  <span className="seal-stamp" data-size={size} data-striking={striking} aria-hidden="true">
    {label}
  </span>
);