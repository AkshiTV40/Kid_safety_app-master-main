"use client";

import { useEffect, useState } from 'react';
import { listenToLocation } from '../../lib/firebase';
import LeafletMap from '../../components/leaflet-map';
import { useIsMobile } from '../../hooks/use-mobile';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '../../components/ui/sheet';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';

export default function LocationPage() {
  const [childId, setChildId] = useState('child-1');
  const [loc, setLoc] = useState<{lat:number,lng:number,timestamp:number}|null>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!childId) return;
    const unsub = listenToLocation(childId, (data) => {
      setLoc(data);
    });
    return () => { if (typeof unsub === 'function') unsub(); };
  }, [childId]);

  const openInMaps = () => {
    if (!loc) return;
    const url = `https://www.google.com/maps?q=${loc.lat},${loc.lng}`;
    window.open(url, '_blank');
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Top Bar */}
      <div className="flex items-center justify-between p-4 bg-white border-b">
        <h1 className="text-xl font-semibold">Child Location</h1>
        <Select value={childId} onValueChange={setChildId}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select child" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="child-1">Child 1</SelectItem>
            <SelectItem value="child-2">Child 2</SelectItem>
            <SelectItem value="child-3">Child 3</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Map Container */}
      <div className="flex-1 relative">
        <LeafletMap
          center={loc ? [loc.lat, loc.lng] : [0, 0]}
          zoom={loc ? 15 : 2}
          marker={loc}
          style={{ height: '100%' }}
        />
      </div>

      {/* Bottom Sheet on Mobile */}
      {isMobile && loc && (
        <Sheet open={true}>
          <SheetContent side="bottom" className="h-auto">
            <SheetHeader>
              <SheetTitle>Location Details</SheetTitle>
              <SheetDescription>Current location information</SheetDescription>
            </SheetHeader>
            <Card>
              <CardHeader>
                <CardTitle>Coordinates</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Latitude: {loc.lat}</p>
                <p>Longitude: {loc.lng}</p>
                <p>Timestamp: {new Date(loc.timestamp).toLocaleString()}</p>
                <Button onClick={openInMaps} className="mt-2">Open in Maps</Button>
              </CardContent>
            </Card>
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}