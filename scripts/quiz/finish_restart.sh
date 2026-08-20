#!/bin/bash
# Gộp finish.sh + restart.sh: bấm "Kết thúc luyện thi" rồi "Luyện tất cả (N)" để làm lại từ câu 1.
# Dùng khi đã làm hết bài (không còn nút "Tiếp" vì đang ở câu cuối).
# Output: "RESTARTED [<đúng>/<tổng> dung, <sai> sai] -> OK 1/<total>" hoặc "FAIL ..."
set -euo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$DIR/_retry.sh"

retry "$DIR/finish.sh" > /dev/null
RESTART_RESULT="$(retry "$DIR/restart.sh")"
echo "RESTARTED $RESTART_RESULT"
