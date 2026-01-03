"use client";

import { Capacitor } from '@capacitor/core';

import { db } from './firebase';
import { ref, set } from 'firebase/database';

export async function registerNativeFCM(userId?: string) {
  if (Capacitor.getPlatform() !== 'android' && Capacitor.getPlatform() !== 'ios') return null;
  try{
    // Import plugin dynamically (use eval-import to avoid static bundler resolution on web builds)
    const mod: any = await (eval("import('@capacitor-firebase/messaging')"));
    const FirebaseMessaging = mod.FirebaseMessaging || mod;
    // request permissions (iOS) and get a token
    try{ await FirebaseMessaging.requestPermissions(); }catch(e){}
    let token = null;
    try{ const t = await FirebaseMessaging.getToken(); token = t.token || t; }catch(e){ console.warn('getToken failed', e); }

    // store token in Realtime Database if userId provided
    if (token && userId) {
      try { await set(ref(db, `fcm_tokens/${userId}/${token}`), true); } catch(e){ console.warn('Failed to store native fcm token', e); }
    }

    // register a foreground listener
    try{ FirebaseMessaging.addListener && FirebaseMessaging.addListener('message', (m:any)=>{ console.log('native fcm message', m); }); }catch(e){}

    // token refresh
    try{ FirebaseMessaging.addListener && FirebaseMessaging.addListener('tokenRefresh', async (t:any)=>{
      const newToken = t.token || t;
      if (newToken && userId) {
        try { await set(ref(db, `fcm_tokens/${userId}/${newToken}`), true); } catch(e){}
      }
    }); }catch(e){}

    return token;
  }catch(e){
    console.warn('Native FCM plugin not available', e);
    return null;
  }
}
