"use client";

import { useState } from 'react';
import { registerForPush } from '@/lib/fcm';

export default function NotificationConsent({ userId = 'parent-1' }: { userId?: string }){
  const [token, setToken] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  async function enable(){
    setStatus('requesting');
    try{
      const t = await registerForPush(userId);
      if(t){ setToken(t); setStatus('enabled'); localStorage.setItem('fcm_token', t); }
      else { setStatus('denied'); }
    }catch(e){ console.error(e); setStatus('error'); }
  }

  if (typeof window === 'undefined') return null;
  if (token) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className="bg-white p-3 rounded shadow-md">
        <div className="text-sm">Enable push notifications to receive critical alerts.</div>
        <div className="mt-2 flex gap-2">
          <button className="px-3 py-2 bg-blue-600 text-white rounded" onClick={enable}>Enable</button>
          <button className="px-3 py-2 bg-gray-200 rounded" onClick={()=>{localStorage.setItem('fcm_optout','true'); setStatus('optout');}}>No thanks</button>
        </div>
        {status && <div className="mt-2 text-xs text-gray-600">{status}</div>}
      </div>
    </div>
  );
}
