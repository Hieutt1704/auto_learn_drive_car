#!/bin/bash
# Trên trang kết quả, bấm nút "Luyện tất cả (N)" để làm lại toàn bộ từ câu 1.
# Output: "OK <stats> -> OK 1/<total>" nếu quay lại được câu 1, "FAIL ..." nếu không.
set -euo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

RESULTS_JSON="$("$DIR/results.sh")"
RECT=$(echo "$RESULTS_JSON" | python3 -c "
import json,sys
d=json.load(sys.stdin)
rb=d.get('restartBtn')
print('' if not rb else f\"{rb['left']} {rb['top']} {rb['width']} {rb['height']}\")
")
STATS=$(echo "$RESULTS_JSON" | python3 -c "
import json,sys
d=json.load(sys.stdin)
s=d.get('stats')
print('' if not s else f\"{s['correct']}/{s['total']} dung, {s['wrong']} sai\")
")

if [ -z "$RECT" ]; then
  echo "FAIL không tìm thấy nút Luyện tất cả"
  exit 1
fi

"$DIR/click.sh" $RECT > /dev/null
sleep 1.2

PAGE_JSON="$("$DIR/read.sh")"
CUR=$(echo "$PAGE_JSON" | python3 -c "import json,sys; d=json.load(sys.stdin); p=d['progress']; print(p['cur'] if p else -1)")
TOTAL=$(echo "$PAGE_JSON" | python3 -c "import json,sys; d=json.load(sys.stdin); p=d['progress']; print(p['total'] if p else -1)")

if [ "$CUR" == "1" ]; then
  echo "STATS[$STATS] OK $CUR/$TOTAL"
else
  echo "FAIL chưa quay lại câu 1 sau khi bấm Luyện tất cả (đang ở $CUR)"
  exit 1
fi
