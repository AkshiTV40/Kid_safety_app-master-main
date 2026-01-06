"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Video, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ChildControls(){
  const [rpiLocation, setRpiLocation] = useState<{lat: number, lng: number, timestamp: number} | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchRpiLocation = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://192.168.86.20:8000/location');
      if (response.ok) {
        const data = await response.json();
        setRpiLocation(data);
        toast({
          title: 'RPi Location Fetched',
          description: `Lat: ${data.lat}, Lng: ${data.lng}`,
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Failed to fetch RPi location',
          description: 'RPi may not be available or GPS not working.',
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error fetching RPi location',
        description: 'Check network connection.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Button onClick={fetchRpiLocation} disabled={loading} className="w-full">
        <MapPin className="h-4 w-4 mr-2" />
        {loading ? 'Fetching RPi Location...' : 'View RPi Location'}
      </Button>
      {rpiLocation && (
        <div className="text-sm text-muted-foreground">
          RPi Location: {rpiLocation.lat.toFixed(5)}, {rpiLocation.lng.toFixed(5)}
          <br />
          Last updated: {new Date(rpiLocation.timestamp * 1000).toLocaleString()}
        </div>
      )}
      <Button asChild className="w-full">
        <Link href="/rpi-videos" className="flex items-center gap-2">
          <Video className="h-4 w-4" />
          View RPi Videos
        </Link>
      </Button>
    </div>
  );
}
