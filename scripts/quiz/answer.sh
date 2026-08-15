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
else
  echo "FAIL checked=$CHECKED (thử lại: rect có thể đã lệch, gọi lại answer.sh)"
  exit 1
fi
