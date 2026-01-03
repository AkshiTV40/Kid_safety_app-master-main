import { describe, it, expect } from 'vitest';
import { getSupportedRecordingMime } from '@/lib/media';

describe('media util', () => {
  it('returns a supported mime type or null', () => {
    const t = getSupportedRecordingMime();
    expect(t === null || typeof t === 'string').toBe(true);
  });
});
