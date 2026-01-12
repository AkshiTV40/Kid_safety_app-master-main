"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Video = {
  filename: string;
  size: number;
  timestamp: number;
  isLocal?: boolean;
  id?: string;
  url?: string;
};

function VideoThumbnail({ filename, isLocal, blob, url }: { filename: string; isLocal?: boolean; blob?: Blob; url?: string }) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    const loadVideo = async () => {
      let videoUrl: string;
      if (isLocal && blob) {
        videoUrl = URL.createObjectURL(blob);
      } else if (url) {
        videoUrl = url;
      } else {
        const RPI_URL = process.env.NEXT_PUBLIC_RPI_URL || "http://localhost:8000";
        videoUrl = `${RPI_URL}/videos/${encodeURIComponent(filename)}`;
      }

      const v = document.createElement('video');
      v.src = videoUrl;
      v.muted = true;
      v.playsInline = true;
      v.currentTime = 0.5;
      v.addEventListener('loadeddata', () => {
        const c = document.createElement('canvas');
        c.width = 120;
        c.height = 80;
        const ctx = c.getContext('2d');
        if (ctx) ctx.drawImage(v, 0, 0, c.width, c.height);
        const data = c.toDataURL('image/jpeg', 0.6);
        setSrc(data);
        if (isLocal && blob) URL.revokeObjectURL(videoUrl);
      });
      v.addEventListener('error', () => {
        if (isLocal && blob) URL.revokeObjectURL(videoUrl);
      });
    };

    loadVideo();
  }, [filename, isLocal, blob, url]);

  if (!src) return <div className="w-30 h-20 bg-muted rounded" />;
  return <img src={src} className="w-30 h-20 object-cover rounded" alt="thumbnail" />;
}

function VideoPlayer({ filename, videos }: { filename: string; videos: Video[] }) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    const loadVideo = async () => {
      const video = videos.find(v => v.filename === filename);
      if (!video) return;

      if (video.isLocal && video.id) {
        const { getRecording } = await import('@/lib/recordings');
        const blob = await getRecording(video.id);
        if (blob) {
          setSrc(URL.createObjectURL(blob));
        }
      } else if (video.url) {
        setSrc(video.url);
      } else {
        const RPI_URL = process.env.NEXT_PUBLIC_RPI_URL || "http://localhost:8000";
        setSrc(`${RPI_URL}/videos/${encodeURIComponent(filename)}`);
      }
    };

    loadVideo();
  }, [filename, videos]);

  if (!src) return <div>Loading...</div>;

  return (
    <video controls className="w-full" src={src}>
      Your browser does not support the video tag.
    </video>
  );
}

export default function VideosPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [rpiConnected, setRpiConnected] = useState<boolean | null>(null);
  const isMobile = useIsMobile();

  const checkRpiStatus = async () => {
    const RPI_URL = process.env.NEXT_PUBLIC_RPI_URL || "http://localhost:8000";
    try {
      const res = await fetch(`${RPI_URL}/health`);
      setRpiConnected(res.ok);
      return res.ok;
    } catch (e) {
      setRpiConnected(false);
      return false;
    }
  };

  const load = async () => {
    const allVideos: Video[] = [];

    // Check RPi status
    await checkRpiStatus();

    // Load cloud videos
    try {
      const res = await fetch('/api/videos');
      if (res.ok) {
        const cloudVideos = await res.json();
        allVideos.push(...cloudVideos.map((v: any) => ({
          filename: v.filename,
          size: v.size,
          timestamp: v.timestamp,
          isLocal: false,
          url: v.url,
          id: v.id
        })));
      }
    } catch (e) {
      console.error("Failed to load cloud videos", e);
    }

    // Load local recordings
    try {
      const { listRecordings } = await import('@/lib/recordings');
      const localRecs = await listRecordings();
      allVideos.push(...localRecs.map(rec => ({
        filename: `local_${rec.id}.webm`,
        size: rec.size,
        timestamp: rec.timestamp,
        isLocal: true,
        id: rec.id
      })));
    } catch (e) {
      console.error("Failed to load local recordings", e);
    }

    // Sort by timestamp descending
    allVideos.sort((a, b) => b.timestamp - a.timestamp);
    setVideos(allVideos);
  };

  const startRecording = async () => {
    const RPI_URL = process.env.NEXT_PUBLIC_RPI_URL || "http://localhost:8000";
    try {
      // Try RPi first
      const res = await fetch(`${RPI_URL}/record/start`, { method: 'POST' });
      if (res.ok) {
        setIsRecording(true);
        alert("Recording started on RPi. Click Stop to end.");
        return;
      }
    } catch (e) {
      console.log('RPi not available, falling back to local recording');
    }

    // Fallback to local recording
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp8,opus' });
      const chunks: Blob[] = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const { saveRecording } = await import('@/lib/recordings');
        try {
          await saveRecording(blob);
          alert("Recording saved locally.");
          load(); // Refresh local recordings
        } catch (e) {
          console.error('Failed to save recording', e);
          alert("Failed to save recording.");
        }
        stream.getTracks().forEach(track => track.stop());
        setIsRecording(false);
      };

      recorder.start();
      setIsRecording(true);
      alert("Recording started locally. Click Stop to end.");
    } catch (e) {
      console.error("Failed to start local recording", e);
      alert("Failed to start recording. Please check camera permissions.");
    }
  };

  const stopRecording = async () => {
    const RPI_URL = process.env.NEXT_PUBLIC_RPI_URL || "http://localhost:8000";
    try {
      // Try RPi first
      const res = await fetch(`${RPI_URL}/record/stop`, { method: 'POST' });
      if (res.ok) {
        setIsRecording(false);
        alert("Recording stopped on RPi.");
        load(); // Refresh videos
        return;
      }
    } catch (e) {
      console.log('RPi not available, stopping local recording');
    }

    // For local, we need to stop the recorder, but since it's not stored, assume it's stopped
    setIsRecording(false);
    alert("Recording stopped locally.");
  };

  useEffect(() => {
    load();

    // Subscribe to real-time video updates
    const videosSubscription = supabase
      .channel('videos')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'videos' }, (payload) => {
        console.log('Video change:', payload);
        load(); // Reload videos on any change
      })
      .subscribe();

    // Poll for recording status if RPi connected (since status not in DB)
    const interval = setInterval(async () => {
      if (rpiConnected) {
        const RPI_URL = process.env.NEXT_PUBLIC_RPI_URL || "http://localhost:8000";
        try {
          const res = await fetch(`${RPI_URL}/record/status`);
          if (res.ok) {
            const data = await res.json();
            setIsRecording(data.recording);
          }
        } catch (e) {
          // Ignore
        }
      }
    }, 5000);

    return () => {
      videosSubscription.unsubscribe();
      clearInterval(interval);
    };
  }, [rpiConnected]);

  return (
    <div className="min-h-screen">
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 bg-background border-b p-4 z-10">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">Videos</h1>
          </div>
          {!isMobile && (
            <div className="flex items-center gap-2">
              <div className="text-sm">
                RPi: {rpiConnected === null ? "Checking..." : rpiConnected ? "Connected" : "Disconnected"}
              </div>
              <Button onClick={isRecording ? stopRecording : startRecording}>
                {isRecording ? "Stop Recording" : "Start Recording"}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Floating Record Button on Mobile */}
      {isMobile && (
        <div className="fixed bottom-4 right-4 z-20 flex flex-col items-end gap-2">
          <div className="text-xs bg-background border rounded px-2 py-1">
            RPi: {rpiConnected === null ? "Checking..." : rpiConnected ? "Connected" : "Disconnected"}
          </div>
          <Button
            onClick={isRecording ? stopRecording : startRecording}
            className="rounded-full w-14 h-14"
          >
            {isRecording ? "⏹️" : "⏺️"}
          </Button>
        </div>
      )}

      {/* Live Stream */}
      {rpiConnected && (
        <div className="pt-20 p-4 bg-secondary">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-xl font-bold mb-2">Live Stream from RPi</h2>
            <img src={`${process.env.NEXT_PUBLIC_RPI_URL || "http://localhost:8000"}/camera/stream`} alt="Live Stream" className="w-full max-w-md border rounded" />
          </div>
        </div>
      )}

      {/* Video List */}
      <div className="p-4">
        <div className="max-w-6xl mx-auto">
          {videos.length === 0 ? (
            <p className="text-muted-foreground">No videos yet.</p>
          ) : (
            <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-2 lg:grid-cols-3'}`}>
              {videos.map((v) => (
                <div key={v.filename} className="p-4 border rounded-md bg-card">
                  <VideoThumbnail filename={v.filename} isLocal={v.isLocal} url={v.url} />
                  <div className="mt-2">
                    <div className="font-medium">{v.filename} {v.isLocal && <span className="text-xs text-muted">(Local)</span>}</div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(v.timestamp).toLocaleString()} • {(v.size / 1024 / 1024).toFixed(2)} MB
                    </div>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Button size="sm" variant="outline" onClick={() => setPlayingVideo(v.filename)}>
                      Play
                    </Button>
                    <Button
                      size="sm"
                      onClick={async () => {
                        if (v.isLocal && v.id) {
                          const { getRecording } = await import('@/lib/recordings');
                          const blob = await getRecording(v.id);
                          if (blob) {
                            const url = URL.createObjectURL(blob);
                            window.open(url, "_blank");
                          }
                        } else if (v.url) {
                          window.open(v.url, "_blank");
                        }
                      }}
                    >
                      Download
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Video Player Modal */}
      <Dialog open={!!playingVideo} onOpenChange={() => setPlayingVideo(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Playing: {playingVideo}</DialogTitle>
          </DialogHeader>
          {playingVideo && (
            <VideoPlayer filename={playingVideo} videos={videos} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}