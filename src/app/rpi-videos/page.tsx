"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

type Video = {
  filename: string;
  size: number;
  timestamp: number;
};

export default function RPiVideosPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  const load = async () => {
    const RPI_URL =
      process.env.NEXT_PUBLIC_RPI_URL || "http://localhost:8000";

    try {
      const res = await fetch(`${RPI_URL}/videos`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setVideos(data);
    } catch (e) {
      console.error("Failed to load RPi videos", e);
    }
  };

  const recordVideo = async () => {
    const RPI_URL = process.env.NEXT_PUBLIC_RPI_URL || "http://localhost:8000";
    setIsRecording(true);
    try {
      const res = await fetch(`${RPI_URL}/help`, { method: 'POST' });
      if (!res.ok) throw new Error("Failed to start recording");
      alert("Recording started on RPi. It will record for 30 seconds.");
      // Reload videos after a delay to show the new recording
      setTimeout(() => {
        load();
        setIsRecording(false);
      }, 35000); // 30 seconds recording + some buffer
    } catch (e) {
      console.error("Failed to start recording", e);
      alert("Failed to start recording. Make sure RPi is running.");
      setIsRecording(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">RPi Videos</h1>
        </div>
        <Button onClick={recordVideo} disabled={isRecording}>
          {isRecording ? "Recording..." : "Record Video"}
        </Button>
      </div>

      {playingVideo && (
        <div className="mb-6 p-4 border rounded-md bg-secondary/50">
          <h2 className="text-lg font-semibold mb-2">Playing: {playingVideo}</h2>
          <video
            controls
            className="w-full max-w-2xl"
            src={`${process.env.NEXT_PUBLIC_RPI_URL || "http://localhost:8000"}/videos/${encodeURIComponent(playingVideo)}`}
          >
            Your browser does not support the video tag.
          </video>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPlayingVideo(null)}
            className="mt-2"
          >
            Close Player
          </Button>
        </div>
      )}

      {videos.length === 0 ? (
        <p className="text-muted-foreground">No videos from RPi yet.</p>
      ) : (
        <div className="space-y-4">
          {videos.map((v) => (
            <div key={v.filename} className="p-4 border rounded-md">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{v.filename}</div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(v.timestamp * 1000).toLocaleString()} •{" "}
                    {(v.size / 1024 / 1024).toFixed(2)} MB
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPlayingVideo(v.filename)}
                  >
                    Play
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      const RPI_URL =
                        process.env.NEXT_PUBLIC_RPI_URL ||
                        "http://localhost:8000";
                      window.open(
                        `${RPI_URL}/videos/${encodeURIComponent(v.filename)}`,
                        "_blank"
                      );
                    }}
                  >
                    Download
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
