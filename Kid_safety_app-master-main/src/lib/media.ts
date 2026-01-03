export function getSupportedRecordingMime(): string | null {
  const candidates = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/mp4;codecs=h264',
    'video/webm',
  ];
  if (typeof (window as any).MediaRecorder === 'undefined') return null;
  for (const c of candidates) {
    try {
      if ((window as any).MediaRecorder.isTypeSupported && (window as any).MediaRecorder.isTypeSupported(c)) {
        return c;
      }
    } catch (e) {
      // ignore
    }
  }
  return null;
}
