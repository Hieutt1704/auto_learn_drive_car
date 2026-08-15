#!/bin/bash
# Tra cache xem câu hỏi hiện tại đã có đáp án đúng đã biết chưa.
# Output: "HIT <index>" hoặc "MISS".
set -euo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
"$DIR/read.sh" | python3 "$DIR/lookup.py"
