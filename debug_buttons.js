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
  const js = `
    (function() {
      var els = Array.from(document.querySelectorAll('button, [role="button"], input[type="submit"], input[type="button"], a[class*="btn"], [class*="play"], [class*="resume"], [class*="continue"]'));
      var visible = els.filter(e => e.offsetParent !== null).map(e => ({
        tag: e.tagName,
        cls: e.className.slice(0, 60),
        aria: e.getAttribute('aria-label') || '',
        text: e.textContent.trim().slice(0, 40),
        type: e.type || '',
      }));
      return JSON.stringify(visible);
    })()
  `;

  const result = await runInChrome(js);
  const btns = JSON.parse(result);
  console.log('\n=== BUTTONS ĐANG VISIBLE TRÊN TRANG ===\n');
  btns.forEach((b, i) => {
    console.log(`[${i}] <${b.tag}> text="${b.text}" aria="${b.aria}" class="${b.cls}"`);
  });
}

main().catch(console.error);
