#!/bin/bash
# Giống force_click.sh nhưng dành cho việc chọn đáp án theo index khi label bị đẩy ra ngoài
# vùng xem được (câu có ảnh cao). Chỉ ép VỊ TRÍ hiển thị qua CSS (position/top/left), không
# dispatch click/change event nào bằng JS — việc "chọn" vẫn do click OS thật (cliclick) thực hiện.
#
# Usage: force_click_option.sh <index>
set -euo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
IDX="$1"

JS="(function(){var radios=[...document.querySelectorAll('input[type=radio]')].filter(function(r){return r.offsetParent;}); var r=radios[$IDX]; if(!r) return ''; var label=r.closest('label')||r.parentElement; var el=label||r; el.style.position='fixed'; el.style.top='40px'; el.style.left='40px'; el.style.zIndex='999999'; var rect=el.getBoundingClientRect(); return rect.left+' '+rect.top+' '+rect.width+' '+rect.height;})()"

RECT=$(osascript -e "tell application \"Google Chrome\" to execute active tab of front window javascript \"$JS\"")

if [ -z "$RECT" ]; then
  echo "FAIL không tìm thấy option index $IDX"
  exit 1
fi

"$DIR/click.sh" $RECT > /dev/null
echo "OK"
