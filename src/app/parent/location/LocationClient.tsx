"use client";

import { useEffect, useState } from 'react';
import LeafletMap from '../../../components/leaflet-map';
import { listenToLocation } from '../../../lib/firebase';

export default function LocationClient(){
  const [childId, setChildId] = useState('child-1');
  const [loc, setLoc] = useState<{lat:number,lng:number,timestamp:number}|null>(null);

  useEffect(()=>{
    if(!childId) return;
    const unsub = listenToLocation(childId, (data)=>{
      setLoc(data);
    });
    return () => { if(typeof unsub === 'function') unsub(); };
  },[childId]);

  return (
    <div>
      <h2 className="text-xl font-semibold">Live Location</h2>
      <div className="mt-4">
        <label className="text-sm text-gray-600">Child ID</label>
        <input value={childId} onChange={e=>setChildId(e.target.value)} className="border p-2 rounded mt-1" />
      </div>

      <div className="mt-4">
        <LeafletMap center={loc ? [loc.lat, loc.lng] : [0,0]} zoom={loc ? 15 : 2} marker={loc} />
        {loc && <div className="mt-2 text-sm text-gray-600">Last updated: {new Date(loc.timestamp).toLocaleString()}</div>}
      </div>
    </div>
  );
}
