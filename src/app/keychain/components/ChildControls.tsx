"use client";

import ChildLocationTracker from '@/components/child-location-tracker';
import { Button } from '@/components/ui/button';

export default function ChildControls(){
  return (
    <div className="space-y-4">
      <ChildLocationTracker userId={'child-1'} />
      <div className="flex gap-2">
        <Button asChild>
          <a href="tel:1111111111">Call Guard</a>
        </Button>
        <Button asChild>
          <a href="sms:1111111111">Message Guard</a>
        </Button>
      </div>
    </div>
  );
}
