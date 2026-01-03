import { describe, it, expect, beforeEach } from 'vitest';
import { saveRecording, listRecordings, getRecording, deleteRecording } from '@/lib/recordings';

const sampleBlob = new Blob(['hello'], { type: 'video/webm' });

describe('recordings indexeddb', () => {
  beforeEach(async () => {
    // nothing
  });

  it('saves and lists a recording', async () => {
    await saveRecording(sampleBlob);
    const list = await listRecordings();
    expect(list.length).toBeGreaterThan(0);
    const id = list[0].id;
    const got = await getRecording(id);
    expect(got).not.toBeNull();
    if (got) {
      const text = await got.text();
      expect(text).toBe('hello');
    }
    await deleteRecording(id);
    const after = await listRecordings();
    expect(after.find(r=>r.id===id)).toBeUndefined();
  });
});
