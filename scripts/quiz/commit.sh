#!/bin/bash
# Gọi sau khi step.sh in "NEED_AI" và AI đã đọc câu hỏi, chọn được index.
# Click đáp án, lưu vào cache theo feedback thật của trang, rồi sang câu tiếp theo.
# Usage: commit.sh <index>
set -euo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$DIR/_retry.sh"
IDX="$1"

retry "$DIR/answer.sh" "$IDX" > /dev/null
LEARN_RESULT="$("$DIR/learn.sh" || echo SKIP)"
NEXT_RESULT="$(retry "$DIR/next.sh")"
echo "COMMITTED $IDX ($LEARN_RESULT) -> $NEXT_RESULT"
