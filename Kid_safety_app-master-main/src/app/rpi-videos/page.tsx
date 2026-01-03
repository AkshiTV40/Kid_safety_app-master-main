"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type Video = {
  filename: string;
  size: number;
  timestamp: number;
};

export default function RPiVideosPage() {
  const [videos, setVideos] = useState<Video[]>([]);

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

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">RPi Videos</h1>

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
          ))}
        </div>
      )}
    </div>
  );
}
