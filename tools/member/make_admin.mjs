/**
 * 生成管理员的会员开通工具（V5.3）：把私钥和签名库放进网页模板，得到一个可以离线打开的 HTML 文件。
 * 用法：node tools/member/make_admin.mjs <secret.json> <输出.html>
 *   secret.json：{ "secretKey": "...base64...", "publicKey": "...base64..." }（不要放进代码仓库）
 * 输出的文件含私钥，只给管理员自己用；*.admin.html 已在 .gitignore 里，不会被提交。
 * 公钥必须和 src/member/key.ts 里的一样，否则开出的码 APP 核对不过。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const [, , secretFile, outFile] = process.argv;
if (!secretFile || !outFile) {
  console.error('用法：node tools/member/make_admin.mjs <secret.json> <输出.html>');
  process.exit(1);
}
const { secretKey, publicKey } = JSON.parse(fs.readFileSync(secretFile, 'utf8'));
const keyTs = fs.readFileSync(path.join(root, 'src/member/key.ts'), 'utf8');
if (!keyTs.includes(`'${publicKey}'`)) {
  console.error('公钥和 src/member/key.ts 里的不一样，开出的码 APP 会核对不过。');
  process.exit(1);
}
const nacl = fs.readFileSync(path.join(root, 'node_modules/tweetnacl/nacl-fast.min.js'), 'utf8');
const tpl = fs.readFileSync(path.join(root, 'tools/member/admin-template.html'), 'utf8');
const html = tpl.replace('/*__TWEETNACL__*/', () => `/* TweetNaCl.js（公有领域，https://github.com/dchest/tweetnacl-js）*/\n${nacl}`).replace("'__SECRET_KEY__'", () => `'${secretKey}'`);
fs.writeFileSync(outFile, html, { mode: 0o600 });
console.log(`已生成 ${outFile}`);
