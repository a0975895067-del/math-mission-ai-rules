import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';

const chrome = process.env.CHROME_PATH || 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';
const baseUrl = process.env.SITE_URL || 'http://127.0.0.1:4317';
const port = 9333;
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'math-mission-smoke-'));
const browser = spawn(chrome, [
  '--headless',
  '--disable-gpu',
  '--disable-extensions',
  '--no-first-run',
  '--no-sandbox',
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${profile}`,
  `${baseUrl}/battle.html`,
], { stdio: 'ignore' });

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function target() {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      const list = await fetch(`http://127.0.0.1:${port}/json/list`).then((response) => response.json());
      const page = list.find((item) => item.type === 'page' && item.url.includes('battle.html'));
      if (page) return page;
    } catch {}
    await wait(100);
  }
  throw new Error('Chrome DevTools target did not become ready');
}

async function connect(url) {
  const socket = new WebSocket(url);
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true });
    socket.addEventListener('error', reject, { once: true });
  });
  let serial = 0;
  const pending = new Map();
  socket.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);
    if (!message.id || !pending.has(message.id)) return;
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    message.error ? reject(new Error(message.error.message)) : resolve(message.result);
  });
  return {
    call(method, params = {}) {
      const id = ++serial;
      socket.send(JSON.stringify({ id, method, params }));
      return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
    },
    close() { socket.close(); },
  };
}

let cdp;
try {
  const page = await target();
  cdp = await connect(page.webSocketDebuggerUrl);
  await cdp.call('Runtime.enable');
  await wait(1200);

  const before = await cdp.call('Runtime.evaluate', {
    expression: `JSON.stringify({
      auth: Boolean(document.querySelector('#authGate')),
      setupVisible: !document.querySelector('#setup').classList.contains('hidden'),
      title: document.querySelector('.mode-page-title')?.textContent,
      start: document.querySelector('#start')?.textContent
    })`,
    returnByValue: true,
  });
  const initial = JSON.parse(before.result.value);
  assert.equal(initial.auth, false, '登入區仍存在');
  assert.equal(initial.setupVisible, true, '對戰設定區未顯示');
  assert.equal(initial.title, '怪物對戰', '對戰頁標題錯誤');
  assert.match(initial.start, /開始怪物對戰/, '開始按鈕文字錯誤');

  await cdp.call('Runtime.evaluate', { expression: `document.querySelector('#start').click()` });
  await wait(1500);
  const after = await cdp.call('Runtime.evaluate', {
    expression: `JSON.stringify({
      gameVisible: !document.querySelector('#game').classList.contains('hidden'),
      question: document.querySelector('#question')?.textContent?.trim(),
      answers: document.querySelectorAll('#answers button').length,
      battleStage: Boolean(document.querySelector('#playStage:not(.hidden)'))
    })`,
    returnByValue: true,
  });
  const started = JSON.parse(after.result.value);
  assert.equal(started.gameVisible, true, '按下開始後未進入題目');
  assert.ok(started.question.length > 4, '題目未載入');
  assert.equal(started.answers, 4, '選項不是四個');
  assert.equal(started.battleStage, true, '對戰舞台未顯示');
  console.log(`PASS: 怪物對戰已開始，題目「${started.question.slice(0, 28)}…」，四個選項與對戰舞台均正常。`);
} finally {
  try { await cdp?.call('Browser.close'); } catch {}
  cdp?.close();
  await wait(500);
  if (browser.exitCode === null) browser.kill();
  await wait(300);
  try {
    fs.rmSync(profile, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
  } catch {
    console.warn(`WARN: Chrome 測試已通過；暫存設定檔稍後可由系統清理：${profile}`);
  }
}
