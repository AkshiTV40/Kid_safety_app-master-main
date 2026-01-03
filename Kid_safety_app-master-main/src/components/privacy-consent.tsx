"use client";

import { useEffect, useState } from "react";

export default function PrivacyConsent(){
  const [accepted, setAccepted] = useState(true);
  useEffect(()=>{
    const v = localStorage.getItem('privacy_consent');
    if(!v) setAccepted(false);
  },[]);

  if (accepted) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h3 className="text-lg font-semibold">Privacy & Location Consent</h3>
        <p className="mt-2 text-sm">This app will collect location while the app is open to provide live location sharing with parents. By continuing, you agree to our <a className="underline" href="/privacy">privacy policy</a>.</p>
        <div className="mt-4 flex justify-end gap-2">
          <button className="px-4 py-2 rounded bg-gray-200" onClick={()=>{localStorage.setItem('privacy_consent','dismissed'); setAccepted(true);}}>Dismiss</button>
          <button className="px-4 py-2 rounded bg-blue-600 text-white" onClick={()=>{localStorage.setItem('privacy_consent','accepted'); setAccepted(true);}}>Accept</button>
        </div>
      </div>
    </div>
  );
}
