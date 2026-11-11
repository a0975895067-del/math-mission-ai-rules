import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const site = path.join(root, 'site');
const pages = [
  'app.html',
  'practice.html',
  'battle.html',
  'collection.html',
  'practice-panel.html',
  'battle-panel.html',
  'collection-panel.html',
];

const forbiddenScripts = [
  'secure-bootstrap.js',
  'api-config.js',
  'local-access.js',
  'secure-auth.js',
  'secure-role-access.js',
];
const forbiddenStyles = ['role-access.css', 'teacher-dashboard.css', 'teacher-analytics.css'];

function removeElement(html, id, tag) {
  const expression = new RegExp(`<${tag}\\b[^>]*id=["']${id}["'][\\s\\S]*?<\\/${tag}>`, 'i');
  return html.replace(expression, '');
}

function transform(html) {
  let next = removeElement(html, 'authGate', 'section');
  next = removeElement(next, 'studentBar', 'div');
  for (const script of forbiddenScripts) {
    const escaped = script.replaceAll('.', '\\.');
    next = next.replace(new RegExp(`\\s*<script\\b[^>]*src=["'][^"']*${escaped}[^"']*["'][^>]*><\\/script>`, 'gi'), '');
  }
  for (const stylesheet of forbiddenStyles) {
    const escaped = stylesheet.replaceAll('.', '\\.');
    next = next.replace(new RegExp(`\\s*<link\\b[^>]*href=["'][^"']*${escaped}[^"']*["'][^>]*>`, 'gi'), '');
  }
  next = next.replaceAll('learning-area hidden', 'learning-area');
  if (!next.includes('static-access.js')) {
    next = next.replace('</head>', '  <script src="static-access.js"></script>\n</head>');
  }
  next = next.replace(/<meta\s+name=["']robots["'][^>]*>/i, '');
  next = next.replace('</head>', '  <meta name="robots" content="noindex, nofollow, noarchive">\n</head>');
  return next;
}

for (const file of pages) {
  const fullPath = path.join(site, file);
  if (!fs.existsSync(fullPath)) throw new Error(`缺少頁面：${file}`);
  fs.writeFileSync(fullPath, transform(fs.readFileSync(fullPath, 'utf8')));
}

const home = fs.readFileSync(path.join(site, 'app.html'), 'utf8')
  .replaceAll('app.html#modeHome', 'index.html#modeHome');
fs.writeFileSync(path.join(site, 'index.html'), home);
fs.writeFileSync(path.join(site, '數學任務站.html'), home);

for (const file of pages.filter((name) => name !== 'app.html')) {
  const fullPath = path.join(site, file);
  const html = fs.readFileSync(fullPath, 'utf8').replaceAll('app.html#modeHome', 'index.html#modeHome');
  fs.writeFileSync(fullPath, html);
}

const removeFiles = [
  ...forbiddenScripts,
  'auth-config.js',
  'auth.js',
  'role-access.js',
  'role-access.css',
  'invitation-dashboard.js',
  'secure-dashboard.js',
  'teacher-dashboard.html',
  'teacher-dashboard.css',
  'teacher-analytics.css',
];
for (const file of removeFiles) {
  const fullPath = path.join(site, file);
  if (fs.existsSync(fullPath)) fs.rmSync(fullPath);
}

fs.writeFileSync(path.join(site, '.nojekyll'), '');
console.log(`PASS: 已產生 ${pages.length + 2} 個無登入靜態頁面。`);
