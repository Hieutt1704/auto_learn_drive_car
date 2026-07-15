#!/usr/bin/env node
const fs = require('fs');
const readline = require('readline');
const path = require('path');

const EXAMPLE_FILE = path.join(__dirname, '.env.example');
const ENV_FILE = path.join(__dirname, '.env');

function ask(rl, question) {
  return new Promise(resolve => rl.question(question, resolve));
}

async function main() {
  if (!fs.existsSync(EXAMPLE_FILE)) {
    console.error('[!] Không tìm thấy .env.example');
    process.exit(1);
  }

  const lines = fs.readFileSync(EXAMPLE_FILE, 'utf8').split('\n');
  const existing = {};

  if (fs.existsSync(ENV_FILE)) {
    fs.readFileSync(ENV_FILE, 'utf8').split('\n').forEach(line => {
      const match = line.match(/^([^#=\s]+)=(.*)$/);
      if (match) existing[match[1]] = match[2];
    });
    console.log('[i] Tìm thấy .env hiện có — giá trị cũ sẽ dùng làm default.\n');
  }

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const output = [];

  for (const line of lines) {
    const commentOrEmpty = line.startsWith('#') || line.trim() === '';
    if (commentOrEmpty) {
      output.push(line);
      continue;
    }

    const match = line.match(/^([^=]+)=(.*)$/);
    if (!match) {
      output.push(line);
      continue;
    }

    const key = match[1].trim();
    const defaultVal = existing[key] ?? match[2].trim();
    const prompt = defaultVal
      ? `${key} [${defaultVal}]: `
      : `${key}: `;

    const input = await ask(rl, prompt);
    const value = input.trim() || defaultVal;
    output.push(`${key}=${value}`);
  }

  rl.close();
  fs.writeFileSync(ENV_FILE, output.join('\n') + '\n');
  console.log('\n[✓] Đã tạo .env thành công!');
}

main().catch(err => { console.error(err); process.exit(1); });
