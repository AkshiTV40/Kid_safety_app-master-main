"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { ArrowLeft } from "lucide-react";

type Video = {
  filename: string;
  size: number;
  timestamp: number;
  isLocal?: boolean;
  id?: string;
};

function VideoThumbnail({ filename, isLocal, blob }: { filename: string; isLocal?: boolean; blob?: Blob }) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    const loadVideo = async () => {
      let videoBlob: Blob;
      if (isLocal && blob) {
        videoBlob = blob;
      } else {
        const RPI_URL = process.env.NEXT_PUBLIC_RPI_URL || "http://localhost:8000";
        const url = `${RPI_URL}/videos/${encodeURIComponent(filename)}`;
        const res = await fetch(url);
        if (!res.ok) return;
        videoBlob = await res.blob();
      }

      const videoUrl = URL.createObjectURL(videoBlob);
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
        URL.revokeObjectURL(videoUrl);
      });
      v.addEventListener('error', () => URL.revokeObjectURL(videoUrl));
    };

    loadVideo();
  }, [filename, isLocal, blob]);

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
  const isMobile = useIsMobile();

  const load = async () => {
    const allVideos: Video[] = [];

    // Load RPi videos
    const RPI_URL = process.env.NEXT_PUBLIC_RPI_URL || "http://localhost:8000";
    try {
      const res = await fetch(`${RPI_URL}/videos`);
      if (res.ok) {
        const data = await res.json();
        allVideos.push(...data.map((filename: string) => ({
          filename,
          size: 0, // RPi doesn't provide size in simple list
          timestamp: 0, // Would need to fetch individually
          isLocal: false
        })));
      }
    } catch (e) {
      console.error("Failed to load RPi videos", e);
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

  const recordVideo = async () => {
    const RPI_URL = process.env.NEXT_PUBLIC_RPI_URL || "http://localhost:8000";
    setIsRecording(true);
    try {
      // Try RPi first
      const res = await fetch(`${RPI_URL}/record`, { method: 'POST' });
      if (res.ok) {
        alert("Recording started on RPi. It will record for 10 seconds.");
        setTimeout(() => {
          load();
          setIsRecording(false);
        }, 15000);
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
      alert("Recording started locally for 10 seconds.");
      setTimeout(() => {
        recorder.stop();
      }, 10000);
    } catch (e) {
      console.error("Failed to start local recording", e);
      alert("Failed to start recording. Please check camera permissions.");
      setIsRecording(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

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
            <Button onClick={recordVideo} disabled={isRecording}>
              {isRecording ? "Recording..." : "Record Video"}
            </Button>
          )}
        </div>
      </div>

      {/* Floating Record Button on Mobile */}
      {isMobile && (
        <Button
          onClick={recordVideo}
          disabled={isRecording}
          className="fixed bottom-4 right-4 z-20 rounded-full w-14 h-14"
        >
          {isRecording ? "..." : "+"}
        </Button>
      )}

      {/* Video List */}
      <div className="pt-20 p-4">
        <div className="max-w-6xl mx-auto">
          {videos.length === 0 ? (
            <p className="text-muted-foreground">No videos yet.</p>
          ) : (
            <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-2 lg:grid-cols-3'}`}>
              {videos.map((v) => (
                <div key={v.filename} className="p-4 border rounded-md bg-card">
                  <VideoThumbnail filename={v.filename} isLocal={v.isLocal} />
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
                        } else {
                          const RPI_URL = process.env.NEXT_PUBLIC_RPI_URL || "http://localhost:8000";
                          window.open(`${RPI_URL}/videos/${encodeURIComponent(v.filename)}`, "_blank");
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