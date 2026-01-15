"use client";

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Square, QrCode, Activity, Zap, MapPin, Camera } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function DevicePage() {
  const params = useParams();
  const deviceId = params.id as string;
  const [status, setStatus] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [device, setDevice] = useState<any>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const RPI_URL = device?.ip_address ? `http://${device.ip_address}:${device.port || 8000}` : null;

  useEffect(() => {
    const fetchDevice = async () => {
      if (!supabase) return;
      const { data, error } = await supabase
        .from('devices')
        .select('*')
        .eq('device_id', deviceId)
        .single();
      if (!error && data) {
        setDevice(data);
      }
    };

    fetchDevice();
  }, [deviceId, supabase]);

  useEffect(() => {
    if (!RPI_URL) return;

    const fetchStatus = async () => {
      try {
        const res = await fetch(`${RPI_URL}/status`);
        const data = await res.json();
        setStatus(data);
      } catch (err) {
        console.error('Failed to fetch status:', err);
      }
    };

    fetchStatus();

    const interval = setInterval(() => {
      fetchStatus();
    }, 5000);

    return () => clearInterval(interval);
  }, [RPI_URL]);

  const startStream = () => {
    if (videoRef.current && RPI_URL) {
      videoRef.current.src = `${RPI_URL}/camera`;
    }
  };

  const handleRecord = async () => {
    try {
      const res = await fetch(`${RPI_URL}/record`, { method: 'POST' });
      const data = await res.json();
      setIsRecording(true);
      setTimeout(() => setIsRecording(false), 120000);
    } catch (err) {
      console.error('Record error:', err);
    }
  };

  const sendCommand = async (action: string) => {
    try {
      const res = await fetch(`${RPI_URL}/command/${action}`, { method: 'POST' });
      const data = await res.json();
      console.log(`${action} command sent:`, data);
    } catch (err) {
      console.error(`Command ${action} error:`, err);
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Device: {deviceId}</h1>
        <Badge variant={status?.online ? "default" : "destructive"}>
          {status?.online ? "Online" : "Offline"}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              Live Stream
            </CardTitle>
          </CardHeader>
          <CardContent>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-64 bg-black rounded"
            />
            <div className="flex flex-wrap gap-2 mt-4">
              <Button onClick={startStream}>
                Start Live Stream
              </Button>
              <Button onClick={handleRecord} variant="outline">
                {isRecording ? <Square className="h-4 w-4 mr-2" /> : <Camera className="h-4 w-4 mr-2" />}
                Record (120s)
              </Button>
              <Button onClick={() => sendCommand('flash')} variant="outline">
                <Zap className="h-4 w-4 mr-2" />
                Flash LED
              </Button>
              <Button onClick={() => sendCommand('locate')} variant="outline">
                <MapPin className="h-4 w-4 mr-2" />
                Update Location
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              AI Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {events.slice(-10).reverse().map((event, i) => (
                <div key={i} className="flex justify-between items-center p-2 bg-secondary rounded">
                  <span>{event.reason}</span>
                  <span className="text-sm text-muted-foreground">
                    {new Date(event.timestamp * 1000).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Device QR Code
          </CardTitle>
        </CardHeader>
        <CardContent>
          <img
            src={`${RPI_URL}/qr`}
            alt="Device QR Code"
            className="w-32 h-32"
          />
        </CardContent>
      </Card>
    </div>
  );
}