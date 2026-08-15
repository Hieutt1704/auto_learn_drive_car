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

**Bỏ qua xác nhận (confirm) khi chạy script:** vòng lặp `/quiz` gọi các script trong `scripts/quiz/` rất nhiều lần liên tiếp; nếu không cấu hình permission trước, Claude Code sandbox sẽ hỏi xác nhận (confirm) mỗi lần chạy, làm gián đoạn vòng lặp tự động. Cấu hình trong `.claude/settings.local.json` (file cá nhân, không commit lên git), chọn 1 trong 2 cách:

- **Chỉ whitelist script quiz (khuyến nghị, an toàn hơn):** thêm rule cho phép riêng các lệnh liên quan tới quiz, các hành động khác (git push, xoá file, v.v.) vẫn hỏi xác nhận như bình thường.

  ```json
  {
    "permissions": {
      "allow": [
        "Bash(scripts/quiz/*.sh)"
      ]
    }
  }
  ```

- **Bỏ qua toàn bộ xác nhận trong session (`bypassPermissions`):** không hỏi xác nhận cho bất kỳ hành động nào, kể cả xoá file hay git push — chỉ dùng khi bạn kiểm soát tốt phiên làm việc.

  ```json
  {
    "permissions": {
      "defaultMode": "bypassPermissions"
    }
  }
  ```

Sau khi lưu, khởi động lại phiên Claude Code (hoặc mở `/hooks` một lần) để áp dụng.

## Cách dùng

1. Mở Chrome, đăng nhập vào trang thi, vào đúng phần **Ôn luyện**.
2. Trong Claude Code, gõ `/quiz`.
3. AI sẽ tự lặp: đọc câu hỏi → chọn đáp án (từ cache, suy luận, hoặc random nếu có ảnh) → click → chuyển câu, cho đến khi hết bài hoặc bạn gõ "dừng".

## Chi tiết kỹ thuật

Toàn bộ logic (đọc trang, quy đổi toạ độ, click bằng `cliclick`, cơ chế cache) nằm trong `scripts/quiz/` — xem [`scripts/quiz/README.md`](scripts/quiz/README.md) để biết sơ đồ luồng đầy đủ, danh sách script, và các lưu ý đã biết. Skill `/quiz` được định nghĩa ở `.claude/commands/quiz.md`.
