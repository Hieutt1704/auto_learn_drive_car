# quiz — tự động làm bài ôn luyện thi bằng lái xe (hoclaixethaiviet.huelms.com)

Bộ script điều khiển Chrome thật trên macOS (không dùng JS click, không dùng Puppeteer/Selenium) để tự động đọc câu hỏi, chọn đáp án, và chuyển câu trong phần "Ôn luyện" của trang thi thử bằng lái xe. Được gọi bởi skill `/quiz` (`.claude/commands/quiz.md`) — AI chỉ cần đọc nội dung câu hỏi khi thực sự phải suy luận; phần còn lại (đọc trang, tính toạ độ, click, tra/lưu cache) chạy thuần script.

## Vì sao cần script riêng thay vì để AI tự gõ lệnh mỗi lần

- `System Events click at` (AppleScript) đã được kiểm chứng là **không đáng tin cậy** trên trang này — trả về "thành công" nhưng nhiều khi không thực sự click được vào nội dung web. Giải pháp là dùng `cliclick` (click qua CGEvent trực tiếp).
- Cửa sổ Chrome có thể đổi vị trí/kích thước giữa các lần thao tác, và hệ số quy đổi CSS px → điểm màn hình phụ thuộc mức zoom hiện tại của trang (100% zoom → k=1.0; nếu trang đang zoom khác 100% thì k khác, xem `click.sh`) — nên toạ độ phải được tính **lại từ đầu ngay trước mỗi lần click**, không dùng toạ độ cũ. Nếu click liên tục trượt nút (progress không đổi dù trang không có overlay), nghi ngờ đầu tiên là k trong `click.sh` đang sai lệch với zoom thực tế — kiểm tra bằng cách so khớp toạ độ tính ra với vị trí thật trên ảnh chụp màn hình.
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
  ├─ tra cache.json theo câu hỏi + đáp án + URL ảnh (nếu có)
  │
  ├─ HIT (đã biết đáp án đúng từ trước)
  │     → tự click đáp án đúng + bấm Tiếp — KHÔNG in nội dung câu hỏi ra
  │
  ├─ MISS + có ảnh biển báo/sa hình
  │     → tự chọn random (không xem ảnh) + học đáp án đúng từ feedback trang + bấm Tiếp
  │
  └─ MISS + không ảnh  →  in "NEED_AI" + JSON câu hỏi đã rút gọn (chỉ `question` + `options[].{index,text}`,
        đã lược bỏ toạ độ rect/nextBtn/finishBtn/hasImage — những field đó chỉ các script nội bộ dùng
        qua Python, AI không cần để suy luận đáp án, in ra sẽ chỉ tốn token vô ích)
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
| `read.sh` + `read_page.js` | đọc DOM trang hiện tại: câu hỏi, đáp án (rect CSS + trạng thái checked), nút Tiếp, nút Kết thúc luyện thi (`finishBtn`), tiến độ, `hasImage`/`imageSrc`, feedback đúng/sai sau khi trả lời |
| `click.sh` | quy đổi 1 rect CSS → toạ độ điểm màn hình (lấy bounds cửa sổ Chrome mới nhất) rồi click bằng `cliclick` |
| `answer.sh <index>` | click đáp án theo index, verify `checked=true` |
| `next.sh` | click nút Tiếp, verify tiến độ đã tăng; nếu không còn nút Tiếp thì đọc lại 1 lần (tránh race condition) trước khi kết luận đã hết bài và tự chuyển sang gọi `finish_restart.sh`. Nếu nút Tiếp CÓ tồn tại nhưng click không làm tiến độ tăng (thường do bị che/ngoài màn hình ở câu có ảnh cao) thì chỉ báo `FAIL` để gọi lại — KHÔNG tự ý dùng `force_click.sh` (đã thử, gây tác dụng phụ khó kiểm soát, có lúc điều hướng nhầm sang trang khác); dùng `force_click.sh "Tiếp"` thủ công, có chủ đích khi thật sự cần |
| `read_results.js` + `results.sh` | đọc trang kết quả sau khi bấm "Kết thúc luyện thi": có đang ở trang kết quả không, rect nút "Luyện tất cả (N)", thống kê Đúng/Sai/Chưa luyện |
| `finish.sh` | bấm nút "Kết thúc luyện thi" trên trang quiz, verify đã sang trang kết quả |
| `restart.sh` | trên trang kết quả, bấm "Luyện tất cả (N)", verify đã quay lại câu 1 |
| `finish_restart.sh` | gộp `finish.sh` → `restart.sh`, dùng khi làm hết 1 lượt để tự động làm lại từ đầu — in ra `RESTARTED STATS[...] OK 1/total` |
| `switch_tab.sh` | chuyển tab Chrome về đúng tab trang thi theo URL |
| `cache_common.py`, `cache.json` | chuẩn hoá + hash **câu hỏi + tập đáp án (không phụ thuộc thứ tự/đánh số) + URL ảnh** (nếu có) làm khoá cache — bắt buộc phải có cả 3 phần vì: (a) nhiều câu khác nhau dùng chung 1 bộ đáp án generic (vd. các mốc tốc độ 80/70/60/50 km/h), chỉ câu hỏi mới phân biệt được; (b) câu có ảnh (biển báo) chỉ ghi đáp án chung chung "Biển 1/2/3", chỉ URL ảnh mới phân biệt được các câu dùng chung cách diễn đạt nhưng ảnh khác nhau |
| `lookup.py` / `lookup.sh` | tra cache theo câu hỏi hiện tại |
| `learn.py` / `learn.sh` | đọc feedback trang sau khi trả lời, lưu đáp án đúng thật vào cache |
| `step.sh` | gộp read → lookup → (tự xử lý HIT/ảnh, hoặc in NEED_AI) |
| `commit.sh <index>` | gộp answer → learn → next, dùng sau khi AI chọn index từ `NEED_AI` |
| `_retry.sh` | hàm `retry` dùng chung — chạy lại 1 lần nếu lệnh đầu fail (click timing đôi khi trượt) |
| `force_click.sh <text>` | fallback khi 1 nút (Tiếp/Kết thúc luyện thi) bị đẩy ra ngoài vùng xem được do câu có ảnh cao — ép `position:fixed` tạm thời qua CSS rồi click OS thật; `next.sh` tự gọi khi click theo rect thường thất bại |
| `force_click_option.sh <index>` | tương tự `force_click.sh` nhưng cho việc chọn đáp án theo index; `answer.sh` tự gọi khi click theo rect thường thất bại |

## Lưu ý đã biết (tránh mất công điều tra lại)

- Đôi khi một lệnh script báo `Exit code 1` **không kèm thông báo lỗi nào** dù hành động thực ra đã thành công (ví dụ tiến độ đã tăng) — đây là hiện tượng báo cáo tạm thời của môi trường chạy lệnh, không phải lỗi thật. Nếu gặp, đừng lặp lại lệnh y hệt (dễ double-click/lệch câu) — hãy `read.sh` lại để xem trạng thái thật rồi mới quyết định bước tiếp theo.
- Nếu trang hiện overlay "Bạn đã vừa rời màn hình..." (mất focus do chuyển tab/app), `read.sh` vẫn đọc DOM bình thường nhưng click có thể trúng overlay thay vì đáp án — chạy lại `switch_tab.sh` rồi thử lại.
- `cache.json` được commit cùng repo (không có trong `.gitignore`) để giữ lại giữa các phiên — nếu ngân hàng câu hỏi của trang thay đổi, có thể xoá file này (hoặc để trống `{}`) để học lại từ đầu.
- Nhãn "Câu hỏi : X/180" ở góc phải trang **không đáng tin** để biết đã sang câu mới hay chưa — có lúc đứng yên ở "1/180" dù đã thực sự chuyển sang câu 2, 3... `read_page.js` lấy `progress.cur` từ số thứ tự trong tiêu đề câu hỏi ("N. Câu hỏi chọn một đáp án") thay vì nhãn này, vì số đó tăng đúng theo câu thực tế.
- Câu hỏi có ảnh cao (sa hình/biển báo lớn) có thể đẩy tổng chiều cao nội dung vượt quá `window.innerHeight` (đã gặp innerHeight=857 cố định, không có scroll container nào — `document.scrollingElement.scrollHeight === window.innerHeight` luôn đúng dù nội dung "tràn", không có cách cuộn trang thật tới phần bị che). Thanh điều hướng "Trước/Tiếp" (`position: sticky`) và thanh điều hướng bài học cố định ở đáy trang (`position: fixed`) có thể **đè lên đúng vị trí** của các đáp án cuối hoặc nút Tiếp khi nó bị đẩy xuống dưới, khiến click theo rect landing đúng toạ độ nhưng thực chất trúng thanh đè phía trên (`document.elementFromPoint` xác nhận điều này). Đây KHÔNG phải lỗi tính toạ độ k/offset. Zoom out bằng phím tắt và điều hướng bàn phím (Tab/Arrow) đã thử nhưng phím không tới Chrome đáng tin trong môi trường này. `answer.sh` khi click theo rect thường thất bại sẽ tự fallback sang `force_click_option.sh` — ép `position:fixed;top:40px;left:40px` tạm thời qua CSS cho đúng đáp án cần chọn (không dispatch click bằng JS, chỉ "kéo" nó vào vùng nhìn thấy được, tương đương cuộn trang bằng tay) rồi mới click OS thật (`cliclick`) vào đó. Đã kiểm chứng hoạt động tốt cho việc CHỌN đáp án.
  **Lưu ý: KHÔNG áp dụng cơ chế tương tự cho nút Tiếp trong `next.sh`** — đã thử (`force_click.sh "Tiếp"` tự động khi click thường fail) nhưng gây tác dụng phụ khó kiểm soát trong thực tế (có lần khiến trang tự điều hướng sang trang kết quả thay vì chỉ sang câu tiếp theo, nghi do ép CSS + click chồng lấn với phần tử khác trên trang có layout đã bị xáo trộn). Đã gỡ fallback này khỏi `next.sh` — nếu click nút Tiếp thường thất bại, chỉ báo `FAIL` để gọi lại `next.sh`, hoặc gọi `force_click.sh "Tiếp"` thủ công có chủ đích khi thật sự cần và đã xác nhận bằng `read.sh`/screenshot rằng nút đang tồn tại nhưng ngoài tầm với.
