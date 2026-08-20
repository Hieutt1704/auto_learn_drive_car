#!/bin/bash
# Bấm nút "Kết thúc luyện thi" trên trang quiz để sang trang kết quả.
# Output: "OK" nếu đã sang trang kết quả, "FAIL ..." nếu không.
set -euo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

PAGE_JSON="$("$DIR/read.sh")"
RECT=$(echo "$PAGE_JSON" | python3 -c "
import json,sys
d=json.load(sys.stdin)
fb=d.get('finishBtn')
print('' if not fb else f\"{fb['left']} {fb['top']} {fb['width']} {fb['height']}\")
")

if [ -z "$RECT" ]; then
  echo "FAIL không tìm thấy nút Kết thúc luyện thi"
  exit 1
fi

"$DIR/click.sh" $RECT > /dev/null
sleep 1.2

RESULTS_JSON="$("$DIR/results.sh")"
IS_RESULTS=$(echo "$RESULTS_JSON" | python3 -c "import json,sys; print(json.load(sys.stdin)['isResultsPage'])")

if [ "$IS_RESULTS" == "True" ]; then
  echo "OK"
else
  echo "FAIL chưa thấy trang kết quả sau khi bấm Kết thúc luyện thi"
  exit 1
fi
