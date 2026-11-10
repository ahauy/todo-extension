/**
 * Background service worker (stub, L1-T01).
 * Scheduler và alarm wiring sẽ được bổ sung ở L3-T08 / L3-T09.
 *
 * WXT yêu cầu entrypoint có default export. Hàm stub này sẽ được thay
 * bằng implement thực tế khi L3 triển khai alarm scheduler.
 */
export default () => {
  // no-op stub (WXT calls this entrypoint on load)
};
