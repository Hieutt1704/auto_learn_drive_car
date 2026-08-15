#!/bin/bash
# Click vào 1 phần tử trên trang quiz, dựa theo CSS rect (left top width height, đơn vị CSS px,
# lấy trực tiếp từ output của read.sh — field "left"/"top"/"width"/"height" của 1 option hoặc nextBtn).
#
# Usage: click.sh <left> <top> <width> <height>
#
# Tự lấy bounds cửa sổ Chrome NGAY TRƯỚC khi click (cửa sổ có thể đổi vị trí giữa các lần),
# quy đổi CSS px -> điểm màn hình (hệ số k=0.8, toolbar offset=86pt — xem README.md cùng thư mục),
# rồi click bằng cliclick (KHÔNG dùng System Events click at — đã kiểm chứng không đáng tin cậy
# trên trang này: trả về "thành công" nhưng không thực sự click được vào nội dung web).
set -euo pipefail
LEFT="$1"; TOP="$2"; WIDTH="$3"; HEIGHT="$4"
CLICLICK="$(command -v cliclick || echo /opt/homebrew/bin/cliclick)"

osascript <<EOF
tell application "Google Chrome"
    activate
    delay 0.5
    set b to bounds of front window
end tell
set winX to item 1 of b
set winY to item 2 of b
set cx to ($LEFT) + ($WIDTH) / 2
set cy to ($TOP) + ($HEIGHT) / 2
set px to round (winX + (cx * 0.8))
set py to round (winY + 86 + (cy * 0.8))
do shell script "$CLICLICK c:" & px & "," & py
return (px as text) & "," & (py as text)
EOF
