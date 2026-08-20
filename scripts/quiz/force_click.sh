#!/bin/bash
# Dùng khi 1 nút bị đẩy ra ngoài vùng xem được (câu có ảnh cao khiến layout tràn, không có
# scrollbar thật để cuộn tới) khiến click theo rect bình thường không chạm tới được.
# Chỉ dùng cho nút "Tiếp" hoặc "Kết thúc luyện thi" — KHÔNG dùng cho việc chọn đáp án
# (chọn đáp án luôn phải qua answer.sh dựa theo rect thật, không ép vị trí).
#
# Cơ chế: gán tạm style.position=fixed;top=40;left=40 cho nút qua JS (chỉ chỉnh VỊ TRÍ hiển thị,
# không dispatch click/JS event nào lên phần tử) rồi click.sh thật vào vị trí mới đó. Coi như
# tương đương "cuộn trang tới phần tử" bằng tay, phần click vẫn là click OS thật qua cliclick.
#
# Usage: force_click.sh "<đúng nội dung nút, khớp chính xác sau khi trim, không chứa dấu nháy>"
set -euo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEXT="$1"

JS="(function(){var t='${TEXT}'; var btns=[...document.querySelectorAll('button')].filter(function(b){return b.offsetParent && b.textContent.trim()===t;}); if(!btns.length) return ''; var b=btns[0]; b.style.position='fixed'; b.style.top='40px'; b.style.left='40px'; b.style.zIndex='999999'; var r=b.getBoundingClientRect(); return r.left+' '+r.top+' '+r.width+' '+r.height;})()"

RECT=$(osascript -e "tell application \"Google Chrome\" to execute active tab of front window javascript \"$JS\"")

if [ -z "$RECT" ]; then
  echo "FAIL không tìm thấy nút \"$TEXT\""
  exit 1
fi

"$DIR/click.sh" $RECT > /dev/null
echo "OK"
