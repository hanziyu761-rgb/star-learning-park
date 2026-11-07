/**
 * 云端童声的本机缓存（V2.21）：随机出的题第一次联网合成后存到手机里，下次直接播放（不再花钱、没网也能听）。
 * 存在 APP 的缓存目录（系统清理空间时可能被删，删了会重新合成）。
 */
import { Directory, File, Paths } from 'expo-file-system';

const MAX_FILES = 3000;
let dir: Directory | null = null;
function ttsDir(): Directory {
  if (!dir) {
    dir = new Directory(Paths.cache, 'tts');
    if (!dir.exists) dir.create({ intermediates: true, idempotent: true });
  }
  return dir;
}

/** 已经缓存过的录音地址；没有返回 null */
export function cachedTts(id: string): string | null {
  try {
    const f = new File(ttsDir(), `${id}.mp3`);
    return f.exists && (f.size ?? 0) > 1000 ? f.uri : null;
  } catch {
    return null;
  }
}

/** 后台把云端录音存到手机里（失败就算了，下次再合成） */
export async function saveTts(id: string, url: string): Promise<void> {
  try {
    const d = ttsDir();
    if (d.list().length > MAX_FILES) {
      d.delete();
      dir = null;
    }
    const f = new File(ttsDir(), `${id}.mp3`);
    if (f.exists) return;
    await File.downloadFileAsync(url, f, { idempotent: true });
  } catch {
    // 忽略：存不下也不影响这次播放
  }
}
