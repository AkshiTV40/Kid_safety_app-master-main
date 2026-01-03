'use client';

import { useEffect, useState } from 'react';
import { getRecording } from '@/lib/recordings';

export default function Thumbnail({ id }: { id: string }) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const b = await getRecording(id);
      if (!b) return;
      // create a short in-memory video element, seek, draw to canvas to get a frame
      const url = URL.createObjectURL(b);
      const v = document.createElement('video');
      v.src = url;
      v.muted = true;
      v.playsInline = true;
      v.currentTime = 0.5;
      v.addEventListener('loadeddata', () => {
        const c = document.createElement('canvas');
        c.width = Math.min(240, v.videoWidth || 240);
        c.height = Math.min(160, v.videoHeight || 160);
        const ctx = c.getContext('2d');
        if (ctx) ctx.drawImage(v, 0, 0, c.width, c.height);
        const data = c.toDataURL('image/jpeg', 0.6);
        if (mounted) setSrc(data);
        URL.revokeObjectURL(url);
      });
      v.addEventListener('error', () => { URL.revokeObjectURL(url); });
    })();
    return () => { mounted = false; };
  }, [id]);

  if (!src) return <div className="w-24 h-16 bg-muted rounded" />;
  return <img src={src} className="w-24 h-16 object-cover rounded" alt="thumbnail" />;
}
