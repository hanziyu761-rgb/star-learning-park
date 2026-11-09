// Runs on an Android emulator (GitHub Actions) against the installed test APK.
// Checks the real Android WebView: first start, saving a child, Python in the
// background worker, a lesson page, outside websites blocked, and that the
// record is still there after the app is closed and opened again.
// Writes screenshots and result.json to the folder given as argv[2].
const fs = require('fs');
const path = require('path');
const { _android: android } = require('playwright');

const OUT = process.argv[2];
const PKG = 'cn.linheng.aiacademy';
const WORKER = fs.readdirSync(path.join(__dirname, '../../academy/dist-app/assets')).find((f) => f.startsWith('py.worker'));
const result = { steps: [], ok: false };
const step = (name, data) => { result.steps.push({ name, ...data }); console.log(name, JSON.stringify(data)); };

(async () => {
  const [device] = await android.devices();
  step('device', { model: device.model(), serial: device.serial() });
  const webviewVersion = String(await device.shell('dumpsys webviewupdate | grep -m1 "Current WebView package"'));
  step('webview', { info: webviewVersion.trim() });
  const shot = async (n) => fs.writeFileSync(path.join(OUT, n + '.png'), await device.screenshot());
  const open = async () => {
    await device.shell(`am start -W -n ${PKG}/.MainActivity`);
    const wv = await device.webView({ pkg: PKG }, { timeout: 60000 });
    const page = await wv.page();
    page.on('pageerror', (e) => step('pageerror', { message: String(e) }));
    return page;
  };

  let page = await open();
  await page.waitForSelector('text=开始学习', { timeout: 30000 });
  await page.waitForTimeout(1500);
  await shot('1-setup');
  await page.getByLabel('昵称').fill('小测试');
  await page.getByRole('button', { name: '5 年级' }).click();
  await page.getByRole('button', { name: /开始学习/ }).click();
  await page.waitForSelector('text=今日学习任务', { timeout: 20000 });
  await page.waitForTimeout(1000);
  await shot('2-home');
  step('home', { title: (await page.locator('h1').first().textContent()).trim() });

  const py = await page.evaluate((w) => new Promise((res) => {
    const t0 = performance.now();
    const worker = new Worker('/assets/' + w, { type: 'module' });
    const timer = setTimeout(() => res({ error: 'timeout 120s' }), 120000);
    worker.onerror = (e) => { clearTimeout(timer); res({ error: 'worker error: ' + (e.message || 'unknown') }); };
    worker.onmessage = (e) => { clearTimeout(timer); res({ ms: Math.round(performance.now() - t0), data: e.data }); worker.terminate(); };
    worker.postMessage({ id: 1, type: 'run', code: 'total = 0\nfor i in range(1, 11):\n    total = total + i\nprint("1到10的和是", total)', inputs: [] });
  }), WORKER);
  step('python', py);

  const outside = await page.evaluate(() => fetch('https://example.com/').then(() => 'reached').catch(() => 'blocked'));
  step('outside-website', { result: outside });

  await page.evaluate(() => { location.hash = '#/map/5'; });
  await page.waitForTimeout(1500);
  await shot('3-course-map');

  await device.shell(`am force-stop ${PKG}`);
  page = await open();
  await page.waitForSelector('text=今日学习任务', { timeout: 30000 });
  const again = (await page.locator('h1').first().textContent()).trim();
  step('after-restart', { title: again });
  await shot('4-after-restart');

  result.ok = py.data?.result?.stdout === '1到10的和是 55\n' && outside === 'blocked' && /小测试/.test(again);
  fs.writeFileSync(path.join(OUT, 'result.json'), JSON.stringify(result, null, 2));
  await device.close();
  process.exit(result.ok ? 0 : 1);
})().catch((e) => {
  result.error = String(e && e.stack || e);
  fs.writeFileSync(path.join(OUT, 'result.json'), JSON.stringify(result, null, 2));
  console.error(e);
  process.exit(1);
});
