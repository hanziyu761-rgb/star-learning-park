/**
 * 生成单文件 HTML 版（所有代码内联，双击即可打开，也可直接上传到任意静态网站）。
 * 用法：node tools/single-html/build.js
 * 过程：临时把入口改为 src/single/index.ts → 导出网页版 → 把 JS 内联进 HTML → 恢复入口。
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root = path.join(__dirname, '..', '..');
const pkgPath = path.join(root, 'package.json');
const original = fs.readFileSync(pkgPath, 'utf8');
const outDir = path.join(root, 'dist-single');

try {
  const pkg = JSON.parse(original);
  pkg.main = 'src/single/index.ts';
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
  fs.rmSync(outDir, { recursive: true, force: true });
  execSync(`npx expo export --platform web --output-dir dist-single --clear`, { cwd: root, stdio: 'inherit' });
} finally {
  fs.writeFileSync(pkgPath, original); // 无论成功失败都恢复入口
}

let html = fs.readFileSync(path.join(outDir, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script src="([^"]+)"[^>]*><\/script>/g)];
if (scripts.length === 0) throw new Error('没有找到脚本');
for (const [tag] of scripts) html = html.replace(tag, '');
html = html.replace(/<link rel="icon"[^>]*>/, '');
const js = scripts
  .map(([, src]) => fs.readFileSync(path.join(outDir, src), 'utf8').replace(/<\/script/gi, '<\\/script'))
  .join('\n;\n');
// 用函数作为替换值，避免代码里的 $ 被当作替换符
html = html.replace('</body>', () => `<script>\n${js}\n</script>\n</body>`);
const out = path.join(root, 'star-learning-park.html');
fs.writeFileSync(out, html);
console.log('已生成', out, (fs.statSync(out).size / 1024 / 1024).toFixed(2), 'MB');
