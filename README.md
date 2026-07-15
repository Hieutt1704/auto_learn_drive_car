# Auto Learn Drive Car

Tự động học lái xe trên trang [hoclaixethaiviet.huelms.com](https://hoclaixethaiviet.huelms.com) — script điều khiển Chrome thật của bạn qua AppleScript, dùng **System Events click thật** (isTrusted: true) nên website không phát hiện được automation.

## Yêu cầu

- macOS (dùng AppleScript + System Events)
- Google Chrome
- Node.js >= 16

## Cài đặt

```bash
git clone https://github.com/Hieutt1704/auto_learn_drive_car.git
cd auto_learn_drive_car
npm install
```

Tạo file `.env` từ mẫu:

```bash
cp .env.example .env
```

Điền thông tin đăng nhập vào `.env`:

```
USERNAME=số_cmnd_hoặc_tên_đăng_nhập
PASSWORD=mật_khẩu
```

## Cách dùng

**Bước 1:** Mở Chrome, đăng nhập vào trang học lái xe và điều hướng đến bài học muốn tự động học.

**Bước 2:** Mở terminal, chạy:

```bash
node auto_play.js
```

hoặc:

```bash
npm start
```

**Bước 3:** Để script chạy — nó sẽ tự động:
- Click nút play khi video đang dừng
- Click nút **Tiếp theo** khi video kết thúc để sang mục tiếp theo

Nhấn `Ctrl+C` để dừng.

## Lưu ý

- Script chỉ chạy trên **macOS**
- Script điều khiển **tab đang active** trên Chrome — đừng di chuyển chuột hoặc che cửa sổ Chrome khi đang chạy
- Không cần đóng/mở Chrome, script dùng Chrome đang mở của bạn
- Không cần Playwright hay Chrome debugging port

## Cấu trúc project

```
├── auto_play.js       # Script chính
├── debug_buttons.js   # Debug: in ra các button trên trang
├── debug_iframe.js    # Debug: kiểm tra iframe và video tag
├── check_once.js      # Thử click play 1 lần
├── .env               # Thông tin đăng nhập (không commit)
├── .env.example       # Mẫu file .env
└── package.json
```
