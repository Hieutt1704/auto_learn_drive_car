#!/bin/bash
# Sau khi answer.sh đã click (feedback đang hiện trên trang), đọc feedback và lưu đáp án đúng vào cache.
# Gọi NGAY SAU answer.sh, TRƯỚC next.sh (next.sh sẽ làm feedback biến mất).
# Output: "SAVED <index>" hoặc "SKIP <lý do>".
set -euo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
"$DIR/read.sh" | python3 "$DIR/learn.py"
