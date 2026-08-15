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
  const js = [
    '(function() {',
    '  var result = {};',
    // Tìm câu hỏi
    '  var qEls = document.querySelectorAll("[class*=question], [class*=quiz], [class*=exam], [class*=test], h3, h4, .card, .ant-card");',
    '  result.questions = Array.from(qEls).slice(0,5).map(function(el) {',
    '    return { cls: el.className.slice(0,50), text: el.textContent.trim().slice(0,150) };',
    '  });',
    // Tìm các đáp án
    '  var aEls = document.querySelectorAll("input[type=radio], input[type=checkbox], [class*=answer], [class*=option], [class*=choice]");',
    '  result.answers = Array.from(aEls).slice(0,10).map(function(el) {',
    '    var label = el.closest("label") || el.parentElement;',
    '    return { type: el.type, cls: el.className.slice(0,40), text: label ? label.textContent.trim().slice(0,80) : "" };',
    '  });',
    '  return JSON.stringify(result);',
    '})()',
  ].join(' ');

  const raw = await runInChrome(js);
  if (!raw || raw === 'missing value') return console.log('Không đọc được — hãy mở trang bài tập trong Chrome');
  const data = JSON.parse(raw);

  console.log('\n=== CÂU HỎI ===');
  data.questions.forEach((q, i) => console.log(`[${i}] class="${q.cls}"\n    "${q.text}"\n`));
  console.log('\n=== ĐÁP ÁN ===');
  data.answers.forEach((a, i) => console.log(`[${i}] ${a.type} "${a.text}"`));
}

main().catch(console.error);
