"use client";

import { useState } from 'react';
import { registerNativeFCM } from '@/lib/native-fcm';

export default function NativeFcmConsent({ userId = 'parent-1' }: { userId?: string }){
  const [status, setStatus] = useState<string | null>(null);
  async function enable(){
    setStatus('requesting');
    try{
      const token = await registerNativeFCM(userId);
      if(token){
        localStorage.setItem('native_fcm_token', token);
        setStatus('enabled');
      }else{
        setStatus('not_available');
      }
    }catch(e){ console.error(e); setStatus('error'); }
  }

  return (
    <div className="fixed bottom-6 left-6 z-50">
      <div className="bg-white p-3 rounded shadow-md">
        <div className="text-sm">Enable native push notifications for reliable alerts on Android/iOS.</div>
        <div className="mt-2 flex gap-2">
          <button className="px-3 py-2 bg-blue-600 text-white rounded" onClick={enable}>Enable Native</button>
        </div>
        {status && <div className="mt-2 text-xs text-gray-600">{status}</div>}
      </div>
    </div>
  );
}
