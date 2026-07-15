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
    var audios = Array.from(document.querySelectorAll('audio')).map(function(a) {
      var r = a.getBoundingClientRect();
      return { paused: a.paused, ended: a.ended, src: a.src.slice(0, 60), cls: a.className, w: r.width, h: r.height };
    });
    var btns = Array.from(document.querySelectorAll('button, [role="button"], [class*="play"], [class*="audio"]'))
      .filter(function(e) { return e.offsetParent !== null; })
      .map(function(e) {
        var r = e.getBoundingClientRect();
        return { tag: e.tagName, cls: e.className.slice(0, 60), text: e.textContent.trim().slice(0, 30), x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) };
      });
    return JSON.stringify({ audios: audios, btns: btns });
  })()`;

  const raw = await runInChrome(js);
  if (!raw || raw === 'missing value') return console.log('Không lấy được dữ liệu — hãy mở trang audio trong Chrome');
  const data = JSON.parse(raw);
  console.log('\n=== AUDIO TAGS ===');
  data.audios.forEach((a, i) => console.log(`[${i}] paused=${a.paused} ended=${a.ended} size=${a.w}x${a.h} src="${a.src}"`));
  console.log('\n=== BUTTONS/PLAY ELEMENTS ===');
  data.btns.forEach((b, i) => console.log(`[${i}] <${b.tag}> text="${b.text}" class="${b.cls}" pos=(${b.x},${b.y}) size=${b.w}x${b.h}`));
}

main().catch(console.error);
