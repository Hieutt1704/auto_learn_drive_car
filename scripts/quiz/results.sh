#!/bin/bash
# Đọc trang kết quả (sau khi bấm "Kết thúc luyện thi"): có đang ở trang kết quả không,
# rect nút "Luyện tất cả (N)", và thống kê Đúng/Sai/Chưa luyện.
# Output: JSON một dòng.
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
JS="$(cat "$DIR/read_results.js")"
osascript -e "tell application \"Google Chrome\" to execute active tab of front window javascript \"$JS\""
