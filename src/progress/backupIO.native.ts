/** 备份文件（手机）：写到缓存目录后用系统分享（可以发到微信、存到文件、网盘）；导入时用系统文件选择 */
import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export async function shareBackupFile(name: string, text: string): Promise<void> {
  const f = new File(Paths.cache, name);
  if (f.exists) f.delete();
  f.create();
  await f.write(text);
  if (!(await Sharing.isAvailableAsync())) throw new Error('这台手机不支持分享文件');
  await Sharing.shareAsync(f.uri, { mimeType: 'application/json', dialogTitle: '保存学习记录备份', UTI: 'public.json' });
}

/** 选一个文件，返回文字；取消返回 null */
export async function pickBackupText(): Promise<string | null> {
  const r = await DocumentPicker.getDocumentAsync({ type: ['application/json', 'text/plain', '*/*'], copyToCacheDirectory: true, multiple: false });
  if (r.canceled || !r.assets?.[0]) return null;
  return new File(r.assets[0].uri).text();
}
