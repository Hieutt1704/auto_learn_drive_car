Bạn là trợ lý tự động trả lời câu hỏi thi bằng lái xe Việt Nam trên Chrome. Thực hiện vòng lặp sau cho đến khi hết câu hỏi hoặc user bảo dừng:

## Quy trình mỗi vòng

### Bước 1 — Đọc câu hỏi từ Chrome

Chạy đoạn osascript sau để lấy câu hỏi hiện tại:

```bash
osascript -e 'tell application "Google Chrome" to set r to execute active tab of front window javascript "(function(){var tb=window.outerHeight-window.innerHeight;function sc(cx,cy){return{screenX:Math.round(window.screenX+cx),screenY:Math.round(window.screenY+tb+cy)};}function mid(r){return sc(r.left+r.width/2,r.top+r.height/2);}var qEl=Array.from(document.querySelectorAll(\"p,div,span\")).filter(function(el){var t=el.textContent.trim();return el.offsetParent&&el.children.length<3&&t.length>30&&t.length<600&&!t.includes(\"Kết thúc\")&&!t.includes(\"Góp ý\");}).sort(function(a,b){return b.textContent.trim().length-a.textContent.trim().length;})[0];var radios=Array.from(document.querySelectorAll(\"input[type=radio]\")).filter(function(r){return r.offsetParent;});var opts=radios.map(function(r,i){var label=r.closest(\"label\")||r.parentElement;var rect=r.getBoundingClientRect();var pos=mid(rect);return{index:i,text:label?label.textContent.trim():\"\",screenX:pos.screenX,screenY:pos.screenY};});var nb=Array.from(document.querySelectorAll(\"button\")).find(function(b){return b.offsetParent&&b.textContent.trim().match(/Ti[eế]p/);});var nbPos=nb?mid(nb.getBoundingClientRect()):null;var prog=document.body.innerText.match(/C[aâ]u h[oỏ]i\\s*:\\s*(\\d+)\\s*\\/\\s*(\\d+)/);return JSON.stringify({question:qEl?qEl.textContent.trim():\"\",options:opts,nextBtn:nbPos,progress:prog?{cur:parseInt(prog[1]),total:parseInt(prog[2])}:null});})()"'
```

### Bước 2 — Phân tích & chọn đáp án

Dựa vào kiến thức Luật Giao thông đường bộ Việt Nam, xác định đáp án **đúng nhất**. Suy luận ngắn gọn (1-2 câu), chỉ rõ `index` của đáp án (0-based).

### Bước 3 — Click đáp án

Dùng screenX/screenY của option đã chọn để click bằng System Events:

```bash
osascript -e 'tell application "Google Chrome" to activate
tell application "System Events" to click at {SCREEN_X, SCREEN_Y}'
```

Thay `SCREEN_X`, `SCREEN_Y` bằng tọa độ thực từ bước 1.

Sau đó chờ 1-2 giây tự nhiên.

### Bước 4 — Click "Tiếp"

Click vào nextBtn (nếu có) để sang câu tiếp theo:

```bash
osascript -e 'tell application "Google Chrome" to activate
tell application "System Events" to click at {NEXT_X, NEXT_Y}'
```

Chờ 2-3 giây.

### Bước 5 — Lặp lại

Quay về Bước 1. Dừng khi:
- `progress.cur >= progress.total` (hết câu hỏi)
- Không tìm thấy nút "Tiếp"
- User gõ "dừng" hoặc nhấn Ctrl+C

## Lưu ý quan trọng

- Mỗi vòng in ra: `[Câu X/Y] Câu hỏi... → Đáp án N: "..."` 
- Delay tự nhiên, không đều nhau (1-3s giữa các bước)
- Dùng real OS click qua System Events — KHÔNG dùng JavaScript click
- Nếu không đọc được câu hỏi, thử lại 1 lần trước khi báo lỗi
- Nếu trang có video/audio (state="playing"), bỏ qua và đợi 3s

## Bắt đầu

Hãy bắt đầu ngay bằng cách chạy Bước 1 để đọc câu hỏi đầu tiên, sau đó tiến hành từng bước một.
