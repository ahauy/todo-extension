/**
 * ErrorBoundary (bug/popup-blank-black #2).
 *
 * WHY: popup là màn duy nhất của extension — không có boundary thì mọi exception
 * khi render làm React unmount cả cây → người dùng thấy khối đen/trắng trống,
 * không text, không cách tự phục hồi. Boundary này biến lỗi im lặng thành thông
 * báo đọc được + nút thử lại.
 *
 * Fallback dùng token (`bg-bg`, `text-fg`) nên vẫn đúng theme light/dark,
 * không hex inline. Không log dữ liệu người dùng, chỉ log error + componentStack.
 */
import React from 'react';
import Button from './ui/Button';

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
    console.error('[popup] lỗi render — hiển thị fallback', error, info.componentStack);
  }

  private readonly handleRetry = (): void => {
    window.location.reload();
  };

  render(): React.ReactNode {
    if (!this.state.hasError) return this.props.children;

    return (
      <div
        role="alert"
        className="w-[360px] h-[600px] bg-bg text-fg font-sans text-body antialiased flex flex-col items-center justify-center gap-2 px-6 text-center"
      >
        <p className="text-title font-medium">Có lỗi khi tải popup</p>
        <p className="text-caption text-fg-secondary">
          Việc đã lưu vẫn còn nguyên. Hãy thử lại; nếu vẫn lỗi, đóng rồi mở lại popup.
        </p>
        <Button variant="primary" onClick={this.handleRetry}>
          Thử lại
        </Button>
      </div>
    );
  }
}
