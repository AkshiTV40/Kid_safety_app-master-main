"use client";

import ChildLocationTracker from '@/components/child-location-tracker';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Video } from 'lucide-react';

export default function ChildControls(){
  return (
    <div className="space-y-4">
      <ChildLocationTracker userId={'child-1'} />
      <Button asChild className="w-full">
        <Link href="/rpi-videos" className="flex items-center gap-2">
          <Video className="h-4 w-4" />
          View RPi Videos
        </Link>
      </Button>
    </div>
  );
}
