#!/bin/bash
# Xử lý 1 vòng của quiz, thuần script khi có thể (không tốn AI đọc nội dung câu hỏi):
#   - Nếu câu hỏi đã có trong cache.json (HIT): tự click đáp án đúng + next, KHÔNG in nội dung câu hỏi.
#   - Nếu câu hỏi có ảnh (hasImage) và chưa có cache: tự chọn random + học đáp án đúng từ feedback + next.
#   - Nếu KHÔNG có cache và KHÔNG có ảnh: in "NEED_AI" kèm JSON câu hỏi để AI đọc và quyết định
#     (AI gọi tiếp commit.sh <index> sau khi chọn).
set -euo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$DIR/_retry.sh"

PAGE_JSON="$("$DIR/read.sh")"

LOOKUP="$(echo "$PAGE_JSON" | python3 "$DIR/lookup.py")"
HASIMAGE="$(echo "$PAGE_JSON" | python3 -c "import json,sys;print(json.load(sys.stdin)['hasImage'])")"

if [[ "$LOOKUP" == HIT* ]]; then
  IDX="$(echo "$LOOKUP" | awk '{print $2}')"
  retry "$DIR/answer.sh" "$IDX" > /dev/null
  NEXT_RESULT="$(retry "$DIR/next.sh")"
  echo "HIT $IDX -> $NEXT_RESULT"
  exit 0
fi

if [[ "$HASIMAGE" == "True" ]]; then
  N_OPTS="$(echo "$PAGE_JSON" | python3 -c "import json,sys;print(len(json.load(sys.stdin)['options']))")"
  IDX=$(( RANDOM % N_OPTS ))
  retry "$DIR/answer.sh" "$IDX" > /dev/null
  "$DIR/learn.sh" > /dev/null || true
  NEXT_RESULT="$(retry "$DIR/next.sh")"
  echo "RANDOM $IDX -> $NEXT_RESULT"
  exit 0
fi

echo "NEED_AI"
echo "$PAGE_JSON"
