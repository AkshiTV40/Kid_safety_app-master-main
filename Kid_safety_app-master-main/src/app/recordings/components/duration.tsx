'use client';

import { useEffect, useState } from 'react';
import { getRecording } from '@/lib/recordings';

export default function Duration({ id }: { id: string }) {
  const [dur, setDur] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const b = await getRecording(id);
      if (!b) return;
      const url = URL.createObjectURL(b);
      const v = document.createElement('video');
      v.src = url;
      v.addEventListener('loadedmetadata', () => {
        if (mounted) setDur(Math.round((v.duration || 0))); // seconds
        URL.revokeObjectURL(url);
      });
      v.addEventListener('error', () => { URL.revokeObjectURL(url); });
    })();
    return () => { mounted = false; };
  }, [id]);

  if (dur === null) return <span className="text-xs text-muted-foreground">—</span>;
  const mins = Math.floor(dur / 60);
  const secs = dur % 60;
  return <span className="text-xs text-muted-foreground">{mins}:{secs.toString().padStart(2,'0')}</span>;
}
