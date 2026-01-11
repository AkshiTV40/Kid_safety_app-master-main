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
};

function VideoThumbnail({ filename }: { filename: string }) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    const RPI_URL = process.env.NEXT_PUBLIC_RPI_URL || "http://localhost:8000";
    const url = `${RPI_URL}/videos/${encodeURIComponent(filename)}`;
    fetch(url)
      .then((res) => res.blob())
      .then((blob) => {
        const videoUrl = URL.createObjectURL(blob);
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
      });
  }, [filename]);

  if (!src) return <div className="w-30 h-20 bg-muted rounded" />;
  return <img src={src} className="w-30 h-20 object-cover rounded" alt="thumbnail" />;
}

export default function VideosPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const isMobile = useIsMobile();

  const load = async () => {
    const RPI_URL = process.env.NEXT_PUBLIC_RPI_URL || "http://localhost:8000";
    try {
      const res = await fetch(`${RPI_URL}/videos`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setVideos(data);
    } catch (e) {
      console.error("Failed to load videos", e);
    }
  };

  const recordVideo = async () => {
    const RPI_URL = process.env.NEXT_PUBLIC_RPI_URL || "http://localhost:8000";
    setIsRecording(true);
    try {
      const res = await fetch(`${RPI_URL}/record`, { method: 'POST' });
      if (!res.ok) throw new Error("Failed to start recording");
      alert("Recording started. It will record for 10 seconds.");
      setTimeout(() => {
        load();
        setIsRecording(false);
      }, 15000);
    } catch (e) {
      console.error("Failed to start recording", e);
      alert("Failed to start recording.");
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
                  <VideoThumbnail filename={v.filename} />
                  <div className="mt-2">
                    <div className="font-medium">{v.filename}</div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(v.timestamp * 1000).toLocaleString()} • {(v.size / 1024 / 1024).toFixed(2)} MB
                    </div>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Button size="sm" variant="outline" onClick={() => setPlayingVideo(v.filename)}>
                      Play
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        const RPI_URL = process.env.NEXT_PUBLIC_RPI_URL || "http://localhost:8000";
                        window.open(`${RPI_URL}/videos/${encodeURIComponent(v.filename)}`, "_blank");
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
            <video
              controls
              className="w-full"
              src={`${process.env.NEXT_PUBLIC_RPI_URL || "http://localhost:8000"}/videos/${encodeURIComponent(playingVideo)}`}
            >
              Your browser does not support the video tag.
            </video>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}