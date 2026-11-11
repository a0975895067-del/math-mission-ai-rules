import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const site = path.join(root, 'site');
const pages = ['index.html', 'practice.html', 'battle.html', 'collection.html', 'practice-panel.html', 'battle-panel.html', 'collection-panel.html'];
const forbidden = /authGate|studentEmail|studentCode|sendCode|verifyCode|logoutButton|secure-auth\.js|local-access\.js|teacher-dashboard/i;

for (const file of pages) {
  const html = fs.readFileSync(path.join(site, file), 'utf8');
  assert.doesNotMatch(html, forbidden, `${file} 仍含登入或後台功能`);
  assert.match(html, /static-access\.js/, `${file} 缺少無登入介面`);
  assert.match(html, /name="robots" content="noindex, nofollow, noarchive"/, `${file} 缺少不索引設定`);
  for (const match of html.matchAll(/(?:src|href)=["']([^"'#?]+)[^"']*["']/g)) {
    const target = match[1];
    if (/^(?:https?:|mailto:|data:|javascript:)/.test(target)) continue;
    assert.ok(fs.existsSync(path.join(site, target)), `${file} 引用不存在的資源：${target}`);
  }
}

const home = fs.readFileSync(path.join(site, 'index.html'), 'utf8');
for (const label of ['傳統測驗', '怪物對戰', '收集精靈']) {
  assert.ok(fs.readFileSync(path.join(site, 'mode-home.js'), 'utf8').includes(label), `首頁缺少模式：${label}`);
}
assert.ok(fs.existsSync(path.join(root, 'AGENTS.md')), '缺少 AGENTS.md');
assert.ok(fs.readFileSync(path.join(root, 'AGENTS.md'), 'utf8').length > 1800, 'AGENTS.md 規則過於簡略');
assert.doesNotMatch(home, /登入|驗證碼|電子郵件/, '首頁仍出現登入文字');

const scripts = fs.readdirSync(site).filter((name) => name.endsWith('.js'));
for (const file of scripts) {
  const source = fs.readFileSync(path.join(site, file), 'utf8');
  if (/^\s*import\s/m.test(source) || /^\s*export\s/m.test(source)) continue;
  new vm.Script(source, { filename: file });
}

const modeSource = fs.readFileSync(path.join(site, 'mode-home.js'), 'utf8');
for (const panel of ['practice-panel.html', 'battle-panel.html', 'collection-panel.html']) {
  assert.ok(modeSource.includes(panel), `模式首頁未連結 ${panel}`);
}

console.log(`PASS: ${pages.length} 個頁面、${scripts.length} 個 JavaScript 檔案與三種學習模式檢查通過。`);
