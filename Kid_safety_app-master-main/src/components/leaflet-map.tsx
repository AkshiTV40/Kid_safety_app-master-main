"use client";

import { useEffect, useRef } from 'react';

export default function LeafletMap({ center = [0,0], zoom = 13, marker }: { center?: [number,number], zoom?: number, marker?: {lat:number,lng:number} | null }){
  const ref = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any | null>(null);
  useEffect(()=>{
    if (!ref.current) return;
    let L: any = null;
    (async () => {
      try{
        const mod = await import('leaflet');
        L = (mod as any).default || mod;
        // add leaflet css dynamically (avoid server-side css import)
        if (typeof document !== 'undefined'){
          const existing = document.querySelector('link[data-leaflet]');
          if (!existing){
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
            link.setAttribute('data-leaflet','true');
            document.head.appendChild(link);
          }
        }
      }catch(e){
        console.error('Failed to load leaflet on client', e);
        return;
      }

      if (!mapRef.current){
        mapRef.current = L.map(ref.current).setView(center as [number,number], zoom);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors'
        }).addTo(mapRef.current);
      }

      // remove previous marker layers
      mapRef.current!.eachLayer((layer: any) => {
        try { if ((layer as any)._icon) (mapRef.current as any).removeLayer(layer); } catch(e){}
      });
      if (marker && mapRef.current){
        const m = L.marker([marker.lat, marker.lng]).addTo(mapRef.current);
        mapRef.current.setView([marker.lat, marker.lng]);
      }
    })();
  }, [ref, marker]);

  return <div ref={ref} style={{height: '400px'}} className="rounded overflow-hidden" />;
}
