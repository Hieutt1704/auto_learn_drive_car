const { exec } = require('child_process');

const CHECK_INTERVAL = 2000;

// Chỉ dùng JS để ĐỌC tọa độ, không dùng để click
function runInChrome(js) {
  const escaped = js.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, ' ');
  const script = `tell application "Google Chrome"\nset r to execute active tab of front window javascript "${escaped}"\nend tell`;
  return new Promise((resolve, reject) => {
    exec(`osascript -e '${script.replace(/'/g, "'\\''")}'`, (err, stdout) => {
      if (err) reject(err);
      else resolve(stdout.trim());
    });
  });
}

// Click thật ở cấp OS — tạo event isTrusted: true
function realClick(x, y) {
  const script = [
    'tell application "Google Chrome" to activate',
    `tell application "System Events" to click at {${Math.round(x)}, ${Math.round(y)}}`,
  ].join('\n');
  return new Promise((resolve, reject) => {
    exec(`osascript -e '${script}'`, (err, stdout) => {
      if (err) reject(err);
      else resolve(stdout.trim());
    });
  });
}

// Lấy tọa độ màn hình của phần tử cần click
async function getClickTarget() {
  const js = `(function() {
    var video = document.querySelector('video');

    if (!video) {
      // Thử tìm trong iframe cùng origin
      var frames = Array.from(document.querySelectorAll('iframe'));
      for (var i = 0; i < frames.length; i++) {
        try {
          var doc = frames[i].contentDocument;
          if (doc) { video = doc.querySelector('video'); if (video) break; }
        } catch(e) {}
      }
    }

    if (!video) return JSON.stringify({ state: 'no-video' });

    if (video.ended) {
      var nextBtn = Array.from(document.querySelectorAll('button')).find(function(b) {
        return b.textContent.includes('Tiếp theo');
      });
      if (!nextBtn) return JSON.stringify({ state: 'ended-no-next' });
      var r = nextBtn.getBoundingClientRect();
      var cx = r.left + r.width / 2;
      var cy = r.top  + r.height / 2;
      return JSON.stringify({
        state: 'next-btn',
        screenX: Math.round(window.screenX + cx),
        screenY: Math.round(window.screenY + (window.outerHeight - window.innerHeight) + cy),
      });
    }

    if (video.paused) {
      var rect = video.getBoundingClientRect();
      var mx = rect.left + rect.width  / 2;
      var my = rect.top  + rect.height / 2;
      // Ưu tiên click overlay nếu có
      var overlay = document.elementFromPoint(mx, my);
      if (overlay && overlay !== video) {
        var or = overlay.getBoundingClientRect();
        mx = or.left + or.width  / 2;
        my = or.top  + or.height / 2;
      }
      return JSON.stringify({
        state: 'paused',
        screenX: Math.round(window.screenX + mx),
        screenY: Math.round(window.screenY + (window.outerHeight - window.innerHeight) + my),
      });
    }

    return JSON.stringify({ state: 'playing' });
  })()`;

  const raw = await runInChrome(js);
  if (!raw || raw === 'missing value') return { state: 'no-video' };
  return JSON.parse(raw);
}

async function main() {
  console.log('='.repeat(50));
  console.log('  Auto-Play — Real OS click (isTrusted: true)');
  console.log('='.repeat(50));
  console.log('\n[✓] Dùng System Events click thật — website không phát hiện được.');
  console.log('[!] Đừng di chuyển chuột hoặc che cửa sổ Chrome khi đang chạy.');
  console.log('[*] Nhấn Ctrl+C để dừng.\n');

  let clickedTotal = 0;

  process.on('SIGINT', () => {
    console.log(`\n[✓] Đã dừng. Tổng số lần click: ${clickedTotal}`);
    process.exit(0);
  });

  while (true) {
    try {
      const target = await getClickTarget();

      if (target.state === 'playing') {
        await new Promise(r => setTimeout(r, CHECK_INTERVAL));
        continue;
      }

      if (target.state === 'no-video' || target.state === 'ended-no-next') {
        if (target.state !== 'playing') {
          process.stdout.write(`\r[~] ${target.state.padEnd(20)}`);
        }
        await new Promise(r => setTimeout(r, CHECK_INTERVAL));
        continue;
      }

      await realClick(target.screenX, target.screenY);
      clickedTotal++;
      console.log(`[▶] Click #${clickedTotal} — ${target.state} tại (${target.screenX}, ${target.screenY})`);
      await new Promise(r => setTimeout(r, 1200));

    } catch (e) {
      console.log(`\n[!] Lỗi: ${e.message}`);
      await new Promise(r => setTimeout(r, 3000));
    }
  }
}

main().catch(console.error);
