import 'fake-indexeddb/auto';
import '@testing-library/jest-dom';

// JSDOM doesn't implement MediaRecorder - provide a minimal mock
class MockMediaRecorder {
  static isTypeSupported(_t: string) { return true; }
}
// @ts-ignore
globalThis.MediaRecorder = MockMediaRecorder as any;
