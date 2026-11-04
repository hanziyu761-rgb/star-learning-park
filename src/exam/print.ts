/**
 * 打印试卷：
 * - 安卓 / iOS：expo-print 调起系统打印（可选打印机，也可以“另存为 PDF”）。
 * - 网页、单文件 HTML 版：把试卷放进隐藏的 iframe，调用浏览器打印（同样可以存成 PDF）。
 */
import * as Print from 'expo-print';
import { Platform } from 'react-native';

declare global {
  // 供端到端测试读取最近一次打印的内容
  var __lastPrintHtml: string | undefined;
  var __printCount: number | undefined;
}

export async function printHtml(html: string): Promise<void> {
  globalThis.__lastPrintHtml = html;
  if (Platform.OS !== 'web') {
    await Print.printAsync({ html });
    return;
  }
  const doc = globalThis.document;
  if (!doc) return;
  const iframe = doc.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  Object.assign(iframe.style, { position: 'fixed', right: '0', bottom: '0', width: '0', height: '0', border: '0' });
  doc.body.appendChild(iframe);
  const w = iframe.contentWindow;
  if (!w) return;
  w.document.open();
  w.document.write(html);
  w.document.close();
  await new Promise((r) => setTimeout(r, 300));
  w.focus();
  globalThis.__printCount = (globalThis.__printCount ?? 0) + 1;
  w.print();
  setTimeout(() => iframe.remove(), 60_000);
}
