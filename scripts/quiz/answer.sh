#!/bin/bash
# Chọn đáp án theo index (0-based): tự đọc rect mới nhất, click, verify checked.
# Usage: answer.sh <index>
# Output: "OK <index>" nếu radio[index] đã checked, hoặc "FAIL checked=<mang JSON>" nếu không.
set -euo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
IDX="$1"

RECT=$("$DIR/read.sh" | python3 -c "
import json,sys
d=json.load(sys.stdin)
o=d['options'][$IDX]
print(o['left'], o['top'], o['width'], o['height'])
")

"$DIR/click.sh" $RECT > /dev/null
sleep 0.5

CHECKED=$("$DIR/read.sh" | python3 -c "
import json,sys
d=json.load(sys.stdin)
print(json.dumps(d['options'][$IDX]['checked']))
")

if [ "$CHECKED" = "true" ]; then
  echo "OK $IDX"
  exit 0
fi

# Click theo rect thường không ăn — thường do câu có ảnh cao đẩy đáp án ra ngoài vùng xem
# được (không có scroll thật). Thử lại bằng force_click_option.sh (ép vị trí hiển thị qua
# CSS rồi click OS thật) trước khi báo lỗi hẳn.
if "$DIR/force_click_option.sh" "$IDX" > /dev/null 2>&1; then
  sleep 0.5
  CHECKED2=$("$DIR/read.sh" | python3 -c "
import json,sys
d=json.load(sys.stdin)
print(json.dumps(d['options'][$IDX]['checked']))
")
  if [ "$CHECKED2" = "true" ]; then
    echo "OK $IDX"
    exit 0
  fi
fi

echo "FAIL checked=$CHECKED (thử lại: rect có thể đã lệch, gọi lại answer.sh)"
exit 1
