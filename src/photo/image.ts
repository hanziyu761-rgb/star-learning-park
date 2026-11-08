/**
 * 拍照错题（V4.1）：拍照或从相册选图，再压缩成长边不超过 1280 像素的 JPEG（base64）。
 * 照片只在手机内存里转一次，交给自家 AI 服务识别后就丢掉，不写进学习记录、不存到手机相册。
 */
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

export const MAX_SIDE = 1280;

export type PickResult = { ok: true; dataUrl: string } | { ok: false; reason: 'cancel' | 'denied' | 'error'; message?: string };

export async function pickPhoto(from: 'camera' | 'library'): Promise<PickResult> {
  try {
    const perm =
      from === 'camera' ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return { ok: false, reason: 'denied' };
    const opts: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], allowsEditing: true, quality: 1 };
    const res = from === 'camera' ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync(opts);
    if (res.canceled || !res.assets?.[0]) return { ok: false, reason: 'cancel' };
    const a = res.assets[0];
    const long = Math.max(a.width || 0, a.height || 0);
    const resize = long > MAX_SIDE ? (a.width >= a.height ? { width: MAX_SIDE } : { height: MAX_SIDE }) : null;
    const out = await ImageManipulator.manipulateAsync(a.uri, resize ? [{ resize }] : [], {
      compress: 0.7,
      format: ImageManipulator.SaveFormat.JPEG,
      base64: true,
    });
    if (!out.base64) return { ok: false, reason: 'error', message: '照片压缩失败' };
    return { ok: true, dataUrl: `data:image/jpeg;base64,${out.base64}` };
  } catch (e) {
    return { ok: false, reason: 'error', message: e instanceof Error ? e.message : String(e) };
  }
}
