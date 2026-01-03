"use client";

import { useState } from 'react';
import { requestHelp } from '../../../lib/firebase';

export default function HelpPage(){
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<string | null>(null);

  async function send(){
    try{
      await requestHelp('child-1', { message });
      setStatus('Sent');
      setMessage('');
    }catch(e){
      setStatus('Error sending');
    }
  }

  return (
    <div>
      <h2 className="text-xl font-semibold">Help</h2>
      <p className="mt-2 text-sm text-gray-700">Send a help request for the selected child. Guardians will receive an alert (via FCM, if configured) and can view location on the Location tab.</p>
      <div className="mt-4 bg-white p-4 rounded shadow-sm">
        <textarea value={message} onChange={e=>setMessage(e.target.value)} className="w-full border p-2 rounded" placeholder="Message (optional)" />
        <div className="mt-3 flex gap-2">
          <button className="px-4 py-2 bg-red-600 text-white rounded" onClick={send}>Request Help</button>
          {status && <div className="text-sm text-gray-600">{status}</div>}
        </div>
      </div>
    </div>
  );
}
