"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import LeafletMap from '../../components/leaflet-map';
import { useIsMobile } from '../../hooks/use-mobile';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '../../components/ui/sheet';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { reverseGeocode, formatAddress } from '../../lib/geocoding';

export default function LocationPage() {
  const [loc, setLoc] = useState<{lat:number,lng:number,timestamp:number}|null>(null);
  const [address, setAddress] = useState<string>('');
  const [error, setError] = useState<string|null>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    const fetchLocation = async () => {
      try {
        const response = await fetch('http://192.168.5.168:8000/location');
        if (!response.ok) throw new Error('Failed to fetch location');
        const data = await response.json();
        const newLoc = {
          lat: data.latitude,
          lng: data.longitude,
          timestamp: Date.now()
        };
        setLoc(newLoc);
        setError(null);

        // Fetch address
        const result = await reverseGeocode(newLoc.lat, newLoc.lng);
        setAddress(result ? formatAddress(result) : 'Address not found');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    };

    fetchLocation();
    const interval = setInterval(fetchLocation, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const openInMaps = () => {
    if (!loc) return;
    const url = `https://www.google.com/maps?q=${loc.lat},${loc.lng}`;
    window.open(url, '_blank');
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Top Bar */}
      <div className="flex items-center justify-between p-4 bg-white border-b">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <h1 className="text-xl font-semibold">Child Location</h1>
        </div>
      </div>

      {/* Map Container */}
      <div className="flex-1 relative">
        <LeafletMap
          center={loc ? [loc.lat, loc.lng] : [0, 0]}
          zoom={loc ? 15 : 2}
          marker={loc}
          style={{ height: '100%' }}
        />
        {error && (
          <div className="absolute top-4 left-4 bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded">
            Error: {error}
          </div>
        )}
      </div>

      {/* Bottom Sheet on Mobile */}
      {isMobile && loc && (
        <Sheet open={true}>
          <SheetContent side="bottom" className="h-auto">
            <SheetHeader>
              <SheetTitle>Location Details</SheetTitle>
              <SheetDescription>Current location information from RPi</SheetDescription>
            </SheetHeader>
            <Card>
              <CardHeader>
                <CardTitle>Location Details</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Latitude: {loc.lat.toFixed(6)}</p>
                <p>Longitude: {loc.lng.toFixed(6)}</p>
                <p>Address: {address}</p>
                <p>Last Updated: {new Date(loc.timestamp).toLocaleString()}</p>
                <Button onClick={openInMaps} className="mt-2">Open in Maps</Button>
              </CardContent>
            </Card>
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}