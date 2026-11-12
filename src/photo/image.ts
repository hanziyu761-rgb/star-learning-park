/**
 * 拍照错题（V4.1）：拍照或从相册选图，再压缩成长边不超过 1280 像素的 JPEG（base64）。
 * 照片只在手机内存里转一次，交给自家 AI 服务识别后就丢掉，不写进学习记录、不存到手机相册。
 */
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

export const MAX_SIDE = 1280;

export type PickResult = { ok: true; dataUrl: string } | { ok: false; reason: 'cancel' | 'denied' | 'error'; message?: string };

export async function pickPhoto(from: 'camera' | 'library', onPicked?: () => void): Promise<PickResult> {
  try {
    // 只有拍照要申请相机权限；从相册选用系统照片选择器，不需要读取存储权限（APP 也屏蔽了这个权限）
    if (from === 'camera' && !(await ImagePicker.requestCameraPermissionsAsync()).granted) return { ok: false, reason: 'denied' };
    // 不进系统的裁切页（V4.2）：裁切页的“完成”按钮不明显，家长容易点成返回，照片就丢了
    const opts: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], allowsEditing: false, quality: 1 };
    const res = from === 'camera' ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync(opts);
    if (res.canceled || !res.assets?.[0]) return { ok: false, reason: 'cancel' };
    onPicked?.(); // 已经拿到照片，接下来压缩（页面可以显示“正在处理”）
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
