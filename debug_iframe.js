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
    var iframes = Array.from(document.querySelectorAll('iframe')).map(function(f) {
      return { src: f.src.slice(0, 100), cls: f.className, id: f.id, w: f.offsetWidth, h: f.offsetHeight };
    });
    var videos = Array.from(document.querySelectorAll('video')).map(function(v) {
      return { paused: v.paused, src: v.src.slice(0, 80), cls: v.className };
    });
    return JSON.stringify({ iframes: iframes, videos: videos });
  })()`;

  const result = await runInChrome(js);
  const data = JSON.parse(result);
  console.log('\n=== IFRAMES ===');
  data.iframes.forEach((f, i) => console.log(`[${i}] ${f.w}x${f.h} src="${f.src}" class="${f.cls}"`));
  console.log('\n=== VIDEO TAGS ===');
  data.videos.forEach((v, i) => console.log(`[${i}] paused=${v.paused} src="${v.src}" class="${v.cls}"`));
}

main().catch(console.error);
