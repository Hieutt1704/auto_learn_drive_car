const { exec } = require('child_process');
const readline = require('readline');

const CHECK_INTERVAL = 2000;

function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(question, ans => { rl.close(); resolve(ans); }));
}

// Chạy JavaScript trong tab Chrome đang active
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

async function findAndClickPlay() {
  const js = `(function() {
    var video = document.querySelector('video');
    if (video) {
      if (video.ended) {
        var nextBtn = Array.from(document.querySelectorAll('button')).find(function(b) {
          return b.textContent.includes('Tiếp theo');
        });
        if (nextBtn) { nextBtn.click(); return 'clicked:next'; }
        return 'video-ended-no-next';
      }
      if (video.paused) {
        var rect = video.getBoundingClientRect();
        var el = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
        if (el && el !== video) { el.click(); return 'clicked:overlay'; }
        video.play().catch(function(){});
        return 'clicked:video.play()';
      }
      return 'playing';
    }
    return 'no-video';
  })()`;
  try {
    const result = await runInChrome(js);
    return result;
  } catch (e) {
    return 'error:' + e.message;
  }
}

async function main() {
  console.log('='.repeat(50));
  console.log('  Auto-Play — điều khiển Chrome thật');
  console.log('='.repeat(50));
  console.log('\n[✓] Không cần đăng nhập — dùng Chrome đang mở của bạn.');
  console.log('[*] Bắt đầu kiểm tra ngay...\n');

  let clickedTotal = 0;
  console.log('\n[*] Bắt đầu theo dõi tab Chrome đang active. Nhấn Ctrl+C để dừng.\n');

  process.on('SIGINT', () => {
    console.log(`\n[✓] Đã dừng. Tổng số lần click: ${clickedTotal}`);
    process.exit(0);
  });

  while (true) {
    const result = await findAndClickPlay();
    if (result.startsWith('clicked')) {
      clickedTotal++;
      console.log(`[▶] Click #${clickedTotal} — ${result}`);
      await new Promise(r => setTimeout(r, 1000));
    } else if (result.startsWith('error')) {
      console.log(`[!] Lỗi: ${result} — Chrome có đang mở không?`);
      await new Promise(r => setTimeout(r, 3000));
    } else {
      await new Promise(r => setTimeout(r, CHECK_INTERVAL));
    }
  }
}

main().catch(console.error);
