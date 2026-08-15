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
  echo "FAIL không tìm thấy nút Tiếp (có thể đã hết bài hoặc cần Kết thúc luyện thi)"
  exit 1
fi

"$DIR/click.sh" $RECT > /dev/null
sleep 1.2

AFTER_JSON=$("$DIR/read.sh")
CUR_AFTER=$(echo "$AFTER_JSON" | python3 -c "import json,sys; d=json.load(sys.stdin); p=d['progress']; print(p['cur'] if p else -1)")
TOTAL=$(echo "$AFTER_JSON" | python3 -c "import json,sys; d=json.load(sys.stdin); p=d['progress']; print(p['total'] if p else -1)")

if [ "$CUR_AFTER" != "$CUR_BEFORE" ]; then
  echo "OK $CUR_AFTER/$TOTAL"
else
  echo "FAIL progress không đổi ($CUR_BEFORE/$TOTAL) — thử gọi lại next.sh"
  exit 1
fi
