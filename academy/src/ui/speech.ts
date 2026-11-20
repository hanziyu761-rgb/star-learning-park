// Read-aloud using the browser's built-in speech synthesis. No network, no
// recording. If the device has no Chinese voice, the button reports it.

export function canSpeak(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';
}

export function stopSpeaking(): void {
  if (canSpeak()) window.speechSynthesis.cancel();
}

export function speak(text: string, lang = 'zh-CN'): boolean {
  if (!canSpeak()) return false;
  const clean = text.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}➜≠]/gu, ' ').replace(/\s+/g, ' ').trim();
  if (!clean) return false;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(clean);
  u.lang = lang;
  u.rate = 0.9;
  const voice = window.speechSynthesis.getVoices().find((v) => v.lang.replace('_', '-').toLowerCase().startsWith(lang.toLowerCase()));
  if (voice) u.voice = voice;
  window.speechSynthesis.speak(u);
  return true;
}
