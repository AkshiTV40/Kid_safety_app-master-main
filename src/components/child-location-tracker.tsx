"use client";

import { useEffect, useRef, useState } from 'react';
import { sendLocation } from '../lib/firebase';

export default function ChildLocationTracker({ userId = 'child-1' }: { userId?: string }){
  const watchRef = useRef<number | null>(null);
  const [sharing, setSharing] = useState(false);
  const [last, setLast] = useState<{lat:number,lng:number,timestamp:number}|null>(null);

  useEffect(()=>{
    return ()=>{
      if (watchRef.current !== null && 'geolocation' in navigator){
        navigator.geolocation.clearWatch(watchRef.current);
      }
    };
  },[]);

  async function start(){
    if(!('geolocation' in navigator)) return alert('Geolocation not available');
    try{
      const id = navigator.geolocation.watchPosition(async (pos) => {
        const lat = pos.coords.latitude; const lng = pos.coords.longitude;
        setLast({lat,lng,timestamp: Date.now()});
        await sendLocation(userId, lat, lng);
      }, (err)=>{ console.error(err); }, { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 });
      watchRef.current = id;
      setSharing(true);
    }catch(e){ console.error(e); }
  }

  function stop(){
    if(watchRef.current !== null){ navigator.geolocation.clearWatch(watchRef.current); watchRef.current = null; }
    setSharing(false);
  }

  return (
    <div className="mt-4">
      <h3 className="font-semibold">Location Sharing (foreground)</h3>
      <div className="mt-2 flex gap-2">
        {!sharing ? <button className="px-3 py-2 bg-green-600 text-white rounded" onClick={start}>Start sharing</button> : <button className="px-3 py-2 bg-gray-200 rounded" onClick={stop}>Stop</button>}
        {last && <div className="text-sm text-gray-600">Last: {new Date(last.timestamp).toLocaleTimeString()}</div>}
      </div>
    </div>
  );
}
