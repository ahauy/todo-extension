# Project Brief
 
## Project Name
Todo Extension
 
## Description
Todo list dạng Chrome extension (Manifest V3): popup quản lý task,
lưu chrome.storage.sync, nhắc việc qua chrome.alarms/notification.
KHÔNG backend — toàn bộ dữ liệu nằm trong trình duyệt.
 
## Target Users
Người dùng cá nhân cần to-do nhanh ngay trong trình duyệt.
 
## Core Features
- Thêm / sửa / xóa / tick hoàn thành task
- Lưu đồng bộ qua chrome.storage.sync
- Due date + nhắc qua chrome.alarms + chrome.notifications
- Dark mode
 
## Non-functional Requirements
- Mở popup < 100ms, không ảnh hưởng trang web đang mở
- Quyền manifest tối thiểu: storage, alarms, notifications
 
## Notes
- Stack: React + TypeScript + WXT (hoặc CRXJS)
- Deploy: Chrome Web Store (zip + upload) — không dùng Vercel/Railway
- **KHÔNG server / DB**