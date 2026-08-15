#!/bin/bash
# Đọc câu hỏi hiện tại, danh sách đáp án (kèm CSS rect), nút Tiếp, và tiến độ.
# Output: JSON một dòng.
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
JS="$(cat "$DIR/read_page.js")"
osascript -e "tell application \"Google Chrome\" to execute active tab of front window javascript \"$JS\""
