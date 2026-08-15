# Auto Learn Drive Car

Tự động làm bài **Ôn luyện** trắc nghiệm bằng lái xe trên [hoclaixethaiviet.huelms.com](https://hoclaixethaiviet.huelms.com), chạy trong [Claude Code](https://claude.com/claude-code) qua skill `/quiz`.

AI đọc từng câu hỏi, suy luận đáp án đúng dựa trên Luật Trật tự, an toàn giao thông đường bộ Việt Nam, rồi điều khiển Chrome thật (click chuột thật qua `cliclick`, không dùng JS click) để chọn đáp án và chuyển câu. Các câu đã từng gặp được lưu vào cache cục bộ nên lần sau gặp lại không cần AI suy luận lại; câu có hình ảnh (biển báo/sa hình) được chọn ngẫu nhiên vì AI không xem ảnh.

## Yêu cầu

- macOS
- [Claude Code](https://claude.com/claude-code)
- Google Chrome
- [cliclick](https://github.com/BlueM/cliclick) — `brew install cliclick`
- python3 (có sẵn qua Xcode Command Line Tools hoặc `brew install python3`)

## Cài đặt

```bash
git clone https://github.com/Hieutt1704/auto_learn_drive_car.git
cd auto_learn_drive_car
brew install cliclick
```

**Cấp quyền Accessibility (bắt buộc, chỉ làm 1 lần):** System Settings → Privacy & Security → Accessibility → bật cho Terminal (hoặc ứng dụng đang chạy Claude Code). Nếu vừa bật mà vẫn gặp lỗi quyền, thử tắt/bật lại checkbox hoặc khởi động lại ứng dụng.

## Cách dùng

1. Mở Chrome, đăng nhập vào trang thi, vào đúng phần **Ôn luyện**.
2. Trong Claude Code, gõ `/quiz`.
3. AI sẽ tự lặp: đọc câu hỏi → chọn đáp án (từ cache, suy luận, hoặc random nếu có ảnh) → click → chuyển câu, cho đến khi hết bài hoặc bạn gõ "dừng".

## Chi tiết kỹ thuật

Toàn bộ logic (đọc trang, quy đổi toạ độ, click bằng `cliclick`, cơ chế cache) nằm trong `scripts/quiz/` — xem [`scripts/quiz/README.md`](scripts/quiz/README.md) để biết sơ đồ luồng đầy đủ, danh sách script, và các lưu ý đã biết. Skill `/quiz` được định nghĩa ở `.claude/commands/quiz.md`.
