#!/bin/bash
# Click nút "Tiếp" để sang câu tiếp theo: tự đọc rect mới nhất, click, verify progress đã đổi.
# Output: "OK <cur>/<total>" nếu tiến độ tăng, hoặc "FAIL ..." nếu không đổi / hết bài.
set -euo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

BEFORE_JSON=$("$DIR/read.sh")
CUR_BEFORE=$(echo "$BEFORE_JSON" | python3 -c "import json,sys; d=json.load(sys.stdin); p=d['progress']; print(p['cur'] if p else -1)")
RECT=$(echo "$BEFORE_JSON" | python3 -c "
import json,sys
d=json.load(sys.stdin)
nb=d['nextBtn']
if not nb:
    print('')
else:
    print(nb['left'], nb['top'], nb['width'], nb['height'])
")

if [ -z "$RECT" ]; then
  # Có thể chỉ là race condition (trang vừa chuyển câu, nút "Tiếp" chưa kịp render khi đọc) —
  # đọc lại 1 lần sau khoảng nghỉ ngắn trước khi kết luận thật sự đã hết bài.
  sleep 1.0
  RECHECK_JSON=$("$DIR/read.sh")
  RECT=$(echo "$RECHECK_JSON" | python3 -c "
import json,sys
d=json.load(sys.stdin)
nb=d['nextBtn']
if not nb:
    print('')
else:
    print(nb['left'], nb['top'], nb['width'], nb['height'])
")
  if [ -z "$RECT" ]; then
    exec "$DIR/finish_restart.sh"
  fi
  BEFORE_JSON="$RECHECK_JSON"
fi

"$DIR/click.sh" $RECT > /dev/null
sleep 1.2

AFTER_JSON=$("$DIR/read.sh")
CUR_AFTER=$(echo "$AFTER_JSON" | python3 -c "import json,sys; d=json.load(sys.stdin); p=d['progress']; print(p['cur'] if p else -1)")
TOTAL=$(echo "$AFTER_JSON" | python3 -c "import json,sys; d=json.load(sys.stdin); p=d['progress']; print(p['total'] if p else -1)")

if [ "$CUR_AFTER" != "$CUR_BEFORE" ]; then
  echo "OK $CUR_AFTER/$TOTAL"
  exit 0
fi

# Không tự ý ép click bằng force_click.sh ở đây nữa (từng gây tác dụng phụ khó lường —
# có lúc vô tình kết thúc/điều hướng sai trang thay vì chỉ bấm đúng nút Tiếp). Nếu câu có
# ảnh cao khiến nút Tiếp bị che/ngoài màn hình, gọi force_click.sh "Tiếp" TRỰC TIẾP và có
# chủ đích khi cần, không phải tự động ở đây.
echo "FAIL progress không đổi ($CUR_BEFORE/$TOTAL) — thử gọi lại next.sh"
exit 1
