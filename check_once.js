const { exec } = require('child_process');

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

async function main() {
  const js = `(function() {
    var video = document.querySelector('video');
    if (!video) return 'no-video';
    if (video.ended) {
      var nextBtn = Array.from(document.querySelectorAll('button')).find(function(b) {
        return b.textContent.includes('Tiep theo') || b.textContent.includes('Tiếp theo');
      });
      if (nextBtn) { nextBtn.click(); return 'clicked:next'; }
      return 'video-ended-no-next';
    }
    if (video.paused) {
      var rect = video.getBoundingClientRect();
      var el = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
      if (el && el !== video) {
        el.click();
        return 'clicked:overlay:' + el.tagName + ':' + (el.className || '').slice(0, 40);
      }
      video.play();
      return 'clicked:video.play';
    }
    return 'playing';
  })()`;

  const result = await runInChrome(js);
  console.log('Kết quả:', result);
}

main().catch(console.error);
