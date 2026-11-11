/**
 * Lưới đỡ khi cây React ném lỗi lúc render. Không có nó thì người dùng chỉ
 * thấy một khối trống; ở đây lỗi biến thành câu đọc được + nút thử lại.
 * Vẫn dùng token nên nền luôn là vỏ trứng ngà, không bao giờ đen tuyền.
 */
import React from 'react';
import Button from './ui/Button';
import { BlankScroll } from './art/Scenes';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export default class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error('[học đường] lỗi render — hiển thị fallback', error, info.componentStack);
  }

  private readonly handleRetry = (): void => {
    window.location.reload();
  };

  render(): React.ReactNode {
    if (!this.state.hasError) return this.props.children;

    return (
      <div
        role="alert"
        className="flex min-h-full w-full flex-col items-center justify-center gap-base bg-canvas px-lg py-xl text-center text-ink"
      >
        <div className="arch w-[150px]">
          <BlankScroll className="block w-full" />
        </div>
        <p className="font-display text-heading-sm">Có lỗi khi tải popup</p>
        <p className="max-w-[34ch] text-body-sm text-umber">
          Việc đã ghi vẫn còn nguyên trong sổ. Hãy thử lại; nếu vẫn lỗi, đóng rồi mở lại Học Đường.
        </p>
        <Button variant="primary" onClick={this.handleRetry}>
          Thử lại
        </Button>
      </div>
    );
  }
}