/**
 * Bút lông ngỗng, bàn tay cầm bút và lọ mực — họa tiết chữ ký của ô nhập.
 * Cả hai biến thể bút có cùng điểm neo ở đầu ngòi (2, 26) trong khung 28×28
 * để lớp trang trí đặt ngòi đúng vị trí con trỏ.
 */
import React from 'react';

interface ArtProps {
  size?: number;
  className?: string;
}

const VANE =
  'M4.6 22.4C6.2 15.4 10.4 8.6 16.6 3.2c2.8 3.2 2.6 10.2-1.2 16-2.2 3.4-6.8 5.2-10.8 3.2Z';

/** Bút lông ngỗng — ngòi đặc, ống lông và phiến lông nghiêng 35° */
export const QuillPen: React.FC<ArtProps> = ({ size = 28, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 28 28"
    fill="none"
    className={className}
    aria-hidden="true"
    focusable="false"
  >
    <g className="nib-body">
      <path d={VANE} fill="currentColor" fillOpacity="0.14" />
      <path
        d={VANE}
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path
        d="M2.9 25.1 16.5 3.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <g stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" opacity="0.7">
        <path d="M6.6 19.9 9.9 17.6" />
        <path d="M8.9 16.2 12.2 13.9" />
        <path d="M11.2 12.5 14.5 10.2" />
        <path d="M13.5 8.8 16.4 6.8" />
      </g>
      <path d="M1.2 26.8 3.6 21.9 6.1 24.4Z" fill="currentColor" />
      <path d="M3.1 24.1 4.6 25.6" stroke="var(--surface-lacquer)" strokeWidth="0.8" />
    </g>
  </svg>
);

/** Bàn tay cầm bút — cùng đầu ngòi, thêm nắm tay cách điệu */
export const QuillHand: React.FC<ArtProps> = ({ size = 28, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 28 28"
    fill="none"
    className={className}
    aria-hidden="true"
    focusable="false"
  >
    <g className="nib-body">
      <path d={VANE} fill="currentColor" fillOpacity="0.12" />
      <path d={VANE} stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      <path
        d="M2.9 25.1 16.5 3.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path
        d="M6.2 21.6c-1.7-1.1-1.5-3.6.4-4.5l4.6-2.2c1.5-.7 3.2.2 3.4 1.8l.4 2.6c.2 1.5-.8 2.9-2.3 3.2l-3.6.7c-1 .2-2.1-.2-2.9-1.6Z"
        fill="var(--surface-paper)"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <g stroke="currentColor" strokeWidth="0.85" strokeLinecap="round" opacity="0.75">
        <path d="M8.4 18.1 9.6 20.4" />
        <path d="M10.7 17 11.9 19.3" />
        <path d="M13 15.9 13.9 18.1" />
      </g>
      <path d="M1.2 26.8 3.6 21.9 6.1 24.4Z" fill="currentColor" />
    </g>
  </svg>
);

/** Lọ mực — nơi bút trở về khi người dùng ngừng gõ */
export const Inkwell: React.FC<ArtProps> = ({ size = 32, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    className={className}
    aria-hidden="true"
    focusable="false"
  >
    <path
      d="M6.5 17.5c0-3.6 4.2-5.8 9.5-5.8s9.5 2.2 9.5 5.8v6.2c0 3.1-4.2 5.1-9.5 5.1s-9.5-2-9.5-5.1Z"
      fill="currentColor"
      fillOpacity="0.12"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinejoin="round"
    />
    <ellipse
      cx="16"
      cy="12"
      rx="8.4"
      ry="2.9"
      fill="var(--surface-paper)"
      stroke="currentColor"
      strokeWidth="1.4"
    />
    <ellipse cx="16" cy="12.3" rx="5.6" ry="1.8" fill="currentColor" />
    <path
      d="M9.4 21.4c1.4 1.6 3.7 2.4 6.6 2.4"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinecap="round"
      opacity="0.5"
    />
    <path
      d="M16 9.1V4.4"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      opacity="0.45"
    />
  </svg>
);