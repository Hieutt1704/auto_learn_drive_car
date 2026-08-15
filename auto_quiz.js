const { exec } = require('child_process');
const https = require('https');

function delay(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function jitter(min = 1200, max = 2500) {
  return min + Math.random() * (max - min);
}

function runInChrome(js) {
  const escaped = js.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, ' ');
  const script = `tell application "Google Chrome"\nset r to execute active tab of front window javascript "${escaped}"\nend tell`;
  return new Promise((resolve, reject) => {
    exec(`osascript -e '${script.replace(/'/g, "'\\''")}'`, (err, out) => {
      if (err) reject(err);
      else resolve(out.trim());
    });
  });
}

function osClick(x, y) {
  const script = [
    'tell application "Google Chrome" to activate',
    `tell application "System Events" to click at {${Math.round(x)}, ${Math.round(y)}}`,
  ].join('\n');
  return new Promise((resolve, reject) => {
    exec(`osascript -e '${script}'`, (err) => err ? reject(err) : resolve());
  });
}

async function readQuiz() {
  const js = `(function(){
    var tb=window.outerHeight-window.innerHeight;
    function sc(cx,cy){return{screenX:Math.round(window.screenX+cx),screenY:Math.round(window.screenY+tb+cy)};}
    function mid(r){return sc(r.left+r.width/2,r.top+r.height/2);}
    var radios=Array.from(document.querySelectorAll('input[type=radio]')).filter(function(r){return r.offsetParent;});
    var opts=radios.map(function(r,i){
      var label=r.closest('label')||r.parentElement;
      var pos=mid(r.getBoundingClientRect());
      return{index:i,text:label?label.textContent.trim():'',screenX:pos.screenX,screenY:pos.screenY};
    });
    var panel=document.querySelector('.question-panel__content,[class*=question-panel],[class*=question__content]');
    var qText='';
    if(panel){
      var clone=panel.cloneNode(true);
      clone.querySelectorAll('input,label,button,.ant-alert').forEach(function(el){el.remove();});
      qText=clone.textContent.trim().replace(/^[\\d\\s\\.]+C[aâ]u h[oỏ]i[^?]*?\\s*/,'').replace(/G[oó]p\\s*[yý]\\s*/,'').replace(/\\s+/g,' ').slice(0,500);
    }
    var nb=Array.from(document.querySelectorAll('button')).find(function(b){return b.offsetParent&&/Ti[eế]p/.test(b.textContent.trim());});
    var nbPos=nb?mid(nb.getBoundingClientRect()):null;
    var prog=document.body.innerText.match(/C[aâ]u h[oỏ]i\\s*:\\s*(\\d+)\\s*\\/\\s*(\\d+)/);
    var isLiet=document.body.innerText.includes('điểm liệt');
    var isLocked=!!Array.from(document.querySelectorAll('h1,h2,h3,p,div')).find(function(el){return el.offsetParent&&el.textContent.includes('KHÔNG THỂ XEM');});
    return JSON.stringify({
      question:qText,
      options:opts,
      nextBtn:nbPos,
      progress:prog?{cur:parseInt(prog[1]),total:parseInt(prog[2])}:null,
      isLiet:isLiet,
      isLocked:isLocked
    });
  })()`;

  const raw = await runInChrome(js);
  if (!raw || raw === 'missing value') return null;
  try { return JSON.parse(raw); } catch { return null; }
}

function callClaude(question, options) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return Promise.resolve(0); // fallback to first option

  const prompt = `Bạn là chuyên gia Luật Giao thông đường bộ Việt Nam. Trả lời câu hỏi thi bằng lái xe sau.

Câu hỏi: ${question}

Các đáp án:
${options.map((o, i) => `${i}: ${o.text}`).join('\n')}

Chỉ trả về một số nguyên duy nhất là index của đáp án đúng (0-based). Không giải thích.`;

  const body = JSON.stringify({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 10,
    messages: [{ role: 'user', content: prompt }]
  });

  return new Promise((resolve) => {
    const req = https.request({
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Length': Buffer.byteLength(body)
      }
    }, (res) => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => {
        try {
          const resp = JSON.parse(data);
          const text = resp.content?.[0]?.text?.trim() || '0';
          const idx = parseInt(text.match(/\d+/)?.[0] || '0');
          resolve(Math.min(idx, options.length - 1));
        } catch { resolve(0); }
      });
    });
    req.on('error', () => resolve(0));
    req.write(body);
    req.end();
  });
}

// Fallback: dùng kiến thức built-in nếu không có API key
function answerByKnowledge(question, options) {
  const q = question.toLowerCase();
  const opts = options.map(o => o.text.toLowerCase());

  // Câu hỏi về "không được / bị cấm / nghiêm cấm" → tìm option mô tả hành vi sai
  const isForbidden = /không được|bị cấm|nghiêm cấm|cấm|vi phạm/.test(q);
  // Câu hỏi về "được phép / đúng / hợp lệ" → tìm option mô tả hành vi đúng
  const isAllowed = /được phép|đúng quy|hợp lệ|đúng với|phải|có quyền/.test(q);

  // Nếu có "cả .* ý trên" / "tất cả" thường sai với câu hỏi 1 đáp án đúng
  // Ưu tiên option cụ thể nhất (dài nhất, mô tả chi tiết nhất hành vi)
  if (isForbidden) {
    // Tìm option chứa các từ khóa vi phạm rõ ràng
    const badKeywords = ['đe dọa','cưỡng ép','xúc phạm','tranh giành','lôi kéo','dàn hàng ngang','phần đường người đi bộ','lấn làn','vượt đèn','ngược chiều','không đội mũ','uống rượu','sử dụng rượu'];
    for (let i = 0; i < opts.length; i++) {
      if (badKeywords.some(k => opts[i].includes(k))) return i;
    }
  }

  // Mặc định: chọn option dài nhất (thường chứa mô tả đầy đủ nhất)
  let maxLen = -1, maxIdx = 0;
  options.forEach((o, i) => {
    if (o.text.length > maxLen && !/(cả|tất cả).*(ý|đáp án)/.test(o.text.toLowerCase())) {
      maxLen = o.text.length;
      maxIdx = i;
    }
  });
  return maxIdx;
}

async function main() {
  console.log('='.repeat(55));
  console.log('  Auto Quiz — Claude AI + Real OS Click');
  console.log('='.repeat(55));

  const hasApiKey = !!process.env.ANTHROPIC_API_KEY;
  console.log(`[*] Chế độ: ${hasApiKey ? 'Claude API (thông minh)' : 'Built-in knowledge (fallback)'}`);
  console.log('[!] Giữ Chrome focus, đừng di chuột. Ctrl+C để dừng.\n');

  let answered = 0;
  let retries = 0;

  process.on('SIGINT', () => {
    console.log(`\n[✓] Đã dừng. Đã trả lời: ${answered} câu`);
    process.exit(0);
  });

  while (true) {
    try {
      const state = await readQuiz();

      if (!state) {
        process.stdout.write('\r[~] Không đọc được trang... ');
        await delay(jitter(2000, 3500));
        retries++;
        if (retries > 5) { console.log('\n[!] Thử lại quá nhiều lần, dừng.'); break; }
        continue;
      }
      retries = 0;

      if (state.isLocked) {
        console.log('[!] Bài học bị khóa. Dừng.');
        break;
      }

      if (!state.options || state.options.length === 0) {
        process.stdout.write('\r[~] Không có câu hỏi, đang chờ... ');
        await delay(jitter(2000, 3500));
        continue;
      }

      const prog = state.progress ? `${state.progress.cur}/${state.progress.total}` : `?/${answered}`;
      const liet = state.isLiet ? ' ⚠️ ĐIỂM LIỆT' : '';

      console.log(`\n[Câu ${prog}]${liet}`);
      console.log(`Q: ${state.question.slice(0, 120)}...`);

      // Chọn đáp án
      let ansIdx;
      if (hasApiKey) {
        ansIdx = await callClaude(state.question, state.options);
      } else {
        ansIdx = answerByKnowledge(state.question, state.options);
      }

      const chosen = state.options[ansIdx];
      console.log(`→ Đáp án ${ansIdx + 1}: "${chosen.text.slice(0, 80)}"`);

      // Click đáp án
      await delay(jitter(800, 1500));
      await osClick(chosen.screenX, chosen.screenY);
      console.log(`   [✓] Đã click (${chosen.screenX}, ${chosen.screenY})`);

      // Đợi rồi click Tiếp
      await delay(jitter(1500, 2500));
      if (state.nextBtn) {
        await osClick(state.nextBtn.screenX, state.nextBtn.screenY);
        console.log(`   [→] Click Tiếp (${state.nextBtn.screenX}, ${state.nextBtn.screenY})`);
      }

      answered++;

      if (state.progress && state.progress.total > 0 && state.progress.cur >= state.progress.total) {
        console.log('\n[✓] Hoàn thành tất cả câu hỏi!');
        break;
      }

      await delay(jitter(1800, 3000));

    } catch (e) {
      process.stdout.write(`\r[!] ${e.message.slice(0, 80)}`);
      await delay(jitter(2000, 4000));
    }
  }
}

main().catch(console.error);
