# quiz — tự động làm bài ôn luyện thi bằng lái xe (hoclaixethaiviet.huelms.com)

Bộ script điều khiển Chrome thật trên macOS (không dùng JS click, không dùng Puppeteer/Selenium) để tự động đọc câu hỏi, chọn đáp án, và chuyển câu trong phần "Ôn luyện" của trang thi thử bằng lái xe. Được gọi bởi skill `/quiz` (`.claude/commands/quiz.md`) — AI chỉ cần đọc nội dung câu hỏi khi thực sự phải suy luận; phần còn lại (đọc trang, tính toạ độ, click, tra/lưu cache) chạy thuần script.

## Vì sao cần script riêng thay vì để AI tự gõ lệnh mỗi lần

- `System Events click at` (AppleScript) đã được kiểm chứng là **không đáng tin cậy** trên trang này — trả về "thành công" nhưng nhiều khi không thực sự click được vào nội dung web. Giải pháp là dùng `cliclick` (click qua CGEvent trực tiếp).
- Cửa sổ Chrome có thể đổi vị trí/kích thước giữa các lần thao tác, và trang zoom ở tỉ lệ khác 100% (hệ số quy đổi CSS px → điểm màn hình ~0.8) — nên toạ độ phải được tính **lại từ đầu ngay trước mỗi lần click**, không dùng toạ độ cũ.
- Đóng gói các phần cơ khí này vào script giúp AI không phải suy nghĩ/gõ lại osascript mỗi vòng, và (quan trọng nhất) không phải "nhìn thấy" nội dung câu hỏi trong ngữ cảnh hội thoại khi không cần thiết — tiết kiệm chi phí AI đáng kể qua cơ chế cache.

## Yêu cầu cài đặt

| Yêu cầu | Kiểm tra | Cài nếu thiếu |
|---|---|---|
| macOS + Google Chrome đang mở, đã đăng nhập, ở đúng trang "Ôn luyện" | — | mở tab trang thi trong Chrome |
| **cliclick** (click chuột qua CGEvent) | `which cliclick` | `brew install cliclick` |
| **python3** (parse JSON, quản lý cache) | `which python3` | có sẵn qua Xcode CLT hoặc `brew install python3` |
| Quyền **Accessibility** cho Terminal/ứng dụng đang chạy lệnh | System Settings → Privacy & Security → Accessibility | tick vào Terminal (hoặc app đang chạy Claude Code). Nếu vừa tick mà vẫn lỗi `-25211`, thử tắt/bật lại checkbox hoặc khởi động lại Terminal |

Không cần cài npm/node package nào — các file `.js` trong `auto_quiz.js`, `debug_*.js` ở gốc repo là dự án cũ, **không liên quan** tới bộ script này.

## Cách dùng

Trong Claude Code, gõ `/quiz`. AI sẽ tự chạy vòng lặp cho tới khi hết bài hoặc bạn gõ "dừng".

Chạy tay 1 script riêng lẻ để debug, ví dụ:
```bash
scripts/quiz/switch_tab.sh   # đảm bảo đúng tab
scripts/quiz/step.sh         # xử lý 1 câu (xem output bên dưới)
```

## Luồng hoạt động (mỗi câu hỏi)

```
step.sh
  ├─ đọc trang (read.sh)
  ├─ tra cache.json theo nội dung đáp án
  │
  ├─ HIT (đã biết đáp án đúng từ trước)
  │     → tự click đáp án đúng + bấm Tiếp — KHÔNG in nội dung câu hỏi ra
  │
  ├─ MISS + có ảnh biển báo/sa hình
  │     → tự chọn random (không xem ảnh) + học đáp án đúng từ feedback trang + bấm Tiếp
  │
  └─ MISS + không ảnh  →  in "NEED_AI" + JSON câu hỏi
        │
        AI đọc câu hỏi, suy luận, chọn index
        │
        ▼
      commit.sh <index>
        ├─ click đáp án
        ├─ đọc feedback trang (đúng/sai) → lưu đáp án đúng thật vào cache.json
        └─ bấm Tiếp
```

Nhờ vậy, càng làm nhiều lần (đề hay lặp lại theo ngân hàng câu hỏi cố định), tỉ lệ `HIT` càng cao và AI càng ít phải đọc/suy luận lại — chỉ tốn chi phí AI cho câu **thực sự mới và không có ảnh**.

## File & script

| File | Vai trò |
|---|---|
| `read.sh` + `read_page.js` | đọc DOM trang hiện tại: câu hỏi, đáp án (rect CSS + trạng thái checked), nút Tiếp, tiến độ, `hasImage`, feedback đúng/sai sau khi trả lời |
| `click.sh` | quy đổi 1 rect CSS → toạ độ điểm màn hình (lấy bounds cửa sổ Chrome mới nhất) rồi click bằng `cliclick` |
| `answer.sh <index>` | click đáp án theo index, verify `checked=true` |
| `next.sh` | click nút Tiếp, verify tiến độ đã tăng |
| `switch_tab.sh` | chuyển tab Chrome về đúng tab trang thi theo URL |
| `cache_common.py`, `cache.json` | chuẩn hoá + hash nội dung câu hỏi (theo tập đáp án, không phụ thuộc thứ tự/đánh số) làm khoá cache |
| `lookup.py` / `lookup.sh` | tra cache theo câu hỏi hiện tại |
| `learn.py` / `learn.sh` | đọc feedback trang sau khi trả lời, lưu đáp án đúng thật vào cache |
| `step.sh` | gộp read → lookup → (tự xử lý HIT/ảnh, hoặc in NEED_AI) |
| `commit.sh <index>` | gộp answer → learn → next, dùng sau khi AI chọn index từ `NEED_AI` |
| `_retry.sh` | hàm `retry` dùng chung — chạy lại 1 lần nếu lệnh đầu fail (click timing đôi khi trượt) |

## Lưu ý đã biết (tránh mất công điều tra lại)

- Đôi khi một lệnh script báo `Exit code 1` **không kèm thông báo lỗi nào** dù hành động thực ra đã thành công (ví dụ tiến độ đã tăng) — đây là hiện tượng báo cáo tạm thời của môi trường chạy lệnh, không phải lỗi thật. Nếu gặp, đừng lặp lại lệnh y hệt (dễ double-click/lệch câu) — hãy `read.sh` lại để xem trạng thái thật rồi mới quyết định bước tiếp theo.
- Nếu trang hiện overlay "Bạn đã vừa rời màn hình..." (mất focus do chuyển tab/app), `read.sh` vẫn đọc DOM bình thường nhưng click có thể trúng overlay thay vì đáp án — chạy lại `switch_tab.sh` rồi thử lại.
- `cache.json` được commit cùng repo (không có trong `.gitignore`) để giữ lại giữa các phiên — nếu ngân hàng câu hỏi của trang thay đổi, có thể xoá file này (hoặc để trống `{}`) để học lại từ đầu.
