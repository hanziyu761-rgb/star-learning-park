/** 网页版、单文件 HTML 版：不存文件，只在这次打开期间记住云端录音地址（地址 24 小时内有效） */
const mem = new Map<string, string>();
export function cachedTts(id: string): string | null {
  return mem.get(id) ?? null;
}
export async function saveTts(id: string, url: string): Promise<void> {
  mem.set(id, url);
}
