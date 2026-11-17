/** 备份文件（网页版和单文件 HTML 版）：直接下载 .json 文件；导入时选择文件 */
import * as DocumentPicker from 'expo-document-picker';

export async function shareBackupFile(name: string, text: string): Promise<void> {
  const blob = new Blob([text], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

export async function pickBackupText(): Promise<string | null> {
  const r = await DocumentPicker.getDocumentAsync({ type: ['application/json', 'text/plain'], multiple: false });
  if (r.canceled || !r.assets?.[0]) return null;
  const a = r.assets[0];
  if (a.file) return a.file.text();
  return (await fetch(a.uri)).text();
}
