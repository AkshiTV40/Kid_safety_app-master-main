import { app, db } from './firebase';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { ref, set } from 'firebase/database';

// Register for push notifications (Web FCM). Call this from client when user accepts notifications.
export async function registerForPush(userId: string) {
  if (!('Notification' in window)) throw new Error('Notifications not supported');

  let permission = Notification.permission;
  if (permission !== 'granted') {
    permission = await Notification.requestPermission();
  }
  if (permission !== 'granted') return null;

  const messaging = getMessaging(app);
  const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || 'YOUR_VAPID_KEY';
  try {
    const token = await getToken(messaging, { vapidKey });
    if (token) {
      await set(ref(db, `fcm_tokens/${userId}/${token}`), true);
      return token;
    }
    return null;
  } catch (e) {
    console.error('FCM token fetch failed', e);
    return null;
  }
}

export function onForegroundMessage(cb: (payload: any) => void) {
  try {
    const messaging = getMessaging(app);
    return onMessage(messaging, (payload) => cb(payload));
  } catch (e) {
    console.warn('onForegroundMessage not available', e);
    return () => {};
  }
}
