const { exec } = require('child_process');

const CHECK_INTERVAL = 3000;

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

function realClick(x, y) {
  const script = [
    'tell application "Google Chrome" to activate',
    `tell application "System Events" to click at {${Math.round(x)}, ${Math.round(y)}}`,
  ].join('\n');
  return new Promise((resolve, reject) => {
    exec(`osascript -e '${script}'`, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

async function tick() {
  const js = [
    '(function() {',
    '  var tb = window.outerHeight - window.innerHeight;',
    '  function sc(cx,cy){return {screenX:Math.round(window.screenX+cx),screenY:Math.round(window.screenY+tb+cy)};}',
    '  function mid(r){return sc(r.left+r.width/2,r.top+r.height/2);}',
    '  var media = document.querySelector("video") || document.querySelector("audio");',
    '  if (!media) return JSON.stringify({state:"no-media"});',
    '  if (media.ended) {',
    '    var nb = Array.from(document.querySelectorAll("button")).find(function(b){return b.textContent.indexOf("Ti\\u1ebfp theo")!==-1;});',
    '    return JSON.stringify({state:"ended"});',
    '  }',
    '  if (media.paused) {',
    '    var pop = Array.from(document.querySelectorAll("button")).find(function(b){return b.offsetParent&&b.textContent.indexOf("r\\u1eddi m\\u00e0n h\\u00ecnh")!==-1;});',
    '    if (pop) return JSON.stringify(Object.assign({state:"popup"},mid(pop.getBoundingClientRect())));',
    '    var rect = media.getBoundingClientRect();',
    '    if (rect.width===0||rect.height===0) {',
    '      var pb = document.querySelector("button.media-audio__play-button");',
    '      if (!pb) pb = Array.from(document.querySelectorAll("button")).find(function(b){return b.offsetParent&&(b.className||"").toLowerCase().indexOf("play")!==-1&&(b.className||"").toLowerCase().indexOf("pause")===-1;});',
    '      if (pb) return JSON.stringify(Object.assign({state:"audio"},mid(pb.getBoundingClientRect())));',
    '      return JSON.stringify({state:"no-btn"});',
    '    }',
    '    var mx=rect.left+rect.width/2, my=rect.top+rect.height/2;',
    '    var ov=document.elementFromPoint(mx,my);',
    '    if (ov&&ov!==media){var or=ov.getBoundingClientRect();mx=or.left+or.width/2;my=or.top+or.height/2;}',
    '    return JSON.stringify(Object.assign({state:"video"},sc(mx,my)));',
    '  }',
    '  return JSON.stringify({state:"playing"});',
    '})()',
  ].join(' ');

  const raw = await runInChrome(js);
  if (!raw || raw === 'missing value') return { state: 'no-media' };
  return JSON.parse(raw);
}

async function main() {
  console.log('='.repeat(50));
  console.log('  Auto-Play — Real OS click (isTrusted: true)');
  console.log('='.repeat(50));
  console.log('[!] Yêu cầu: System Settings → Privacy → Accessibility → bật Terminal');
  console.log('[!] Đừng di chuyển chuột hoặc che cửa sổ Chrome khi đang chạy.');
  console.log('[*] Nhấn Ctrl+C để dừng.\n');

  let total = 0;

  process.on('SIGINT', () => {
    console.log(`\n[✓] Đã dừng. Tổng số lần click: ${total}`);
    process.exit(0);
  });

  while (true) {
    try {
      const target = await tick();

      if (target.state === 'playing' || target.state === 'no-media' || target.state === 'ended' || target.state === 'no-btn') {
        process.stdout.write(`\r[~] ${target.state.padEnd(20)}`);
        await new Promise(r => setTimeout(r, CHECK_INTERVAL));
        continue;
      }

      await realClick(target.screenX, target.screenY);
      total++;
      console.log(`[▶] #${total} — ${target.state} (${target.screenX}, ${target.screenY})`);
      await new Promise(r => setTimeout(r, 3000));

    } catch (e) {
      process.stdout.write(`\r[!] ${e.message.slice(0, 80)}`);
      await new Promise(r => setTimeout(r, 3000));
    }
  }
}

main().catch(console.error);
